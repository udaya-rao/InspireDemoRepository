import React, { useState, useEffect, useRef, useCallback } from "react";
import DynamicSortableTable from "../../../components/DynamicSortableTable";
import Loader from "../../../components/Loader";
import { useToast } from "../../../components/useToast";
import {
  hasPermission,
  menuPermissions,
} from "../../../permissions/permissionUtils";
import usePaginatedTable from "../../../hooks/usePaginatedTable";
import { formatDate } from "../../../utils/dateUtils.js";
import PDFViewerModal from "../../../components/PDFViewerModal";
import { SUCCESS_STATUS, ERROR_STATUS } from "../../../utils/ConstVariables";
import RightDrawer from "../../../components/RightDrawer";
import { ConfirmDialog } from "../../../components/Notification";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import SaveOrUpdateQuotation from "./SaveOrUpdateQuotation";
import StatusBadge from "../../../components/StatusBadge";
import {
  fetchQuotationHeaderList,
  approveQuotationDetails,
  shortCloseOrRecallQuotationDetails,
  fetchQuotationHeaderPDF,
} from "../../../services/quotationService.js";
import { getPreparedBy } from "../../../utils/userSession.js";

// ─── Column definitions ───────────────────────────────────────────────────────
const quotationColumns = [
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    width: "0%",
    minWidth: "100px",
  },
  {
    key: "quotation_no",
    label: "Quotation No",
    style: { textAlign: "center" },
    width: "12%",
    minWidth: "130px",
    render: (row, { openPdf }) => (
      <span
        style={{ color: "#1865b5", cursor: "pointer", fontWeight: 600 }}
        onClick={(e) => {
          e.stopPropagation();
          openPdf(row);
        }}
      >
        {row.quotation_no}
      </span>
    ),
  },
  {
    key: "quotation_date_formatted",
    label: "Date",
    style: { textAlign: "center" },
    searchable: false,
    width: "10%",
    minWidth: "120px",
  },
  {
    key: "customer_name",
    label: "Customer",
    style: { textAlign: "center" },
    searchable: false,
    width: "18%",
    minWidth: "180px",
  },
  {
    key: "kind_attn_name",
    label: "Kind Attention",
    style: { textAlign: "center" },
    searchable: false,
    width: "14%",
    minWidth: "150px",
  },
  {
    key: "currency_code",
    label: "Currency",
    style: { textAlign: "center" },
    searchable: false,
    width: "8%",
    minWidth: "90px",
  },
  {
    key: "quotation_amount",
    label: "Amount",
    style: { textAlign: "right" },
    searchable: false,
    width: "10%",
    minWidth: "120px",
    render: (row) => (
      <span style={{ fontWeight: 600 }}>
        {Number(row.quotation_amount || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    ),
  },
  {
    key: "doc_status_text",
    label: "Status",
    style: { textAlign: "center" },
    searchable: false,
    width: "12%",
    minWidth: "140px",
    render: (row) => (
      <StatusBadge
        statusId={row.doc_status}
        statusText={row.doc_status_text || "—"}
      />
    ),
  },
  {
    key: "prep_by",
    label: "Prepared By",
    style: { textAlign: "center" },
    searchable: false,
    width: "10%",
    minWidth: "130px",
  },
  {
    key: "approved_by",
    label: "Approved By",
    style: { textAlign: "center" },
    searchable: false,
    width: "10%",
    minWidth: "130px",
  },
];

// ─── Transform helper ─────────────────────────────────────────────────────────
// The list response only returns `quotation_no` (no numeric `quotation_id`).
// Until the backend exposes a real ID here, use quotation_no as the row's
// unique key so selection / highlight / drawer logic below keeps working.
// NOTE: this is NOT necessarily what the Approve / Shortclose APIs expect
// for `quotationID` (they look like they want an int) — confirm this before
// relying on it for those calls.
const transformRecord = (item) => {
  let formattedDate = item?.quotation_date;
  try {
    formattedDate = formatDate(item?.quotation_date) || item?.quotation_date;
  } catch (err) {
    console.error(
      "formatDate failed for quotation_date:",
      item?.quotation_date,
      err,
    );
  }
  return {
    ...item,
    quotation_id: item?.quotation_id ?? item?.quotation_no,
    quotation_date_formatted: formattedDate,
  };
};

const getBackendColumnName = (key) => {
  const map = { quotation_date_formatted: "quotation_date" };
  return map[key] || key;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuotationList() {
  const { showToast } = useToast();

  const [pdfModal, setPdfModal] = useState({
    isOpen: false,
    title: "",
    pdfUrl: "",
    hideActions: false,
  });
  const [loading, setLoading] = useState(false);
  const tableRef = useRef(null);
  const savedItemRef = useRef(null);

  const {
    rows: quotationData,
    setRows: setQuotationData,
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
  const [, setActiveColumnSearch] = useState({ key: "", value: "" });
  const [, setActiveColumnFilters] = useState({});
  const activeColumnFiltersRef = useRef({});
  const lastQueryRef = useRef(null);
  const requestSeqRef = useRef(0);
  const fetchedRef = useRef(false);
  const [, setShortCut] = useState("PendingOnly");
  const shortCutRef = useRef("PendingOnly");

  const isApproved = (row) => row && row.doc_status === 30;

  const [approveConfirm, setApproveConfirm] = useState({ open: false, row: null });
  const [shortCloseConfirm, setShortCloseConfirm] = useState({ open: false, row: null });

  // Short-closed detection for quotations. Mirrors PurchaseOrderList's
  // isShortClosed (doc_status === 50 there, confirmed against that API).
  // The equivalent status code for quotations is NOT confirmed — 50 is
  // assumed by analogy. Verify against the backend / doc_status_text
  // values actually returned for a short-closed quotation and adjust if
  // needed.
  const isShortClosed = (row) =>
    row &&
    (row.doc_status === 50 ||
      (row.doc_status_text || "").toLowerCase().includes("short-closed") ||
      (row.doc_status_text || "").toLowerCase().includes("shortclosed"));

  // ── Open PDF ────────────────────────────────────────────────────────────
  const openPdf = useCallback(
    async (row) => {
      const quotationID = row.quotation_id || row.quotationID || 0;

      if (!quotationID) {
        showToast("Cannot open PDF: missing Quotation ID", "error");
        return;
      }

      try {
        const response = await fetchQuotationHeaderPDF({ quotationID });

        if (response?.Status !== SUCCESS_STATUS) {
          showToast(response?.message || "Failed to generate PDF", "error");
          return;
        }

        const pdfResp = response?.data?.QUOTATION_PDF_RESPONSE?.[0];
        const base64Pdf = pdfResp?.QuotationPDFBase64;

        if (!base64Pdf) {
          showToast(
            pdfResp?.Message || "PDF data missing in response",
            "error",
          );
          return;
        }

        setPdfModal({
          isOpen: true,
          title: pdfResp?.QuotationPDFFileName || `Quotation-${quotationID}`,
          pdfUrl: base64Pdf,
          hideActions: !isApproved(row),
        });
      } catch (error) {
        console.error("Error fetching Quotation PDF", error);
        showToast("An error occurred while generating the PDF", "error");
      }
    },
    [showToast],
  );

  // ── Fetch list ─────────────────────────────────────────────────────────
  const fetchQuotations = useCallback(
    async (
      pageSize = 25,
      pageNumber = 0,
      columnName = "",
      sortOrder = "",
      searchKeyword = "",
      isGlobalSearchVal = 0,
      searchFilter = [],
      options = { force: false },
      overrideShortCut = null,
    ) => {
      const shortCut = overrideShortCut ?? shortCutRef.current;

      // Map any frontend-only column keys (e.g. the formatted date column)
      // to the real backend column name before this reaches the API —
      // sorting/searching must operate on `quotation_date`, not the
      // display-only `quotation_date_formatted`.
      const mappedColumnName = getBackendColumnName(columnName || "");

      // Build the filter list in the shape GetQuotationList expects. If a
      // single column/keyword pair was passed in (legacy call signature),
      // fold it into searchFilter as well so callers that only pass
      // columnName/searchKeyword still work.
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
        shortCut: shortCut || "",
      };

      const payloadKey = JSON.stringify(payload);
      if (!options?.force && lastQueryRef.current === payloadKey) return;
      lastQueryRef.current = payloadKey;

      const reqId = ++requestSeqRef.current;
      setLoading(true);
      try {
        const res = await fetchQuotationHeaderList(payload);
        const list = res?.data?.QUOTATION_LIST || [];
        const totalRecords =
          res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords ?? list.length;
        if (reqId !== requestSeqRef.current) return;

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
            fetchQuotations(
              pageSize,
              maxPageNumber,
              columnName,
              sortOrder,
              searchKeyword,
              isGlobalSearchVal,
              searchFilter,
              { force: true },
              shortCut
            );
            return;
          }
        }

        const data = list.map(transformRecord);
        setQuotationData(data);
        if (tableProps.setTotalRecords)
          tableProps.setTotalRecords(totalRecords);
        if (
          typeof tableProps.onPageChange === "function" &&
          Number(pageNumber) === 0
        )
          tableProps.onPageChange(1);
      } catch (error) {
        console.error("Error fetching Quotation list:", error);
        setQuotationData([]);
      } finally {
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    },
    [setQuotationData, tableProps],
  );

  const refreshCurrentPage = useCallback(() => {
    fetchQuotations(
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
    fetchQuotations,
    tableProps,
    currentSortConfig,
    isGlobalSearch,
    activeSearchFilters,
  ]);

  // ── Success handlers ──────────────────────────────────────────────────────
  const handleAddSuccess = (newRecord) => {
    const header =
      newRecord?.data?.QUOTATION_HEADER_RESPONSE?.[0] || newRecord?.data?.[0];
    if (header) {
      savedItemRef.current = { quotation_id: header.quotation_id, isNew: true };
      setQuotationData((prev) => {
        const filtered = prev.filter(
          (i) => i.quotation_id !== header.quotation_id,
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
    if (viewRow) savedItemRef.current = { quotation_id: viewRow.quotation_id };
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


  const doApprove = useCallback(
    async (row) => {
      if (!row) return;
      try {
        setLoading(true);
        await approveQuotationDetails({
          quotationID: row.quotation_id,
          approvedBy: getPreparedBy(),
        });
        showToast(`Quotation ${row.quotation_no} approved`, "success");
        savedItemRef.current = { quotation_id: row.quotation_id };
        refreshCurrentPage();
      } catch (error) {
        console.error("Error approving quotation:", error);
        showToast(`Failed to approve Quotation ${row.quotation_no}`, "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast, refreshCurrentPage],
  );

  const doShortCloseOrRecall = useCallback(
    async (row) => {
      if (!row) return;
      const shortClosed = isShortClosed(row);
      try {
        setLoading(true);
        const response = await shortCloseOrRecallQuotationDetails({
          quotationID: row.quotation_id,
        });
        if (response?.Status === SUCCESS_STATUS) {
          const defaultMsg = shortClosed
            ? `Quotation ${row.quotation_no} recalled`
            : `Quotation ${row.quotation_no} shortclosed`;
          const successMsg =
            response.data?.SHORTCLOSE_OR_RECALL_QUOTATION_DETAILS_RESPONSE?.[0]
              ?.Message || defaultMsg;
          showToast(successMsg, "success");
          savedItemRef.current = { quotation_id: row.quotation_id };
          refreshCurrentPage();
        } else {
          const errorMsg =
            response?.data?.SHORTCLOSE_OR_RECALL_QUOTATION_DETAILS_RESPONSE?.[0]
              ?.Message ||
            response?.message ||
            (shortClosed ? "Recall failed." : "Shortclose failed.");
          showToast(errorMsg, ERROR_STATUS.toLowerCase());
        }
      } catch (error) {
        console.error(
          `Error ${shortClosed ? "recalling" : "shortclosing"} quotation:`,
          error,
        );
        showToast(
          `Failed to ${shortClosed ? "recall" : "shortclose"} Quotation ${row.quotation_no}`,
          ERROR_STATUS.toLowerCase(),
        );
      } finally {
        setLoading(false);
      }
    },
    [showToast, refreshCurrentPage],
  );

  // ── Row actions ───────────────────────────────────────────────────────────
  const getActions = useCallback(
    (row) => {
      const approved = isApproved(row);
      const actions = [
        {
          label: "View",
          title: "View Quotation Details",
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

      if (!approved && hasPermission(menuPermissions.QUOTATION_APPROVE)) {
        actions.push({
          label: "Approve",
          title: "Approve this Quotation",
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

      if (!approved && hasPermission(menuPermissions.QUOTATION_SHORT_CLOSE)) {
        const shortClosed = isShortClosed(row);
        actions.push({
          label: shortClosed ? "Recall" : "Shortclose",
          title: shortClosed
            ? "Recall this Quotation"
            : "Shortclose this Quotation",
          icon: shortClosed ? (
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
          onClick: () => setShortCloseConfirm({ open: true, row }),
        });
      }

      return actions;
    },
    [isEditDirty, viewRow, checkEditUnsavedChanges, resetEditDirty, doApprove, doShortCloseOrRecall],
  );

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchQuotations(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
  }, [fetchQuotations]);

  // ── Highlight saved row ───────────────────────────────────────────────────
  useEffect(() => {
    if (!savedItemRef.current || quotationData.length === 0) return;
    const saved = savedItemRef.current;
    const idx = quotationData.findIndex(
      (i) => String(i.quotation_id) === String(saved.quotation_id),
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
  }, [quotationData]);

  // ── Display all toggle ────────────────────────────────────────────────────
  const handleDisplayAll = useCallback(
    (isDisplayAll) => {
      const next = isDisplayAll ? "DisplayAll" : "PendingOnly";
      setShortCut(next);
      shortCutRef.current = next;
      if (tableProps?.onPageChange) tableProps.onPageChange(1);
      const activePageSize = tableProps?.pageSize || 25;
      fetchQuotations(activePageSize, 0, "", "", "", 0, [], { force: true }, next);
    },
    [fetchQuotations, tableProps],
  );

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
          finalColumn = columnName,
          finalKeyword = searchKeyword;
        if (isGSVal === 1) {
          finalFilter = searchKeyword?.trim()
            ? [
              {
                columnName: columnName || "quotation_no",
                searchKeyword,
                sortOrder: "",
                columnSequence: 1,
              },
            ]
            : [];
          finalColumn = columnName || "quotation_no";
          setActiveColumnSearch({ key: "", value: "" });
          setActiveColumnFilters({});
          activeColumnFiltersRef.current = {};
          setActiveSearchFilters(finalFilter);
        } else if (searchFilter.length > 0) {
          setActiveSearchFilters(searchFilter);
          const m = {};
          searchFilter.forEach((f) => {
            if (f.columnName && f.searchKeyword)
              m[f.columnName] = f.searchKeyword;
          });
          setActiveColumnFilters(m);
          activeColumnFiltersRef.current = m;
          setActiveColumnSearch(
            searchFilter.length === 1
              ? {
                key: searchFilter[0].columnName,
                value: searchFilter[0].searchKeyword,
              }
              : { key: "", value: "" },
          );
        } else if (columnName && searchKeyword.length > 0) {
          setActiveColumnSearch({ key: columnName, value: searchKeyword });
          setActiveColumnFilters({ [columnName]: searchKeyword });
          activeColumnFiltersRef.current = { [columnName]: searchKeyword };
          setActiveSearchFilters([{ columnName, searchKeyword }]);
          finalFilter = [{ columnName, searchKeyword }];
        } else {
          setActiveColumnSearch({ key: "", value: "" });
          setActiveColumnFilters({});
          activeColumnFiltersRef.current = {};
          setActiveSearchFilters([]);
          finalFilter = [];
        }

        setIsGlobalSearch(isGSVal);
        fetchQuotations(
          pageSizeNum,
          pageNumber0,
          finalColumn,
          sortOrder,
          finalKeyword,
          isGSVal,
          finalFilter,
        );
      } catch (e) {
        console.error("Failed to handle query payload", e);
      }
    },
    [fetchQuotations, tableProps],
  );

  const handleRefresh = useCallback(() => {
    setActiveColumnSearch({ key: "", value: "" });
    setActiveColumnFilters({});
    activeColumnFiltersRef.current = {};
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
    setShortCut("PendingOnly");
    shortCutRef.current = "PendingOnly";
    fetchQuotations(25, 0, "", "", "", 0, [], { force: true }, "PendingOnly");
  }, [tableProps, fetchQuotations]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      {loading && <Loader />}
      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          <DynamicSortableTable
            fixedFirstColumn
            ref={tableRef}
            columns={quotationColumns}
            data={quotationData}
            onQueryChange={handleQueryChange}
            onAdd={
              hasPermission(menuPermissions.QUOTATION_CREATE)
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
            title="Quotation"
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
              </svg>
            }
            showGlobalSearch
            getActions={getActions}
            disableSearch={false}
            autoSelectFirstRow
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
            title="Add Quotation"
            tabKey="quotation"
            onSave={() => addFormRef.current?.submit?.()}
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
            <SaveOrUpdateQuotation
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
            title="View Quotation"
            tabKey="quotation"
            showEdit={!!viewRow && !editMode && hasPermission(menuPermissions.QUOTATION_EDIT)}
            onEdit={() => setEditMode(true)}
            onSave={
              editMode && hasPermission(menuPermissions.QUOTATION_EDIT)
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
              <SaveOrUpdateQuotation
                key={viewRow ? viewRow.quotation_id || "row" : "empty"}
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

          <ConfirmDialog
            open={approveConfirm.open}
            title="Approve Quotation"
            message={`Are you sure you want to approve Quotation ${approveConfirm.row?.quotation_no}?`}
            confirmLabel="Approve"
            cancelLabel="Cancel"
            onConfirm={() => {
              doApprove(approveConfirm.row);
              setApproveConfirm({ open: false, row: null });
            }}
            onCancel={() => setApproveConfirm({ open: false, row: null })}
          />

          <ConfirmDialog
            open={shortCloseConfirm.open}
            title={isShortClosed(shortCloseConfirm.row) ? "Recall Quotation" : "Shortclose Quotation"}
            message={`Are you sure you want to ${isShortClosed(shortCloseConfirm.row) ? "recall" : "shortclose"
              } Quotation ${shortCloseConfirm.row?.quotation_no}?`}
            confirmLabel={isShortClosed(shortCloseConfirm.row) ? "Recall" : "Shortclose"}
            cancelLabel="Cancel"
            onConfirm={() => {
              doShortCloseOrRecall(shortCloseConfirm.row);
              setShortCloseConfirm({ open: false, row: null });
            }}
            onCancel={() => setShortCloseConfirm({ open: false, row: null })}
          />

          <PDFViewerModal
            isOpen={pdfModal.isOpen}
            onClose={() => setPdfModal((p) => ({ ...p, isOpen: false, pdfUrl: "" }))}
            title={pdfModal.title}
            pdfUrl={pdfModal.pdfUrl}
            hideActions={pdfModal.hideActions}
          />
        </div>
      </main>
    </div>
  );
}