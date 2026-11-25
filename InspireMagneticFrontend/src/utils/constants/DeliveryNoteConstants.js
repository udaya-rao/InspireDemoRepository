export const DRAFT_KEY = "deliveryNoteDraft";

export const PARAM_TYPE = { ADD: "ADD", EDIT: "EDIT" };

// ASSUMPTION: doc_status codes not documented in the DDL (plain
// INTEGER NOT NULL, no comment) — carried over by analogy with
// Order/Quotation's DOC_STATUS.NEW / AMENDMENT. Confirm against backend enum.
export const DOC_STATUS = { NEW: 1, AMENDMENT: 20 };

export const NEW_RECORD_STATUS_TEXT = "New";

export const CUSTOMER_TYPE = { EXPORT: "export" };

export const today = new Date().toISOString().split("T")[0];

export const minPastDateString = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
})();

// transaction_type VARCHAR(1): 1-Regular, 2-Bill To/Ship To,
// 3-Bill From/Dispatch From, 4-Combination of 2 and 3 (per DDL comment).
export const TRANSACTION_TYPE_OPTIONS = [
  { value: "1", label: "Regular" },
  { value: "2", label: "Bill To - Ship To" },
  { value: "3", label: "Bill From - Dispatch From" },
  { value: "4", label: "Combination of 2 and 3" },
];

// ASSUMPTION: gst_state_code is a 2-char state code — no master table
// referenced in the DDL. Either wire this to a real GST state-code lookup
// service, or leave as free text (EditableSelectField) until one exists.
export const GST_STATE_CODE_OPTIONS = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "26", "27", "28", "29", "30", "31",
  "32", "33", "34", "35", "36", "37", "38",
];

export const initialForm = {
  deliveryNoteID: 0,
  deliveryNoteNo: "",
  deliveryNoteDate: today,
  customerID: "",
  customerName: "",
  customerBillingAddressLine1: "",
  customerBillingAddressLine2: "",
  customerBillingPinCode: "",
  customerShippingAddressLine1: "",
  customerShippingAddressLine2: "",
  customerShippingPinCode: "",
  vehicleNumber: "",
  ewayBillNumber: "",
  gstStateCode: "",
  ewayBillDate: "",
  ewayBillUrl: "",
  ewayBillValidUpto: "",
  shipmentDistanceKm: "",
  billToGstinNumber: "",
  transporterName: "",
  transporterGstinNumber: "",
  shipToTradeName: "",
  shipToGstinNumber: "",
  transactionType: "",
  currencyID: "",
  currencyCode: "",
  kindAttnName: "",
  contactNo: "",
  docStatus: 0,
  docStatusText: NEW_RECORD_STATUS_TEXT,
  prepBy: "",
  prepDate: today,
  updateBy: "",
  updateDate: "",
  approvedBy: "",
  approvedDate: "",
  totalNetAmt: 0.0,
  totalIgstAmt: 0.0,
  totalCgstAmt: 0.0,
  totalSgstAmt: 0.0,
  deliveryNoteAmount: 0,
};

// ── Item Details table columns ──────────────────────────────────────────────
// Widths/labels mirror OrderConstants. Column ORDER must match the cells in
// SaveOrUpdateDeliveryNote.jsx; the sub-row colSpans assume the first 7
// columns (Actions … Qty Shipped) are fixed.
export const BASE_DETAIL_COLUMNS_HEAD = [
  { key: "actions", label: "Actions", width: "70px" },
  { key: "slNo", label: "S.No", width: "55px" },
  { key: "order", label: "Order", minWidth: "160px" },
  { key: "fgItem", label: "FG Item Code / Description", minWidth: "230px" },
  { key: "customerItemCode", label: "Customer Item Code", width: "150px" },
  { key: "hsnCode", label: "HSN Code", width: "100px" },
  { key: "qtyShipped", label: "Qty Shipped", width: "110px" },
  { key: "unitRate", label: "Unit Rate", width: "110px" },
  { key: "amount", label: "Amount", width: "120px" },
];

export const EXPORT_ONLY_DETAIL_COLUMNS = [
  { key: "currencyRate", label: "Curr. Rate", width: "110px" },
  { key: "convertedAmount", label: "Conv. Amount", width: "125px" },
];

