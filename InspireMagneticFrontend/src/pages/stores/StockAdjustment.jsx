import React, { useState, useEffect, useRef, useCallback } from "react";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import Loader from "../../components/Loader";
import { useToast } from "../../components/useToast";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { formatDate } from "../../utils/dateUtils.js";
import StatusBadge from "../../components/StatusBadge";
import RightDrawer from "../../components/RightDrawer";
import SaveStockAdjustment from "./SaveStockAdjustment";
import {
  fetchStockAdjustmentRequestList,
  approveStockAdjustmentRequestDetails,
  cancelStockAdjustmentRequestDetails,
} from "../../services/storeService.js";
import { ConfirmDialog } from "../../components/Notification";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { getPreparedBy } from "../../utils/userSession";
import { hasPermission, menuPermissions } from "../../permissions/permissionUtils";
import {
  SUCCESS_STATUS,
  ERROR_STATUS,
  isAdjustmentCompleted,
  isAdjustmentApproved,
  isAdjustmentCancelled,
  isApprovedOrCancelledStatus,
} from "../../utils/ConstVariables";

// ─── Column definitions for Stock Adjustment Overview ──────────────────────
const stockAdjustmentColumns = [
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    width: "0%",
    minWidth: "100px",
    style: { textAlign: "center" },
  },
  {
    key: "adjustment_no",
    label: "Adjustment No",
    sortable: true,
    style: { textAlign: "center" },
    width: "20%",
    minWidth: "140px",
    render: (row) => row.adjustment_no || row.store_request_no || row.store_no || "",
  },
  {
    key: "adjustment_date",
    label: "Adjustment Date",
    sortable: true,
    style: { textAlign: "center" },
    width: "20%",
    minWidth: "140px",
    render: (row) => formatDate(row.adjustment_date || row.request_date) || row.adjustment_date || row.request_date || "",
  },
  {
    key: "adjustment_type",
    label: "Adjustment Type",
    sortable: true,
    style: { textAlign: "center" },
    width: "20%",
    minWidth: "140px",
    render: (row) => row.adjustment_type_text || "",
  },
  {
    key: "request_status_text",
    label: "Request Status",
    sortable: true,
    style: { textAlign: "center" },
    width: "20%",
    minWidth: "140px",
    render: (row) => (
      <StatusBadge statusId={row.request_status || row.status_id} statusText={row.request_status_text || row.status_text || ""} />
    ),
  },
  {
    key: "requested_by",
    label: "Requested By",
    sortable: true,
    style: { textAlign: "center" },
    width: "20%",
    minWidth: "140px",
    render: (row) => row.requested_by || "",
  },
];

const transformRecord = (item) => {
  const typeText =
    item.adjustment_type_text ||
    (item.adjustment_type === 1
      ? "Stock Addition"
      : item.adjustment_type === 2
        ? "Stock Deduction"
        : String(item.adjustment_type || ""));

  return {
    ...item,
    id: item.adjustment_id,
    stock_adjustment_id: item.adjustment_id,
    adjustment_no: item.adjustment_no,
    store_no: item.adjustment_no,
    store_request_no: item.adjustment_no,
    adjustment_date: item.adjustment_date,
    request_date: item.adjustment_date,
    adjustment_type: typeText,
    request_type_text: typeText,
    request_status: item.request_status,
    request_status_text: item.request_status_text,
    status_id: item.request_status,
    status_text: item.request_status_text,
    requested_by: item.requested_by,
    approved_by: item.approved_by,
    adjustment_reason: item.adjustment_reason_id,
    adjustment_reason_id: item.adjustment_reason_id,
    adjustment_reason_id_text: item.adjustment_reason_id_text,
  };
};

