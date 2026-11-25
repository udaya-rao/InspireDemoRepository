// export const BaseUrl = "/api";

export const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const Enviroment = import.meta.env.VITE_ENVIRONMENT;

export const ContentType = "application/json";

export const auth = {
  login: `${baseUrl}/api/Auth/Login`,
  verify_resend_otp: `${baseUrl}/api/OTP/VerifyResendOTP`,
  change_password: `${baseUrl}/api/Auth/ChangePassword`,
  forgot_password: `${baseUrl}/api/Auth/ForgotPasswordRequest`,
  reset_password: `${baseUrl}/api/Auth/ResetPassword`,
  change_employee_password: `${baseUrl}/api/Auth/ChangeEmployeePassword`,
  refresh_token: "/api/Auth/RefreshToken",
};

export const common = {
  getDropdownList: `${baseUrl}/api/Master/GetDropDownData`
};

export const employee = {
  getEmployeeList: `${baseUrl}/api/Employee/GetEmployeeMasterList`,
  getEmployeeDetails: `${baseUrl}/api/Employee/GetEmployeeDetails`,
  deleteEmployeeDetails: `${baseUrl}/api/Employee/DeleteEmployeeMaster`,
  saveUpdateEmployeeDetails: `${baseUrl}/api/Employee/SaveAndUpdateEmployee`,
  getEmployeeSecurityAccessList: `${baseUrl}/api/Employee/GetEmployeeSecurityAccessList`,
  saveUpdateEmployeeSecurityAccess: `${baseUrl}/api/Employee/SaveAndUpdateEmployeeSecurityAccess`,
};

// Employer module URLs
export const employer = {
  getEmployerList: `${baseUrl}/api/Employer/GetEmployerList`,
  SaveAndUpdateEmployerDetails: `${baseUrl}/api/Employer/SaveAndUpdateEmployer`,
};

export const HSNMaster = {
  getHSNMasterList: `${baseUrl}/api/Master/GetHSNMasterList`,
  SaveAndUpdateHSNMasterDetails: `${baseUrl}/api/Master/SaveAndUpdateHSNMaster`,
};

// GST Master URLs (kept parallel to HSNMaster)
export const GSTMaster = {
  getGSTMasterList: `${baseUrl}/api/Master/GetGSTMasterList`,
  SaveAndUpdateGSTMasterDetails: `${baseUrl}/api/Master/SaveAndUpdateGSTMaster`,
};

// FG Inventory Master URLs
export const FGInventoryMaster = {
  getFGInventoryList: `${baseUrl}/api/Master/GetFGInventoryList`,
  getFGInventoryDetails: `${baseUrl}/api/Master/GetFGInventoryDetails`,
  deleteFGInventoryDetails: `${baseUrl}/api/Master/DeleteFGInventory`,
  saveUpdateFGInventory: `${baseUrl}/api/Master/SaveAndUpdateFGInventory`,
  checkItemCodeFGInventory: `${baseUrl}/api/Master/CheckFGItemCodeExist`,
};

// Inventory Master URLs
export const InventoryMaster = {
  getInventoryList: `${baseUrl}/api/Master/GetInventoryList`,
  getInventoryShortCuts: `${baseUrl}/api/Master/GetInventoryShortCuts`,
  getInventoryDetails: `${baseUrl}/api/Master/GetInventoryDetails`,
  deleteInventory: `${baseUrl}/api/Master/DeleteInventory`,
  saveAndUpdateInventory: `${baseUrl}/api/Master/SaveAndUpdateInventory`,
  checkInventoryItemCodeExist: `${baseUrl}/api/Master/CheckInventoryItemCodeExist`,

};

// Supplier Master URLs
export const SupplierMaster = {
  getSupplierList: `${baseUrl}/api/Master/GetSupplierMasterList`,
  getSupplierDetails: `${baseUrl}/api/Master/GetSupplierMasterDetails`,
  deleteSupplierDetails: `${baseUrl}/api/Master/DeleteSupplierDetails`,
  saveUpdateSupplier: `${baseUrl}/api/Master/SaveAndUpdateSupplierMaster`,
  checkItemCodeSupplier: `${baseUrl}/api/Master/CheckSupplierNameExistDetails`,
};

