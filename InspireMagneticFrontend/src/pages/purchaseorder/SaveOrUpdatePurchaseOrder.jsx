import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  FormField,
  TextAreaFormField,
  ReactSelectField,
  EditableSelectField,
} from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import useDirtyDraftDrawer from "../../hooks/useDirtyDraftDrawer";
import { DeleteConfirmDialog } from "../../components/Notification";
import { useToast } from "../../components/useToast";
import FullPageLoader from "../../components/FullPageLoader";
import Loader from "../../components/Loader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import { getPreparedBy } from "../../utils/userSession";
import { ERROR_STATUS, SUCCESS_STATUS } from "../../utils/ConstVariables";
import {
  saveAndUpdatePurchaseOrderHeader,
  fetchPurchaseOrderHeaderDetails,
  fetchPurchaseOrderTypes,
  fetchPOSupplierNames,
  fetchPOCurrencies,
  fetchPOPriceScopes,
  fetchPOInvProducts,
} from "../../services/purchaseOrderService";


const todayObj = new Date();
const today = todayObj.toISOString().split("T")[0];
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
const minDateString = threeMonthsAgo.toISOString().split("T")[0];

const formatDateTimeForPayload = (dateStr, fallbackTime = "00:00:00") => {
  if (!dateStr) return "";
  const parts = dateStr.split(/[T ]/);
  const datePart = parts[0];
  let timePart = parts[1] || fallbackTime;
  timePart = timePart.split(".")[0];
  return `${datePart} ${timePart}`;
};

const initialForm = {
  purchaseOrderID: 0,
  purchaseOrderNumber: "0",
  purchaseOrderDate: today,
  purchaseType: 1, // Default 1 - Local
  currencyID: "INR",
  currencyConversionRate: 1.0,
  supplierID: "",
  grossPurchaseAmount: 0,
  priceScope: "",
  transportTerms: "",
  insuranceTerms: "",
  documentStatus: 0,
  preparedBy: getPreparedBy(),
  prepDate: today,
  remarks: "",
  docStatusText: "New Record",
  paramType: "ADD",
  updatedBy: "",
  updatedDate: "",
  approvedBy: "",
  approvedDate: "",
  responsiblePerson: "",
  shipAddress: "",
  deliveryInfo: "",
  paymentInfo: "",
  freightAmount: 0,
  custRefNo: "",
  custDate: "",
  otherRef: "",
  totalNetAmt: 0,
  totalIgstAmt: 0,
  totalCgstAmt: 0,
  totalSgstAmt: 0,
};

