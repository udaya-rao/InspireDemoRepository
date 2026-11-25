using System.Data;
using AutoMapper;
using CommonLib;
using InspireMagneticsWebAPI.Models;

namespace InspireMagneticsWebAPI.Contracts
{
    public interface IMaster
    {
		#region [Dropdown Data]

		/// <summary>
		/// This Method Is Used To Get Dropdown Data.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDropdownData"></param>
		/// <returns></returns>
		Task<DataSet> GetDropDownData(ODBCHelper _objODBCHelper, DropdownData _objDropdownData);

		#endregion [Dropdown Data]

		#region [GST Master]

		/// <summary>
		/// This Method Is Used To Save and Update GST Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_lstGSTMaster"></param>
		/// <returns></returns>
		Task<DataSet> SaveAndUpdateGSTMaster(ODBCHelper _objODBCHelper, List<GSTMaster> _lstGSTMaster);
		/// <summary>
		/// This Method is Used to Get GST Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objGSTMasterDetailsRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetGSTMasterDetails(ODBCHelper _objODBCHelper, GSTMasterDetailsRequestParam _objGSTMasterDetailsRequestParam);

		/// <summary>
		/// This Method is Used to Get GST Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objGSTMasterListRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetGSTMasterList(ODBCHelper _objODBCHelper, GSTMasterListRequestParam _objGSTMasterListRequestParam);

		#endregion [GST Master]

		#region [HSN Master]

		/// <summary>
		/// This Method Is Used To Save and Update HSN Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_lstHSNMaster"></param>
		/// <returns></returns>
		Task<DataSet> SaveAndUpdateHSNMaster(ODBCHelper _objODBCHelper, List<HSNMaster> _lstHSNMaster);

		/// <summary>
		/// This Method is Used to Get HSN Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objHSNMasterDetailsRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetHSNMasterDetails(ODBCHelper _objODBCHelper, HSNMasterDetailsRequestParam _objHSNMasterDetailsRequestParam);

		/// <summary>
		/// This Method is Used to Get HSN Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objHSNMasterListRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetHSNMasterList(ODBCHelper _objODBCHelper, HSNMasterListRequestParam _objHSNMasterListRequestParam);

		#endregion [HSN Master]

		#region [FG Inventory]

		/// <summary>
		/// This Method Is Used To Save and Update FG Inventory Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objFGInventoryMasterRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> SaveAndUpdateFGInventory(ODBCHelper _objODBCHelper, FGInventory _objFGInventoryMasterRequestParam);

		/// <summary>
		/// This Method is Used to Get FG Inventory Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objFGInventoryDetailsRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetFGInventoryDetails(ODBCHelper _objODBCHelper, FGInventoryDetailsRequestParam _objFGInventoryDetailsRequestParam);

		/// <summary>
		/// This Method is Used to Delete FG Inventory List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteFGInventoryItem"></param>
		/// <returns></returns>
		Task<DataSet> DeleteFGInventory(ODBCHelper _objODBCHelper, DeleteFGInventoryItem _objDeleteFGInventoryItem);

		/// <summary>
		/// This Method is Used to Get FG Inventory List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objFGSearchInventoryListRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetFGInventoryList(ODBCHelper _objODBCHelper, FGSearchInventoryListRequestParam _objFGSearchInventoryListRequestParam);

		/// <summary>
		/// This Method is Used to Check FG Item Code Exist.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCheckFGItemCodeExist"></param>
		/// <returns></returns>
		Task<DataSet> CheckFGItemCodeExist(ODBCHelper _objODBCHelper, CheckFGItemCodeExistForFGInventory _objCheckFGItemCodeExist);

		#endregion [FG Inventory]

		#region [Inventory Master]

		/// <summary>
		/// This Method Is Used To Save and Update Inventory Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objInventoryMasterRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> SaveAndUpdateInventory(ODBCHelper _objODBCHelper, Inventory _objInventoryMasterRequestParam);

