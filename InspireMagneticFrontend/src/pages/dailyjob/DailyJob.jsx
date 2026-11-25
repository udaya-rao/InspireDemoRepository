import React, { useState, useEffect, useRef, useCallback } from "react";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import RightDrawer from "../../components/RightDrawer";
import SaveOrUpdateDailyJob from "./SaveOrUpdateDailyJob";
import DailyJobData from "./DailyJobdata";
import { ConfirmDialog } from "../../components/Notification";
import Loader from "../../components/Loader";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { fetchDailyJobList } from "../../services/dailyJobService";
import { formatDate } from "../../utils/dateUtils";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { getPreparedBy } from "../../utils/userSession";
import { hasPermission, menuPermissions } from "../../permissions/permissionUtils";

// Table column definitions mapped to API response
const dailyJobColumns = [
    { key: "actions", label: "Actions", sortable: false, width: "0%", minWidth: "100px" },

    {
        key: "daily_job_no",
        label: "Job Card No",
        style: { textAlign: "center" },
        width: "8%",
        minWidth: "100px",
    },
    {
        key: "work_order_no",
        label: "WO No",
        style: { textAlign: "center" },
        width: "8%",
        minWidth: "100px",
    },
    {
        key: "daily_job_date_formatted",
        label: "Job Card Date",
        sortable: true,
        sortType: "string",
        width: "10%",
        minWidth: "120px",
        style: { textAlign: "center" },
    },
    {
        key: "item_code",
        label: "Product",
        width: "12%",
        minWidth: "140px",
        style: { textAlign: "center" },
    },
    {
        key: "item_description",
        label: "Description",
        width: "15%",
        minWidth: "180px",
        style: { textAlign: "left" },
    },
    {
        key: "operation_id_text",
        label: "Operation",
        width: "10%",
        minWidth: "120px",
        style: { textAlign: "center" },
    },
    {
        key: "operation_status_text",
        label: "Status",
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
        }
    },
    {
        key: "responsible_person_name",
        label: "Responsible Person",
        width: "15%",
        minWidth: "160px",
        style: { textAlign: "center" },
    },
    {
        key: "item_unit",
        label: "Unit",
        width: "8%",
        minWidth: "100px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_planned",
        label: "Qty Planned",
        width: "8%",
        minWidth: "110px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_input",
        label: "Qty Input",
        width: "8%",
        minWidth: "110px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_output",
        label: "Qty Output",
        width: "8%",
        minWidth: "110px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_scrapped",
        label: "Qty Scrapped",
        width: "8%",
        minWidth: "110px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_copper_scrapped",
        label: "Qty Copper Scrapped",
        width: "8%",
        minWidth: "130px",
        style: { textAlign: "center" },
    },
];

const transformRecord = (item) => {
    return {
        ...item,
        daily_job_id: item.job_card_id,
        daily_job_no: item.job_card_no,
        daily_job_date: item.job_card_date,
        daily_job_date_formatted: formatDate(item.job_card_date || item.daily_job_date) || (item.job_card_date || item.daily_job_date),
    };
};

const getBackendColumnName = (frontendKey) => {
    const mapping = {
        "daily_job_date_formatted": "job_card_date",
        "daily_job_id": "job_card_id",
        "daily_job_no": "job_card_no",
        "daily_job_date": "job_card_date"
    };
    return mapping[frontendKey] || frontendKey;
};

