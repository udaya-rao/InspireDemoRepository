import '../../lib/axiosSetup';
import React, { useEffect, useState, useRef } from 'react';
import DynamicSortableTable from '../../components/DynamicSortableTable';
import Loader from '../../components/Loader';
import RightDrawer from '../../components/RightDrawer';
// import FairReport from '../designMenu/fairReport/FairReport.jsx';
import SaveOrUpdateInventoryMaster from './SaveOrUpdateInventoryMaster';
import { hasPermission, menuPermissions } from '../../permissions/permissionUtils';
// import ECRList from '../ECR/ECRList.jsx';
import { ConfirmDialog } from "../../components/Notification";
// import { useNavigate } from 'react-router-dom';
import usePaginatedTable from '../../hooks/usePaginatedTable';
// import InitiatedForScrapList from '../initiatedforscrap/InitiatedForScrapList';
import { useToast } from '../../components/useToast';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges.jsx';
import {
  fetchInventoryMasterList,
  fetchInventoryDetails,
  deleteInventoryItem,
} from '../../services/inventoryMasterService';
import { SUCCESS_STATUS, ERROR_STATUS } from "../../utils/ConstVariables";

const inventoryColumns = [
  { key: 'actions', label: 'Actions', sortable: false, width: '100px', minWidth: '100px' },
  { key: 'item_code', label: 'Code', searchable: false, ignoreSpecial: true, width: '10%', minWidth: '170px' },
  { key: 'item_description', label: 'Description', searchable: false, ignoreSpecial: true, width: '20%', minWidth: '250px', maxWidth: '250px' },
  {
    key: 'valid_text', label: 'Status', width: '12%', minWidth: '160px', render: row => {
      const statusText = row.valid_text || (row.valid === 1 ? 'Valid' : row.valid === 0 ? 'Invalid' : 'Unknown');
      const isValid = row.item_status === 1 || row.valid === 1;
      return (
        <span className="inventory-status-pill" style={{
          color: isValid ? '#22c55e' : '#ef4444',
          background: isValid ? '#dcfce7' : '#fee2e2'
        }}>
          {statusText}
        </span>
      );
    }, searchable: false
  },
  { key: 'location', label: 'Location', searchable: false, width: '10%', minWidth: '250px', maxWidth: '250px' },
  { key: 'item_unit', label: 'Unit', searchable: false, width: '10%', minWidth: '100px' },
  { key: 'hsn_code', label: 'HSN Code', searchable: false, width: '10%', minWidth: '100px', render: row => row.hsn_code || row.hsncode || '-' },
  {
    key: 'shelf_life_days', label: 'Shelf Life (Days)', searchable: false, width: '12%', minWidth: '130px', render: row => {
      const value = row.shelf_life_days || row.shelfLife;
      return (value === 0 || value === "0" || !value) ? "" : value;
    }
  },


  {
    key: 'lasttran_date',
    label: 'Last Transaction Date',
    searchable: false,
    width: '12%',
    minWidth: '150px',
    render: (row) => {
      if (!row.lasttran_date) return '';

      try {
        const date = new Date(row.lasttran_date);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      } catch {
        return row.lasttran_date;
      }
    },
  },

  { key: 'item_id', label: 'ID', searchable: false, width: '10%', minWidth: '100px', render: row => row.item_id || row.itemID || '-' },

];

