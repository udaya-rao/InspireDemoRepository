// import React, {
//     useState,
//     useEffect,
//     forwardRef,
//     useImperativeHandle,
//     useRef,
//     useCallback,
//     useMemo,
// } from "react";
// import {
//     FormField,
//     TextAreaFormField,
//     ReactSelectField,
// } from "../../components/FormElement";
// import ValidatedForm from "../../components/ValidatedForm";
// import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
// import { DeleteConfirmDialog } from "../../components/Notification";
// import { useToast } from "../../components/useToast";
// import Loader from "../../components/Loader";
// import { getPreparedBy } from "../../utils/userSession";
// import {
//     SUCCESS_STATUS,
//     ERROR_STATUS,
//     PARAM_TYPE_ADD,
//     DRAFT_QUALITY_GRN_CREATE,
// } from "../../utils/ConstVariables";
// import { getParsedDraft, saveDraft, removeDraft } from "../../utils/storageUtils";
// import { INTEGER_QTY_REGEX, DECIMAL_QTY_REGEX } from "../../utils/regexUtils";
// import { getMinInvoiceDate, formatDateForInput } from "../../utils/dateUtils";
// import {
//     fetchQualityGRNHeaderDetails,
//     saveAndUpdateQualityGRN,
//     fetchPurchaseOrderNos,
//     fetchPurchaseGRNProducts,
// } from "../../services/grnService";
// import InspectionResult from "./InspectionResult";

// const todayStr = new Date().toISOString().split("T")[0];

// const DRAFT_KEY = DRAFT_QUALITY_GRN_CREATE;

// const QA_STATUS_OPTIONS = [
//     { value: "0", label: "Pending" },
//     { value: "30", label: "Accepted" },
//     { value: "40", label: "Rejected" },
// ];

// const createEmptyProductRow = (submitCount) => ({
//     _addedAtSubmitCount: submitCount,
//     itemCode: "",
//     itemDescription: "",
//     unit: "",
//     remarks: "",
//     batchNo: "",
//     qtyAdvised: "",
//     qtyDelivered: "",
//     qtyAccepted: "",
//     qtyAcceptedForSupplier: "",
//     qtyRejected: "",
//     qtyRejectedReason: "",
//     qtyTestingRejected: "",
//     qtyReturned: "",
//     qtyReturnedReason: "",
//     qtyStocked: "",
//     qaStatus: "0",
//     qaCheckedBy: "",
//     qaCheckedDate: "",
//     qtyCountedBy: "",
//     qtyCountedDate: "",
//     qtyReturnedBy: "",
//     qtyReturnedDate: "",
//     stockAddedBy: "",
//     stockAddedDate: "",
// });

// const makeInitialForm = (isCreate, initialData) => {
//     const base = {
//         grnID: 0,
//         grnNo: "",
//         grnDate: todayStr,
//         grnStatus: "0",
//         grnStatusText: "New Record",
//         remarks: "",
//         preparedBy: getPreparedBy(),
//         prepDate: todayStr,
//         updatedBy: "",
//         updatedDate: "",
//         paramType: PARAM_TYPE_ADD,
//     };

//     if (isCreate) {
//         const defaultCreate = {
//             ...base,
//             grnNo: "0",
//             purchaseOrderID: "",
//             currencyID: "INR",
//             supplierID: "",
//             supplierName: "",
//             supplierInvoiceDate: "",
//             supplierInvoiceRef: "",
//             productDetails: [],
//         };
//         const parsedDraft = getParsedDraft(DRAFT_KEY);
//         if (parsedDraft) {
//             return {
//                 ...defaultCreate,
//                 ...parsedDraft,
//                 productDetails: Array.isArray(parsedDraft.productDetails) ? parsedDraft.productDetails : [],
//             };
//         }
//         return defaultCreate;
//     } else {
//         const header = initialData;
//         return {
//             ...base,
//             grnID: header.grn_id || 0,
//             grnNo: header.grn_no || "",
//             grnDate: formatDateForInput(header.grn_date, todayStr),
//             grnStatus: String(header.doc_status ?? header.doc_istatus ?? header.grn_status ?? "0"),
//             grnStatusText: header.doc_status_text || header.doc_istatus_text || header.grn_status_text || "",
//             remarks: header.remarks || "",
//             preparedBy: header.prep_by || header.qty_counted_by || getPreparedBy(),
//             prepDate: formatDateForInput(header.prep_date || header.qty_counted_date, todayStr),
//             updatedBy: header.update_by || "",
//             updatedDate: formatDateForInput(header.update_date),
//             purchaseOrderID: header.purchase_order_id || header.work_order_id || header.purchase_order_no || "",
//             supplierID: header.supplier_id || "",
//             supplierName: header.supplier_name || "",
//             supplierInvoiceDate: formatDateForInput(header.supplier_invoice_date || header.invoice_date),
//             supplierInvoiceRef: header.supplier_invoice_ref || header.invoice_no || "",
//             productDetails: header.product_details || [],
//         };
//     }
// };

// const makeValidation = () => {
//     const base = {
//         grnDate: { required: true, fieldLabel: "GRN Date", controlType: "textbox" },
//         grnStatus: { required: true, fieldLabel: "Status", controlType: "dropdown" },
//     };
//     return {
//         ...base,
//         purchaseOrderID: { required: true, fieldLabel: "PO / Source Ref.", controlType: "dropdown" },
//     };
// };

// const buildPayload = (values, isCreate, grnID) => {
//     const formatDateTime = (dateStr) => {
//         if (!dateStr) return "";
//         if (dateStr.includes("T")) return dateStr.replace("T", " ").replace("Z", "");
//         return `${dateStr} 00:00:00.000`;
//     };

