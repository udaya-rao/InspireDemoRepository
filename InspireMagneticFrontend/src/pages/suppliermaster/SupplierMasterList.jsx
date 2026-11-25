import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import RightDrawer from "../../components/RightDrawer";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import Loader from "../../components/Loader";
import SaveOrUpdateSupplier from "./SaveOrUpdateSupplier";
import {
  ConfirmDialog,
  DeleteConfirmDialog,
} from "../../components/Notification";
import { useToast } from "../../components/useToast";
import {
  hasPermission,
  menuPermissions,
} from "../../permissions/permissionUtils";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges.jsx";
import {
  fetchSupplierList,
  getStatusOptions,
  getSupplierType,
  deleteSupplier,
  fetchSupplierDetails,
} from "../../services/supplierMasterService.js";
import { formatDate } from "../../utils/dateUtils.js";
import { handleApiValidationErrors } from "../../utils/CustomValidation";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS, STATUS_ACTIVE, STATUS_IN_ACTIVE, STATUS_INACTIVE, TITLE_EDIT_SUPPLIER, TITLE_ADD_SUPPLIER } from "../../utils/ConstVariables";


const supplierColumns = [
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    width: "0%",
    minWidth: "100px",
  },
  {
    key: "supplier_name",
    label: "Supplier Name",
    searchable: false,
    ignoreSpecial: true,
    width: "10%",
    minWidth: "200px",
  },
  {
    key: "supplier_type_text",
    label: "Supplier Type",
    searchable: false,
    width: "5%",
    minWidth: "100px",
  },
  {
    key: "supplier_status_text",
    label: "Status",
    width: "12%",
    minWidth: "160px",
    style: { textAlign: "center" },
    render: (row) =>
      row.supplier_status === 1 ? (
        <span
          style={{
            color: "#22c55e",
            background: "#dcfce7",
            borderRadius: 12,
            padding: "2px 12px",
            fontWeight: 600,
            fontSize: 12,
            display: "inline-block",
            border: "none",
          }}
        >
          {STATUS_ACTIVE}
        </span>
      ) : (
        <span
          style={{
            color: "#ef4444",
            background: "#fef2f2",
            borderRadius: 12,
            padding: "2px 12px",
            fontWeight: 600,
            fontSize: 12,
            display: "inline-block",
            border: "none",
          }}
        >
          {STATUS_INACTIVE}
        </span>
      ),
    searchable: false,
  },
  {
    key: "prep_by",
    label: "Prepared By",
    searchable: false,
    width: "13%",
    minWidth: "160px",
  },
  {
    key: "prep_date",
    label: "Prepared Date",
    searchable: false,
    width: "13%",
    minWidth: "160px",
  },
  {
    key: "supplier_id",
    label: "ID",
    searchable: false,
    width: "5%",
    minWidth: "100px",
  },
];

const extractDropdownList = (res) => {
  if (Array.isArray(res)) return res;

  const d1 = res?.data;
  if (Array.isArray(d1)) return d1;

  const d2 =
    res?.data?.data?.DROPDOWN_LIST ??
    res?.data?.DROPDOWN_LIST ??
    res?.data?.data ??
    res?.data;

  if (Array.isArray(d2)) return d2;

  const d3 =
    res?.data?.data?.data?.DROPDOWN_LIST ??
    res?.data?.data?.data ??
    res?.data?.data;

  if (Array.isArray(d3)) return d3;

  return [];
};

// Transform API record to table row
const transformRecord = (item, supplierTypeTextMap) => {
  const rawSupplierTypeValue =
    item?.supplier_type_code ?? item?.supplier_type ?? null;

  const supplierTypeKey =
    rawSupplierTypeValue !== undefined && rawSupplierTypeValue !== null
      ? String(rawSupplierTypeValue).trim()
      : "";

  const supplierTypeText =
    supplierTypeKey &&
      supplierTypeTextMap &&
      supplierTypeTextMap[supplierTypeKey]
      ? supplierTypeTextMap[supplierTypeKey]
      : supplierTypeKey;
  const rawPrepDate = item?.prep_date_raw ?? item?.prep_date ?? "";
  const formattedPrepDate = formatDate(rawPrepDate) || String(rawPrepDate || "");

  return {
    ...item,
    supplier_type_code: supplierTypeKey,
    supplier_type: supplierTypeText,
    status: item.supplier_status === 1 ? STATUS_ACTIVE : STATUS_IN_ACTIVE,
    prep_date_raw: rawPrepDate,
    prep_date: formattedPrepDate,
  };
};

