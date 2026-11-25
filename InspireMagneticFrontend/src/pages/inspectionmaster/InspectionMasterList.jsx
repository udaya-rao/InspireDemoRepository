import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import RightDrawer from "../../components/RightDrawer";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import Loader from "../../components/Loader";
import SaveOrUpdateInspection from "./SaveOrUpdateInspection";
import { ConfirmDialog, DeleteConfirmDialog } from "../../components/Notification";
import { useToast } from "../../components/useToast";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges.jsx";
import {
  fetchInspectionMasterList,
  getInspectionMasterDetails,
  deleteInspectionMaster,
  viewOrDeleteInspectionVideoFiles,
} from "../../services/inspectionMasterService";
import { hasPermission, menuPermissions } from "../../permissions/permissionUtils";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS } from "../../utils/ConstVariables";

const inspectionColumns = [
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    width: "0%",
    minWidth: "100px",
  },
  {
    key: "item_code",
    label: "Item Code",
    searchable: false,
    width: "35%",
    minWidth: "200px",
  },
  {
    key: "item_description",
    label: "Item Description",
    searchable: false,
    width: "65%",
    minWidth: "300px",
  },
];

export default function InspectionMasterList() {
  const { showToast } = useToast();

  const {
    rows: inspectionData,
    setRows: setInspectionData,
    tableProps,
  } = usePaginatedTable([], 25, true);

  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editInspection, setEditInspection] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);
  const tableRef = useRef(null);
  const addFormRef = useRef();
  const editFormRef = useRef();
  const editInspectionRef = useRef(null);
  const inspectionFetchedRef = useRef(false);
  const lastQueryRef = useRef(null);
  const requestSeqRef = useRef(0);

  // Track current sort configuration to preserve across filter changes
  const [, setCurrentSortConfig] = useState({
    key: "",
    direction: "",
  });

  // Track active column search/filter state
  const [, setActiveColumnSearch] = useState({ key: "", value: "" });
  const [, setActiveColumnFilters] = useState({});
  const activeColumnFiltersRef = useRef({});
  const [, setActiveSearchFilters] = useState([]);

  // Track saved item for highlighting after refresh
  const savedItemRef = useRef(null);

  // Separate dirty state for add and edit forms
  const {
    isDirty: isAddFormDirty,
    setIsDirty: setIsAddFormDirty,
    resetDirty: resetAddFormDirty,
    // checkUnsavedChanges: checkAddUnsavedChanges,
    dirtyConfirmDialog: addFormDirtyConfirmDialog,
  } = useUnsavedChanges({});

  const [selectedRow, setSelectedRow] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    isDirty: isEditFormDirty,
    setIsDirty: setIsEditFormDirty,
    resetDirty: resetEditFormDirty,
    checkUnsavedChanges: checkEditUnsavedChanges,
    dirtyConfirmDialog: editFormDirtyConfirmDialog,
  } = useUnsavedChanges({});

  const canCreateInspection = hasPermission(menuPermissions.INSPECTION_MASTER_CREATE);
  const canEditInspection = hasPermission(menuPermissions.INSPECTION_MASTER_EDIT);
  const canDeleteInspection = hasPermission(menuPermissions.INSPECTION_MASTER_DELETE);

  // Fetch inspection data
  const fetchInspectionData = useCallback(
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
          columnName: f.columnName || "item_code",
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

      // Prevent duplicate calls
      const payloadKey = JSON.stringify(payload);
      if (!options?.force && lastQueryRef.current === payloadKey) {
        return;
      }
      lastQueryRef.current = payloadKey;

      const reqId = ++requestSeqRef.current;
      setLoading(true);
      try {
        const res = await fetchInspectionMasterList(payload);
        if (reqId !== requestSeqRef.current) return;

        const list = res?.data?.INSPECTION_MASTER_LIST || [];

        const totalRecords =
          res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords ??
          res?.data?.TOTAL_RECORDS?.[0]?.totalRecords ??
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
            fetchInspectionData(
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

        // Map API response to table format
        const mapped = (list || []).map((item) => ({
          inspection_id: item.fg_rm_item_id || item.item_id || null,
          item_id: item.item_id || null,
          fg_rm_item_id: item.fg_rm_item_id || null,
          item_type: item.item_type || "",
          item_code: item.item_code || "",
          item_description: item.item_description || "",
        }));

        setInspectionData(mapped);

        // Access tableProps functions directly (they're stable, no need in deps)
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
        if (reqId !== requestSeqRef.current) return;
        console.error("Error fetching Inspection list:", error);
        setInspectionData([]);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else if (showToast) {
          showToast("Failed to load inspection data", ERROR_STATUS.toLowerCase());
        }
      } finally {
        if (reqId === requestSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [setInspectionData, showToast, tableProps]
  );

  // Initial data load - only once
  useEffect(() => {
    if (inspectionFetchedRef.current) return;
    inspectionFetchedRef.current = true;
    fetchInspectionData(25, 0, "", "", "", 0, [], { force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        // Track sort config for preservation - extract from searchFilter if columnName is empty but sortOrder exists
        if (columnName && sortOrder) {
          setCurrentSortConfig({ key: columnName, direction: sortOrder });
        } else if (sortOrder && searchFilter.length > 0) {
          // Extract sort column from searchFilter array (entry with empty searchKeyword)
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
          // Global search: pass searchKeyword in searchFilter array with empty columnName
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
          // Preserve columnName for sorting logic
          finalColumnName = columnName || "item_code";

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
          // Reset
          setActiveColumnSearch({ key: "", value: "" });
          setActiveColumnFilters({});
          activeColumnFiltersRef.current = {};
          setActiveSearchFilters([]);
          finalSearchFilter = [];
        }

        fetchInspectionData(
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
    [fetchInspectionData, tableProps]
  );

  // Handle view inspection - calls details API first, then opens drawer
  const handleViewInternal = useCallback(async (row) => {
    if (!row || (!row.inspection_id && !row.item_id && !row.fg_rm_item_id)) {
      console.error("Invalid row data in handleViewInternal:", row);
      if (showToast) {
        // showToast("Invalid inspection item data", "error");
      }
      return;
    }

    // Get numeric ID and item type for API call
    const numericID = row.fg_rm_item_id || row.item_id || row.inspection_id;
    const itemType = row.item_type || "";

    if (!numericID || !itemType) {
      console.error("Missing required data for API call:", { numericID, itemType });
      if (showToast) {
        showToast("Missing required data to load inspection details", ERROR_STATUS.toLowerCase());
      }
      return;
    }

    // Convert to number for API
    const fgRmItemID = isNaN(Number(numericID)) ? 0 : Number(numericID);
    if (fgRmItemID === 0) {
      console.error("Invalid numeric ID:", numericID);
      if (showToast) {
        showToast("Invalid item ID", ERROR_STATUS.toLowerCase());
      }
      return;
    }

    setLoadingDetails(true);

    try {
      // First, call GetInspectionMasterDetails API
      const response = await getInspectionMasterDetails({
        fgRmItemID: fgRmItemID,
        itemType: itemType.toUpperCase(),
      });

      // Map row data to form format
      const itemIDForDropdown = row.fg_rm_item_id || row.item_id || row.inspection_id;
      const mapped = {
        inspection_id: row.inspection_id || row.fg_rm_item_id || row.item_id,
        item_id: row.item_id || null,
        fg_rm_item_id: row.fg_rm_item_id || null,
        itemCode: itemIDForDropdown ? String(itemIDForDropdown) : row.item_code, // Use numeric ID for dropdown
        item_code: row.item_code, // Keep string code for reference
        item_type: row.item_type || "",
        item_description: row.item_description || "",
        characteristic: row.characteristic || "",
        characteristic_name: row.characteristic_name || "",
        _detailsResponse: response?.data?.INSPECTION_MASTER_DETAILS || [],
      };

      setEditInspection(mapped);
      editInspectionRef.current = mapped;
      setShowEditForm(true);
      setEditMode(false);
      resetEditFormDirty();
    } catch (error) {
      console.error("Error fetching inspection master details:", error);
      if (error?.response?.status === 401) {
        window.dispatchEvent(new Event("sessionExpired"));
      } else {
        // On error, still open drawer with basic data
        const itemIDForDropdown = row.fg_rm_item_id || row.item_id || row.inspection_id;
        const mapped = {
          inspection_id: row.inspection_id || row.fg_rm_item_id || row.item_id,
          item_id: row.item_id || null,
          fg_rm_item_id: row.fg_rm_item_id || null,
          itemCode: itemIDForDropdown ? String(itemIDForDropdown) : row.item_code,
          item_code: row.item_code,
          item_type: row.item_type || "",
          item_description: row.item_description || "",
          characteristic: row.characteristic || "",
          characteristic_name: row.characteristic_name || "",
        };
        setEditInspection(mapped);
        editInspectionRef.current = mapped;
        setShowEditForm(true);
        setEditMode(false);
        resetEditFormDirty();
        if (showToast) {
          showToast("Failed to load inspection details", ERROR_STATUS.toLowerCase());
        }
      }
    } finally {
      setLoadingDetails(false);
    }
  }, [resetEditFormDirty, showToast]);

  // Handle view - entry point for View button
  const handleView = useCallback(async (row) => {
    if (!row || (!row.inspection_id && !row.item_id && !row.fg_rm_item_id)) {
      console.error("Invalid row data in handleView:", row);
      return;
    }

    // Check if current edit form is dirty before switching
    if (showEditForm && !checkEditUnsavedChanges(handleViewInternal, row)) {
      return;
    }

    // Check if add form is dirty before switching
    // if (showAddForm && !checkAddUnsavedChanges(handleViewInternal, row)) {
    //   return;
    // }

    // Close profile dropdown if open
    window.dispatchEvent(new Event("closeProfileDropdown"));

    // Call the internal handler which will fetch details and open drawer
    await handleViewInternal(row);
  }, [handleViewInternal, showEditForm, checkEditUnsavedChanges]);

  // Delete handling
  const handleDelete = useCallback((row) => {
    const performDelete = (r) => {
      setSelectedRow(r);
      setShowDeleteConfirm(true);
    };

    if (showEditForm && !checkEditUnsavedChanges(performDelete, row)) return;
    // if (showAddForm && !checkAddUnsavedChanges(performDelete, row)) return;

    performDelete(row);
  }, [showEditForm, checkEditUnsavedChanges]);

  const confirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    if (!selectedRow) return;

    try {
      const fgRmItemID =
        selectedRow.fg_rm_item_id || selectedRow.item_id || selectedRow.inspection_id;
      const itemType = (selectedRow.item_type || "").toUpperCase();

      if (!fgRmItemID || !itemType) {
        if (showToast) {
          showToast("Missing required data to delete inspection master", ERROR_STATUS.toLowerCase());
        }
        return;
      }

      const apiResult = await deleteInspectionMaster({
        fgRmItemID,
        itemType,
      });

      const status =
        apiResult?.Status || apiResult?.status || apiResult?.message || "";

      const deleteMessages =
        apiResult?.data?.DELETE_INSPECTION_MASTER_DETAILS ||
        apiResult?.DELETE_INSPECTION_MASTER_DETAILS ||
        apiResult?.data?.data?.DELETE_INSPECTION_MASTER_DETAILS ||
        [];

      let message = "";

      if (Array.isArray(deleteMessages) && deleteMessages.length > 0) {
        message += deleteMessages.map((e) => e.Message).join(" ");
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

      // Call API to delete inspection video files associated with the deleted inspection master
      try {
        const itemCodeValue = selectedRow.item_code || "";
        if (itemCodeValue) {
          viewOrDeleteInspectionVideoFiles({
            inspectionID: 0,
            itemCode: String(itemCodeValue),
            fileName: "",
            paramType: "Delete",
          }).then((res) => {
            console.log("Deleted inspection video files after master delete:", res);
          }).catch((err) => {
            console.error("Error deleting inspection video files after master delete:", err);
          });
        }
      } catch (videoDeleteErr) {
        console.error("Error initiating video delete on inspection master delete:", videoDeleteErr);
      }

      // Re-fetch list using last query (to preserve paging/filtering) if available
      let pageSize = tableProps.pageSize || 25;
      let pageNumber0 = (tableProps.currentPage || 1) - 1;
      let columnName = "";
      let sortOrder = "";
      let searchKeyword = "";
      let isGlobalSearch = 0;
      let searchFilter = [];

      if (lastQueryRef.current) {
        try {
          const last = JSON.parse(lastQueryRef.current);
          pageSize = last.pageSize ?? pageSize;
          pageNumber0 = last.pageNumber ?? pageNumber0;
          columnName = last.columnName ?? "";
          sortOrder = last.sortOrder ?? "";
          searchKeyword = last.searchKeyword ?? "";
          isGlobalSearch = last.isGlobalSearch ?? 0;
          searchFilter = Array.isArray(last.searchFilter)
            ? last.searchFilter
            : [];
        } catch (err) {
          console.error("Failed to parse last inspection query payload:", err);
        }
      }

      lastQueryRef.current = null;

      await fetchInspectionData(
        pageSize,
        pageNumber0,
        columnName,
        sortOrder,
        searchKeyword,
        isGlobalSearch,
        searchFilter,
        { force: true }
      );
    } catch (err) {
      console.error("Error deleting inspection master:", err);

      const fallbackMsg =
        err?.response?.data?.message ||
        err?.response?.data?.DELETE_INSPECTION_MASTER_DETAILS?.[0]?.Message ||
        "Failed to delete Inspection Master";

      if (showToast) showToast(fallbackMsg, ERROR_STATUS.toLowerCase());
    } finally {
      setSelectedRow(null);
    }
  }, [
    selectedRow,
    showToast,
    tableProps.pageSize,
    tableProps.currentPage,
    fetchInspectionData,
  ]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setSelectedRow(null);
  }, []);

  // Row actions
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
          handleView(row);
        },
      });

      if (canDeleteInspection) {
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
    [handleView, canDeleteInspection, handleDelete]
  );

  // Handle add success
  const handleAddSuccess = useCallback((newInspection) => {
    if (newInspection) {
      // Track new item for highlighting after refresh
      // Use itemCode (which is the numeric ID) as the primary identifier
      const itemIdNum = newInspection.item_id || newInspection.fg_rm_item_id || newInspection.inspection_id ||
        (newInspection.itemCode ? Number(newInspection.itemCode) : null);
      // Prioritize item_code (string code from API) over itemCode (numeric ID)
      const itemCodeStr = newInspection.item_code || newInspection.itemCode || "";

      savedItemRef.current = {
        inspection_id: itemIdNum,
        item_id: itemIdNum,
        fg_rm_item_id: itemIdNum,
        item_code: itemCodeStr,
        isNew: true,
      };


      const transformedRecord = {
        inspection_id: itemIdNum,
        item_id: itemIdNum,
        fg_rm_item_id: itemIdNum,
        item_type: newInspection.itemType || newInspection.item_type || "",
        item_code: itemCodeStr,
        item_description: newInspection.item_description || "",
      };

      // Add to top of current page data
      setInspectionData((prevData) => {
        // Remove any existing items with same ID to avoid duplicates
        const filtered = prevData.filter(
          (item) => {
            const itemId = item.inspection_id || item.fg_rm_item_id || item.item_id;
            return itemId !== itemIdNum;
          }
        );
        // Add new item at the top
        return [transformedRecord, ...filtered];
      });

      // Update total records count (increment by 1)
      if (tableProps.setTotalRecords) {
        const currentTotal = tableProps.totalRecords || 0;
        tableProps.setTotalRecords(currentTotal + 1);
      }
    }

    setShowAddForm(false);
    resetAddFormDirty();
  }, [setInspectionData, tableProps, resetAddFormDirty]);

  // Confirm close add
  const confirmCloseAdd = () => {
    setShowAddForm(false);
    resetAddFormDirty();
  };

  // Confirm close edit
  const confirmCloseEdit = (forceClose = false) => {
    if (forceClose) {
      setShowEditForm(false);
      setEditInspection(null);
      editInspectionRef.current = null;
      setEditMode(false);
      resetEditFormDirty();
      return;
    }

    setShowEditForm(false);
    setEditInspection(null);
    editInspectionRef.current = null;
    setEditMode(false);
    resetEditFormDirty();
  };

  // Refresh handler
  const handleRefresh = useCallback(() => {
    const performRefresh = () => {
      try {
        // Clear DynamicSortableTable internal UI state (search input, sort arrows, column filters)
        if (tableRef.current && typeof tableRef.current.refresh === "function") {
          tableRef.current.refresh();
        }

        // Clear all search and filter states in parent
        setActiveSearchFilters([]);
        setCurrentSortConfig({ key: "", direction: "" });
        activeColumnFiltersRef.current = {};
        setActiveColumnSearch({ key: "", value: "" });
        setActiveColumnFilters({});

        if (typeof tableProps.setSortConfig === "function") {
          tableProps.setSortConfig({ key: "", direction: "" });
        }

        if (typeof tableProps.setSearchTerm === "function")
          tableProps.setSearchTerm("");

        if (typeof tableProps.onPageSizeChange === "function")
          tableProps.onPageSizeChange(25);
        if (typeof tableProps.onPageChange === "function")
          tableProps.onPageChange(1);

        // Clear last query ref to force fresh API call
        lastQueryRef.current = null;
        // Ensure args match fetchInspectionData signature
        fetchInspectionData(25, 0, "", "", "", 0, [], { force: true });
      } catch (e) {
        console.error("Error refreshing Inspection list:", e);
      }
    };

    if (showEditForm && !checkEditUnsavedChanges(performRefresh, {})) return;
    // if (showAddForm && !checkAddUnsavedChanges(performRefresh, {})) return;

    performRefresh();
  }, [tableProps, fetchInspectionData, showEditForm, checkEditUnsavedChanges]);

  // Highlight saved row (both new and edited) after data refresh
  useEffect(() => {
    if (savedItemRef.current && inspectionData.length > 0) {
      const savedIdentifier = savedItemRef.current;
      const savedIndex = inspectionData.findIndex((item) => {
        // Try to match by ID (handle both number and string comparisons)
        const savedInspectionId = savedIdentifier.inspection_id || savedIdentifier.fg_rm_item_id || savedIdentifier.item_id;
        const itemId = item.inspection_id || item.fg_rm_item_id || item.item_id;

        // Normalize both to numbers for comparison
        const savedIdNum = savedInspectionId != null ? Number(savedInspectionId) : null;
        const itemIdNum = itemId != null ? Number(itemId) : null;

        const matchById = savedIdNum != null && itemIdNum != null && savedIdNum === itemIdNum;

        // Try to match by item_code (case-insensitive) as fallback
        const savedItemCode = savedIdentifier.item_code ? String(savedIdentifier.item_code).trim().toUpperCase() : null;
        const itemCode = item.item_code ? String(item.item_code).trim().toUpperCase() : null;
        const matchByCode = savedItemCode && itemCode && savedItemCode === itemCode && savedItemCode !== "";

        return matchById || matchByCode;
      });

      if (savedIndex >= 0) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          try {
            // Use the table ref's selectRowByIndex method if available
            if (tableRef.current && typeof tableRef.current.selectRowByIndex === 'function') {
              tableRef.current.selectRowByIndex(savedIndex);
            } else {
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
        }, 300);
      } else {

        setTimeout(() => {
          if (savedItemRef.current) {
            savedItemRef.current = null;
          }
        }, 1000);
      }
    }
  }, [inspectionData]);

  // Update save button disabled state when form state changes
  useEffect(() => {
    if (!showAddForm) {
      setIsSaveDisabled(false);
      return;
    }

    const checkState = () => {
      const isEditing = addFormRef.current?.isCharacteristicEditing?.() || false;
      setIsSaveDisabled(isEditing);
    };

    // Check immediately
    checkState();

    // Check periodically while drawer is open
    const interval = setInterval(checkState, 100);

    return () => clearInterval(interval);
  }, [showAddForm]);

  const handleOnSaveAdd = useCallback(() => {
    if (!canCreateInspection) {
      showToast("You don't have permission to create Inspection Master entries", ERROR_STATUS.toLowerCase());
      return;
    }
    if (addFormRef.current?.isCharacteristicEditing?.()) {
      return;
    }
    if (addFormRef.current) {
      addFormRef.current.submit();
    }
  }, [canCreateInspection, showToast]);

  const handleOnSaveDraftAdd = useCallback(() => {
    try {
      addFormRef.current?.saveDraft?.();
    } catch {
      /* no-op */
    }
  }, []);

  const handleOnDiscardDraftAdd = useCallback(() => {
    try {
      addFormRef.current?.clearDraft?.();
    } catch {
      /* no-op */
    }
    resetAddFormDirty();
  }, [resetAddFormDirty]);

  // Add Inspection Drawer
  const addInspectionDrawer = (
    <RightDrawer
      tabKey="inspectionmaster"
      open={showAddForm}
      onClose={confirmCloseAdd}
      title="Add Inspection"
      onSave={handleOnSaveAdd}
      saveButtonDisabled={isSaveDisabled || !canCreateInspection}
      onSuccess={handleAddSuccess}
      initialData={null}
      enableCloseConfirm
      closeConfirmScope="create"
      isCreate={true}
      isDirty={isAddFormDirty}
      closeConfirmTitle="Unsaved Changes"
      closeConfirmMessage="You have unsaved changes. Save draft or close without saving?"
      onSaveDraft={handleOnSaveDraftAdd}
      onDiscardDraft={handleOnDiscardDraftAdd}
    >
      <SaveOrUpdateInspection
        ref={addFormRef}
        open={showAddForm}
        onClose={confirmCloseAdd}
        onSuccess={handleAddSuccess}
        onDirtyChange={setIsAddFormDirty}
        initialData={null}
        initialEditMode={true}
        canDelete={canDeleteInspection}
      />
    </RightDrawer>
  );

  const handleOnSaveEdit = useCallback(() => {
    if (!canEditInspection) {
      showToast("You don't have permission to edit Inspection Master", ERROR_STATUS.toLowerCase());
      return;
    }
    editFormRef.current && editFormRef.current.submit();
  }, [canEditInspection, showToast]);

  const handleOnEdit = useCallback(() => {
    if (!canEditInspection) {
      showToast("You don't have permission to edit Inspection Master", ERROR_STATUS.toLowerCase());
      return;
    }
    setEditMode(true);
  }, [canEditInspection, showToast]);

  const handleOnDisableEdit = useCallback(() => setEditMode(false), []);

  const handleOnSaveDraftEdit = useCallback(() => {
    try {
      editFormRef.current?.saveDraft?.();
    } catch {
      /* no-op */
    }
  }, []);

  const handleOnDiscardDraftEdit = useCallback(() => {
    try {
      resetEditFormDirty();
    } catch {
      /* no-op */
    }
  }, [resetEditFormDirty]);

  // Edit Inspection Drawer
  const editInspectionDrawer = (
    <RightDrawer
      tabKey="inspectionmaster"
      open={showEditForm}
      onClose={confirmCloseEdit}
      title={editInspection ? `Edit Inspection` : "Add Inspection"}
      onSave={editMode ? handleOnSaveEdit : undefined}
      showEdit={!!editInspection && !editMode && canEditInspection}
      onEdit={handleOnEdit}
      disableEdit={editMode}
      onDisableEdit={handleOnDisableEdit}
      isDirty={isEditFormDirty}
      isCreate={!editInspection}
      enableCloseConfirm
      closeConfirmScope="edit"
      disableTabCloseConfirm={!!editInspection && !editMode && !isEditFormDirty}
      onSaveDraft={handleOnSaveDraftEdit}
      onDiscardDraft={handleOnDiscardDraftEdit}
    >
      <SaveOrUpdateInspection
        key={showEditForm ? "inspection-master-drawer-stable" : ((editInspection || editInspectionRef.current)?.inspection_id || "new")}
        ref={editFormRef}
        onClose={() => confirmCloseEdit(true)}
        open={showEditForm}
        initialData={editInspection || editInspectionRef.current}
        editMode={editMode}
        canDelete={canDeleteInspection}
        onSuccess={(savedItem) => {
          // Determine if this is a new item or edited item
          const isNewItem = !editInspection;

          // Get item ID from savedItem or editInspection
          const itemIdNum = savedItem?.item_id || savedItem?.fg_rm_item_id || savedItem?.inspection_id ||
            (savedItem?.itemCode ? Number(savedItem.itemCode) : null) ||
            (editInspection?.item_id || editInspection?.fg_rm_item_id || editInspection?.inspection_id ||
              (editInspection?.itemCode ? Number(editInspection.itemCode) : null));
          const itemCodeStr = savedItem?.item_code || savedItem?.itemCode ||
            editInspection?.item_code || editInspection?.itemCode || "";

          // Store saved item identifier for highlighting after refresh
          if (itemIdNum) {
            savedItemRef.current = {
              inspection_id: itemIdNum,
              item_id: itemIdNum,
              fg_rm_item_id: itemIdNum,
              item_code: itemCodeStr,
              isNew: isNewItem,
            };
          }

          if (isNewItem && savedItem && itemIdNum) {
            // For new items, add to top of current page
            const transformedRecord = {
              inspection_id: itemIdNum,
              item_id: itemIdNum,
              fg_rm_item_id: itemIdNum,
              item_type: savedItem.itemType || savedItem.item_type || "",
              item_code: itemCodeStr,
              item_description: savedItem.item_description || "",
            };

            // Add to top of current page data
            setInspectionData((prevData) => {
              // Remove any existing items with same ID to avoid duplicates
              const filtered = prevData.filter(
                (item) => {
                  const itemId = item.inspection_id || item.fg_rm_item_id || item.item_id;
                  return itemId !== itemIdNum;
                }
              );
              // Add new item at the top
              return [transformedRecord, ...filtered];
            });

            // Update total records count (increment by 1)
            if (tableProps.setTotalRecords) {
              const currentTotal = tableProps.totalRecords || 0;
              tableProps.setTotalRecords(currentTotal + 1);
            }
          } else {
            // For edited items, refresh current page to get updated data preserving search/filters/sorting
            let pageSize = tableProps.pageSize || 25;
            let pageNumber0 = (tableProps.currentPage || 1) - 1;
            let columnName = "";
            let sortOrder = "";
            let searchKeyword = "";
            let isGlobalSearch = 0;
            let searchFilter = [];

            if (lastQueryRef.current) {
              try {
                const last = JSON.parse(lastQueryRef.current);
                pageSize = last.pageSize ?? pageSize;
                pageNumber0 = last.pageNumber ?? pageNumber0;
                columnName = last.columnName ?? "";
                sortOrder = last.sortOrder ?? "";
                searchKeyword = last.searchKeyword ?? "";
                isGlobalSearch = last.isGlobalSearch ?? 0;
                searchFilter = Array.isArray(last.searchFilter) ? last.searchFilter : [];
              } catch (err) {
                console.error("Failed to parse last inspection query payload:", err);
              }
            }

            lastQueryRef.current = null;

            fetchInspectionData(
              pageSize,
              pageNumber0,
              columnName,
              sortOrder,
              searchKeyword,
              isGlobalSearch,
              searchFilter,
              { force: true }
            );
          }

          setShowEditForm(false);
          setEditInspection(null);
          editInspectionRef.current = null;
          setEditMode(false);
          resetEditFormDirty();
        }}
        onDirtyChange={setIsEditFormDirty}
      />
    </RightDrawer>
  );

  return (
    <div style={{ position: "relative" }}>
      {(loading || loadingDetails) && <Loader />}

      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          {addInspectionDrawer}
          {editInspectionDrawer}

          <DynamicSortableTable
            fixedFirstColumn={true}
            ref={tableRef}
            columns={inspectionColumns}
            data={inspectionData}
            onQueryChange={handleQueryChange}
            onAdd={
              canCreateInspection
                ? () => {
                  if (showEditForm && !checkEditUnsavedChanges(() => setShowAddForm(true), {})) {
                    return;
                  }
                  setShowAddForm(true);
                }
                : undefined
            }
            canAdd={canCreateInspection}
            onRefresh={handleRefresh}
            title="Inspection Master"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .69.41 1.31 1.01 1.58.28.13.59.2.9.2h.09a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
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
        title="Delete Inspection Master"
        message={selectedRow ? ` ${selectedRow.item_code || ""}` : ""}
      />

      <ConfirmDialog {...addFormDirtyConfirmDialog} />
      <ConfirmDialog {...editFormDirtyConfirmDialog} />
    </div>
  );
}