//     return {
//         pageSize: 0,
//         pageNumber: 0,
//         grnid: isCreate ? 0 : Number(grnID || values.grnID || 0),
//         grnNumber: values.grnNo || "0",
//         purchaseOrderID: Number(values.purchaseOrderID) || 0,
//         supplierInvoiceReference: values.supplierInvoiceRef || "",
//         supplierInvoiceDate: formatDateTime(values.supplierInvoiceDate),
//         remarks: values.remarks || "",
//         supplierID: (values.supplierID && String(values.supplierID) !== "0") ? String(values.supplierID) : "",
//         documentStatus: Number(values.grnStatus) || 10,
//         preparedBy: values.preparedBy || getPreparedBy(),
//         updatedBy: isCreate ? "" : getPreparedBy(),
//         paramType: PARAM_TYPE_ADD,
//         grnDetail: (values.productDetails || []).map((row) => ({
//             grnLineID: Number(row.grn_line_id) || 0,
//             grnid: isCreate ? 0 : Number(grnID || values.grnID || 0),
//             itemID: Number(
//                 row.value ||
//                 row.item_id ||
//                 (typeof row.itemCode === "object" ? row.itemCode?.ValueText : row.itemCode)
//             ) || 0,
//             quantityAdvised: Number(row.qtyAdvised) || 0,
//             quantityDelivered:
//                 row.qtyDelivered !== undefined && row.qtyDelivered !== null
//                     ? String(row.qtyDelivered)
//                     : "",
//             quantityCountedBy: row.qtyCountedBy || "",
//             quantityCountedDate: formatDateTime(row.qtyCountedDate),
//             quantityReturned: Number(row.qtyReturned) || 0,
//             quantityReturnedReason: row.qtyReturnedReason || "",
//             quantityReturnedBy: row.qtyReturnedBy || "",
//             quantityReturnedDate: formatDateTime(row.qtyReturnedDate),
//             qaStatus: Number(row.qaStatus) || 0,
//             qaCheckedBy: row.qaCheckedBy || "",
//             qaCheckedDate: formatDateTime(row.qaCheckedDate),
//             batchNumber: row.batchNo || "",
//             qtyAccepted: Number(row.qtyAccepted) || 0,
//             qtyAcceptedForSupplier: Number(row.qtyAcceptedForSupplier) || 0,
//             qtyRejected: Number(row.qtyRejected) || 0,
//             qtyRejectedReason: row.qtyRejectedReason || "",
//             qtyTestingRejected: Number(row.qtyTestingRejected) || 0,
//             qtyStocked: Number(row.qtyStocked) || 0,
//         })),
//     };
// };

// const SaveQualityGRN = forwardRef(
//     ({ onSuccess, initialData, editMode: editModeProp, onDirtyChange, disabled, open = true }, ref) => {
//         const { showToast } = useToast();
//         const validatedFormRef = useRef();

//         const isCreate = !initialData;
//         const [editMode, setEditMode] = useState(
//             disabled ? false : editModeProp === undefined ? isCreate : editModeProp
//         );
//         const [activeRowIndex, setActiveRowIndex] = useState(null);
//         const [activeProductTab, setActiveProductTab] = useState("product");
//         const [submitCount, setSubmitCount] = useState(0);
//         const [qtyErrors, setQtyErrors] = useState({});
//         const [returnReasonErrors, setReturnReasonErrors] = useState({});
//         const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//         const [rowToDelete, setRowToDelete] = useState(null);

//         const [purchaseOrderOptions, setPurchaseOrderOptions] = useState([]);

//         useEffect(() => {
//             async function loadPurchaseOrderOptions() {
//                 try {
//                     const data = await fetchPurchaseOrderNos();
//                     if (Array.isArray(data)) {
//                         const validOptions = data.filter(
//                             (item) => item.DisplayText && String(item.DisplayText).trim() !== ""
//                         );
//                         setPurchaseOrderOptions(
//                             validOptions.map((item) => ({
//                                 value: item.ValueText,
//                                 label: item.DisplayText,
//                                 supplier_id: item.Supplier_ID || item.supplier_id || null,
//                                 supplier_name: item.Supplier_Name || item.supplier_name || "",
//                             }))
//                         );
//                     }
//                 } catch (error) {
//                     console.error("Error fetching Purchase Order Nos:", error);
//                 }
//             }
//             loadPurchaseOrderOptions();
//         }, []);

//         const [itemOptions, setItemOptions] = useState([]);

//         const loadItemOptions = useCallback(async (purchaseOrderId) => {
//             if (!purchaseOrderId) {
//                 setItemOptions([]);
//                 return;
//             }
//             try {
//                 const data = await fetchPurchaseGRNProducts(purchaseOrderId);
//                 if (Array.isArray(data)) {
//                     setItemOptions(
//                         data.map((item) => ({
//                             value: String(item.ValueText || ""),
//                             label: item.Item_Code || item.DisplayText,
//                             description:
//                                 item.Item_Description ||
//                                 item.item_description ||
//                                 item.DisplayText ||
//                                 item.Item_Code,
//                             unit: item.Item_Unit || item.item_unit || item.unit || "",
//                             rawObject: item,
//                         }))
//                     );
//                 }
//             } catch (error) {
//                 console.error("Error fetching Purchase GRN Products:", error);
//             }
//         }, []);

//         useEffect(() => {
//             if (disabled) setEditMode(false);
//             else if (editModeProp !== undefined) setEditMode(editModeProp);
//         }, [editModeProp, disabled]);

//         const isDisabled = !isCreate && !editMode;
//         const [submitting, setSubmitting] = useState(false);
//         const [gridSubmitted, setGridSubmitted] = useState(false);

//         const [fetchedData, setFetchedData] = useState(null);
//         const [loadingDetails, setLoadingDetails] = useState(false);
//         const fetchedIdRef = useRef(null);

//         useEffect(() => {
//             const pId =
//                 fetchedData?.purchase_order_id ||
//                 initialData?.purchase_order_id ||
//                 initialData?.purchaseOrderID;
//             if (pId) {
//                 loadItemOptions(pId);
//             }
//         }, [fetchedData, initialData, loadItemOptions]);

//         useEffect(() => {
//             async function getDetails() {
//                 if (!isCreate && initialData && (initialData.grn_id || initialData.grnID || initialData.grnid)) {
//                     const grnId = initialData.grn_id || initialData.grnID || initialData.grnid;
//                     if (fetchedIdRef.current === grnId) return;
//                     fetchedIdRef.current = grnId;

//                     setLoadingDetails(true);
//                     try {
//                         const res = await fetchQualityGRNHeaderDetails({ grnid: Number(grnId) });
//                         if (res && (res.Status === SUCCESS_STATUS || res.Status === "Success" || res.message === "OK") && res.data) {
//                             const rawList =
//                                 res.data.GOODS_INSPECTION_DETAIL_RESPONSE ||
//                                 res.data.QUALITY_GRN_DETAILS_RESPONSE ||
//                                 [];

//                             if (rawList.length > 0) {
//                                 const firstItem = rawList[0];
//                                 const header = {
//                                     ...initialData,
//                                     ...firstItem,
//                                     grn_id: firstItem.grn_id || initialData.grn_id,
//                                     grn_no: firstItem.grn_no || initialData.grn_no,
//                                     grn_date: firstItem.grn_date || initialData.grn_date,
//                                     purchase_order_id: firstItem.purchase_order_id || firstItem.work_order_id || initialData.purchase_order_id,
//                                     doc_status: firstItem.doc_istatus ?? initialData.doc_status,
//                                     doc_status_text: firstItem.doc_istatus_text || initialData.doc_status_text,
//                                     prep_by: firstItem.qty_counted_by || initialData.prep_by,
//                                     prep_date: firstItem.qty_counted_date || initialData.prep_date,
//                                 };

