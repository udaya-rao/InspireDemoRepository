import { getPreparedBy } from "../userSession";

// ── Enums ────────────────────────────────────────────────────────────────────
// Mirrors the DOC_STATUS codes used on Quotation / Order (10 = Not Approved,
// 20 = Amendment, 30 = Approved, 60 = Cancelled). Only NEW / AMENDMENT are
// ever sent from the form; APPROVED is set by the Approve action on the list.
// Confirm these match supplier_item.doc_status values used by the backend.
export const DOC_STATUS = {
  NEW: 0,
  AMENDMENT: 20,
  APPROVED: 30,
};

export const PARAM_TYPE = {
  ADD: "ADD",
  EDIT: "EDIT",
};

export const NEW_RECORD_STATUS_TEXT = "New Record";

export const DRAFT_KEY = "draft_supplier_item_create";

// unit_rate is DECIMAL(14,4): up to 10 integer digits + 4 decimals.
export const UNIT_RATE_PATTERN = /^\d{0,10}(\.\d{0,4})?$/;

// ── Date helpers ─────────────────────────────────────────────────────────────
const todayObj = new Date();
export const today = todayObj.toISOString().split("T")[0];

// ── Default (create-mode) form values ────────────────────────────────────────
// Maps 1:1 to supplier_item columns. supplier_item_id / prep_date / prep_by
// are server-managed; prepBy is only prefilled for display.
//
// itemCode / itemDescription / itemUnit are NOT columns on supplier_item —
// they come from inventory_master (item_id) and are display-only.
export const initialForm = {
  supplierItemID: 0,

  supplierID: "",
  supplierName: "",

  itemID: "",
  itemCode: "",
  itemDescription: "",
  itemUnit: "",

  supplierItemCode: "",
  currencyID: "",
  currencyCode: "",
  unitRate: "",
  validToDate: "",
  purchaseNotes: "",

  docStatus: DOC_STATUS.NEW,
  docStatusText: NEW_RECORD_STATUS_TEXT,
  prepBy: getPreparedBy(),
  prepDate: today,
  updateBy: "",
  updateDate: "",
  approvedBy: "",
  approvedDate: "",
  paramType: PARAM_TYPE.ADD,
};

// ── Scoped CSS for this form ─────────────────────────────────────────────────
// Same compact-field treatment as the Order form, class name swapped to
// `.save-update-supplier-item`. There is no detail table (supplier_item is a
// flat record), so the `.o-details-*` rules are not needed.
export const SUPPLIER_ITEM_FORM_STYLES = `
  input:disabled, select:disabled, textarea:disabled { background-color: #f5f7f9 !important; color: #495057 !important; opacity: 1; cursor: not-allowed; }
  .text-right { text-align: right !important; }

  .si-section-header {
    background: rgb(147, 108, 145);
    padding: 8px 14px;
    margin-bottom: 12px;
    border-radius: 7px;
    color: #fff;
  }
  .si-section-header h5 { font-size: 16px; margin: 0; line-height: 1; color: #fff; }

  .save-update-supplier-item input.form-control,
  .save-update-supplier-item select.form-select,
  .save-update-supplier-item select.form-control {
    padding: 0px 8px !important;
    font-size: 13px !important;
    height: 28px !important;
    min-height: 28px !important;
    line-height: 28px !important;
  }
  .save-update-supplier-item textarea.form-control {
    font-size: 13px !important;
  }
  .save-update-supplier-item div[class*="-control"] {
    min-height: 28px !important;
    height: 28px !important;
    font-size: 13px !important;
  }
  .save-update-supplier-item div[class*="-ValueContainer"] {
    padding: 0px 6px !important;
    min-height: 26px !important;
    height: 26px !important;
  }
  .save-update-supplier-item div[class*="-IndicatorsContainer"] {
    height: 26px !important;
  }
  .save-update-supplier-item div[class*="-singleValue"],
  .save-update-supplier-item div[class*="-placeholder"] {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 26px !important;
  }
  .save-update-supplier-item div[class*="-Input"] {
    margin: 0 !important;
    padding: 0 !important;
  }
  .save-update-supplier-item .form-label { margin-bottom: 2px !important; }
  .save-update-supplier-item .mb-4,
  .save-update-supplier-item .mb-3 { margin-bottom: 8px !important; }
  .save-update-supplier-item .mb-2 { margin-bottom: 4px !important; }

  @media (max-width: 1200px) {
    .save-update-supplier-item .col-md-2,
    .save-update-supplier-item .col-md-3,
    .save-update-supplier-item .col-md-4,
    .save-update-supplier-item .col-md-6 {
      flex: 0 0 auto !important;
      width: 50% !important;
      margin-bottom: 8px !important;
    }
    .save-update-supplier-item .row { flex-wrap: wrap !important; }
  }

  @media (max-width: 767.98px) {
    .save-update-supplier-item .row { row-gap: 12px; }
    .save-update-supplier-item .row > [class*="col-"] {
      flex: 0 0 100% !important;
      max-width: 100% !important;
      width: 100% !important;
    }
  }
`;