import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from "react";
import { Tooltip } from "@mui/material";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import Loader from "../../components/Loader";
import { useToast } from "../../components/useToast";
import {
    hasPermission,
    menuPermissions,
} from "../../permissions/permissionUtils";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import RightDrawer from "../../components/RightDrawer";
import { ConfirmDialog } from "../../components/Notification";
import {
    SUCCESS_STATUS,
    ERROR_STATUS,
    TITLE_UNSAVED_CHANGES,
    MSG_UNSAVED_CHANGES_DRAFT,
    MSG_UNSAVED_CHANGES_CLOSE,
} from "../../utils/ConstVariables";
import InspectionResult from "./InspectionResult";
import {
    fetchQualityGRNHeaderList,
    fetchInspectionDetails,
    fetchQAStatusOptions,
    approveInspectionDetails,
} from "../../services/grnService";
import { getPreparedBy } from "../../utils/userSession";

import StatusBadge from "../../components/StatusBadge";
import { formatDate } from "../../utils/dateUtils";

// ─── Column definitions ────────────────────────────────────────────
const qualityGRNColumns = [
    { key: "actions", label: "Actions", sortable: false, width: "0%", minWidth: "100px" },
    { key: "grn_no", label: "GRN No", style: { textAlign: "center" }, width: "10%", minWidth: "130px" },
    { key: "grn_date", label: "GRN Date", style: { textAlign: "center" }, width: "10%", minWidth: "120px", searchable: false, render: (row) => formatDate(row.grn_date) || "" },
    { key: "work_order_purchase_order_no", label: "WO / PO No", style: { textAlign: "center" }, width: "10%", minWidth: "120px", render: (row) => row.work_order_purchase_order_no || row.work_order_no || row.purchase_order_no || "" },
    { key: "batch_no", label: "Batch No", style: { textAlign: "center" }, width: "12%", minWidth: "140px", searchable: false },
    { key: "qa_status_text", label: "QA Status", style: { textAlign: "center" }, width: "12%", minWidth: "150px", searchable: false },
    {
        key: "item_code", label: "Item Code", style: { textAlign: "center", whiteSpace: "nowrap" }, width: "10%", minWidth: "140px", render: (row) => (
            row.item_description ? (
                <Tooltip
                    title={row.item_description}
                    arrow
                    placement="top"
                    componentsProps={{
                        tooltip: {
                            sx: {
                                backgroundColor: "#fff2a3",
                                color: "#000000",
                                border: "1px solid #e6b800",
                                fontSize: "12px",
                                boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
                                padding: "6px 10px",
                                fontFamily: "inherit",
                                fontWeight: "normal",
                            },
                        },
                        arrow: {
                            sx: {
                                color: "#fff2a3",
                                "&::before": {
                                    border: "1px solid #e6b800",
                                    backgroundColor: "#fff2a3",
                                },
                            },
                        },
                    }}
                >
                    <span style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                        {row.item_code}
                    </span>
                </Tooltip>
            ) : (
                <span style={{ whiteSpace: "nowrap" }}>{row.item_code}</span>
            )
        )
    },
    { key: "item_unit", label: "Unit", style: { textAlign: "center" }, width: "8%", minWidth: "100px", searchable: false },
    { key: "qty_offered_for_inspection", label: "Qty Offered For Inspection", style: { textAlign: "right" }, width: "10%", minWidth: "160px", searchable: false, render: (row) => row.qty_offered_for_inspection ?? "" },
    { key: "qty_delivered", label: "Qty Delivered", style: { textAlign: "right" }, width: "10%", minWidth: "120px", searchable: false },
    { key: "qty_returned", label: "Qty Returned", style: { textAlign: "right" }, width: "10%", minWidth: "120px", searchable: false },
    { key: "qty_rejected", label: "Qty Rejected", style: { textAlign: "right" }, width: "10%", minWidth: "120px", searchable: false, render: (row) => row.qty_rejected ?? "" },
    { key: "qty_testing_rejected", label: "Qty Testing Rejected", style: { textAlign: "right" }, width: "10%", minWidth: "150px", searchable: false, render: (row) => row.qty_testing_rejected ?? "" },
    { key: "qty_accepted", label: "Qty Accepted", style: { textAlign: "right" }, width: "10%", minWidth: "120px", searchable: false },
    { key: "qty_accepted_for_supplier", label: "Qty Accepted For Supplier", style: { textAlign: "right" }, width: "10%", minWidth: "180px", searchable: false },
];


