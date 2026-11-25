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
import { DeleteConfirmDialog } from "../../components/Notification";
import { useToast } from "../../components/useToast";
import Loader from "../../components/Loader";
import {
  getAdjustmentReasonOptions,
  getStockAdjustmentItems,
  fetchStockAdjustmentRequestDetails,
  saveAndUpdateStockAdjustmentRequestDetails,
} from "../../services/storeService.js";
import { getPreparedBy } from "../../utils/userSession";
import { INTEGER_QTY_REGEX, DECIMAL_QTY_REGEX } from "../../utils/regexUtils";
import {
  SUCCESS_STATUS,
  ERROR_STATUS,
  PARAM_TYPE_ADD,
  isAdjustmentCompleted,
  isAdjustmentApproved,
  isAdjustmentCancelled,
} from "../../utils/ConstVariables";
import "./SaveStockAdjustment.css";

const formatAdjustmentTypeText = (type) => {
  if (!type) return "Stock Addition";
  const str = String(type).trim().toLowerCase();
  if (str === "1" || str.includes("add")) return "Stock Addition";
  if (str === "2" || str.includes("deduct")) return "Stock Deduction";
  return "Stock Addition";
};

const getDraftKey = (type) => {
  const norm = formatAdjustmentTypeText(type);
  if (norm === "Stock Deduction") {
    return "draft_stock_adjustment_deduction_create";
  }
  return "draft_stock_adjustment_addition_create";
};

// ── Initial form values ─────────────────────────────────────────────────────────
const makeInitialForm = (isCreate, initialData, adjustmentType) => {
  const currentDate = new Date().toISOString().split("T")[0];
  const initialTypeText = formatAdjustmentTypeText(adjustmentType);
  const preparedBy = getPreparedBy() || "";

  const base = {
    id: 0,
    adjustment_no: "0",
    adjustment_date: currentDate,
    adjustment_type: initialTypeText,
    adjustment_reason: "",
    request_status: 1,
    request_status_text: "Pending",
    requested_by: preparedBy,
    remarks: "",
    approved_by: "",
    approved_date: "",
    productDetails: [],
  };

  if (!initialData) return base;

  // 1. Resolve header fields
  const header =
    (Array.isArray(initialData.STOCK_ADJUSTMENT_REQUEST_HEADER_DETAILS) &&
      initialData.STOCK_ADJUSTMENT_REQUEST_HEADER_DETAILS[0]) ||
    initialData;

  const rawDate = header.adjustment_date || header.request_date;
  const formattedDate = rawDate ? String(rawDate).split("T")[0] : currentDate;

  const typeText = formatAdjustmentTypeText(
    header.adjustment_type_text ||
    header.request_type_text ||
    header.adjustment_type ||
    adjustmentType
  );

  // 2. Resolve items / productDetails
  const rawDetails =
    initialData.STOCK_ADJUSTMENT_REQUEST_DETAILS ||
    initialData.productDetails ||
    header.productDetails ||
    [];

  let details = [];
  if (Array.isArray(rawDetails) && rawDetails.length > 0) {
    details = rawDetails.map((item, idx) => ({
      id: item.adjustment_line_id || item.id || idx + 1,
      adjustment_line_id: item.adjustment_line_id,
      adjustment_id: item.adjustment_id || header.adjustment_id || 0,
      item_id: item.item_id || item.ItemID || 0,
      item_code: item.item_code || item.ItemCode || "",
      description: item.item_description || item.ItemDescription || item.description || "",
      unit: item.item_unit || item.ItemUnit || item.unit || "",
      qty_receive_requested:
        item.qty_receive_requested !== undefined && item.qty_receive_requested !== null
          ? String(item.qty_receive_requested)
          : "",
      qty_issue_requested:
        item.qty_issue_requested !== undefined && item.qty_issue_requested !== null
          ? String(item.qty_issue_requested)
          : "",
      item_type: item.item_type || item.ItemType || "",
      batch_no: item.batch_no || "",
      isNew: false,
    }));
  }

  const reasonId =
    header.adjustment_reason_id !== undefined && header.adjustment_reason_id !== null
      ? header.adjustment_reason_id
      : header.adjustment_reason;

  return {
    id: header.adjustment_id || header.stock_adjustment_id || header.id || 0,
    adjustment_no: header.adjustment_no || header.store_request_no || header.store_no || (isCreate ? "0" : ""),
    adjustment_date: formattedDate,
    adjustment_type: typeText,
    adjustment_reason: reasonId !== undefined && reasonId !== null ? String(reasonId) : "",
    request_status: header.request_status || header.status_id || 1,
    request_status_text: header.request_status_text || header.status_text || "Pending",
    requested_by: header.requested_by || header.prepared_by || (isCreate ? preparedBy : ""),
    remarks: header.remarks || "",
    approved_by: header.approved_by || "",
    approved_date: header.approved_date ? String(header.approved_date).split("T")[0] : "",
    productDetails: details,
  };
};

