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
} from "../../../components/FormElement";
import ValidatedForm from "../../../components/ValidatedForm";
import useDirtyDraftDrawer from "../../../hooks/useDirtyDraftDrawer";
import { DeleteConfirmDialog } from "../../../components/Notification";
import { useToast } from "../../../components/useToast";
import Loader from "../../../components/Loader";
import { getPreparedBy } from "../../../utils/userSession";
import { ERROR_STATUS, SUCCESS_STATUS } from "../../../utils/ConstVariables";
import {
  saveAndUpdateQuotationHeader,
  fetchQuotationHeaderDetails,
  fetchQuotationCurrencies,
  fetchQuotationPriceScopes,
  fetchQuotationFGItems,
  fetchQuotationCustomers,
} from "../../../services/quotationService";
import {
  TRANSPORT_MODE_OPTIONS,
  DELIVERY_MODE_OPTIONS,
  FREIGHT_TERMS_OPTIONS,
  VALIDITY_DAYS_OPTIONS,
  DOC_STATUS,
  PARAM_TYPE,
  DRAFT_KEY,
  minDateString,
  initialForm,
  QUOTATION_FORM_STYLES,
  BASE_DETAIL_COLUMNS_HEAD,
  EXPORT_ONLY_DETAIL_COLUMNS,
  BASE_DETAIL_COLUMNS_TAIL,
  NEW_RECORD_STATUS_TEXT,
  CUSTOMER_TYPE,
  today,
  TAX_DETAIL_COLUMNS,
} from "../../../utils/constants/QuotationConstants";
import { PaginatedSearchSelect } from "../../../components/PaginatedSearchSelect";
import inspireLogo from "../../../assets/logo/IM_Icon-new.png";
import FullPageLoader from "../../../components/FullPageLoader";

// ─────────────────────────────────────────────────────────────────────────────
// Module-level helpers (pure functions, no component state — kept outside
// the component body so they aren't recreated on every render)
// ─────────────────────────────────────────────────────────────────────────────

const isExportType = (type) =>
  String(type || "")
    .trim()
    .toLowerCase() === CUSTOMER_TYPE.EXPORT;

// Earliest date selectable for header dates other than Quotation Date
// (which is fixed to today and disabled). No upper bound is applied to
// any of these fields — any future date is allowed.
const minPastDateString = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
})();

// Maps one QUOTATION_DETAILS_RESPONSE row (snake_case, API shape) into the
// camelCase row shape this form's Item Details table works with.
const mapQuotationDetailFromApi = (d, quotationId) => ({
  quotationLineID: d.quotation_line_id || 0,
  quotationID: d.quotation_id || quotationId,
  docIStatus: d.doc_istatus || 0,
  docIStatusText: d.doc_istatus_text || NEW_RECORD_STATUS_TEXT,
  fgItemID: d.fg_item_id || 0,
  fgItemCode: d.item_code || "",
  fgItemDescription: d.item_description || "",
  itemUnit: d.item_unit || "",
  customerItemCode: d.customer_item_code || "",
  customerAddress: d.CustomerAddress || "",
  qtyQuoted: d.qty_quoted || 0,
  unitRate: d.unit_rate || 0,
  discountPercent: d.discount_percent ?? 0,
  deliveryTerms: d.delivery_terms || "",
  quotationAmount: d.quotation_amount || 0,
  netAmount: d.total_net_amt || 0,
  quotationInotes: d.quotation_inotes || "",
  currencyRate: d.currency_rate ?? 1,
  convertedAmount: d.converted_amount || 0,
  customerOrderID: d.customer_order_id || 0,
  qtyOrdered: d.qty_ordered || 0,
  deliveryDate: d.delivery_date ? d.delivery_date.split("T")[0] : "",
  quotationValidityDays: d.quotation_validity_days ?? 0,
  igstPercent: d.igst_perc ?? 0,
  igstAmount: d.igst_amt ?? 0,
  sgstPercent: d.sgst_perc ?? 0,
  sgstAmount: d.sgst_amt ?? 0,
  cgstPercent: d.cgst_perc ?? 0,
  cgstAmount: d.cgst_amt ?? 0,
  updateBy: d.update_by || "",
  updateDate: d.update_date || "",
});

// A brand-new, blank detail row — used when the user clicks "Add Item".
const createEmptyDetailRow = (quotationID = 0) => ({
  quotationLineID: 0,
  quotationID: quotationID || 0,
  docIStatus: 0,
  docIStatusText: NEW_RECORD_STATUS_TEXT,
  fgItemID: "",
  fgItemCode: "",
  fgItemDescription: "",
  customerItemCode: "",
  qtyQuoted: "",
  unitRate: "",
  discountPercent: 0,
  deliveryTerms: "",
  quotationAmount: 0,
  quotationInotes: "",
  currencyRate: 1,
  convertedAmount: 0,
  customerOrderID: 0,
  qtyOrdered: 0,
  igstPercent: 0,
  igstAmount: 0,
  sgstPercent: 0,
  sgstAmount: 0,
  cgstPercent: 0,
  cgstAmount: 0,
});

// Builds the Item Details table's column list for the given customer type.
const buildQuotationDetailColumns = (isExportCustomer) => [
  ...BASE_DETAIL_COLUMNS_HEAD,
  ...(isExportCustomer ? EXPORT_ONLY_DETAIL_COLUMNS : []),
  ...BASE_DETAIL_COLUMNS_TAIL,
  ...TAX_DETAIL_COLUMNS,
];

