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
  saveAndUpdateOrderHeader,
  fetchOrderHeaderDetails,
  fetchOrderCurrencies,
  fetchOrderPriceScopes,
  fetchOrderFGItems,
  fetchOrderCustomers,
  fetchOrderQuotations,
} from "../../../services/orderService";
import {
  TRANSPORT_MODE_OPTIONS,
  DELIVERY_MODE_OPTIONS,
  FREIGHT_TERMS_OPTIONS,
  DOC_STATUS,
  PARAM_TYPE,
  DRAFT_KEY,
  minPastDateString,
  initialForm,
  ORDER_FORM_STYLES,
  BASE_DETAIL_COLUMNS_HEAD,
  EXPORT_ONLY_DETAIL_COLUMNS,
  BASE_DETAIL_COLUMNS_TAIL,
  NEW_RECORD_STATUS_TEXT,
  CUSTOMER_TYPE,
  today,
  TAX_DETAIL_COLUMNS,
} from "../../../utils/constants/OrderConstants";
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

// Item Details table column for the per-line Quotation reference. Kept out
// of OrderConstants.js so this doesn't require editing that file — spliced
// into the column list in buildOrderDetailColumns below, right after S.No.
const QUOTATION_DETAIL_COLUMN = {
  key: "quotation",
  label: "Quotation",
  minWidth: 160,
};

