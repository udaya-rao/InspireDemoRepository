import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import Loader from "../../components/Loader";
import RightDrawer from "../../components/RightDrawer";
import DraggableModal from "../../components/DraggableModal";
import SaveOrUpdateFGInventory from "./SaveOrUpdateFGInventory";
import { DeleteConfirmDialog, ConfirmDialog } from "../../components/Notification";
import { useToast } from "../../components/useToast";
import { hasPermission, menuPermissions } from "../../permissions/permissionUtils";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges.jsx";
import BillOfMaterial from "./billofmaterial/BillOfMaterial.jsx";
import {
  fetchFGInventoryList,
  getStatusOptions,
  getHSNType,
  deleteFGInventory,
  fetchFGInventoryDetails,
} from "../../services/fgInventoryMasterService.js";
import { getBOMMasterDetails } from "../../services/billOfMaterialService.js";
import { formatDate } from "../../utils/dateUtils.js";
import { handleApiValidationErrors } from "../../utils/CustomValidation";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS } from "../../utils/ConstVariables";


const inventoryColumns = [
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    width: "100px",
    minWidth: "100px",
  },
  {
    key: "item_code",
    label: "Code",
    searchable: false,
    ignoreSpecial: true,
    width: "10%",
    minWidth: "200px",
  },
  {
    key: "item_description",
    label: "Description",
    searchable: false,
    ignoreSpecial: true,
    width: "40%",
    minWidth: "250px",
    maxWidth: "250px",
  },
  {
    key: "valid_text",
    label: "Status",
    width: "12%",
    minWidth: "160px",
    style: { textAlign: "center" },
    render: (row) => {
      const statusText = row.status_text || row.status || "Unknown";
      const statusNum = Number(row.item_status);
      const isValid = statusNum === 1;
      const statusColor = isValid ? "#22c55e" : "#ef4444"; // green or red
      const statusBg = isValid ? "#dcfce7" : "#fee2e2"; // green or red background

      return (
        <span
          style={{
            color: statusColor,
            background: statusBg,
            borderRadius: 12,
            padding: "2px 12px",
            fontWeight: 600,
            fontSize: 12,
            display: "inline-block",
            border: "none",
          }}
        >
          {statusText}
        </span>
      );
    },
    searchable: false,
  },
  {
    key: "item_unit",
    label: "Unit",
    searchable: false,
    width: "10%",
    minWidth: "100px",
  },
  {
    key: "location",
    label: "Location",
    searchable: false,
    width: "10%",
    minWidth: "100px",
  },
  {
    key: "lasttran_date",
    label: "Transaction Date",
    searchable: false,
    width: "13%",
    minWidth: "160px",
  },
  {
    key: "shelf_life_days",
    label: "Shelf Life Days",
    searchable: false,
    width: "13%",
    minWidth: "160px",
    render: (row) => {
      const value = row.shelf_life_days;
      return (value === 0 || value === "0" || !value) ? "" : value;
    },
  },
  {
    key: "hsn_code",
    label: "HSN Code",
    searchable: false,
    width: "5%",
    minWidth: "100px",
  },
  {
    key: "fg_item_id",
    label: "ID",
    searchable: false,
    width: "5%",
    minWidth: "100px",
  },
];

// Transform API record to table row
const transformRecord = (item, hsnTextMap) => {

  let hsnDisplayValue = "";

  if (item?.hsn_code !== undefined && item?.hsn_code !== null && String(item.hsn_code).trim() !== "") {
    hsnDisplayValue = String(item.hsn_code).trim();
  } else if (item?.cc_hsn_code !== undefined && item?.cc_hsn_code !== null && String(item.cc_hsn_code).trim() !== "") {
    hsnDisplayValue = String(item.cc_hsn_code).trim();
  } else if (item?.hsn_name_text !== undefined && item?.hsn_name_text !== null && String(item.hsn_name_text).trim() !== "") {
    hsnDisplayValue = String(item.hsn_name_text).trim();
  } else {
    const rawHsnValue =
      item?.hsn_id ??
      item?.HSN_ID ??
      null;

    if (rawHsnValue !== undefined && rawHsnValue !== null) {
      const hsnKey = String(rawHsnValue);
      if (hsnTextMap && hsnTextMap[hsnKey]) {
        hsnDisplayValue = hsnTextMap[hsnKey];
      } else {
        // Fallback to hsn_id if no mapping found
        hsnDisplayValue = String(rawHsnValue);
      }
    }
  }

  return {
    ...item,
    current_stock:
      (Number(item.open_stock) || 0) +
      (Number(item.qty_acc) || 0) -
      (Number(item.qty_iss) || 0) -
      (Number(item.qty_res) || 0),
    reserved_stock: item.qty_res,
    // Preserve valid_text from API, and item_status for status determination
    status: item.valid_text || (item.item_status === 1 ? "Valid" : item.item_status === 0 ? "Invalid" : "Unknown"),
    status_text: item.valid_text || "",
    item_status: item.item_status,
    lasttran_date: formatDate(item.lasttran_date),
    hsn_id: hsnDisplayValue, // This will display the HSN code, not the ID
  };
};

