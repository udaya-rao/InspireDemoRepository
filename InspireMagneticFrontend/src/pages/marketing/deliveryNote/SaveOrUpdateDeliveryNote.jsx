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
  ReactSelectField,
  EditableSelectField,
} from "../../../components/FormElement";
import ValidatedForm from "../../../components/ValidatedForm";
import useDirtyDraftDrawer from "../../../hooks/useDirtyDraftDrawer";
import { useToast } from "../../../components/useToast";
import Loader from "../../../components/Loader";
import { getPreparedBy } from "../../../utils/userSession";
import { ERROR_STATUS, SUCCESS_STATUS } from "../../../utils/ConstVariables";
import { CustomValidateField } from "../../../utils/CustomValidation.js";
import {
  saveAndUpdateDeliveryNoteHeader,
  fetchDeliveryNoteHeaderDetails,
  fetchDeliveryNoteOrders,
  fetchDeliveryNoteOrderLines,
  fetchDeliveryNoteStateCodes,
  getCustomerMasterListInDeliveryNote,
} from "../../../services/deliveryNoteService";
import { fetchOrderCurrencies } from "../../../services/orderService";
import {
  DOC_STATUS,
  PARAM_TYPE,
  DRAFT_KEY,
  minPastDateString,
  initialForm,
  DELIVERY_NOTE_FORM_STYLES,
  BASE_DETAIL_COLUMNS_HEAD,
  EXPORT_ONLY_DETAIL_COLUMNS,
  BASE_DETAIL_COLUMNS_TAIL,
  TAX_DETAIL_COLUMNS,
  NEW_RECORD_STATUS_TEXT,
  CUSTOMER_TYPE,
  TRANSACTION_TYPE_OPTIONS,
  today,
} from "../../../utils/constants/DeliveryNoteConstants";
import { PaginatedSearchSelect } from "../../../components/PaginatedSearchSelect";
import inspireLogo from "../../../assets/logo/IM_Icon-new.png";
import FullPageLoader from "../../../components/FullPageLoader";
import { DeleteConfirmDialog } from "../../../components/Notification";

// ─────────────────────────────────────────────────────────────────────────────
// Module-level helpers
// ─────────────────────────────────────────────────────────────────────────────

const isExportType = (type) =>
  String(type || "")
    .trim()
    .toLowerCase() === CUSTOMER_TYPE.EXPORT;

// Same pincode rule as the Customer Master screen. Empty values are left to
// the `required` rule, so this only reports a message for a filled-in,
// invalid pincode.
const validatePincode = (value) => {
  if (!value || String(value).trim() === "") return "";
  return (
    CustomValidateField("Pincode", value, "Enter The Valid Pincode.") || ""
  );
};

// FG product lists are cached per key. A row with no Order selected shares
// the single "all" list (every FG product, no arguments sent to the API);
// a row with an Order gets its own (customer, order) list.
const ALL_ITEMS_KEY = "all";
const buildOrderLineKey = (customerID, orderID) =>
  orderID ? `${customerID || 0}::${orderID}` : ALL_ITEMS_KEY;

// Maps one DELIVERY_NOTE_DETAILS_RESPONSE row (snake_case, API shape,
// ASSUMED to mirror ORDER_DETAILS_RESPONSE naming) into the camelCase row
// shape this form's Item Details table works with.
const mapDeliveryNoteDetailFromApi = (d, deliveryNoteId) => ({
  deliveryNoteLineID: d.delivery_note_line_id || 0,
  deliveryNoteID: d.delivery_note_id || deliveryNoteId,
  docIStatus: d.doc_istatus || 0,
  docIStatusText: d.doc_istatus_text || NEW_RECORD_STATUS_TEXT,
  fgItemID: d.fg_item_id || 0,
  fgItemCode: d.item_code || "",
  fgItemDescription: d.item_description || "",
  itemUnit: d.item_unit || "",
  // Linkage back to the Order line this row ships against. Optional, same
  // as Order's Quotation linkage: order_id / order_line_id are NULLable in
  // delivery_note_detail, so both are null for a manually-entered line.
  orderID: d.order_id || null,
  orderLineID: Number(d.order_line_id) || null,
  orderNo: d.order_no || "",
  customerItemCode: d.customer_item_code || "",
  hsnCode: d.hsn_code || "",
  qtyShipped: d.qty_shipped || 0,
  unitRate: d.unit_rate || 0,
  deliveryNoteAmount: d.delivery_note_amount || 0,
  netAmt: d.net_amt || 0,
  deliveryNoteInotes: d.delivery_note_inotes || "",
  currencyRate: d.currency_rate ?? 1,
  convertedAmount: d.converted_amount || 0,
  // GST — percentages come from the FG item master (or the order line when
  // linked); amounts are server-computed and only populated after
  // save + reload, same treatment Order/Quotation give theirs.
  igstPercent: d.igst_perc ?? 0,
  igstAmount: d.igst_amt ?? 0,
  sgstPercent: d.sgst_perc ?? 0,
  sgstAmount: d.sgst_amt ?? 0,
  cgstPercent: d.cgst_perc ?? 0,
  cgstAmount: d.cgst_amt ?? 0,
  updateBy: d.update_by || "",
  updateDate: d.update_date || "",
});

// A brand-new, blank detail row.
const createEmptyDetailRow = (deliveryNoteID = 0) => ({
  deliveryNoteLineID: 0,
  deliveryNoteID: deliveryNoteID || 0,
  docIStatus: 0,
  docIStatusText: NEW_RECORD_STATUS_TEXT,
  fgItemID: "",
  fgItemCode: "",
  fgItemDescription: "",
  itemUnit: "",
  orderID: null,
  orderLineID: null,
  orderNo: "",
  customerItemCode: "",
  hsnCode: "",
  qtyShipped: "",
  unitRate: "",
  deliveryNoteAmount: 0,
  netAmt: 0,
  deliveryNoteInotes: "",
  currencyRate: 1,
  convertedAmount: 0,
  igstPercent: 0,
  igstAmount: 0,
  sgstPercent: 0,
  sgstAmount: 0,
  cgstPercent: 0,
  cgstAmount: 0,
});

