import React, { useState, useEffect, useRef, useCallback } from "react";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import RightDrawer from "../../components/RightDrawer";
import SaveUpdateWorkOrder from "./SaveUpdateWorkOrder";
import WorkOrderToJobCard from "../jobcard/WorkOrderToJobCard";
import { ConfirmDialog } from "../../components/Notification";
import Loader from "../../components/Loader";
import { useToast } from "../../components/useToast";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { fetchWorkOrderHeaderList, approveWorkOrderDetails, shortCloseWorkOrderDetails, fetchWorkOrderHeaderPDF } from "../../services/workOrderService";
import { getPreparedBy } from "../../utils/userSession";
import { formatDate } from "../../utils/dateUtils";
import { hasPermission, menuPermissions } from "../../permissions/permissionUtils";
import PDFViewerModal from "../../components/PDFViewerModal";
import { SUCCESS_STATUS, ERROR_STATUS, TITLE_ADD_WORK_ORDER, TITLE_UNSAVED_CHANGES, MSG_UNSAVED_CHANGES_DRAFT, MSG_UNSAVED_CHANGES_CLOSE } from "../../utils/ConstVariables";
import StatusBadge from "../../components/StatusBadge";

// Helper to detect if a work order row is approved
const isApprovedStatus = (row) => {
    if (!row) return false;
    const status = row.doc_status_text || row.status || "";
    return (
        status.toLowerCase() === "approved" ||
        status === "A" ||
        row.doc_status === 30 ||
        row.doc_status === 2
    );
};



// Table column definitions mapped to API response
const workOrderColumns = [
    { key: "actions", label: "Actions", sortable: false, width: "0%", minWidth: "100px" },
    {
        key: "work_order_no",
        label: "WO No",
        style: { textAlign: "center" },
        width: "10%",
        minWidth: "120px",
        // searchable: true,
        render: (row, { openPdf }) => (
            <span
                style={{
                    color: "#1865b5",
                    textDecoration: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                }}
                title={`${row.work_order_no}`}
                onMouseOut={(e) => e.target.style.textDecoration = "none"}
                onClick={(e) => {
                    e.stopPropagation();
                    openPdf(row);
                }}
            >
                {row.work_order_no}
            </span>
        )
    },
    {
        key: "work_order_date_formatted",
        label: "WO Date",
        sortable: true,
        sortType: "string",
        width: "15%",
        minWidth: "150px",
        style: { textAlign: "center" },
        // searchable: false,
    },
    {
        key: "supplier_name",
        label: "Subcontractor Name",
        // searchable: true,
        ignoreSpecial: true,
        width: "10%",
        minWidth: "140px",
        style: { textAlign: "center" },
    },
    {
        key: "work_order_type_text",
        label: "Type",
        width: "15%",
        minWidth: "140px",
        style: { textAlign: "center" },
    },
    {
        key: "doc_status_text",
        label: "Status",
        width: "15%",
        minWidth: "150px",
        style: { textAlign: "center" },
        render: (row) => (
            <StatusBadge statusId={row.doc_status} statusText={row.doc_status_text || "Pending"} />
        ),
    },
    {
        key: "remarks",
        label: "Remarks",
        width: "20%",
        minWidth: "200px",
        style: { textAlign: "center" },
    },
    {
        key: "prep_by",
        label: "Prep By",
        width: "15%",
        minWidth: "140px",
        style: { textAlign: "center" },
    },
    {
        key: "approved_by",
        label: "App By",
        width: "15%",
        minWidth: "140px",
        style: { textAlign: "center" },
    },
];

const transformRecord = (item) => {
    return {
        ...item,
        work_order_date_formatted: formatDate(item.work_order_date) || item.work_order_date,
        prep_date_formatted: formatDate(item.prep_date) || item.prep_date,
    };
};

const getBackendColumnName = (frontendKey) => {
    const mapping = {
        "work_order_date_formatted": "work_order_date",
        "prep_date_formatted": "prep_date",
    };
    return mapping[frontendKey] || frontendKey;
};