function mapApiToFormFields(api) {
  return {
    itemCode: api.item_code || "",
    itemDescription: api.item_description || "",
    priUnit: api.item_unit || api.pri_unit || "",
    alternateUnit: api.alt_unit || "",
    conversionFactor: api.conv_factor || 0,
    openStock: api.open_stock || 0,
    itemROL: api.reorder_level || api.item_rol || 0,
    itemMinimumQuantity: api.min_stock_level || api.item_minq || 0,
    itemMaximumQuantity: api.max_stock_level || api.item_maxq || 0,
    location: api.location || "",
    subContract: api.subcontract || 0,
    dwg_status: api.dwg_status || "",
    valid: api.item_status ?? api.valid ?? 1,
    alternatePurchaseItemCode: api.alt_pitem_code || "",
    itemQualityPlan: api.item_qplan || "",
    unitRate: api.unit_rate || 0,
    lastTransactionDate: api.lasttran_date ? api.lasttran_date.split('T')[0] : "",
    itemType: api.item_type || "",
    quantityAccepted: api.qty_acc || 0,
    quantityIssued: api.qty_iss || 0,
    quantityReserved: api.qty_res || 0,
    reservationInformation: api.res_info || "",
    itemClass: api.item_class || 0,
    inspectionType: api.ins_type || "",
    itemStockTransfer: api.item_stock_transfer || "",
    entryDate: api.prep_date ? api.prep_date.split('T')[0] : "",
    remarks: api.item_remarks || api.remarks || "",
    preparedBy: api.prep_by || "",
    updatedBy: api.updated_by || "",
    itemUnderROL: api.item_under_rol || 0,
    openOrderIssue: api.open_order_issue || "",
    drawingMapItemCode: api.dwg_map_item_code || "",
    shelfLife: (api.shelf_life_days === 0 || api.shelf_life_days === "0" || api.shelf_life === 0 || api.shelf_life === "0" || (!api.shelf_life_days && !api.shelf_life)) ? "" : (api.shelf_life_days || api.shelf_life || ""),
    rohsEnable: api.rohs_enable || "",
    itemStatusChangedBy: api.item_status_changed_by || "",
    changeRequired: api.change_required || "",
    changeApprovedBy: api.change_app_by || "",
    changeApprovedDate: api.change_app_date ? api.change_app_date.split('T')[0] : "",
    qaAlertMessage: api.qa_alert_message || "",
    hsnid: api.hsn_id || 0,
    followFIFO: api.follow_fifo === 'Y',
    platingPart: api.plating_part === 'Y',
    platingSurfaceArea: api.plating_surface_area || 0,
    platingSurfaceAreaUnit: api.plating_surface_area_unit || "",
    platingThickness: api.plating_thickness || 0,
    platingThicknessUnit: api.plating_thickness_unit || "",
    platingThicknessForCosting: api.plating_thickness_for_costing || 0,
    platingUpdatedBy: api.plating_updated_by || "",
    platingUpdatedDate: api.plating_updated_date ? api.plating_updated_date.split('T')[0] : "",
    platingSNo: api.plating_s_no || 0,
    automotiveItem: api.automotive_item || "",
    // Additional fields from new API
    itemID: api.item_id || 0,
    validText: api.valid_text || "",
    hsnNameText: api.hsn_name_text || "",
    ccHsnCode: api.cc_hsn_code || "",
    ccLocalData: api.cc_local_data || 0,
    ccGstPerc: api.cc_gst_perc || 0,
    ccGroup: api.cc_group || "",
    updatedDate: api.updated_date ? api.updated_date.split('T')[0] : "",
    paramType: 'Update'
  };
}

