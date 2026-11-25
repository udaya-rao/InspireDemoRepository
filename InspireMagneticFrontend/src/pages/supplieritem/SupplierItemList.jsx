import React, { useState, useEffect, useRef, useCallback } from "react";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import Loader from "../../components/Loader";
import { useToast } from "../../components/useToast";
import {
  hasPermission,
  menuPermissions,
} from "../../permissions/permissionUtils";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { formatDate } from "../../utils/dateUtils.js";
import { SUCCESS_STATUS, ERROR_STATUS } from "../../utils/ConstVariables";
import RightDrawer from "../../components/RightDrawer";
import { ConfirmDialog } from "../../components/Notification";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import StatusBadge from "../../components/StatusBadge";
import {
  fetchSupplierItemList,
  approveSupplierItem,
} from "../../services/supplierItemService.js";
import { getPreparedBy } from "../../utils/userSession.js";
import SaveOrUpdateSupplierItem from "./SaveOrUpdateSupplierItem.jsx";

const SHORT_CUT = "";
const DOC_STATUS_APPROVED = 30;

// ─── Column definitions ───────────────────────────────────────────────────────
const supplierItemColumns = [
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
    style: { textAlign: "center" },
    width: "20%",
    minWidth: "160px",
  },
  {
    key: "supplier_name",
    label: "Supplier Name",
    style: { textAlign: "center" },
    width: "22%",
    minWidth: "180px",
  },
  {
    key: "supplier_item_code",
    label: "Supplier Item Code",
    style: { textAlign: "center" },
    width: "20%",
    minWidth: "170px",
  },
  {
    key: "approved_date_formatted",
    label: "Approval Date",
    style: { textAlign: "center" },
    searchable: false,
    width: "14%",
    minWidth: "130px",
  },
  {
    key: "doc_status_text",
    label: "Status",
    style: { textAlign: "center" },
    searchable: false,
    width: "12%",
    minWidth: "130px",
    render: (row) => (
      <StatusBadge
        statusId={row.doc_status}
        statusText={row.doc_status_text || "—"}
      />
    ),
  },
];

// ─── Transform helper ─────────────────────────────────────────────────────────
const transformRecord = (item) => {
  const safeFormat = (v) => {
    if (!v) return "";
    try {
      return formatDate(v) || v;
    } catch (err) {
      console.error("formatDate failed:", v, err);
      return v;
    }
  };
  return {
    ...item,
    approved_date_formatted: safeFormat(item?.approved_date),
  };
};