//                                 const mappedDetails = rawList.map((d) => ({
//                                     grn_line_id: d.grn_line_id || d.line_id || 0,
//                                     item_id: d.item_id || 0,
//                                     itemCode: String(d.item_id || ""),
//                                     item_code: d.item_code || "",
//                                     itemDescription: d.item_description || "",
//                                     unit: d.item_unit || d.unit || "",
//                                     item_type: d.item_type || "",
//                                     qtyAdvised: d.qty_advised ?? d.qty_ordered ?? 0,
//                                     qtyDelivered:
//                                         d.qty_delivered !== null && d.qty_delivered !== undefined
//                                             ? String(d.qty_delivered)
//                                             : (d.qty_received !== null && d.qty_received !== undefined ? String(d.qty_received) : ""),
//                                     qtyReturned: d.qty_returned !== null && d.qty_returned !== undefined ? String(d.qty_returned) : "",
//                                     qtyReturnedReason: d.qty_returned_reason || "",
//                                     qtyReturnedBy: d.qty_returned_by || "",
//                                     qtyReturnedDate: d.qty_returned_date ? String(d.qty_returned_date).split("T")[0] : "",
//                                     qtyCountedBy: d.qty_counted_by || "",
//                                     qtyCountedDate: d.qty_counted_date ? String(d.qty_counted_date).split("T")[0] : "",
//                                     qtyAccepted: d.qty_accepted ?? "",
//                                     qtyAcceptedForSupplier: d.qty_accepted_for_supplier ?? d.qty_accepted ?? "",
//                                     qtyRejected: d.qty_rejected ?? "",
//                                     qtyRejectedReason: d.qty_rejected_reason || "",
//                                     qtyTestingRejected: d.qty_testing_rejected ?? "",
//                                     qaStatus: String(d.qa_status ?? "0"),
//                                     qaStatusText: d.qa_status_text || "",
//                                     qaCheckedBy: d.qa_checked_by || "",
//                                     qaCheckedDate: d.qa_checked_date ? String(d.qa_checked_date).split("T")[0] : "",
//                                     batchNo: d.batch_no || d.batchNo || "",
//                                     docStatus: d.doc_istatus ?? 30,
//                                     docStatusText: d.doc_istatus_text || "",
//                                     qtyStocked: d.qty_stocked ?? "",
//                                     stockAddedDate: d.stock_added_date ? String(d.stock_added_date).split("T")[0] : "",
//                                     stockAddedBy: d.stock_added_by || "",
//                                     workOrderLineId: d.work_order_line_id || null,
//                                     storeId: d.store_id || null,
//                                     remarks: d.remarks || "",
//                                 }));
//                                 setFetchedData({ ...header, product_details: mappedDetails });
//                             } else if (res.data.QUALITY_GRN_LINE_ITEMS) {
//                                 const header = res.data.QUALITY_GRN_DETAILS_RESPONSE?.[0] || initialData;
//                                 const details = res.data.QUALITY_GRN_LINE_ITEMS || [];
//                                 const mappedDetails = details.map((d) => ({
//                                     grn_line_id: d.line_id || d.grn_line_id || 0,
//                                     item_id: d.item_id || 0,
//                                     itemCode: String(d.item_id || ""),
//                                     item_code: d.item_code || "",
//                                     itemDescription: d.item_description || "",
//                                     unit: d.unit || d.item_unit || "",
//                                     qtyAdvised: d.qty_ordered ?? d.qtyAdvised ?? 0,
//                                     qtyDelivered:
//                                         d.qty_received !== null && d.qty_received !== undefined
//                                             ? String(d.qty_received)
//                                             : (d.qtyDelivered ?? ""),
//                                     qtyReturned: d.qty_returned ?? "",
//                                     qtyReturnedReason: d.qty_returned_reason || "",
//                                     qtyAccepted: d.qty_accepted ?? "",
//                                     qtyRejected: d.qty_rejected ?? "",
//                                     qtyRejectedReason: d.qty_rejected_reason || "",
//                                     qtyTestingRejected: d.qty_testing_rejected ?? "",
//                                     qtyAcceptedForSupplier: d.qty_accepted_for_supplier ?? d.qty_accepted ?? "",
//                                     qaStatus: String(d.qa_status ?? "0"),
//                                     qaStatusText: d.qa_status_text || "",
//                                     qaCheckedBy: d.qa_checked_by || "",
//                                     qaCheckedDate: d.qa_checked_date ? String(d.qa_checked_date).split("T")[0] : "",
//                                     batchNo: d.batch_no || d.batchNo || "",
//                                     qtyStocked: d.qty_stocked ?? "",
//                                     stockAddedDate: d.stock_added_date ? String(d.stock_added_date).split("T")[0] : "",
//                                     stockAddedBy: d.stock_added_by || "",
//                                     remarks: d.remarks || "",
//                                 }));
//                                 setFetchedData({ ...header, product_details: mappedDetails });
//                             }
//                         }
//                     } catch (e) {
//                         console.error("Error fetching Quality GRN details", e);
//                     } finally {
//                         setLoadingDetails(false);
//                     }
//                 }
//             }
//             getDetails();
//         }, [isCreate, initialData]);

//         useEffect(() => {
//             if (fetchedData?.purchase_order_id) {
//                 setPurchaseOrderOptions((prev) => {
//                     const val = fetchedData.purchase_order_id;
//                     if (!prev.find((o) => String(o.value) === String(val))) {
//                         return [
//                             ...prev,
//                             {
//                                 value: val,
//                                 label: fetchedData.purchase_order_no || String(val),
//                             },
//                         ];
//                     }
//                     return prev;
//                 });
//             }

//             if (fetchedData?.product_details?.length > 0) {
//                 setItemOptions((prev) => {
//                     let newOpts = [...prev];
//                     let changed = false;
//                     fetchedData.product_details.forEach((pd) => {
//                         const val = pd.item_id;
//                         if (val && !newOpts.find((o) => String(o.value) === String(val))) {
//                             newOpts.push({
//                                 value: String(val),
//                                 label: pd.item_code || pd.itemCode || String(val),
//                                 description: pd.itemDescription || pd.item_description || "",
//                                 unit: pd.unit || pd.item_unit || "",
//                             });
//                             changed = true;
//                         }
//                     });
//                     return changed ? newOpts : prev;
//                 });
//             }
//         }, [fetchedData]);

