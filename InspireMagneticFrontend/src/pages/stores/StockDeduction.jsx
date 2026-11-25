import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Tooltip } from "@mui/material";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import Loader from "../../components/Loader";
import { useToast } from "../../components/useToast";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { formatDate } from "../../utils/dateUtils.js";
import StatusBadge from "../../components/StatusBadge";
import RightDrawer from "../../components/RightDrawer";
import SaveStockDeduction from "./SaveStockDeduction";
import { fetchStockOutStoreRequestList } from "../../services/storeService.js";
import { ConfirmDialog } from "../../components/Notification";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { hasPermission, menuPermissions } from "../../permissions/permissionUtils";
import { SUCCESS_STATUS, ERROR_STATUS } from "../../utils/ConstVariables";


// Helper to detect if a stock request is completed
const isCompletedStatus = (row) => {
  if (!row) return false;
  const statusId = Number(row.request_status ?? row.status_id ?? row.status);
  if (statusId === 70) return true;
  const statusText = String(
    row.request_status_text ||
    row.status_text ||
    (typeof row.status === "string" ? row.status : "") ||
    (typeof row.request_status === "string" ? row.request_status : "") ||
    ""
  ).toLowerCase().trim();
  return statusText.includes("completed");
};

// ─── Column definitions ────────────────────────────────────────────────────────
const stockDeductionColumns = [
  {
    key: "action_issue",
    label: "Actions",
    sortable: false,
    width: "4%",
    minWidth: "65px",
    style: { textAlign: "center" },
    render: (row, context) => {
      const canOperate = hasPermission(menuPermissions.ALLOW_TO_ADD_DEDUCT_STOCK_OPERATIONS);
      return (
        <button
          className="btn btn-sm btn-link p-0"
          title={canOperate ? "Issue" : "Access Denied"}
          disabled={!canOperate}
          onClick={(e) => {
            e.stopPropagation();
            if (canOperate) {
              context?.onIssue?.(row);
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: canOperate ? "pointer" : "not-allowed",
            opacity: canOperate ? 1 : 0.4,
            height: "28px",
            width: "28px",
            padding: "4px",
            borderRadius: "6px",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            if (canOperate) e.currentTarget.style.transform = "scale(1.15)";
          }}
          onMouseLeave={(e) => {
            if (canOperate) e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            id="receive"
          >
            <path
              d="M18,15.25 h-4 a0.75,0.75 0 0,0 0,1.5 h4 a0.75,0.75 0 0,0 0,-1.5 zM20.454,19.637c-1.135,1.39-2.791,2.111-4.459,2.111-1.279,0-2.565-.423-3.631-1.293-1.144-.934-1.858-2.247-2.05-3.704h-5.314c-1.517,0-2.75-1.233-2.75-2.75V6c0-1.517,1.233-2.75,2.75-2.75h12c1.517,0,2.75,1.233,2.75,2.75v5.659c2.342,2.025,2.674,5.564.704,7.977ZM4.954,4.759l5.32,3.8c.435.311,1.019.31,1.453,0l5.32-3.8c-.016,0-.03-.009-.046-.009H5c-.016,0-.03.009-.046.009Zm10.468,5.52c.981-.101,1.947.051,2.828.428v-4.708c0-.08-.031-.149-.045-.224l-5.606,4.004c-.478.342-1.039.513-1.599.513s-1.121-.171-1.599-.513L3.795,5.776c-.014.075-.045.145-.045.224v8c0,.689.561,1.25,1.25,1.25h5.313c.137-1.049.547-2.046,1.233-2.887.972-1.189,2.348-1.93,3.876-2.084Zm3.266,2.429c-.879-.719-1.988-1.05-3.115-.937-1.129.114-2.147.661-2.865,1.541-.718.879-1.051,1.986-.937,3.115s.661,2.147,1.541,2.865c1.816,1.482,4.499,1.211,5.98-.604,1.482-1.815,1.211-4.498-.604-5.98Z"
              fill="#3b82f6"
            />
          </svg>
        </button>
      );
    }
  },
  {
    key: "store_request_no",
    label: "Request No",
    sortable: false,
    style: { textAlign: "center" },
    width: "6%",
    minWidth: "85px",
    render: (row) => (row._isFirstInGroup !== false ? (row.store_request_no || "") : ""),
  },
  {
    key: "request_date",
    label: "Request Date",
    sortable: false,
    style: { textAlign: "center" },
    width: "6%",
    minWidth: "95px",
    render: (row) => (row._isFirstInGroup !== false ? (formatDate(row.request_date) || row.request_date || "") : ""),
  },
  {
    key: "request_type_text",
    label: "Request Type",
    sortable: false,
    style: { textAlign: "left", whiteSpace: "nowrap" },
    width: "12%",
    minWidth: "180px",
    render: (row) => (row._isFirstInGroup !== false ? <span style={{ whiteSpace: "nowrap" }}>{row.request_type_text || ""}</span> : ""),
  },
  {
    key: "item_code",
    label: "Item Code",
    sortable: false,
    style: { textAlign: "left", whiteSpace: "nowrap" },
    width: "8%",
    minWidth: "110px",
    render: (row) => {
      const desc = row.item_description || row.description;
      return desc ? (
        <Tooltip
          title={desc}
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
            {row.item_code || ""}
          </span>
        </Tooltip>
      ) : (
        <span style={{ whiteSpace: "nowrap" }}>{row.item_code || ""}</span>
      );
    },
  },


  {
    key: "qty_issue_requested",
    label: "Qty Requested",
    sortable: false,
    style: { textAlign: "right" },
    width: "6%",
    minWidth: "90px",
  },
  {
    key: "qty_issue_processed",
    label: "Qty Processed",
    sortable: false,
    style: { textAlign: "right" },
    width: "6%",
    minWidth: "90px",
  },
  {
    key: "qty_balance",
    label: "Qty Balance",
    sortable: false,
    style: { textAlign: "right" },
    width: "6%",
    minWidth: "90px",
    render: (row) => {
      const rawBalance =
        row.qty_balance !== undefined && row.qty_balance !== null
          ? row.qty_balance
          : Number(row.qty_issue_requested || 0) - Number(row.qty_issue_processed || 0);
      const num = Number(rawBalance);
      return isNaN(num) ? rawBalance : Number(num.toFixed(4));
    },
  },
  {
    key: "qty_available",
    label: "Current Stock",
    sortable: false,
    style: { textAlign: "right" },
    width: "7%",
    minWidth: "100px",
  },

  {
    key: "item_unit",
    label: "Unit",
    sortable: false,
    style: { textAlign: "center" },
    width: "5%",
    minWidth: "70px",
  },
  {
    key: "request_status_text",
    label: "Status",
    sortable: false,
    style: { textAlign: "center" },
    width: "8%",
    minWidth: "110px",
    render: (row) => (
      row._isFirstInGroup !== false ? (
        <StatusBadge statusId={row.request_status} statusText={row.request_status_text || "—"} />
      ) : ""
    ),
  },
  {
    key: "work_order_no",
    label: "WO No",
    sortable: false,
    style: { textAlign: "center" },
    width: "8%",
    minWidth: "110px",
    render: (row) => (
      <span style={{ whiteSpace: "nowrap" }}>
        {row.work_order_no || row.workorder_purchaseorder_no || ""}
      </span>
    ),
  },
  {
    key: "job_card_no",
    label: "Job Card No",
    sortable: false,
    style: { textAlign: "center" },
    width: "8%",
    minWidth: "110px",
    render: (row) => (
      <span style={{ whiteSpace: "nowrap" }}>
        {row.job_card_no || ""}
      </span>
    ),
  },
  {
    key: "delivery_note_no",
    label: "Delivery Note No",
    sortable: false,
    style: { textAlign: "center" },
    width: "8%",
    minWidth: "120px",
    render: (row) => (
      <span style={{ whiteSpace: "nowrap" }}>
        {row.delivery_note_no || ""}
      </span>
    ),
  },
  {
    key: "adjustment_no",
    label: "Stock Adjustment No",
    sortable: false,
    style: { textAlign: "center" },
    width: "10%",
    minWidth: "140px",
    render: (row) => (
      <span style={{ whiteSpace: "nowrap" }}>
        {row.adjustment_no || ""}
      </span>
    ),
  },
  {
    key: "requested_by",
    label: "Requested By",
    sortable: false,
    style: { textAlign: "center" },
    width: "8%",
    minWidth: "110px",
  },


];

const transformRecord = (item) => {
  const req = item?.qty_issue_requested ?? item?.qty_requested ?? 0;
  const proc = item?.qty_issue_processed ?? item?.qty_processed ?? 0;
  const rawBal =
    item?.qty_balance !== undefined && item?.qty_balance !== null
      ? item.qty_balance
      : Number(req) - Number(proc);
  const numBal = Number(rawBal);
  const bal = isNaN(numBal) ? rawBal : Number(numBal.toFixed(4));

  const reqTypeId =
    (typeof item?.request_type === "number" && item.request_type > 0 ? item.request_type : 0) ||
    (typeof item?.request_type_id === "number" && item.request_type_id > 0 ? item.request_type_id : 0) ||
    (typeof item?.transaction_type === "number" && item.transaction_type > 0 ? item.transaction_type : 0) ||
    (item?.request_type && /^\d+$/.test(String(item.request_type).trim()) ? parseInt(String(item.request_type).trim(), 10) : 0) ||
    (item?.request_type_id && /^\d+$/.test(String(item.request_type_id).trim()) ? parseInt(String(item.request_type_id).trim(), 10) : 0) ||
    (item?.transaction_type && /^\d+$/.test(String(item.transaction_type).trim()) ? parseInt(String(item.transaction_type).trim(), 10) : 0) ||
    0;

  const reqTypeText =
    item?.request_type_text ||
    (typeof item?.request_type === "string" && !/^\d+$/.test(item.request_type.trim()) ? item.request_type : "") ||
    "";

  return {
    ...item,
    id: item.store_request_id,
    store_no: item?.store_request_no || item?.store_no,
    request_type_text: reqTypeText,
    request_type: reqTypeId || item?.request_type || 0,
    request_type_id: reqTypeId,
    description: item?.item_description || item?.description,
    unit: item?.item_unit || item?.unit,
    work_order_no: item?.work_order_no || item?.workorder_purchaseorder_no || item?.po_no || "",
    job_card_no: item?.job_card_no || item?.jobCardNo || "",
    delivery_note_no: item?.delivery_note_no || item?.deliveryNoteNo || "",
    adjustment_no: item?.adjustment_no || item?.adjustmentNo || item?.stock_adjustment_no || "",
    request_date_formatted: formatDate(item?.request_date) || item?.request_date,
    qty_balance: bal,
  };
};

export default function StockDeduction() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [stockDeductions, setStockDeductions] = useState([]);

  // Table pagination state hook
  const {
    rows: displayData,
    setRows: setDisplayData,
    tableProps,
  } = usePaginatedTable([], 25, true);

  const [viewRow, setViewRow] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const viewFormRef = useRef(null);

  const {
    isDirty: isEditDirty,
    setIsDirty: setIsEditDirty,
    checkUnsavedChanges: checkEditUnsavedChanges,
    resetDirty: resetEditDirty,
    dirtyConfirmDialog: editDirtyDialog,
  } = useUnsavedChanges({});

  const [isGlobalSearch, setIsGlobalSearch] = useState(0);
  const [activeSearchFilters, setActiveSearchFilters] = useState([]);
  const [, setShortcut] = useState("PendingOnly");
  const shortcutRef = useRef("PendingOnly");

  const [currentSortConfig, setCurrentSortConfig] = useState({ key: "", direction: "" });

  const tableRef = useRef(null);
  const savedItemRef = useRef(null);

  const lastQueryRef = useRef(null);
  const requestSeqRef = useRef(0);
  const fetchedRef = useRef(false);

  const fetchStockDeductions = useCallback(
    async (
      pageSize = 25,
      pageNumber = 0,
      columnName = "",
      sortOrder = "",
      searchKeyword = "",
      isGlobalSearch = 0,
      searchFilter = [],
      options = { force: false },
      overrideShortcut = null
    ) => {
      const activeShortcut = overrideShortcut !== null ? overrideShortcut : shortcutRef.current;
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
          {
            columnName: "",
            searchKeyword: "",
            sortOrder: "",
            columnSequence: 0,
          },
        ];
      }

      const payload = {
        pageSize,
        pageNumber,
        isGlobalSearch,
        sortOrder,
        columnName: mappedColumnName,
        searchKeyword: searchKeyword || "",
        searchFilter: resolvedFilter,
        shortCut: activeShortcut === "PendingOnly" ? "PendingOnly" : "DisplayAll",
      };

      const payloadKey = JSON.stringify(payload);
      if (!options?.force && lastQueryRef.current === payloadKey) return;
      lastQueryRef.current = payloadKey;

      const reqId = ++requestSeqRef.current;
      setLoading(true);

      try {
        const res = await fetchStockOutStoreRequestList(payload);
        const list = res?.data?.STOCK_OUT_STORE_REQUEST_LIST || [];
        const totalRecords = res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords || list.length || 0;

        // If current page returned no records but pageNumber > 0,
        // it means all records on this page were completed or moved.
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
            fetchStockDeductions(
              pageSize,
              maxPageNumber,
              mappedColumnName,
              sortOrder,
              searchKeyword,
              isGlobalSearch,
              searchFilter,
              { force: true },
              activeShortcut
            );
            return;
          }
        }

        const data = list.map((item) => transformRecord(item));

        setStockDeductions(data);
        setDisplayData(data);
        if (tableProps.setTotalRecords) tableProps.setTotalRecords(totalRecords);
        if (typeof tableProps.onPageChange === "function" && Number(pageNumber) === 0) {
          tableProps.onPageChange(1);
        }
      } catch (error) {
        console.error("Error fetching Stock Deduction list:", error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          showToast("Failed to load Stock Deductions", ERROR_STATUS.toLowerCase());
        }
        setStockDeductions([]);
        setDisplayData([]);
      } finally {
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    },
    [setDisplayData, tableProps, showToast]
  );

  const refreshCurrentPage = useCallback(() => {
    fetchStockDeductions(
      tableProps.pageSize || 25,
      (tableProps.currentPage || 1) - 1,
      currentSortConfig.key || "",
      currentSortConfig.direction || "",
      tableProps.searchTerm || "",
      isGlobalSearch,
      activeSearchFilters,
      { force: true }
    );
  }, [fetchStockDeductions, tableProps, currentSortConfig, isGlobalSearch, activeSearchFilters]);

  // Handle Query Changes
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

        if (typeof tableProps.onPageSizeChange === "function") tableProps.onPageSizeChange(pageSizeNum);
        if (typeof tableProps.onPageChange === "function") tableProps.onPageChange(pageNumber0 + 1);
        if (typeof tableProps.setSearchTerm === "function") tableProps.setSearchTerm(isGlobalSearchVal === 1 ? searchKeyword : "");

        if (typeof tableProps.setSortConfig === "function" && columnName) {
          tableProps.setSortConfig({ key: columnName, direction: sortOrder || "asc" });
        }

        if (columnName && sortOrder) {
          setCurrentSortConfig({ key: columnName, direction: sortOrder });
        }

        let finalSearchFilter = searchFilter;
        let finalColumnName = columnName;
        let finalSearchKeyword = searchKeyword;

        if (isGlobalSearchVal === 1) {
          finalSearchFilter = searchKeyword?.trim()
            ? [{ columnName: columnName || "store_request_no", searchKeyword, sortOrder: "", columnSequence: 1 }]
            : [];
          finalColumnName = columnName || "store_request_no";
          setActiveSearchFilters(finalSearchFilter);
        } else if (searchFilter.length > 0) {
          setActiveSearchFilters(searchFilter);
        } else if (columnName && (searchKeyword || "").length > 0) {
          setActiveSearchFilters([{ columnName, searchKeyword }]);
          finalSearchFilter = [{ columnName, searchKeyword }];
        } else {
          setActiveSearchFilters([]);
          finalSearchFilter = [];
        }

        setIsGlobalSearch(isGlobalSearchVal);

        fetchStockDeductions(pageSizeNum, pageNumber0, finalColumnName, sortOrder, finalSearchKeyword, isGlobalSearchVal, finalSearchFilter);
      } catch (e) {
        console.error("Failed to handle query payload", e);
      }
    },
    [fetchStockDeductions, tableProps]
  );

  // Refresh Table Handler
  const handleRefresh = useCallback(() => {
    try {
      if (tableRef.current && typeof tableRef.current.refresh === "function") {
        tableRef.current.refresh();
      }
      if (tableProps.setSearchTerm) tableProps.setSearchTerm("");
      if (tableProps.onPageSizeChange) tableProps.onPageSizeChange(25);
      if (tableProps.onPageChange) tableProps.onPageChange(1);

      setIsGlobalSearch(0);
      setActiveSearchFilters([]);
      setShortcut("PendingOnly");
      shortcutRef.current = "PendingOnly";
      lastQueryRef.current = null;

      fetchStockDeductions(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
    } catch (e) {
      console.error("Error refreshing Stock Deduction list:", e);
    }
  }, [tableProps, fetchStockDeductions]);

  const handleDisplayAll = useCallback((isDisplayAll) => {
    const next = isDisplayAll ? "DisplayAll" : "PendingOnly";
    setShortcut(next);
    shortcutRef.current = next;
    if (tableProps?.onPageChange) tableProps.onPageChange(1);
    const activePageSize = tableProps?.pageSize || 25;
    fetchStockDeductions(activePageSize, 0, "", "", "", 0, [], { force: true }, next);
  }, [fetchStockDeductions, tableProps]);

  // Initial Load
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchStockDeductions(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
  }, [fetchStockDeductions]);

  // Tag rows with _isFirstInGroup so repeated Store Request No, Date, Type are only displayed on the first row of each group
  const formattedData = useMemo(() => {
    let lastStoreNo = null;
    return (displayData || []).map((item, idx) => {
      const currentStoreNo = item?.store_request_no || item?.store_no || item?.store_request_id || item?.id;
      const isFirst = (idx === 0 || currentStoreNo !== lastStoreNo);
      if (isFirst) {
        lastStoreNo = currentStoreNo;
      }
      return {
        ...item,
        _isFirstInGroup: isFirst,
      };
    });
  }, [displayData]);

  // Pre-calculate alternating background colors grouped by Store Request No
  const rowStyleMap = useMemo(() => {
    const map = new Map();
    let currentGroup = 0;
    let lastStoreNo = null;

    (formattedData || []).forEach((item, idx) => {
      const storeNo = item?.store_request_no || item?.store_no || item?.store_request_id || `row_${idx}`;
      if (idx === 0) {
        lastStoreNo = storeNo;
        currentGroup = 0;
      } else if (storeNo !== lastStoreNo) {
        lastStoreNo = storeNo;
        currentGroup = 1 - currentGroup;
      }
      // Group 0: #ffffff (White), Group 1: #f4edf6 (Subtle Mauve/Lavender Tint)
      map.set(item, {
        backgroundColor: currentGroup === 0 ? "#ffffff" : "#f4edf6",
      });
    });

    return map;
  }, [formattedData]);

  const getRowStyle = useCallback(
    (row) => rowStyleMap.get(row) || { backgroundColor: "#ffffff" },
    [rowStyleMap]
  );

  // Highlight saved row after data refresh
  useEffect(() => {
    if (!savedItemRef.current || stockDeductions.length === 0) return;

    const saved = savedItemRef.current;
    const idx = stockDeductions.findIndex((item) => {
      const matchStoreReq =
        saved.store_request_id &&
        (item.store_request_id || item.id) &&
        String(saved.store_request_id) === String(item.store_request_id || item.id);

      if (!matchStoreReq) return false;

      if (saved.store_request_line_id && item.store_request_line_id) {
        return String(saved.store_request_line_id) === String(item.store_request_line_id);
      }
      if (saved.item_id && item.item_id) {
        return String(saved.item_id) === String(item.item_id);
      }

      return true;
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
  }, [stockDeductions]);

  // Handle issue action
  const handleIssue = useCallback((row) => {
    const proceedToIssue = (nextRow) => {
      const idx = formattedData.findIndex((item) => {
        if (item === nextRow) return true;
        const matchStoreReq =
          (item.store_request_id || item.id) &&
          (nextRow.store_request_id || nextRow.id) &&
          String(item.store_request_id || item.id) === String(nextRow.store_request_id || nextRow.id);

        if (!matchStoreReq) return false;

        const matchLine =
          item.store_request_line_id && nextRow.store_request_line_id
            ? String(item.store_request_line_id) === String(nextRow.store_request_line_id)
            : true;
        const matchItem =
          item.item_id && nextRow.item_id
            ? String(item.item_id) === String(nextRow.item_id)
            : true;
        return matchLine && matchItem;
      });

      if (idx >= 0 && tableRef.current && typeof tableRef.current.selectRowByIndex === "function") {
        tableRef.current.selectRowByIndex(idx);
      }
      const isCompleted = isCompletedStatus(nextRow);
      const isNew = !isCompleted && Number(nextRow?.qty_issue_processed || 0) === 0;
      setViewRow(nextRow);
      setEditMode(isNew);
      resetEditDirty();
    };

    if (viewRow && isEditDirty) {
      const canProceed = checkEditUnsavedChanges(async (nextRow) => {
        proceedToIssue(nextRow);
      }, row);
      if (!canProceed) return;
      proceedToIssue(row);
      return;
    }

    proceedToIssue(row);
  }, [formattedData, viewRow, isEditDirty, checkEditUnsavedChanges, resetEditDirty]);

  const handleEditSave = useCallback(() => {
    if (viewFormRef.current) {
      viewFormRef.current.submit();
    }
  }, []);

  const isNewMode = useMemo(() => {
    if (!viewRow) return false;
    if (isCompletedStatus(viewRow)) return false;
    return Number(viewRow.qty_issue_processed || 0) === 0;
  }, [viewRow]);

  const handleEditClick = useCallback(() => {
    const isCompleted =
      isCompletedStatus(viewRow) ||
      viewFormRef.current?.isCompleted?.();

    if (isCompleted) {
      showToast("Cannot edit this record because status is already Completed", ERROR_STATUS.toLowerCase());
      return;
    }
    setEditMode(true);
  }, [viewRow, showToast]);

  const handleStatusLoaded = useCallback((statusInfo) => {
    setViewRow((prev) => (prev ? { ...prev, ...statusInfo } : prev));
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {loading && <Loader />}

      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          <DynamicSortableTable
            fixedFirstColumn={true}
            ref={tableRef}
            columns={stockDeductionColumns}
            data={formattedData}
            getRowStyle={getRowStyle}
            onQueryChange={handleQueryChange}
            onRefresh={handleRefresh}
            title="Stock Deduction"
            icon={
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
              >
                <path
                  d="M18,15.25 h-4 a0.75,0.75 0 0,0 0,1.5 h4 a0.75,0.75 0 0,0 0,-1.5 zM20.454,19.637c-1.135,1.39-2.791,2.111-4.459,2.111-1.279,0-2.565-.423-3.631-1.293-1.144-.934-1.858-2.247-2.05-3.704h-5.314c-1.517,0-2.75-1.233-2.75-2.75V6c0-1.517,1.233-2.75,2.75-2.75h12c1.517,0,2.75,1.233,2.75,2.75v5.659c2.342,2.025,2.674,5.564.704,7.977ZM4.954,4.759l5.32,3.8c.435.311,1.019.31,1.453,0l5.32-3.8c-.016,0-.03-.009-.046-.009H5c-.016,0-.03.009-.046.009Zm10.468,5.52c.981-.101,1.947.051,2.828.428v-4.708c0-.08-.031-.149-.045-.224l-5.606,4.004c-.478.342-1.039.513-1.599.513s-1.121-.171-1.599-.513L3.795,5.776c-.014.075-.045.145-.045.224v8c0,.689.561,1.25,1.25,1.25h5.313c.137-1.049.547-2.046,1.233-2.887.972-1.189,2.348-1.93,3.876-2.084Zm3.266,2.429c-.879-.719-1.988-1.05-3.115-.937-1.129.114-2.147.661-2.865,1.541-.718.879-1.051,1.986-.937,3.115s.661,2.147,1.541,2.865c1.816,1.482,4.499,1.211,5.98-.604,1.482-1.815,1.211-4.498-.604-5.98Z"
                  fill="currentColor"
                />
              </svg>
            }
            showGlobalSearch={true}
            renderContext={{ onIssue: handleIssue }}
            disableSearch={false}
            disableSorting={true}
            autoSelectFirstRow={true}
            currentPage={tableProps.currentPage}
            pageSize={tableProps.pageSize}
            totalRecords={tableProps.totalRecords}
            showDisplayAll={true}
            onDisplayAll={handleDisplayAll}
          />

          {/* ── View / Edit Drawer ── */}
          <RightDrawer
            open={!!viewRow}
            tabKey="stores-stock-deduction"
            onClose={async () => {
              if (isEditDirty) {
                const confirmed = await checkEditUnsavedChanges();
                if (confirmed) {
                  setViewRow(null);
                  setEditMode(false);
                  resetEditDirty();
                }
                return;
              }
              setViewRow(null);
              setEditMode(false);
              resetEditDirty();
            }}
            // title={isNewMode ? "Add Stock Deduction" : (editMode ? "View Stock Deduction" : "View Stock Deduction")}
            title={isNewMode ? "Add Stock Deduction" : "View Stock Deduction"}
            showEdit={!isNewMode && !!viewRow && !editMode && hasPermission(menuPermissions.ALLOW_TO_ADD_DEDUCT_STOCK_OPERATIONS)}
            onEdit={handleEditClick}
            onSave={(isNewMode || editMode) && !isCompletedStatus(viewRow) && hasPermission(menuPermissions.ALLOW_TO_ADD_DEDUCT_STOCK_OPERATIONS) ? handleEditSave : undefined}
            disableEdit={editMode && !isNewMode}
            onDisableEdit={!isNewMode ? () => setEditMode(false) : undefined}
            isDirty={isEditDirty}
            enableCloseConfirm={true}
            closeConfirmScope="edit"
            closeConfirmTitle="Unsaved Changes"
            closeConfirmMessage="You have unsaved changes. Are you sure you want to close?"
            disableTabCloseConfirm={!!viewRow && !isNewMode && !editMode && !isEditDirty}
            onDiscardDraft={() => {
              try {
                resetEditDirty();
              } catch {
                /* noop */
              }
            }}
          >
            {viewRow && (
              <SaveStockDeduction
                key={`${viewRow?.store_request_id || viewRow?.id || ""}_${viewRow?.store_request_line_id || viewRow?.storeRequestLineID || ""}_${viewRow?.item_id || ""}_${viewRow?.batch_no || ""}`}
                ref={viewFormRef}
                initialData={viewRow}
                editMode={isNewMode ? true : editMode}
                disabled={!hasPermission(menuPermissions.ALLOW_TO_ADD_DEDUCT_STOCK_OPERATIONS)}
                onDirtyChange={setIsEditDirty}
                onStatusLoaded={handleStatusLoaded}
                onSuccess={(values) => {
                  const savedId = viewRow?.store_request_id || viewRow?.id || values?.id || values?.store_request_id;
                  const savedLineId = viewRow?.store_request_line_id || viewRow?.storeRequestLineID || values?.store_request_line_id || values?.storeRequestLineID;
                  const savedItemId = viewRow?.item_id || viewRow?.itemId || values?.item_id || values?.itemId;
                  if (savedId) {
                    savedItemRef.current = {
                      store_request_id: savedId,
                      store_request_line_id: savedLineId,
                      item_id: savedItemId,
                    };
                  }
                  refreshCurrentPage();
                  setViewRow(null);
                  setEditMode(false);
                  resetEditDirty();
                }}
              />
            )}
          </RightDrawer>
        </div>
      </main>
      <ConfirmDialog {...editDirtyDialog} />
    </div>
  );
}
