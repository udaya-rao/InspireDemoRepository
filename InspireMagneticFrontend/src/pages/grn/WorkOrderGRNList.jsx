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
} from "../../permissions/permissionUtils";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import RightDrawer from "../../components/RightDrawer";
import { ConfirmDialog } from "../../components/Notification";
import { SUCCESS_STATUS, ERROR_STATUS } from "../../utils/ConstVariables";
import SaveWorkOrderGRN from "./SaveWorkOrderGRN";
import { menuPermissions } from "../../permissions/permissionUtils";
import {
  fetchGRNHeaderList,
  fetchGRNHeaderDetails,
  cancelWorkOrderGRNDetails,
  fetchWorkOrderGRNPDF,
} from "../../services/grnService";
import MultiTabPDFViewerModal from "../../components/MultiTabPDFViewerModal";
import StatusBadge from "../../components/StatusBadge";


const workOrderGRNColumns = [
  { key: "actions", label: "Actions", sortable: false, width: "0%", minWidth: "100px" },
  {
    key: "grn_no",
    label: "GRN No",
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
        title={`${row.grn_no}`}
        onMouseOut={(e) => (e.target.style.textDecoration = "none")}
        onClick={(e) => {
          e.stopPropagation();
          openPdf(row);
        }}
      >
        {row.grn_no}
      </span>
    ),
  },
  { key: "work_order_no", label: "Work Order No", style: { textAlign: "center" }, width: "12%", minWidth: "130px" },
  { key: "grn_date", label: "GRN Date", style: { textAlign: "center" }, width: "12%", minWidth: "130px", searchable: false },
  // { key: "currency_id", label: "Currency", style: { textAlign: "center" }, width: "10%", minWidth: "100px", searchable: false },
  // { key: "grn_source_type", label: "GRN Source", style: { textAlign: "center" }, width: "12%", minWidth: "120px", searchable: false },
  { key: "supplier_name", label: "Supplier", style: { textAlign: "center" }, width: "12%", minWidth: "120px", searchable: false },
  // { key: "supplier_invoice_date", label: "Supplier Invoice Date", style: { textAlign: "center" }, width: "12%", minWidth: "150px", searchable: false },
  // { key: "supplier_invoice_ref", label: "Supplier Invoice Ref", style: { textAlign: "center" }, width: "12%", minWidth: "150px", searchable: false },
  // { key: "remarks", label: "Remarks", style: { textAlign: "left" }, width: "15%", minWidth: "150px", searchable: false },
  { key: "prep_by", label: "Prepared By", style: { textAlign: "center" }, width: "12%", minWidth: "140px", searchable: false },
  { key: "prep_date", label: "Prepared Date", style: { textAlign: "center" }, width: "12%", minWidth: "140px", searchable: false },
  { key: "doc_status_text", label: "Status", style: { textAlign: "center" }, width: "10%", minWidth: "150px", searchable: false, render: (row) => (<StatusBadge statusId={row.doc_status || row.grn_status} statusText={row.doc_status_text || row.grn_status_text || "—"} />) },
  // { key: "update_by", label: "Updated By", style: { textAlign: "center" }, width: "12%", minWidth: "140px", searchable: false },
  // { key: "update_date", label: "Updated Date", style: { textAlign: "center" }, width: "12%", minWidth: "140px", searchable: false },
];

// ─── Column backend-name mapping ──────────────────────────────────
const getBackendColumnName = (frontendKey) => {
  const mapping = {
    grn_date: "grn_date",
    invoice_date: "invoice_date",
  };
  return mapping[frontendKey] || frontendKey;
};

// ─── Transform API record to display row ──────────────────────────
import { formatDate } from "../../utils/dateUtils";
const transformRecord = (item) => ({
  ...item,
  grn_date: formatDate(item.grn_date) || item.grn_date,
  prep_date: formatDate(item.prep_date) || item.prep_date,
  supplier_invoice_date: formatDate(item.supplier_invoice_date) || item.supplier_invoice_date,
});


