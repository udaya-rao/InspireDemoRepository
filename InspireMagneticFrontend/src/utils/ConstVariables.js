export const SUCCESS_STATUS = "Success";
export const ERROR_STATUS = "Error";
export const MESSAGE_OK = "OK";
export const PARAM_TYPE_ADD = "ADD";
export const DEFAULT_COUNTRY = "INDIA";
export const YES_VALUE = "Y";
export const NO_VALUE = "N";
export const STATUS_UNKNOWN = "Unknown";
export const TITLE_SUPPLIER_CONTACT_DETAILS = "Supplier Contact Details";
export const TITLE_ADD_CONTACT = "Add Contact";
export const TITLE_CLICK_EDIT_TO_ADD_CONTACTS = "Click Edit to add contacts";
export const STATUS_ACTIVE = "Active";
export const STATUS_IN_ACTIVE = "In Active";
export const STATUS_INACTIVE = "InActive";
export const TITLE_EDIT_SUPPLIER = "Edit Supplier ";
export const TITLE_ADD_SUPPLIER = "Add Supplier";
export const DRAFT_WORK_ORDER_CREATE = "draft_work_order_create";
export const DRAFT_PURCHASE_GRN_CREATE = "draft_grn_purchase_create";
export const DRAFT_WORK_ORDER_GRN_CREATE = "draft_grn_work_order_create";
export const DRAFT_QUALITY_GRN_CREATE = "draft_grn_quality_create";
export const LABEL_APPROVED_BY = "Approved By";
export const LABEL_APPROVED_DATE = "Approved Date";
export const TITLE_UNSAVED_CHANGES = "Unsaved Changes";
export const MSG_UNSAVED_CHANGES_DRAFT = "You have unsaved changes. Save draft or close without saving?";
export const MSG_UNSAVED_CHANGES_CLOSE = "You have unsaved changes. Are you sure you want to close?";
export const MSG_UNSAVED_CHANGES_CONFIRM = "You have unsaved changes. Do you want to save them before leaving?";
export const TITLE_ADD_WORK_ORDER = "Add Work Order";

// ── Stock Adjustment / Store Request Status Enums & Helpers ──────────────────
export const STOCK_ADJUSTMENT_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  CANCELLED: 3,
  STORE_REQUEST_PENDING: 10,
  STORE_REQUEST_APPROVED: 30,
  STORE_REQUEST_CANCELLED: 60,
  COMPLETED: 70,
};

export const STOCK_ADJUSTMENT_STATUS_TEXT = {
  PENDING: "Pending",
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export const isAdjustmentCompleted = (statusId, statusText = "") => {
  const id = Number(statusId);
  const text = String(statusText || "").toLowerCase();
  return id === STOCK_ADJUSTMENT_STATUS.COMPLETED || text.includes("completed");
};

export const isAdjustmentApproved = (statusId, statusText = "") => {
  const id = Number(statusId);
  const text = String(statusText || "").toLowerCase();
  return (
    id === STOCK_ADJUSTMENT_STATUS.APPROVED ||
    id === STOCK_ADJUSTMENT_STATUS.STORE_REQUEST_APPROVED ||
    text.includes("approved")
  );
};

export const isAdjustmentCancelled = (statusId, statusText = "") => {
  const id = Number(statusId);
  const text = String(statusText || "").toLowerCase();
  if (isAdjustmentCompleted(id, text)) return false;
  return (
    id === STOCK_ADJUSTMENT_STATUS.CANCELLED ||
    id === STOCK_ADJUSTMENT_STATUS.STORE_REQUEST_CANCELLED ||
    text.includes("cancel")
  );
};

export const isApprovedOrCancelledStatus = (row) => {
  if (!row) return false;
  const statusId = row.request_status ?? row.status_id ?? row.status ?? 0;
  const statusText = row.request_status_text || row.status_text || "";
  return (
    isAdjustmentCompleted(statusId, statusText) ||
    isAdjustmentApproved(statusId, statusText) ||
    isAdjustmentCancelled(statusId, statusText)
  );
};