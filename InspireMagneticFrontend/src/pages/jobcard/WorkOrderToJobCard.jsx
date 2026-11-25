import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import Loader from "../../components/Loader";
import { fetchJobCardsByWorkOrder } from "../../services/jobCardService";
import { formatDate } from "../../utils/dateUtils";

import RightDrawer from "../../components/RightDrawer";
import SaveOrUpdateJobCard from "./SaveOrUpdateJobCard";
import { ConfirmDialog } from "../../components/Notification";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { hasPermission, menuPermissions } from "../../permissions/permissionUtils";

const transformRecord = (item) => {
    return {
        ...item,
        job_card_date_formatted: formatDate(item.job_card_date) || item.job_card_date,
    };
};

// Table column definitions — no sorting, no global search, no pagination, no DisplayAll
const jobCardColumns = [
    { key: "actions", label: "Actions", sortable: false, width: "0%", minWidth: "100px" },
    {
        key: "job_card_no",
        label: "Job Card No",
        sortable: false,
        style: { textAlign: "center" },
        width: "8%",
        minWidth: "100px",
    },
    {
        key: "work_order_no",
        label: "WO No",
        sortable: false,
        style: { textAlign: "center" },
        width: "8%",
        minWidth: "100px",
    },
    {
        key: "job_card_date_formatted",
        label: "Job Card Date",
        sortable: false,
        width: "10%",
        minWidth: "120px",
        style: { textAlign: "center" },
    },
    {
        key: "item_code",
        label: "Product",
        sortable: false,
        width: "12%",
        minWidth: "140px",
        style: { textAlign: "center" },
    },
    {
        key: "item_description",
        label: "Description",
        sortable: false,
        width: "15%",
        minWidth: "180px",
        style: { textAlign: "left" },
    },
    {
        key: "operation_id_text",
        label: "Operation",
        sortable: false,
        width: "10%",
        minWidth: "120px",
        style: { textAlign: "center" },
    },
    {
        key: "operation_status_text",
        label: "Status",
        sortable: false,
        width: "10%",
        minWidth: "120px",
        style: { textAlign: "center" },
        render: (row) => {
            const status = row.operation_status_text || "Pending";
            const isPending = status.toLowerCase() === "pending";
            return (
                <span
                    style={{
                        color: isPending ? "#ef4444" : "#22c55e",
                        background: isPending ? "#fef2f2" : "#dcfce7",
                        borderRadius: 12,
                        padding: "2px 12px",
                        fontWeight: 600,
                        fontSize: 12,
                        display: "inline-block",
                        border: "none",
                    }}
                >
                    {status}
                </span>
            );
        },
    },
    {
        key: "responsible_person_name",
        label: "Responsible Person",
        sortable: false,
        width: "15%",
        minWidth: "160px",
        style: { textAlign: "center" },
    },
    {
        key: "item_unit",
        label: "Unit",
        sortable: false,
        width: "8%",
        minWidth: "100px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_planned",
        label: "Qty Planned",
        sortable: false,
        width: "8%",
        minWidth: "110px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_input",
        label: "Qty Input",
        sortable: false,
        width: "8%",
        minWidth: "110px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_output",
        label: "Qty Output",
        sortable: false,
        width: "8%",
        minWidth: "110px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_scrapped",
        label: "Qty Scrapped",
        sortable: false,
        width: "8%",
        minWidth: "110px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_copper_scrapped",
        label: "Qty Copper Scrapped",
        sortable: false,
        width: "8%",
        minWidth: "130px",
        style: { textAlign: "center" },
    },
];