		/// <summary>
		/// This Method is Used to Get Inventory Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objInventoryDetailsRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetInventoryDetails(ODBCHelper _objODBCHelper, InventoryDetailsRequestParam _objInventoryDetailsRequestParam);

		/// <summary>
		/// This Method is Used to Delete Inventory Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteInventoryDetails"></param>
		/// <returns></returns>
		Task<DataSet> DeleteInventory(ODBCHelper _objODBCHelper, DeleteInventoryDetails _objDeleteInventoryDetails);

		/// <summary>
		/// This Method is Used to Get Inventory List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objInventorySearchListRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetInventoryList(ODBCHelper _objODBCHelper, InventorySearchListRequestParam _objInventorySearchListRequestParam);

		/// <summary>
		/// This Method is Used to Check Item Code Exist.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCheckItemCodeExist"></param>
		/// <returns></returns>
		Task<DataSet> CheckInventoryItemCodeExist(ODBCHelper _objODBCHelper, CheckInventoryItemCodeExistForInventory _objCheckItemCodeExist);

        /// <summary>
        /// This Method is Used to Get Item Code List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objItemCodeListByPaginationRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetItemCodeList(ODBCHelper _objODBCHelper, ItemCodeListByPaginationRequestParam _objItemCodeListByPaginationRequestParam);

        #endregion [Inventory Master]

        #region [Supplier Master]

        /// <summary>
        /// This Method Is Used To Save and Update Supplier Master Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objSupplierMasterRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateSupplierMaster(ODBCHelper _objODBCHelper, SupplierMaster _objSupplierMasterRequestParam);

		/// <summary>
		/// This Method is Used to Get Supplier Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objSupplierMasterDetailsRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetSupplierMasterDetails(ODBCHelper _objODBCHelper, SupplierMasterDetailsRequestParam _objSupplierMasterDetailsRequestParam);

		/// <summary>
		/// This Method is Used to Get Supplier Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCheckSupplierNameExist"></param>
		/// <returns></returns>
		Task<DataSet> CheckSupplierNameExistDetails(ODBCHelper _objODBCHelper, CheckSupplierNameExist _objCheckSupplierNameExist);

		/// <summary>
		/// This Method is Used to Delete Supplier Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteSupplierMasterDetails"></param>
		/// <returns></returns>
		Task<DataSet> DeleteSupplierDetails(ODBCHelper _objODBCHelper, DeleteSupplierMasterDetails _objDeleteSupplierMasterDetails);

		/// <summary>
		/// This Method is Used to Get Supplier Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objSupplierMasterListRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetSupplierMasterList(ODBCHelper _objODBCHelper, SearchSupplierMasterListRequestParam _objSupplierMasterListRequestParam);

		#endregion [Supplier Master]

		#region [Customer Master]

		/// <summary>
		/// This Method Is Used To Save and Update Customer Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCustomerMasterRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> SaveAndUpdateCustomerMaster(ODBCHelper _objODBCHelper, CustomerMaster _objCustomerMasterRequestParam);

		/// <summary>
		/// This Method is Used to Get Customer Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCustomerMasterDetailsRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetCustomerMasterDetails(ODBCHelper _objODBCHelper, CustomerMasterDetailsRequestParam _objCustomerMasterDetailsRequestParam);

		/// <summary>
		/// This Method is Used to Get Customer Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCheckCustomerNameExist"></param>
		/// <returns></returns>
		Task<DataSet> CheckCustomerNameExistDetails(ODBCHelper _objODBCHelper, CheckCustomerNameExist _objCheckCustomerNameExist);

		/// <summary>
		/// This Method is Used to Delete Customer Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteCustomerMasterDetails"></param>
		/// <returns></returns>
		Task<DataSet> DeleteCustomerMasterDetails(ODBCHelper _objODBCHelper, DeleteCustomerMasterDetails _objDeleteCustomerMasterDetails);