// Builds the form's `initialValues` from either the freshly-fetched header
// (fetchedData) or the row passed in from the list page (initialData) —
// caller passes `fetchedData || initialData` as `src`. Reads BOTH camelCase
// and the API's snake_case for every field. Header-level GST/net totals are
// pulled straight from the API response here — same as Purchase Order —
// and are never derived from summing the row-level GST fields.
const buildQuotationInitialValues = (src, baseForm, inrCurrencyOption) => {
  const inrDefaults = inrCurrencyOption
    ? {
        currencyID: inrCurrencyOption.value,
        currencyCode: inrCurrencyOption.label,
      }
    : {};

  const totalDefaults = {
    totalNetAmt: 0.0,
    totalIgstAmt: 0.0,
    totalCgstAmt: 0.0,
    totalSgstAmt: 0.0,
  };

  if (src && !src.isPreFilled) {
    return {
      ...baseForm,
      ...totalDefaults,
      ...src,
      quotationID: src.quotation_id || 0,
      quotationNo: src.quotation_no || "",
      quotationDate: src.quotation_date
        ? src.quotation_date.split("T")[0]
        : today,
      customerID: src.customer_id ?? "",
      customerName: src.customer_name || "",
      customerAddress: src.CustomerAddress || "",
      otherRef: src.other_ref || "",
      currencyID: src.currency_id ?? "",
      currencyCode: src.currency_code || "",
      kindAttnName: src.kind_attn_name || "",
      contactNo: src.contact_no || "",
      quotationNotes: src.quotation_notes || "",
      quotationValidityDays:
        src.quotation_validity_days != null
          ? String(src.quotation_validity_days)
          : "",
      docStatus: src.doc_status ?? 0,
      docStatusText: src.doc_status_text || NEW_RECORD_STATUS_TEXT,
      followupDate: src.followup_date ? src.followup_date.split("T")[0] : "",
      documentDeliveryMode: src.document_delivery_mode || "",
      transportMode: src.transport_mode || "",
      paymentTerms: src.payment_terms || "",
      freightTerms: src.freight_terms || "",
      insuranceTerms: src.insurance_terms || "",
      priceScope: src.price_scope || "",
      customerEnquiryRef: src.customer_enquiry_ref || "",
      customerEnquiryDate: src.customer_enquiry_date
        ? src.customer_enquiry_date.split("T")[0]
        : "",
      customerRequiredDate: src.customer_required_date
        ? src.customer_required_date.split("T")[0]
        : "",
      prepBy: src.prep_by || getPreparedBy(),
      prepDate: src.prep_date ? src.prep_date.split("T")[0] : today,
      updateBy: src.update_by || "",
      updateDate: src.update_date ? src.update_date.split("T")[0] : "",
      approvedBy: src.approved_by || "",
      approvedDate: src.approved_date ? src.approved_date.split("T")[0] : "",
      quotationAmount: src.quotation_amount ?? 0,
      totalNetAmt: src.total_net_amt,
      totalIgstAmt: src.total_igst_amt,
      totalCgstAmt: src.total_cgst_amt,
      totalSgstAmt: src.total_sgst_amt,
    };
  }

  if (src && src.isPreFilled) {
    return { ...baseForm, ...totalDefaults, ...inrDefaults };
  }

  const raw = localStorage.getItem(DRAFT_KEY);
  if (raw) {
    return {
      ...baseForm,
      ...totalDefaults,
      ...inrDefaults,
      ...JSON.parse(raw),
    };
  }

  return { ...baseForm, ...totalDefaults, ...inrDefaults };
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const SaveOrUpdateQuotation = forwardRef(
  (
    {
      onSuccess,
      initialData,
      editMode: editModeProp,
      onDirtyChange,
      disabled,
      onValuesChange,
      open = true,
    },
    ref,
  ) => {
    const { showToast } = useToast();
    const isCreate = !initialData || initialData.isPreFilled;

    // ── State: form/edit lifecycle ──────────────────────────────────────────
    const validatedFormRef = useRef();
    const [editMode, setEditMode] = useState(
      disabled
        ? false
        : editModeProp === undefined
          ? isCreate
            ? true
            : false
          : editModeProp,
    );
    const isDisabled = initialData ? !editMode : false;
    const canModifyDetails = editMode || isCreate;

    const [submitting, setSubmitting] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [fetchedData, setFetchedData] = useState(null);
    const fetchedIdRef = useRef(null);
    const onDirtyChangeRef = useRef(onDirtyChange);
    const prevCustomerIdRef = useRef(null);

    // ── State: dropdown / lookup data ───────────────────────────────────────
    const [currencyOptions, setCurrencyOptions] = useState([]);
    const [priceScopeOptions, setPriceScopeOptions] = useState([]);
    const [fgItemOptions, setFgItemOptions] = useState([]);

    // Export/domestic customer tracking — drives whether Currency is editable
    const [isExportCustomer, setIsExportCustomer] = useState(false);

    // Tracks the customerID that FG Items were last fetched for, so the
    // customer-driven fetch effect below doesn't re-fetch on every
    // unrelated form value change (only when the customer actually changes).
    const fgItemsFetchedForCustomerRef = useRef(null);

    // ── State: Item Details table (detail rows) ─────────────────────────────
    const [detailRows, setDetailRows] = useState([]);
    const detailRowsRef = useRef([]);
    const initialDetailRowsRef = useRef([]);
    const [detailErrors, setDetailErrors] = useState({});
    const newRowIndexRef = useRef(null);
    const itemNameRefs = useRef([]);
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const activeRowIndexRef = useRef(null);

    // ── State: delete confirmation dialog ───────────────────────────────────
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [rowToDelete, setRowToDelete] = useState(null);

    // ── Effects: keep refs/edit-mode in sync with props ─────────────────────
    useEffect(() => {
      onDirtyChangeRef.current = onDirtyChange;
    }, [onDirtyChange]);

    useEffect(() => {
      setEditMode(
        editModeProp === undefined ? (isCreate ? true : false) : editModeProp,
      );
    }, [editModeProp, isCreate]);

    // ── Effects: load dropdown data ──────────────────────────────────────────
    // Currency and price scope are real master-table lookups (foreign keys),
    // not fixed enums, so they stay API-driven and load unconditionally.
    // FG Item is a customer-scoped lookup — it's fetched separately (see the
    // customer-driven effect below) once a customer ID is known.
    useEffect(() => {
      async function loadDropdowns() {
        try {
          const data = await fetchQuotationCurrencies();
          if (Array.isArray(data)) {
            setCurrencyOptions(
              data.map((i) => ({ value: i.ValueText, label: i.DisplayText })),
            );
          }
        } catch (error) {
          console.error("Error fetching Currencies:", error);
        }

        try {
          const data = await fetchQuotationPriceScopes();
          if (Array.isArray(data)) {
            setPriceScopeOptions(
              data.map((i) => ({ value: i.ValueText, label: i.DisplayText })),
            );
          }
        } catch (error) {
          console.error("Error fetching Price Scopes:", error);
        }
      }
      loadDropdowns();
    }, []);

    // ── Effects: load header + item details for edit/view ───────────────────
    useEffect(() => {
      async function getDetails() {
        if (
          initialData &&
          !initialData.isPreFilled &&
          initialData.quotation_id
        ) {
          const qId = initialData.quotation_id;
          if (fetchedIdRef.current === qId) return;
          fetchedIdRef.current = qId;
          setLoadingDetails(true);
          try {
            const res = await fetchQuotationHeaderDetails({
              quotationID: qId,
            });
            if (res && res.Status === SUCCESS_STATUS && res.data) {
              const h = res.data.QUOTATION_HEADER_RESPONSE?.[0] || {};
              const details = res.data.QUOTATION_DETAILS_RESPONSE || [];

              const mappedDetails = details.map((d) =>
                mapQuotationDetailFromApi(d, qId),
              );

              // buildQuotationInitialValues already reads both camelCase
              // and snake_case for every field (including the GST/net
              // totals), so we just pass the raw header through with the
              // mapped detail rows attached.
              setFetchedData({
                ...h,
                paramType: PARAM_TYPE.EDIT,
                quotationDetail: mappedDetails,
              });

              setIsExportCustomer(isExportType(h?.customer_supply_text));

              detailRowsRef.current = mappedDetails;
              setDetailRows(mappedDetails);
              initialDetailRowsRef.current = JSON.parse(
                JSON.stringify(mappedDetails),
              );
            }
          } catch (e) {
            console.error("Error fetching Quotation details", e);
            showToast("Failed to load details", "error");
          } finally {
            setLoadingDetails(false);
          }
        }
      }
      getDetails();
      initialDetailRowsRef.current = [];
      if (typeof onDirtyChangeRef.current === "function")
        onDirtyChangeRef.current(false);
    }, [initialData, showToast]);

    // ── Derived: FG item + currency dropdown data ────────────────────────────
    const formattedFgItemOptions = React.useMemo(
      () =>
        fgItemOptions.map((o) => ({
          ...o,
          value: o.fg_item_id ?? "",
          label: o.Item_Code || "",
        })),
      [fgItemOptions],
    );

    // Resolve the INR currency option from the loaded currency list.
    const inrCurrencyOption = React.useMemo(
      () =>
        currencyOptions.find((o) =>
          String(o.label || "")
            .toUpperCase()
            .includes("INR"),
        ),
      [currencyOptions],
    );

    // ── Derived: initialValues / initialDetails ──────────────────────────────
    const initialValues = React.useMemo(
      () =>
        buildQuotationInitialValues(
          fetchedData || initialData,
          initialForm,
          inrCurrencyOption,
        ),
      [initialData, fetchedData, inrCurrencyOption],
    );

    const initialDetails = React.useMemo(
      () =>
        initialValues && Array.isArray(initialValues.quotationDetail)
          ? initialValues.quotationDetail
          : [],
      [initialValues],
    );

    const [currentFormValues, setCurrentFormValues] = useState(initialValues);

    // ── Effects: re-sync form + detail rows whenever initialValues changes ──
    useEffect(() => {
      setCurrentFormValues(initialValues);
      setDetailRows(initialDetails);
      detailRowsRef.current = initialDetails;
      initialDetailRowsRef.current = JSON.parse(JSON.stringify(initialDetails));
    }, [initialValues, initialDetails]);

    // ── Effects: load FG Items once a customer is known ─────────────────────
    useEffect(() => {
      const customerID = currentFormValues?.customerID;

      if (!customerID) {
        fgItemsFetchedForCustomerRef.current = null;
        setFgItemOptions([]);
        return;
      }

      if (fgItemsFetchedForCustomerRef.current === customerID) return;

      let cancelled = false;
      async function loadFgItems() {
        try {
          const data = await fetchQuotationFGItems(customerID);
          if (cancelled) return;
          fgItemsFetchedForCustomerRef.current = customerID;
          if (Array.isArray(data)) {
            setFgItemOptions(data);
          }
        } catch (error) {
          console.error("Error fetching FG Items:", error);
        }
      }
      loadFgItems();

      return () => {
        cancelled = true;
      };
    }, [currentFormValues?.customerID, showToast]);

    // ── Dirty-draft tracking ──────────────────────────────────────────────────
    const {
      isDirty: isFormDirty,
      onValuesChange: onFormValuesChange,
      resetDirty,
      updateBaseline,
    } = useDirtyDraftDrawer({
      open,
      initialValues,
      initialData,
      draftKey: DRAFT_KEY,
    });

    const updateBaselineRef = useRef(null);
    updateBaselineRef.current = updateBaseline;

    const clearDraft = () => {
      localStorage.removeItem(DRAFT_KEY);
      resetDirty?.();
    };

    const saveDraft = () => {
      const latest =
        validatedFormRef.current?.getValues?.() ?? currentFormValues;
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...latest, quotationDetail: detailRowsRef.current }),
      );
    };

    const areDetailsDirty = useCallback(() => {
      return (
        JSON.stringify(detailRows) !==
        JSON.stringify(initialDetailRowsRef.current)
      );
    }, [detailRows]);

    const combinedIsDirty = isFormDirty || areDetailsDirty();

    useEffect(() => {
      if (onDirtyChange) onDirtyChange(combinedIsDirty);
    }, [combinedIsDirty, onDirtyChange]);

    // ── Computed helpers (line-item math) ────────────────────────────────────
    const computeLineAmount = (row) => {
      const qty = Number(row.qtyQuoted) || 0;
      const rate = Number(row.unitRate) || 0;
      const disc = Number(row.discountPercent) || 0;
      return parseFloat(((qty * rate * (100 - disc)) / 100).toFixed(2));
    };

    const computeConvertedAmount = (row) => {
      const amt = computeLineAmount(row);
      const rate = Number(row.currencyRate) || 1;
      return parseFloat((amt * rate).toFixed(2));
    };

    // Recalculates totalNetAmt as the sum of row amounts — but only in create
    // mode. quotationAmount is never touched here in either mode; it's
    // server-calculated and only updates on the next fetch/save, same as the
    // GST totals in edit mode.
    const recalcTotals = (rows) => {
      if (!isCreate) return;

      const total = rows.reduce(
        (s, r) => s + (Number(r.quotationAmount) || 0),
        0,
      );
      const rounded = parseFloat(total.toFixed(2));

      if (validatedFormRef.current) {
        validatedFormRef.current.setFieldValue("totalNetAmt", rounded);
      }
      setCurrentFormValues((prev) => ({
        ...prev,
        totalNetAmt: rounded,
      }));
    };

    // Default non-export customers to INR once currency options are ready.
    // Only handles the EDIT case — correcting currency on an existing
    // domestic quotation after its header data loads. For brand-new
    // quotations, INR is already part of initialValues.
    // INR-default effect — re-establish baseline after the programmatic write
    useEffect(() => {
      if (isExportCustomer) return;
      if (!inrCurrencyOption) return;
      if (currentFormValues.currencyID === inrCurrencyOption.value) return;
      if (isCreate && currentFormValues.currencyID) return;

      if (validatedFormRef.current) {
        validatedFormRef.current.setFieldValue(
          "currencyID",
          inrCurrencyOption.value,
        );
        validatedFormRef.current.setFieldValue(
          "currencyCode",
          inrCurrencyOption.label,
        );
        setTimeout(() => {
          if (validatedFormRef.current && updateBaselineRef.current) {
            const currentVals = validatedFormRef.current.getValues?.() || {};
            updateBaselineRef.current({
              ...currentVals,
              currencyID: inrCurrencyOption.value,
              currencyCode: inrCurrencyOption.label,
            });
          }
        }, 50);
      }
      setCurrentFormValues((prev) => ({
        ...prev,
        currencyID: inrCurrencyOption.value,
        currencyCode: inrCurrencyOption.label,
      }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCreate, isExportCustomer, inrCurrencyOption]);

    // ── Validation ───────────────────────────────────────────────────────────
    const validation = React.useMemo(
      () => ({
        quotationDate: { required: true, fieldLabel: "Quotation Date" },
        customerName: {
          required: true,
          fieldLabel: "Customer",
        },
        currencyID: {
          required: true,
          fieldLabel: "Currency",
          controlType: "dropdown",
        },
        kindAttnName: { required: true, fieldLabel: "Kind Attention" },
        contactNo: {
          required: false,
          fieldLabel: "Contact No",
          validator: (value) => {
            if (!value) return "";
            const trimmed = String(value).trim();
            if (!/^[+]?[\d\s\-()]{10,15}$/.test(trimmed)) {
              return "Enter a valid contact number.";
            }
            return "";
          },
        },
      }),
      [],
    );

    const validateDetailField = useCallback(
      (rowIndex, field, value) => {
        const errors = { ...detailErrors };
        if (!errors[rowIndex]) errors[rowIndex] = {};

        if (field === "fgItemID") {
          if (!value || Number(value) === 0)
            errors[rowIndex][field] = "Required*";
          else delete errors[rowIndex][field];
        }
        if (field === "qtyQuoted" || field === "unitRate") {
          if (value === "" || value === null)
            errors[rowIndex][field] = "Required*";
          else if (Number(value) <= 0) errors[rowIndex][field] = "Must be > 0";
          else delete errors[rowIndex][field];
        }
        if (Object.keys(errors[rowIndex]).length === 0) delete errors[rowIndex];
        setDetailErrors(errors);
      },
      [detailErrors],
    );

    const validateAllDetails = useCallback(() => {
      const allErrors = {};
      let valid = true;

      const seenItemIds = new Set();
      const duplicateRowIndexes = new Set();
      detailRows.forEach((row, idx) => {
        const id = Number(row.fgItemID) || 0;
        if (!id) return;
        if (seenItemIds.has(id)) {
          duplicateRowIndexes.add(idx);
        } else {
          seenItemIds.add(id);
        }
      });

      detailRows.forEach((row, idx) => {
        const rowErrors = {};
        if (!row.fgItemID || Number(row.fgItemID) === 0) {
          rowErrors.fgItemID = "Required*";
          valid = false;
        } else if (duplicateRowIndexes.has(idx)) {
          rowErrors.fgItemID = "Duplicate item";
          valid = false;
        }
        if (!row.qtyQuoted || Number(row.qtyQuoted) <= 0) {
          rowErrors.qtyQuoted = "Required*";
          valid = false;
        }
        if (!row.unitRate || Number(row.unitRate) <= 0) {
          rowErrors.unitRate = "Required*";
          valid = false;
        }
        if (Object.keys(rowErrors).length) allErrors[idx] = rowErrors;
      });
      setDetailErrors(allErrors);
      return valid;
    }, [detailRows]);

    // ── Detail row CRUD handlers ──────────────────────────────────────────────
    const handleDetailFieldChange = useCallback(
      (rowIndex, field, value) => {
        activeRowIndexRef.current = rowIndex;
        setActiveRowIndex(rowIndex);
        const updated = [...detailRowsRef.current];
        let row = { ...updated[rowIndex], [field]: value };

        if (field === "fgItemID") {
          const isDuplicate =
            value &&
            detailRowsRef.current.some(
              (r, i) => i !== rowIndex && Number(r.fgItemID) === Number(value),
            );
          if (isDuplicate) {
            showToast("This item is already added to the quotation", "error");
            return;
          }

          const opt = fgItemOptions.find(
            (o) => Number(o.fg_item_id) === Number(value),
          );

          row = {
            ...createEmptyDetailRow(row.quotationID),
            quotationLineID: row.quotationLineID,
            quotationID: row.quotationID,
            docIStatus: row.docIStatus,
            docIStatusText: row.docIStatusText,
            fgItemID: value,
          };

          row.fgItemCode = opt?.Item_Code || "";
          row.fgItemDescription = opt?.Item_Description || "";
          row.itemUnit = opt?.Item_Unit || "";

          // GST percentages come straight from the selected FG item's master
          // data — they are NOT computed or user-editable here. The
          // corresponding *Amount fields are left at 0; those are
          // calculated server-side from these percentages on save, and get
          // their real values back only once the quotation is (re)fetched.
          row.igstPercent = Number(opt?.IGST_Percentage) || 0;
          row.sgstPercent = Number(opt?.SGST_Percentage) || 0;
          row.cgstPercent = Number(opt?.CGST_Percentage) || 0;
        }

        if (
          ["qtyQuoted", "unitRate", "discountPercent", "currencyRate"].includes(
            field,
          )
        ) {
          const valStr = String(value);
          const isWholeUnitQty =
            field === "qtyQuoted" &&
            String(row.itemUnit || "")
              .trim()
              .toUpperCase() === "NOS";
          const pattern = isWholeUnitQty
            ? /^\d{0,12}$/
            : /^\d{0,12}(\.\d{0,4})?$/;
          if (valStr !== "" && !pattern.test(valStr)) return;
          // Discount % can never exceed 100 — block the keystroke rather
          // than silently clamping, so the field never shows an invalid
          // value even transiently.
          if (
            field === "discountPercent" &&
            valStr !== "" &&
            Number(valStr) > 100
          )
            return;
          Object.assign(row, { [field]: value });
          row.quotationAmount = computeLineAmount(row);
          row.convertedAmount = computeConvertedAmount(row);
          // igstAmount/sgstAmount/cgstAmount are intentionally not
          // recomputed here — the backend derives them from igstPercent/
          // sgstPercent/cgstPercent + quotationAmount on save.
        }

        updated[rowIndex] = row;
        detailRowsRef.current = updated;
        setDetailRows(updated);
        recalcTotals(updated);
        validateDetailField(rowIndex, field, value);
      },
      [fgItemOptions, validateDetailField, showToast],
    );

    const handleAddDetailRow = useCallback(() => {
      if (
        !currentFormValues.customerID ||
        Number(currentFormValues.customerID) === 0
      ) {
        showToast(
          "Please select the customer Name first.",
          ERROR_STATUS.toLowerCase(),
        );
        return;
      }

      const newRow = createEmptyDetailRow(currentFormValues.quotationID);
      const next = [...detailRowsRef.current, newRow];
      detailRowsRef.current = next;
      setDetailRows((prev) => {
        newRowIndexRef.current = prev.length;
        setActiveRowIndex(prev.length);
        activeRowIndexRef.current = prev.length;
        return next;
      });
      if (onValuesChange)
        onValuesChange({ ...currentFormValues, quotationDetail: next });
    }, [currentFormValues, onValuesChange]);

    // After adding a row, auto-focus its Item Name field.
    useEffect(() => {
      if (!editMode) return;
      const idx = newRowIndexRef.current;
      if (idx === null || idx === undefined) return;
      const timer = setTimeout(() => {
        const el = itemNameRefs.current[idx];
        el?.focus?.();
      }, 50);
      newRowIndexRef.current = null;
      return () => clearTimeout(timer);
    }, [detailRows.length, editMode]);

    const performDeleteDetailRow = useCallback(
      (rowIndex) => {
        const updated = detailRowsRef.current.filter((_, i) => i !== rowIndex);
        detailRowsRef.current = updated;
        setDetailRows(updated);
        recalcTotals(updated);
        if (activeRowIndexRef.current === rowIndex) {
          activeRowIndexRef.current = null;
          setActiveRowIndex(null);
        }
        const errors = { ...detailErrors };
        delete errors[rowIndex];
        const newErrors = {};
        Object.keys(errors).forEach((k) => {
          const n = parseInt(k);
          newErrors[n > rowIndex ? n - 1 : n] = errors[k];
        });
        setDetailErrors(newErrors);
        if (onValuesChange)
          onValuesChange({ ...currentFormValues, quotationDetail: updated });
      },
      [currentFormValues, onValuesChange, detailErrors],
    );

    const handleDeleteDetailRow = useCallback(
      (i) => {
        if (!canModifyDetails) return;
        setRowToDelete(i);
        setShowDeleteConfirm(true);
      },
      [canModifyDetails],
    );

    const confirmDeleteRow = useCallback(() => {
      if (rowToDelete !== null) performDeleteDetailRow(rowToDelete);
      setShowDeleteConfirm(false);
      setRowToDelete(null);
    }, [rowToDelete, performDeleteDetailRow]);

    const cancelDeleteRow = useCallback(() => {
      setShowDeleteConfirm(false);
      setRowToDelete(null);
    }, []);

    const handleFormValuesChange = useCallback(
      (values) => {
        setCurrentFormValues(values);
        onFormValuesChange(values);
        if (onValuesChange)
          onValuesChange({ ...values, quotationDetail: detailRowsRef.current });
      },
      [onValuesChange, onFormValuesChange],
    );

    const fetchQuotationCustomersPaged = async ({
      page,
      pageSize,
      searchText,
    }) => {
      const res = await fetchQuotationCustomers({
        pageNumber: page,
        pageSize,
        searchKeyword: searchText || "",
      });

      const list = res?.data?.CUSTOMER_MASTER_LIST_IN_QUOTATION || [];
      const total = res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords ?? null;

      const options = list.map((c) => ({
        value: c.ValueText,
        label: c.DisplayText,
        raw: c,
      }));

      return {
        options,
        hasMore:
          total !== null
            ? (page + 1) * pageSize < total
            : options.length >= pageSize,
      };
    };

    const handleCustomerChange = useCallback((option, handleChange) => {
      const newCustomerId = option?.value ?? "";

      const setField = (name, value) =>
        handleChange({ target: { name, value } });
      setField("customerID", newCustomerId);
      setField("customerName", option?.label ?? "");
      setField("customerAddress", option?.raw?.CustomerAddress ?? "");

      setIsExportCustomer(isExportType(option?.raw?.customer_supply_text));

      // ── Customer-change guard: clear item codes if customer changed ──
      const prevCustomerId = prevCustomerIdRef.current;
      const customerChanged =
        prevCustomerId !== null &&
        String(newCustomerId) !== String(prevCustomerId);

      if (customerChanged && detailRowsRef.current.length > 0) {
        const clearedRows = detailRowsRef.current.map((row) => ({
          ...row,
          fgItemID: "",
          fgItemCode: "",
          fgItemDescription: "",
          itemUnit: "",
          customerItemCode: "",
          quotationAmount: 0,
          convertedAmount: 0,
          igstPercent: 0,
          igstAmount: 0,
          sgstPercent: 0,
          sgstAmount: 0,
          cgstPercent: 0,
          cgstAmount: 0,
        }));
        detailRowsRef.current = clearedRows;
        setDetailRows(clearedRows);
        setDetailErrors({});
        validatedFormRef.current?.setFieldValue("quotationAmount", 0);

        // Force the FG Items dropdown to refetch for the new customer instead
        // of showing stale options from the previous one.
        fgItemsFetchedForCustomerRef.current = null;
        setFgItemOptions([]);
      }

      prevCustomerIdRef.current = newCustomerId;
    }, []);

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (values) => {
      const headerValid = validatedFormRef.current?.isValid?.() !== false;
      const detailsValid = validateAllDetails();

      if (detailRows.length === 0) {
        showToast("Please add at least one item to the quotation", "error");
        return;
      }
      if (!headerValid || !detailsValid) return;

      setSubmitting(true);
      try {
        const qId = Number(values.quotationID) || 0;

        const payload = {
          pageSize: 0,
          pageNumber: 0,
          quotationID: qId,
          quotationNumber: values.quotationNo || "",
          quotationAmount: Number(values.quotationAmount) || 0,
          customerID: Number(values.customerID) || 0,
          customerAddress: values.customerAddress || "",
          otherReference: values.otherRef || "",
          customerEnquiryReference: values.customerEnquiryRef || "",
          customerEnquiryDate: values.customerEnquiryDate
            ? `${values.customerEnquiryDate}T00:00:00.000`
            : "",
          customerRequiredDate: values.customerRequiredDate
            ? `${values.customerRequiredDate}T00:00:00.000`
            : "",
          priceScope: values.priceScope || "",
          currencyID: Number(values.currencyID) || 0,
          kindAttentionName: values.kindAttnName || "",
          contactNumber: values.contactNo || "",
          quotationNotes: values.quotationNotes || "",
          quotationValidityDays: Number(values.quotationValidityDays) || 0,
          documentStatus: qId > 0 ? DOC_STATUS.AMENDMENT : DOC_STATUS.NEW,
          followupDate: values.followupDate
            ? `${values.followupDate}T00:00:00.000`
            : "",
          documentDeliveryMode: values.documentDeliveryMode || "",
          transportMode: values.transportMode || "",
          paymentTerms: values.paymentTerms || "",
          freightTerms: values.freightTerms || "",
          insuranceTerms: values.insuranceTerms || "",
          // GST + net totals are sent from header state exactly as
          // Purchase Order does — rounded, sourced from the last
          // fetch/save response, not recomputed from the row list here.
          totalNetAmount: Math.round(Number(values.totalNetAmt) || 0),
          totalIgstAmount: Math.round(Number(values.totalIgstAmt) || 0),
          totalCgstAmount: Math.round(Number(values.totalCgstAmt) || 0),
          totalSgstAmount: Math.round(Number(values.totalSgstAmt) || 0),
          preparedBy: values.prepBy || getPreparedBy(),
          updatedBy: getPreparedBy(),
          approvedBy: values.approvedBy || "",
          paramType: qId > 0 ? PARAM_TYPE.EDIT : PARAM_TYPE.ADD,
          quotationDetail: detailRows.map((d) => ({
            quotationLineID: Number(d.quotationLineID) || 0,
            quotationID: qId,
            documentStatus: qId > 0 ? DOC_STATUS.AMENDMENT : DOC_STATUS.NEW,
            fgItemID: Number(d.fgItemID) || 0,
            customerItemCode: d.customerItemCode || "",
            quantityQuoted: Number(d.qtyQuoted) || 0,
            unitRate: Number(d.unitRate) || 0,
            discountPercent: Number(d.discountPercent) || 0,
            deliveryTerms: d.deliveryTerms || "",
            quotationINotes: d.quotationInotes || "",
            currencyRate: Number(d.currencyRate) || 1,
            customerOrderID: Number(d.customerOrderID) || 0,
            deliveryDate: d.deliveryDate
              ? `${d.deliveryDate}T00:00:00.000`
              : values.quotationDate
                ? `${values.quotationDate}T00:00:00.000`
                : "",
            quantityOrdered: Number(d.qtyOrdered) || 0,
            // Only percentages are sent — they come from the selected FG
            // item's master data, not from any client-side calculation.
            // The backend computes igst/sgst/cgst amounts from these
            // percentages + quotationAmount.
            igstPercentage: Number(d.igstPercent) || 0,
            sgstPercentage: Number(d.sgstPercent) || 0,
            cgstPercentage: Number(d.cgstPercent) || 0,
            updatedBy: getPreparedBy(),
          })),
        };

        const response = await saveAndUpdateQuotationHeader(payload);

        if (response?.Status === SUCCESS_STATUS) {
          clearDraft();
          const headerResp = response?.data?.QUOTATION_RESPONSE?.[0] || {};
          const generatedId =
            headerResp.quotation_id || headerResp.quotationID || qId;

          if (generatedId > 0) {
            const detail = await fetchQuotationHeaderDetails({
              quotationID: Number(generatedId),
            });
            if (detail?.Status === SUCCESS_STATUS) {
              onSuccess?.(detail);
            } else {
              onSuccess?.(response);
            }
          } else {
            onSuccess?.(response);
          }
          showToast(
            headerResp.Message || "Quotation saved successfully",
            "success",
          );
        } else {
          const msg =
            response?.data?.QUOTATION_RESPONSE?.[0]?.Message ||
            response?.message ||
            "Failed to save Quotation.";
          showToast(msg, "error");
        }
      } catch (error) {
        console.error("Save error:", error);
        showToast("An error occurred while saving", "error");
      } finally {
        setSubmitting(false);
      }
    };

    // ── Imperative handle ────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      submit: () => validatedFormRef.current?.submitForm?.(),
      saveDraft,
      clearDraft,
      hasUnsavedChanges: () => combinedIsDirty,
      confirmClose: () => {
        if (combinedIsDirty) {
          return window.confirm(
            "You have unsaved changes. Do you want to save them before leaving?",
          );
        }
        return true;
      },
    }));

    // ── Detail table columns ─────────────────────────────────────────────────
    // Converted Amount (and the Currency Rate driving it) should be visible
    // for any quotation in a non-INR currency — not only export customers,
    // since a customer can still be quoted in a foreign currency regardless
    // of their export/domestic classification.
    const showConvertedAmount = inrCurrencyOption
      ? String(currentFormValues?.currencyID ?? "") !==
        String(inrCurrencyOption.value)
      : String(currentFormValues?.currencyCode || "")
          .trim()
          .toUpperCase() !== "INR" && !!currentFormValues?.currencyCode;

    const detailColumns = buildQuotationDetailColumns(showConvertedAmount);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
      <>
        <style>{QUOTATION_FORM_STYLES}</style>
        <style>{`
          @media (max-width: 767.98px) {
            .save-update-quotation .row {
              row-gap: 12px;
            }
            .save-update-quotation .row > [class*="col-"] {
              flex: 0 0 100% !important;
              max-width: 100% !important;
              width: 100% !important;
            }
          }
        `}</style>

        <FullPageLoader
          loading={submitting}
          message="Saving Quotation..."
          logoSrc={inspireLogo}
        />
        {loadingDetails && <Loader />}

        <div
          className="save-update-quotation pb-4 h-100 d-flex flex-column"
          style={{ width: "100%", margin: "0 auto" }}
        >
          {(submitting || loadingDetails) && <Loader />}

          <ValidatedForm
            key={fetchedData ? `fetched-${fetchedData.quotationID}` : "initial"}
            ref={validatedFormRef}
            initialValues={initialValues}
            validation={validation}
            onSubmit={handleSubmit}
            onValuesChange={handleFormValuesChange}
          >
            {({ values, handleChange, handleBlur, errors }) => (
              <>
                {/* Row 1 */}
                <div className="row mb-3">
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Quotation No"
                      name="quotationNo"
                      value={values.quotationNo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Quotation Date"
                      name="quotationDate"
                      type="date"
                      value={values.quotationDate}
                      onBlur={handleBlur}
                      error={errors.quotationDate}
                      disabled
                      required
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Kind Attention"
                      name="kindAttnName"
                      value={values.kindAttnName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.kindAttnName}
                      disabled={isDisabled}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Contact No"
                      name="contactNo"
                      value={values.contactNo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.contactNo}
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {/* Row 2 - Customer, Customer Enquiry Ref, Customer Enquiry Date, Customer Required Date */}
                <div className="row mb-3">
                  <div className="col-12 col-md-3">
                    <PaginatedSearchSelect
                      label="Customer"
                      name="customerID"
                      value={values.customerID}
                      inputLabel={values.customerName}
                      fetchPage={fetchQuotationCustomersPaged}
                      onChange={(option) =>
                        handleCustomerChange(option, handleChange)
                      }
                      onBlur={handleBlur}
                      error={errors.customerName}
                      placeholder="Search customer..."
                      disabled={isDisabled || !isCreate}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Customer Enquiry Ref"
                      name="customerEnquiryRef"
                      value={values.customerEnquiryRef}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Customer Enquiry Date"
                      name="customerEnquiryDate"
                      type="date"
                      value={values.customerEnquiryDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      min={minPastDateString}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Customer Required Date"
                      name="customerRequiredDate"
                      type="date"
                      value={values.customerRequiredDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      min={minPastDateString}
                    />
                  </div>
                </div>

                {/* Row 2b - Customer Address & Other Ref */}
                <div className="row mb-3">
                  <div className="col-12 col-md-3">
                    <TextAreaFormField
                      label="Customer Address"
                      name="customerAddress"
                      value={values.customerAddress}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={true}
                      rows={2}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Other Ref"
                      name="otherRef"
                      value={values.otherRef}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    {!isDisabled ? (
                      <ReactSelectField
                        label="Currency"
                        name="currencyID"
                        value={values.currencyID}
                        options={currencyOptions}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.currencyID}
                        placeholder="Select Currency"
                        required
                        disabled={!isExportCustomer}
                      />
                    ) : (
                      <FormField
                        label="Currency"
                        name="currencyCode"
                        value={values.currencyCode || ""}
                        disabled
                        required
                      />
                    )}
                  </div>
                  <div className="col-12 col-md-3">
                    <EditableSelectField
                      label="Price Scope"
                      name="priceScope"
                      value={values.priceScope || ""}
                      onChange={(e) => {
                        const val =
                          e?.target !== undefined ? e.target.value : e;
                        handleChange({
                          target: { name: "priceScope", value: val },
                        });
                      }}
                      onBlur={handleBlur}
                      options={priceScopeOptions.map((o) => o.label || o.value)}
                      placeholder="Select or type..."
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="row mb-3">
                  <div className="col-12 col-md-3">
                    <ReactSelectField
                      label="Validity Days"
                      name="quotationValidityDays"
                      value={values.quotationValidityDays}
                      options={VALIDITY_DAYS_OPTIONS}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      placeholder="Select validity"
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Followup Date"
                      name="followupDate"
                      type="date"
                      value={values.followupDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      min={minPastDateString}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <EditableSelectField
                      label="Document Delivery Mode"
                      name="documentDeliveryMode"
                      value={values.documentDeliveryMode || ""}
                      onChange={(e) => {
                        const val =
                          e?.target !== undefined ? e.target.value : e;
                        handleChange({
                          target: { name: "documentDeliveryMode", value: val },
                        });
                      }}
                      onBlur={handleBlur}
                      options={DELIVERY_MODE_OPTIONS}
                      placeholder="Select or type..."
                      disabled={isDisabled}
                      inputTransform={(v) => v.slice(0, 49)}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <EditableSelectField
                      label="Transport Mode"
                      name="transportMode"
                      value={values.transportMode || ""}
                      onChange={(e) => {
                        const val =
                          e?.target !== undefined ? e.target.value : e;
                        handleChange({
                          target: { name: "transportMode", value: val },
                        });
                      }}
                      onBlur={handleBlur}
                      options={TRANSPORT_MODE_OPTIONS}
                      placeholder="Select or type..."
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {/* Row 4 */}
                <div className="row mb-3">
                  <div className="col-12 col-md-6">
                    <FormField
                      label="Payment Terms"
                      name="paymentTerms"
                      value={values.paymentTerms}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <EditableSelectField
                      label="Freight Terms"
                      name="freightTerms"
                      value={values.freightTerms || ""}
                      onChange={(e) => {
                        const val =
                          e?.target !== undefined ? e.target.value : e;
                        handleChange({
                          target: { name: "freightTerms", value: val },
                        });
                      }}
                      onBlur={handleBlur}
                      options={FREIGHT_TERMS_OPTIONS}
                      placeholder="Select or type..."
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {/* ── Detail Table ── */}
                <div className="card quotation-detail-card">
                  <div className="card-header q-details-header">
                    <div className="d-flex flex-wrap align-items-center justify-content-between w-100">
                      <h5>Item Details</h5>
                      <div
                        className="d-flex align-items-center gap-2 ms-auto"
                        style={{ flexShrink: 0 }}
                      >
                        <button
                          className="btn btn-sm"
                          type="button"
                          onClick={() => {
                            if (canModifyDetails) handleAddDetailRow();
                          }}
                          disabled={!canModifyDetails}
                          style={{
                            background: canModifyDetails
                              ? "#7A4B78"
                              : "#cccccc",
                            color: "#fff",
                            borderRadius: "6px",
                            width: 33,
                            height: 33,
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            cursor: canModifyDetails
                              ? "pointer"
                              : "not-allowed",
                            opacity: canModifyDetails ? 1 : 0.6,
                          }}
                          title={
                            canModifyDetails
                              ? "Add Item"
                              : "Click Edit to add items"
                          }
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
                    {detailRows.length === 0 ? (
                      <div className="text-center text-muted py-4">
                        No items added
                      </div>
                    ) : (
                      <div className="q-details-table-responsive">
                        <table
                          className="table table-vcenter q-details-table"
                          style={{ minWidth: "1200px", width: "100%" }}
                        >
                          <thead className="q-details-thead">
                            <tr>
                              {detailColumns.map((col) => (
                                <th
                                  key={col.key}
                                  className={`q-details-th${col.key === "actions" ? " q-details-th-actions" : ""}`}
                                  style={{
                                    width: col.width || col.minWidth,
                                    minWidth: col.minWidth || col.width,
                                    textAlign: "center",
                                  }}
                                >
                                  {col.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {detailRows.map((row, idx) => (
                              <React.Fragment key={idx}>
                                <tr
                                  onClick={() => {
                                    activeRowIndexRef.current = idx;
                                    setActiveRowIndex(idx);
                                  }}
                                  onFocusCapture={() => {
                                    activeRowIndexRef.current = idx;
                                    setActiveRowIndex(idx);
                                  }}
                                  style={{
                                    backgroundColor:
                                      activeRowIndex === idx
                                        ? "#eef2f5"
                                        : "inherit",
                                  }}
                                >
                                  {/* Actions */}
                                  <td
                                    className="q-details-td q-details-td-actions"
                                    style={{ textAlign: "center" }}
                                  >
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDetailRow(idx);
                                      }}
                                      disabled={
                                        isDisabled ||
                                        !(
                                          canModifyDetails &&
                                          (isCreate || !row.quotationLineID)
                                        )
                                      }
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        background: "transparent",
                                        color:
                                          !isDisabled &&
                                          canModifyDetails &&
                                          (isCreate || !row.quotationLineID)
                                            ? "rgb(22,119,255)"
                                            : "#cccccc",
                                        border: "none",
                                        cursor:
                                          !isDisabled &&
                                          canModifyDetails &&
                                          (isCreate || !row.quotationLineID)
                                            ? "pointer"
                                            : "not-allowed",
                                      }}
                                      title={
                                        isDisabled
                                          ? "Cannot delete in view mode"
                                          : isCreate || !row.quotationLineID
                                            ? "Remove item"
                                            : "Existing items cannot be removed in edit mode"
                                      }
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
                                  <td className="q-details-td text-center">
                                    {idx + 1}
                                  </td>
                                  {/* FG Item */}
                                  <td className="q-details-td">
                                    <ReactSelectField
                                      name={`fgItemID_${idx}`}
                                      hideLabel
                                      options={(() => {
                                        const exists =
                                          formattedFgItemOptions.some(
                                            (o) =>
                                              String(o.value) ===
                                              String(row.fgItemID),
                                          );
                                        if (
                                          exists ||
                                          !row.fgItemID ||
                                          !row.fgItemCode
                                        )
                                          return formattedFgItemOptions;
                                        return [
                                          ...formattedFgItemOptions,
                                          {
                                            value: row.fgItemID,
                                            label: row.fgItemCode,
                                          },
                                        ];
                                      })()}
                                      value={row.fgItemID ?? ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "fgItemID",
                                          e?.target?.value ?? "",
                                        )
                                      }
                                      error={detailErrors[idx]?.fgItemID}
                                      isSearchable
                                      placeholder="Select FG Item"
                                      isDisabled={isDisabled}
                                    />
                                  </td>
                                  {/* Customer Item Code */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input"
                                      type="text"
                                      value={row.customerItemCode || ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "customerItemCode",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isDisabled}
                                      placeholder="Customer item code"
                                    />
                                  </td>
                                  {/* Qty Quoted */}
                                  <td className="q-details-td">
                                    <input
                                      className={`form-control form-control-sm q-details-input text-right${detailErrors[idx]?.qtyQuoted ? " is-invalid" : ""}`}
                                      type="text"
                                      value={row.qtyQuoted ?? ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "qtyQuoted",
                                          e.target.value,
                                        )
                                      }
                                      onFocus={(e) =>
                                        setTimeout(() => e.target.select(), 0)
                                      }
                                      disabled={isDisabled}
                                    />
                                    {detailErrors[idx]?.qtyQuoted && (
                                      <span className="q-details-error">
                                        {detailErrors[idx].qtyQuoted}
                                      </span>
                                    )}
                                  </td>
                                  {/* Unit Rate */}
                                  <td className="q-details-td">
                                    <input
                                      className={`form-control form-control-sm q-details-input text-right${detailErrors[idx]?.unitRate ? " is-invalid" : ""}`}
                                      type="text"
                                      value={row.unitRate ?? ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "unitRate",
                                          e.target.value,
                                        )
                                      }
                                      onFocus={(e) =>
                                        setTimeout(() => e.target.select(), 0)
                                      }
                                      disabled={isDisabled}
                                    />
                                    {detailErrors[idx]?.unitRate && (
                                      <span className="q-details-error">
                                        {detailErrors[idx].unitRate}
                                      </span>
                                    )}
                                  </td>
                                  {/* Discount % — capped at 100 */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input text-right"
                                      type="text"
                                      value={row.discountPercent ?? 0}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "discountPercent",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        if (Number(e.target.value) > 100) {
                                          handleDetailFieldChange(
                                            idx,
                                            "discountPercent",
                                            100,
                                          );
                                        }
                                      }}
                                      onFocus={(e) =>
                                        setTimeout(() => e.target.select(), 0)
                                      }
                                      disabled={isDisabled}
                                    />
                                  </td>
                                  {/* Amount (computed) */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.quotationAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                  {/* Currency Rate — shown for any non-INR currency */}
                                  {showConvertedAmount && (
                                    <td className="q-details-td">
                                      <input
                                        className="form-control form-control-sm q-details-input text-right"
                                        type="text"
                                        value={row.currencyRate ?? 1}
                                        onChange={(e) =>
                                          handleDetailFieldChange(
                                            idx,
                                            "currencyRate",
                                            e.target.value,
                                          )
                                        }
                                        onFocus={(e) =>
                                          setTimeout(() => e.target.select(), 0)
                                        }
                                        disabled={isDisabled}
                                      />
                                    </td>
                                  )}
                                  {/* Converted Amount (computed) — shown for any non-INR currency */}
                                  {showConvertedAmount && (
                                    <td className="q-details-td">
                                      <input
                                        className="form-control form-control-sm q-details-input text-right"
                                        type="text"
                                        value={Number(
                                          row.convertedAmount || 0,
                                        ).toFixed(2)}
                                        disabled
                                      />
                                    </td>
                                  )}
                                  {/* Delivery Terms */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input"
                                      type="text"
                                      value={row.deliveryTerms || ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "deliveryTerms",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isDisabled}
                                      placeholder="Delivery terms"
                                    />
                                  </td>
                                  {/* Notes */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input"
                                      type="text"
                                      value={row.quotationInotes || ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "quotationInotes",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isDisabled}
                                      placeholder="Notes"
                                    />
                                  </td>
                                  {/* IGST % */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input text-right"
                                      type="text"
                                      value={row.igstPercent ?? 0}
                                      disabled
                                    />
                                  </td>
                                  {/* SGST % */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input text-right"
                                      type="text"
                                      value={row.sgstPercent ?? 0}
                                      disabled
                                    />
                                  </td>
                                  {/* CGST % */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input text-right"
                                      type="text"
                                      value={row.cgstPercent ?? 0}
                                      disabled
                                    />
                                  </td>
                                  {/* IGST Amount — server-computed, only populated after save + reload */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.igstAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                  {/* SGST Amount — server-computed, only populated after save + reload */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.sgstAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>

                                  {/* CGST Amount — server-computed, only populated after save + reload */}
                                  <td className="q-details-td">
                                    <input
                                      className="form-control form-control-sm q-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.cgstAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                </tr>
                                <tr
                                  key={`sub-${idx}`}
                                  style={{
                                    backgroundColor:
                                      activeRowIndex === idx
                                        ? "#f8fafc"
                                        : "#fff",
                                  }}
                                  onClick={() => {
                                    activeRowIndexRef.current = idx;
                                    setActiveRowIndex(idx);
                                  }}
                                >
                                  {/* Actions + S.No */}
                                  <td
                                    className="q-details-td"
                                    colSpan={2}
                                    style={{ borderRight: "1px solid #e2e8f0" }}
                                  ></td>

                                  {/* Description — directly under the FG Item column */}
                                  <td
                                    className="q-details-td"
                                    colSpan={1}
                                    style={{
                                      padding: "8px 12px !important",
                                      verticalAlign: "middle",
                                      maxWidth: "260px",
                                    }}
                                  >
                                    <div
                                      title={row.fgItemDescription || ""}
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
                                      {row.fgItemDescription || ""}
                                    </div>
                                  </td>

                                  {/* Customer Item Code + Qty Quoted — skipped */}
                                  <td className="q-details-td" colSpan={1}></td>

                                  {/* Unit — directly under Unit Rate column */}
                                  <td
                                    className="q-details-td"
                                    colSpan={1}
                                    style={{
                                      padding: "8px 12px !important",
                                      verticalAlign: "middle",
                                      textAlign: "right",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: "12.5px",
                                        color: "#1e293b",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {row.itemUnit || ""}
                                    </div>
                                  </td>

                                  {/* Everything after Unit Rate: Discount %, Amount, [Currency Rate,
      Converted Amount], Delivery Terms, Notes, IGST/SGST/CGST %,
      IGST/SGST/CGST Amount */}
                                  <td
                                    className="q-details-td"
                                    colSpan={detailColumns.length - 5}
                                  ></td>
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row - Insurance Terms & Quotation Notes (after items) */}
                <div className="row mb-3 mt-3">
                  <div className="col-12 col-md-4">
                    <FormField
                      label="Insurance Terms"
                      name="insuranceTerms"
                      value={values.insuranceTerms}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <FormField
                      label="Document Status"
                      name="docStatusText"
                      value={values.docStatusText}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <TextAreaFormField
                      label="Quotation Notes"
                      name="quotationNotes"
                      value={values.quotationNotes}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Row - IGST / CGST / SGST / Net / Quotation Amount — sourced from
                    header state (same pattern as Purchase Order's totals row),
                    not derived from summing the row list on every render. */}
                <div className="row mt-2 mb-2">
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Total IGST Amount"
                      name="totalIgstAmt"
                      value={values.totalIgstAmt || 0.0}
                      style={{ textAlign: "right", width: "100%" }}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Total CGST Amount"
                      name="totalCgstAmt"
                      value={values.totalCgstAmt || 0.0}
                      style={{ textAlign: "right", width: "100%" }}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Total SGST Amount"
                      name="totalSgstAmt"
                      value={values.totalSgstAmt || 0.0}
                      style={{ textAlign: "right", width: "100%" }}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Total Net Amount"
                      name="totalNetAmt"
                      value={values.totalNetAmt || 0}
                      style={{ textAlign: "right", width: "100%" }}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Quotation Amount"
                      name="quotationAmount"
                      value={values.quotationAmount || 0}
                      style={{ textAlign: "right", width: "100%" }}
                      disabled
                    />
                  </div>
                </div>

                {/* Row - Prepared / Updated */}
                <div className="row mt-2 mb-6">
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Prepared By"
                      name="prepBy"
                      value={values.prepBy}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Prepared Date"
                      name="prepDate"
                      type="date"
                      value={values.prepDate}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Updated By"
                      name="updateBy"
                      value={values.updateBy}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Updated Date"
                      name="updateDate"
                      type="date"
                      value={values.updateDate}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Approved By"
                      name="approvedBy"
                      value={values.approvedBy}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Approved Date"
                      name="approvedDate"
                      type="date"
                      value={values.approvedDate}
                      disabled
                    />
                  </div>
                </div>
              </>
            )}
          </ValidatedForm>

          <DeleteConfirmDialog
            open={showDeleteConfirm}
            onConfirm={confirmDeleteRow}
            onCancel={cancelDeleteRow}
            message="this product"
          />
        </div>
      </>
    );
  },
);

SaveOrUpdateQuotation.displayName = "SaveOrUpdateQuotation";
export default SaveOrUpdateQuotation;