export const BASE_DETAIL_COLUMNS_TAIL = [
  { key: "notes", label: "Notes", minWidth: "160px" },
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
// Identical to ORDER_FORM_STYLES with class names swapped:
//   .order-detail-card   → .delivery-note-detail-card
//   .o-details-*         → .dn-details-*
//   .save-update-order   → .save-update-delivery-note
// (col-md-2 added to the responsive rules because the totals/audit rows use it.)
export const DELIVERY_NOTE_FORM_STYLES = `
  .delivery-note-detail-card { margin-top: 20px; }
  .dn-details-header {
    background: rgb(147, 108, 145);
    padding: 8px 14px;
    margin-bottom: 15px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dn-details-header h5 { font-size: 16px; margin: 0; line-height: 1; color: #fff; }
  .dn-details-table-responsive { overflow-x: auto !important; overflow-y: visible !important; -webkit-overflow-scrolling: touch; max-height: 480px; }
  .dn-details-table { border-collapse: separate; border-spacing: 0; width: 100%; table-layout: fixed; }
  .dn-details-thead { position: sticky; top: 0; z-index: 24; }
  .dn-details-th {
    padding: 4px 8px !important; font-weight: bold !important; font-size: 13px !important;
    white-space: nowrap; border-bottom: 2px solid #dee2e6; border-right: 1px solid rgba(255,255,255,0.3);
    background: #7A4B78 !important; color: #ffffff !important; text-align: center; text-transform: none !important;
  }
  .dn-details-td { padding: 4px 8px !important; vertical-align: middle; border-bottom: 1px solid #dee2e6; border-right: 1px solid #dee2e6; }
  .dn-details-input { width: 100% !important; padding: 3px 6px !important; font-size: 13px; border-radius: 4px; border: 1px solid #ced4da; }
  .dn-details-error { font-size: 11px !important; color: #d9534f; display: block; margin-top: 1px; }
  .dn-details-td-actions { position: sticky !important; left: 0 !important; z-index: 10 !important; background: #fff !important; border-right: 2px solid #dee2e6 !important; }
  .dn-details-th-actions { position: sticky !important; left: 0 !important; top: 0 !important; z-index: 50 !important; background: #7A4B78 !important; color: #ffffff !important; border-right: 2px solid #fff !important; }
  .text-right { text-align: right !important; }
  input:disabled, select:disabled, textarea:disabled { background-color: #f5f7f9 !important; color: #495057 !important; opacity: 1; cursor: not-allowed; }
  input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type="number"] { -moz-appearance: textfield; appearance: textfield; }

  /* Compact fields for the entire page (matches Order / Quotation screens) */
  .save-update-delivery-note input.form-control,
  .save-update-delivery-note select.form-select,
  .save-update-delivery-note select.form-control {
    padding: 0px 8px !important;
    font-size: 13px !important;
    height: 28px !important;
    min-height: 28px !important;
    line-height: 28px !important;
  }
  .save-update-delivery-note div[class*="-control"] {
    min-height: 28px !important;
    height: 28px !important;
    font-size: 13px !important;
  }
  .save-update-delivery-note div[class*="-ValueContainer"] {
    padding: 0px 6px !important;
    min-height: 26px !important;
    height: 26px !important;
  }
  .save-update-delivery-note div[class*="-IndicatorsContainer"] {
    height: 26px !important;
  }
  .save-update-delivery-note div[class*="-singleValue"],
  .save-update-delivery-note div[class*="-placeholder"] {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 26px !important;
  }
  .save-update-delivery-note div[class*="-Input"] {
    margin: 0 !important;
    padding: 0 !important;
  }
  .save-update-delivery-note .form-label {
    margin-bottom: 2px !important;
  }
  .save-update-delivery-note .mb-4,
  .save-update-delivery-note .mb-3 {
    margin-bottom: 8px !important;
  }
  .save-update-delivery-note .mb-2 {
    margin-bottom: 4px !important;
  }

  /* Responsive layout media queries */
  @media (max-width: 1200px) {
    .save-update-delivery-note .col-md-2,
    .save-update-delivery-note .col-md-3,
    .save-update-delivery-note .col-md-4,
    .save-update-delivery-note .col-md-6,
    .save-update-delivery-note .col-md-9 {
      flex: 0 0 auto !important;
      width: 50% !important;
      margin-bottom: 8px !important;
    }
    .save-update-delivery-note .row {
      flex-wrap: wrap !important;
    }
  }

  @media (max-width: 767.98px) {
    .save-update-delivery-note .col-md-2,
    .save-update-delivery-note .col-md-3,
    .save-update-delivery-note .col-md-4,
    .save-update-delivery-note .col-md-6,
    .save-update-delivery-note .col-md-9 {
      flex: 0 0 auto !important;
      width: 100% !important;
      margin-bottom: 8px !important;
    }
    .save-update-delivery-note .row {
      row-gap: 12px;
    }
    .save-update-delivery-note .row > [class*="col-"] {
      flex: 0 0 100% !important;
      max-width: 100% !important;
      width: 100% !important;
    }
    .dn-details-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }
  }
`;