		/// <summary>
		/// This Method is Used to Get Customer Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCustomerMasterSearchListRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetCustomerMasterList(ODBCHelper _objODBCHelper, CustomerMasterSearchListRequestParam _objCustomerMasterSearchListRequestParam);

        /// <summary>
        /// This Method is Used to Get Customer Master List In Quotation.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objCustomerQuotationSearchListRequestParam"></param>
        /// <returns></returns>
		Task<DataSet> GetCustomerMasterListInQuotation(ODBCHelper _objODBCHelper, CustomerQuotationSearchListRequestParam _objCustomerQuotationSearchListRequestParam);

        /// <summary>
        /// This Method is Used to Get Customer Master List In Delivery Note.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objCustomerDeliveryNoteSearchListRequestParam"></param>
        /// <returns></returns>
		Task<DataSet> GetCustomerMasterListInDeliveryNote(ODBCHelper _objODBCHelper, CustomerDeliveryNoteSearchListRequestParam _objCustomerDeliveryNoteSearchListRequestParam);

        #endregion [Customer Master]

        #region [Inspection Master]

        /// <summary>
        /// This Method Is Used To Save and Update Inspection Master Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_lstInspectionMasterRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateInspectionMaster(ODBCHelper _objODBCHelper, List<InspectionMaster> _lstInspectionMasterRequestParam);

        /// <summary>
        /// This Method is Used to Get Inspection Master Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInspectionMasterDetailsRequestParam"></param>
        /// <param name="webHostEnvironment"></param>
        /// <returns></returns>
        Task<DataSet> GetInspectionMasterDetails(ODBCHelper _objODBCHelper, InspectionMasterDetailsRequestParam _objInspectionMasterDetailsRequestParam, IWebHostEnvironment webHostEnvironment);

		/// <summary>
		/// This Method is Used to Get Inspection Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objInspectionMasterSearchListRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetInspectionMasterList(ODBCHelper _objODBCHelper, InspectionMasterSearchListRequestParam _objInspectionMasterSearchListRequestParam);

		/// <summary>
		/// This Method is Used to Delete Inspection Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteInspectionMasterDetailsRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> DeleteInspectionMaster(ODBCHelper _objODBCHelper, DeleteInspectionMasterDetailsRequestParam _objDeleteInspectionMasterDetailsRequestParam);

		#endregion [Inspection Master]

		#region [Characteristic Master]

		/// <summary>
		/// This Method Is Used To Save and Update Characteristic Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_lstCharacteristicMaster"></param>
		/// <returns></returns>
		Task<DataSet> SaveAndUpdateCharacteristicMaster(ODBCHelper _objODBCHelper, List<CharacteristicMaster> _lstCharacteristicMaster);

        #endregion [Characteristic Master]

        #region [BOM Master]

        /// <summary>
        /// This Method Is Used To Save and Update BOM Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objBOMMaster"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateBOMMaster(ODBCHelper _objODBCHelper, BOMCommon _objBOMMaster);

        /// <summary>
        /// This Method is Used to Get BOM Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objBOMMasterDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetBOMMasterDetails(ODBCHelper _objODBCHelper, BOMMasterDetailsRequestParam _objBOMMasterDetailsRequestParam);

        #endregion [BOM Master]

        #region [Work Order Header]

        /// <summary>
        /// This Method Is Used To Save and Update Work Order Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderHeaderRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateWorkOrderHeader(ODBCHelper _objODBCHelper, WorkOrderHeader _objWorkOrderHeaderRequestParam);

        /// <summary>
        /// This Method is Used to Get Work Order Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderHeaderRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetWorkOrderHeaderDetails(ODBCHelper _objODBCHelper, WorkOrderHeaderDetailsRequestParam _objWorkOrderHeaderRequestParam);

