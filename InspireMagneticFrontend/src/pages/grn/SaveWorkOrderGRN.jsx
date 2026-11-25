import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  FormField,
  TextAreaFormField,
  ReactSelectField,
} from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
import { DeleteConfirmDialog } from "../../components/Notification";
import { useToast } from "../../components/useToast";
import FullPageLoader from "../../components/FullPageLoader";
import Loader from "../../components/Loader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import { getPreparedBy } from "../../utils/userSession";
import { SUCCESS_STATUS, ERROR_STATUS, DRAFT_WORK_ORDER_GRN_CREATE } from "../../utils/ConstVariables";
import { getParsedDraft, saveDraft, removeDraft } from "../../utils/storageUtils";
import { INTEGER_QTY_REGEX, DECIMAL_QTY_REGEX } from "../../utils/regexUtils";
import { getMinInvoiceDate, formatDateForInput } from "../../utils/dateUtils";
// import { menuPermissions } from "../../permissions/permissionUtils";
import {
  fetchGRNHeaderDetails,
  fetchWorkOrderNos,
  fetchGRNProducts,
  saveAndUpdateGRNHeader,
} from "../../services/grnService";


const todayStr = new Date().toISOString().split("T")[0];

const createEmptyProductRow = (submitCount) => ({
  _addedAtSubmitCount: submitCount,
  itemCode: "",
  itemDescription: "",
  unit: "",
  remarks: "",
  itemType: "",
  batchNo: "",
  workOrderLineId: "",
  qtyAdvised: "",
  qtyDelivered: "",
  originalQtyDelivered: 0,
  originalQtyReturned: 0,
  qtyAccepted: "",
  qtyAcceptedForSupplier: "",
  qtyRejected: "",
  qtyRejectedReason: "",
  qtyTestingRejected: "",
  qtyReturned: "0",
  qtyReturnedReason: "",
  qtyStocked: "",
  storeId: "",
  docIStatus: "",
  qaStatus: "",
  qaCheckedBy: "",
  qaCheckedDate: "",
  qtyCountedBy: "",
  qtyCountedDate: "",
  qtyReturnedBy: "",
  qtyReturnedDate: "",
  stockAddedBy: "",
  stockAddedDate: "",
});

const makeInitialForm = (isCreate, initialData) => {
  const base = {
    grnID: 0,
    grnNo: "",
    grnDate: todayStr,
    grnStatus: "0",
    grnStatusText: "New Record",
    remarks: "",
    preparedBy: getPreparedBy(),
    prepDate: todayStr,
    updatedBy: "",
    updatedDate: "",
    paramType: "ADD",
  };

  if (isCreate) {
    const defaultCreate = { ...base, grnNo: "0", workOrderID: "", currencyID: "INR", grnSourceType: "Internal", supplierID: "", supplierInvoiceDate: "", supplierInvoiceRef: "", productDetails: [] };
    const parsedDraft = getParsedDraft(DRAFT_WORK_ORDER_GRN_CREATE);
    if (parsedDraft) {
      return {
        ...defaultCreate,
        ...parsedDraft,
        productDetails: Array.isArray(parsedDraft.productDetails) ? parsedDraft.productDetails : [],
      };
    }
    return defaultCreate;
  } else {
    const header = initialData;
    return {
      ...base,
      grnID: header.grn_id || 0,
      grnNo: header.grn_no || "",
      grnDate: formatDateForInput(header.grn_date, todayStr),
      grnStatus: String(header.doc_status ?? header.grn_status ?? "0"),
      grnStatusText: header.doc_status_text || header.grn_status_text || "",
      remarks: header.remarks || "",
      preparedBy: header.prep_by || getPreparedBy(),
      prepDate: formatDateForInput(header.prep_date, todayStr),
      updatedBy: header.update_by || "",
      updatedDate: formatDateForInput(header.update_date),
      workOrderID: header.work_order_id || "",
      workOrderNo: header.work_order_no || "",
      currencyID: header.currency_code || header.currency_id || "INR",
      grnSourceType: header.grn_source_type_text || header.grn_source_type || "Internal",
      supplierID: header.supplier_id || "",
      supplierName: header.supplier_name || "",
      supplierInvoiceDate: formatDateForInput(header.supplier_invoice_date),
      supplierInvoiceRef: header.supplier_invoice_ref || "",
      productDetails: header.product_details || [],
    };
  }
};

const makeValidation = () => {
  const base = {
    grnDate: { required: true, fieldLabel: "GRN Date", controlType: "textbox" },
    grnStatus: { required: true, fieldLabel: "Status", controlType: "dropdown" },
  };
  return { ...base, workOrderID: { required: true, fieldLabel: "WO Number", controlType: "dropdown" }, grnSourceType: { required: true, fieldLabel: "Source Type", controlType: "dropdown" } };
};

const buildPayload = (values, isCreate, grnID) => {
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.includes("T")) return dateStr.replace("T", " ").replace("Z", "");
    return `${dateStr} 00:00:00.000`;
  };

  return {
    pageSize: 0,
    pageNumber: 0,
    grnid: isCreate ? 0 : Number(grnID || values.grnID || 0),
    grnNumber: values.grnNo || "0",
    workOrderID: Number(values.workOrderID) || 0,
    purchaseOrderID: 0,
    supplierInvoiceReference: values.supplierInvoiceRef || "",
    supplierInvoiceDate: formatDateTime(values.supplierInvoiceDate),
    remarks: values.remarks || "",
    supplierID: (values.supplierID && String(values.supplierID) !== "0") ? String(values.supplierID) : "",
    documentStatus: (values.productDetails || []).some(row => row.qtyDelivered !== undefined && row.qtyDelivered !== null && String(row.qtyDelivered).trim() !== "") ? 30 : 10,
    currencyID: 1,
    preparedBy: values.preparedBy || getPreparedBy(),
    updatedBy: isCreate ? "" : getPreparedBy(),
    paramType: "ADD",
    grnDetail: (values.productDetails || []).map((row) => ({
      grnLineID: Number(row.grn_line_id) || 0,
      grnid: isCreate ? 0 : Number(grnID || values.grnID || 0),
      itemID: Number(row.value || row.item_id || (typeof row.itemCode === "object" ? row.itemCode?.ValueText : row.itemCode)) || 0,
      quantityAdvised: Number(row.qtyAdvised) || 0,
      quantityDelivered: row.qtyDelivered !== undefined && row.qtyDelivered !== null ? String(row.qtyDelivered) : "",
      quantityCountedBy: row.qtyCountedBy || "",
      quantityCountedDate: formatDateTime(row.qtyCountedDate),
      quantityReturned: Number(row.qtyReturned) || 0,
      quantityReturnedReason: row.qtyReturnedReason || "",
      quantityReturnedBy: row.qtyReturnedBy || "",
      quantityReturnedDate: formatDateTime(row.qtyReturnedDate),
      qaStatus: Number(row.qaStatus) || 0,
      batchNumber: row.batchNo || (!row.grn_line_id ? "0" : ""),
      workOrderLineID: Number(row.workOrderLineId) || 0,
      documentIStatus: (row.qtyDelivered !== undefined && row.qtyDelivered !== null && String(row.qtyDelivered).trim() !== "") ? 30 : 10,
    })),
  };
};

