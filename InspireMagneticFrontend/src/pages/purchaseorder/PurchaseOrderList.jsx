import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import Loader from "../../components/Loader";
import { useToast } from "../../components/useToast";
import {
  hasPermission,
  menuPermissions,
} from "../../permissions/permissionUtils";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { formatDate } from "../../utils/dateUtils.js";
import { fetchPurchaseOrderList, fetchPurchaseOrderHeaderPDF, shortCloseOrRecallPurchaseOrderDetails, approvePurchaseOrderHeaderDetails } from "../../services/purchaseOrderService.js";
import PDFViewerModal from "../../components/PDFViewerModal";
import { SUCCESS_STATUS, ERROR_STATUS } from "../../utils/ConstVariables";
import RightDrawer from "../../components/RightDrawer";
import { ConfirmDialog } from "../../components/Notification";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import SaveOrUpdatePurchaseOrder from "./SaveOrUpdatePurchaseOrder";
import { getPreparedBy } from "../../utils/userSession";
import StatusBadge from "../../components/StatusBadge";

// ─── Column definitions ────────────────────────────────────────────────────────
const purchaseOrderColumns = [
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    width: "0%",
    minWidth: "100px",
  },
  {
    key: "purchase_order_no",
    label: "PO No",
    style: { textAlign: "center" },
    width: "10%",
    minWidth: "120px",
    render: (row, { openPdf }) => (
      <span
        style={{
          color: "#1865b5",
          textDecoration: "none",
          cursor: "pointer",
          fontWeight: 600,
        }}
        title={`${row.purchase_order_no}`}
        onMouseOut={(e) => (e.target.style.textDecoration = "none")}
        onClick={(e) => {
          e.stopPropagation();
          openPdf(row);
        }}
      >
        {row.purchase_order_no}
      </span>
    ),
  },
  {
    key: "purchase_order_date_formatted",
    label: "PO Date",
    style: { textAlign: "center" },
    searchable: false,
    width: "15%",
    minWidth: "150px",
  },
  {
    key: "supplier_name",
    label: "Supplier Name",
    style: { textAlign: "center" },
    searchable: false,
    width: "15%",
    minWidth: "150px",
  },
  {
    key: "purchase_type_text",
    label: "Type",
    style: { textAlign: "center" },
    searchable: false,
    width: "10%",
    minWidth: "120px",
  },
  {
    key: "currency_code",
    label: "Currency",
    style: { textAlign: "center" },
    searchable: false,
    width: "8%",
    minWidth: "100px",
  },
  {
    key: "gross_purchase_amount",
    label: "Total Amount",
    style: { textAlign: "center" },
    searchable: false,
    width: "10%",
    minWidth: "120px",
    render: (row) => (row.gross_purchase_amount != null ? Math.round(Number(row.gross_purchase_amount)) : "—"),
  },
  {
    key: "doc_status_text",
    label: "Status",
    width: "15%",
    minWidth: "150px",
    style: { textAlign: "center" },
    render: (row) => (
      <StatusBadge statusId={row.doc_status} statusText={row.doc_status_text || "—"} />
    ),
    searchable: false,
  },
  {
    key: "responsible_person",
    label: "Kind Attention",
    style: { textAlign: "center" },
    searchable: false,
    width: "15%",
    minWidth: "160px",
  },
  {
    key: "prep_by",
    label: "Prepared By",
    style: { textAlign: "center" },
    searchable: false,
    width: "10%",
    minWidth: "150px",
  },
  {
    key: "approved_by",
    label: "Approved By",
    style: { textAlign: "center" },
    searchable: false,
    width: "10%",
    minWidth: "150px",
  },

  // {
  //   key: "remarks",
  //   label: "Remarks",
  //   style: { textAlign: "left" },
  //   searchable: false,
  //   width: "15%",
  //   minWidth: "180px",
  // },
];

// ─── Transform helper ─────────────────────────────────────────────────────────
const transformRecord = (item) => {
  return {
    ...item,
    purchase_order_date_formatted: formatDate(item?.purchase_order_date) || item?.purchase_order_date,
    prep_date_raw: item?.prep_date,
    po_date_raw: item?.purchase_order_date,
  };
};

