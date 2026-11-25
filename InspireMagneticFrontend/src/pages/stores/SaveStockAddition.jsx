import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
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
import { SUCCESS_STATUS, ERROR_STATUS } from "../../utils/ConstVariables";
import { getPreparedBy } from "../../utils/userSession";
import "./SaveStockAddition.css";

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
    po_no: "",
    grn_no: "",
    work_order_no: "",
    job_card_no: "",
    delivery_note_no: "",
    adjustment_no: "",
    store_request_line_id: 0,
    item_id: 0,
    item_type: "FG",
    work_order_id: 0,
    work_order_line_id: 0,
    job_card_id: 0,
    purchase_order_id: 0,
    purchase_order_line_id: 0,
    grn_id: 0,
    grn_line_id: 0,
    delivery_note_id: 0,
    delivery_note_line_id: 0,
    item_code: "",
    description: "",
    unit: "",
    qty_receive_requested: 0,
    qty_receive_processed: 0,
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
  const itemType = initialData.item_type || initialData.itemType || "FG";
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
        store_request_id: initialData.id || initialData.store_request_id || 0,
        store_request_line_id: storeRequestLineId,
        batch_id: initialData.batch_id || 0,
        location_id: initialData.location_id || 1,
        request_type: resolvedReqTypeId,
        item_id: itemId,
        item_type: itemType,
        batch_no: initialData.batch_no || "",
        qty_receive_requested: initialData.qty_receive_requested ?? 0,
        qty_received: initialData.qty_received ?? initialData.qty_receive_processed ?? initialData.qty_receive_requested ?? 0,
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
    po_no: initialData.workorder_purchaseorder_no || initialData.work_order_no || initialData.po_no || "",
    grn_no: initialData.grn_no || "",
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
    qty_receive_requested: initialData.qty_receive_requested ?? 0,
    qty_receive_processed: initialData.qty_receive_processed ?? 0,
    request_status: initialData.request_status || 10,
    request_status_text: initialData.request_status_text || "Pending",
    requested_by: initialData.requested_by || "",
    productDetails: productDetails,
  };
};

const makeValidation = () => {
  return {};
};

