import { getPreparedBy } from "../../utils/userSession";

// ── Static dropdown options ─────────────────────────────────────────────────
// Same fixed enum lists as Quotation — document_delivery_mode, transport_mode
// and freight_terms are identical column comments in order_header's DDL.
export const TRANSPORT_MODE_OPTIONS = [
  "By Courier",
  "By Road",
  "By SpeedPost Parcel",
  "By V.P.P.",
  "Will be delivered",
  "To be collected",
  "By Air Freight",
  "By Sea Freight",
];

export const DELIVERY_MODE_OPTIONS = ["Direct", "Through Bank", "COD"];

export const FREIGHT_TERMS_OPTIONS = [
  "Extra, at actuals",
  "Extra, Inclusive",
  "Freight On Delivery, at actuals",
  "Not Applicable",
];

// ── Enums ────────────────────────────────────────────────────────────────────
// NOTE: mirrors DOC_STATUS used on Quotation (10 = Not Approved, 20 =
// Amendment, 30 = Approved, 60 = Cancelled) — only NEW/AMENDMENT are ever
// sent from this form. Confirm these codes match order_header.doc_status
// values actually used by the backend before relying on them.
export const DOC_STATUS = {
  NEW: 0,
  AMENDMENT: 20,
};

export const CUSTOMER_TYPE = {
  EXPORT: "export",
};

export const PARAM_TYPE = {
  ADD: "ADD",
  EDIT: "EDIT",
};

export const NEW_RECORD_STATUS_TEXT = "New Record";

export const DRAFT_KEY = "draft_order_create";

// ── Date helpers ─────────────────────────────────────────────────────────────
const todayObj = new Date();
export const today = todayObj.toISOString().split("T")[0];

const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
export const minDateString = threeMonthsAgo.toISOString().split("T")[0];

// Earliest date selectable for header dates other than Order Date (which is
// fixed to today and disabled). No upper bound is applied — any future date
// is allowed. Same 30-day-back window used on the Quotation form.
export const minPastDateString = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
})();

// ── Default (create-mode) form values ────────────────────────────────────────
// Maps 1:1 to order_header columns not otherwise auto-managed (order_id,
// order_amount, prep_date/prep_by come from server / getPreparedBy()).
export const initialForm = {
  orderID: 0,
  orderNo: "0",
  orderDate: today,
  customerID: "",
  customerName: "",

  // customer_po_ref / customer_po_date — Order's equivalent of Quotation's
  // customerEnquiryRef/Date (no such field exists on order_header; this is
  // the PO reference the customer sent, not an outbound enquiry ref).
  customerPoRef: "",
  customerPoDate: "",

  // Billing / shipping addresses are split into line1/line2/pin_code pairs
  // on order_header (unlike Quotation's single free-text CustomerAddress).
  customerBillingAddressLine1: "",
  customerBillingAddressLine2: "",
  customerBillingPinCode: "",
  customerShippingAddressLine1: "",
  customerShippingAddressLine2: "",
  customerShippingPinCode: "",

  priceScope: "",
  currencyID: "",
  currencyCode: "",
  kindAttnName: "",
  contactNo: "",
  orderNotes: "",
  docStatus: DOC_STATUS.NEW,
  docStatusText: NEW_RECORD_STATUS_TEXT,
  documentDeliveryMode: "",
  transportMode: "",
  paymentTerms: "",
  freightTerms: "",
  insuranceTerms: "",
  prepBy: getPreparedBy(),
  prepDate: today,
  updateBy: "",
  updateDate: "",
  approvedBy: "",
  approvedDate: "",
  orderAmount: 0,
  paramType: PARAM_TYPE.ADD,
};

// ── Item Details table — column definitions ──────────────────────────────────
// order_detail carries NO igst/sgst/cgst columns (unlike quotation_detail),
// so there is no tax section here at all — that's the main structural
// difference from the Quotation detail table.
//
// delivery_date is NOT NULL on order_detail (Quotation only stamps this from
// the header date and never surfaces it as an editable per-row column), so
// it's included here as a required, user-editable column.
export const BASE_DETAIL_COLUMNS_HEAD = [
  { key: "actions", label: "Actions", width: "70px" },
  { key: "sno", label: "S.No", width: "55px" },
  { key: "fgItemID", label: "FG Item Code / Description", minWidth: "230px" },
  { key: "customerItemCode", label: "Customer Item Code", width: "150px" },
  { key: "qtyOrdered", label: "Qty Ordered", width: "110px" },
  { key: "unitRate", label: "Unit Rate", width: "110px" },
  { key: "discountPercent", label: "Disc %", width: "90px" },
  { key: "orderAmount", label: "Amount", width: "120px" },
];

// Curr. Rate / Conv. Amount — Export customers only, same position/behaviour
// as Quotation's equivalent columns (order_detail has currency_rate and
// converted_amount, same as quotation_detail).
export const EXPORT_ONLY_DETAIL_COLUMNS = [
  { key: "currencyRate", label: "Curr. Rate", width: "110px" },
  { key: "convertedAmount", label: "Conv. Amount", width: "125px" },
];

export const BASE_DETAIL_COLUMNS_TAIL = [
  { key: "deliveryDate", label: "Delivery Date", width: "140px" },
  { key: "deliveryTerms", label: "Delivery Terms", minWidth: "160px" },
  { key: "orderInotes", label: "Notes", minWidth: "160px" },
];