export default function FGInventoryMasterList() {
  const { showToast } = useToast();

  const {
    rows: inventoryData,
    setRows: setInventoryData,
    tableProps,
  } = usePaginatedTable([], 25, true); // server-side mode

  const [loading, setLoading] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // FG Inventory drawer
  const [fgDrawerOpen, setFgDrawerOpen] = useState(false);

  // BOM drawer
  const [bomDrawerOpen, setBomDrawerOpen] = useState(false);
  const [bomHeaderActions, setBomHeaderActions] = useState(null);
  const [bomDirty, setBomDirty] = useState(false);
  const [bomID, setBomID] = useState(null); // Real bomid fetched before opening BOM drawer

  const [selectedRow, setSelectedRow] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const tableRef = useRef(null);

  // Track saved item for highlighting after refresh
  const savedItemRef = useRef(null);

  // Flag to prevent dirty state updates during record switching
  const isSwitchingRecordsRef = useRef(false);

  const {
    setIsDirty: setIsEditDirty,
    checkUnsavedChanges: checkEditUnsavedChanges,
    resetDirty: resetEditDirty,
    dirtyConfirmDialog: editDirtyConfirmDialog,
  } = useUnsavedChanges({});

  const {
    setIsDirty: setIsAddDirty,
    // checkUnsavedChanges: checkAddUnsavedChanges,
    resetDirty: resetAddDirty,
    dirtyConfirmDialog: addDirtyConfirmDialog,
  } = useUnsavedChanges({});


  // Header shortcut filter state
  const [selectedShortcut, setSelectedShortcut] = useState("");

  // Track active column search/filter state (we only use setters)
  const [, setActiveColumnSearch] = useState({
    key: "",
    value: "",
  });
  const [, setActiveColumnFilters] = useState({});
  const activeColumnFiltersRef = useRef({});
  const [activeSearchFilters, setActiveSearchFilters] = useState([]);
  const [currentSortConfig, setCurrentSortConfig] = useState({
    key: "",
    direction: "",
  });

  // Raw lists from APIs
  const [statusList, setStatusList] = useState([]);
  const [hsnList, setHsnList] = useState([]);

  // Memoized options for dropdowns – kept for future use in props (commented)
  const _statusOptions = useMemo(
    () =>
      Array.isArray(statusList)
        ? statusList.map((item) => ({
          value: String(item.ValueText),
          label: item.DisplayText,
        }))
        : [],
    [statusList]
  );

  const _HSNOptions = useMemo(
    () =>
      Array.isArray(hsnList)
        ? hsnList.map((item) => ({
          value: item.ValueText ?? item.hsn_code,
          label: item.DisplayText ?? item.text,
        }))
        : [],
    [hsnList]
  );

  // Map: hsn_id -> HSN text (for table display)
  const hsnTextMap = useMemo(() => {
    const map = {};
    (hsnList || []).forEach((item) => {
      const key =
        item?.hsn_code !== undefined && item?.hsn_code !== null
          ? item.hsn_code
          : item?.ValueText;
      const label =
        item?.text !== undefined && item?.text !== null
          ? item.text
          : item?.DisplayText;

      if (key !== undefined && key !== null && label != null) {
        map[String(key)] = String(label);
      }
    });
    return map;
  }, [hsnList]);

  // To prevent refetching the same query payload multiple times
  const lastQueryRef = useRef(null);

  const lastAppliedQueryRef = useRef({
    pageSize: 25,
    pageNumber0: 0,
    columnName: "",
    sortOrder: "",
    searchKeyword: "",
    isGlobalSearch: 0,
    shortCut: "",
    searchFilter: [],
  });

  // To prevent dropdown APIs from firing multiple times (StrictMode / re-mounts)
  const dropdownsFetchedRef = useRef(false);

  // To prevent initial inventory fetch from firing twice in React 18 StrictMode
  const inventoryFetchedRef = useRef(false);

  // Track latest request to ignore out-of-order responses
  const requestSeqRef = useRef(0);

  // ---------- Meta dropdowns (Status / HSN Type) ----------

  useEffect(() => {
    // Guard to avoid multiple API calls due to StrictMode or re-mounts
    if (dropdownsFetchedRef.current) return;
    dropdownsFetchedRef.current = true;

    let isMounted = true;

    const loadDropdowns = async () => {
      try {
        // Status options
        const statusRes = await getStatusOptions();
        console.log("Status Dropdown", statusRes);
        if (isMounted) {
          const list = statusRes?.data?.data?.DROPDOWN_LIST || [];
          setStatusList(list);
        }

        // HSN options
        const hsnRes = await getHSNType();
        console.log("HSN Dropdown", hsnRes);
        if (isMounted) {
          const list = hsnRes?.data?.data?.DROPDOWN_LIST || [];
          setHsnList(list);
        }
      } catch (error) {
        console.error("Failed to load Status / HSN dropdowns", error);

        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else if (showToast) {
          showToast("Failed to load dropdowns", ERROR_STATUS.toLowerCase());
        }
      }
    };

    loadDropdowns();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // ---------- Inventory fetch (server-side) ----------

  const fetchInventory = useCallback(
    async (
      pageSize = 25,
      pageNumber = 0,
      columnName = "",
      sortOrder = "",
      searchKeyword = "",
      isGlobalSearch = 0,
      shortCut = selectedShortcut,
      searchFilter = [],
      options = { force: false }
    ) => {
      const trimmedKeyword = String(searchKeyword || "").trim();
      const filterKeyword = (
        Array.isArray(searchFilter)
          ? searchFilter.find((f) => (f?.searchKeyword || "").trim().length > 0)?.searchKeyword || ""
          : ""
      ).trim();
      const keywordToUse = trimmedKeyword || filterKeyword;
      const hasKeyword = keywordToUse.length > 0;
      const effectiveIsGlobalSearch = hasKeyword ? 1 : 0;

      const defaultEmptyFilter = [
        {
          columnName: "",
          searchKeyword: "",
          sortOrder: "",
          columnSequence: 0,
        },
      ];

      const payload = {
        pageSize,
        pageNumber,
        searchFilter: defaultEmptyFilter,
        isGlobalSearch: effectiveIsGlobalSearch,
        sortOrder: sortOrder || "",
      };

      if (effectiveIsGlobalSearch === 1) {
        payload.searchFilter = [
          {
            columnName: "",
            searchKeyword: keywordToUse,
            sortOrder: "",
            columnSequence: 0,
          },
        ];
      } else if (Array.isArray(searchFilter) && searchFilter.length > 0) {
        payload.searchFilter = searchFilter.map((f, idx) => ({
          columnName: f.columnName || "",
          searchKeyword: f.searchKeyword || "",
          sortOrder: "",
          columnSequence: f.columnSequence !== undefined ? f.columnSequence : idx,
        }));
      } else if (columnName) {
        payload.searchFilter = [
          {
            columnName: columnName,
            searchKeyword: "",
            sortOrder: "",
            columnSequence: 0,
          },
        ];
      } else {
        payload.searchFilter = defaultEmptyFilter;
      }

      // DO NOT reset lastQueryRef before comparing.
      // De-dupe identical payloads (DynamicSortableTable + StrictMode can trigger duplicates)
      const payloadKey = JSON.stringify(payload);
      if (!options?.force && lastQueryRef.current === payloadKey) {
        return;
      }
      lastQueryRef.current = payloadKey;

      lastAppliedQueryRef.current = {
        pageSize,
        pageNumber0: pageNumber,
        columnName,
        sortOrder,
        searchKeyword,
        isGlobalSearch: effectiveIsGlobalSearch,
        shortCut: shortCut || "",
        searchFilter: Array.isArray(searchFilter) ? searchFilter : [],
      };

      // request sequencing to ignore stale responses
      const reqId = ++requestSeqRef.current;

      setLoading(true);
      try {
        const res = await fetchFGInventoryList(payload);

        // Ignore if a newer request has already started/finished
        if (reqId !== requestSeqRef.current) return;

        const list = res?.data?.FG_INVENTORY_LIST || [];
        const totalRecords =
          res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords ??
          (list.length > 0 ? list.length : 0);

        // If current page returned no records but pageNumber > 0,
        // it means all records on this page were deleted/filtered.
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
            fetchInventory(
              pageSize,
              maxPageNumber,
              columnName,
              sortOrder,
              searchKeyword,
              isGlobalSearch,
              shortCut,
              searchFilter,
              { force: true }
            );
            return;
          }
        }

        // Use hsnTextMap to replace hsn_id with HSN text in table
        let data = (list || []).map((item) => transformRecord(item, hsnTextMap));

        // If multiple column filters are active, chain them client-side
        const filters = activeColumnFiltersRef.current || {};
        const activeEntries = Object.entries(filters).filter(
          ([, v]) => (v || "").length > 0
        );

        if (activeEntries.length > 1) {
          data = data.filter((row) => {
            return activeEntries.every(([k, v]) => {
              const cell = row?.[k];
              const s = cell == null ? "" : String(cell);
              return s.toLowerCase().includes(String(v).toLowerCase());
            });
          });
        }

        if (savedItemRef.current && savedItemRef.current.isNew) {
          const savedIdentifier = savedItemRef.current;
          const savedIndex = data.findIndex((item) => {
            return (
              (savedIdentifier.fg_item_id && (item.fg_item_id === savedIdentifier.fg_item_id)) ||
              (savedIdentifier.item_code && item.item_code === savedIdentifier.item_code)
            );
          });

          if (savedIndex > 0) {
            const savedItem = data[savedIndex];
            data = [savedItem, ...data.filter((_, idx) => idx !== savedIndex)];
          }

        }

        setInventoryData(data);

        if (tableProps.setTotalRecords) {
          tableProps.setTotalRecords(totalRecords);
        }

        if (
          typeof tableProps.onPageChange === "function" &&
          Number(pageNumber) === 0
        ) {
          tableProps.onPageChange(1);
        }
      } catch (error) {
        console.error("Error fetching FG inventory list:", error);
        setInventoryData([]);
      } finally {
        // Only clear loading if this is still the latest request
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    },
    [selectedShortcut, setInventoryData, tableProps, hsnTextMap]
  );

  // Initial load (first page)
  useEffect(() => {
    // Guard for React 18 StrictMode double-invocation in dev
    if (inventoryFetchedRef.current) return;
    inventoryFetchedRef.current = true;

    fetchInventory(25, 0, "", "", "", 0, "", [], { force: true });
  }, [fetchInventory]);

  // Highlight saved row (both new and edited) after data refresh
  useEffect(() => {
    if (savedItemRef.current && inventoryData.length > 0) {
      const savedIdentifier = savedItemRef.current;
      const savedIndex = inventoryData.findIndex((item) => {
        // Try to match by fg_item_id first, then by item_code
        return (
          (savedIdentifier.fg_item_id && (item.fg_item_id === savedIdentifier.fg_item_id)) ||
          (savedIdentifier.item_code && item.item_code === savedIdentifier.item_code)
        );
      });

      if (savedIndex >= 0) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          try {
            // Use the table ref's selectRowByIndex method if available
            if (tableRef.current && typeof tableRef.current.selectRowByIndex === 'function') {
              tableRef.current.selectRowByIndex(savedIndex);
            } else {
              // Fallback: try to click the row directly
              const tableElement = tableRef.current?.querySelector?.('tbody') ||
                document.querySelector('table tbody');
              if (tableElement) {
                const rows = tableElement.querySelectorAll('tr');
                if (rows[savedIndex]) {
                  rows[savedIndex].click();
                  rows[savedIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }
          } catch (err) {
            console.error("Error highlighting saved row:", err);
          }
          // Clear the saved item ref after highlighting
          savedItemRef.current = null;
        }, 200);
      } else if (savedIndex < 0) {
        // Item not found in current page, clear ref
        savedItemRef.current = null;
      }
    }
  }, [inventoryData]);

  // ---------- Unified query handler from DynamicSortableTable ----------

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

        // Sync pagination/sort/search to table state
        if (typeof tableProps.onPageSizeChange === "function")
          tableProps.onPageSizeChange(pageSizeNum);
        if (typeof tableProps.onPageChange === "function")
          tableProps.onPageChange(pageNumber0 + 1);
        if (typeof tableProps.setSearchTerm === "function")
          tableProps.setSearchTerm(isGlobalSearch === 1 ? searchKeyword : "");

        if (typeof tableProps.setSortConfig === "function" && columnName) {
          tableProps.setSortConfig({
            key: columnName,
            direction: sortOrder || "asc",
          });
        }

        // Track sort config for preservation
        if (columnName && sortOrder) {
          setCurrentSortConfig({ key: columnName, direction: sortOrder });
        } else if (sortOrder && searchFilter.length > 0) {
          const sortFilter = searchFilter.find((f) => f.columnName && !f.searchKeyword);
          if (sortFilter) {
            setCurrentSortConfig({
              key: sortFilter.columnName,
              direction: sortOrder,
            });
            if (typeof tableProps.setSortConfig === "function") {
              tableProps.setSortConfig({
                key: sortFilter.columnName,
                direction: sortOrder || "asc",
              });
            }
          }
        }

        // ----- Global vs Column Search -----
        let finalSearchFilter = searchFilter;
        let finalColumnName = columnName;
        let finalSearchKeyword = searchKeyword;
        let finalIsGlobalSearch = isGlobalSearch;

        if (isGlobalSearch === 1) {
          const trimmedKeyword = (searchKeyword || "").trim();
          if (trimmedKeyword.length > 0) {
            finalSearchFilter = [
              {
                columnName: "",
                searchKeyword: trimmedKeyword,
                sortOrder: "",
                columnSequence: 0,
              },
            ];
            finalIsGlobalSearch = 1;
          } else {
            finalSearchFilter = [
              {
                columnName: "",
                searchKeyword: "",
                sortOrder: "",
                columnSequence: 0,
              },
            ];
            finalIsGlobalSearch = 0;
          }
          // Preserve columnName for sorting logic
          finalColumnName = columnName || "";

          // Clear all column filters state
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

        // Fire API (de-duped inside fetchInventory)
        fetchInventory(
          pageSizeNum,
          pageNumber0,
          finalColumnName,
          sortOrder,
          finalSearchKeyword,
          finalIsGlobalSearch,
          selectedShortcut,
          finalSearchFilter
        );
      } catch (e) {
        console.error("Failed to handle unified query payload", e);
      }
    },
    [fetchInventory, selectedShortcut, tableProps]
  );

  // ---------- Delete handling ----------

  const handleDelete = useCallback((row) => {
    const performDelete = (r) => {
      setSelectedRow(r);
      setShowDeleteConfirm(true);
    };

    if (fgDrawerOpen && !checkEditUnsavedChanges(performDelete, row)) return;
    // if (showAddDrawer && !checkAddUnsavedChanges(performDelete, row)) return;

    performDelete(row);
  }, [fgDrawerOpen, checkEditUnsavedChanges]);

  const confirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    if (!selectedRow) return;

    try {
      const apiResult = await deleteFGInventory(selectedRow.fg_item_id);

      const validationErrors = apiResult?.data?.ValidationErrors;
      const deleteFGInventoryMessages =
        apiResult?.data?.FG_INVENTORY_DELETE_RESPONSE ||
        apiResult?.data?.data?.FG_INVENTORY_DELETE_RESPONSE ||
        [];
      const status =
        apiResult?.Status || apiResult?.data?.Status || apiResult?.data?.status;

      // Field / API validation
      if (handleApiValidationErrors(validationErrors, showToast)) {
        return;
      }

      let message = "";

      if (
        Array.isArray(deleteFGInventoryMessages) &&
        deleteFGInventoryMessages.length > 0
      ) {
        message += deleteFGInventoryMessages.map((e) => e.Message).join(" ");
      }

      if (!message) {
        message =
          apiResult?.data?.message ||
          apiResult?.message ||
          "No message returned from server.";
      }

      const toastType = status === SUCCESS_STATUS || status === MESSAGE_OK ? SUCCESS_STATUS : ERROR_STATUS.toLowerCase();

      if (showToast) showToast(message.trim(), toastType);

      // If error, stop here
      if (toastType === ERROR_STATUS.toLowerCase()) return;

      // On delete success: reload current page via fetchFGInventoryList
      const pageSize = tableProps.pageSize || 25;
      const pageNumber0 = (tableProps.currentPage || 1) - 1;
      const columnName = currentSortConfig.key || "";
      const sortOrder = currentSortConfig.direction || "";
      const searchFilter = activeSearchFilters;

      // Allow same payload to be re-used (force refresh)
      lastQueryRef.current = null;

      await fetchInventory(
        pageSize,
        pageNumber0,
        columnName,
        sortOrder,
        "",
        0,
        selectedShortcut,
        searchFilter,
        { force: true }
      );
    } catch (err) {
      console.error("Error Deleting FG Inventory:", err);

      const fallbackMsg =
        err?.response?.data?.message ||
        err?.response?.data?.FG_INVENTORY_DELETE_RESPONSE?.[0]?.Message ||
        "Failed to Delete FG Inventory";

      showToast(fallbackMsg, ERROR_STATUS.toLowerCase());
    } finally {
      setSelectedRow(null);
    }
  }, [
    selectedRow,
    showToast,
    tableProps.pageSize,
    tableProps.currentPage,
    currentSortConfig,
    activeSearchFilters,
    fetchInventory,
    selectedShortcut,
  ]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setSelectedRow(null);
  }, []);

  // ---------- Row actions ----------

  const handleBillofMaterial = useCallback(
    async (row) => {
      const fgItemID = row?.fg_item_id || row?.fgItemID || row?.ID;
      setSelectedRow(row);
      setBomID(null); // reset while fetching

      // Pre-fetch real bomid for this fgItem
      try {
        const res = await getBOMMasterDetails({ fgItemID: Number(fgItemID) || 0, bomid: 0 });
        const fetchedBomId = res?.data?.BOM_MASTER_COMMON_RESPONSE?.[0]?.bom_id || null;
        setBomID(fetchedBomId);
      } catch (err) {
        console.error("Failed to fetch bomid:", err);
        setBomID(null);
      }

      setBomDrawerOpen(true);
    },
    []
  );

  const handleViewInternal = useCallback(
    async (row) => {
      // Validate row data before proceeding
      if (!row || (!row.fg_item_id && !row.fgItemID)) {
        console.error("Invalid row data in handleViewInternal:", row);
        setTimeout(() => {
          showToast("Invalid FG inventory item data", ERROR_STATUS.toLowerCase());
        }, 0);
        return;
      }

      try {
        const isDrawerAlreadyOpen = fgDrawerOpen;
        const itemID = row.fg_item_id || row.fgItemID;
        if (!itemID) {
          console.error("Item ID not found in row data");
          setSelectedRow(row);
          if (!isDrawerAlreadyOpen) setFgDrawerOpen(true);
          return;
        }

        const res = await fetchFGInventoryDetails(itemID);
        // console.log(res);
        const details = res?.data?.FG_INVENTORY_DETAILS_RESPONSE?.[0];

        setSelectedRow(details || row);
        if (!isDrawerAlreadyOpen) setFgDrawerOpen(true);

      } catch (error) {
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          console.error("Failed to fetch FG inventory details:", error);
          showToast("Failed to fetch FG inventory details.", ERROR_STATUS.toLowerCase());
        }

        const isDrawerAlreadyOpen = fgDrawerOpen;
        setSelectedRow(row);
        if (!isDrawerAlreadyOpen) setFgDrawerOpen(true);
      }
    },
    [fgDrawerOpen, showToast]
  );

  const handleView = useCallback(
    async (row) => {
      if (!row || (!row.fg_item_id && !row.fgItemID)) {
        console.error("Invalid row data in handleView:", row);
        return; // Don't proceed if row is invalid
      }

      // Close profile dropdown if open
      window.dispatchEvent(new Event("closeProfileDropdown"));

      const proceedToView = async (data) => {
        // Keep drawer open (preserves half-collapsed UI state). Just swap the record.
        if (fgDrawerOpen) {
          isSwitchingRecordsRef.current = true;
          resetEditDirty();
        }

        await handleViewInternal(data);

        if (fgDrawerOpen) {
          setTimeout(() => {
            isSwitchingRecordsRef.current = false;
          }, 200);
        }
      };

      // Check if Add form is open and dirty
      // if (showAddDrawer && !checkAddUnsavedChanges(proceedToView, row)) {
      //   return;
      // }

      // Check if Edit form is open and dirty
      const canProceed = checkEditUnsavedChanges(async (data) => {
        if (data && (data.fg_item_id || data.fgItemID)) {
          await proceedToView(data);
        }
      }, row);

      if (canProceed) {
        await proceedToView(row);
      }
    },
    [handleViewInternal, fgDrawerOpen, resetEditDirty, checkEditUnsavedChanges]
  );

  const getActions = useCallback(
    (row) => {
      const actions = [];

      // View action
      actions.push({
        label: "View",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon"
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
        onClick: () => handleView(row),
      });

      // BOM action (permission-gated)
      if (hasPermission(menuPermissions.ALLOW_TO_OPEN_BILL_OF_MATERIAL)) {
        actions.push({
          label: "Bill of Material",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M7 8h10M7 12h10M7 16h10" />
            </svg>
          ),
          onClick: () => {
            handleBillofMaterial(row);

          },
        });
      }

      // Delete (permission-gated)
      if (hasPermission(menuPermissions.ALLOW_TO_DELETE_ITEMS_IN_FG_INVENTORY)) {
        actions.push({
          label: "Delete",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 7h16" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
              <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
            </svg>
          ),
          onClick: () => handleDelete(row),
        });
      }

      return actions;
    },
    [handleDelete, handleView, handleBillofMaterial]
  );

  // ---------- Add success handler ----------

  const handleAddSuccess = useCallback(
    (newRecord) => {
      if (newRecord) {
        // Track new item for highlighting after refresh
        savedItemRef.current = {
          fg_item_id: newRecord.fg_item_id || newRecord.fgItemID || newRecord.ID,
          item_code: newRecord.item_code || newRecord.itemCode,
          isNew: true,
        };

        // Transform the new item and add it to the top of current page
        const transformedItem = transformRecord(newRecord, hsnTextMap);

        // Add to top of current page data
        setInventoryData((prevData) => {
          // Remove any existing items with same ID to avoid duplicates
          const filtered = prevData.filter(
            (item) =>
              item.fg_item_id !== transformedItem.fg_item_id
          );
          // Add new item at the top
          return [transformedItem, ...filtered];
        });

        // Update total records count (increment by 1)
        if (tableProps.setTotalRecords && typeof tableProps.setTotalRecords === "function") {
          const currentTotal = tableProps.totalRecords || 0;
          tableProps.setTotalRecords(currentTotal + 1);
        }
      }

      setShowAddDrawer(false);
    },
    [setInventoryData, tableProps, hsnTextMap]
  );

  // ---------- Drawers / Modals ----------

  const handleAddDirtyChange = useCallback((dirty) => {
    if (showAddDrawer) {
      setIsAddDirty(dirty);
    }
  }, [showAddDrawer, setIsAddDirty]);

  const handleEditDirtyChange = useCallback((dirty) => {
    if (fgDrawerOpen && !isSwitchingRecordsRef.current) {
      setIsEditDirty(dirty);
    }
  }, [fgDrawerOpen, setIsEditDirty]);

  const addFGDrawer = (
    <SaveOrUpdateFGInventory
      key="fg-add"
      open={showAddDrawer}
      onClose={() => {
        setShowAddDrawer(false);
        resetAddDirty();
      }}
      onSuccess={handleAddSuccess}
      onDirtyChange={handleAddDirtyChange}
      initialData={null}
      disabled={!hasPermission(menuPermissions.ALLOW_TO_ENTER_PRODUCT_IN_FG_INVENTORY)}
      initialEditMode={hasPermission(menuPermissions.ALLOW_TO_ENTER_PRODUCT_IN_FG_INVENTORY)}
      tabKey="fginventorymaster"
    // statusOptions={_statusOptions}
    // hsnOptions={_HSNOptions}
    />
  );

  const fgDrawer = (
    <SaveOrUpdateFGInventory
      key="fg-inventory-master-drawer" // Stable key to prevent drawer remounting when switching items
      open={fgDrawerOpen}
      onClose={() => {
        setFgDrawerOpen(false);
        setSelectedRow(null);
        resetEditDirty();
      }}
      initialData={selectedRow}
      onSuccess={(savedItem) => {
        const isNewItem = !selectedRow;

        if (savedItem) {
          savedItemRef.current = {
            fg_item_id: savedItem.fg_item_id || savedItem.fgItemID || savedItem.ID,
            item_code: savedItem.item_code || savedItem.itemCode,
            isNew: isNewItem,
          };
        } else if (selectedRow) {
          savedItemRef.current = {
            fg_item_id: selectedRow.fg_item_id || selectedRow.fgItemID,
            item_code: selectedRow.item_code || selectedRow.itemCode,
            isNew: false, // This is an edit since selectedRow exists
          };
        }

        if (isNewItem && savedItem) {
          // For new items, add to top of current page
          const transformedItem = transformRecord(savedItem, hsnTextMap);

          // Add to top of current page data
          setInventoryData((prevData) => {
            // Remove any existing items with same ID to avoid duplicates
            const filtered = prevData.filter(
              (item) =>
                item.fg_item_id !== transformedItem.fg_item_id
            );
            // Add new item at the top
            return [transformedItem, ...filtered];
          });

          // Update total records count (increment by 1)
          if (tableProps.setTotalRecords && typeof tableProps.setTotalRecords === "function") {
            const currentTotal = tableProps.totalRecords || 0;
            tableProps.setTotalRecords(currentTotal + 1);
          }
        } else {
          // For edited items, refresh current page
          const q = lastAppliedQueryRef.current || {};

          lastQueryRef.current = null;
          fetchInventory(
            q.pageSize || tableProps.pageSize || 25,
            q.pageNumber0 != null ? q.pageNumber0 : (tableProps.currentPage || 1) - 1,
            q.columnName || currentSortConfig.key || "",
            q.sortOrder || currentSortConfig.direction || "",
            q.searchKeyword || "",
            q.isGlobalSearch != null ? q.isGlobalSearch : 0,
            q.shortCut != null ? q.shortCut : selectedShortcut,
            Array.isArray(q.searchFilter) ? q.searchFilter : activeSearchFilters,
            { force: true }
          );
        }

        setFgDrawerOpen(false);
        setSelectedRow(null);
        resetEditDirty();
      }}
      disabled={!hasPermission(menuPermissions.ALLOW_TO_EDIT_PRODUCT_IN_FG_INVENTORY)}
      initialEditMode={false}
      showEdit={!!selectedRow && hasPermission(menuPermissions.ALLOW_TO_EDIT_PRODUCT_IN_FG_INVENTORY)}
      onEdit={() => { }}
      onDirtyChange={handleEditDirtyChange}
    // statusOptions={_statusOptions}
    // hsnOptions={_HSNOptions}
    />
  );

  const bomDrawer = (
    <DraggableModal
      open={bomDrawerOpen}
      onClose={() => {
        setBomDrawerOpen(false);
        setSelectedRow(null);
        setBomID(null);
        setBomHeaderActions(null);
        setBomDirty(false);
      }}
      title="Bill of Material"
      width={"90%"}
      height={"90%"}
      maxWidth={"100%"}
      maxHeight={"100%"}
      resizable={true}
      maskClosable={false}
      allowMinimize={false}
      headerActions={bomHeaderActions}
      dirtyGuard={{
        isDirty: () => bomDirty,
        title: "Unsaved Changes",
        message: (
          <>
            <div>You have unsaved changes.</div>
            <div>If you want to close without saving?</div>
          </>
        ),
      }}
    >
      <BillOfMaterial
        fgItemID={selectedRow?.fg_item_id || selectedRow?.fgItemID || selectedRow?.ID}
        bomID={bomID}
        itemCode={selectedRow?.item_code}
        itemDescription={selectedRow?.item_description}
        onHeaderActionsReady={setBomHeaderActions}
        onEditModeChange={setBomDirty}
      />
    </DraggableModal>
  );

  // ---------- Refresh handler ----------

  const handleRefresh = useCallback(() => {
    const performRefresh = () => {
      try {
        if (tableRef.current && typeof tableRef.current.refresh === "function") {
          tableRef.current.refresh();
        }

        setSelectedShortcut("");
        setActiveColumnSearch({ key: "", value: "" });
        setActiveColumnFilters({});
        activeColumnFiltersRef.current = {};
        setActiveSearchFilters([]);
        setCurrentSortConfig({ key: "", direction: "" });

        if (typeof tableProps.setSearchTerm === "function") tableProps.setSearchTerm("");

        if (typeof tableProps.setSortConfig === "function") {
          tableProps.setSortConfig({ key: "", direction: "" });
        }

        if (typeof tableProps.onPageSizeChange === "function") tableProps.onPageSizeChange(25);
        if (typeof tableProps.onPageChange === "function") tableProps.onPageChange(1);

        // Force a fresh API call
        lastQueryRef.current = null;
        fetchInventory(25, 0, "", "", "", 0, "", [], { force: true });
      } catch (e) {
        console.error("Error refreshing FG inventory list:", e);
      }
    };

    if (fgDrawerOpen && !checkEditUnsavedChanges(performRefresh, {})) return;
    // if (showAddDrawer && !checkAddUnsavedChanges(performRefresh, {})) return;

    performRefresh();
  }, [tableProps, fetchInventory, fgDrawerOpen, checkEditUnsavedChanges]);

  // ---------- Render ----------

  return (
    <div style={{ position: "relative" }}>
      {loading && <Loader />}

      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          {addFGDrawer}
          {fgDrawer}
          {bomDrawer}

          <DynamicSortableTable
            fixedFirstColumn={true}
            ref={tableRef}
            columns={inventoryColumns}
            data={inventoryData}
            onQueryChange={handleQueryChange}
            onAdd={
              hasPermission(menuPermissions.ALLOW_TO_ENTER_PRODUCT_IN_FG_INVENTORY)
                ? () => {
                  if (fgDrawerOpen && !checkEditUnsavedChanges(() => setShowAddDrawer(true), {})) {
                    return;
                  }
                  setShowAddDrawer(true);
                }
                : undefined
            }
            onRefresh={handleRefresh}
            title="FG Inventory Master"
            icon={
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
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 3h-1a2 2 0 0 0-2 2v2" />
                <path d="M8 3h1a2 2 0 0 1 2 2v2" />
              </svg>
            }
            showGlobalSearch={true}
            getActions={getActions}
            disableSearch={false}
            autoSelectFirstRow={true}
            // Server-side pagination, sorting, and search
            currentPage={tableProps.currentPage}
            pageSize={tableProps.pageSize}
            totalRecords={tableProps.totalRecords}
          />
        </div>
      </main>

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete FG Inventory"
        message={selectedRow ? ` ${selectedRow.item_code}` : ""}
      />

      <ConfirmDialog {...editDirtyConfirmDialog} />
      <ConfirmDialog {...addDirtyConfirmDialog} />
    </div>
  );
}