        /// <summary>
        /// This Method is Used to Approve Work Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveWorkOrderHeaderDetails"></param>
        /// <returns></returns>
        Task<DataSet> ApproveWorkOrderDetails(ODBCHelper _objODBCHelper, ApproveWorkOrderHeaderDetails _objApproveWorkOrderHeaderDetails);

        /// <summary>
        /// This Method is Used to ShortClose Or Recall Work Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objShortCloseOrRecallWorkOrderDetails"></param>
        /// <returns></returns>
        Task<DataSet> ShortCloseOrRecallWorkOrderDetails(ODBCHelper _objODBCHelper, WorkOrderShortCloseORRecall _objShortCloseOrRecallWorkOrderDetails);

        /// <summary>
        /// This Method is Used to Get Work Order Header List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderHeaderListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetWorkOrderHeaderList(ODBCHelper _objODBCHelper, WorkOrderHeaderSearchListRequestParam _objWorkOrderHeaderListRequestParam);

        /// <summary>
        /// This Method is Used to Get Work Order Header PDF.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderHeaderPDF"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <returns></returns>
        Task<DataSet> GetWorkOrderHeaderPDF(ODBCHelper _objODBCHelper, WorkOrderHeaderPDF _objWorkOrderHeaderPDF, IWebHostEnvironment _webHostEnvironment);

		#endregion [Work Order Header]

		#region [Job Card]

		/// <summary>
		/// This Method Is Used To Save and Update Job Card Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objJobCardRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> SaveAndUpdateJobCard(ODBCHelper _objODBCHelper, JobCard _objJobCardRequestParam);

        /// <summary>
        /// This Method is Used to Get Job Card Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetJobCardDetails(ODBCHelper _objODBCHelper, JobCardDetailsRequestParam _objJobCardDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Get Job Card List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardPaginationListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetJobCardList(ODBCHelper _objODBCHelper, SearchJobCardListRequestParam _objJobCardPaginationListRequestParam);

        /// <summary>
        /// This Method is Used to Get Logged In Person Job Card List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objLoggedInPersonJobCardPaginationListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetLoggedInPersonJobCardList(ODBCHelper _objODBCHelper, SearchLoggedInPersonJobCardListRequestParam _objLoggedInPersonJobCardPaginationListRequestParam);

        /// <summary>
        /// This Method is Used to Get Job Card List By Work Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardListByWorkOrderListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetJobCardListByWorkOrder(ODBCHelper _objODBCHelper, JobCardListByWorkOrderRequestParam _objJobCardListByWorkOrderListRequestParam);

        #endregion  [Job Card]

        #region [Job Card Daily]

        /// <summary>
        /// This Method Is Used To Save and Update Job Card Daily Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardDailyRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateJobCardDaily(ODBCHelper _objODBCHelper, JobCardDaily _objJobCardDailyRequestParam);

        /// <summary>
        /// This Method is Used to Get Job Card Daily Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardDailyDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetJobCardDailyDetails(ODBCHelper _objODBCHelper, JobCardDailyDetailsRequestParam _objJobCardDailyDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Get Job Card Daily List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardDailyListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetJobCardDailyList(ODBCHelper _objODBCHelper, SearchJobCardDailyListRequestParam _objJobCardDailyListRequestParam);

        #endregion  [Job Card Daily]

        #region [Purchase Order Header]

        /// <summary>
        /// This Method Is Used To Save and Update Purchase Order Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderHeaderRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdatePurchaseOrderHeader(ODBCHelper _objODBCHelper, PurchaseOrderHeader _objPurchaseOrderHeaderRequestParam);

        /// <summary>
        /// This Method is Used to Get Purchase Order Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderHeaderDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetPurchaseOrderHeaderDetails(ODBCHelper _objODBCHelper, PurchaseOrderHeaderDetailsRequestParam _objPurchaseOrderHeaderDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Get Purchase Order Header List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderHeaderListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetPurchaseOrderHeaderList(ODBCHelper _objODBCHelper, PurchaseOrderHeaderSearchListRequestParam _objPurchaseOrderHeaderListRequestParam);