const makeValidation = () => ({
  adjustment_reason: {
    required: true,
    controlType: "dropdown",
    fieldLabel: "Adjustment Reason",
    requiredMessage: "Select The Adjustment Reason.",
  },
});

// ── Component ───────────────────────────────────────────────────────────────────
const SaveStockAdjustment = forwardRef(
  ({ onSuccess, initialData, editMode: editModeProp, onDirtyChange, disabled, open = true, adjustmentType }, ref) => {
    const { showToast } = useToast();
    const validatedFormRef = useRef();

    const [adjustmentReasonOptions, setAdjustmentReasonOptions] = useState([]);
    const [itemCodeOptions, setItemCodeOptions] = useState([]);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [productErrors, setProductErrors] = useState({});
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [fetchedData, setFetchedData] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, index: null });

    // Fetch dropdown options on mount
    useEffect(() => {
      let isMounted = true;
      const fetchDropdowns = async () => {
        try {
          const [reasonsRes, itemsRes] = await Promise.all([
            getAdjustmentReasonOptions(),
            getStockAdjustmentItems(),
          ]);
          if (!isMounted) return;

          // 1. Adjustment Reasons
          const reasonList = Array.isArray(reasonsRes)
            ? reasonsRes
            : reasonsRes?.data?.data?.DROPDOWN_LIST || reasonsRes?.data?.DROPDOWN_LIST || reasonsRes?.DROPDOWN_LIST || [];
          const formattedReasons = reasonList.map((item) => ({
            value: String(item.ValueText ?? item.value ?? ""),
            label: String(item.DisplayText ?? item.label ?? ""),
          }));
          setAdjustmentReasonOptions(formattedReasons);

          // 2. Stock Adjustment Items
          const itemsList = Array.isArray(itemsRes)
            ? itemsRes
            : itemsRes?.data?.data?.DROPDOWN_LIST || itemsRes?.data?.DROPDOWN_LIST || itemsRes?.DROPDOWN_LIST || [];
          const formattedItems = itemsList.map((item) => ({
            value: item.ItemCode ?? item.item_code ?? "",
            label: `${item.ItemCode ?? ""}`,
            item_id: item.ItemID ?? item.item_id ?? 0,
            item_code: item.ItemCode ?? item.item_code ?? "",
            description: item.ItemDescription ?? item.item_description ?? "",
            unit: item.ItemUnit ?? item.item_unit ?? "",
            item_type: item.ItemType ?? item.item_type ?? "",
          }));
          setItemCodeOptions(formattedItems);
        } catch (err) {
          console.error("Error fetching dropdown options:", err);
        }
      };

      fetchDropdowns();
      return () => {
        isMounted = false;
      };
    }, []);

    // Fetch stock adjustment request details if viewing an existing record
    useEffect(() => {
      const adjId =
        initialData?.adjustment_id ||
        initialData?.stock_adjustment_id ||
        initialData?.id;

      if (!adjId) {
        setFetchedData(null);
        return;
      }

      let isMounted = true;
      const loadDetails = async () => {
        setLoadingDetails(true);
        try {
          const res = await fetchStockAdjustmentRequestDetails({
            adjustmentID: Number(adjId),
          });
          if (!isMounted) return;
          const data = res?.data || res;
          if (data) {
            setFetchedData(data);
            const nextValues = makeInitialForm(false, data, adjustmentType);
            if (validatedFormRef.current) {
              validatedFormRef.current.setValues(nextValues);
            }
          }
        } catch (err) {
          console.error("Error fetching Stock Adjustment details:", err);
          showToast("Failed to load Stock Adjustment details", ERROR_STATUS.toLowerCase());
        } finally {
          if (isMounted) setLoadingDetails(false);
        }
      };

      loadDetails();
      return () => {
        isMounted = false;
      };
    }, [initialData, adjustmentType, showToast]);

    const isCreate = !initialData;
    const [editMode, setEditMode] = useState(
      disabled ? false : (editModeProp === undefined ? isCreate : editModeProp)
    );

    useEffect(() => {
      if (disabled) setEditMode(false);
      else if (editModeProp !== undefined) setEditMode(editModeProp);
    }, [editModeProp, disabled]);

    const headerData =
      fetchedData?.STOCK_ADJUSTMENT_REQUEST_HEADER_DETAILS?.[0] ||
      (initialData?.STOCK_ADJUSTMENT_REQUEST_HEADER_DETAILS && initialData.STOCK_ADJUSTMENT_REQUEST_HEADER_DETAILS[0]) ||
      initialData ||
      {};

    const statusId = headerData.request_status ?? headerData.status_id ?? headerData.status ?? 0;
    const statusText = headerData.request_status_text || headerData.status_text || "";

    const isCompleted = isAdjustmentCompleted(statusId, statusText);
    const isApproved = isAdjustmentApproved(statusId, statusText);
    const isCancelled = isAdjustmentCancelled(statusId, statusText);
    const isApprovedOrCancelled = isApproved || isCancelled || isCompleted;

    const isDisabled = !isCreate && (!editMode || isApprovedOrCancelled);
    const [submitting, setSubmitting] = useState(false);

    const activeDraftKey = useMemo(
      () => getDraftKey(adjustmentType),
      [adjustmentType]
    );

    const initialValues = useMemo(
      () => makeInitialForm(isCreate, fetchedData || initialData, adjustmentType),
      [isCreate, fetchedData, initialData, adjustmentType]
    );
    const validation = useMemo(() => makeValidation(), []);

    const {
      isDirty: isFormDirty,
      onValuesChange,
      resetDirty,
    } = useDirtyDraftDrawer({
      open,
      initialValues,
      initialData: isCreate ? null : (fetchedData || initialData),
      draftKey: isCreate ? activeDraftKey : undefined,
    });

    useEffect(() => {
      if (onDirtyChange) onDirtyChange(isFormDirty);
    }, [isFormDirty, onDirtyChange]);

    // Derive effective type
    const effectiveType = formatAdjustmentTypeText(
      (fetchedData?.STOCK_ADJUSTMENT_REQUEST_HEADER_DETAILS?.[0]?.adjustment_type_text) ||
      (fetchedData?.STOCK_ADJUSTMENT_REQUEST_HEADER_DETAILS?.[0]?.adjustment_type) ||
      initialData?.adjustment_type_text ||
      initialData?.adjustment_type ||
      initialData?.request_type_text ||
      adjustmentType ||
      "Stock Addition"
    );

    const isAddition = effectiveType === "Stock Addition";
    const isDeduction = effectiveType === "Stock Deduction";

    // Validate all product rows
    const validateAllProducts = useCallback(
      (details) => {
        const errors = {};
        let isValid = true;

        if (!details || details.length === 0) {
          return { isValid: false, isEmpty: true, errors: {} };
        }

        const seenCodes = new Set();
        details.forEach((row, index) => {
          const rowErrors = {};
          const code = String(row.item_code || "").trim();
          if (!code) {
            rowErrors.item_code = "Required*";
            isValid = false;
          } else if (seenCodes.has(code.toLowerCase())) {
            rowErrors.item_code = "Item code already exists";
            isValid = false;
          } else {
            seenCodes.add(code.toLowerCase());
          }

          if (isAddition) {
            const qtyVal = row.qty_receive_requested;
            const unit = String(row.unit || row.item_unit || "").trim().toUpperCase();
            const isNOS = unit === "NOS";
            if (
              qtyVal === undefined ||
              qtyVal === null ||
              String(qtyVal).trim() === "" ||
              isNaN(Number(qtyVal)) ||
              Number(qtyVal) < 0
            ) {
              rowErrors.qty_receive_requested = "Required*";
              isValid = false;
            } else if (isNOS && String(qtyVal).includes(".")) {
              rowErrors.qty_receive_requested = "Decimal not allowed for NOS";
              isValid = false;
            }
            if (!row.batch_no || String(row.batch_no).trim() === "") {
              rowErrors.batch_no = "Required*";
              isValid = false;
            }
          }
          if (isDeduction) {
            const qtyVal = row.qty_issue_requested;
            const unit = String(row.unit || row.item_unit || "").trim().toUpperCase();
            const isNOS = unit === "NOS";
            if (
              qtyVal === undefined ||
              qtyVal === null ||
              String(qtyVal).trim() === "" ||
              isNaN(Number(qtyVal)) ||
              Number(qtyVal) < 0
            ) {
              rowErrors.qty_issue_requested = "Required*";
              isValid = false;
            } else if (isNOS && String(qtyVal).includes(".")) {
              rowErrors.qty_issue_requested = "Decimal not allowed for NOS";
              isValid = false;
            }
          }
          if (Object.keys(rowErrors).length > 0) {
            errors[index] = rowErrors;
          }
        });

        setProductErrors(errors);
        return { isValid, isEmpty: false, errors };
      },
      [isAddition, isDeduction]
    );

    const handleSubmit = async (values) => {
      if (isCompleted) {
        showToast("Cannot edit this record because status is already Completed", ERROR_STATUS.toLowerCase());
        return;
      }
      if (isApproved) {
        showToast("Cannot edit this record because status is already Approved", ERROR_STATUS.toLowerCase());
        return;
      }
      if (isCancelled) {
        showToast("Cannot edit this record because status is already Cancelled", ERROR_STATUS.toLowerCase());
        return;
      }

      if (!values.productDetails || values.productDetails.length === 0) {
        showToast("Please add at least one product for this stock adjustment", ERROR_STATUS.toLowerCase());
        return;
      }

      const { isValid } = validateAllProducts(values.productDetails);
      if (!isValid) {
        return;
      }

      // Resolve adjustment type as integer (1 = Addition, 2 = Deduction)
      const adjustmentTypeInt = isAddition ? 1 : 2;

      // Determine paramType: always "ADD"
      const existingId = values.id || 0;
      const paramType = PARAM_TYPE_ADD;

      // Build line items
      const stockAdjustmentRequestDetail = (values.productDetails || []).map((row) => ({
        adjustmentLineID: Number(row.adjustment_line_id || 0),
        adjustmentID: Number(row.adjustment_id || existingId || 0),
        itemID: Number(row.item_id || 0),
        itemType: row.item_type || "",
        quantityReceiveRequested: isAddition ? Number(row.qty_receive_requested || 0) : 0,
        quantityIssueRequested: isDeduction ? Number(row.qty_issue_requested || 0) : 0,
        batchNo: row.batch_no || "",
      }));

      const payload = {
        pageSize: 0,
        pageNumber: 0,
        adjustmentID: Number(existingId),
        adjustmentNumber: values.adjustment_no || "0",
        fromLocationID: 1,
        toLocationID: 1,
        adjustmentType: adjustmentTypeInt,
        adjustmentReasonID: Number(values.adjustment_reason || 0),
        requestStatus: Number(values.request_status || 1),
        requestedBy: values.requested_by || getPreparedBy() || "",
        remarks: values.remarks || "",
        stockAdjustmentRequestDetail,
        paramType,
      };

      setSubmitting(true);
      try {
        const res = await saveAndUpdateStockAdjustmentRequestDetails(payload);
        const response = res?.data || res;
        const responseArr =
          response?.STOCK_ADJUSTMENT_RESPONSE ||
          res?.data?.STOCK_ADJUSTMENT_RESPONSE ||
          res?.STOCK_ADJUSTMENT_RESPONSE;
        const firstRecord = Array.isArray(responseArr) ? responseArr[0] : null;
        const message =
          firstRecord?.Message ||
          firstRecord?.message ||
          res?.message ||
          (isCreate
            ? "Stock Adjustment Request Saved Successfully !!!"
            : "Stock Adjustment Request Updated Successfully !!!");

        showToast(message, SUCCESS_STATUS);
        if (onSuccess) onSuccess({ ...values, ...firstRecord, Message: message });
      } catch (err) {
        console.error("Save error:", err);
        showToast(err?.response?.data?.message || "An error occurred while saving.", ERROR_STATUS.toLowerCase());
      } finally {
        setSubmitting(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => validatedFormRef.current?.submitForm(),
      hasUnsavedChanges: () => isFormDirty,
      isCompleted: () => isCompleted,
      isApproved: () => isApproved,
      isCancelled: () => isCancelled,
      isApprovedOrCancelled: () => isApprovedOrCancelled,
      getStatusText: () => statusText,
      getStatusId: () => statusId,
      saveDraft: () => {
        if (validatedFormRef.current?.values) {
          try {
            localStorage.setItem(activeDraftKey, JSON.stringify(validatedFormRef.current.values));
          } catch {
            /* no-op */
          }
        }
      },
      clearDraft: () => {
        try {
          localStorage.removeItem(activeDraftKey);
        } catch {
          /* no-op */
        }
        resetDirty();
      },
    }));

    return (
      <div className="saj-page-wrapper" style={{ position: "relative" }}>
        {(submitting || loadingDetails) && <Loader />}

        <ValidatedForm
          key={isCreate ? `create_${activeDraftKey}` : (fetchedData?.STOCK_ADJUSTMENT_REQUEST_HEADER_DETAILS?.[0]?.adjustment_id || initialData?.adjustment_id || initialData?.id || "form")}
          ref={validatedFormRef}
          initialValues={initialValues}
          validation={validation}
          onSubmit={handleSubmit}
          onValuesChange={onValuesChange}
          disabled={isDisabled || disabled}
          enableDraft={isCreate}
          draftKey={isCreate ? activeDraftKey : ""}
        >
          {({ values, errors, handleChange, handleBlur }) => {
            const isValidQuantityInput = (val, unit) => {
              if (val === "" || val === undefined || val === null) return true;
              const isNOS = String(unit || "").trim().toUpperCase() === "NOS";
              const regex = isNOS ? INTEGER_QTY_REGEX : DECIMAL_QTY_REGEX;
              return regex.test(String(val));
            };

            const handleRowChange = (index, field, val) => {
              const row = (values.productDetails || [])[index];
              const unit = row?.unit || row?.item_unit || "";

              if (field === "qty_receive_requested" || field === "qty_issue_requested") {
                if (!isValidQuantityInput(val, unit)) {
                  return;
                }
              }

              const updatedDetails = (values.productDetails || []).map((item, i) => {
                if (i === index) {
                  return { ...item, [field]: val };
                }
                return item;
              });
              handleChange({ target: { name: "productDetails", value: updatedDetails } });

              // Clear error on change if valid
              if (productErrors[index]?.[field]) {
                const updatedRowErrors = { ...productErrors[index] };
                if (field === "qty_receive_requested" || field === "qty_issue_requested") {
                  const isNOS = String(unit).trim().toUpperCase() === "NOS";
                  if (
                    val !== "" &&
                    !isNaN(Number(val)) &&
                    Number(val) >= 0 &&
                    (!isNOS || !String(val).includes("."))
                  ) {
                    delete updatedRowErrors[field];
                  }
                } else if (field === "batch_no") {
                  if (String(val).trim() !== "") {
                    delete updatedRowErrors[field];
                  }
                }
                setProductErrors((prev) => ({
                  ...prev,
                  [index]: updatedRowErrors,
                }));
              }
            };

            const handleItemCodeChange = (index, selectedCode) => {
              if (!selectedCode) {
                const updatedDetails = (values.productDetails || []).map((item, i) => {
                  if (i === index) {
                    return {
                      ...item,
                      item_id: 0,
                      item_code: "",
                      description: "",
                      unit: "",
                      item_type: "",
                      duplicateError: false,
                    };
                  }
                  return item;
                });
                handleChange({ target: { name: "productDetails", value: updatedDetails } });
                return;
              }

              // Check if item_code is already selected in another row
              const isDuplicate = (values.productDetails || []).some(
                (item, i) => i !== index && String(item.item_code || "").trim().toLowerCase() === String(selectedCode).trim().toLowerCase()
              );

              if (isDuplicate) {
                const updatedDetails = (values.productDetails || []).map((item, i) => {
                  if (i === index) {
                    return {
                      ...item,
                      item_id: 0,
                      item_code: "",
                      description: "",
                      unit: "",
                      item_type: "",
                      duplicateError: true,
                    };
                  }
                  return item;
                });
                handleChange({ target: { name: "productDetails", value: updatedDetails } });
                setProductErrors((prev) => ({
                  ...prev,
                  [index]: {
                    ...(prev[index] || {}),
                    item_code: "Item code already exists",
                  },
                }));
                return;
              }

              const matched = itemCodeOptions.find((opt) => opt.value === selectedCode || opt.item_code === selectedCode);
              const newUnit = matched ? matched.unit : "";
              const isNOS = String(newUnit).trim().toUpperCase() === "NOS";

              const updatedDetails = (values.productDetails || []).map((item, i) => {
                if (i === index) {
                  let qtyReceive = item.qty_receive_requested;
                  let qtyIssue = item.qty_issue_requested;
                  if (isNOS) {
                    if (qtyReceive && String(qtyReceive).includes(".")) {
                      qtyReceive = String(qtyReceive).split(".")[0];
                    }
                    if (qtyIssue && String(qtyIssue).includes(".")) {
                      qtyIssue = String(qtyIssue).split(".")[0];
                    }
                  }
                  return {
                    ...item,
                    item_id: matched ? matched.item_id : item.item_id,
                    item_code: selectedCode,
                    description: matched ? matched.description : "",
                    unit: newUnit,
                    item_type: matched ? matched.item_type : item.item_type,
                    qty_receive_requested: qtyReceive,
                    qty_issue_requested: qtyIssue,
                    batch_no: item.batch_no || "",
                    duplicateError: false,
                  };
                }
                return item;
              });
              handleChange({ target: { name: "productDetails", value: updatedDetails } });

              // Clear item_code error if selected
              if (productErrors[index]?.item_code) {
                const updatedRowErrors = { ...productErrors[index] };
                delete updatedRowErrors.item_code;
                setProductErrors((prev) => ({
                  ...prev,
                  [index]: updatedRowErrors,
                }));
              }
            };

            return (
              <>
                <div style={{ width: "100%", margin: "0 auto" }}>

                  <div className="card-body">

                    {/* Header Fields */}
                    <div className="row mb-1 saj-top-fields">
                      <div className="col-md-2 saj-field-adj-no">
                        <FormField
                          name="adjustment_no"
                          label="Adjustment No"
                          type="text"
                          value={isCreate ? (values?.adjustment_no || "0") : (values?.adjustment_no || "")}
                          disabled
                          style={{ background: "#f9fafb" }}
                        />
                      </div>
                      <div className="col-md-2 saj-field-adj-date">
                        <FormField
                          name="adjustment_date"
                          label="Adjustment Date"
                          type="date"
                          value={values?.adjustment_date || new Date().toISOString().split("T")[0]}
                          disabled
                          style={{ background: "#f9fafb" }}
                        />
                      </div>
                      <div className="col-md-2 saj-field-adj-type">
                        <FormField
                          name="adjustment_type"
                          label="Adjustment Type"
                          type="text"
                          value={values?.adjustment_type || (isAddition ? "Stock Addition" : "Stock Deduction")}
                          disabled
                          style={{ background: "#f9fafb" }}
                        />
                      </div>
                      <div className="col-md-3 saj-field-adj-reason">
                        <ReactSelectField
                          name="adjustment_reason"
                          label="Adjustment Reason"
                          options={adjustmentReasonOptions}
                          value={values?.adjustment_reason !== undefined && values?.adjustment_reason !== null ? String(values.adjustment_reason) : ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={isDisabled}
                          placeholder="Select Reason"
                          required={true}
                          error={errors?.adjustment_reason}
                        />
                      </div>
                      <div className="col-md-3 saj-field-status">
                        <FormField
                          name="request_status_text"
                          label="Request Status"
                          type="text"
                          value={values?.request_status_text || "Pending"}
                          disabled
                          style={{ background: "#f9fafb" }}
                        />
                      </div>
                      <div className="col-md-2 saj-field-requested-by">
                        <FormField
                          name="requested_by"
                          label="Requested By"
                          type="text"
                          value={values?.requested_by || ""}
                          disabled
                          style={{ background: "#f9fafb" }}
                        />
                      </div>
                      <div className="col-md-10 saj-field-remarks">
                        <FormField
                          name="remarks"
                          label="Remarks"
                          type="text"
                          value={values?.remarks || ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={isDisabled}
                          style={{ background: isDisabled ? "#f9fafb" : "#ffffff" }}
                        />
                      </div>
                    </div>

                  </div>

                  {/* ── Product Details Section ── */}
                  <div className="card saj-product-card">
                    <div className="saj-section-header">
                      <h5>Product Details</h5>
                      <div className="d-flex align-items-center gap-2 ms-auto" style={{ flexShrink: 0 }}>
                        <button
                          className="btn btn-sm"
                          type="button"
                          disabled={isDisabled || disabled}
                          onClick={() => {
                            const newRow = {
                              item_id: 0,
                              item_code: "",
                              description: "",
                              unit: "",
                              qty_receive_requested: "",
                              qty_issue_requested: "",
                              item_type: "",
                              batch_no: "",
                              isNew: true,
                            };
                            const arr = Array.isArray(values.productDetails)
                              ? [...values.productDetails, newRow]
                              : [newRow];
                            handleChange({ target: { name: "productDetails", value: arr } });
                            setActiveRowIndex(arr.length - 1);
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
                          title={isDisabled || disabled ? "Click Edit to add products" : "Add Product Row"}
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

                    <div className="card-body p-0 flex-grow-1">
                      {(!values.productDetails || values.productDetails.length === 0) ? (
                        <div className="text-center text-muted py-4" style={{ width: "100%", fontSize: "14px" }}>
                          No Products Added
                        </div>
                      ) : (
                        <div className="table-responsive saj-table-responsive" style={{ overflowX: "auto", overflowY: "visible", width: "100%" }}>
                          <table className="table table-vcenter saj-table" style={{ width: "100%", tableLayout: "auto", minWidth: "750px" }}>
                            <thead className="saj-thead">
                              <tr>
                                <th className="saj-th" style={{ width: "80px", textAlign: "center" }}>Actions</th>
                                <th className="saj-th" style={{ width: "60px", textAlign: "center" }}>S.No</th>
                                <th className="saj-th" style={{ minWidth: "200px", textAlign: "center" }}>Item Code / Description</th>
                                {/* Show Qty Receive Requested only for Addition */}
                                {isAddition && (
                                  <th className="saj-th" style={{ minWidth: "160px", textAlign: "center" }}>Qty Receive Requested</th>
                                )}
                                {/* Show Qty Issue Requested only for Deduction */}
                                {isDeduction && (
                                  <th className="saj-th" style={{ minWidth: "160px", textAlign: "center" }}>Qty Issue Requested</th>
                                )}
                                {/* Show Batch No column only for Addition (Editable) */}
                                {isAddition && (
                                  <th className="saj-th" style={{ minWidth: "160px", textAlign: "center" }}>Batch No</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {values.productDetails.map((row, index) => {
                                const isSelected = activeRowIndex === index;
                                const itemDescription =
                                  row.description ||
                                  itemCodeOptions.find((o) => o.value === row.item_code)?.description ||
                                  "";
                                const itemUnit =
                                  row.unit ||
                                  row.item_unit ||
                                  itemCodeOptions.find((o) => o.value === row.item_code)?.unit ||
                                  "";
                                const hasSelectedCode = Boolean(row.item_code && String(row.item_code).trim() !== "");

                                return (
                                  <React.Fragment key={index}>
                                    {/* Main Row */}
                                    <tr
                                      onClick={() => setActiveRowIndex(index)}
                                      onFocusCapture={() => setActiveRowIndex(index)}
                                      style={{
                                        height: "42px",
                                        backgroundColor: isSelected ? "#eef2f5" : "#ffffff",
                                      }}
                                    >
                                      {/* Delete action button */}
                                      <td className="saj-td" style={{ textAlign: "center" }}>
                                        <button
                                          type="button"
                                          className="btn btn-sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isDisabled) {
                                              setDeleteDialog({ open: true, index });
                                            }
                                          }}
                                          disabled={isDisabled}
                                          style={{
                                            padding: "4px 8px",
                                            fontSize: "12px",
                                            background: "transparent",
                                            color: !isDisabled ? "rgb(22,119,255)" : "#cccccc",
                                            border: "none",
                                            cursor: !isDisabled ? "pointer" : "not-allowed",
                                            opacity: !isDisabled ? 1 : 0.5,
                                          }}
                                          title={!isDisabled ? "Remove row" : "Cannot delete in view mode"}
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

                                      {/* S.No */}
                                      <td className="saj-td" style={{ textAlign: "center" }}>
                                        {index + 1}
                                      </td>

                                      {/* Item Code (Dropdown) */}
                                      <td className="saj-td" style={{ minWidth: "200px" }}>
                                        <ReactSelectField
                                          name={`productDetails.${index}.item_code`}
                                          hideLabel
                                          options={itemCodeOptions}
                                          value={row.item_code || ""}
                                          onChange={(e) => handleItemCodeChange(index, e?.target?.value ?? "")}
                                          onBlur={handleBlur}
                                          isDisabled={isDisabled}
                                          placeholder="Select Item Code"
                                          error={row.duplicateError ? "Item code already exists" : productErrors[index]?.item_code}
                                          className={(row.duplicateError || productErrors[index]?.item_code) ? "is-invalid" : ""}
                                        />
                                      </td>

                                      {/* Qty Receive Requested (Addition only — editable) */}
                                      {isAddition && (
                                        <td className="saj-td" style={{ textAlign: "right" }}>
                                          <input
                                            type="text"
                                            inputMode={String(row.unit || row.item_unit || "").trim().toUpperCase() === "NOS" ? "numeric" : "decimal"}
                                            className={`form-control saj-input ${productErrors[index]?.qty_receive_requested ? "is-invalid" : ""}`}
                                            style={{
                                              textAlign: "right",
                                              background: isDisabled ? "#e9ecef" : "#ffffff",
                                              borderColor: productErrors[index]?.qty_receive_requested ? "#dc3545" : undefined,
                                            }}
                                            value={row.qty_receive_requested ?? ""}
                                            onChange={(e) =>
                                              handleRowChange(index, "qty_receive_requested", e.target.value)
                                            }
                                            onFocus={(e) => {
                                              setTimeout(() => {
                                                e.target.select();
                                              }, 0);
                                            }}
                                            onClick={(e) => {
                                              e.target.select();
                                            }}
                                            onBlur={handleBlur}
                                            disabled={isDisabled}
                                          />
                                          {productErrors[index]?.qty_receive_requested && (
                                            <div className="saj-error">{productErrors[index].qty_receive_requested}</div>
                                          )}
                                        </td>
                                      )}

                                      {/* Qty Issue Requested (Deduction only — editable) */}
                                      {isDeduction && (
                                        <td className="saj-td" style={{ textAlign: "right" }}>
                                          <input
                                            type="text"
                                            inputMode={String(row.unit || row.item_unit || "").trim().toUpperCase() === "NOS" ? "numeric" : "decimal"}
                                            className={`form-control saj-input ${productErrors[index]?.qty_issue_requested ? "is-invalid" : ""}`}
                                            style={{
                                              textAlign: "right",
                                              background: isDisabled ? "#e9ecef" : "#ffffff",
                                              borderColor: productErrors[index]?.qty_issue_requested ? "#dc3545" : undefined,
                                            }}
                                            value={row.qty_issue_requested ?? ""}
                                            onChange={(e) =>
                                              handleRowChange(index, "qty_issue_requested", e.target.value)
                                            }
                                            onFocus={(e) => {
                                              setTimeout(() => {
                                                e.target.select();
                                              }, 0);
                                            }}
                                            onClick={(e) => {
                                              e.target.select();
                                            }}
                                            onBlur={handleBlur}
                                            disabled={isDisabled}
                                          />
                                          {productErrors[index]?.qty_issue_requested && (
                                            <div className="saj-error">{productErrors[index].qty_issue_requested}</div>
                                          )}
                                        </td>
                                      )}

                                      {/* Batch No (Editable for Addition only) */}
                                      {isAddition && (
                                        <td className="saj-td" style={{ textAlign: "center" }}>
                                          <input
                                            type="text"
                                            className={`form-control saj-input ${productErrors[index]?.batch_no ? "is-invalid" : ""}`}
                                            style={{
                                              textAlign: "center",
                                              background: isDisabled ? "#e9ecef" : "#ffffff",
                                              borderColor: productErrors[index]?.batch_no ? "#dc3545" : undefined,
                                            }}
                                            value={row.batch_no || ""}
                                            onChange={(e) => handleRowChange(index, "batch_no", e.target.value)}
                                            onFocus={(e) => {
                                              setTimeout(() => {
                                                e.target.select();
                                              }, 0);
                                            }}
                                            onClick={(e) => {
                                              e.target.select();
                                            }}
                                            onBlur={handleBlur}
                                            disabled={isDisabled}
                                          />
                                          {productErrors[index]?.batch_no && (
                                            <div className="saj-error">{productErrors[index].batch_no}</div>
                                          )}
                                        </td>
                                      )}
                                    </tr>

                                    {/* Sub-row for Description and Unit (Rendered ONLY when an Item is selected) */}
                                    {hasSelectedCode ? (
                                      <tr
                                        key={`sub-${index}`}
                                        onClick={() => setActiveRowIndex(index)}
                                        style={{ backgroundColor: isSelected ? "#f8fafc" : "#ffffff" }}
                                      >
                                        {/* Empty cells for Actions & S.No */}
                                        <td
                                          className="saj-td"
                                          colSpan="2"
                                          style={{
                                            borderRight: "1px solid #dee2e6",
                                            background: isSelected ? "#f8fafc" : "#ffffff",
                                          }}
                                        ></td>

                                        {/* Description under Item Code */}
                                        <td
                                          className="saj-td"
                                          colSpan={isAddition ? 2 : 1}
                                          style={{
                                            padding: "6px 12px !important",
                                            verticalAlign: "middle",
                                            maxWidth: "400px",
                                            background: isSelected ? "#f8fafc" : "#ffffff",
                                          }}
                                        >
                                          <div
                                            title={itemDescription}
                                            style={{
                                              fontSize: "12.5px",
                                              color: "#1e293b",
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              display: "block",
                                              lineHeight: "1.4",
                                            }}
                                          >
                                            {itemDescription}
                                          </div>
                                        </td>

                                        {/* Unit */}
                                        <td
                                          className="saj-td"
                                          style={{
                                            padding: "6px 12px !important",
                                            verticalAlign: "middle",
                                            textAlign: "left",
                                            background: isSelected ? "#f8fafc" : "#ffffff",
                                          }}
                                        >
                                          <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: "500" }}>
                                            {itemUnit}
                                          </div>
                                        </td>
                                      </tr>
                                    ) : null}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <DeleteConfirmDialog
                  open={deleteDialog.open}
                  title="Confirm Delete"
                  message="this row"
                  onConfirm={() => {
                    if (deleteDialog.index !== null && deleteDialog.index !== undefined) {
                      const idx = deleteDialog.index;
                      const arr = (values.productDetails || []).filter((_, i) => i !== idx);
                      handleChange({ target: { name: "productDetails", value: arr } });
                      if (activeRowIndex >= arr.length) {
                        setActiveRowIndex(Math.max(0, arr.length - 1));
                      }
                      const updatedErrors = { ...productErrors };
                      delete updatedErrors[idx];
                      setProductErrors(updatedErrors);
                    }
                    setDeleteDialog({ open: false, index: null });
                  }}
                  onCancel={() => setDeleteDialog({ open: false, index: null })}
                />
              </>
            );
          }}
        </ValidatedForm>
      </div>
    );
  }
);

SaveStockAdjustment.displayName = "SaveStockAdjustment";
export default SaveStockAdjustment;
