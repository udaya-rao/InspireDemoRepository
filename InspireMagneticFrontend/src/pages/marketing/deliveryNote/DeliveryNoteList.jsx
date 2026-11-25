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
import { SUCCESS_STATUS } from "../../../utils/ConstVariables";
import RightDrawer from "../../../components/RightDrawer";
import { ConfirmDialog } from "../../../components/Notification";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import StatusBadge from "../../../components/StatusBadge";
import {
  fetchDeliveryNoteHeaderList,
  approveDeliveryNoteDetails,
  fetchDeliveryNoteHeaderPDF,
  ShortCloseDeliveryNoteDetails,
} from "../../../services/deliveryNoteService.js";
import { getPreparedBy } from "../../../utils/userSession.js";
import SaveOrUpdateDeliveryNote from "./SaveOrUpdateDeliveryNote.jsx";

// ─── Column definitions ───────────────────────────────────────────────────────
const deliveryNoteColumns = [
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    width: "0%",
    minWidth: "100px",
  },
  {
    key: "delivery_note_no",
    label: "Delivery Note No",
    style: { textAlign: "center" },
    width: "12%",
    minWidth: "150px",
    // render: (row, { openPdf }) => (
    //   <span
    //     style={{ color: "#1865b5", cursor: "pointer", fontWeight: 600 }}
    //     onClick={(e) => {
    //       e.stopPropagation();
    //       openPdf(row);
    //     }}
    //   >
    //     {row.delivery_note_no}
    //   </span>
    // ),
  },
  {
    key: "delivery_note_date_formatted",
    label: "Date",
    style: { textAlign: "center" },
    searchable: false,
    width: "9%",
    minWidth: "120px",
  },
  {
    key: "customer_name",
    label: "Customer",
    style: { textAlign: "center" },
    searchable: false,
    width: "16%",
    minWidth: "170px",
  },
  {
    key: "vehicle_number",
    label: "Vehicle No",
    style: { textAlign: "center" },
    searchable: false,
    width: "10%",
    minWidth: "110px",
  },
  {
    key: "eway_bill_number",
    label: "E-Way Bill No",
    style: { textAlign: "center" },
    searchable: false,
    width: "12%",
    minWidth: "140px",
  },
  {
    key: "kind_attn_name",
    label: "Kind Attention",
    style: { textAlign: "center" },
    searchable: false,
    width: "12%",
    minWidth: "140px",
  },
  {
    key: "currency_code",
    label: "Currency",
    style: { textAlign: "center" },
    searchable: false,
    width: "7%",
    minWidth: "90px",
  },
  {
    key: "delivery_note_amount",
    label: "Amount",
    style: { textAlign: "right" },
    searchable: false,
    width: "9%",
    minWidth: "120px",
    render: (row) => (
      <span style={{ fontWeight: 600 }}>
        {Number(row.delivery_note_amount || 0).toLocaleString("en-IN", {
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
    width: "10%",
    minWidth: "130px",
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
    width: "9%",
    minWidth: "120px",
  },
  {
    key: "approved_by",
    label: "Approved By",
    style: { textAlign: "center" },
    searchable: false,
    width: "9%",
    minWidth: "120px",
  },
];

// ─── Transform helper ─────────────────────────────────────────────────────────
const transformRecord = (item) => {
  let formattedDate = item?.delivery_note_date;
  try {
    formattedDate =
      formatDate(item?.delivery_note_date) || item?.delivery_note_date;
  } catch (err) {
    console.error(
      "formatDate failed for delivery_note_date:",
      item?.delivery_note_date,
      err,
    );
  }
  return {
    ...item,
    delivery_note_id: item?.delivery_note_id ?? item?.delivery_note_no,
    delivery_note_date_formatted: formattedDate,
  };
};

const getBackendColumnName = (key) => {
  const map = { delivery_note_date_formatted: "delivery_note_date" };
  return map[key] || key;
};

// Put this above the component, next to getBackendColumnName
const pickList = (data) => {
  if (!data) return [];
  if (Array.isArray(data.DELIVERY_NOTE_LIST)) return data.DELIVERY_NOTE_LIST;
  const key = Object.keys(data).find(
    (k) => k !== "TOTAL_RECORDS" && Array.isArray(data[k]),
  );
  return key ? data[key] : [];
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DeliveryNoteList() {
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
    rows: deliveryNoteData,
    setRows: setDeliveryNoteData,
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

  // Short Close confirmation (same pattern as Purchase Order's action dialog)
  const [shortCloseConfirm, setShortCloseConfirm] = useState({
    open: false,
    row: null,
  });

  const isApproved = (row) => row && row.doc_status === 30;

  // eslint-disable-next-line no-unused-vars
  const isShortClosed = (row) =>
    row &&
    (row.doc_status === 50 ||
      (row.doc_status_text || "").toLowerCase().includes("short-closed") ||
      (row.doc_status_text || "").toLowerCase().includes("shortclosed"));

  // Backend still reports a short-closed note's status text as "cancel…" in
  // some environments, so both spellings are treated as "already closed".
  const isCancelled = (row) =>
    row && (row.doc_status_text || "").toLowerCase().includes("cancel");

  // ── Open PDF ────────────────────────────────────────────────────────────
  const openPdf = useCallback(
    async (row) => {
      const deliveryNoteID = row.delivery_note_id || row.deliveryNoteID || 0;

      if (!deliveryNoteID) {
        showToast("Cannot open PDF: missing Delivery Note ID", "error");
        return;
      }

      try {
        const response = await fetchDeliveryNoteHeaderPDF({ deliveryNoteID });

        if (response?.Status !== SUCCESS_STATUS) {
          showToast(response?.message || "Failed to generate PDF", "error");
          return;
        }
        const pdfResp = response?.data?.DELIVERY_NOTE_PDF_RESPONSE?.[0];
        const base64Pdf = pdfResp?.DeliveryNotePDFBase64;

        if (!base64Pdf) {
          showToast(
            pdfResp?.Message || "PDF data missing in response",
            "error",
          );
          return;
        }

        setPdfModal({
          isOpen: true,
          title:
            pdfResp?.DeliveryNotePDFFileName ||
            `DeliveryNote-${deliveryNoteID}`,
          pdfUrl: base64Pdf,
          hideActions: !isApproved(row),
        });
      } catch (error) {
        console.error("Error fetching Delivery Note PDF", error);
        showToast("An error occurred while generating the PDF", "error");
      }
    },
    [showToast],
  );

  // ── Fetch list ─────────────────────────────────────────────────────────
  const fetchDeliveryNotes = useCallback(
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
      const mappedColumnName = getBackendColumnName(columnName || "");

      let resolvedFilter;
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
        // same empty placeholder as in your curl
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
        columnName: mappedColumnName,
        searchKeyword: searchKeyword || "",
        searchFilter: resolvedFilter,
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
        const res = await fetchDeliveryNoteHeaderList(payload);
        const list = pickList(res?.data);
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
            fetchDeliveryNotes(
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

        setDeliveryNoteData(list.map(transformRecord));
        if (tableProps.setTotalRecords)
          tableProps.setTotalRecords(totalRecords);
        if (
          typeof tableProps.onPageChange === "function" &&
          Number(pageNumber) === 0
        )
          tableProps.onPageChange(1);
      } catch (error) {
        console.error("Error fetching Delivery Note list:", error);
        showToast("Failed to load Delivery Notes", "error");
        setDeliveryNoteData([]);
      } finally {
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    },
    [setDeliveryNoteData, tableProps, showToast],
  );

  const refreshCurrentPage = useCallback(() => {
    fetchDeliveryNotes(
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
    fetchDeliveryNotes,
    tableProps,
    currentSortConfig,
    isGlobalSearch,
    activeSearchFilters,
  ]);

  // ── Success handlers ──────────────────────────────────────────────────────
  const handleAddSuccess = (newRecord) => {
    const header =
      newRecord?.data?.DELIVERY_NOTE_HEADER_RESPONSE?.[0] ||
      newRecord?.data?.[0];
    if (header) {
      savedItemRef.current = {
        delivery_note_id: header.delivery_note_id,
        isNew: true,
      };
      setDeliveryNoteData((prev) => {
        const filtered = prev.filter(
          (i) => i.delivery_note_id !== header.delivery_note_id,
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
      savedItemRef.current = { delivery_note_id: viewRow.delivery_note_id };
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

  // ── Row actions ───────────────────────────────────────────────────────────
  const getActions = useCallback(
    (row) => {
      const approved = isApproved(row);
      const actions = [
        {
          label: "View",
          title: "View Delivery Note Details",
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

      if (
        !approved
         && hasPermission(menuPermissions.DELIVERY_NOTE_APPROVE)
      ) {
        actions.push({
          label: "Approve",
          title: "Approve this Delivery Note",
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
          onClick: async () => {
            try {
              setLoading(true);
              const response = await approveDeliveryNoteDetails({
                deliveryNoteID: row.delivery_note_id,
                approvedBy: getPreparedBy(),
              });
              const msg =
                response?.data?.APPROVE_DELIVERY_NOTE_DETAILS_RESPONSE?.[0]
                  ?.Message;
              if (response?.Status === SUCCESS_STATUS) {
                showToast(
                  msg || `Delivery Note ${row.delivery_note_no} approved`,
                  "success",
                );
                savedItemRef.current = {
                  delivery_note_id: row.delivery_note_id,
                };
                refreshCurrentPage();
              } else {
                showToast(
                  msg || response?.message || "Approve failed.",
                  "error",
                );
              }
            } catch (error) {
              console.error("Error approving delivery note:", error);
              showToast(
                `Failed to approve Delivery Note ${row.delivery_note_no}`,
                "error",
              );
            } finally {
              setLoading(false);
            }
          },
        });
      }

      if (
        !approved &&
        !isCancelled(row)
        && hasPermission(menuPermissions.DELIVERY_NOTE_SHORT_CLOSE)
      ) {
        actions.push({
          label: "Short Close",
          title: "Short Close this Delivery Note",
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ),
          onClick: () => setShortCloseConfirm({ open: true, row }),
        });
      }

      return actions;
    },
    [
      isEditDirty,
      viewRow,
      checkEditUnsavedChanges,
      resetEditDirty,
      refreshCurrentPage,
      showToast,
    ],
  );

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchDeliveryNotes(
      25,
      0,
      "",
      "",
      "",
      0,
      [],
      { force: true },
      "PendingOnly",
    );
  }, [fetchDeliveryNotes]);

  // ── Highlight saved row ───────────────────────────────────────────────────
  useEffect(() => {
    if (!savedItemRef.current || deliveryNoteData.length === 0) return;
    const saved = savedItemRef.current;
    const idx = deliveryNoteData.findIndex(
      (i) => String(i.delivery_note_id) === String(saved.delivery_note_id),
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
  }, [deliveryNoteData]);

  // ── Display all toggle ────────────────────────────────────────────────────
  const handleDisplayAll = useCallback(
    (isDisplayAll) => {
      const next = isDisplayAll ? "DisplayAll" : "PendingOnly";
      setShortCut(next);
      shortCutRef.current = next;
      if (tableProps?.onPageChange) tableProps.onPageChange(1);
      const activePageSize = tableProps?.pageSize || 25;
      fetchDeliveryNotes(activePageSize, 0, "", "", "", 0, [], { force: true }, next);
    },
    [fetchDeliveryNotes, tableProps],
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
                  columnName: columnName || "delivery_note_no",
                  searchKeyword,
                  sortOrder: "",
                  columnSequence: 1,
                },
              ]
            : [];
          finalColumn = columnName || "delivery_note_no";
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
        fetchDeliveryNotes(
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
    [fetchDeliveryNotes, tableProps],
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
    fetchDeliveryNotes(
      25,
      0,
      "",
      "",
      "",
      0,
      [],
      { force: true },
      "PendingOnly",
    );
  }, [tableProps, fetchDeliveryNotes]);

  // ── Short Close (calls the existing cancel endpoint) ─────────────────────
  const handleConfirmShortClose = async () => {
    const row = shortCloseConfirm.row;
    setShortCloseConfirm({ open: false, row: null });
    if (!row) return;
    try {
      setLoading(true);
      const response = await ShortCloseDeliveryNoteDetails({
        deliveryNoteID: row.delivery_note_id,
      });
      const msg =
        response?.data?.SHORT_CLOSE_DELIVERY_NOTE_DETAILS_RESPONSE?.[0]?.Message;
      if (response?.Status === SUCCESS_STATUS) {
        showToast(
          msg || `Delivery Note ${row.delivery_note_no} short closed successfully`,
          "success",
        );
        savedItemRef.current = { delivery_note_id: row.delivery_note_id };
        refreshCurrentPage();
      } else {
        showToast(msg || response?.message || "Short Close failed.", "error");
      }
    } catch (error) {
      console.error("Error short closing delivery note:", error);
      showToast(
        `An error occurred during short close of Delivery Note ${row.delivery_note_no}`,
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      {loading && <Loader />}
      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          <DynamicSortableTable
            fixedFirstColumn
            ref={tableRef}
            columns={deliveryNoteColumns}
            data={deliveryNoteData}
            onQueryChange={handleQueryChange}
            onAdd={
              hasPermission(menuPermissions.DELIVERY_NOTE_CREATE) ? 
              async () => {
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
            title="Delivery Note"
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
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
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
            title="Add Delivery Note"
            tabKey="delivery-notes"
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
            <SaveOrUpdateDeliveryNote
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
            title="View Delivery Note"
            tabKey="delivery-notes"
            showEdit={
              !!viewRow &&
              !editMode 
              && hasPermission(menuPermissions.DELIVERY_NOTE_EDIT)
            }
            onEdit={() => setEditMode(true)}
            onSave={
              editMode 
              && hasPermission(menuPermissions.DELIVERY_NOTE_EDIT)
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
              <SaveOrUpdateDeliveryNote
                key={viewRow ? viewRow.delivery_note_id || "row" : "empty"}
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

          {/* Short Close confirmation (same wording/pattern as Purchase Order) */}
          <ConfirmDialog
            open={shortCloseConfirm.open}
            title="Confirm Short Close"
            message={
              <>
                Are you sure you want to short close Delivery Note{" "}
                <b>{shortCloseConfirm.row?.delivery_note_no || ""}</b>?
              </>
            }
            confirmLabel="OK"
            cancelLabel="Cancel"
            onConfirm={handleConfirmShortClose}
            onCancel={() => setShortCloseConfirm({ open: false, row: null })}
          />

          <PDFViewerModal
            isOpen={pdfModal.isOpen}
            onClose={() =>
              setPdfModal((p) => ({ ...p, isOpen: false, pdfUrl: "" }))
            }
            title={pdfModal.title}
            pdfUrl={pdfModal.pdfUrl}
            hideActions={pdfModal.hideActions}
          />
        </div>
      </main>
    </div>
  );
}