        /// <summary>
        /// This Method is Used to ShortClose Or Recall Purchase Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objShortCloseOrRecallPurchaseOrderDetails"></param>
        /// <returns></returns>
        Task<DataSet> ShortCloseOrRecallPurchaseOrderDetails(ODBCHelper _objODBCHelper, PurchaseOrderShortCloseORRecall _objShortCloseOrRecallPurchaseOrderDetails);

        /// <summary>
        /// This Method is Used to Approve Purchase Order.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApprovePurchaseOrderHeaderDetails"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <param name="mapper"></param>
        /// <returns></returns>
        Task<DataSet> ApprovePurchaseOrderHeaderDetails(ODBCHelper _objODBCHelper, PurchaseOrderHeaderApproveDetails _objApprovePurchaseOrderHeaderDetails, IWebHostEnvironment _webHostEnvironment, IMapper mapper);

        /// <summary>
        /// This Method is Used to Get Purchase Order Header PDF.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderHeaderPDF"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <returns></returns>
        Task<DataSet> GetPurchaseOrderHeaderPDF(ODBCHelper _objODBCHelper, PurchaseOrderHeaderPDF _objPurchaseOrderHeaderPDF, IWebHostEnvironment _webHostEnvironment);

        #endregion  [Purchase Order Header]

        #region [Work Order GRN]

        /// <summary>
        /// This Method Is Used To Save and Update Work Order GRN Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderGRNRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateWorkOrderGRN(ODBCHelper _objODBCHelper, GRNHeader _objWorkOrderGRNRequestParam);

        /// <summary>
        /// This Method is Used to Get Work Order GRN Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderGRNDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetWorkOrderGRNDetails(ODBCHelper _objODBCHelper, GRNHeaderDetailsRequestParam _objWorkOrderGRNDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Get Work Order GRN Header List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderGRNListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetWorkOrderGRNList(ODBCHelper _objODBCHelper, GRNHeaderSearchListRequestParam _objWorkOrderGRNListRequestParam);

        /// <summary>
        /// This Method is Used to Cancel Work Order GRN Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objCancelWorkOrderGRNDetailsDetails"></param>
        /// <returns></returns>
        Task<DataSet> CancelWorkOrderGRNDetails(ODBCHelper _objODBCHelper, CancelWorkOrderGRNDetails _objCancelWorkOrderGRNDetailsDetails);

        #endregion [Work Order GRN]

        #region [Purchase Order GRN]

        /// <summary>
        /// This Method Is Used To Save and Update Purchase Order GRN Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderGRNRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdatePurchaseOrderGRN(ODBCHelper _objODBCHelper, PurchaseOrderGRNHeader _objPurchaseOrderGRNRequestParam);

        /// <summary>
        /// This Method is Used to Get Purchase Order GRN Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderGRNDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetPurchaseOrderGRNHeaderDetails(ODBCHelper _objODBCHelper, PurchaseOrderGRNDetailsRequestParam _objPurchaseOrderGRNDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Get Purchase Order GRN Header List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderGRNListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetPurchaseOrderGRNHeaderList(ODBCHelper _objODBCHelper, PurchaseOrderGRNSearchListRequestParam _objPurchaseOrderGRNListRequestParam);

        /// <summary>
        /// This Method is Used to Get Purchase Order Or Work Order GRN PDF.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderOrWorkOrderGRNDetailsRequestParam"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <returns></returns>
        Task<DataSet> GetPurchaseOrderOrWorkOrderGRNPDF(ODBCHelper _objODBCHelper, PurchaseOrderOrWorkOrderGRNDetailsRequestParam _objPurchaseOrderOrWorkOrderGRNDetailsRequestParam, IWebHostEnvironment _webHostEnvironment);

        #endregion [Purchase Order GRN]

        #region [Goods Inspection Note]

