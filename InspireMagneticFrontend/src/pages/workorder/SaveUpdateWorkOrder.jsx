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
} from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
import { DeleteConfirmDialog } from "../../components/Notification";
import { saveAndUpdateWorkOrderHeader, fetchWorkOrderHeaderDetails, fetchWorkOrderTypes, fetchSupplierNames, fetchFGProductList } from "../../services/workOrderService";
import { useToast } from "../../components/useToast";
import FullPageLoader from "../../components/FullPageLoader";
import Loader from "../../components/Loader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import { getPreparedBy } from "../../utils/userSession";
import { ERROR_STATUS, SUCCESS_STATUS, DRAFT_WORK_ORDER_CREATE, MSG_UNSAVED_CHANGES_CONFIRM, LABEL_APPROVED_BY, LABEL_APPROVED_DATE } from "../../utils/ConstVariables";

const today = new Date().toISOString().split("T")[0];

const initialForm = {
  workOrderID: 0,
  workOrderNumber: "0",
  workOrderDate: today,
  workOrderType: "1", // Default to In-House
  supplierID: "",
  name: "",
  address: "",
  documentStatus: 0,
  preparedBy: getPreparedBy(),
  prepDate: today,
  updatedBy: "",
  updateDate: "",
  approvedBy: "",
  approvedDate: "",
  remarks: "",
  productDescription: "",
  docStatusText: "Not Approved",
  paramType: "ADD"
};



