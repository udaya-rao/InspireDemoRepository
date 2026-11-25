import { getPreparedBy } from "../userSession";

// ── Static dropdown options ─────────────────────────────────────────────────
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

export const VALIDITY_DAYS_OPTIONS = [
  { value: "30", label: "30 Days" },
  { value: "60", label: "60 Days" },
  { value: "90", label: "90 Days" },
];

// ── Enums ────────────────────────────────────────────────────────────────────
// Document status codes this form sends when saving. (Matches the broader
// doc_status scheme used on the Quotation list page: 10 = Not Approved,
// 20 = Amendment, 30 = Approved, 60 = Cancelled — only NEW/AMENDMENT are
// ever sent from this form.)
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

export const DRAFT_KEY = "draft_quotation_create";

// ── Date helpers ─────────────────────────────────────────────────────────────
const todayObj = new Date();
export const today = todayObj.toISOString().split("T")[0];

const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
export const minDateString = threeMonthsAgo.toISOString().split("T")[0];

// ── Default (create-mode) form values ────────────────────────────────────────
export const initialForm = {
  quotationID: 0,
  quotationNo: "0",
  quotationDate: today,
  customerID: "",
  customerEnquiryRef: "",
  customerEnquiryDate: "",
  customerRequiredDate: "",
  priceScope: "",
  currencyID: "",
  kindAttnName: "",
  contactNo: "",
  quotationNotes: "",
  quotationValidityDays: "",
  docStatus: DOC_STATUS.NEW,
  docStatusText: NEW_RECORD_STATUS_TEXT,
  followupDate: "",
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
  quotationAmount: 0,
  paramType: PARAM_TYPE.ADD,
};

// ── Item Details table — column definitions ──────────────────────────────────
// Curr. Rate / Conv. Amount only apply to Export customers; buildQuotationDetailColumns()
// in quotationForm.mappers.js inserts these between Amount and Delivery Terms
// — same position as before.
export const BASE_DETAIL_COLUMNS_HEAD = [
  { key: "actions", label: "Actions", width: "70px" },
  { key: "sno", label: "S.No", width: "55px" },
  { key: "fgItemID", label: "FG Item Code / Description", minWidth: "230px" },
  { key: "customerItemCode", label: "Customer Item Code", width: "150px" },
  { key: "qtyQuoted", label: "Qty Quoted", width: "110px" },
  { key: "unitRate", label: "Unit Rate", width: "110px" },
  { key: "discountPercent", label: "Disc %", width: "90px" },
  { key: "quotationAmount", label: "Amount", width: "120px" },
];

export const EXPORT_ONLY_DETAIL_COLUMNS = [
  { key: "currencyRate", label: "Curr. Rate", width: "110px" },
  { key: "convertedAmount", label: "Conv. Amount", width: "125px" },
];

export const BASE_DETAIL_COLUMNS_TAIL = [
  { key: "deliveryTerms", label: "Delivery Terms", minWidth: "160px" },
  { key: "quotationInotes", label: "Notes", minWidth: "160px" },
];

// Tax columns for the Item Details table — IGST/SGST/CGST % + computed
// Amount, shown right next to (immediately before) the Notes column.
// NOTE: keyed to match the row field names above (igstPercent, igstAmount,
// etc.) so they slot into the same render loop as every other column.
export const TAX_DETAIL_COLUMNS = [
  { key: "igstPercent", label: "IGST %", width: "80px", minWidth: "80px" },
  { key: "sgstPercent", label: "SGST %", width: "80px", minWidth: "80px" },
  { key: "cgstPercent", label: "CGST %", width: "80px", minWidth: "80px" },
  { key: "igstAmount", label: "IGST Amt", width: "100px", minWidth: "100px" },
  { key: "sgstAmount", label: "SGST Amt", width: "100px", minWidth: "100px" },
  { key: "cgstAmount", label: "CGST Amt", width: "100px", minWidth: "100px" },
];