        /// <summary>
        /// This Method is Used to Get Goods Inspection Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objGoodsInspectionGRNDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetGoodsInspectionGRNHeaderDetails(ODBCHelper _objODBCHelper, GoodsInspectionDetailsRequestParam _objGoodsInspectionGRNDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Get Goods Inspection List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objGoodsInspectionGRNListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetGoodsInspectionGRNHeaderList(ODBCHelper _objODBCHelper, GoodsInspectionGRNSearchListRequestParam _objGoodsInspectionGRNListRequestParam);

        /// <summary>
        /// This Method Is Used To Update Goods Inspection Note.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="lstUpdateGoodsInspectionNote"></param>
        /// <returns></returns>
        Task<DataSet> UpdateGoodsInspectionNote(ODBCHelper _objODBCHelper, List<UpdateGoodsInspectionNote> lstUpdateGoodsInspectionNote);

        #endregion [Goods Inspection Note]

        #region [Quotation]

        /// <summary>
        /// This Method Is Used To Save and Update Quotation Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotationRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateQuotationDetails(ODBCHelper _objODBCHelper, Quotation _objQuotationRequestParam);

        /// <summary>
        /// This Method is Used to Get Quotation Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotationDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetQuotationDetails(ODBCHelper _objODBCHelper, QuotationDetailsRequestParam _objQuotationDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Get Quotation List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotationListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetQuotationList(ODBCHelper _objODBCHelper, QuotationSearchListRequestParam _objQuotationListRequestParam);

        /// <summary>
        /// This Method is Used to ShortClose Or Recall Quotation Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotationShortCloseORRecall"></param>
        /// <returns></returns>
        Task<DataSet> ShortCloseOrRecallQuotationDetails(ODBCHelper _objODBCHelper, QuotationShortCloseORRecall _objQuotationShortCloseORRecall);

        /// <summary>
        /// This Method is Used to Approve Quotation Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveQuotationDetails"></param>
        /// <returns></returns>
        Task<DataSet> ApproveQuotationDetails(ODBCHelper _objODBCHelper, QuotationApproveDetails _objApproveQuotationDetails);

        /// <summary>
        /// This Method is Used to Get Quotation Header PDF.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotationHeaderPDF"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <returns></returns>
        Task<DataSet> GetQuotationHeaderPDF(ODBCHelper _objODBCHelper, QuotationHeaderPDF _objQuotationHeaderPDF, IWebHostEnvironment _webHostEnvironment);

        #endregion [Quotation]

        #region [Inspection]

        /// <summary>
        /// This Method Is Used To Save and Update Inspection Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInspectionHeader"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateInspectionDetails(ODBCHelper _objODBCHelper, InspectionHeader _objInspectionHeader);

        /// <summary>
        /// This Method is Used to Get Inspection Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInspectionDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetInspectionDetails(ODBCHelper _objODBCHelper, InspectionDetailsRequestParam _objInspectionDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Get Inspection Observation Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInspectionObservationDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetInspectionObservationDetails(ODBCHelper _objODBCHelper, InspectionObservationDetailsRequestParam _objInspectionObservationDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Approve Inspection Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveInspectionDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> ApproveInspectionDetails(ODBCHelper _objODBCHelper, ApproveInspectionDetailsRequestParam _objApproveInspectionDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Update Is Video Uploaded Or Deleted.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objUpdateInspectionVideoUploadedOrDeletedRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> UpdateIsVideoUploadedOrDeleted(ODBCHelper _objODBCHelper, UpdateInspectionVideoUploadedOrDeletedRequestParam _objUpdateInspectionVideoUploadedOrDeletedRequestParam);

        #endregion [Inspection]

        #region [Order]

        /// <summary>
        /// This Method Is Used To Save and Update Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOrderRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateOrderDetails(ODBCHelper _objODBCHelper, Order _objOrderRequestParam);