export const TAX_DETAIL_COLUMNS = [
  { key: "igstPercent", label: "IGST %", width: "80px", minWidth: "80px" },
  { key: "sgstPercent", label: "SGST %", width: "80px", minWidth: "80px" },
  { key: "cgstPercent", label: "CGST %", width: "80px", minWidth: "80px" },
  { key: "igstAmount", label: "IGST Amt", width: "100px", minWidth: "100px" },
  { key: "sgstAmount", label: "SGST Amt", width: "100px", minWidth: "100px" },
  { key: "cgstAmount", label: "CGST Amt", width: "100px", minWidth: "100px" },
];

// ── Scoped CSS for this form ─────────────────────────────────────────────────
// Identical to Quotation's styles, class names swapped from
// `.save-update-quotation` / `.q-details-*` to `.save-update-order` /
// `.o-details-*` so both forms can coexist on the same page without CSS
// bleed if ever rendered together.
export const ORDER_FORM_STYLES = `
  .order-detail-card { margin-top: 20px; }
  .o-details-header {
    background: rgb(147, 108, 145);
    padding: 8px 14px;
    margin-bottom: 15px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .o-details-header h5 { font-size: 16px; margin: 0; line-height: 1; color: #fff; }
  .o-details-table-responsive { overflow-x: auto !important; overflow-y: visible !important; -webkit-overflow-scrolling: touch; max-height: 480px; }
  .o-details-table { border-collapse: separate; border-spacing: 0; width: 100%; table-layout: fixed; }
  .o-details-thead { position: sticky; top: 0; z-index: 24; }
  .o-details-th {
    padding: 4px 8px !important; font-weight: bold !important; font-size: 13px !important;
    white-space: nowrap; border-bottom: 2px solid #dee2e6; border-right: 1px solid rgba(255,255,255,0.3);
    background: #7A4B78 !important; color: #ffffff !important; text-align: center; text-transform: none !important;
  }
  .o-details-td { padding: 4px 8px !important; vertical-align: middle; border-bottom: 1px solid #dee2e6; border-right: 1px solid #dee2e6; }
  .o-details-input { width: 100% !important; padding: 3px 6px !important; font-size: 13px; border-radius: 4px; border: 1px solid #ced4da; }
  .o-details-error { font-size: 11px !important; color: #d9534f; display: block; margin-top: 1px; }
  .o-details-td-actions { position: sticky !important; left: 0 !important; z-index: 10 !important; background: #fff !important; border-right: 2px solid #dee2e6 !important; }
  .o-details-th-actions { position: sticky !important; left: 0 !important; top: 0 !important; z-index: 50 !important; background: #7A4B78 !important; color: #ffffff !important; border-right: 2px solid #fff !important; }
  .text-right { text-align: right !important; }
  input:disabled, select:disabled, textarea:disabled { background-color: #f5f7f9 !important; color: #495057 !important; opacity: 1; cursor: not-allowed; }
  input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type="number"] { -moz-appearance: textfield; appearance: textfield; }

  /* Compact fields for the entire page (matches Quotation / Purchase Order screens) */
  .save-update-order input.form-control,
  .save-update-order select.form-select,
  .save-update-order select.form-control {
    padding: 0px 8px !important;
    font-size: 13px !important;
    height: 28px !important;
    min-height: 28px !important;
    line-height: 28px !important;
  }
  .save-update-order div[class*="-control"] {
    min-height: 28px !important;
    height: 28px !important;
    font-size: 13px !important;
  }
  .save-update-order div[class*="-ValueContainer"] {
    padding: 0px 6px !important;
    min-height: 26px !important;
    height: 26px !important;
  }
  .save-update-order div[class*="-IndicatorsContainer"] {
    height: 26px !important;
  }
  .save-update-order div[class*="-singleValue"],
  .save-update-order div[class*="-placeholder"] {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 26px !important;
  }
  .save-update-order div[class*="-Input"] {
    margin: 0 !important;
    padding: 0 !important;
  }
  .save-update-order .form-label {
    margin-bottom: 2px !important;
  }
  .save-update-order .mb-4,
  .save-update-order .mb-3 {
    margin-bottom: 8px !important;
  }
  .save-update-order .mb-2 {
    margin-bottom: 4px !important;
  }

  /* Responsive layout media queries */
  @media (max-width: 1200px) {
    .save-update-order .col-md-3,
    .save-update-order .col-md-4,
    .save-update-order .col-md-6,
    .save-update-order .col-md-9 {
      flex: 0 0 auto !important;
      width: 50% !important;
      margin-bottom: 8px !important;
    }
    .save-update-order .row {
      flex-wrap: wrap !important;
    }
  }

  @media (max-width: 767.98px) {
    .save-update-order .col-md-3,
    .save-update-order .col-md-4,
    .save-update-order .col-md-6,
    .save-update-order .col-md-9 {
      flex: 0 0 auto !important;
      width: 100% !important;
      margin-bottom: 8px !important;
    }
    .save-update-order .row {
      row-gap: 12px;
    }
    .save-update-order .row > [class*="col-"] {
      flex: 0 0 100% !important;
      max-width: 100% !important;
      width: 100% !important;
    }
    .o-details-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }
  }
`;