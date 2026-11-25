import React, {
  useState,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import ReactDOM from "react-dom";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import FilterListAltIcon from '@mui/icons-material/FilterListAlt';

// DynamicSortableTable: Same UI/UX as SortableTable but fully server-controlled
// Props expected for server-side control:
// - currentPage, onPageChange(page)
// - pageSize, onPageSizeChange(size)
// - totalRecords (number)
// - onSort(key, direction)
// - onSearch(searchText)
// - onColumnFiltersChange?(filtersObject)
const DynamicSortableTable = forwardRef(function DynamicSortableTable(props, ref) {
  const {
    columns,
    data,
    icon,
    title,
    modalContent,
    getActions,
    fixedFirstColumn = false,
    disableSearch = false,
    disablePagination = false,
    disableColumnFilters = false,
    disableSorting = false,
    autoSelectFirstRow = true,
    headerFilters,
    currentPage = 1,
    onPageChange,
    pageSize = 25,
    onPageSizeChange,
    printMenu,
    totalRecords = 0,
    onSort,
    onSearch,
    onColumnFiltersChange,
    // Generic unified query emission: receives full payload for API calls
    // { pageSize, pageNumber, columnName, isGlobalSearch, sortOrder, searchKeyword }
    onQueryChange,
    // Optional: page size to use when initiating a global search
    searchInitialPageSize = 25,
    // Optional: customize page size behavior
    pageSizeOptions,
    lockToAll = false,
    afterAddButtons,
    showDisplayAll = false,
    onDisplayAll,
    renderContext = {},
    renderSubRow,
    beforeRefreshButtons,
    onPrint,
    customSearchControls,
  } = props;

  // ---- Pre-computed booleans to avoid repeating typeof checks ----
  const hasUnifiedQuery = typeof onQueryChange === "function";
  const hasLegacySearch = typeof onSearch === "function";
  const hasLegacyColumnFilter = typeof onColumnFiltersChange === "function";
  const hasOnPageChange = typeof onPageChange === "function";
  const hasOnPageSizeChange = typeof onPageSizeChange === "function";
  const hasOnSort = typeof onSort === "function";

  // Local UI states (no client data processing)
  const [displayPage, setDisplayPage] = useState(currentPage);
  const [displayPageSize, setDisplayPageSize] = useState(pageSize);
  const [openFilter, setOpenFilter] = useState(null);
  const filterInputRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownDirection, setDropdownDirection] = useState("down");
  const [dropdownMenuPos, setDropdownMenuPos] = useState({ left: 0, top: 0 });
  const actionBtnRefs = useRef({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [pageInputValue, setPageInputValue] = useState(String(currentPage));
  const filterBtnRefs = useRef({});
  const [filterPos, setFilterPos] = useState({
    left: 0,
    top: 0,
    direction: "down",
    arrowLeft: 20,
  });
  const tableScrollRef = useRef(null);
  const [scrollMaxHeight, setScrollMaxHeight] = useState(null);
  const [columnSearch, setColumnSearch] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isDisplayAllActive, setIsDisplayAllActive] = useState(false);
  const isUserSelectedAllRef = useRef(false);

  // Header dropdown filter values (delegated to parent via props.onChange if provided)
  const headerFilterBtnRefs = useRef({});
  const [openHeaderFilterMenu, setOpenHeaderFilterMenu] = useState(null);
  const [headerFilterMenuPos, setHeaderFilterMenuPos] = useState({
    left: 0,
    top: 0,
  });
  const headerFilterHoverTimeoutRef = useRef(null);

  // Sorting clicks: call parent, just keep sortConfig for arrows
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const standardPageSizes = useMemo(() => {
    return Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0
      ? pageSizeOptions
      : [25, 50, 100, 200];
  }, [pageSizeOptions]);

  // Total pages based on server-provided totalRecords; fallback to data.length only if server total is undefined/null
  const effectiveTotal = useMemo(() => {
    // Accept multiple common prop names for total records for robustness
    const candidates = [
      totalRecords,
      props.total,
      props.totalCount,
      props.count,
      props.recordsTotal,
    ];
    for (const c of candidates) {
      // Accept 0 as a valid value from server (don't skip it)
      if (c !== undefined && c !== null) {
        const n = Number(c);
        if (!isNaN(n)) return n; // Return 0 if server explicitly returns 0
      }
    }
    // Fallback to current page length only when server total is truly unavailable (undefined/null)
    return Array.isArray(data) ? data.length : 0;
  }, [totalRecords, props.total, props.totalCount, props.count, props.recordsTotal, data]);

  const isAllSelected = useMemo(() => {
    if (lockToAll) return true;
    const activeSize = typeof displayPageSize === "number" ? displayPageSize : pageSize;
    // If explicitly set to a standard number, respect it immediately
    if (typeof activeSize === "number" && standardPageSizes.includes(activeSize)) {
      return false;
    }
    if (isUserSelectedAllRef.current) return true;
    if (pageSize === "all" || displayPageSize === "all") return true;
    const tot = Number(effectiveTotal);
    if (tot > 0 && tot < 25) return true;
    const numSize = Number(activeSize);
    if (tot > 0 && numSize === tot) return true;
    if (numSize && !standardPageSizes.includes(numSize) && numSize > 0) return true;
    return false;
  }, [lockToAll, pageSize, displayPageSize, effectiveTotal, standardPageSizes]);

  const totalPages = disablePagination || isAllSelected
    ? 1
    : Math.max(
      1,
      Math.ceil(
        (Number(effectiveTotal) || 0) /
        (Number(pageSize) || Number(displayPageSize) || 25)
      )
    );

  // Helper to build searchFilter array from active column filters
  const buildSearchFilterArray = (columnSearchObj) => {
    const filters = [];
    let sequence = 1;
    Object.entries(columnSearchObj || {}).forEach(([colKey, value]) => {
      if (value && String(value).trim().length >= 1) {
        filters.push({
          columnName: colKey,
          searchKeyword: String(value),
          sortOrder: "", // Specific sort is handled in buildQueryPayload
          columnSequence: sequence++,
        });
      }
    });
    return filters;
  };

  // Helper to build query payload with preserved filters
  const buildQueryPayload = (pageNum, pSize, sortKey = null, sortDir = null) => {
    const isGlobal = (searchTerm || "").length > 0;
    const targetSize = pSize !== undefined && pSize !== null ? pSize : displayPageSize;
    const isExplicitStandardNumber =
      typeof targetSize === "number" && standardPageSizes.includes(targetSize);

    const isAll =
      !isExplicitStandardNumber &&
      (targetSize === "all" ||
        (isUserSelectedAllRef.current && (pSize === undefined || pSize === "all")) ||
        (!standardPageSizes.includes(Number(targetSize)) && typeof targetSize === "number" && Number(targetSize) > 0));

    const numericSize = isAll
      ? (() => {
        const total = Number(effectiveTotal);
        if (!isNaN(total) && total > 0) return total;
        return Array.isArray(data) ? data.length : 100000;
      })()
      : Number(targetSize) || 25;

    // Inclusion logic for searchFilter array satisfying backend requirements:

    const finalFilters = [];
    let seq = 1;

    // Add column search filters
    Object.entries(columnSearch || {}).forEach(([k, v]) => {
      if (v && String(v).trim().length >= 1) {
        finalFilters.push({
          columnName: k,
          searchKeyword: String(v),
          sortOrder: "",
          columnSequence: seq++
        });
      }
    });

    // Add global search filter if present (isGlobalSearch will be 1)
    if (isGlobal && (searchTerm || "").trim().length > 0) {

      finalFilters.push({
        columnName: "",
        searchKeyword: String(searchTerm),
        sortOrder: "",
        columnSequence: seq++
      });
    }

    // Add sort column if not already in filters (mandatory for backend to sort)
    const sortColumn = sortKey || sortConfig.key;
    const sortDirection =
      sortDir || (sortConfig.key ? sortConfig.direction : "");

    if (sortColumn) {
      const existing = finalFilters.find(f => f.columnName === sortColumn);
      if (!existing) {
        finalFilters.push({
          columnName: sortColumn,
          searchKeyword: "",
          sortOrder: "",
          columnSequence: seq++
        });
      }
    }

    // Populate top-level fields for backend compatibility
    let topColumnName = sortColumn || ""; // Use sortColumn as primary for top-level columnName
    let topSearchKeyword = "";

    if (isGlobal) {
      topSearchKeyword = String(searchTerm || "");
    } else {
      // Find the first non-empty column search
      const activeEntry = Object.entries(columnSearch || {}).find(([, v]) => v && String(v).trim().length > 0);
      if (activeEntry) {
        // If no sortColumn, use the search column name
        if (!topColumnName) {
          topColumnName = activeEntry[0];
        }
        topSearchKeyword = String(activeEntry[1]);
      }
    }

    return {
      pageSize: numericSize,
      isAll,
      pageNumber: Math.max(0, Number(pageNum) - 1),
      columnName: topColumnName,
      isGlobalSearch: isGlobal ? 1 : 0,
      sortOrder: sortDirection,
      searchKeyword: topSearchKeyword,
      searchFilter: finalFilters,
    };
  };

  // If total pages shrink (e.g., after filters or deletion), clamp current page and emit query
  useEffect(() => {
    if (disablePagination) return;
    if (displayPage > totalPages) {
      setDisplayPage(totalPages);
      if (hasOnPageChange) onPageChange(totalPages);
      if (hasUnifiedQuery && typeof onQueryChange === "function") {
        onQueryChange(buildQueryPayload(totalPages, displayPageSize));
      }
    }
  }, [totalPages, displayPage, disablePagination, hasOnPageChange, onPageChange, hasUnifiedQuery, onQueryChange]);


  // Keep internal display states in sync with controlled props
  useEffect(() => {
    setDisplayPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setDisplayPageSize(pageSize);
    if (typeof pageSize === "number" && standardPageSizes.includes(pageSize)) {
      isUserSelectedAllRef.current = false;
    } else if (pageSize === "all") {
      isUserSelectedAllRef.current = true;
    }
  }, [pageSize, standardPageSizes]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    closeDropdowns: () => {
      let closed = false;
      if (openDropdown !== null) {
        setOpenDropdown(null);
        closed = true;
      }
      if (openFilter !== null) {
        setOpenFilter(null);
        closed = true;
      }
      if (openHeaderFilterMenu !== null) {
        setOpenHeaderFilterMenu(null);
        closed = true;
      }
      return closed;
    },
    isDropdownOpen: () => openDropdown !== null || openFilter !== null || openHeaderFilterMenu !== null,
    clearSelectedRow: () => setSelectedRow(null),
    getSelectedRow: () => (selectedRow !== null ? data[selectedRow] : null),
    getSelectedRowIndex: () => selectedRow,
    selectRowByIndex: (index) => {
      if (index >= 0 && index < (data || []).length) {
        setSelectedRow(index);
        // Scroll the row into view
        setTimeout(() => {
          try {
            const tableElement = tableScrollRef.current?.querySelector?.('tbody');
            if (tableElement) {
              const rows = tableElement.querySelectorAll('tr');
              if (rows[index]) {
                rows[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          } catch (err) {
            console.error("Error scrolling to row:", err);
          }
        }, 100);
      }
    },
    refresh: () => {
      // Reset local UI state
      setSearchTerm("");
      setColumnSearch({});
      setSelectedRow(null);
      setOpenDropdown(null);
      setOpenFilter(null);
      setPageInputValue("1");
      setSortConfig({ key: null, direction: "asc" });
      setIsDisplayAllActive(false);

      // Fallback to legacy callbacks only when no unified handler exists.
      if (!hasUnifiedQuery) {
        if (hasLegacySearch) onSearch("");
        if (hasLegacyColumnFilter) onColumnFiltersChange({});
        if (hasOnPageChange) onPageChange(1);
      }
    },
  }));

  // Layout sizing similar to SortableTable
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
      const basePaddingBottom = 12;
      const minibarH = getMinibarHeight() || 44;
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

  // Keep page input in sync
  useEffect(() => {
    if (!disablePagination) setPageInputValue(String(displayPage));
  }, [displayPage, disablePagination]);

  // Auto-select first row on data changes
  useEffect(() => {
    if (autoSelectFirstRow && (data || []).length > 0) setSelectedRow(0);
    else setSelectedRow(null);
  }, [autoSelectFirstRow, data]);

  // Actions dropdown anchoring
  const handleDropdown = (idx) => {
    setSelectedRow(idx);
    if (openDropdown === idx) {
      setOpenDropdown(null);
      return;
    }
    try {
      const el = actionBtnRefs.current[idx];
      const rect = el ? el.getBoundingClientRect() : null;
      const container = tableScrollRef?.current;
      const containerRect = container
        ? container.getBoundingClientRect()
        : null;
      const estimatedMenuHeight = 200;
      if (rect && containerRect) {
        const spaceBelowContainer = containerRect.bottom - rect.bottom;
        const spaceAboveContainer = rect.top - containerRect.top;
        if (
          spaceBelowContainer < estimatedMenuHeight &&
          spaceAboveContainer > spaceBelowContainer
        ) {
          setDropdownDirection("up");
        } else {
          setDropdownDirection("down");
        }
        const left = rect.left + 45;
        const top = dropdownDirection === "up" ? rect.top : rect.bottom;
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
    const handler = () => setOpenDropdown(null);
    if (openDropdown !== null) {
      window.addEventListener("click", handler);
      return () => window.removeEventListener("click", handler);
    }
  }, [openDropdown]);

  // When any actions menu is open, block scroll outside menu
  useEffect(() => {
    if (openDropdown === null) return;
    const preventScroll = (e) => {
      try {
        if (e.target && typeof e.target.closest === "function") {
          const insideMenu = e.target.closest(".actions-dropdown-menu");
          if (insideMenu) return;
        }
      } catch (err) {
        console.log(err);
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
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
    } catch (err) {
      console.log(err);
    }
    return () => {
      try {
        if (container) {
          container.removeEventListener("wheel", preventScroll);
          container.removeEventListener("touchmove", preventScroll);
        }
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
      } catch (err) {
        console.log(err);
      }
    };
  }, [openDropdown]);

  // Filter popup helpers
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        filterInputRef.current &&
        !filterInputRef.current.contains(event.target)
      ) {
        setOpenFilter(null);
      }
      if (
        !event.target.closest(".dropdown") &&
        !event.target.closest("tr")
      ) {
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
    if (e.key === "Enter") setOpenFilter(null);
  };

  // Debounced emit for global search and column filters
  const debounceRef = useRef(null);
  const emitServerSearch = (payloadFn) => {
    if (!hasLegacySearch && !hasLegacyColumnFilter) return;
    try {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    } catch (err) {
      console.log(err);
    }
    debounceRef.current = setTimeout(() => {
      const payload = payloadFn();
      if (payload.global !== undefined && hasLegacySearch) {
        onSearch(payload.global);
      }
      if (
        payload.columnFilters !== undefined &&
        hasLegacyColumnFilter
      ) {
        onColumnFiltersChange(payload.columnFilters);
      }
    }, 250);
  };

  // Compute per-column "badges" counts
  // Rules:
  // - When ANY column filter (>=3 chars) OR global search is active -> show total count on ALL searchable columns
  // - When NOTHING is filtered/searched (e.g., after refresh) -> show NO badges
  const columnMatchCounts = useMemo(() => {
    const counts = {};
    const total = Number(totalRecords) || (data ? data.length : 0);
    const hasAnyColumnFilter = Object.values(columnSearch).some(
      (v) => (v || "").length >= 3
    );
    const hasGlobalSearch = (searchTerm || "").length > 0;
    if (hasAnyColumnFilter || hasGlobalSearch) {
      (columns || []).forEach((c) => {
        if (c && c.searchable) counts[c.key] = total;
      });
    }
    return counts;
  }, [columnSearch, totalRecords, data, columns, searchTerm]);

  // Table instance class for sticky styles
  const tableInstanceClass = useMemo(
    () =>
      `sortable-table-wrapper-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    []
  );


  const handleSortClick = (key) => {
    if (disableSorting) return;
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    if (!hasUnifiedQuery && hasOnSort) {
      onSort(key, direction);
    }

    // Emit unified query payload on sort
    if (hasUnifiedQuery) {
      const payload = buildQueryPayload(displayPage || 1, pageSize, key, direction);
      onQueryChange(payload);
    }
  };

  return (
    <div className={tableInstanceClass + " w-100 h-100"}>
      <style>{`
        .${tableInstanceClass} .table thead th { position: sticky; top: 0; z-index: 25; will-change: transform; backface-visibility: hidden; }
        .${tableInstanceClass} .table thead { position: sticky; top: 0; z-index: 24; }
        .${tableInstanceClass} .table thead th, .${tableInstanceClass} .table tbody td { border-bottom: 1px solid #dee2e6; }
        .${tableInstanceClass} .table tbody td + td, .${tableInstanceClass} .table thead th + th { border-left: 1px solid #dee2e6; }
        .${tableInstanceClass} .table thead th.actions-column,
        .${tableInstanceClass} .table thead th.actions-column span,
        .${tableInstanceClass} .table thead th.actions-column button { text-transform: none !important; }
      `}</style>
      {fixedFirstColumn && (
        <style>{`
          .${tableInstanceClass} .table-container { position: relative; overflow-x: auto; }
          .${tableInstanceClass} .table { position: relative; }
          .${tableInstanceClass} .table thead th:first-child { position: sticky !important; left: 0 !important; z-index: 30 !important; background: rgb(122, 75, 120) !important; border-right: 2px solid #fff !important; }
          .${tableInstanceClass} .table thead th:first-child * { background: rgb(122, 75, 120) !important; }
          .${tableInstanceClass} .table tbody td:first-child { position: sticky; left: 0; z-index: 10; background-color: #fff; border-right: 1px solid #dee2e6; }
          .${tableInstanceClass} .table tbody tr:hover td:first-child { background-color: #f5f5f5 !important; }
          .${tableInstanceClass} .table tbody tr.selected td:first-child { background-color: #e3f2fd !important; border-left: 1px solid #1677ff !important; }
          .${tableInstanceClass} .fixed-first-column { position: sticky !important; left: 0 !important; z-index: 30 !important; background: rgb(122, 75, 120) !important; border-right: 2px solid #fff !important; }
        `}</style>
      )}
      <div
        className="card h-100"
        style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {title && (
          <div
            className="card-header"
            style={{
              paddingTop: "0.45rem",
              paddingBottom: "0.45rem",
              minHeight: props.headerMinHeight || undefined
            }}
          >
            <div
              className={`table-header-toolbar d-flex flex-wrap align-items-center justify-content-between w-100 ${customSearchControls || (Array.isArray(headerFilters) && headerFilters.length > 0)
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
                    style={{
                      fontWeight: 700,
                      fontSize: 19,
                      lineHeight: "1",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {title || "Table"}
                  </h1>
                </div>
              </div>

              <div
                className="table-filter-search-section table-search-pagination-section flex-grow-1 d-flex justify-content-end align-items-center my-1 my-md-0"
                style={{ minWidth: 0 }}
              >
                {Array.isArray(headerFilters) && headerFilters.length > 0 && (
                  <div
                    className="d-flex align-items-center"
                    style={{ gap: 8, marginRight: 6, flexWrap: "nowrap" }}
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
                          ref={(el) => (headerFilterBtnRefs.current[hf.key] = el)}
                          className="btn btn-sm"
                          title={hf.tooltip || hf.placeholder || "Filter Options"}
                          style={{
                            background: "#fff",
                            color: "rgb(122, 75, 120)",
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
                            } catch (err) {
                              console.log(err);
                            }
                            headerFilterHoverTimeoutRef.current = setTimeout(() => {
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
                              } catch (err) {
                                console.log(err);
                              }
                              setOpenHeaderFilterMenu(hf.key);
                            }, 200);
                          }}
                          onMouseLeave={() => {
                            try {
                              if (headerFilterHoverTimeoutRef.current)
                                clearTimeout(
                                  headerFilterHoverTimeoutRef.current
                                );
                            } catch (err) {
                              console.log(err);
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
                                boxShadow:
                                  "0 2px 12px rgba(0,0,0,0.12)",
                              }}
                              onMouseEnter={() => {
                                try {
                                  if (headerFilterHoverTimeoutRef.current)
                                    clearTimeout(
                                      headerFilterHoverTimeoutRef.current
                                    );
                                } catch (err) {
                                  console.log(err);
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
                                    style={{
                                      pointerEvents: "none",
                                    }}
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
                                    try {
                                      hf.onChange && hf.onChange(val);
                                    } catch (err) {
                                      console.log(err);
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
                {showDisplayAll && (
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
                      marginRight: 6,
                      flexShrink: 0
                    }}
                    onClick={() => {
                      const nextState = !isDisplayAllActive;
                      setIsDisplayAllActive(nextState);

                      if (nextState) {
                        setSearchTerm("");
                        setColumnSearch({});
                      }

                      const currentSize =
                        typeof pageSize === "number"
                          ? pageSize
                          : displayPageSize;

                      if (typeof onDisplayAll === "function") {
                        onDisplayAll(nextState, currentSize);
                      } else if (hasUnifiedQuery) {
                        onQueryChange({
                          pageSize: Number(currentSize === 'all' ? effectiveTotal : currentSize) || 25,
                          pageNumber: 0,
                          columnName: sortConfig.key || "",
                          isGlobalSearch: 0,
                          sortOrder: sortConfig.direction || "",
                          searchKeyword: "",
                          searchFilter: [],
                        });
                      } else if (typeof props.onRefresh === "function") {
                        props.onRefresh();
                      }
                    }}
                    title={isDisplayAllActive ? "Clear Filter" : "Display All"}
                  >
                    {isDisplayAllActive ? (
                      <FilterListAltIcon style={{ fontSize: 18 }} />
                    ) : (
                      <FilterAltOffIcon style={{ fontSize: 18 }} />
                    )}
                  </button>
                )}
                {customSearchControls ? (
                  <div
                    className="text-dark"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginRight: 10,
                      fontWeight: 500,
                    }}
                  >
                    {customSearchControls}
                  </div>
                ) : (
                  !disableSearch && (
                    <div
                      className="text-dark"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginRight: 10,
                        fontWeight: 500,
                      }}
                    >
                      <div
                        className="ms-2 d-inline-block"
                        style={{ position: "relative" }}
                      >
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
                        <input
                          type="text"
                          className="form-control"
                          aria-label="Search table"
                          value={searchTerm}
                          placeholder="Search..."
                          onChange={(e) => {
                            const v = e.target.value;
                            setSearchTerm(v);
                            // Clear column filters on global search
                            setColumnSearch({});
                            // Legacy callback only if unified handler not provided
                            if (!hasUnifiedQuery)
                              emitServerSearch(() => ({ global: v }));
                            // Emit unified query payload for global search
                            if (hasUnifiedQuery) {
                              onQueryChange({
                                pageSize:
                                  Number(searchInitialPageSize) || 25,
                                pageNumber: 0,
                                columnName: sortConfig.key || "",
                                isGlobalSearch: (v || "").length > 0 ? 1 : 0,
                                sortOrder: sortConfig.key
                                  ? sortConfig.direction
                                  : "",
                                searchKeyword: String(v || ""),
                                searchFilter: [],
                              });
                            }
                          }}
                          style={{ minWidth: 180, paddingLeft: "28px" }}
                        />
                      </div>
                    </div>
                  )
                )}

              </div>

              <div
                className="table-actions-section d-flex align-items-center gap-2 ms-auto"
                style={{ flexShrink: 0 }}
              >
                {!disablePagination && (
                  <div className="table-pagination-controls d-flex align-items-center justify-content-end my-0">
                    <button
                      className="btn btn-sm"
                      style={{
                        borderRadius: "50%",
                        border: "none",
                        outline: "none",
                        background:
                          displayPage === 1 ? "#f0f0f0" : "#fff",
                        color: "rgb(122, 75, 120)",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "none",
                        cursor:
                          displayPage === 1 ? "not-allowed" : "pointer",
                      }}
                      onClick={() => {
                        setDisplayPage(1);
                        if (!hasUnifiedQuery && hasOnPageChange)
                          onPageChange(1);
                        if (hasUnifiedQuery) {
                          onQueryChange(buildQueryPayload(1, pageSize));
                        }
                      }}
                      disabled={displayPage === 1}
                      title="First Page"
                    >
                      <FirstPageIcon style={{ fontSize: 18 }} />
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{
                        borderRadius: "50%",
                        border: "none",
                        outline: "none",
                        background:
                          displayPage === 1 ? "#f0f0f0" : "#fff",
                        color: "rgb(122, 75, 120)",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "none",
                        cursor:
                          displayPage === 1 ? "not-allowed" : "pointer",
                      }}
                      onClick={() => {
                        if (displayPage > 1) {
                          const next = displayPage - 1;
                          setDisplayPage(next);
                          if (!hasUnifiedQuery && hasOnPageChange)
                            onPageChange(next);
                          if (hasUnifiedQuery) {
                            onQueryChange(
                              buildQueryPayload(next, pageSize)
                            );
                          }
                        }
                      }}
                      disabled={displayPage === 1}
                      title="Previous Page"
                    >
                      <ArrowBackIosIcon style={{ fontSize: 18 }} />
                    </button>
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 16,
                        margin: "0 4px",
                      }}
                    >
                      Page
                    </span>
                    <input
                      type="text"
                      min={1}
                      max={totalPages}
                      value={pageInputValue}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue !== "" && !/^\d+$/.test(inputValue))
                          return;
                        setPageInputValue(inputValue);
                        if (inputValue === "") return;
                        let val = parseInt(inputValue, 10);
                        if (isNaN(val)) return;
                        if (val < 1) val = 1;
                        if (val > totalPages) val = totalPages;
                        setDisplayPage(val);
                        if (!hasUnifiedQuery && hasOnPageChange)
                          onPageChange(val);
                        if (hasUnifiedQuery) {
                          onQueryChange(
                            buildQueryPayload(val, pageSize)
                          );
                        }
                      }}
                      onBlur={(e) => {
                        const inputValue = e.target.value;
                        if (
                          inputValue === "" ||
                          isNaN(parseInt(inputValue, 10))
                        ) {
                          setDisplayPage(1);
                          if (!hasUnifiedQuery && hasOnPageChange)
                            onPageChange(1);
                          setPageInputValue("1");
                          if (hasUnifiedQuery) {
                            onQueryChange(
                              buildQueryPayload(1, pageSize)
                            );
                          }
                        } else {
                          let val = parseInt(inputValue, 10);
                          if (val < 1) val = 1;
                          if (val > totalPages) val = totalPages;
                          setDisplayPage(val);
                          if (!hasUnifiedQuery && hasOnPageChange)
                            onPageChange(val);
                          setPageInputValue(val.toString());
                          if (hasUnifiedQuery) {
                            onQueryChange(
                              buildQueryPayload(val, pageSize)
                            );
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.target.blur();
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
                    />
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 16,
                        margin: "0 0px",
                      }}
                    >
                      of {totalPages}
                    </span>
                    <button
                      className="btn btn-sm"
                      style={{
                        borderRadius: "50%",
                        border: "none",
                        outline: "none",
                        background:
                          displayPage === totalPages
                            ? "#f0f0f0"
                            : "#fff",
                        color: "rgb(122, 75, 120)",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "none",
                        cursor:
                          displayPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={() => {
                        if (displayPage < totalPages) {
                          const next = displayPage + 1;
                          setDisplayPage(next);
                          if (!hasUnifiedQuery && hasOnPageChange)
                            onPageChange(next);
                          if (hasUnifiedQuery) {
                            onQueryChange(
                              buildQueryPayload(next, pageSize)
                            );
                          }
                        }
                      }}
                      disabled={displayPage === totalPages}
                      title="Next Page"
                    >
                      <ArrowForwardIosIcon style={{ fontSize: 18 }} />
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{
                        borderRadius: "50%",
                        border: "none",
                        outline: "none",
                        background:
                          displayPage === totalPages
                            ? "#f0f0f0"
                            : "#fff",
                        color: "rgb(122, 75, 120)",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "none",
                        cursor:
                          displayPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={() => {
                        setDisplayPage(totalPages);
                        if (!hasUnifiedQuery && hasOnPageChange)
                          onPageChange(totalPages);
                        if (hasUnifiedQuery) {
                          onQueryChange(
                            buildQueryPayload(totalPages, pageSize)
                          );
                        }
                      }}
                      disabled={displayPage === totalPages}
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
                        {(() => {
                          if (isAllSelected) return "All";
                          const shownSize =
                            typeof pageSize === "number"
                              ? pageSize
                              : displayPageSize;
                          const tot = Number(effectiveTotal);
                          // Show "All" when total is less than 25
                          if (tot > 0 && tot < 25) return "All";
                          // Show "All" when pageSize matches total OR when lockToAll is true
                          // Also handle the case when total is 0 and we want to show "All records"
                          if (
                            tot > 0 &&
                            (Number(shownSize) === tot || lockToAll)
                          )
                            return "All";
                          if (
                            tot === 0 &&
                            (displayPageSize === "all" || lockToAll)
                          )
                            return "All";
                          return shownSize;
                        })()}
                      </span>
                      <span>
                        {(() => {
                          const shownSize =
                            typeof pageSize === "number"
                              ? pageSize
                              : displayPageSize;
                          const tot = Number(effectiveTotal);
                          // Show "records" text unless showing "All"
                          if (
                            tot > 0 &&
                            (Number(shownSize) === tot || lockToAll)
                          )
                            return "";
                          if (
                            tot === 0 &&
                            (displayPageSize === "all" || lockToAll)
                          )
                            return "";
                          return "";
                        })()}
                      </span>
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
                      {(() => {
                        const tot = Number(effectiveTotal);
                        // Handle NaN/undefined by defaulting to 0
                        const total = isNaN(tot) ? 0 : tot;
                        if (lockToAll) {
                          return (
                            <span
                              className="dropdown-item disabled"
                              key={`ps-all`}
                            >
                              All
                            </span>
                          );
                        }

                        // When total is less than 25, show only "All" option
                        if (total < 25) {
                          return (
                            <a
                              className="dropdown-item"
                              style={{ minWidth: 0 }}
                              href="#"
                              key={`ps-all`}
                              onClick={(e) => {
                                e.preventDefault();
                                const nextSize = "all";
                                setDisplayPageSize(nextSize);
                                setDisplayPage(1);
                                if (
                                  !hasUnifiedQuery &&
                                  hasOnPageSizeChange
                                ) {
                                  onPageSizeChange(nextSize);
                                }
                                if (
                                  !hasUnifiedQuery &&
                                  hasOnPageChange
                                ) {
                                  onPageChange(1);
                                }
                                if (hasUnifiedQuery) {
                                  const payload = buildQueryPayload(
                                    1,
                                    "all"
                                  );
                                  onQueryChange(payload);
                                }
                              }}
                            >
                              All
                            </a>
                          );
                        }

                        const baseDefaults =
                          Array.isArray(pageSizeOptions) &&
                            pageSizeOptions.length > 0
                            ? pageSizeOptions
                            : [25, 50, 100, 200];
                        // Filter base options based on total
                        const base = baseDefaults.filter((n) =>
                          total >= n
                        );
                        // Include total in options only if it's greater than 0 and not already in base
                        const options =
                          total > 0 && !base.includes(total)
                            ? [...base, total]
                            : base;
                        return options.map((num) => (
                          <a
                            className="dropdown-item"
                            style={{ minWidth: 0 }}
                            href="#"
                            key={`ps-${num}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const isAll = total > 0 && num === total;
                              isUserSelectedAllRef.current = isAll;
                              const nextSize = isAll ? "all" : num;
                              setDisplayPageSize(nextSize);
                              // Reset to first page on size change for consistency
                              setDisplayPage(1);
                              if (hasOnPageSizeChange) {
                                onPageSizeChange(nextSize);
                              }
                              if (hasOnPageChange) {
                                onPageChange(1);
                              }
                              // Parent will decide whether to change the page and fetch
                              if (hasUnifiedQuery) {
                                const payload = buildQueryPayload(
                                  1,
                                  nextSize
                                );
                                onQueryChange(payload);
                              }
                            }}
                          >
                            {total > 0 && num === total
                              ? "All"
                              : `${num}`}
                          </a>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {beforeRefreshButtons}
                {typeof onPrint === "function" && (
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
                    onClick={onPrint}
                    title="Print"
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
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                  </button>
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
                      <path
                        stroke="none"
                        d="M0 0h24v24H0z"
                        fill="none"
                      />
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
                {afterAddButtons}
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
                ? `${scrollMaxHeight}px`
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
                          : "") + (col.key === "actions"
                            ? " actions-column"
                            : "")
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
                            onClick={() => handleSortClick(col.key)}
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
                                    const el =
                                      filterBtnRefs.current[col.key];
                                    const rect = el
                                      ? el.getBoundingClientRect()
                                      : null;
                                    const container = tableScrollRef.current;
                                    const contRect = container
                                      ? container.getBoundingClientRect()
                                      : null;
                                    if (rect && contRect) {
                                      const estimatedH = 150;
                                      const estimatedW = 220;
                                      const spaceBelow =
                                        contRect.bottom - rect.bottom;
                                      const direction =
                                        spaceBelow < estimatedH
                                          ? "up"
                                          : "down";
                                      let leftPos =
                                        rect.left + rect.width * 0.1;
                                      let arrowLeft = 20;
                                      if (
                                        leftPos + estimatedW >
                                        window.innerWidth - 10
                                      ) {
                                        leftPos =
                                          rect.right -
                                          estimatedW -
                                          rect.width * 0.1;
                                        if (leftPos < 10) leftPos = 10;
                                        arrowLeft = estimatedW - 20;
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
                                  } catch (err) {
                                    console.log(err);
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
                                    const next = {
                                      ...columnSearch,
                                      [col.key]: "",
                                    };

                                    // Check if this is the first filter (only one filter with length >= 3)
                                    const activeFilters =
                                      Object.entries(columnSearch).filter(
                                        ([, v]) =>
                                          v &&
                                          String(v).length >= 3
                                      );
                                    const isFirstFilter =
                                      activeFilters.length === 1 &&
                                      activeFilters[0][0] === col.key;

                                    // If removing first filter, clear all; otherwise keep other filters
                                    const finalFilters = isFirstFilter
                                      ? {}
                                      : next;
                                    setColumnSearch(finalFilters);
                                    setOpenFilter(null);

                                    const searchFilterArray =
                                      buildSearchFilterArray(finalFilters);

                                    // Include sort column in searchFilter array if sort is active
                                    const finalSearchFilterArray = [
                                      ...searchFilterArray,
                                    ];
                                    if (
                                      sortConfig.key &&
                                      !finalSearchFilterArray.some(
                                        (f) =>
                                          f.columnName === sortConfig.key
                                      )
                                    ) {
                                      finalSearchFilterArray.push({
                                        columnName: sortConfig.key,
                                        searchKeyword: "",
                                      });
                                    }

                                    // Use unified handler if available, otherwise fall back to legacy
                                    if (hasUnifiedQuery) {
                                      const isGlobal =
                                        (searchTerm || "").length > 0;
                                      const numericSize =
                                        displayPageSize === "all"
                                          ? Number(effectiveTotal) ||
                                          (Array.isArray(data)
                                            ? data.length
                                            : 25)
                                          : Number(pageSize) ||
                                          Number(displayPageSize) ||
                                          25;

                                      if (
                                        finalSearchFilterArray.length > 0
                                      ) {
                                        onQueryChange({
                                          pageSize: numericSize,
                                          pageNumber: 0,
                                          columnName: "",
                                          isGlobalSearch: isGlobal ? 1 : 0,
                                          sortOrder: sortConfig.key
                                            ? sortConfig.direction
                                            : "",
                                          // Preserve global search keyword when present
                                          searchKeyword: isGlobal
                                            ? String(searchTerm || "")
                                            : "",
                                          searchFilter:
                                            finalSearchFilterArray,
                                        });
                                      } else {
                                        onQueryChange({
                                          pageSize: numericSize,
                                          pageNumber: 0,
                                          columnName: "",
                                          isGlobalSearch: isGlobal ? 1 : 0,
                                          sortOrder: "",
                                          searchKeyword: isGlobal
                                            ? String(searchTerm || "")
                                            : "",
                                          searchFilter: [],
                                        });
                                      }
                                    } else {
                                      // Fallback to legacy callback only if unified handler not available
                                      emitServerSearch(() => ({
                                        columnFilters: finalFilters,
                                      }));
                                    }
                                  }}
                                  tabIndex={-1}
                                  title="Clear filter"
                                >
                                  <FilterListOffIcon
                                    style={{ fontSize: 16 }}
                                  />
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
                                    boxShadow:
                                      "0 4px 24px rgba(0,0,0,0.12)",
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
                                      borderLeft:
                                        "8px solid transparent",
                                      borderRight:
                                        "8px solid transparent",
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
                                        transform:
                                          "translateY(-50%)",
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
                                        <circle
                                          cx="10"
                                          cy="10"
                                          r="7"
                                        />
                                        <line
                                          x1="21"
                                          y1="21"
                                          x2="15"
                                          y2="15"
                                        />
                                      </svg>
                                    </span>
                                    <input
                                      type="text"
                                      autoFocus
                                      placeholder={`Search ${col.label}`}
                                      value={columnSearch[col.key] || ""}
                                      onChange={(e) => {
                                        const next = {
                                          ...columnSearch,
                                          [col.key]: e.target.value,
                                        };
                                        setColumnSearch(next);
                                        const len =
                                          (e.target.value || "")
                                            .length;

                                        if (len >= 3 || len === 0) {
                                          // Build searchFilter array from all active filters
                                          const searchFilterArray =
                                            buildSearchFilterArray(
                                              next
                                            );

                                          // Include sort column in searchFilter array if sort is active
                                          const finalSearchFilterArray =
                                            [
                                              ...searchFilterArray,
                                            ];
                                          if (
                                            sortConfig.key &&
                                            !finalSearchFilterArray.some(
                                              (f) =>
                                                f.columnName ===
                                                sortConfig.key
                                            )
                                          ) {
                                            finalSearchFilterArray.push(
                                              {
                                                columnName:
                                                  sortConfig.key,
                                                searchKeyword: "",
                                              }
                                            );
                                          }

                                          // Use unified handler if available, otherwise fall back to legacy
                                          if (hasUnifiedQuery) {
                                            const numericSize =
                                              displayPageSize ===
                                                "all"
                                                ? Number(
                                                  effectiveTotal
                                                ) ||
                                                (Array.isArray(
                                                  data
                                                )
                                                  ? data.length
                                                  : 25)
                                                : Number(pageSize) ||
                                                Number(
                                                  displayPageSize
                                                ) ||
                                                25;

                                            if (
                                              finalSearchFilterArray.length >
                                              0
                                            ) {
                                              // Multiple filters: use searchFilter array
                                              onQueryChange({
                                                pageSize: numericSize,
                                                pageNumber: 0,
                                                columnName: "",
                                                isGlobalSearch: 0,
                                                sortOrder:
                                                  sortConfig.key
                                                    ? sortConfig.direction
                                                    : "",
                                                searchKeyword: "",
                                                searchFilter:
                                                  finalSearchFilterArray,
                                              });
                                            } else {
                                              // No active filters: clear
                                              onQueryChange({
                                                pageSize: numericSize,
                                                pageNumber: 0,
                                                columnName: "",
                                                isGlobalSearch:
                                                  (searchTerm || "")
                                                    .length > 0
                                                    ? 1
                                                    : 0,
                                                sortOrder: "",
                                                searchKeyword: "",
                                                searchFilter: [],
                                              });
                                            }
                                          } else {
                                            // Fallback to legacy callback only if unified handler not available
                                            emitServerSearch(() => ({
                                              columnFilters: next,
                                            }));
                                          }
                                        }
                                      }}
                                      onKeyDown={handleFilterKeyDown}
                                      style={{
                                        width: "100%",
                                        padding:
                                          "8px 36px 8px 38px",
                                        borderRadius: 8,
                                        border:
                                          "1px solid #d0d7de",
                                        background: "#f8fafc",
                                        fontSize: 15,
                                        outline: "none",
                                        height: "30px",
                                      }}
                                    />
                                    {columnSearch[col.key] &&
                                      columnSearch[col.key].length >
                                      0 && (
                                        <button
                                          onClick={() => {
                                            const next = {
                                              ...columnSearch,
                                              [col.key]: "",
                                            };

                                            // Check if this is the first filter
                                            const activeFilters =
                                              Object.entries(
                                                columnSearch
                                              ).filter(
                                                ([, v]) =>
                                                  v &&
                                                  String(v)
                                                    .length >= 3
                                              );
                                            const isFirstFilter =
                                              activeFilters.length ===
                                              1 &&
                                              activeFilters[0][0] ===
                                              col.key;

                                            // If removing first filter, clear all; otherwise keep other filters
                                            const finalFilters =
                                              isFirstFilter
                                                ? {}
                                                : next;
                                            setColumnSearch(
                                              finalFilters
                                            );

                                            const searchFilterArray =
                                              buildSearchFilterArray(
                                                finalFilters
                                              );

                                            // Include sort column in searchFilter array if sort is active
                                            const finalSearchFilterArray =
                                              [
                                                ...searchFilterArray,
                                              ];
                                            if (
                                              sortConfig.key &&
                                              !finalSearchFilterArray.some(
                                                (f) =>
                                                  f.columnName ===
                                                  sortConfig.key
                                              )
                                            ) {
                                              finalSearchFilterArray.push(
                                                {
                                                  columnName:
                                                    sortConfig.key,
                                                  searchKeyword: "",
                                                }
                                              );
                                            }

                                            // Use unified handler if available, otherwise fall back to legacy
                                            if (hasUnifiedQuery) {
                                              const isGlobal =
                                                (searchTerm || "")
                                                  .length > 0;
                                              const numericSize =
                                                displayPageSize ===
                                                  "all"
                                                  ? Number(
                                                    effectiveTotal
                                                  ) ||
                                                  (Array.isArray(
                                                    data
                                                  )
                                                    ? data.length
                                                    : 25)
                                                  : Number(
                                                    pageSize
                                                  ) ||
                                                  Number(
                                                    displayPageSize
                                                  ) ||
                                                  25;

                                              if (
                                                finalSearchFilterArray.length >
                                                0
                                              ) {
                                                onQueryChange({
                                                  pageSize:
                                                    numericSize,
                                                  pageNumber: 0,
                                                  columnName: "",
                                                  isGlobalSearch:
                                                    isGlobal ? 1 : 0,
                                                  sortOrder:
                                                    sortConfig.key
                                                      ? sortConfig.direction
                                                      : "",
                                                  // Preserve global search keyword when present
                                                  searchKeyword: isGlobal
                                                    ? String(
                                                      searchTerm || ""
                                                    )
                                                    : "",
                                                  searchFilter:
                                                    finalSearchFilterArray,
                                                });
                                              } else {
                                                onQueryChange({
                                                  pageSize:
                                                    numericSize,
                                                  pageNumber: 0,
                                                  columnName: "",
                                                  isGlobalSearch:
                                                    isGlobal ? 1 : 0,
                                                  sortOrder: "",
                                                  searchKeyword: isGlobal
                                                    ? String(
                                                      searchTerm || ""
                                                    )
                                                    : "",
                                                  searchFilter: [],
                                                });
                                              }
                                            } else {
                                              // Fallback to legacy callback only if unified handler not available
                                              emitServerSearch(() => ({
                                                columnFilters:
                                                  finalFilters,
                                              }));
                                            }
                                          }}
                                          style={{
                                            position: "absolute",
                                            right: 8,
                                            top: "50%",
                                            transform:
                                              "translateY(-50%)",
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
                                            <circle
                                              cx="12"
                                              cy="12"
                                              r="10"
                                            />
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
                {(data || []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{
                        textAlign: "center",
                        color: "#888",
                        padding: "32px 0",
                      }}
                    >
                      No Data Available
                    </td>
                  </tr>
                ) : (
                  (data || []).map((row, idx) => {
                    const customRowStyle = typeof props.getRowStyle === "function" ? (props.getRowStyle(row, idx) || {}) : (row._rowStyle || {});
                    const defaultRowBg = customRowStyle.backgroundColor || row._rowBgColor || "#ffffff";
                    const customRowClass = typeof props.getRowClassName === "function" ? (props.getRowClassName(row, idx) || "") : (row._rowClassName || "");
                    const isSelected = selectedRow === idx;

                    let skipCols = 0;

                    return (
                      <React.Fragment key={idx}>
                        <tr
                          className={`${isSelected ? "selected" : ""} ${customRowClass}`.trim()}
                          style={{
                            height: "25px",
                            backgroundColor:
                              isSelected
                                ? "#e3f2fd"
                                : defaultRowBg,
                            borderLeft:
                              isSelected
                                ? "4px solid #1677ff"
                                : (customRowStyle.borderLeft || "none"),
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                            ...customRowStyle,
                            ...(isSelected ? { backgroundColor: "#e3f2fd", borderLeft: "4px solid #1677ff" } : {})
                          }}
                          onMouseEnter={(e) => {
                            if (selectedRow !== idx)
                              e.currentTarget.style.backgroundColor =
                                "#f5f5f5";
                          }}
                          onMouseLeave={(e) => {
                            if (selectedRow !== idx)
                              e.currentTarget.style.backgroundColor =
                                defaultRowBg;
                          }}
                          onClick={() => setSelectedRow(idx)}
                        >
                          {columns.map((col, colIndex) => {
                            if (skipCols > 0) {
                              skipCols--;
                              return null;
                            }

                            const cellColSpan = typeof col.colSpan === "function"
                              ? col.colSpan(row, renderContext)
                              : (col.colSpan || 1);

                            if (cellColSpan > 1) {
                              skipCols = cellColSpan - 1;
                            }

                            const customCellStyle = typeof col.cellStyle === "function"
                              ? col.cellStyle(row, renderContext)
                              : {};

                            return (
                              <td
                                key={col.key}
                                colSpan={cellColSpan > 1 ? cellColSpan : undefined}
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
                                  ...(cellColSpan > 1
                                    ? {}
                                    : {
                                        ...(col.width ? { width: col.width } : {}),
                                        ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                                        ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                                      }),
                                  ...(fixedFirstColumn && colIndex === 0
                                    ? {
                                      position: "sticky",
                                      left: 0,
                                      zIndex: 10,
                                      backgroundColor: isSelected ? "#e3f2fd" : defaultRowBg,
                                    }
                                    : {}),
                                  ...col.style,
                                  ...customCellStyle,
                                }}
                              >
                                {col.key === "actions" ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 3,
                                    }}
                                  >
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
                                            setSelectedRow(idx);
                                            handleDropdownClose(); // Close dropdown when view is clicked
                                            const viewAction =
                                              getActions(row).find(
                                                (a) =>
                                                  a.label &&
                                                  a.label.toLowerCase() ===
                                                  "view"
                                              );
                                            if (
                                              viewAction &&
                                              viewAction.onClick
                                            )
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
                                          if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                          )
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
                                                    setSelectedRow(idx);
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
                                  </div>
                                ) : col.render ? (
                                  col.render(row, renderContext)
                                ) : (
                                  (() => {
                                    const v = row[col.key];
                                    const s = v == null ? "" : String(v);
                                    const isLong = s.length > 50;
                                    const shown = isLong
                                      ? s.slice(0, 50) + "…"
                                      : s;
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
                                  })()
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        {typeof renderSubRow === "function" && renderSubRow(row, idx, renderContext)}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modalContent}
    </div>
  );
});

export default DynamicSortableTable;