        /// <summary>
        /// This Method is Used to Get Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOrderDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetOrderDetails(ODBCHelper _objODBCHelper, OrderDetailsRequestParam _objOrderDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Get Order List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOrderListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetOrderList(ODBCHelper _objODBCHelper, OrderSearchListRequestParam _objOrderListRequestParam);

        /// <summary>
        /// This Method is Used to ShortClose Or Recall Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOrderShortCloseORRecall"></param>
        /// <returns></returns>
        Task<DataSet> ShortCloseOrRecallOrderDetails(ODBCHelper _objODBCHelper, OrderShortCloseORRecall _objOrderShortCloseORRecall);

        /// <summary>
        /// This Method is Used to Approve Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveOrderDetails"></param>
        /// <returns></returns>
        Task<DataSet> ApproveOrderDetails(ODBCHelper _objODBCHelper, OrderApproveDetails _objApproveOrderDetails);

        #endregion [Order]

        #region [Store Request]

        /// <summary>
        /// This Method is Used to Get Stock In Store Request List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objStoreRequestHeaderSearchListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetStockInStoreRequestList(ODBCHelper _objODBCHelper, StoreRequestHeaderSearchListRequestParam _objStoreRequestHeaderSearchListRequestParam);

        /// <summary>
        /// This Method is Used to Get Stock Out Store Request List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objStoreRequestHeaderSearchListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetStockOutStoreRequestList(ODBCHelper _objODBCHelper, StoreRequestHeaderSearchListRequestParam _objStoreRequestHeaderSearchListRequestParam);

        #endregion [Store Request]

        #region [Batch Details]

        /// <summary>
        /// This Method Is Used To Save and Update Batch Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_lstBatchDetail"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateBatchDetails(ODBCHelper _objODBCHelper, List<BatchDetail> _lstBatchDetail);

        /// <summary>
        /// This Method Is Used To Get Batch Details By Store Request.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objGetBatchDetailRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetBatchDetailByStoreRequest(ODBCHelper _objODBCHelper, GetBatchDetailRequestParam _objGetBatchDetailRequestParam);

        #endregion [Batch Details]

        #region [Batch Master]

        /// <summary>
        /// This Method Is Used to Get Current Stock List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objCurrentStockSearchListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetCurrentStockList(ODBCHelper _objODBCHelper, CurrentStockSearchListRequestParam _objCurrentStockSearchListRequestParam);

        #endregion [Batch Master]

        #region [Stock Adjustment Request]

        /// <summary>
        /// This Method Is Used To Save and Update Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objStockAdjustmentRequestHeader"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateStockAdjustmentRequestDetails(ODBCHelper _objODBCHelper, StockAdjustmentRequestHeader _objStockAdjustmentRequestHeader);

        /// <summary>
        /// This Method is Used to Get Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objStockAdjustmentRequestHeaderDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetStockAdjustmentRequestDetails(ODBCHelper _objODBCHelper, StockAdjustmentRequestHeaderDetailsRequestParam _objStockAdjustmentRequestHeaderDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Get Stock Adjustment Request List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objStockAdjustmentRequestHeaderSearchListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetStockAdjustmentRequestList(ODBCHelper _objODBCHelper, StockAdjustmentRequestHeaderSearchListRequestParam _objStockAdjustmentRequestHeaderSearchListRequestParam);

        /// <summary>
        /// This Method is Used to Approve Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveStockAdjustmentRequestDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> ApproveStockAdjustmentRequestDetails(ODBCHelper _objODBCHelper, ApproveStockAdjustmentRequestDetailsRequestParam _objApproveStockAdjustmentRequestDetailsRequestParam);

        /// <summary>
        /// This Method is Used to Cancel Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objCancelStockAdjustmentRequestDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> CancelStockAdjustmentRequestDetails(ODBCHelper _objODBCHelper, CancelStockAdjustmentRequestDetailsRequestParam _objCancelStockAdjustmentRequestDetailsRequestParam);