const getBackendColumnName = (key) => {
  const map = { approved_date_formatted: "approved_date" };
  return map[key] || key;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SupplierItemList() {
  const { showToast } = useToast();

  // Client-side permission flags (UI only — backend must enforce the same).
  const canView = hasPermission(menuPermissions.SUPPLIER_ITEM);
  const canCreate = hasPermission(menuPermissions.SUPPLIER_ITEM_CREATE);
  const canEdit = hasPermission(menuPermissions.SUPPLIER_ITEM_EDIT);
  const canApprove = hasPermission(menuPermissions.SUPPLIER_ITEM_APPROVE);

  const [loading, setLoading] = useState(false);
  const tableRef = useRef(null);
  const savedItemRef = useRef(null);
  const approvingRef = useRef(false);

  const {
    rows: supplierItemData,
    setRows: setSupplierItemData,
    tableProps,
  } = usePaginatedTable([], 25, true);

  // ── Add drawer ───────────────────────────────────────────────────────────
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const addFormRef = useRef();
  const {
    isDirty: isAddDirty,
    setIsDirty: setIsAddDirty,
    resetDirty: resetAddDirty,
    dirtyConfirmDialog: addDirtyDialog,
  } = useUnsavedChanges({});

  // ── View / Edit drawer ───────────────────────────────────────────────────
  const [viewRow, setViewRow] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const viewFormRef = useRef();
  const {
    isDirty: isEditDirty,
    setIsDirty: setIsEditDirty,
    checkUnsavedChanges: checkEditUnsavedChanges,
    resetDirty: resetEditDirty,
    dirtyConfirmDialog: editDirtyDialog,
  } = useUnsavedChanges({});

  // ── Fetch & pagination state ─────────────────────────────────────────────
  const [activeSearchFilters, setActiveSearchFilters] = useState([]);
  const [currentSortConfig, setCurrentSortConfig] = useState({
    key: "",
    direction: "",
  });
  const [isGlobalSearch, setIsGlobalSearch] = useState(0);
  const lastQueryRef = useRef(null);
  const requestSeqRef = useRef(0);
  const fetchedRef = useRef(false);

  const [approveConfirm, setApproveConfirm] = useState({
    open: false,
    row: null,
  });

  const isApproved = (row) => row && row.doc_status === DOC_STATUS_APPROVED;

  // ── Fetch list ─────────────────────────────────────────────────────────
  const fetchSupplierItems = useCallback(
    async (
      pageSize = 25,
      pageNumber = 0,
      columnName = "",
      sortOrder = "",
      searchKeyword = "",
      isGlobalSearchVal = 0,
      searchFilter = [],
      options = { force: false },
    ) => {
      if (!canView) return;

      const mappedColumnName = getBackendColumnName(columnName || "");

      let finalSearchFilter = (
        Array.isArray(searchFilter) ? searchFilter : []
      ).map((f) => ({
        ...f,
        columnName: getBackendColumnName(f.columnName || ""),
      }));
      if (finalSearchFilter.length === 0 && mappedColumnName && searchKeyword) {
        finalSearchFilter = [
          {
            columnName: mappedColumnName,
            searchKeyword,
            sortOrder: sortOrder || "",
            columnSequence: 1,
          },
        ];
      }

      const payload = {
        pageSize,
        pageNumber,
        columnName: mappedColumnName,
        searchFilter: finalSearchFilter,
        isGlobalSearch: isGlobalSearchVal ? 1 : 0,
        sortOrder: sortOrder || "",
        shortCut: SHORT_CUT,
      };

      const payloadKey = JSON.stringify(payload);
      if (!options?.force && lastQueryRef.current === payloadKey) return;
      lastQueryRef.current = payloadKey;

      const reqId = ++requestSeqRef.current;
      setLoading(true);
      try {
        const res = await fetchSupplierItemList(payload);
        const list = res?.data?.SUPPLIER_ITEM_LIST || [];
        const totalRecords =
          res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords ?? list.length;

        if (reqId !== requestSeqRef.current) return;

        // If the current page came back empty but pageNumber > 0, the records
        // on this page were removed/approved/deleted. Fetch the last valid page
        // instead of showing an empty table.
        if (pageNumber > 0 && list.length === 0) {
          const resolvedPageSize = Number(pageSize) || 25;
          const maxPageNumber =
            totalRecords > 0
              ? Math.max(0, Math.ceil(totalRecords / resolvedPageSize) - 1)
              : 0;
          if (maxPageNumber < pageNumber) {
            if (typeof tableProps.onPageChange === "function") {
              tableProps.onPageChange(maxPageNumber + 1);
            }
            fetchSupplierItems(
              pageSize,
              maxPageNumber,
              columnName,
              sortOrder,
              searchKeyword,
              isGlobalSearchVal,
              searchFilter,
              { force: true },
            );
            return;
          }
        }

        setSupplierItemData(list.map(transformRecord));
        if (tableProps.setTotalRecords)
          tableProps.setTotalRecords(totalRecords);
        if (
          typeof tableProps.onPageChange === "function" &&
          Number(pageNumber) === 0
        )
          tableProps.onPageChange(1);
      } catch (error) {
        console.error("Error fetching Supplier Item list:", error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          showToast("Failed to load Supplier Items", "error");
        }
        setSupplierItemData([]);
      } finally {
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    },
    [canView, setSupplierItemData, tableProps, showToast],
  );

  const refreshCurrentPage = useCallback(() => {
    fetchSupplierItems(
      tableProps.pageSize || 25,
      (tableProps.currentPage || 1) - 1,
      currentSortConfig.key || "",
      currentSortConfig.direction || "",
      tableProps.searchTerm || "",
      isGlobalSearch,
      activeSearchFilters,
      { force: true },
    );
  }, [
    fetchSupplierItems,
    tableProps,
    currentSortConfig,
    isGlobalSearch,
    activeSearchFilters,
  ]);

  // ── Success handlers ──────────────────────────────────────────────────────
  const handleAddSuccess = (newRecord) => {
    const header = newRecord?.data?.SUPPLIER_ITEM_DETAIL_RESPONSE?.[0];
    if (header) {
      savedItemRef.current = {
        supplier_item_id: header.supplier_item_id,
        isNew: true,
      };
      setSupplierItemData((prev) => {
        const filtered = prev.filter(
          (i) => i.supplier_item_id !== header.supplier_item_id,
        );
        return [transformRecord(header), ...filtered];
      });
      if (typeof tableProps.setTotalRecords === "function")
        tableProps.setTotalRecords((tableProps.totalRecords || 0) + 1);
    } else {
      refreshCurrentPage();
    }
    setShowAddDrawer(false);
    resetAddDirty();
  };

  const handleEditSave = () => {
    if (viewRow)
      savedItemRef.current = { supplier_item_id: viewRow.supplier_item_id };
    refreshCurrentPage();
    setViewRow(null);
    setEditMode(false);
    resetEditDirty();
  };

  const confirmCloseAdd = () => {
    setShowAddDrawer(false);
    resetAddDirty();
  };
  const confirmCloseEdit = async () => {
    if (isEditDirty) {
      const confirmed = await checkEditUnsavedChanges();
      if (confirmed) {
        setViewRow(null);
        setEditMode(false);
        resetEditDirty();
      }
    } else {
      setViewRow(null);
      setEditMode(false);
    }
  };

  // ── Approve (permission + state re-checked here, not just in the UI) ──────
  const doApprove = useCallback(
    async (row) => {
      if (!row) return;

      if (!canApprove) {
        showToast(
          "You do not have permission to approve Supplier Items.",
          ERROR_STATUS.toLowerCase(),
        );
        return;
      }
      if (!row.supplier_item_id) {
        showToast("Invalid Supplier Item.", ERROR_STATUS.toLowerCase());
        return;
      }
      if (isApproved(row)) {
        showToast(
          "This Supplier Item is already approved.",
          ERROR_STATUS.toLowerCase(),
        );
        return;
      }
      const approvedBy = getPreparedBy();
      if (!approvedBy) {
        window.dispatchEvent(new Event("sessionExpired"));
        return;
      }
      if (approvingRef.current) return; // block double submit
      approvingRef.current = true;

      const label = `${row.supplier_name || "Supplier"} / ${row.item_code || row.supplier_item_id}`;
      try {
        setLoading(true);
        const response = await approveSupplierItem({
          supplierItemID: row.supplier_item_id,
          approvedBy,
        });
        if (response?.Status === SUCCESS_STATUS) {
          const successMsg =
            response.data?.APPROVE_SUPPLIER_ITEM_DETAILS_RESPONSE?.[0]?.Message ||
            `Supplier Item ${label} approved`;
          showToast(successMsg, "success");
          savedItemRef.current = { supplier_item_id: row.supplier_item_id };
          refreshCurrentPage();
        } else {
          const errorMsg =
            response?.data?.APPROVE_SUPPLIER_ITEM_DETAILS_RESPONSE?.[0]?.Message ||
            response?.message ||
            "Approve failed.";
          showToast(errorMsg, ERROR_STATUS.toLowerCase());
        }
      } catch (error) {
        console.error("Error approving supplier item:", error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          showToast(`Failed to approve Supplier Item ${label}`, "error");
        }
      } finally {
        approvingRef.current = false;
        setLoading(false);
      }
    },
    [canApprove, showToast, refreshCurrentPage],
  );

  // ── Row actions ───────────────────────────────────────────────────────────
  const getActions = useCallback(
    (row) => {
      const approved = isApproved(row);
      const actions = [
        {
          label: "View",
          title: "View Supplier Item Details",
          icon: (
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
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ),
          onClick: async () => {
            const proceed = async (nextRow) => {
              setViewRow(nextRow);
              setEditMode(false);
              resetEditDirty();
            };
            if (viewRow && isEditDirty) {
              const ok = checkEditUnsavedChanges(
                async (nr) => await proceed(nr),
                row,
              );
              if (!ok) return;
            }
            await proceed(row);
          },
        },
      ];

      if (!approved && canApprove) {
        actions.push({
          label: "Approve",
          title: "Approve this Supplier Item",
          icon: (
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          ),
          onClick: () => setApproveConfirm({ open: true, row }),
        });
      }

      return actions;
    },
    [isEditDirty, viewRow, checkEditUnsavedChanges, resetEditDirty, canApprove],
  );

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canView) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchSupplierItems(25, 0, "", "", "", 0, [], { force: true });
  }, [canView, fetchSupplierItems]);

  // ── Highlight saved row ───────────────────────────────────────────────────
  useEffect(() => {
    if (!savedItemRef.current || supplierItemData.length === 0) return;
    const saved = savedItemRef.current;
    const idx = supplierItemData.findIndex(
      (i) => String(i.supplier_item_id) === String(saved.supplier_item_id),
    );
    if (idx >= 0) {
      setTimeout(() => {
        try {
          tableRef.current?.selectRowByIndex?.(idx);
        } catch {
          /* no-op */
        }
        savedItemRef.current = null;
      }, 200);
    } else {
      savedItemRef.current = null;
    }
  }, [supplierItemData]);

  // ── Query change handler ──────────────────────────────────────────────────
  const handleQueryChange = useCallback(
    (q) => {
      try {
        const pageSizeNum = Number(q?.pageSize) || 25;
        const pageNumber0 = Math.max(0, Number(q?.pageNumber) || 0);
        const columnName = String(q?.columnName || "");
        const isGSVal = Number(q?.isGlobalSearch) === 1 ? 1 : 0;
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
          tableProps.setSearchTerm(isGSVal === 1 ? searchKeyword : "");
        if (typeof tableProps.setSortConfig === "function" && columnName)
          tableProps.setSortConfig({
            key: columnName,
            direction: sortOrder || "asc",
          });
        if (columnName && sortOrder)
          setCurrentSortConfig({ key: columnName, direction: sortOrder });

        let finalFilter = searchFilter,
          finalColumn = columnName;
        if (isGSVal === 1) {
          finalFilter = searchKeyword?.trim()
            ? [
                {
                  columnName: columnName || "supplier_name",
                  searchKeyword,
                  sortOrder: "",
                  columnSequence: 1,
                },
              ]
            : [];
          finalColumn = columnName || "supplier_name";
          setActiveSearchFilters(finalFilter);
        } else if (searchFilter.length > 0) {
          setActiveSearchFilters(searchFilter);
        } else if (columnName && searchKeyword.length > 0) {
          finalFilter = [{ columnName, searchKeyword }];
          setActiveSearchFilters(finalFilter);
        } else {
          finalFilter = [];
          setActiveSearchFilters([]);
        }

        setIsGlobalSearch(isGSVal);
        fetchSupplierItems(
          pageSizeNum,
          pageNumber0,
          finalColumn,
          sortOrder,
          searchKeyword,
          isGSVal,
          finalFilter,
        );
      } catch (e) {
        console.error("Failed to handle query payload", e);
      }
    },
    [fetchSupplierItems, tableProps],
  );

  const handleRefresh = useCallback(() => {
    setActiveSearchFilters([]);
    setCurrentSortConfig({ key: "", direction: "" });
    if (tableRef.current?.refresh) tableRef.current.refresh();
    if (typeof tableProps.setSortConfig === "function")
      tableProps.setSortConfig({ key: "", direction: "" });
    if (typeof tableProps.setSearchTerm === "function")
      tableProps.setSearchTerm("");
    if (typeof tableProps.onPageSizeChange === "function")
      tableProps.onPageSizeChange(25);
    if (typeof tableProps.onPageChange === "function")
      tableProps.onPageChange(1);
    lastQueryRef.current = null;
    fetchSupplierItems(25, 0, "", "", "", 0, [], { force: true });
  }, [tableProps, fetchSupplierItems]);

  // ── Access guard (after all hooks) ────────────────────────────────────────
  if (!canView) {
    return (
      <div style={{ padding: 24 }}>
        You do not have permission to view Supplier Items.
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      {loading && <Loader />}
      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          <DynamicSortableTable
            fixedFirstColumn
            ref={tableRef}
            columns={supplierItemColumns}
            data={supplierItemData}
            onQueryChange={handleQueryChange}
            onAdd={
              canCreate
                ? async () => {
                    if (isEditDirty && viewRow) {
                      const ok = await checkEditUnsavedChanges();
                      if (!ok) return;
                    }
                    setShowAddDrawer(true);
                    resetAddDirty();
                  }
                : undefined
            }
            onRefresh={handleRefresh}
            title="Supplier Item"
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
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            }
            showGlobalSearch
            getActions={getActions}
            disableSearch={false}
            autoSelectFirstRow
            currentPage={tableProps.currentPage}
            pageSize={tableProps.pageSize}
            totalRecords={tableProps.totalRecords}
          />

          {/* ── Add Drawer ── */}
          <RightDrawer
            open={showAddDrawer && canCreate}
            onClose={confirmCloseAdd}
            title="Add Supplier Item"
            tabKey="supplieritem"
            onSave={() =>
              canCreate ? addFormRef.current?.submit?.() : undefined
            }
            enableCloseConfirm
            closeConfirmScope="create"
            isCreate
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
            <SaveOrUpdateSupplierItem
              ref={addFormRef}
              open={showAddDrawer && canCreate}
              onClose={confirmCloseAdd}
              onSuccess={handleAddSuccess}
              onDirtyChange={(dirty) => setIsAddDirty(dirty)}
            />
          </RightDrawer>

          {/* ── View / Edit Drawer ── */}
          <RightDrawer
            open={!!viewRow}
            onClose={confirmCloseEdit}
            title="View Supplier Item"
            tabKey="supplieritem"
            showEdit={!!viewRow && !editMode && canEdit}
            onEdit={() => {
              if (canEdit) setEditMode(true);
            }}
            onSave={
              editMode && canEdit
                ? () => viewFormRef.current?.submit?.()
                : undefined
            }
            disableEdit={editMode}
            onDisableEdit={() => setEditMode(false)}
            isDirty={isEditDirty}
            enableCloseConfirm
            closeConfirmScope="edit"
            closeConfirmTitle="Unsaved Changes"
            closeConfirmMessage="You have unsaved changes. Are you sure you want to close?"
            disableTabCloseConfirm={!!viewRow && !editMode && !isEditDirty}
            onDiscardDraft={() => {
              try {
                resetEditDirty();
              } catch {
                /* no-op */
              }
            }}
          >
            {viewRow && (
              <SaveOrUpdateSupplierItem
                key={viewRow ? viewRow.supplier_item_id || "row" : "empty"}
                ref={viewFormRef}
                open={!!viewRow}
                initialData={viewRow}
                editMode={editMode && canEdit}
                onSuccess={handleEditSave}
                onDirtyChange={(dirty) => setIsEditDirty(dirty)}
              />
            )}
          </RightDrawer>

          <ConfirmDialog
            {...addDirtyDialog}
            confirmLabel="Yes"
            cancelLabel="No"
            title="Unsaved Changes"
          />
          <ConfirmDialog
            {...editDirtyDialog}
            confirmLabel="Yes"
            cancelLabel="No"
            title="Unsaved Changes"
          />

          <ConfirmDialog
            open={approveConfirm.open}
            title="Approve Supplier Item"
            message={`Are you sure you want to approve the item ${approveConfirm.row?.item_code || ""} for ${approveConfirm.row?.supplier_name || "this supplier"}?`}
            confirmLabel="Approve"
            cancelLabel="Cancel"
            onConfirm={() => {
              doApprove(approveConfirm.row);
              setApproveConfirm({ open: false, row: null });
            }}
            onCancel={() => setApproveConfirm({ open: false, row: null })}
          />
        </div>
      </main>
    </div>
  );
}