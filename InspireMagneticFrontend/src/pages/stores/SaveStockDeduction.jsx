import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  FormField,
  ReactSelectField,
} from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
import { useToast } from "../../components/useToast";
import Loader from "../../components/Loader";
import { fetchBatchDetailByStoreRequest, saveAndUpdateBatchDetails } from "../../services/storeService";
import { getDropdownData } from "../../services/commonService";
import { SUCCESS_STATUS, ERROR_STATUS } from "../../utils/ConstVariables";
import { getPreparedBy } from "../../utils/userSession";
import { DeleteConfirmDialog } from "../../components/Notification";
import "./SaveStockDeduction.css";

const resolveRequestTypeId = (...sources) => {
  for (const s of sources) {
    if (!s && s !== 0) continue;
    if (typeof s === "number" && !isNaN(s) && s > 0) return s;
    if (typeof s === "string" && /^\d+$/.test(s.trim())) {
      const val = parseInt(s.trim(), 10);
      if (val > 0) return val;
    }
    if (typeof s === "object" && s !== null) {
      const candidates = [
        s.request_type_id,
        s.request_type,
        s.transaction_type,
        s.transactionType,
        s.requestTypeId,
        s.requestType,
      ];
      for (const c of candidates) {
        if (typeof c === "number" && !isNaN(c) && c > 0) return c;
        if (typeof c === "string" && /^\d+$/.test(c.trim())) {
          const val = parseInt(c.trim(), 10);
          if (val > 0) return val;
        }
      }
    }
  }
  return 0;
};

const isCompletedStatus = (row) => {
  if (!row) return false;
  const statusId = Number(row.request_status ?? row.status_id ?? row.status);
  if (statusId === 70) return true;
  const statusText = String(
    row.request_status_text ||
    row.status_text ||
    (typeof row.status === "string" ? row.status : "") ||
    (typeof row.request_status === "string" ? row.request_status : "") ||
    ""
  ).toLowerCase().trim();
  return statusText.includes("completed");
};

const makeInitialForm = (isCreate, initialData) => {
  const base = {
    id: 0,
    store_no: "",
    request_date: "",
    request_type: "",
    request_type_text: "",
    request_type_id: 0,
    work_order_no: "",
    job_card_no: "",
    delivery_note_no: "",
    adjustment_no: "",
    item_id: 0,
    item_type: "RM",
    item_code: "",
    description: "",
    unit: "",
    qty_issue_requested: 0,
    qty_issue_processed: 0,
    current_stock: 0,
    request_status: 10,
    request_status_text: "Pending",
    requested_by: "",
    productDetails: [],
  };

  if (!initialData) {
    return base;
  }

  const resolvedReqTypeId = resolveRequestTypeId(
    initialData.request_type_id,
    initialData.request_type,
    initialData
  );

  const reqTypeText =
    initialData.request_type_text ||
    (typeof initialData.request_type === "string" && !/^\d+$/.test(initialData.request_type.trim()) ? initialData.request_type : "") ||
    "";

  const storeRequestLineId = initialData.store_request_line_id || initialData.storeRequestLineID || 0;
  const itemId = initialData.item_id || initialData.itemId || 0;
  const itemType = initialData.item_type || initialData.itemType || "RM";
  const workOrderId = initialData.work_order_id || 0;
  const workOrderLineId = initialData.work_order_line_id || 0;
  const jobCardId = initialData.job_card_id || 0;
  const purchaseOrderId = initialData.purchase_order_id || 0;
  const purchaseOrderLineId = initialData.purchase_order_line_id || 0;
  const grnId = initialData.grn_id || initialData.grnid || 0;
  const grnLineId = initialData.grn_line_id || 0;
  const deliveryNoteId = initialData.delivery_note_id || 0;
  const deliveryNoteLineId = initialData.delivery_note_line_id || 0;

  const productDetails = (Array.isArray(initialData.productDetails) && initialData.productDetails.length > 0)
    ? initialData.productDetails
    : [
      {
        batch_line_id: 0,
        work_order_id: workOrderId,
        work_order_line_id: workOrderLineId,
        job_card_id: jobCardId,
        purchase_order_id: purchaseOrderId,
        purchase_order_line_id: purchaseOrderLineId,
        grn_id: grnId,
        grn_line_id: grnLineId,
        delivery_note_id: deliveryNoteId,
        delivery_note_line_id: deliveryNoteLineId,
        store_request_id: initialData.store_request_id || initialData.id || 0,
        store_request_line_id: storeRequestLineId,
        batch_id: initialData.batch_id || 0,
        location_id: initialData.location_id || 1,
        request_type: resolvedReqTypeId,
        item_id: itemId,
        item_type: itemType,
        batch_no: (initialData.batch_no && initialData.batch_no !== "undefined" && initialData.batch_no !== "null") ? initialData.batch_no : "",
        qty_issue_requested: initialData.qty_issue_requested ?? 0,
        qty_issued: (initialData.qty_issued || initialData.qty_issue_processed) ? (initialData.qty_issued || initialData.qty_issue_processed) : "",
        unit: initialData.item_unit || initialData.unit || "",
        transaction_date: initialData.transaction_date ? String(initialData.transaction_date).split("T")[0] : new Date().toISOString().split("T")[0],
        transaction_by: initialData.transaction_by || getPreparedBy() || "",
        remarks: initialData.remarks || "",
      }
    ];

  return {
    id: initialData.id || initialData.store_request_id || 0,
    store_no: initialData.store_no || initialData.store_request_no || "",
    request_date: initialData.request_date ? String(initialData.request_date).split("T")[0] : "",
    request_type: reqTypeText || initialData.request_type_text || initialData.request_type || "",
    request_type_text: reqTypeText,
    request_type_id: resolvedReqTypeId,
    work_order_no: initialData.workorder_purchaseorder_no || initialData.work_order_no || "",
    job_card_no: initialData.job_card_no || "",
    delivery_note_no: initialData.delivery_note_no || "",
    adjustment_no: initialData.adjustment_no || initialData.adjustmentNo || "",
    store_request_line_id: storeRequestLineId,
    item_id: itemId,
    item_type: itemType,
    work_order_id: workOrderId,
    work_order_line_id: workOrderLineId,
    job_card_id: jobCardId,
    purchase_order_id: purchaseOrderId,
    purchase_order_line_id: purchaseOrderLineId,
    grn_id: grnId,
    grn_line_id: grnLineId,
    delivery_note_id: deliveryNoteId,
    delivery_note_line_id: deliveryNoteLineId,
    item_code: initialData.item_code || "",
    description: initialData.item_description || initialData.description || "",
    unit: initialData.item_unit || initialData.unit || "",
    qty_issue_requested: initialData.qty_issue_requested ?? 0,
    qty_issue_processed: initialData.qty_issue_processed ?? 0,
    qty_balance:
      initialData.qty_balance !== undefined && initialData.qty_balance !== null
        ? Number(Number(initialData.qty_balance).toFixed(4))
        : Number((Number(initialData.qty_issue_requested ?? 0) - Number(initialData.qty_issue_processed ?? 0)).toFixed(4)),
    current_stock: initialData.qty_available ?? initialData.current_stock ?? 0,
    request_status: initialData.request_status || 10,
    request_status_text: initialData.request_status_text || "Pending",
    requested_by: initialData.requested_by || "",
    productDetails: productDetails,
  };
};

const makeValidation = () => {
  return {};
};


