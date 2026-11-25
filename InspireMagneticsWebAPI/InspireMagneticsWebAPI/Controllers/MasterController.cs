using AutoMapper;
using CommonLib;
using CommonLib.Constants;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.Controllers.BaseControllers;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace InspireMagneticsWebAPI.Controllers
{
	public class MasterController : BaseApiAuthorizationController
    {
        private readonly IMaster IMasterSvc = null;
        private readonly IFileUpload IFileUploadSvc = null;
        private readonly IWebHostEnvironment webHostEnvironment;
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly ODBCHelper _ODBCHelper;
		private readonly IMapper _mapper;
        private const string ControllerLogName = "MasterController";

        /// <summary>
        /// Master Controller Class Constructor
        /// </summary>
        /// <param name="ServiceRepository"></param>
        /// <param name="FileUploadServiceRepository"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <param name="_httpContextAccessor"></param>
        /// <param name="ODBCHelper"></param>
        /// <param name="mapper"></param>
        public MasterController(IMaster ServiceRepository, IFileUpload FileUploadServiceRepository, 
            IWebHostEnvironment _webHostEnvironment, IHttpContextAccessor _httpContextAccessor, ODBCHelper ODBCHelper, IMapper mapper)
        {
            IMasterSvc = ServiceRepository;
            IFileUploadSvc = FileUploadServiceRepository;
            webHostEnvironment = _webHostEnvironment;
            httpContextAccessor = _httpContextAccessor;
            _ODBCHelper = ODBCHelper;
			_mapper = mapper;
		}

		#region [Dropdown Data]

		/// <summary>
		/// This Post Action Method Is Used To Get Dropdown Data.
		/// </summary>
		/// <param name="_objDropdownData"></param>
		/// <returns>A JSON-formatted string representing the filtered DropDown Values list.</returns>
		[HttpPost, ActionName("GetDropDownData")]
        public async Task<ActionResult<string>> GetDropDownData(DropdownData _objDropdownData)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    switch (_objDropdownData.SourceTable)
                    {
                        case "Department"
                            or "EmployeeLoginID"
                            or "LocalGSTData"
                            or "InterstateGSTData"
                            or "FGHSNCode"
                            or "ResponsiblePersonID"
                            or "InspectionItems"
                            or "CharacteristicMaster"
                            or "OperationID"
                            or "ItemCode"
                            or "SupplierName"
                            or "FGProductList"
                            or "InvProductList"
                            or "Currency"
                            or "Pricescope"
                            or "POSupplierName"
                            or "WorkOrderID"
                            or "PurchaseOrderID"
                            or "QuotationProductsList"
                            or "StockAdjustmentItems"
                            or "StateCode"
                            or "SupplierItemProductList":
                            break;
                        case "SubCharacteristicNameList"
                              or "BatchNo"
                              or "OrderQuotationProductsList"
                              or "DeliveryNoteOrderProductsList":
                            if (string.IsNullOrEmpty(_objDropdownData.ArgumentValue))
                            {
                                ModelState.AddModelError("ArgumentValue", "Enter The Argument Value.");
                            }

                            if (string.IsNullOrEmpty(_objDropdownData.ArgumentValue1))
                            {
                                ModelState.AddModelError("ArgumentValue1", "Enter The Argument Value1.");
                            }
                            break;

                        default:
                            if (string.IsNullOrEmpty(_objDropdownData.ArgumentValue))
                            {
                                ModelState.AddModelError("ArgumentValue", "Enter The Argument Value.");
                            }
                            break;
                    }
                    if (!ModelState.IsValid)
                    {
                        ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                        if (string.IsNullOrEmpty(ReturnResult))
                        {
                            return NotFound();
                        }
                        return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
                    }
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetDropDownData(_ODBCHelper, _objDropdownData));
                    if (string.IsNullOrEmpty(ReturnResult))
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);

                    if (string.IsNullOrEmpty(ReturnResult))
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetDropDownData()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

		#endregion [Dropdown Data]

		#region [GST Master]

		/// <summary>
		/// This Post Action Method Is Used To Save and Update GST Master Details.
		/// </summary>
		/// <param name="_lstGSTMaster">
		///  To Save and Update GST Details Below Request Parameters is required Such as GSTID, TaxName, GSTPerc, GSTStatus, GSTApplicableFor, 
		///  CGSTPercentage, SGSTPercentage,IGSTPercentage, ParamType(Insert/Update).
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the GST details.
		/// </returns>
	   [HttpPost, ActionName("SaveAndUpdateGSTMaster")]
		public async Task<ActionResult<string>> SaveAndUpdateGSTMaster(List<GSTMaster> _lstGSTMaster)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateGSTMaster(_ODBCHelper, _lstGSTMaster));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateGSTMaster()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get GST Master List.
		/// </summary>
		/// <param name="_objGSTMasterDetailsRequestParam">
		/// The GST Details Filter Request Parameters Such as GSTID.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered GST details.
		/// </returns>
		[HttpPost, ActionName("GetGSTMasterDetails")]
		public async Task<ActionResult<string>> GetGSTMasterDetails(GSTMasterDetailsRequestParam _objGSTMasterDetailsRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetGSTMasterDetails(_ODBCHelper, _objGSTMasterDetailsRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetGSTMasterDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get GST Master List.
		/// </summary>
		/// <param name="_objGSTMasterListRequestParam">
		/// The GST Master List Filter Request Parameters Such as Page Size and Page Number.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered GST master list.
		/// </returns>
		[HttpPost, ActionName("GetGSTMasterList")]
		public async Task<ActionResult<string>> GetGSTMasterList(GSTMasterListRequestParam _objGSTMasterListRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetGSTMasterList(_ODBCHelper, _objGSTMasterListRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetGSTMasterList()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		#endregion [GST Master]

		#region [HSN Master]

		/// <summary>
		/// This Post Action Method Is Used To Save and Update HSN Details.
		/// </summary>
		/// <param name="_lstHSNMaster">
		///  To Save and Update HSN Details Below Request Parameters is required Such as HSNID, HSNName, HSNCode, LocalGSTID, InterStateGSTID, HSNStatus, ParamType(Insert/Update).
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the HSN details.
		/// </returns>
		[HttpPost, ActionName("SaveAndUpdateHSNMaster")]
		public async Task<ActionResult<string>> SaveAndUpdateHSNMaster(List<HSNMaster> _lstHSNMaster)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateHSNMaster(_ODBCHelper, _lstHSNMaster));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateHSNMaster()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get HSN Details.
		/// </summary>
		/// <param name="_objHSNMasterDetailsRequestParam">
		/// The HSN Details Filter Request Parameters Such as HSNID.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered HSN details.
		/// </returns>
		[HttpPost, ActionName("GetHSNMasterDetails")]
		public async Task<ActionResult<string>> GetHSNMasterDetails(HSNMasterDetailsRequestParam _objHSNMasterDetailsRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetHSNMasterDetails(_ODBCHelper, _objHSNMasterDetailsRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetHSNMasterDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get HSN List.
		/// </summary>
		/// <param name="_objHSNMasterListRequestParam">
		/// The HSN Master List Filter Request Parameters Such as Page Size and Page Number.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered HSN master list.
		/// </returns>
		[HttpPost, ActionName("GetHSNMasterList")]
		public async Task<ActionResult<string>> GetHSNMasterList(HSNMasterListRequestParam _objHSNMasterListRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetHSNMasterList(_ODBCHelper, _objHSNMasterListRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetHSNMasterList()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		#endregion [HSN Master]

		#region [FG Inventory]

		/// <summary>
		///  This Post Action Method Is Used To Save and Update FG Inventory Details.
		/// </summary>
		/// <param name="_objFGInventoryMasterRequestParam">
		/// To Save and Update FG Inventory Details Below mentioned Request Parameters is required Such as FGItemID, ItemCode, ItemDescription, ItemStatus, 
		/// ItemUnit, ReorderLevel, MinStockLevel, Location, LastTransactionDate, ItemRemarks,PreparedBy, UpdatedBy, ShelfLifeDays, HSNID, ParamType(Insert/Update).
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the FG Inventory Details.
		/// </returns>
		[HttpPost, ActionName("SaveAndUpdateFGInventory")]
		public async Task<ActionResult<string>> SaveAndUpdateFGInventory(FGInventoryMasterRequestParam _objFGInventoryMasterRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					FGInventory _objFGInventory = _mapper.Map<FGInventory>(_objFGInventoryMasterRequestParam);
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateFGInventory(_ODBCHelper, _objFGInventory));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateFGInventory()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get FG Inventory Details.
		/// </summary>
		/// <param name="_objFGInventoryDetailsRequestParam">
		/// The FG Inventory Details Filter Request Parameters Such as FG Item ID.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered FG Inventory Details.
		/// </returns>
		[HttpPost, ActionName("GetFGInventoryDetails")]
		public async Task<ActionResult<string>> GetFGInventoryDetails(FGInventoryDetailsRequestParam _objFGInventoryDetailsRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetFGInventoryDetails(_ODBCHelper, _objFGInventoryDetailsRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetFGInventoryDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Delete FG Inventory Details.
		/// </summary>
		/// <param name="_objDeleteFGInventoryItem">
		/// To Delete FG Inventory Details Filter Request Parameters Such as FG Item ID.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the Delete FG Inventory Details.
		/// </returns>
		[HttpPost, ActionName("DeleteFGInventory")]
		public async Task<ActionResult<string>> DeleteFGInventory(DeleteFGInventoryItem _objDeleteFGInventoryItem)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.DeleteFGInventory(_ODBCHelper, _objDeleteFGInventoryItem));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.DeleteFGInventory()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get FG Inventory List.
		/// </summary>
		/// <param name="_objFGSearchInventoryListRequestParam">
		/// The FG Inventory List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered FG Inventory list.
		/// </returns>
		[HttpPost, ActionName("GetFGInventoryList")]
		public async Task<ActionResult<string>> GetFGInventoryList(FGSearchInventoryListRequestParam _objFGSearchInventoryListRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetFGInventoryList(_ODBCHelper, _objFGSearchInventoryListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetFGInventoryList()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Check FG Item Code Exist.
		/// </summary>
		/// <param name="_objCheckFGItemCodeExist">
		/// To Check FG Item Code Details Filter Request Parameters Such as Item Code.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered FG Inventory list.
		/// </returns>
		[HttpPost, ActionName("CheckFGItemCodeExist")]
		public async Task<ActionResult<string>> CheckFGItemCodeExist(CheckFGItemCodeExistForFGInventory _objCheckFGItemCodeExist)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.CheckFGItemCodeExist(_ODBCHelper, _objCheckFGItemCodeExist));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.CheckFGItemCodeExist()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}
		#endregion [FG Inventory]

		#region [Inventory Master]

		/// <summary>
		/// This Post Action Method Is Used To Save and Update Inventory Details.
		/// </summary>
		/// <param name="_objInventoryMasterRequestParam">
		/// To Save and Update Inventory Details Below mentioned Request Parameters is required Such as ItemID, ItemCode, ItemDescription, ItemUnit, 
		/// ReorderLevel, MinimumStockLevel, Location, ItemStatus, LastTransactionDate, ItemRemarks, PreparedBy, UpdatedBy, ShelfLifeDays, HSNID, ParamType(Insert/Update).
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the Inventory Details.
		/// </returns>
		[HttpPost, ActionName("SaveAndUpdateInventory")]
		public async Task<ActionResult<string>> SaveAndUpdateInventory(InventoryMasterRequestParam _objInventoryMasterRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					Inventory _objInventory = _mapper.Map<Inventory>(_objInventoryMasterRequestParam);
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateInventory(_ODBCHelper, _objInventory));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateInventory()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get Inventory Details.
		/// </summary>
		/// <param name="_objInventoryDetailsRequestParam">
		/// The Inventory Details Filter Request Parameters Such as ItemID And Item Code.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Inventory Details.
		/// </returns>
		[HttpPost, ActionName("GetInventoryDetails")]
		public async Task<ActionResult<string>> GetInventoryDetails(InventoryDetailsRequestParam _objInventoryDetailsRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetInventoryDetails(_ODBCHelper, _objInventoryDetailsRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetInventoryDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}
		/// <summary>
		/// This Post Action Method Is Used To Delete Inventory Details.
		/// </summary>
		/// <param name="_objDeleteInventoryDetails">
		/// To Delete Inventory Details Filter Request Parameters Such as Item ID.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Inventory list.
		/// </returns>
		[HttpPost, ActionName("DeleteInventory")]
		public async Task<ActionResult<string>> DeleteInventory(DeleteInventoryDetails _objDeleteInventoryDetails)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.DeleteInventory(_ODBCHelper, _objDeleteInventoryDetails));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.DeleteInventory()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get Inventory List.
		/// </summary>
		/// <param name="_objInventorySearchListRequestParam">
		/// The Inventory List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Inventory list.
		/// </returns>
		[HttpPost, ActionName("GetInventoryList")]
		public async Task<ActionResult<string>> GetInventoryList(InventorySearchListRequestParam _objInventorySearchListRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetInventoryList(_ODBCHelper, _objInventorySearchListRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetInventoryList()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Check Item Code Exist.
		/// </summary>
		/// <param name="_objCheckItemCodeExist">
		/// To Check Inventory Details Filter Request Parameters Such as Item Code.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered FG Inventory list.
		/// </returns>
		[HttpPost, ActionName("CheckInventoryItemCodeExist")]
		public async Task<ActionResult<string>> CheckInventoryItemCodeExist(CheckInventoryItemCodeExistForInventory _objCheckItemCodeExist)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.CheckInventoryItemCodeExist(_ODBCHelper, _objCheckItemCodeExist));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.CheckInventoryItemCodeExist()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

        /// <summary>
        /// This Post Action Method Is Used To Get Item Code List.
        /// </summary>
        /// <param name="_objItemCodeListByPaginationRequestParam">
        /// The Inventory List Filter Request Parameters Such as Page Size, Page Number, SearchKeyword.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Inventory list.
        /// </returns>
        [HttpPost, ActionName("GetItemCodeList")]
        public async Task<ActionResult<string>> GetItemCodeList(ItemCodeListByPaginationRequestParam _objItemCodeListByPaginationRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetItemCodeList(_ODBCHelper, _objItemCodeListByPaginationRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetItemCodeList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }
        #endregion [Inventory Master]

        #region [Supplier Master]

        /// <summary>
        /// This Post Action Method Is Used To Save and Update Supplier Details.
        /// </summary>
        /// <param name="_objSupplierMasterRequestParam">
        /// To Save and Update Supplier Details, the required request parameters are SupplierID, SupplierName, SupplierAddress1, SupplierAddress2, 
		/// SupplierPincode, SupplierType, SupplierSupply, SupplierWebsite, GSTINNumber, PANNumber, SupplierStatus, PreparedBy, 
		/// UpdatedBy and ParamType (Insert/Update).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Supplier Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateSupplierMaster")]
		public async Task<ActionResult<string>> SaveAndUpdateSupplierMaster(SupplierMasterRequestParam _objSupplierMasterRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					SupplierMaster _objSupplierMaster = _mapper.Map<SupplierMaster>(_objSupplierMasterRequestParam);
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateSupplierMaster(_ODBCHelper, _objSupplierMaster));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateSupplierMaster()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get Supplier Master Details.
		/// </summary>
		/// <param name="_objSupplierMasterDetailsRequestParam">
		/// To Get Supplier Details Filter Request Parameters Such as Supplier ID.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Supplier Details.
		/// </returns>
		[HttpPost, ActionName("GetSupplierMasterDetails")]
		public async Task<ActionResult<string>> GetSupplierMasterDetails(SupplierMasterDetailsRequestParam _objSupplierMasterDetailsRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetSupplierMasterDetails(_ODBCHelper, _objSupplierMasterDetailsRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetSupplierMasterDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get Supplier Master Details.
		/// </summary>
		/// <param name="_objCheckSupplierNameExist">
		/// To Check Supplier Details Filter Request Parameters Such as Supplier Name.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the Check filtered Supplier Details.
		/// </returns>
		[HttpPost, ActionName("CheckSupplierNameExistDetails")]
		public async Task<ActionResult<string>> CheckSupplierNameExistDetails(CheckSupplierNameExist _objCheckSupplierNameExist)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.CheckSupplierNameExistDetails(_ODBCHelper, _objCheckSupplierNameExist));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.CheckSupplierNameExistDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}


		/// <summary>
		/// This Post Action Method Is Used To Delete Supplier Master Details.
		/// </summary>
		/// <param name="_objDeleteSupplierMasterDetails">
		/// To Delete Supplier Details Filter Request Parameters Such as Supplier ID.
		/// </param>
		/// <returns>
		///  A JSON-formatted string representing the Delete filtered Supplier Details.
		/// </returns>
		[HttpPost, ActionName("DeleteSupplierDetails")]
		public async Task<ActionResult<string>> DeleteSupplierDetails(DeleteSupplierMasterDetails _objDeleteSupplierMasterDetails)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.DeleteSupplierDetails(_ODBCHelper, _objDeleteSupplierMasterDetails));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.DeleteSupplierDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}
		/// <summary>
		/// This Post Action Method Is Used To Get Supplier Master List.
		/// </summary>
		/// <param name="_objSupplierMasterListRequestParam">
		///  The Supplier Master List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Supplier Master list.
		/// </returns>
		[HttpPost, ActionName("GetSupplierMasterList")]
		public async Task<ActionResult<string>> GetSupplierMasterList(SearchSupplierMasterListRequestParam _objSupplierMasterListRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetSupplierMasterList(_ODBCHelper, _objSupplierMasterListRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetSupplierMasterList()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}
		#endregion [Supplier Master]

		#region [Customer Master]

		/// <summary>
		/// This Post Action Method Is Used To Save and Update Customer Details.
		/// </summary>
		/// <param name="_objCustomerMasterRequestParam">
		/// To save and update Customer details, the required request parameters are CustomerID, CustomerName, CustomerPrimaryAddressLine1, 
		/// CustomerPrimaryAddressLine2, CustomerPinCode, CustomerType, CustomerWebsite, GSTINNumber, PanNumber, CustomerStatus, 
		/// CustomerSupply, ResponsiblePersonID, PreparedBy, UpdatedBy, and ParamType (Insert/Update).
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the Customer details.
		/// </returns>
		[HttpPost, ActionName("SaveAndUpdateCustomerMaster")]
		public async Task<ActionResult<string>> SaveAndUpdateCustomerMaster(CustomerMasterRequestParam _objCustomerMasterRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					CustomerMaster _objCustomerMaster = _mapper.Map<CustomerMaster>(_objCustomerMasterRequestParam);
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateCustomerMaster(_ODBCHelper, _objCustomerMaster));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateCustomerMaster()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get Customer Master Details.
		/// </summary>
		/// <param name="_objCustomerMasterDetailsRequestParam">
		/// To Get Customer Details Filter Request Parameters Such as Customer ID.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Customer Details.
		/// </returns>
		[HttpPost, ActionName("GetCustomerMasterDetails")]
		public async Task<ActionResult<string>> GetCustomerMasterDetails(CustomerMasterDetailsRequestParam _objCustomerMasterDetailsRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetCustomerMasterDetails(_ODBCHelper, _objCustomerMasterDetailsRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetCustomerMasterDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}


		/// <summary>
		/// This Post Action Method Is Used To Get Customer Master Details.
		/// </summary>
		/// <param name="_objCheckCustomerNameExist">
		/// To Check Customer Details Filter Request Parameters Such as Customer Name.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the Check filtered Customer Details.
		/// </returns>
		[HttpPost, ActionName("CheckCustomerNameExistDetails")]
		public async Task<ActionResult<string>> CheckCustomerNameExistDetails(CheckCustomerNameExist _objCheckCustomerNameExist)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.CheckCustomerNameExistDetails(_ODBCHelper, _objCheckCustomerNameExist));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.CheckCustomerNameExistDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}


		/// <summary>
		/// This Post Action Method Is Used To Delete Customer Master Details.
		/// </summary>
		/// <param name="_objDeleteCustomerMasterDetails">
		/// To Delete Customer Details Filter Request Parameters Such as Customer ID.
		/// </param>
		/// <returns>
		///  A JSON-formatted string representing the Delete filtered Customer Details.
		/// </returns>
		[HttpPost, ActionName("DeleteCustomerMasterDetails")]
		public async Task<ActionResult<string>> DeleteCustomerMasterDetails(DeleteCustomerMasterDetails _objDeleteCustomerMasterDetails)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.DeleteCustomerMasterDetails(_ODBCHelper, _objDeleteCustomerMasterDetails));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.DeleteCustomerMasterDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get Customer Master List.
		/// </summary>
		/// <param name="_objCustomerMasterSearchListRequestParam">
		///  The Customer Master List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Customer Master list.
		/// </returns>
		[HttpPost, ActionName("GetCustomerMasterList")]
		public async Task<ActionResult<string>> GetCustomerMasterList(CustomerMasterSearchListRequestParam _objCustomerMasterSearchListRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetCustomerMasterList(_ODBCHelper, _objCustomerMasterSearchListRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetCustomerMasterList()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

        /// <summary>
		/// This Post Action Method Is Used To Get Customer Master List In Quotation.
		/// </summary>
		/// <param name="_objCustomerQuotationSearchListRequestParam">
		///  To Get Customer Master List In Quotation Filter Request Parameters Such as Page Size, Page Number and SearchKeyword.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Customer Master list In Quotation.
		/// </returns>
		[HttpPost, ActionName("GetCustomerMasterListInQuotation")]
        public async Task<ActionResult<string>> GetCustomerMasterListInQuotation(CustomerQuotationSearchListRequestParam _objCustomerQuotationSearchListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetCustomerMasterListInQuotation(_ODBCHelper, _objCustomerQuotationSearchListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetCustomerMasterListInQuotation()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
		/// This Post Action Method Is Used To Get Customer Master List In Delivery Note.
		/// </summary>
		/// <param name="_objCustomerDeliveryNoteSearchListRequestParam">
		///  To Get Customer Master List In Delivery Note Filter Request Parameters Such as Page Size and Page Number.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Customer Master List In Delivery Note.
		/// </returns>
		[HttpPost, ActionName("GetCustomerMasterListInDeliveryNote")]
        public async Task<ActionResult<string>> GetCustomerMasterListInDeliveryNote(CustomerDeliveryNoteSearchListRequestParam _objCustomerDeliveryNoteSearchListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetCustomerMasterListInDeliveryNote(_ODBCHelper, _objCustomerDeliveryNoteSearchListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetCustomerMasterListInDeliveryNote()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Customer Master]

        #region [Inspection Master]

        /// <summary>
        /// This Post Action Method Is Used To Save and Update Inspection Master Details.
        /// </summary>
        /// <param name="_lstInspectionMasterRequestParam">
        ///  To Save and Update Inspection Details Below Request Parameters is required Such as InspectionID, FgRmItemID, ItemType, CharacteristicID, 
        ///  CharacteristicSortSequence, SubCharacteristicName, SubSortSequence,ExpectedResult, ExpectedMinimumReading, ExpectedMaximumReading, 
        ///  PreparedBy, UpdatedBy, ParamType(Insert/Update).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Inspection details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateInspectionMaster")]
		public async Task<ActionResult<string>> SaveAndUpdateInspectionMaster(List<InspectionMasterRequestParam> _lstInspectionMasterRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					List<InspectionMaster> _lstInspectionMaster = _mapper.Map<List<InspectionMaster>>(_lstInspectionMasterRequestParam);
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateInspectionMaster(_ODBCHelper, _lstInspectionMaster));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateInspectionMaster()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get Inspection Master List.
		/// </summary>
		/// <param name="_objInspectionMasterDetailsRequestParam">
		/// The Inspection Details Filter Request Parameters Such as FgRmItemID and ItemType.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Inspection details.
		/// </returns>
		[HttpPost, ActionName("GetInspectionMasterDetails")]
		public async Task<ActionResult<string>> GetInspectionMasterDetails(InspectionMasterDetailsRequestParam _objInspectionMasterDetailsRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetInspectionMasterDetails(_ODBCHelper, _objInspectionMasterDetailsRequestParam, webHostEnvironment));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetInspectionMasterDetails()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}
		/// <summary>
		/// This Post Action Method Is Used To Get Inspection Master List.
		/// </summary>
		/// <param name="_objInspectionMasterSearchListRequestParam">
		/// The Inspection Master List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Inspection Master list.
		/// </returns>
		[HttpPost, ActionName("GetInspectionMasterList")]
		public async Task<ActionResult<string>> GetInspectionMasterList(InspectionMasterSearchListRequestParam _objInspectionMasterSearchListRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetInspectionMasterList(_ODBCHelper, _objInspectionMasterSearchListRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetInspectionMasterList()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Delete Inspection Master Details.
		/// </summary>
		/// <param name="_objDeleteInspectionMasterDetailsRequestParam">
		/// To Delete Inspection Details Filter Request Parameters Such as FgRmItemID and ItemType.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Inspection Details.
		/// </returns>
		[HttpPost, ActionName("DeleteInspectionMaster")]
		public async Task<ActionResult<string>> DeleteInspectionMaster(DeleteInspectionMasterDetailsRequestParam _objDeleteInspectionMasterDetailsRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.DeleteInspectionMaster(_ODBCHelper, _objDeleteInspectionMasterDetailsRequestParam));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.DeleteInspectionMaster()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

        /// <summary>
        /// This Post Action Method Is Used To Upload Inspection Video Files.
        /// </summary>
        /// <param name="_objInspectionVideoFileUploadRequestParam">
        /// To Upload Inspection Video Files Below Request Parameters is required Such as InspectionID, ItemCode, UploadFiles (It will Allow only Multiple MP4 and WEBM Files).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Inspection Video Files Uploaded Response.
        /// </returns>
        [HttpPost, ActionName("UploadInspectionVideoFiles")]
        [RequestSizeLimit(500 * 1024 * 1024)]
        public async Task<ActionResult<string>> UploadInspectionVideoFiles(InspectionVideoFileUploadRequestParam _objInspectionVideoFileUploadRequestParam)
        {
            string ReturnResult = string.Empty;
            string FolderFullPath = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    var FolderDetails = CommonHelper.GetIMFolderConfigurationDetails(webHostEnvironment, "InspectionVideos");
                    var basePath = FolderDetails != null && FolderDetails.FileUploadPath != null ? FolderDetails.FileUploadPath.Trim() : string.Empty;
                    var basePathErrorMessage = FolderDetails != null && FolderDetails.ErrorMessage != null ? FolderDetails.ErrorMessage.Trim() : string.Empty;

                    string SubFolderName = $"{_objInspectionVideoFileUploadRequestParam.ItemCode}\\{_objInspectionVideoFileUploadRequestParam.InspectionID}";
                    SubFolderName = SubFolderName.Replace("/", "-");
                    FolderFullPath = Path.Combine(basePath, SubFolderName);
                    CommonFileUploadRequestParam _objCommonFileUploadRequestParam = new CommonFileUploadRequestParam();
                    _objCommonFileUploadRequestParam.FolderFullPath = FolderFullPath;
                    _objCommonFileUploadRequestParam.BasePath = basePath;
                    _objCommonFileUploadRequestParam.BasePathErrorMessage = basePathErrorMessage;
                    _objCommonFileUploadRequestParam.IsReturnFileContentAsBase64 = false;
                    List<string> DynamicHeaders = new List<string> { "ItemCode", "InspectionID" };
                    _objCommonFileUploadRequestParam.DynamicHeaders = DynamicHeaders;
                    List<string> DynamicRows = new List<string> { _objInspectionVideoFileUploadRequestParam.ItemCode.ToString(), _objInspectionVideoFileUploadRequestParam.InspectionID.ToString() };
                    _objCommonFileUploadRequestParam.DynamicRows = DynamicRows;
                    _objCommonFileUploadRequestParam.FileData = _objInspectionVideoFileUploadRequestParam.UploadFiles;
                    _objCommonFileUploadRequestParam.TableName = "INSPECTION_VIDEO_FILE_RESPONSE";
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IFileUploadSvc.UploadFiles(_objCommonFileUploadRequestParam));
                    var dsUploadedResponse = Helper.ConvertJsonToDataSet(ReturnResult);
                    if(Helper.CheckDataSetIsNullOrEmpty(dsUploadedResponse))
                    {
                        string UploadedStatus = Helper.ToProperCase(Convert.ToString(dsUploadedResponse.Tables[0].Rows[0]["Status"].ToString()));
                        if (UploadedStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                        {
                            UpdateInspectionVideoUploadedOrDeletedRequestParam _objUpdateInspectionVideoUploadedOrDeletedRequestParam = Helper.ToCopyClassProperties<InspectionVideoFileUploadRequestParam, UpdateInspectionVideoUploadedOrDeletedRequestParam>(_objInspectionVideoFileUploadRequestParam);
                            _objUpdateInspectionVideoUploadedOrDeletedRequestParam.IsVideoUploaded = "Y";
                            await IMasterSvc.UpdateIsVideoUploadedOrDeleted(_ODBCHelper, _objUpdateInspectionVideoUploadedOrDeletedRequestParam);
                        }
                    }
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.DeleteDirectory(FolderFullPath, true);
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.UploadInspectionVideoFiles()", ex.Message, false);
                throw;
            }
            return Content(Util.StaticJSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To View/Delete Uploaded Inspection Video Files.
        /// </summary>
        /// <param name="_objViewDeleteInspectionVideoFileRequestParam">
        /// To View/Delete Uploaded Inspection Video Files Below Request Parameters is required Such as InspectionID, ItemCode, FileName and ParamType(View/Delete).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the List of Uploaded Inspection Video Files.
        /// </returns>
        [HttpPost, ActionName("ViewOrDeleteInspectionVideoFiles")]
        public async Task<ActionResult<string>> ViewOrDeleteInspectionVideoFiles(ViewDeleteInspectionVideoFileRequestParam _objViewDeleteInspectionVideoFileRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    var FolderDetails = CommonHelper.GetIMFolderConfigurationDetails(webHostEnvironment, "InspectionVideos");
                    var basePath = FolderDetails != null && FolderDetails.FileUploadPath != null ? FolderDetails.FileUploadPath.Trim() : string.Empty;
                    var basePathErrorMessage = FolderDetails != null && FolderDetails.ErrorMessage != null ? FolderDetails.ErrorMessage.Trim() : string.Empty;

                    string SubFolderName = string.Empty;
                    if (_objViewDeleteInspectionVideoFileRequestParam.ParamType == "Delete")
                    {
                        if (!string.IsNullOrEmpty(_objViewDeleteInspectionVideoFileRequestParam.FileName) && _objViewDeleteInspectionVideoFileRequestParam.InspectionID > 0)
                        {
                            SubFolderName = $"{_objViewDeleteInspectionVideoFileRequestParam.ItemCode}\\{_objViewDeleteInspectionVideoFileRequestParam.InspectionID}";
                        }
                        else
                        {
                            SubFolderName = $"{_objViewDeleteInspectionVideoFileRequestParam.ItemCode}";
                        }
                    }
                    else
                    {
                        SubFolderName = $"{_objViewDeleteInspectionVideoFileRequestParam.ItemCode}\\{_objViewDeleteInspectionVideoFileRequestParam.InspectionID}";
                    }
                    SubFolderName = SubFolderName.Replace("/", "-");
                    string FolderFullPath = Path.Combine(basePath, SubFolderName);
                    CommonViewFileUploadRequestParam _objCommonViewFileUploadRequestParam = new CommonViewFileUploadRequestParam();
                    _objCommonViewFileUploadRequestParam.FolderFullPath = FolderFullPath;
                    _objCommonViewFileUploadRequestParam.BasePath = basePath;
                    _objCommonViewFileUploadRequestParam.BasePathErrorMessage = basePathErrorMessage;
                    _objCommonViewFileUploadRequestParam.IsReturnFileContentAsBase64 = false;
                    List<string> DynamicHeaders = null;
                    List<string> DynamicRows = null;
                    if (_objViewDeleteInspectionVideoFileRequestParam.ParamType == "Delete")
                    {
                        if (!string.IsNullOrEmpty(_objViewDeleteInspectionVideoFileRequestParam.FileName) && _objViewDeleteInspectionVideoFileRequestParam.InspectionID > 0)
                        {
                            DynamicHeaders = new List<string> { "ItemCode", "InspectionID" };
                            DynamicRows = new List<string> { _objViewDeleteInspectionVideoFileRequestParam.ItemCode.ToString(), _objViewDeleteInspectionVideoFileRequestParam.InspectionID.ToString() };
                        }
                        else
                        {
                            DynamicHeaders = new List<string> { "ItemCode" };
                            DynamicRows = new List<string> { _objViewDeleteInspectionVideoFileRequestParam.ItemCode.ToString() };
                        }
                    }
                    else
                    {
                        DynamicHeaders = new List<string> { "ItemCode", "InspectionID" };
                        DynamicRows = new List<string> { _objViewDeleteInspectionVideoFileRequestParam.ItemCode.ToString(), _objViewDeleteInspectionVideoFileRequestParam.InspectionID.ToString() };
                    }
                    _objCommonViewFileUploadRequestParam.DynamicHeaders = DynamicHeaders;
                    _objCommonViewFileUploadRequestParam.DynamicRows = DynamicRows;
                    _objCommonViewFileUploadRequestParam.FileName = _objViewDeleteInspectionVideoFileRequestParam.FileName;
                    if (_objViewDeleteInspectionVideoFileRequestParam.ParamType == "View")
                    {
                        _objCommonViewFileUploadRequestParam.TableName = "VIEW_INSPECTION_VIDEO_FILE_RESPONSE";
                        ReturnResult = ObjectToJson.ConvertDataSetToJson(await IFileUploadSvc.ViewUploadedFiles(_objCommonViewFileUploadRequestParam, httpContextAccessor));
                    }
                    else
                    {
                        _objCommonViewFileUploadRequestParam.TableName = "DELETE_INSPECTION_VIDEO_FILE_RESPONSE";
                        if(!string.IsNullOrEmpty(_objViewDeleteInspectionVideoFileRequestParam.FileName) && _objViewDeleteInspectionVideoFileRequestParam.InspectionID > 0)
                        {
                            ReturnResult = ObjectToJson.ConvertDataSetToJson(await IFileUploadSvc.DeleteUploadedFiles(_objCommonViewFileUploadRequestParam));
                            var dsDeletedResponse = Helper.ConvertJsonToDataSet(ReturnResult);
                            if (Helper.CheckDataSetIsNullOrEmpty(dsDeletedResponse))
                            {
                                string UploadedStatus = Helper.ToProperCase(Convert.ToString(dsDeletedResponse.Tables[0].Rows[0]["Status"].ToString()));
                                if (UploadedStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                                {
                                    UpdateInspectionVideoUploadedOrDeletedRequestParam _objUpdateInspectionVideoUploadedOrDeletedRequestParam = Helper.ToCopyClassProperties<ViewDeleteInspectionVideoFileRequestParam, UpdateInspectionVideoUploadedOrDeletedRequestParam>(_objViewDeleteInspectionVideoFileRequestParam);
                                    _objUpdateInspectionVideoUploadedOrDeletedRequestParam.IsVideoUploaded = "N";
                                    await IMasterSvc.UpdateIsVideoUploadedOrDeleted(_ODBCHelper, _objUpdateInspectionVideoUploadedOrDeletedRequestParam);
                                }
                            }
                        }
                        else
                        {
                            ReturnResult = ObjectToJson.ConvertDataSetToJson(await IFileUploadSvc.DeleteAllUploadedFilesFromSpecificPath(_objCommonViewFileUploadRequestParam));
                        }
                    }
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ViewOrDeleteInspectionVideoFiles()", ex.Message, false);
                throw;
            }
            return Content(Util.StaticJSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Inspection Master]

        #region [Characteristic Master]

        /// <summary>
        /// This Post Action Method Is Used To Save and Update Characteristic Master Details.
        /// </summary>
        /// <param name="_lstCharacteristicMaster">
        ///  To Save and Update Characteristic Details Below Request Parameters is required Such as CharacteristicID, CharacteristicName and  ParamType(Insert/Update).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Characteristic details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateCharacteristicMaster")]
		public async Task<ActionResult<string>> SaveAndUpdateCharacteristicMaster(List<CharacteristicMaster> _lstCharacteristicMaster)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateCharacteristicMaster(_ODBCHelper, _lstCharacteristicMaster));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateCharacteristicMaster()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

        #endregion [Characteristic Master]

        #region [BOM Master]

        /// <summary>
		/// This Post Action Method Is Used To Save and Update BOM Master Details.
		/// </summary>
		/// <param name="_objBOMMaster">
		///  To Save and Update BOM Details Below Request Parameters is required Such as BOMID, FGItemID, FGAssemblyBaseQuantity, PreparedBy, 
		///  DocumentStatus, BOMRemarks, UpdatedBy and  ParamType(Insert/Update).
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the BOM details.
		/// </returns>
		[HttpPost, ActionName("SaveAndUpdateBOMMaster")]
        public async Task<ActionResult<string>> SaveAndUpdateBOMMaster(BOMCommon _objBOMMaster)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateBOMMaster(_ODBCHelper, _objBOMMaster));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateBOMMaster()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get BOM Details.
        /// </summary>
        /// <param name="_objBOMMasterDetailsRequestParam">
        /// The BOM Details Filter Request Parameters Such as FG Item ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered BOM Details.
        /// </returns>
        [HttpPost, ActionName("GetBOMMasterDetails")]
        public async Task<ActionResult<string>> GetBOMMasterDetails(BOMMasterDetailsRequestParam _objBOMMasterDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetBOMMasterDetails(_ODBCHelper, _objBOMMasterDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetBOMMasterDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [BOM Master]

        #region [Work Order Header]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Work Order Header Details.
        /// </summary>
        /// <param name="_objWorkOrderHeaderRequestParam">
        /// To Save and Update Work Order Header Details Below mentioned Request Parameters is required Such as WorkOrderID, WorkOrderDate, WorkOrderType, 
		/// SupplierID, DocumentStatus, PreparedBy, UpdatedBy, ApprovedBy, Remarks, ParamType(Insert/Update).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Work Order Header Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateWorkOrderHeader")]
        public async Task<ActionResult<string>> SaveAndUpdateWorkOrderHeader(WorkOrderHeaderRequestParam _objWorkOrderHeaderRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    WorkOrderHeader _objWorkOrderHeader = _mapper.Map<WorkOrderHeader>(_objWorkOrderHeaderRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateWorkOrderHeader(_ODBCHelper, _objWorkOrderHeader));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateWorkOrderHeader()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Work Order Header Details.
        /// </summary>
        /// <param name="_objWorkOrderHeaderRequestParam">
        /// To Get Work Order Header Details Filter Request Parameters Such as WorkOrder ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Work Order Header Details.
        /// </returns>
        [HttpPost, ActionName("GetWorkOrderHeaderDetails")]
        public async Task<ActionResult<string>> GetWorkOrderHeaderDetails(WorkOrderHeaderDetailsRequestParam _objWorkOrderHeaderRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetWorkOrderHeaderDetails(_ODBCHelper, _objWorkOrderHeaderRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetWorkOrderHeaderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Approve Work Order Details.
        /// </summary>
        /// <param name="_objApproveWorkOrderHeaderDetails">
        /// To Approve Work Order Details Filter Request Parameters Such as WorkOrderID and ApprovedBy.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Approved Work Order list.
        /// </returns>
        [HttpPost, ActionName("ApproveWorkOrderDetails")]
        public async Task<ActionResult<string>> ApproveWorkOrderDetails(ApproveWorkOrderHeaderDetails _objApproveWorkOrderHeaderDetails)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ApproveWorkOrderDetails(_ODBCHelper, _objApproveWorkOrderHeaderDetails));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ApproveWorkOrderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Short Close Or Recall Work Order Details.
        /// </summary>
        /// <param name="_objShortCloseOrRecallWorkOrderDetails">
        /// To Short Close Or Recal Work Order Details Filter Request Parameters Such as WorkOrderID and ApprovedBy.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Short Close Or Recal Work Order list.
        /// </returns>
        [HttpPost, ActionName("ShortCloseOrRecallWorkOrderDetails")]
        public async Task<ActionResult<string>> ShortCloseOrRecallWorkOrderDetails(WorkOrderShortCloseORRecall _objShortCloseOrRecallWorkOrderDetails)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ShortCloseOrRecallWorkOrderDetails(_ODBCHelper, _objShortCloseOrRecallWorkOrderDetails));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ShortCloseOrRecallWorkOrderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Work Order Header List.
        /// </summary>
        /// <param name="_objWorkOrderHeaderListRequestParam">
        ///  The Work Order Header List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Work Order Header list.
        /// </returns>
        [HttpPost, ActionName("GetWorkOrderHeaderList")]
        public async Task<ActionResult<string>> GetWorkOrderHeaderList(WorkOrderHeaderSearchListRequestParam _objWorkOrderHeaderListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetWorkOrderHeaderList(_ODBCHelper, _objWorkOrderHeaderListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetWorkOrderHeaderList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }
		/// <summary>
		/// This Post Action Method Is Used To Get Work Order Header PDF.
		/// </summary>
		/// <param name="_objWorkOrderHeaderPDF">
		///  The Work Order Header PDF Filter Request Parameters Such as WorkOrderID
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered Work Order Header PDF.
		/// </returns>
		[HttpPost, ActionName("GetWorkOrderHeaderPDF")]
		public async Task<ActionResult<string>> GetWorkOrderHeaderPDF(WorkOrderHeaderPDF _objWorkOrderHeaderPDF)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetWorkOrderHeaderPDF(_ODBCHelper, _objWorkOrderHeaderPDF, webHostEnvironment));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
				else
				{
					ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return NotFound();
					}
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetWorkOrderHeaderPDF()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		#endregion [Work Order Header]

		#region [Job Card]

		/// <summary>
		///  This Post Action Method Is Used To Save and Update Job Card Details.
		/// </summary>
		/// <param name="_objJobCardRequestParam">
		/// To Save and Update Job Card Details Below mentioned Request Parameters is required Such as JobCardID, WorkOrderLineID, OperationID, OperationSequence, 
		/// QuantityPlanned, QuantityInput, QuantityOutput, QuantityScrapped, ProductionCycle, OperationStatus, StartTime, EndTime, ResponsiblePersonID, PreparedBy, 
		/// UpdatedBy and ParamType(Insert/Update).
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the Job Card Details.
		/// </returns>
		[HttpPost, ActionName("SaveAndUpdateJobCard")]
        public async Task<ActionResult<string>> SaveAndUpdateJobCard(JobCardRequestParam _objJobCardRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    JobCard _objJobCard = _mapper.Map<JobCard>(_objJobCardRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateJobCard(_ODBCHelper, _objJobCard));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateJobCard()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Job Card Details.
        /// </summary>
        /// <param name="_objJobCardDetailsRequestParam">
        /// To Get Job Card Details Filter Request Parameters Such as Work Order Line ID and Job Card ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Job Card Details.
        /// </returns>
        [HttpPost, ActionName("GetJobCardDetails")]
        public async Task<ActionResult<string>> GetJobCardDetails(JobCardDetailsRequestParam _objJobCardDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetJobCardDetails(_ODBCHelper, _objJobCardDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetJobCardDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Job Card List.
        /// </summary>
        /// <param name="_objJobCardPaginationListRequestParam">
        ///  The Job Card List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Job Card list.
        /// </returns>
        [HttpPost, ActionName("GetJobCardList")]
        public async Task<ActionResult<string>> GetJobCardList(SearchJobCardListRequestParam _objJobCardPaginationListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetJobCardList(_ODBCHelper, _objJobCardPaginationListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetJobCardList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Logged In Person Job Card List.
        /// </summary>
        /// <param name="_objLoggedInPersonJobCardPaginationListRequestParam">
        ///  The Logged In Person Job Card List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword, ShortCut and LoginID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Logged In Person Job Card list.
        /// </returns>
        [HttpPost, ActionName("GetLoggedInPersonJobCardList")]
        public async Task<ActionResult<string>> GetLoggedInPersonJobCardList(SearchLoggedInPersonJobCardListRequestParam _objLoggedInPersonJobCardPaginationListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetLoggedInPersonJobCardList(_ODBCHelper, _objLoggedInPersonJobCardPaginationListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetLoggedInPersonJobCardList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Job Card List By Work Order Details.
        /// </summary>
        /// <param name="_objJobCardListByWorkOrderListRequestParam">
        /// To Get Job Card List By Work Order Details Filter Request Parameters Such as Work Order ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Job Card List By Work Order Details.
        /// </returns>
        [HttpPost, ActionName("GetJobCardListByWorkOrder")]
        public async Task<ActionResult<string>> GetJobCardListByWorkOrder(JobCardListByWorkOrderRequestParam _objJobCardListByWorkOrderListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetJobCardListByWorkOrder(_ODBCHelper, _objJobCardListByWorkOrderListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetJobCardListByWorkOrder()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }
        #endregion [Job Card]

        #region [Job Card Daily]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Job Card Daily Details.
        /// </summary>
        /// <param name="_objJobCardDailyRequestParam">
        /// To Save and Update Job Card Daily Details Below mentioned Request Parameters is required Such as JobCardDailyID, JobCardID, QuantityOutput, 
		/// QuantityScrapped, Remarks, PreparedBy, ResponsiblePersonID, UpdatedBy, WorkOrderID, JobStartTime, JobEndTime and ParamType(ADD).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Job Card Daily Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateJobCardDaily")]
        public async Task<ActionResult<string>> SaveAndUpdateJobCardDaily(JobCardDailyRequestParam _objJobCardDailyRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    JobCardDaily _objJobCardDaily = _mapper.Map<JobCardDaily>(_objJobCardDailyRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateJobCardDaily(_ODBCHelper, _objJobCardDaily));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateJobCardDaily()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Job Card Daily Details.
        /// </summary>
        /// <param name="_objJobCardDailyDetailsRequestParam">
        /// To Get Job Card Daily Details Filter Request Parameters Such as Job Card Daily ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Job Card Daily Details.
        /// </returns>
        [HttpPost, ActionName("GetJobCardDailyDetails")]
        public async Task<ActionResult<string>> GetJobCardDailyDetails(JobCardDailyDetailsRequestParam _objJobCardDailyDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetJobCardDailyDetails(_ODBCHelper, _objJobCardDailyDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetJobCardDailyDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Job Card Daily List.
        /// </summary>
        /// <param name="_objJobCardDailyListRequestParam">
        ///  The Job Card Daily List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder and SearchKeyword.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Job Card Daily list.
        /// </returns>
        [HttpPost, ActionName("GetJobCardDailyList")]
        public async Task<ActionResult<string>> GetJobCardDailyList(SearchJobCardDailyListRequestParam _objJobCardDailyListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetJobCardDailyList(_ODBCHelper, _objJobCardDailyListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetJobCardDailyList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Job Card Daily]

        #region [Purchase Order Header]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Purchase Order Header Details.
        /// </summary>
        /// <param name="_objPurchaseOrderHeaderRequestParam">
        /// To Save and Update Purchase Order Header Details Below mentioned Request Parameters is required Such as PurchaseOrderID, PurchaseType, CurrencyID, 
        /// CurrencyConversionRate, SupplierID, GrossPurchaseAmount, FreightAmount, PriceScope, TransportTerms, InsuranceTerms, DocumentStatus,
		/// CustomerReferenceNumber, CustomerDate, OtherReference, TotalIgstAmount, TotalCgstAmount, TotalSgstAmount, ResponsiblePerson, 
		/// ShipAddress, DeliveryInformation, PaymentInformation, Remarks, PreparedBy, UpdatedBy, ApprovedBy, and ParamType(ADD).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Purchase Order Header Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdatePurchaseOrderHeader")]
        public async Task<ActionResult<string>> SaveAndUpdatePurchaseOrderHeader(PurchaseOrderHeaderRequestParam _objPurchaseOrderHeaderRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    PurchaseOrderHeader _objPurchaseOrder = _mapper.Map<PurchaseOrderHeader>(_objPurchaseOrderHeaderRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdatePurchaseOrderHeader(_ODBCHelper, _objPurchaseOrder));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdatePurchaseOrderHeader()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Purchase Order Header Details.
        /// </summary>
        /// <param name="_objPurchaseOrderHeaderDetailsRequestParam">
        /// To Get Purchase Order Header Details Filter Request Parameters Such as Purchase Order ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Purchase Order Header Details.
        /// </returns>
        [HttpPost, ActionName("GetPurchaseOrderHeaderDetails")]
        public async Task<ActionResult<string>> GetPurchaseOrderHeaderDetails(PurchaseOrderHeaderDetailsRequestParam _objPurchaseOrderHeaderDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetPurchaseOrderHeaderDetails(_ODBCHelper, _objPurchaseOrderHeaderDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetPurchaseOrderHeaderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Purchase Order Header List.
        /// </summary>
        /// <param name="_objPurchaseOrderHeaderListRequestParam">
        ///  The Purchase Order Header List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Purchase Order Header list.
        /// </returns>
        [HttpPost, ActionName("GetPurchaseOrderHeaderList")]
        public async Task<ActionResult<string>> GetPurchaseOrderHeaderList(PurchaseOrderHeaderSearchListRequestParam _objPurchaseOrderHeaderListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetPurchaseOrderHeaderList(_ODBCHelper, _objPurchaseOrderHeaderListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetPurchaseOrderHeaderList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Short Close Or Recall Purchase Order Details.
        /// </summary>
        /// <param name="_objShortCloseOrRecallPurchaseOrderDetails">
        /// To Short Close Or Recal Purchase Order Details Filter Request Parameters Such as Purchase Order ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Short Close Or Recal Purchase Order Details.
        /// </returns>
        [HttpPost, ActionName("ShortCloseOrRecallPurchaseOrderDetails")]
        public async Task<ActionResult<string>> ShortCloseOrRecallPurchaseOrderDetails(PurchaseOrderShortCloseORRecall _objShortCloseOrRecallPurchaseOrderDetails)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ShortCloseOrRecallPurchaseOrderDetails(_ODBCHelper, _objShortCloseOrRecallPurchaseOrderDetails));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ShortCloseOrRecallPurchaseOrderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Approve Purchase Order Details.
        /// </summary>
        /// <param name="_objApprovePurchaseOrderHeaderDetails">
        /// To Approve Purchase Order Details Filter Request Parameters Such as PurchaseOrderID and ApprovedBy.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Approved Purchase Order Response.
        /// </returns>
        [HttpPost, ActionName("ApprovePurchaseOrderHeaderDetails")]
        public async Task<ActionResult<string>> ApprovePurchaseOrderHeaderDetails(PurchaseOrderHeaderApproveDetails _objApprovePurchaseOrderHeaderDetails)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ApprovePurchaseOrderHeaderDetails(_ODBCHelper, _objApprovePurchaseOrderHeaderDetails, webHostEnvironment, _mapper));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ApprovePurchaseOrderHeaderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Purchase Order Header PDF.
        /// </summary>
        /// <param name="_objPurchaseOrderHeaderPDF">
        ///  The Purchase Order Header PDF Filter Request Parameters Such as PurchaseOrderID
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Purchase Order Header PDF.
        /// </returns>
        [HttpPost, ActionName("GetPurchaseOrderHeaderPDF")]
        public async Task<ActionResult<string>> GetPurchaseOrderHeaderPDF(PurchaseOrderHeaderPDF _objPurchaseOrderHeaderPDF)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetPurchaseOrderHeaderPDF(_ODBCHelper, _objPurchaseOrderHeaderPDF, webHostEnvironment));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetPurchaseOrderHeaderPDF()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Purchase Order Header]

        #region [Work Order GRN]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Work Order GRN Header Details.
        /// </summary>
        /// <param name="_objWorkOrderGRNRequestParam">
        /// To Save and Update Work Order GRN Header Details Below mentioned Request Parameters is required Such as GRNID, GRNNumber, WorkOrderID, 
		/// SupplierInvoiceReference, SupplierInvoiceDate, Remarks, SupplierID, DocumentStatus, CurrencyID,
        /// PreparedBy, UpdatedBy, GRNDetail and ParamType(ADD).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Work Order GRN Header Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateWorkOrderGRN")]
        public async Task<ActionResult<string>> SaveAndUpdateWorkOrderGRN(GRNHeaderRequestParam _objWorkOrderGRNRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    GRNHeader _objGRNHeader = _mapper.Map<GRNHeader>(_objWorkOrderGRNRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateWorkOrderGRN(_ODBCHelper, _objGRNHeader));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateWorkOrderGRN()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Work Order GRN Header Details.
        /// </summary>
        /// <param name="_objWorkOrderGRNDetailsRequestParam">
        /// To Get Work Order GRN Header Details Filter Request Parameters Such as GRNID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Work Order GRN Header Details.
        /// </returns>
        [HttpPost, ActionName("GetWorkOrderGRNDetails")]
        public async Task<ActionResult<string>> GetWorkOrderGRNDetails(GRNHeaderDetailsRequestParam _objWorkOrderGRNDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetWorkOrderGRNDetails(_ODBCHelper, _objWorkOrderGRNDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetWorkOrderGRNDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Work Order GRN Header List.
        /// </summary>
        /// <param name="_objWorkOrderGRNListRequestParam">
        ///  The Work Order GRN Header List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Work Order GRN Header list.
        /// </returns>
        [HttpPost, ActionName("GetWorkOrderGRNList")]
        public async Task<ActionResult<string>> GetWorkOrderGRNList(GRNHeaderSearchListRequestParam _objWorkOrderGRNListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetWorkOrderGRNList(_ODBCHelper, _objWorkOrderGRNListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetWorkOrderGRNList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Cancel Work Order GRN Details.
        /// </summary>
        /// <param name="_objCancelWorkOrderGRNDetailsDetails">
        /// To Cancel Work Order GRN Details Filter Request Parameters Such as GRNID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Cancel Work Order GRN Details.
        /// </returns>
        [HttpPost, ActionName("CancelWorkOrderGRNDetails")]
        public async Task<ActionResult<string>> CancelWorkOrderGRNDetails(CancelWorkOrderGRNDetails _objCancelWorkOrderGRNDetailsDetails)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.CancelWorkOrderGRNDetails(_ODBCHelper, _objCancelWorkOrderGRNDetailsDetails));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.CancelWorkOrderGRNDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }
        #endregion  [Work Order GRN]

        #region [Purchase Order GRN]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Purchase Order GRN Header Details.
        /// </summary>
        /// <param name="_objPurchaseOrderGRNRequestParam">
        /// To Save and Update Purchase Order GRN Header Details Below mentioned Request Parameters is required Such as GRNID, GRNNumber , PurchaseOrderID, 
        /// SupplierInvoiceReference, SupplierInvoiceDate, Remarks, SupplierID, DocumentStatus, CurrencyID,
        /// PreparedBy, UpdatedBy, GRNDetail and ParamType(ADD).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Purchase Order GRN Header Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdatePurchaseOrderGRN")]
        public async Task<ActionResult<string>> SaveAndUpdatePurchaseOrderGRN(PurchaseOrderGRNHeaderRequestParam _objPurchaseOrderGRNRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    PurchaseOrderGRNHeader _objPurchaseOrderGRNHeader = _mapper.Map<PurchaseOrderGRNHeader>(_objPurchaseOrderGRNRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdatePurchaseOrderGRN(_ODBCHelper, _objPurchaseOrderGRNHeader));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdatePurchaseOrderGRN()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Purchase Order GRN Header Details.
        /// </summary>
        /// <param name="_objPurchaseOrderGRNDetailsRequestParam">
        /// To Get Purchase Order GRN Header Details Filter Request Parameters Such as GRNID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Purchase Order GRN Header Details.
        /// </returns>
        [HttpPost, ActionName("GetPurchaseOrderGRNHeaderDetails")]
        public async Task<ActionResult<string>> GetPurchaseOrderGRNHeaderDetails(PurchaseOrderGRNDetailsRequestParam _objPurchaseOrderGRNDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetPurchaseOrderGRNHeaderDetails(_ODBCHelper, _objPurchaseOrderGRNDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetPurchaseOrderGRNHeaderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Purchase Order GRN Header List.
        /// </summary>
        /// <param name="_objPurchaseOrderGRNListRequestParam">
        ///  The Purchase Order GRN Header List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Purchase Order GRN Header list.
        /// </returns>
        [HttpPost, ActionName("GetPurchaseOrderGRNHeaderList")]
        public async Task<ActionResult<string>> GetPurchaseOrderGRNHeaderList(PurchaseOrderGRNSearchListRequestParam _objPurchaseOrderGRNListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetPurchaseOrderGRNHeaderList(_ODBCHelper, _objPurchaseOrderGRNListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetPurchaseOrderGRNHeaderList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Purchase Order Or Work Order GRN PDF.
        /// </summary>
        /// <param name="_objPurchaseOrderOrWorkOrderGRNDetailsRequestParam">
        /// To Get Purchase Order GRN PDF Details Filter Request Parameters Such as GRNID and Source (PurchaseOrderGRN Or WorkOrderGRN).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Purchase Order Or Work Order GRN PDF Base64.
        /// </returns>
        [HttpPost, ActionName("GetPurchaseOrderOrWorkOrderGRNPDF")]
        public async Task<ActionResult<string>> GetPurchaseOrderOrWorkOrderGRNPDF(PurchaseOrderOrWorkOrderGRNDetailsRequestParam _objPurchaseOrderOrWorkOrderGRNDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetPurchaseOrderOrWorkOrderGRNPDF(_ODBCHelper, _objPurchaseOrderOrWorkOrderGRNDetailsRequestParam, webHostEnvironment));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetPurchaseOrderOrWorkOrderGRNPDF()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Purchase Order GRN]

        #region [Goods Inspection Note]

        /// <summary>
        /// This Post Action Method Is Used To Get Goods  Details.
        /// </summary>
        /// <param name="_objGoodsInspectionGRNDetailsRequestParam">
        /// To Get Goods Inspection Details Filter Request Parameters Such as GRNID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Goods Inspection Details.
        /// </returns>
        [HttpPost, ActionName("GetGoodsInspectionGRNHeaderDetails")]
        public async Task<ActionResult<string>> GetGoodsInspectionGRNHeaderDetails(GoodsInspectionDetailsRequestParam _objGoodsInspectionGRNDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetGoodsInspectionGRNHeaderDetails(_ODBCHelper, _objGoodsInspectionGRNDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetGoodsInspectionGRNHeaderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Goods Inspection List.
        /// </summary>
        /// <param name="_objGoodsInspectionGRNListRequestParam">
        ///  The Goods Inspection List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Goods Inspection list.
        /// </returns>
        [HttpPost, ActionName("GetGoodsInspectionGRNHeaderList")]
        public async Task<ActionResult<string>> GetGoodsInspectionGRNHeaderList(GoodsInspectionGRNSearchListRequestParam _objGoodsInspectionGRNListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetGoodsInspectionGRNHeaderList(_ODBCHelper, _objGoodsInspectionGRNListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetGoodsInspectionGRNHeaderList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Update Goods Inspection Note.
        /// </summary>
        /// <param name="lstUpdateGoodsInspectionNote">
        /// To Update Goods Inspection Note Filter Request Parameters Such as GRNLineID, QuantityRejected, QuantityRejectedReason, QuantityTestingRejected, QAStatus,
        /// QACheckedBy and QACheckedDate.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Update Goods Inspection Note Response.
        /// </returns>
        [HttpPost, ActionName("UpdateGoodsInspectionNote")]
        public async Task<ActionResult<string>> UpdateGoodsInspectionNote(List<UpdateGoodsInspectionNote> lstUpdateGoodsInspectionNote)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.UpdateGoodsInspectionNote(_ODBCHelper, lstUpdateGoodsInspectionNote));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.UpdateGoodsInspectionNote()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Goods Inspection Note]

        #region [Quotation]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Quotation Details.
        /// </summary>
        /// <param name="_objQuotationRequestParam">
        /// To Save and Update Quotation Details Below mentioned Request Parameters is required Such as QuotationID, QuotationNumber, QuotationAmount, 
        /// OtherReference, CustomerID, CustomerEnquiryReference, CustomerEnquiryDate, CustomerRequiredDate, PriceScope, CurrencyID, KindAttentionName,
        /// ContactNumber, QuotationNotes, QuotationValidityDays, DocumentStatus, FollowupDate, DocumentDeliveryMode, TransportMode, 
        /// PaymentTerms, FreightTerms, InsuranceTerms, TotalNetAmount, TotalIgstAmount, TotalCgstAmount, TotalSgstAmount, PreparedBy, UpdatedBy, ApprovedBy, 
        /// QuotationDetail and ParamType(ADD).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Quotation Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateQuotationDetails")]
        public async Task<ActionResult<string>> SaveAndUpdateQuotationDetails(QuotationRequestParam _objQuotationRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    Quotation _objQuotation = _mapper.Map<Quotation>(_objQuotationRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateQuotationDetails(_ODBCHelper, _objQuotation));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateQuotationDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Quotation Details.
        /// </summary>
        /// <param name="_objQuotationDetailsRequestParam">
        /// To Get Quotation Details Filter Request Parameters Such as Quotation ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Quotation Details.
        /// </returns>
        [HttpPost, ActionName("GetQuotationDetails")]
        public async Task<ActionResult<string>> GetQuotationDetails(QuotationDetailsRequestParam _objQuotationDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetQuotationDetails(_ODBCHelper, _objQuotationDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetQuotationDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Quotation List.
        /// </summary>
        /// <param name="_objQuotationListRequestParam">
        ///  The Quotation List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Quotation list.
        /// </returns>
        [HttpPost, ActionName("GetQuotationList")]
        public async Task<ActionResult<string>> GetQuotationList(QuotationSearchListRequestParam _objQuotationListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetQuotationList(_ODBCHelper, _objQuotationListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetQuotationList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Short Close Or Recall Quotation Details.
        /// </summary>
        /// <param name="_objQuotationShortCloseORRecall">
        /// To Short Close Or Recall Quotation Details Filter Request Parameters Such as Quotation ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Short Close Or Recall Quotation Details.
        /// </returns>
        [HttpPost, ActionName("ShortCloseOrRecallQuotationDetails")]
        public async Task<ActionResult<string>> ShortCloseOrRecallQuotationDetails(QuotationShortCloseORRecall _objQuotationShortCloseORRecall)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ShortCloseOrRecallQuotationDetails(_ODBCHelper, _objQuotationShortCloseORRecall));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ShortCloseOrRecallQuotationDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Approve Quotation Details.
        /// </summary>
        /// <param name="_objApproveQuotationDetails">
        /// To Approve Quotation Details Filter Request Parameters Such as Quotation ID and ApprovedBy.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Approved Quotation Response.
        /// </returns>
        [HttpPost, ActionName("ApproveQuotationDetails")]
        public async Task<ActionResult<string>> ApproveQuotationDetails(QuotationApproveDetails _objApproveQuotationDetails)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ApproveQuotationDetails(_ODBCHelper, _objApproveQuotationDetails));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ApproveQuotationDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Quotation Header PDF.
        /// </summary>
        /// <param name="_objQuotationHeaderPDF">
        ///  The Quotation Header PDF Filter Request Parameters Such as QuotationID
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Quotation Header PDF.
        /// </returns>
        [HttpPost, ActionName("GetQuotationHeaderPDF")]
        public async Task<ActionResult<string>> GetQuotationHeaderPDF(QuotationHeaderPDF _objQuotationHeaderPDF)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetQuotationHeaderPDF(_ODBCHelper, _objQuotationHeaderPDF, webHostEnvironment));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetQuotationHeaderPDF()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Quotation]

        #region [Inspection]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Inspection Details.
        /// </summary>
        /// <param name="_objInspectionRequestParam">
        /// To Save and Update Inspection Details Below mentioned Request Parameters is required Such as InspectionHeaderID, GRNLineID, GRNID, 
        /// ItemID, ItemType, BatchNo, QuantityOfferedForInspection, QuantityRejected, QuantityAccepted, QuantityTestingRejected, QuantityRejectedReason,
        /// QAStatus, QACheckedBy, QACheckedDate, QANotes, PreparedBy, UpdatedBy, InspectionDetail, InspectionObservation and ParamType(ADD).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Inspection Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateInspectionDetails")]
        public async Task<ActionResult<string>> SaveAndUpdateInspectionDetails(InspectionRequestParam _objInspectionRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    InspectionHeader _objInspectionHeader = _mapper.Map<InspectionHeader>(_objInspectionRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateInspectionDetails(_ODBCHelper, _objInspectionHeader));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateInspectionDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Inspection Details.
        /// </summary>
        /// <param name="_objInspectionDetailsRequestParam">
        /// To Get Inspection Details Filter Request Parameters Such as Inspection Header ID and GRN Line ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Inspection Details.
        /// </returns>
        [HttpPost, ActionName("GetInspectionDetails")]
        public async Task<ActionResult<string>> GetInspectionDetails(InspectionDetailsRequestParam _objInspectionDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetInspectionDetails(_ODBCHelper, _objInspectionDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetInspectionDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Inspection Observation Details.
        /// </summary>
        /// <param name="_objInspectionObservationDetailsRequestParam">
        /// To Get Inspection Details Filter Request Parameters Such as Inspection Line ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Inspection Observation Details.
        /// </returns>
        [HttpPost, ActionName("GetInspectionObservationDetails")]
        public async Task<ActionResult<string>> GetInspectionObservationDetails(InspectionObservationDetailsRequestParam _objInspectionObservationDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetInspectionObservationDetails(_ODBCHelper, _objInspectionObservationDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetInspectionObservationDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Approve Inspection Details.
        /// </summary>
        /// <param name="_objApproveInspectionDetailsRequestParam">
        /// To Approve Inspection Details Filter Request Parameters Such as Inspection Header ID and ApprovedBy.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Approved Inspection Response.
        /// </returns>
        [HttpPost, ActionName("ApproveInspectionDetails")]
        public async Task<ActionResult<string>> ApproveInspectionDetails(ApproveInspectionDetailsRequestParam _objApproveInspectionDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ApproveInspectionDetails(_ODBCHelper, _objApproveInspectionDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ApproveInspectionDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Inspection]

        #region [Order]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Order Details.
        /// </summary>
        /// <param name="_objOrderRequestParam">
        /// To Save and Update Order Details Below mentioned Request Parameters is required Such as OrderID, OrderNumber, OrderAmount, 
        /// CustomerID, CustomerPurchaseOrderReference, CustomerPurchaseOrderDate, CustomerBillingAddressLine1, CustomerBillingAddressLine2, 
        /// CustomerBillingPinCode, CustomerShippingAddressLine1, CustomerShippingAddressLine2, CustomerShippingPinCode, 
        /// PriceScope, CurrencyID, KindAttentionName, ContactNumber, OrderNotes, DocumentStatus, DocumentDeliveryMode, TransportMode, 
        /// PaymentTerms, FreightTerms, InsuranceTerms, PreparedBy, UpdatedBy, ApprovedBy, OrderDetail and ParamType(ADD).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Order Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateOrderDetails")]
        public async Task<ActionResult<string>> SaveAndUpdateOrderDetails(OrderRequestParam _objOrderRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    Order _objOrder = _mapper.Map<Order>(_objOrderRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateOrderDetails(_ODBCHelper, _objOrder));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateOrderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Order Details.
        /// </summary>
        /// <param name="_objOrderDetailsRequestParam">
        /// To Get Order Details Filter Request Parameters Such as Order ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Order Details.
        /// </returns>
        [HttpPost, ActionName("GetOrderDetails")]
        public async Task<ActionResult<string>> GetOrderDetails(OrderDetailsRequestParam _objOrderDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetOrderDetails(_ODBCHelper, _objOrderDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetOrderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Order List.
        /// </summary>
        /// <param name="_objOrderListRequestParam">
        ///  The Order List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Order list.
        /// </returns>
        [HttpPost, ActionName("GetOrderList")]
        public async Task<ActionResult<string>> GetOrderList(OrderSearchListRequestParam _objOrderListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetOrderList(_ODBCHelper, _objOrderListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetOrderList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Short Close Or Recall Order Details.
        /// </summary>
        /// <param name="_objOrderShortCloseORRecall">
        /// To Short Close Or Recall Order Details Filter Request Parameters Such as Order ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Short Close Or Recall Order Details.
        /// </returns>
        [HttpPost, ActionName("ShortCloseOrRecallOrderDetails")]
        public async Task<ActionResult<string>> ShortCloseOrRecallOrderDetails(OrderShortCloseORRecall _objOrderShortCloseORRecall)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ShortCloseOrRecallOrderDetails(_ODBCHelper, _objOrderShortCloseORRecall));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ShortCloseOrRecallOrderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Approve Order Details.
        /// </summary>
        /// <param name="_objApproveOrderDetails">
        /// To Approve Order Details Filter Request Parameters Such as Order ID and ApprovedBy.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Approved Order Response.
        /// </returns>
        [HttpPost, ActionName("ApproveOrderDetails")]
        public async Task<ActionResult<string>> ApproveOrderDetails(OrderApproveDetails _objApproveOrderDetails)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ApproveOrderDetails(_ODBCHelper, _objApproveOrderDetails));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ApproveOrderDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Order]

        #region [Store Request]

        /// <summary>
        /// This Post Action Method Is Used To Get Stock In Store Request List.
        /// </summary>
        /// <param name="_objStoreRequestHeaderSearchListRequestParam">
        ///  The Stock In Store Request List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Stock In Store Request list.
        /// </returns>
        [HttpPost, ActionName("GetStockInStoreRequestList")]
        public async Task<ActionResult<string>> GetStockInStoreRequestList(StoreRequestHeaderSearchListRequestParam _objStoreRequestHeaderSearchListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetStockInStoreRequestList(_ODBCHelper, _objStoreRequestHeaderSearchListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetStockInStoreRequestList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Stock Out Store Request List.
        /// </summary>
        /// <param name="_objStoreRequestHeaderSearchListRequestParam">
        ///  The Stock Out Store Request List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Stock Out Store Request list.
        /// </returns>
        [HttpPost, ActionName("GetStockOutStoreRequestList")]
        public async Task<ActionResult<string>> GetStockOutStoreRequestList(StoreRequestHeaderSearchListRequestParam _objStoreRequestHeaderSearchListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetStockOutStoreRequestList(_ODBCHelper, _objStoreRequestHeaderSearchListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetStockOutStoreRequestList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Store Request]

        #region [Batch Details]

        /// <summary>
        /// This Post Action Method Is Used To Save and Update Batch Details.
        /// </summary>
        /// <param name="_lstBatchDetail">
        /// To Save and Update Batch Details Filter Request Parameters Such as BatchLineID, WorkOrderID, WorkOrderLineID, JobCardID, PurchaseOrderID, PurchaseOrderLineID, GRNID, GRNLineID,
        /// DeliveryNoteID, DeliveryNoteLineID, TransactionDate, TransactionType, StockEffect, StoreRequestID, StoreRequestLineID, BatchID, LocationID, QuantityReceived,
        /// QuantityIssued, ItemID, ItemType, TransactionBy and Remarks.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Save and Update Batch Details Response.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateBatchDetails")]
        public async Task<ActionResult<string>> SaveAndUpdateBatchDetails(List<BatchDetail> _lstBatchDetail)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateBatchDetails(_ODBCHelper, _lstBatchDetail));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateBatchDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Batch Details By Store Request.
        /// </summary>
        /// <param name="_objGetBatchDetailRequestParam">
        /// To Get Batch Details By Store Request Filter Request Parameters Such as StoreRequestLineID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Batch Details By Store Request Response.
        /// </returns>
        [HttpPost, ActionName("GetBatchDetailByStoreRequest")]
        public async Task<ActionResult<string>> GetBatchDetailByStoreRequest(GetBatchDetailRequestParam _objGetBatchDetailRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetBatchDetailByStoreRequest(_ODBCHelper, _objGetBatchDetailRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetBatchDetailByStoreRequest()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Batch Details]

        #region [Batch Master]

        /// <summary>
        /// This Post Action Method Is Used To Get Current Stock List.
        /// </summary>
        /// <param name="_objCurrentStockSearchListRequestParam">
        ///  To Get The Current Stock List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Current Stock list.
        /// </returns>
        [HttpPost, ActionName("GetCurrentStockList")]
        public async Task<ActionResult<string>> GetCurrentStockList(CurrentStockSearchListRequestParam _objCurrentStockSearchListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetCurrentStockList(_ODBCHelper, _objCurrentStockSearchListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetCurrentStockList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Batch Master]

        #region [Stock Adjustment Request]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objStockAdjustmentRequestHeaderParam">
        /// To Save and Update Stock Adjustment Request Details Below mentioned Request Parameters is required Such as AdjustmentID, AdjustmentNumber, FromLocationID, 
        /// ToLocationID, AdjustmentType, AdjustmentReasonID, RequestStatus, RequestedBy, Remarks, StockAdjustmentRequestDetail and ParamType(ADD).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Stock Adjustment Request Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateStockAdjustmentRequestDetails")]
        public async Task<ActionResult<string>> SaveAndUpdateStockAdjustmentRequestDetails(StockAdjustmentRequestHeaderParam _objStockAdjustmentRequestHeaderParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    StockAdjustmentRequestHeader _objStockAdjustmentRequestHeader = _mapper.Map<StockAdjustmentRequestHeader>(_objStockAdjustmentRequestHeaderParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateStockAdjustmentRequestDetails(_ODBCHelper, _objStockAdjustmentRequestHeader));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateStockAdjustmentRequestDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objStockAdjustmentRequestHeaderDetailsRequestParam">
        /// To Get Stock Adjustment Request Details Filter Request Parameters Such as Adjustment ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Stock Adjustment Request Details.
        /// </returns>
        [HttpPost, ActionName("GetStockAdjustmentRequestDetails")]
        public async Task<ActionResult<string>> GetStockAdjustmentRequestDetails(StockAdjustmentRequestHeaderDetailsRequestParam _objStockAdjustmentRequestHeaderDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetStockAdjustmentRequestDetails(_ODBCHelper, _objStockAdjustmentRequestHeaderDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetStockAdjustmentRequestDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Stock Adjustment Request List.
        /// </summary>
        /// <param name="_objStockAdjustmentRequestHeaderSearchListRequestParam">
        ///  To Get The Stock Adjustment Request List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Stock Adjustment Request List.
        /// </returns>
        [HttpPost, ActionName("GetStockAdjustmentRequestList")]
        public async Task<ActionResult<string>> GetStockAdjustmentRequestList(StockAdjustmentRequestHeaderSearchListRequestParam _objStockAdjustmentRequestHeaderSearchListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetStockAdjustmentRequestList(_ODBCHelper, _objStockAdjustmentRequestHeaderSearchListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetStockAdjustmentRequestList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Approve Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objApproveStockAdjustmentRequestDetailsRequestParam">
        /// To Approve Stock Adjustment Request Details Filter Request Parameters Such as AdjustmentID and ApprovedBy.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Approved Stock Adjustment Request Response.
        /// </returns>
        [HttpPost, ActionName("ApproveStockAdjustmentRequestDetails")]
        public async Task<ActionResult<string>> ApproveStockAdjustmentRequestDetails(ApproveStockAdjustmentRequestDetailsRequestParam _objApproveStockAdjustmentRequestDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ApproveStockAdjustmentRequestDetails(_ODBCHelper, _objApproveStockAdjustmentRequestDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ApproveStockAdjustmentRequestDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Cancel Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objCancelStockAdjustmentRequestDetailsRequestParam">
        /// To Cancel Stock Adjustment Request Details Filter Request Parameters Such as AdjustmentID and CancelledBy.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Cancel Stock Adjustment Request Response.
        /// </returns>
        [HttpPost, ActionName("CancelStockAdjustmentRequestDetails")]
        public async Task<ActionResult<string>> CancelStockAdjustmentRequestDetails(CancelStockAdjustmentRequestDetailsRequestParam _objCancelStockAdjustmentRequestDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.CancelStockAdjustmentRequestDetails(_ODBCHelper, _objCancelStockAdjustmentRequestDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.CancelStockAdjustmentRequestDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Stock Adjustment Request]

        #region [Delivery Note]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Delivery Note Details.
        /// </summary>
        /// <param name="_objDeliveryNoteRequestParam">
        /// To Save and Update Delivery Note Details Below mentioned Request Parameters is required Such as DeliveryNoteID, DeliveryNoteNo, DeliveryNoteDate, 
        /// CustomerID, CustomerBillingAddressLine1, CustomerBillingAddressLine2, CustomerBillingPinCode, CustomerShippingAddressLine1, CustomerShippingAddressLine2, CustomerShippingPinCode, VehicleNumber,
        /// EwayBillNumber, GSTStateCode, EwayBillDate, EwayBillURL, EwayBillValidUpto, ShipmentDistanceKilometer, BillToGSTINNumber, 
        /// TransporterName, TransporterGSTINNumber, ShipToTradeName, ShipToGSTINNumber, TransactionType, CurrencyID, KindAttentionName, 
        /// ContactNumber, DocumentStatus, TotalIGSTAmount, TotalCGSTAmount, TotalSGSTAmount, TotalNetAmount, DeliveryNoteAmount, PreparedBy,
        /// UpdatedBy, DeliveryNoteDetail and ParamType(ADD).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Delivery Note Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateDeliveryNote")]
        public async Task<ActionResult<string>> SaveAndUpdateDeliveryNote(DeliveryNoteRequestParam _objDeliveryNoteRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    DeliveryNoteHeader _objDeliveryNote = _mapper.Map<DeliveryNoteHeader>(_objDeliveryNoteRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateDeliveryNoteDetails(_ODBCHelper, _objDeliveryNote));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateDeliveryNote()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Delivery Note Details.
        /// </summary>
        /// <param name="_objDeliveryNoteDetailsRequestParam">
        /// To Get Delivery Note Details Filter Request Parameters Such as Delivery Note ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Delivery Note Details.
        /// </returns>
        [HttpPost, ActionName("GetDeliveryNoteDetails")]
        public async Task<ActionResult<string>> GetDeliveryNoteDetails(DeliveryNoteDetailsRequestParam _objDeliveryNoteDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetDeliveryNoteDetails(_ODBCHelper, _objDeliveryNoteDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetDeliveryNoteDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Delivery Note List.
        /// </summary>
        /// <param name="_objDeliveryNoteListRequestParam">
        ///  The Delivery Note List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Delivery Note list.
        /// </returns>
        [HttpPost, ActionName("GetDeliveryNoteList")]
        public async Task<ActionResult<string>> GetDeliveryNoteList(DeliveryNoteSearchListRequestParam _objDeliveryNoteListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetDeliveryNoteList(_ODBCHelper, _objDeliveryNoteListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetDeliveryNoteList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Approve Delivery Note Details.
        /// </summary>
        /// <param name="_objApproveDeliveryNoteDetails">
        /// To Approve Delivery Note Details Filter Request Parameters Such as DeliveryNoteID and ApprovedBy.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Approved Delivery Note Response.
        /// </returns>
        [HttpPost, ActionName("ApproveDeliveryNoteDetails")]
        public async Task<ActionResult<string>> ApproveDeliveryNoteDetails(ApproveDeliveryNoteDetails _objApproveDeliveryNoteDetails)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ApproveDeliveryNoteDetails(_ODBCHelper, _objApproveDeliveryNoteDetails));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ApproveDeliveryNoteDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Short Close Delivery Note Details.
        /// </summary>
        /// <param name="_objShortCloseDeliveryNoteDetails">
        /// To Short Close Delivery Note Details Filter Request Parameters Such as DeliveryNoteID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Short Closed Delivery Note Response.
        /// </returns>
        [HttpPost, ActionName("ShortCloseDeliveryNoteDetails")]
        public async Task<ActionResult<string>> ShortCloseDeliveryNoteDetails(ShortCloseDeliveryNoteDetails _objShortCloseDeliveryNoteDetails)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ShortCloseDeliveryNoteDetails(_ODBCHelper, _objShortCloseDeliveryNoteDetails));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ShortCloseDeliveryNoteDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Delivery Note]

        #region [Inventory Transaction Log]

        /// <summary>
        /// This Post Action Method Is Used To Get Inventory Transaction Log List.
        /// </summary>
        /// <param name="_objInventoryTransactionLogSearchListRequestParam">
        ///  To Get Inventory Transaction Log List Filter Request Parameters Such as ItemCode, FromDate, ToDate, Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder and SearchKeyword.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Inventory Transaction Log List.
        /// </returns>
        [HttpPost, ActionName("GetInventoryTransactionLogList")]
        public async Task<ActionResult<string>> GetInventoryTransactionLogList(InventoryTransactionLogSearchListRequestParam _objInventoryTransactionLogSearchListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetInventoryTransactionLogList(_ODBCHelper, _objInventoryTransactionLogSearchListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetInventoryTransactionLogList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Inventory Transaction Log]

        #region [Supplier Items]

        /// <summary>
        ///  This Post Action Method Is Used To Save and Update Supplier Items Details.
        /// </summary>
        /// <param name="_objSupplierItemsRequestParam">
        /// To Save and Update Supplier Items Details Below mentioned Request Parameters is required Such as SupplierItemID, ItemID, SupplierID, 
        /// ValidToDate, SupplierItemCode, CurrencyID, UnitRate, DocumentStatus, PurchaseNotes, PreparedBy, UpdatedBy and ParamType (ADD).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Supplier Items Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateSupplierItem")]
        public async Task<ActionResult<string>> SaveAndUpdateSupplierItem(SupplierItemsRequestParam _objSupplierItemsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    SupplierItems _objSupplierItems = _mapper.Map<SupplierItems>(_objSupplierItemsRequestParam);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.SaveAndUpdateSupplierItemDetails(_ODBCHelper, _objSupplierItems));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateSupplierItem()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Supplier Items Details.
        /// </summary>
        /// <param name="_objSupplierItemsDetailsRequestParam">
        /// To Get Supplier Items Details Filter Request Parameters Such as SupplierItemID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Supplier Items Details.
        /// </returns>
        [HttpPost, ActionName("GetSupplierItemDetails")]
        public async Task<ActionResult<string>> GetSupplierItemDetails(SupplierItemsDetailsRequestParam _objSupplierItemsDetailsRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetSupplierItemDetails(_ODBCHelper, _objSupplierItemsDetailsRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetSupplierItemDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Supplier Items List.
        /// </summary>
        /// <param name="_objSupplierItemsSearchListRequestParam">
        ///  The Supplier Items List Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Supplier Items list.
        /// </returns>
        [HttpPost, ActionName("GetSupplierItemList")]
        public async Task<ActionResult<string>> GetSupplierItemList(SupplierItemsSearchListRequestParam _objSupplierItemsSearchListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetSupplierItemList(_ODBCHelper, _objSupplierItemsSearchListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetSupplierItemList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Supplier Master List In Supplier Item.
        /// </summary>
        /// <param name="_objSearchSupplierMasterListRequestParam">
        /// To Get Supplier Master List In Supplier Item Filter Request Parameters Such as Page Size, Page Number, ColumnName, IsGlobalSearch (0 or 1), SortOrder, SearchKeyword and ShortCut.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered Supplier Master List in Supplier Item.
        /// </returns>
        [HttpPost, ActionName("GetSupplierMasterListInSupplierItemByPagination")]
        public async Task<ActionResult<string>> GetSupplierMasterListInSupplierItemByPagination(SearchSupplierMasterListRequestParam _objSearchSupplierMasterListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.GetSupplierMasterListInSupplierItem(_ODBCHelper, _objSearchSupplierMasterListRequestParam));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetSupplierMasterListInSupplierItemByPagination()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Approve Supplier Items Details.
        /// </summary>
        /// <param name="_objApproveSupplierItemsDetails">
        /// To Approve Supplier Items Details Filter Request Parameters Such as SupplierItemID and ApprovedBy.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Approved Supplier Items Response.
        /// </returns>
        [HttpPost, ActionName("ApproveSupplierItemDetails")]
        public async Task<ActionResult<string>> ApproveSupplierItemDetails(ApproveSupplierItemsDetails _objApproveSupplierItemsDetails)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IMasterSvc.ApproveSupplierItemDetails(_ODBCHelper, _objApproveSupplierItemsDetails));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
                else
                {
                    ReturnResult = ModelErrorValidation.ConvertModelErrorsToJson(ModelState);
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return NotFound();
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ApproveSupplierItemDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Supplier Items]
    }
}