export default function WorkOrderToJobCard({ workOrderID, workOrderNo }) {
    const { id: paramId } = useParams();
    const location = useLocation();

    // Extract ID from pathname as fallback (for virtual tabs restored via TabManager)
    const pathParts = location.pathname.split('/');
    const pathId = pathParts[1] === 'wo-jobcards' && pathParts[2] ? pathParts[2] : null;

    // Resolve workOrderID: prefer prop, fallback to param, fallback to path parsing
    const resolvedWorkOrderID = workOrderID || paramId || pathId;

    const [loading, setLoading] = useState(false);
    const tableRef = useRef();
    const [jobCardData, setJobCardData] = useState([]);
    const savedItemRef = useRef(null);

    const viewFormRef = useRef();
    const [viewRow, setViewRow] = useState(null);
    const [editMode, setEditMode] = useState(false);

    const {
        isDirty: viewIsDirty,
        setIsDirty: setViewIsDirty,
        checkUnsavedChanges: checkEditUnsavedChanges,
        resetDirty: resetEditDirty,
        dirtyConfirmDialog: editDirtyDialog,
    } = useUnsavedChanges({});


    const getActions = (row) => {
        if (!hasPermission(menuPermissions.JOB_CARD)) return [];

        return [
            {
                label: "View",
                title: "View Job Card Details",
                icon: (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                ),
                onClick: async () => {
                    const proceedToView = async (nextRow) => {
                        setViewRow(nextRow);
                        setEditMode(false);
                        resetEditDirty();
                    };

                    if (viewRow && viewIsDirty) {
                        const canProceed = await checkEditUnsavedChanges(async (nextRow) => {
                            await proceedToView(nextRow);
                        }, row);
                        if (!canProceed) return;
                    }

                    await proceedToView(row);
                },
            }
        ];
    };

    const fetchJobCards = useCallback(async () => {
        if (!resolvedWorkOrderID) return;
        setLoading(true);
        try {
            const payload = { workOrderID: Number(resolvedWorkOrderID) };
            const res = await fetchJobCardsByWorkOrder(payload);

            if (res && res.Status === "Success") {
                const list = res?.data?.JOB_CARD_LIST_BY_WORK_ORDER_DETAILS_RESPONSE || [];
                setJobCardData(list.map(transformRecord));
            } else {
                setJobCardData([]);
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching job cards for work order:", err);
            setJobCardData([]);
            setLoading(false);
        }
    }, [resolvedWorkOrderID]);

    useEffect(() => {
        fetchJobCards();
    }, [fetchJobCards]);

    const handleRefresh = useCallback(() => {
        fetchJobCards();
    }, [fetchJobCards]);

    const refreshCurrentPage = handleRefresh;

    // ─── Highlight saved row after data refresh ───────────────────────────
    useEffect(() => {
        if (savedItemRef.current && jobCardData.length > 0) {
            const savedId = savedItemRef.current;
            const savedIndex = jobCardData.findIndex((item) => {
                return (
                    savedId === item.job_card_id ||
                    String(savedId) === String(item.job_card_id) ||
                    Number(savedId) === Number(item.job_card_id)
                );
            });

            if (savedIndex >= 0) {
                setTimeout(() => {
                    if (tableRef.current && typeof tableRef.current.selectRowByIndex === 'function') {
                        tableRef.current.selectRowByIndex(savedIndex);
                    }
                    savedItemRef.current = null;
                }, 200);
            } else {
                savedItemRef.current = null;
            }
        }
    }, [jobCardData]);

    return (
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
            {loading && <Loader />}

            <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
                <div style={{ height: "100%" }}>
                    <DynamicSortableTable
                        ref={tableRef}
                        columns={jobCardColumns}
                        data={jobCardData}
                        fixedFirstColumn={true}
                        headerMinHeight={55.5}
                        title={`Job Cards for WO Number - ${workOrderNo || ""}`}
                        icon={
                            <svg
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
                            </svg>
                        }
                        onRefresh={handleRefresh}
                        getActions={getActions}
                        disableSearch={true}
                        disablePagination={true}
                        showGlobalSearch={false}
                        showDisplayAll={false}
                        autoSelectFirstRow={true}
                        totalRecords={0}
                    />

                    {/* View/Edit Job Card Drawer */}
                    <RightDrawer
                        open={!!viewRow}
                        onClose={async () => {
                            const ok = await checkEditUnsavedChanges();
                            if (ok) {
                                setViewRow(null);
                                setEditMode(false);
                                resetEditDirty();
                            }
                        }}
                        title="View Job card"
                        width="70%"
                        showEdit={!editMode && hasPermission(menuPermissions.JOB_CARD_EDIT)}
                        onEdit={() => setEditMode(true)}
                        onSave={editMode ? async () => {
                            if (viewFormRef.current) {
                                viewFormRef.current.submit();
                            }
                        } : undefined}
                        disableEdit={editMode}
                        onDisableEdit={() => {
                            setEditMode(false);
                        }}
                        isDirty={viewIsDirty}
                        enableCloseConfirm={true}
                        closeConfirmScope="edit"
                        closeConfirmTitle="Unsaved Changes"
                        closeConfirmMessage="You have unsaved changes. Are you sure you want to close?"
                        disableTabCloseConfirm={!!viewRow && !editMode && !viewIsDirty}
                        tabKey={`workorder-jobcards-${resolvedWorkOrderID}`}
                        alwaysExpanded={false}
                    >
                        <SaveOrUpdateJobCard
                            ref={viewFormRef}
                            initialData={viewRow}
                            editMode={editMode}
                            onDirtyChange={setViewIsDirty}
                            onSuccess={(savedJobCardId) => {
                                if (savedJobCardId) {
                                    savedItemRef.current = savedJobCardId;
                                } else if (viewRow) {
                                    savedItemRef.current = viewRow.job_card_id;
                                }
                                refreshCurrentPage();
                                setViewRow(null);
                                setEditMode(false);
                                resetEditDirty();
                            }}
                            onDiscardDraft={() => {
                                resetEditDirty();
                            }}
                            onClose={async () => {
                                const ok = await checkEditUnsavedChanges();
                                if (ok) {
                                    setViewRow(null);
                                    setEditMode(false);
                                    resetEditDirty();
                                }
                            }}
                        />
                    </RightDrawer>

                    <ConfirmDialog
                        {...editDirtyDialog}
                        confirmLabel="Yes"
                        cancelLabel="No"
                        title="Unsaved Changes"
                    />
                </div>
            </main>
        </div>
    );
}