// Supplier Item URLs
export const SupplierItem = {
  getSupplierItemList: `${baseUrl}/api/Master/GetSupplierItemList`,
  getSupplierItemDetails: `${baseUrl}/api/Master/GetSupplierItemDetails`,
  saveUpdateSupplierItem: `${baseUrl}/api/Master/SaveAndUpdateSupplierItem`,
  approveSupplierItem: `${baseUrl}/api/Master/ApproveSupplierItemDetails`,
  getSupplierDropdown: `${baseUrl}/api/Master/GetSupplierMasterListInSupplierItemByPagination`,
};

// Customer Master URLs
export const CustomerMaster = {
  getCustomerList: `${baseUrl}/api/Master/GetCustomerMasterList`,
  getCustomerDetails: `${baseUrl}/api/Master/GetCustomerMasterDetails`,
  deleteCustomerDetails: `${baseUrl}/api/Master/DeleteCustomerMasterDetails`,
  saveUpdateCustomer: `${baseUrl}/api/Master/SaveAndUpdateCustomerMaster`,
  checkItemCodeCustomer: `${baseUrl}/api/Master/CheckCustomerNameExistDetails`,
};

// Inspection Master URLs
export const InspectionMaster = {
  getInspectionList: `${baseUrl}/api/Master/GetInspectionMasterList`,
  getInspectionMasterDetails: `${baseUrl}/api/Master/GetInspectionMasterDetails`,
  saveAndUpdateCharacteristicMaster: `${baseUrl}/api/Master/SaveAndUpdateCharacteristicMaster`,
  saveAndUpdateInspectionMaster: `${baseUrl}/api/Master/SaveAndUpdateInspectionMaster`,
  deleteInspectionMaster: `${baseUrl}/api/Master/DeleteInspectionMaster`,
  uploadInspectionVideoFiles: `${baseUrl}/api/Master/UploadInspectionVideoFiles`,
  viewOrDeleteInspectionVideoFiles: `${baseUrl}/api/Master/ViewOrDeleteInspectionVideoFiles`,
};

// Work Order URLs
export const WorkOrder = {
  getWorkOrderHeaderList: `${baseUrl}/api/Master/GetWorkOrderHeaderList`,
  saveAndUpdateWorkOrderHeader: `${baseUrl}/api/Master/SaveAndUpdateWorkOrderHeader`,
  getWorkOrderHeaderDetails: `${baseUrl}/api/Master/GetWorkOrderHeaderDetails`,
  approveWorkOrderDetails: `${baseUrl}/api/Master/ApproveWorkOrderDetails`,
  shortCloseWorkOrderDetails: `${baseUrl}/api/Master/ShortCloseOrRecallWorkOrderDetails`,
  getWorkOrderHeaderPDF: `${baseUrl}/api/Master/GetWorkOrderHeaderPDF`,
};

// Job Card URLs
export const JobCard = {
  getJobCardList: `${baseUrl}/api/Master/GetJobCardList`,
  getJobCardDetails: `${baseUrl}/api/Master/GetJobCardDetails`,
  saveJobCard: `${baseUrl}/api/Master/SaveAndUpdateJobCard`,
  getJobCardListByWorkOrder: `${baseUrl}/api/Master/GetJobCardListByWorkOrder`,
};

// Purchase Order URLs
export const PurchaseOrder = {
  getPurchaseOrderHeaderList: `${baseUrl}/api/Master/GetPurchaseOrderHeaderList`,
  saveAndUpdatePurchaseOrderHeader: `${baseUrl}/api/Master/SaveAndUpdatePurchaseOrderHeader`,
  getPurchaseOrderHeaderDetails: `${baseUrl}/api/Master/GetPurchaseOrderHeaderDetails`,
  getPurchaseOrderHeaderPDF: `${baseUrl}/api/Master/GetPurchaseOrderHeaderPDF`,
  shortCloseOrRecallPurchaseOrderDetails: `${baseUrl}/api/Master/ShortCloseOrRecallPurchaseOrderDetails`,
  approvePurchaseOrderHeaderDetails: `${baseUrl}/api/Master/ApprovePurchaseOrderHeaderDetails`,
};