const getBackendColumnName = (frontendKey) => {
  const mapping = {
    "purchase_order_date_formatted": "purchase_order_date",
  };
  return mapping[frontendKey] || frontendKey;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PurchaseOrderList() {
  const { showToast } = useToast();

  const [pdfModal, setPdfModal] = useState({
    isOpen: false,
    title: "",
    pdfUrl: "",
    hideActions: false,
  });

  const {
    rows: poData,
    setRows: setPoData,
    tableProps,
  } = usePaginatedTable([], 25, true);

  const [loading, setLoading] = useState(false);

  const tableRef = useRef(null);

  const openPdf = useCallback(
    async (row) => {
      if (tableRef.current?.closeDropdowns()) {
        return;
      }

      setLoading(true);
      try {
        const res = await fetchPurchaseOrderHeaderPDF({
          purchaseOrderID: row.purchase_order_id,
        });
        if (
          res &&
          res.Status === SUCCESS_STATUS &&
          res.data?.PURCHASE_ORDER_PDF_RESPONSE?.length > 0
        ) {
          const pdfData = res.data.PURCHASE_ORDER_PDF_RESPONSE[0];
          setPdfModal({
            isOpen: true,
            title: pdfData.PurchasePDFFileName || `PO-${row.purchase_order_id}`,
            pdfUrl: pdfData.PurchaseOrderPDFBase64,
            hideActions: (row.doc_status < 30),
          });
        } else {
          showToast(res?.message || "Failed to generate PDF", "error");
        }
      } catch (error) {
        console.error("Error fetching PDF:", error);
        showToast("An error occurred while fetching the PDF", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );
  const savedItemRef = useRef(null);

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const addFormRef = useRef();

  const [viewRow, setViewRow] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const viewFormRef = useRef();

  const {
    isDirty: isAddDirty,
    setIsDirty: setIsAddDirty,
    // checkUnsavedChanges: checkAddUnsavedChanges,
    resetDirty: resetAddDirty,
    dirtyConfirmDialog: addDirtyDialog,
  } = useUnsavedChanges({});

  const {
    isDirty: isEditDirty,
    setIsDirty: setIsEditDirty,
    checkUnsavedChanges: checkEditUnsavedChanges,
    resetDirty: resetEditDirty,
    dirtyConfirmDialog: editDirtyDialog,
  } = useUnsavedChanges({});

  // Action Confirmation Dialog state (for Approve, Short Close, Recall)
  const [actionConfirmDialog, setActionConfirmDialog] = useState({
    open: false,
    title: "",
    message: null,
    onConfirm: null,
  });

  const isApprovedStatus = (row) => row && row.doc_status === 30;

  const handleAddSuccess = (newRecord) => {
    const header = newRecord?.data?.PURCAHSE_ORDER_HEADER_RESPONSE?.[0] || newRecord?.data?.PURCHASE_ORDER_HEADER_RESPONSE?.[0] || newRecord?.PURCAHSE_ORDER_HEADER_RESPONSE?.[0] || newRecord?.data?.[0];

    if (header) {
      savedItemRef.current = {
        purchase_order_id: header.purchase_order_id || header.purchaseOrderID,
        isNew: true
      };

      const transformedRecord = transformRecord({
        ...header,
        purchase_order_id: header.purchase_order_id || header.purchaseOrderID
      });

      setPoData((prevData) => {
        const filtered = prevData.filter(item => item.purchase_order_id !== transformedRecord.purchase_order_id);
        return [transformedRecord, ...filtered];
      });

      if (typeof tableProps.setTotalRecords === "function") {
        const currentTotal = tableProps.totalRecords || 0;
        tableProps.setTotalRecords(currentTotal + 1);
      }
    } else {
      refreshCurrentPage();
    }

    setShowAddDrawer(false);
    resetAddDirty();
  };

  const handleEditSave = () => {
    if (viewRow) {
      savedItemRef.current = {
        purchase_order_id: viewRow.purchase_order_id || viewRow.purchaseOrderID
      };
    }
    refreshCurrentPage();

    setViewRow(null);
    setEditMode(false);
    resetEditDirty();
  };

  const confirmCloseAdd = async () => {
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

  const [, setActiveColumnSearch] = useState({ key: "", value: "" });
  const [, setActiveColumnFilters] = useState({});
  const activeColumnFiltersRef = useRef({});
  const [activeSearchFilters, setActiveSearchFilters] = useState([]);
  const [currentSortConfig, setCurrentSortConfig] = useState({ key: "", direction: "" });
  const [isGlobalSearch, setIsGlobalSearch] = useState(0);

  const lastQueryRef = useRef(null);
  const requestSeqRef = useRef(0);
  const fetchedRef = useRef(false);


  // ─── Display All / Pending Only toggle ────────────────────────────────
  const [, setShortCut] = useState("PendingOnly");
  const shortCutRef = useRef("PendingOnly");

  // ── Fetch (placeholder – wire to real service when ready) ──────────────────
  const fetchPurchaseOrders = useCallback(
    async (
      pageSize = 25,
      pageNumber = 0,
      columnName = "",
      sortOrder = "",
      searchKeyword = "",
      isGlobalSearch = 0,
      searchFilter = [],
      options = { force: false },
      overrideShortCut = null // optional explicit shortCut override
    ) => {
      const activeShortCut = overrideShortCut !== null ? overrideShortCut : shortCutRef.current;

      const mappedColumnName = getBackendColumnName(columnName || "");

      let resolvedFilter = [];
      if (Array.isArray(searchFilter) && searchFilter.length > 0) {
        resolvedFilter = searchFilter.map((f, idx) => ({
          columnName: getBackendColumnName(f.columnName || ""),
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
        isGlobalSearch,
        sortOrder,
        columnName: mappedColumnName,
        searchKeyword: searchKeyword || "",
        searchFilter: resolvedFilter,
        shortCut: activeShortCut,
      };

      const payloadKey = JSON.stringify(payload);
      if (!options?.force && lastQueryRef.current === payloadKey) return;
      lastQueryRef.current = payloadKey;

      const reqId = ++requestSeqRef.current;
      setLoading(true);

      try {
        const res = await fetchPurchaseOrderList(payload);
        const list = res?.data?.PURCHASE_ORDER_HEADER_LIST || [];
        const totalRecords = res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords || list.length || 0;

        // If current page returned no records but pageNumber > 0,
        // it means all records on this page were removed/completed/deleted.
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
            fetchPOList(
              pageSize,
              maxPageNumber,
              mappedColumnName,
              sortOrder,
              searchKeyword,
              isGlobalSearch,
              searchFilter,
              { force: true },
              activeShortCut
            );
            return;
          }
        }

        const data = list.map((item) =>
          transformRecord({ ...item, prep_date_raw: item?.prep_date, po_date_raw: item?.po_date })
        );

        setPoData(data);
        if (tableProps.setTotalRecords) tableProps.setTotalRecords(totalRecords);
        if (typeof tableProps.onPageChange === "function" && Number(pageNumber) === 0)
          tableProps.onPageChange(1);
      } catch (error) {
        console.error("Error fetching Purchase Order list:", error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          showToast("Failed to load Purchase Orders", "error");
        }
        setPoData([]);
      } finally {
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    },
    [setPoData, tableProps, showToast]
  );

  // ---------- Smart Refresh Helper ----------
  const refreshCurrentPage = useCallback(() => {
    fetchPurchaseOrders(
      tableProps.pageSize || 25,
      (tableProps.currentPage || 1) - 1,
      currentSortConfig.key || "",
      currentSortConfig.direction || "",
      tableProps.searchTerm || "",
      isGlobalSearch,
      activeSearchFilters,
      { force: true }
    );
  }, [fetchPurchaseOrders, tableProps, currentSortConfig, isGlobalSearch, activeSearchFilters]);

  // ─── Approve & Short Close Handlers with Confirmation ─────────────────
  const handleApprove = useCallback(async (row) => {
    if (!row) return;
    setLoading(true);
    try {
      const payload = {
        purchaseOrderID: row.purchase_order_id || row.purchaseOrderID,
        approvedBy: getPreparedBy(),
      };
      const response = await approvePurchaseOrderHeaderDetails(payload);
      if (response && response.Status === SUCCESS_STATUS) {
        const successMsg =
          response.data?.APPROVE_PURCHASE_ORDER_DETAILS_RESPONSE?.[0]?.Message ||
          "Purchase Order Details Approved Successfully !!!";
        showToast(successMsg, SUCCESS_STATUS.toLowerCase());
        savedItemRef.current = { purchase_order_id: row.purchase_order_id || row.purchaseOrderID };
        refreshCurrentPage();
      } else {
        const errorMsg =
          response?.data?.APPROVE_PURCHASE_ORDER_DETAILS_RESPONSE?.[0]?.Message ||
          response?.message ||
          "Approve failed.";
        showToast(errorMsg, ERROR_STATUS.toLowerCase());
      }
    } catch (error) {
      console.error("Error approving purchase order:", error);
      showToast("An error occurred during approve.", ERROR_STATUS.toLowerCase());
    } finally {
      setLoading(false);
    }
  }, [showToast, refreshCurrentPage]);

  const handleShortClose = useCallback(async (row, isShortClosed) => {
    if (!row) return;
    setLoading(true);
    try {
      const payload = {
        purchaseOrderID: row.purchase_order_id,
      };
      const response = await shortCloseOrRecallPurchaseOrderDetails(payload);
      if (response?.Status === SUCCESS_STATUS) {
        const defaultMsg = isShortClosed
          ? "Purchase Order Recalled Successfully!"
          : "Purchase Order Short Closed Successfully!";
        const successMsg =
          response.data?.SHORTCLOSE_OR_RECALL_PURCHASE_ORDER_DETAILS_RESPONSE?.[0]?.Message ||
          defaultMsg;
        showToast(successMsg, SUCCESS_STATUS);
        // Preserve current page and highlight this row
        savedItemRef.current = { purchase_order_id: row.purchase_order_id };
        refreshCurrentPage();
      } else {
        const errorMsg =
          response.data?.SHORTCLOSE_OR_RECALL_PURCHASE_ORDER_DETAILS_RESPONSE?.[0]?.Message ||
          response?.message ||
          (isShortClosed ? "Recall failed." : "Short Close failed.");
        showToast(errorMsg, ERROR_STATUS.toLowerCase());
      }
    } catch (error) {
      console.error("Error with purchase order action:", error);
      showToast(
        `An error occurred during ${isShortClosed ? "recall" : "short close"}.`,
        ERROR_STATUS.toLowerCase()
      );
    } finally {
      setLoading(false);
    }
  }, [showToast, refreshCurrentPage]);

  const getActions = useCallback((row) => {
    const isApproved = isApprovedStatus(row);
    const isShortClosed = row && (row.doc_status === 50 || (row.doc_status_text || "").toLowerCase().includes("short-closed"));

    const actions = [
      // View - Always visible
      {
        label: "View",
        title: "View Purchase Order Details",
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
          const proceedToView = async (nextRow) => {
            setViewRow(nextRow);
            setEditMode(false);
            resetEditDirty();
          };

          if (viewRow && isEditDirty) {
            const canProceed = checkEditUnsavedChanges(async (nextRow) => {
              await proceedToView(nextRow);
            }, row);
            if (!canProceed) return;
            await proceedToView(row);
            return;
          }

          await proceedToView(row);
        },
      },
    ];

    if (isApproved) {
      return actions;
    }

    // Short Close / Recall
    if (hasPermission(menuPermissions.ALLOW_TO_SHORT_CLOSE_PURCHASE_ORDER)) {
      actions.push({
        label: isShortClosed ? "Recall" : "Short Close",
        title: isShortClosed ? "Recall Purchase Order" : "Short Close Purchase Order",
        icon: isShortClosed ? (
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
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.14-3" />
          </svg>
        ) : (
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
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ),
        onClick: () => {
          const actionVerb = isShortClosed ? "recall" : "short close";
          const actionTitle = isShortClosed ? "Confirm Recall" : "Confirm Short Close";
          setActionConfirmDialog({
            open: true,
            title: actionTitle,
            message: (
              <>
                Are you sure you want to {actionVerb} Purchase Order{" "}
                <b>{row.purchase_order_no || ""}</b>?
              </>
            ),
            onConfirm: async () => {
              setActionConfirmDialog({ open: false, title: "", message: null, onConfirm: null });
              await handleShortClose(row, isShortClosed);
            },
          });
        },
      });
    }

    // Approve — only for non-approved AND non-short-closed rows
    if (!isShortClosed && hasPermission(menuPermissions.PURCHASE_ORDER_APPROVE)) {
      actions.push({
        label: "Approve",
        title: "Approve this Purchase Order",
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
        onClick: () => {
          setActionConfirmDialog({
            open: true,
            title: "Confirm Approve",
            message: (
              <>
                Are you sure you want to approve Purchase Order{" "}
                <b>{row.purchase_order_no || ""}</b>?
              </>
            ),
            onConfirm: async () => {
              setActionConfirmDialog({ open: false, title: "", message: null, onConfirm: null });
              await handleApprove(row);
            },
          });
        },
      });
    }

    return actions;
  }, [
    isEditDirty,
    viewRow,
    checkEditUnsavedChanges,
    resetEditDirty,
    refreshCurrentPage,
    showToast,
  ]);

  // Initial load
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchPurchaseOrders(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
  }, [fetchPurchaseOrders]);

  // ─── Display All toggle handler ───────────────────────────────────────
  const handleDisplayAll = useCallback((isDisplayAll) => {
    const next = isDisplayAll ? "DisplayAll" : "PendingOnly";
    setShortCut(next);
    shortCutRef.current = next;
    // Reset pagination and fetch with new shortCut
    if (tableProps?.onPageChange) tableProps.onPageChange(1);
    const activePageSize = tableProps?.pageSize || 25;
    fetchPurchaseOrders(activePageSize, 0, "", "", "", 0, [], { force: true }, next);
  }, [fetchPurchaseOrders, tableProps]);

  // Highlight saved row after data refresh
  useEffect(() => {
    if (!savedItemRef.current || poData.length === 0) return;

    const saved = savedItemRef.current;
    const idx = poData.findIndex((item) => {
      const matchById = saved.purchase_order_id && item.purchase_order_id && String(saved.purchase_order_id) === String(item.purchase_order_id);
      return matchById;
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
  }, [poData]);

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

        if (columnName && sortOrder) {
          setCurrentSortConfig({ key: columnName, direction: sortOrder });
        }

        let finalSearchFilter = searchFilter;
        let finalColumnName = columnName;
        let finalSearchKeyword = searchKeyword;

        if (isGlobalSearchVal === 1) {
          finalSearchFilter = searchKeyword?.trim()
            ? [{ columnName: columnName || "po_number", searchKeyword, sortOrder: "", columnSequence: 1 }]
            : [];
          finalColumnName = columnName || "po_number";
          setActiveColumnSearch({ key: "", value: "" });
          setActiveColumnFilters({});
          activeColumnFiltersRef.current = {};
          setActiveSearchFilters(finalSearchFilter);
        } else if (searchFilter.length > 0) {
          setActiveSearchFilters(searchFilter);
          const filterMap = {};
          searchFilter.forEach((f) => { if (f.columnName && f.searchKeyword) filterMap[f.columnName] = f.searchKeyword; });
          setActiveColumnFilters(filterMap);
          activeColumnFiltersRef.current = filterMap;
          setActiveColumnSearch(searchFilter.length === 1 ? { key: searchFilter[0].columnName, value: searchFilter[0].searchKeyword } : { key: "", value: "" });
        } else if (columnName && (searchKeyword || "").length > 0) {
          setActiveColumnSearch({ key: columnName, value: searchKeyword });
          setActiveColumnFilters({ [columnName]: searchKeyword });
          activeColumnFiltersRef.current = { [columnName]: searchKeyword };
          setActiveSearchFilters([{ columnName, searchKeyword }]);
          finalSearchFilter = [{ columnName, searchKeyword }];
        } else {
          setActiveColumnSearch({ key: "", value: "" });
          setActiveColumnFilters({});
          activeColumnFiltersRef.current = {};
          setActiveSearchFilters([]);
          finalSearchFilter = [];
        }

        setIsGlobalSearch(isGlobalSearchVal);

        fetchPurchaseOrders(pageSizeNum, pageNumber0, finalColumnName, sortOrder, finalSearchKeyword, isGlobalSearchVal, finalSearchFilter);
      } catch (e) {
        console.error("Failed to handle query payload", e);
      }
    },
    [fetchPurchaseOrders, tableProps]
  );


  // ── Refresh handler ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    try {
      setActiveColumnSearch({ key: "", value: "" });
      setActiveColumnFilters({});
      activeColumnFiltersRef.current = {};
      setActiveSearchFilters([]);
      setCurrentSortConfig({ key: "", direction: "" });

      if (tableRef.current && typeof tableRef.current.refresh === "function")
        tableRef.current.refresh();

      if (typeof tableProps.setSortConfig === "function") tableProps.setSortConfig({ key: "", direction: "" });
      if (typeof tableProps.setSearchTerm === "function") tableProps.setSearchTerm("");
      if (typeof tableProps.onPageSizeChange === "function") tableProps.onPageSizeChange(25);
      if (typeof tableProps.onPageChange === "function") tableProps.onPageChange(1);

      lastQueryRef.current = null;
      // Reset shortCut to default
      setShortCut("PendingOnly");
      shortCutRef.current = "PendingOnly";
      fetchPurchaseOrders(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
    } catch (e) {
      console.error("Error refreshing Purchase Order list:", e);
    }
  }, [tableProps, fetchPurchaseOrders]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      {loading && <Loader />}

      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          <DynamicSortableTable
            fixedFirstColumn={true}
            ref={tableRef}
            columns={purchaseOrderColumns}
            data={poData}
            onQueryChange={handleQueryChange}
            onAdd={
              hasPermission(menuPermissions.PURCHASE_ORDER_CREATE)
                ? async () => {
                  if (isEditDirty && viewRow) {
                    let ok = await checkEditUnsavedChanges();
                    if (!ok) return;
                  }
                  setShowAddDrawer(true);
                  resetAddDirty();
                }
                : undefined
            }
            onRefresh={handleRefresh}
            title="Purchase Order"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            }
            showGlobalSearch={true}
            getActions={getActions}
            disableSearch={false}
            autoSelectFirstRow={true}
            currentPage={tableProps.currentPage}
            pageSize={tableProps.pageSize}
            totalRecords={tableProps.totalRecords}
            renderContext={{ openPdf }}
            showDisplayAll={true}
            onDisplayAll={handleDisplayAll}
          />

          {/* ── Add Drawer ── */}
          <RightDrawer
            open={showAddDrawer}
            onClose={confirmCloseAdd}
            title="Add Purchase Order"
            tabKey="purchase-order"
            onSave={() => addFormRef.current && addFormRef.current.submit()}
            enableCloseConfirm
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
            <SaveOrUpdatePurchaseOrder
              ref={addFormRef}
              open={showAddDrawer}
              onClose={confirmCloseAdd}
              onSuccess={handleAddSuccess}
              onDirtyChange={(dirty) => setIsAddDirty(dirty)}
            />
          </RightDrawer>

          {/* ── View / Edit Drawer ── */}
          <RightDrawer
            open={!!viewRow}
            onClose={confirmCloseEdit}
            title="View Purchase Order"
            tabKey="purchase-order"
            showEdit={!!viewRow && !editMode && hasPermission(menuPermissions.PURCHASE_ORDER_EDIT)}
            onEdit={() => {
              setEditMode(true);
            }}
            onSave={
              editMode && hasPermission(menuPermissions.PURCHASE_ORDER_EDIT)
                ? () => viewFormRef.current && viewFormRef.current.submit()
                : undefined
            }
            disableEdit={editMode}
            onDisableEdit={() => {
              setEditMode(false);
            }}
            isDirty={isEditDirty}
            enableCloseConfirm={true}
            closeConfirmScope="edit"
            closeConfirmTitle="Unsaved Changes"
            closeConfirmMessage="You have unsaved changes. Are you sure you want to close?"
            disableTabCloseConfirm={!!viewRow && !editMode && !isEditDirty}
            onDiscardDraft={() => {
              try {
                resetEditDirty();
              } catch {
                /* noop */
              }
            }}
          >
            {viewRow && (
              <SaveOrUpdatePurchaseOrder
                key={viewRow ? (viewRow.purchase_order_id || "row") : "empty"}
                ref={viewFormRef}
                open={!!viewRow}
                initialData={viewRow}
                editMode={editMode}
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

          {/* Action Confirmation Dialog for Approve & Short Close / Recall */}
          <ConfirmDialog
            open={actionConfirmDialog.open}
            title={actionConfirmDialog.title}
            message={actionConfirmDialog.message}
            onConfirm={actionConfirmDialog.onConfirm}
            onCancel={() => setActionConfirmDialog({ open: false, title: "", message: null, onConfirm: null })}
            confirmLabel="OK"
            cancelLabel="Cancel"
          />

          {/* ── PDF Viewer Modal ── */}
          <PDFViewerModal
            isOpen={pdfModal.isOpen}
            onClose={() => setPdfModal((prev) => ({ ...prev, isOpen: false }))}
            title={pdfModal.title}
            pdfUrl={pdfModal.pdfUrl}
            hideActions={pdfModal.hideActions}
          />
        </div>
      </main>
    </div>
  );
}
