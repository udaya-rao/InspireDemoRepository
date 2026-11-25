import React, {
  useState,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useCallback,
} from "react";
import ReactDOM from "react-dom";
// import { NavLink } from "react-router-dom"; // unused
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
// import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore"; // unused

// Reusable component: Ellipsis text with tooltip shown only when visually truncated
function EllipsisWithTooltip({ text, style }) {
  const spanRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const checkOverflow = useCallback(() => {
    try {
      const el = spanRef.current;
      if (!el) return;
      const isOverflowing = el.scrollWidth > el.clientWidth;
      setShowTooltip(isOverflowing);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    checkOverflow();
    let ro;
    try {
      if (window.ResizeObserver) {
        ro = new window.ResizeObserver(checkOverflow);
        if (spanRef.current) ro.observe(spanRef.current);
      }
    } catch {
      /* ignore */
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
}

// columns: [{ key: 'name', label: 'Name', render?: (row) => ... }]
// data: array of objects
const SortableTable = forwardRef(function SortableTable(props, ref) {
  const {
    footerContent,
    columns,
    data,
    icon,
    title,
    modalContent,
    getActions,
    fixedFirstColumn = false,
    globalIgnoreSpecial = false,
    disableSearch = false,
    disablePagination = false,
    disableColumnFilters = false,
    disableSorting = false,
    autoSelectFirstRow = true,
    // Header dropdown filters: [{ key, label, options: [{value,label}], getValue?: (row) => any }]
    headerFilters,
    // Add controlled pagination props
    currentPage: controlledCurrentPage,
    onPageChange,
    afterAddButtons = null,
    pageSize: controlledPageSize,
    onPageSizeChange,
    printMenu,
    getRowStyle,
    hideActionsDropdown = false,
  } = props;

  const [tableData, setTableData] = useState(data);
  // Add this effect to sync tableData with data prop
  useEffect(() => {
    setTableData(data);
  }, [data]);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [columnSearch, setColumnSearch] = useState({}); // <-- Add state for column search

  // Use controlled or uncontrolled state for currentPage and perPage
  const [uncontrolledCurrentPage, setUncontrolledCurrentPage] = useState(1);
  const [uncontrolledPerPage, setUncontrolledPerPage] = useState(25);
  const [_lastNumericPerPage, setLastNumericPerPage] = useState(25);
  const [userManuallySetPerPage, setUserManuallySetPerPage] = useState(false);

  const currentPage =
    controlledCurrentPage !== undefined
      ? controlledCurrentPage
      : uncontrolledCurrentPage;
  const perPage =
    controlledPageSize !== undefined ? controlledPageSize : uncontrolledPerPage;

  // Handlers must be defined before effects that depend on them
  const handleSetCurrentPage = useCallback(
    (page) => {
      if (onPageChange) onPageChange(page);
      else setUncontrolledCurrentPage(page);
    },
    [onPageChange]
  );

  const handleSetPerPage = useCallback(
    (size) => {
      // Track last numeric page size to allow reverting from "All"
      if (size === "all") {
        if (typeof perPage === "number") setLastNumericPerPage(perPage);
      } else if (typeof size === "number") {
        setLastNumericPerPage(size);
      }
      // Mark that user manually set the page size
      setUserManuallySetPerPage(true);
      if (onPageSizeChange) onPageSizeChange(size);
      else setUncontrolledPerPage(size);
      // Optionally reset to page 1 when page size changes
      handleSetCurrentPage(1);
    },
    [onPageSizeChange, handleSetCurrentPage, perPage]
  );

  const [openFilter, setOpenFilter] = useState(null); // Track which column filter is open
  const filterInputRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownDirection, setDropdownDirection] = useState("down"); // 'down' | 'up'
  const [dropdownMenuPos, setDropdownMenuPos] = useState({ left: 0, top: 0 });
  const actionBtnRefs = useRef({});

  const [selectedRow, setSelectedRow] = useState(null); // Add selected row state
  const [pageInputValue, setPageInputValue] = useState("1"); // Add state for page input

  // Filter popover anchoring
  const filterBtnRefs = useRef({});
  const [filterPos, setFilterPos] = useState({
    left: 0,
    top: 0,
    direction: "down",
    arrowLeft: 20, // Default arrow position
  });

  // Dynamically size the scroll container to viewport
  const tableScrollRef = useRef(null);
  const [scrollMaxHeight, setScrollMaxHeight] = useState(null);

  // Header dropdown filter values
  const [headerFilterValues, setHeaderFilterValues] = useState({});

  // Header server-side filter hover menu
  const headerFilterBtnRefs = useRef({});
  const [openHeaderFilterMenu, setOpenHeaderFilterMenu] = useState(null); // key | null
  const [headerFilterMenuPos, setHeaderFilterMenuPos] = useState({
    left: 0,
    top: 0,
  });
  const headerFilterHoverTimeoutRef = useRef(null);

  // Listen for global insert events and insert into the current page without per-page wiring
  useEffect(() => {
    const handler = (e) => {
      try {
        const detail = e?.detail || {};
        const newRecord = detail.record;
        if (!newRecord) return;
        const position = detail.position || "currentPageTop";
        setTableData((prev) => {
          const dataArr = Array.isArray(prev) ? prev : [];
          if (disablePagination || perPage === "all") {
            // Insert at very top when pagination is off/all
            return [newRecord, ...dataArr];
          }
          const startIndex = (currentPage - 1) * perPage;
          if (position === "bottomOfCurrentPage") {
            const endIndex = Math.min(startIndex + perPage, dataArr.length);
            return [
              ...dataArr.slice(0, endIndex),
              newRecord,
              ...dataArr.slice(endIndex),
            ];
          }
          // Default: top of current page
          return [
            ...dataArr.slice(0, startIndex),
            newRecord,
            ...dataArr.slice(startIndex),
          ];
        });
      } catch {
        /* noop */
      }
    };
    window.addEventListener("sortableTable:insert", handler);
    return () => window.removeEventListener("sortableTable:insert", handler);
  }, [currentPage, perPage, disablePagination]);

  useEffect(() => {
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
      const basePaddingBottom = 12; // small breathing space inside card
      const minibarH = getMinibarHeight() || 44; // ensure space above GlobalMinibar
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

    // Also observe minibar size changes if present
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

  const didSetInitialPageSizeRef = useRef(false);

  // Expose refresh method
  useImperativeHandle(ref, () => ({
    refresh: () => {
      setSortConfig({ key: null, direction: "asc" });
      if (!disableSearch) setSearchTerm("");
      if (!disableColumnFilters) setColumnSearch({});
      if (!disablePagination) {
        // Reset via unified handlers so controlled parents stay in sync
        handleSetPerPage(25);
        handleSetCurrentPage(1);
      }
      // Allow initial page-size rule to run again after refresh
      try {
        didSetInitialPageSizeRef.current = false;
      } catch {
        // Ignore errors when resetting initial page size
      }
      setUserManuallySetPerPage(false); // Reset manual flag on refresh
      setSelectedRow(0); // Clear selected row on refresh
    },
    clearSelectedRow: () => setSelectedRow(null),
    getSelectedRow: () =>
      selectedRow !== null ? paginatedData[selectedRow] : null,
    getSelectedRowIndex: () => selectedRow,
  }));

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let result = tableData;

    // If search and filters are disabled, return original data
    if (disableSearch && disableColumnFilters) {
      return result;
    }

    // Apply header dropdown filters first (if any)
    try {
      if (Array.isArray(headerFilters) && headerFilters.length) {
        headerFilters.forEach((hf) => {
          // Allow render-only server-side header filters
          if (hf && hf.clientFilter === false) return;
          const sel = headerFilterValues?.[hf.key];
          if (sel !== undefined && sel !== null && sel !== "") {
            result = result.filter((row) => {
              try {
                const v =
                  typeof hf.getValue === "function"
                    ? hf.getValue(row)
                    : row?.[hf.key];
                return String(v ?? "") === String(sel);
              } catch {
                return true;
              }
            });
          }
        });
      }
    } catch {
      /* noop */
    }

    // Helper: normalize string for searching
    const normalize = (str, ignoreSpecial = false) => {
      let s = String(str ?? "").toLowerCase();
      if (ignoreSpecial) {
        try {
          s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        } catch {
          /* noop */
        }
        s = s.replace(/[^a-z0-9]/gi, "");
      }
      return s;
    };

    // Helper: pick value used for searching a given column
    const getSearchValue = (col, row) => {
      try {
        if (typeof col.getSearchValue === "function")
          return col.getSearchValue(row);
        if (Array.isArray(col.searchKeys)) {
          return col.searchKeys
            .map((k) => row?.[k])
            .filter(Boolean)
            .join(" ");
        }
        if (col.searchKey) return row?.[col.searchKey];
      } catch {
        /* ignore */
      }
      return row?.[col.key];
    };

    // Apply column-specific search (only if not disabled)
    if (!disableColumnFilters) {
      Object.entries(columnSearch).forEach(([key, value]) => {
        if (value && value.length >= 3) {
          const colMeta = (columns || []).find((c) => c.key === key) || {};
          const ignoreSpecial = !!colMeta.ignoreSpecial;
          const q = normalize(value, ignoreSpecial);
          result = result.filter((row) => {
            const val = getSearchValue(colMeta, row);
            return normalize(val || "", ignoreSpecial).includes(q);
          });
        }
      });
    }

    // Apply global search (only if not disabled)
    if (!disableSearch && searchTerm) {
      const qNorm = normalize(searchTerm, true);
      const qLower = searchTerm.toLowerCase();
      result = result.filter((row) => {
        return (columns || []).some((col) => {
          const val = getSearchValue(col, row);
          if (val === undefined || val === null) return false;
          const useIgnore = globalIgnoreSpecial || !!col.ignoreSpecial;
          if (useIgnore) {
            return normalize(val, true).includes(qNorm);
          }
          return String(val).toLowerCase().includes(qLower);
        });
      });
    }
    return result;
  }, [
    tableData,
    columnSearch,
    searchTerm,
    columns,
    globalIgnoreSpecial,
    disableSearch,
    disableColumnFilters,
    headerFilters,
    headerFilterValues,
  ]);

  const total = filteredData.length;
  const totalPages = disablePagination
    ? 1
    : perPage === "all"
      ? 1
      : Math.ceil(total / perPage);

  const paginatedData = useMemo(() => {
    if (disablePagination || perPage === "all") return filteredData;
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage, disablePagination]);

  // Decide initial page size ONCE: if total (after load) is < 25 -> "All"; else keep 25
  useEffect(() => {
    if (disablePagination) return;
    if (didSetInitialPageSizeRef.current) return;
    if (total > 0) {
      if (total < 25 && perPage !== "all") {
        handleSetPerPage("all");
      }
      didSetInitialPageSizeRef.current = true;
    }
  }, [total, perPage, disablePagination, handleSetPerPage]);

  // Auto-adjust page size based on search results (only if user hasn't manually set it)
  useEffect(() => {
    if (disablePagination) return;
    if (userManuallySetPerPage) return;

    const hasSearch =
      !!searchTerm ||
      Object.keys(columnSearch).some(
        (key) => columnSearch[key] && columnSearch[key].length >= 3
      );

    // If there are zero results, force "all" and page 1 so UI reflects 0 records clearly
    if (total === 0) {
      if (perPage !== "all") handleSetPerPage("all");
      handleSetCurrentPage(1);
      return;
    }

    if (hasSearch) {
      // If searching and results > 25, show 25 per page
      if (total > 25 && perPage === "all") {
        handleSetPerPage(25);
      }
      // If searching and results <= 25, show all
      else if (total <= 25 && perPage !== "all") {
        handleSetPerPage("all");
      }
    } else {
      // No search active - use original logic
      if (total < 25 && perPage !== "all") {
        handleSetPerPage("all");
      } else if (total >= 25 && perPage === "all") {
        handleSetPerPage(25);
      }
    }
  }, [
    total,
    searchTerm,
    columnSearch,
    perPage,
    disablePagination,
    handleSetPerPage,
    userManuallySetPerPage,
    handleSetCurrentPage,
  ]);

  // Reset to page 1 on search or perPage change
  useEffect(() => {
    if (!disablePagination) {
      // Use unified handler so controlled mode stays consistent
      handleSetCurrentPage(1);
    }
  }, [searchTerm, perPage, disablePagination, handleSetCurrentPage]);

  // Reset manual flag when search changes to allow auto-adjustment
  useEffect(() => {
    setUserManuallySetPerPage(false);
  }, [searchTerm, columnSearch]);

  // Also reset to page 1 when column filters change to avoid empty pages
  useEffect(() => {
    if (!disablePagination) {
      handleSetCurrentPage(1);
    }
  }, [columnSearch, disablePagination, handleSetCurrentPage]);

  // Reset to page 1 when header dropdown filters change
  useEffect(() => {
    if (!disablePagination) {
      handleSetCurrentPage(1);
    }
  }, [headerFilterValues, disablePagination, handleSetCurrentPage]);

  // Scroll to top when page changes
  useEffect(() => {
    if (!disablePagination && tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0;
    }
  }, [currentPage, disablePagination]);

  // Scroll to top when search inputs change (global or column filters)
  // Use rAF and a micro-timeout as some layout changes occur after state updates
  useEffect(() => {
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
  }, [searchTerm, columnSearch, filteredData.length]);

  // Update page input value when currentPage changes
  useEffect(() => {
    if (!disablePagination) {
      setPageInputValue(currentPage.toString());
    }
  }, [currentPage, disablePagination]);

  // Clear selection and close dropdown when pagination changes
  useEffect(() => {
    if (!disablePagination) {
      setOpenDropdown(null);
      if (autoSelectFirstRow && paginatedData.length > 0) {
        setSelectedRow(0);
      } else {
        setSelectedRow(null);
      }
    }
  }, [
    currentPage,
    perPage,
    disablePagination,
    autoSelectFirstRow,
    paginatedData.length,
  ]);

  // Auto-select first row on initial data load if enabled
  useEffect(() => {
    if (autoSelectFirstRow && paginatedData.length > 0) {
      setSelectedRow(0);
    }
  }, [autoSelectFirstRow, paginatedData.length]);

  const sortTable = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

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

    const sorted = [...tableData].sort((a, b) => {
      // Find the column definition to check if it has a sortValue function
      const colDef = columns.find((col) => col.key === key);
      let aVal;
      let bVal;

      if (colDef && typeof colDef.sortValue === "function") {
        // Use the custom sortValue function if available
        aVal = colDef.sortValue(a);
        bVal = colDef.sortValue(b);
      } else {
        // Fall back to direct property access
        aVal = a[key];
        bVal = b[key];
      }

      const cmp = compareValues(aVal, bVal);
      return direction === "asc" ? cmp : -cmp;
    });

    setTableData(sorted);
    setSortConfig({ key, direction });
  };

  const handleDropdown = (idx) => {
    // Highlight the row when opening the actions menu
    setSelectedRow(idx);
    if (openDropdown === idx) {
      setOpenDropdown(null);
      return;
    }

    // Decide whether to open up or down based on space inside the scroll container
    try {
      const el = actionBtnRefs.current[idx];
      const rect = el ? el.getBoundingClientRect() : null;
      const container = tableScrollRef?.current;
      const containerRect = container
        ? container.getBoundingClientRect()
        : null;
      const estimatedMenuHeight = 200; // px, conservative estimate

      if (rect && containerRect) {
        const spaceBelowContainer = containerRect.bottom - rect.bottom;
        const spaceAboveContainer = rect.top - containerRect.top;

        let direction = "down";
        if (
          spaceBelowContainer < estimatedMenuHeight &&
          spaceAboveContainer > spaceBelowContainer
        ) {
          direction = "up";
        }
        setDropdownDirection(direction);

        // Compute fixed position for the menu (viewport coords)
        const left = rect.left + 45; // align to the right of the icon
        const top = direction === "up" ? rect.top : rect.bottom;
        setDropdownMenuPos({ left, top });
      } else {
        setDropdownDirection("down");
      }
    } catch {
      setDropdownDirection("down");
    }
    setOpenDropdown(idx);
  };

  const handleDropdownClose = () => setOpenDropdown(null);

  useEffect(() => {
    // Close dropdown on outside click
    const handler = () => {
      setOpenDropdown(null);
    };
    if (openDropdown !== null) {
      window.addEventListener("click", handler);
      return () => window.removeEventListener("click", handler);
    }
  }, [openDropdown]);

  // Auto-flip dropdown if near viewport bottom (simplified for absolute positioning)
  useEffect(() => {
    if (openDropdown === null) return;

    const updateDirection = () => {
      try {
        const el = actionBtnRefs.current[openDropdown];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const container = tableScrollRef?.current;
        const containerRect = container
          ? container.getBoundingClientRect()
          : null;
        const estimatedMenuHeight = 200;

        if (rect && containerRect) {
          const spaceBelowContainer = containerRect.bottom - rect.bottom;
          const spaceAboveContainer = rect.top - containerRect.top;

          let newDirection = "down";
          if (
            spaceBelowContainer < estimatedMenuHeight &&
            spaceAboveContainer > spaceBelowContainer
          ) {
            newDirection = "up";
          }
          setDropdownDirection(newDirection);

          const left = rect.left + 45;
          const top = newDirection === "up" ? rect.top : rect.bottom;
          setDropdownMenuPos({ left, top });
        }
      } catch {
        /* ignore positioning errors */
      }
    };

    updateDirection();
    const container = tableScrollRef?.current;
    window.addEventListener("resize", updateDirection);
    if (container)
      container.addEventListener("scroll", updateDirection, { passive: true });

    return () => {
      window.removeEventListener("resize", updateDirection);
      if (container) container.removeEventListener("scroll", updateDirection);
    };
  }, [openDropdown]);

  // When any actions menu is open, block scrolling of the table and page but allow dropdown scrolling
  useEffect(() => {
    if (openDropdown === null) return;
    const preventScroll = (e) => {
      try {
        // Allow scrolling inside the actions dropdown itself
        if (e.target && typeof e.target.closest === "function") {
          const insideMenu = e.target.closest(".actions-dropdown-menu");
          if (insideMenu) return; // let the menu scroll
        }
      } catch {
        /* noop */
      }
      e.preventDefault();
      e.stopPropagation();
    };
    const container = tableScrollRef?.current;
    try {
      if (container) {
        container.addEventListener("wheel", preventScroll, { passive: false });
        container.addEventListener("touchmove", preventScroll, {
          passive: false,
        });
      }
      // Also guard against page-level scroll bubbling
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
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
      } catch {
        /* ignore listener remove errors */
      }
    };
  }, [openDropdown]);

  // Keep header hover menu anchored while scrolling/resizing
  useEffect(() => {
    if (openHeaderFilterMenu === null) return;
    const updatePos = () => {
      try {
        const el = headerFilterBtnRefs.current[openHeaderFilterMenu];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setHeaderFilterMenuPos({ left: rect.left, top: rect.bottom + 6 });
      } catch {
        /* noop */
      }
    };
    updatePos();
    const container = tableScrollRef?.current;
    window.addEventListener("scroll", updatePos, { passive: true });
    window.addEventListener("resize", updatePos);
    if (container)
      container.addEventListener("scroll", updatePos, { passive: true });
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
      if (container) container.removeEventListener("scroll", updatePos);
    };
  }, [openHeaderFilterMenu]);

  // Handle outside click for filter popup
  useEffect(() => {
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

  // Handle filter apply on Enter
  const handleFilterKeyDown = (e) => {
    if (e.key === "Enter") {
      setOpenFilter(null);
    }
  };

  // Keep filter popup within view when opened (auto scroll container slightly if needed)
  useEffect(() => {
    if (openFilter === null) return;
    const popup = filterInputRef.current;
    const container = tableScrollRef.current;
    if (!popup || !container) return;
    try {
      const popupRect = popup.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      if (popupRect.bottom > contRect.bottom - 8) {
        container.scrollTop += Math.ceil(
          popupRect.bottom - contRect.bottom + 8
        );
      }
      if (popupRect.top < contRect.top + 8) {
        container.scrollTop += Math.floor(popupRect.top - contRect.top - 8);
      }
    } catch {
      /* noop */
    }
  }, [openFilter]);

  // Generate a unique class for this table instance
  const tableInstanceClass = useMemo(
    () => `sortable-table-wrapper-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  // Compute per-column match counts for active column filters
  // Updated: counts reflect the current result size after applying ALL active filters,
  // so when multiple filters are chained, each badge shows the up-to-date count.
  const columnMatchCounts = useMemo(() => {
    const counts = {};
    const totalMatches = filteredData.length;
    Object.entries(columnSearch).forEach(([key, val]) => {
      if (val && val.length >= 3) counts[key] = totalMatches;
    });
    return counts;
  }, [filteredData.length, columnSearch]);

  return (
    <div className={tableInstanceClass + " w-100 h-100"}>
      <style>{`
        .${tableInstanceClass} .table thead th { position: sticky; top: 0; z-index: 25; will-change: transform; backface-visibility: hidden; }
        .${tableInstanceClass} .table thead { position: sticky; top: 0; z-index: 24; }
        .${tableInstanceClass} .table thead th, .${tableInstanceClass} .table tbody td { border-bottom: 1px solid #dee2e6; }
        .${tableInstanceClass} .table tbody td + td, .${tableInstanceClass} .table thead th + th { border-left: 1px solid #dee2e6; }
        /* Ensure Actions header text is not auto-capitalized */
        .${tableInstanceClass} .table thead th.actions-column,
        .${tableInstanceClass} .table thead th.actions-column span,
        .${tableInstanceClass} .table thead th.actions-column button { text-transform: none !important; }
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
            border-right: 1px solid #dee2e6;
          }
          .${tableInstanceClass} .table tbody td.no-data-cell {
            position: static !important;
            background: #fff !important;
            border-right: none !important;
          }
          .${tableInstanceClass} .table tbody tr.selected td:first-child {
            border-left: 4px solid #fff;
          }
          .${tableInstanceClass} .table thead th:first-child {
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
      <div
        className="card h-100"
        style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {/* Left: Title */}
        {title && (
          <div
            className="card-header"
            style={{ paddingTop: "0.45rem", paddingBottom: "0.45rem" }}
          >
            <div
              className={`table-header-toolbar d-flex flex-wrap align-items-center justify-content-between w-100 ${
                Array.isArray(headerFilters) && headerFilters.length > 0
                  ? "has-custom-filters"
                  : ""
              }`}
              style={{ rowGap: 8 }}
            >
              <div className="table-title-section" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {icon && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginRight: 6,
                        width: 26,
                        height: 26,
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>
                  )}
                  <h1
                    className="mb-0 text-nowrap"
                    style={{ fontWeight: 700, fontSize: 19, lineHeight: "1", whiteSpace: "nowrap" }}
                  >
                    {title || "Table"}
                  </h1>
                </div>
              </div>

              {/* Center: Filters & Search */}
              <div
                className="table-filter-search-section table-search-pagination-section flex-grow-1 d-flex justify-content-end align-items-center my-1 my-md-0"
                style={{ minWidth: 0, marginRight: 10 }}
              >
                {/* Header dropdown filters (render before the search input) */}
                {Array.isArray(headerFilters) && headerFilters.length > 0 && (
                  <div
                    className="d-flex align-items-center"
                    style={{ gap: 8, marginRight: 10, flexWrap: "nowrap" }}
                  >
                    {headerFilters.map((hf) => (
                      <div
                        key={hf.key}
                        className="d-flex align-items-center"
                        style={{ gap: 6, whiteSpace: "nowrap" }}
                      >
                        {hf.label && hf.showLabel !== false && (
                          <label style={{ fontSize: 13, color: "#34495e" }}>
                            {hf.label}
                          </label>
                        )}
                        <button
                          ref={(el) =>
                            (headerFilterBtnRefs.current[hf.key] = el)
                          }
                          className="btn btn-sm"
                          title={hf.tooltip || hf.placeholder || "Filter Options"}
                          style={{
                            background: "#fff",
                            color: "#1677ff",
                            borderRadius: "8px",
                            width: 33,
                            height: 33,
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "none",
                            border: "1px solid #d0d7de",
                            cursor: "pointer",
                          }}
                          onMouseEnter={() => {
                            try {
                              if (headerFilterHoverTimeoutRef.current)
                                clearTimeout(
                                  headerFilterHoverTimeoutRef.current
                                );
                            } catch {
                              // Ignore timeout clear errors
                            }
                            headerFilterHoverTimeoutRef.current = setTimeout(
                              () => {
                                try {
                                  const el =
                                    headerFilterBtnRefs.current[hf.key];
                                  if (el) {
                                    const rect = el.getBoundingClientRect();
                                    setHeaderFilterMenuPos({
                                      left: rect.left,
                                      top: rect.bottom + 6,
                                    });
                                  }
                                } catch {
                                  // Ignore positioning errors
                                }
                                setOpenHeaderFilterMenu(hf.key);
                              },
                              200
                            );
                          }}
                          onMouseLeave={() => {
                            try {
                              if (headerFilterHoverTimeoutRef.current)
                                clearTimeout(
                                  headerFilterHoverTimeoutRef.current
                                );
                            } catch {
                              // Ignore timeout clear errors
                            }
                            headerFilterHoverTimeoutRef.current = setTimeout(
                              () => {
                                setOpenHeaderFilterMenu((cur) =>
                                  cur === hf.key ? null : cur
                                );
                              },
                              100
                            );
                          }}
                        >
                          <FilterAltIcon
                            style={{ fontSize: 18, color: "#1677ff" }}
                          />
                        </button>

                        {openHeaderFilterMenu === hf.key &&
                          ReactDOM.createPortal(
                            <div
                              className="dropdown-menu show"
                              style={{
                                display: "block",
                                position: "fixed",
                                left: headerFilterMenuPos.left,
                                top: headerFilterMenuPos.top,
                                minWidth: 200,
                                maxHeight: 260,
                                overflowY: "auto",
                                zIndex: 4000,
                                boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                              }}
                              onMouseEnter={() => {
                                try {
                                  if (headerFilterHoverTimeoutRef.current)
                                    clearTimeout(
                                      headerFilterHoverTimeoutRef.current
                                    );
                                } catch {
                                  // Ignore timeout clear errors
                                }
                              }}
                              onMouseLeave={() => {
                                headerFilterHoverTimeoutRef.current =
                                  setTimeout(() => {
                                    setOpenHeaderFilterMenu(null);
                                  }, 120);
                              }}
                            >
                              {hf.placeholder !== null &&
                                hf.placeholder !== undefined && (
                                  <div
                                    className="dropdown-item text-muted"
                                    style={{ pointerEvents: "none" }}
                                  >
                                    {hf.placeholder}
                                  </div>
                                )}
                              {(hf.options || []).map((opt) => (
                                <button
                                  key={String(opt.value)}
                                  className="dropdown-item"
                                  type="button"
                                  onClick={() => {
                                    const val = String(opt.value);
                                    setHeaderFilterValues((prev) => ({
                                      ...prev,
                                      [hf.key]: val,
                                    }));
                                    try {
                                      hf.onChange && hf.onChange(val);
                                    } catch {
                                      // Ignore onChange errors
                                    }
                                    setOpenHeaderFilterMenu(null);
                                  }}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>,
                            document.body
                          )}
                      </div>
                    ))}
                  </div>
                )}

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
                        value={searchTerm}
                        placeholder="Search..."
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                {!disablePagination && (
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
                      onClick={() => handleSetCurrentPage(1)}
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
                        currentPage > 1 && handleSetCurrentPage(currentPage - 1)
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

                        handleSetCurrentPage(val);
                      }}
                      onBlur={(e) => {
                        // On blur, ensure we have a valid value
                        const inputValue = e.target.value;
                        if (
                          inputValue === "" ||
                          isNaN(parseInt(inputValue, 10))
                        ) {
                          handleSetCurrentPage(1);
                          setPageInputValue("1");
                        } else {
                          let val = parseInt(inputValue, 10);
                          if (val < 1) val = 1;
                          if (val > totalPages) val = totalPages;
                          handleSetCurrentPage(val);
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
                        background:
                          currentPage === totalPages ? "#f0f0f0" : "#fff",
                        color: "rgb(122, 75, 120)",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "none",
                        cursor:
                          currentPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={() =>
                        currentPage < totalPages &&
                        handleSetCurrentPage(currentPage + 1)
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
                        background:
                          currentPage === totalPages ? "#f0f0f0" : "#fff",
                        color: "rgb(122, 75, 120)",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "none",
                        cursor:
                          currentPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={() => handleSetCurrentPage(totalPages)}
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
                      className="btn btn-md dropdown-toggle"
                      data-bs-toggle="dropdown"
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
                        minWidth: "65px",
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
                              handleSetPerPage(num);
                            }}
                          >
                            {num}
                          </a>
                        ))}
                      <a
                        className="dropdown-item"
                        style={{ minWidth: 0 }}
                        href="#"
                        key="all"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSetPerPage("all");
                        }}
                      >
                        All
                      </a>
                    </div>
                  </div>
                )}


                {typeof props.onRefresh === "function" && (
                  <button
                    className="btn btn-sm"
                    style={{
                      background: "#fff",
                      color: "#1677ff",
                      borderRadius: "8px",
                      width: 33,
                      height: 33,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "none",
                      border: "1px solid #d0d7de",
                    }}
                    onClick={props.onRefresh}
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
                )}
                {typeof props.onAdd === "function" && (
                  <button
                    className="btn btn-sm"
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
                    onClick={props.onAdd}
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

                {afterAddButtons && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
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
            id="table-default"
            ref={tableScrollRef}
            className={`table-responsive ${fixedFirstColumn ? "table-container" : ""
              }`}
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              maxHeight: scrollMaxHeight
                ? `${scrollMaxHeight - (footerContent ? 38 : 0)}px`
                : undefined,
              overflowY: openDropdown !== null ? "hidden" : "auto",
              overflowX: "auto",
              position: "relative",
            }}
          >
            <table
              className="table table-vcenter table- table-bordered"
              style={{
                minWidth: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead className="" style={{ zIndex: 100, color: "#fff" }}>
                <tr style={{ position: "sticky", top: 0, zIndex: 50 }}>
                  {columns.map((col, index) => (
                    <th
                      key={col.key}
                      className={
                        (fixedFirstColumn && index === 0
                          ? "fixed-first-column"
                          : "") +
                        (col.key === "actions" ? " actions-column" : "")
                      }
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
                            style={{ color: "#fff", textTransform: "none" }}
                          >
                            {col.key === "actions" ? "Actions" : col.label}
                          </span>
                        )}

                        {col.searchable && !disableColumnFilters && (
                          <>
                            {/* Always show filter icon. If filter is active, also show clear icon. */}
                            <span
                              style={{
                                position: "relative",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              <button
                                className="btn-link p-0 ms-1"
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
                                      const estimatedW = 220; // Filter popup width
                                      const spaceBelow =
                                        contRect.bottom - rect.bottom;
                                      const direction =
                                        spaceBelow < estimatedH ? "up" : "down";

                                      // Calculate left position
                                      let leftPos =
                                        rect.left + rect.width * 0.1;
                                      let arrowLeft = 20; // Default arrow position

                                      // Check if popup would go off-screen to the right
                                      if (
                                        leftPos + estimatedW >
                                        window.innerWidth - 10
                                      ) {
                                        // Position to the left of the button instead
                                        leftPos =
                                          rect.right -
                                          estimatedW -
                                          rect.width * 0.1;
                                        // Ensure it doesn't go off-screen to the left
                                        if (leftPos < 10) {
                                          leftPos = 10;
                                        }
                                        // Calculate arrow position for left-side popup
                                        arrowLeft = estimatedW - 20; // Arrow near right edge
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
                                      const estimatedW = 220; // Filter popup width
                                      const direction =
                                        rect.bottom + estimatedH > viewportH - 8
                                          ? "up"
                                          : "down";

                                      // Calculate left position
                                      let leftPos =
                                        rect.left + rect.width * 0.1;
                                      let arrowLeft = 20; // Default arrow position

                                      // Check if popup would go off-screen to the right
                                      if (
                                        leftPos + estimatedW >
                                        viewportW - 10
                                      ) {
                                        // Position to the left of the button instead
                                        leftPos =
                                          rect.right -
                                          estimatedW -
                                          rect.width * 0.1;
                                        // Ensure it doesn't go off-screen to the left
                                        if (leftPos < 10) {
                                          leftPos = 10;
                                        }
                                        // Calculate arrow position for left-side popup
                                        arrowLeft = estimatedW - 20; // Arrow near right edge
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
                                title={`Filter ${col.label}`}
                                style={{ color: "#fff", lineHeight: 0 }}
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
                                    display: "inline-block",
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
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="no-data-cell"
                      style={{
                        textAlign: "center",
                        color: "#888",
                        padding: "32px 0",
                        backgroundColor: "#fff",
                        position: "static",
                      }}
                    >
                      No Data Available
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={selectedRow === idx ? "selected" : ""}
                      style={{
                        height: "25px",
                        backgroundColor:
                          selectedRow === idx
                            ? "#e3f2fd"
                            : typeof getRowStyle === "function"
                              ? getRowStyle(row, idx)?.backgroundColor ||
                              "transparent"
                              : "transparent",
                        borderLeft:
                          selectedRow === idx ? "4px solid #1677ff" : "none",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                        ...(typeof getRowStyle === "function"
                          ? getRowStyle(row, idx)
                          : {}),
                      }}
                      onMouseEnter={(e) => {
                        if (
                          selectedRow !== idx &&
                          !(
                            typeof getRowStyle === "function" &&
                            getRowStyle(row, idx)?.backgroundColor
                          )
                        ) {
                          e.currentTarget.style.backgroundColor = "#f5f5f5";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          selectedRow !== idx &&
                          !(
                            typeof getRowStyle === "function" &&
                            getRowStyle(row, idx)?.backgroundColor
                          )
                        ) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                      onClick={() => setSelectedRow(idx)}
                    >
                      {columns.map((col, colIndex) => {
                        return (
                          <td
                            key={col.key}
                            style={{
                              padding: "0.10rem 0.5rem",
                              ...(col.key === "actions"
                                ? {
                                  width: 90,
                                  minWidth: 70,
                                  maxWidth: 120,
                                  textAlign: "center",
                                }
                                : {}),
                              ...(col.width ? { width: col.width } : {}),
                              ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                              ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                              ...col.style,
                                // Apply row background color to fixed first column
                                ...(fixedFirstColumn && colIndex === 0
                                  ? typeof getRowStyle === "function" &&
                                    getRowStyle(row, idx)?.backgroundColor
                                    ? {
                                      backgroundColor:
                                        getRowStyle(row, idx).backgroundColor,
                                    }
                                    : selectedRow === idx
                                      ? { backgroundColor: "#e3f2fd" }
                                      : { backgroundColor: "#fff" }
                                  : {}),
                              }}
                            >
                          {col.key === "actions" ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: hideActionsDropdown
                                  ? "center"
                                  : "flex-start",
                                width: "100%",
                                gap: hideActionsDropdown ? 0 : 3,
                              }}
                            >
                              {/* Render view icon if present */}
                              {getActions &&
                                getActions(row).some(
                                  (a) =>
                                    a.label &&
                                    a.label.toLowerCase() === "view"
                                ) && (
                                  <button
                                    className="btn-sm"
                                    title="View"
                                    style={{
                                      padding: "2px 6px",
                                      display: "inline-flex",
                                      color: "#1677ff",
                                      background: "#fff",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRow(idx); // Highlight the row for direct view icon as well
                                      handleDropdownClose(); // Close dropdown when view is clicked
                                      const viewAction = getActions(row).find(
                                        (a) =>
                                          a.label &&
                                          a.label.toLowerCase() === "view"
                                      );
                                      if (viewAction && viewAction.onClick)
                                        viewAction.onClick(row);
                                    }}
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
                                      <circle cx="12" cy="12" r="3" />
                                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                    </svg>
                                  </button>
                                )}

                              {/* Conditionally render the three-dots dropdown */}
                              {!hideActionsDropdown && (
                                <div
                                  className="dropdown"
                                  style={{ position: "relative" }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span
                                    ref={(el) =>
                                      (actionBtnRefs.current[idx] = el)
                                    }
                                    style={{
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      padding: 4,
                                      borderRadius: 6,
                                      transition: "background 0.2s",
                                      ...(openDropdown === idx
                                        ? { background: "#f3f4f6" }
                                        : {}),
                                    }}
                                    aria-label="Actions"
                                    title="More"
                                    tabIndex={0}
                                    onClick={() => handleDropdown(idx)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ")
                                        handleDropdown(idx);
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
                                      className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"
                                    >
                                      <path
                                        stroke="none"
                                        d="M0 0h24v24H0z"
                                        fill="none"
                                      />
                                      <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                                      <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                                      <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                                    </svg>
                                  </span>

                                  {openDropdown === idx &&
                                    ReactDOM.createPortal(
                                      <div
                                        className="dropdown-menu show actions-dropdown-menu"
                                        style={{
                                          display: "block",
                                          position: "fixed",
                                          left: dropdownMenuPos.left,
                                          top: dropdownMenuPos.top,
                                          transform:
                                            dropdownDirection === "up"
                                              ? "translateY(-100%)"
                                              : "none",
                                          minWidth: 160,
                                          maxHeight: 200,
                                          overflowY: "auto",
                                          overflowX: "hidden",
                                          zIndex: 10000,
                                          boxShadow:
                                            "0 2px 12px rgba(0,0,0,0.12)",
                                          backgroundColor: "#fff",
                                          border: "1px solid #dee2e6",
                                          borderRadius: "6px",
                                          padding: "4px 0",
                                        }}
                                        onWheel={(e) => {
                                          e.stopPropagation();
                                        }}
                                        onTouchMove={(e) => {
                                          e.stopPropagation();
                                        }}
                                      >
                                        {(getActions ? getActions(row) : []).map(
                                          (action, i) => (
                                            <button
                                              key={i}
                                              className="dropdown-item d-flex align-items-center"
                                              type="button"
                                              onClick={() => {
                                                setSelectedRow(idx); // Highlight the row
                                                action.onClick &&
                                                  action.onClick(row);
                                                handleDropdownClose();
                                              }}
                                            >
                                              {action.icon && (
                                                <span className="me-2">
                                                  {action.icon}
                                                </span>
                                              )}
                                              {action.label}
                                            </button>
                                          )
                                        )}
                                      </div>,
                                      document.body
                                    )}
                                </div>
                              )}
                            </div>
                          ) : col.render ? (
                            col.render(row)
                          ) : (
                            <EllipsisWithTooltip text={row[col.key]} />
                          )}
                        </td>
                      );
                    })}
                </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {footerContent}
      </div>

      {modalContent}
    </div>
  );
});

export default SortableTable;