const SaveUpdateWorkOrder = forwardRef(
  ({ onClose, onSuccess, initialData, editMode: editModeProp, onDirtyChange, disabled, onValuesChange, open = true }, ref) => {
    const { showToast } = useToast();
    const validatedFormRef = useRef();
    const [productRows, setProductRows] = useState([]);
    const [productErrors, setProductErrors] = useState({});
    const productNameRefs = useRef([]);
    const newProductIndexRef = useRef(null);
    const isCreate = !initialData || initialData.isPreFilled;
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const activeRowIndexRef = useRef(null);
    const [, setActiveDesc] = useState("");
    const productRowsRef = useRef([]);
    const fetchedWoIdRef = useRef(null);
    const initialProductsRef = useRef([]);

    const [editMode, setEditMode] = useState(
      disabled ? false : (editModeProp === undefined ? (isCreate ? true : false) : editModeProp)
    );

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [rowToDelete, setRowToDelete] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [woTypeOptions, setWoTypeOptions] = useState([]);
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [itemOptions, setItemOptions] = useState([]);
    const [inactiveSupplierAttempt, setInactiveSupplierAttempt] = useState(false);

    const onDirtyChangeRef = useRef(onDirtyChange);
    useEffect(() => {
      onDirtyChangeRef.current = onDirtyChange;
    }, [onDirtyChange]);

    useEffect(() => {
      setEditMode(
        editModeProp === undefined ? (isCreate ? true : false) : editModeProp
      );
    }, [editModeProp, isCreate]);


    const allowProgrammaticValueWrites = editMode || isCreate;

    const [loadingDetails, setLoadingDetails] = useState(false);
    const [fetchedData, setFetchedData] = useState(null);

    useEffect(() => {
      async function loadWoTypes() {
        try {
          const data = await fetchWorkOrderTypes();
          if (Array.isArray(data)) {
            setWoTypeOptions(
              data.map((item) => ({
                value: String(item.ValueText ?? ""),
                label: item.DisplayText,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching Work Order Types:", error);
        }
      }
      loadWoTypes();
    }, []);

    useEffect(() => {
      async function loadSuppliers() {
        try {
          const data = await fetchSupplierNames();
          if (Array.isArray(data)) {
            setSupplierOptions(
              data.map((item) => ({
                value: String(item.ValueText ?? ""),
                label: item.DisplayText,
                status: item.supplier_status,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching Supplier Names:", error);
        }
      }
      loadSuppliers();
    }, []);

    const validation = React.useMemo(() => ({
      workOrderType: {
        required: true,
        fieldLabel: "Work Order Type",
        controlType: "dropdown",
      },
      supplierID: {
        required: (values) => Number(values.workOrderType) === 2,
        // requiredMessage: "Please select an active subcontractor name",
        fieldLabel: "Subcontractor Name",
        controlType: "dropdown",
        validator: (value) => {
          if (!value) return "Required*";
          const selected = supplierOptions.find(opt => String(opt.value) === String(value));
          if (selected && Number(selected.status) === 0) {
            return "Please select an active subcontractor name";
          }
          return "";
        }
      },
    }), [supplierOptions]);

    useEffect(() => {
      async function loadItems() {
        try {
          const res = await fetchFGProductList();
          setItemOptions(res || []);
        } catch (error) {
          console.error("Error fetching FG Products:", error);
        }
      }
      loadItems();
    }, []);

    useEffect(() => {
      async function getDetails() {
        if (initialData && !initialData.isPreFilled && (initialData.work_order_id || initialData.workOrderID)) {
          const woId = initialData.work_order_id || initialData.workOrderID;

          if (fetchedWoIdRef.current === woId) return; // Prevent StrictMode duplicate fetches
          fetchedWoIdRef.current = woId;

          setLoadingDetails(true);
          try {
            const res = await fetchWorkOrderHeaderDetails({ workOrderID: Number(woId) });
            if (res && res.Status === SUCCESS_STATUS && res.data) {
              const header = res.data.WORK_ORDER_HEADER_RESPONSE?.[0] || {};
              const details = res.data.WORK_ORDER_DETAILS_RESPONSE || [];

              setFetchedData({
                workOrderID: header.work_order_id || woId,
                workOrderNumber: header.work_order_no || "",
                workOrderDate: header.work_order_date ? header.work_order_date.split("T")[0] : "",
                workOrderType: String(header.work_order_type ?? "1"),
                supplierID: String(header.supplier_id ?? ""),
                name: header.supplier_name || "",
                address: "",
                documentStatus: header.doc_status || 0,
                preparedBy: header.prep_by || getPreparedBy(),
                prepDate: header.prep_date ? header.prep_date.split("T")[0] : "",
                updatedBy: header.update_by || "",
                updateDate: header.update_date ? header.update_date.split("T")[0] : "",
                approvedBy: header.approved_by || "",
                approvedDate: header.approved_date ? header.approved_date.split("T")[0] : "",
                remarks: header.remarks || "",
                productDescription: "",
                docStatusText: header.doc_status_text || "Not Approved",
                paramType: "ADD",
                workOrderDetail: details.map((d) => ({
                  workOrderLineID: d.work_order_line_id || 0,
                  workOrderID: d.work_order_id || woId,
                  customerOrderReference: d.customer_order_ref || "",
                  documentIStatus: d.doc_istatus || 0,
                  documentIStatusText: d.doc_istatus_text || "",
                  itemID: String(d.item_id ?? ""),
                  parentFGItemID: String(d.parent_fg_item_id ?? d.item_id ?? ""),
                  parentFGItemCode: d.item_code || d.parent_fg_item_code || "",
                  itemType: d.item_type || "",
                  itemUnit: d.item_unit || "",
                  quantityOrdered: d.qty_ordered || 0,
                  deliveryDate: d.delivery_date ? d.delivery_date.split("T")[0] : "",
                  quantityDelivered: d.qty_delivered || 0,
                  quantityAccepted: d.qty_accepted || 0,
                  workOrderCompletedDate: d.work_order_completed_date ? d.work_order_completed_date.split("T")[0] : "",
                  bomid: d.bom_id || 0,
                  productDescription_cached: d.item_description || "",
                  current_operation_text: d.current_operation_text || "",
                  duplicateError: false,
                }))
              });

              const mappedRows = details.map((d) => ({
                workOrderLineID: d.work_order_line_id || 0,
                workOrderID: d.work_order_id || woId,
                customerOrderReference: d.customer_order_ref || "",
                documentIStatus: d.doc_istatus || 0,
                documentIStatusText: d.doc_istatus_text || "",
                itemID: String(d.item_id ?? ""),
                parentFGItemID: String(d.parent_fg_item_id ?? d.item_id ?? ""),
                parentFGItemCode: d.item_code || d.parent_fg_item_code || "",
                itemType: d.item_type || "",
                itemUnit: d.item_unit || "",
                quantityOrdered: d.qty_ordered || 0,
                deliveryDate: d.delivery_date ? d.delivery_date.split("T")[0] : "",
                quantityDelivered: d.qty_delivered || 0,
                quantityAccepted: d.qty_accepted || 0,
                workOrderCompletedDate: d.work_order_completed_date ? d.work_order_completed_date.split("T")[0] : "",
                bomid: d.bom_id || 0,
                productDescription_cached: d.item_description || "",
                current_operation_text: d.current_operation_text || "",
                duplicateError: false,
              }));
              productRowsRef.current = mappedRows;
              setProductRows(mappedRows);
            }
          } catch (e) {
            console.error("Error fetching work order details", e);
            showToast("Failed to load details", ERROR_STATUS.toLowerCase());
          } finally {
            setLoadingDetails(false);
          }
        }
      }
      getDetails();

      // Reset baselines when initialData changes
      initialProductsRef.current = [];
      if (typeof onDirtyChangeRef.current === "function") {
        onDirtyChangeRef.current(false);
      }
    }, [initialData, showToast]);

    // Build initial form values
    const initialValues = React.useMemo(() => {
      const sourceData = fetchedData || initialData;
      if (sourceData && !sourceData.isPreFilled) {
        return {
          ...sourceData,
          workOrderID: sourceData.workOrderID || sourceData.work_order_id || 0,
          workOrderNumber: sourceData.workOrderNumber || sourceData.work_order_no || "",
          workOrderDate: sourceData.workOrderDate || (sourceData.work_order_date ? sourceData.work_order_date.split("T")[0] : ""),
          workOrderType: String(sourceData.workOrderType ?? sourceData.work_order_type ?? "1"),
          supplierID: String(sourceData.supplierID ?? sourceData.supplier_id ?? ""),
          name: sourceData.name || sourceData.supplier_name || "",
          address: sourceData.address || "",
          documentStatus: sourceData.documentStatus || sourceData.doc_status || 0,
          preparedBy: sourceData.preparedBy || sourceData.prep_by || getPreparedBy(),
          prepDate: sourceData.prepDate || (sourceData.prep_date ? sourceData.prep_date.split("T")[0] : ""),
          updatedBy: sourceData.updatedBy || sourceData.update_by || "",
          updateDate: sourceData.updateDate || (sourceData.update_date ? sourceData.update_date.split("T")[0] : ""),
          approvedBy: sourceData.approvedBy || sourceData.approved_by || "",
          approvedDate: sourceData.approvedDate || (sourceData.approved_date ? sourceData.approved_date.split("T")[0] : ""),
          remarks: sourceData.remarks || "",
          productDescription: sourceData.productDescription || "",
          docStatusText: sourceData.docStatusText || sourceData.doc_status_text || "Not Approved",
          paramType: sourceData.paramType || "ADD",
          workOrderDetail: Array.isArray(sourceData.workOrderDetail) ? sourceData.workOrderDetail : [],
        };
      }

      if (initialData && initialData.isPreFilled) {
        return {
          ...initialForm,
          workOrderDetail: Array.isArray(initialData.workOrderDetail) ? initialData.workOrderDetail : [],
        };
      }

      // Create mode — check for saved draft
      try {
        const rawDraft = localStorage.getItem(DRAFT_WORK_ORDER_CREATE);
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft);
          return {
            ...initialForm,
            ...parsed,
            workOrderDetail: Array.isArray(parsed.workOrderDetail) ? parsed.workOrderDetail : [],
          };
        }
      } catch {
        // ignore
      }

      return { ...initialForm, workOrderDetail: [] };
    }, [initialData, fetchedData]);

    const initialProducts = React.useMemo(
      () => (initialValues && Array.isArray(initialValues.workOrderDetail) ? initialValues.workOrderDetail : []),
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

    const {
      isDirty: isFormDirty,
      onValuesChange: onFormValuesChange,
    } = useDirtyDraftDrawer({
      open,
      initialValues,
      initialData,
      draftKey: DRAFT_WORK_ORDER_CREATE,
    });

    // Deep comparison for product rows dirty tracking
    const areProductsDirty = useCallback(() => {
      try {
        const current = JSON.stringify(productRows);
        const initial = JSON.stringify(initialProductsRef.current);
        return current !== initial;
      } catch {
        return false;
      }
    }, [productRows]);

    const combinedIsDirty = isFormDirty || areProductsDirty();

    useEffect(() => {
      if (onDirtyChange) onDirtyChange(combinedIsDirty);
    }, [combinedIsDirty, onDirtyChange]);



    const formattedItemOptions = React.useMemo(() => {
      return itemOptions.map(opt => ({
        ...opt,
        value: String(opt.fg_item_id ?? ""),
        label: opt.Item_Code
      }));
    }, [itemOptions]);


    useEffect(() => {
      if (!Array.isArray(itemOptions) || itemOptions.length === 0) return;
      if (!Array.isArray(productRows) || productRows.length === 0) return;

      let didChange = false;
      const updated = productRows.map((row) => {
        const fgId = Number(row.parentFGItemID) || Number(row.itemID);
        if (!fgId) return row;

        if (row.parentFGItemCode && row.itemType) return row;

        const selectedItem = itemOptions.find((opt) => Number(opt.fg_item_id) === fgId);
        if (!selectedItem) return row;

        didChange = true;
        return {
          ...row,
          parentFGItemID: String(row.parentFGItemID || selectedItem.fg_item_id || ""),
          parentFGItemCode: row.parentFGItemCode || selectedItem.Item_Code || "",
          itemType: row.itemType || selectedItem.ItemType || "",
          itemUnit: row.itemUnit || selectedItem.Item_Unit || "",
          bomid: Number(row.bomid) > 0 ? row.bomid : (selectedItem.bom_id || 0),
        };
      });

      if (didChange) {
        setProductRows(updated);

        if (!allowProgrammaticValueWrites) {
          try {
            initialProductsRef.current = JSON.parse(JSON.stringify(updated));
          } catch {
            /* no-op */
          }
        } else {
          try {
            const first = updated.find((r) => Number(r.itemID));
            if (first) {
              const selectedItem = itemOptions.find((opt) => Number(opt.fg_item_id) === Number(first.itemID));
              if (selectedItem) {
                setActiveDesc(selectedItem.Item_Description || "");
              }
            }
          } catch {
            /* no-op */
          }
        }
      }
    }, [itemOptions, allowProgrammaticValueWrites, productRows]);



    // Validation for product fields
    const validateProductField = useCallback((rowIndex, field, value) => {
      const errors = { ...productErrors };
      if (!errors[rowIndex]) errors[rowIndex] = {};

      if (field === "itemID") {
        if (productRowsRef.current?.[rowIndex]?.duplicateError) {
          errors[rowIndex][field] = "Item code already exists";
        } else {
          const isEmpty =
            value === "" ||
            value === null ||
            value === undefined ||
            String(value).trim() === "" ||
            Number(value) === 0;
          if (isEmpty) {
            errors[rowIndex][field] = "Required*";
          } else {
            // Check if selected item has a valid BOM
            const selectedItem = itemOptions.find(opt => Number(opt.fg_item_id) === Number(value));
            if (selectedItem && (selectedItem.bom_id === null || Number(selectedItem.bom_id) === 0)) {
              errors[rowIndex][field] = "BOM doesn't exist for this Item";
            } else {
              delete errors[rowIndex][field];
            }
          }
        }
      }

      if (field === "quantityOrdered") {
        if (value === "" || value === null || value === undefined) {
          errors[rowIndex][field] = "Required*";
        } else if (Number(value) <= 0) {
          errors[rowIndex][field] = "Must be greater than 0";
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
    }, [productErrors, itemOptions]);

    const validateAllProducts = useCallback(() => {
      const allErrors = {};
      let isValid = true;

      productRows.forEach((row, idx) => {
        const rowErrors = {};
        const itemVal = row.itemID;
        const itemEmpty =
          itemVal === "" ||
          itemVal === null ||
          itemVal === undefined ||
          String(itemVal).trim() === "" ||
          Number(itemVal) === 0;
        if (row.duplicateError) {
          rowErrors.itemID = "Item code already exists";
          isValid = false;
        } else if (itemEmpty) {
          rowErrors.itemID = "Required*";
          isValid = false;
        } else {
          // Check for BOM existence in full validation
          const selectedItem = itemOptions.find(opt => Number(opt.fg_item_id) === Number(itemVal));
          if (selectedItem && (selectedItem.bom_id === null || Number(selectedItem.bom_id) === 0)) {
            rowErrors.itemID = "BOM doesn't exist for this Item";
            isValid = false;
          }
        }
        if (row.quantityOrdered === "" || row.quantityOrdered === null || row.quantityOrdered === undefined) {
          rowErrors.quantityOrdered = "Required*";
          isValid = false;
        } else if (Number(row.quantityOrdered) <= 0) {
          rowErrors.quantityOrdered = "Must be greater than 0";
          isValid = false;
        }
        if (!row.deliveryDate || String(row.deliveryDate).trim() === "") {
          rowErrors.deliveryDate = "Required*";
          isValid = false;
        }
        if (Object.keys(rowErrors).length > 0) {
          allErrors[idx] = rowErrors;
        }
      });

      setProductErrors(allErrors);
      return isValid;
    }, [productRows, itemOptions]);

    const handleFormValuesChange = useCallback((values) => {
      // Check for inactive subcontractor selection
      if (values.supplierID) {
        const selected = supplierOptions.find(opt => String(opt.value) === String(values.supplierID));
        if (selected && Number(selected.status) === 0) {
          if (validatedFormRef.current) {
            validatedFormRef.current.setFieldValue("supplierID", "");
            validatedFormRef.current.setFieldValue("name", "");
          }
          return;
        }
      }

      // If type changed to In-House (1), clear subcontractor
      if (
        Number(values.workOrderType) === 1 &&
        Number(currentFormValues.workOrderType) !== 1
      ) {
        if (validatedFormRef.current) {
          validatedFormRef.current.setFieldValue("supplierID", "");
          validatedFormRef.current.setFieldValue("name", "");
        }
        // Update local state copy as well
        values.supplierID = "";
        values.name = "";
      }

      // If supplierID changed, update name for the fallback label logic
      if (values.supplierID !== currentFormValues.supplierID) {
        const selected = supplierOptions.find(opt => String(opt.value) === String(values.supplierID));
        const newName = selected ? selected.label : "";
        if (validatedFormRef.current) {
          validatedFormRef.current.setFieldValue("name", newName);
        }
        values.name = newName;
      }

      setCurrentFormValues(values);
      onFormValuesChange(values);

      if (onValuesChange) {
        onValuesChange({ ...values, workOrderDetail: productRowsRef.current });
      }
    }, [onValuesChange, onFormValuesChange, currentFormValues, supplierOptions]);

    const handleRowFocus = useCallback((rowIndex) => {
      if (activeRowIndexRef.current === rowIndex) return; // Prevent stale-state overwrites if already focused

      activeRowIndexRef.current = rowIndex;
      setActiveRowIndex(rowIndex);

      const row = productRowsRef.current[rowIndex];
      if (!row) return;

      let descText = row.productDescription_cached || "";
      if (!descText && row.itemID) {
        const opt = itemOptions.find(o => Number(o.fg_item_id) === Number(row.itemID));
        if (opt) {
          descText = opt.Item_Description || "";
        }
      }


      setActiveDesc(descText);
    }, [itemOptions]);

    // Handle product field change
    const handleProductFieldChange = useCallback((rowIndex, field, value) => {
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
            return;
          }
        }
      }

      const row = { ...updated[rowIndex], [field]: finalValue };

      // Auto-populate based on Item selection
      if (field === "itemID") {
        const selectedFgId = Number(value);
        const isDuplicate = value && updated.some((r, i) => {
          if (i === rowIndex) return false;
          return Number(r.itemID) === selectedFgId;
        });

        if (isDuplicate) {
          row.duplicateError = true;
          row.itemID = "";
          row.parentFGItemID = "";
          row.parentFGItemCode = "";
          row.itemType = "";
          row.itemUnit = "";
          row.bomid = 0;
          row.productDescription_cached = "";
          setActiveDesc("");
        } else {
          row.duplicateError = false;
          const selectedItem = itemOptions.find(
            (opt) => Number(opt.fg_item_id) === selectedFgId
          );
          if (selectedItem) {
            row.itemID = String(selectedItem.fg_item_id ?? "");
            row.parentFGItemID = String(selectedItem.fg_item_id ?? "");
            row.parentFGItemCode = selectedItem.Item_Code ?? "";
            row.itemType = selectedItem.ItemType || "";
            row.itemUnit = selectedItem.Item_Unit || "";
            row.bomid = selectedItem.bom_id || 0;
            row.productDescription_cached = selectedItem.Item_Description || "";

            setActiveDesc(selectedItem.Item_Description || "");
          } else {
            // Clear dependent fields if selection is removed
            row.itemID = "";
            row.parentFGItemID = "";
            row.parentFGItemCode = "";
            row.itemType = "";
            row.itemUnit = "";
            row.bomid = 0;
            row.productDescription_cached = "";
          }
        }
      }

      updated[rowIndex] = row;
      productRowsRef.current = updated;
      setProductRows(updated);

      if (onValuesChange) {
        onValuesChange({ ...currentFormValues, workOrderDetail: updated });
      }
      validateProductField(rowIndex, field, value);
    }, [currentFormValues, onValuesChange, validateProductField, itemOptions]);

    // Add new product row
    const handleAddProductRow = useCallback(() => {
      const newRow = {
        workOrderLineID: 0,
        workOrderID: currentFormValues.workOrderID || 0,
        customerOrderReference: "",
        documentIStatus: 0,
        documentIStatusText: "Not Approved",
        itemID: "",
        parentFGItemID: "",
        parentFGItemCode: "",
        itemType: "",
        itemUnit: "",
        quantityOrdered: "",
        deliveryDate: "",
        quantityDelivered: 0,
        quantityAccepted: 0,
        workOrderCompletedDate: "",
        bomid: 0,
        productDescription_cached: "",
        current_operation_text: "",
        duplicateError: false
      };

      const nextRows = [...productRowsRef.current, newRow];
      productRowsRef.current = nextRows;

      setProductRows((prev) => {
        newProductIndexRef.current = prev.length; // Add to bottom
        return nextRows;
      });

      if (onValuesChange) {
        onValuesChange({
          ...currentFormValues,
          workOrderDetail: nextRows,
        });
      }
    }, [currentFormValues, onValuesChange]);

    // After adding a new product row, auto-focus the Cust. Order Ref field of that new row
    useEffect(() => {
      if (!editMode) return;
      const idx = newProductIndexRef.current;
      if (idx === null || idx === undefined || idx < 0) return;

      // Delay slightly to ensure component mounts into DOM
      const timer = setTimeout(() => {
        const el = productNameRefs.current[idx];
        if (el && typeof el.focus === "function") {
          try {
            el.focus();
          } catch {
            // ignore focus errors
          }
        }
      }, 50);

      newProductIndexRef.current = null;
      return () => clearTimeout(timer);
    }, [productRows.length, editMode]);

    // Delete product row logic
    const performDeleteProductRow = useCallback((rowIndex) => {
      const updated = productRowsRef.current.filter((_, idx) => idx !== rowIndex);
      productRowsRef.current = updated;
      setProductRows(updated);

      // Keep active tracking sane
      if (activeRowIndexRef.current === rowIndex) {
        activeRowIndexRef.current = null;
        setActiveRowIndex(null);
        setActiveDesc("");
      }

      if (onValuesChange) {
        onValuesChange({ ...currentFormValues, workOrderDetail: updated });
      }

      const errors = { ...productErrors };
      delete errors[rowIndex];
      // Shift remaining errors
      const newErrors = {};
      Object.keys(errors).forEach((key) => {
        const k = parseInt(key);
        if (k > rowIndex) {
          newErrors[k - 1] = errors[key];
        } else {
          newErrors[k] = errors[key];
        }
      });
      setProductErrors(newErrors);
    }, [currentFormValues, onValuesChange, productErrors]);

    // Show confirmation dialog before deleting
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
      // 1. Frontend Validation Check
      const isHeaderValid = validatedFormRef.current?.isValid?.() !== false;
      const areProductsValid = validateAllProducts();

      if (productRows.length === 0) {
        showToast("Please add at least one product for this work order", ERROR_STATUS.toLowerCase());
        return;
      }

      if (!isHeaderValid || !areProductsValid) {
        return;
      }

      setSubmitting(true);
      try {
        const payload = {
          pageSize: 0,
          pageNumber: 0,
          workOrderID: Number(values.workOrderID) || 0,
          workOrderNumber: values.workOrderNumber || "0",
          workOrderDate: values.workOrderDate || "",
          workOrderType: Number(values.workOrderType) || 0,
          supplierID: Number(values.supplierID) || 0,
          documentStatus: Number(values.documentStatus) === 50 ? 50 : (Number(values.workOrderID) > 0 ? 20 : (Number(values.documentStatus) || 0)),
          preparedBy: values.preparedBy || "",
          updatedBy: getPreparedBy(),
          approvedBy: values.approvedBy || "",
          approvedDate: values.approvedDate || "",
          remarks: values.remarks || "",
          paramType: "ADD",
          workOrderDetail: productRows.map((row) => ({
            workOrderLineID: Number(row.workOrderLineID) || 0,
            workOrderID: Number(values.workOrderID) || 0,
            customerOrderReference: row.customerOrderReference || "",
            documentIStatus: Number(values.documentStatus) === 50 ? 50 : (Number(values.workOrderID) > 0 ? 20 : (Number(row.documentIStatus) || 0)),
            itemID: Number(row.itemID) || 0,
            parentFGItemID: Number(row.parentFGItemID) || Number(row.itemID) || 0,
            itemType: row.itemType || "",
            quantityOrdered: Number(row.quantityOrdered) || 0,
            deliveryDate: row.deliveryDate || "",
            quantityDelivered: Number(row.quantityDelivered) || 0,
            quantityAccepted: Number(row.quantityAccepted) || 0,
            workOrderCompletedDate: row.workOrderCompletedDate || "",
            bomid: Number(row.bomid) || 0,
          })),
        };

        const response = await saveAndUpdateWorkOrderHeader(payload);

        if (response?.Status === SUCCESS_STATUS) {
          localStorage.removeItem(DRAFT_WORK_ORDER_CREATE);

          const headerLayer = response?.data?.WORK_ORDER_HEADER_RESPONSE?.[0] || response?.data?.data?.WORK_ORDER_HEADER_RESPONSE?.[0] || {};
          const generatedWoId = headerLayer.work_order_id || headerLayer.workOrderID || headerLayer.WorkOrderID || headerLayer.ID || response?.data?.work_order_id || response?.data?.workOrderID || response?.data?.ID || Number(values.workOrderID);

          if (generatedWoId && generatedWoId > 0) {
            try {
              const detailedRecord = await fetchWorkOrderHeaderDetails({ workOrderID: Number(generatedWoId) });
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

          onClose?.();
        } else {
          let errorMessage = "Failed to save Work Order.";
          if (response?.data?.WORK_ORDER_HEADER_RESPONSE?.[0]?.Message && response.data.WORK_ORDER_HEADER_RESPONSE[0].Message !== "OK") {
            errorMessage = response.data.WORK_ORDER_HEADER_RESPONSE[0].Message;
          } else if (response?.data?.ValidationErrors?.length > 0) {
            errorMessage = response.data.ValidationErrors[0].Message;
          } else if (response?.message && response.message !== "OK") {
            errorMessage = response.message;
          }
          showToast(errorMessage, ERROR_STATUS.toLowerCase());
        }
      } catch (error) {
        console.error("Error saving Work Order:", error);
        showToast("An error occurred while saving.", ERROR_STATUS.toLowerCase());
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

      clearDraft: () => {
        try {
          localStorage.removeItem(DRAFT_WORK_ORDER_CREATE);
        } catch {
          /* no-op */
        }
      },

      saveDraft: () => {
        try {
          const latestFormValues =
            validatedFormRef.current &&
              typeof validatedFormRef.current.getValues === "function"
              ? validatedFormRef.current.getValues()
              : currentFormValues || {};

          const draftPayload = {
            ...latestFormValues,
            workOrderDetail: Array.isArray(productRows) ? productRows : [],
          };

          localStorage.setItem(DRAFT_WORK_ORDER_CREATE, JSON.stringify(draftPayload));
        } catch (err) {
          console.error("Failed to save work order draft", err);
        }
      },
      hasUnsavedChanges: () => combinedIsDirty,
      confirmClose: () => {
        if (combinedIsDirty) {
          return window.confirm(
            MSG_UNSAVED_CHANGES_CONFIRM
          );
        }
        return true;
      },
    }));

    const isDisabled = initialData ? !editMode : false;

    // Product table columns - USED FOR HEADER RENDERING
    const productTableColumns = [
      { key: "actions", label: "Actions", width: "80px" },
      { key: "sno", label: "S.No", width: "60px" },
      { key: "customerOrderReference", label: "Cust. Order Ref", minWidth: "150px" },
      { key: "itemID", label: "Item Code / Description", minWidth: "180px" },
      { key: "quantityOrdered", label: "Qty Ordered", width: "120px" },
      { key: "deliveryDate", label: "Delivery Date", width: "140px" },
      { key: "current_operation_text", label: "Current Operation Status", width: "180px" },
      { key: "quantityDelivered", label: "Qty Delivered", width: "120px" },
      { key: "quantityAccepted", label: "Qty Accepted", width: "120px" },
      { key: "workOrderCompletedDate", label: "Completed Date", width: "140px" },
      { key: "bomid", label: "BOM", width: "100px" },
      { key: "parentFGItemCode", label: "Product", minWidth: "150px" },
      { key: "itemType", label: "Item Type", minWidth: "120px" },
      { key: "documentIStatus", label: "Status", width: "170px" },
    ];

    return (
      <>
        <div className="save-update-work-order" style={{ width: "100%", margin: "0 auto" }}>
          <style>{`
            .wo-product-card { margin-top: 20px; margin-bottom: 20px; }
            .wo-product-header {
              background: #7A4B78;
              padding: 8px 14px;
              margin-bottom: 0;
              border-radius: 7px 7px 0 0;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .wo-product-header h5 { font-size: 16px; margin: 0; line-height: 1; color: #fff; }
            
            /* Styles matching Supplier Details table */
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
            .contact-details-table tbody tr:hover td.contact-details-td-actions {
              background: #f8f9fa !important;
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
            .text-right {
              text-align: right !important;
            }
            input:disabled, select:disabled, textarea:disabled {
              background-color: #f5f7f9 !important;
              color: #495057 !important;
              opacity: 1;
              cursor: not-allowed;
            }

            /* Remove up/down arrows from number inputs (Qty Ordered) */
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
            .save-update-work-order input.form-control,
            .save-update-work-order select.form-select,
            .save-update-work-order select.form-control {
              padding: 0px 8px !important;
              font-size: 13px !important;
              height: 28px !important;
              min-height: 28px !important;
              line-height: 28px !important;
            }
            .save-update-work-order div[class*="-control"] {
              min-height: 28px !important;
              height: 28px !important;
              font-size: 13px !important;
            }
            .save-update-work-order div[class*="-ValueContainer"] {
              padding: 0px 6px !important;
              min-height: 26px !important;
              height: 26px !important;
            }
            .save-update-work-order div[class*="-IndicatorsContainer"] {
              height: 26px !important;
            }
            .save-update-work-order div[class*="-singleValue"],
            .save-update-work-order div[class*="-placeholder"] {
              margin: 0 !important;
              padding: 0 !important;
              line-height: 26px !important;
            }
            .save-update-work-order div[class*="-Input"] {
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Keep labels compact too */
            .save-update-work-order .form-label {
              margin-bottom: 2px !important;
            }
            /* Reduce spacing between field groups */
            .save-update-work-order .mb-4,
            .save-update-work-order .mb-3 {
              margin-bottom: 8px !important;
            }
            .save-update-work-order .mb-2 {
              margin-bottom: 4px !important;
            }

            /* Responsive layout media queries */
            @media (max-width: 1200px) {
              .save-update-work-order .col-md-3,
              .save-update-work-order .col-md-4,
              .save-update-work-order .col-md-6 {
                flex: 0 0 auto !important;
                width: 50% !important;
                margin-bottom: 8px !important;
              }
              .save-update-work-order .row {
                flex-wrap: wrap !important;
              }
            }

            @media (max-width: 768px) {
              .save-update-work-order .col-md-3,
              .save-update-work-order .col-md-4,
              .save-update-work-order .col-md-6 {
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

          <FullPageLoader
            loading={submitting}
            message="Saving work order..."
            logoSrc={inspireLogo}
          />
          {loadingDetails && <Loader />}

          <ValidatedForm
            ref={validatedFormRef}
            initialValues={initialValues}
            validation={validation}
            onSubmit={handleSubmit}
            onValuesChange={handleFormValuesChange}
          >
            {({ values, errors, handleChange, handleBlur }) => (
              <>
                {/* Row 1: ID, Type, Date, Supplier Name */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <FormField
                      label="Work Order No"
                      name="workOrderNumber"
                      value={values.workOrderNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={true}
                      error={errors.workOrderNumber}
                    // placeholder="Auto-generated"
                    />
                  </div>
                  <div className="col-md-3">
                    <ReactSelectField
                      label="Work Order Type"
                      name="workOrderType"
                      options={woTypeOptions}
                      value={values.workOrderType}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      error={errors.workOrderType}
                      placeholder="Select Type"
                    />
                  </div>
                  <div className="col-md-3">
                    <FormField
                      label="Date"
                      name="workOrderDate"
                      type="date"
                      value={values.workOrderDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={true}
                      error={errors.workOrderDate}
                    />
                  </div>
                  <div className="col-md-3">
                    <ReactSelectField
                      label="Subcontractor Name"
                      name="supplierID"
                      options={(() => {
                        const exists = supplierOptions.some(opt => String(opt.value) === String(values.supplierID));
                        if (exists || !values.supplierID || !values.name) {
                          return supplierOptions;
                        }
                        return [
                          ...supplierOptions,
                          { value: values.supplierID, label: values.name }
                        ];
                      })()}
                      value={values.supplierID}
                      placeholder="Select Subcontractor"
                      onBlur={handleBlur}
                      disabled={isDisabled || Number(values.workOrderType) === 1}
                      error={inactiveSupplierAttempt && !values.supplierID ? "Please select an active subcontractor name" : errors.supplierID}
                      onChange={(e) => {
                        const val = e?.target?.value || e;
                        const selected = supplierOptions.find(opt => String(opt.value) === String(val));
                        if (selected && Number(selected.status) === 0) {
                          setInactiveSupplierAttempt(true);
                          handleChange({ target: { name: "supplierID", value: "" } });
                        } else {
                          setInactiveSupplierAttempt(false);
                          handleChange(e);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: Status, Product Description, Remarks */}
                <div className="row mb-3">

                  <div className="col-md-12">
                    <TextAreaFormField
                      rows="1"
                      label="Remarks"
                      name="remarks"
                      value={values.remarks}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      error={errors.remarks}
                    />
                  </div>
                </div>

                {/* ── Product Details Card ── */}
                <div className="card wo-product-card">
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
                          const isEnabled = editMode || !initialData;
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
                        <table className="table table-vcenter contact-details-table" style={{ minWidth: "1600px", width: "100%", tableLayout: "fixed" }}>
                          <thead className="contact-details-thead">
                            <tr>
                              {productTableColumns.map((col) => (
                                <th key={col.key} className={`workorder-details-th workorder-details-th-${col.key}`} style={{ width: col.width || col.minWidth, minWidth: col.minWidth || col.width, maxWidth: col.maxWidth || col.width, textAlign: "center" }}>
                                  <span>{col.label}</span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="contact-details-tbody">
                            {productRows.map((row, rowIndex) => (
                              <React.Fragment key={rowIndex}>
                                <tr
                                  onClick={() => handleRowFocus(rowIndex)}
                                  onFocusCapture={() => handleRowFocus(rowIndex)}
                                  style={{ backgroundColor: activeRowIndex === rowIndex ? "#eef2f5" : "inherit" }}
                                >
                                  <td className="contact-details-td contact-details-td-actions" style={{ textAlign: "center" }}>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      onClick={() => handleDeleteProductRow(rowIndex)}
                                      disabled={!(isCreate || !row.workOrderLineID)}
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        background: "transparent",
                                        color: (isCreate || !row.workOrderLineID) ? "rgb(22, 119, 255)" : "#cccccc",
                                        border: "none",
                                        cursor: (isCreate || !row.workOrderLineID) ? "pointer" : "not-allowed"
                                      }}
                                      title={(isCreate || !row.workOrderLineID) ? "Remove row" : "Existing rows cannot be deleted in edit mode"}
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
                                  <td className="contact-details-td" style={{ textAlign: "center" }}>
                                    {rowIndex + 1}
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      ref={(el) => (productNameRefs.current[rowIndex] = el)}
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={row.customerOrderReference || ""}
                                      onChange={(e) => handleProductFieldChange(rowIndex, "customerOrderReference", e.target.value)}
                                      disabled={!editMode}
                                    />
                                  </td>
                                  <td className="contact-details-td" style={{ minWidth: "180px" }}>
                                    <ReactSelectField
                                      name={`itemID_${rowIndex}`}
                                      value={row.itemID ?? ""}
                                      options={(() => {
                                        const exists = formattedItemOptions.some(opt => String(opt.value) === String(row.itemID));
                                        if (exists || !row.itemID || !row.parentFGItemCode) {
                                          return formattedItemOptions;
                                        }
                                        return [
                                          ...formattedItemOptions,
                                          { value: row.itemID, label: row.parentFGItemCode }
                                        ];
                                      })()}
                                      onChange={(e) => handleProductFieldChange(rowIndex, "itemID", e?.target?.value ?? "")}
                                      isDisabled={!editMode}
                                      placeholder="Select Item"
                                      className={row.duplicateError || productErrors[rowIndex]?.itemID ? "is-invalid" : ""}
                                    />
                                    {row.duplicateError ? (
                                      <div style={{ color: "#dc3545", fontSize: "11px", marginTop: "2px", textAlign: "left" }}>Item code already exists</div>
                                    ) : productErrors[rowIndex]?.itemID ? (
                                      <div className="contact-details-error">{productErrors[rowIndex].itemID}</div>
                                    ) : null}
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className={`form-control form-control-sm contact-details-input text-right ${productErrors[rowIndex]?.quantityOrdered ? "is-invalid" : ""}`}
                                      value={row.quantityOrdered ?? ""}
                                      onChange={(e) => handleProductFieldChange(rowIndex, "quantityOrdered", e.target.value)}
                                      onFocus={(e) => {
                                        setTimeout(() => {
                                          e.target.select();
                                        }, 0);
                                      }}
                                      onClick={(e) => {
                                        e.target.select();
                                      }}
                                      disabled={!editMode}
                                    />
                                    {productErrors[rowIndex]?.quantityOrdered && <div className="contact-details-error">{productErrors[rowIndex].quantityOrdered}</div>}
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="date"
                                      className={`form-control form-control-sm contact-details-input ${productErrors[rowIndex]?.deliveryDate ? "is-invalid" : ""}`}
                                      value={row.deliveryDate || ""}
                                      onChange={(e) => handleProductFieldChange(rowIndex, "deliveryDate", e.target.value)}
                                      disabled={!editMode}
                                      min={today}
                                    />
                                    {productErrors[rowIndex]?.deliveryDate && <div className="contact-details-error">{productErrors[rowIndex].deliveryDate}</div>}
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={row.current_operation_text || ""}
                                      disabled={true}
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="number"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={row.quantityDelivered || 0}
                                      onChange={(e) => handleProductFieldChange(rowIndex, "quantityDelivered", e.target.value)}
                                      disabled={true}
                                      min="0"
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="number"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={row.quantityAccepted || 0}
                                      onChange={(e) => handleProductFieldChange(rowIndex, "quantityAccepted", e.target.value)}
                                      disabled={true}
                                      min="0"
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="date"
                                      className="form-control form-control-sm contact-details-input"
                                      value={row.workOrderCompletedDate || ""}
                                      onChange={(e) => handleProductFieldChange(rowIndex, "workOrderCompletedDate", e.target.value)}
                                      disabled={true}
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="number"
                                      className="form-control form-control-sm contact-details-input text-right"
                                      value={row.bomid || 0}
                                      onChange={(e) => handleProductFieldChange(rowIndex, "bomid", e.target.value)}
                                      disabled={true}
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={row.parentFGItemCode || ""}
                                      disabled={true}
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={row.itemType || ""}
                                      disabled={true}
                                    />
                                  </td>
                                  <td className="contact-details-td">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={
                                        row.documentIStatusText ||
                                        ((isCreate || !row.workOrderLineID) ? "Not Approved" : String(row.documentIStatus || ""))
                                      }
                                      disabled={true}
                                    />
                                  </td>
                                </tr>
                                <tr
                                  key={`sub-${rowIndex}`}
                                  style={{ backgroundColor: activeRowIndex === rowIndex ? "#f8fafc" : "#fff" }}
                                  onClick={() => handleRowFocus(rowIndex)}
                                >
                                  {/* Align left border of description with Item Code column by removing internal vertical lines for Actions, S.No, Cust. Order Ref */}
                                  <td className="contact-details-td" colSpan="3" style={{ borderRight: "1px solid #e2e8f0" }}></td>

                                  {/* Description spanning Item Code, Qty Ordered, Delivery Date */}
                                  <td className="contact-details-td" colSpan="3" style={{ padding: "8px 12px !important", verticalAlign: "middle", maxWidth: "440px" }}>
                                    <div title={row.productDescription_cached || (itemOptions.find(o => Number(o.fg_item_id) === Number(row.itemID))?.Item_Description) || ""} style={{ fontSize: "12.5px", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", lineHeight: "1.4" }}>
                                      {row.productDescription_cached || (itemOptions.find(o => Number(o.fg_item_id) === Number(row.itemID))?.Item_Description) || ""}
                                    </div>
                                  </td>

                                  {/* Unit under Qty Delivered - Right Aligned */}
                                  <td className="contact-details-td" style={{ padding: "8px 12px !important", verticalAlign: "middle", textAlign: "right" }}>
                                    <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: "500" }}>
                                      {row.itemUnit || ""}
                                    </div>
                                  </td>

                                  {/* Rest of the columns empty */}
                                  <td className="contact-details-td" colSpan="7"></td>
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 4: Audit Fields 1 */}
                <div className="row mt-4 mb-3">
                  <div className="col-md-3">
                    <FormField label="Prepared By" name="preparedBy" value={values.preparedBy} disabled={true} />
                  </div>
                  <div className="col-md-3">
                    <FormField label="Prepared Date" name="prepDate" type="date" value={values.prepDate} disabled={true} />
                  </div>
                  <div className="col-md-3">
                    <FormField label="Updated By" name="updatedBy" value={values.updatedBy} disabled={true} />
                  </div>
                  <div className="col-md-3">
                    <FormField label="Updated Date" name="updateDate" type="date" value={values.updateDate} disabled={true} />
                  </div>
                </div>

                {/* Row 5: Audit Fields 2 */}
                <div className="row mb-3">
                  <div className="col-md-3">
                    <FormField label={LABEL_APPROVED_BY} name="approvedBy" value={values.approvedBy} disabled={true} />
                  </div>
                  <div className="col-md-3">
                    <FormField label={LABEL_APPROVED_DATE} name="approvedDate" type="date" value={values.approvedDate} disabled={true} />
                  </div>
                  <div className="col-md-3">
                    <FormField
                      label="Document Status"
                      name="docStatusText"
                      value={values.docStatusText}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={true}
                    />
                  </div>
                </div>
              </>
            )}
          </ValidatedForm>
        </div>

        <DeleteConfirmDialog
          open={showDeleteConfirm}
          title="Confirm Delete"
          message="this product"
          onConfirm={confirmDeleteRow}
          onCancel={cancelDeleteRow}
        />
      </>
    );
  }
);

export default SaveUpdateWorkOrder;
