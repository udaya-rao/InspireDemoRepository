import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import Loader from "../../components/Loader";
import { useToast } from "../../components/useToast";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { formatDate, getCurrentDate, getCurrentTime, getFinancialYearStartDate } from "../../utils/dateUtils.js";
import { formatStockQuantity } from "../../utils/formatUtils.js";
import { fetchInventoryTransactionLogList } from "../../services/storeService.js";
import "./TransactionHistory.css";

// ── Helper: group flat API log rows into parent + sub_items by Item Code ──────
function groupTransactionLogs(logList) {
  const groupMap = new Map();
  const groupOrder = [];

  logList.forEach((log) => {
    const key = log.item_code;
    if (!key) return;

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      groupOrder.push(key);
    }
    groupMap.get(key).push(log);
  });

  return groupOrder.map((key) => {
    const logs = groupMap.get(key);
    const first = logs[0];

    // Aggregate totals across all logs under this item
    const totalReceived = logs.reduce((s, l) => s + (Number(l.qty_received) || 0), 0);
    const totalIssued = logs.reduce((s, l) => s + (Number(l.qty_issued) || 0), 0);
    // Last current_stock in the group is the running balance after the transactions
    const lastStock = Number(logs[logs.length - 1].current_stock) || 0;

    const unit = first.item_unit || first.unit || "";

    const parent = {
      id: `${key}`,
      transaction_no: first.transaction_no,
      item_code: first.item_code,
      item_description:
        first.item_description ||
        first.description ||
        logs.find((l) => l.item_description || l.description)?.item_description ||
        logs.find((l) => l.item_description || l.description)?.description ||
        "",
      transaction_date: "",
      transaction_details: "",
      increase: totalReceived > 0 ? totalReceived : null,
      decrease: totalIssued > 0 ? totalIssued : null,
      balance_stock: lastStock,
      unit,
      // Build sub_items for every group so the first row always has the Expand/Collapse option
      sub_items: logs.map((l) => ({
        log_id: l.log_id,
        transaction_no: l.transaction_no,
        transaction_date: l.transaction_date,
        transaction_details: l.transaction_details,
        increase: Number(l.qty_received) > 0 ? l.qty_received : null,
        decrease: Number(l.qty_issued) > 0 ? l.qty_issued : null,
        balance_stock: l.current_stock,
        unit: l.item_unit || l.unit || unit,
      })),
    };

    return parent;
  });
}


// ── Expand/Collapse Toggle Button (matching Actions View icon button) ─────────
const ExpandCollapseButton = ({ isExpanded, onClick }) => (
  <button
    type="button"
    className="btn-sm no-print"
    onClick={onClick}
    style={{
      padding: "2px 6px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#1677ff",
      background: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      lineHeight: 1,
      transition: "all 0.15s ease",
    }}
    title={isExpanded ? "Collapse" : "Expand"}
  >
    {isExpanded ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )}
  </button>
);