// Quotation URLs
export const Quotation = {
  getQuotationList: `${baseUrl}/api/Master/GetQuotationList`,
  saveAndUpdateQuotationDetails: `${baseUrl}/api/Master/SaveAndUpdateQuotationDetails`,
  getQuotationDetails: `${baseUrl}/api/Master/GetQuotationDetails`,
  getQuotationHeaderPDF: `${baseUrl}/api/Master/GetQuotationHeaderPDF`,
  approveQuotationDetails: `${baseUrl}/api/Master/ApproveQuotationDetails`,
  getCustomerMasterListInQuotation: `${baseUrl}/api/Master/GetCustomerMasterListInQuotation`,
  shortCloseOrRecallQuotationDetails: `${baseUrl}/api/Master/ShortCloseOrRecallQuotationDetails`,
};

// Order URLs
export const Order = {
  getOrderList: `${baseUrl}/api/Master/GetOrderList`,
  saveAndUpdateOrderDetails: `${baseUrl}/api/Master/SaveAndUpdateOrderDetails`,
  getOrderDetails: `${baseUrl}/api/Master/GetOrderDetails`,
  // getQuotationHeaderPDF: `${baseUrl}/api/Master/GetQuotationHeaderPDF`,
  approveOrderDetails: `${baseUrl}/api/Master/ApproveOrderDetails`,
  getCustomerMasterListInOrder: `${baseUrl}/api/Master/GetCustomerMasterListInQuotation`,
  shortCloseOrRecallOrderDetails: `${baseUrl}/api/Master/ShortCloseOrRecallOrderDetails`,
};

// Delivery Note URLs
export const DeliveryNote = {
  getDeliveryNoteList: "/api/Master/GetDeliveryNoteList",
  saveAndUpdateDeliveryNoteDetails: "/api/Master/SaveAndUpdateDeliveryNote",
  getDeliveryNoteDetails: "/api/Master/GetDeliveryNoteDetails",
  approveDeliveryNoteDetails: "/api/Master/ApproveDeliveryNoteDetails",
  ShortCloseDeliveryNoteDetails: "/api/Master/ShortCloseDeliveryNoteDetails",
  // still guesses, confirm against the backend
  getDeliveryNoteHeaderPDF: "/api/DeliveryNote/GetDeliveryNoteHeaderPDF",
  shortCloseOrRecallDeliveryNoteDetails:
    "/api/DeliveryNote/ShortCloseOrRecallDeliveryNoteDetails",
  getCustomerMasterListInDeliveryNote: "/api/Master/GetCustomerMasterListInDeliveryNote"
};

// Daily Job URLs
export const DailyJob = {
  getDailyJobList: `${baseUrl}/api/Master/GetLoggedInPersonJobCardList`,
  getDailyJobDetails: `${baseUrl}/api/Master/GetJobCardDetails`,
  saveDailyJob: `${baseUrl}/api/Master/SaveAndUpdateJobCard`,
  getDailyJobDataList: `${baseUrl}/api/Master/GetJobCardDailyList`,
  getDailyJobDataDetails: `${baseUrl}/api/Master/GetJobCardDailyDetails`,
  saveDailyJobData: `${baseUrl}/api/Master/SaveAndUpdateJobCardDaily`,
};