const SaveWorkOrderGRN = forwardRef(
  ({ onSuccess, initialData, editMode: editModeProp, onDirtyChange, disabled, open = true }, ref) => {


    const { showToast } = useToast();
    const validatedFormRef = useRef();

    const isCreate = !initialData;
    const [editMode, setEditMode] = useState(
      disabled ? false : (editModeProp === undefined ? isCreate : editModeProp)
    );
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const [activeProductTab, setActiveProductTab] = useState("product");
    const [submitCount, setSubmitCount] = useState(0);
    const [qtyErrors, setQtyErrors] = useState({});
    const [returnReasonErrors, setReturnReasonErrors] = useState({});
    const [exceedPendingErrors, setExceedPendingErrors] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [rowToDelete, setRowToDelete] = useState(null);


    const [workOrderOptions, setWorkOrderOptions] = useState([]);

    useEffect(() => {
      async function loadWorkOrderOptions() {
        try {
          const data = await fetchWorkOrderNos();
          if (Array.isArray(data)) {
            setWorkOrderOptions(
              data.map((item) => ({
                value: item.ValueText,
                label: item.DisplayText,
                supplier_id: item.supplier_id || null,
                supplier_name: item.supplier_name || "",
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching Work Order Nos:", error);
        }
      }
      loadWorkOrderOptions();
    }, []);

    const [itemOptions, setItemOptions] = useState([]);

    const loadItemOptions = useCallback(async (workOrderId) => {
      if (!workOrderId) {
        setItemOptions([]);
        return;
      }
      try {
        const data = await fetchGRNProducts(workOrderId);
        if (Array.isArray(data)) {
          setItemOptions(
            data.map((item) => ({
              value: item.ValueText,
              label: item.Item_Code || item.DisplayText,
              description: item.Item_Description || item.item_description || item.DisplayText || item.Item_Code,
              unit: item.Item_Unit || item.item_unit || item.unit || "",
              work_order_line_id: item.work_order_line_id || null,
              pendingQty: item.PendingQty ?? item.pending_qty ?? null,
              rawObject: item,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching GRN Products:", error);
      }
    }, []);

    useEffect(() => {
      if (disabled) setEditMode(false);
      else if (editModeProp !== undefined) setEditMode(editModeProp);
    }, [editModeProp, disabled]);

    const isDisabled = !isCreate && !editMode;
    const [submitting, setSubmitting] = useState(false);
    const [gridSubmitted, setGridSubmitted] = useState(false);

    const [fetchedData, setFetchedData] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const fetchedIdRef = useRef(null);

    useEffect(() => {
      const wId = fetchedData?.work_order_id || initialData?.work_order_id || initialData?.workOrderID;
      if (wId) {
        loadItemOptions(wId);
      }
    }, [fetchedData, initialData, loadItemOptions]);

    useEffect(() => {
      async function getDetails() {
        if (!isCreate && initialData && (initialData.grn_id || initialData.grnID)) {
          const grnId = initialData.grn_id || initialData.grnID;
          if (fetchedIdRef.current === grnId) return;
          fetchedIdRef.current = grnId;

          setLoadingDetails(true);
          try {
            const res = await fetchGRNHeaderDetails({ grnid: Number(grnId) });
            if (res && res.Status === SUCCESS_STATUS && res.data) {
              const header = res.data.WORK_ORDER_GRN_HEADER_RESPONSE?.[0] || initialData;
              const details = res.data.WORK_ORDER_GRN_DETAIL_RESPONSE || [];
              const mappedDetails = details.map(d => ({
                grn_line_id: d.grn_line_id || 0,
                item_id: d.item_id || 0,
                itemCode: String(d.item_id || d.item_code || ""),
                itemDescription: d.item_description || "",
                unit: d.item_unit || d.unit || "",
                itemType: d.item_type || "",
                qtyAdvised: d.qty_advised ?? 0,
                qtyDelivered: d.qty_delivered !== null && d.qty_delivered !== undefined ? String(d.qty_delivered) : "",
                qtyReturned: d.qty_returned ?? "",
                qtyReturnedReason: d.qty_returned_reason || "",
                docIStatus: d.doc_istatus ?? 0,
                docIStatusText: d.doc_istatus_text || "",
                qtyCountedBy: d.qty_counted_by || "",
                qtyCountedDate: d.qty_counted_date ? String(d.qty_counted_date).split("T")[0] : "",
                qtyReturnedBy: d.qty_returned_by || "",
                qtyReturnedDate: d.qty_returned_date ? String(d.qty_returned_date).split("T")[0] : "",
                qtyAccepted: d.qty_accepted ?? 0,
                qtyAcceptedForSupplier: d.qty_accepted_for_supplier ?? 0,
                qtyRejected: d.qty_rejected ?? 0,
                qtyRejectedReason: d.qty_rejected_reason || "",
                qtyTestingRejected: d.qty_testing_rejected ?? 0,
                qaStatus: d.qa_status ?? "",
                qaStatusText: d.qa_status_text || "",
                qaCheckedBy: d.qa_checked_by || "",
                qaCheckedDate: d.qa_checked_date ? String(d.qa_checked_date).split("T")[0] : "",
                batchNo: d.batch_no || "",
                workOrderLineId: d.work_order_line_id || 0,
                qtyStocked: d.qty_stocked ?? 0,
                stockAddedDate: d.stock_added_date ? String(d.stock_added_date).split("T")[0] : "",
                stockAddedBy: d.stock_added_by || "",
                storeId: d.store_id || "",
                qtyBalance: d.qty_balance ?? 0,
                qtyAvailable: d.qty_available ?? 0,
                originalQtyDelivered: Number(d.qty_delivered || 0),
                originalQtyReturned: Number(d.qty_returned || 0),
                pendingQty: null,
                duplicateError: false,
              }));
              setFetchedData({ ...header, product_details: mappedDetails });
            }
          } catch (e) {
            console.error("Error fetching GRN details", e);
            showToast("Failed to load details", ERROR_STATUS.toLowerCase());
          } finally {
            setLoadingDetails(false);
          }
        }
      }
      getDetails();
    }, [isCreate, initialData, showToast]);

    useEffect(() => {
      if (fetchedData?.work_order_id) {
        setWorkOrderOptions(prev => {
          const val = fetchedData.work_order_id;
          if (!prev.find(o => String(o.value) === String(val))) {
            return [...prev, {
              value: val,
              label: fetchedData.work_order_no || String(val),
              supplier_id: fetchedData.supplier_id || null,
              supplier_name: fetchedData.supplier_name || ""
            }];
          }
          return prev;
        });
      }

      if (fetchedData?.product_details?.length > 0) {
        setItemOptions(prev => {
          let newOpts = [...prev];
          let changed = false;
          fetchedData.product_details.forEach(pd => {
            const val = pd.item_id || pd.itemCode;
            if (val && !newOpts.find(o => String(o.value) === String(val))) {
              newOpts.push({
                value: val,
                label: pd.item_code || pd.itemCode || val,
                description: pd.itemDescription || "",
                unit: pd.unit || "",
                work_order_line_id: pd.workOrderLineId || null,
                pendingQty: pd.pendingQty ?? pd.qtyBalance ?? null,
              });
              changed = true;
            }
          });
          return changed ? newOpts : prev;
        });
      }
    }, [fetchedData]);

    const getRowPendingQty = useCallback((row) => {
      const itemId = typeof row.itemCode === "object" ? row.itemCode?.ValueText : (row.item_id || row.itemCode);
      let dbPending = null;
      if (itemId && itemOptions.length > 0) {
        const opt = itemOptions.find((o) => String(o.value) === String(itemId));
        if (opt && opt.pendingQty !== undefined && opt.pendingQty !== null) {
          dbPending = Number(opt.pendingQty);
        }
      }
      if (dbPending === null) {
        if (row.pendingQty !== undefined && row.pendingQty !== null) {
          dbPending = Number(row.pendingQty);
        } else if (row.qtyBalance !== undefined && row.qtyBalance !== null) {
          dbPending = Number(row.qtyBalance);
        }
      }
      if (dbPending === null) return null;

      const originalNet = Number(row.originalQtyDelivered || 0) - Number(row.originalQtyReturned || 0);
      return dbPending + originalNet;
    }, [itemOptions]);

    const DRAFT_KEY = DRAFT_WORK_ORDER_GRN_CREATE;
    const initialValues = useMemo(() => makeInitialForm(isCreate, fetchedData || initialData), [isCreate, initialData, fetchedData]);
    const validation = useMemo(() => makeValidation(), []);

    useEffect(() => {
      if (!isCreate && fetchedData && validatedFormRef.current) {
        validatedFormRef.current.setValues(initialValues);
      }
    }, [fetchedData, isCreate, initialValues]);

    const {
      isDirty: isFormDirty,
      onValuesChange,
      resetDirty: resetFormDirty,
    } = useDirtyDraftDrawer({
      open,
      initialValues,
      initialData: isCreate ? null : (fetchedData || initialData),
      draftKey: isCreate ? DRAFT_KEY : undefined,
    });

    useEffect(() => {
      if (onDirtyChange) onDirtyChange(isFormDirty);
    }, [isFormDirty, onDirtyChange]);

    const handleSubmit = async (values) => {
      setGridSubmitted(true);
      setSubmitCount(c => c + 1);

      if (!values.productDetails || values.productDetails.length === 0) {
        showToast("Please add at least one product for this work order Good Receipt", "error");
        setGridSubmitted(false);
        setSubmitCount(0);
        return;
      }

      const invalidProduct = values.productDetails.find(p => !p.itemCode || !p.qtyAdvised);
      if (invalidProduct) {
        return;
      }

      let hasQtyError = false;
      const newQtyErrors = {};
      let hasReturnReasonError = false;
      const newReturnReasonErrors = {};
      let hasExceedPendingError = false;
      const newExceedPendingErrors = {};

      values.productDetails.forEach((p, index) => {
        if (Number(p.qtyReturned || 0) > Number(p.qtyDelivered || 0)) {
          newQtyErrors[index] = true;
          hasQtyError = true;
        }
        if (Number(p.qtyReturned || 0) > 0 && !p.qtyReturnedReason?.trim()) {
          newReturnReasonErrors[index] = true;
          hasReturnReasonError = true;
        }

        const pendingQty = getRowPendingQty(p);
        const netQty = Number(p.qtyDelivered || 0) - Number(p.qtyReturned || 0);
        if (pendingQty !== null && netQty > pendingQty) {
          newExceedPendingErrors[index] = true;
          hasExceedPendingError = true;
        }
      });

      setQtyErrors(newQtyErrors);
      setReturnReasonErrors(newReturnReasonErrors);
      setExceedPendingErrors(newExceedPendingErrors);

      if (hasQtyError) {
        showToast("Quantity Returned Cannot Be Greater Than Quantity Delivered", "error");
        return;
      }

      if (hasReturnReasonError) {
        // showToast("Qty Returned Reason is required when Qty Returned is greater than 0", "error");
        return;
      }

      if (hasExceedPendingError) {
        showToast("GRN Quantity Exceeds Work Order Pending Quantity !!!", "error");
        return;
      }

      setSubmitting(true);
      try {
        const grnID = fetchedData?.grn_id || initialData?.grn_id || initialData?.grnID;
        const payload = buildPayload(values, isCreate, grnID);
        const res = await saveAndUpdateGRNHeader(payload);
        if (res && res.Status === SUCCESS_STATUS) {
          if (isCreate) try { removeDraft(DRAFT_KEY); } catch { /* ignore error */ }
          if (onSuccess) onSuccess(res);
        } else {
          const errMsg = res?.data?.WORK_ORDER_GRN_RESPONSE?.[0]?.Message || res?.message || "Failed to save record";
          showToast(errMsg, "error");
        }
      } catch (err) {
        console.error("Save error:", err);
        showToast("An error occurred while saving.", "error");
      } finally {
        setSubmitting(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => validatedFormRef.current?.submitForm(),
      saveDraft: () => {
        if (validatedFormRef.current && isCreate && !disabled) {
          try { saveDraft(DRAFT_KEY, validatedFormRef.current.getValues()); } catch { /* ignore error */ }
        }
      },
      clearDraft: () => {
        try { removeDraft(DRAFT_KEY); } catch { /* ignore error */ }
        resetFormDirty();
        if (onDirtyChange) onDirtyChange(false);
      },
      hasUnsavedChanges: () => isFormDirty,
    }));

    const SectionTitle = ({ children }) => (
      <div style={{
        fontSize: 12, fontWeight: 700, color: "#6b7280",
        textTransform: "uppercase", letterSpacing: "0.08em",
        borderBottom: "1px solid #e5e7eb", paddingBottom: 4,
        marginBottom: 12, marginTop: 20,
      }}>
        {children}
      </div>
    );

    return (
      <div className="wog-page-wrapper" style={{ position: "relative" }}>
        <FullPageLoader
          loading={submitting}
          message="Saving Work Order GRN..."
          logoSrc={inspireLogo}
        />
        {loadingDetails && <Loader />}

        <style>{`
          .wog-product-card { margin-top: 10px; border: none; border-radius: 7px; }
          .wog-table-responsive {
            overflow-x: auto !important;
            overflow-y: visible !important;
          }
          .wog-table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
            margin-bottom: 0;
          }
          .wog-thead {
            position: sticky;
            top: 0;
            z-index: 24;
          }
          .wog-th {
            padding: 4px 8px !important;
            font-weight: bold !important;
            font-size: 13px !important;
            white-space: nowrap;
            border-bottom: 2px solid #dee2e6;
            border-right: 1px solid rgba(255, 255, 255, 0.3);
            background: #7A4B78 !important;
            color: #ffffff !important;
            text-align: center;
            text-transform: none !important;
          }
          .wog-td {
            padding: 4px 8px !important;
            vertical-align: middle;
            border-bottom: 1px solid #dee2e6;
            border-right: 1px solid #dee2e6;
          }
          .wog-input {
            width: 100% !important;
            padding: 3px 6px !important;
            font-size: 13px;
            background-color: #ffffff;
            cursor: text;
          }
          /* Hide spin buttons on numeric inputs */
          .wog-input::-webkit-outer-spin-button,
          .wog-input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number].wog-input {
            -moz-appearance: textfield;
          }
          .wog-input:focus {
            border-color: #86b7fe;
            outline: 0;
            box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
          }
          .wog-input:disabled {
            background-color: #e9ecef !important;
            cursor: not-allowed !important;
            color: #495057 !important;
          }
          .wog-td-actions {
            position: sticky !important;
            left: 0 !important;
            z-index: 10 !important;
            background: #fff !important;
            border-right: 2px solid #dee2e6 !important;
          }
          .wog-th-actions {
            position: sticky !important;
            left: 0 !important;
            top: 0 !important;
            z-index: 50 !important;
            background: #7A4B78  !important;
            color: #ffffff !important;
            border-right: 2px solid #fff !important;
          }
          .wog-text-right { text-align: right !important; }
          .wog-text-center { text-align: center !important; }

          /* Top Information section disabled fields styling scoped to this page */
          .wog-page-wrapper input:disabled, 
          .wog-page-wrapper select:disabled, 
          .wog-page-wrapper textarea:disabled {
            background-color: #e9ecef !important;
            color: #495057 !important;
            opacity: 1;
            cursor: not-allowed !important;
          }
          
          /* Compact top row fields */
          .wog-top-fields .form-control {
            padding: 0px 8px !important;
            font-size: 13px !important;
            height: 28px !important;
            min-height: 28px !important;
            line-height: 28px !important;
          }
          .wog-top-fields div[class*="-control"] {
            min-height: 28px !important;
            height: 28px !important;
            font-size: 13px !important;
          }
          .wog-top-fields div[class*="-ValueContainer"] {
            padding: 0px 6px !important;
            min-height: 26px !important;
            height: 26px !important;
          }
          .wog-top-fields div[class*="-IndicatorsContainer"] {
            height: 26px !important;
          }
          .wog-top-fields div[class*="-singleValue"],
          .wog-top-fields div[class*="-placeholder"] {
            margin: 0 !important;
            padding: 0 !important;
            line-height: 26px !important;
          }
          .wog-top-fields div[class*="-Input"] {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Compact table row fields */
          .wog-table .form-control.wog-input {
            padding: 0px 8px !important;
            height: 28px !important;
            min-height: 28px !important;
            line-height: 28px !important;
            font-size: 13px !important;
          }
          .wog-table div[class*="-control"] {
            min-height: 28px !important;
            height: 28px !important;
            font-size: 13px !important;
          }
          .wog-table div[class*="-ValueContainer"] {
            padding: 0px 6px !important;
            min-height: 26px !important;
            height: 26px !important;
          }
          .wog-table div[class*="-IndicatorsContainer"] {
            height: 26px !important;
          }
          .wog-table div[class*="-singleValue"],
          .wog-table div[class*="-placeholder"] {
            margin: 0 !important;
            padding: 0 !important;
            line-height: 26px !important;
          }
          .wog-table div[class*="-Input"] {
            margin: 0 !important;
            padding: 0 !important;
          }
          .wog-table .mb-2 {
            margin-bottom: 0 !important;
          }
          .wog-table .form-label {
            display: none !important;
          }

          /* ── Responsive: medium screens (half-collapsed sidebar ~1200px) ── */
          @media (max-width: 1200px) {
            .wog-top-fields .col-md-2 {
              flex: 0 0 auto;
              width: 33.33% !important;
              margin-bottom: 6px;
            }
            .wog-top-fields {
              flex-wrap: wrap !important;
            }
            .wog-grn-tab-bar {
              flex-wrap: wrap !important;
              gap: 4px !important;
            }
            .wog-table-responsive {
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch;
            }
          }

          /* ── Responsive: small screens (~900px) ── */
          @media (max-width: 900px) {
            .wog-top-fields .col-md-2 {
              width: 50% !important;
            }
            .wog-grn-tab-bar button {
              font-size: 12px !important;
              padding: 4px 10px !important;
            }
          }

          /* ── Responsive: very small screens (~600px) ── */
          @media (max-width: 600px) {
            .wog-top-fields .col-md-2 {
              width: 100% !important;
            }
            .wog-grn-tab-bar {
              flex-direction: column !important;
              align-items: flex-start !important;
            }
          }
        `}</style>

        <ValidatedForm
          ref={validatedFormRef}
          initialValues={initialValues}
          validation={validation}
          onSubmit={handleSubmit}
          onValuesChange={onValuesChange}
          disabled={isDisabled || disabled}
        >
          {({ values, errors, handleChange, handleBlur }) => (
            <>
              <div style={{ width: "100%", margin: "0 auto" }}>
                <div className="row mb-1 wog-top-fields">
                  <div className="col-md-2">
                    <FormField name="grnNo" label="GRN No" type="text" value={values?.grnNo} disabled style={{ background: "#f9fafb" }} />
                  </div>
                  <div className="col-md-2">
                    <FormField name="grnDate" label="GRN Date" type="date" value={values?.grnDate || ""} onChange={handleChange} onBlur={handleBlur} error={errors?.grnDate} disabled={true} style={{ background: "#f9fafb" }} />
                  </div>
                  <div className="col-md-2">
                    <ReactSelectField name="workOrderID" label="Work Order No" options={workOrderOptions} value={values?.workOrderID} onChange={(e) => {
                      handleChange(e);
                      const val = e?.target?.value;
                      const selectedOpt = workOrderOptions.find(o => String(o.value) === String(val));
                      const suppName = selectedOpt ? selectedOpt.supplier_name : "";
                      const suppID = selectedOpt ? selectedOpt.supplier_id : "";
                      handleChange({ target: { name: "supplierID", value: suppID } });
                      handleChange({ target: { name: "supplierName", value: suppName } });
                      loadItemOptions(val);
                      setExceedPendingErrors({});

                      let currentArr = values.productDetails ? [...values.productDetails] : [];
                      if (currentArr.length === 0) {
                        const newRow = createEmptyProductRow(submitCount);
                        currentArr = [newRow];
                        setActiveRowIndex(0);
                      } else {
                        currentArr = currentArr.map(r => ({
                          ...r,
                          itemCode: "",
                          itemDescription: "",
                          unit: "",
                          workOrderLineId: "",
                          duplicateError: false
                        }));
                      }
                      handleChange({ target: { name: "productDetails", value: currentArr } });
                    }} onBlur={handleBlur} error={errors?.workOrderID} disabled={isDisabled || disabled || !isCreate} required />
                  </div>
                  <div className="col-md-2">
                    <FormField name="supplierName" label="Supplier" type="text" value={values?.supplierName || ""} onChange={handleChange} onBlur={handleBlur} error={errors?.supplierName} disabled={true} style={{ background: "#f9fafb" }} />
                  </div>
                  <div className="col-md-2">
                    <FormField name="supplierInvoiceRef" label="Supplier Invoice Ref" type="text" value={values?.supplierInvoiceRef || ""} onChange={handleChange} onBlur={handleBlur} error={errors?.supplierInvoiceRef} disabled={isDisabled || disabled} />
                  </div>
                  <div className="col-md-2">
                    <FormField name="supplierInvoiceDate" label="Supplier Invoice Date" type="date" value={values?.supplierInvoiceDate || ""} onChange={handleChange} onBlur={handleBlur} error={errors?.supplierInvoiceDate} disabled={isDisabled || disabled} min={getMinInvoiceDate()} />
                  </div>
                </div>

                {/*  Product Details Card  */}
                <div className="card wog-product-card">
                  <div className="card-header wog-header"
                    style={{
                      background: "rgb(147, 108, 145)",
                      paddingTop: "4px",
                      paddingBottom: "4px",
                      marginBottom: "8px",
                      borderRadius: "7px",
                    }}
                  >
                    <div className="d-flex flex-wrap align-items-center justify-content-between w-100">
                      <div className="d-flex align-items-center gap-2">
                        <h5 style={{ fontSize: "16px", margin: 0, lineHeight: "1", color: "rgb(255, 255, 255)" }}>GRN Details</h5>
                        {/* Tab buttons */}
                        <div className="d-flex gap-1 ms-3 wog-grn-tab-bar">
                          {[{ key: "product", label: "Product" }, { key: "inspection", label: "Inspection" }, { key: "stock", label: "Stock Info" }].map(tab => {
                            const isTabDisabled = isCreate && tab.key !== "product";
                            return (
                              <button
                                key={tab.key}
                                type="button"
                                disabled={isTabDisabled}
                                onClick={() => setActiveProductTab(tab.key)}
                                style={{
                                  padding: "3px 12px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  borderRadius: "4px",
                                  border: activeProductTab === tab.key ? "2px solid #fff" : "2px solid rgba(255,255,255,0.4)",
                                  background: activeProductTab === tab.key ? "#fff" : "transparent",
                                  color: activeProductTab === tab.key ? "rgb(147,108,145)" : "#fff",
                                  cursor: isTabDisabled ? "not-allowed" : "pointer",
                                  opacity: isTabDisabled ? 0.5 : 1,
                                  transition: "all 0.15s",
                                }}
                              >
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2 ms-auto">
                        <button
                          type="button"
                          className="btn btn-sm"
                          disabled={isDisabled || disabled}
                          onClick={() => {
                            if (!values.workOrderID) {
                              showToast("Please select the Work Order Number first.", "error");
                              return;
                            }
                            const newRow = createEmptyProductRow(submitCount);
                            const arr = Array.isArray(values.productDetails) ? [...values.productDetails, newRow] : [newRow];
                            handleChange({ target: { name: "productDetails", value: arr } });
                            setActiveRowIndex(arr.length - 1);
                          }}
                          style={{
                            visibility: activeProductTab === "product" ? "visible" : "hidden",
                            background: (isDisabled || disabled) ? "#cccccc" : "#7A4B78",
                            color: "#fff",
                            borderRadius: "6px",
                            width: 33,
                            height: 33,
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            cursor: (isDisabled || disabled) ? "not-allowed" : "pointer",
                            opacity: (isDisabled || disabled) ? 0.6 : 1,
                          }}
                          title="Add Product Row"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="card-body p-0 flex-grow-1" style={{ display: activeProductTab === "product" ? "block" : "none" }}>
                    {(!values.productDetails || values.productDetails.length === 0) ? (
                      <div className="text-center text-muted py-4">No Products Added</div>
                    ) : (
                      <div className="table-responsive wog-table-responsive" style={{ overflowX: "auto", overflowY: "visible", width: "100%" }}>
                        <table className="table table-vcenter wog-table" style={{ width: "100%", tableLayout: "fixed", minWidth: "1400px" }}>
                          <thead className="wog-thead">
                            <tr>
                              <th className="wog-th wog-th-actions" style={{ width: "80px", textAlign: "center" }}>Actions</th>
                              <th className="wog-th" style={{ width: "60px", textAlign: "center" }}>S.No</th>
                              <th className="wog-th" style={{ width: "250px", minWidth: "250px", textAlign: "center" }}>Item Code / Description</th>
                              <th className="wog-th" style={{ width: "150px", minWidth: "150px", textAlign: "center" }}>Qty Advised</th>
                              <th className="wog-th" style={{ width: "230px", minWidth: "230px", textAlign: "center" }}>Qty Delivered (After Counting)</th>
                              <th className="wog-th" style={{ width: "230px", minWidth: "230px", textAlign: "center" }}>Qty Returned</th>
                              <th className="wog-th" style={{ width: "230px", minWidth: "230px", textAlign: "center" }}>Qty Returned Reason</th>
                              <th className="wog-th" style={{ width: "200px", minWidth: "200px", textAlign: "center" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {values.productDetails.map((row, index) => (
                              <React.Fragment key={index}>
                                <tr
                                  onClick={() => setActiveRowIndex(index)}
                                  onFocusCapture={() => setActiveRowIndex(index)}
                                  style={{ backgroundColor: activeRowIndex === index ? "#eef2f5" : "inherit" }}
                                >
                                  <td className="wog-td wog-td-actions" style={{ textAlign: "center" }}>
                                    <button type="button" className="btn btn-sm" disabled={isDisabled || disabled || (!isCreate && row.grn_line_id)}
                                      onClick={(e) => { e.stopPropagation(); setRowToDelete(index); setShowDeleteConfirm(true); }}
                                      style={{ padding: "4px 8px", fontSize: "12px", background: "transparent", color: (isDisabled || disabled || (!isCreate && row.grn_line_id)) ? "#cccccc" : "rgb(22,119,255)", border: "none", cursor: (isDisabled || disabled || (!isCreate && row.grn_line_id)) ? "not-allowed" : "pointer" }} title={(!isCreate && row.grn_line_id) ? "Existing rows cannot be deleted in edit mode" : "Remove Row"}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
                                    </button>
                                  </td>
                                  <td className="wog-td" style={{ textAlign: "center" }}>{index + 1}</td>
                                  <td className="wog-td">
                                    <ReactSelectField
                                      name={`productDetails[${index}].itemCode`}
                                      options={(() => {
                                        const valToCheck = typeof row.itemCode === "object" ? row.itemCode?.ValueText : row.itemCode;
                                        const labelToCheck = typeof row.itemCode === "object" ? (row.itemCode?.Item_Code || row.itemCode?.DisplayText) : null;
                                        const exists = itemOptions.some(opt => String(opt.value) === String(valToCheck));
                                        if (exists || !valToCheck || !labelToCheck) {
                                          return itemOptions;
                                        }
                                        return [
                                          ...itemOptions,
                                          { value: valToCheck, label: labelToCheck }
                                        ];
                                      })()}
                                      value={typeof row.itemCode === "object" ? row.itemCode?.ValueText : (row.itemCode || "")}
                                      onChange={(e) => {
                                        const val = e?.target?.value || e;
                                        const arr = [...values.productDetails];
                                        arr[index] = { ...arr[index] };

                                        const isDuplicate = val && arr.some((r, i) => {
                                          if (i === index) return false;
                                          const existingVal = typeof r.itemCode === "object" ? String(r.itemCode?.ValueText || "") : String(r.itemCode || "");
                                          return existingVal === String(val);
                                        });

                                        if (isDuplicate) {
                                          arr[index].duplicateError = true;
                                          arr[index].itemCode = "";
                                          arr[index].itemDescription = "";
                                          arr[index].unit = "";
                                          arr[index].workOrderLineId = "";
                                          arr[index].pendingQty = null;
                                        } else {
                                          arr[index].duplicateError = false;
                                          const opt = itemOptions.find(o => String(o.value) === String(val));
                                          arr[index].itemCode = opt ? String(opt.value) : String(val);
                                          arr[index].itemDescription = opt ? opt.description : "";
                                          arr[index].unit = opt ? opt.unit : "";
                                          arr[index].workOrderLineId = opt ? opt.work_order_line_id : "";
                                          arr[index].pendingQty = opt ? opt.pendingQty : null;
                                        }
                                        setExceedPendingErrors(prev => ({ ...prev, [index]: false }));
                                        handleChange({ target: { name: "productDetails", value: arr } });
                                      }}
                                      isDisabled={isDisabled || disabled}
                                      placeholder="Select Item..."
                                      className={((gridSubmitted && row._addedAtSubmitCount !== submitCount) && !row.itemCode) || row.duplicateError ? 'is-invalid' : ''}
                                    />
                                    {row.duplicateError && (
                                      <div style={{ color: "#dc3545", fontSize: "11px", marginTop: "2px", textAlign: "left" }}>Item code already exists</div>
                                    )}
                                    {((gridSubmitted && row._addedAtSubmitCount !== submitCount) && !row.itemCode) && !row.duplicateError && (
                                      <div style={{ color: "#dc3545", fontSize: "11px", marginTop: "2px", textAlign: "left" }}>Required*</div>
                                    )}
                                  </td>
                                  <td className="wog-td">
                                    <input type="text" inputMode="decimal" className={`form-control wog-input wog-text-right ${((gridSubmitted && row._addedAtSubmitCount !== submitCount) && !row.qtyAdvised) ? 'is-invalid' : ''}`} value={row.qtyAdvised ?? ""} onChange={(e) => { const valStr = e.target.value; const arr = [...values.productDetails]; arr[index] = { ...arr[index] }; const unit = String(arr[index].unit || "").trim().toUpperCase(); const isNOS = unit === "NOS"; const regex = isNOS ? INTEGER_QTY_REGEX : DECIMAL_QTY_REGEX; if (valStr === "" || regex.test(valStr)) { arr[index].qtyAdvised = valStr; handleChange({ target: { name: "productDetails", value: arr } }); } }} onFocus={(e) => { setTimeout(() => { e.target.select(); }, 0); }} onClick={(e) => { e.target.select(); }} disabled={isDisabled || disabled} required />
                                    {((gridSubmitted && row._addedAtSubmitCount !== submitCount) && !row.qtyAdvised) && (
                                      <div style={{ color: "#dc3545", fontSize: "11px", marginTop: "2px", textAlign: "left" }}>Required*</div>
                                    )}
                                  </td>
                                  <td className="wog-td">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      className={`form-control wog-input wog-text-right ${qtyErrors[index] || exceedPendingErrors[index] ? 'is-invalid' : ''}`}
                                      value={row.qtyDelivered ?? ""}
                                      onChange={(e) => {
                                        const valStr = e.target.value;
                                        const arr = [...values.productDetails];
                                        arr[index] = { ...arr[index] };
                                        const unit = String(arr[index].unit || "").trim().toUpperCase();
                                        const isNOS = unit === "NOS";
                                        const regex = isNOS ? INTEGER_QTY_REGEX : DECIMAL_QTY_REGEX;
                                        if (valStr === "" || regex.test(valStr)) {
                                          arr[index].qtyDelivered = valStr;
                                          if (valStr !== "") {
                                            arr[index].qtyCountedBy = getPreparedBy() || "";
                                            arr[index].qtyCountedDate = new Date().toISOString().split("T")[0];
                                          } else {
                                            arr[index].qtyCountedBy = "";
                                            arr[index].qtyCountedDate = "";
                                          }
                                          setQtyErrors(prev => ({ ...prev, [index]: false }));
                                          setExceedPendingErrors(prev => ({ ...prev, [index]: false }));
                                          handleChange({ target: { name: "productDetails", value: arr } });
                                        }
                                      }}
                                      onFocus={(e) => {
                                        setTimeout(() => {
                                          e.target.select();
                                        }, 0);
                                      }}
                                      onClick={(e) => {
                                        e.target.select();
                                      }}
                                      disabled={isDisabled || disabled}
                                    />
                                    {exceedPendingErrors[index] && (
                                      <div style={{ color: "#dc3545", fontSize: "11px", marginTop: "2px", textAlign: "left" }}>
                                        Exceeds pending qty.
                                        {/* ({getRowPendingQty(row) ?? 0}) */}
                                      </div>
                                    )}
                                  </td>
                                  <td className="wog-td">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      className={`form-control wog-input wog-text-right ${qtyErrors[index] ? 'is-invalid' : ''}`}
                                      value={row.qtyReturned ?? ""}
                                      onChange={(e) => {
                                        const valStr = e.target.value;
                                        const arr = [...values.productDetails];
                                        arr[index] = { ...arr[index] };
                                        const unit = String(arr[index].unit || "").trim().toUpperCase();
                                        const isNOS = unit === "NOS";
                                        const regex = isNOS ? INTEGER_QTY_REGEX : DECIMAL_QTY_REGEX;
                                        if (valStr === "" || regex.test(valStr)) {
                                          arr[index].qtyReturned = valStr;
                                          if (valStr !== "") {
                                            arr[index].qtyReturnedBy = getPreparedBy() || "";
                                            arr[index].qtyReturnedDate = new Date().toISOString().split("T")[0];
                                          } else {
                                            arr[index].qtyReturnedBy = "";
                                            arr[index].qtyReturnedDate = "";
                                            arr[index].qtyReturnedReason = "";
                                          }
                                          setQtyErrors(prev => ({ ...prev, [index]: false }));
                                          setExceedPendingErrors(prev => ({ ...prev, [index]: false }));
                                          handleChange({ target: { name: "productDetails", value: arr } });
                                        }
                                      }}
                                      onFocus={(e) => {
                                        setTimeout(() => {
                                          e.target.select();
                                        }, 0);
                                      }}
                                      onClick={(e) => {
                                        e.target.select();
                                      }}
                                      disabled={isDisabled || disabled}
                                    />
                                  </td>
                                  <td className="wog-td">
                                    <input
                                      type="text"
                                      className={`form-control wog-input ${returnReasonErrors[index] ? 'is-invalid' : ''}`}
                                      value={row.qtyReturnedReason ?? ""}
                                      placeholder={Number(row.qtyReturned || 0) > 0 ? "" : ""}
                                      onChange={(e) => {
                                        const arr = [...values.productDetails];
                                        arr[index] = { ...arr[index] };
                                        arr[index].qtyReturnedReason = e.target.value;
                                        if (e.target.value.trim()) {
                                          setReturnReasonErrors(prev => ({ ...prev, [index]: false }));
                                        }
                                        handleChange({ target: { name: "productDetails", value: arr } });
                                      }}
                                      disabled={isDisabled || disabled || Number(row.qtyReturned || 0) === 0}
                                    />
                                    {returnReasonErrors[index] && (
                                      <div style={{ color: "#dc3545", fontSize: "11px", marginTop: "2px", textAlign: "left" }}>Required*</div>
                                    )}
                                  </td>
                                  <td className="wog-td"><input type="text" className="form-control wog-input" value={(!row.grn_line_id) ? "New Record" : (row.doc_istatus_text || row.documentIStatusText || (String(row.docIStatus) === "30" ? "Approved" : (String(row.docIStatus) === "60" ? "Cancelled" : (String(row.docIStatus) === "10" ? "Not Approved" : row.docIStatus))) || "")} disabled={true} /></td>
                                </tr>
                                <tr key={`sub-p-${index}`} style={{ backgroundColor: "#f8fafc" }} onClick={() => setActiveRowIndex(index)} onFocusCapture={() => setActiveRowIndex(index)}>
                                  <td className="wog-td" colSpan="2" style={{ borderRight: "1px solid #e2e8f0" }}></td>
                                  <td className="wog-td" style={{ padding: "8px 12px", verticalAlign: "middle", maxWidth: "250px" }}>
                                    <div title={row.itemDescription || (itemOptions.find(o => String(o.value) === String(row.itemCode))?.description) || ""} style={{ fontSize: "12.5px", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", lineHeight: "1.4" }}>{row.itemDescription || (itemOptions.find(o => String(o.value) === String(row.itemCode))?.description) || ""}</div>
                                  </td>
                                  <td className="wog-td" style={{ padding: "8px 12px", verticalAlign: "middle", textAlign: "right" }}>
                                    <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: "500" }}>{row.unit || (itemOptions.find(o => String(o.value) === String(row.itemCode))?.unit) || ""}</div>
                                  </td>
                                  <td className="wog-td" style={{ padding: "8px 12px", verticalAlign: "middle", textAlign: "left" }}>
                                    {(row.qtyCountedBy || row.qtyCountedDate) && (
                                      <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                                        By/Date: <span title={row.qtyCountedBy} style={{ fontWeight: "500", color: "#1e293b", cursor: "default" }}>{row.qtyCountedBy || "—"}</span> / {row.qtyCountedDate ? row.qtyCountedDate.split('-').reverse().join('/') : "—"}
                                      </div>
                                    )}
                                  </td>
                                  <td className="wog-td" style={{ padding: "8px 12px", verticalAlign: "middle", textAlign: "left" }}>
                                    {(row.qtyReturnedBy || row.qtyReturnedDate) && (
                                      <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                                        By/Date: <span title={row.qtyReturnedBy} style={{ fontWeight: "500", color: "#1e293b", cursor: "default" }}>{row.qtyReturnedBy || "—"}</span> / {row.qtyReturnedDate ? row.qtyReturnedDate.split('-').reverse().join('/') : "—"}
                                      </div>
                                    )}
                                  </td>
                                  <td className="wog-td"></td>
                                  <td className="wog-td"></td>
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* TAB: GRN Inspection */}
                  <div className="card-body p-0 flex-grow-1" style={{ display: activeProductTab === "inspection" ? "block" : "none" }}>
                    {(!values.productDetails || values.productDetails.length === 0) ? (
                      <div className="text-center text-muted py-4">No Products Added</div>
                    ) : (
                      <div className="table-responsive wog-table-responsive" style={{ overflowX: "auto", overflowY: "visible", width: "100%" }}>
                        <table className="table table-vcenter wog-table" style={{ width: "100%", tableLayout: "fixed", minWidth: "1500px" }}>
                          <thead className="wog-thead">
                            <tr>
                              <th className="wog-th" style={{ width: "60px", textAlign: "center" }}>S.No</th>
                              <th className="wog-th" style={{ width: "250px", minWidth: "250px", textAlign: "center" }}>Item Code / Description</th>
                              <th className="wog-th" style={{ minWidth: "120px", textAlign: "center" }}>Qty Rejected</th>
                              <th className="wog-th" style={{ minWidth: "140px", textAlign: "center" }}>Testing Rejected</th>
                              <th className="wog-th" style={{ width: "200px", minWidth: "180px", textAlign: "center" }}>Qty Accepted For Supplier</th>
                              <th className="wog-th" style={{ minWidth: "120px", textAlign: "center" }}>Qty Accepted</th>

                              <th className="wog-th" style={{ minWidth: "120px", textAlign: "center" }}>QA Status</th>
                              <th className="wog-th" style={{ minWidth: "150px", textAlign: "center" }}>QA Checked By</th>
                              <th className="wog-th" style={{ minWidth: "150px", textAlign: "center" }}>QA Checked Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {values.productDetails.map((row, index) => (
                              <React.Fragment key={index}>
                                <tr onClick={() => setActiveRowIndex(index)} onFocusCapture={() => setActiveRowIndex(index)} style={{ backgroundColor: activeRowIndex === index ? "#eef2f5" : "inherit", height: "55px" }}>
                                  <td className="wog-td" style={{ textAlign: "center" }}>{index + 1}</td>
                                  <td className="wog-td">
                                    <ReactSelectField
                                      name={`productDetails[${index}].itemCode_insp`}
                                      options={itemOptions}
                                      value={row.itemCode || ""}
                                      isDisabled={true}
                                      placeholder="Select Item..."
                                    />
                                  </td>
                                  <td className="wog-td"><input type="number" className="form-control wog-input wog-text-right" value={row.qtyRejected || ""} disabled={true} /></td>
                                  <td className="wog-td"><input type="number" className="form-control wog-input wog-text-right" value={row.qtyTestingRejected || ""} disabled={true} /></td>
                                  <td className="wog-td"><input type="number" className="form-control wog-input wog-text-right" value={row.qtyAcceptedForSupplier || ""} disabled={true} /></td>
                                  <td className="wog-td"><input type="number" className="form-control wog-input wog-text-right" value={row.qtyAccepted || ""} disabled={true} /></td>

                                  <td className="wog-td"><input type="text" className="form-control wog-input" value={row.qaStatusText || ""} disabled={true} /></td>
                                  <td className="wog-td"><input type="text" className="form-control wog-input" value={row.qaCheckedBy || ""} disabled={true} /></td>
                                  <td className="wog-td"><input type="date" className="form-control wog-input" value={row.qaCheckedDate || ""} disabled={true} /></td>
                                </tr>
                                <tr key={`sub-i-${index}`} style={{ backgroundColor: "#f8fafc" }}>
                                  <td className="wog-td"></td>
                                  <td className="wog-td" style={{ padding: "8px 12px", verticalAlign: "middle", maxWidth: "250px" }}>
                                    <div title={row.itemDescription || (itemOptions.find(o => String(o.value) === String(row.itemCode))?.description) || ""} style={{ fontSize: "12.5px", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", lineHeight: "1.4" }}>{row.itemDescription || (itemOptions.find(o => String(o.value) === String(row.itemCode))?.description) || ""}</div>
                                  </td>
                                  <td className="wog-td" style={{ padding: "8px 12px", verticalAlign: "middle", maxWidth: "120px" }}>
                                    <div title={row.qtyRejectedReason || ""} style={{ fontSize: "12.5px", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", lineHeight: "1.4" }}>{row.qtyRejectedReason || ""}</div>
                                  </td>
                                  <td className="wog-td" style={{ padding: "8px 12px", verticalAlign: "middle", textAlign: "right" }}>
                                    <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: "500" }}>{row.unit || (itemOptions.find(o => String(o.value) === String(row.itemCode))?.unit) || ""}</div>
                                  </td>
                                  <td className="wog-td" colSpan="5"></td>
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="card-body p-0 flex-grow-1" style={{ display: activeProductTab === "stock" ? "block" : "none" }}>
                    {(!values.productDetails || values.productDetails.length === 0) ? (
                      <div className="text-center text-muted py-4">No Products Added</div>
                    ) : (
                      <div className="table-responsive wog-table-responsive" style={{ overflowX: "auto", overflowY: "visible", width: "100%" }}>
                        <table className="table table-vcenter wog-table" style={{ width: "100%", tableLayout: "fixed", minWidth: "1000px" }}>
                          <thead className="wog-thead">
                            <tr>
                              <th className="wog-th" style={{ width: "60px", textAlign: "center" }}>S.No</th>
                              <th className="wog-th" style={{ width: "250px", minWidth: "250px", textAlign: "center" }}>Item Code / Description</th>
                              <th className="wog-th" style={{ minWidth: "150px", textAlign: "center" }}>Batch No</th>

                              <th className="wog-th" style={{ minWidth: "120px", textAlign: "center" }}>Qty Stocked</th>
                              <th className="wog-th" style={{ minWidth: "150px", textAlign: "center" }}>Stock Added By</th>
                              <th className="wog-th" style={{ minWidth: "150px", textAlign: "center" }}>Stock Added Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {values.productDetails.map((row, index) => (
                              <React.Fragment key={index}>
                                <tr onClick={() => setActiveRowIndex(index)} onFocusCapture={() => setActiveRowIndex(index)} style={{ backgroundColor: activeRowIndex === index ? "#eef2f5" : "inherit", height: "55px" }}>
                                  <td className="wog-td" style={{ textAlign: "center" }}>{index + 1}</td>
                                  <td className="wog-td">
                                    <ReactSelectField
                                      name={`productDetails[${index}].itemCode_stock`}
                                      options={itemOptions}
                                      value={row.itemCode || ""}
                                      isDisabled={true}
                                      placeholder="Select Item..."
                                    />
                                  </td>
                                  <td className="wog-td"><input type="text" className="form-control wog-input" value={row.batchNo || ""} disabled={true} /></td>

                                  <td className="wog-td"><input type="number" className="form-control wog-input wog-text-right" value={row.qtyStocked || ""} disabled={true} /></td>
                                  <td className="wog-td"><input type="text" className="form-control wog-input" value={row.stockAddedBy || ""} disabled={true} /></td>
                                  <td className="wog-td"><input type="date" className="form-control wog-input" value={row.stockAddedDate || ""} disabled={true} /></td>
                                </tr>
                                <tr key={`sub-s-${index}`} style={{ backgroundColor: "#f8fafc" }}>
                                  <td className="wog-td"></td>
                                  <td className="wog-td" style={{ padding: "8px 12px", verticalAlign: "middle", maxWidth: "250px" }}>
                                    <div title={row.itemDescription || (itemOptions.find(o => String(o.value) === String(row.itemCode))?.description) || ""} style={{ fontSize: "12.5px", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", lineHeight: "1.4" }}>{row.itemDescription || (itemOptions.find(o => String(o.value) === String(row.itemCode))?.description) || ""}</div>
                                  </td>
                                  <td className="wog-td" style={{ padding: "8px 12px", verticalAlign: "middle", textAlign: "right" }}>
                                    <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: "500" }}>{row.unit || (itemOptions.find(o => String(o.value) === String(row.itemCode))?.unit) || ""}</div>
                                  </td>
                                  <td className="wog-td" colSpan="3"></td>
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="row mt-2 mb-3 gx-2 align-items-end">
                  <div className="col-md-3">
                    <TextAreaFormField name="remarks" label="Remarks" rows={1} value={values?.remarks || ""} onChange={handleChange} onBlur={handleBlur} error={errors?.remarks} disabled={isDisabled || disabled} />
                  </div>
                  <div className="col">
                    <FormField name="grnStatusText" label="Document Status" type="text" value={values?.grnStatusText || ""} disabled style={{ background: "#f9fafb" }} />
                  </div>
                  <div className="col">
                    <FormField name="preparedBy" label="Prepared By" type="text" value={values?.preparedBy || ""} disabled style={{ background: "#f9fafb" }} />
                  </div>
                  <div className="col">
                    <FormField name="prepDate" label="Prepared Date" type="date" value={values?.prepDate || ""} disabled style={{ background: "#f9fafb" }} />
                  </div>
                  <div className="col">
                    <FormField name="updatedBy" label="Updated By" type="text" value={values?.updatedBy || ""} disabled style={{ background: "#f9fafb" }} />
                  </div>
                  <div className="col">
                    <FormField name="updatedDate" label="Updated Date" type="date" value={values?.updatedDate || ""} disabled style={{ background: "#f9fafb" }} />
                  </div>
                </div>

              </div>
              <DeleteConfirmDialog
                open={showDeleteConfirm}
                title="Confirm Delete"
                message="this product"
                onConfirm={() => {
                  if (rowToDelete !== null) {
                    const arr = [...values.productDetails];
                    arr.splice(rowToDelete, 1);
                    handleChange({ target: { name: "productDetails", value: arr } });
                    if (activeRowIndex === rowToDelete) setActiveRowIndex(null);

                    const updatedQtyErrs = { ...qtyErrors };
                    delete updatedQtyErrs[rowToDelete];
                    const newErrs = {};
                    Object.keys(updatedQtyErrs).forEach(key => {
                      const k = parseInt(key);
                      if (k > rowToDelete) newErrs[k - 1] = updatedQtyErrs[key];
                      else newErrs[k] = updatedQtyErrs[key];
                    });
                    setQtyErrors(newErrs);

                    const updatedExceedErrs = { ...exceedPendingErrors };
                    delete updatedExceedErrs[rowToDelete];
                    const newExceedErrs = {};
                    Object.keys(updatedExceedErrs).forEach(key => {
                      const k = parseInt(key);
                      if (k > rowToDelete) newExceedErrs[k - 1] = updatedExceedErrs[key];
                      else newExceedErrs[k] = updatedExceedErrs[key];
                    });
                    setExceedPendingErrors(newExceedErrs);
                  }
                  setShowDeleteConfirm(false);
                  setRowToDelete(null);
                }}
                onCancel={() => {
                  setShowDeleteConfirm(false);
                  setRowToDelete(null);
                }}
              />
            </>
          )}
        </ValidatedForm>
      </div>
    );
  }
);

SaveWorkOrderGRN.displayName = "SaveWorkOrderGRN";
export default SaveWorkOrderGRN;