const buildAndAllocateBatchDetails = (existingRows, availableBatches, meta = {}, qtyBalance, currentStock, excludedBatchNos = new Set()) => {
  const total = Math.min(Number(qtyBalance) || 0, Number(currentStock) || 0);
  let remaining = total;
  const result = [];

  const batches = Array.isArray(availableBatches) ? availableBatches : [];
  const rows = Array.isArray(existingRows) ? existingRows : [];

  // Build a lookup map of existing rows by batch_no and batchID to preserve user-entered values (like remarks)
  const existingRowMap = new Map();
  rows.forEach((r) => {
    if (!r) return;
    const bNo = String(r.batch_no || "").trim().toLowerCase();
    if (bNo && !existingRowMap.has(bNo)) {
      existingRowMap.set(bNo, r);
    }
    if (r.batch_id && !existingRowMap.has(`id_${r.batch_id}`)) {
      existingRowMap.set(`id_${r.batch_id}`, r);
    }
  });

  // 1. Keep existing saved database records (batch_line_id > 0)
  rows.forEach((row) => {
    if (row && row.batch_line_id && Number(row.batch_line_id) > 0) {
      result.push(row);
    }
  });

  // 2. Track how much qty each saved-batch has already consumed from their dropdown qty_available
  //    so we know if there is still remaining qty_available for that same batch name.
  const savedBatchAllocated = new Map(); // batchNo (lowercase) -> qty already issued in saved rows
  result.forEach((r) => {
    const bNo = String(r.batch_no || "").trim().toLowerCase();
    if (bNo) {
      savedBatchAllocated.set(bNo, (savedBatchAllocated.get(bNo) || 0) + Number(r.qty_issued || 0));
    }
  });

  const savedBatchNos = new Set(savedBatchAllocated.keys());

  // 3. Collect active non-saved batch names from rows
  const activeNewBatchNos = rows
    .filter((r) => !r.batch_line_id || Number(r.batch_line_id) === 0)
    .map((r) => String(r.batch_no || "").trim().toLowerCase())
    .filter(Boolean);

  // 4. Build candidate batches in priority order:
  //    (a) batches currently kept in unsaved rows (excluding deleted ones)
  //    (b) batches from availableBatches that still have qty_available not fully covered by saved rows
  const candidateBatches = [];
  // Track batch_nos already added to candidateBatches (to avoid double-adding new rows for same batch)
  const seenNewBatchNos = new Set();

  activeNewBatchNos.forEach((bNo) => {
    const opt = batches.find(
      (b) => String(b.value || "").trim().toLowerCase() === bNo
    );
    if (opt && !seenNewBatchNos.has(bNo)) {
      candidateBatches.push(opt);
      seenNewBatchNos.add(bNo);
    }
  });

  batches.forEach((b) => {
    if (!b || !b.value) return;
    const bNo = String(b.value).trim().toLowerCase();
    // Skip batches explicitly deleted by the user
    if (excludedBatchNos.has(bNo)) return;
    // Skip if already added as a candidate for new rows
    if (seenNewBatchNos.has(bNo)) return;

    const dropdownQtyAvail = Number(b.qty_available) || 0;

    if (savedBatchNos.has(bNo)) {
      // This batch already has a saved row. The dropdown qty_available is the CURRENT
      // available stock (after the prior issue). If there is still any qty_available,
      // allow an additional new row for it.
      if (dropdownQtyAvail > 0) {
        candidateBatches.push(b);
        seenNewBatchNos.add(bNo);
      }
    } else {
      // Brand new batch not in any saved row — always add as candidate
      candidateBatches.push(b);
      seenNewBatchNos.add(bNo);
    }
  });

  // 5. Sequentially allocate to candidate batches while remaining > 0
  for (const b of candidateBatches) {
    if (remaining <= 0) break;
    const batchQtyAvail = Number(b.qty_available) || 0;
    if (batchQtyAvail <= 0) continue;

    const allocated = Math.min(batchQtyAvail, remaining);
    if (allocated > 0) {
      remaining = Math.max(0, remaining - allocated);
      const bNoKey = String(b.value || "").trim().toLowerCase();
      const existingRow = existingRowMap.get(bNoKey) || (b.batchID ? existingRowMap.get(`id_${b.batchID}`) : null);

      result.push({
        batch_line_id: 0, // New row — always 0 so it gets saved as a new record
        work_order_id: existingRow?.work_order_id || meta.work_order_id || 0,
        work_order_line_id: existingRow?.work_order_line_id || meta.work_order_line_id || 0,
        job_card_id: existingRow?.job_card_id || meta.job_card_id || 0,
        purchase_order_id: existingRow?.purchase_order_id || meta.purchase_order_id || 0,
        purchase_order_line_id: existingRow?.purchase_order_line_id || meta.purchase_order_line_id || 0,
        grn_id: existingRow?.grn_id || meta.grn_id || 0,
        grn_line_id: existingRow?.grn_line_id || meta.grn_line_id || 0,
        delivery_note_id: existingRow?.delivery_note_id || meta.delivery_note_id || 0,
        delivery_note_line_id: existingRow?.delivery_note_line_id || meta.delivery_note_line_id || 0,
        store_request_id: existingRow?.store_request_id || meta.store_request_id || 0,
        store_request_line_id: existingRow?.store_request_line_id || meta.store_request_line_id || 0,
        batch_id: b.batchID || existingRow?.batch_id || 0,
        location_id: 1,
        request_type: existingRow?.request_type || meta.request_type || 0,
        item_id: existingRow?.item_id || meta.item_id || 0,
        item_type: existingRow?.item_type || meta.item_type || "",
        batch_no: (b.value && b.value !== "undefined" && b.value !== "null") ? b.value : (existingRow?.batch_no || ""),
        qty_issue_requested: existingRow?.qty_issue_requested ?? meta.qty_issue_requested ?? 0,
        qty_issued: allocated,
        unit: existingRow?.unit || meta.unit || "",
        transaction_date: new Date().toISOString().split("T")[0],
        transaction_by: getPreparedBy() || "",
        remarks: meta.remarks || "",
      });
    }
  }

  return result;
};