export default function StockAdjustment() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stockAdjustments, setStockAdjustments] = useState([]);
  const savedItemRef = useRef(null);

  // Table pagination state hook
  const {
    rows: displayData,
    setRows: setDisplayData,
    tableProps,
  } = usePaginatedTable([], 25, true);

  const [viewRow, setViewRow] = useState(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedAdjustmentType, setSelectedAdjustmentType] = useState("Addition");
  const [editMode, setEditMode] = useState(false);

  const {
    isDirty: isEditDirty,
    setIsDirty: setIsEditDirty,
    checkUnsavedChanges: checkEditUnsavedChanges,
    resetDirty: resetEditDirty,
    dirtyConfirmDialog: editDirtyDialog,
  } = useUnsavedChanges({});

  const {
    isDirty: isAddDirty,
    setIsDirty: setIsAddDirty,
    resetDirty: resetAddDirty,
    dirtyConfirmDialog: addDirtyDialog,
  } = useUnsavedChanges({});

  // Action Confirmation Dialog state (for Approve, Cancel)
  const [actionConfirmDialog, setActionConfirmDialog] = useState({
    open: false,
    title: "",
    message: null,
    onConfirm: null,
  });

  const viewFormRef = useRef(null);
  const addFormRef = useRef(null);

  const [isGlobalSearch, setIsGlobalSearch] = useState(0);
  const [activeSearchFilters, setActiveSearchFilters] = useState([]);
  const [currentSortConfig, setCurrentSortConfig] = useState({ key: "", direction: "" });
  const [, setShortcut] = useState("PendingOnly");
  const shortcutRef = useRef("PendingOnly");

  const tableRef = useRef(null);
  const lastQueryRef = useRef(null);
  const requestSeqRef = useRef(0);
  const fetchedRef = useRef(false);

  // Highlight saved row after data refresh
  useEffect(() => {
    if (!savedItemRef.current || stockAdjustments.length === 0) return;

    const saved = savedItemRef.current;
    const idx = stockAdjustments.findIndex((item) => {
      const savedId = saved.adjustment_id || saved.id || saved.stock_adjustment_id;
      const itemId = item.adjustment_id || item.id || item.stock_adjustment_id;
      if (savedId && itemId) {
        return (
          savedId === itemId ||
          String(savedId) === String(itemId) ||
          Number(savedId) === Number(itemId)
        );
      }
      const savedNo = saved.adjustment_no || saved.store_no || saved.store_request_no;
      const itemNo = item.adjustment_no || item.store_no || item.store_request_no;
      if (savedNo && itemNo) {
        return String(savedNo).trim().toLowerCase() === String(itemNo).trim().toLowerCase();
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
  }, [stockAdjustments]);

  // API fetch handler
  const fetchStockAdjustments = useCallback(
    async (
      pageSize = 25,
      pageNumber = 0,
      columnName = "",
      sortOrder = "",
      searchKeyword = "",
      isGlobalSearchVal = 0,
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
        searchFilter: resolvedFilter,
        isGlobalSearch: isGlobalSearchVal,
        sortOrder: sortOrder || "",
        shortCut: activeShortcut === "PendingOnly" ? "PendingOnly" : "DisplayAll",
      };

      const payloadKey = JSON.stringify(payload);
      if (!options?.force && lastQueryRef.current === payloadKey) return;
      lastQueryRef.current = payloadKey;

      const reqId = ++requestSeqRef.current;
      setLoading(true);

      try {
        const res = await fetchStockAdjustmentRequestList(payload);
        const list = res?.data?.STOCK_ADJUSTMENT_REQUEST_LIST || [];
        const totalRecords = res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords ?? list.length;

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
            fetchStockAdjustments(
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

        setStockAdjustments(data);
        setDisplayData(data);
        if (tableProps.setTotalRecords) tableProps.setTotalRecords(totalRecords);
        if (typeof tableProps.onPageChange === "function" && Number(pageNumber) === 0) {
          tableProps.onPageChange(1);
        }
      } catch (error) {
        console.error("Error fetching Stock Adjustment list:", error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          showToast("Failed to load Stock Adjustments", ERROR_STATUS.toLowerCase());
        }
        setStockAdjustments([]);
        setDisplayData([]);
      } finally {
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    },
    [setDisplayData, tableProps, showToast]
  );

  const refreshCurrentPage = useCallback(() => {
    fetchStockAdjustments(
      tableProps.pageSize || 25,
      (tableProps.currentPage || 1) - 1,
      currentSortConfig.key || "",
      currentSortConfig.direction || "",
      tableProps.searchTerm || "",
      isGlobalSearch,
      activeSearchFilters,
      { force: true }
    );
  }, [fetchStockAdjustments, tableProps, currentSortConfig, isGlobalSearch, activeSearchFilters]);

  // Handle Query Changes from DynamicSortableTable
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

        setIsGlobalSearch(isGlobalSearchVal);
        setActiveSearchFilters(searchFilter);
        setCurrentSortConfig({ key: columnName, direction: sortOrder });

        fetchStockAdjustments(
          pageSizeNum,
          pageNumber0,
          columnName,
          sortOrder,
          searchKeyword,
          isGlobalSearchVal,
          searchFilter
        );
      } catch (err) {
        console.error("Error handling query change:", err);
      }
    },
    [tableProps, fetchStockAdjustments]
  );

  const handleRefresh = useCallback(() => {
    try {
      if (tableRef.current && typeof tableRef.current.refresh === "function") {
        tableRef.current.refresh();
      }
      if (tableProps?.onPageChange) tableProps.onPageChange(1);
      if (tableProps?.onPageSizeChange) tableProps.onPageSizeChange(25);
      if (tableProps?.setSearchTerm) tableProps.setSearchTerm("");
      if (tableProps?.setSortConfig) tableProps.setSortConfig({ key: "", direction: "" });

      setIsGlobalSearch(0);
      setActiveSearchFilters([]);
      setCurrentSortConfig({ key: "", direction: "" });
      setShortcut("PendingOnly");
      shortcutRef.current = "PendingOnly";

      fetchStockAdjustments(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
    } catch (e) {
      console.error("Error refreshing Stock Adjustment list:", e);
    }
  }, [tableProps, fetchStockAdjustments]);

  const handleDisplayAll = useCallback((isDisplayAll) => {
    const next = isDisplayAll ? "DisplayAll" : "PendingOnly";
    setShortcut(next);
    shortcutRef.current = next;
    if (tableProps?.onPageChange) tableProps.onPageChange(1);
    const activePageSize = tableProps?.pageSize || 25;
    fetchStockAdjustments(
      activePageSize,
      0,
      currentSortConfig.key || "",
      currentSortConfig.direction || "",
      tableProps.searchTerm || "",
      isGlobalSearch,
      activeSearchFilters,
      { force: true },
      next
    );
  }, [fetchStockAdjustments, tableProps, currentSortConfig, isGlobalSearch, activeSearchFilters]);

  // Initial Load
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchStockAdjustments(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
  }, [fetchStockAdjustments]);

  // Action column triggers
  const handleApprove = useCallback(
    async (row) => {
      const statusId = row.status_id ?? row.request_status ?? 0;
      const statusText = row.status_text || row.request_status_text || "";

      if (isAdjustmentCompleted(statusId, statusText)) {
        showToast("This adjustment is already completed.", ERROR_STATUS.toLowerCase());
        return;
      }

      if (isAdjustmentApproved(statusId, statusText)) {
        showToast("This adjustment is already approved.", ERROR_STATUS.toLowerCase());
        return;
      }

      const adjustmentID = Number(row.adjustment_id || row.id || row.stock_adjustment_id || 0);
      const approvedBy = getPreparedBy() || "";

      try {
        setLoading(true);
        const res = await approveStockAdjustmentRequestDetails({
          adjustmentID,
          approvedBy,
        });

        const response = res?.data || res;
        const responseArr = response?.APPROVE_STOCK_ADJUSTMENT_RESPONSE;
        const firstRecord = Array.isArray(responseArr) ? responseArr[0] : null;
        const message =
          firstRecord?.Message ||
          res?.message ||
          `Stock Adjustment ${row.adjustment_no || row.store_no || ""} approved successfully!`;

        if (adjustmentID) {
          savedItemRef.current = {
            adjustment_id: adjustmentID,
          };
        }
        showToast(message, SUCCESS_STATUS);
        refreshCurrentPage();
      } catch (err) {
        console.error("Approve error:", err);
        showToast(
          err?.response?.data?.message || err?.message || "Failed to approve Stock Adjustment",
          ERROR_STATUS.toLowerCase()
        );
      } finally {
        setLoading(false);
      }
    },
    [showToast, refreshCurrentPage]
  );

  const handleCancel = useCallback(
    async (row) => {
      const statusId = row.status_id ?? row.request_status ?? 0;
      const statusText = row.status_text || row.request_status_text || "";

      if (isAdjustmentCompleted(statusId, statusText)) {
        showToast("This adjustment is already completed.", ERROR_STATUS.toLowerCase());
        return;
      }

      if (isAdjustmentCancelled(statusId, statusText)) {
        showToast("This adjustment is already cancelled.", ERROR_STATUS.toLowerCase());
        return;
      }

      const adjustmentID = Number(row.adjustment_id || row.id || row.stock_adjustment_id || 0);
      const cancelledBy = getPreparedBy() || "";

      try {
        setLoading(true);
        const res = await cancelStockAdjustmentRequestDetails({
          adjustmentID,
          cancelledBy,
        });

        const response = res?.data || res;
        const responseArr =
          response?.APPROVE_STOCK_ADJUSTMENT_RESPONSE ||
          response?.CANCEL_STOCK_ADJUSTMENT_RESPONSE ||
          response?.STOCK_ADJUSTMENT_RESPONSE;
        const firstRecord = Array.isArray(responseArr) ? responseArr[0] : null;
        const message =
          firstRecord?.Message ||
          res?.message ||
          `Stock Adjustment ${row.adjustment_no || row.store_no || ""} cancelled successfully!`;

        if (adjustmentID) {
          savedItemRef.current = {
            adjustment_id: adjustmentID,
          };
        }
        showToast(message, SUCCESS_STATUS);
        refreshCurrentPage();
      } catch (err) {
        console.error("Cancel error:", err);
        showToast(
          err?.response?.data?.message || err?.message || "Failed to cancel Stock Adjustment",
          ERROR_STATUS.toLowerCase()
        );
      } finally {
        setLoading(false);
      }
    },
    [showToast, refreshCurrentPage]
  );

  const handleAdd = useCallback((e) => {
    let target = e?.currentTarget;
    if (!target) {
      target = document.querySelector('button[title="Add"]');
    }
    if (target) {
      const rect = target.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
      });
    }
    setShowAddMenu(prev => !prev);
  }, []);

  const handleOpenAddDrawer = useCallback((type) => {
    const proceed = () => {
      setShowAddMenu(false);
      setSelectedAdjustmentType(type);
      setViewRow(null);
      setEditMode(false);
      resetEditDirty();
      setShowAddDrawer(true);
      resetAddDirty();
    };

    if (viewRow && isEditDirty) {
      const canProceed = checkEditUnsavedChanges(async () => {
        proceed();
      }, true);
      if (!canProceed) return;
      proceed();
      return;
    }

    proceed();
  }, [viewRow, isEditDirty, checkEditUnsavedChanges, resetEditDirty, resetAddDirty]);

  const handleViewAction = useCallback((row) => {
    const proceedToView = (nextRow) => {
      const idx = displayData.findIndex((item) => {
        if (item === nextRow) return true;
        const nextId = nextRow.adjustment_id || nextRow.id || nextRow.stock_adjustment_id;
        const itemId = item.adjustment_id || item.id || item.stock_adjustment_id;
        return itemId && nextId && String(itemId) === String(nextId);
      });

      if (idx >= 0 && tableRef.current && typeof tableRef.current.selectRowByIndex === "function") {
        tableRef.current.selectRowByIndex(idx);
      }

      setViewRow(nextRow);
      setEditMode(false);
      resetEditDirty();
    };

    if (viewRow && isEditDirty) {
      const canProceed = checkEditUnsavedChanges(async (nextRow) => {
        proceedToView(nextRow);
      }, row);
      if (!canProceed) return;
      proceedToView(row);
      return;
    }

    proceedToView(row);
  }, [displayData, viewRow, isEditDirty, checkEditUnsavedChanges, resetEditDirty]);

  const getActions = useCallback((row) => {
    const actions = [
      {
        label: "View",
        title: "View details of this adjustment",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ),
        onClick: (r) => handleViewAction(r),
      },
    ];

    const isApprovedOrCancelled = isApprovedOrCancelledStatus(row);

    if (
      !isApprovedOrCancelled &&
      hasPermission(menuPermissions.ALLOW_TO_APPROVE_CANCEL_STOCK_ADJUSTMENT)
    ) {
      actions.push(
        {
          label: "Approve",
          title: "Approve this stock adjustment",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          ),
          onClick: (r) => {
            setActionConfirmDialog({
              open: true,
              title: "Confirm Approve",
              message: (
                <>
                  Are you sure you want to approve Stock Adjustment{" "}
                  <b>{r.adjustment_no || r.store_request_no || r.store_no || ""}</b>?
                </>
              ),
              onConfirm: async () => {
                setActionConfirmDialog({ open: false, title: "", message: null, onConfirm: null });
                await handleApprove(r);
              },
            });
          },
        },
        {
          label: "Cancel",
          title: "Cancel this stock adjustment",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ),
          onClick: (r) => {
            setActionConfirmDialog({
              open: true,
              title: "Confirm Cancel",
              message: (
                <>
                  Are you sure you want to cancel Stock Adjustment{" "}
                  <b>{r.adjustment_no || r.store_request_no || r.store_no || ""}</b>?
                </>
              ),
              onConfirm: async () => {
                setActionConfirmDialog({ open: false, title: "", message: null, onConfirm: null });
                await handleCancel(r);
              },
            });
          },
        }
      );
    }

    return actions;
  }, [handleApprove, handleCancel, handleViewAction]);

  const handleEditSave = useCallback(() => {
    if (viewFormRef.current) {
      viewFormRef.current.submit();
    }
  }, []);

  const handleAddSave = useCallback(() => {
    if (addFormRef.current) {
      addFormRef.current.submit();
    }
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {loading && <Loader />}

      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <style>{`
          .saj-dropdown-menu .dropdown-item {
            width: 100%;
            background: none;
            border: none;
            font-size: 13px;
            color: #212529;
            cursor: pointer;
            display: flex;
            align-items: center;
            padding: 8px 16px;
            transition: background-color 0.15s ease-in-out;
            text-align: left;
          }
          .saj-dropdown-menu .dropdown-item:hover {
            background-color: #F3F4F5 !important;
            color: #1e2125 !important;
          }
        `}</style>

        <div>
          <DynamicSortableTable
            fixedFirstColumn={true}
            ref={tableRef}
            columns={stockAdjustmentColumns}
            data={displayData}
            onQueryChange={handleQueryChange}
            onRefresh={handleRefresh}
            onAdd={hasPermission(menuPermissions.ALLOW_TO_ADD_STOCK_ADJUSTMENT_REQUESTS) ? handleAdd : undefined}
            title="Stock Adjustment"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            }
            showGlobalSearch={true}
            getActions={getActions}
            disableSearch={false}
            disableSorting={false}
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
            tabKey="stores-stock-adjustment"
            onClose={() => {
              setShowAddDrawer(false);
              resetAddDirty();
            }}
            title="Add Stock Adjustment"
            onSave={handleAddSave}
            enableCloseConfirm={true}
            closeConfirmScope="create"
            isCreate={true}
            isDirty={isAddDirty}
            closeConfirmTitle="Unsaved Changes"
            closeConfirmMessage="You have unsaved changes. Save draft or close without saving?"
            onSaveDraft={() => {
              try {
                addFormRef.current?.saveDraft?.();
              } catch {
                /* no-op */
              }
            }}
            onDiscardDraft={() => {
              try {
                addFormRef.current?.clearDraft?.();
              } catch {
                /* no-op */
              }
              resetAddDirty();
            }}
          >
            <SaveStockAdjustment
              key={selectedAdjustmentType}
              ref={addFormRef}
              open={showAddDrawer}
              editMode={true}
              adjustmentType={selectedAdjustmentType}
              onDirtyChange={setIsAddDirty}
              onSuccess={(values) => {
                const savedId =
                  values?.adjustment_id ||
                  values?.id ||
                  values?.adjustmentID ||
                  values?.AdjustmentID;
                const savedNo =
                  values?.adjustment_no ||
                  values?.adjustmentNumber ||
                  values?.AdjustmentNumber;

                if (savedId || savedNo) {
                  savedItemRef.current = {
                    adjustment_id: savedId,
                    adjustment_no: savedNo,
                  };
                }
                setShowAddDrawer(false);
                resetAddDirty();
                try {
                  addFormRef.current?.clearDraft?.();
                } catch {
                  /* no-op */
                }
                refreshCurrentPage();
              }}
            />
          </RightDrawer>

          {/* ── View / Edit Drawer ── */}
          <RightDrawer
            open={!!viewRow}
            tabKey="stores-stock-adjustment"
            onClose={() => {
              setViewRow(null);
              setEditMode(false);
              resetEditDirty();
            }}
            title="View Stock Adjustment"
            showEdit={!!viewRow && !editMode && hasPermission(menuPermissions.ALLOW_TO_ADD_STOCK_ADJUSTMENT_REQUESTS)}
            onEdit={() => {
              const statusId = viewRow?.request_status ?? viewRow?.status_id ?? viewRow?.status ?? 0;
              const statusText = viewRow?.request_status_text || viewRow?.status_text || "";

              const formStatusText = viewFormRef.current?.getStatusText?.() || "";
              const formStatusId = viewFormRef.current?.getStatusId?.() || 0;

              const effStatusId = formStatusId || statusId;
              const effStatusText = formStatusText || statusText;

              if (
                isAdjustmentCompleted(effStatusId, effStatusText) ||
                viewFormRef.current?.isCompleted?.()
              ) {
                showToast("Cannot edit this record because status is already Completed", ERROR_STATUS.toLowerCase());
                return;
              }

              if (
                isAdjustmentApproved(effStatusId, effStatusText) ||
                viewFormRef.current?.isApproved?.()
              ) {
                showToast("Cannot edit this record because status is already Approved", ERROR_STATUS.toLowerCase());
                return;
              }

              if (
                isAdjustmentCancelled(effStatusId, effStatusText) ||
                viewFormRef.current?.isCancelled?.()
              ) {
                showToast("Cannot edit this record because status is already Cancelled", ERROR_STATUS.toLowerCase());
                return;
              }

              setEditMode(true);
            }}
            onSave={editMode && hasPermission(menuPermissions.ALLOW_TO_ADD_STOCK_ADJUSTMENT_REQUESTS) ? handleEditSave : undefined}
            disableEdit={editMode}
            onDisableEdit={() => setEditMode(false)}
            enableCloseConfirm={true}
            closeConfirmScope="edit"
            isCreate={false}
            isDirty={isEditDirty}
            closeConfirmTitle="Unsaved Changes"
            closeConfirmMessage="You have unsaved changes. Save draft or close without saving?"
            onDiscardDraft={() => {
              resetEditDirty();
            }}
          >
            {viewRow && (
              <SaveStockAdjustment
                ref={viewFormRef}
                open={!!viewRow}
                initialData={viewRow}
                editMode={editMode}
                disabled={!hasPermission(menuPermissions.ALLOW_TO_ADD_STOCK_ADJUSTMENT_REQUESTS)}
                adjustmentType={viewRow?.adjustment_type || viewRow?.request_type_text || "Stock Addition"}
                onDirtyChange={setIsEditDirty}
                onSuccess={(values) => {
                  const savedId =
                    viewRow?.adjustment_id ||
                    viewRow?.id ||
                    viewRow?.stock_adjustment_id ||
                    values?.adjustment_id ||
                    values?.id ||
                    values?.adjustmentID ||
                    values?.AdjustmentID;
                  const savedNo =
                    viewRow?.adjustment_no ||
                    viewRow?.store_no ||
                    viewRow?.store_request_no ||
                    values?.adjustment_no ||
                    values?.adjustmentNumber ||
                    values?.AdjustmentNumber;

                  if (savedId || savedNo) {
                    savedItemRef.current = {
                      adjustment_id: savedId,
                      adjustment_no: savedNo,
                    };
                  }
                  setViewRow(null);
                  setEditMode(false);
                  resetEditDirty();
                  refreshCurrentPage();
                }}
              />
            )}
          </RightDrawer>

          {/* ── Type Selection Dropdown Menu ── */}
          {showAddMenu && menuPosition && (
            <>
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999,
                }}
                onClick={() => setShowAddMenu(false)}
              />
              <div
                className="saj-dropdown-menu"
                style={{
                  position: "fixed",
                  top: `${menuPosition.top + 4}px`,
                  left: `${menuPosition.right - 160}px`,
                  backgroundColor: "#ffffff",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                  zIndex: 10001,
                  minWidth: "160px",
                  padding: "4px 0",
                }}
              >
                <button
                  className="dropdown-item d-flex align-items-center"
                  type="button"
                  onClick={() => handleOpenAddDrawer("Stock Addition")}
                >
                  <span className="me-2" style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                    >
                      <path
                        d="M16.75,15.25 v-1.25 a0.75,0.75 0 0,0 -1.5,0 v1.25 h-1.25 a0.75,0.75 0 0,0 0,1.5 h1.25 v1.25 a0.75,0.75 0 0,0 1.5,0 v-1.25 h1.25 a0.75,0.75 0 0,0 0,-1.5 h-1.25 zM20.454,19.637c-1.135,1.39-2.791,2.111-4.459,2.111-1.279,0-2.565-.423-3.631-1.293-1.144-.934-1.858-2.247-2.05-3.704h-5.314c-1.517,0-2.75-1.233-2.75-2.75V6c0-1.517,1.233-2.75,2.75-2.75h12c1.517,0,2.75,1.233,2.75,2.75v5.659c2.342,2.025,2.674,5.564.704,7.977ZM4.954,4.759l5.32,3.8c.435.311,1.019.31,1.453,0l5.32-3.8c-.016,0-.03-.009-.046-.009H5c-.016,0-.03.009-.046.009Zm10.468,5.52c.981-.101,1.947.051,2.828.428v-4.708c0-.08-.031-.149-.045-.224l-5.606,4.004c-.478.342-1.039.513-1.599.513s-1.121-.171-1.599-.513L3.795,5.776c-.014.075-.045.145-.045.224v8c0,.689.561,1.25,1.25,1.25h5.313c.137-1.049.547-2.046,1.233-2.887.972-1.189,2.348-1.93,3.876-2.084Zm3.266,2.429c-.879-.719-1.988-1.05-3.115-.937-1.129.114-2.147.661-2.865,1.541-.718.879-1.051,1.986-.937,3.115s.661,2.147,1.541,2.865c1.816,1.482,4.499,1.211,5.98-.604,1.482-1.815,1.211-4.498-.604-5.98Z"
                        fill="#374151"
                      />
                    </svg>
                  </span>
                  Stock Addition
                </button>
                <button
                  className="dropdown-item d-flex align-items-center"
                  type="button"
                  onClick={() => handleOpenAddDrawer("Stock Deduction")}
                >
                  <span className="me-2" style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                    >
                      <path
                        d="M18,15.25 h-4 a0.75,0.75 0 0,0 0,1.5 h4 a0.75,0.75 0 0,0 0,-1.5 zM20.454,19.637c-1.135,1.39-2.791,2.111-4.459,2.111-1.279,0-2.565-.423-3.631-1.293-1.144-.934-1.858-2.247-2.05-3.704h-5.314c-1.517,0-2.75-1.233-2.75-2.75V6c0-1.517,1.233-2.75,2.75-2.75h12c1.517,0,2.75,1.233,2.75,2.75v5.659c2.342,2.025,2.674,5.564.704,7.977ZM4.954,4.759l5.32,3.8c.435.311,1.019.31,1.453,0l5.32-3.8c-.016,0-.03-.009-.046-.009H5c-.016,0-.03.009-.046.009Zm10.468,5.52c.981-.101,1.947.051,2.828.428v-4.708c0-.08-.031-.149-.045-.224l-5.606,4.004c-.478.342-1.039.513-1.599.513s-1.121-.171-1.599-.513L3.795,5.776c-.014.075-.045.145-.045.224v8c0,.689.561,1.25,1.25,1.25h5.313c.137-1.049.547-2.046,1.233-2.887.972-1.189,2.348-1.93,3.876-2.084Zm3.266,2.429c-.879-.719-1.988-1.05-3.115-.937-1.129.114-2.147.661-2.865,1.541-.718.879-1.051,1.986-.937,3.115s.661,2.147,1.541,2.865c1.816,1.482,4.499,1.211,5.98-.604,1.482-1.815,1.211-4.498-.604-5.98Z"
                        fill="#374151"
                      />
                    </svg>
                  </span>
                  Stock Deduction
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <ConfirmDialog {...editDirtyDialog} />
      <ConfirmDialog {...addDirtyDialog} />

      {/* Action Confirmation Dialog for Approve & Cancel */}
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
  );
}
