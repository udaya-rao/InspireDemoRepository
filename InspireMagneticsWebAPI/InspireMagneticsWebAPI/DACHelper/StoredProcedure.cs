namespace InspireMagneticsWebAPI.DACHelper
{
    public static class StoredProcedure
    {

        #region [Auth API]

        /// <summary>
        /// EMPLOYEE_LOGIN
        /// </summary>
        public static string EMPLOYEE_LOGIN = "usp_im_login";

        /// <summary>
        /// CHANGE_PASSWORD
        /// </summary>
        public static string CHANGE_PASSWORD = "usp_im_employee_change_password";

        #endregion [Auth API]

        #region [OTP API]

        /// <summary>
        /// OTP
        /// </summary>
        public static string OTP = "usp_im_otp_operations";

        #endregion [OTP API]

        #region [Master API]

        /// <summary>
        /// EMPLOYEE_MASTER
        /// </summary>
        public static string EMPLOYEE_MASTER = "usp_im_employee_master";

        /// <summary>
        /// EMPLOYEE_SECURITY_ACCESS
        /// </summary>
        public static string EMPLOYEE_SECURITY_ACCESS = "usp_im_employee_security_access";

        /// <summary>
        /// EMPLOYEE_SECURITY_ACCESS_LIST
        /// </summary>
        public static string EMPLOYEE_SECURITY_ACCESS_LIST = "usp_im_employee_security_access_list";

        /// <summary>
		/// EMPLOYER_MASTER
		/// </summary>
		public static string EMPLOYER_MASTER = "usp_im_employer";

        /// <summary>
        /// DROPDOWN_ITEMS
        /// </summary>
        public static string DROPDOWN_ITEMS = "usp_im_drop_down_items";

		/// <summary>
		/// GST_MASTER
		/// </summary>
		public static string GST_MASTER = "usp_im_gst_master";

		/// <summary>
		/// HSN_MASTER
		/// </summary>
		public static string HSN_MASTER = "usp_im_hsn_master";

		/// <summary>
		/// FG_INVENTORY
		/// </summary>
		public static string FG_INVENTORY = "usp_im_fg_inventory_master";

		/// <summary>
		/// INVENTORY_MASTER
		/// </summary>
		public static string INVENTORY_MASTER = "usp_im_inventory_master";

		/// <summary>
		/// SUPPLIER_MASTER
		/// </summary>
		public static string SUPPLIER_MASTER = "usp_im_supplier_master";

		/// <summary>
		/// SUPPLIER_CONTACT_MASTER
		/// </summary>
		public static string SUPPLIER_CONTACT_MASTER = "usp_im_supplier_contact_master";

		/// <summary>
		/// CUSTOMER_MASTER
		/// </summary>
		public static string CUSTOMER_MASTER = "usp_im_customer_master";

		/// <summary>
		/// CUSTOMER_CONTACT_MASTER
		/// </summary>
		public static string CUSTOMER_CONTACT_MASTER = "usp_im_customer_contact_master";

		/// <summary>
		/// INSPECTION_MASTER
		/// </summary>
		public static string INSPECTION_MASTER = "usp_im_inspection_master";

		/// <summary>
		/// CHARACTERISTICS_MASTER
		/// </summary>
		public static string CHARACTERISTICS_MASTER = "usp_im_characteristic_master";

        /// <summary>
        /// BOM_COMMON
        /// </summary>
        public static string BOM_COMMON = "usp_im_bom_common";

        /// <summary>
        /// BOM_DETAIL
        /// </summary>
        public static string BOM_DETAIL = "usp_im_bom_detail";

        /// <summary>
        /// WORK_ORDER_HEADER
        /// </summary>
        public static string WORK_ORDER_HEADER = "usp_im_workorder_header";

        /// <summary>
        /// WORK_ORDER_DETAIL
        /// </summary>
        public static string WORK_ORDER_DETAIL = "usp_im_workorder_detail";

        /// <summary>
        /// JOB_CARD
        /// </summary>
        public static string JOB_CARD = "usp_im_job_card";

        /// <summary>
        /// JOB_CARD_DAILY
        /// </summary>
        public static string JOB_CARD_DAILY = "usp_im_job_card_daily";

        /// <summary>
        /// PURCHASE_ORDER_HEADER
        /// </summary>
        public static string PURCHASE_ORDER_HEADER = "usp_im_purchaseorder_header";

        /// <summary>
        /// PURCHASE_ORDER_DETAIL
        /// </summary>
        public static string PURCHASE_ORDER_DETAIL = "usp_im_purchaseorder_detail";

        /// <summary>
        /// GRN_HEADER
        /// </summary>
        public static string GRN_HEADER = "usp_im_grn_header";

        /// <summary>
        /// GRN_DETAIL
        /// </summary>
        public static string GRN_DETAIL = "usp_im_grn_detail";

        /// <summary>
        /// QUOTATION
        /// </summary>
        public static string QUOTATION_HEADER = "usp_im_quotation_header";

        /// <summary>
        /// QUOTATION_DETAIL
        /// </summary>
        public static string QUOTATION_DETAIL = "usp_im_quotation_detail";

        /// <summary>
        /// INSPECTION_HEADER
        /// </summary>
        public static string INSPECTION_HEADER = "usp_im_inspection_header";

        /// <summary>
        /// INSPECTION_DETAIL
        /// </summary>
        public static string INSPECTION_DETAIL = "usp_im_inspection_detail";

        /// <summary>
        /// INSPECTION_OBSERVATION
        /// </summary>
        public static string INSPECTION_OBSERVATION = "usp_im_inspection_observation";

        /// <summary>
        /// ORDER_HEADER
        /// </summary>
        public static string ORDER_HEADER = "usp_im_order_header";

        /// <summary>
        /// ORDER_DETAIL
        /// </summary>
        public static string ORDER_DETAIL = "usp_im_order_detail";

        /// <summary>
        /// STORE_REQUEST_HEADER
        /// </summary>
        public static string STORE_REQUEST_HEADER = "usp_im_store_request_header";

        /// <summary>
        /// BATCH_DETAIL
        /// </summary>
        public static string BATCH_DETAIL = "usp_im_batch_detail";

        /// <summary>
        /// BATCH_MASTER
        /// </summary>
        public static string BATCH_MASTER = "usp_im_batch_master";

        /// <summary>
        /// STOCK_ADJUSTMENT_REQUEST_HEADER
        /// </summary>
        public static string STOCK_ADJUSTMENT_REQUEST_HEADER = "usp_im_stock_adjustment_request_header";

        /// <summary>
        /// STOCK_ADJUSTMENT_REQUEST_DETAIL
        /// </summary>
        public static string STOCK_ADJUSTMENT_REQUEST_DETAIL = "usp_im_stock_adjustment_request_detail";

        /// <summary>
        /// DELIVERY_NOTE_HEADER
        /// </summary>
        public static string DELIVERY_NOTE_HEADER = "usp_im_delivery_note_header";

        /// <summary>
        /// DELIVERY_NOTE_DETAIL
        /// </summary>
        public static string DELIVERY_NOTE_DETAIL = "usp_im_delivery_note_detail";

        /// <summary>
        /// INVENTORY_TRANSACTION_LOG
        /// </summary>
        public static string INVENTORY_TRANSACTION_LOG = "usp_im_inventory_transaction_log";

        /// <summary>
        /// SUPPLIER_ITEMS
        /// </summary>
        public static string SUPPLIER_ITEMS = "usp_im_supplier_items";

        #endregion [Master API]

        #region [Miscellaneous API]

        /// <summary>
        /// COMPUTER_MASTER
        /// </summary>
        public static string COMPUTER_MASTER = "usp_pepl_sys_domain_master";


		#endregion [Miscellaneous API]
	}
}