const SaveStockDeduction = forwardRef(
  ({ onSuccess, initialData, editMode: editModeProp, onDirtyChange, disabled, open = true, onStatusLoaded }, ref) => {
    const { showToast } = useToast();
    const validatedFormRef = useRef();

    const isNewMode = Number(initialData?.qty_issue_processed || 0) === 0;
    const isCreate = !initialData || isNewMode;
    const [editMode, setEditMode] = useState(
      disabled ? false : (editModeProp !== undefined ? editModeProp : isCreate)
    );
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [batchOptions, setBatchOptions] = useState([]);
    const [rowBatchErrors, setRowBatchErrors] = useState({});
    const fetchedIdRef = useRef(null);
    const savedBatchRecordsRef = useRef([]);
    const formDataMetaRef = useRef({});
    // Tracks batch nos that the user has explicitly deleted — they must not be re-allocated automatically
    const deletedBatchNosRef = useRef(new Set());
    // Ref for the table wrapper div to compute floating bar position
    const tableWrapperRef = useRef(null);
    const floatBarRef = useRef(null);
    const [floatBarStyle, setFloatBarStyle] = useState({ left: 0, width: 0, ready: false });

    useEffect(() => {
      if (disabled) setEditMode(false);
      else if (editModeProp !== undefined) setEditMode(editModeProp);
    }, [editModeProp, disabled]);

    const isDisabled = !isCreate && !editMode;
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, index: null });

    const initialValues = useMemo(() => makeInitialForm(isCreate, initialData), [isCreate, initialData]);
    const validation = useMemo(() => makeValidation(), []);

    const {
      isDirty: isFormDirty,
      onValuesChange,
      updateBaseline,
      setIsDirty,
      // resetDirty: resetFormDirty,
    } = useDirtyDraftDrawer({
      open,
      initialValues,
      initialData: isCreate ? null : initialData,
    });

    // Function to fetch Batch dropdown data based on item_id and item_type
    const loadBatchDropdown = useCallback(async (itemId, itemType) => {
      try {
        const argVal = (itemId !== undefined && itemId !== null && itemId !== "") ? String(itemId) : "";
        const argVal1 = itemType || "RM";
        const data = await getDropdownData("BatchNo", argVal, argVal1);
        if (Array.isArray(data)) {
          const mapped = data
            .filter((item) => item && (item.DisplayText || item.ValueText) && String(item.DisplayText) !== "undefined" && String(item.DisplayText) !== "null" && String(item.ValueText) !== "undefined" && String(item.ValueText) !== "null")
            .map((item) => {
              const text = item.DisplayText || (item.ValueText !== undefined && item.ValueText !== null ? String(item.ValueText) : "");
              const qtyAvail = item.qty_available !== undefined && item.qty_available !== null ? Number(item.qty_available) : null;
              const label = (qtyAvail !== null && !isNaN(qtyAvail))
                ? `${text} (CS - ${qtyAvail})`
                : text;
              return {
                value: text,
                label: label,
                batchID: item.ValueText,
                qty_available: qtyAvail !== null && !isNaN(qtyAvail) ? qtyAvail : 0,
                raw: item,
              };
            })
            .filter((opt) => opt.value && opt.value !== "undefined" && opt.value !== "null" && opt.label !== "undefined" && opt.label !== "null");
          setBatchOptions(mapped);
          return mapped;
        }
      } catch (err) {
        console.error("Error loading batch dropdown data:", err);
      }
      return [];
    }, []);

    // Initial load using initialData
    useEffect(() => {
      const initialItemId = initialData?.item_id || initialData?.itemId || "";
      const initialItemType = initialData?.item_type || initialData?.itemType || "RM";
      loadBatchDropdown(initialItemId, initialItemType);
    }, [initialData?.item_id, initialData?.itemId, initialData?.item_type, initialData?.itemType, loadBatchDropdown]);

    const getMergedBatchOptions = (currentBatch, row) => {
      const isExistingRow = Boolean(row?.batch_line_id && Number(row.batch_line_id) > 0);

      const baseOptions = (batchOptions || []).filter(
        (o) => o && o.value && String(o.value) !== "undefined" && String(o.value) !== "null" && String(o.label) !== "undefined" && String(o.label) !== "null"
      );

      const cleanCurrent = (currentBatch && String(currentBatch) !== "undefined" && String(currentBatch) !== "null")
        ? String(currentBatch).trim()
        : "";

      const cleanCurrentLower = cleanCurrent.toLowerCase();

      const mapped = baseOptions.map((o) => {
        if (cleanCurrent && String(o.value).trim().toLowerCase() === cleanCurrentLower) {
          // For existing rows in View and Edit mode, show only Batch No (e.g. A2)
          // For new rows (unsaved / new mode), show Batch No with Current Stock (e.g. A2 (CS - 350))
          return {
            ...o,
            label: isExistingRow ? o.value : (o.label || `${o.value} (CS - ${Number(o.qty_available) || 0})`),
          };
        }
        return o;
      });

      if (!cleanCurrent) {
        return mapped;
      }

      const exists = mapped.some((o) => String(o.value).trim().toLowerCase() === cleanCurrentLower);
      if (!exists) {
        return [{ value: cleanCurrent, label: cleanCurrent, batchID: row?.batch_id || 0, qty_available: 0 }, ...mapped];
      }
      return mapped;
    };

    useEffect(() => {
      async function loadDetails() {
        const storeRequestId = initialData?.store_request_id || initialData?.id;
        const storeRequestLineId = initialData?.store_request_line_id || initialData?.storeRequestLineID;
        if (storeRequestId || storeRequestLineId) {
          const fetchKey = `${storeRequestId || ""}_${storeRequestLineId || ""}`;
          if (fetchedIdRef.current === fetchKey) return;
          fetchedIdRef.current = fetchKey;

          setLoadingDetails(true);
          try {
            const payload = {
              storeRequestLineID: Number(storeRequestLineId || storeRequestId || 0),
            };

            const res = await fetchBatchDetailByStoreRequest(payload);

            if (res && res.Status === SUCCESS_STATUS && res.data) {
              const storeDetailsList = res.data.STORE_REQUEST_DETAILS_RESPONSE || [];
              const storeHeader = storeDetailsList[0] || {};
              const batchList = res.data.BATCH_DETAIL_BY_STORE_REQUEST_RESPONSE || [];
              const firstBatchItem = batchList[0] || {};

              const resolvedStoreRequestId = storeHeader.store_request_id || firstBatchItem.store_request_id || storeRequestId || 0;
              const resolvedStoreRequestLineId = storeHeader.store_request_line_id || firstBatchItem.store_request_line_id || storeRequestLineId || 0;
              const resolvedItemId = storeHeader.item_id || firstBatchItem.item_id || initialData?.item_id || initialData?.itemId || "";
              const resolvedItemType = storeHeader.item_type || firstBatchItem.item_type || initialData?.item_type || initialData?.itemType || "RM";
              const resolvedItemCode = storeHeader.item_code || firstBatchItem.item_code || initialData?.item_code || "";
              const resolvedItemDesc = storeHeader.item_description || firstBatchItem.item_description || initialData?.description || initialData?.item_description || "";
              const resolvedItemUnit = storeHeader.item_unit || firstBatchItem.item_unit || initialData?.unit || initialData?.item_unit || "";
              const resolvedWorkOrderId = storeHeader.work_order_id || firstBatchItem.work_order_id || initialData?.work_order_id || 0;
              const resolvedWorkOrderLineId = storeHeader.work_order_line_id || firstBatchItem.work_order_line_id || initialData?.work_order_line_id || 0;
              const resolvedJobCardId = storeHeader.job_card_id || firstBatchItem.job_card_id || initialData?.job_card_id || 0;
              const resolvedPurchaseOrderId = storeHeader.purchase_order_id || firstBatchItem.purchase_order_id || initialData?.purchase_order_id || 0;
              const resolvedPurchaseOrderLineId = storeHeader.purchase_order_line_id || firstBatchItem.purchase_order_line_id || initialData?.purchase_order_line_id || 0;
              const resolvedGrnId = storeHeader.grn_id || firstBatchItem.grn_id || initialData?.grn_id || initialData?.grnid || 0;
              const resolvedGrnLineId = storeHeader.grn_line_id || firstBatchItem.grn_line_id || initialData?.grn_line_id || 0;
              const resolvedDeliveryNoteId = storeHeader.delivery_note_id || firstBatchItem.delivery_note_id || initialData?.delivery_note_id || 0;
              const resolvedDeliveryNoteLineId = storeHeader.delivery_note_line_id || firstBatchItem.delivery_note_line_id || initialData?.delivery_note_line_id || 0;

              // Load batches with the resolved item_id and item_type
              let fetchedBatches = [];
              if (resolvedItemId) {
                fetchedBatches = await loadBatchDropdown(resolvedItemId, resolvedItemType);
              }

              const resolvedReqTypeId = resolveRequestTypeId(
                storeHeader.request_type,
                firstBatchItem.request_type,
                initialData?.request_type_id,
                initialData?.request_type,
                initialData
              );

              const reqTypeText =
                storeHeader.request_type_text ||
                firstBatchItem.request_type_text ||
                initialData?.request_type_text ||
                (typeof storeHeader.request_type === "string" && !/^\d+$/.test(storeHeader.request_type.trim()) ? storeHeader.request_type : "") ||
                (typeof initialData?.request_type === "string" && !/^\d+$/.test(initialData.request_type.trim()) ? initialData.request_type : "") ||
                "";

              let mappedProductDetails = [];
              if (batchList.length > 0) {
                mappedProductDetails = batchList.map((item) => ({
                  ...item,
                  batch_line_id: item.batch_line_id || 0,
                  work_order_id: item.work_order_id || resolvedWorkOrderId,
                  work_order_line_id: item.work_order_line_id || resolvedWorkOrderLineId,
                  job_card_id: item.job_card_id || resolvedJobCardId,
                  purchase_order_id: item.purchase_order_id || resolvedPurchaseOrderId,
                  purchase_order_line_id: item.purchase_order_line_id || resolvedPurchaseOrderLineId,
                  grn_id: item.grn_id || item.grnid || resolvedGrnId,
                  grn_line_id: item.grn_line_id || resolvedGrnLineId,
                  delivery_note_id: item.delivery_note_id || resolvedDeliveryNoteId,
                  delivery_note_line_id: item.delivery_note_line_id || resolvedDeliveryNoteLineId,
                  store_request_id: item.store_request_id || resolvedStoreRequestId,
                  store_request_line_id: item.store_request_line_id || resolvedStoreRequestLineId,
                  batch_id: item.batch_id || 0,
                  location_id: item.location_id || 1,
                  request_type: resolveRequestTypeId(item.request_type, item.transaction_type, resolvedReqTypeId),
                  item_id: item.item_id || resolvedItemId,
                  item_type: item.item_type || resolvedItemType,
                  batch_no: (item.batch_no && item.batch_no !== "undefined" && item.batch_no !== "null") ? item.batch_no : (storeHeader.batch_no && storeHeader.batch_no !== "undefined" && storeHeader.batch_no !== "null" ? storeHeader.batch_no : ""),
                  qty_issue_requested: item.qty_issue_requested ?? storeHeader.qty_issue_requested ?? initialData?.qty_issue_requested ?? 0,
                  qty_issued: item.qty_issued ?? item.qty_issue_processed ?? storeHeader.qty_issue_processed ?? initialData?.qty_issue_processed ?? "",
                  unit: item.item_unit || item.unit || resolvedItemUnit,
                  transaction_date: item.transaction_date ? String(item.transaction_date).split("T")[0] : new Date().toISOString().split("T")[0],
                  transaction_by: item.transaction_by || getPreparedBy() || "",
                  remarks: item.batch_remarks || item.store_request_remarks || item.remarks || storeHeader.remarks || initialData?.remarks || "",
                }));

                savedBatchRecordsRef.current = mappedProductDetails;
                const meta = {
                  work_order_id: resolvedWorkOrderId,
                  work_order_line_id: resolvedWorkOrderLineId,
                  job_card_id: resolvedJobCardId,
                  purchase_order_id: resolvedPurchaseOrderId,
                  purchase_order_line_id: resolvedPurchaseOrderLineId,
                  grn_id: resolvedGrnId,
                  grn_line_id: resolvedGrnLineId,
                  delivery_note_id: resolvedDeliveryNoteId,
                  delivery_note_line_id: resolvedDeliveryNoteLineId,
                  store_request_id: resolvedStoreRequestId,
                  store_request_line_id: resolvedStoreRequestLineId,
                  item_id: resolvedItemId,
                  item_type: resolvedItemType,
                  request_type: resolvedReqTypeId,
                  unit: resolvedItemUnit,
                  qty_issue_requested: storeHeader.qty_issue_requested ?? initialData?.qty_issue_requested ?? 0,
                  remarks: storeHeader.remarks || initialData?.remarks || "",
                };
                formDataMetaRef.current = meta;

                const qtyBalance =
                  storeHeader.qty_balance !== undefined && storeHeader.qty_balance !== null
                    ? Number(storeHeader.qty_balance)
                    : Number(storeHeader.qty_issue_requested ?? initialData?.qty_issue_requested ?? 0) -
                    Number(storeHeader.qty_issue_processed ?? initialData?.qty_issue_processed ?? 0);
                const currentStock = Number(
                  storeHeader.qty_available ?? storeHeader.current_stock ??
                  firstBatchItem.qty_available ?? firstBatchItem.current_stock ??
                  initialData?.qty_available ?? initialData?.current_stock ?? 0
                );

                if (editMode) {
                  mappedProductDetails = buildAndAllocateBatchDetails(mappedProductDetails, fetchedBatches, meta, qtyBalance, currentStock);
                }

              } else if (Array.isArray(fetchedBatches) && fetchedBatches.length > 0) {
                // In new mode: automatically populate all batches from dropdown list
                const qtyBalanceNew =
                  Number(storeHeader.qty_issue_requested ?? initialData?.qty_issue_requested ?? 0) -
                  Number(storeHeader.qty_issue_processed ?? initialData?.qty_issue_processed ?? 0);
                const currentStockNew = Number(
                  storeHeader.qty_available ?? storeHeader.current_stock ??
                  initialData?.qty_available ?? initialData?.current_stock ?? 0
                );

                const meta = {
                  work_order_id: resolvedWorkOrderId,
                  work_order_line_id: resolvedWorkOrderLineId,
                  job_card_id: resolvedJobCardId,
                  purchase_order_id: resolvedPurchaseOrderId,
                  purchase_order_line_id: resolvedPurchaseOrderLineId,
                  grn_id: resolvedGrnId,
                  grn_line_id: resolvedGrnLineId,
                  delivery_note_id: resolvedDeliveryNoteId,
                  delivery_note_line_id: resolvedDeliveryNoteLineId,
                  store_request_id: resolvedStoreRequestId,
                  store_request_line_id: resolvedStoreRequestLineId,
                  item_id: resolvedItemId,
                  item_type: resolvedItemType,
                  request_type: resolvedReqTypeId,
                  unit: resolvedItemUnit,
                  qty_issue_requested: storeHeader.qty_issue_requested ?? initialData?.qty_issue_requested ?? 0,
                  remarks: storeHeader.remarks || initialData?.remarks || "",
                };
                formDataMetaRef.current = meta;

                mappedProductDetails = buildAndAllocateBatchDetails([], fetchedBatches, meta, qtyBalanceNew, currentStockNew);
              } else {
                mappedProductDetails = [];
              }

              const updatedFormData = {
                id: resolvedStoreRequestId,
                store_no: storeHeader.store_request_no || firstBatchItem.store_request_no || initialData?.store_no || initialData?.store_request_no || "",
                request_date: storeHeader.request_date
                  ? String(storeHeader.request_date).split("T")[0]
                  : (firstBatchItem.request_date
                    ? String(firstBatchItem.request_date).split("T")[0]
                    : (initialData?.request_date ? String(initialData.request_date).split("T")[0] : "")),
                request_type: reqTypeText || storeHeader.request_type_text || firstBatchItem.request_type_text || initialData?.request_type_text || "",
                request_type_text: reqTypeText,
                request_type_id: resolvedReqTypeId,
                work_order_no: storeHeader.workorder_purchaseorder_no || firstBatchItem.workorder_purchaseorder_no || initialData?.work_order_no || "",
                job_card_no: storeHeader.job_card_no || firstBatchItem.job_card_no || initialData?.job_card_no || "",
                delivery_note_no: storeHeader.delivery_note_no || firstBatchItem.delivery_note_no || initialData?.delivery_note_no || "",
                adjustment_no: storeHeader.adjustment_no || firstBatchItem.adjustment_no || initialData?.adjustment_no || initialData?.adjustmentNo || "",
                store_request_line_id: resolvedStoreRequestLineId,
                item_id: resolvedItemId,
                item_type: resolvedItemType,
                work_order_id: resolvedWorkOrderId,
                work_order_line_id: resolvedWorkOrderLineId,
                job_card_id: resolvedJobCardId,
                purchase_order_id: resolvedPurchaseOrderId,
                purchase_order_line_id: resolvedPurchaseOrderLineId,
                grn_id: resolvedGrnId,
                grn_line_id: resolvedGrnLineId,
                delivery_note_id: resolvedDeliveryNoteId,
                delivery_note_line_id: resolvedDeliveryNoteLineId,
                item_code: resolvedItemCode,
                description: resolvedItemDesc,
                unit: resolvedItemUnit,
                qty_issue_requested: storeHeader.qty_issue_requested ?? firstBatchItem.qty_issue_requested ?? initialData?.qty_issue_requested ?? 0,
                qty_issue_processed: storeHeader.qty_issue_processed ?? firstBatchItem.qty_issue_processed ?? initialData?.qty_issue_processed ?? 0,
                qty_balance:
                  storeHeader.qty_balance !== undefined && storeHeader.qty_balance !== null
                    ? storeHeader.qty_balance
                    : initialData?.qty_balance !== undefined && initialData?.qty_balance !== null
                      ? initialData.qty_balance
                      : Number(storeHeader.qty_issue_requested ?? firstBatchItem.qty_issue_requested ?? initialData?.qty_issue_requested ?? 0) -
                      Number(storeHeader.qty_issue_processed ?? firstBatchItem.qty_issue_processed ?? initialData?.qty_issue_processed ?? 0),
                current_stock: storeHeader.qty_available ?? storeHeader.current_stock ?? firstBatchItem.qty_available ?? firstBatchItem.current_stock ?? initialData?.qty_available ?? initialData?.current_stock ?? 0,
                request_status: storeHeader.request_status || firstBatchItem.request_status || initialData?.request_status || 10,
                request_status_text: storeHeader.request_status_text || firstBatchItem.request_status_text || initialData?.request_status_text || "Pending",
                requested_by: storeHeader.requested_by || firstBatchItem.requested_by || initialData?.requested_by || "",
                productDetails: mappedProductDetails,
              };

              const loadedStatus = storeHeader.request_status || firstBatchItem.request_status || initialData?.request_status || 10;
              const loadedStatusText = storeHeader.request_status_text || firstBatchItem.request_status_text || initialData?.request_status_text || "Pending";
              if (typeof onStatusLoaded === "function") {
                onStatusLoaded({ request_status: loadedStatus, request_status_text: loadedStatusText });
              }

              if (validatedFormRef.current) {
                validatedFormRef.current.setValues(updatedFormData);
              }
              updateBaseline(updatedFormData);
            }
          } catch (err) {
            console.error("Error fetching batch details by store request:", err);
            showToast("Failed to load store request batch details.", ERROR_STATUS.toLowerCase());
          } finally {
            setLoadingDetails(false);
          }
        }
      }

      loadDetails();
    }, [isCreate, initialData, showToast, loadBatchDropdown, updateBaseline, editMode, onStatusLoaded]);

    // Track table wrapper position/width for floating bar
    useEffect(() => {
      const el = tableWrapperRef.current;
      if (!el) return;

      let prevLeft = null;
      let prevWidth = null;

      const update = () => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (prevLeft === null || Math.abs(rect.left - prevLeft) > 0.5 || Math.abs(rect.width - prevWidth) > 0.5) {
          prevLeft = rect.left;
          prevWidth = rect.width;
          setFloatBarStyle({ left: rect.left, width: rect.width, ready: true });
        }
        if (window.innerWidth > 1024) {
          if (floatBarRef.current && floatBarRef.current.scrollLeft !== el.scrollLeft) {
            floatBarRef.current.scrollLeft = el.scrollLeft;
          }
        } else {
          if (floatBarRef.current && floatBarRef.current.scrollLeft !== 0) {
            floatBarRef.current.scrollLeft = 0;
          }
        }
      };

      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);

      const handleTableScroll = () => {
        if (window.innerWidth > 1024) {
          if (floatBarRef.current && floatBarRef.current.scrollLeft !== el.scrollLeft) {
            floatBarRef.current.scrollLeft = el.scrollLeft;
          }
        } else {
          if (floatBarRef.current && floatBarRef.current.scrollLeft !== 0) {
            floatBarRef.current.scrollLeft = 0;
          }
        }
      };

      el.addEventListener("scroll", handleTableScroll, { passive: true });
      window.addEventListener("scroll", update, { passive: true, capture: true });
      window.addEventListener("resize", update, { passive: true });

      return () => {
        ro.disconnect();
        el.removeEventListener("scroll", handleTableScroll);
        window.removeEventListener("scroll", update, true);
        window.removeEventListener("resize", update);
      };
    }, []);

    // Dynamic toggle of remaining dropdown batches on Edit / Cancel Edit
    useEffect(() => {
      if (isCreate) return;
      if (!savedBatchRecordsRef.current || savedBatchRecordsRef.current.length === 0) return;

      const currentVals = validatedFormRef.current?.getValues() || {};

      if (editMode) {
        // When entering Edit mode -> clear deleted-batch tracking & re-allocate remaining rows
        deletedBatchNosRef.current = new Set();
        const meta = formDataMetaRef.current || {};
        const qtyBal = Number(currentVals.qty_balance ?? (Number(currentVals.qty_issue_requested ?? 0) - Number(currentVals.qty_issue_processed ?? 0)));
        const curStock = Number(currentVals.current_stock ?? 0);
        const newDetails = buildAndAllocateBatchDetails(savedBatchRecordsRef.current, batchOptions, meta, qtyBal, curStock, deletedBatchNosRef.current);
        if (validatedFormRef.current?.setFieldValue) {
          validatedFormRef.current.setFieldValue("productDetails", newDetails);
        }
        const hasNewAllocatedRows = Array.isArray(newDetails) && newDetails.some(
          (row) => !row.batch_line_id || Number(row.batch_line_id) === 0
        );
        const countChanged = Array.isArray(newDetails) && Array.isArray(savedBatchRecordsRef.current) && newDetails.length !== savedBatchRecordsRef.current.length;

        if (hasNewAllocatedRows || countChanged) {
          // New rows were added! The form has unsaved changes compared to the saved batch records in DB.
          // Keep baseline at savedBatchRecordsRef.current so the form is marked dirty.
          updateBaseline({ ...currentVals, productDetails: savedBatchRecordsRef.current });
          setIsDirty(true);
        } else {
          // No new rows were added on edit mode entry.
          // Synchronously update baseline so that merely entering edit mode does NOT mark form dirty.
          updateBaseline({ ...currentVals, productDetails: newDetails });
        }
      } else {
        // When cancelling Edit / switching to View mode -> Revert to saved batch records and clear deleted tracking
        deletedBatchNosRef.current = new Set();
        const revertedDetails = savedBatchRecordsRef.current;
        if (validatedFormRef.current?.setFieldValue) {
          validatedFormRef.current.setFieldValue("productDetails", revertedDetails);
        }
        // Synchronously update baseline with the reverted values so view mode is always clean.
        updateBaseline({ ...currentVals, productDetails: revertedDetails });
      }
    }, [editMode, batchOptions, isCreate, updateBaseline, setIsDirty]);

    useEffect(() => {
      if (onDirtyChange) onDirtyChange(isFormDirty);
    }, [isFormDirty, onDirtyChange]);

    const handleSubmit = async (values) => {
      setSubmitting(true);
      try {
        if (isCompletedStatus(initialData) || isCompletedStatus(values)) {
          showToast("Cannot edit this record because status is already Completed", ERROR_STATUS.toLowerCase());
          setSubmitting(false);
          return;
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const detailsList = Array.isArray(values.productDetails) ? values.productDetails : [];

        if (detailsList.length === 0) {
          showToast("Please add at least one stock detail.", ERROR_STATUS.toLowerCase());
          setSubmitting(false);
          return;
        }

        // Note: Duplicate Batch No is allowed (same batch can appear in multiple rows with different qty_issued)
        const payload = detailsList.map((row) => ({
          batchLineID: Number(row.batch_line_id || 0),
          workOrderID: Number(row.work_order_id || values.work_order_id || initialData?.work_order_id || 0),
          workOrderLineID: Number(row.work_order_line_id || values.work_order_line_id || initialData?.work_order_line_id || 0),
          jobCardID: Number(row.job_card_id || values.job_card_id || initialData?.job_card_id || 0),
          purchaseOrderID: Number(row.purchase_order_id || values.purchase_order_id || initialData?.purchase_order_id || 0),
          purchaseOrderLineID: Number(row.purchase_order_line_id || values.purchase_order_line_id || initialData?.purchase_order_line_id || 0),
          grnid: Number(row.grn_id || row.grnid || values.grn_id || initialData?.grn_id || initialData?.grnid || 0),
          grnLineID: Number(row.grn_line_id || values.grn_line_id || initialData?.grn_line_id || 0),
          deliveryNoteID: Number(row.delivery_note_id || values.delivery_note_id || initialData?.delivery_note_id || 0),
          deliveryNoteLineID: Number(row.delivery_note_line_id || values.delivery_note_line_id || initialData?.delivery_note_line_id || 0),
          transactionDate: row.transaction_date ? String(row.transaction_date).split("T")[0] : todayStr,
          transactionType: resolveRequestTypeId(
            row.request_type,
            values.request_type_id,
            initialData?.request_type_id,
            initialData?.request_type,
            initialData
          ),
          stockEffect: -1,
          storeRequestID: Number(row.store_request_id || values.id || initialData?.store_request_id || initialData?.id || 0),
          storeRequestLineID: Number(row.store_request_line_id || values.store_request_line_id || initialData?.store_request_line_id || initialData?.storeRequestLineID || 0),
          batchID: Number(row.batch_id || 0),
          locationID: Number(row.location_id || 1),
          quantityReceived: 0,
          quantityIssued: Number(row.qty_issued || 0),
          itemID: Number(row.item_id || values.item_id || initialData?.item_id || 0),
          itemType: row.item_type || values.item_type || initialData?.item_type || "RM",
          transactionBy: row.transaction_by || getPreparedBy() || "",
          remarks: row.remarks || values.remarks || ""
        }));

        const res = await saveAndUpdateBatchDetails(payload);

        if (res && (res.Status === SUCCESS_STATUS || res.status === SUCCESS_STATUS || res.statusCode === 200)) {
          const msg = res?.data?.BATCH_DETAIL_RESPONSE?.[0]?.Message || "Batch Details Saved Successfully !!!";
          showToast(msg, SUCCESS_STATUS);
          if (onSuccess) {
            onSuccess(values);
          }
        } else {
          const errMsg = res?.data?.BATCH_DETAIL_RESPONSE?.[0]?.Message || res?.message || "Failed to save Batch Details.";
          showToast(errMsg, ERROR_STATUS.toLowerCase());
        }
      } catch (err) {
        console.error("Save error:", err);
        showToast("An error occurred while saving Batch Details.", ERROR_STATUS.toLowerCase());
      } finally {
        setSubmitting(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => validatedFormRef.current?.submitForm(),
      hasUnsavedChanges: () => isFormDirty,
      isCompleted: () => {
        const vals = validatedFormRef.current?.values;
        return isCompletedStatus(vals) || isCompletedStatus(initialData);
      },
    }));

    return (
      <div className="sd-page-wrapper" style={{ position: "relative" }}>
        {(submitting || loadingDetails) && <Loader />}

        <ValidatedForm
          ref={validatedFormRef}
          initialValues={initialValues}
          validation={validation}
          onSubmit={handleSubmit}
          onValuesChange={onValuesChange}
          disabled={isDisabled || disabled}
        >
          {({ values, handleChange, handleBlur }) => {
            const handleRowChange = (index, field, val) => {
              const updatedDetails = (values.productDetails || []).map((item, i) => {
                if (i === index) {
                  return { ...item, [field]: val };
                }
                return item;
              });
              handleChange({ target: { name: "productDetails", value: updatedDetails } });
            };

            const totalQtyRequested = Number(values?.qty_issue_requested ?? initialData?.qty_issue_requested ?? 0);

            const totalQtyProcessed = Number((values.productDetails || []).reduce((sum, r) => {
              const q = Number(r?.qty_issued ?? r?.qty_issue_processed ?? 0);
              return sum + (isNaN(q) ? 0 : q);
            }, 0).toFixed(4));

            const totalQtyBalance = Number(Math.max(0, totalQtyRequested - totalQtyProcessed).toFixed(4));

            return (
              <>
                <div style={{ width: "100%", margin: "0 auto", paddingBottom: "80px" }}>
                  <div className={`row mb-1 sd-top-fields ${values?.adjustment_no || initialData?.adjustment_no || initialData?.adjustmentNo || values?.delivery_note_no || initialData?.delivery_note_no ? "has-single-ref" : "has-wo-job"}`}>
                    <div className="col-md-2 sd-field-request-no">
                      <FormField name="store_no" label="Request No" type="text" value={values?.store_no || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    <div className="col-md-2 sd-field-request-date">
                      <FormField name="request_date" label="Request Date" type="date" value={values?.request_date ? String(values.request_date).split("T")[0] : ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    <div className="col-md-2 sd-field-request-type">
                      <FormField name="request_type" label="Request Type" type="text" value={values?.request_type || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    {values?.adjustment_no || initialData?.adjustment_no || initialData?.adjustmentNo ? (
                      <div className="col-md-4 sd-field-adjustment-no">
                        <FormField
                          name="adjustment_no"
                          label="Stock Adjustment No"
                          type="text"
                          value={values?.adjustment_no || initialData?.adjustment_no || initialData?.adjustmentNo || ""}
                          disabled
                          style={{ background: "#f9fafb" }}
                        />
                      </div>
                    ) : values?.delivery_note_no || initialData?.delivery_note_no ? (
                      <div className="col-md-4 sd-field-delivery-note-no">
                        <FormField
                          name="delivery_note_no"
                          label="Delivery Note No"
                          type="text"
                          value={values?.delivery_note_no || initialData?.delivery_note_no || ""}
                          disabled
                          style={{ background: "#f9fafb" }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="col-md-2 sd-field-work-order-no">
                          <FormField name="work_order_no" label="WO No" type="text" value={values?.work_order_no || ""} disabled style={{ background: "#f9fafb" }} />
                        </div>

                        <div className="col-md-2 sd-field-job-card-no">
                          <FormField name="job_card_no" label="Job Card No" type="text" value={values?.job_card_no || ""} disabled style={{ background: "#f9fafb" }} />
                        </div>
                      </>
                    )}
                    <div className="col-md-2 sd-field-status">
                      <FormField name="request_status_text" label="Request Status" type="text" value={values?.request_status_text || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    <div className="col-md-2 sd-field-requested-by">
                      <FormField name="requested_by" label="Requested By" type="text" value={values?.requested_by || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    <div className="col-md-4 sd-field-item-code">
                      <FormField name="item_code" label="Item Code" type="text" value={values?.item_code || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    <div className="col-md-6 sd-field-description">
                      <FormField name="description" label="Description" type="text" value={values?.description || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                  </div>

                  {/* Product Details Section */}
                  <div className="card sd-product-card">
                    <div className="card-header sd-contact-details-header">
                      <div className="d-flex align-items-center justify-content-between w-100 sd-contact-details-header-content">
                        <div className="sd-contact-details-title-container">
                          <div className="sd-contact-details-title-wrapper">
                            <h5 style={{ fontSize: "16px", margin: 0, lineHeight: "1", color: "rgb(255, 255, 255)" }}>Stock Details</h5>
                          </div>
                        </div>

                        {/* Current Stock in between header label and Plus button */}
                        <div
                          className="d-flex align-items-center gap-2 mx-auto"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "14px" }}>
                            Current Stock:
                          </span>
                          <span
                            style={{
                              color: "#ffffff",
                              fontWeight: "bold",
                              fontSize: "15px",
                            }}
                          >
                            {values?.current_stock ?? initialData?.current_stock ?? initialData?.qty_available ?? 0}
                          </span>
                          {(values?.unit || initialData?.unit || initialData?.item_unit) && (
                            <span
                              style={{
                                color: "#ffffff",
                                fontWeight: "600",
                                fontSize: "13px",
                                opacity: 0.95,
                              }}
                            >
                              {values?.unit || initialData?.unit || initialData?.item_unit}
                            </span>
                          )}
                        </div>

                        <div className="d-flex align-items-center" style={{ flexShrink: 0 }}>
                          <button
                            className="btn btn-sm"
                            type="button"
                            disabled={isDisabled || disabled}
                            onClick={() => {
                              const meta = formDataMetaRef.current || {};
                              const qtyBal = Number(values.qty_balance ?? (Number(values.qty_issue_requested ?? 0) - Number(values.qty_issue_processed ?? 0)));
                              const curStock = Number(values.current_stock ?? 0);
                              const updatedDetails = buildAndAllocateBatchDetails(values.productDetails || [], batchOptions, meta, qtyBal, curStock);
                              if (updatedDetails.length > (values.productDetails || []).length) {
                                handleChange({ target: { name: "productDetails", value: updatedDetails } });
                              } else {
                                showToast("All available batch quantities have been allocated.", ERROR_STATUS.toLowerCase());
                              }
                            }}
                            style={{
                              background: isDisabled || disabled ? "#cccccc" : "#7A4B78",
                              color: "#fff",
                              borderRadius: "6px",
                              width: 33,
                              height: 33,
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                              cursor: isDisabled || disabled ? "not-allowed" : "pointer",
                              opacity: isDisabled || disabled ? 0.6 : 1,
                            }}
                            title={isDisabled || disabled ? "Click Edit to add rows" : "Add Row"}
                          >
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
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="card-body p-0">
                      <div ref={tableWrapperRef} className="table-responsive sd-table-responsive" style={{ overflowX: "auto", overflowY: "visible", width: "100%" }}>
                        <table className="table table-vcenter sd-table" style={{ width: "100%", tableLayout: "fixed", minWidth: "1080px" }}>
                          <thead className="sd-thead">
                            <tr>
                              <th className="sd-th sd-th-actions" style={{ width: "60px", textAlign: "center" }}>Actions</th>
                              <th className="sd-th" style={{ width: "45px", textAlign: "center" }}>S.No</th>
                              <th className="sd-th" style={{ width: "270px", textAlign: "center" }}>Batch No</th>
                              <th className="sd-th" style={{ width: "120px", textAlign: "center" }}>Qty Processed</th>
                              <th className="sd-th" style={{ width: "270px", textAlign: "center" }}>Remarks</th>
                              <th className="sd-th" style={{ width: "125px", textAlign: "center" }}>Transaction Date</th>
                              <th className="sd-th" style={{ width: "140px", textAlign: "center" }}>Transaction By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {!values.productDetails || values.productDetails.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="sd-td text-center text-muted py-4">
                                  No Products Added
                                </td>
                              </tr>
                            ) : (
                              values.productDetails.map((row, index) => {
                                const cleanBatchNo = (row.batch_no && row.batch_no !== "undefined" && row.batch_no !== "null") ? row.batch_no : "";
                                const isRowExisting = Boolean(row.batch_line_id && Number(row.batch_line_id) > 0);
                                // Only saved DB rows (batch_line_id > 0) cannot be deleted; new (unsaved) rows can always be deleted in edit mode
                                const isDeleteDisabled = isDisabled || disabled || isRowExisting;
                                const isRemarksDisabled = isRowExisting || isDisabled || disabled;
                                const rowBgColor = isRowExisting ? "#f4edf6" : "#ffffff";
                                const fieldBgColor = isRowExisting ? "#ece4ef" : "#f9fafb";

                                return (
                                  <tr
                                    key={index}
                                    className={isRowExisting ? "sd-row-existing" : "sd-row-new"}
                                    style={{ height: "45px", backgroundColor: rowBgColor }}
                                  >
                                    <td
                                      className="sd-td sd-td-actions"
                                      style={{ textAlign: "center", backgroundColor: rowBgColor }}
                                    >
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!isDeleteDisabled) {
                                            setDeleteDialog({ open: true, index });
                                          }
                                        }}
                                        disabled={isDeleteDisabled}
                                        style={{
                                          padding: "4px 8px",
                                          fontSize: "12px",
                                          background: "transparent",
                                          color: !isDeleteDisabled ? "rgb(22, 119, 255)" : "#cccccc",
                                          border: "none",
                                          cursor: !isDeleteDisabled ? "pointer" : "not-allowed",
                                          opacity: !isDeleteDisabled ? 1 : 0.4,
                                        }}
                                        title={isRowExisting ? "Cannot delete already created rows" : (isDisabled ? "Cannot delete in view mode" : "Delete row")}
                                      >
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
                                          <path d="M4 7h16" />
                                          <path d="M10 11v6" />
                                          <path d="M14 11v6" />
                                          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
                                          <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                                        </svg>
                                      </button>
                                    </td>

                                    <td className="sd-td" style={{ textAlign: "center", backgroundColor: rowBgColor }}>{index + 1}</td>

                                    <td className="sd-td" style={{ textAlign: "left", backgroundColor: rowBgColor }}>
                                      <ReactSelectField
                                        name={`productDetails.${index}.batch_no`}
                                        hideLabel
                                        options={getMergedBatchOptions(cleanBatchNo, row)}
                                        value={cleanBatchNo}
                                        error={rowBatchErrors[index] || undefined}
                                        disabled={true}
                                        placeholder={batchOptions.length === 0 ? "No data available" : "Select Batch"}
                                        noOptionsMessage={() => "No data available"}
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                      />
                                    </td>

                                    <td className="sd-td" style={{ textAlign: "right", backgroundColor: rowBgColor }}>
                                      <input
                                        type="number"
                                        className="form-control sd-input sd-text-right"
                                        value={row.qty_issued === 0 || row.qty_issued === "0" || row.qty_issued === null || row.qty_issued === undefined ? "" : row.qty_issued}
                                        disabled={true}
                                        style={{ background: fieldBgColor }}
                                      />
                                    </td>

                                    <td className="sd-td" style={{ backgroundColor: rowBgColor }}>
                                      <input
                                        type="text"
                                        className="form-control sd-input"
                                        value={row.remarks || ""}
                                        onChange={(e) => handleRowChange(index, "remarks", e.target.value)}
                                        onBlur={handleBlur}
                                        disabled={isRemarksDisabled}
                                        style={{ background: isRemarksDisabled ? fieldBgColor : "#ffffff" }}
                                      />
                                    </td>
                                    <td className="sd-td" style={{ textAlign: "center", backgroundColor: rowBgColor }}>
                                      <input type="date" className="form-control sd-input sd-text-center" value={row.transaction_date ? String(row.transaction_date).split("T")[0] : ""} disabled style={{ background: fieldBgColor }} />
                                    </td>

                                    <td className="sd-td" style={{ textAlign: "center", backgroundColor: rowBgColor }}>
                                      <input type="text" className="form-control sd-input sd-text-center" value={row.transaction_by || ""} disabled style={{ background: fieldBgColor }} />
                                    </td>

                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>

                <DeleteConfirmDialog
                  open={deleteDialog.open}
                  title="Confirm Delete"
                  message="this row"
                  onConfirm={() => {
                    if (deleteDialog.index !== null && deleteDialog.index !== undefined) {
                      const deletedRow = (values.productDetails || [])[deleteDialog.index];
                      // Track the deleted batch so it is not automatically re-allocated
                      if (deletedRow && deletedRow.batch_no && String(deletedRow.batch_no) !== "undefined" && String(deletedRow.batch_no) !== "null") {
                        deletedBatchNosRef.current = new Set(deletedBatchNosRef.current);
                        deletedBatchNosRef.current.add(String(deletedRow.batch_no).trim().toLowerCase());
                      }
                      const remainingRows = (values.productDetails || []).filter((_, i) => i !== deleteDialog.index);
                      setRowBatchErrors({});
                      const meta = formDataMetaRef.current || {};
                      const qtyBal = Number(values.qty_balance ?? (Number(values.qty_issue_requested ?? 0) - Number(values.qty_issue_processed ?? 0)));
                      const curStock = Number(values.current_stock ?? 0);
                      // Pass excludedBatchNos so deleted batches are never re-allocated
                      const updatedDetails = buildAndAllocateBatchDetails(remainingRows, batchOptions, meta, qtyBal, curStock, deletedBatchNosRef.current);
                      handleChange({ target: { name: "productDetails", value: updatedDetails } });
                    }
                    setDeleteDialog({ open: false, index: null });
                  }}
                  onCancel={() => setDeleteDialog({ open: false, index: null })}
                />

                {/* ── Floating Bottom Summary Bar for Total Qty Processed, Qty Requested & Qty Balance ── */}
                {floatBarStyle.ready && (
                  <div
                    ref={floatBarRef}
                    className="no-print sd-float-bar-container"
                    style={{
                      position: "fixed",
                      bottom: "20px",
                      left: floatBarStyle.left,
                      width: floatBarStyle.width,
                      backgroundColor: "#7A4B78",
                      color: "#ffffff",
                      borderRadius: "6px",
                      boxShadow: "0 6px 20px rgba(122, 75, 120, 0.4), 0 2px 6px rgba(0, 0, 0, 0.12)",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      zIndex: 1060,
                      backdropFilter: "blur(4px)",
                      userSelect: "none",
                      overflowX: "hidden",
                    }}
                  >
                    <table
                      className="table table-vcenter sd-float-bar-summary sd-float-bar-desktop"
                      style={{
                        width: "100%",
                        tableLayout: "fixed",
                        minWidth: "1080px",
                        margin: 0,
                        borderCollapse: "separate",
                        borderSpacing: 0,
                      }}
                    >
                      <colgroup>
                        {/* Actions */}
                        <col style={{ width: "60px" }} />
                        {/* S.No — merged with Batch No via colspan=2 */}
                        <col style={{ width: "45px" }} />
                        {/* Batch No */}
                        <col style={{ width: "270px" }} />
                        {/* Qty Processed — input sits exactly here */}
                        <col style={{ width: "120px" }} />
                        {/* Remarks */}
                        <col style={{ width: "270px" }} />
                        {/* Transaction Date */}
                        <col style={{ width: "125px" }} />
                        {/* Transaction By */}
                        <col style={{ width: "140px" }} />
                      </colgroup>
                      <tbody>
                        <tr style={{ height: "38px", background: "transparent" }}>

                          {/* ── Actions col: "Total" label ── */}
                          <td
                            style={{
                              padding: "4px 8px",
                              border: "none",
                              borderRight: "1px solid rgba(255, 255, 255, 0.3)",
                              textAlign: "center",
                              verticalAlign: "middle",
                              background: "transparent",
                            }}
                          >
                            <span style={{ fontSize: "13px", color: "#ffffff", fontWeight: "bold" }}>
                              Total
                            </span>
                          </td>

                          {/*
                            ── S.No + Batch No merged (colspan=2, width=315px) ──
                            Layout: flex row, justify-content: space-between
                            Left side:  "Qty Requested :" label + 120px input
                            Divider:    Full-height vertical line matching borderRight style
                            Right side: "Qty Processed :" label with Current Stock badge style
                          */}
                          <td
                            colSpan={2}
                            style={{
                              padding: 0,
                              border: "none",
                              verticalAlign: "middle",
                              background: "transparent",
                              overflow: "hidden",
                              height: "38px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                height: "38px",
                                padding: "0 8px",
                                gap: "4px",
                              }}
                            >
                              {/* Left: Qty Requested label + input */}
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "#ffffff",
                                    fontWeight: 600,
                                    opacity: 0.95,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Qty Requested :
                                </span>
                                <input
                                  type="text"
                                  className="form-control sd-input sd-text-right"
                                  value={totalQtyRequested}
                                  disabled
                                  style={{
                                    width: "120px",
                                    minWidth: "120px",
                                    maxWidth: "120px",
                                    background: "#ece4ef",
                                    color: "#7A4B78",
                                    fontWeight: "bold",
                                    fontSize: "13px",
                                    height: "28px",
                                  }}
                                />
                              </div>

                              {/* Vertical divider line: Full height (38px) matching other td borders */}
                              <div
                                style={{
                                  width: "1px",
                                  height: "38px",
                                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                                  flexShrink: 0,
                                  margin: "0 4px",
                                }}
                              />

                              {/* Right: "Qty Processed :" label (same plain text style as Qty Requested & Qty Balance) */}
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#ffffff",
                                  fontWeight: 600,
                                  opacity: 0.95,
                                  whiteSpace: "nowrap",
                                  textAlign: "right",
                                  flexShrink: 0,
                                }}
                              >
                                Qty Processed :
                              </span>
                            </div>
                          </td>

                          {/*
                            ── Qty Processed col (120px) ──
                          */}
                          <td
                            style={{
                              padding: "4px 8px",
                              border: "none",
                              borderLeft: "none",
                              borderRight: "1px solid rgba(255, 255, 255, 0.3)",
                              verticalAlign: "middle",
                              background: "transparent",
                            }}
                          >
                            <input
                              type="text"
                              className="form-control sd-input sd-text-right"
                              value={totalQtyProcessed}
                              disabled
                              style={{
                                width: "100%",
                                background: "#ece4ef",
                                color: "#7A4B78",
                                fontWeight: "bold",
                                fontSize: "13px",
                                height: "28px",
                              }}
                            />
                          </td>

                          {/*
                            ── Remarks + Transaction Date + Transaction By merged (colspan=3) ──
                            "Qty Balance :" label + input
                          */}
                          <td
                            colSpan={3}
                            style={{
                              padding: "4px 12px",
                              border: "none",
                              verticalAlign: "middle",
                              background: "transparent",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#ffffff",
                                  fontWeight: 600,
                                  opacity: 0.95,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Qty Balance :
                              </span>
                              <input
                                type="text"
                                className="form-control sd-input sd-text-right"
                                value={totalQtyBalance}
                                disabled
                                style={{
                                  width: "120px",
                                  minWidth: "120px",
                                  maxWidth: "120px",
                                  background: "#ece4ef",
                                  color: "#7A4B78",
                                  fontWeight: "bold",
                                  fontSize: "13px",
                                  height: "28px",
                                }}
                              />
                            </div>
                          </td>

                        </tr>
                      </tbody>
                    </table>

                    {/* ── Tablet & Mobile Responsive Layout (Fits 100% visible width) ── */}
                    <div className="sd-float-bar-tablet">
                      <div className="sd-float-bar-total-badge">
                        <span>Total</span>
                      </div>

                      <div className="sd-float-bar-divider" />

                      <div className="sd-float-bar-item">
                        <span className="sd-float-bar-label">Qty Requested :</span>
                        <input
                          type="text"
                          className="form-control sd-input sd-text-right sd-float-bar-input"
                          value={totalQtyRequested}
                          disabled
                        />
                      </div>

                      <div className="sd-float-bar-divider" />

                      <div className="sd-float-bar-item">
                        <span className="sd-float-bar-label">Qty Processed :</span>
                        <input
                          type="text"
                          className="form-control sd-input sd-text-right sd-float-bar-input"
                          value={totalQtyProcessed}
                          disabled
                        />
                      </div>

                      <div className="sd-float-bar-divider" />

                      <div className="sd-float-bar-item">
                        <span className="sd-float-bar-label">Qty Balance :</span>
                        <input
                          type="text"
                          className="form-control sd-input sd-text-right sd-float-bar-input"
                          value={totalQtyBalance}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          }}
        </ValidatedForm>
      </div>
    );
  }
);

SaveStockDeduction.displayName = "SaveStockDeduction";
export default SaveStockDeduction;