const SaveOrUpdatePurchaseOrder = forwardRef(
  ({ onSuccess, initialData, editMode: editModeProp, onDirtyChange, disabled, onValuesChange, open = true }, ref) => {
    const { showToast } = useToast();
    const validatedFormRef = useRef();
    const updateBaselineRef = useRef(null);
    const [productRows, setProductRows] = useState([]);
    const [productErrors, setProductErrors] = useState({});
    const productNameRefs = useRef([]);
    const newProductIndexRef = useRef(null);
    const isCreate = !initialData || initialData.isPreFilled;
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const activeRowIndexRef = useRef(null);
    const [, setActiveDesc] = useState("");
    const productRowsRef = useRef([]);
    const fetchedPoIdRef = useRef(null);
    const initialProductsRef = useRef([]);

    const originalPurchaseOrderDateRef = useRef("");
    const originalCustomerDateRef = useRef("");

    useEffect(() => {
      if (initialData && !initialData.isPreFilled) {
        const origDate = initialData.purchase_order_date || initialData.purchaseOrderDate || "";
        if (origDate) {
          originalPurchaseOrderDateRef.current = origDate;
        }
        const origCustDate = initialData.customerDate || initialData.cust_date || initialData.custDate || "";
        if (origCustDate) {
          originalCustomerDateRef.current = origCustDate;
        }
      } else {
        originalPurchaseOrderDateRef.current = "";
        originalCustomerDateRef.current = "";
      }
    }, [initialData]);

    const [editMode, setEditMode] = useState(
      disabled ? false : (editModeProp === undefined ? (isCreate ? true : false) : editModeProp)
    );
    const isDisabled = initialData ? !editMode : false;

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [rowToDelete, setRowToDelete] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [itemOptions, setItemOptions] = useState([]);
    const [purchaseTypeOptions, setPurchaseTypeOptions] = useState([]);
    const [currencyOptions, setCurrencyOptions] = useState([]);
    const [priceScopeOptions, setPriceScopeOptions] = useState([]);
    const [inactiveSupplierAttempt, setInactiveSupplierAttempt] = useState(false);
    // Track the Supply type of the previously selected supplier
    const prevSupplierSupplyRef = useRef(null);

    const onDirtyChangeRef = useRef(onDirtyChange);
    useEffect(() => {
      onDirtyChangeRef.current = onDirtyChange;
    }, [onDirtyChange]);

    useEffect(() => {
      setEditMode(editModeProp === undefined ? (isCreate ? true : false) : editModeProp);
    }, [editModeProp, isCreate]);

    const [loadingDetails, setLoadingDetails] = useState(false);
    const [fetchedData, setFetchedData] = useState(null);

    useEffect(() => {
      async function loadTypes() {
        try {
          const typesData = await fetchPurchaseOrderTypes();
          if (Array.isArray(typesData)) {
            setPurchaseTypeOptions(
              typesData.map((item) => ({
                value: item.ValueText,
                label: item.DisplayText,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching Purchase Types:", error);
        }

        try {
          const currData = await fetchPOCurrencies();
          if (Array.isArray(currData)) {
            setCurrencyOptions(
              currData.map((item) => ({
                value: item.ValueText,
                label: item.DisplayText,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching Currencies:", error);
        }

        try {
          const psData = await fetchPOPriceScopes();
          if (Array.isArray(psData)) {
            setPriceScopeOptions(
              psData.map((item) => ({
                value: item.ValueText,
                label: item.DisplayText,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching Price Scopes:", error);
        }

      }
      loadTypes();
    }, []);

    const validation = React.useMemo(() => ({
      purchaseType: {
        required: true,
        fieldLabel: "PO Type",
        controlType: "dropdown",
      },
      supplierID: {
        required: true,
        fieldLabel: "Supplier Name",
        controlType: "dropdown",
        validator: (value) => {
          if (!value) return "Required*";
          const selected = supplierOptions.find(opt => String(opt.value) === String(value));
          if (selected && Number(selected.status) === 0) {
            return "Please select an active supplier name";
          }
          return "";
        }
      },
      currencyID: {
        required: true,
        fieldLabel: "Currency",
        controlType: "dropdown",
      },
      priceScope: {
        fieldLabel: "Price Scope",
        controlType: "dropdown",
      },
      purchaseOrderDate: {
        required: true,
        fieldLabel: "Date",
      },
      responsiblePerson: {
        required: true,
        fieldLabel: "Kind Attention",
      },
    }), [supplierOptions]);

    useEffect(() => {
      if (isDisabled) return;
      async function loadSuppliers() {
        try {
          const supplierData = await fetchPOSupplierNames();
          if (Array.isArray(supplierData)) {
            setSupplierOptions(
              supplierData.map((item) => ({
                value: item.ValueText,
                label: item.DisplayText,
                status: item.supplier_status,
                responsiblePersonName: item.ResponsiblePersonName,
                employerAddress: item.EmployerAddress || "",
                supply: item.Supply ?? null,
              }))
            );
            if (isCreate && supplierData.length > 0) {
              const defaultShipAddress = supplierData.find(item => item.EmployerAddress)?.EmployerAddress || supplierData[0]?.EmployerAddress || "";
              if (defaultShipAddress && validatedFormRef.current) {
                const currentShipAddress = validatedFormRef.current.getValues?.()?.shipAddress;
                if (!currentShipAddress) {
                  validatedFormRef.current.setFieldValue("shipAddress", defaultShipAddress);
                  // Re-establish baseline after programmatic default so it's not treated as a user edit
                  setTimeout(() => {
                    if (validatedFormRef.current && updateBaselineRef.current) {
                      const currentVals = validatedFormRef.current.getValues?.() || {};
                      updateBaselineRef.current({ ...currentVals, shipAddress: defaultShipAddress });
                    }
                  }, 50);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching Supplier Names:", error);
        }
      }
      loadSuppliers();
    }, [isDisabled, isCreate]);

    useEffect(() => {
      if (isCreate && currencyOptions.length > 0 && validatedFormRef.current) {
        const inrOpt = currencyOptions.find(
          (opt) =>
            String(opt.label).toUpperCase() === "INR" ||
            String(opt.value).toUpperCase() === "INR"
        );
        if (inrOpt) {
          const currentVal = validatedFormRef.current.getValues?.()?.currencyID;
          if (!currentVal || currentVal === "INR") {
            validatedFormRef.current.setFieldValue("currencyID", inrOpt.value);
            // Re-establish baseline after programmatic default so it's not treated as a user edit
            setTimeout(() => {
              if (validatedFormRef.current && updateBaselineRef.current) {
                const currentVals = validatedFormRef.current.getValues?.() || {};
                updateBaselineRef.current({ ...currentVals, currencyID: inrOpt.value });
              }
            }, 50);
          }
        }
      }
    }, [isCreate, currencyOptions]);
    useEffect(() => {
      async function getDetails() {
        if (initialData && !initialData.isPreFilled && initialData.purchase_order_id) {
          const poId = initialData.purchase_order_id;

          if (fetchedPoIdRef.current === poId) return;
          fetchedPoIdRef.current = poId;

          setLoadingDetails(true);
          try {
            const res = await fetchPurchaseOrderHeaderDetails({ purchaseOrderID: Number(poId) });
            if (res && res.Status === SUCCESS_STATUS && res.data) {
              const header = res.data.PURCHASE_ORDER_HEADER_RESPONSE?.[0] || {};
              const details = res.data.PURCHASE_ORDER_DETAILS_RESPONSE || [];

              originalPurchaseOrderDateRef.current = header.purchase_order_date || "";
              originalCustomerDateRef.current = header.customerDate || header.cust_date || "";

              setFetchedData({
                purchaseOrderID: header.purchase_order_id || poId,
                purchaseOrderNumber: header.purchase_order_no || "",
                purchaseOrderDate: header.purchase_order_date ? header.purchase_order_date.split("T")[0] : "",
                purchaseType: header.purchase_type || 1,
                purchaseTypeText: header.purchase_type_text || "",
                currencyID: header.currency_id || "",
                currencyCode: header.currency_code || "",
                currencyConversionRate: header.conversion_rate || header.currency_conversion_rate || 1.0,
                supplierID: header.supplier_id || "",
                supplierName: header.supplier_name || "",
                grossPurchaseAmount: header.gross_purchase_amount || 0,
                priceScope: header.price_scope || "",
                priceScopeText: header.price_scope_text || header.price_scope || "",
                transportTerms: header.transport_terms || "",
                insuranceTerms: header.insurance_terms || "",
                documentStatus: header.doc_status || 0,
                preparedBy: header.prep_by || getPreparedBy(),
                prepDate: header.prep_date ? header.prep_date.split("T")[0] : "",
                remarks: header.remarks || "",
                docStatusText: header.doc_status_text || (header.doc_status === 30 ? "Approved" : "Not Approved"),
                paramType: "ADD",
                updatedBy: header.update_by || "",
                updatedDate: header.update_date ? header.update_date.split("T")[0] : "",
                approvedBy: header.approved_by || "",
                approvedDate: header.approved_date ? header.approved_date.split("T")[0] : "",
                responsiblePerson: header.responsible_person || "",
                shipAddress: header.ship_address || "",
                deliveryInfo: header.delivery_info || "",
                paymentInfo: header.payment_info || "",
                freightAmount: header.freight_amount || 0,
                custRefNo: header.customerReferenceNumber || header.cust_ref_no || header.custRefNo || "",
                custDate: header.customerDate ? header.customerDate.split("T")[0] : (header.cust_date ? header.cust_date.split("T")[0] : ""),
                otherRef: header.otherReference || header.other_ref || header.otherRef || "",
                totalNetAmt: Math.round(Number(header.totalNetAmount ?? header.total_net_amt ?? header.totalNetAmt ?? header.gross_purchase_amount ?? 0)),
                totalIgstAmt: Math.round(Number(header.totalIgstAmount ?? header.total_igst_amt ?? header.totalIgstAmt ?? 0)),
                totalCgstAmt: Math.round(Number(header.totalCgstAmount ?? header.total_cgst_amt ?? header.totalCgstAmt ?? 0)),
                totalSgstAmt: Math.round(Number(header.totalSgstAmount ?? header.total_sgst_amt ?? header.totalSgstAmt ?? 0)),
                purchaseOrderDetail: details.map((d) => ({
                  poLineID: d.purchase_order_line_id || d.po_line_id || 0,
                  purchaseOrderID: d.purchase_order_id || poId,
                  itemID: String(d.item_id ?? ""),
                  itemCode: d.item_code || d.itemCode || "",
                  supplierItemCode: d.supplier_itemcode || "",
                  quantityOrdered: d.qty_ordered || 0,
                  rate: d.unit_rate || d.rate || 0,
                  amount: d.amount ?? ((d.qty_ordered || 0) * (d.unit_rate || d.rate || 0)),
                  qtyDelivered: d.qty_delivered || 0,
                  qtyAccepted: d.qty_accepted || 0,
                  docIStatus: d.doc_istatus || 0,
                  docIStatusText: d.doc_istatus_text || "",
                  completedDate: d.purchase_order_completed_date ? d.purchase_order_completed_date.split("T")[0] : "",
                  deliveryDate: d.delivery_date ? d.delivery_date.split("T")[0] : "",
                  itemUnit: d.item_unit || d.itemUnit || "",
                  productDescription_cached: d.item_description || d.productDescription_cached || "",
                  itemStatus: d.item_status ?? 1,
                  igstPerc: d.igstPercentage ?? d.igst_perc ?? d.igstPerc ?? 0,
                  sgstPerc: d.sgstPercentage ?? d.sgst_perc ?? d.sgstPerc ?? 0,
                  cgstPerc: d.cgstPercentage ?? d.cgst_perc ?? d.cgstPerc ?? 0,
                  igstAmt: d.igstAmount ?? d.igst_amt ?? d.igstAmt ?? 0,
                  sgstAmt: d.sgstAmount ?? d.sgst_amt ?? d.sgstAmt ?? 0,
                  cgstAmt: d.cgstAmount ?? d.cgst_amt ?? d.cgstAmt ?? 0,
                  duplicateError: false,
                })),
              });

              const mappedRows = details.map((d) => ({
                poLineID: d.purchase_order_line_id || d.po_line_id || 0,
                purchaseOrderID: d.purchase_order_id || poId,
                itemID: String(d.item_id ?? ""),
                itemCode: d.item_code || d.itemCode || "",
                supplierItemCode: d.supplier_itemcode || "",
                quantityOrdered: d.qty_ordered || 0,
                rate: d.unit_rate || d.rate || 0,
                amount: d.amount ?? ((d.qty_ordered || 0) * (d.unit_rate || d.rate || 0)),
                qtyDelivered: d.qty_delivered || 0,
                qtyAccepted: d.qty_accepted || 0,
                docIStatus: d.doc_istatus || 0,
                docIStatusText: d.doc_istatus_text || "",
                completedDate: d.purchase_order_completed_date ? d.purchase_order_completed_date.split("T")[0] : "",
                deliveryDate: d.delivery_date ? d.delivery_date.split("T")[0] : "",
                itemUnit: d.item_unit || d.itemUnit || "",
                productDescription_cached: d.item_description || d.productDescription_cached || "",
                itemStatus: d.item_status ?? 1,
                igstPerc: d.igstPercentage ?? d.igst_perc ?? d.igstPerc ?? 0,
                sgstPerc: d.sgstPercentage ?? d.sgst_perc ?? d.sgstPerc ?? 0,
                cgstPerc: d.cgstPercentage ?? d.cgst_perc ?? d.cgstPerc ?? 0,
                igstAmt: d.igstAmount ?? d.igst_amt ?? d.igstAmt ?? 0,
                sgstAmt: d.sgstAmount ?? d.sgst_amt ?? d.sgstAmt ?? 0,
                cgstAmt: d.cgstAmount ?? d.cgst_amt ?? d.cgstAmt ?? 0,
                duplicateError: false,
              }));
              productRowsRef.current = mappedRows;
              setProductRows(mappedRows);
            }
          } catch (e) {
            console.error("Error fetching PO details", e);
            showToast("Failed to load details", ERROR_STATUS.toLowerCase());
          } finally {
            setLoadingDetails(false);
          }
        }
      }
      getDetails();

      initialProductsRef.current = [];
      if (typeof onDirtyChangeRef.current === "function") {
        onDirtyChangeRef.current(false);
      }
    }, [initialData, showToast]);

    const initialValues = React.useMemo(() => {
      const sourceData = fetchedData || initialData;
      if (sourceData && !sourceData.isPreFilled) {
        return {
          ...sourceData,
          purchaseOrderID: sourceData.purchaseOrderID || sourceData.purchase_order_id || 0,
          purchaseOrderNumber: sourceData.purchaseOrderNumber || sourceData.purchase_order_no || "",
          purchaseOrderDate: sourceData.purchaseOrderDate || (sourceData.purchase_order_date ? sourceData.purchase_order_date.split("T")[0] : ""),
          purchaseType: sourceData.purchaseType || sourceData.purchase_type || 1,
          purchaseTypeText: sourceData.purchaseTypeText || sourceData.purchase_type_text || "",
          currencyID: sourceData.currencyID ?? sourceData.currency_id ?? "",
          currencyCode: sourceData.currencyCode || sourceData.currency_code || "",
          currencyConversionRate: sourceData.currencyConversionRate || sourceData.conversion_rate || sourceData.currency_conversion_rate || 1.0,
          supplierID: sourceData.supplierID || sourceData.supplier_id || "",
          supplierName: sourceData.supplierName || sourceData.supplier_name || "",
          grossPurchaseAmount: sourceData.grossPurchaseAmount || sourceData.gross_purchase_amount || 0,
          priceScope: sourceData.priceScope || sourceData.price_scope || "",
          priceScopeText: sourceData.priceScopeText || sourceData.price_scope_text || sourceData.priceScope || sourceData.price_scope || "",
          transportTerms: sourceData.transportTerms || sourceData.transport_terms || "",
          insuranceTerms: sourceData.insuranceTerms || sourceData.insurance_terms || "",
          documentStatus: sourceData.documentStatus || sourceData.doc_status || 0,
          preparedBy: sourceData.preparedBy || sourceData.prep_by || getPreparedBy(),
          prepDate: sourceData.prepDate || (sourceData.prep_date ? sourceData.prep_date.split("T")[0] : ""),
          remarks: sourceData.remarks || "",
          docStatusText: sourceData.docStatusText || sourceData.doc_status_text || "Not Approved",
          paramType: sourceData.paramType || "ADD",
          updatedBy: sourceData.updatedBy || sourceData.update_by || "",
          updatedDate: sourceData.updatedDate || (sourceData.update_date ? sourceData.update_date.split("T")[0] : "") || "",
          approvedBy: sourceData.approvedBy || sourceData.approved_by || "",
          approvedDate: sourceData.approvedDate || (sourceData.approved_date ? sourceData.approved_date.split("T")[0] : "") || "",
          responsiblePerson: sourceData.responsiblePerson || sourceData.responsible_person || "",
          shipAddress: sourceData.shipAddress || sourceData.ship_address || "",
          deliveryInfo: sourceData.deliveryInfo || sourceData.delivery_info || "",
          paymentInfo: sourceData.paymentInfo || sourceData.payment_info || "",
          freightAmount: sourceData.freightAmount || sourceData.freight_amount || 0,
          custRefNo: sourceData.custRefNo || sourceData.cust_ref_no || sourceData.customerReferenceNumber || "",
          custDate: sourceData.custDate || (sourceData.cust_date ? sourceData.cust_date.split("T")[0] : "") || (sourceData.customerDate ? sourceData.customerDate.split("T")[0] : "") || "",
          otherRef: sourceData.otherRef || sourceData.other_ref || sourceData.otherReference || "",
          totalNetAmt: Math.round(Number(sourceData.totalNetAmt ?? sourceData.total_net_amt ?? sourceData.totalNetAmount ?? sourceData.grossPurchaseAmount ?? sourceData.gross_purchase_amount ?? 0)),
          totalIgstAmt: Math.round(Number(sourceData.totalIgstAmt ?? sourceData.total_igst_amt ?? sourceData.totalIgstAmount ?? 0)),
          totalCgstAmt: Math.round(Number(sourceData.totalCgstAmt ?? sourceData.total_cgst_amt ?? sourceData.totalCgstAmount ?? 0)),
          totalSgstAmt: Math.round(Number(sourceData.totalSgstAmt ?? sourceData.total_sgst_amt ?? sourceData.totalSgstAmount ?? 0)),
          purchaseOrderDetail: Array.isArray(sourceData.purchaseOrderDetail) ? sourceData.purchaseOrderDetail : [],
        };
      }

      if (initialData && initialData.isPreFilled) {
        return {
          ...initialForm,
          purchaseOrderDetail: Array.isArray(initialData.purchaseOrderDetail) ? initialData.purchaseOrderDetail : [],
        };
      }

      try {
        const rawDraft = localStorage.getItem("draft_purchase_order_create");
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft);
          return { ...initialForm, ...parsed };
        }
      } catch {
        /* no-op */
      }

      return { ...initialForm, purchaseOrderDetail: [] };
    }, [initialData, fetchedData]);

    const initialProducts = React.useMemo(
      () => (initialValues && Array.isArray(initialValues.purchaseOrderDetail) ? initialValues.purchaseOrderDetail : []),
      [initialValues]
    );

    const [currentFormValues, setCurrentFormValues] = useState(initialValues);

    useEffect(() => {
      setCurrentFormValues(initialValues);
      setProductRows(initialProducts);
      productRowsRef.current = initialProducts;
      initialProductsRef.current = JSON.parse(JSON.stringify(initialProducts));
      if (validatedFormRef.current) {
        validatedFormRef.current.setValues(initialValues);
      }
    }, [initialValues, initialProducts]);

    useEffect(() => {
      async function loadProducts() {
        const supId = currentFormValues?.supplierID || "";
        try {
          const invData = await fetchPOInvProducts(supId);
          if (Array.isArray(invData)) {
            setItemOptions(invData);
          } else {
            setItemOptions([]);
          }
        } catch (error) {
          console.error("Error fetching Inventory Products:", error);
          setItemOptions([]);
        }
      }
      loadProducts();
    }, [currentFormValues?.supplierID]);

    const {
      isDirty: isFormDirty,
      onValuesChange: onFormValuesChange,
      resetDirty,
      updateBaseline
    } = useDirtyDraftDrawer({
      open,
      initialValues,
      initialData,
      draftKey: "draft_purchase_order_create",
    });

    updateBaselineRef.current = updateBaseline;

    const clearDraft = () => {
      try {
        localStorage.removeItem("draft_purchase_order_create");
        resetDirty?.();
      } catch {
        /* no-op */
      }
    };

    const saveDraft = () => {
      try {
        const latestFormValues =
          validatedFormRef.current &&
            typeof validatedFormRef.current.getValues === "function"
            ? validatedFormRef.current.getValues()
            : currentFormValues;

        const toSave = {
          ...latestFormValues,
          purchaseOrderDetail: productRowsRef.current || [],
        };
        localStorage.setItem("draft_purchase_order_create", JSON.stringify(toSave));
      } catch {
        /* no-op */
      }
    };

    const areProductsDirty = useCallback(() => {
      try {
        return JSON.stringify(productRows) !== JSON.stringify(initialProductsRef.current);
      } catch {
        return false;
      }
    }, [productRows]);

    const combinedIsDirty = isFormDirty || areProductsDirty();

    useEffect(() => {
      if (onDirtyChange) onDirtyChange(combinedIsDirty);
    }, [combinedIsDirty, onDirtyChange]);

    const formattedItemOptions = React.useMemo(() => {
      return itemOptions.map((opt) => ({
        ...opt,
        value: String(opt.item_id ?? ""),
        label: opt.Item_Code || "",
      }));
    }, [itemOptions]);

    const validateProductField = useCallback((rowIndex, field, value) => {
      const errors = { ...productErrors };
      if (!errors[rowIndex]) errors[rowIndex] = {};

      if (field === "itemID") {
        if (productRowsRef.current?.[rowIndex]?.duplicateError) {
          errors[rowIndex][field] = "Item code already exists";
        } else {
          if (!value || String(value).trim() === "" || Number(value) === 0) {
            errors[rowIndex][field] = "Required*";
          } else {
            delete errors[rowIndex][field];
          }
        }
      }

      if (field === "quantityOrdered" || field === "rate") {
        if (value === "" || value === null || value === undefined) {
          errors[rowIndex][field] = "Required*";
        } else if (Number(value) <= 0) {
          errors[rowIndex][field] = "Must be > 0";
        } else {
          delete errors[rowIndex][field];
        }
      }

      if (field === "deliveryDate") {
        if (!value || String(value).trim() === "") {
          errors[rowIndex][field] = "Required*";
        } else {
          delete errors[rowIndex][field];
        }
      }

      if (Object.keys(errors[rowIndex]).length === 0) {
        delete errors[rowIndex];
      }
      setProductErrors(errors);
    }, [productErrors]);

    const validateAllProducts = useCallback(() => {
      const allErrors = {};
      let isValid = true;

      productRows.forEach((row, idx) => {
        const rowErrors = {};
        if (row.duplicateError) {
          rowErrors.itemID = "Item code already exists";
          isValid = false;
        } else if (!row.itemID || Number(row.itemID) === 0) {
          rowErrors.itemID = "Required*";
          isValid = false;
        }
        if (!row.quantityOrdered || Number(row.quantityOrdered) <= 0) {
          rowErrors.quantityOrdered = "Required*";
          isValid = false;
        }
        if (!row.rate || Number(row.rate) <= 0) {
          rowErrors.rate = "Required*";
          isValid = false;
        }
        if (!row.deliveryDate) {
          rowErrors.deliveryDate = "Required*";
          isValid = false;
        }
        if (Object.keys(rowErrors).length > 0) {
          allErrors[idx] = rowErrors;
        }
      });

      setProductErrors(allErrors);
      return isValid;
    }, [productRows]);

    const handleFormValuesChange = useCallback(
      (values) => {
        setCurrentFormValues(values);
        onFormValuesChange(values);
        if (onValuesChange) {
          onValuesChange({ ...values, purchaseOrderDetail: productRowsRef.current });
        }
      },
      [onValuesChange, onFormValuesChange]
    );

    const handleRowFocus = useCallback(
      (rowIndex) => {
        if (activeRowIndexRef.current === rowIndex) return;
        activeRowIndexRef.current = rowIndex;
        setActiveRowIndex(rowIndex);

        const row = productRowsRef.current[rowIndex];
        if (!row) return;

        let descText = "";
        if (row.itemID) {
          const opt = itemOptions.find((o) => Number(o.item_id) === Number(row.itemID));
          if (opt) descText = opt.Item_Description || "";
        }
        setActiveDesc(descText);
      },
      [itemOptions]
    );

    const handleProductFieldChange = useCallback(
      (rowIndex, field, value) => {
        activeRowIndexRef.current = rowIndex;
        setActiveRowIndex(rowIndex);
        const updated = [...productRowsRef.current];

        let finalValue = value;
        if (field === "quantityOrdered") {
          const row = updated[rowIndex];
          const unit = (row?.itemUnit || "").toUpperCase();
          const valStr = String(value);

          if (valStr === "") {
            finalValue = "";
          } else {
            // Pattern based on unit
            const isNOS = unit === "NOS";
            const regex = isNOS
              ? /^\d{0,8}$/                        // Integer-only for NOS
              : /^\d{0,8}(\.\d{0,4})?$/;           // Decimal for others (12, 4)

            if (regex.test(valStr)) {
              finalValue = valStr;
            } else {
              return; // invalid input, don't update
            }
          }
        } else if (field === "rate") {
          const valStr = String(value);
          if (valStr !== "") {
            const regex = /^\d{0,8}(\.\d{0,4})?$/;
            if (regex.test(valStr)) finalValue = valStr;
            else return;
          }
        }

        const row = { ...updated[rowIndex], [field]: finalValue };

        if (field === "itemID") {
          const isDuplicate = value && updated.some((r, i) => {
            if (i === rowIndex) return false;
            return Number(r.itemID) === Number(value);
          });

          if (isDuplicate) {
            row.duplicateError = true;
            row.itemID = "";
            row.itemCode = "";
            row.itemUnit = "";
            row.productDescription_cached = "";
            row.cgstPerc = 0;
            row.sgstPerc = 0;
            row.igstPerc = 0;
            setActiveDesc("");
          } else {
            row.duplicateError = false;
            const selectedItem = itemOptions.find((opt) => Number(opt.item_id) === Number(value));
            if (selectedItem) {
              setActiveDesc(selectedItem.Item_Description || "");
              row.itemID = String(selectedItem.item_id ?? "");
              row.itemCode = selectedItem.Item_Code || "";
              row.itemUnit = selectedItem.Item_Unit || "";
              row.productDescription_cached = selectedItem.Item_Description || "";
              row.cgstPerc = selectedItem.CGST_Percentage ?? 0;
              row.sgstPerc = selectedItem.SGST_Percentage ?? 0;
              row.igstPerc = selectedItem.IGST_Percentage ?? 0;
            } else {
              setActiveDesc("");
              row.itemCode = "";
              row.itemUnit = "";
              row.productDescription_cached = "";
              row.cgstPerc = 0;
              row.sgstPerc = 0;
              row.igstPerc = 0;
            }
          }
        }

        if (field === "quantityOrdered" || field === "rate") {
          const qty = field === "quantityOrdered" ? Number(finalValue) : Number(row.quantityOrdered);
          const r = field === "rate" ? Number(finalValue) : Number(row.rate);
          row.amount = qty * r;
        }

        updated[rowIndex] = row;
        productRowsRef.current = updated;
        setProductRows(updated);

        const newGross = updated.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        if (validatedFormRef.current) {
          validatedFormRef.current.setFieldValue("grossPurchaseAmount", newGross);
          const newFormValues = { ...currentFormValues, grossPurchaseAmount: newGross };
          setCurrentFormValues(newFormValues);
          onFormValuesChange(newFormValues);
        }

        if (onValuesChange) {
          onValuesChange({ ...currentFormValues, grossPurchaseAmount: newGross, purchaseOrderDetail: updated });
        }
        validateProductField(rowIndex, field, value);
      },
      [currentFormValues, onValuesChange, validateProductField, itemOptions, onFormValuesChange]
    );

    const handleAddProductRow = useCallback(() => {
      if (!currentFormValues.supplierID || Number(currentFormValues.supplierID) === 0) {
        showToast("Please select the Supplier Name first.", ERROR_STATUS.toLowerCase());
        return;
      }

      const newRow = {
        poLineID: 0,
        purchaseOrderID: currentFormValues.purchaseOrderID || 0,
        itemID: "",
        supplierItemCode: "",
        quantityOrdered: "",
        rate: "",
        amount: 0,
        qtyDelivered: 0,
        qtyAccepted: 0,
        docIStatus: 0,
        docIStatusText: "New Record",
        completedDate: "",
        deliveryDate: "",
        duplicateError: false,
        igstPerc: 0,
        sgstPerc: 0,
        cgstPerc: 0,
        igstAmt: 0,
        sgstAmt: 0,
        cgstAmt: 0,
      };

      const nextRows = [...productRowsRef.current, newRow];
      productRowsRef.current = nextRows;

      setProductRows((prev) => {
        newProductIndexRef.current = prev.length;
        setActiveRowIndex(prev.length);
        activeRowIndexRef.current = prev.length;
        return nextRows;
      });

      if (onValuesChange) {
        onValuesChange({
          ...currentFormValues,
          purchaseOrderDetail: nextRows,
        });
      }
    }, [currentFormValues, onValuesChange, showToast]);

    useEffect(() => {
      if (!editMode) return;
      const idx = newProductIndexRef.current;
      if (idx === null || idx === undefined || idx < 0) return;

      const timer = setTimeout(() => {
        const el = productNameRefs.current[idx];
        if (el && typeof el.focus === "function") {
          try {
            el.focus();
          } catch {
            // ignore
          }
        }
      }, 50);

      newProductIndexRef.current = null;
      return () => clearTimeout(timer);
    }, [productRows.length, editMode]);

    const performDeleteProductRow = useCallback(
      (rowIndex) => {
        const updated = productRowsRef.current.filter((_, idx) => idx !== rowIndex);
        productRowsRef.current = updated;
        setProductRows(updated);

        if (activeRowIndexRef.current === rowIndex) {
          activeRowIndexRef.current = null;
          setActiveRowIndex(null);
          setActiveDesc("");
        }

        const newGross = updated.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        if (validatedFormRef.current) {
          validatedFormRef.current.setFieldValue("grossPurchaseAmount", newGross);
        }

        if (onValuesChange) {
          onValuesChange({ ...currentFormValues, grossPurchaseAmount: newGross, purchaseOrderDetail: updated });
        }

        const errors = { ...productErrors };
        delete errors[rowIndex];
        const newErrors = {};
        Object.keys(errors).forEach((key) => {
          const k = parseInt(key);
          if (k > rowIndex) newErrors[k - 1] = errors[key];
          else newErrors[k] = errors[key];
        });

        setProductErrors(newErrors);
      },
      [currentFormValues, onValuesChange, productErrors]
    );

    const handleDeleteProductRow = useCallback((rowIndex) => {
      setRowToDelete(rowIndex);
      setShowDeleteConfirm(true);
    }, []);

    const confirmDeleteRow = useCallback(() => {
      if (rowToDelete !== null) {
        performDeleteProductRow(rowToDelete);
      }
      setShowDeleteConfirm(false);
      setRowToDelete(null);
    }, [rowToDelete, performDeleteProductRow]);

    const cancelDeleteRow = useCallback(() => {
      setShowDeleteConfirm(false);
      setRowToDelete(null);
    }, []);

    const handleSubmit = async (values) => {
      const isHeaderValid = validatedFormRef.current?.isValid?.() !== false;
      const areProductsValid = validateAllProducts();

      if (productRows.length === 0) {
        showToast("Please add at least one product for this purchase order", ERROR_STATUS.toLowerCase());
        return;
      }

      if (!isHeaderValid || !areProductsValid) {
        return;
      }

      setSubmitting(true);
      try {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const currentTime = `${hours}:${minutes}:${seconds}`;

        let purchaseOrderDateVal = "";
        if (values.purchaseOrderDate) {
          const originalDatePart = originalPurchaseOrderDateRef.current ? originalPurchaseOrderDateRef.current.split(/[T ]/)[0] : "";
          if (originalPurchaseOrderDateRef.current && values.purchaseOrderDate === originalDatePart) {
            purchaseOrderDateVal = formatDateTimeForPayload(originalPurchaseOrderDateRef.current);
          } else {
            purchaseOrderDateVal = `${values.purchaseOrderDate.split(/[T ]/)[0]} ${currentTime}`;
          }
        }

        let customerDateVal = "";
        if (values.custDate) {
          const originalCustDatePart = originalCustomerDateRef.current ? originalCustomerDateRef.current.split(/[T ]/)[0] : "";
          if (originalCustomerDateRef.current && values.custDate === originalCustDatePart) {
            customerDateVal = formatDateTimeForPayload(originalCustomerDateRef.current);
          } else {
            customerDateVal = `${values.custDate.split(/[T ]/)[0]} ${currentTime}`;
          }
        }

        const payload = {
          pageSize: 0,
          pageNumber: 0,
          purchaseOrderID: Number(values.purchaseOrderID) || 0,
          purchaseOrderNumber: values.purchaseOrderNumber || "0",
          purchaseType: Number(values.purchaseType) || 0,
          purchaseOrderDate: purchaseOrderDateVal,
          currencyID: Number(values.currencyID) || 0,
          currencyConversionRate: Number(values.currencyConversionRate) || 1.0,
          supplierID: Number(values.supplierID) || 0,
          grossPurchaseAmount: Number(values.grossPurchaseAmount) || 0,
          freightAmount: 0,
          priceScope: values.priceScope || "",
          transportTerms: values.transportTerms || "",
          insuranceTerms: values.insuranceTerms || "",
          documentStatus: Number(values.documentStatus) === 50 ? 50 : (Number(values.documentStatus) === 10 ? 10 : (Number(values.purchaseOrderID) > 0 ? 20 : (Number(values.documentStatus) || 0))),
          customerReferenceNumber: values.custRefNo || "",
          customerDate: customerDateVal,
          otherReference: values.otherRef || "",
          totalIgstAmount: Math.round(Number(values.totalIgstAmt) || 0),
          totalCgstAmount: Math.round(Number(values.totalCgstAmt) || 0),
          totalSgstAmount: Math.round(Number(values.totalSgstAmt) || 0),
          totalNetAmount: Math.round(Number(values.totalNetAmt) || Number(values.grossPurchaseAmount) || 0),
          responsiblePerson: values.responsiblePerson || "",
          shipAddress: values.shipAddress || "",
          deliveryInformation: values.deliveryInfo || "",
          paymentInformation: values.paymentInfo || "",
          remarks: values.remarks || "",
          preparedBy: values.preparedBy || "",
          updatedBy: getPreparedBy(),
          approvedBy: values.approvedBy || "",
          shortCut: "",
          purchaseOrderDetail: productRows.map((row) => ({
            purchaseOrderLineID: Number(row.poLineID) || 0,
            purchaseOrderID: Number(values.purchaseOrderID) || 0,
            documentIStatus: Number(values.documentStatus) === 50 ? 50 : (Number(values.documentStatus) === 10 ? 10 : (Number(values.purchaseOrderID) > 0 ? 20 : (Number(row.docIStatus ?? row.doc_istatus) || 0))),
            itemID: Number(row.itemID) || 0,
            supplierItemCode: row.supplierItemCode || row.supplier_itemcode || "",
            quantityOrdered: Number(row.quantityOrdered) || 0,
            unitRate: Number(row.rate) || 0,
            deliveryDate: row.deliveryDate
              ? `${row.deliveryDate} 00:00:00.000`
              : "",
            quantityDelivered: Number(row.qtyDelivered ?? row.qty_delivered) || 0,
            quantityAccepted: Number(row.qtyAccepted ?? row.qty_accepted) || 0,
            purchaseOrderCompletedDate: row.completedDate || row.purchase_order_completed_date
              ? `${row.completedDate || row.purchase_order_completed_date} 00:00:00.000`
              : "",
            igstPercentage: Number(row.igstPerc ?? row.igst_perc) || 0,
            cgstPercentage: Number(row.cgstPerc ?? row.cgst_perc) || 0,
            sgstPercentage: Number(row.sgstPerc ?? row.sgst_perc) || 0,
            igstAmount: Number(row.igstAmt ?? row.igst_amt) || 0,
            cgstAmount: Number(row.cgstAmt ?? row.cgst_amt) || 0,
            sgstAmount: Number(row.sgstAmt ?? row.sgst_amt) || 0,
          })),
          paramType: "ADD",
        };

        const response = await saveAndUpdatePurchaseOrderHeader(payload);


        const apiResp = response?.data?.PURCHASE_ORDER_HEADER_RESPONSE?.[0] || response?.data?.PURCAHSE_ORDER_HEADER_RESPONSE?.[0];

        if (response?.Status === SUCCESS_STATUS) {
          clearDraft();

          const headerLayer = response?.data?.PURCHASE_ORDER_HEADER_RESPONSE?.[0] || response?.data?.PURCAHSE_ORDER_HEADER_RESPONSE?.[0] || response?.data?.data?.PURCHASE_ORDER_HEADER_RESPONSE?.[0] || response?.data?.data?.PURCAHSE_ORDER_HEADER_RESPONSE?.[0] || {};
          const generatedPoId = headerLayer.purchase_order_id || headerLayer.purchaseOrderID || headerLayer.PurchaseOrderID || headerLayer.ID || response?.data?.purchase_order_id || response?.data?.purchaseOrderID || response?.data?.ID || Number(values.purchaseOrderID);

          if (generatedPoId && generatedPoId > 0) {
            try {
              const detailedRecord = await fetchPurchaseOrderHeaderDetails({ purchaseOrderID: Number(generatedPoId) });
              if (detailedRecord && detailedRecord.Status === SUCCESS_STATUS) {
                onSuccess?.(detailedRecord);
              } else {
                onSuccess?.(response);
              }
            } catch (err) {
              console.error("Error fetching immediately after save", err);
              onSuccess?.(response);
            }
          } else {
            onSuccess?.(response);
          }

          const msg = apiResp?.Message || "Purchase Order saved successfully";
          showToast(msg, "success");
        } else {
          let errorMessage = "Failed to save Purchase Order.";
          if (response?.data?.PURCHASE_ORDER_HEADER_RESPONSE?.[0]?.Message && response.data.PURCHASE_ORDER_HEADER_RESPONSE[0].Message !== "OK") {
            errorMessage = response.data.PURCHASE_ORDER_HEADER_RESPONSE[0].Message;
          } else if (response?.data?.PURCAHSE_ORDER_HEADER_RESPONSE?.[0]?.Message && response.data.PURCAHSE_ORDER_HEADER_RESPONSE[0].Message !== "OK") {
            errorMessage = response.data.PURCAHSE_ORDER_HEADER_RESPONSE[0].Message;
          } else if (response?.data?.ValidationErrors?.length > 0) {
            errorMessage = response.data.ValidationErrors[0].Message;
          } else if (response?.message && response.message !== "OK") {
            errorMessage = response.message;
          }
          showToast(errorMessage, ERROR_STATUS.toLowerCase());
        }
      } catch (error) {
        console.error("Save error:", error);
        showToast("An error occurred while saving", "error");
      } finally {
        setSubmitting(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        if (validatedFormRef.current) {
          validatedFormRef.current.submitForm();
        }
      },
      saveDraft,
      clearDraft,
      hasUnsavedChanges: () => combinedIsDirty,
      confirmClose: () => {
        if (combinedIsDirty) {
          return window.confirm(
            "You have unsaved changes. Do you want to save them before leaving?"
          );
        }
        return true;
      },
    }));


    // Purchase Order product table columns
    const productTableColumns = [
      { key: "actions", label: "Actions", width: "80px" },
      { key: "sno", label: "S.No", width: "60px" },
      { key: "itemID", label: "Item Code / Description", minWidth: "250px" },
      { key: "supplierItemCode", label: "Supplier Item Code", width: "160px" },
      { key: "quantityOrdered", label: "Qty Ordered", width: "120px" },
      { key: "deliveryDate", label: "Delivery Date", width: "160px" },
      { key: "rate", label: "Rate", width: "120px" },
      { key: "amount", label: "Amount", width: "120px" },
      { key: "qtyDelivered", label: "Qty Delivered", width: "120px" },
      { key: "qtyAccepted", label: "Qty Accepted", width: "120px" },
      { key: "docIStatusText", label: "Status", width: "140px" },
      { key: "completedDate", label: "Completed Date", width: "160px" },
      { key: "igstPerc", label: "IGST %", width: "100px" },
      { key: "sgstPerc", label: "SGST %", width: "100px" },
      { key: "cgstPerc", label: "CGST %", width: "100px" },
      { key: "igstAmt", label: "IGST Amt", width: "120px" },
      { key: "sgstAmt", label: "SGST Amt", width: "120px" },
      { key: "cgstAmt", label: "CGST Amt", width: "120px" },
    ];




    return (
      <>
        <style>{`
          .po-product-card { margin-top: 20px; margin-bottom: 20px; }
          .contact-details-header {
            background: rgb(147, 108, 145);
            padding: 8px 14px;
            margin-bottom: 15px;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .contact-details-header h5 { font-size: 16px; margin: 0; line-height: 1; color: #fff; }
          
          .contact-details-table-responsive {
            overflow-x: auto !important;
            overflow-y: visible !important;
            -webkit-overflow-scrolling: touch;
            max-height: 500px;
          }
          .contact-details-table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
            table-layout: fixed;
          }
          .contact-details-thead {
            position: sticky;
            top: 0;
            z-index: 24;
          }
          .workorder-details-th {
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
          .contact-details-td {
            padding: 4px 8px !important;
            vertical-align: middle;
            border-bottom: 1px solid #dee2e6;
            border-right: 1px solid #dee2e6;
          }
          .contact-details-input {
            width: 100% !important;
            padding: 0px 8px !important;
            font-size: 13px !important;
            height: 28px !important;
            min-height: 28px !important;
            line-height: 28px !important;
            border-radius: 4px;
            border: 1px solid #ced4da;
          }
          .contact-details-error {
            font-size: 11px !important;
            color: #d9534f;
            display: block;
            margin-top: 1px;
          }
          .contact-details-td-actions {
            position: sticky !important;
            left: 0 !important;
            z-index: 10 !important;
            background: #fff !important;
            border-right: 2px solid #dee2e6 !important;
          }
          .workorder-details-th-actions {
            position: sticky !important;
            left: 0 !important;
            top: 0 !important;
            z-index: 50 !important;
            background: #7A4B78 !important;
            color: #ffffff !important;
            border-right: 2px solid #fff !important;
          }
          .text-right { text-align: right !important; }
          
          input:disabled, select:disabled, textarea:disabled {
            background-color: #f5f7f9 !important;
            color: #495057 !important;
            opacity: 1;
            cursor: not-allowed;
          }
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
            appearance: textfield;
          }
          
          .contact-details-td .css-b62m3t-container {
            font-size: 13px;
          }

          /* Compact fields for the entire page */
          .save-update-purchase-order input.form-control,
          .save-update-purchase-order select.form-select,
          .save-update-purchase-order select.form-control {
            padding: 0px 8px !important;
            font-size: 13px !important;
            height: 28px !important;
            min-height: 28px !important;
            line-height: 28px !important;
          }
          .save-update-purchase-order div[class*="-control"] {
            min-height: 28px !important;
            height: 28px !important;
            font-size: 13px !important;
          }
          .save-update-purchase-order div[class*="-ValueContainer"] {
            padding: 0px 6px !important;
            min-height: 26px !important;
            height: 26px !important;
          }
          .save-update-purchase-order div[class*="-IndicatorsContainer"] {
            height: 26px !important;
          }
          .save-update-purchase-order div[class*="-singleValue"],
          .save-update-purchase-order div[class*="-placeholder"] {
            margin: 0 !important;
            padding: 0 !important;
            line-height: 26px !important;
          }
          .save-update-purchase-order div[class*="-Input"] {
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Keep labels compact too */
          .save-update-purchase-order .form-label {
           
            margin-bottom: 2px !important;
          }
          /* Reduce spacing between field groups */
          .save-update-purchase-order .mb-4,
          .save-update-purchase-order .mb-3 {
            margin-bottom: 8px !important;
          }
          .save-update-purchase-order .mb-2 {
            margin-bottom: 4px !important;
          }

          /* Responsive layout media queries */
          @media (max-width: 1200px) {
            .save-update-purchase-order .col-md-3,
            .save-update-purchase-order .col-md-4,
            .save-update-purchase-order .col-md-6 {
              flex: 0 0 auto !important;
              width: 50% !important;
              margin-bottom: 8px !important;
            }
            .save-update-purchase-order .row {
              flex-wrap: wrap !important;
            }
          }

          @media (max-width: 768px) {
            .save-update-purchase-order .col-md-3,
            .save-update-purchase-order .col-md-4,
            .save-update-purchase-order .col-md-6 {
              flex: 0 0 auto !important;
              width: 100% !important;
              margin-bottom: 8px !important;
            }
            .contact-details-header-content {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 8px !important;
            }
            .contact-details-header-content .ms-auto {
              margin-left: 0 !important;
            }
          }
        `}</style>

        <div className="save-update-purchase-order pb-4 h-100 d-flex flex-column" style={{ width: "100%", margin: "0 auto" }}>
          <FullPageLoader
            loading={submitting}
            message="Saving Purchase Order..."
            logoSrc={inspireLogo}
          />
          {loadingDetails && <Loader />}
          <ValidatedForm
            key={fetchedData ? `fetched-${fetchedData.purchaseOrderID}` : 'initial'}
            ref={validatedFormRef}
            initialValues={initialValues}
            validation={validation}
            onSubmit={handleSubmit}
            onValuesChange={handleFormValuesChange}
          >
            {({ values, handleChange, handleBlur, errors }) => (
              <>
                <div className="row mb-4">
                  <div className="col-md-3">
                    <FormField
                      label="Purchase Order No"
                      name="purchaseOrderNumber"
                      value={values.purchaseOrderNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={true}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-md-3">
                    <ReactSelectField
                      label="Purchase Type"
                      name="purchaseType"
                      value={values.purchaseType}
                      options={purchaseTypeOptions}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.purchaseType}
                      disabled={isDisabled}
                      placeholder="Select Type"
                      required={true}
                    />
                  </div>
                  <div className="col-md-3">
                    <FormField
                      label="Date"
                      name="purchaseOrderDate"
                      type="date"
                      value={values.purchaseOrderDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.purchaseOrderDate}
                      disabled={isDisabled}
                      required={true}
                      min={minDateString}
                    />
                  </div>
                  <div className="col-md-3">
                    {!isDisabled ? (
                      <ReactSelectField
                        label="Supplier Name"
                        name="supplierID"
                        value={values.supplierID}
                        options={supplierOptions}
                        onChange={(e) => {
                          const val = e?.target?.value || e;
                          const selected = supplierOptions.find(opt => String(opt.value) === String(val));
                          if (selected && Number(selected.status) === 0) {
                            setInactiveSupplierAttempt(true);
                            handleChange({ target: { name: "supplierID", value: "" } });
                            if (validatedFormRef.current) {
                              validatedFormRef.current.setFieldValue("responsiblePerson", "");
                            }
                          } else {
                            setInactiveSupplierAttempt(false);
                            handleChange(e);
                            if (validatedFormRef.current) {
                              validatedFormRef.current.setFieldValue("responsiblePerson", selected?.responsiblePersonName || "");
                            }

                            // ── Supply-type guard: clear item codes if Supply type changed ──
                            const newSupply = selected?.supply ?? null;
                            const prevSupply = prevSupplierSupplyRef.current;
                            const supplyChanged = prevSupply !== null && String(newSupply) !== String(prevSupply);

                            if (supplyChanged && productRowsRef.current.length > 0) {
                              const clearedRows = productRowsRef.current.map((row) => ({
                                ...row,
                                itemID: "",
                                itemCode: "",
                                itemUnit: "",
                                productDescription_cached: "",
                                cgstPerc: 0,
                                sgstPerc: 0,
                                igstPerc: 0,
                                cgstAmt: 0,
                                sgstAmt: 0,
                                igstAmt: 0,
                                amount: 0,
                                duplicateError: false,
                              }));
                              productRowsRef.current = clearedRows;
                              setProductRows(clearedRows);
                              setProductErrors({});
                              if (validatedFormRef.current) {
                                validatedFormRef.current.setFieldValue("grossPurchaseAmount", 0);
                              }
                              // showToast("Item codes cleared because the Supplier Supply type changed.", "info");
                            }

                            prevSupplierSupplyRef.current = newSupply;
                          }
                        }}
                        onBlur={handleBlur}
                        error={inactiveSupplierAttempt && !values.supplierID ? "Please select an active supplier name" : errors.supplierID}
                        placeholder="Select Supplier"
                        required={true}
                        disabled={isDisabled || disabled || !isCreate}
                      />
                    ) : (
                      <FormField
                        label="Supplier Name"
                        name="supplierName"
                        value={values.supplierName || ""}
                        disabled
                        required={true}
                      />
                    )}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-3">
                    <FormField
                      label="Customer Reference No"
                      name="custRefNo"
                      type="text"
                      value={values.custRefNo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-md-3">
                    <FormField
                      label="Customer Date"
                      name="custDate"
                      type="date"
                      value={values.custDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-md-3">
                    <FormField
                      label="Other Ref"
                      name="otherRef"
                      type="text"
                      value={values.otherRef}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-md-3">
                    <FormField
                      label="Kind Attention"
                      name="responsiblePerson"
                      type="text"
                      value={values.responsiblePerson}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.responsiblePerson}
                      disabled={isDisabled}
                      required={true}
                    />
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-3">
                    {isDisabled ? (
                      <FormField
                        label="Currency"
                        name="currencyCode"
                        value={values.currencyCode || ""}
                        disabled
                        required={true}
                      />
                    ) : (
                      <ReactSelectField
                        label="Currency"
                        name="currencyID"
                        value={values.currencyID}
                        options={currencyOptions}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.currencyID}
                        disabled={false}
                        placeholder="Select Currency"
                        required={true}
                      />
                    )}
                  </div>

                  <div className="col-md-3">
                    <EditableSelectField
                      label="Price Scope"
                      name="priceScope"
                      value={values.priceScopeText || values.priceScope || ""}
                      onChange={(e) => {
                        const val = e?.target !== undefined ? e.target.value : e;
                        handleChange({ target: { name: "priceScope", value: val } });
                        handleChange({ target: { name: "priceScopeText", value: val } });
                      }}
                      onBlur={handleBlur}
                      options={priceScopeOptions?.map(opt => opt.label || opt.value) || []}
                      placeholder="Select Price Scope..."
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-md-3">
                    <FormField
                      label="Dispatched Through"
                      name="transportTerms"
                      type="text"
                      value={values.transportTerms}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                <div className="row mb-3">

                  <div className="col-md-6">
                    <FormField
                      label="Mode / Terms Of Payment"
                      name="paymentInfo"
                      type="text"
                      value={values.paymentInfo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormField
                      label="Insurance Terms"
                      name="insuranceTerms"
                      type="text"
                      value={values.insuranceTerms}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>



                </div>








                <div className="card po-product-card">
                  <div className="card-header contact-details-header"
                    style={{
                      background: "rgb(147, 108, 145)",
                      paddingTop: "8px",
                      paddingBottom: "8px",
                      marginBottom: "15px",
                      borderRadius: "7px",
                    }}
                  >
                    <div className="d-flex flex-wrap align-items-center justify-content-between w-100 contact-details-header-content">
                      <div className="contact-details-title-container">
                        <div className="contact-details-title-wrapper">
                          <h5 style={{ fontSize: "16px", margin: 0, lineHeight: "1", color: "rgb(255, 255, 255)" }}>Product Details</h5>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2 ms-auto" style={{ flexShrink: 0 }}>
                        {(() => {
                          const isEnabled = editMode || isCreate;
                          return (
                            <button
                              className="btn btn-sm"
                              type="button"
                              onClick={() => { if (isEnabled) handleAddProductRow(); }}
                              disabled={!isEnabled}
                              style={{
                                background: isEnabled ? "#7A4B78" : "#cccccc",
                                color: "#fff",
                                borderRadius: "6px",
                                width: 33,
                                height: 33,
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "none",
                                cursor: isEnabled ? "pointer" : "not-allowed",
                                opacity: isEnabled ? 1 : 0.6,
                              }}
                              title={isEnabled ? "Add Product" : "Click Edit to add products"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-0 flex-grow-1 contact-details-table-container">
                    {productRows.length === 0 ? (
                      <div className="text-center text-muted py-4" style={{ width: "100%" }}>No Products Added</div>
                    ) : (
                      <div className="table-responsive contact-details-table-responsive" style={{ overflowX: "auto", overflowY: "visible", width: "100%", maxHeight: "500px" }}>
                        <table className="table table-vcenter contact-details-table" style={{ minWidth: "1660px", width: "100%", tableLayout: "fixed" }}>
                          <thead className="contact-details-thead">
                            <tr>
                              {productTableColumns.map((col) => {
                                return (
                                  <th key={col.key} className={`workorder-details-th workorder-details-th-${col.key}`}
                                    style={{
                                      width: col.width || col.minWidth,
                                      minWidth: col.minWidth || col.width,
                                      maxWidth: col.maxWidth || col.width,
                                      textAlign: "center"
                                    }}
                                  >
                                    <span>{col.label}</span>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className="contact-details-tbody">
                            {productRows.map((row, idx) => (
                              <React.Fragment key={idx}>
                                <tr
                                  onClick={() => handleRowFocus(idx)}
                                  onFocusCapture={() => handleRowFocus(idx)}
                                  style={{ backgroundColor: activeRowIndex === idx ? "#eef2f5" : "inherit" }}
                                >
                                  <td className="contact-details-td contact-details-td-actions" style={{ textAlign: "center" }}>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProductRow(idx);
                                      }}
                                      disabled={isDisabled || !(isCreate || !row.poLineID)}
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        background: "transparent",
                                        color: (!isDisabled && (isCreate || !row.poLineID)) ? "rgb(22, 119, 255)" : "#cccccc",
                                        border: "none",
                                        cursor: (!isDisabled && (isCreate || !row.poLineID)) ? "pointer" : "not-allowed"
                                      }}
                                      title={isDisabled ? "Cannot delete in view mode" : ((isCreate || !row.poLineID) ? "Remove row" : "Existing rows cannot be deleted in edit mode")}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 7h16" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
                                        <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                                      </svg>
                                    </button>
                                  </td>
                                  <td className="contact-details-td text-center">{idx + 1}</td>
                                  <td className="contact-details-td">
                                    <ReactSelectField
                                      name={`itemID_${idx}`}
                                      hideLabel
                                      options={(() => {
                                        const exists = formattedItemOptions.some(opt => String(opt.value) === String(row.itemID));
                                        if (exists || !row.itemID || !row.itemCode) {
                                          return formattedItemOptions;
                                        }
                                        return [
                                          ...formattedItemOptions,
                                          { value: row.itemID, label: row.itemCode }
                                        ];
                                      })()}
                                      value={row.itemID ?? ""}
                                      onChange={(e) => handleProductFieldChange(idx, "itemID", e?.target?.value ?? "")}
                                      error={row.duplicateError ? "Item code already exists" : productErrors[idx]?.itemID}
                                      isSearchable
                                      placeholder="Select Item"
                                      isDisabled={isDisabled}
                                      className={row.duplicateError || productErrors[idx]?.itemID ? "is-invalid" : ""}
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={row.supplierItemCode || ""}
                                      onChange={(e) => handleProductFieldChange(idx, "supplierItemCode", e.target.value)}
                                      disabled={isDisabled}
                                      placeholder="Supplier Item Code"
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className={`form-control form-control-sm contact-details-input text-right ${productErrors[idx]?.quantityOrdered ? "is-invalid" : ""}`}
                                      value={row.quantityOrdered ?? ""}
                                      onChange={(e) => handleProductFieldChange(idx, "quantityOrdered", e.target.value)}
                                      onFocus={(e) => {
                                        setTimeout(() => {
                                          e.target.select();
                                        }, 0);
                                      }}
                                      onClick={(e) => {
                                        e.target.select();
                                      }}
                                      disabled={isDisabled}
                                    />
                                    {productErrors[idx]?.quantityOrdered && <div className="contact-details-error">{productErrors[idx].quantityOrdered}</div>}
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="date"
                                      className={`form-control form-control-sm contact-details-input ${productErrors[idx]?.deliveryDate ? "is-invalid" : ""}`}
                                      value={row.deliveryDate || ""}
                                      onChange={(e) => handleProductFieldChange(idx, "deliveryDate", e.target.value)}
                                      disabled={isDisabled}
                                      min={today}
                                    />
                                    {productErrors[idx]?.deliveryDate && <div className="contact-details-error">{productErrors[idx].deliveryDate}</div>}
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className={`form-control form-control-sm contact-details-input text-right ${productErrors[idx]?.rate ? "is-invalid" : ""}`}
                                      value={row.rate ?? ""}
                                      onChange={(e) => handleProductFieldChange(idx, "rate", e.target.value)}
                                      onFocus={(e) => {
                                        setTimeout(() => {
                                          e.target.select();
                                        }, 0);
                                      }}
                                      onClick={(e) => {
                                        e.target.select();
                                      }}
                                      disabled={isDisabled}
                                    />
                                    {productErrors[idx]?.rate && <div className="contact-details-error">{productErrors[idx].rate}</div>}
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={row.amount || 0}
                                      disabled
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="number"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={row.qtyDelivered ?? 0}
                                      disabled
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="number"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={row.qtyAccepted ?? 0}
                                      disabled
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input text-start"
                                      value={row.docIStatusText || "New Record"}
                                      disabled
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="date"
                                      className="form-control form-control-sm contact-details-input"
                                      value={row.completedDate || ""}
                                      disabled
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={Number(row.igstPerc ?? 0).toFixed(1)}
                                      disabled
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={Number(row.sgstPerc ?? 0).toFixed(1)}
                                      disabled
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={Number(row.cgstPerc ?? 0).toFixed(1)}
                                      disabled
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={Number(row.igstAmt ?? 0).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={Number(row.sgstAmt ?? 0).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={Number(row.cgstAmt ?? 0).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                </tr>
                                <tr
                                  key={`sub-${idx}`}
                                  style={{ backgroundColor: activeRowIndex === idx ? "#f8fafc" : "#fff" }}
                                  onClick={() => handleRowFocus(idx)}
                                >
                                  {/* Spacing aligns left border of description with Item Code / Description column */}
                                  <td className="contact-details-td" colSpan="2" style={{ borderRight: "1px solid #e2e8f0" }}></td>

                                  {/* Description spanning Item Code, Supplier Item Code, Qty Ordered */}
                                  <td className="contact-details-td" colSpan="3" style={{ padding: "8px 12px !important", verticalAlign: "middle", maxWidth: "440px" }}>
                                    <div title={row.productDescription_cached || (itemOptions.find(o => Number(o.item_id) === Number(row.itemID))?.Item_Description) || ""} style={{ fontSize: "12.5px", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", lineHeight: "1.4" }}>
                                      {row.productDescription_cached || (itemOptions.find(o => Number(o.item_id) === Number(row.itemID))?.Item_Description) || ""}
                                    </div>
                                  </td>

                                  {/* Unit under Delivery Date - Left Aligned */}
                                  <td className="contact-details-td" colSpan="1" style={{ padding: "8px 12px !important", verticalAlign: "middle", textAlign: "left" }}>
                                    <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: "500" }}>
                                      {row.itemUnit || (itemOptions.find(o => Number(o.item_id) === Number(row.itemID))?.Item_Unit) || ""}
                                    </div>
                                  </td>

                                  {/* Rest of the columns empty (Rate, Amount, Qty Del, Qty Acc, Status, Completed, IGST %, SGST %, CGST %, IGST Amt, SGST Amt, CGST Amt) */}
                                  <td className="contact-details-td" colSpan="12"></td>
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4">
                    <TextAreaFormField
                      label="Ship Address"
                      name="shipAddress"
                      value={values.shipAddress}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      rows={2}
                    />
                  </div>
                  <div className="col-md-4">
                    <TextAreaFormField
                      label="Terms Of Delivery"
                      name="deliveryInfo"
                      value={values.deliveryInfo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      rows={2}
                    />
                  </div>
                  <div className="col-md-4">
                    <TextAreaFormField
                      label="Remarks"
                      name="remarks"
                      value={values.remarks}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      rows={2}
                    />
                  </div>

                </div>
                <div className="row mb-3">
                  <div className="col">
                    <FormField
                      label="Total CGST Amt"
                      name="totalCgstAmt"
                      value={Math.round(Number(values.totalCgstAmt || 0))}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={true}
                    />
                  </div>
                  <div className="col">
                    <FormField
                      label="Total SGST Amt"
                      name="totalSgstAmt"
                      value={Math.round(Number(values.totalSgstAmt || 0))}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={true}
                    />
                  </div>
                  <div className="col">
                    <FormField
                      label="Total IGST Amt"
                      name="totalIgstAmt"
                      value={Math.round(Number(values.totalIgstAmt || 0))}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={true}
                    />
                  </div>
                  <div className="col">
                    <FormField
                      label="Total Net Amt"
                      name="totalNetAmt"
                      value={Math.round(Number(values.totalNetAmt || 0))}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={true}
                    />
                  </div>
                  <div className="col">
                    <FormField
                      label="Total Amount"
                      name="grossPurchaseAmount"
                      value={Math.round(Number(values.grossPurchaseAmount || 0))}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={true}
                    />
                  </div>
                </div>

                <div className="row mt-4 mb-2">
                  <div className="col-md-3">
                    <FormField label="Prepared By" name="preparedBy" value={values.preparedBy} disabled />
                  </div>
                  <div className="col-md-3">
                    <FormField label="Prepared Date" name="prepDate" type="date" value={values.prepDate} disabled />
                  </div>
                  <div className="col-md-3">
                    <FormField label="Updated By" name="updatedBy" value={values.updatedBy} disabled />
                  </div>
                  <div className="col-md-3">
                    <FormField label="Updated Date" name="updatedDate" type="date" value={values.updatedDate} disabled />
                  </div>
                </div>
                <div className="row mb-4">
                  <div className="col-md-3">
                    <FormField label="Approved By" name="approvedBy" value={values.approvedBy} disabled />
                  </div>
                  <div className="col-md-3">
                    <FormField label="Approved Date" name="approvedDate" type="date" value={values.approvedDate} disabled />
                  </div>
                  <div className="col-md-3">
                    <FormField
                      label="Document Status"
                      name="docStatusText"
                      value={values.docStatusText}
                      disabled={true}
                    />
                  </div>
                </div>
              </>
            )}
          </ValidatedForm>
          <DeleteConfirmDialog
            open={showDeleteConfirm}
            title="Confirm Delete"
            message="this product"
            onConfirm={confirmDeleteRow}
            onCancel={cancelDeleteRow}
          />
        </div>
      </>
    );
  }
);

export default SaveOrUpdatePurchaseOrder;