//         const initialValues = useMemo(
//             () => makeInitialForm(isCreate, fetchedData || initialData),
//             [isCreate, initialData, fetchedData]
//         );
//         const validation = useMemo(() => makeValidation(), []);

//         useEffect(() => {
//             if (!isCreate && fetchedData && validatedFormRef.current) {
//                 validatedFormRef.current.setValues(initialValues);
//             }
//         }, [fetchedData, isCreate, initialValues]);

//         const {
//             isDirty: isFormDirty,
//             onValuesChange,
//             resetDirty: resetFormDirty,
//         } = useDirtyDraftDrawer({
//             open,
//             initialValues,
//             initialData: isCreate ? null : fetchedData || initialData,
//             draftKey: isCreate ? DRAFT_KEY : undefined,
//         });

//         useEffect(() => {
//             if (onDirtyChange) onDirtyChange(isFormDirty);
//         }, [isFormDirty, onDirtyChange]);

//         const handleSubmit = async (values) => {
//             setGridSubmitted(true);
//             setSubmitCount((c) => c + 1);

//             if (!values.productDetails || values.productDetails.length === 0) {
//                 showToast("Please add at least one product for this Quality Inspection", ERROR_STATUS.toLowerCase());
//                 setGridSubmitted(false);
//                 setSubmitCount(0);
//                 return;
//             }

//             const invalidProduct = values.productDetails.find((p) => !p.itemCode || !p.qtyAdvised);
//             if (invalidProduct) {
//                 return;
//             }

//             let hasQtyError = false;
//             const newQtyErrors = {};
//             let hasReturnReasonError = false;
//             const newReturnReasonErrors = {};
//             values.productDetails.forEach((p, index) => {
//                 if (Number(p.qtyReturned || 0) > Number(p.qtyDelivered || 0)) {
//                     newQtyErrors[index] = true;
//                     hasQtyError = true;
//                 }
//                 if (Number(p.qtyReturned || 0) > 0 && !p.qtyReturnedReason?.trim()) {
//                     newReturnReasonErrors[index] = true;
//                     hasReturnReasonError = true;
//                 }
//             });
//             setQtyErrors(newQtyErrors);
//             setReturnReasonErrors(newReturnReasonErrors);

//             if (hasQtyError) {
//                 showToast("Quantity Returned Cannot Be Greater Than Quantity Delivered", ERROR_STATUS.toLowerCase());
//                 return;
//             }

//             if (hasReturnReasonError) {
//                 return;
//             }

//             setSubmitting(true);
//             try {
//                 const grnID = fetchedData?.grn_id || initialData?.grn_id || initialData?.grnID;
//                 const payload = buildPayload(values, isCreate, grnID);
//                 const res = await saveAndUpdateQualityGRN(payload);
//                 if (res && res.Status === SUCCESS_STATUS) {
//                     if (isCreate)
//                         try {
//                             removeDraft(DRAFT_KEY);
//                         } catch {
//                             /* ignore error */
//                         }
//                     const successMsg =
//                         res?.data?.QUALITY_GRN_SAVE_RESPONSE?.[0]?.Message ||
//                         "Quality Inspection saved successfully!";
//                     res.message = successMsg;
//                     if (onSuccess) onSuccess(res);
//                 } else {
//                     const errMsg =
//                         res?.data?.QUALITY_GRN_SAVE_RESPONSE?.[0]?.Message ||
//                         res?.message ||
//                         "Failed to save record";
//                     showToast(errMsg, ERROR_STATUS.toLowerCase());
//                 }
//             } catch (err) {
//                 console.error("Save error:", err);
//                 showToast("An error occurred while saving.", ERROR_STATUS.toLowerCase());
//             } finally {
//                 setSubmitting(false);
//             }
//         };

//         useImperativeHandle(ref, () => ({
//             submit: () => validatedFormRef.current?.submitForm(),
//             saveDraft: () => {
//                 if (validatedFormRef.current && isCreate && !disabled) {
//                     try {
//                         saveDraft(DRAFT_KEY, validatedFormRef.current.getValues());
//                     } catch {
//                         /* ignore error */
//                     }
//                 }
//             },
//             clearDraft: () => {
//                 try {
//                     removeDraft(DRAFT_KEY);
//                 } catch {
//                     /* ignore error */
//                 }
//                 resetFormDirty();
//                 if (onDirtyChange) onDirtyChange(false);
//             },
//             hasUnsavedChanges: () => isFormDirty,
//         }));

//         const SectionTitle = ({ children }) => (
//             <div
//                 style={{
//                     fontSize: 12,
//                     fontWeight: 700,
//                     color: "#6b7280",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.08em",
//                     borderBottom: "1px solid #e5e7eb",
//                     paddingBottom: 4,
//                     marginBottom: 12,
//                     marginTop: 20,
//                 }}
//             >
//                 {children}
//             </div>
//         );

//         return (
//             <div className="qog-page-wrapper" style={{ position: "relative" }}>
//                 {(submitting || loadingDetails) && <Loader />}

//                 <style>{`
//           .qog-product-card { margin-top: 10px; border: none; border-radius: 7px; }
//           .qog-table-responsive {
//             overflow-x: auto !important;
//             overflow-y: visible !important;
//           }
//           .qog-table {
//             border-collapse: separate;
//             border-spacing: 0;
//             width: 100%;
//             margin-bottom: 0;
//           }
//           .qog-thead {
//             position: sticky;
//             top: 0;
//             z-index: 24;
//           }
//           .qog-th {
//             padding: 4px 8px !important;
//             font-weight: bold !important;
//             font-size: 13px !important;
//             white-space: nowrap;
//             border-bottom: 2px solid #dee2e6;
//             border-right: 1px solid rgba(255, 255, 255, 0.3);
//             background: #7A4B78 !important;
//             color: #ffffff !important;
//             text-align: center;
//             text-transform: none !important;
//           }
//           .qog-td {
//             padding: 4px 8px !important;
//             vertical-align: middle;
//             border-bottom: 1px solid #dee2e6;
//             border-right: 1px solid #dee2e6;
//           }
//           .qog-input {
//             width: 100% !important;
//             padding: 3px 6px !important;
//             font-size: 13px;
//             background-color: #ffffff;
//             cursor: text;
//           }
//           /* Hide spin buttons on numeric inputs */
//           .qog-input::-webkit-outer-spin-button,
//           .qog-input::-webkit-inner-spin-button {
//             -webkit-appearance: none;
//             margin: 0;
//           }
//           input[type=number].qog-input {
//             -moz-appearance: textfield;
//           }
//           .qog-input:focus {
//             border-color: #86b7fe;
//             outline: 0;
//             box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
//           }
//           .qog-input:disabled {
//             background-color: #e9ecef !important;
//             cursor: not-allowed !important;
//             color: #495057 !important;
//           }
//           .qog-td-actions {
//             position: sticky !important;
//             left: 0 !important;
//             z-index: 10 !important;
//             background: #fff !important;
//             border-right: 2px solid #dee2e6 !important;
//           }
//           .qog-th-actions {
//             position: sticky !important;
//             left: 0 !important;
//             top: 0 !important;
//             z-index: 50 !important;
//             background: #7A4B78  !important;
//             color: #ffffff !important;
//             border-right: 2px solid #fff !important;
//           }
//           .qog-text-right { text-align: right !important; }
//           .qog-text-center { text-align: center !important; }