// ── Scoped CSS for this form ─────────────────────────────────────────────────
// Static — safe to hoist out of the component so it isn't rebuilt as a new
// string on every render.
export const QUOTATION_FORM_STYLES = `
  .quotation-detail-card { margin-top: 20px; }
  .q-details-header {
    background: rgb(147, 108, 145);
    padding: 8px 14px;
    margin-bottom: 15px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .q-details-header h5 { font-size: 16px; margin: 0; line-height: 1; color: #fff; }
  .q-details-table-responsive { overflow-x: auto !important; overflow-y: visible !important; -webkit-overflow-scrolling: touch; max-height: 480px; }
  .q-details-table { border-collapse: separate; border-spacing: 0; width: 100%; table-layout: fixed; }
  .q-details-thead { position: sticky; top: 0; z-index: 24; }
  .q-details-th {
    padding: 4px 8px !important; font-weight: bold !important; font-size: 13px !important;
    white-space: nowrap; border-bottom: 2px solid #dee2e6; border-right: 1px solid rgba(255,255,255,0.3);
    background: #7A4B78 !important; color: #ffffff !important; text-align: center; text-transform: none !important;
  }
  .q-details-td { padding: 4px 8px !important; vertical-align: middle; border-bottom: 1px solid #dee2e6; border-right: 1px solid #dee2e6; }
  .q-details-input { width: 100% !important; padding: 3px 6px !important; font-size: 13px; border-radius: 4px; border: 1px solid #ced4da; }
  .q-details-error { font-size: 11px !important; color: #d9534f; display: block; margin-top: 1px; }
  .q-details-td-actions { position: sticky !important; left: 0 !important; z-index: 10 !important; background: #fff !important; border-right: 2px solid #dee2e6 !important; }
  .q-details-th-actions { position: sticky !important; left: 0 !important; top: 0 !important; z-index: 50 !important; background: #7A4B78 !important; color: #ffffff !important; border-right: 2px solid #fff !important; }
  .text-right { text-align: right !important; }
  input:disabled, select:disabled, textarea:disabled { background-color: #f5f7f9 !important; color: #495057 !important; opacity: 1; cursor: not-allowed; }
  input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type="number"] { -moz-appearance: textfield; appearance: textfield; }

  /* Compact fields for the entire page (matches Purchase Order screen) */
  .save-update-quotation input.form-control,
  .save-update-quotation select.form-select,
  .save-update-quotation select.form-control {
    padding: 0px 8px !important;
    font-size: 13px !important;
    height: 28px !important;
    min-height: 28px !important;
    line-height: 28px !important;
  }
  .save-update-quotation div[class*="-control"] {
    min-height: 28px !important;
    height: 28px !important;
    font-size: 13px !important;
  }
  .save-update-quotation div[class*="-ValueContainer"] {
    padding: 0px 6px !important;
    min-height: 26px !important;
    height: 26px !important;
  }
  .save-update-quotation div[class*="-IndicatorsContainer"] {
    height: 26px !important;
  }
  .save-update-quotation div[class*="-singleValue"],
  .save-update-quotation div[class*="-placeholder"] {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 26px !important;
  }
  .save-update-quotation div[class*="-Input"] {
    margin: 0 !important;
    padding: 0 !important;
  }
  /* Keep labels compact too */
  .save-update-quotation .form-label {
    margin-bottom: 2px !important;
  }
  /* Reduce spacing between field groups */
  .save-update-quotation .mb-4,
  .save-update-quotation .mb-3 {
    margin-bottom: 8px !important;
  }
  .save-update-quotation .mb-2 {
    margin-bottom: 4px !important;
  }

  /* Responsive layout media queries */
  @media (max-width: 1200px) {
    .save-update-quotation .col-md-3,
    .save-update-quotation .col-md-4,
    .save-update-quotation .col-md-6,
    .save-update-quotation .col-md-9 {
      flex: 0 0 auto !important;
      width: 50% !important;
      margin-bottom: 8px !important;
    }
    .save-update-quotation .row {
      flex-wrap: wrap !important;
    }
  }

  @media (max-width: 768px) {
    .save-update-quotation .col-md-3,
    .save-update-quotation .col-md-4,
    .save-update-quotation .col-md-6,
    .save-update-quotation .col-md-9 {
      flex: 0 0 auto !important;
      width: 100% !important;
      margin-bottom: 8px !important;
    }
    .q-details-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }
  }
`;