export default function InventoryMasterList() {
  // const navigate = useNavigate();
  const { rows: inventoryData, setRows: setInventoryData, tableProps } = usePaginatedTable([], 25, true); // Enable server-side mode
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [, setEditMode] = useState(false);
  const viewItemRef = useRef(null);
  const editItemRef = useRef(null);

  // Separate Add drawer state (independent from View/Edit drawer)
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  const [inventoryToDelete, setInventoryToDelete] = React.useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Separate state for Initiated for Scrap drawer
  const [scrapDrawerOpen, setScrapDrawerOpen] = useState(false);
  const tableRef = useRef();
  const { showToast } = useToast();

  // Separate dirty state for add and edit forms
  const {
    // isDirty: isAddFormDirty,
    setIsDirty: setIsAddFormDirty,
    resetDirty: resetAddFormDirty,
    checkUnsavedChanges: checkAddUnsavedChanges,
    dirtyConfirmDialog: addFormDirtyConfirmDialog,
  } = useUnsavedChanges({});

  const {
    // isDirty: isEditFormDirty,
    setIsDirty: setIsEditFormDirty,
    resetDirty: resetEditFormDirty,
    checkUnsavedChanges: checkEditUnsavedChanges,
    dirtyConfirmDialog: editFormDirtyConfirmDialog,
  } = useUnsavedChanges({});

  // Track current sort configuration to preserve across filter changes
  const [, setCurrentSortConfig] = useState({
    key: "",
    direction: "",
  });
  const activeColumnFiltersRef = useRef({});
  // Track active search filters for UI state / refresh handling 
  const [, setActiveSearchFilters] = useState([]);
  const lastAppliedQueryRef = useRef({
    pageSize: 25,
    pageNumber0: 0,
    columnName: "",
    sortOrder: "",
    searchKeyword: "",
    isGlobalSearch: 0,
    searchFilter: [],
  });
  const savedItemRef = useRef(null);

  const fetchInventory = async (
    pageSize = 25,
    pageNumber = 0,
    columnName = "",
    sortOrder = "",
    searchKeyword = "",
    isGlobalSearch = 0,
    searchFilter = []
  ) => {
    lastAppliedQueryRef.current = {
      pageSize,
      pageNumber0: pageNumber,
      columnName,
      sortOrder,
      searchKeyword,
      isGlobalSearch,
      searchFilter: Array.isArray(searchFilter) ? searchFilter : [],
    };

    setLoading(true);
    try {
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
        payload.searchFilter = [];
      }

      const res = await fetchInventoryMasterList(payload);
      const list = res?.data?.INVENTORY_MASTER_LIST || [];
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
            searchFilter
          );
          return;
        }
      }

      let transformedData = list.map(transformRecord);

      transformedData = transformedData.filter((item) => !item._isTemporary);

      // For edited items, keep the ref to highlight the row after data is set
      // For new items, they are already added manually to the top, so we just need to highlight
      if (savedItemRef.current && !savedItemRef.current.isNew) {
        // For edited items, keep the ref to highlight the row after data is set
        // Don't clear it yet - will be cleared after highlighting
      }

      setInventoryData(transformedData);

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
      if (error.response && error.response.status === 401) {
        window.dispatchEvent(new Event('sessionExpired'));
      } else {
        console.error("Error fetching inventory list:", error);
        setInventoryData([]);
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (viewItem) {
      viewItemRef.current = viewItem;
    }
  }, [viewItem]);

  useEffect(() => {
    if (editItem) {
      editItemRef.current = editItem;
    }
  }, [editItem]);

  useEffect(() => {
    fetchInventory(25, 0, "", "", "", 0, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight saved row (both new and edited) after data refresh
  useEffect(() => {
    if (savedItemRef.current && inventoryData.length > 0) {
      const savedIdentifier = savedItemRef.current;
      const savedIndex = inventoryData.findIndex((item) => {
        // Try to match by item_id first, then by item_code
        return (
          (savedIdentifier.item_id && (item.item_id === savedIdentifier.item_id || item.itemID === savedIdentifier.item_id)) ||
          (savedIdentifier.itemID && (item.item_id === savedIdentifier.itemID || item.itemID === savedIdentifier.itemID)) ||
          (savedIdentifier.item_code && item.item_code === savedIdentifier.item_code)
        );
      });

      if (savedIndex >= 0) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          try {
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

  // Unified handler for generic query payloads emitted by DynamicSortableTable
  const handleQueryChange = (q) => {
    try {
      const pageSizeNum = Number(q?.pageSize) || 25;
      const pageNumber0 = Math.max(0, Number(q?.pageNumber) || 0);
      const columnName = String(q?.columnName || "");
      const isGlobalSearch = Number(q?.isGlobalSearch) === 1 ? 1 : 0;
      const sortOrder = String(q?.sortOrder || "");
      const searchKeyword = String(q?.searchKeyword || "");
      const searchFilter = Array.isArray(q?.searchFilter) ? q.searchFilter : [];

      // Keep UI pagination/search states in sync
      if (typeof tableProps.onPageSizeChange === "function")
        tableProps.onPageSizeChange(pageSizeNum);
      if (typeof tableProps.onPageChange === "function")
        tableProps.onPageChange(pageNumber0 + 1);
      if (typeof tableProps.setSearchTerm === "function")
        tableProps.setSearchTerm(isGlobalSearch === 1 ? searchKeyword : "");
      if (typeof tableProps.setSortConfig === "function" && columnName) {
        // Preserve direction if provided
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

      // Handle Global vs Column Search
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
        finalColumnName = columnName || "";
        setActiveSearchFilters(finalSearchFilter);
      } else if (searchFilter.length > 0) {
        // Multiple column filters via searchFilter array
        setActiveSearchFilters(searchFilter);
      } else if (columnName && (searchKeyword || "").length > 0) {
        // Single column search (legacy)
        setActiveSearchFilters([{ columnName, searchKeyword }]);
      } else {
        // Reset
        setActiveSearchFilters([]);
      }

      // Call fetchInventory with the processed parameters
      fetchInventory(
        pageSizeNum,
        pageNumber0,
        finalColumnName,
        sortOrder,
        finalSearchKeyword,
        finalIsGlobalSearch,
        finalSearchFilter
      );
    } catch (error) {
      console.error("Error in handleQueryChange:", error);
    }
  };

  const handleAdd = () => {
    // Check if user has permission to create
    if (!hasPermission(menuPermissions.INVENTORY_MASTER_CREATE)) {
      alert("You don't have permission to create Inventory Master entries");
      return;
    }

    // Check if edit form is dirty before switching to add
    if (drawerOpen && !checkEditUnsavedChanges(() => setShowAddDrawer(true), {})) {
      return;
    }

    // Open Add drawer independently (don't affect View/Edit drawer)
    setShowAddDrawer(true);
  };

  const handleViewInternal = async (row) => {
    // Validate row data before proceeding
    if (!row || (!row.item_id && !row.itemID)) {
      console.error("Invalid row data in handleViewInternal:", row);
      setTimeout(() => {
        // showToast("Invalid inventory item data", "error");
      }, 0);
      return;
    }

    const isDrawerAlreadyOpen = drawerOpen;
    // Always reset edit-related state when viewing a new item
    setEditItem(null);
    editItemRef.current = null;
    setEditMode(false);

    // Only reset viewItem if drawer is not already open (to avoid flicker)
    if (!isDrawerAlreadyOpen) {
      setViewItem(null);
      viewItemRef.current = null; // Sync ref with state
    }

    try {
      // Use item_id from row, or try to get it from item_id field
      const itemID = row.item_id || row.itemID;
      if (!itemID) {
        console.error("Item ID not found in row data");
        setViewItem(row);
        viewItemRef.current = row; // Sync ref with state
        if (!isDrawerAlreadyOpen) {
          setDrawerOpen(true);
        }
        return;
      }

      const res = await fetchInventoryDetails(itemID);
      const details = res?.data?.INVENTORY_DETAILS_RESPONSE?.[0];
      if (details) {
        const mapped = mapApiToFormFields(details);
        setViewItem(mapped);
        viewItemRef.current = mapped; // Sync ref with state
      } else {
        setViewItem(row);
        viewItemRef.current = row; // Sync ref with state
      }

      if (!isDrawerAlreadyOpen) {
        setDrawerOpen(true);
      }

    } catch (error) {
      if (error.response && error.response.status === 401) {
        window.dispatchEvent(new Event('sessionExpired'));
      } else {
        console.error("Error fetching inventory details:", error);
        setViewItem(row);
        viewItemRef.current = row; // Sync ref with state
        // Only open drawer if it wasn't already open
        if (!isDrawerAlreadyOpen) {
          setDrawerOpen(true);
        }
      }
    }
  };

  const handleView = async (row) => {
    if (!hasPermission(menuPermissions.INVENTORY_MASTER)) {
      alert("You don't have permission to view Inventory Master entries");
      return;
    }

    if (!row || (!row.item_id && !row.itemID)) {
      console.error("Invalid row data in handleView:", row);
      return; // Don't proceed if row is invalid
    }

    // Check if edit form is dirty before switching
    if (drawerOpen && !checkEditUnsavedChanges(handleViewInternal, row)) {
      return;
    }

    // Check if add form is dirty before switching
    // if (showAddDrawer && !checkAddUnsavedChanges(handleViewInternal, row)) {
    //   return;
    // }

    // Close profile dropdown if open
    window.dispatchEvent(new Event('closeProfileDropdown'));

    await handleViewInternal(row);
  };

  const handlePartToProduct = (row) => {
    // TODO: Implement Part To Product functionality
    const codeRaw = String(row.item_code || '').trim();
    showToast(`Part To Product functionality for ${codeRaw} will be available soon.`, "info");
    // You can add navigation or drawer opening logic here
    // Example:
    // const code = encodeURIComponent(codeRaw);
    // const key = `Part To Product:${codeRaw}`;
    // const title = `Part To Product - ${codeRaw}`;
    // const path = `/part-to-product?itemCode=${code}`;
    // window.dispatchEvent(new CustomEvent('openVirtualTab', {
    //   detail: { key, title, path }
    // }));
  };

  // const handleEditIcon = () => {
  //   // Check if user has permission to edit
  //   if (!hasPermission(menuPermissions.INVENTORY_MASTER_EDIT)) {
  //     alert("You don't have permission to edit Inventory Master entries");
  //     return;
  //   }
  //   setEditMode(true);
  // };
  // const handleCancelEdit = () => setEditMode(false);
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditItem(null);
    editItemRef.current = null; // Sync ref with state
    setViewItem(null);
    viewItemRef.current = null; // Sync ref with state
    setEditMode(false);
    resetEditFormDirty();
  };

  const handleAddDrawerClose = () => {
    setShowAddDrawer(false);
    resetAddFormDirty();
  };
  // Removed unused handleDrawerSave

  // Initiated for Scrap Drawer
  const scrapDrawer = (
    <RightDrawer
      open={scrapDrawerOpen}
      onClose={() => { setScrapDrawerOpen(false); }}
      title="View Initiated For Approval Details"
    >
      <div style={{ padding: '20px' }}>
        <p>Initiated For Scrap functionality will be available soon.</p>
      </div>
    </RightDrawer>
  );

  const getActions = (row) => {
    const actions = [];

    // View action - always available if user has basic access
    if (hasPermission(menuPermissions.INVENTORY_MASTER)) {
      actions.push({
        label: 'View',
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
    }

    // Part To Product action
    if (hasPermission(menuPermissions.INVENTORY_MASTER)) {
      actions.push({
        label: 'Part To Product',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
            <circle cx="7" cy="7" r="1" />
            <circle cx="17" cy="17" r="1" />
          </svg>
        ),
        onClick: () => handlePartToProduct(row),
      });
    }



    // Delete action - only if user has edit permission (assuming delete requires edit permission)
    if (hasPermission(menuPermissions.ALLOW_TO_DELETE_ITEMS_IN_INVENTORY_MASTER)) {
      actions.push({
        label: 'Delete',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
            <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
          </svg>
        ),
        onClick: () => handleDeleteClick(row),
      });
    }

    return actions;
  };

  const handleDeleteClick = (row) => {
    const performDelete = (r) => {
      setInventoryToDelete(r);
      setShowDeleteConfirm(true);
    };

    if (drawerOpen && !checkEditUnsavedChanges(performDelete, row)) return;
    // if (showAddDrawer && !checkAddUnsavedChanges(performDelete, row)) return;

    performDelete(row);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (inventoryToDelete) {
      try {
        const res = await deleteInventoryItem(
          inventoryToDelete.item_id || inventoryToDelete.itemID
        );

        const deleteRes =
          res?.data?.DELETE_INVENTORY_RESPONSE?.[0] || {};

        if (res?.Status === SUCCESS_STATUS) {
          showToast(
            deleteRes.Message || "Inventory Master deleted successfully!",
            SUCCESS_STATUS
          );
          const q = lastAppliedQueryRef.current || {};
          await fetchInventory(
            q.pageSize || 25,
            q.pageNumber0 || 0,
            q.columnName || "",
            q.sortOrder || "",
            q.searchKeyword || "",
            q.isGlobalSearch || 0,
            q.searchFilter || []
          ); // refresh inventory list
        } else {
          showToast(
            deleteRes.Message || "Failed to delete Inventory Master",
            ERROR_STATUS.toLowerCase()
          );
        }
      } catch {
        showToast("Error deleting Inventory Master", ERROR_STATUS.toLowerCase());
      }
      setInventoryToDelete(null);
    }
  };


  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setInventoryToDelete(null);
  };

  // Transform API record to table row
  const transformRecord = (item) => {
    const itemStatus = item.item_status ?? item.valid ?? 1;
    const validText = item.valid_text ||
      (itemStatus === 1 ? 'Valid' : itemStatus === 0 ? 'Invalid' : 'Unknown');

    let hsnCode = "";

    if (item?.hsn_code !== undefined && item?.hsn_code !== null && String(item.hsn_code).trim() !== "") {
      hsnCode = String(item.hsn_code).trim();
    } else if (item?.cc_hsn_code !== undefined && item?.cc_hsn_code !== null && String(item.cc_hsn_code).trim() !== "") {
      hsnCode = String(item.cc_hsn_code).trim();
    } else if (item?.hsn_name_text !== undefined && item?.hsn_name_text !== null && String(item.hsn_name_text).trim() !== "") {
      hsnCode = String(item.hsn_name_text).trim();
    } else if (item?.hsn_id !== undefined && item?.hsn_id !== null) {
      hsnCode = String(item.hsn_id);
    }

    return {
      ...item,
      // Map new API fields to expected field names
      valid: itemStatus,
      item_status: itemStatus,
      valid_text: validText, // Ensure valid_text is always set
      pri_unit: item.item_unit || item.pri_unit || '',
      // Keep original fields for backward compatibility
      item_code: item.item_code || '',
      item_description: item.item_description || '',
      location: item.location || '',
      // Preserve item_id for fetching details
      item_id: item.item_id || item.itemID || null,
      itemID: item.item_id || item.itemID || null,
      // Preserve new columns data
      lasttran_date: item.lasttran_date || null,
      shelf_life_days: item.shelf_life_days || item.shelfLife || null,
      hsn_id: item.hsn_id || item.hsnid || null,
      hsn_code: hsnCode || item.hsn_code || item.hsncode || null,
      hsncode: hsnCode || item.hsn_code || item.hsncode || null,
    };
  };


  // Add drawer (independent)
  const addInventoryDrawer = (
    <SaveOrUpdateInventoryMaster
      key="inventory-add"
      open={showAddDrawer}
      onClose={handleAddDrawerClose}
      onDirtyChange={setIsAddFormDirty}
      onSuccess={(savedItem) => {
        // Determine if this is a new item
        const isNewItem = true;

        // Store saved item identifier for highlighting after refresh
        if (savedItem) {
          savedItemRef.current = {
            item_id: savedItem.item_id || savedItem.itemID || savedItem.ID,
            itemID: savedItem.item_id || savedItem.itemID || savedItem.ID,
            item_code: savedItem.item_code || savedItem.itemCode,
            isNew: isNewItem,
          };
        }
        handleAddDrawerClose();

        // Add to top of current page data
        const itemStatus = savedItem.item_status ?? savedItem.valid ?? 1;
        const validText = savedItem.valid_text || savedItem.validText ||
          (itemStatus === 1 ? 'Valid' : itemStatus === 0 ? 'Invalid' : 'Unknown');

        const transformedItem = transformRecord({
          item_id: savedItem.item_id || savedItem.itemID || savedItem.ID,
          itemID: savedItem.item_id || savedItem.itemID || savedItem.ID,
          item_code: savedItem.item_code || savedItem.itemCode || '',
          item_description: savedItem.item_description || savedItem.itemDescription || '',
          item_unit: savedItem.item_unit || savedItem.priUnit || savedItem.itemUnit || '',
          pri_unit: savedItem.item_unit || savedItem.priUnit || savedItem.itemUnit || '',
          location: savedItem.location || '',
          valid: itemStatus,
          item_status: itemStatus,
          valid_text: validText,
          hsn_code: savedItem.hsn_code || savedItem.cc_hsn_code || savedItem.ccHsnCode || '',
          cc_hsn_code: savedItem.cc_hsn_code || savedItem.ccHsnCode || '',
          hsn_id: savedItem.hsn_id || savedItem.hsnid || null,
          shelf_life_days: savedItem.shelf_life_days || savedItem.shelfLife || null,
          shelfLife: savedItem.shelf_life_days || savedItem.shelfLife || null,
          lasttran_date: savedItem.lasttran_date || savedItem.lastTransactionDate || null,
        });

        // Add to top of current page data
        setInventoryData((prevData) => {
          // Remove any existing items with same ID to avoid duplicates
          const filtered = prevData.filter(
            (item) =>
              (item.item_id !== transformedItem.item_id && item.itemID !== transformedItem.item_id) &&
              (item.item_id !== transformedItem.itemID && item.itemID !== transformedItem.itemID)
          );
          // Add new item at top
          return [transformedItem, ...filtered];
        });

        // Update total records count (increment by 1)
        if (tableProps.setTotalRecords) {
          tableProps.setTotalRecords((prev) => Math.max(0, (prev || 0) + 1));
        }

        // showToast("Inventory Master added successfully!", "success");
      }}
      initialData={null}
      disabled={!hasPermission(menuPermissions.INVENTORY_MASTER_CREATE)}
    />
  );

  // View/Edit drawer
  const viewEditDrawer = (
    <SaveOrUpdateInventoryMaster
      key={drawerOpen ? "inventory-master-drawer-stable" :
        ((viewItem || viewItemRef.current || editItem || editItemRef.current)?.itemCode ||
          (viewItem || viewItemRef.current || editItem || editItemRef.current)?.itemID ||
          (viewItem || viewItemRef.current || editItem || editItemRef.current)?.item_id ||
          "new")} // Use stable key when drawer is open to preserve collapsed state
      open={drawerOpen}
      onClose={handleDrawerClose}
      onDirtyChange={setIsEditFormDirty}
      onSuccess={(savedItem) => {
        // Determine if this is a new item or edited item
        const isNewItem = !viewItem && !editItem;

        // Store saved item identifier for highlighting after refresh
        if (savedItem) {
          savedItemRef.current = {
            item_id: savedItem.item_id || savedItem.itemID || savedItem.ID,
            itemID: savedItem.item_id || savedItem.itemID || savedItem.ID,
            item_code: savedItem.item_code || savedItem.itemCode,
            isNew: isNewItem, // Mark as new or edited
          };
        } else if (viewItem || editItem) {
          // Fallback to viewItem/editItem if savedItem is not available
          const item = viewItem || editItem;
          savedItemRef.current = {
            item_id: item.itemID || item.item_id,
            itemID: item.itemID || item.item_id,
            item_code: item.itemCode || item.item_code,
            isNew: false, // This is an edit since viewItem/editItem exists
          };
        }

        handleDrawerClose();

        // For new items, stay on current page and add to top
        // For edited items, keep current page and refresh
        // const pageSize = tableProps.pageSize || 25;
        // const pageNumber0 = (tableProps.currentPage || 1) - 1;

        if (isNewItem && savedItem) {
          // Transform new item and add it to top of current page
          const itemStatus = savedItem.item_status ?? savedItem.valid ?? 1;
          const validText = savedItem.valid_text || savedItem.validText ||
            (itemStatus === 1 ? 'Valid' : itemStatus === 0 ? 'Invalid' : 'Unknown');

          const transformedItem = transformRecord({
            item_id: savedItem.item_id || savedItem.itemID || savedItem.ID,
            itemID: savedItem.item_id || savedItem.itemID || savedItem.ID,
            item_code: savedItem.item_code || savedItem.itemCode || '',
            item_description: savedItem.item_description || savedItem.itemDescription || '',
            item_unit: savedItem.item_unit || savedItem.priUnit || savedItem.itemUnit || '',
            pri_unit: savedItem.item_unit || savedItem.priUnit || savedItem.itemUnit || '',
            location: savedItem.location || '',
            valid: itemStatus,
            item_status: itemStatus,
            valid_text: validText,
            hsn_code: savedItem.hsn_code || savedItem.cc_hsn_code || savedItem.ccHsnCode || '',
            cc_hsn_code: savedItem.cc_hsn_code || savedItem.ccHsnCode || '',
            hsn_id: savedItem.hsn_id || savedItem.hsnid || null,
            shelf_life_days: savedItem.shelf_life_days || savedItem.shelfLife || null,
            shelfLife: savedItem.shelf_life_days || savedItem.shelfLife || null,
            lasttran_date: savedItem.lasttran_date || savedItem.lastTransactionDate || null,
          });

          // Add to top of current page data
          setInventoryData((prevData) => {
            // Remove any existing items with same ID to avoid duplicates
            const filtered = prevData.filter(
              (item) =>
                (item.item_id !== transformedItem.item_id && item.itemID !== transformedItem.item_id) &&
                (item.item_id !== transformedItem.itemID && item.itemID !== transformedItem.itemID)
            );
            // Add new item at top
            return [transformedItem, ...filtered];
          });

          // Update total records count (increment by 1)
          if (tableProps.setTotalRecords) {
            tableProps.setTotalRecords((prev) => Math.max(0, (prev || 0) + 1));
          }
        } else {
          // For edited items, refresh the current page with existing filters
          const q = lastAppliedQueryRef.current || {};
          fetchInventory(
            q.pageSize || tableProps.pageSize || 25,
            q.pageNumber0 != null ? q.pageNumber0 : (tableProps.currentPage || 1) - 1,
            q.columnName || "",
            q.sortOrder || "",
            q.searchKeyword || "",
            q.isGlobalSearch != null ? q.isGlobalSearch : 0,
            q.searchFilter || []
          );
        }

        // showToast("Inventory Master saved successfully!", "success");
      }}
      initialData={viewItem || editItem}
      disabled={!hasPermission(menuPermissions.INVENTORY_MASTER_EDIT)}
    />
  );

  return (
    <>
      <div style={{ position: 'relative' }}>
        {loading && <Loader />}
        <main className="p-1" style={{ flexGrow: 1, overflow: 'auto' }}>
          <div>
            {addInventoryDrawer}
            {viewEditDrawer}
            {scrapDrawer}
            <DynamicSortableTable
              fixedFirstColumn={true}
              ref={tableRef}
              columns={inventoryColumns}
              data={inventoryData}
              onQueryChange={handleQueryChange}
              onAdd={hasPermission(menuPermissions.INVENTORY_MASTER_CREATE) ? handleAdd : undefined}
              onRefresh={() => {
                const performRefresh = () => {
                  try {
                    if (tableRef.current && typeof tableRef.current.refresh === "function") {
                      tableRef.current.refresh();
                    }
                  } catch (error) {
                    console.error("Error refreshing table:", error);
                  }

                  // Clear all search and filter states
                  setActiveSearchFilters([]);
                  setCurrentSortConfig({ key: "", direction: "" });
                  activeColumnFiltersRef.current = {};
                  // Reset query ref
                  lastAppliedQueryRef.current = {
                    pageSize: 25,
                    pageNumber0: 0,
                    columnName: "",
                    sortOrder: "",
                    searchKeyword: "",
                    isGlobalSearch: 0,
                    searchFilter: [],
                  };

                  // Clear sort config in table props
                  if (typeof tableProps.setSortConfig === "function") {
                    tableProps.setSortConfig({ key: "", direction: "" });
                  }

                  // Clear global search term in table props
                  if (typeof tableProps.setSearchTerm === "function")
                    tableProps.setSearchTerm("");

                  // Reset pagination
                  if (typeof tableProps.onPageSizeChange === "function")
                    tableProps.onPageSizeChange(25);
                  if (typeof tableProps.onPageChange === "function")
                    tableProps.onPageChange(1);

                  // Explicit empty query to load full list
                  fetchInventory(25, 0, "", "", "", 0, []);
                };

                if (drawerOpen && !checkEditUnsavedChanges(performRefresh, {})) return;
                // if (showAddDrawer && !checkAddUnsavedChanges(performRefresh, {})) return;

                performRefresh();
              }}
              title="Inventory Master"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /></svg>}
              getActions={getActions}
              autoSelectFirstRow={true}
              // Server-side pagination, sorting, and search
              currentPage={tableProps.currentPage}
              pageSize={tableProps.pageSize}
              totalRecords={tableProps.totalRecords}
            />
            <ConfirmDialog
              open={showDeleteConfirm}
              title="Confirm Delete"
              message={
                inventoryToDelete
                  ? `Are you sure you want to delete Inventory Master ${inventoryToDelete.item_code}?`
                  : ""
              }
              onConfirm={confirmDelete}
              onCancel={cancelDelete}
            />

            <ConfirmDialog {...addFormDirtyConfirmDialog} />
            <ConfirmDialog {...editFormDirtyConfirmDialog} />
          </div>
        </main>
      </div>
      <style>{`
        .inventory-status-pill {
          border-radius: 12px;
          padding: 2px 12px;
          font-weight: 600;
          font-size: 12px;
          display: inline-block;
          border: none;
        }
      `}</style>
    </> // Added closing tag for Fragment
  );
} // Added closing bracket for function