//           /* Top Information section disabled fields styling scoped to this page */
//           .qog-page-wrapper input:disabled, 
//           .qog-page-wrapper select:disabled, 
//           .qog-page-wrapper textarea:disabled {
//             background-color: #e9ecef !important;
//             color: #495057 !important;
//             opacity: 1;
//             cursor: not-allowed !important;
//           }
          
//           /* Compact top row, detail row, and bottom row fields */
//           .qog-top-fields .form-control,
//           .qog-top-sub-fields .form-control,
//           .qog-details-fields .form-control,
//           .qog-bottom-fields .form-control {
//             padding: 0px 8px !important;
//             font-size: 13px !important;
//             height: 28px !important;
//             min-height: 28px !important;
//             line-height: 28px !important;
//           }
//           .qog-top-fields div[class*="-control"],
//           .qog-top-sub-fields div[class*="-control"],
//           .qog-details-fields div[class*="-control"],
//           .qog-bottom-fields div[class*="-control"] {
//             min-height: 28px !important;
//             height: 28px !important;
//             font-size: 13px !important;
//           }
//           .qog-top-fields div[class*="-ValueContainer"],
//           .qog-top-sub-fields div[class*="-ValueContainer"],
//           .qog-details-fields div[class*="-ValueContainer"],
//           .qog-bottom-fields div[class*="-ValueContainer"] {
//             padding: 0px 6px !important;
//             min-height: 26px !important;
//             height: 26px !important;
//           }
//           .qog-top-fields div[class*="-IndicatorsContainer"],
//           .qog-top-sub-fields div[class*="-IndicatorsContainer"],
//           .qog-details-fields div[class*="-IndicatorsContainer"],
//           .qog-bottom-fields div[class*="-IndicatorsContainer"] {
//             height: 26px !important;
//           }
//           .qog-top-fields div[class*="-singleValue"],
//           .qog-top-fields div[class*="-placeholder"],
//           .qog-top-sub-fields div[class*="-singleValue"],
//           .qog-top-sub-fields div[class*="-placeholder"],
//           .qog-details-fields div[class*="-singleValue"],
//           .qog-details-fields div[class*="-placeholder"],
//           .qog-bottom-fields div[class*="-singleValue"],
//           .qog-bottom-fields div[class*="-placeholder"] {
//             margin: 0 !important;
//             padding: 0 !important;
//             line-height: 26px !important;
//           }
//           .qog-top-fields div[class*="-Input"],
//           .qog-top-sub-fields div[class*="-Input"],
//           .qog-details-fields div[class*="-Input"],
//           .qog-bottom-fields div[class*="-Input"] {
//             margin: 0 !important;
//             padding: 0 !important;
//           }
//           .qog-top-fields .mb-4,
//           .qog-top-fields .mb-3,
//           .qog-top-sub-fields .mb-4,
//           .qog-top-sub-fields .mb-3,
//           .qog-details-fields .mb-4,
//           .qog-details-fields .mb-3,
//           .qog-bottom-fields .mb-4,
//           .qog-bottom-fields .mb-3 {
//             margin-bottom: 8px !important;
//           }
//           .qog-top-fields .mb-2,
//           .qog-top-sub-fields .mb-2,
//           .qog-details-fields .mb-2,
//           .qog-bottom-fields .mb-2 {
//             margin-bottom: 4px !important;
//           }
//           .qog-top-fields .form-label,
//           .qog-top-sub-fields .form-label,
//           .qog-details-fields .form-label,
//           .qog-bottom-fields .form-label {
//             margin-bottom: 2px !important;
//           }

//           /* Compact table row fields */
//           .qog-table .form-control.qog-input {
//             padding: 0px 8px !important;
//             height: 28px !important;
//             min-height: 28px !important;
//             line-height: 28px !important;
//             font-size: 13px !important;
//           }
//           .qog-table div[class*="-control"] {
//             min-height: 28px !important;
//             height: 28px !important;
//             font-size: 13px !important;
//           }
//           .qog-table div[class*="-ValueContainer"] {
//             padding: 0px 6px !important;
//             min-height: 26px !important;
//             height: 26px !important;
//           }
//           .qog-table div[class*="-IndicatorsContainer"] {
//             height: 26px !important;
//           }
//           .qog-table div[class*="-singleValue"],
//           .qog-table div[class*="-placeholder"] {
//             margin: 0 !important;
//             padding: 0 !important;
//             line-height: 26px !important;
//           }
//           .qog-table div[class*="-Input"] {
//             margin: 0 !important;
//             padding: 0 !important;
//           }
//           .qog-table .mb-2 {
//             margin-bottom: 0 !important;
//           }
//           .qog-table .form-label {
//             display: none !important;
//           }

//           /* ── Responsive: medium screens (half-collapsed sidebar ~1200px) ── */
//           @media (max-width: 1200px) {
//             .qog-top-fields .col-md-2 {
//               flex: 0 0 auto;
//               width: 33.33% !important;
//               margin-bottom: 6px;
//             }
//             .qog-top-fields {
//               flex-wrap: wrap !important;
//             }
//             .qog-grn-tab-bar {
//               flex-wrap: wrap !important;
//               gap: 4px !important;
//             }
//             .qog-table-responsive {
//               overflow-x: auto !important;
//               -webkit-overflow-scrolling: touch;
//             }
//           }

//           /* ── Responsive: small screens (~900px) ── */
//           @media (max-width: 900px) {
//             .qog-top-fields .col-md-2 {
//               width: 50% !important;
//             }
//             .qog-grn-tab-bar button {
//               font-size: 12px !important;
//               padding: 4px 10px !important;
//             }
//           }