// Maps one ORDER_DETAILS_RESPONSE row (snake_case, API shape) into the
// camelCase row shape this form's Item Details table works with.
const mapOrderDetailFromApi = (d, orderId) => ({
  orderLineID: d.order_line_id || 0,
  orderID: d.order_id || orderId,
  docIStatus: d.doc_istatus || 0,
  docIStatusText: d.doc_istatus_text || NEW_RECORD_STATUS_TEXT,
  fgItemID: d.fg_item_id || 0,
  fgItemCode: d.item_code || "",
  fgItemDescription: d.item_description || "",
  itemUnit: d.item_unit || "",
  // Linkage back to the originating Quotation line, if this row was copied
  // from a Quotation — both are null/0 for a manually-entered order line.
  quotationID: d.quotation_id || null,
  quotationLineID: Number(d.quotation_line_id) || null,
  customerItemCode: d.customer_item_code || "",
  qtyOrdered: d.qty_ordered || 0,
  unitRate: d.unit_rate || 0,
  discountPercent: d.discount_percent ?? 0,
  deliveryTerms: d.delivery_terms || "",
  deliveryDate: d.delivery_date ? d.delivery_date.split("T")[0] : "",
  orderAmount: d.order_amount || 0,
  orderInotes: d.order_inotes || "",
  currencyRate: d.currency_rate ?? 1,
  convertedAmount: d.converted_amount || 0,
  // GST — same shape/source as Quotation's mapper. Percentages come from
  // the FG item master; amounts are server-computed from those percentages
  // + orderAmount and only populated after save + reload.
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
const createEmptyDetailRow = (orderID = 0) => ({
  orderLineID: 0,
  orderID: orderID || 0,
  docIStatus: 0,
  docIStatusText: NEW_RECORD_STATUS_TEXT,
  fgItemID: "",
  fgItemCode: "",
  fgItemDescription: "",
  itemUnit: "",
  quotationID: null,
  quotationLineID: null,
  customerItemCode: "",
  qtyOrdered: "",
  unitRate: "",
  discountPercent: 0,
  deliveryTerms: "",
  deliveryDate: "",
  orderAmount: 0,
  orderInotes: "",
  currencyRate: 1,
  convertedAmount: 0,
  igstPercent: 0,
  igstAmount: 0,
  sgstPercent: 0,
  sgstAmount: 0,
  cgstPercent: 0,
  cgstAmount: 0,
});

// Builds the Item Details table's column list for the given customer type.
// Quotation is inserted right after S.No (index 1) and before FG Item —
// Actions=0, S.No=1, Quotation=2, FG Item=3, ...
// If BASE_DETAIL_COLUMNS_HEAD isn't ordered [actions, slNo, fgItem, ...],
// adjust the splice index below to match.
const buildOrderDetailColumns = (isExportCustomer) => {
  const head = [...BASE_DETAIL_COLUMNS_HEAD];
  head.splice(2, 0, QUOTATION_DETAIL_COLUMN);
  return [
    ...head,
    ...(isExportCustomer ? EXPORT_ONLY_DETAIL_COLUMNS : []),
    ...BASE_DETAIL_COLUMNS_TAIL,
    ...TAX_DETAIL_COLUMNS, // ← must be here
  ];
};

// Builds the form's `initialValues` from either the freshly-fetched header
// (fetchedData) or the row passed in from the list page (initialData) —
// caller passes `fetchedData || initialData` as `src`. Reads BOTH camelCase
// and the API's snake_case for every field.
const buildOrderInitialValues = (src, baseForm) => {
  const totalDefaults = {
    totalIgstAmt: 0.0,
    totalCgstAmt: 0.0,
    totalSgstAmt: 0.0,
  };

  if (src && !src.isPreFilled) {
    return {
      ...baseForm,
      ...src,
      orderID: src.order_id || 0,
      orderNo: src.order_no || "",
      orderDate: src.order_date ? src.order_date.split("T")[0] : today,
      customerID: src.customer_id ?? "",
      customerName: src.customer_name || "",
      customerPoRef: src.customer_po_ref || "",
      customerPoDate: src.customer_po_date
        ? src.customer_po_date.split("T")[0]
        : "",
      customerBillingAddressLine1: src.customer_billing_address_line1 || "",
      customerBillingAddressLine2: src.customer_billing_address_line2 || "",
      customerBillingPinCode: src.customer_billing_pin_code || "",
      customerShippingAddressLine1: src.customer_shipping_address_line1 || "",
      customerShippingAddressLine2: src.customer_shipping_address_line2 || "",
      customerShippingPinCode: src.customer_shipping_pin_code || "",
      priceScope: src.price_scope || "",
      currencyID: src.currency_id ?? "",
      currencyCode: src.currency_code || "",
      kindAttnName: src.kind_attn_name || "",
      contactNo: src.contact_no || "",
      orderNotes: src.order_notes || "",
      docStatus: src.doc_status ?? 0,
      docStatusText: src.doc_status_text || NEW_RECORD_STATUS_TEXT,
      documentDeliveryMode: src.document_delivery_mode || "",
      transportMode: src.transport_mode || "",
      paymentTerms: src.payment_terms || "",
      freightTerms: src.freight_terms || "",
      insuranceTerms: src.insurance_terms || "",
      prepBy: src.prep_by || getPreparedBy(),
      prepDate: src.prep_date ? src.prep_date.split("T")[0] : today,
      updateBy: src.update_by || "",
      updateDate: src.update_date ? src.update_date.split("T")[0] : "",
      approvedBy: src.approved_by || "",
      approvedDate: src.approved_date ? src.approved_date.split("T")[0] : "",
      orderAmount: src.order_amount ?? 0,
      totalIgstAmt: src.total_igst_amt,
      totalCgstAmt: src.total_cgst_amt,
      totalSgstAmt: src.total_sgst_amt,
    };
  }

  if (src && src.isPreFilled) {
    return { ...baseForm, ...totalDefaults };
  }

  const raw = localStorage.getItem(DRAFT_KEY);
  if (raw) {
    return {
      ...baseForm,
      ...totalDefaults,
      ...JSON.parse(raw),
    };
  }

  return { ...baseForm, ...totalDefaults };
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const SaveOrUpdateOrder = forwardRef(
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
    const [quotationOptions, setQuotationOptions] = useState([]);

    // FG Items are scoped per (customerID, quotationID) combination — a row
    // with no Quotation selected shares the "customerID::none" list; a row
    // with a Quotation gets its own list. Fetched on demand — once, when
    // the customer is selected (customerID::none list, shared by every
    // quotation-less row), again per row when a Quotation is picked (that
    // row's own list), once for pre-populated rows when editing an existing
    // order, or as a last-resort fallback when the FG Item dropdown's menu
    // is opened — rather than via a blanket effect. This avoids the fetch
    // racing/cancelling itself as other row state changes, and avoids ever
    // issuing the same request twice.
    const [fgItemOptionsByKey, setFgItemOptionsByKey] = useState({});
    const fgItemFetchInFlightRef = useRef(new Set());

    const buildFgItemKey = (customerID, quotationID) =>
      `${customerID}::${quotationID || "none"}`;

    const fetchFgItemsForRow = useCallback(
      async (customerID, quotationID) => {
        if (!customerID) return;
        const key = buildFgItemKey(customerID, quotationID);
        if (fgItemOptionsByKey[key] || fgItemFetchInFlightRef.current.has(key))
          return;
        fgItemFetchInFlightRef.current.add(key);
        try {
          const list = await fetchOrderFGItems(quotationID, customerID);
          if (Array.isArray(list)) {
            setFgItemOptionsByKey((prev) => ({
              ...prev,
              [key]: list.map((o) => ({
                ...o,
                value: o.fg_item_id ?? "",
                label: o.Item_Code || "",
              })),
            }));
          }
        } catch (error) {
          console.error("Error fetching FG Items:", error);
        } finally {
          fgItemFetchInFlightRef.current.delete(key);
        }
      },
      [fgItemOptionsByKey],
    );

    // Export/domestic customer tracking — drives whether Currency is editable
    const [isExportCustomer, setIsExportCustomer] = useState(false);

    // Tracks the customerID that Quotations were last fetched for, so the
    // customer-driven fetch effect below doesn't re-fetch on every
    // unrelated form value change (only when the customer actually changes).
    const quotationsFetchedForCustomerRef = useRef(null);

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
    // FG Item and Quotation are customer-scoped lookups — each is fetched
    // separately (see the customer-driven effects below) once a customer
    // ID is known.
    useEffect(() => {
      async function loadDropdowns() {
        try {
          const data = await fetchOrderCurrencies();
          if (Array.isArray(data)) {
            setCurrencyOptions(
              data.map((i) => ({ value: i.ValueText, label: i.DisplayText })),
            );
          }
        } catch (error) {
          console.error("Error fetching Currencies:", error);
        }

        try {
          const data = await fetchOrderPriceScopes();
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
        if (initialData && !initialData.isPreFilled && initialData.order_id) {
          const oId = initialData.order_id;
          if (fetchedIdRef.current === oId) return;
          fetchedIdRef.current = oId;
          setLoadingDetails(true);
          try {
            const res = await fetchOrderHeaderDetails({ orderID: oId });
            if (res && res.Status === SUCCESS_STATUS && res.data) {
              const h = res.data.ORDER_HEADER_RESPONSE?.[0] || {};
              const details = res.data.ORDER_DETAILS_RESPONSE || [];

              const mappedDetails = details.map((d) =>
                mapOrderDetailFromApi(d, oId),
              );

              setFetchedData({
                ...h,
                paramType: PARAM_TYPE.EDIT,
                orderDetail: mappedDetails,
              });

              // Fall back to the list-page row if the header response
              // doesn't carry customer_supply_text, so edit mode doesn't
              // wrongly treat an export order as domestic.
              setIsExportCustomer(
                isExportType(
                  h?.customer_supply_text ?? initialData?.customer_supply_text,
                ),
              );

              detailRowsRef.current = mappedDetails;
              setDetailRows(mappedDetails);
              initialDetailRowsRef.current = JSON.parse(
                JSON.stringify(mappedDetails),
              );
            }
          } catch (e) {
            console.error("Error fetching Order details", e);
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

    // ── Derived: currency dropdown data ──────────────────────────────────────
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
    // Deliberately independent of the async currency list (see note on
    // buildOrderInitialValues) so a late-arriving currency response can't
    // re-sync the form or wipe detail rows.
    const initialValues = React.useMemo(
      () => buildOrderInitialValues(fetchedData || initialData, initialForm),
      [initialData, fetchedData],
    );

    const initialDetails = React.useMemo(
      () =>
        initialValues && Array.isArray(initialValues.orderDetail)
          ? initialValues.orderDetail
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

    // ── Effects: reset FG Item cache when the customer is cleared ────────────
    useEffect(() => {
      if (!currentFormValues?.customerID) {
        setFgItemOptionsByKey({});
        fgItemFetchInFlightRef.current = new Set();
        prefetchedRowKeysRef.current = new Set();
      }
    }, [currentFormValues?.customerID]);

    // ── Effects: load Quotations once a customer is known ───────────────────
    // Powers the Item Details table's Quotation column (per-line, optional
    // linkage back to a Quotation for that customer).
    useEffect(() => {
      const customerID = currentFormValues?.customerID;

      if (!customerID) {
        quotationsFetchedForCustomerRef.current = null;
        setQuotationOptions([]);
        return;
      }

      if (quotationsFetchedForCustomerRef.current === customerID) return;

      let cancelled = false;
      async function loadQuotations() {
        try {
          const data = await fetchOrderQuotations(customerID);
          if (cancelled) return;
          quotationsFetchedForCustomerRef.current = customerID;
          if (Array.isArray(data)) {
            setQuotationOptions(
              data.map((q) => ({
                value: q.quotation_id ?? q.ValueText,
                label: q.quotation_no ?? q.DisplayText,
              })),
            );
          }
        } catch (error) {
          console.error("Error fetching Quotations:", error);
        }
      }
      loadQuotations();

      return () => {
        cancelled = true;
      };
    }, [currentFormValues?.customerID]);

    // ── Effects: prefetch FG Items for rows that already have a
    // (customerID, quotationID) pair when they're loaded — e.g. rows coming
    // back from fetchOrderHeaderDetails in edit mode. New rows rely on
    // handleCustomerChange's up-front customer-only fetch, and a Quotation
    // change is already prefetched inline in handleDetailFieldChange — this
    // effect only covers the remaining case (rows arriving pre-populated).
    // Each (customerID, quotationID) key is attempted at most once per
    // mount of that key via prefetchedRowKeysRef, so this never re-issues
    // a request just because detailRows changed for an unrelated reason
    // (e.g. editing qty on a different row).
    const prefetchedRowKeysRef = useRef(new Set());

    useEffect(() => {
      const customerID = currentFormValues?.customerID;
      if (!customerID) return;

      detailRows.forEach((row) => {
        const key = buildFgItemKey(customerID, row.quotationID);
        if (prefetchedRowKeysRef.current.has(key)) return;
        prefetchedRowKeysRef.current.add(key);
        fetchFgItemsForRow(customerID, row.quotationID);
      });
    }, [detailRows, currentFormValues?.customerID, fetchFgItemsForRow]);

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
        JSON.stringify({ ...latest, orderDetail: detailRowsRef.current }),
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
      const qty = Number(row.qtyOrdered) || 0;
      const rate = Number(row.unitRate) || 0;
      const disc = Number(row.discountPercent) || 0;
      return parseFloat(((qty * rate * (100 - disc)) / 100).toFixed(2));
    };

    const computeConvertedAmount = (row) => {
      const amt = computeLineAmount(row);
      const rate = Number(row.currencyRate) || 1;
      return parseFloat((amt * rate).toFixed(2));
    };

    // Recalculates orderAmount as the sum of row amounts — but only in
    // create mode. In edit/view mode orderAmount is left exactly as the
    // server last returned it (same treatment Quotation gives
    // quotationAmount): it's server-calculated and only updates on the
    // next fetch/save.
    const recalcTotals = (rows) => {
      if (!isCreate) return;

      const total = rows.reduce((s, r) => s + (Number(r.orderAmount) || 0), 0);
      const rounded = parseFloat(total.toFixed(2));

      if (validatedFormRef.current) {
        validatedFormRef.current.setFieldValue("orderAmount", rounded);
      }
      setCurrentFormValues((prev) => ({
        ...prev,
        orderAmount: rounded,
      }));
    };

    // Default currency to INR for NEW orders only.
    //
    // This effect must never touch an existing (edit/view) order: the saved
    // currency from the DB is authoritative. Previously this also ran in
    // edit mode, and because the currency list and the order header load
    // independently, on slower devices the currency list could arrive after
    // the header while isExportCustomer was still false — overwriting the
    // saved currency with INR (and resetting the dirty baseline so it saved
    // silently).
    //
    // Switching from an export customer back to a domestic one in create
    // mode is handled in handleCustomerChange.
    useEffect(() => {
      if (!isCreate) return; // edit/view: trust saved data
      if (isExportCustomer) return;
      if (!inrCurrencyOption) return;
      if (currentFormValues?.currencyID) return; // already set (draft, user choice, or INR)

      if (validatedFormRef.current) {
        validatedFormRef.current.setFieldValue(
          "currencyID",
          inrCurrencyOption.value,
        );
        validatedFormRef.current.setFieldValue(
          "currencyCode",
          inrCurrencyOption.label,
        );
        // The INR default is not a user edit — move the dirty baseline so a
        // freshly opened "new order" form doesn't look dirty.
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
    // Note: quotationID is intentionally NOT included in per-row validation
    // below (validateDetailField / validateAllDetails) — it's optional.
    const validation = React.useMemo(
      () => ({
        orderDate: { required: true, fieldLabel: "Order Date" },
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
        // Billing / shipping pin codes are NOT NULL on order_header — kept
        // required here even though the address line1 fields are also
        // NOT NULL in the DB; line1 is validated at the detail-row/DB level
        // instead of blocking form submission, same tolerance Quotation
        // gives non-critical text fields.
        customerBillingAddressLine1: {
          required: true,
          fieldLabel: "Billing Address Line 1",
        },
        customerShippingAddressLine1: {
          required: true,
          fieldLabel: "Shipping Address Line 1",
        },
        customerBillingPinCode: {
          required: true,
          fieldLabel: "Billing Pin Code",
        },
        customerShippingPinCode: {
          required: true,
          fieldLabel: "Shipping Pin Code",
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
        if (field === "qtyOrdered" || field === "unitRate") {
          if (value === "" || value === null)
            errors[rowIndex][field] = "Required*";
          else if (Number(value) <= 0) errors[rowIndex][field] = "Must be > 0";
          else delete errors[rowIndex][field];
        }
        if (field === "deliveryDate") {
          if (!value) errors[rowIndex][field] = "Required*";
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
        if (!row.qtyOrdered || Number(row.qtyOrdered) <= 0) {
          rowErrors.qtyOrdered = "Required*";
          valid = false;
        }
        if (!row.unitRate || Number(row.unitRate) <= 0) {
          rowErrors.unitRate = "Required*";
          valid = false;
        }
        // delivery_date is NOT NULL on order_detail — required per row.
        if (!row.deliveryDate) {
          rowErrors.deliveryDate = "Required*";
          valid = false;
        }
        // quotationID is intentionally not validated here — optional per line.
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
            showToast("This item is already added to the order", "error");
            return;
          }

          const key = buildFgItemKey(
            currentFormValues?.customerID,
            row.quotationID,
          );
          const rowFgItemOptions = fgItemOptionsByKey[key] || [];
          const opt = rowFgItemOptions.find(
            (o) => Number(o.fg_item_id) === Number(value),
          );

          row = {
            ...createEmptyDetailRow(row.orderID),
            orderLineID: row.orderLineID,
            orderID: row.orderID,
            docIStatus: row.docIStatus,
            docIStatusText: row.docIStatusText,
            quotationID: row.quotationID,
            quotationLineID: row.quotationLineID,
            fgItemID: value,
          };

          row.fgItemCode = opt?.Item_Code || "";
          row.fgItemDescription = opt?.Item_Description || "";
          row.itemUnit = opt?.Item_Unit || "";
          row.quotationLineID =
            opt?.quotation_line_id ?? opt?.Quotation_Line_ID ?? 0;
          // GST percentages come straight from the selected FG item's master
          // data — they are NOT computed or user-editable here. The
          // corresponding *Amount fields are left at 0; those are
          // calculated server-side from these percentages on save, and get
          // their real values back only once the order is (re)fetched.
          row.igstPercent = Number(opt?.IGST_Percentage) || 0;
          row.sgstPercent = Number(opt?.SGST_Percentage) || 0;
          row.cgstPercent = Number(opt?.CGST_Percentage) || 0;
        }

        if (field === "quotationID") {
          row.quotationID = value || null;
          row.quotationLineID = null;
          row.fgItemID = "";
          row.fgItemCode = "";
          row.fgItemDescription = "";
          row.itemUnit = "";
          row.customerItemCode = "";
          row.qtyOrdered = "";
          row.unitRate = "";
          row.discountPercent = 0;
          row.orderAmount = 0;
          row.convertedAmount = 0;
          row.igstPercent = 0;
          row.igstAmount = 0;
          row.sgstPercent = 0;
          row.sgstAmount = 0;
          row.cgstPercent = 0;
          row.cgstAmount = 0;
          fetchFgItemsForRow(currentFormValues?.customerID, row.quotationID);
        }

        if (
          [
            "qtyOrdered",
            "unitRate",
            "discountPercent",
            "currencyRate",
          ].includes(field)
        ) {
          const valStr = String(value);
          const isWholeUnitQty =
            field === "qtyOrdered" &&
            String(row.itemUnit || "")
              .trim()
              .toUpperCase() === "NOS";
          const pattern = isWholeUnitQty
            ? /^\d{0,12}$/
            : /^\d{0,12}(\.\d{0,4})?$/;
          if (valStr !== "" && !pattern.test(valStr)) return;
          Object.assign(row, { [field]: value });
          row.orderAmount = computeLineAmount(row);
          row.convertedAmount = computeConvertedAmount(row);
          // igstAmount/sgstAmount/cgstAmount are intentionally not
          // recomputed here — the backend derives them from igstPercent/
          // sgstPercent/cgstPercent + orderAmount on save.
        }

        if (field === "deliveryDate" || field === "deliveryTerms") {
          Object.assign(row, { [field]: value });
        }

        updated[rowIndex] = row;
        detailRowsRef.current = updated;
        setDetailRows(updated);
        recalcTotals(updated);
        validateDetailField(rowIndex, field, value);
      },
      [
        fgItemOptionsByKey,
        currentFormValues?.customerID,
        fetchFgItemsForRow,
        validateDetailField,
        showToast,
      ],
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

      const newRow = createEmptyDetailRow(currentFormValues.orderID);
      const next = [...detailRowsRef.current, newRow];
      detailRowsRef.current = next;
      setDetailRows((prev) => {
        newRowIndexRef.current = prev.length;
        setActiveRowIndex(prev.length);
        activeRowIndexRef.current = prev.length;
        return next;
      });

      // No fetch needed here — a new row always starts with no Quotation
      // selected, and the customer-only ("no quotation") FG Item list is
      // already fetched once, up front, in handleCustomerChange when the
      // customer was picked. Every row that stays quotation-less shares
      // that same cached list.

      if (onValuesChange)
        onValuesChange({ ...currentFormValues, orderDetail: next });
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
          onValuesChange({ ...currentFormValues, orderDetail: updated });
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
          onValuesChange({ ...values, orderDetail: detailRowsRef.current });
      },
      [onValuesChange, onFormValuesChange],
    );

    const fetchOrderCustomersPaged = async ({ page, pageSize, searchText }) => {
      const res = await fetchOrderCustomers({
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

    const handleCustomerChange = useCallback(
      (option, handleChange) => {
        const newCustomerId = option?.value ?? "";
        const raw = option?.raw || {};

        const setField = (name, value) =>
          handleChange({ target: { name, value } });
        setField("customerID", newCustomerId);
        setField("customerName", option?.label ?? "");

        // API returns a single primary address per customer — no distinct
        // billing/shipping fields — so both are seeded from the same source.
        setField(
          "customerBillingAddressLine1",
          raw.customer_primary_address_line1 ?? "",
        );
        setField(
          "customerBillingAddressLine2",
          raw.customer_primary_address_line2 ?? "",
        );
        setField("customerBillingPinCode", raw.customer_pin_code ?? "");

        setField(
          "customerShippingAddressLine1",
          raw.customer_primary_address_line1 ?? "",
        );
        setField(
          "customerShippingAddressLine2",
          raw.customer_primary_address_line2 ?? "",
        );
        setField("customerShippingPinCode", raw.customer_pin_code ?? "");

        const isExport = isExportType(raw.customer_supply_text);
        setIsExportCustomer(isExport);

        // Domestic customer → Currency is locked to INR. Done here (rather
        // than in the default-currency effect, which is create-only and only
        // fills an empty currency) so switching from an export customer
        // back to a domestic one resets it.
        if (!isExport && inrCurrencyOption) {
          setField("currencyID", inrCurrencyOption.value);
          setField("currencyCode", inrCurrencyOption.label);
        }

        // ── Customer-change guard: clear item rows if customer changed —
        // same treatment Quotation gives its detail rows on customer switch.
        const prevCustomerId = prevCustomerIdRef.current;
        const customerChanged =
          prevCustomerId !== null &&
          String(newCustomerId) !== String(prevCustomerId);

        if (customerChanged && detailRowsRef.current.length > 0) {
          const clearedRows = detailRowsRef.current.map((row) => ({
            ...row,
            // Quotation linkage is customer-scoped too, so it can't carry
            // over to a different customer.
            quotationID: null,
            quotationLineID: null,
            fgItemID: "",
            fgItemCode: "",
            fgItemDescription: "",
            itemUnit: "",
            customerItemCode: "",
            orderAmount: 0,
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
          validatedFormRef.current?.setFieldValue("orderAmount", 0);

          // Force the Quotation and FG Items dropdowns to refetch for the
          // new customer instead of showing stale options from the
          // previous one.
          quotationsFetchedForCustomerRef.current = null;
          setQuotationOptions([]);
          fgItemFetchInFlightRef.current = new Set();
          setFgItemOptionsByKey({});
          prefetchedRowKeysRef.current = new Set();
        }

        prevCustomerIdRef.current = newCustomerId;

        // Fetch the customer-only ("no quotation") FG Item list once, right
        // when the customer is picked — every row that doesn't select a
        // Quotation shares this cached list, so individual rows/onMenuOpen
        // never need to trigger it themselves in the common case.
        if (newCustomerId) {
          fetchFgItemsForRow(newCustomerId, null);
        }
      },
      [fetchFgItemsForRow, inrCurrencyOption],
    );

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (values) => {
      const headerValid = validatedFormRef.current?.isValid?.() !== false;
      const detailsValid = validateAllDetails();

      if (detailRows.length === 0) {
        showToast("Please add at least one item to the order", "error");
        return;
      }
      if (!headerValid || !detailsValid) return;

      setSubmitting(true);
      try {
        const oId = Number(values.orderID) || 0;

        const payload = {
          pageSize: 0,
          pageNumber: 0,
          orderID: oId,
          orderNumber: values.orderNo || "",
          orderAmount: Number(values.orderAmount) || 0,
          customerID: Number(values.customerID) || 0,
          customerPurchaseOrderReference: values.customerPoRef || "",
          customerPurchaseOrderDate: values.customerPoDate
            ? `${values.customerPoDate}T00:00:00.000`
            : "",
          customerBillingAddressLine1: values.customerBillingAddressLine1 || "",
          customerBillingAddressLine2: values.customerBillingAddressLine2 || "",
          customerBillingPinCode: values.customerBillingPinCode || "",
          customerShippingAddressLine1:
            values.customerShippingAddressLine1 || "",
          customerShippingAddressLine2:
            values.customerShippingAddressLine2 || "",
          customerShippingPinCode: values.customerShippingPinCode || "",
          priceScope: values.priceScope || "",
          currencyID: Number(values.currencyID) || 0,
          kindAttentionName: values.kindAttnName || "",
          contactNumber: values.contactNo || "",
          orderNotes: values.orderNotes || "",
          documentStatus: oId > 0 ? DOC_STATUS.AMENDMENT : DOC_STATUS.NEW,
          documentDeliveryMode: values.documentDeliveryMode || "",
          transportMode: values.transportMode || "",
          paymentTerms: values.paymentTerms || "",
          freightTerms: values.freightTerms || "",
          insuranceTerms: values.insuranceTerms || "",
          preparedBy: values.prepBy || getPreparedBy(),
          updatedBy: getPreparedBy(),
          approvedBy: values.approvedBy || "",
          totalIgstAmount: Math.round(Number(values.totalIgstAmt) || 0),
          totalCgstAmount: Math.round(Number(values.totalCgstAmt) || 0),
          totalSgstAmount: Math.round(Number(values.totalSgstAmt) || 0),
          paramType: oId > 0 ? PARAM_TYPE.EDIT : PARAM_TYPE.ADD,
          orderDetail: detailRows.map((d) => ({
            orderLineID: Number(d.orderLineID) || 0,
            orderID: oId,
            // was: documentStatus — API expects documentIStatus
            documentIStatus: oId > 0 ? DOC_STATUS.AMENDMENT : DOC_STATUS.NEW,
            fgItemID: Number(d.fgItemID) || 0,
            quotationID: d.quotationID ? Number(d.quotationID) : 0,
            quotationLineID: d.quotationLineID ? Number(d.quotationLineID) : 0,
            customerItemCode: d.customerItemCode || "",
            quantityOrdered: Number(d.qtyOrdered) || 0,
            unitRate: Number(d.unitRate) || 0,
            // was: discountPercent — API expects discountPercentage
            discountPercentage: Number(d.discountPercent) || 0,
            deliveryTerms: d.deliveryTerms || "",
            deliveryDate: d.deliveryDate
              ? `${d.deliveryDate}T00:00:00.000`
              : "",
            orderINotes: d.orderInotes || "",
            currencyRate: Number(d.currencyRate) || 1,
            igstPercentage: Number(d.igstPercent) || 0,
            sgstPercentage: Number(d.sgstPercent) || 0,
            cgstPercentage: Number(d.cgstPercent) || 0,
            // New: these were never sent before.
            igstAmount: Number(d.igstAmount) || 0,
            cgstAmount: Number(d.cgstAmount) || 0,
            sgstAmount: Number(d.sgstAmount) || 0,
            // New: line total — mirrors what computeLineAmount stores in row.orderAmount.
            netAmount: Number(d.orderAmount) || 0,
            updatedBy: getPreparedBy(),
          })),
        };

        const response = await saveAndUpdateOrderHeader(payload);

        if (response?.Status === SUCCESS_STATUS) {
          clearDraft();
          const headerResp = response?.data?.ORDER_RESPONSE?.[0] || {};
          const generatedId = headerResp.order_id || headerResp.orderID || oId;

          if (generatedId > 0) {
            const detail = await fetchOrderHeaderDetails({
              orderID: Number(generatedId),
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
            headerResp.Message || "Order saved successfully",
            "success",
          );
        } else {
          const msg =
            response?.data?.ORDER_RESPONSE?.[0]?.Message ||
            response?.message ||
            "Failed to save Order.";
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
    const detailColumns = buildOrderDetailColumns(isExportCustomer);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
      <>
        <style>{ORDER_FORM_STYLES}</style>

        <FullPageLoader
          loading={submitting}
          message="Saving Order..."
          logoSrc={inspireLogo}
        />
        {loadingDetails && <Loader />}

        <div
          className="save-update-order pb-4 h-100 d-flex flex-column"
          style={{ width: "100%", margin: "0 auto" }}
        >
          {(submitting || loadingDetails) && <Loader />}

          <ValidatedForm
            key={fetchedData ? `fetched-${fetchedData.orderID}` : "initial"}
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
                      label="Order No"
                      name="orderNo"
                      value={values.orderNo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Order Date"
                      name="orderDate"
                      type="date"
                      value={values.orderDate}
                      onBlur={handleBlur}
                      error={errors.orderDate}
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

                {/* Row 2 - Customer, Customer PO Ref, Customer PO Date, Currency.
                    Quotation used to live here; it's now per-line in the Item
                    Details table below (right after S.No), since a single
                    order can draw items from more than one Quotation. */}
                <div className="row mb-3">
                  <div className="col-12 col-md-4">
                    <PaginatedSearchSelect
                      label="Customer"
                      name="customerID"
                      value={values.customerID}
                      inputLabel={values.customerName}
                      fetchPage={fetchOrderCustomersPaged}
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
                      label="Customer PO Ref"
                      name="customerPoRef"
                      value={values.customerPoRef}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Customer PO Date"
                      name="customerPoDate"
                      type="date"
                      value={values.customerPoDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      min={minPastDateString}
                    />
                  </div>
                  <div className="col-12 col-md-2">
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
                </div>

                {/* Row 3 - Billing Address */}
                <div className="row mb-3">
                  <div className="col-12 col-md-4">
                    <FormField
                      label="Billing Address Line 1"
                      name="customerBillingAddressLine1"
                      value={values.customerBillingAddressLine1}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.customerBillingAddressLine1}
                      disabled={isDisabled}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <FormField
                      label="Billing Address Line 2"
                      name="customerBillingAddressLine2"
                      value={values.customerBillingAddressLine2}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <FormField
                      label="Billing Pin Code"
                      name="customerBillingPinCode"
                      value={values.customerBillingPinCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.customerBillingPinCode}
                      disabled={isDisabled}
                      required
                    />
                  </div>
                </div>

                {/* Row 4 - Shipping Address */}
                <div className="row mb-3">
                  <div className="col-12 col-md-4">
                    <FormField
                      label="Shipping Address Line 1"
                      name="customerShippingAddressLine1"
                      value={values.customerShippingAddressLine1}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      error={errors.customerShippingAddressLine1}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <FormField
                      label="Shipping Address Line 2"
                      name="customerShippingAddressLine2"
                      value={values.customerShippingAddressLine2}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <FormField
                      label="Shipping Pin Code"
                      name="customerShippingPinCode"
                      value={values.customerShippingPinCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.customerShippingPinCode}
                      disabled={isDisabled}
                      required
                    />
                  </div>
                </div>

                {/* Row 5 - Price Scope, Document Delivery Mode, Transport Mode, Payment Terms */}
                <div className="row mb-3">
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
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Payment Terms"
                      name="paymentTerms"
                      value={values.paymentTerms}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {/* Row 6 - Freight Terms, Insurance Terms */}
                <div className="row mb-3">
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
                  <div className="col-12 col-md-6">
                    <FormField
                      label="Insurance Terms"
                      name="insuranceTerms"
                      value={values.insuranceTerms}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {/* ── Detail Table ── */}
                <div className="card order-detail-card">
                  <div className="card-header o-details-header">
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
                      <div className="o-details-table-responsive">
                        <table
                          className="table table-vcenter o-details-table"
                          style={{ minWidth: "1200px", width: "100%" }}
                        >
                          <thead className="o-details-thead">
                            <tr>
                              {detailColumns.map((col) => (
                                <th
                                  key={col.key}
                                  className={`o-details-th${col.key === "actions" ? " o-details-th-actions" : ""}`}
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
                                    className="o-details-td o-details-td-actions"
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
                                          (isCreate || !row.orderLineID)
                                        )
                                      }
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        background: "transparent",
                                        color:
                                          !isDisabled &&
                                          canModifyDetails &&
                                          (isCreate || !row.orderLineID)
                                            ? "rgb(22,119,255)"
                                            : "#cccccc",
                                        border: "none",
                                        cursor:
                                          !isDisabled &&
                                          canModifyDetails &&
                                          (isCreate || !row.orderLineID)
                                            ? "pointer"
                                            : "not-allowed",
                                      }}
                                      title={
                                        isDisabled
                                          ? "Cannot delete in view mode"
                                          : isCreate || !row.orderLineID
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
                                  <td className="o-details-td text-center">
                                    {idx + 1}
                                  </td>
                                  {/* Quotation — optional, scoped to the selected customer */}
                                  <td className="o-details-td">
                                    <ReactSelectField
                                      name={`quotationID_${idx}`}
                                      hideLabel
                                      options={(() => {
                                        const exists = quotationOptions.some(
                                          (o) =>
                                            String(o.value) ===
                                            String(row.quotationID),
                                        );
                                        if (exists || !row.quotationID)
                                          return quotationOptions;
                                        // Preserve a previously-saved
                                        // quotation reference even if it
                                        // isn't in the currently-fetched
                                        // list (e.g. list still loading).
                                        return [
                                          ...quotationOptions,
                                          {
                                            value: row.quotationID,
                                            label: String(row.quotationID),
                                          },
                                        ];
                                      })()}
                                      value={row.quotationID ?? ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "quotationID",
                                          e?.target?.value ?? "",
                                        )
                                      }
                                      placeholder="Select Quotation"
                                      isDisabled={isDisabled}
                                    />
                                  </td>
                                  {/* FG Item */}
                                  <td className="o-details-td">
                                    <ReactSelectField
                                      name={`fgItemID_${idx}`}
                                      hideLabel
                                      options={(() => {
                                        const key = buildFgItemKey(
                                          currentFormValues?.customerID,
                                          row.quotationID,
                                        );
                                        const rowFgItemOptions =
                                          fgItemOptionsByKey[key] || [];
                                        const exists = rowFgItemOptions.some(
                                          (o) =>
                                            String(o.value) ===
                                            String(row.fgItemID),
                                        );
                                        if (
                                          exists ||
                                          !row.fgItemID ||
                                          !row.fgItemCode
                                        )
                                          return rowFgItemOptions;
                                        // Preserve a previously-saved FG Item
                                        // even if it isn't in this row's
                                        // current (customer+quotation)
                                        // options list yet.
                                        return [
                                          ...rowFgItemOptions,
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
                                      onMenuOpen={() => {
                                        // Cheap synchronous fallback: only
                                        // reaches fetchFgItemsForRow (and its
                                        // async work) if this row's key isn't
                                        // already cached or in flight. In the
                                        // common case (prefetched on row
                                        // add / quotation change / initial
                                        // edit-mode load below) this is a
                                        // no-op every time the menu is
                                        // reopened. onMenuOpen (not onFocus)
                                        // is used deliberately — it fires
                                        // exactly when the dropdown actually
                                        // opens (click, arrow-key, or
                                        // type-to-search), whereas onFocus
                                        // can fire without opening the menu
                                        // at all (e.g. tabbing through
                                        // fields) since react-select's
                                        // openMenuOnFocus defaults to false.
                                        const key = buildFgItemKey(
                                          currentFormValues?.customerID,
                                          row.quotationID,
                                        );
                                        if (
                                          fgItemOptionsByKey[key] ||
                                          fgItemFetchInFlightRef.current.has(
                                            key,
                                          )
                                        )
                                          return;
                                        fetchFgItemsForRow(
                                          currentFormValues?.customerID,
                                          row.quotationID,
                                        );
                                      }}
                                      error={detailErrors[idx]?.fgItemID}
                                      isSearchable
                                      placeholder="Select FG Item"
                                      isDisabled={isDisabled}
                                    />
                                  </td>
                                  {/* Customer Item Code */}
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input"
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
                                  {/* Qty Ordered */}
                                  <td className="o-details-td">
                                    <input
                                      className={`form-control form-control-sm o-details-input text-right${detailErrors[idx]?.qtyOrdered ? " is-invalid" : ""}`}
                                      type="text"
                                      value={row.qtyOrdered ?? ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "qtyOrdered",
                                          e.target.value,
                                        )
                                      }
                                      onFocus={(e) =>
                                        setTimeout(() => e.target.select(), 0)
                                      }
                                      disabled={isDisabled}
                                    />
                                    {detailErrors[idx]?.qtyOrdered && (
                                      <span className="o-details-error">
                                        {detailErrors[idx].qtyOrdered}
                                      </span>
                                    )}
                                  </td>
                                  {/* Unit Rate */}
                                  <td className="o-details-td">
                                    <input
                                      className={`form-control form-control-sm o-details-input text-right${detailErrors[idx]?.unitRate ? " is-invalid" : ""}`}
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
                                      <span className="o-details-error">
                                        {detailErrors[idx].unitRate}
                                      </span>
                                    )}
                                  </td>
                                  {/* Discount % */}
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input text-right"
                                      type="text"
                                      value={row.discountPercent ?? 0}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "discountPercent",
                                          e.target.value,
                                        )
                                      }
                                      onFocus={(e) =>
                                        setTimeout(() => e.target.select(), 0)
                                      }
                                      disabled={isDisabled}
                                    />
                                  </td>
                                  {/* Amount (computed) */}
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.orderAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                  {/* Currency Rate — Export customers only */}
                                  {isExportCustomer && (
                                    <td className="o-details-td">
                                      <input
                                        className="form-control form-control-sm o-details-input text-right"
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
                                  {/* Converted Amount (computed) — Export customers only */}
                                  {isExportCustomer && (
                                    <td className="o-details-td">
                                      <input
                                        className="form-control form-control-sm o-details-input text-right"
                                        type="text"
                                        value={Number(
                                          row.convertedAmount || 0,
                                        ).toFixed(2)}
                                        disabled
                                      />
                                    </td>
                                  )}
                                  {/* Delivery Date — required (NOT NULL on order_detail) */}
                                  <td className="o-details-td">
                                    <input
                                      className={`form-control form-control-sm o-details-input${detailErrors[idx]?.deliveryDate ? " is-invalid" : ""}`}
                                      type="date"
                                      value={row.deliveryDate || ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "deliveryDate",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isDisabled}
                                    />
                                    {detailErrors[idx]?.deliveryDate && (
                                      <span className="o-details-error">
                                        {detailErrors[idx].deliveryDate}
                                      </span>
                                    )}
                                  </td>
                                  {/* Delivery Terms */}
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input"
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
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input"
                                      type="text"
                                      value={row.orderInotes || ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "orderInotes",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isDisabled}
                                      placeholder="Notes"
                                    />
                                  </td>
                                  {/* IGST % */}
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input text-right"
                                      type="text"
                                      value={row.igstPercent ?? 0}
                                      disabled
                                    />
                                  </td>
                                  {/* SGST % */}
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input text-right"
                                      type="text"
                                      value={row.sgstPercent ?? 0}
                                      disabled
                                    />
                                  </td>
                                  {/* CGST % */}
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input text-right"
                                      type="text"
                                      value={row.cgstPercent ?? 0}
                                      disabled
                                    />
                                  </td>
                                  {/* IGST Amount — server-computed, only populated after save + reload */}
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.igstAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                  {/* SGST Amount — server-computed, only populated after save + reload */}
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.sgstAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                  {/* CGST Amount — server-computed, only populated after save + reload */}
                                  <td className="o-details-td">
                                    <input
                                      className="form-control form-control-sm o-details-input text-right"
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
                                  {/* Actions + S.No + Quotation */}
                                  <td
                                    className="o-details-td"
                                    colSpan={3}
                                    style={{ borderRight: "1px solid #e2e8f0" }}
                                  ></td>

                                  {/* Description — directly under FG Item column */}
                                  <td
                                    className="o-details-td"
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

                                  {/* Customer Item Code + Qty Ordered — skipped */}
                                  <td className="o-details-td" colSpan={1}></td>

                                  {/* Unit — directly under Unit Rate column */}
                                  <td
                                    className="o-details-td"
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

                                  {/* Everything after Unit Rate: Discount %, Amount,
                                      [Currency Rate, Converted Amount], Delivery Date,
                                      Delivery Terms, Notes, IGST/SGST/CGST %,
                                      IGST/SGST/CGST Amount */}
                                  <td
                                    className="o-details-td"
                                    colSpan={detailColumns.length - 6}
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

                {/* Row - Total IGST / CGST / SGST — sourced from header state, same
    pattern as Quotation's totals row. */}
                <div className="row mt-2 mb-2">
                  <div className="row col-4">
                    <div className="col-4 col-md-8">
                      <TextAreaFormField
                        label="Order Notes"
                        name="orderNotes"
                        value={values.orderNotes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isDisabled}
                        rows={2}
                      />
                    </div>
                    <div className="col-4 col-md-4">
                      <FormField
                        label="Document Status"
                        name="docStatusText"
                        value={values.docStatusText}
                        disabled
                      />
                    </div>
                  </div>
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

                  <div className="col-12 col-md-2">
                    <FormField
                      label="Order Amount"
                      name="orderAmount"
                      value={values.orderAmount || 0}
                      style={{ textAlign: "right", width: "100%" }}
                      disabled
                    />
                  </div>
                </div>

                {/* Row - Prepared / Updated / Approved */}
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

SaveOrUpdateOrder.displayName = "SaveOrUpdateOrder";
export default SaveOrUpdateOrder;