// GRN URLs
export const GRN = {
  getGRNHeaderList: `${baseUrl}/api/Master/GetWorkOrderGRNList`,
  getGRNHeaderDetails: `${baseUrl}/api/Master/GetWorkOrderGRNDetails`,
  cancelWorkOrderGRNDetails: `${baseUrl}/api/Master/CancelWorkOrderGRNDetails`,
  saveAndUpdateGRNHeader: `${baseUrl}/api/Master/SaveAndUpdateWorkOrderGRN`,
  getPurchaseOrderGRNHeaderList: `${baseUrl}/api/Master/GetPurchaseOrderGRNHeaderList`,
  getPurchaseOrderGRNHeaderDetails: `${baseUrl}/api/Master/GetPurchaseOrderGRNHeaderDetails`,
  saveAndUpdatePurchaseOrderGRN: `${baseUrl}/api/Master/SaveAndUpdatePurchaseOrderGRN`,
  getQualityGRNHeaderList: `${baseUrl}/api/Master/GetGoodsInspectionGRNHeaderList`,
  saveAndUpdateQualityGRN: `${baseUrl}/api/Master/SaveAndUpdateQualityGRN`,
  saveAndUpdateInspectionDetails: `${baseUrl}/api/Master/SaveAndUpdateInspectionDetails`,
  getInspectionDetails: `${baseUrl}/api/Master/GetInspectionDetails`,
  getInspectionObservationDetails: `${baseUrl}/api/Master/GetInspectionObservationDetails`,
  approveInspectionDetails: `${baseUrl}/api/Master/ApproveInspectionDetails`,
  getWorkOrderGRNHeaderPDF: `${baseUrl}/api/Master/GetWorkOrderGRNHeaderPDF`,
  getPurchaseOrderGRNHeaderPDF: `${baseUrl}/api/Master/GetPurchaseOrderGRNHeaderPDF`,
  getPurchaseOrderOrWorkOrderGRNPDF: `${baseUrl}/api/Master/GetPurchaseOrderOrWorkOrderGRNPDF`,
};

// Bill of Material URLs
export const BOM = {
  getItemCodeList: `${baseUrl}/api/Master/GetItemCodeList`,
  saveAndUpdateBOMMaster: `${baseUrl}/api/Master/SaveAndUpdateBOMMaster`,
  getBOMMasterDetails: `${baseUrl}/api/Master/GetBOMMasterDetails`,
};

// Stores / Stock Addition URLs
export const Stores = {
  getStockInStoreRequestList: `${baseUrl}/api/Master/GetStockInStoreRequestList`,
  getBatchDetailByStoreRequest: `${baseUrl}/api/Master/GetBatchDetailByStoreRequest`,
  saveAndUpdateBatchDetails: `${baseUrl}/api/Master/SaveAndUpdateBatchDetails`,
  getStockOutStoreRequestList: `${baseUrl}/api/Master/GetStockOutStoreRequestList`,
  getStockAdjustmentRequestList: `${baseUrl}/api/Master/GetStockAdjustmentRequestList`,
  getStockAdjustmentRequestDetails: `${baseUrl}/api/Master/GetStockAdjustmentRequestDetails`,
  saveAndUpdateStockAdjustmentRequestDetails: `${baseUrl}/api/Master/SaveAndUpdateStockAdjustmentRequestDetails`,
  approveStockAdjustmentRequestDetails: `${baseUrl}/api/Master/ApproveStockAdjustmentRequestDetails`,
  cancelStockAdjustmentRequestDetails: `${baseUrl}/api/Master/CancelStockAdjustmentRequestDetails`,
  getInventoryTransactionLogList: `${baseUrl}/api/Master/GetInventoryTransactionLogList`,
  getCurrentStockList: `${baseUrl}/api/Master/GetCurrentStockList`,
};

/**
 * GLOBAL BASE URL GUARD
 * Will be reused by axiosSetup.js
 */
export const ensureBaseUrl = () => {
  if (!baseUrl) {
    throw new Error(
      "API Base URL is not configured. Please set the VITE_API_BASE_URL environment variable to the correct URL for your environment and restart the application."
    );
  }
};

export const ensureEnvironment = () => {
  if (!Enviroment) {
    throw new Error(
      "Environment is not configured. Please set the VITE_ENVIRONMENT environment variable to the correct URL for your environment and restart the application."
    );
  }
};