export default function SupplierMasterList() {
  const { showToast } = useToast();

  const {
    rows: supplierData,
    setRows: setSupplierData,
    tableProps,
  } = usePaginatedTable([], 25, true);

  const [loading, setLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const editSupplierRef = useRef(null);

  const [selectedRow, setSelectedRow] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const tableRef = useRef(null);
  const addFormRef = useRef();
  const editFormRef = useRef();
  const [editMode, setEditMode] = useState(false);

  // Track saved item for highlighting after refresh
  const savedItemRef = useRef(null);

  // Track active column search/filter state (we only use setters)
  const [, setActiveColumnSearch] = useState({ key: "", value: "" });
  const [, setActiveColumnFilters] = useState({});
  const activeColumnFiltersRef = useRef({});
  const [activeSearchFilters, setActiveSearchFilters] = useState([]);
  const [currentSortConfig, setCurrentSortConfig] = useState({
    key: "",
    direction: "",
  });

  // Raw lists from APIs
  const [statusList, setStatusList] = useState([]);
  const [supplierTypeList, setSupplierTypeList] = useState([]);
  const [dropdownsReady, setDropdownsReady] = useState(false);

  // Separate dirty state for add and edit forms
  const {
    isDirty: isAddFormDirty,
    setIsDirty: setIsAddFormDirty,
    // checkUnsavedChanges: checkAddFormUnsavedChanges,
    resetDirty: resetAddFormDirty,
    dirtyConfirmDialog: addFormDirtyConfirmDialog,
  } = useUnsavedChanges({});

  const {
    isDirty: isEditFormDirty,
    setIsDirty: setIsEditFormDirty,
    checkUnsavedChanges: checkEditFormUnsavedChanges,
    resetDirty: resetEditFormDirty,
    dirtyConfirmDialog: editFormDirtyConfirmDialog,
  } = useUnsavedChanges({});

  // Add Supplier Drawer
  const confirmCloseAdd = () => {
    setShowAddForm(false);
    resetAddFormDirty();
  };

  function mapSupplierDetails(details, contactDetails = []) {
    return {
      supplierID: details.supplier_id,
      supplierName: details.supplier_name,
      supplierAddress1: details.supplier_address1,
      supplierAddress2: details.supplier_address2,
      supplierStatus: details.supplier_status,
      gstinNumber: details.gstin_number,
      panNumber: details.pan_number,
      supplierWebsite: details.supplier_website,
      supplierPincode: details.supplier_pin_code,
      preparedBy: details.prep_by || "",
      entryDate: details.prep_date ? details.prep_date.split("T")[0] : "",
      updatedBy: details.update_by || "",
      updatedDate: details.update_date ? details.update_date.split("T")[0] : "",
      supplierType: details.supplier_type,
      supplierSupply: details.supplier_supply ?? details.supplierSupply ?? "",
      supplierContacts: contactDetails,
      paramType: "ADD",
    };
  }

  const loadSupplierDetails = useCallback(async (supplier_id) => {
    const data = await fetchSupplierDetails(supplier_id);
    const details = data?.data?.SUPPLIER_MASTER_DETAILS?.[0];
    const contactDetails = data?.data?.SUPPLIER_CONTACT_MASTER_DETAILS || [];
    return details ? mapSupplierDetails(details, contactDetails) : null;
  }, []);

  // Sync editSupplierRef with editSupplier state
  useEffect(() => {
    if (editSupplier) {
      editSupplierRef.current = editSupplier;
    }
  }, [editSupplier]);

  const handleEditSupplierInternal = useCallback(
    async (row) => {
      // Validate row data before proceeding
      if (!row || !row.supplier_id) {
        console.error("Invalid row data in handleEditSupplierInternal:", row);
        setTimeout(() => {
          showToast("Invalid supplier data", ERROR_STATUS.toLowerCase());
        }, 0);
        return;
      }

      try {
        const mapped = await loadSupplierDetails(row.supplier_id);

        if (mapped) {
          setEditSupplier(mapped);
          editSupplierRef.current = mapped; // Sync ref with state
          setShowEditForm(true);
          setEditMode(false);
          resetEditFormDirty();
        } else {
          setEditSupplier(null);
          editSupplierRef.current = null; // Sync ref with state
          showToast("No details found for this supplier.", ERROR_STATUS.toLowerCase());
        }
      } catch (err) {
        console.error("Error fetching supplier details:", err);
        setEditSupplier(null);
        editSupplierRef.current = null; // Sync ref with state
      }
    },
    [loadSupplierDetails, resetEditFormDirty, showToast]
  );

  const handleEditSupplier = useCallback(
    async (row) => {
      // Validate row data before proceeding
      if (!row || !row.supplier_id) {
        console.error("Invalid row data in handleEditSupplier:", row);
        return; // Don't proceed if row is invalid
      }

      // Close profile dropdown if open
      window.dispatchEvent(new Event('closeProfileDropdown'));

      // const proceedToEdit = async (data) => {
      //   if (data && data.supplier_id) {
      //     await handleEditSupplierInternal(data);
      //   }
      // };

      // Check if Add form is open and dirty (only if Edit drawer not already open)
      // if (!showEditForm && showAddForm && !checkAddFormUnsavedChanges(proceedToEdit, row)) {
      //   return;
      // }

      const canProceed = checkEditFormUnsavedChanges(async (data) => {
        if (data && data.supplier_id) {
          await handleEditSupplierInternal(data);
        }
      }, row);

      if (canProceed) {
        await handleEditSupplierInternal(row);
      }
    },
    [checkEditFormUnsavedChanges, handleEditSupplierInternal]
  );

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

  // Map supplier type display values
  const supplierTypeTextMap = useMemo(() => {
    const map = {};
    (supplierTypeList || []).forEach((item) => {
      const key =
        item?.ValueText !== undefined && item?.ValueText !== null
          ? String(item.ValueText).trim()
          : "";
      const label =
        item?.DisplayText !== undefined && item?.DisplayText !== null
          ? String(item.DisplayText).trim()
          : "";
      if (key && label) map[key] = label;
    });
    return map;
  }, [supplierTypeList]);

  // Handle add supplier success - must be after supplierTypeTextMap is defined
  const handleAddSupplier = useCallback((newSupplier) => {
    if (newSupplier) {
      // Track new item for highlighting after refresh
      savedItemRef.current = {
        supplier_id: newSupplier.supplier_id || newSupplier.supplierID || newSupplier.ID,
        supplierID: newSupplier.supplier_id || newSupplier.supplierID || newSupplier.ID,
        supplier_name: newSupplier.supplier_name || newSupplier.supplierName,
        isNew: true,
      };

      // Transform the new item and add it to the top of current page
      const transformedRecord = transformRecord(
        {
          ...newSupplier,
          prep_date_raw: newSupplier?.prep_date || newSupplier?.prep_date_raw, // keep raw for safety
        },
        supplierTypeTextMap
      );

      // Add to top of current page data
      setSupplierData((prevData) => {
        // Remove any existing items with same ID to avoid duplicates
        const filtered = prevData.filter(
          (item) =>
            item.supplier_id !== transformedRecord.supplier_id
        );
        // Add new item at the top
        return [transformedRecord, ...filtered];
      });

      // Update total records count (increment by 1)
      if (typeof tableProps.setTotalRecords === "function") {
        const currentTotal = tableProps.totalRecords || 0;
        tableProps.setTotalRecords(currentTotal + 1);
      }
    }

    setShowAddForm(false);
    resetAddFormDirty();
  }, [setSupplierData, tableProps, supplierTypeTextMap, resetAddFormDirty]);

  useEffect(() => {
    const hasMap = Object.keys(supplierTypeTextMap || {}).length > 0;
    if (!hasMap) return;
    if (!Array.isArray(supplierData) || supplierData.length === 0) return;

    const needsRemap = supplierData.some((r) => {
      const v = r?.supplier_type;
      return v !== undefined && v !== null && /^[0-9]+$/.test(String(v).trim());
    });

    if (!needsRemap) return;

    setSupplierData((prev) =>
      (prev || []).map((r) => {
        const code = String(r?.supplier_type_code ?? r?.supplier_type ?? "").trim();
        const text = supplierTypeTextMap?.[code] ?? code;
        return {
          ...r,
          supplier_type_code: code,
          supplier_type: text,
        };
      })
    );
  }, [supplierTypeTextMap, supplierData, setSupplierData]);

  const lastQueryRef = useRef(null);
  const dropdownsFetchedRef = useRef(false);
  const supplierFetchedRef = useRef(false);
  const requestSeqRef = useRef(0);

  // ---------- Meta dropdowns ----------
  useEffect(() => {
    if (dropdownsFetchedRef.current) return;

    let cancelled = false;

    const loadDropdowns = async () => {
      try {
        const statusRes = await getStatusOptions();
        if (cancelled) return;
        const statusList = extractDropdownList(statusRes);
        setStatusList(statusList);

        const supplierTypeRes = await getSupplierType();
        if (cancelled) return;
        const typeList = extractDropdownList(supplierTypeRes);
        setSupplierTypeList(typeList);

        setDropdownsReady(true);
        dropdownsFetchedRef.current = true;
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load Status / Supplier Type dropdowns", error);

        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else if (showToast) {
          showToast("Failed to load dropdowns", ERROR_STATUS.toLowerCase());
        }

        setDropdownsReady(true);
        dropdownsFetchedRef.current = true;
      }
    };

    loadDropdowns();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // ---------- Supplier fetch ----------
  const fetchSupplier = useCallback(
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
      const trimmedKeyword = String(searchKeyword || "").trim();
      const filterKeyword = (
        Array.isArray(searchFilter)
          ? searchFilter.find((f) => (f?.searchKeyword || "").trim().length > 0)?.searchKeyword || ""
          : ""
      ).trim();
      const keywordToUse = trimmedKeyword || filterKeyword;
      const hasKeyword = keywordToUse.length > 0;
      const effectiveIsGlobalSearch = hasKeyword ? 1 : 0;

      const payload = {
        pageSize,
        pageNumber,
        searchFilter: [],
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
          columnName: f.columnName || "supplier_name",
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
        payload.searchFilter = [];
      }

      const payloadKey = JSON.stringify(payload);
      if (!options?.force && lastQueryRef.current === payloadKey) return;
      lastQueryRef.current = payloadKey;

      const reqId = ++requestSeqRef.current;

      setLoading(true);
      try {
        const res = await fetchSupplierList(payload);
        if (reqId !== requestSeqRef.current) return;

        const list = res?.data?.SUPPLIER_MASTER_LIST || [];
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
            fetchSupplier(
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

        // Make sure raw date is preserved on first transform
        let data = (list || []).map((item) =>
          transformRecord(
            {
              ...item,
              prep_date_raw: item?.prep_date, // keep API raw
            },
            supplierTypeTextMap
          )
        );

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

        // For edited items, keep the ref to highlight the row after data is set
        // For new items, they are already added manually to the top, so we just need to highlight

        setSupplierData(data);

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
        console.error("Error fetching Supplier list:", error);
        setSupplierData([]);
      } finally {
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    },
    [setSupplierData, tableProps, supplierTypeTextMap]
  );

  // First load only after dropdownsReady
  useEffect(() => {
    if (!dropdownsReady) return;
    if (supplierFetchedRef.current) return;
    supplierFetchedRef.current = true;

    fetchSupplier(25, 0, "", "", "", 0, [], { force: true });
  }, [dropdownsReady, fetchSupplier]);

  // Highlight saved row (both new and edited) after data refresh
  useEffect(() => {
    if (savedItemRef.current && supplierData.length > 0) {
      const savedIdentifier = savedItemRef.current;
      const savedIndex = supplierData.findIndex((item) => {
        // Try to match by ID (handle both number and string comparisons)
        const savedSupplierId = savedIdentifier.supplier_id || savedIdentifier.supplierID;
        const itemId = item.supplier_id;
        const matchById = savedSupplierId && itemId && (
          savedSupplierId === itemId ||
          String(savedSupplierId) === String(itemId) ||
          Number(savedSupplierId) === Number(itemId)
        );

        // Try to match by supplier_name (case-insensitive)
        const savedSupplierName = savedIdentifier.supplier_name ? String(savedIdentifier.supplier_name).trim().toUpperCase() : null;
        const itemName = item.supplier_name ? String(item.supplier_name).trim().toUpperCase() : null;
        const matchByName = savedSupplierName && itemName && savedSupplierName === itemName;

        return matchById || matchByName;
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
  }, [supplierData]);

  // ---------- Unified query handler ----------
  const handleQueryChange = useCallback(
    (q) => {
      try {
        const pageSizeNum = Number(q?.pageSize) || 25;
        const pageNumber0 = Math.max(0, Number(q?.pageNumber) || 0);
        const columnName = String(q?.columnName || "");
        const isGlobalSearch = Number(q?.isGlobalSearch) === 1 ? 1 : 0;
        const sortOrder = String(q?.sortOrder || "");
        const searchKeyword = String(q?.searchKeyword || "");
        const searchFilter = Array.isArray(q?.searchFilter)
          ? q.searchFilter
          : [];

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

        if (columnName && sortOrder) {
          setCurrentSortConfig({ key: columnName, direction: sortOrder });
        } else if (sortOrder && searchFilter.length > 0) {
          const sortFilter = searchFilter.find(
            (f) => f.columnName && !f.searchKeyword
          );
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
            finalSearchFilter = [];
            finalIsGlobalSearch = 0;
          }
          finalColumnName = columnName || "supplier_name";

          setActiveColumnSearch({ key: "", value: "" });
          setActiveColumnFilters({});
          activeColumnFiltersRef.current = {};
          setActiveSearchFilters(finalSearchFilter);
        } else if (searchFilter.length > 0) {
          // Multiple column filters via searchFilter array
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
          // finalColumnName stays as columnName (which represents the sort column if any)
        } else if (columnName && (searchKeyword || "").length > 0) {
          // Single column search (legacy)
          const nextFilters = { [columnName]: searchKeyword };
          setActiveColumnSearch({ key: columnName, value: searchKeyword });
          setActiveColumnFilters(nextFilters);
          activeColumnFiltersRef.current = nextFilters;
          setActiveSearchFilters([{ columnName, searchKeyword }]);
          finalSearchFilter = [{ columnName, searchKeyword }];
        } else {
          setActiveColumnSearch({ key: "", value: "" });
          setActiveColumnFilters({});
          activeColumnFiltersRef.current = {};
          setActiveSearchFilters([]);
          finalSearchFilter = [];
        }

        fetchSupplier(
          pageSizeNum,
          pageNumber0,
          finalColumnName,
          sortOrder,
          finalSearchKeyword,
          finalIsGlobalSearch,
          finalSearchFilter
        );
      } catch (e) {
        console.error("Failed to handle unified query payload", e);
      }
    },
    [fetchSupplier, tableProps]
  );

  // ---------- Delete handling ----------
  const handleDelete = useCallback((row) => {
    setSelectedRow(row);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    if (!selectedRow) return;

    try {
      const apiResult = await deleteSupplier(selectedRow.supplier_id);

      const validationErrors = apiResult?.data?.ValidationErrors;
      const deleteSupplierMessages =
        apiResult?.data?.DELETE_SUPPLIER_DETAILS_RESPONSE ||
        apiResult?.data?.data?.DELETE_SUPPLIER_DETAILS_RESPONSE ||
        [];
      const status =
        apiResult?.Status || apiResult?.data?.Status || apiResult?.data?.status;

      if (handleApiValidationErrors(validationErrors, showToast)) {
        return;
      }

      let message = "";

      if (
        Array.isArray(deleteSupplierMessages) &&
        deleteSupplierMessages.length > 0
      ) {
        message += deleteSupplierMessages.map((e) => e.Message).join(" ");
      }

      if (!message) {
        message =
          apiResult?.data?.message ||
          apiResult?.message ||
          "No message returned from server.";
      }

      const toastType =
        status === SUCCESS_STATUS || status === MESSAGE_OK ? SUCCESS_STATUS : ERROR_STATUS.toLowerCase();

      if (showToast) showToast(message.trim(), toastType);

      if (toastType === ERROR_STATUS.toLowerCase()) return;

      const pageSize = tableProps.pageSize || 25;
      const pageNumber0 = (tableProps.currentPage || 1) - 1;
      const columnName = currentSortConfig.key || "";
      const sortOrder = currentSortConfig.direction || "";
      const searchFilter = activeSearchFilters;

      lastQueryRef.current = null;

      await fetchSupplier(
        pageSize,
        pageNumber0,
        columnName,
        sortOrder,
        "",
        0,
        searchFilter,
        { force: true }
      );
    } catch (err) {
      console.error("Error Deleting Supplier:", err);

      const fallbackMsg =
        err?.response?.data?.message ||
        err?.response?.data?.DELETE_SUPPLIER_DETAILS_RESPONSE?.[0]?.Message ||
        "Failed to Delete Supplier";

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
    fetchSupplier,
  ]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setSelectedRow(null);
  }, []);

  // ---------- Row actions ----------
  const getActions = useCallback(
    (row) => {
      const actions = [];

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
        onClick: () => {
          handleEditSupplier(row);
        },
      });

      if (hasPermission(menuPermissions.SUPPLIER_MASTER_DELETE)) {
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
    [handleDelete, handleEditSupplier]
  );

  // ---------- Add success handler ----------
  const handleAddSuccess = useCallback(
    (newRecord) => {
      if (newRecord) {
        // Track new item for highlighting after refresh
        savedItemRef.current = {
          supplier_id: newRecord.supplier_id || newRecord.supplierID || newRecord.ID,
          supplierID: newRecord.supplier_id || newRecord.supplierID || newRecord.ID,
          supplier_name: newRecord.supplier_name || newRecord.supplierName,
          isNew: true,
        };

        // Transform the new item and add it to the top of current page
        const transformedRecord = transformRecord(
          {
            ...newRecord,
            prep_date_raw: newRecord?.prep_date || newRecord?.prep_date_raw, // keep raw for safety
          },
          supplierTypeTextMap
        );

        // Add to top of current page data
        setSupplierData((prevData) => {
          // Remove any existing items with same ID to avoid duplicates
          const filtered = prevData.filter(
            (item) =>
              item.supplier_id !== transformedRecord.supplier_id
          );
          // Add new item at the top
          return [transformedRecord, ...filtered];
        });

        // Update total records count (increment by 1)
        if (typeof tableProps.setTotalRecords === "function") {
          const currentTotal = tableProps.totalRecords || 0;
          tableProps.setTotalRecords(currentTotal + 1);
        }
      }

      setShowAddForm(false);
    },
    [setSupplierData, tableProps, supplierTypeTextMap]
  );

  const addSupplierDrawer = (
    <RightDrawer
      open={showAddForm}
      tabKey="suppliermaster"
      newRowFocusKey="supplierCode"
      onClose={confirmCloseAdd}
      title={TITLE_ADD_SUPPLIER}
      onSave={() => addFormRef.current && addFormRef.current.submit()}
      onSuccess={handleAddSuccess}
      initialData={null}
      enableCloseConfirm
      closeConfirmScope="create"
      isCreate={true}
      isDirty={isAddFormDirty}
      closeConfirmTitle="Unsaved Changes"
      closeConfirmMessage="You have unsaved changes. Save draft or close without saving?"
      onSaveDraft={() => addFormRef.current && addFormRef.current.saveDraft()}
      onDiscardDraft={() => {
        try {
          addFormRef.current?.clearDraft?.();
        } catch {
          /* no-op */
        }
        resetAddFormDirty();
      }}
    >
      <SaveOrUpdateSupplier
        ref={addFormRef}
        open={showAddForm}
        onClose={confirmCloseAdd}
        onSuccess={handleAddSupplier}
        onDirtyChange={(dirty) => setIsAddFormDirty(dirty)}
        initialData={null}
        disabled={!hasPermission(menuPermissions.SUPPLIER_MASTER_CREATE)}
        initialEditMode={hasPermission(menuPermissions.SUPPLIER_MASTER_CREATE)}
      />
    </RightDrawer>
  );

  const confirmCloseEdit = (forceClose = false) => {
    if (forceClose) {
      setShowEditForm(false);
      setEditSupplier(null);
      editSupplierRef.current = null; // Sync ref with state
      setEditMode(false);
      resetEditFormDirty();
      return;
    }

    setShowEditForm(false);
    setEditSupplier(null);
    editSupplierRef.current = null; // Sync ref with state
    setEditMode(false);
    resetEditFormDirty();
  };

  const supplierDrawer = (
    <RightDrawer
      tabKey="suppliermaster"
      open={showEditForm}
      onClose={confirmCloseEdit}
      title={editSupplier ? TITLE_EDIT_SUPPLIER : TITLE_ADD_SUPPLIER}
      onSave={
        editMode
          ? () => editFormRef.current && editFormRef.current.submit()
          : undefined
      }
      showEdit={!!editSupplier && !editMode && hasPermission(menuPermissions.SUPPLIER_MASTER_EDIT)}
      onEdit={() => setEditMode(true)}
      disableEdit={editMode}
      onDisableEdit={() => setEditMode(false)}
      disabled={!hasPermission(menuPermissions.SUPPLIER_MASTER_EDIT)}
      isDirty={isEditFormDirty}
      isCreate={!editSupplier}
      enableCloseConfirm
      closeConfirmScope="edit"
      // Only disable tab close confirm when in view mode (not edit mode)
      // This allows unsaved changes popup when editing
      disableTabCloseConfirm={!!editSupplier && !editMode && !isEditFormDirty}
      onDiscardDraft={() => {
        try {
          resetEditFormDirty();
        } catch {
          /* noop */
        }
      }}
      onSaveDraft={() => editFormRef.current && editFormRef.current.saveDraft()}
    >
      {(editSupplier || editSupplierRef.current) && (
        <SaveOrUpdateSupplier
          key={(editSupplier || editSupplierRef.current)?.supplierID || "new"} // Force re-render when supplier changes
          ref={editFormRef}
          open={showEditForm}
          onClose={() => confirmCloseEdit(true)}
          initialData={editSupplier || editSupplierRef.current} // Use ref as fallback
          editMode={editMode}
          onSuccess={(savedItem) => {
            // Determine if this is a new item or edited item
            const isNewItem = !editSupplier;

            // Store saved item identifier for highlighting after refresh
            if (savedItem) {
              savedItemRef.current = {
                supplier_id: savedItem.supplier_id || savedItem.supplierID || savedItem.ID,
                supplierID: savedItem.supplier_id || savedItem.supplierID || savedItem.ID,
                supplier_name: savedItem.supplier_name || savedItem.supplierName,
                isNew: isNewItem,
              };
            } else if (editSupplier) {
              // Fallback to editSupplier if savedItem is not available
              savedItemRef.current = {
                supplier_id: editSupplier.supplierID || editSupplier.supplier_id,
                supplierID: editSupplier.supplierID || editSupplier.supplier_id,
                supplier_name: editSupplier.supplierName || editSupplier.supplier_name,
                isNew: false, // This is an edit since editSupplier exists
              };
            }

            if (isNewItem && savedItem) {
              // For new items, add to top of current page
              const transformedRecord = transformRecord(
                {
                  ...savedItem,
                  prep_date_raw: savedItem?.prep_date || savedItem?.prep_date_raw,
                },
                supplierTypeTextMap
              );

              // Add to top of current page data
              setSupplierData((prevData) => {
                // Remove any existing items with same ID to avoid duplicates
                const filtered = prevData.filter(
                  (item) =>
                    item.supplier_id !== transformedRecord.supplier_id
                );
                // Add new item at the top
                return [transformedRecord, ...filtered];
              });

              // Update total records count (increment by 1)
              if (typeof tableProps.setTotalRecords === "function") {
                const currentTotal = tableProps.totalRecords || 0;
                tableProps.setTotalRecords(currentTotal + 1);
              }
            } else {
              // For edited items, refresh current page
              const pageSize = tableProps.pageSize || 25;
              const pageNumber0 = (tableProps.currentPage || 1) - 1;
              const columnName = currentSortConfig.key || "";
              const sortOrder = currentSortConfig.direction || "";
              const searchFilter = activeSearchFilters;

              lastQueryRef.current = null;
              fetchSupplier(
                pageSize,
                pageNumber0,
                columnName,
                sortOrder,
                "",
                0,
                searchFilter,
                { force: true }
              );
            }
          }}
          disabled={!hasPermission(menuPermissions.SUPPLIER_MASTER_EDIT)}
          showEdit={!!editSupplier && hasPermission(menuPermissions.SUPPLIER_MASTER_EDIT)}
          onEdit={() => { }}
          onDirtyChange={(dirty) => {
            setIsEditFormDirty(dirty);
          }}
        />
      )}
    </RightDrawer>
  );

  // ---------- Refresh handler ----------
  const handleRefresh = useCallback(() => {
    try {
      setActiveColumnSearch({ key: "", value: "" });
      setActiveColumnFilters({});
      activeColumnFiltersRef.current = {};
      setActiveSearchFilters([]);
      setCurrentSortConfig({ key: "", direction: "" });

      if (tableRef.current && typeof tableRef.current.refresh === "function") {
        tableRef.current.refresh();
      }

      if (typeof tableProps.setSortConfig === "function") {
        tableProps.setSortConfig({ key: "", direction: "" });
      }

      if (typeof tableProps.setSearchTerm === "function")
        tableProps.setSearchTerm("");

      if (typeof tableProps.onPageSizeChange === "function")
        tableProps.onPageSizeChange(25);
      if (typeof tableProps.onPageChange === "function")
        tableProps.onPageChange(1);

      lastQueryRef.current = null;
      fetchSupplier(25, 0, "", "", "", 0, [], { force: true });
    } catch (e) {
      console.error("Error refreshing Supplier list:", e);
    }
  }, [tableProps, fetchSupplier]);

  return (
    <div style={{ position: "relative" }}>
      {loading && <Loader />}

      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          {addSupplierDrawer}
          {supplierDrawer}

          <DynamicSortableTable
            fixedFirstColumn={true}
            ref={tableRef}
            columns={supplierColumns}
            data={supplierData}
            onQueryChange={handleQueryChange}
            onAdd={
              hasPermission(menuPermissions.SUPPLIER_MASTER_CREATE)
                ? () => setShowAddForm(true)
                : undefined
            }
            onRefresh={handleRefresh}
            title="Supplier Master"
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
                <path d="M3 21h18" />
                <path d="M3 10l4-3v3l4-3v6" />
                <path d="M13 13h4v8h-4z" />
                <path d="M17 13h4v8h-4z" />
              </svg>
            }
            showGlobalSearch={true}
            getActions={getActions}
            disableSearch={false}
            autoSelectFirstRow={true}
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
        title="Delete Supplier"
        message={selectedRow ? ` ${selectedRow.supplier_name}` : ""}
      />

      <ConfirmDialog {...addFormDirtyConfirmDialog} />
      <ConfirmDialog {...editFormDirtyConfirmDialog} />
    </div>
  );
}