export default function WorkOrderList() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const tableRef = useRef();

    // PDF Viewer state
    const [pdfModal, setPdfModal] = useState({
        isOpen: false,
        title: "",
        pdfUrl: "",
        hideActions: false
    });

    const openPdf = useCallback(async (row) => {
        // If a dropdown menu is open in the table, close it and don't open the PDF on the first click
        if (tableRef.current?.closeDropdowns()) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetchWorkOrderHeaderPDF({ workOrderID: row.work_order_id });
            if (res && res.Status === SUCCESS_STATUS && res.data?.WORK_ORDER_PDF_RESPONSE?.length > 0) {
                const pdfData = res.data.WORK_ORDER_PDF_RESPONSE[0];
                setPdfModal({
                    isOpen: true,
                    title: pdfData.WorkOrderPDFFileName || `WO-${row.work_order_id}`,
                    pdfUrl: pdfData.WorkOrderPDFBase64,
                    hideActions: (row.doc_status < 30)
                });
            } else {
                showToast(res?.message || "Failed to generate PDF", "error");
            }
        } catch (error) {
            console.error("Error fetching PDF:", error);
            showToast("An error occurred while fetching the PDF", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // Drawer states
    const [showAddDrawer, setShowAddDrawer] = useState(false);
    const addFormRef = useRef();

    const [viewRow, setViewRow] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const viewFormRef = useRef();

    const savedItemRef = useRef(null);

    const {
        rows: workOrderData,
        setRows: setWorkOrderData,
        tableProps,
    } = usePaginatedTable([], 25, true); // Server-side pagination enabled (true)

    const {
        isDirty: isAddDirty,
        setIsDirty: setIsAddDirty,
        checkUnsavedChanges: checkAddUnsavedChanges,
        resetDirty: resetAddDirty,
        dirtyConfirmDialog: addDirtyDialog,
    } = useUnsavedChanges({});

    const {
        isDirty: isEditDirty,
        setIsDirty: setIsEditDirty,
        checkUnsavedChanges: checkEditUnsavedChanges,
        resetDirty: resetEditDirty,
        dirtyConfirmDialog: editDirtyDialog,
    } = useUnsavedChanges({});

    // Action Confirmation Dialog state (for Approve, Short Close, Recall)
    const [actionConfirmDialog, setActionConfirmDialog] = useState({
        open: false,
        title: "",
        message: null,
        onConfirm: null,
    });

    // Server-side state tracking
    const [, setActiveColumnSearch] = useState({ key: "", value: "" });
    const [, setActiveColumnFilters] = useState({});
    const activeColumnFiltersRef = useRef({});
    const [activeSearchFilters, setActiveSearchFilters] = useState([]);
    const [currentSortConfig, setCurrentSortConfig] = useState({ key: "", direction: "" });
    const [isGlobalSearch, setIsGlobalSearch] = useState(0);
    const lastQueryRef = useRef(null);
    const requestSeqRef = useRef(0);

    // Highlight saved row after data refresh
    useEffect(() => {
        if (savedItemRef.current && workOrderData.length > 0) {
            const savedIdentifier = savedItemRef.current;
            const savedIndex = workOrderData.findIndex((item) => {
                const savedWoId = savedIdentifier.work_order_id || savedIdentifier.workOrderID;
                const itemId = item.work_order_id;
                return savedWoId && itemId && (
                    savedWoId === itemId ||
                    String(savedWoId) === String(itemId) ||
                    Number(savedWoId) === Number(itemId)
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
    }, [workOrderData]);

    // ─── Data Fetching ────────────────────────────────────────────────────
    const fetchWorkOrders = useCallback(
        async (
            pageSize = 25,
            pageNumber = 0,
            columnName = "",
            sortOrder = "",
            searchKeyword = "",
            isGlobalSearch = 0,
            searchFilter = [],
            options = { force: false }
        ) => {
            const mappedColumnName = getBackendColumnName(columnName);

            const payload = {
                pageSize: Number(pageSize) || 0,
                pageNumber: Number(pageNumber) || 0,
                isGlobalSearch,
                sortOrder: sortOrder || "asc",
                columnName: mappedColumnName,
                searchKeyword: searchKeyword || "",
            };

            if (Array.isArray(searchFilter) && searchFilter.length > 0) {
                payload.searchFilter = searchFilter.map((f, idx) => ({
                    columnName: getBackendColumnName(f.columnName || ""),
                    searchKeyword: f.searchKeyword || "",
                    sortOrder: "",
                    columnSequence: f.columnSequence || idx + 1,
                }));
            } else if (columnName || searchKeyword) {
                payload.searchFilter = [
                    {
                        columnName: mappedColumnName,
                        searchKeyword: searchKeyword || "",
                        sortOrder: "",
                        columnSequence: 1,
                    },
                ];
            } else {
                payload.searchFilter = [];
            }

            const payloadKey = JSON.stringify(payload);
            if (!options?.force && lastQueryRef.current === payloadKey) return;
            lastQueryRef.current = payloadKey;

            const reqId = ++requestSeqRef.current;

            setLoading(true);
            try {
                const res = await fetchWorkOrderHeaderList(payload);
                if (reqId !== requestSeqRef.current) return;

                const list = res?.data?.WORK_ORDER_HEADER_LIST || [];
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
                        fetchWorkOrders(
                            pageSize,
                            maxPageNumber,
                            columnName,
                            sortOrder,
                            searchKeyword,
                            isGlobalSearch,
                            searchFilter,
                            { force: true }
                        );
                        return;
                    }
                }

                let data = (list || []).map((item) => transformRecord(item));

                const filters = activeColumnFiltersRef.current || {};
                const activeEntries = Object.entries(filters).filter(([, v]) => (v || "").length > 0);

                if (activeEntries.length > 1) {
                    data = data.filter((row) => {
                        return activeEntries.every(([k, v]) => {
                            const cell = row?.[k];
                            const s = cell == null ? "" : String(cell);
                            return s.toLowerCase().includes(String(v).toLowerCase());
                        });
                    });
                }

                setWorkOrderData(data);

                if (tableProps.setTotalRecords) {
                    tableProps.setTotalRecords(totalRecords);
                }

                if (typeof tableProps.onPageChange === "function" && Number(pageNumber) === 0) {
                    tableProps.onPageChange(1);
                }
            } catch (err) {
                console.error("Error fetching work orders:", err);
                if (reqId === requestSeqRef.current) {
                    setWorkOrderData([]);
                }
            } finally {
                if (reqId === requestSeqRef.current) setLoading(false);
            }
        },
        [setWorkOrderData, tableProps]
    );

    // ---------- Smart Refresh Helper ----------
    const refreshCurrentPage = useCallback(() => {
        fetchWorkOrders(
            tableProps.pageSize,
            tableProps.currentPage - 1,
            currentSortConfig.key || "",
            currentSortConfig.direction || "",
            tableProps.searchTerm || "",
            isGlobalSearch,
            activeSearchFilters,
            { force: true }
        );
    }, [fetchWorkOrders, tableProps, currentSortConfig, isGlobalSearch, activeSearchFilters]);

    // Initial load
    const fetchedRef = useRef(false);
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        fetchWorkOrders(25, 0, "", "", "", 0, [], { force: true });
    }, [fetchWorkOrders]);

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

                fetchWorkOrders(
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
        [fetchWorkOrders, tableProps]
    );

    // ─── Approve & Short Close Handlers with Confirmation ─────────────────
    const handleApprove = useCallback(async (row) => {
        if (!row) return;
        setLoading(true);
        try {
            const payload = {
                workOrderID: row.work_order_id,
                approvedBy: getPreparedBy()
            };
            const response = await approveWorkOrderDetails(payload);
            if (response?.Status === SUCCESS_STATUS) {
                const successMsg = response.data?.APPROVE_WORK_ORDER_DETAILS_RESPONSE?.[0]?.Message || "Work Order Approved Successfully !!!";
                showToast(successMsg, SUCCESS_STATUS);
                savedItemRef.current = { work_order_id: row.work_order_id };
                refreshCurrentPage();
            } else {
                const errorMsg = response.data?.APPROVE_WORK_ORDER_DETAILS_RESPONSE?.[0]?.Message || response?.message || "Failed to approve Work Order.";
                showToast(errorMsg, ERROR_STATUS.toLowerCase());
            }
        } catch (error) {
            console.error("Error approving Work Order:", error);
            showToast("An error occurred during approval.", ERROR_STATUS.toLowerCase());
        } finally {
            setLoading(false);
        }
    }, [showToast, refreshCurrentPage]);

    const handleShortClose = useCallback(async (row, isShortClosed) => {
        if (!row) return;
        setLoading(true);
        try {
            const payload = {
                workOrderID: row.work_order_id
            };
            const response = await shortCloseWorkOrderDetails(payload);
            if (response?.Status === SUCCESS_STATUS) {
                const defaultMsg = isShortClosed ? "Work Order Recalled Successfully!" : "Work Order Short Closed Successfully!";
                const successMsg = response.data?.SHORTCLOSE_OR_RECALL_WORK_ORDER_DETAILS_RESPONSE?.[0]?.Message || defaultMsg;
                showToast(successMsg, SUCCESS_STATUS);
                // Preserve current page and highlight this row
                savedItemRef.current = { work_order_id: row.work_order_id };
                refreshCurrentPage();
            } else {
                const errorMsg = response.data?.SHORTCLOSE_OR_RECALL_WORK_ORDER_DETAILS_RESPONSE?.[0]?.Message || response?.message || (isShortClosed ? "Recall failed." : "Short Close failed.");
                showToast(errorMsg, ERROR_STATUS.toLowerCase());
            }
        } catch (error) {
            console.error("Error with work order action:", error);
            showToast(`An error occurred during ${isShortClosed ? "recall" : "short close"}.`, ERROR_STATUS.toLowerCase());
        } finally {
            setLoading(false);
        }
    }, [showToast, refreshCurrentPage]);

    // ─── Row Actions ──────────────────────────────────────────────────────
    const getActions = (row) => {
        const isApproved = isApprovedStatus(row);
        const isShortClosed = (row.doc_status_text || "").toLowerCase().includes("short-closed");

        const actions = [
            // View - Always visible
            {
                label: "View",
                title: "View Work Order Details",
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

                    // Check if Add form is open and dirty (only if View drawer not already open)
                    // if (!viewRow && showAddDrawer && !checkAddUnsavedChanges(proceedToView, row)) {
                    //     return;
                    // }

                    if (viewRow && isEditDirty) {
                        const canProceed = checkEditUnsavedChanges(async (nextRow) => {
                            await proceedToView(nextRow);
                        }, row);
                        if (!canProceed) return;
                        await proceedToView(row);
                        return;
                    }

                    await proceedToView(row);
                },
            },
        ];

        // View Job Cards — visible for ALL rows (including approved), guarded by JOB_CARD permission
        if (hasPermission(menuPermissions.JOB_CARD)) {
            actions.push({
                label: "View Job Cards",
                title: "View Job Cards for this Work Order",
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
                        <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                        <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
                    </svg>
                ),
                onClick: () => {
                    const workOrderId = row.work_order_id;
                    const workOrderNo = row.work_order_no;
                    const key = `workorder-jobcards-${workOrderId}`;
                    const title = `Job Cards - ${workOrderNo}`;
                    const path = `/wo-jobcards/${workOrderId}`;

                    window.dispatchEvent(new CustomEvent('openVirtualTab', {
                        detail: {
                            key,
                            title,
                            path,
                            content: <WorkOrderToJobCard workOrderNo={workOrderNo} />
                        }
                    }));
                },
            });
        }

        // If Approved, stop here — no Short Close or Approve actions
        if (isApproved) {
            return actions;
        }

        // Short Close / Recall
        if (hasPermission(menuPermissions.WORK_ORDER_SHORT_CLOSE)) {
            actions.push({
                label: isShortClosed ? "Recall" : "Short Close",
                title: isShortClosed ? "Recall Work Order" : "Short Close Work Order",
                icon: isShortClosed ? (
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
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.14-3" />
                    </svg>
                ) : (
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
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                ),
                onClick: () => {
                    const actionVerb = isShortClosed ? "recall" : "short close";
                    const actionTitle = isShortClosed ? "Confirm Recall" : "Confirm Short Close";
                    setActionConfirmDialog({
                        open: true,
                        title: actionTitle,
                        message: (
                            <>
                                Are you sure you want to {actionVerb} Work Order{" "}
                                <b>{row.work_order_no || ""}</b>?
                            </>
                        ),
                        onConfirm: async () => {
                            setActionConfirmDialog({ open: false, title: "", message: null, onConfirm: null });
                            await handleShortClose(row, isShortClosed);
                        },
                    });
                },
            });
        }

        // Approve — only for non-approved AND non-short-closed rows
        if (!isShortClosed && hasPermission(menuPermissions.WORK_ORDER_APPROVE)) {
            actions.push({
                label: "Approve",
                title: "Approve this Work Order",
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
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <path d="M22 4L12 14.01l-3-3" />
                    </svg>
                ),
                onClick: () => {
                    setActionConfirmDialog({
                        open: true,
                        title: "Confirm Approve",
                        message: (
                            <>
                                Are you sure you want to approve Work Order{" "}
                                <b>{row.work_order_no || ""}</b>?
                            </>
                        ),
                        onConfirm: async () => {
                            setActionConfirmDialog({ open: false, title: "", message: null, onConfirm: null });
                            await handleApprove(row);
                        },
                    });
                },
            });
        }

        return actions;
    };

    // ─── Add Drawer Handlers ──────────────────────────────────────────────
    const confirmCloseAdd = async () => {
        const ok = await checkAddUnsavedChanges();
        if (ok) {
            setShowAddDrawer(false);
            resetAddDirty();
        }
    };

    const handleAddSuccess = (newRecord) => {
        const header = newRecord?.data?.WORK_ORDER_HEADER_RESPONSE?.[0] || newRecord?.data?.data?.WORK_ORDER_HEADER_RESPONSE?.[0] || newRecord?.WORK_ORDER_HEADER_RESPONSE?.[0] || newRecord?.data?.[0];

        if (header) {
            savedItemRef.current = {
                work_order_id: header.work_order_id || header.workOrderID || header.WorkOrderID || header.ID,
                isNew: true
            };

            const transformedRecord = transformRecord({
                ...header,
                work_order_id: header.work_order_id || header.workOrderID || header.WorkOrderID || header.ID
            });

            setWorkOrderData((prevData) => {
                const filtered = prevData.filter(item => item.work_order_id !== transformedRecord.work_order_id);
                return [transformedRecord, ...filtered];
            });

            // Update total records count safely
            if (typeof tableProps.setTotalRecords === "function") {
                const currentTotal = tableProps.totalRecords || 0;
                tableProps.setTotalRecords(currentTotal + 1);
            }
        } else {
            refreshCurrentPage();
        }

        setShowAddDrawer(false);
        resetAddDirty();
        showToast("Work Order created successfully!", SUCCESS_STATUS);
    };

    // ─── View/Edit Drawer Handlers ────────────────────────────────────────
    const confirmCloseEdit = async () => {
        const ok = await checkEditUnsavedChanges();
        if (ok) {
            setViewRow(null);
            setEditMode(false);
            resetEditDirty();
        }
    };

    const handleEditSave = () => {
        // Track edited item for highlighting after refresh
        if (viewRow) {
            savedItemRef.current = {
                work_order_id: viewRow.work_order_id || viewRow.workOrderID
            };
        }

        refreshCurrentPage();

        setViewRow(null);
        setEditMode(false);
        resetEditDirty();
        showToast("Work Order updated successfully!", SUCCESS_STATUS);
    };

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

            fetchWorkOrders(25, 0, "", "", "", 0, [], { force: true });
        } catch (error) {
            console.error("Error refreshing Work Order list:", error);
        }
    }, [tableProps, fetchWorkOrders]);

    // ─── Render ───────────────────────────────────────────────────────────
    return (
        <div style={{ position: "relative" }}>
            {/* Loader shown over the page while fetching */}
            {loading && <Loader />}

            <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
                <div style={{ height: "100%" }}>
                    <DynamicSortableTable
                        ref={tableRef}
                        columns={workOrderColumns}
                        data={workOrderData}
                        fixedFirstColumn={true}
                        title="Work Order"
                        icon={
                            <svg
                                viewBox="0 0 48 48"
                                width="20"
                                height="20"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <g>
                                    <polygon points="27.75,9.652 27.75,1.304 20.38,1.304 20.38,9.652 15.245,9.652 24.278,19.174 32.886,9.652" />
                                    <polygon points="24.978,26.805 24.978,46.695 40.75,46.695 40.75,26.805" />
                                    <polygon points="7.25,26.805 7.25,46.695 23.021,46.695 23.021,26.805" />
                                    <polygon points="40.714,24.326 48,16.129 32.151,16.129 24.978,24.327" />
                                    <polygon points="0,16.129 7.286,24.326 23.021,24.326 15.849,16.129" />
                                </g>
                            </svg>
                        }
                        onAdd={hasPermission(menuPermissions.WORK_ORDER_CREATE) ? () => {
                            setShowAddDrawer(true);
                            resetAddDirty();
                        } : undefined}
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
                        // Pass extra context to column renderers
                        renderContext={{ openPdf }}
                    />

                    {/* ── PDF Viewer Modal ── */}
                    <PDFViewerModal
                        isOpen={pdfModal.isOpen}
                        onClose={() => setPdfModal(prev => ({ ...prev, isOpen: false }))}
                        title={pdfModal.title}
                        pdfUrl={pdfModal.pdfUrl}
                        hideActions={pdfModal.hideActions}
                    />

                    {/* ── Add Drawer ── */}
                    <RightDrawer
                        open={showAddDrawer}
                        tabKey="workorder"
                        onClose={confirmCloseAdd}
                        title={TITLE_ADD_WORK_ORDER}
                        onSave={() => addFormRef.current && addFormRef.current.submit()}
                        enableCloseConfirm
                        closeConfirmScope="create"
                        isCreate={true}
                        isDirty={isAddDirty}
                        closeConfirmTitle={TITLE_UNSAVED_CHANGES}
                        closeConfirmMessage={MSG_UNSAVED_CHANGES_DRAFT}
                        onSaveDraft={() => {
                            try {
                                addFormRef.current?.saveDraft?.();
                            } catch {
                                /* no-op */
                            }
                        }}
                        onDiscardDraft={() => {
                            try {
                                addFormRef.current?.clearDraft?.();
                            } catch {
                                /* no-op */
                            }
                            resetAddDirty();
                        }}
                    >
                        <SaveUpdateWorkOrder
                            ref={addFormRef}
                            open={showAddDrawer}
                            onClose={confirmCloseAdd}
                            onSuccess={handleAddSuccess}
                            onDirtyChange={(dirty) => setIsAddDirty(dirty)}
                        />
                    </RightDrawer>

                    {/* ── View / Edit Drawer ── */}
                    <RightDrawer
                        open={!!viewRow}
                        tabKey="workorder"
                        onClose={confirmCloseEdit}
                        title="View Work Order"
                        showEdit={!!viewRow && !editMode && hasPermission(menuPermissions.WORK_ORDER_EDIT)}
                        onEdit={() => {
                            if (isApprovedStatus(viewRow)) {
                                showToast("This Work Order cannot be edited since it is already Approved", ERROR_STATUS.toLowerCase());
                                return;
                            }
                            setEditMode(true);
                        }}
                        onSave={
                            editMode && !isApprovedStatus(viewRow) && hasPermission(menuPermissions.WORK_ORDER_EDIT)
                                ? () => viewFormRef.current && viewFormRef.current.submit()
                                : undefined
                        }
                        disableEdit={editMode}
                        onDisableEdit={() => {
                            setEditMode(false);
                        }}
                        isDirty={isEditDirty}
                        enableCloseConfirm={true}
                        closeConfirmScope="edit"
                        closeConfirmTitle={TITLE_UNSAVED_CHANGES}
                        closeConfirmMessage={MSG_UNSAVED_CHANGES_CLOSE}
                        disableTabCloseConfirm={!!viewRow && !editMode && !isEditDirty}
                        onDiscardDraft={() => {
                            try {
                                resetEditDirty();
                            } catch {
                                /* noop */
                            }
                        }}
                    >
                        {viewRow && (
                            <SaveUpdateWorkOrder
                                key={viewRow ? (viewRow.work_order_id || "row") : "empty"}
                                ref={viewFormRef}
                                open={!!viewRow}
                                initialData={viewRow}
                                editMode={editMode}
                                onSuccess={handleEditSave}
                                onDirtyChange={(dirty) => setIsEditDirty(dirty)}
                                disabled={!hasPermission(menuPermissions.WORK_ORDER_EDIT)}
                            />
                        )}
                    </RightDrawer>


                    <ConfirmDialog
                        {...addDirtyDialog}
                        confirmLabel="Yes"
                        cancelLabel="No"
                        title={TITLE_UNSAVED_CHANGES}
                    />
                    <ConfirmDialog
                        {...editDirtyDialog}
                        confirmLabel="Yes"
                        cancelLabel="No"
                        title={TITLE_UNSAVED_CHANGES}
                    />

                    {/* Action Confirmation Dialog for Approve & Short Close / Recall */}
                    <ConfirmDialog
                        open={actionConfirmDialog.open}
                        title={actionConfirmDialog.title}
                        message={actionConfirmDialog.message}
                        onConfirm={actionConfirmDialog.onConfirm}
                        onCancel={() => setActionConfirmDialog({ open: false, title: "", message: null, onConfirm: null })}
                        confirmLabel="OK"
                        cancelLabel="Cancel"
                    />
                </div>
            </main>
        </div>
    );
}