//           /* ── Responsive: very small screens (~600px) ── */
//           @media (max-width: 600px) {
//             .qog-top-fields .col-md-2 {
//               width: 100% !important;
//             }
//             .qog-grn-tab-bar {
//               flex-direction: column !important;
//               align-items: flex-start !important;
//             }
//           }
//         `}</style>

//                 <ValidatedForm
//                     ref={validatedFormRef}
//                     initialValues={initialValues}
//                     validation={validation}
//                     onSubmit={handleSubmit}
//                     onValuesChange={onValuesChange}
//                     disabled={isDisabled || disabled}
//                 >
//                     {({ values, errors, handleChange, handleBlur }) => (
//                         <>
//                             <div style={{ width: "100%", margin: "0 auto" }}>
//                                 {(() => {
//                                     const row = (values.productDetails && values.productDetails.length > 0) ? values.productDetails[0] : {};
//                                     const icv = typeof row.itemCode === "object" ? String(row.itemCode?.ValueText || "") : String(row.itemCode || "");
//                                     const desc = row.itemDescription || itemOptions.find(o => String(o.value) === icv)?.description || "";
//                                     const uom = row.unit || itemOptions.find(o => String(o.value) === icv)?.unit || "";

//                                     return (
//                                         <div className="qog-top-sub-fields qog-top-fields qog-details-fields">
//                                             {/* Top Row: WO / PO No, GRN Date, Source Ref, Supplier, Supplier Invoice Ref, Supplier Invoice Date */}
//                                             <div className="row mb-3">
//                                                 <div className="col-md-2">
//                                                     <FormField
//                                                         name="grnNo"
//                                                         label="WO / PO No"
//                                                         type="text"
//                                                         value={values?.grnNo}
//                                                         disabled
//                                                         style={{ background: "#e9ecef" }}
//                                                     />
//                                                 </div>
//                                                 <div className="col-md-2">
//                                                     <FormField
//                                                         name="grnDate"
//                                                         label="GRN Date"
//                                                         type="date"
//                                                         value={values?.grnDate || ""}
//                                                         onChange={handleChange}
//                                                         onBlur={handleBlur}
//                                                         error={errors?.grnDate}
//                                                         disabled={true}
//                                                         style={{ background: "#e9ecef" }}
//                                                     />
//                                                 </div>
//                                                 <div className="col-md-2">
//                                                     <ReactSelectField
//                                                         name="purchaseOrderID"
//                                                         label="Source Ref"
//                                                         options={purchaseOrderOptions}
//                                                         value={values?.purchaseOrderID}
//                                                         onChange={(e) => {
//                                                             handleChange(e);
//                                                             const val = e?.target?.value;
//                                                             const selectedOpt = purchaseOrderOptions.find(o => String(o.value) === String(val));
//                                                             const suppName = selectedOpt ? selectedOpt.supplier_name : "";
//                                                             const suppID = selectedOpt ? selectedOpt.supplier_id : "";
//                                                             handleChange({ target: { name: "supplierID", value: suppID } });
//                                                             handleChange({ target: { name: "supplierName", value: suppName } });

//                                                             loadItemOptions(val);

//                                                             let currentArr = values.productDetails ? [...values.productDetails] : [];
//                                                             if (currentArr.length === 0) {
//                                                                 const newRow = createEmptyProductRow(submitCount);
//                                                                 currentArr = [newRow];
//                                                                 setActiveRowIndex(0);
//                                                             } else {
//                                                                 currentArr = currentArr.map((r) => ({
//                                                                     ...r,
//                                                                     itemCode: "",
//                                                                     itemDescription: "",
//                                                                     unit: "",
//                                                                     duplicateError: false,
//                                                                 }));
//                                                             }
//                                                             handleChange({ target: { name: "productDetails", value: currentArr } });
//                                                         }}
//                                                         onBlur={handleBlur}
//                                                         error={errors?.purchaseOrderID}
//                                                         disabled={true}

//                                                     />
//                                                 </div>
//                                                 <div className="col-md-2">
//                                                     <FormField
//                                                         name="supplierName"
//                                                         label="Supplier"
//                                                         type="text"
//                                                         value={values?.supplierName || ""}
//                                                         onChange={handleChange}
//                                                         onBlur={handleBlur}
//                                                         error={errors?.supplierName}
//                                                         disabled={true}
//                                                         style={{ background: "#e9ecef" }}
//                                                     />
//                                                 </div>
//                                                 <div className="col-md-2">
//                                                     <FormField
//                                                         name="supplierInvoiceRef"
//                                                         label="Supplier Invoice Ref"
//                                                         type="text"
//                                                         value={values?.supplierInvoiceRef || ""}
//                                                         onChange={handleChange}
//                                                         onBlur={handleBlur}
//                                                         error={errors?.supplierInvoiceRef}
//                                                         disabled={true}
//                                                         style={{ background: "#e9ecef" }}
//                                                     />
//                                                 </div>
//                                                 <div className="col-md-2">
//                                                     <FormField
//                                                         name="supplierInvoiceDate"
//                                                         label="Supplier Invoice Date"
//                                                         type="date"
//                                                         value={values?.supplierInvoiceDate || ""}
//                                                         onChange={handleChange}
//                                                         onBlur={handleBlur}
//                                                         error={errors?.supplierInvoiceDate}
//                                                         disabled={true}
//                                                         min={getMinInvoiceDate()}
//                                                         style={{ background: "#e9ecef" }}
//                                                     />
//                                                 </div>
//                                             </div>

//                                             {/* Row 1: Item Code, Description, Batch No */}
//                                             <div className="row mb-3">
//                                                 <div className="col-md-4">
//                                                     <ReactSelectField name="productDetails[0].itemCode" label="Item Code"
//                                                         options={(() => { const ex = itemOptions.some(o => String(o.value) === icv); const lb = typeof row.itemCode === "object" ? (row.itemCode?.Item_Code || row.itemCode?.DisplayText) : null; return (ex || !icv || !lb) ? itemOptions : [...itemOptions, { value: icv, label: lb }]; })()}
//                                                         value={icv} disabled style={{ background: "#e9ecef" }} placeholder="Select Item..." />
//                                                 </div>
//                                                 <div className="col-md-6">
//                                                     <FormField label="Item Description" type="text" value={desc} disabled style={{ background: "#e9ecef" }} />
//                                                 </div>
//                                                 <div className="col-md-2">
//                                                     <FormField
//                                                         name="batchNo"
//                                                         label="Batch No"
//                                                         type="text"
//                                                         value={row.batchNo || values?.batchNo || ""}
//                                                         onChange={(e) => {
//                                                             handleChange({ target: { name: "batchNo", value: e.target.value } });
//                                                             if (values.productDetails && values.productDetails[0]) {
//                                                                 const arr = [...values.productDetails];
//                                                                 arr[0] = { ...arr[0], batchNo: e.target.value };
//                                                                 handleChange({ target: { name: "productDetails", value: arr } });
//                                                             }
//                                                         }}
//                                                         disabled={isDisabled || disabled || true}
//                                                         style={{ background: "#e9ecef" }}
//                                                     />
//                                                 </div>
//                                             </div>