// ── Static Column definitions (Columns 1-7) ───────────────────────────────────
const staticTransactionHistoryColumns = [
  {
    key: "item_code",
    label: "Item Code",
    sortable: false,
    style: { textAlign: "left" },
    width: "14%",
    minWidth: "100px",
    colSpan: () => 3,
    cellStyle: () => ({ textAlign: "left", maxWidth: 0 }),
    render: (row) => {
      const code = row.item_code || "";
      const desc = String(row.item_description || "").trim();
      const fullText = desc ? `${code} - ${desc}` : code;
      const isLong = fullText.length > 70;
      return (
        <span
          title={isLong ? fullText : undefined}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            if (el.scrollWidth > el.clientWidth) {
              el.title = fullText;
            } else {
              el.removeAttribute("title");
            }
          }}
          style={{
            display: "inline-block",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {fullText}
        </span>
      );
    },
  },
  {
    key: "transaction_date",
    label: "Transaction Date",
    sortable: false,
    style: { textAlign: "center" },
    width: "12%",
    minWidth: "95px",
    render: (row) =>
      row.transaction_date ? formatDate(row.transaction_date) || row.transaction_date : "",
  },
  {
    key: "transaction_details",
    label: "Transaction Details",
    sortable: false,
    style: { textAlign: "left" },
    width: "34%",
    minWidth: "180px",
  },
  {
    key: "decrease",
    label: "Decrease",
    sortable: false,
    style: { textAlign: "right" },
    width: "9%",
    minWidth: "70px",
    render: (row) =>
      row.decrease != null ? <span>{formatStockQuantity(row.decrease, row.unit)}</span> : "",
  },
  {
    key: "increase",
    label: "Increase",
    sortable: false,
    style: { textAlign: "right" },
    width: "9%",
    minWidth: "70px",
    render: (row) =>
      row.increase != null ? <span>{formatStockQuantity(row.increase, row.unit)}</span> : "",
  },
  {
    key: "balance_stock",
    label: "Balance Stock",
    sortable: false,
    style: { textAlign: "right" },
    width: "14%",
    minWidth: "90px",
    render: (row) => (
      <span>{formatStockQuantity(row.balance_stock, row.unit)}</span>
    ),
  },
  {
    key: "unit",
    label: "Unit",
    sortable: false,
    style: { textAlign: "center" },
    width: "8%",
    minWidth: "55px",
    render: (row) => row.unit || "",
  },
];