const SaveStockAddition = forwardRef(
  ({ onSuccess, initialData, editMode: editModeProp, onDirtyChange, disabled, open = true, onStatusLoaded }, ref) => {
    const { showToast } = useToast();
    const validatedFormRef = useRef();

    const isNewMode = Number(initialData?.qty_receive_processed || 0) === 0;
    const isCreate = !initialData || isNewMode;
    const [editMode, setEditMode] = useState(
      disabled ? false : (editModeProp !== undefined ? editModeProp : isCreate)
    );
    const [loadingDetails, setLoadingDetails] = useState(false);
    const fetchedIdRef = useRef(null);

    useEffect(() => {
      if (disabled) setEditMode(false);
      else if (editModeProp !== undefined) setEditMode(editModeProp);
      else setEditMode(isCreate);
    }, [editModeProp, disabled, isCreate]);

    const isDisabled = !isCreate && !editMode;
    const [submitting, setSubmitting] = useState(false);

    const initialValues = useMemo(() => makeInitialForm(isCreate, initialData), [isCreate, initialData]);
    const validation = useMemo(() => makeValidation(), []);

    const {
      isDirty: isFormDirty,
      onValuesChange,
      updateBaseline,
      // resetDirty: resetFormDirty,
    } = useDirtyDraftDrawer({
      open,
      initialValues,
      initialData: isCreate ? null : initialData,
    });

    useEffect(() => {
      if (isCreate && validatedFormRef.current?.setValues) {
        const freshVals = makeInitialForm(isCreate, initialData);
        validatedFormRef.current.setValues(freshVals);
        updateBaseline(freshVals);
      }
    }, [isCreate, initialData, updateBaseline]);

    useEffect(() => {
      async function loadDetails() {
        const storeRequestId = initialData?.store_request_id || initialData?.id;
        const storeRequestLineId = initialData?.store_request_line_id || initialData?.storeRequestLineID;
        if (!isCreate && (storeRequestId || storeRequestLineId)) {
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
              const resolvedItemId = storeHeader.item_id || firstBatchItem.item_id || initialData?.item_id || 0;
              const resolvedItemType = storeHeader.item_type || firstBatchItem.item_type || initialData?.item_type || "FG";
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
                  batch_no: item.batch_no || storeHeader.batch_no || initialData?.batch_no || (item.batch_id ? String(item.batch_id) : "") || "",
                  qty_receive_requested: item.qty_receive_requested ?? storeHeader.qty_receive_requested ?? initialData?.qty_receive_requested ?? 0,
                  qty_received: item.qty_received ?? item.qty_receive_processed ?? storeHeader.qty_receive_processed ?? initialData?.qty_receive_processed ?? 0,
                  unit: item.item_unit || item.unit || resolvedItemUnit,
                  transaction_date: item.transaction_date ? String(item.transaction_date).split("T")[0] : "",
                  transaction_by: item.transaction_by || "",
                  remarks: item.batch_remarks || item.store_request_remarks || item.remarks || storeHeader.remarks || initialData?.remarks || "",
                }));
              } else {
                mappedProductDetails = [
                  {
                    batch_line_id: 0,
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
                    batch_id: 0,
                    location_id: 1,
                    request_type: resolvedReqTypeId,
                    item_id: resolvedItemId,
                    item_type: resolvedItemType,
                    batch_no: storeHeader.batch_no || initialData?.batch_no || "",
                    qty_receive_requested: storeHeader.qty_receive_requested ?? initialData?.qty_receive_requested ?? 0,
                    qty_received: storeHeader.qty_received ?? storeHeader.qty_receive_processed ?? initialData?.qty_received ?? initialData?.qty_receive_processed ?? storeHeader.qty_receive_requested ?? initialData?.qty_receive_requested ?? 0,
                    unit: resolvedItemUnit,
                    transaction_date: new Date().toISOString().split("T")[0],
                    transaction_by: getPreparedBy() || "",
                    remarks: storeHeader.remarks || initialData?.remarks || "",
                  }
                ];
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
                po_no: storeHeader.workorder_purchaseorder_no || firstBatchItem.workorder_purchaseorder_no || initialData?.work_order_no || initialData?.po_no || "",
                grn_no: storeHeader.grn_no || firstBatchItem.grn_no || initialData?.grn_no || "",
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
                qty_receive_requested: storeHeader.qty_receive_requested ?? firstBatchItem.qty_receive_requested ?? initialData?.qty_receive_requested ?? 0,
                qty_receive_processed: storeHeader.qty_receive_processed ?? firstBatchItem.qty_receive_processed ?? initialData?.qty_receive_processed ?? 0,
                qty_available: storeHeader.qty_available ?? initialData?.qty_available ?? 0,
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
    }, [isCreate, initialData, showToast, updateBaseline, onStatusLoaded]);

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
          stockEffect: 1,
          storeRequestID: Number(values.id || row.store_request_id || initialData?.store_request_id || 0),
          storeRequestLineID: Number(row.store_request_line_id || values.store_request_line_id || initialData?.store_request_line_id || initialData?.storeRequestLineID || 0),
          batchID: Number(row.batch_id || 0),
          locationID: Number(row.location_id || 1),
          quantityReceived: Number(row.qty_receive_requested ?? values.qty_receive_requested ?? 0),
          quantityIssued: 0,
          itemID: Number(row.item_id || values.item_id || initialData?.item_id || 0),
          itemType: row.item_type || values.item_type || initialData?.item_type || "FG",
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
      <div className="sa-page-wrapper" style={{ position: "relative" }}>
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

            return (
              <>
                <div style={{ width: "100%", margin: "0 auto" }}>
                  <div className={`row mb-1 sa-top-fields ${values?.adjustment_no || initialData?.adjustment_no || initialData?.adjustmentNo ? "has-adjustment" : "has-grn"}`}>
                    <div className="col-md-2 sa-field-request-no">
                      <FormField name="store_no" label="Request No" type="text" value={values?.store_no || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    <div className="col-md-2 sa-field-request-date">
                      <FormField name="request_date" label="Request Date" type="date" value={values?.request_date ? String(values.request_date).split("T")[0] : ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    <div className="col-md-2 sa-field-request-type">
                      <FormField name="request_type" label="Request Type" type="text" value={values?.request_type || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>

                    {values?.adjustment_no || initialData?.adjustment_no || initialData?.adjustmentNo ? (
                      <div className="col-md-4 sa-field-adjustment-no">
                        <FormField
                          name="adjustment_no"
                          label="Stock Adjustment No"
                          type="text"
                          value={values?.adjustment_no || initialData?.adjustment_no || initialData?.adjustmentNo || ""}
                          disabled
                          style={{ background: "#f9fafb" }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="col-md-2 sa-field-grn-no">
                          <FormField name="grn_no" label="GRN No" type="text" value={values?.grn_no || ""} disabled style={{ background: "#f9fafb" }} />
                        </div>
                        <div className="col-md-2 sa-field-po-no">
                          <FormField name="po_no" label="WO No / PO No" type="text" value={values?.po_no || ""} disabled style={{ background: "#f9fafb" }} />
                        </div>
                      </>
                    )}
                    <div className="col-md-2 sa-field-status">
                      <FormField name="request_status_text" label="Request Status" type="text" value={values?.request_status_text || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    <div className="col-md-2 sa-field-requested-by">
                      <FormField name="requested_by" label="Requested By" type="text" value={values?.requested_by || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    <div className="col-md-4 sa-field-item-code">
                      <FormField name="item_code" label="Item Code" type="text" value={values?.item_code || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                    <div className="col-md-6 sa-field-description">
                      <FormField name="description" label="Description" type="text" value={values?.description || ""} disabled style={{ background: "#f9fafb" }} />
                    </div>
                  </div>


                  {/* Product Details Section */}
                  <div className="card sa-product-card">
                    <div className="card-header sa-contact-details-header">
                      <div className="d-flex flex-wrap align-items-center justify-content-between w-100 sa-contact-details-header-content">
                        <div className="sa-contact-details-title-container">
                          <div className="sd-contact-details-title-wrapper">
                            <h5 style={{ fontSize: "16px", margin: 0, lineHeight: "1", color: "rgb(255, 255, 255)" }}>Stock Details</h5>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive sa-table-responsive" style={{ overflowX: "auto", overflowY: "visible", width: "100%" }}>
                        <table className="table table-vcenter sa-table" style={{ width: "100%", tableLayout: "fixed", minWidth: "1100px" }}>
                          <thead className="sa-thead">
                            <tr>
                              <th className="sa-th" style={{ width: "60px", textAlign: "center" }}>S.No</th>
                              <th className="sa-th" style={{ width: "160px", textAlign: "center" }}>Batch No</th>
                              <th className="sa-th" style={{ width: "150px", textAlign: "center" }}>Qty Requested</th>
                              <th className="sa-th" style={{ width: "160px", textAlign: "center" }}>Qty Processed</th>
                              <th className="sa-th" style={{ width: "90px", textAlign: "center" }}>Unit</th>
                              <th className="sa-th" style={{ width: "150px", textAlign: "center" }}>Transaction Date</th>
                              <th className="sa-th" style={{ width: "160px", textAlign: "center" }}>Transaction By</th>
                              <th className="sa-th" style={{ width: "170px", textAlign: "center" }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {values.productDetails.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="sa-td text-center text-muted py-3">
                                  No Products Added
                                </td>
                              </tr>
                            ) : (
                              values.productDetails.map((row, index) => (
                                <tr key={index} style={{ height: "45px" }}>
                                  <td className="sa-td" style={{ textAlign: "center" }}>{index + 1}</td>
                                  <td className="sa-td" style={{ textAlign: "center" }}>
                                    <input
                                      type="text"
                                      className="form-control sa-input sa-text-center"
                                      value={row.batch_no || ""}
                                      disabled
                                      style={{ background: "#f9fafb" }}
                                    />
                                  </td>

                                  <td className="sa-td" style={{ textAlign: "right" }}>
                                    <input
                                      type="number"
                                      className="form-control sa-input sa-text-right"
                                      value={row.qty_receive_requested ?? values.qty_receive_requested ?? 0}
                                      disabled
                                      style={{ background: "#f9fafb" }}
                                    />
                                  </td>
                                  <td className="sa-td" style={{ textAlign: "right" }}>
                                    <input
                                      type="number"
                                      className="form-control sa-input sa-text-right"
                                      value={row.qty_received ?? 0}
                                      onChange={(e) => handleRowChange(index, "qty_received", e.target.value)}
                                      onBlur={handleBlur}
                                      disabled
                                      style={{ background: isDisabled ? "#f9fafb" : "#ffffff" }}
                                    />
                                  </td>

                                  <td className="sa-td" style={{ textAlign: "center" }}>
                                    <input
                                      type="text"
                                      className="form-control sa-input sa-text-center"
                                      value={row.unit || values.unit || ""}
                                      disabled
                                      style={{ background: "#f9fafb" }}
                                    />
                                  </td>
                                  <td className="sa-td" style={{ textAlign: "center" }}>
                                    <input type="date" className="form-control sa-input sa-text-center" value={row.transaction_date ? String(row.transaction_date).split("T")[0] : ""} disabled style={{ background: "#f9fafb" }} />
                                  </td>
                                  <td className="sa-td" style={{ textAlign: "center" }}>
                                    <input type="text" className="form-control sa-input sa-text-center" value={row.transaction_by || ""} disabled style={{ background: "#f9fafb" }} />
                                  </td>
                                  <td className="sa-td">
                                    <input
                                      type="text"
                                      className="form-control sa-input"
                                      value={row.remarks || ""}
                                      onChange={(e) => handleRowChange(index, "remarks", e.target.value)}
                                      onBlur={handleBlur}
                                      disabled={isDisabled}
                                      style={{ background: isDisabled ? "#f9fafb" : "#ffffff" }}
                                    />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            );
          }}
        </ValidatedForm>
      </div>
    );
  }
);

SaveStockAddition.displayName = "SaveStockAddition";
export default SaveStockAddition;