// ─── Transform API record to display row ──────────────────────────
const transformRecord = (item) => {
    let itemCode = item.item_code || "";
    let itemDesc = item.item_description || "";
    let itemUnit = item.item_unit || "";

    if (!itemCode || !itemDesc || !itemUnit) {
        switch (true) {
            case !!item.work_order_no:
                itemCode = itemCode || item.work_order_item_code;
                itemDesc = itemDesc || item.work_order_item_description;
                itemUnit = itemUnit || item.work_order_item_unit || "";
                break;
            case !!item.purchase_order_no:
                itemCode = itemCode || item.purchase_order_item_code;
                itemDesc = itemDesc || item.purchase_order_item_description;
                itemUnit = itemUnit || item.purchase_order_item_unit || "";
                break;
            default:
                itemCode = itemCode || item.work_order_item_code || item.purchase_order_item_code;
                itemDesc = itemDesc || item.work_order_item_description || item.purchase_order_item_description;
                itemUnit = itemUnit || item.work_order_item_unit || item.purchase_order_item_unit || "";
        }
    }

    const wono = item.work_order_purchase_order_no || item.work_order_no || item.purchase_order_no || "";

    return {
        ...item,
        work_order_purchase_order_no: wono,
        work_order_no: wono,
        item_code: itemCode,
        item_description: itemDesc,
        item_unit: itemUnit,
        work_order_item_unit: itemUnit,
    };
};