// The sub-row colSpans in the render depend on the column order in
// DeliveryNoteConstants: the first 7 columns (Actions … Qty Shipped) are
// fixed, the rest is `length - 7`.
const buildDeliveryNoteDetailColumns = (isExportCustomer) => [
  ...BASE_DETAIL_COLUMNS_HEAD,
  ...(isExportCustomer ? EXPORT_ONLY_DETAIL_COLUMNS : []),
  ...BASE_DETAIL_COLUMNS_TAIL,
  ...TAX_DETAIL_COLUMNS,
];

// Builds the form's `initialValues` from either the freshly-fetched header
// (fetchedData) or the row passed in from the list page (initialData).
//
// NOTE: this intentionally does NOT depend on the async currency list.
// Baking the INR default in here made `initialValues` change identity when
// the currency list arrived, which re-synced the form and wiped detail rows
// on slow connections. The INR default for NEW notes is applied by a
// dedicated effect in the component instead (same as the Order screen).
const buildDeliveryNoteInitialValues = (src, baseForm) => {
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
      deliveryNoteID: src.delivery_note_id || 0,
      deliveryNoteNo: src.delivery_note_no || "0",
      deliveryNoteDate: src.delivery_note_date
        ? src.delivery_note_date.split("T")[0]
        : today,
      customerID: src.customer_id ?? "",
      customerName: src.customer_name || "",
      customerBillingAddressLine1: src.customer_billing_address_line1 || "",
      customerBillingAddressLine2: src.customer_billing_address_line2 || "",
      customerBillingPinCode: src.customer_billing_pin_code || "",
      customerShippingAddressLine1: src.customer_shipping_address_line1 || "",
      customerShippingAddressLine2: src.customer_shipping_address_line2 || "",
      customerShippingPinCode: src.customer_shipping_pin_code || "",
      vehicleNumber: src.vehicle_number || "",
      ewayBillNumber: src.eway_bill_number || "",
      gstStateCode: src.gst_state_code || "",
      gstStateCodeText: src.gst_state_code_text || src.gst_state_code || "",
      ewayBillDate: src.eway_bill_date ? src.eway_bill_date.split("T")[0] : "",
      ewayBillUrl: src.eway_bill_url || "",
      ewayBillValidUpto: src.eway_bill_valid_upto
        ? src.eway_bill_valid_upto.split("T")[0]
        : "",
      shipmentDistanceKm: src.shipment_distance_km ?? "",
      billToGstinNumber: src.bill_to_gstin_number || "",
      transporterName: src.transporter_name || "",
      transporterGstinNumber: src.transporter_gstin_number || "",
      shipToTradeName: src.ship_to_trade_name || "",
      shipToGstinNumber: src.ship_to_gstin_number || "",
      transactionType: src.transaction_type || "",
      currencyID: src.currency_id ?? "",
      currencyCode: src.currency_code || "",
      kindAttnName: src.kind_attn_name || "",
      contactNo: src.contact_no || "",
      docStatus: src.doc_status ?? 0,
      docStatusText: src.doc_status_text || NEW_RECORD_STATUS_TEXT,
      prepBy: src.prep_by || getPreparedBy(),
      prepDate: src.prep_date ? src.prep_date.split("T")[0] : today,
      updateBy: src.update_by || "",
      updateDate: src.update_date ? src.update_date.split("T")[0] : "",
      approvedBy: src.approved_by || "",
      approvedDate: src.approved_date ? src.approved_date.split("T")[0] : "",
      deliveryNoteAmount: src.delivery_note_amount ?? 0,
      totalNetAmt: src.total_net_amt,
      totalIgstAmt: src.total_igst_amt,
      totalCgstAmt: src.total_cgst_amt,
      totalSgstAmt: src.total_sgst_amt,
    };
  }

  // NEW delivery note: Prepared By / Prepared Date are stamped here, at call
  // time, rather than relying on the value baked into `initialForm` when the
  // constants module was first loaded (which can be blank before the session
  // user is available).
  const newNoteDefaults = {
    prepBy: getPreparedBy(),
    prepDate: today,
  };

  if (src && src.isPreFilled) {
    return { ...baseForm, ...totalDefaults, ...newNoteDefaults };
  }

  const raw = localStorage.getItem(DRAFT_KEY);
  if (raw) {
    const draft = JSON.parse(raw);
    return {
      ...baseForm,
      ...totalDefaults,
      ...newNoteDefaults,
      ...draft,
      // A draft saved with a blank value shouldn't override the default.
      prepBy: draft.prepBy || newNoteDefaults.prepBy,
      prepDate: draft.prepDate || newNoteDefaults.prepDate,
    };
  }

  return { ...baseForm, ...totalDefaults, ...newNoteDefaults };
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const SaveOrUpdateDeliveryNote = forwardRef(
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
    const [stateCodeOptions, setStateCodeOptions] = useState([]);
    const [orderOptions, setOrderOptions] = useState([]);

    // FG Items ("order line" choices) are cached per key:
    //   - "all"               → every FG product (no Order selected on the row;
    //                           fetched once on mount with no arguments and
    //                           shared by every order-less row)
    //   - "customerID::order" → that Order's products (fetched when an Order
    //                           is picked, once for pre-populated rows in
    //                           edit/view mode, or as a last-resort fallback
    //                           when the FG Item dropdown's menu is opened).
    const [orderLinesByKey, setOrderLinesByKey] = useState({});
    const orderLinesFetchInFlightRef = useRef(new Set());

    // Each key is prefetched at most once for rows that arrive pre-populated
    // (edit/view mode).
    const prefetchedRowKeysRef = useRef(new Set());

    const fetchOrderLinesForRow = useCallback(
      async (customerID, orderID) => {
        // An order-linked list needs the customer; the "all" list needs nothing.
        if (orderID && !customerID) return;
        const key = buildOrderLineKey(customerID, orderID);
        if (orderLinesByKey[key] || orderLinesFetchInFlightRef.current.has(key))
          return;
        orderLinesFetchInFlightRef.current.add(key);
        try {
          const list = orderID
            ? await fetchDeliveryNoteOrderLines(orderID, customerID)
            : await fetchDeliveryNoteOrderLines(); // no args → all FG products
          if (Array.isArray(list)) {
            setOrderLinesByKey((prev) => ({
              ...prev,
              [key]: list.map((o) => ({
                ...o,
                value: o.fg_item_id ?? "",
                label: o.Item_Code || "",
              })),
            }));
          }
        } catch (error) {
          console.error("Error fetching Order line items:", error);
        } finally {
          orderLinesFetchInFlightRef.current.delete(key);
        }
      },
      [orderLinesByKey],
    );

    // Export/domestic customer tracking — drives whether Currency is editable
    const [isExportCustomer, setIsExportCustomer] = useState(false);

    const ordersFetchedForCustomerRef = useRef(null);

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
          const data = await fetchDeliveryNoteStateCodes();
          if (Array.isArray(data)) {
            setStateCodeOptions(
              data.map((i) => ({ value: i.ValueText, label: i.DisplayText })),
            );
          }
        } catch (error) {
          console.error("Error fetching State Codes:", error);
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
          initialData.delivery_note_id
        ) {
          const dId = initialData.delivery_note_id;
          if (fetchedIdRef.current === dId) return;
          fetchedIdRef.current = dId;
          setLoadingDetails(true);
          try {
            const res = await fetchDeliveryNoteHeaderDetails({
              deliveryNoteID: dId,
            });
            if (res && res.Status === SUCCESS_STATUS && res.data) {
              // ASSUMPTION: response keys DELIVERY_NOTE_HEADER_RESPONSE /
              // DELIVERY_NOTE_DETAILS_RESPONSE, mirroring
              // ORDER_HEADER_RESPONSE / ORDER_DETAILS_RESPONSE naming.
              const h = res.data.DELIVERY_NOTE_HEADER_RESPONSE?.[0] || {};
              const details = res.data.DELIVERY_NOTE_DETAILS_RESPONSE || [];

              const mappedDetails = details.map((d) =>
                mapDeliveryNoteDetailFromApi(d, dId),
              );

              setFetchedData({
                ...h,
                paramType: PARAM_TYPE.EDIT,
                deliveryNoteDetail: mappedDetails,
                gstStateCode: h.gst_state_code || "",
                gstStateCodeText:
                  h.gst_state_code_text || h.gst_state_code || "",
              });

              // Fall back to the list-page row if the header response
              // doesn't carry customer_supply_text, so edit mode doesn't
              // wrongly treat an export note as domestic.
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
            console.error("Error fetching Delivery Note details", e);
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
    // buildDeliveryNoteInitialValues).
    const initialValues = React.useMemo(
      () =>
        buildDeliveryNoteInitialValues(fetchedData || initialData, initialForm),
      [initialData, fetchedData],
    );

    const initialDetails = React.useMemo(
      () =>
        initialValues && Array.isArray(initialValues.deliveryNoteDetail)
          ? initialValues.deliveryNoteDetail
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

    // ── Effects: reset order-linked product caches when the customer is
    // cleared. The shared "all products" list is customer-independent, so it
    // is kept. The in-flight ref is left alone so a pending "all" request
    // isn't orphaned.
    useEffect(() => {
      if (!currentFormValues?.customerID) {
        setOrderLinesByKey((prev) =>
          prev[ALL_ITEMS_KEY] ? { [ALL_ITEMS_KEY]: prev[ALL_ITEMS_KEY] } : {},
        );
        prefetchedRowKeysRef.current = new Set();
      }
    }, [currentFormValues?.customerID]);

    // ── Effects: load the "all FG products" list once on mount ──────────────
    // Shared by every row that has no Order selected, regardless of customer.
    useEffect(() => {
      fetchOrderLinesForRow(null, null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Effects: load Orders once a customer is known ───────────────────────
    // Powers the Item Details table's Order column (per-line, optional
    // linkage back to an Order for that customer).
    useEffect(() => {
      const customerID = currentFormValues?.customerID;

      if (!customerID) {
        ordersFetchedForCustomerRef.current = null;
        setOrderOptions([]);
        return;
      }

      if (ordersFetchedForCustomerRef.current === customerID) return;

      let cancelled = false;
      async function loadOrders() {
        try {
          const data = await fetchDeliveryNoteOrders(customerID);
          if (cancelled) return;
          ordersFetchedForCustomerRef.current = customerID;
          if (Array.isArray(data)) {
            setOrderOptions(
              data.map((o) => ({
                value: o.order_id ?? o.ValueText,
                label: o.order_no ?? o.DisplayText,
              })),
            );
          }
        } catch (error) {
          console.error("Error fetching Orders:", error);
        }
      }
      loadOrders();

      return () => {
        cancelled = true;
      };
    }, [currentFormValues?.customerID]);

    // ── Effects: prefetch FG Items for rows that arrive pre-populated — e.g.
    // rows coming back from fetchDeliveryNoteHeaderDetails in edit mode.
    // Order-less rows use the shared "all" list (no customer needed); rows
    // with an Order need the customer. An Order change is prefetched inline in
    // handleDetailFieldChange — this effect only covers rows arriving
    // pre-populated. Each key is attempted at most once, so this never
    // re-issues a request because an unrelated field changed.
    useEffect(() => {
      const customerID = currentFormValues?.customerID;

      detailRows.forEach((row) => {
        if (row.orderID && !customerID) return;
        const key = buildOrderLineKey(customerID, row.orderID);
        if (prefetchedRowKeysRef.current.has(key)) return;
        prefetchedRowKeysRef.current.add(key);
        fetchOrderLinesForRow(customerID, row.orderID);
      });
    }, [detailRows, currentFormValues?.customerID, fetchOrderLinesForRow]);

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
        JSON.stringify({
          ...latest,
          deliveryNoteDetail: detailRowsRef.current,
        }),
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
    // No discount % on delivery note lines — per the DDL comment on
    // unit_rate, the Order's discount is already baked into unit_rate by
    // the time it's picked here.
    const computeLineAmount = (row) => {
      const qty = Number(row.qtyShipped) || 0;
      const rate = Number(row.unitRate) || 0;
      return parseFloat((qty * rate).toFixed(2));
    };

    const computeConvertedAmount = (row) => {
      const amt = computeLineAmount(row);
      const rate = Number(row.currencyRate) || 1;
      return parseFloat((amt * rate).toFixed(2));
    };

    // Recalculates totalNetAmt as the sum of row amounts — create mode only,
    // same treatment Quotation/Order give their header totals.
    // deliveryNoteAmount (the grand total) is never touched here — it's
    // server-calculated and only updates on the next fetch/save.
    const recalcTotals = (rows) => {
      if (!isCreate) return;

      const total = rows.reduce(
        (s, r) => s + (Number(r.deliveryNoteAmount) || 0),
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

    // Default currency to INR for NEW delivery notes only.
    //
    // This must never touch an existing (edit/view) note: the saved currency
    // from the DB is authoritative. Switching from an export customer back to
    // a domestic one in create mode is handled in handleCustomerChange.
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
        // freshly opened "new delivery note" form doesn't look dirty.
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
    // Note: orderID is intentionally NOT validated per row (validateDetailField
    // / validateAllDetails) — order_id is NULLable in delivery_note_detail.
    const validation = React.useMemo(
      () => ({
        deliveryNoteDate: { required: true, fieldLabel: "Delivery Note Date" },
        customerName: { required: true, fieldLabel: "Customer" },
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
          validator: validatePincode,
        },
        customerShippingPinCode: {
          required: true,
          fieldLabel: "Shipping Pin Code",
          validator: validatePincode,
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
        if (field === "qtyShipped" || field === "unitRate") {
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

      // The same FG item can legitimately ship against two different Orders,
      // so a duplicate is the same (orderID, fgItemID) pair, not just the
      // same item.
      const seenKeys = new Set();
      const duplicateRowIndexes = new Set();
      detailRows.forEach((row, idx) => {
        const id = Number(row.fgItemID) || 0;
        if (!id) return;
        const k = `${Number(row.orderID) || 0}::${id}`;
        if (seenKeys.has(k)) {
          duplicateRowIndexes.add(idx);
        } else {
          seenKeys.add(k);
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
        if (!row.qtyShipped || Number(row.qtyShipped) <= 0) {
          rowErrors.qtyShipped = "Required*";
          valid = false;
        }
        // unit_rate is NOT NULL on delivery_note_detail — required per row
        // (pulled from the order line when linked, typed when not).
        if (!row.unitRate || Number(row.unitRate) <= 0) {
          rowErrors.unitRate = "Required*";
          valid = false;
        }
        // orderID is intentionally not validated here — optional per line.
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

        if (field === "orderID") {
          const selectedOrder = orderOptions.find(
            (o) => String(o.value) === String(value),
          );
          row = {
            ...createEmptyDetailRow(row.deliveryNoteID),
            deliveryNoteLineID: row.deliveryNoteLineID,
            deliveryNoteID: row.deliveryNoteID,
            docIStatus: row.docIStatus,
            docIStatusText: row.docIStatusText,
            orderID: value || null,
            orderNo: selectedOrder?.label || "",
          };
          // Picking an Order fetches that order's products; clearing it falls
          // back to the shared "all products" list (already cached).
          fetchOrderLinesForRow(currentFormValues?.customerID, row.orderID);
        }

        if (field === "fgItemID") {
          const isDuplicate =
            value &&
            detailRowsRef.current.some(
              (r, i) =>
                i !== rowIndex &&
                Number(r.fgItemID) === Number(value) &&
                (Number(r.orderID) || 0) === (Number(row.orderID) || 0),
            );
          if (isDuplicate) {
            showToast(
              "This item is already added to the delivery note for this order",
              "error",
            );
            return;
          }

          const key = buildOrderLineKey(
            currentFormValues?.customerID,
            row.orderID,
          );
          const rowOrderLineOptions = orderLinesByKey[key] || [];
          const opt = rowOrderLineOptions.find(
            (o) => Number(o.fg_item_id) === Number(value),
          );
          const linked = !!row.orderID;

          row = {
            ...createEmptyDetailRow(row.deliveryNoteID),
            deliveryNoteLineID: row.deliveryNoteLineID,
            deliveryNoteID: row.deliveryNoteID,
            docIStatus: row.docIStatus,
            docIStatusText: row.docIStatusText,
            orderID: row.orderID,
            orderNo: row.orderNo,
            orderLineID: linked ? (opt?.order_line_id ?? null) : null,
            fgItemID: value,
            fgItemCode: opt?.Item_Code || "",
            fgItemDescription: opt?.Item_Description || "",
            itemUnit: opt?.Item_Unit || "",
            hsnCode: opt?.HSN_Code ?? opt?.Hsn_Code ?? "",
            // Unit rate is pulled read-only from the Order line when linked
            // (it already reflects the Order's discount % per the DDL
            // comment); for an unlinked line it's typed by the user.
            unitRate: linked ? (opt?.Unit_Rate ?? "") : "",
            // Default qty shipped to the order line's remaining qty if the
            // API provides one, else the originally-ordered qty. Unlinked
            // lines start blank.
            qtyShipped: linked
              ? (opt?.Qty_Remaining ?? opt?.Qty_Ordered ?? "")
              : "",
            // GST percentages come straight from the selected item's master
            // data — not computed or user-editable here. The *Amount fields
            // stay at 0; the server calculates them on save.
            igstPercent: Number(opt?.IGST_Percentage) || 0,
            sgstPercent: Number(opt?.SGST_Percentage) || 0,
            cgstPercent: Number(opt?.CGST_Percentage) || 0,
          };
          row.deliveryNoteAmount = computeLineAmount(row);
          row.convertedAmount = computeConvertedAmount(row);
        }

        if (["qtyShipped", "unitRate", "currencyRate"].includes(field)) {
          const valStr = String(value);
          const isWholeUnitQty =
            field === "qtyShipped" &&
            String(row.itemUnit || "")
              .trim()
              .toUpperCase() === "NOS";
          const pattern = isWholeUnitQty
            ? /^\d{0,12}$/
            : /^\d{0,12}(\.\d{0,4})?$/;
          if (valStr !== "" && !pattern.test(valStr)) return;
          Object.assign(row, { [field]: value });
          row.deliveryNoteAmount = computeLineAmount(row);
          row.convertedAmount = computeConvertedAmount(row);
          // netAmt/igstAmount/sgstAmount/cgstAmount intentionally not
          // recomputed here — server-derived from percentages + amount.
        }

        if (field === "customerItemCode" || field === "deliveryNoteInotes") {
          Object.assign(row, { [field]: value });
        }

        updated[rowIndex] = row;
        detailRowsRef.current = updated;
        setDetailRows(updated);
        recalcTotals(updated);
        validateDetailField(rowIndex, field, value);
      },
      [
        orderOptions,
        orderLinesByKey,
        currentFormValues?.customerID,
        fetchOrderLinesForRow,
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

      const newRow = createEmptyDetailRow(currentFormValues.deliveryNoteID);
      const next = [...detailRowsRef.current, newRow];
      detailRowsRef.current = next;
      setDetailRows((prev) => {
        newRowIndexRef.current = prev.length;
        setActiveRowIndex(prev.length);
        activeRowIndexRef.current = prev.length;
        return next;
      });

      // No fetch needed here — a new row always starts with no Order
      // selected, and the shared "all products" list is already fetched once
      // on mount. Every row that stays order-less uses that cached list.

      if (onValuesChange)
        onValuesChange({ ...currentFormValues, deliveryNoteDetail: next });
    }, [currentFormValues, onValuesChange]);

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
          onValuesChange({ ...currentFormValues, deliveryNoteDetail: updated });
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
          onValuesChange({
            ...values,
            deliveryNoteDetail: detailRowsRef.current,
          });
      },
      [onValuesChange, onFormValuesChange],
    );

    const fetchDeliveryNoteCustomersPaged = async ({
      page,
      pageSize,
      searchText,
    }) => {
      // Same customer master call as the Order screen.
      const res = await getCustomerMasterListInDeliveryNote({
        pageNumber: page,
        pageSize,
        searchKeyword: searchText || "",
      });

      const list = res?.data?.CUSTOMER_MASTER_LIST_IN_DELIVERY_NOTE || [];
      const total = res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords ?? null;

      const options = list.map((customer) => ({
        value: customer.ValueText,
        label: customer.DisplayText,
        raw: customer,
      }));

      return {
        options,
        hasMore:
          total !== null
            ? (page + 1) * pageSize < total
            : options.length >= pageSize,
      };
    };

    const getStateCodeLabel = useCallback(
      (code) => {
        const raw = String(code ?? "").trim();
        if (!raw) return "";
        const match = stateCodeOptions.find(
          (o) =>
            String(o.value ?? "")
              .trim()
              .toLowerCase() === raw.toLowerCase() ||
            String(o.label ?? "")
              .trim()
              .toLowerCase() === raw.toLowerCase(),
        );
        return match ? match.label : raw;
      },
      [stateCodeOptions],
    );

    const handleCustomerChange = useCallback(
      (option, handleChange) => {
        const newCustomerId = option?.value ?? "";
        const raw = option?.raw || {};

        const setField = (name, value) =>
          handleChange({ target: { name, value } });
        setField("customerID", newCustomerId);
        setField("customerName", option?.label ?? "");

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
        // than in the create-only default-currency effect, which only fills
        // an empty currency) so switching from an export customer back to a
        // domestic one resets it.
        if (!isExport && inrCurrencyOption) {
          setField("currencyID", inrCurrencyOption.value);
          setField("currencyCode", inrCurrencyOption.label);
        }

        const prevCustomerId = prevCustomerIdRef.current;
        const customerChanged =
          prevCustomerId !== null &&
          String(newCustomerId) !== String(prevCustomerId);

        if (customerChanged && detailRowsRef.current.length > 0) {
          const clearedRows = detailRowsRef.current.map((row) => ({
            ...row,
            // Order/FG Item linkage is customer-scoped too, so it can't carry
            // over to a different customer.
            orderID: null,
            orderLineID: null,
            orderNo: "",
            fgItemID: "",
            fgItemCode: "",
            fgItemDescription: "",
            itemUnit: "",
            customerItemCode: "",
            hsnCode: "",
            qtyShipped: "",
            unitRate: "",
            deliveryNoteAmount: 0,
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
          validatedFormRef.current?.setFieldValue("totalNetAmt", 0);

          // Force the Order dropdown and the order-linked product lists to
          // refetch for the new customer instead of showing stale options.
          // The shared "all products" list isn't customer-scoped, so it's
          // kept (and the in-flight ref is left alone so a pending "all"
          // request isn't orphaned).
          ordersFetchedForCustomerRef.current = null;
          setOrderOptions([]);
          setOrderLinesByKey((prev) =>
            prev[ALL_ITEMS_KEY] ? { [ALL_ITEMS_KEY]: prev[ALL_ITEMS_KEY] } : {},
          );
          prefetchedRowKeysRef.current = new Set();
        }

        prevCustomerIdRef.current = newCustomerId;
      },
      [inrCurrencyOption],
    );

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (values) => {
      const headerValid = validatedFormRef.current?.isValid?.() !== false;
      const detailsValid = validateAllDetails();

      if (detailRows.length === 0) {
        showToast("Please add at least one item to the delivery note", "error");
        return;
      }
      if (!headerValid || !detailsValid) return;

      setSubmitting(true);
      try {
        const dId = values.deliveryNoteID.toString() || "0";
        const isEdit = dId > 0;

        const payload = {
          pageSize: 0,
          pageNumber: 0,
          deliveryNoteID: dId,
          deliveryNoteNo: values.deliveryNoteNo || "0",
          deliveryNoteDate: values.deliveryNoteDate
            ? `${values.deliveryNoteDate}T00:00:00.000`
            : "",
          deliveryNoteAmount: Number(values.deliveryNoteAmount) || 0,
          customerID: Number(values.customerID) || 0,
          customerBillingAddressLine1: values.customerBillingAddressLine1 || "",
          customerBillingAddressLine2: values.customerBillingAddressLine2 || "",
          customerBillingPinCode: values.customerBillingPinCode || "",
          customerShippingAddressLine1:
            values.customerShippingAddressLine1 || "",
          customerShippingAddressLine2:
            values.customerShippingAddressLine2 || "",
          customerShippingPinCode: values.customerShippingPinCode || "",
          vehicleNumber: values.vehicleNumber || "",
          ewayBillNumber: values.ewayBillNumber || "",
          gstStateCode: values.gstStateCode || "",
          ewayBillDate: values.ewayBillDate
            ? `${values.ewayBillDate}T00:00:00.000`
            : "",
          ewayBillURL: values.ewayBillUrl || "",
          ewayBillValidUpto: values.ewayBillValidUpto
            ? `${values.ewayBillValidUpto}T00:00:00.000`
            : "",
          shipmentDistanceKilometer: Number(values.shipmentDistanceKm) || 0,
          billToGSTINNumber: values.billToGstinNumber || "",
          transporterName: values.transporterName || "",
          transporterGSTINNumber: values.transporterGstinNumber || "",
          shipToTradeName: values.shipToTradeName || "",
          shipToGSTINNumber: values.shipToGstinNumber || "",
          transactionType: values.transactionType || "",
          currencyID: Number(values.currencyID) || 0,
          kindAttentionName: values.kindAttnName || "",
          contactNumber: values.contactNo || "",
          documentStatus: isEdit ? DOC_STATUS.AMENDMENT : DOC_STATUS.NEW,
          preparedBy: values.prepBy || getPreparedBy(),
          updatedBy: getPreparedBy(),
          approvedBy: values.approvedBy || "",
          totalNetAmount: Math.round(Number(values.totalNetAmt) || 0),
          totalIGSTAmount: Math.round(Number(values.totalIgstAmt) || 0),
          totalCGSTAmount: Math.round(Number(values.totalCgstAmt) || 0),
          totalSGSTAmount: Math.round(Number(values.totalSgstAmt) || 0),
          paramType: isEdit ? PARAM_TYPE.EDIT : PARAM_TYPE.ADD,
          deliveryNoteDetail: detailRows.map((d) => ({
            deliveryNoteLineID: Number(d.deliveryNoteLineID) || 0,
            deliveryNoteID: dId,
            documentIStatus: isEdit ? DOC_STATUS.AMENDMENT : DOC_STATUS.NEW,
            fgItemID: Number(d.fgItemID) || 0,
            // 0 = no Order linked
            orderID: d.orderID ? Number(d.orderID) : 0,
            orderLineID: d.orderLineID ? Number(d.orderLineID) : 0,
            customerItemCode: d.customerItemCode || "",
            hsnCode: d.hsnCode || "",
            quantityShipped: Number(d.qtyShipped) || 0,
            unitRate: Number(d.unitRate) || 0,
            deliveryNoteINotes: d.deliveryNoteInotes || "",
            currencyRate: Number(d.currencyRate) || 1,
            igstPercentage: Number(d.igstPercent) || 0,
            sgstPercentage: Number(d.sgstPercent) || 0,
            cgstPercentage: Number(d.cgstPercent) || 0,
            igstAmount: Number(d.igstAmount) || 0,
            cgstAmount: Number(d.cgstAmount) || 0,
            sgstAmount: Number(d.sgstAmount) || 0,
            netAmount: Number(d.deliveryNoteAmount) || 0,
            updatedBy: getPreparedBy(),
          })),
        };

        const response = await saveAndUpdateDeliveryNoteHeader(payload);

        if (response?.Status === SUCCESS_STATUS) {
          clearDraft();
          const headerResp = response?.data?.DELIVERY_NOTE_RESPONSE?.[0] || {};
          const generatedId =
            headerResp.delivery_note_id || headerResp.deliveryNoteID || dId;

          if (generatedId > 0) {
            const detail = await fetchDeliveryNoteHeaderDetails({
              deliveryNoteID: Number(generatedId),
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
            headerResp.Message || "Delivery Note saved successfully",
            "success",
          );
        } else {
          const msg =
            response?.data?.DELIVERY_NOTE_RESPONSE?.[0]?.Message ||
            response?.data?.GLOBAL_ERROR_RESPONSE?.[0]?.ErrorDetail ||
            response?.message ||
            "Failed to save Delivery Note.";
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
    const detailColumns = buildDeliveryNoteDetailColumns(isExportCustomer);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
      <>
        <style>{DELIVERY_NOTE_FORM_STYLES}</style>

        <FullPageLoader
          loading={submitting}
          message="Saving Delivery Note..."
          logoSrc={inspireLogo}
        />
        {loadingDetails && <Loader />}

        <div
          className="save-update-delivery-note pb-4 h-100 d-flex flex-column"
          style={{ width: "100%", margin: "0 auto" }}
        >
          {(submitting || loadingDetails) && <Loader />}

          <ValidatedForm
            key={
              fetchedData ? `fetched-${fetchedData.deliveryNoteID}` : "initial"
            }
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
                      label="Delivery Note No"
                      name="deliveryNoteNo"
                      value={values.deliveryNoteNo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Delivery Note Date"
                      name="deliveryNoteDate"
                      type="date"
                      value={values.deliveryNoteDate}
                      onBlur={handleBlur}
                      error={errors.deliveryNoteDate}
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

                {/* Row 2 - Customer, Currency, Transaction Type, GST State Code */}
                <div className="row mb-3">
                  <div className="col-12 col-md-4">
                    <PaginatedSearchSelect
                      label="Customer"
                      name="customerID"
                      value={values.customerID}
                      inputLabel={values.customerName}
                      fetchPage={fetchDeliveryNoteCustomersPaged}
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
                  <div className="col-12 col-md-3">
                    <ReactSelectField
                      label="Transaction Type"
                      name="transactionType"
                      value={values.transactionType}
                      options={TRANSACTION_TYPE_OPTIONS}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Select type"
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    {!isDisabled ? (
                      <ReactSelectField
                        label="GST State Code"
                        name="gstStateCode"
                        value={values.gstStateCode || ""}
                        options={stateCodeOptions}
                        onChange={(e) => {
                          const val =
                            e?.target !== undefined ? e.target.value : e;
                          handleChange({
                            target: { name: "gstStateCode", value: val },
                          });
                        }}
                        onBlur={handleBlur}
                        placeholder="Select state..."
                        isSearchable
                        disabled={isDisabled}
                      />
                    ) : (
                      <FormField
                        label="GST State Code"
                        name="gstStateCodeText"
                        value={getStateCodeLabel(values.gstStateCode)}
                        disabled
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
                      maxLength={6}
                      inputValueType="number"
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
                      error={errors.customerShippingAddressLine1}
                      disabled={isDisabled}
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
                      maxLength={6}
                      inputValueType="number"
                      disabled={isDisabled}
                      required
                    />
                  </div>
                </div>

                {/* Row 5 - Transport / Vehicle */}
                <div className="row mb-3">
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Vehicle Number"
                      name="vehicleNumber"
                      value={values.vehicleNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Transporter Name"
                      name="transporterName"
                      value={values.transporterName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Transporter GSTIN"
                      name="transporterGstinNumber"
                      value={values.transporterGstinNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Shipment Distance (km)"
                      name="shipmentDistanceKm"
                      type="number"
                      value={values.shipmentDistanceKm}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {/* Row 6 - E-Way Bill */}
                <div className="row mb-3">
                  <div className="col-12 col-md-3">
                    <FormField
                      label="E-Way Bill Number"
                      name="ewayBillNumber"
                      value={values.ewayBillNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="E-Way Bill Date"
                      name="ewayBillDate"
                      type="date"
                      value={values.ewayBillDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      min={minPastDateString}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="E-Way Bill Valid Upto"
                      name="ewayBillValidUpto"
                      type="date"
                      value={values.ewayBillValidUpto}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                      min={minPastDateString}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="E-Way Bill URL"
                      name="ewayBillUrl"
                      value={values.ewayBillUrl}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {/* Row 7 - Bill-To / Ship-To GST (used when Transaction Type
                    is Bill-To/Ship-To or Bill-From/Dispatch-From) */}
                <div className="row mb-3">
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Bill To GSTIN"
                      name="billToGstinNumber"
                      value={values.billToGstinNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Ship To Trade Name"
                      name="shipToTradeName"
                      value={values.shipToTradeName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <FormField
                      label="Ship To GSTIN"
                      name="shipToGstinNumber"
                      value={values.shipToGstinNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {/* ── Detail Table ── */}
                <div className="card delivery-note-detail-card">
                  <div className="card-header dn-details-header">
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
                      <div className="dn-details-table-responsive">
                        <table
                          className="table table-vcenter dn-details-table"
                          style={{ minWidth: "1300px", width: "100%" }}
                        >
                          <thead className="dn-details-thead">
                            <tr>
                              {detailColumns.map((col) => (
                                <th
                                  key={col.key}
                                  className={`dn-details-th${col.key === "actions" ? " dn-details-th-actions" : ""}`}
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
                                    className="dn-details-td dn-details-td-actions"
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
                                          (isCreate || !row.deliveryNoteLineID)
                                        )
                                      }
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        background: "transparent",
                                        color:
                                          !isDisabled &&
                                          canModifyDetails &&
                                          (isCreate || !row.deliveryNoteLineID)
                                            ? "rgb(22,119,255)"
                                            : "#cccccc",
                                        border: "none",
                                        cursor:
                                          !isDisabled &&
                                          canModifyDetails &&
                                          (isCreate || !row.deliveryNoteLineID)
                                            ? "pointer"
                                            : "not-allowed",
                                      }}
                                      title={
                                        isDisabled
                                          ? "Cannot delete in view mode"
                                          : isCreate || !row.deliveryNoteLineID
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
                                  <td className="dn-details-td text-center">
                                    {idx + 1}
                                  </td>
                                  {/* Order — optional, scoped to the selected customer */}
                                  <td className="dn-details-td">
                                    <ReactSelectField
                                      name={`orderID_${idx}`}
                                      hideLabel
                                      options={(() => {
                                        const exists = orderOptions.some(
                                          (o) =>
                                            String(o.value) ===
                                            String(row.orderID),
                                        );
                                        if (exists || !row.orderID)
                                          return orderOptions;
                                        // Preserve a previously-saved order
                                        // reference even if it isn't in the
                                        // currently-fetched list (e.g. list
                                        // still loading).
                                        return [
                                          ...orderOptions,
                                          {
                                            value: row.orderID,
                                            label:
                                              row.orderNo ||
                                              String(row.orderID),
                                          },
                                        ];
                                      })()}
                                      value={row.orderID ?? ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "orderID",
                                          e?.target?.value ?? "",
                                        )
                                      }
                                      isSearchable
                                      placeholder="Select Order"
                                      isDisabled={isDisabled}
                                    />
                                  </td>
                                  {/* FG Item — all products, or the selected Order's products */}
                                  <td className="dn-details-td">
                                    <ReactSelectField
                                      name={`fgItemID_${idx}`}
                                      hideLabel
                                      options={(() => {
                                        const key = buildOrderLineKey(
                                          currentFormValues?.customerID,
                                          row.orderID,
                                        );
                                        const rowOptions =
                                          orderLinesByKey[key] || [];
                                        const exists = rowOptions.some(
                                          (o) =>
                                            String(o.value) ===
                                            String(row.fgItemID),
                                        );
                                        if (
                                          exists ||
                                          !row.fgItemID ||
                                          !row.fgItemCode
                                        )
                                          return rowOptions;
                                        // Preserve a previously-saved FG Item
                                        // even if it isn't in this row's
                                        // current list yet.
                                        return [
                                          ...rowOptions,
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
                                        // reaches fetchOrderLinesForRow if
                                        // this row's key isn't already
                                        // cached or in flight. onMenuOpen
                                        // (not onFocus) fires exactly when
                                        // the dropdown actually opens.
                                        const key = buildOrderLineKey(
                                          currentFormValues?.customerID,
                                          row.orderID,
                                        );
                                        if (
                                          orderLinesByKey[key] ||
                                          orderLinesFetchInFlightRef.current.has(
                                            key,
                                          )
                                        )
                                          return;
                                        fetchOrderLinesForRow(
                                          currentFormValues?.customerID,
                                          row.orderID,
                                        );
                                      }}
                                      error={detailErrors[idx]?.fgItemID}
                                      isSearchable
                                      placeholder="Select FG Item"
                                      isDisabled={isDisabled}
                                    />
                                  </td>
                                  {/* Customer Item Code */}
                                  <td className="dn-details-td">
                                    <input
                                      className="form-control form-control-sm dn-details-input"
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
                                  {/* HSN Code — pulled from the item/order line, read-only */}
                                  <td className="dn-details-td">
                                    <input
                                      className="form-control form-control-sm dn-details-input"
                                      type="text"
                                      value={row.hsnCode || ""}
                                      disabled
                                    />
                                  </td>
                                  {/* Qty Shipped */}
                                  <td className="dn-details-td">
                                    <input
                                      className={`form-control form-control-sm dn-details-input text-right${detailErrors[idx]?.qtyShipped ? " is-invalid" : ""}`}
                                      type="text"
                                      value={row.qtyShipped ?? ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "qtyShipped",
                                          e.target.value,
                                        )
                                      }
                                      onFocus={(e) =>
                                        setTimeout(() => e.target.select(), 0)
                                      }
                                      disabled={isDisabled}
                                    />
                                    {detailErrors[idx]?.qtyShipped && (
                                      <span className="dn-details-error">
                                        {detailErrors[idx].qtyShipped}
                                      </span>
                                    )}
                                  </td>
                                  {/* Unit Rate — read-only when pulled from an
                                      order line, editable when the line isn't
                                      linked to one */}
                                  <td className="dn-details-td">
                                    <input
                                      className={`form-control form-control-sm dn-details-input text-right${detailErrors[idx]?.unitRate ? " is-invalid" : ""}`}
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
                                      <span className="dn-details-error">
                                        {detailErrors[idx].unitRate}
                                      </span>
                                    )}
                                  </td>
                                  {/* Amount (computed) */}
                                  <td className="dn-details-td">
                                    <input
                                      className="form-control form-control-sm dn-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.deliveryNoteAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                  {/* Currency Rate — Export customers only */}
                                  {isExportCustomer && (
                                    <td className="dn-details-td">
                                      <input
                                        className="form-control form-control-sm dn-details-input text-right"
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
                                  {/* Converted Amount (computed) — Export only */}
                                  {isExportCustomer && (
                                    <td className="dn-details-td">
                                      <input
                                        className="form-control form-control-sm dn-details-input text-right"
                                        type="text"
                                        value={Number(
                                          row.convertedAmount || 0,
                                        ).toFixed(2)}
                                        disabled
                                      />
                                    </td>
                                  )}
                                  {/* Notes */}
                                  <td className="dn-details-td">
                                    <input
                                      className="form-control form-control-sm dn-details-input"
                                      type="text"
                                      value={row.deliveryNoteInotes || ""}
                                      onChange={(e) =>
                                        handleDetailFieldChange(
                                          idx,
                                          "deliveryNoteInotes",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isDisabled}
                                      placeholder="Notes"
                                    />
                                  </td>
                                  {/* IGST % */}
                                  <td className="dn-details-td">
                                    <input
                                      className="form-control form-control-sm dn-details-input text-right"
                                      type="text"
                                      value={row.igstPercent ?? 0}
                                      disabled
                                    />
                                  </td>
                                  {/* SGST % */}
                                  <td className="dn-details-td">
                                    <input
                                      className="form-control form-control-sm dn-details-input text-right"
                                      type="text"
                                      value={row.sgstPercent ?? 0}
                                      disabled
                                    />
                                  </td>
                                  {/* CGST % */}
                                  <td className="dn-details-td">
                                    <input
                                      className="form-control form-control-sm dn-details-input text-right"
                                      type="text"
                                      value={row.cgstPercent ?? 0}
                                      disabled
                                    />
                                  </td>
                                  {/* IGST Amount — server-computed, after save+reload */}
                                  <td className="dn-details-td">
                                    <input
                                      className="form-control form-control-sm dn-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.igstAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                  {/* SGST Amount — server-computed, after save+reload */}
                                  <td className="dn-details-td">
                                    <input
                                      className="form-control form-control-sm dn-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.sgstAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                  {/* CGST Amount — server-computed, after save+reload */}
                                  <td className="dn-details-td">
                                    <input
                                      className="form-control form-control-sm dn-details-input text-right"
                                      type="text"
                                      value={Number(
                                        row.cgstAmount || 0,
                                      ).toFixed(2)}
                                      disabled
                                    />
                                  </td>
                                </tr>

                                {/* Sub-row: item description + unit (same as the Order screen) */}
                                <tr
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
                                  {/* Actions + S.No + Order */}
                                  <td
                                    className="dn-details-td"
                                    colSpan={3}
                                    style={{ borderRight: "1px solid #e2e8f0" }}
                                  ></td>

                                  {/* Description — directly under FG Item */}
                                  <td
                                    className="dn-details-td"
                                    style={{
                                      padding: "8px 12px",
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

                                  {/* Customer Item Code + HSN Code — skipped */}
                                  <td
                                    className="dn-details-td"
                                    colSpan={2}
                                  ></td>

                                  {/* Unit — directly under Qty Shipped */}
                                  <td
                                    className="dn-details-td"
                                    style={{
                                      padding: "8px 12px",
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

                                  {/* Everything after Qty Shipped */}
                                  <td
                                    className="dn-details-td"
                                    colSpan={Math.max(
                                      1,
                                      detailColumns.length - 7,
                                    )}
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

                {/* Row - IGST / CGST / SGST / Net / Delivery Note Amount —
                    sourced from header state, same pattern as
                    Quotation/Order's totals row. */}
                <div className="row mt-2 mb-2">
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Document Status"
                      name="docStatusText"
                      value={values.docStatusText}
                      disabled
                    />
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
                      label="Total Net Amount"
                      name="totalNetAmt"
                      value={values.totalNetAmt || 0}
                      style={{ textAlign: "right", width: "100%" }}
                      disabled
                    />
                  </div>
                  <div className="col-12 col-md-2">
                    <FormField
                      label="Delivery Note Amount"
                      name="deliveryNoteAmount"
                      value={values.deliveryNoteAmount || 0}
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

SaveOrUpdateDeliveryNote.displayName = "SaveOrUpdateDeliveryNote";
export default SaveOrUpdateDeliveryNote;