//                                             {/* Row 3: Qty Advised, Unit, Qty Delivered, Qty Returned (Reason), GRN Prepared By / Date */}
//                                             <div className="row mb-3">
//                                                 <div className="col-md-2">
//                                                     <FormField label="Qty Advised" type="text" value={row.qtyAdvised ?? ""} disabled style={{ background: "#e9ecef" }} />
//                                                 </div>
//                                                 <div className="col-md-1">
//                                                     <FormField label="Unit" type="text" value={uom} disabled style={{ background: "#e9ecef" }} />
//                                                 </div>
//                                                 <div className="col-md-2">
//                                                     <FormField label="Qty Delivered" type="text" value={row.qtyDelivered ?? ""} disabled style={{ background: "#e9ecef" }} />
//                                                 </div>
//                                                 <div className="col-md-4">
//                                                     <FormField
//                                                         label="Qty Returned (Reason)"
//                                                         type="text"
//                                                         value={(() => {
//                                                             const rQty = (row.qtyReturned !== null && row.qtyReturned !== undefined && String(row.qtyReturned) !== "") ? String(row.qtyReturned) : "";
//                                                             const rReason = row.qtyReturnedReason || "";
//                                                             if (rQty || rReason) {
//                                                                 return rReason ? `${rQty} (${rReason})` : `${rQty}`;
//                                                             }
//                                                             return "";
//                                                         })()}
//                                                         disabled
//                                                         style={{ background: "#e9ecef" }}
//                                                     />
//                                                 </div>
//                                                 <div className="col-md-3">
//                                                     <FormField
//                                                         label="GRN Prepared By / Date"
//                                                         type="text"
//                                                         value={(() => {
//                                                             const formatDisplayDate = (d) => {
//                                                                 if (!d) return "";
//                                                                 if (d.includes("-") && d.split("-")[0].length === 4) {
//                                                                     const parts = d.split("-");
//                                                                     return `${parts[2]}-${parts[1]}-${parts[0]}`;
//                                                                 }
//                                                                 return d;
//                                                             };
//                                                             return [values?.preparedBy, formatDisplayDate(values?.prepDate)].filter(Boolean).join(" / ");
//                                                         })()}
//                                                         disabled
//                                                         style={{ background: "#e9ecef" }}
//                                                     />
//                                                 </div>
//                                             </div>

//                                             {/* {(values?.updatedBy || values?.updatedDate) ? (
//                                                 <div className="row mb-3">
//                                                     <div className="col-md-4">
//                                                         <FormField
//                                                             label="Updated By / Date"
//                                                             type="text"
//                                                             value={(() => {
//                                                                 const formatDisplayDate = (d) => {
//                                                                     if (!d) return "";
//                                                                     if (d.includes("-") && d.split("-")[0].length === 4) {
//                                                                         const parts = d.split("-");
//                                                                         return `${parts[2]}-${parts[1]}-${parts[0]}`;
//                                                                     }
//                                                                     return d;
//                                                                 };
//                                                                 return [values?.updatedBy, formatDisplayDate(values?.updatedDate)].filter(Boolean).join(" / ");
//                                                             })()}
//                                                             disabled
//                                                             style={{ background: "#e9ecef" }}
//                                                         />
//                                                     </div>
//                                                 </div>
//                                             ) : null} */}
//                                         </div>
//                                     );
//                                 })()}

//                                 {/*  GRN Details Section Header  */}
//                                 <div
//                                     className="qog-header"
//                                     style={{
//                                         background: "rgb(147, 108, 145)",
//                                         paddingTop: "10px",
//                                         paddingBottom: "10px",
//                                         paddingLeft: "10px",
//                                         paddingRight: "10px",
//                                         marginBottom: "8px",
//                                         borderRadius: "7px",
//                                     }}
//                                 >
//                                     <div className="d-flex flex-wrap align-items-center justify-content-between w-100">
//                                         <div className="d-flex align-items-center gap-2">
//                                             <h5
//                                                 style={{
//                                                     fontSize: "16px",
//                                                     margin: 0,
//                                                     lineHeight: "1",
//                                                     color: "rgb(255, 255, 255)",
//                                                 }}
//                                             >
//                                                 Inspection Details
//                                             </h5>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Unified single-instance GRN Details & summary fields together with identical starting alignment and no scrollbar */}
//                                 <div className="qog-details-fields" style={{ overflowX: "hidden" }}>
//                                     {(() => {
//                                         const row = (values.productDetails && values.productDetails.length > 0) ? values.productDetails[0] : {};
//                                         const icv = typeof row.itemCode === "object" ? String(row.itemCode?.ValueText || "") : String(row.itemCode || "");
//                                         const desc = row.itemDescription || itemOptions.find(o => String(o.value) === icv)?.description || "";
//                                         const uom = row.unit || itemOptions.find(o => String(o.value) === icv)?.unit || "";

//                                         return (
//                                             <div>
//                                                 {/* Row 3: Qty Rejected (Reason), Testing Rejected, Qty Accepted For Supplier, Qty Accepted, QA Status */}
//                                                 <div className="row mb-3">
//                                                     <div className="col-md-4">
//                                                         <FormField
//                                                             label="Qty Rejected (Reason)"
//                                                             type="text"
//                                                             value={(() => {
//                                                                 const rQty = (row.qtyRejected && String(row.qtyRejected) !== "0") ? row.qtyRejected : "";
//                                                                 const rReason = row.qtyRejectedReason || "";
//                                                                 return `${rQty} ${rReason}`;
//                                                             })()}
//                                                             disabled
//                                                             style={{ background: "#e9ecef" }}
//                                                         />
//                                                     </div>
//                                                     <div className="col-md-2"><FormField label="Testing Rejected" type="text" value={row.qtyTestingRejected ?? ""} disabled style={{ background: "#e9ecef" }} /></div>
//                                                     <div className="col-md-2"><FormField label="Qty Accepted For Supplier" type="text" value={row.qtyAcceptedForSupplier ?? ""} disabled style={{ background: "#e9ecef" }} /></div>
//                                                     <div className="col-md-2"><FormField label="Qty Accepted" type="text" value={row.qtyAccepted ?? ""} disabled style={{ background: "#e9ecef" }} /></div>
//                                                     <div className="col-md-2"><ReactSelectField name="productDetails[0].qaStatus" label="QA Status" options={QA_STATUS_OPTIONS} value={String(row.qaStatus ?? "0")} disabled style={{ background: "#e9ecef" }} /></div>
//                                                 </div>