        #endregion [Stock Adjustment Request]

        #region [Delivery Note]

        /// <summary>
        /// This Method Is Used To Save and Update Delivery Note Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objDeliveryNoteHeader"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateDeliveryNoteDetails(ODBCHelper _objODBCHelper, DeliveryNoteHeader _objDeliveryNoteHeader);

        /// <summary>
        /// This Method Is Used to Get Delivery Note Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objDeliveryNoteDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetDeliveryNoteDetails(ODBCHelper _objODBCHelper, DeliveryNoteDetailsRequestParam _objDeliveryNoteDetailsRequestParam);

        /// <summary>
        /// This Method Is Used to Get Delivery Note List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objDeliveryNoteListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetDeliveryNoteList(ODBCHelper _objODBCHelper, DeliveryNoteSearchListRequestParam _objDeliveryNoteListRequestParam);

        /// <summary>
        /// This Method Is Used to Approve Delivery Note Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveDeliveryNoteDetails"></param>
        /// <returns></returns>
        Task<DataSet> ApproveDeliveryNoteDetails(ODBCHelper _objODBCHelper, ApproveDeliveryNoteDetails _objApproveDeliveryNoteDetails);

        /// <summary>
        /// This Method Is Used to Short Close Delivery Note Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objShortCloseDeliveryNoteDetails"></param>
        /// <returns></returns>
        Task<DataSet> ShortCloseDeliveryNoteDetails(ODBCHelper _objODBCHelper, ShortCloseDeliveryNoteDetails _objShortCloseDeliveryNoteDetails);

        #endregion [Delivery Note]

        #region [Inventory Transaction Log]

        /// <summary>
        /// This Method Is Used to Get Inventory Transaction Log List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInventoryTransactionLogSearchListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetInventoryTransactionLogList(ODBCHelper _objODBCHelper, InventoryTransactionLogSearchListRequestParam _objInventoryTransactionLogSearchListRequestParam);

        #endregion [Inventory Transaction Log]

        #region [Supplier Items]

        /// <summary>
        /// This Method Is Used To Save and Update Supplier Item Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objSupplierItems"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateSupplierItemDetails(ODBCHelper _objODBCHelper, SupplierItems _objSupplierItems);

        /// <summary>
        /// This Method Is Used to Get Supplier Item Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objSupplierItemsDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetSupplierItemDetails(ODBCHelper _objODBCHelper, SupplierItemsDetailsRequestParam _objSupplierItemsDetailsRequestParam);

        /// <summary>
        /// Add Test Method
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objSupplierItemsDetailsRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetSupplierItemDetailsTestMethod(ODBCHelper _objODBCHelper, SupplierItemsDetailsRequestParam _objSupplierItemsDetailsRequestParam);

        
        Task<DataSet> GetSupplierItemDetailsDemoMethod(ODBCHelper _objODBCHelper, SupplierDemoItemsDetailsRequestParam _objSupplierItemsDetailsRequestParam);

        /// <summary>
        /// This Method Is Used to Get Supplier Item List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objSupplierItemsSearchListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetSupplierItemList(ODBCHelper _objODBCHelper, SupplierItemsSearchListRequestParam _objSupplierItemsSearchListRequestParam);

        /// <summary>
		/// This Method is Used to Get Supplier Master List In Supplier Item.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objSupplierMasterListRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetSupplierMasterListInSupplierItem(ODBCHelper _objODBCHelper, SearchSupplierMasterListRequestParam _objSupplierMasterListRequestParam);

        /// <summary>
        /// This Method Is Used to Approve Supplier Item Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveSupplierItemsDetails"></param>
        /// <returns></returns>
        Task<DataSet> ApproveSupplierItemDetails(ODBCHelper _objODBCHelper, ApproveSupplierItemsDetails _objApproveSupplierItemsDetails);

        #endregion [Supplier Items]
    }
}