export default function TransactionHistory() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeSearchFilters, setActiveSearchFilters] = useState([]);
  const tableRef = useRef(null);
  const lastQueryRef = useRef(null);
  const requestSeqRef = useRef(0);
  const fetchedRef = useRef(false);

  // ── Search & Date Scope Filter States ──────────────────────────────────────
  const today = useMemo(() => getCurrentDate(), []);
  const [filterPartCode, setFilterPartCode] = useState("");
  const [fromDate, setFromDate] = useState(() => getFinancialYearStartDate());
  const [toDate, setToDate] = useState(() => getCurrentDate());

  // ── Expand/Collapse State (scoped ONLY to TransactionHistory) ───────────────
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());
  const expandAllRef = useRef(true);

  const toggleRowExpand = useCallback((id) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  }, []);

  const {
    rows: displayData,
    setRows: setDisplayData,
    tableProps,
  } = usePaginatedTable([], 25, true);

  const [selectedChildId, setSelectedChildId] = useState(null);

  const handleSelectChildRow = useCallback((subKey) => {
    setSelectedChildId(subKey);
    if (tableRef.current?.clearSelectedRow) {
      tableRef.current.clearSelectedRow();
    }
  }, []);

  const allExpanded = useMemo(() => {
    return displayData.length > 0 && displayData.every((r) => expandedRowIds.has(r.id));
  }, [displayData, expandedRowIds]);

  const displayedItemCodeFilter = useMemo(() => {
    if (filterPartCode && filterPartCode.trim()) {
      return filterPartCode.trim();
    }
    const found = activeSearchFilters?.find(
      (f) => (f.columnName === "item_code" || f.columnName === "part_code") && f.searchKeyword
    );
    if (found && found.searchKeyword && String(found.searchKeyword).trim()) {
      return String(found.searchKeyword).trim();
    }
    return "All Items";
  }, [filterPartCode, activeSearchFilters]);

  const handleToggleExpandAll = useCallback(() => {
    setSelectedChildId(null);
    if (allExpanded) {
      expandAllRef.current = false;
      setExpandedRowIds(new Set());
    } else {
      expandAllRef.current = true;
      setExpandedRowIds(new Set(displayData.map((r) => r.id)));
    }
  }, [allExpanded, displayData]);

  // ── Columns definition with Expand/Collapse All (+) / (−) in header ──────────
  const columns = useMemo(
    () => [
      {
        key: "action",
        label: (
          <button
            type="button"
            className="btn-sm no-print expand-all-header-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpandAll();
            }}
            disabled={displayData.length === 0}
            style={{
              padding: "2px 6px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              background: "transparent",
              border: "none",
              borderRadius: "4px",
              cursor: displayData.length === 0 ? "not-allowed" : "pointer",
              lineHeight: 1,
              transition: "all 0.15s ease",
              opacity: displayData.length === 0 ? 0.6 : 1,
            }}
            title={allExpanded ? "Collapse All" : "Expand All"}
            aria-label={allExpanded ? "Collapse All" : "Expand All"}
          >
            {allExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </button>
        ),
        sortable: false,
        width: "42px",
        minWidth: "42px",
        maxWidth: "42px",
        style: { textAlign: "center", padding: "0 2px" },
        render: (row, context) => {
          const isExpanded = context?.expandedRowIds?.has(row.id);
          const hasSubItems = Array.isArray(row.sub_items) && row.sub_items.length > 0;
          if (!hasSubItems) return null;
          return (
            <ExpandCollapseButton
              isExpanded={isExpanded}
              onClick={() => {
                context?.onParentRowClick?.();
                context?.toggleRowExpand?.(row.id);
              }}
            />
          );
        },
      },
      ...staticTransactionHistoryColumns,
    ],
    [allExpanded, handleToggleExpandAll, displayData.length]
  );

  // ── Fetch Transaction History from real API ───────────────────────────────────
  const fetchTransactionHistory = useCallback(
    async (
      pageSize = 25,
      pageNumber = 0,
      columnName = "",
      sortOrder = "",
      searchKeyword = "",
      isGlobalSearchVal = 0,
      searchFilter = [],
      options = { force: false },
      scopeOverrides = {}
    ) => {
      const itemCodeFilter = scopeOverrides.partCode !== undefined ? scopeOverrides.partCode : filterPartCode;
      const fromDateFilter = scopeOverrides.fromDate !== undefined ? scopeOverrides.fromDate : fromDate;
      const toDateFilter = scopeOverrides.toDate !== undefined ? scopeOverrides.toDate : toDate;

      // Build payload matching the API contract exactly
      const resolvedSearchFilter =
        Array.isArray(searchFilter) && searchFilter.length > 0
          ? searchFilter
          : [{ columnName: "", searchKeyword: "", sortOrder: "", columnSequence: 0 }];

      const isAll =
        pageSize === "all" ||
        (![25, 50, 100, 200].includes(Number(pageSize)) && Number(pageSize) > 0);
      const resolvedPageSize = isAll ? 100000 : (Number(pageSize) || 25);

      const payload = {
        pageSize: resolvedPageSize,
        pageNumber,
        searchFilter: resolvedSearchFilter,
        isGlobalSearch: isGlobalSearchVal,
        sortOrder,
        itemCode: itemCodeFilter || "",
        fromDate: fromDateFilter || "",
        toDate: toDateFilter || "",
      };

      const payloadKey = JSON.stringify(payload);
      if (!options?.force && lastQueryRef.current === payloadKey) return;
      lastQueryRef.current = payloadKey;
      setSelectedChildId(null);

      const reqId = ++requestSeqRef.current;
      setLoading(true);

      try {
        const res = await fetchInventoryTransactionLogList(payload);
        if (reqId !== requestSeqRef.current) return;

        const rawList = res?.data?.INVENTORY_TRANSACTION_LOG_LIST || [];
        const totalCount = res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords ?? rawList.length;

        // If the requested page is out of bounds (e.g. filters changed and returned fewer records), fallback to Page 1
        if (pageNumber > 0 && (totalCount === 0 || pageNumber * resolvedPageSize >= totalCount)) {
          if (typeof tableProps.onPageChange === "function") {
            tableProps.onPageChange(1);
          }
          fetchTransactionHistory(
            pageSize,
            0,
            columnName,
            sortOrder,
            searchKeyword,
            isGlobalSearchVal,
            searchFilter,
            { force: true },
            scopeOverrides
          );
          return;
        }

        // Group flat log rows into parent + sub_items hierarchy
        const grouped = groupTransactionLogs(rawList);

        setDisplayData(grouped);
        if (expandAllRef.current) {
          setExpandedRowIds(new Set(grouped.map((r) => r.id)));
        } else {
          setExpandedRowIds(new Set());
        }
        if (tableProps.setTotalRecords) tableProps.setTotalRecords(totalCount);
        if (typeof tableProps.onPageChange === "function" && Number(pageNumber) === 0) {
          tableProps.onPageChange(1);
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          console.error("Error fetching Transaction History:", err);
          showToast("Failed to load Transaction History", "error");
        }
        setDisplayData([]);
      } finally {
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    },
    [setDisplayData, tableProps, showToast, filterPartCode, fromDate, toDate]
  );

  const handleQueryChange = useCallback(
    (q) => {
      try {
        const isAll =
          q?.isAll ||
          q?.pageSize === "all" ||
          (![25, 50, 100, 200].includes(Number(q?.pageSize)) && Number(q?.pageSize) > 0);

        const pageSizeForTable = isAll ? "all" : (Number(q?.pageSize) || 25);
        const pageSizeForFetch = isAll ? "all" : (Number(q?.pageSize) || 25);
        const pageNumber0 = Math.max(0, Number(q?.pageNumber) || 0);
        const columnName = String(q?.columnName || "");
        const isGlobalSearchVal = Number(q?.isGlobalSearch) === 1 ? 1 : 0;
        const sortOrder = String(q?.sortOrder || "");
        const searchKeyword = String(q?.searchKeyword || "");
        const searchFilter = Array.isArray(q?.searchFilter) ? q.searchFilter : [];

        if (typeof tableProps.onPageSizeChange === "function") tableProps.onPageSizeChange(pageSizeForTable);
        if (typeof tableProps.onPageChange === "function") tableProps.onPageChange(pageNumber0 + 1);
        if (typeof tableProps.setSearchTerm === "function")
          tableProps.setSearchTerm(isGlobalSearchVal === 1 ? searchKeyword : "");

        let finalSearchFilter = searchFilter;
        let finalColumnName = columnName;
        let finalSearchKeyword = searchKeyword;

        if (isGlobalSearchVal === 1) {
          finalSearchFilter = searchKeyword?.trim()
            ? [{ columnName: columnName || "item_code", searchKeyword, sortOrder: "", columnSequence: 1 }]
            : [];
          finalColumnName = columnName || "item_code";
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

        fetchTransactionHistory(
          pageSizeForFetch, pageNumber0, finalColumnName, sortOrder,
          finalSearchKeyword, isGlobalSearchVal, finalSearchFilter
        );
      } catch (e) {
        console.error("Failed to handle query payload", e);
      }
    },
    [fetchTransactionHistory, tableProps]
  );

  // ── Generate Report Handler ──────────────────────────────────────────────────
  const handleGenerateReport = useCallback(() => {
    if (!fromDate || !toDate) {
      showToast("From Date and To Date are mandatory.", "error");
      return;
    }

    if (fromDate > today || toDate > today) {
      showToast("Future dates are not allowed.", "error");
      return;
    }

    if (toDate < fromDate) {
      showToast("To Date cannot be earlier than From Date.", "error");
      return;
    }

    const isAll =
      tableProps.pageSize === "all" ||
      (![25, 50, 100, 200].includes(Number(tableProps.pageSize)) && Number(tableProps.pageSize) > 0);

    const activePageSize = isAll ? "all" : (Number(tableProps.pageSize) || 25);
    if (isAll && tableProps.onPageSizeChange) {
      tableProps.onPageSizeChange("all");
    }

    const currentPage = Number(tableProps.currentPage) || 1;
    const targetPage0 = isAll ? 0 : Math.max(0, currentPage - 1);

    fetchTransactionHistory(activePageSize, targetPage0, "", "", "", 0, [], { force: true });
  }, [fetchTransactionHistory, tableProps, showToast, fromDate, toDate, today]);

  const handleClearFilterPartCode = useCallback(() => {
    setFilterPartCode("");
    if (typeof tableProps.onPageChange === "function") {
      tableProps.onPageChange(1);
    }
    const isAll =
      tableProps.pageSize === "all" ||
      (![25, 50, 100, 200].includes(Number(tableProps.pageSize)) && Number(tableProps.pageSize) > 0);
    const activePageSize = isAll ? "all" : (Number(tableProps.pageSize) || 25);
    fetchTransactionHistory(activePageSize, 0, "", "", "", 0, [], { force: true }, { partCode: "" });
  }, [fetchTransactionHistory, tableProps]);

  const handlePrint = useCallback((e) => {
    if (e?.currentTarget) {
      e.currentTarget.blur();
      e.currentTarget.style.backgroundColor = "";
    }
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    // Clear any row selection so no blue highlight or border appears in print
    if (tableRef.current?.clearSelectedRow) {
      tableRef.current.clearSelectedRow();
    }
    setSelectedChildId(null);

    // Call window.print directly - layout is handled cleanly by @media print CSS
    setTimeout(() => {
      window.print();
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    }, 50);
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchTransactionHistory(25, 0, "", "", "", 0, [], { force: true });
  }, [fetchTransactionHistory]);

  // ── Render Sub-Row callback (Item Code column empty for sub-rows) ────────────
  const renderSubRow = useCallback(
    (row) => {
      if (!expandedRowIds.has(row.id)) return null;
      const subItems = row.sub_items || [];

      return subItems.map((sub, i) => {
        const subKey = sub.log_id != null ? `sub-${sub.log_id}` : `sub-${row.id}-${i}`;
        const isSelected = selectedChildId === subKey;

        return (
          <tr
            key={subKey}
            className={`sub-item-row th-sub-item-row ${isSelected ? "selected" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectChildRow(subKey);
            }}
            style={{
              height: "32px",
              backgroundColor: isSelected ? "#e3f2fd" : "#f8fafc",
              borderLeft: isSelected ? "1px solid #1677ff" : "none",
              borderBottom: "1px solid #e2e8f0",
              cursor: "pointer",
            }}
          >
            {/* Empty cell for Expand Action column in expanded sub-rows (no icon) */}
            <td style={{ padding: "0.10rem 0.5rem", textAlign: "center" }}></td>
            {/* Empty cell for Item Code in expanded sub-rows */}
            <td style={{ padding: "0.10rem 0.5rem" }}></td>
            <td style={{ padding: "0.10rem 0.5rem", textAlign: "center" }}>
              {formatDate(sub.transaction_date) || sub.transaction_date}
            </td>
            <td style={{ padding: "0.10rem 0.5rem", textAlign: "left" }}>
              {(() => {
                const s = sub.transaction_details == null ? "" : String(sub.transaction_details);
                const isLong = s.length > 50;
                const shown = isLong ? s.slice(0, 50) + "…" : s;
                return (
                  <span
                    title={isLong ? s : undefined}
                    style={{
                      display: "inline-block",
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {shown}
                  </span>
                );
              })()}
            </td>
            <td style={{ padding: "0.10rem 0.5rem", textAlign: "right" }}>
              {sub.decrease != null ? (
                <span>{formatStockQuantity(sub.decrease, sub.unit || row.unit)}</span>
              ) : (
                ""
              )}
            </td>
            <td style={{ padding: "0.10rem 0.5rem", textAlign: "right" }}>
              {sub.increase != null ? (
                <span>{formatStockQuantity(sub.increase, sub.unit || row.unit)}</span>
              ) : (
                ""
              )}
            </td>
            <td style={{ padding: "0.10rem 0.5rem", textAlign: "right" }}>
              {sub.balance_stock != null ? (
                <span>{formatStockQuantity(sub.balance_stock, sub.unit || row.unit)}</span>
              ) : (
                ""
              )}
            </td>
            <td style={{ padding: "0.10rem 0.5rem", textAlign: "center" }}>
              {sub.unit || row.unit || ""}
            </td>
          </tr>
        );
      });
    },

    [expandedRowIds, selectedChildId, handleSelectChildRow]
  );

  // ── Custom Header Search Controls (Item Code + Compact Dates) ────────────────
  const customSearchControls = (
    <div className="d-flex align-items-center gap-2 flex-wrap table-custom-filters th-custom-filters" style={{ fontSize: "12px" }}>
      {/* 1. Item Code Search Field */}
      <div className="d-flex align-items-center gap-1 filter-item-code-group th-filter-item-code-group">
        <label style={{ fontWeight: 600, color: "#475569", marginBottom: 0, whiteSpace: "nowrap" }}>
          Item Code:
        </label>
        <div className="input-icon" style={{ position: "relative" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            fill="currentColor"
            viewBox="0 0 16 16"
            style={{
              position: "absolute",
              top: "50%",
              left: "8px",
              transform: "translateY(-50%)",
              color: "#6c757d",
              pointerEvents: "none",
            }}
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85zm-5.242 1.156a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
          </svg>
          <input
            type="text"
            className="form-control form-control-sm"
            aria-label="Search Item Code"
            value={filterPartCode}
            onChange={(e) => setFilterPartCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleGenerateReport();
              }
            }}
            placeholder="Search..."
            style={{
              width: "130px",
              height: "30px",
              paddingLeft: "26px",
              paddingRight: filterPartCode ? "24px" : "8px",
              fontSize: "12px",
              borderRadius: "6px",
            }}
          />
          {filterPartCode && (
            <button
              type="button"
              onClick={handleClearFilterPartCode}
              style={{
                position: "absolute",
                top: "50%",
                right: "6px",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "#94a3b8",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Clear"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 2. From Date (Compact Width - Mandatory, Cannot Clear, Max Today) */}
      <div className="d-flex align-items-center gap-1 filter-date-group th-filter-date-group">
        <label style={{ fontWeight: 600, color: "#475569", marginBottom: 0, whiteSpace: "nowrap" }}>
          From:
        </label>
        <input
          type="date"
          required
          max={today}
          className="form-control form-control-sm px-1"
          value={fromDate}
          onChange={(e) => {
            const selectedVal = e.target.value;
            if (!selectedVal) {
              e.target.value = fromDate;
              return;
            }
            if (selectedVal > today) {
              showToast("Future dates are not allowed.", "error");
              e.target.value = fromDate;
              return;
            }
            if (toDate && selectedVal > toDate) {
              showToast("From Date cannot be later than To Date.", "error");
              e.target.value = fromDate;
              return;
            }
            setFromDate(selectedVal);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" || e.key === "Delete") {
              e.preventDefault();
            }
          }}
          style={{ width: "128px", minWidth: "125px", height: "30px", fontSize: "12px", borderRadius: "6px" }}
        />
      </div>

      {/* 3. To Date (Compact Width - Mandatory, Cannot Clear, Max Today) */}
      <div className="d-flex align-items-center gap-1 filter-date-group th-filter-date-group">
        <label style={{ fontWeight: 600, color: "#475569", marginBottom: 0, whiteSpace: "nowrap" }}>
          To:
        </label>
        <input
          type="date"
          required
          max={today}
          className="form-control form-control-sm px-1"
          value={toDate}
          onChange={(e) => {
            const selectedVal = e.target.value;
            if (!selectedVal) {
              e.target.value = toDate;
              return;
            }
            if (selectedVal > today) {
              showToast("Future dates are not allowed.", "error");
              e.target.value = toDate;
              return;
            }
            if (fromDate && selectedVal < fromDate) {
              showToast("To Date cannot be earlier than From Date.", "error");
              e.target.value = toDate;
              return;
            }
            setToDate(selectedVal);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" || e.key === "Delete") {
              e.preventDefault();
            }
          }}
          style={{ width: "128px", minWidth: "125px", height: "30px", fontSize: "12px", borderRadius: "6px" }}
        />
      </div>

      {/* 4. Generate Button */}
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={handleGenerateReport}
        style={{
          height: "30px",
          padding: "0 8px",
          fontSize: "12px",
          fontWeight: 600,
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          backgroundColor: "rgb(122, 75, 120)",
          borderColor: "rgb(122, 75, 120)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
        title="Generate Report"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        Generate
      </button>
    </div>
  );

  return (
    <div
      className="transaction-history-wrapper"
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >

      {loading && <Loader />}

      <main
        className="p-1"
        style={{
          flex: "1 1 0%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Printable Header (Appears ONLY during printing) */}
        <div className="print-only-header th-print-only-header">
          <div style={{ textAlign: "center", marginBottom: "6px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", textTransform: "uppercase", color: "#000" }}>
              INSPIRE MAGNETICS
            </h2>
            <h4 style={{ margin: "3px 0 0 0", fontSize: "13px", fontWeight: "bold", color: "#000" }}>
              TRANSACTION HISTORY REPORT
            </h4>
          </div>
          <table
            className="print-header-table th-print-header-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #000",
              marginTop: "6px",
              marginLeft: "auto",
              marginRight: "auto",
              tableLayout: "fixed",
              boxSizing: "border-box",
            }}
          >
            <tbody>
              <tr>
                <td style={{ width: "30%", textAlign: "left", padding: "3px 6px", fontSize: "7.5pt", border: "1px solid #000", color: "#000" }}>
                  <strong>Item Code Filter:</strong> {displayedItemCodeFilter}
                </td>
                <td style={{ width: "40%", textAlign: "center", padding: "3px 6px", fontSize: "7.5pt", border: "1px solid #000", color: "#000" }}>
                  <strong>Date Range:</strong> {formatDate(fromDate) || "All"} To {formatDate(toDate) || "All"}
                </td>
                <td style={{ width: "30%", textAlign: "right", padding: "3px 6px", fontSize: "7.5pt", border: "1px solid #000", color: "#000", whiteSpace: "nowrap" }}>
                  <strong>Printed On:</strong> {formatDate(getCurrentDate())} {getCurrentTime()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          onClick={(e) => {
            const tr = e.target.closest("tr");
            if (tr && !tr.classList.contains("sub-item-row") && !tr.closest("thead")) {
              setSelectedChildId(null);
            }
          }}
        >
          <DynamicSortableTable
            fixedFirstColumn={true}
            ref={tableRef}
            columns={columns}
            data={displayData}
            onQueryChange={handleQueryChange}
            title="Transaction History"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
              </svg>
            }
            showGlobalSearch={false}
            disableSearch={false}
            disableSorting={true}
            autoSelectFirstRow={true}
            currentPage={tableProps.currentPage}
            pageSize={tableProps.pageSize}
            totalRecords={tableProps.totalRecords}
            showDisplayAll={false}
            customSearchControls={customSearchControls}
            renderContext={{
              expandedRowIds,
              toggleRowExpand,
              onParentRowClick: () => setSelectedChildId(null),
            }}
            renderSubRow={renderSubRow}
          />
        </div>
      </main>

      {/* ── Floating Bottom Action Bar for Print (PDF Viewer Style) ── */}
      <div
        className="no-print th-floating-print-bar"
        style={{
          position: "fixed",
          bottom: "42px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#1e293b",
          color: "#ffffff",
          borderRadius: "30px",
          padding: "6px 20px",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.35)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          zIndex: 1050,
          backdropFilter: "blur(4px)",
        }}
      >
        <button
          type="button"
          onClick={handlePrint}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "13px",
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: "16px",
            transition: "all 0.2s ease",
          }}


          title="Print Transaction History Report"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Report
        </button>
      </div>
    </div>
  );
}