//                                                 {/* Row 4: QA Checked By, QA Checked Date, Remarks */}
//                                                 <div className="row mb-3">
//                                                     <div className="col-md-2"><FormField label="QA Checked By" type="text" value={row.qaCheckedBy || ""} disabled style={{ background: "#e9ecef" }} /></div>
//                                                     <div className="col-md-2"><FormField label="QA Checked Date" type="date" value={row.qaCheckedDate || ""} disabled style={{ background: "#e9ecef" }} /></div>
//                                                     <div className="col-md-8">
//                                                         <FormField
//                                                             name="remarks"
//                                                             label="Remarks"
//                                                             type="text"
//                                                             value={values?.remarks || ""}
//                                                             disabled
//                                                             style={{ background: "#e9ecef" }}
//                                                         />
//                                                     </div>
//                                                 </div>

//                                                 {/* Inspection Result action button — displayed centered below QA Checked By & Date row, highlighted to click */}
//                                                 <div className="d-flex justify-content-center mt-3 mb-2">
//                                                     <button
//                                                         type="button"
//                                                         className="btn btn-sm d-flex align-items-center justify-content-center gap-2 shadow-sm"
//                                                         disabled={isCreate || !(values?.grnID || (fetchedData?.grn_id))}
//                                                         onClick={() => {
//                                                             const grnId = values?.grnID || fetchedData?.grn_id;
//                                                             const grnNo = values?.grnNo || fetchedData?.grn_no || String(grnId);
//                                                             const key = `grn-inspection-result-${grnId}`;
//                                                             const title = `Inspection Result - ${grnNo}`;
//                                                             const path = `/grn/inspection-result/${grnId}?grnNo=${encodeURIComponent(grnNo)}`;
//                                                             window.dispatchEvent(new CustomEvent('openVirtualTab', {
//                                                                 detail: {
//                                                                     key,
//                                                                     title,
//                                                                     path,
//                                                                     content: <InspectionResult grnID={grnId} grnNo={grnNo} />
//                                                                 }
//                                                             }));
//                                                         }}
//                                                         style={{
//                                                             background: (isCreate || !(values?.grnID || fetchedData?.grn_id))
//                                                                 ? "#cccccc"
//                                                                 : "linear-gradient(135deg, rgb(147, 108, 145) 0%, rgb(112, 75, 110) 100%)",
//                                                             color: "#fff",
//                                                             borderRadius: "20px",
//                                                             padding: "8px 28px",
//                                                             fontSize: "13px",
//                                                             fontWeight: 600,
//                                                             border: "1px solid rgba(255, 255, 255, 0.2)",
//                                                             cursor: (isCreate || !(values?.grnID || fetchedData?.grn_id)) ? "not-allowed" : "pointer",
//                                                             opacity: (isCreate || !(values?.grnID || fetchedData?.grn_id)) ? 0.6 : 1,
//                                                             whiteSpace: "nowrap",
//                                                             boxShadow: (isCreate || !(values?.grnID || fetchedData?.grn_id)) ? "none" : "0 4px 12px rgba(147, 108, 145, 0.45)",
//                                                             transition: "all 0.2s ease-in-out",
//                                                         }}
//                                                         title={(isCreate || !(values?.grnID || fetchedData?.grn_id)) ? "Save the record first to view Inspection Result" : "Open Inspection Result"}
//                                                     >
//                                                         <svg
//                                                             xmlns="http://www.w3.org/2000/svg"
//                                                             width="16"
//                                                             height="16"
//                                                             viewBox="0 0 24 24"
//                                                             fill="none"
//                                                             stroke="currentColor"
//                                                             strokeWidth="2.2"
//                                                             strokeLinecap="round"
//                                                             strokeLinejoin="round"
//                                                         >
//                                                             <path d="M9 11l3 3L22 4" />
//                                                             <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
//                                                         </svg>
//                                                         Inspection Result
//                                                     </button>
//                                                 </div>
//                                             </div>
//                                         );
//                                     })()}
//                                 </div>
//                             </div>
//                             <DeleteConfirmDialog
//                                 open={showDeleteConfirm}
//                                 title="Confirm Delete"
//                                 message="this product"
//                                 onConfirm={() => {
//                                     if (rowToDelete !== null) {
//                                         const arr = [...values.productDetails];
//                                         arr.splice(rowToDelete, 1);
//                                         handleChange({ target: { name: "productDetails", value: arr } });
//                                         if (activeRowIndex === rowToDelete) setActiveRowIndex(null);

//                                         const updatedQtyErrs = { ...qtyErrors };
//                                         delete updatedQtyErrs[rowToDelete];
//                                         const newErrs = {};
//                                         Object.keys(updatedQtyErrs).forEach((key) => {
//                                             const k = parseInt(key);
//                                             if (k > rowToDelete) newErrs[k - 1] = updatedQtyErrs[key];
//                                             else newErrs[k] = updatedQtyErrs[key];
//                                         });
//                                         setQtyErrors(newErrs);

//                                         const updatedReasonErrs = { ...returnReasonErrors };
//                                         delete updatedReasonErrs[rowToDelete];
//                                         const newReasonErrs = {};
//                                         Object.keys(updatedReasonErrs).forEach((key) => {
//                                             const k = parseInt(key);
//                                             if (k > rowToDelete) newReasonErrs[k - 1] = updatedReasonErrs[key];
//                                             else newReasonErrs[k] = updatedReasonErrs[key];
//                                         });
//                                         setReturnReasonErrors(newReasonErrs);
//                                     }
//                                     setShowDeleteConfirm(false);
//                                     setRowToDelete(null);
//                                 }}
//                                 onCancel={() => {
//                                     setShowDeleteConfirm(false);
//                                     setRowToDelete(null);
//                                 }}
//                             />
//                         </>
//                     )}
//                 </ValidatedForm>
//             </div>
//         );
//     }
// );

// SaveQualityGRN.displayName = "SaveQualityGRN";
// export default SaveQualityGRN;