export default function DailyJob() {
    const [loading, setLoading] = useState(false);
    const tableRef = useRef();
    const viewFormRef = useRef();

    // ─── Drawer State ─────────────────────────────────────────────────────
    const [viewRow, setViewRow] = useState(null);
    const [editMode, setEditMode] = useState(false);

    const {
        isDirty: viewIsDirty,
        setIsDirty: setViewIsDirty,
        checkUnsavedChanges: checkEditUnsavedChanges,
        resetDirty: resetEditDirty,
        dirtyConfirmDialog: editDirtyDialog,
    } = useUnsavedChanges({});

    // ─── Track last saved/updated record for highlighting ─────────────────
    const savedItemRef = useRef(null);

    const {
        rows: dailyJobData,
        setRows: setDailyJobData,
        tableProps,
    } = usePaginatedTable([], 25, true); // Server-side pagination enabled

    // Server-side state tracking
    const [, setActiveColumnSearch] = useState({ key: "", value: "" });
    const [, setActiveColumnFilters] = useState({});
    const activeColumnFiltersRef = useRef({});
    const [activeSearchFilters, setActiveSearchFilters] = useState([]);
    const [currentSortConfig, setCurrentSortConfig] = useState({ key: "", direction: "" });
    const [isGlobalSearch, setIsGlobalSearch] = useState(0);
    const lastQueryRef = useRef(null);
    const requestSeqRef = useRef(0);

    // ─── Display All / Pending Only toggle ────────────────────────────────
    const [, setShortCut] = useState("PendingOnly");
    const shortCutRef = useRef("PendingOnly");

    // ─── Highlight saved row after data refresh ───────────────────────────
    useEffect(() => {
        if (savedItemRef.current && dailyJobData.length > 0) {
            const savedId = savedItemRef.current;
            const savedIndex = dailyJobData.findIndex((item) => {
                return (
                    savedId === item.daily_job_id ||
                    String(savedId) === String(item.daily_job_id) ||
                    Number(savedId) === Number(item.daily_job_id)
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
    }, [dailyJobData]);

    // ─── Row Actions ──────────────────────────────────────────────────────
    const getActions = (row) => {
        if (!hasPermission(menuPermissions.JOB_CARD)) return [];

        return [
            {
                label: "View",
                title: "View Daily Job Details",
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
            },
            hasPermission(menuPermissions.DAILY_JOB) && {
                label: "Daily Job Data",
                title: "Daily Job Action",
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
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                ),
                onClick: async () => {
                    const jobCardId = row.daily_job_id || row.job_card_id;
                    const jobCardNo = row.daily_job_no || row.job_card_no || jobCardId;
                    const workOrderId = row.work_order_id;
                    const workOrderLineId = row.work_order_line_id || 0;
                    const key = `dailyjobdata-${jobCardId}`;
                    const title = `Daily Job Data - ${jobCardNo}`;
                    const path = `/dailyjobdata/${jobCardId}?wo=${workOrderId}&wol=${workOrderLineId}`;

                    window.dispatchEvent(new CustomEvent('openVirtualTab', {
                        detail: {
                            key,
                            title,
                            path,
                            content: <DailyJobData jobCardID={jobCardId} workOrderID={workOrderId} workOrderLineID={workOrderLineId} />
                        }
                    }));
                }
            }
        ].filter(Boolean);
    };

    // ─── Data Fetching ────────────────────────────────────────────────────
    const fetchDailyJobs = useCallback(
        async (
            pageSize = 25,
            pageNumber = 0,
            columnName = "",
            sortOrder = "",
            searchKeyword = "",
            isGlobalSearch = 0,
            searchFilter = [],
            options = { force: false },
            overrideShortCut = null
        ) => {
            const mappedColumnName = getBackendColumnName(columnName);

            // Build searchFilter array
            let resolvedFilter;
            if (Array.isArray(searchFilter) && searchFilter.length > 0) {
                resolvedFilter = searchFilter.map((f, idx) => ({
                    columnName: getBackendColumnName(f.columnName || ""),
                    searchKeyword: f.searchKeyword || "",
                    sortOrder: "",
                    columnSequence: f.columnSequence || idx + 1,
                }));
            } else if (columnName || searchKeyword) {
                resolvedFilter = [
                    {
                        columnName: mappedColumnName,
                        searchKeyword: searchKeyword || "",
                        sortOrder: "",
                        columnSequence: 1,
                    },
                ];
            } else {
                resolvedFilter = [
                    {
                        columnName: "",
                        searchKeyword: "",
                        sortOrder: "",
                        columnSequence: 0,
                    },
                ];
            }

            const activeShortCut = overrideShortCut !== null ? overrideShortCut : shortCutRef.current;

            const payload = {
                pageSize: Number(pageSize) || 0,
                pageNumber: Number(pageNumber) || 0,
                searchFilter: resolvedFilter,
                isGlobalSearch,
                sortOrder: sortOrder || "",
                shortCut: activeShortCut,
                loginID: getPreparedBy(),
            };

            const payloadKey = JSON.stringify(payload);
            if (!options?.force && lastQueryRef.current === payloadKey) return;
            lastQueryRef.current = payloadKey;

            const reqId = ++requestSeqRef.current;

            setLoading(true);
            try {
                const res = await fetchDailyJobList(payload);
                if (reqId !== requestSeqRef.current) return;

                const list = res?.data?.LOGGED_IN_PERSON_JOB_CARD_LIST || res?.data?.DAILY_JOB_LIST || [];
                const totalRecords = res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords || list.length || 0;

                // If current page returned no records but pageNumber > 0,
                // it means all records on this page were removed/completed/deleted.
                // Automatically fetch the previous available page (e.g., Page 1) instead of showing an empty table.
                if (pageNumber > 0 && list.length === 0) {
                    const resolvedPageSize = Number(pageSize) || 25;
                    const maxPageNumber = totalRecords > 0
                        ? Math.max(0, Math.ceil(totalRecords / resolvedPageSize) - 1)
                        : 0;
                    if (maxPageNumber < pageNumber) {
                        if (typeof tableProps.onPageChange === "function") {
                            tableProps.onPageChange(maxPageNumber + 1);
                        }
                        fetchDailyJobs(
                            pageSize,
                            maxPageNumber,
                            mappedColumnName,
                            sortOrder,
                            searchKeyword,
                            isGlobalSearch,
                            searchFilter,
                            { force: true },
                            activeShortCut
                        );
                        return;
                    }
                }

                const data = (list || []).map((item) => transformRecord(item));

                setDailyJobData(data);

                if (tableProps.setTotalRecords) {
                    tableProps.setTotalRecords(totalRecords);
                }

                if (typeof tableProps.onPageChange === "function" && Number(pageNumber) === 0) {
                    tableProps.onPageChange(1);
                }
            } catch (err) {
                console.error("Error fetching daily jobs:", err);
                if (reqId === requestSeqRef.current) {
                    setDailyJobData([]);
                }
            } finally {
                if (reqId === requestSeqRef.current) setLoading(false);
            }
        },
        [setDailyJobData, tableProps]
    );

    // ---------- Smart Refresh Helper ----------
    const refreshCurrentPage = useCallback(() => {
        fetchDailyJobs(
            tableProps.pageSize,
            tableProps.currentPage - 1,
            currentSortConfig.key || "",
            currentSortConfig.direction || "",
            tableProps.searchTerm || "",
            isGlobalSearch,
            activeSearchFilters,
            { force: true }
        );
    }, [fetchDailyJobs, tableProps, currentSortConfig, isGlobalSearch, activeSearchFilters]);

    // Initial load — default shortCut: PendingOnly
    const fetchedRef = useRef(false);
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        fetchDailyJobs(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
    }, [fetchDailyJobs]);

    // ─── Display All toggle handler ───────────────────────────────────────
    const handleDisplayAll = useCallback((isDisplayAll) => {
        const next = isDisplayAll ? "DisplayAll" : "PendingOnly";
        setShortCut(next);
        shortCutRef.current = next;
        if (tableProps?.onPageChange) tableProps.onPageChange(1);
        const activePageSize = tableProps?.pageSize || 25;
        fetchDailyJobs(activePageSize, 0, "", "", "", 0, [], { force: true }, next);
    }, [fetchDailyJobs, tableProps]);

    // ---------- Unified query handler ----------
    const handleQueryChange = useCallback(
        (q) => {
            try {
                const pageSizeNum = Number(q?.pageSize) || 25;
                const pageNumber0 = Math.max(0, Number(q?.pageNumber) || 0);
                const columnName = String(q?.columnName || "");
                const isGlobalSearch = Number(q?.isGlobalSearch) === 1 ? 1 : 0;
                const sortOrder = String(q?.sortOrder) || "";
                const searchKeyword = String(q?.searchKeyword || "");
                const searchFilter = Array.isArray(q?.searchFilter) ? q.searchFilter : [];

                if (typeof tableProps.onPageSizeChange === "function") tableProps.onPageSizeChange(pageSizeNum);
                if (typeof tableProps.onPageChange === "function") tableProps.onPageChange(pageNumber0 + 1);
                if (typeof tableProps.setSearchTerm === "function") tableProps.setSearchTerm(isGlobalSearch === 1 ? searchKeyword : "");

                if (typeof tableProps.setSortConfig === "function" && columnName) {
                    tableProps.setSortConfig({
                        key: columnName,
                        direction: sortOrder || "asc",
                    });
                }

                if (columnName && sortOrder) {
                    setCurrentSortConfig({ key: columnName, direction: sortOrder });
                }

                let finalSearchFilter = searchFilter;
                let finalColumnName = columnName;
                let finalSearchKeyword = searchKeyword;

                if (isGlobalSearch === 1) {
                    if (searchKeyword && searchKeyword.trim().length > 0) {
                        finalSearchFilter = [
                            {
                                columnName: columnName || "",
                                searchKeyword: searchKeyword,
                                sortOrder: "",
                                columnSequence: 1,
                            },
                        ];
                    } else {
                        finalSearchFilter = [];
                    }
                    finalColumnName = columnName || "";

                    setActiveColumnSearch({ key: "", value: "" });
                    setActiveColumnFilters({});
                    activeColumnFiltersRef.current = {};
                    setActiveSearchFilters(finalSearchFilter);
                } else if (searchFilter.length > 0) {
                    setActiveSearchFilters(searchFilter);

                    const filterMap = {};
                    searchFilter.forEach((f) => {
                        if (f.columnName && f.searchKeyword) {
                            filterMap[f.columnName] = f.searchKeyword;
                        }
                    });
                    setActiveColumnFilters(filterMap);
                    activeColumnFiltersRef.current = filterMap;

                    if (searchFilter.length === 1) {
                        setActiveColumnSearch({
                            key: searchFilter[0].columnName,
                            value: searchFilter[0].searchKeyword,
                        });
                    } else {
                        setActiveColumnSearch({ key: "", value: "" });
                    }
                } else if (columnName && (searchKeyword || "").length > 0) {
                    const nextFilters = { [columnName]: searchKeyword };
                    setActiveColumnSearch({ key: columnName, value: searchKeyword });
                    setActiveColumnFilters(nextFilters);
                    activeColumnFiltersRef.current = nextFilters;
                    setActiveSearchFilters([{ columnName, searchKeyword }]);
                } else {
                    setActiveColumnSearch({ key: "", value: "" });
                    setActiveColumnFilters({});
                    activeColumnFiltersRef.current = {};
                    setActiveSearchFilters([]);
                }

                setIsGlobalSearch(isGlobalSearch);

                fetchDailyJobs(
                    pageSizeNum,
                    pageNumber0,
                    finalColumnName,
                    sortOrder,
                    finalSearchKeyword,
                    isGlobalSearch,
                    finalSearchFilter
                );
            } catch (e) {
                console.error("Failed to handle unified query payload", e);
            }
        },
        [fetchDailyJobs, tableProps]
    );

    // ─── Refresh Handler ──────────────────────────────────────────────
    const handleRefresh = useCallback(() => {
        try {
            if (tableRef.current) {
                tableRef.current.refresh();
            }
            activeColumnFiltersRef.current = {};
            setActiveColumnSearch({ key: "", value: "" });
            setActiveColumnFilters({});
            setActiveSearchFilters([]);
            setCurrentSortConfig({ key: "", direction: "" });

            if (tableProps?.setSearchTerm) tableProps.setSearchTerm("");
            if (tableProps?.onPageChange) tableProps.onPageChange(1);
            if (tableProps?.onPageSizeChange) tableProps.onPageSizeChange(25);
            if (tableProps?.setSortConfig) tableProps.setSortConfig({ key: "", direction: "" });

            setShortCut("PendingOnly");
            shortCutRef.current = "PendingOnly";

            fetchDailyJobs(25, 0, "", "", "", 0, [], { force: true });
        } catch (error) {
            console.error("Error refreshing Daily Job list:", error);
        }
    }, [tableProps, fetchDailyJobs]);

    // ─── Render ───────────────────────────────────────────────────────────
    return (
        <div style={{ position: "relative" }}>
            {loading && <Loader />}

            <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
                <div style={{ height: "100%" }}>
                    <DynamicSortableTable
                        ref={tableRef}
                        columns={dailyJobColumns}
                        data={dailyJobData}
                        fixedFirstColumn={true}
                        title="My Job Card"
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
                        onQueryChange={handleQueryChange}
                        getActions={getActions}
                        showGlobalSearch={true}
                        autoSelectFirstRow={true}
                        currentPage={tableProps.currentPage}
                        pageSize={tableProps.pageSize}
                        totalRecords={tableProps.totalRecords}
                        sortConfig={tableProps.sortConfig}
                        searchTerm={tableProps.searchTerm}
                        showDisplayAll={true}
                        onDisplayAll={handleDisplayAll}
                    // onAdd={hasPermission(menuPermissions.JOB_CARD_CREATE_MANUAL) ? () => {
                    //     // Manual Job Card Creation not yet implemented
                    //     console.log("Add Manual Job Card Clicked");
                    // } : undefined}
                    />
                </div>
            </main>

            {/* ── Details Drawer ──────────────────────────────────────────── */}
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
                title="View Job Card"
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
                tabKey="dailyjob"
                alwaysExpanded={false}
            >
                <SaveOrUpdateDailyJob
                    ref={viewFormRef}
                    initialData={viewRow}
                    editMode={editMode}
                    onDirtyChange={setViewIsDirty}
                    onSuccess={(savedDailyJobId) => {
                        if (savedDailyJobId) {
                            savedItemRef.current = savedDailyJobId;
                        } else if (viewRow) {
                            savedItemRef.current = viewRow.daily_job_id;
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
    );
}