export default function QualityGRNList() {

    const { showToast } = useToast();

    // ── Pagination state ──────────────────────────────────────────
    const {
        rows: grnData,
        setRows: setGrnData,
        tableProps,
    } = usePaginatedTable([], 25, true);

    const [loading, setLoading] = useState(false);
    const tableRef = useRef(null);
    const savedItemRef = useRef(null);
    const inspectionRef = useRef(null);

    const [qaStatusOptions, setQaStatusOptions] = useState([]);

    useEffect(() => {
        const loadQaStatusOptions = async () => {
            try {
                const data = await fetchQAStatusOptions();
                if (Array.isArray(data)) {
                    setQaStatusOptions(
                        data.map((item) => ({
                            value: String(item.ValueText),
                            label: item.DisplayText,
                        }))
                    );
                }
            } catch (err) {
                console.error("Error loading QA Status options in list:", err);
            }
        };
        loadQaStatusOptions();
    }, []);

    const getQAStatusText = useCallback((statusValue) => {
        const valStr = String(statusValue || "0");
        const found = qaStatusOptions.find(o => String(o.value) === valStr);
        if (found) return found.label;
        if (valStr === "0") return "Pending";
        return valStr;
    }, [qaStatusOptions]);

    // ── Drawer state ──────────────────────────────────────────────
    const [showAddDrawer, setShowAddDrawer] = useState(false);
    // addFormRef removed — InspectionResult does not require an external form ref in add mode

    const [viewRow, setViewRow] = useState(null);
    const [editMode, setEditMode] = useState(false);
    // viewFormRef removed — InspectionResult is now a self-contained content component

    // ── Unsaved-changes hooks ─────────────────────────────────────
    const {
        isDirty: isAddDirty,
        setIsDirty: setIsAddDirty,
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

    // Action Confirmation Dialog state (for Approve)
    const [actionConfirmDialog, setActionConfirmDialog] = useState({
        open: false,
        title: "",
        message: null,
        onConfirm: null,
    });

    // ── Server-side query tracking ────────────────────────────────
    const [, setActiveColumnSearch] = useState({ key: "", value: "" });
    const [, setActiveColumnFilters] = useState({});
    const activeColumnFiltersRef = useRef({});
    const [activeSearchFilters, setActiveSearchFilters] = useState([]);
    const [currentSortConfig, setCurrentSortConfig] = useState({ key: "", direction: "" });
    const [isGlobalSearch, setIsGlobalSearch] = useState(0);
    const lastQueryRef = useRef(null);
    const requestSeqRef = useRef(0);
    const fetchedRef = useRef(false);

    // ── Display All / Pending Only toggle ────────────────────────────────
    const [, setShortCut] = useState("PendingOnly");
    const shortCutRef = useRef("PendingOnly");

    // ── Fetch function ────────────────────────────────────────────
    const fetchGRNList = useCallback(
        async (
            pageSize = 25,
            pageNumber = 0,
            columnName = "",
            sortOrder = "",
            searchKeyword = "",
            isGlobalSearchVal = 0,
            searchFilter = [],
            options = { force: false },
            overrideShortCut = null
        ) => {
            const activeShortCut = overrideShortCut !== null ? overrideShortCut : shortCutRef.current;
            const mappedColumnName = columnName || "";

            let resolvedFilter = [];
            if (Array.isArray(searchFilter) && searchFilter.length > 0) {
                resolvedFilter = searchFilter.map((f, idx) => ({
                    columnName: f.columnName || "",
                    searchKeyword: f.searchKeyword || "",
                    sortOrder: "",
                    columnSequence: f.columnSequence || idx + 1,
                }));
            } else if (mappedColumnName || searchKeyword) {
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
                    { columnName: "", searchKeyword: "", sortOrder: "", columnSequence: 0 },
                ];
            }

            const payload = {
                pageSize,
                pageNumber,
                isGlobalSearch: isGlobalSearchVal,
                sortOrder,
                columnName: mappedColumnName,
                searchKeyword: searchKeyword || "",
                searchFilter: resolvedFilter,
                shortCut: activeShortCut,
            };

            const payloadKey = JSON.stringify(payload);
            if (!options?.force && lastQueryRef.current === payloadKey) return;
            lastQueryRef.current = payloadKey;

            const reqId = ++requestSeqRef.current;
            setLoading(true);

            try {
                const res = await fetchQualityGRNHeaderList(payload);
                if (reqId !== requestSeqRef.current) return;

                const list = res?.data?.["GOODS_INSPECTION_LIST"] || [];
                const totalRecords =
                    res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords || list.length || 0;

                // If current page returned no records but pageNumber > 0,
                // it means all records on this page were approved/removed.
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
                        fetchGRNList(
                            pageSize,
                            maxPageNumber,
                            mappedColumnName,
                            sortOrder,
                            searchKeyword,
                            isGlobalSearchVal,
                            searchFilter,
                            { force: true },
                            activeShortCut
                        );
                        return;
                    }
                }

                const data = list.map((item) => transformRecord(item));
                setGrnData(data);
                if (tableProps.setTotalRecords) tableProps.setTotalRecords(totalRecords);
                if (typeof tableProps.onPageChange === "function" && Number(pageNumber) === 0)
                    tableProps.onPageChange(1);
            } catch (error) {
                console.error(`Error fetching ${"Quality Inspection"} list:`, error);
                if (error?.response?.status === 401) {
                    window.dispatchEvent(new Event("sessionExpired"));
                } else {
                    showToast(`Failed to load ${"Quality Inspection"}`, ERROR_STATUS.toLowerCase());
                }
                setGrnData([]);
            } finally {
                if (reqId === requestSeqRef.current) setLoading(false);
            }
        },
        [setGrnData, tableProps, showToast]
    );

    // ── Refresh (preserve page/sort/search) ─────────────────
    const refreshCurrentPage = useCallback(() => {
        fetchGRNList(
            tableProps.pageSize || 25,
            (tableProps.currentPage || 1) - 1,
            currentSortConfig.key || "",
            currentSortConfig.direction || "",
            tableProps.searchTerm || "",
            isGlobalSearch,
            activeSearchFilters,
            { force: true }
        );
    },
        [fetchGRNList, tableProps, currentSortConfig, isGlobalSearch, activeSearchFilters]);

    // ── Initial load ──────────────────────────────────────────────
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        fetchGRNList(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
    }, [fetchGRNList]);

    // ── Display All toggle handler ───────────────────────────────────────
    const handleDisplayAll = useCallback((isDisplayAll) => {
        const next = isDisplayAll ? "DisplayAll" : "PendingOnly";
        setShortCut(next);
        shortCutRef.current = next;
        if (tableProps?.onPageChange) tableProps.onPageChange(1);
        const activePageSize = tableProps?.pageSize || 25;
        fetchGRNList(activePageSize, 0, "", "", "", 0, [], { force: true }, next);
    }, [fetchGRNList, tableProps]);

    // ── Row highlight after save ──────────────────────────────────
    useEffect(() => {
        if (!savedItemRef.current || grnData.length === 0) return;
        const saved = savedItemRef.current;
        const savedLineId = Number(saved?.grn_line_id || 0);
        const savedHeaderId = Number(saved?.inspection_header_id || 0);

        // Match primarily by grn_line_id (unique per GRN line item),
        // falling back to non-zero inspection_header_id.
        const idx = grnData.findIndex((item) => {
            const itemLineId = Number(item?.grn_line_id || item?.grnLineID || 0);
            if (savedLineId > 0 && itemLineId > 0) {
                return savedLineId === itemLineId;
            }
            const itemHeaderId = Number(item?.inspection_header_id || item?.inspectionHeaderID || 0);
            if (savedHeaderId > 0 && itemHeaderId > 0) {
                return savedHeaderId === itemHeaderId;
            }
            return false;
        });

        if (idx >= 0) {
            setTimeout(() => {
                try {
                    if (tableRef.current && typeof tableRef.current.selectRowByIndex === "function") {
                        tableRef.current.selectRowByIndex(idx);
                    }
                } catch (err) {
                    console.error("Error highlighting saved row:", err);
                }
                savedItemRef.current = null;
            }, 200);
        } else {
            savedItemRef.current = null;
        }
    }, [grnData]);

    // ── Unified query-change handler ──────────────────────────────
    const handleQueryChange = useCallback(
        (q) => {
            try {
                const pageSizeNum = Number(q?.pageSize) || 25;
                const pageNumber0 = Math.max(0, Number(q?.pageNumber) || 0);
                const columnName = String(q?.columnName || "");
                const isGlobalSearchVal = Number(q?.isGlobalSearch) === 1 ? 1 : 0;
                const sortOrder = String(q?.sortOrder || "");
                const searchKeyword = String(q?.searchKeyword || "");
                const searchFilter = Array.isArray(q?.searchFilter) ? q.searchFilter : [];

                if (typeof tableProps.onPageSizeChange === "function")
                    tableProps.onPageSizeChange(pageSizeNum);
                if (typeof tableProps.onPageChange === "function")
                    tableProps.onPageChange(pageNumber0 + 1);
                if (typeof tableProps.setSearchTerm === "function")
                    tableProps.setSearchTerm(isGlobalSearchVal === 1 ? searchKeyword : "");
                if (typeof tableProps.setSortConfig === "function" && columnName)
                    tableProps.setSortConfig({ key: columnName, direction: sortOrder || "asc" });
                if (columnName && sortOrder)
                    setCurrentSortConfig({ key: columnName, direction: sortOrder });

                let finalSearchFilter = searchFilter;
                let finalColumnName = columnName;
                let finalSearchKeyword = searchKeyword;

                if (isGlobalSearchVal === 1) {
                    finalSearchFilter = searchKeyword?.trim()
                        ? [{ columnName: columnName || "grn_no", searchKeyword, sortOrder: "", columnSequence: 1 }]
                        : [];
                    finalColumnName = columnName || "grn_no";
                    setActiveColumnSearch({ key: "", value: "" });
                    setActiveColumnFilters({});
                    activeColumnFiltersRef.current = {};
                    setActiveSearchFilters(finalSearchFilter);
                } else if (searchFilter.length > 0) {
                    setActiveSearchFilters(searchFilter);
                    const filterMap = {};
                    searchFilter.forEach((f) => { if (f.columnName && f.searchKeyword) filterMap[f.columnName] = f.searchKeyword; });
                    setActiveColumnFilters(filterMap);
                    activeColumnFiltersRef.current = filterMap;
                    setActiveColumnSearch(
                        searchFilter.length === 1
                            ? { key: searchFilter[0].columnName, value: searchFilter[0].searchKeyword }
                            : { key: "", value: "" }
                    );
                } else if (columnName && (searchKeyword || "").length > 0) {
                    setActiveColumnSearch({ key: columnName, value: searchKeyword });
                    setActiveColumnFilters({ [columnName]: searchKeyword });
                    activeColumnFiltersRef.current = { [columnName]: searchKeyword };
                    setActiveSearchFilters([{ columnName, searchKeyword }]);
                    finalSearchFilter = [{ columnName, searchKeyword }];
                } else {
                    setActiveColumnSearch({ key: "", value: "" });
                    setActiveColumnFilters({});
                    activeColumnFiltersRef.current = {};
                    setActiveSearchFilters([]);
                    finalSearchFilter = [];
                }

                setIsGlobalSearch(isGlobalSearchVal);
                fetchGRNList(
                    pageSizeNum, pageNumber0, finalColumnName, sortOrder,
                    finalSearchKeyword, isGlobalSearchVal, finalSearchFilter
                );
            } catch (e) {
                console.error("Failed to handle GRN query payload", e);
            }
        },
        [fetchGRNList, tableProps]
    );

    // ── Refresh ───────────────────────────────────────────────────
    const handleRefresh = useCallback(() => {
        try {
            setActiveColumnSearch({ key: "", value: "" });
            setActiveColumnFilters({});
            activeColumnFiltersRef.current = {};
            setActiveSearchFilters([]);
            setCurrentSortConfig({ key: "", direction: "" });

            if (tableRef.current && typeof tableRef.current.refresh === "function")
                tableRef.current.refresh();
            if (typeof tableProps.setSortConfig === "function")
                tableProps.setSortConfig({ key: "", direction: "" });
            if (typeof tableProps.setSearchTerm === "function")
                tableProps.setSearchTerm("");
            if (typeof tableProps.onPageSizeChange === "function")
                tableProps.onPageSizeChange(25);
            if (typeof tableProps.onPageChange === "function")
                tableProps.onPageChange(1);

            lastQueryRef.current = null;
            setShortCut("PendingOnly");
            shortCutRef.current = "PendingOnly";
            fetchGRNList(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
        } catch (e) {
            console.error("Error refreshing GRN list:", e);
        }
    }, [tableProps, fetchGRNList]);



    // ── Add save ──────────────────────────────────────────────────
    const handleAddSave = useCallback(async () => {
        if (inspectionRef.current) {
            try {
                const savedRecord = await inspectionRef.current.submit();
                const header = savedRecord?.data?.INSPECTION_RESPONSE?.[0] || savedRecord?.data?.QUALITY_GRN_SAVE_RESPONSE?.[0] || savedRecord?.QUALITY_GRN_SAVE_RESPONSE?.[0] || savedRecord?.data?.[0];
                const successMsg = header?.Message || savedRecord?.message || `${"Quality Inspection"} saved successfully!`;
                showToast(successMsg, SUCCESS_STATUS);

                const inspectionHeaderID = Number(header?.ID || header?.grn_id || header?.grnID || 0);
                if (inspectionHeaderID) {
                    try {
                        const detailRes = await fetchInspectionDetails({
                            inspectionHeaderID,
                            grnLineID: 0
                        });
                        if (detailRes && detailRes.Status === SUCCESS_STATUS && detailRes.data) {
                            const newHeader = detailRes.data.INSPECTION_HEADER_RESPONSE?.[0];
                            if (newHeader) {
                                // Use inspection_header_id (unique per row) so the highlight
                                // useEffect picks the exact new row after page refresh.
                                const resolvedHeaderID =
                                    newHeader.inspection_header_id ||
                                    newHeader.inspectionHeaderID ||
                                    inspectionHeaderID;
                                const resolvedLineID =
                                    newHeader.grn_line_id ||
                                    newHeader.grnLineID ||
                                    0;
                                savedItemRef.current = {
                                    inspection_header_id: resolvedHeaderID,
                                    grn_line_id: resolvedLineID
                                };
                            }
                        }
                    } catch (e) {
                        console.error("Error fetching Quality GRN Details after add:", e);
                    }
                }

                setShowAddDrawer(false);
                resetAddDirty();
                // Refresh the current page to preserve server-side ordering.
                // The savedItemRef above will highlight the correct row once the
                // refreshed data loads into grnData.
                refreshCurrentPage();
            } catch (err) {
                console.error("Error during add submission:", err);
            }
        }
    }, [showToast, resetAddDirty, refreshCurrentPage]);

    // ── Edit save ─────────────────────────────────────────────────
    const handleEditSave = useCallback(
        async () => {
            if (inspectionRef.current) {
                try {
                    const savedRecord = await inspectionRef.current.submit();
                    const header = savedRecord?.data?.INSPECTION_RESPONSE?.[0] || savedRecord?.data?.QUALITY_GRN_SAVE_RESPONSE?.[0] || savedRecord?.QUALITY_GRN_SAVE_RESPONSE?.[0] || savedRecord?.data?.[0];
                    const successMsg = header?.Message || savedRecord?.message || `${"Quality Inspection"} updated successfully!`;
                    showToast(successMsg, SUCCESS_STATUS);

                    const inspectionHeaderID = Number(
                        header?.ID ||
                        viewRow?.inspection_header_id ||
                        viewRow?.inspectionHeaderID ||
                        0
                    );
                    const grnLineID = Number(viewRow?.grn_line_id || viewRow?.grnLineID || 0);

                    if (inspectionHeaderID || grnLineID) {
                        try {
                            const detailRes = await fetchInspectionDetails({
                                inspectionHeaderID,
                                grnLineID
                            });
                            if (detailRes && detailRes.Status === SUCCESS_STATUS && detailRes.data) {
                                const newHeader = detailRes.data.INSPECTION_HEADER_RESPONSE?.[0];
                                if (newHeader) {
                                    const resolvedHeaderID =
                                        newHeader.inspection_header_id ||
                                        newHeader.inspectionHeaderID ||
                                        inspectionHeaderID;
                                    const resolvedLineID =
                                        newHeader.grn_line_id ||
                                        newHeader.grnLineID ||
                                        grnLineID ||
                                        viewRow?.grn_line_id ||
                                        viewRow?.grnLineID;

                                    savedItemRef.current = {
                                        inspection_header_id: resolvedHeaderID,
                                        grn_line_id: resolvedLineID
                                    };

                                    setGrnData((prev) => {
                                        // Match by grn_line_id (unique per line item) to find the exact row.
                                        // Prevents matching row 0 when inspection_header_id was 0/undefined for new records.
                                        const targetLineId = Number(viewRow?.grn_line_id || viewRow?.grnLineID || 0);
                                        const targetHeaderId = Number(viewRow?.inspection_header_id || viewRow?.inspectionHeaderID || 0);

                                        const idx = prev.findIndex((item) => {
                                            const itemLineId = Number(item?.grn_line_id || item?.grnLineID || 0);
                                            if (targetLineId > 0 && itemLineId > 0) {
                                                return targetLineId === itemLineId;
                                            }
                                            const itemHeaderId = Number(item?.inspection_header_id || item?.inspectionHeaderID || 0);
                                            if (targetHeaderId > 0 && itemHeaderId > 0) {
                                                return targetHeaderId === itemHeaderId;
                                            }
                                            return false;
                                        });

                                        if (idx >= 0) {
                                            const existingRow = prev[idx];
                                            const updatedRow = {
                                                ...existingRow,
                                                ...newHeader,
                                                inspection_header_id: resolvedHeaderID,
                                                grn_line_id: resolvedLineID || existingRow.grn_line_id,
                                                qty_rejected: newHeader.qty_rejected ?? existingRow.qty_rejected,
                                                qty_testing_rejected: newHeader.qty_testing_rejected ?? existingRow.qty_testing_rejected,
                                                qty_accepted: newHeader.qty_accepted ?? existingRow.qty_accepted,
                                                qty_accepted_for_supplier: newHeader.qty_accepted_for_supplier ?? existingRow.qty_accepted_for_supplier,
                                                qa_status: newHeader.qa_status ?? existingRow.qa_status,
                                                qa_status_text: newHeader.qa_status_text || getQAStatusText(newHeader.qa_status) || existingRow.qa_status_text,
                                                batch_no: newHeader.batch_no || existingRow.batch_no,
                                                qty_offered_for_inspection:
                                                    newHeader.qty_offered_for_inspection !== null && newHeader.qty_offered_for_inspection !== undefined
                                                        ? newHeader.qty_offered_for_inspection
                                                        : (newHeader.qty_delivered !== null && newHeader.qty_delivered !== undefined
                                                            ? newHeader.qty_delivered
                                                            : existingRow.qty_offered_for_inspection),
                                            };
                                            const arr = [...prev];
                                            arr[idx] = transformRecord(updatedRow);
                                            return arr;
                                        }
                                        return prev;
                                    });
                                }
                            }
                        } catch (e) {
                            console.error("Error fetching Quality GRN Details:", e);
                        }
                    }

                    setViewRow(null);
                    setEditMode(false);
                    resetEditDirty();
                } catch (err) {
                    console.error("Error during edit submission:", err);
                }
            }
        },
        [setGrnData, viewRow, showToast, resetEditDirty, getQAStatusText]
    );

    // ── Drawer close handlers ─────────────────────────────────────
    const confirmCloseAdd = () => {
        setShowAddDrawer(false);
        resetAddDirty();
    };

    const confirmCloseEdit = async () => {
        if (isEditDirty) {
            const confirmed = await checkEditUnsavedChanges();
            if (confirmed) {
                setViewRow(null);
                setEditMode(false);
                resetEditDirty();
            }
        } else {
            setViewRow(null);
            setEditMode(false);
        }
    };

    // ─── Approve Handler with Confirmation ──────────────────────────────
    const handleApprove = useCallback(async (row) => {
        if (!row) return;
        const headerId = Number(row.inspection_header_id || row.inspectionHeaderID || 0);
        const qaStatusStr = String(row.qa_status || "0");
        const isPendingOrInProgress = qaStatusStr === "0" || qaStatusStr === "5" ||
            (typeof row.qa_status_text === 'string' &&
                (row.qa_status_text.toLowerCase().includes('pending') || row.qa_status_text.toLowerCase().includes('progress')));

        if (headerId === 0 || isPendingOrInProgress) {
            showToast("Inspection status is Pending. Cannot Approve.", ERROR_STATUS.toLowerCase());
            return;
        }

        setLoading(true);
        try {
            const approvedBy = getPreparedBy() || "";
            const response = await approveInspectionDetails({
                inspectionHeaderID: headerId,
                approvedBy: approvedBy
            });

            if (response && response.Status === SUCCESS_STATUS) {
                const successMsg = response?.data?.APPROVE_INSPECTION_DETAILS_RESPONSE?.[0]?.Message || "Quality Inspection Approved Successfully";
                showToast(successMsg, SUCCESS_STATUS);
                // Use inspection_header_id and grn_line_id for precise highlight after approve.
                savedItemRef.current = {
                    inspection_header_id: row.inspection_header_id || row.inspectionHeaderID,
                    grn_line_id: row.grn_line_id || row.grnLineID
                };
                refreshCurrentPage();
            } else {
                showToast(response?.message || "Failed to Approve Quality Inspection", ERROR_STATUS.toLowerCase());
            }
        } catch (err) {
            console.error("Error approving inspection details:", err);
            showToast("Failed to Approve Quality Inspection", ERROR_STATUS.toLowerCase());
        } finally {
            setLoading(false);
        }
    }, [showToast, refreshCurrentPage]);

    // ── Row actions ───────────────────────────────────────────────
    const getActions = useCallback(
        (row) => {
            const actions = [
                {
                    label: "View",
                    title: `View ${"Quality Inspection"} Details`,
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    ),
                    onClick: async () => {
                        console.log("View action clicked. row content:", row);
                        const proceedToView = async (nextRow) => {
                            const isNew = Number(nextRow?.inspection_header_id || nextRow?.inspectionHeaderID || 0) === 0;
                            setViewRow(nextRow);
                            setEditMode(isNew);
                            resetEditDirty();
                        };
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

            const isApproved = String(row.inspection_doc_status_text || "").toLowerCase() === "approved" ||
                String(row.inspection_doc_status || "") === "30";

            if (!isApproved && hasPermission(menuPermissions.ALLOW_TO_APPROVE_INSPECTION_RECORD)) {
                actions.push({
                    label: "Approve",
                    title: `Approve Quality Inspection`,
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    ),
                    onClick: () => {
                        const headerId = Number(row.inspection_header_id || row.inspectionHeaderID || 0);
                        const qaStatusStr = String(row.qa_status || "0");
                        const isPendingOrInProgress = qaStatusStr === "0" || qaStatusStr === "5" ||
                            (typeof row.qa_status_text === 'string' &&
                                (row.qa_status_text.toLowerCase().includes('pending') || row.qa_status_text.toLowerCase().includes('progress')));

                        if (headerId === 0 || isPendingOrInProgress) {
                            showToast("Inspection status is Pending. Cannot Approve.", ERROR_STATUS.toLowerCase());
                            return;
                        }

                        setActionConfirmDialog({
                            open: true,
                            title: "Confirm Approve",
                            message: (
                                <>
                                    Are you sure you want to approve Quality Inspection for GRN{" "}
                                    <b>{row.grn_no || ""}</b>?
                                </>
                            ),
                            onConfirm: async () => {
                                setActionConfirmDialog({ open: false, title: "", message: null, onConfirm: null });
                                await handleApprove(row);
                            },
                        });
                    }
                });
            }

            return actions;
        },
        [isEditDirty, viewRow, checkEditUnsavedChanges, resetEditDirty, showToast, handleApprove]
    );

    const isNewMode = useMemo(() => {
        if (!viewRow) return false;
        const headerId = Number(viewRow.inspection_header_id || viewRow.inspectionHeaderID || 0);
        return headerId === 0;
    }, [viewRow]);

    // ── Render ────────────────────────────────────────────────────
    return (
        <div style={{ position: "relative" }}>
            {loading && <Loader />}

            <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
                <div>
                    <DynamicSortableTable
                        fixedFirstColumn={true}
                        ref={tableRef}
                        columns={qualityGRNColumns}
                        data={grnData}
                        onQueryChange={handleQueryChange}
                        // onAdd={
                        //     hasPermission(menuPermissions.GOODS_RECEIPT_NOTE_QUALITY_EDIT)
                        //         ? async () => {
                        //             if (isEditDirty && viewRow) {
                        //                 const ok = await checkEditUnsavedChanges();
                        //                 if (!ok) return;
                        //             }
                        //             setShowAddDrawer(true);
                        //             resetAddDirty();
                        //         }
                        //         : undefined
                        // }
                        onRefresh={handleRefresh}
                        title={"Quality Inspection"}
                        icon={(
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                        )}
                        showGlobalSearch={true}
                        getActions={getActions}
                        disableSearch={false}
                        autoSelectFirstRow={true}
                        currentPage={tableProps.currentPage}
                        pageSize={tableProps.pageSize}
                        totalRecords={tableProps.totalRecords}
                        showDisplayAll={true}
                        onDisplayAll={handleDisplayAll}
                    />

                    {/* ── Add Drawer ── */}
                    <RightDrawer
                        open={showAddDrawer}
                        tabKey={"grn-quality"}
                        onClose={confirmCloseAdd}
                        title={`Add ${"Quality Inspection"}`}
                        onSave={handleAddSave}
                        enableCloseConfirm
                        closeConfirmScope="create"
                        isCreate={true}
                        isDirty={isAddDirty}
                        closeConfirmTitle={TITLE_UNSAVED_CHANGES}
                        closeConfirmMessage={MSG_UNSAVED_CHANGES_DRAFT}
                    >
                        {showAddDrawer && (
                            <InspectionResult
                                ref={inspectionRef}
                                editMode={true}
                                onDirtyChange={(dirty) => setIsAddDirty(dirty)}
                            />
                        )}
                    </RightDrawer>

                    {/* ── View / Edit Drawer ── */}
                    <RightDrawer
                        open={!!viewRow}
                        tabKey={"grn-quality"}
                        onClose={confirmCloseEdit}
                        // title={
                        //     isNewMode
                        //         ? `Add Quality Inspection`
                        //         : (editMode ? `View Quality Inspection` : `View Quality Inspection`)
                        // }
                        title={isNewMode ? `Add Quality Inspection` : `View Quality Inspection`}
                        showEdit={
                            !isNewMode &&
                            !!viewRow &&
                            !editMode &&
                            hasPermission(menuPermissions.GOODS_RECEIPT_NOTE_QUALITY_EDIT)
                        }
                        onEdit={() => {
                            if (inspectionRef.current) {
                                const docStatus = inspectionRef.current.getDocumentStatus?.();
                                if (docStatus === "Approved") {
                                    showToast("This Inspection cannot be edited since it is already Approved", ERROR_STATUS.toLowerCase());
                                    return;
                                }
                            }
                            setEditMode(true);
                        }}
                        onSave={
                            (isNewMode || editMode) && hasPermission(menuPermissions.GOODS_RECEIPT_NOTE_QUALITY_EDIT)
                                ? handleEditSave
                                : undefined
                        }
                        disableEdit={editMode && !isNewMode}
                        onDisableEdit={!isNewMode ? () => setEditMode(false) : undefined}
                        isDirty={isEditDirty}
                        enableCloseConfirm={true}
                        closeConfirmScope="edit"
                        closeConfirmTitle={TITLE_UNSAVED_CHANGES}
                        closeConfirmMessage={MSG_UNSAVED_CHANGES_CLOSE}
                        disableTabCloseConfirm={!!viewRow && !isNewMode && !editMode && !isEditDirty}
                        onDiscardDraft={() => {
                            try { resetEditDirty(); } catch { /* no-op */ }
                        }}
                    >
                        {viewRow && (
                            <InspectionResult
                                ref={inspectionRef}
                                key={viewRow ? (viewRow["grn_no"] || viewRow["grn_id"] || "row") : "empty"}
                                grnID={viewRow.grn_id}
                                grnNo={viewRow.grn_no}
                                rowData={viewRow}
                                editMode={isNewMode ? true : editMode}
                                onEditModeChange={(mode) => setEditMode(mode)}
                                onDirtyChange={(dirty) => setIsEditDirty(dirty)}
                                inspectionHeaderID={viewRow.inspection_header_id || 0}
                                grnLineID={viewRow.grn_line_id || 0}
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

                    {/* Action Confirmation Dialog for Approve */}
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
