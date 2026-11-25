import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from "react";
import ReactDOM from "react-dom";
import { NavLink } from "react-router-dom";
import { ConfirmDialog } from "./Notification";
import Loader from "./Loader";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useNewRowAutofocus } from "../hooks/useNewRowAutofocus";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
// columns: [{ key: 'name', label: 'Name', render?: (row) => ... }]
// data: array of objects
const InlineEditableTable = forwardRef(function InlineEditableTable(
  {
    columns,
    data,
    icon,
    title,
    onSave,
    // When true, after a successful save, newly added rows are inserted at the top of the table UI
    insertNewRowsAtTopOnSuccess = true,
    getActions,
    repOptions = [],
    statusOptions,
    applicableForOptions,
    loading,
    onRefresh,
    showAddButton = true,
    onSaveSuccess,
    fixedFirstColumn = false,
    hideActionsDropdown = false,
    canAdd = true,
    canEdit = true,
    // Validation: show inline messages and/or provide custom validator
    showValidation = false,
    validateCell,
    validationTrigger = "onSave", // 'always' | 'onSave'
    tabId,
    footerContent,
    hideHeader = false,
    showTitle = true,
    showPagination = true,
    // Disable options similar to SortableTable
    disableSearch = false,
    disablePagination = false,
    disableColumnFilters = false,
    disableSorting = false,
    autoSelectFirstRow = true,
    // New: allow parent to inject extra header buttons right after + icon
    afterAddButtons = null,
    // Optional existing slot for right-side widgets
    printMenu,
    // When adding a new row, focus this column key; falls back to first editable
    newRowFocusKey,
    // Optional: callback when a row is clicked
    onRowClick,
  },
  ref
) {
  const [showNothingToSaveDialog, setShowNothingToSaveDialog] = useState(false);
  const [tableData, setTableData] = useState(data);
  // Track where new rows should be inserted (for current page insertion)
  const pendingInsertionRef = useRef(null);
  // Track previous data length to detect parent insertions
  const prevDataLengthRef = useRef(data.length);

  React.useEffect(() => {
    // Check if parent has already inserted the rows
    // If pendingInsertionRef exists but data already contains those rows (with IDs),
    // parent handled the insertion via updateDataWithNewRowIds, so just sync tableData
    if (pendingInsertionRef.current) {
      const { rows: pendingRows, insertIndex } = pendingInsertionRef.current;
      const prevLength = prevDataLengthRef.current;
      const currentLength = data.length;

      // Check if parent inserted rows by comparing data length
      // If data increased by the number of pending rows, parent inserted them
      const dataLengthIncrease = currentLength - prevLength;
      const hasDataIncrease = dataLengthIncrease >= pendingRows.length;

      // Also check if any pending rows match rows in new data by comparing unique identifiers
      // IMPORTANT: Match by ID first (most reliable), and ensure we match the correct row
      // CRITICAL: Only match pending rows that don't have IDs yet to rows in data that have IDs
      // This prevents matching the wrong row when saving sequentially
      const matchesPending = pendingRows.some(pendingRow => {
        // Check if pending row has an ID - if it does, it shouldn't be in pendingInsertionRef
        const pendingHasId = pendingRow.hs_code_id ||
          (pendingRow.data && typeof pendingRow.data === 'number') ||
          pendingRow.division_id ||
          pendingRow.target_id ||
          pendingRow.platingSNo ||
          pendingRow.id;

        // If pending row already has an ID, something went wrong - don't match it
        if (pendingHasId) return false;

        return data.some(dataRow => {
          // Match by ID if available (most reliable)
          // Check all common ID fields to ensure we match correctly
          // IMPORTANT: Only match if dataRow has an ID (meaning it was just inserted by parent)
          const dataHasId = dataRow.hs_code_id ||
            (dataRow.data && typeof dataRow.data === 'number') ||
            dataRow.division_id ||
            dataRow.target_id ||
            dataRow.platingSNo ||
            dataRow.id;

          // Only try to match if dataRow has an ID (it was just inserted)
          if (dataHasId) {
            // Don't match by ID here - pending row doesn't have ID yet
            // Instead, match by content to find the corresponding row
            // But be very careful to avoid false matches

            // Match by unique content combination
            // Only match if content is very similar (to avoid false matches)
            if (pendingRow.main_category && dataRow.main_category &&
              pendingRow.main_category === dataRow.main_category &&
              String(pendingRow.sub_category || '') === String(dataRow.sub_category || '')) return true;
            if (pendingRow.division_name && dataRow.division_name &&
              String(pendingRow.division_name).trim() === String(dataRow.division_name).trim()) return true;
            if (pendingRow.login_id && dataRow.login_id &&
              pendingRow.login_id === dataRow.login_id &&
              String(pendingRow.target_value || '') === String(dataRow.target_value || '')) return true;

            // For GST Master, match by text and rate
            if (pendingRow.text && dataRow.text &&
              String(pendingRow.text).trim() === String(dataRow.text).trim() &&
              String(pendingRow.rate || '') === String(dataRow.rate || '')) return true;

            // For HS Code, match by main_category and sub_category
            if (pendingRow.main_category && dataRow.main_category &&
              String(pendingRow.main_category).trim() === String(dataRow.main_category).trim() &&
              String(pendingRow.sub_category || '') === String(dataRow.sub_category || '')) return true;

            // For Metal Master, match by platingName (unique identifier)
            if (pendingRow.platingName && dataRow.platingName &&
              String(pendingRow.platingName).trim() === String(dataRow.platingName).trim()) return true;
          }

          return false;
        });
      });

      // If we detect that parent likely inserted (either by length increase or by matching content),
      // treat it as handled to avoid double-insertion and duplicates.
      if (hasDataIncrease || matchesPending) {
        // Parent already inserted via updateDataWithNewRowIds, just sync (no duplicate insertion)
        pendingInsertionRef.current = null;
        setTableData(data);
      } else {
        // Parent didn't insert, apply our insertion (for backward compatibility)
        pendingInsertionRef.current = null;

        setTableData((prev) => {
          if (!Array.isArray(prev)) return pendingRows;
          // Insert at the calculated position
          return [
            ...prev.slice(0, insertIndex),
            ...pendingRows,
            ...prev.slice(insertIndex)
          ];
        });
      }
    } else {
      // Normal update from parent
      setTableData(data);
    }

    // Update ref for next comparison
    prevDataLengthRef.current = data.length;
  }, [data]);
  // Remove editingRows state and logic, always render all rows in edit mode
  const [newRows, setNewRows] = useState([]); // array of new row objects
  const [editBuffer, setEditBuffer] = useState({}); // {rowIdx: {colKey: value}}
  const [globalSearch, setGlobalSearch] = useState("");
  const [columnSearch, setColumnSearch] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [, setLastNumericPerPage] = useState(25);
  const [openFilter, setOpenFilter] = useState(null);
  const filterInputRef = useRef(null);
  // For SortableTable-like filter card positioning
  const filterBtnRefs = useRef({});
  const [filterPos, setFilterPos] = useState({
    left: 0,
    top: 0,
    direction: "down",
    arrowLeft: 20,
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const actionBtnRefs = useRef({});
  const [dropdownPlacement, setDropdownPlacement] = useState("down"); // 'down' | 'up'
  const [selectedRow, setSelectedRow] = useState(null); // Add selected row state
  const [anyDropdownOpen, setAnyDropdownOpen] = useState(false); // Track any dropdown state
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [pageInputValue, setPageInputValue] = useState("1"); // Add state for page input
  // Track which action requested confirmation: 'refresh' | 'cancel'
  const [confirmAction, setConfirmAction] = useState(null);
  // Dynamic scroll container sizing
  const tableScrollRef = useRef(null);
  const [scrollMaxHeight, setScrollMaxHeight] = useState(null);
  const [minibarHeight, setMinibarHeight] = useState(0);
  const footerRef = useRef(null);
  const [footerHeight, setFooterHeight] = useState(0);
  // State to track if the user has manually set the perPage
  const [userManuallySetPerPage, setUserManuallySetPerPage] = useState(false);
  // Ref to track if we just refreshed (so we can auto-select first row)
  const justRefreshedRef = React.useRef(false);
  // Show validation messages only after user attempts to save (when validationTrigger === 'onSave')
  const [didAttemptSave, setDidAttemptSave] = useState(false);
  // Track which rows should display validation after a save attempt
  const [rowsMarkedForValidation, setRowsMarkedForValidation] = useState({
    new: new Set(),
    edit: new Set(),
  });
  // Suppress validation rendering while a save is in progress (component-level)
  const [isSavingInternal, setIsSavingInternal] = useState(false);

  // Reuse external hook for new row autofocus
  const { focusNewRowField } = useNewRowAutofocus(
    tableScrollRef,
    columns,
    newRowFocusKey
  );

  // Display text with ellipsis and show tooltip only when visually truncated
  const EllipsisWithTooltip = React.useCallback(function EllipsisWithTooltip({ text, style }) {
    const spanRef = React.useRef(null);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const checkOverflow = React.useCallback(() => {
      try {
        const el = spanRef.current;
        if (!el) return;
        const overflowing = el.scrollWidth > el.clientWidth;
        setShowTooltip(overflowing);
      } catch {
        /* noop */
      }
    }, []);
    React.useEffect(() => {
      checkOverflow();
      let ro;
      try {
        if (window.ResizeObserver) {
          ro = new window.ResizeObserver(checkOverflow);
          if (spanRef.current) ro.observe(spanRef.current);
        }
      } catch {
        /* noop */
      }
      window.addEventListener("resize", checkOverflow);
      return () => {
        try {
          if (ro) ro.disconnect();
        } catch {
          /* noop */
        }
        window.removeEventListener("resize", checkOverflow);
      };
    }, [checkOverflow]);
    return (
      <span
        ref={spanRef}
        title={showTooltip ? (text == null ? "" : String(text)) : undefined}
        style={{
          display: "inline-block",
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          ...style,
        }}
      >
        {text == null ? "" : String(text)}
      </span>
    );
  }, []);

  // Smoothly scroll container to the first visible validation message
  const scrollToFirstValidationMessage = React.useCallback(() => {
    try {
      const container = tableScrollRef.current;
      if (!container) return;
      const msg = container.querySelector(".iet-validation-msg");
      if (msg && typeof msg.scrollIntoView === "function") {
        msg.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch {
      /* noop */
    }
  }, []);

  // Keep didAttemptSave true until an explicit successful save, so other
  // fields' messages remain visible while editing a single field

  React.useEffect(() => {
    const getMinibarHeight = () => {
      try {
        const el = document.getElementById("tab-global-minibar");
        return el ? el.offsetHeight : 0;
      } catch {
        return 0;
      }
    };
    const calculateMaxHeight = () => {
      const node = tableScrollRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const viewportH =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const basePaddingBottom = 12; // spacing inside card
      const minibarH = getMinibarHeight() || 44; // reserve space above GlobalMinibar
      setMinibarHeight(minibarH);
      const h = Math.max(
        200,
        viewportH - rect.top - basePaddingBottom - minibarH + 10
      );
      setScrollMaxHeight(h);
    };
    calculateMaxHeight();
    window.addEventListener("resize", calculateMaxHeight);
    let ro;
    if (window.ResizeObserver) {
      const parent = tableScrollRef.current?.parentElement;
      if (parent) {
        ro = new window.ResizeObserver(calculateMaxHeight);
        ro.observe(parent);
      }
    }
    // Also observe minibar height changes
    let minibarObserver;
    const minibarEl = document.getElementById("tab-global-minibar");
    if (minibarEl && window.ResizeObserver) {
      minibarObserver = new window.ResizeObserver(calculateMaxHeight);
      minibarObserver.observe(minibarEl);
    }
    return () => {
      window.removeEventListener("resize", calculateMaxHeight);
      if (ro) ro.disconnect();
      if (minibarObserver) minibarObserver.disconnect();
    };
  }, []);

  // Measure sticky footer height and keep it updated
  React.useEffect(() => {
    const measure = () => {
      try {
        const h = footerRef.current ? footerRef.current.offsetHeight : 0;
        setFooterHeight(h || 0);
      } catch {
        setFooterHeight(0);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    let ro;
    if (window.ResizeObserver && footerRef.current) {
      ro = new window.ResizeObserver(measure);
      ro.observe(footerRef.current);
    }
    return () => {
      window.removeEventListener("resize", measure);
      if (ro) ro.disconnect();
    };
  }, [footerContent]);

  // Normalizer to ignore diacritics and non-alphanumeric characters
  const normalizeText = (val) =>
    String(val ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics
      .replace(/[^a-z0-9]/gi, ""); // remove non-alphanumerics

  // Helper for CGST/SGST/IGST calculation
  function calculatePercentages(rate, applicableFor) {
    let cgst = 0,
      sgst = 0,
      igst = 0;
    if (applicableFor === "L") {
      cgst = +(rate / 2).toFixed(2);
      sgst = +(rate / 2).toFixed(2);
      igst = 0;
    } else if (applicableFor === "I") {
      cgst = 0;
      sgst = 0;
      igst = +rate.toFixed(2);
    }
    return { cgstPercentage: cgst, sgstPercentage: sgst, igstPercentage: igst };
  }

  // Helper to reset table UI state
  function resetTableUI() {
    if (!disableSearch) setGlobalSearch("");
    if (!disableColumnFilters) setColumnSearch({});
    if (!disableSorting) setSortConfig({ key: null, direction: "asc" });
    if (!disablePagination) {
      setCurrentPage(1);
      setPerPage(25);
    }
    setNewRows([]);
    setEditBuffer({});
    setSelectedRow(null); // Clear selected row on reset
    setDidAttemptSave(false);
    // Clear pending insertion ref to prevent conflicts when refreshing
    // This ensures that any pending row insertions are cleared on refresh
    pendingInsertionRef.current = null;
    // Allow initial page-size rule to run again after refresh
    try {
      didSetInitialPageSizeRef.current = false;
    } catch {
      // Ignore errors when resetting ref
    }
  }

  // Expose refresh method
  useImperativeHandle(ref, () => ({
    refresh: resetTableUI,
    clearDirtyState: () => {
      setNewRows([]);
      setEditBuffer({});
    },
    clearSelectedRow: () => setSelectedRow(null),
    getSelectedRow: () =>
      selectedRow !== null ? paginatedData[selectedRow] : null,
    getSelectedRowIndex: () => selectedRow,
    getCurrentPage: () => currentPage,
    hasUnsavedChanges: () => hasUnsavedChanges(),
    getPerPage: () => perPage,
    getInsertIndex: () => {
      // Calculate insertion index based on current page
      if (!disablePagination && perPage !== "all" && typeof perPage === "number") {
        return (currentPage - 1) * perPage;
      }
      return 0;
    },
  }));

  // Helper to check for unsaved changes
  const hasUnsavedChanges = React.useCallback(() => {
    // Treat any new rows or any edits buffered as dirty
    if (newRows.length > 0) return true;
    if (Object.keys(editBuffer).length > 0) return true;
    return false;
  }, [newRows.length, editBuffer]);

  // Custom refresh handler with unsaved changes confirmation
  const handleTableRefresh = () => {
    if (hasUnsavedChanges()) {
      setConfirmAction("refresh");
      setShowUnsavedConfirm(true);
    } else {
      if (typeof onRefresh === "function") {
        onRefresh();
      }
      resetTableUI();
      // Note: First row selection after refresh is handled by useEffect watching tableData
    }
  };

  // Helper to get the search value for a column
  const getSearchValue = (col, row) => {
    if (typeof col.getSearchValue === "function")
      return col.getSearchValue(row);
    return row[col.key];
  };

  // Filtered and sorted data - optimized for performance
  const filteredData = React.useMemo(() => {
    let result = tableData;

    // If search and filters are disabled, return original data
    if (disableSearch && disableColumnFilters) {
      return result;
    }

    // Apply column-specific search (only if not disabled)
    if (!disableColumnFilters) {
      const columnSearchEntries = Object.entries(columnSearch);
      if (columnSearchEntries.length > 0) {
        result = result.filter((row) => {
          return columnSearchEntries.every(([key, value]) => {
            if (!value || value.length < 3) return true;
            const colDef = (columns || []).find((c) => c.key === key) || {};
            const cell = String(getSearchValue(colDef, row) ?? "");
            const query = String(value ?? "");
            if (colDef.ignoreSpecial) {
              return normalizeText(cell).includes(normalizeText(query));
            }
            return cell.toLowerCase().includes(query.toLowerCase());
          });
        });
      }
    }

    // Apply global search (only if not disabled)
    if (!disableSearch && globalSearch) {
      const normalizedQuery = normalizeText(globalSearch);
      result = result.filter((row) => {
        for (const col of columns) {
          const val = getSearchValue(col, row);
          if (
            (typeof val === "string" || typeof val === "number") &&
            normalizeText(val).includes(normalizedQuery)
          ) {
            return true;
          }
        }
        return false;
      });
    }

    return result;
  }, [tableData, columnSearch, globalSearch, columns, disableSearch, disableColumnFilters]);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData;
    const compareValues = (aVal, bVal) => {
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return -1;
      if (bVal == null) return 1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal - bVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return aStr.localeCompare(bStr, undefined, { sensitivity: "base" });
    };
    const sorted = [...filteredData].sort((a, b) => {
      // Find the column definition to check if it has a sortValue function
      const colDef = columns.find((col) => col.key === sortConfig.key);
      let aVal, bVal;

      if (colDef && typeof colDef.sortValue === "function") {
        // Use the custom sortValue function if available
        aVal = colDef.sortValue(a);
        bVal = colDef.sortValue(b);
      } else {
        // Fall back to direct property access
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];
      }

      const cmp = compareValues(aVal, bVal);
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredData, sortConfig, columns]);

  const total = sortedData.length;
  const totalPages = disablePagination
    ? 1
    : perPage === "all"
      ? 1
      : Math.ceil(total / perPage);
  const paginatedData = React.useMemo(() => {
    if (disablePagination || perPage === "all") return sortedData;
    const start = (currentPage - 1) * perPage;
    return sortedData.slice(start, start + perPage);
  }, [sortedData, currentPage, perPage, disablePagination]);

  // Decide initial page size ONCE: if total (after load) is < 25 -> "All"; else keep default 25
  const didSetInitialPageSizeRef = React.useRef(false);
  React.useEffect(() => {
    if (disablePagination) return;
    if (didSetInitialPageSizeRef.current) return;
    if (total > 0) {
      if (total < 25 && perPage !== "all") {
        setPerPage("all");
        setCurrentPage(1);
      }
      didSetInitialPageSizeRef.current = true;
    }
  }, [total, perPage, disablePagination]);

  // Reset to page 1 on search or perPage change
  React.useEffect(() => {
    if (!disablePagination) {
      setCurrentPage(1);
      setPageInputValue("1");
    }
  }, [globalSearch, perPage, disablePagination]);

  // Reset manual flag when search changes to allow auto-adjustment
  React.useEffect(() => {
    setUserManuallySetPerPage(false);
  }, [globalSearch, columnSearch]);

  // Auto-adjust page size based on search results (only if user hasn't manually set it)
  React.useEffect(() => {
    if (disablePagination) return;
    if (userManuallySetPerPage) return;

    // When there are zero results, force "all" and reset to page 1 so UI shows 0 records clearly
    if (total === 0) {
      if (perPage !== "all") setPerPage("all");
      setCurrentPage(1);
      return;
    }

    if (total > 0) {
      const hasSearch =
        globalSearch ||
        Object.keys(columnSearch).some(
          (key) => columnSearch[key] && columnSearch[key].length >= 3
        );
      if (hasSearch) {
        if (total <= 25 && perPage !== "all") {
          setPerPage("all");
          setCurrentPage(1);
        } else if (total > 25 && perPage === "all") {
          setPerPage(25);
          setCurrentPage(1);
        }
      } else {
        if (total < 25 && perPage !== "all") {
          setPerPage("all");
          setCurrentPage(1);
        } else if (total >= 25 && perPage === "all") {
          setPerPage(25);
          setCurrentPage(1);
        }
      }
    }
  }, [total, globalSearch, columnSearch, perPage, userManuallySetPerPage, disablePagination]);

  // Also reset to page 1 when column filters change to ensure results are visible
  React.useEffect(() => {
    if (!disablePagination) {
      setCurrentPage(1);
      setPageInputValue("1");
    }
  }, [columnSearch, disablePagination]);

  // Scroll to top when page changes
  React.useEffect(() => {
    if (!disablePagination && tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0;
    }
  }, [currentPage, disablePagination]);

  // Update page input value when currentPage changes
  React.useEffect(() => {
    if (!disablePagination) {
      setPageInputValue(currentPage.toString());
    }
  }, [currentPage, disablePagination]);

  // Scroll to top when search inputs change (global or column filters)
  // Use rAF and a micro-timeout to ensure it runs after layout settles
  React.useEffect(() => {
    const node = tableScrollRef.current;
    if (!node) return;
    const scrollTopNow = () => {
      try {
        node.scrollTop = 0;
      } catch {
        /* noop */
      }
    };
    scrollTopNow();
    const raf = window.requestAnimationFrame(scrollTopNow);
    const t = setTimeout(scrollTopNow, 0);
    return () => {
      try {
        window.cancelAnimationFrame(raf);
      } catch {
        /* noop */
      }
      clearTimeout(t);
    };
  }, [globalSearch, columnSearch, filteredData.length]);

  // Clear selection and close dropdown when pagination changes
  React.useEffect(() => {
    if (!disablePagination) {
      setOpenDropdown(null);
      if (autoSelectFirstRow && paginatedData.length > 0) {
        setSelectedRow(0);
      } else {
        setSelectedRow(null);
      }
    }
  }, [currentPage, perPage, disablePagination, autoSelectFirstRow, paginatedData.length]);

  // Auto-select first row on initial data load or after refresh if enabled
  React.useEffect(() => {
    if (autoSelectFirstRow && paginatedData.length > 0 && selectedRow === null) {
      setSelectedRow(0);
    }
  }, [autoSelectFirstRow, paginatedData.length, tableData, selectedRow]);

  // Add new row
  const handleAddNew = () => {
    const nextIndex = newRows.length;
    setNewRows([...newRows, { _suppressValidationUntilNextAttempt: true }]);
    // After adding, scroll the current page to its start (top of the table area)
    try {
      const node = tableScrollRef.current;
      if (node) {
        // Defer to next frame so the DOM reflects the new row before scrolling
        requestAnimationFrame(() => {
          try {
            node.scrollTo({ top: 0, behavior: "smooth" });
          } catch {
            node.scrollTop = 0;
          }
          // After ensuring DOM update frame, also try focusing desired field
          try {
            requestAnimationFrame(() => {
              try { focusNewRowField(nextIndex); } catch { }
            });
          } catch { }
        });
      }
    } catch {
      /* noop */
    }
  };

  // Handle input change
  const handleInputChange = (recordKey, colKey, value, isNew = false) => {
    if (isNew) {
      const updated = [...newRows];
      updated[recordKey][colKey] = value;
      setNewRows(updated);
      return;
    }
    // For existing rows, avoid marking dirty if value is semantically unchanged
    setEditBuffer((prev) => {
      const originalRow = tableData && tableData[recordKey] ? tableData[recordKey] : undefined;
      const originalVal = originalRow ? originalRow[colKey] : undefined;
      const prevRowEdits = prev[recordKey] || {};
      const prevEditedVal = Object.prototype.hasOwnProperty.call(prevRowEdits, colKey)
        ? prevRowEdits[colKey]
        : undefined;

      // ----- PATCH: Always compare as strings so text entry works -----
      const eq = (a, b) => {
        // Commented Because it should allow space
        // const sa = a === undefined || a === null ? '' : String(a).trim();
        // const sb = b === undefined || b === null ? '' : String(b).trim();

        const sa = a === undefined || a === null ? '' : String(a);
        const sb = b === undefined || b === null ? '' : String(b);
        return sa === sb;
      };
      // --------------------------------------------------------------

      // Always allow clearing
      if (value === "") {
        return {
          ...prev,
          [recordKey]: { ...prevRowEdits, [colKey]: value },
        };
      }

      // If incoming value equals the last edited value, no change
      if (eq(value, prevEditedVal)) return prev;

      // If incoming value matches the original value, remove this field from edit buffer
      if (eq(value, originalVal)) {
        if (!Object.prototype.hasOwnProperty.call(prev, recordKey)) return prev;
        const nextRow = { ...prevRowEdits };
        delete nextRow[colKey];
        if (Object.keys(nextRow).length === 0) {
          const { [recordKey]: _omit, ...rest } = prev;
          return rest;
        }
        return { ...prev, [recordKey]: nextRow };
      }

      // Otherwise, record the edit
      return {
        ...prev,
        [recordKey]: { ...prevRowEdits, [colKey]: value },
      };
    });
  };

  // Save all changes
  const handleSaveAll = React.useCallback(async () => {
    // Mark that user attempted to save so validation can be displayed when requested
    try {
      setDidAttemptSave(true);
    } catch { }
    // Newly added rows should start showing validation from this attempt onward
    try {
      setNewRows((prev) =>
        prev.map((r) => ({ ...r, _suppressValidationUntilNextAttempt: false }))
      );
    } catch {
      /* noop */
    }
    // Mark rows included in this save attempt so only they show validation
    try {
      const newIdxSet = new Set((newRows || []).map((_, idx) => idx));
      const editIdxSet = new Set(
        Object.keys(editBuffer)
          .map((k) => parseInt(k, 10))
          .filter((n) => Number.isFinite(n))
      );
      setRowsMarkedForValidation({ new: newIdxSet, edit: editIdxSet });
    } catch {
      /* noop */
    }
    // After toggling validation visibility, scroll to the first error message
    try {
      const raf = window.requestAnimationFrame(() => {
        setTimeout(scrollToFirstValidationMessage, 0);
      });
      setTimeout(() => {
        try {
          window.cancelAnimationFrame(raf);
        } catch {
          /* noop */
        }
      }, 250);
    } catch {
      /* noop */
    }
    // Helper to check if a row is empty (all values are empty string, null, or undefined)
    const isRowEmpty = (row) =>
      Object.values(row).every(
        (val) => val === "" || val === null || val === undefined
      );
    const filteredNewRows = (newRows || []).filter((row) => !isRowEmpty(row));

    // Include all rows in editBuffer, regardless of value change
    const filteredEditedRows = Object.entries(editBuffer).map(
      ([rowIdx, editedRow]) => {
        // Keys in editBuffer are stored using the GLOBAL index of tableData
        const globalIndex = parseInt(rowIdx, 10);
        return {
          ...editedRow,
          _originalRowIndex: globalIndex,
          _originalRow: tableData[globalIndex],
        };
      }
    );

    if (filteredNewRows.length === 0 && filteredEditedRows.length === 0) {
      setShowNothingToSaveDialog(true);
      return;
    }

    // Call onSave and wait for the result
    if (onSave) {
      let saveResult;
      try {
        setIsSavingInternal(true);
        saveResult = await onSave({
          newRows: filteredNewRows,
          editedRows: filteredEditedRows,
        });
      } finally {
        setIsSavingInternal(false);
      }

      // Only clear the rows if save was successful (returns true or undefined)
      if (saveResult !== false) {
        // Optionally insert newly added rows at the top for immediate visibility until next refresh
        // Note: If parent component uses updateDataWithNewRowIds, it will handle insertion
        // We only insert here if parent doesn't update (for backward compatibility)
        if (insertNewRowsAtTopOnSuccess && (filteredNewRows || []).length > 0) {
          // Calculate insertion index based on current page in the sorted/filtered data
          // This ensures rows appear at the top of the current page view
          let insertIndex = 0;
          if (!disablePagination && perPage !== "all" && typeof perPage === "number") {
            // Calculate position in sorted/filtered data that corresponds to current page
            insertIndex = (currentPage - 1) * perPage;
            // Clamp to valid range based on current tableData length
            insertIndex = Math.max(0, Math.min(insertIndex, tableData.length));
          }

          // Store insertion info for when parent updates data (via updateDataWithNewRowIds)
          // Parent will use this to insert at the correct position
          pendingInsertionRef.current = {
            rows: filteredNewRows.map((r) => ({
              ...r,
              _saved: true,
              _localKey: r._localKey || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
            })),
            insertIndex: insertIndex
          };

          // Don't insert immediately - let parent handle it via updateDataWithNewRowIds
          // This prevents duplicates. If parent doesn't call updateDataWithNewRowIds,
          // the rows will be inserted when data prop updates via useEffect

          // Ensure UI highlights the first row of the current page
          setSelectedRow(0);
        }
        setNewRows([]);
        setEditBuffer({});
        try {
          setDidAttemptSave(false);
        } catch { }
        try {
          setRowsMarkedForValidation({ new: new Set(), edit: new Set() });
        } catch {
          /* noop */
        }
        // Call onSaveSuccess callback after successful save
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      } else {
        // If save failed (likely validation), ensure we scroll to the first error
        scrollToFirstValidationMessage();
      }
      // If saveResult is false, keep the rows so user can fix validation errors
    }
  }, [
    newRows,
    editBuffer,
    currentPage,
    perPage,
    onSave,
    onSaveSuccess,
    tableData,
    paginatedData,
    insertNewRowsAtTopOnSuccess,
    disablePagination,
  ]);

  // When validation messages are visible after a save attempt, auto-scroll to first error
  React.useEffect(() => {
    if (validationTrigger === "onSave" && didAttemptSave) {
      const t = setTimeout(scrollToFirstValidationMessage, 0);
      return () => clearTimeout(t);
    }
  }, [didAttemptSave, validationTrigger, scrollToFirstValidationMessage]);

  // Cancel all edits
  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      setConfirmAction("cancel");
      setShowUnsavedConfirm(true);
      return;
    }
    setNewRows([]);
    setEditBuffer({});
  };

  // Integrate with TabManager dirty-close interceptor: respond to ping with save/discard callbacks
  React.useEffect(() => {
    const onDirtyPing = (e) => {
      // Only respond to TabManager's ping messages
      if (!e?.detail?.ping) return;
      // Only the targeted tab instance should respond. Require tabId to be set.
      try {
        if (!tabId) return;
        const targetKey = e.detail?.targetKey;
        if (targetKey && targetKey !== tabId) return;
      } catch {
        /* noop */
      }
      if (!hasUnsavedChanges()) return;
      const onSaveDraft = async () => {
        await handleSaveAll();
      };
      const onDiscardDraft = () => {
        setNewRows([]);
        setEditBuffer({});
      };
      // Broadcast current dirty state back for TabManager to pick up
      window.dispatchEvent(
        new CustomEvent("dirtyPromptState", {
          detail: { active: true, onSaveDraft, onDiscardDraft },
        })
      );
    };
    window.addEventListener("dirtyPromptState", onDirtyPing);
    return () => window.removeEventListener("dirtyPromptState", onDirtyPing);
  }, [tabId, newRows.length, editBuffer, handleSaveAll, hasUnsavedChanges]);

  // Add state for confirmation dialog
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState(null);

  // Dropdown handling functions (like SortableTable)
  const handleDropdown = (idx) => {
    if (openDropdown === idx) {
      setOpenDropdown(null);
      return;
    }
    setOpenDropdown(idx);
  };

  const handleDropdownClose = () => setOpenDropdown(null);
  React.useEffect(() => {
    // Close dropdown on outside click
    const handler = () => {
      setOpenDropdown(null);
    };
    if (openDropdown !== null) {
      window.addEventListener("click", handler);
      return () => window.removeEventListener("click", handler);
    }
  }, [openDropdown]);

  // When any dropdown is open, block scrolling of the table and page
  React.useEffect(() => {
    if (!anyDropdownOpen) return;
    const preventScroll = (e) => {
      try {
        // Allow scrolling inside react-select dropdowns and other form elements
        if (e.target && typeof e.target.closest === "function") {
          const insideReactSelect =
            e.target.closest(".react-select__menu") ||
            e.target.closest(".react-select__menu-list") ||
            e.target.closest(".react-select__option");
          if (insideReactSelect) return; // let react-select handle its own scrolling
        }
      } catch {
        /* noop */
      }
      e.preventDefault();
      e.stopPropagation();
    };
    // Also prevent keyboard navigation when dropdowns are open
    const preventKeyboard = (e) => {
      // Allow typing in input fields and dropdowns
      if (e.target && typeof e.target.closest === "function") {
        const insideInput =
          e.target.closest("input") ||
          e.target.closest("textarea") ||
          e.target.closest(".react-select__menu") ||
          e.target.closest(".react-select__input");
        if (insideInput) return;
      }

      // Block arrow keys, page up/down, home, end, space, enter for navigation
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
          "Enter",
        ].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const container = tableScrollRef?.current;
    try {
      if (container) {
        container.addEventListener("wheel", preventScroll, { passive: false });
        container.addEventListener("touchmove", preventScroll, {
          passive: false,
        });
      }
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      window.addEventListener("keydown", preventKeyboard, { passive: false });
    } catch {
      /* ignore listener add errors */
    }
    return () => {
      try {
        if (container) {
          container.removeEventListener("wheel", preventScroll);
          container.removeEventListener("touchmove", preventScroll);
        }
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
        window.removeEventListener("keydown", preventKeyboard);
      } catch {
        /* ignore listener remove errors */
      }
    };
  }, [anyDropdownOpen]);

  // Monitor for any dropdown being open (including react-select)
  React.useEffect(() => {
    const checkForDropdowns = () => {
      const reactSelectMenus = Array.from(
        document.querySelectorAll(".react-select__menu")
      ).filter((el) => {
        try {
          const style = window.getComputedStyle(el);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0"
          ) {
            return false;
          }
          if (el.getAttribute("aria-hidden") === "true") return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        } catch {
          return false;
        }
      });

      const hasOpenDropdown =
        reactSelectMenus.length > 0 || openDropdown !== null;
      setAnyDropdownOpen(hasOpenDropdown);
    };

    // Check immediately
    checkForDropdowns();

    // Set up a mutation observer to watch for react-select menu changes
    const observer = new MutationObserver(checkForDropdowns);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, [openDropdown]);

  // Auto-flip dropdown if near viewport bottom
  React.useEffect(() => {
    if (openDropdown === null) return;
    const btn = actionBtnRefs.current[openDropdown];
    if (!btn) return;
    const placementRef = { current: dropdownPlacement };
    let debounceTimer;

    const computeNow = () => {
      try {
        const rect = btn.getBoundingClientRect();
        const viewportH =
          window.innerHeight || document.documentElement.clientHeight || 0;
        const container = tableScrollRef.current;
        const containerRect = container
          ? container.getBoundingClientRect()
          : { top: 0, bottom: viewportH };
        const limitTop = Math.max(0, containerRect.top);
        const limitBottom = Math.min(viewportH, containerRect.bottom);

        const estimatedMenuHeight = 240; // px
        const safety = 8; // px padding from edges

        const availableBelow = Math.max(0, limitBottom - rect.bottom - safety);
        const availableAbove = Math.max(0, rect.top - limitTop - safety);

        // Hysteresis thresholds to avoid flip-flop when near the edge
        const flipThreshold = 200; // desire to flip if less than this
        const stickThreshold = 120; // keep current placement until below this

        let next = placementRef.current;
        if (placementRef.current === "down") {
          // Flip up only when clearly not enough space below and there is more space above
          if (availableBelow < stickThreshold && availableAbove > availableBelow) {
            next = "up";
          }
        } else {
          // Flip down only when clearly not enough space above and there is more space below
          if (availableAbove < stickThreshold && availableBelow > availableAbove) {
            next = "down";
          }
        }

        // For first open (no prior decision), choose best fit by threshold
        if (!placementRef.current) {
          next = availableBelow >= flipThreshold || availableBelow >= availableAbove ? "down" : "up";
        }

        placementRef.current = next;
        setDropdownPlacement(next);
      } catch {
        /* noop */
      }
    };

    const computeDebounced = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(computeNow, 120);
    };

    // Initial compute
    computeNow();
    window.addEventListener("resize", computeDebounced);
    window.addEventListener("scroll", computeDebounced, true);
    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener("resize", computeDebounced);
      window.removeEventListener("scroll", computeDebounced, true);
    };
  }, [openDropdown]);

  // Render cell (input if editing, else value)
  // In renderCell, treat all rows as if they are being edited
  const renderCell = (row, col, rowIdx, isNew = false) => {
    // Helpers for validation rendering
    const getValidationMessage = (columnDef, value, sourceRow, isNewRow) => {
      try {
        if (typeof validateCell === "function") {
          const customMsg = validateCell(columnDef, value, sourceRow, isNewRow);
          // Gate display when validationTrigger === 'onSave': only show for rows included in last save attempt
          if (customMsg) {
            if (validationTrigger !== "onSave") return customMsg;
            const showForThisRow =
              !!sourceRow?._showValidation && didAttemptSave;
            if (showForThisRow) return customMsg;
            return null;
          }
        }
      } catch {
        /* ignore validator errors */
      }
      if (columnDef && columnDef.required) {
        const isEmpty = value === "" || value === null || value === undefined;
        if (isEmpty) {
          if (validationTrigger !== "onSave")
            return columnDef.requiredMessage || "This field is required.";
          const showForThisRow = !!sourceRow?._showValidation && didAttemptSave;
          if (showForThisRow)
            return columnDef.requiredMessage || "This field is required.";
          return null;
        }
      }
      return null;
    };
    const wrapWithValidation = (element, message) => {
      const shouldShow =
        showValidation &&
        !isSavingInternal &&
        !!message &&
        (validationTrigger !== "onSave" || didAttemptSave);
      // Enhance the editor element with an error border when a validation message is shown
      let enhanced = element;
      try {
        if (shouldShow && React.isValidElement(element)) {
          const isFormControl =
            typeof element.type === "string" ||
            (element.props &&
              typeof element.props.className === "string" &&
              element.props.className.includes("form-control"));
          if (isFormControl) {
            const prevClass = element.props.className || "";
            const className = `${prevClass} iet-input-invalid`;
            const style = {
              ...(element.props.style || {}),
              outline: "none",
              borderColor: "#d33",
              boxShadow: "0 0 0 2px rgba(211,51,51,0.25)",
            };
            enhanced = React.cloneElement(element, { className, style });
          } else if (element.props && element.props.classNamePrefix) {
            // Likely a react-select or custom select; inject red border via styles.control
            const prevStyles = element.props.styles || {};
            const controlFn = prevStyles.control;
            const mergedStyles = {
              ...prevStyles,
              control: (provided, state) => {
                const base = typeof controlFn === "function" ? controlFn(provided, state) : { ...provided };
                return {
                  ...base,
                  borderColor: "#dc3545",
                  boxShadow: "0 0 0 1px rgba(220,53,69,.25)",
                  "&:hover": { borderColor: "#dc3545" },
                };
              },
            };
            enhanced = React.cloneElement(element, { styles: mergedStyles, className: `${element.props.className || ''} iet-input-invalid` });
          }
        }
      } catch {
        /* noop */
      }
      // Always keep a stable wrapper so input is not remounted when message toggles
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {enhanced}
          {shouldShow ? (
            <div
              className="iet-validation-msg"
              style={{ color: "#d33", fontSize: 12, marginTop: 4 }}
            >
              {message}
            </div>
          ) : null}
        </div>
      );
    };
    // Handle actions column like SortableTable
    if (col.key === "actions") {
      // Don't show action buttons for new rows
      if (isNew) {
        return <div style={{ width: "100%" }}></div>;
      }

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: hideActionsDropdown ? "center" : "flex-start",
            width: "100%",
            fontSize: 14,
            gap: hideActionsDropdown ? 0 : 3,
          }}
        >
          {/* Render action buttons that should show separately */}
          {getActions &&
            (getActions(row) || [])
              .filter((action) => action.showAsButton === true)
              .map((action, index) => {
                const IconEl = action.icon || (
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
                    <circle cx="12" cy="12" r="3" />
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                  </svg>
                );
                return (
                  <button
                    key={index}
                    className="btn-sm"
                    title={action.title || action.label}
                    style={{
                      padding: "2px 6px",
                      display: "inline-flex",
                      color: "rgb(122, 75, 120)",
                      background: "#fff",
                      marginRight:
                        index <
                          (getActions(row) || []).filter(
                            (a) => a.showAsButton === true
                          ).length -
                          1
                          ? "4px"
                          : "0",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Highlight the row when action button is clicked
                      if (!isNew) setSelectedRow(rowIdx);
                      if (action.onClick) action.onClick(row);
                    }}
                  >
                    {IconEl}
                  </button>
                );
              })}
          {/* Three-dots dropdown */}
          {!hideActionsDropdown && (
            <div
              className="dropdown"
              style={{ position: "relative" }}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                ref={(el) =>
                  (actionBtnRefs.current[isNew ? `new-${rowIdx}` : rowIdx] = el)
                }
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: 4,
                  borderRadius: 6,
                  transition: "background 0.2s",
                  ...(openDropdown === (isNew ? `new-${rowIdx}` : rowIdx)
                    ? { background: "#f3f4f6" }
                    : {}),
                }}
                aria-label="Actions"
                tabIndex={0}
                title="More"
                onClick={() => {
                  setSelectedRow(isNew ? null : rowIdx);
                  handleDropdown(isNew ? `new-${rowIdx}` : rowIdx);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedRow(isNew ? null : rowIdx);
                    handleDropdown(isNew ? `new-${rowIdx}` : rowIdx);
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                </svg>
              </span>
              {openDropdown === (isNew ? `new-${rowIdx}` : rowIdx) && (
                <div
                  className="dropdown-menu show1"
                  style={{
                    display: "block",
                    position: "absolute",
                    left: 55,
                    top: dropdownPlacement === "down" ? "100%" : undefined,
                    bottom: dropdownPlacement === "up" ? "100%" : undefined,
                    minWidth: 160,
                    maxHeight: 240,
                    overflowY: "auto",
                    zIndex: 3000,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.12)"
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {(getActions ? getActions(row) || [] : []).map(
                    (action, i) =>
                      // Only show actions in dropdown that don't have showAsButton: true
                      !action.showAsButton && (
                        <button
                          key={i}
                          className="dropdown-item d-flex align-items-center"
                          type="button"
                          onClick={() => {
                            // Highlight the row when dropdown action is clicked
                            if (!isNew) setSelectedRow(rowIdx);
                            action.onClick && action.onClick(row);
                            handleDropdownClose();
                          }}
                        >
                          {action.icon && (
                            <span className="me-2">{action.icon}</span>
                          )}
                          {action.label}
                        </button>
                      )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    // If this is a new row, allow editing if canAdd is true
    if (isNew && canAdd) {
      // Always use col.renderEdit if present
      if (col.renderEdit) {
        const mergedRow = { ...(newRows[rowIdx] || {}), _isNewRow: true };
        // Mark whether this new row should currently show validation
        try {
          mergedRow._showValidation = rowsMarkedForValidation.new.has(rowIdx);
        } catch {
          /* noop */
        }
        const setField = (key, val) =>
          handleInputChange(rowIdx, key, val, true);
        const setFields = (updates) => {
          if (!updates || typeof updates !== "object") return;
          Object.entries(updates).forEach(([k, v]) =>
            handleInputChange(rowIdx, k, v, true)
          );
        };
        const editValue = newRows[rowIdx]?.[col.key] || "";
        const editor = col.renderEdit({
          value: newRows[rowIdx]?.[col.key] || "",
          onChange: (e) =>
            handleInputChange(rowIdx, col.key, e.target.value, true),
          row: mergedRow,
          isNew: true,
          setField,
          setFields,
        });
        const msg = getValidationMessage(col, editValue, mergedRow, true);
        // Wrap with a focusing hook container
        return (
          <div
            data-iet-row="new"
            data-iet-row-index={rowIdx}
            data-iet-col={col.key}
          >
            {wrapWithValidation(editor, msg)}
          </div>
        );
      }
      if (col.key === "status") {
        const valueNow = newRows[rowIdx]?.[col.key] || "";
        const editor = (
          <select
            className="form-select form-select-sm"
            value={valueNow}
            onChange={(e) =>
              handleInputChange(rowIdx, col.key, e.target.value, true)
            }
          >
            <option value="">Select Status</option>
            {statusOptions &&
              statusOptions.map((opt) => (
                <option key={opt.ValueText} value={opt.ValueText}>
                  {opt.DisplayText}
                </option>
              ))}
          </select>
        );
        const msg = getValidationMessage(
          col,
          valueNow,
          { ...(newRows[rowIdx] || {}), _isNewRow: true },
          true
        );
        return wrapWithValidation(editor, msg);
      }
      if (col.key === "applicable_for") {
        const valueNow = newRows[rowIdx]?.[col.key] || "";
        const editor = (
          <select
            className="form-select form-select-sm"
            value={valueNow}
            onChange={(e) =>
              handleInputChange(rowIdx, col.key, e.target.value, true)
            }
          >
            <option value="">Select Applicable For</option>
            {applicableForOptions &&
              applicableForOptions.map((opt) => (
                <option key={opt.ValueText} value={opt.ValueText}>
                  {opt.DisplayText}
                </option>
              ))}
          </select>
        );
        const msg = getValidationMessage(
          col,
          valueNow,
          { ...(newRows[rowIdx] || {}), _isNewRow: true },
          true
        );
        return wrapWithValidation(editor, msg);
      }
      if (col.key === "cgst" || col.key === "sgst" || col.key === "igst") {
        let rate = Number(newRows[rowIdx]["rate"]) || 0;
        let applicableFor = newRows[rowIdx]["applicable_for"];
        let calcValue = "";
        if (col.key === "cgst") {
          const { cgstPercentage } = calculatePercentages(rate, applicableFor);
          calcValue = cgstPercentage;
        } else if (col.key === "sgst") {
          const { sgstPercentage } = calculatePercentages(rate, applicableFor);
          calcValue = sgstPercentage;
        } else if (col.key === "igst") {
          const { igstPercentage } = calculatePercentages(rate, applicableFor);
          calcValue = igstPercentage;
        }
        const editor = (
          <input
            type="number"
            className="form-control form-control-sm"
            value={calcValue}
            disabled
          />
        );
        return editor;
      }
      if (col.key === "login_id" && repOptions.length > 0) {
        const valueNow = newRows[rowIdx]?.[col.key] || "";
        const editor = (
          <select
            className="form-select form-select-sm"
            value={valueNow}
            onChange={(e) =>
              handleInputChange(rowIdx, col.key, e.target.value, true)
            }
          >
            <option value="">Select Representative</option>
            {repOptions.map((opt) => (
              <option key={opt.ValueText} value={opt.ValueText}>
                {opt.DisplayText}
              </option>
            ))}
          </select>
        );
        const msg = getValidationMessage(
          col,
          valueNow,
          { ...(newRows[rowIdx] || {}), _isNewRow: true },
          true
        );
        return wrapWithValidation(editor, msg);
      }
      if (col.readOnly) {
        const valueNow = newRows[rowIdx]?.[col.key] || "";
        const editor = (
          <input
            type="text"
            className="form-control form-control-sm"
            value={valueNow}
            disabled
          />
        );
        return wrapWithValidation(editor, null);
      }
      const valueNow = newRows[rowIdx]?.[col.key] || "";
      const editor = (
        <input
          type="text"
          className="form-control form-control-sm"
          value={valueNow}
          onChange={(e) =>
            handleInputChange(rowIdx, col.key, e.target.value, true)
          }
        />
      );
      const msg = getValidationMessage(
        col,
        valueNow,
        { ...(newRows[rowIdx] || {}), _isNewRow: true },
        true
      );
      return (
        <div
          data-iet-row="new"
          data-iet-row-index={rowIdx}
          data-iet-col={col.key}
        >
          {wrapWithValidation(editor, msg)}
        </div>
      );
    }
    // Existing rows: only editable if canEdit is true
    if (!canEdit) {
      if (col.render) return col.render(row);
      const val = row[col.key];
      return <EllipsisWithTooltip text={val} />;
    }

    // Determine a stable key for existing rows based on their index in tableData
    const globalIndex = isNew ? rowIdx : tableData.findIndex((r) => r === row);

    const value = isNew
      ? newRows[rowIdx]?.[col.key] || ""
      : editBuffer[globalIndex]?.[col.key] !== undefined
        ? editBuffer[globalIndex][col.key]
        : row[col.key];

    const onChange = (e) =>
      handleInputChange(globalIndex, col.key, e.target.value, isNew);

    // Always use col.renderEdit if present
    if (col.renderEdit) {
      const isDirtyRow = !!editBuffer[globalIndex];
      const isDirtyForThisCol = !!(
        editBuffer[globalIndex] &&
        Object.prototype.hasOwnProperty.call(editBuffer[globalIndex], col.key)
      );
      const mergedRow = isNew
        ? { ...(newRows[rowIdx] || {}), _isNewRow: true }
        : {
          ...row,
          ...(editBuffer[globalIndex] || {}),
          _isDirtyRow: isDirtyRow,
          _dirtyColKeys: isDirtyForThisCol ? { [col.key]: true } : undefined,
        };
      // Mark whether this existing row should currently show validation
      try {
        mergedRow._showValidation =
          rowsMarkedForValidation.edit.has(globalIndex);
      } catch {
        /* noop */
      }
      const setField = (key, val) =>
        handleInputChange(globalIndex, key, val, isNew);
      const setFields = (updates) => {
        if (!updates || typeof updates !== "object") return;
        Object.entries(updates).forEach(([k, v]) =>
          handleInputChange(globalIndex, k, v, isNew)
        );
      };
      const editor = col.renderEdit({
        value,
        onChange,
        row: mergedRow,
        isNew,
        setField,
        setFields,
      });
      const msg = getValidationMessage(col, value, mergedRow, false);
      return wrapWithValidation(editor, msg);
    }
    if (col.key === "status") {
      const isDirtyForThisCol = !!(
        editBuffer[globalIndex] &&
        Object.prototype.hasOwnProperty.call(editBuffer[globalIndex], col.key)
      );
      const mergedRow = {
        ...row,
        _isDirtyRow: !!editBuffer[globalIndex],
        _dirtyColKeys: isDirtyForThisCol ? { [col.key]: true } : undefined,
      };
      const editor = (
        <select
          className="form-select form-select-sm"
          value={value}
          onChange={(e) =>
            handleInputChange(globalIndex, col.key, e.target.value, isNew)
          }
        >
          <option value="">Select Status</option>
          {statusOptions &&
            statusOptions.map((opt) => (
              <option key={opt.ValueText} value={opt.ValueText}>
                {opt.DisplayText}
              </option>
            ))}
        </select>
      );
      const msg = getValidationMessage(col, value, mergedRow, false);
      return wrapWithValidation(editor, msg);
    }
    if (col.key === "applicable_for") {
      const isDirtyForThisCol = !!(
        editBuffer[globalIndex] &&
        Object.prototype.hasOwnProperty.call(editBuffer[globalIndex], col.key)
      );
      const mergedRow = {
        ...row,
        _isDirtyRow: !!editBuffer[globalIndex],
        _dirtyColKeys: isDirtyForThisCol ? { [col.key]: true } : undefined,
      };
      const editor = (
        <select
          className="form-select form-select-sm"
          value={value}
          onChange={(e) =>
            handleInputChange(globalIndex, col.key, e.target.value, isNew)
          }
        >
          <option value="">Select Applicable For</option>
          {applicableForOptions &&
            applicableForOptions.map((opt) => (
              <option key={opt.ValueText} value={opt.ValueText}>
                {opt.DisplayText}
              </option>
            ))}
        </select>
      );
      const msg = getValidationMessage(col, value, mergedRow, false);
      return wrapWithValidation(editor, msg);
    }
    if (col.key === "cgst" || col.key === "sgst" || col.key === "igst") {
      let rate = isNew
        ? Number(newRows[rowIdx]["rate"]) || 0
        : Number(
            editBuffer[globalIndex]?.["rate"] !== undefined
              ? editBuffer[globalIndex]["rate"]
              : row["rate"]
          ) || 0;
      let applicableFor = isNew
        ? newRows[rowIdx]["applicable_for"]
        : editBuffer[globalIndex]?.["applicable_for"] !== undefined
          ? editBuffer[globalIndex]["applicable_for"]
          : row["applicable_for"];
      let calcValue = "";
      if (col.key === "cgst") {
        const { cgstPercentage } = calculatePercentages(rate, applicableFor);
        calcValue = cgstPercentage;
      } else if (col.key === "sgst") {
        const { sgstPercentage } = calculatePercentages(rate, applicableFor);
        calcValue = sgstPercentage;
      } else if (col.key === "igst") {
        const { igstPercentage } = calculatePercentages(rate, applicableFor);
        calcValue = igstPercentage;
      }
      return (
        <input
          type="number"
          className="form-control form-control-sm"
          value={calcValue}
          disabled
        />
      );
    }
    if (col.key === "login_id" && repOptions.length > 0) {
      const isDirtyForThisCol = !!(
        editBuffer[globalIndex] &&
        Object.prototype.hasOwnProperty.call(editBuffer[globalIndex], col.key)
      );
      const mergedRow = {
        ...row,
        _isDirtyRow: !!editBuffer[globalIndex],
        _dirtyColKeys: isDirtyForThisCol ? { [col.key]: true } : undefined,
      };
      const editor = (
        <select
          className="form-select form-select-sm"
          value={value}
          onChange={(e) =>
            handleInputChange(globalIndex, col.key, e.target.value, isNew)
          }
        >
          <option value="">Select Representative</option>
          {repOptions.map((opt) => (
            <option key={opt.ValueText} value={opt.ValueText}>
              {opt.DisplayText}
            </option>
          ))}
        </select>
      );
      const msg = getValidationMessage(col, value, mergedRow, false);
      return wrapWithValidation(editor, msg);
    }
    if (col.readOnly) {
      const editor = (
        <input
          type="text"
          className="form-control form-control-sm"
          value={value}
          disabled
        />
      );
      return wrapWithValidation(editor, null);
    }
    const isDirtyForThisCol = !!(
      editBuffer[globalIndex] &&
      Object.prototype.hasOwnProperty.call(editBuffer[globalIndex], col.key)
    );
    const mergedRow = {
      ...row,
      _isDirtyRow: !!editBuffer[globalIndex],
      _dirtyColKeys: isDirtyForThisCol ? { [col.key]: true } : undefined,
    };
    const editor = (
      <input
        type="text"
        className="form-control form-control-sm"
        value={value}
        onChange={(e) =>
          handleInputChange(globalIndex, col.key, e.target.value, isNew)
        }
      />
    );
    const msg = getValidationMessage(col, value, mergedRow, false);
    return wrapWithValidation(editor, msg);
  };

  // Handle filter popup
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (
        filterInputRef.current &&
        !filterInputRef.current.contains(event.target)
      ) {
        setOpenFilter(null);
      }
      // Clear row selection when clicking outside action buttons and table rows
      if (!event.target.closest(".dropdown") && !event.target.closest("tr")) {
        setSelectedRow(null);
      }
    }
    if (openFilter !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openFilter]);
  const handleFilterKeyDown = (e) => {
    if (e.key === "Enter") {
      setOpenFilter(null);
    }
  };

  // Keep fixed-position filter card aligned on scroll/resize, and gently auto-scroll container to keep it in view
  React.useEffect(() => {
    if (openFilter === null) return;
    const updatePos = () => {
      try {
        const el = filterBtnRefs.current[openFilter];
        const container = tableScrollRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const viewportW = window.innerWidth || 0;
        const estimatedW = 220;
        const y = filterPos.direction === "up" ? rect.top - 6 : rect.bottom + 6;
        // Start 10% to the right
        let leftPos = rect.left + rect.width * 0.1;
        let arrowLeft;
        if (leftPos + estimatedW > viewportW - 10) {
          leftPos = rect.right - estimatedW - rect.width * 0.1;
          if (leftPos < 10) leftPos = 10;
          arrowLeft = estimatedW - 20;
        } else {
          arrowLeft = 20;
        }
        if (leftPos + estimatedW > viewportW - 10) {
          leftPos = viewportW - estimatedW - 10;
          arrowLeft = Math.min(
            estimatedW - 20,
            Math.max(20, rect.left + rect.width / 2 - leftPos)
          );
        }
        setFilterPos((prev) => ({
          left: leftPos,
          top: y,
          direction: prev.direction,
          arrowLeft,
        }));
        if (container) {
          const popup = filterInputRef.current;
          if (popup) {
            const popupRect = popup.getBoundingClientRect();
            const contRect = container.getBoundingClientRect();
            if (popupRect.bottom > contRect.bottom - 8) {
              container.scrollTop += Math.ceil(
                popupRect.bottom - contRect.bottom + 8
              );
            }
            if (popupRect.top < contRect.top + 8) {
              container.scrollTop += Math.floor(
                popupRect.top - contRect.top - 8
              );
            }
          }
        }
      } catch {
        /* noop */
      }
    };
    updatePos();
    const container = tableScrollRef.current;
    window.addEventListener("scroll", updatePos, { passive: true });
    window.addEventListener("resize", updatePos);
    if (container)
      container.addEventListener("scroll", updatePos, { passive: true });
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
      if (container) container.removeEventListener("scroll", updatePos);
    };
  }, [openFilter, filterPos.direction]);

  // Sorting
  const sortTable = (key) => {
    if (disableSorting) return;
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  React.useEffect(() => {
    // setEditingRows(tableData.map((_, idx) => idx)); // This line is no longer needed
  }, [tableData]);

  // Generate a unique class for this table instance
  const tableInstanceClass = useMemo(
    () =>
      `inline-editable-table-wrapper-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    []
  );

  // Compute per-column match counts for active column filters
  // Updated to reflect current filtered dataset size across all active filters
  const columnMatchCounts = React.useMemo(() => {
    const counts = {};
    const totalMatches = filteredData.length;
    Object.entries(columnSearch).forEach(([key, val]) => {
      if (val && val.length >= 3) counts[key] = totalMatches;
    });
    return counts;
  }, [filteredData.length, columnSearch]);

  return (
    <div className={tableInstanceClass + " w-100 h-100"}>
      {/* Sticky header + stable borders to avoid flicker */}
      <style>{`
        .${tableInstanceClass} .table thead th { position: sticky; top: 0; z-index: 25; }
        .${tableInstanceClass} .table thead { position: sticky; top: 0; z-index: 24; }
        .${tableInstanceClass} .table thead th, .${tableInstanceClass} .table tbody td { border-bottom: 1px solid #dee2e6; }
        .${tableInstanceClass} .table tbody td + td, .${tableInstanceClass} .table thead th + th { border-left: 1px solid #dee2e6; }
        .${tableInstanceClass} .table thead th { will-change: transform; backface-visibility: hidden; }
        /* Ensure Actions header text is not auto-capitalized */
        .${tableInstanceClass} .table thead th.actions-column,
        .${tableInstanceClass} .table thead th.actions-column span,
        .${tableInstanceClass} .table thead th.actions-column button { text-transform: none !important; }
        /* When any dropdown is open, visually hide the vertical scrollbar
           (actual scrolling is already blocked via JS when anyDropdownOpen is true) */
        .${tableInstanceClass} .table-responsive.dropdown-open::-webkit-scrollbar {
          display: none;
        }
        .${tableInstanceClass} .table-responsive.dropdown-open {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;     /* Firefox */
        }
      `}</style>
      {fixedFirstColumn && (
        <style>{`
          .${tableInstanceClass} .table-container {
            position: relative;
            overflow-x: auto;
          }
          .${tableInstanceClass} .table {
            position: relative;
          }
          .${tableInstanceClass} .table thead th:first-child,
          .${tableInstanceClass} .table tbody td:first-child {
            position: sticky;
            left: 0;
            z-index: 10;
            background: rgb(122, 75, 120);
            border-right: 2px solid #fff;
          }
          .${tableInstanceClass} .table tbody td:first-child {
            background: #fff;
            border-right: 1px solid #dee2e6;
          }
          .${tableInstanceClass} .table tbody td:first-child.actions-column {
            background: #fff;
            border-right: 1px solid #dee2e6;
          }
          .${tableInstanceClass} .table tbody tr:hover td:first-child {
            background: #f8f9fa;
          }
          .${tableInstanceClass} .table tbody tr.selected td:first-child {
            background: #e3f2fd;
            border-left: 4px solid #fff;
          }
          .${tableInstanceClass} .table tbody tr:hover td:first-child {
            background: #f5f5f5;
          }
          .${tableInstanceClass} .table tbody tr:hover td:first-child.actions-column {
            background: #f5f5f5;
          }
          .${tableInstanceClass} .table tbody tr.selected td:first-child.actions-column {
            background: #e3f2fd;
            border-left: 4px solid #fff;
          }
          .${tableInstanceClass} .table thead th:first-child {
            position: sticky !important;
            left: 0 !important;
            z-index: 30 !important;
            background: rgb(122, 75, 120) !important;
            border-right: 2px solid #fff !important;
          }
          .${tableInstanceClass} .table thead th:first-child.actions-column {
            position: sticky !important;
            left: 0 !important;
            z-index: 30 !important;
            background: rgb(122, 75, 120) !important;
            border-right: 2px solid #fff !important;
          }
          .${tableInstanceClass} .table thead th:first-child * {
            background: rgb(122, 75, 120) !important;
          }
          .${tableInstanceClass} .fixed-first-column {
            position: sticky !important;
            left: 0 !important;
            z-index: 30 !important;
            background: rgb(122, 75, 120) !important;
            border-right: 2px solid #fff !important;
          }
        `}</style>
      )}
      {loading && <Loader />}
      <div
        className="card h-100"
        style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {!hideHeader && (
          <div
            className="card-header"
            style={{ paddingTop: "0.45rem", paddingBottom: "0.45rem" }}
          >
            <div
              className="table-header-toolbar d-flex flex-wrap align-items-center justify-content-between w-100"
              style={{ rowGap: 8 }}
            >
              {/* Left: Title */}
              <div className="table-title-section" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {icon && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        height: "26px",
                        width: "26px",
                        marginRight: 6,
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>
                  )}
                  {showTitle && (
                    <h1
                      className="mb-0 text-nowrap"
                      style={{ fontWeight: 700, fontSize: 19, lineHeight: "1", whiteSpace: "nowrap" }}
                    >
                      {title || "Table"}
                    </h1>
                  )}
                </div>
              </div>

              {/* Center: Filters & Search */}
              <div
                className="table-filter-search-section table-search-pagination-section flex-grow-1 d-flex justify-content-end align-items-center my-1 my-md-0"
                style={{ minWidth: 0, marginRight: 10 }}
              >
                {!disableSearch && (
                  <div
                    className="ms-auto text-dark"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginRight: 6,
                      fontWeight: 500,
                    }}
                  >
                    <div
                      className="ms-2 d-inline-block"
                      style={{ position: "relative" }}
                    >
                      {/* Search Icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
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

                      {/* Search Input */}
                      <input
                        type="text"
                        className="form-control"
                        aria-label="Search table"
                        value={globalSearch}
                        placeholder="Search..."
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        style={{
                          minWidth: 180,
                          paddingLeft: "28px", // space for icon
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Actions & Pagination */}
              <div
                className="table-actions-section d-flex align-items-center gap-2 ms-auto"
                style={{ flexShrink: 0 }}
              >
                {/* Pagination Controls */}
                {showPagination && !disablePagination && (
                  <div className="table-pagination-controls d-flex align-items-center justify-content-end my-0">
                    {/* First Page */}
                    <button
                      className="btn btn-sm"
                      style={{
                        borderRadius: "50%",
                        border: "none",
                        outline: "none",
                        background: currentPage === 1 ? "#f0f0f0" : "#fff",
                        color: "rgb(122, 75, 120)",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "none",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      title="First Page"
                    >
                      <FirstPageIcon style={{ fontSize: 18 }} />
                    </button>
                    {/* Previous Page */}
                    <button
                      className="btn btn-sm"
                      style={{
                        borderRadius: "50%",
                        border: "none",
                        outline: "none",
                        background: currentPage === 1 ? "#f0f0f0" : "#fff",
                        color: "rgb(122, 75, 120)",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "none",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                      onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
                      }
                      disabled={currentPage === 1}
                      title="Previous Page"
                    >
                      <ArrowBackIosIcon style={{ fontSize: 18 }} />
                    </button>
                    {/* Page X of Y */}
                    <span
                      style={{ fontWeight: 500, fontSize: 16, margin: "0 4px" }}
                    >
                      Page
                    </span>
                    <input
                      type="text"
                      min={1}
                      max={totalPages}
                      value={perPage === "all" ? "1" : pageInputValue}
                      onChange={(e) => {
                        const inputValue = e.target.value;

                        // Only allow numeric characters
                        if (inputValue !== "" && !/^\d+$/.test(inputValue)) {
                          return; // Don't update if non-numeric characters are entered
                        }

                        setPageInputValue(inputValue); // Allow free typing

                        if (inputValue === "") return; // Allow empty input while typing

                        let val = parseInt(inputValue, 10);
                        if (isNaN(val)) return; // Don't change page if not a valid number

                        // Constrain to valid range
                        if (val < 1) val = 1;
                        if (val > totalPages) val = totalPages;

                        setCurrentPage(val);
                      }}
                      onBlur={(e) => {
                        // On blur, ensure we have a valid value
                        const inputValue = e.target.value;
                        if (inputValue === "" || isNaN(parseInt(inputValue, 10))) {
                          setCurrentPage(1);
                          setPageInputValue("1");
                        } else {
                          let val = parseInt(inputValue, 10);
                          if (val < 1) val = 1;
                          if (val > totalPages) val = totalPages;
                          setCurrentPage(val);
                          setPageInputValue(val.toString());
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.target.blur(); // Trigger onBlur
                        }
                      }}
                      style={{
                        width: 36,
                        textAlign: "center",
                        borderRadius: 6,
                        border: "1px solid #d0d7de",
                        fontWeight: 600,
                        fontSize: 16,
                        margin: "0 4px",
                      }}
                      disabled={perPage === "all"}
                    />
                    <span
                      style={{ fontWeight: 500, fontSize: 16, margin: "0 0px" }}
                    >
                      of {totalPages}
                    </span>
                    {/* Next Page */}
                    <button
                      className="btn btn-sm"
                      style={{
                        borderRadius: "50%",
                        border: "none",
                        outline: "none",
                        background: currentPage === totalPages ? "#f0f0f0" : "#fff",
                        color: "rgb(122, 75, 120)",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "none",
                        cursor:
                          currentPage === totalPages ? "not-allowed" : "pointer",
                      }}
                      onClick={() =>
                        currentPage < totalPages && setCurrentPage(currentPage + 1)
                      }
                      disabled={currentPage === totalPages}
                      title="Next Page"
                    >
                      <ArrowForwardIosIcon style={{ fontSize: 18 }} />
                    </button>
                    {/* Last Page */}
                    <button
                      className="btn btn-sm"
                      style={{
                        borderRadius: "50%",
                        border: "none",
                        outline: "none",
                        background: currentPage === totalPages ? "#f0f0f0" : "#fff",
                        color: "rgb(122, 75, 120)",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "none",
                        cursor:
                          currentPage === totalPages ? "not-allowed" : "pointer",
                      }}
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      title="Last Page"
                    >
                      <LastPageIcon style={{ fontSize: 18 }} />
                    </button>
                  </div>
                )}

                {!disablePagination && (
                  <div className="dropdown">
                    <button
                      className="btn dropdown-toggle"
                      data-bs-toggle="dropdown"
                      disabled={!canEdit}
                    >
                      <span className="me-1">
                        {perPage === "all" ? "All" : perPage}
                      </span>
                      {/* <span>records</span> */}
                    </button>
                    <div
                      className="dropdown-menu"
                      style={{
                        zIndex: "9999",
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        minWidth: "65px"
                      }}
                    >
                      {[25, 50, 100, 200]
                        .filter((num) => total >= num)
                        .map((num) => (
                          <a
                            className="dropdown-item"
                            style={{ minWidth: 0 }}
                            href="#"
                            key={num}
                            onClick={(e) => {
                              e.preventDefault();
                              setLastNumericPerPage(num);
                              setPerPage(num);
                              setCurrentPage(1);
                              setUserManuallySetPerPage(true);
                            }}
                          >
                            {num}
                          </a>
                        ))}
                      <a
                        className="dropdown-item"
                        href="#"
                        key="all"
                        style={{ minWidth: 0 }}
                        onClick={(e) => {
                          e.preventDefault();
                          if (perPage !== "all" && typeof perPage === "number") {
                            setLastNumericPerPage(perPage);
                          }
                          setPerPage("all");
                          setCurrentPage(1);
                          setUserManuallySetPerPage(true);
                        }}
                      >
                        All
                      </a>
                    </div>
                  </div>
                )}
                <button
                  className="btn btn-sm"
                  style={{
                    background: "#fff",
                    color: "rgb(122, 75, 120)",
                    borderRadius: "8px",
                    width: 36,
                    height: 36,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "none",
                    border: "1px solid #d0d7de",
                  }}
                  onClick={handleTableRefresh}
                  title="Refresh"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1677ff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
                  </svg>
                </button>

                {/* Add New Row Button */}
                {showAddButton && canAdd && (
                  <button
                    className="btn btn-sm"
                    onClick={handleAddNew}
                    style={{
                      background: "rgb(122, 75, 120)",
                      color: "#fff",
                      borderRadius: "8px",
                      width: 33,
                      height: 33,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "none",
                      border: "none",
                    }}
                    title="Add"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                )}

                {/* Save/Cancel Buttons: Show if (canAdd && newRows.length > 0) or (canEdit && there are edits) */}
                {((canAdd && newRows.length > 0) ||
                  (canEdit && Object.keys(editBuffer).length > 0)) && (
                    <>
                      <button
                        className="btn btn-sm"
                        onClick={handleSaveAll}
                        style={{
                          background: "rgb(122, 75, 120)",
                          color: "#fff",
                          borderRadius: "8px",
                          width: 33,
                          height: 33,
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "none",
                          border: "none",
                        }}
                        title="Save"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          title="Save"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                      </button>
                      {canAdd && newRows.length > 0 && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={handleCancel}
                          title="Close"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            title="Close"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                {afterAddButtons && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {afterAddButtons}
                  </div>
                )}
                {printMenu && <div>{printMenu}</div>}
              </div>
            </div>

          </div>
        )}
        <div
          className="card-body p-0 flex-grow-1"
          style={{ overflow: "hidden", display: "flex", minHeight: 0 }}
        >
          <div
            className={`table-responsive ${fixedFirstColumn ? "table-container" : ""
              } ${anyDropdownOpen ? "dropdown-open" : ""}`}
            ref={tableScrollRef}
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              maxHeight: scrollMaxHeight ? `${scrollMaxHeight - (footerContent ? 38 : 0)}px` : undefined,
              paddingBottom: (footerHeight || 0) + (minibarHeight || 44) - 40,
              overflowY: "auto",
              overflowX: "auto",
              position: "relative",
            }}
          >
            <table
              className="table table-vcenter table-selectable"
              style={{
                borderCollapse: "separate",
                borderSpacing: 0,
                minWidth: "100%",
              }}
            >
              <thead className="" style={{ height: "40px", color: "#fff" }}>
                <tr style={{ position: "sticky", top: 0, zIndex: 50 }}>
                  {columns.map((col, index) => (
                    <th
                      key={col.key}
                      className={`${fixedFirstColumn && index === 0
                          ? "fixed-first-column"
                          : ""
                        } ${col.key === "actions" ? "actions-column" : ""}`}
                      style={{
                        position: "relative",
                        backgroundColor: "rgb(122, 75, 120)",
                        color: "#fff",
                        borderColor: "#fff",
                        padding: "12px",
                        marginRight: "8px",
                        borderRight: "2px solid #fff",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        ...(col.width ? { width: col.width } : {}),
                        ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                        ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          fontWeight: "bold",
                          fontSize: 14,
                        }}
                      >
                        {col.sortable !== false && !disableSorting ? (
                          <button
                            onClick={() => sortTable(col.key)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              background: "none",
                              border: "none",
                              padding: 0,
                              margin: 0,
                              color: "#fff",
                              textTransform: "none",
                              fontWeight: "bold",
                              fontSize: 14,
                              gap: 4,
                            }}
                          >
                            {col.key === "actions" ? "Actions" : col.label}
                            {sortConfig.key === col.key ? (
                              sortConfig.direction === "asc" ? (
                                <KeyboardArrowUpIcon style={{ fontSize: 16 }} />
                              ) : (
                                <KeyboardArrowDownIcon
                                  style={{ fontSize: 16 }}
                                />
                              )
                            ) : (
                              <KeyboardArrowUpIcon
                                style={{ fontSize: 16, opacity: 0.6 }}
                              />
                            )}
                          </button>
                        ) : (
                          <span
                            style={{
                              color: "#fff",
                              textTransform: "none",
                              fontWeight: "bold",
                              fontSize: 14,
                            }}
                          >
                            {col.key === "actions" ? "Actions" : col.label}
                          </span>
                        )}
                        {col.searchable && !disableColumnFilters && (
                          <>
                            <span
                              style={{
                                position: "relative",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              <button
                                className=" btn-link p-0 ms-1"
                                style={{
                                  verticalAlign: "middle",
                                  display: "inline",
                                  lineHeight: 0,
                                  color: "#fff",
                                }}
                                ref={(el) => {
                                  if (el) filterBtnRefs.current[col.key] = el;
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  try {
                                    const el = filterBtnRefs.current[col.key];
                                    const rect = el
                                      ? el.getBoundingClientRect()
                                      : null;
                                    const container = tableScrollRef.current;
                                    const contRect = container
                                      ? container.getBoundingClientRect()
                                      : null;
                                    if (rect && contRect) {
                                      const estimatedH = 150;
                                      const estimatedW = 220; // popup width
                                      const spaceBelow =
                                        contRect.bottom - rect.bottom;
                                      const direction =
                                        spaceBelow < estimatedH ? "up" : "down";
                                      const viewportW = window.innerWidth || 0;
                                      // Start at 10% to the right of the button
                                      let leftPos =
                                        rect.left + rect.width * 0.1;
                                      let arrowLeft;
                                      // If it would overflow on the right, move entire card to the left of the button
                                      if (
                                        leftPos + estimatedW >
                                        viewportW - 10
                                      ) {
                                        leftPos =
                                          rect.right -
                                          estimatedW -
                                          rect.width * 0.1;
                                        if (leftPos < 10) leftPos = 10;
                                        // Arrow near right edge when card is on left side
                                        arrowLeft = estimatedW - 20;
                                      } else {
                                        // Arrow near left edge when card is on right side
                                        arrowLeft = 20;
                                      }
                                      // Final safety clamp
                                      if (
                                        leftPos + estimatedW >
                                        viewportW - 10
                                      ) {
                                        leftPos = viewportW - estimatedW - 10;
                                        arrowLeft = Math.min(
                                          estimatedW - 20,
                                          Math.max(
                                            20,
                                            rect.left + rect.width / 2 - leftPos
                                          )
                                        );
                                      }
                                      setFilterPos({
                                        left: leftPos,
                                        top:
                                          direction === "down"
                                            ? rect.bottom + 6
                                            : rect.top - 6,
                                        direction,
                                        arrowLeft,
                                      });
                                    } else if (rect) {
                                      const viewportH = window.innerHeight || 0;
                                      const viewportW = window.innerWidth || 0;
                                      const estimatedH = 150;
                                      const estimatedW = 220;
                                      const direction =
                                        rect.bottom + estimatedH > viewportH - 8
                                          ? "up"
                                          : "down";
                                      let leftPos =
                                        rect.left + rect.width * 0.1;
                                      let arrowLeft;
                                      if (
                                        leftPos + estimatedW >
                                        viewportW - 10
                                      ) {
                                        leftPos =
                                          rect.right -
                                          estimatedW -
                                          rect.width * 0.1;
                                        if (leftPos < 10) leftPos = 10;
                                        arrowLeft = estimatedW - 20;
                                      } else {
                                        arrowLeft = 20;
                                      }
                                      if (
                                        leftPos + estimatedW >
                                        viewportW - 10
                                      ) {
                                        leftPos = viewportW - estimatedW - 10;
                                        arrowLeft = Math.min(
                                          estimatedW - 20,
                                          Math.max(
                                            20,
                                            rect.left + rect.width / 2 - leftPos
                                          )
                                        );
                                      }
                                      setFilterPos({
                                        left: leftPos,
                                        top:
                                          direction === "down"
                                            ? rect.bottom + 6
                                            : rect.top - 6,
                                        direction,
                                        arrowLeft,
                                      });
                                    }
                                  } catch {
                                    /* noop */
                                  }
                                  setOpenFilter(col.key);
                                }}
                                tabIndex={-1}
                                title={`Filter ${col.label}`}
                              >
                                <FilterListIcon style={{ fontSize: 16 }} />
                              </button>
                              {columnSearch[col.key] &&
                                columnSearch[col.key].length >= 3 && (
                                  <span
                                    style={{
                                      position: "absolute",
                                      top: -6,
                                      right: -8,
                                      background: "#f5c840",
                                      color: "#1c2430",
                                      borderRadius: 10,
                                      padding: "0 4px",
                                      fontSize: 10,
                                      fontWeight: 700,
                                      lineHeight: "14px",
                                      minWidth: 14,
                                      textAlign: "center",
                                    }}
                                    title={`Matches: ${columnMatchCounts[col.key] ?? 0
                                      }`}
                                  >
                                    {columnMatchCounts[col.key] ?? 0}
                                  </span>
                                )}
                            </span>
                            {columnSearch[col.key] &&
                              columnSearch[col.key].length >= 3 && (
                                <button
                                  className="btn-link p-0 ms-1"
                                  style={{
                                    verticalAlign: "middle",
                                    display: "inline",
                                    lineHeight: 0,
                                    color: "#fff",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setColumnSearch({
                                      ...columnSearch,
                                      [col.key]: "",
                                    });
                                    setOpenFilter(null);
                                  }}
                                  tabIndex={-1}
                                  title="Clear filter"
                                >
                                  <FilterListOffIcon style={{ fontSize: 16 }} />
                                </button>
                              )}
                            {openFilter === col.key &&
                              ReactDOM.createPortal(
                                <div
                                  ref={filterInputRef}
                                  style={{
                                    position: "fixed",
                                    left: filterPos.left,
                                    top: filterPos.top,
                                    transform:
                                      filterPos.direction === "up"
                                        ? "translateY(-100%)"
                                        : "none",
                                    background: "#fff",
                                    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                                    padding: 16,
                                    borderRadius: 12,
                                    minWidth: 220,
                                    zIndex: 5000,
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "absolute",
                                      top:
                                        filterPos.direction === "up"
                                          ? "auto"
                                          : -8,
                                      bottom:
                                        filterPos.direction === "up"
                                          ? -8
                                          : "auto",
                                      left: filterPos.arrowLeft || 20,
                                      width: 0,
                                      height: 0,
                                      borderLeft: "8px solid transparent",
                                      borderRight: "8px solid transparent",
                                      borderBottom:
                                        filterPos.direction === "up"
                                          ? "none"
                                          : "8px solid #fff",
                                      borderTop:
                                        filterPos.direction === "up"
                                          ? "8px solid #fff"
                                          : "none",
                                      filter:
                                        "drop-shadow(0 -1px 1px rgba(0,0,0,0.12))",
                                    }}
                                  />
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "rgb(41 27 27 / 44%)",
                                      marginBottom: 5,
                                    }}
                                  >
                                    Enter minimum 3 characters to search
                                  </div>
                                  <div
                                    style={{
                                      position: "relative",
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        position: "absolute",
                                        left: 12,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#90a4ae",
                                      }}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <circle cx="10" cy="10" r="7" />
                                        <line x1="21" y1="21" x2="15" y2="15" />
                                      </svg>
                                    </span>
                                    <input
                                      type="text"
                                      autoFocus
                                      placeholder={`Search ${col.label}`}
                                      value={columnSearch[col.key] || ""}
                                      onChange={(e) =>
                                        setColumnSearch({
                                          ...columnSearch,
                                          [col.key]: e.target.value,
                                        })
                                      }
                                      onKeyDown={handleFilterKeyDown}
                                      style={{
                                        width: "100%",
                                        padding: "8px 36px 8px 38px",
                                        borderRadius: 8,
                                        border: "1px solid #d0d7de",
                                        background: "#f8fafc",
                                        fontSize: 15,
                                        outline: "none",
                                        height: "30px",
                                      }}
                                    />
                                    {columnSearch[col.key] &&
                                      columnSearch[col.key].length > 0 && (
                                        <button
                                          onClick={() =>
                                            setColumnSearch({
                                              ...columnSearch,
                                              [col.key]: "",
                                            })
                                          }
                                          style={{
                                            position: "absolute",
                                            right: 8,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            padding: 0,
                                            cursor: "pointer",
                                            color: "#b0b0b0",
                                            lineHeight: 1,
                                          }}
                                          tabIndex={-1}
                                          title="Clear"
                                        >
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
                                            <circle cx="12" cy="12" r="10" />
                                            <line
                                              x1="15"
                                              y1="9"
                                              x2="9"
                                              y2="15"
                                            />
                                            <line
                                              x1="9"
                                              y1="9"
                                              x2="15"
                                              y2="15"
                                            />
                                          </svg>
                                        </button>
                                      )}
                                  </div>
                                </div>,
                                document.body
                              )}
                          </>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(newRows || []).map((row, idx) => (
                  <tr
                    key={`new-${idx}`}
                    onDoubleClick={() => setConfirmRemoveIdx(idx)}
                    style={{
                      cursor: "pointer",
                      background: "#fffbe6",
                      height: "30px",
                      padding: "0px",
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={
                          col.key === "actions" ? "actions-column" : ""
                        }
                        style={{
                          padding: "0.25rem 0.75rem",
                          ...(col.width ? { width: col.width } : {}),
                          ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                          ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                          ...(col.style || {}),
                        }}
                      >
                        {renderCell(row, col, idx, true)}
                      </td>
                    ))}
                  </tr>
                ))}
                {paginatedData.length === 0 && newRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{
                        textAlign: "center",
                        color: "#888",
                        padding: "32px",
                      }}
                    >
                      No Data Available
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, rowIdx) => (
                    <tr
                      key={row.id || row.hs_code_id || `row-${rowIdx}`}
                      className={selectedRow === rowIdx ? "selected" : ""}
                      onClick={() => {
                        setSelectedRow(rowIdx);
                        // Call onRowClick callback if provided
                        if (onRowClick && typeof onRowClick === 'function') {
                          onRowClick(row, rowIdx);
                        }
                      }}
                      style={{
                        cursor: "pointer",
                        backgroundColor:
                          selectedRow === rowIdx ? "#e3f2fd" : "transparent",
                        borderLeft:
                          selectedRow === rowIdx ? "4px solid #1677ff" : "none",
                        height: "25px",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedRow !== rowIdx) {
                          e.currentTarget.style.backgroundColor = "#f5f5f5";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedRow !== rowIdx) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={
                            col.key === "actions" ? "actions-column" : ""
                          }
                          style={{
                            padding: "0.1rem 0.5rem",
                            ...(col.width ? { width: col.width } : {}),
                            ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                            ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                            ...(col.style || {}),
                          }}
                        >
                          {renderCell(row, col, rowIdx)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>


        {footerContent}

      </div>
      {/* Confirmation dialog for removing new row */}
      {confirmRemoveIdx !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.2)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 32,
              minWidth: 320,
              boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
              textAlign: "center",
            }}
          >
            <h4>Remove this new row?</h4>
            <div style={{ margin: "16px 0" }}>
              Are you sure you want to remove this unsaved row?
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setNewRows((prev) =>
                    prev.filter((_, i) => i !== confirmRemoveIdx)
                  );
                  setConfirmRemoveIdx(null);
                }}
              >
                Remove
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmRemoveIdx(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={showNothingToSaveDialog}
        title="Nothing to Save"
        message="There are no changes to save."
        onConfirm={() => setShowNothingToSaveDialog(false)}
        onCancel={() => setShowNothingToSaveDialog(false)}
      />
      {/* Unsaved changes confirmation dialog */}
      <ConfirmDialog
        open={showUnsavedConfirm}
        title="Unsaved Changes"
        message={
          <>
            <div>You have unsaved changes.</div>
            <div>
              {confirmAction === "refresh"
                ? "Are you sure you want to refresh this page?"
                : "Are you sure you want to discard your changes?"}
            </div>
          </>
        }
        onConfirm={() => {
          setShowUnsavedConfirm(false);
          try {
            // Notify listeners (e.g., CurrencyMaster) to clear any per-row stored previous values
            window.dispatchEvent(new CustomEvent("currency_clear_prev_keys"));
          } catch {
            // Ignore errors when dispatching events
          }
          if (confirmAction === "refresh") {
            if (typeof onRefresh === "function") {
              onRefresh();
            }
            resetTableUI();
            // Note: First row selection after refresh is handled by useEffect watching tableData
          } else {
            // cancel: discard edits only
            setNewRows([]);
            setEditBuffer({});
          }
          setConfirmAction(null);
        }}
        onCancel={() => {
          setShowUnsavedConfirm(false);
          setConfirmAction(null);
        }}
      />
    </div>
  );
});
export default InlineEditableTable;