export default function WorkOrderGRNList() {

  const { showToast } = useToast();

  const [pdfModal, setPdfModal] = useState({
    isOpen: false,
    title: "",
    pdfList: [],
    hideActions: false,
  });

  // ── Pagination state ──────────────────────────────────────────
  const {
    rows: grnData,
    setRows: setGrnData,
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
        const res = await fetchWorkOrderGRNPDF({
          grnid: Number(row.grn_id || row.grnid),
          source: "WorkOrderGRN",
        });
        const list =
          res?.data?.PURCHASE_ORDER_OR_WORK_ORDER_GRN_PDF_RESPONSE ||
          res?.data?.WORK_ORDER_GRN_PDF_RESPONSE ||
          res?.data?.PURCHASE_ORDER_GRN_PDF_RESPONSE ||
          res?.data?.GRN_PDF_RESPONSE ||
          res?.data?.PDF_RESPONSE ||
          (Array.isArray(res?.data) ? res.data : []) ||
          [];

        const hasValidPdf = list.some((item) => {
          const base64 =
            item.PurchaseOrderOrWorkOrderGRNPDFBase64 ||
            item.WorkOrderGRNPDFBase64 ||
            item.PurchaseOrderGRNPDFBase64 ||
            item.PurchaseGRNPDFBase64 ||
            item.GRNPDFBase64 ||
            item.PDFBase64 ||
            item.Base64 ||
            item.base64;
          return Boolean(base64 && String(base64).trim() !== "");
        });

        if (res && res.Status === SUCCESS_STATUS && list.length > 0 && hasValidPdf) {
          setPdfModal({
            isOpen: true,
            title: `GRN-${row.grn_no || row.grn_id}`,
            pdfList: list,
            hideActions: ((row.doc_status || row.grn_status) < 30),
          });
        } else {
          const errorMsg =
            list[0]?.Message ||
            list[0]?.message ||
            (res?.message && res.message !== "OK" ? res.message : null) ||
            res?.data?.message ||
            "Failed to generate PDF";
          showToast(errorMsg, ERROR_STATUS.toLowerCase());
        }
      } catch (error) {
        console.error("Error fetching PDF:", error);
        const list =
          error?.response?.data?.data?.PURCHASE_ORDER_OR_WORK_ORDER_GRN_PDF_RESPONSE ||
          error?.response?.data?.data?.PURCHASE_ORDER_GRN_PDF_RESPONSE ||
          error?.response?.data?.data?.WORK_ORDER_GRN_PDF_RESPONSE ||
          [];
        const errorMsg =
          list[0]?.Message ||
          list[0]?.message ||
          (error?.response?.data?.message && error.response.data.message !== "OK"
            ? error.response.data.message
            : null) ||
          "An error occurred while fetching the PDF";
        showToast(errorMsg, ERROR_STATUS.toLowerCase());
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );
  const savedItemRef = useRef(null);

  // ── Drawer state ──────────────────────────────────────────────
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const addFormRef = useRef();

  const [viewRow, setViewRow] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const viewFormRef = useRef();

  // ── Unsaved-changes hooks (mirrored exactly from PurchaseOrderList) ──
  const {
    isDirty: isAddDirty,
    setIsDirty: setIsAddDirty,
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

  // Cancel Confirmation Dialog state
  const [cancelConfirmDialog, setCancelConfirmDialog] = useState({
    open: false,
    row: null,
  });

  // ── Server-side query tracking ────────────────────────────────
  const [, setActiveColumnSearch] = useState({ key: "", value: "" });
  const [, setActiveColumnFilters] = useState({});
  const activeColumnFiltersRef = useRef({});
  const [activeSearchFilters, setActiveSearchFilters] = useState([]);
  const [currentSortConfig, setCurrentSortConfig] = useState({ key: "", direction: "" });
  const [isGlobalSearch, setIsGlobalSearch] = useState(0);
  const lastQueryRef = useRef(null);
  const requestSeqRef = useRef(0);
  const fetchedRef = useRef(false);

  // ── Display-all shortcut (Purchase only) ─────────────────────
  const [, setShortCut] = useState("PendingOnly");
  const shortCutRef = useRef("PendingOnly");

  // ── Fetch function ────────────────────────────────────────────
  const fetchGRNList = useCallback(
    async (
      pageSize = 25,
      pageNumber = 0,
      columnName = "",
      sortOrder = "",
      searchKeyword = "",
      isGlobalSearchVal = 0,
      searchFilter = [],
      options = { force: false },
      // overrideShortCut = null
    ) => {
      // const activeShortCut =
      //   overrideShortCut !== null ? overrideShortCut : shortCutRef.current;

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
          { columnName: "", searchKeyword: "", sortOrder: "", columnSequence: 0 },
        ];
      }

      const payload = {
        pageSize,
        pageNumber,
        isGlobalSearch: isGlobalSearchVal,
        sortOrder,
        columnName: mappedColumnName,
        searchKeyword: searchKeyword || "",
        searchFilter: resolvedFilter,
      };

      const payloadKey = JSON.stringify(payload);
      if (!options?.force && lastQueryRef.current === payloadKey) return;
      lastQueryRef.current = payloadKey;

      const reqId = ++requestSeqRef.current;
      setLoading(true);

      try {
        const res = await fetchGRNHeaderList(payload);
        if (reqId !== requestSeqRef.current) return;

        const list = res?.data?.["WORK_ORDER_GRN_HEADER_LIST"] || [];
        const totalRecords =
          res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords || list.length || 0;

        const data = list.map((item) => transformRecord(item));
        setGrnData(data);
        if (tableProps.setTotalRecords) tableProps.setTotalRecords(totalRecords);
        if (typeof tableProps.onPageChange === "function" && Number(pageNumber) === 0)
          tableProps.onPageChange(1);
      } catch (error) {
        console.error(`Error fetching ${"Work Order Goods Receipt"} list:`, error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          showToast(`Failed to load ${"Work Order Goods Receipt"}`, "error");
        }
        setGrnData([]);
      } finally {
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    },
    [setGrnData, tableProps, showToast]
  );

  // ── Smart refresh (preserve page/sort/search) ─────────────────
  const refreshCurrentPage = useCallback(() => {
    fetchGRNList(
      tableProps.pageSize || 25,
      (tableProps.currentPage || 1) - 1,
      currentSortConfig.key || "",
      currentSortConfig.direction || "",
      tableProps.searchTerm || "",
      isGlobalSearch,
      activeSearchFilters,
      { force: true }
    );
  }, [fetchGRNList, tableProps, currentSortConfig, isGlobalSearch, activeSearchFilters]);

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchGRNList(25, 0, "", "", "", 0, [], { force: true }, null);
  }, [fetchGRNList]);

  // Reset on moduleType change


  // ── Row highlight after save ──────────────────────────────────
  useEffect(() => {
    if (!savedItemRef.current || grnData.length === 0) return;
    const saved = savedItemRef.current;
    const idx = grnData.findIndex(
      (item) =>
        saved.grn_id &&
        item.grn_id &&
        String(saved.grn_id) === String(item.grn_id)
    );
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
  }, [grnData]);


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

        if (typeof tableProps.onPageSizeChange === "function")
          tableProps.onPageSizeChange(pageSizeNum);
        if (typeof tableProps.onPageChange === "function")
          tableProps.onPageChange(pageNumber0 + 1);
        if (typeof tableProps.setSearchTerm === "function")
          tableProps.setSearchTerm(isGlobalSearchVal === 1 ? searchKeyword : "");
        if (typeof tableProps.setSortConfig === "function" && columnName)
          tableProps.setSortConfig({ key: columnName, direction: sortOrder || "asc" });
        if (columnName && sortOrder)
          setCurrentSortConfig({ key: columnName, direction: sortOrder });

        let finalSearchFilter = searchFilter;
        let finalColumnName = columnName;
        let finalSearchKeyword = searchKeyword;

        if (isGlobalSearchVal === 1) {
          finalSearchFilter = searchKeyword?.trim()
            ? [{ columnName: columnName || "grn_id", searchKeyword, sortOrder: "", columnSequence: 1 }]
            : [];
          finalColumnName = columnName || "grn_id";
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
          setActiveColumnSearch(
            searchFilter.length === 1
              ? { key: searchFilter[0].columnName, value: searchFilter[0].searchKeyword }
              : { key: "", value: "" }
          );
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
        fetchGRNList(
          pageSizeNum, pageNumber0, finalColumnName, sortOrder,
          finalSearchKeyword, isGlobalSearchVal, finalSearchFilter
        );
      } catch (e) {
        console.error("Failed to handle GRN query payload", e);
      }
    },
    [fetchGRNList, tableProps]
  );

  // ── Refresh ───────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    try {
      setActiveColumnSearch({ key: "", value: "" });
      setActiveColumnFilters({});
      activeColumnFiltersRef.current = {};
      setActiveSearchFilters([]);
      setCurrentSortConfig({ key: "", direction: "" });

      if (tableRef.current && typeof tableRef.current.refresh === "function")
        tableRef.current.refresh();
      if (typeof tableProps.setSortConfig === "function")
        tableProps.setSortConfig({ key: "", direction: "" });
      if (typeof tableProps.setSearchTerm === "function")
        tableProps.setSearchTerm("");
      if (typeof tableProps.onPageSizeChange === "function")
        tableProps.onPageSizeChange(25);
      if (typeof tableProps.onPageChange === "function")
        tableProps.onPageChange(1);

      lastQueryRef.current = null;
      shortCutRef.current = "PendingOnly";
      setShortCut("PendingOnly");
      fetchGRNList(25, 0, "", "", "", 0, [], { force: true }, null);
    } catch (e) {
      console.error("Error refreshing GRN list:", e);
    }
  }, [tableProps, fetchGRNList]);

  // ── Add success ───────────────────────────────────────────────
  const handleAddSuccess = useCallback(
    async (newRecord) => {
      const resKey = "WORK_ORDER_GRN_RESPONSE";
      const header =
        newRecord?.data?.[resKey]?.[0] ||
        newRecord?.[resKey]?.[0] ||
        newRecord?.data?.[0];

      if (header) {
        const successMsg = header?.Message || newRecord?.message || `${"Work Order Goods Receipt"} saved successfully!`;
        showToast(successMsg, SUCCESS_STATUS);

        const grnId = header?.ID || header?.grn_id || header?.grnID;

        if (grnId) {
          try {
            const detailRes = await fetchGRNHeaderDetails({ grnid: Number(grnId) });
            if (detailRes && detailRes.Status === SUCCESS_STATUS && detailRes.data) {
              const fullHeader = detailRes.data.WORK_ORDER_GRN_HEADER_RESPONSE?.[0] || detailRes.data.data?.WORK_ORDER_GRN_HEADER_RESPONSE?.[0];
              if (fullHeader) {
                savedItemRef.current = { grn_id: fullHeader.grn_id || grnId, isNew: true };
                const transformed = transformRecord(fullHeader);
                setGrnData((prev) => {
                  const filtered = prev.filter((item) => item.grn_id !== transformed.grn_id);
                  return [transformed, ...filtered];
                });
                if (typeof tableProps.setTotalRecords === "function") {
                  tableProps.setTotalRecords((tableProps.totalRecords || 0) + 1);
                }
              } else {
                refreshCurrentPage();
              }
            } else {
              refreshCurrentPage();
            }
          } catch (e) {
            console.error("Error fetching GRN Header Details:", e);
            refreshCurrentPage();
          }
        } else {
          refreshCurrentPage();
        }
      } else {
        refreshCurrentPage();
      }
      setShowAddDrawer(false);
      resetAddDirty();
    },
    [setGrnData, tableProps, refreshCurrentPage, showToast, resetAddDirty]
  );

  // ── Edit save ─────────────────────────────────────────────────
  const handleEditSave = useCallback(
    async (savedRecord) => {
      if (viewRow) {
        savedItemRef.current = { grn_id: viewRow.grn_id };
      }
      const header = savedRecord?.data?.WORK_ORDER_GRN_RESPONSE?.[0] || savedRecord?.WORK_ORDER_GRN_RESPONSE?.[0];
      const successMsg = header?.Message || savedRecord?.message || `${"Work Order Goods Receipt"} updated successfully!`;
      showToast(successMsg, SUCCESS_STATUS);

      const grnId = header?.ID || header?.grn_id || viewRow?.grn_id;
      if (grnId) {
        try {
          const detailRes = await fetchGRNHeaderDetails({ grnid: Number(grnId) });
          if (detailRes && detailRes.Status === SUCCESS_STATUS && detailRes.data) {
            const fullHeader = detailRes.data.WORK_ORDER_GRN_HEADER_RESPONSE?.[0] || detailRes.data.data?.WORK_ORDER_GRN_HEADER_RESPONSE?.[0];
            if (fullHeader) {
              const transformed = transformRecord(fullHeader);
              setGrnData((prev) => {
                const filtered = prev.filter((item) => item.grn_id !== transformed.grn_id);
                const idx = prev.findIndex((item) => item.grn_id === transformed.grn_id);
                if (idx >= 0) {
                  const newArr = [...prev];
                  newArr[idx] = transformed;
                  return newArr;
                }
                return [transformed, ...filtered];
              });
            } else {
              refreshCurrentPage();
            }
          } else {
            refreshCurrentPage();
          }
        } catch (e) {
          console.error("Error fetching GRN Header Details on Edit:", e);
          refreshCurrentPage();
        }
      } else {
        refreshCurrentPage();
      }

      setViewRow(null);
      setEditMode(false);
      resetEditDirty();
    },
    [viewRow, showToast, refreshCurrentPage, resetEditDirty, setGrnData]
  );

  const handleCancel = useCallback(async (row) => {
    if (!row) return;
    setLoading(true);
    try {
      const res = await cancelWorkOrderGRNDetails({ grnid: row.grn_id });
      if (res && res.Status === SUCCESS_STATUS) {
        showToast(res?.data?.CANCEL_WORK_ORDER_GRN_DETAILS_RESPONSE?.[0]?.Message || "GRN Cancelled Successfully !!!", SUCCESS_STATUS);
        savedItemRef.current = { grn_id: row.grn_id };
        refreshCurrentPage();
      } else {
        const errMsg = res?.data?.CANCEL_WORK_ORDER_GRN_DETAILS_RESPONSE?.[0]?.Message || res?.message || "Failed to cancel GRN";
        showToast(errMsg, "error");
      }
    } catch (error) {
      console.error("Error cancelling GRN:", error);
      showToast("Error occurred while cancelling", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, refreshCurrentPage]);

  // ── Drawer close handlers ─────────────────────────────────────
  const confirmCloseAdd = () => {
    setShowAddDrawer(false);
    resetAddDirty();
  };

  const confirmCloseEdit = async () => {
    setViewRow(null);
    setEditMode(false);
    resetEditDirty();
  };

  // ── Row actions ───────────────────────────────────────────────
  const getActions = useCallback(
    (row) => {
      const actions = [
        {
          label: "View",
          title: `View ${"Work Order Goods Receipt"} Details`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      if ((row.doc_status_text || row.grn_status_text) !== "Cancelled" && hasPermission(menuPermissions.WORK_ORDER_GRN_CANCEL)) {
        actions.push({
          label: "Cancel",
          title: "Cancel GRN",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          ),
          onClick: () => {
            setCancelConfirmDialog({
              open: true,
              row,
            });
          },
        });
      }
      return actions;
    },
    [isEditDirty, viewRow, checkEditUnsavedChanges, resetEditDirty]
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      {loading && <Loader />}

      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          <DynamicSortableTable
            fixedFirstColumn={true}
            ref={tableRef}
            columns={workOrderGRNColumns}
            data={grnData}
            onQueryChange={handleQueryChange}
            onAdd={
              hasPermission(menuPermissions.WORK_ORDER_GRN_CREATE) ? async () => {
                if (isEditDirty && viewRow) {
                  const ok = await checkEditUnsavedChanges();
                  if (!ok) return;
                }
                setShowAddDrawer(true);
                resetAddDirty();
              } : undefined
            }
            onRefresh={handleRefresh}
            title={"Work Order Goods Receipt"}
            icon={(<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" /></svg>)}
            showGlobalSearch={true}
            getActions={getActions}
            disableSearch={false}
            autoSelectFirstRow={true}
            currentPage={tableProps.currentPage}
            pageSize={tableProps.pageSize}
            totalRecords={tableProps.totalRecords}
            showDisplayAll={false}
            onDisplayAll={undefined}
            renderContext={{ openPdf }}
          />

          {/* ── Add Drawer ── */}
          <RightDrawer
            open={showAddDrawer}
            tabKey={"grn-work-order"}
            onClose={confirmCloseAdd}
            title={`Add ${"Work Order Goods Receipt"}`}
            onSave={() => addFormRef.current && addFormRef.current.submit()}
            enableCloseConfirm
            closeConfirmScope="create"
            isCreate={true}
            isDirty={isAddDirty}
            closeConfirmTitle="Unsaved Changes"
            closeConfirmMessage="You have unsaved changes. Save draft or close without saving?"
            onSaveDraft={() => {
              try { addFormRef.current?.saveDraft?.(); } catch { /* no-op */ }
            }}
            onDiscardDraft={() => {
              try { addFormRef.current?.clearDraft?.(); } catch { /* no-op */ }
              resetAddDirty();
            }}
          >
            <SaveWorkOrderGRN
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
            tabKey={"grn-work-order"}
            onClose={confirmCloseEdit}
            title={`View ${"Work Order Goods Receipt"}`}
            showEdit={
              !!viewRow &&
              !editMode &&
              hasPermission(menuPermissions.WORK_ORDER_GRN_EDIT)
            }
            onEdit={() => setEditMode(true)}
            onSave={
              editMode && hasPermission(menuPermissions.WORK_ORDER_GRN_EDIT)
                ? () => viewFormRef.current && viewFormRef.current.submit()
                : undefined
            }
            disableEdit={editMode}
            onDisableEdit={() => setEditMode(false)}
            isDirty={isEditDirty}
            enableCloseConfirm={true}
            closeConfirmScope="edit"
            closeConfirmTitle="Unsaved Changes"
            closeConfirmMessage="You have unsaved changes. Are you sure you want to close?"
            disableTabCloseConfirm={!!viewRow && !editMode && !isEditDirty}
            onDiscardDraft={() => {
              try { resetEditDirty(); } catch { /* no-op */ }
            }}
          >
            {viewRow && (
              <SaveWorkOrderGRN
                key={viewRow ? (viewRow["grn_id"] || "row") : "empty"}
                ref={viewFormRef}

                open={!!viewRow}
                initialData={viewRow}
                editMode={editMode}
                onSuccess={handleEditSave}
                onDirtyChange={(dirty) => setIsEditDirty(dirty)}
                disabled={!hasPermission(menuPermissions.WORK_ORDER_EDIT)}
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

          {/* Cancel Confirmation Dialog */}
          <ConfirmDialog
            open={cancelConfirmDialog.open}
            title="Confirm Cancel"
            message={
              cancelConfirmDialog.row ? (
                <>
                  Are you sure you want to cancel GRN{" "}
                  <b>{cancelConfirmDialog.row.grn_no || ""}</b>?
                </>
              ) : (
                "Are you sure you want to cancel this GRN?"
              )
            }
            onConfirm={async () => {
              const rowToCancel = cancelConfirmDialog.row;
              setCancelConfirmDialog({ open: false, row: null });
              if (rowToCancel) {
                await handleCancel(rowToCancel);
              }
            }}
            onCancel={() => setCancelConfirmDialog({ open: false, row: null })}
            confirmLabel="OK"
            cancelLabel="Cancel"
          />

          {/* ── Multi-Tab PDF Viewer Modal ── */}
          <MultiTabPDFViewerModal
            isOpen={pdfModal.isOpen}
            onClose={() => setPdfModal((prev) => ({ ...prev, isOpen: false, pdfList: [] }))}
            title={pdfModal.title}
            pdfList={pdfModal.pdfList}
            hideActions={pdfModal.hideActions}
          />
        </div>
      </main>
    </div>
  );
}
