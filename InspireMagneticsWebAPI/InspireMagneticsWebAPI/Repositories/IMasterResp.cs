using System.Data;
using System.Data.Odbc;
using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;
using AutoMapper;
using CommonLib;
using CommonLib.Constants;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;
using Newtonsoft.Json.Linq;
using static CommonLib.CONST;
using SendEmailRequestParam = InspireMagneticsWebAPI.Models.SendEmailRequestParam;

namespace InspireMagneticsWebAPI.Repositories
{
    public class IMasterResp : IMaster
    {
        private readonly string IMasterRespLogClassName = "IMasterResp";

        #region [Dropdown Data]

        /// <summary>
        /// This Method Is Used To Get Dropdown Data.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objDropdownData"></param>
        /// <returns></returns>
        public async Task<DataSet> GetDropDownData(ODBCHelper _objODBCHelper, DropdownData _objDropdownData)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                var parameters = new List<(string, OdbcType, object, int?)>
                {
                    ("SourceTable",      OdbcType.NVarChar, _objDropdownData.SourceTable, 150),
                    ("ArgumentValue", OdbcType.NVarChar, _objDropdownData.ArgumentValue, 150),
                    ("ArgumentValue1", OdbcType.NVarChar, _objDropdownData.ArgumentValue1, 150)
                };

                finalDataSet = await _objODBCHelper.ExecuteStoredProcedureWithMultipleParameters(StoredProcedure.DROPDOWN_ITEMS, parameters);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "DROPDOWN_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetDropDownData()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

		#endregion [Dropdown Data]

		#region [GST Master]

		/// <summary>
		/// This Method Is Used To Save and Update GST Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_lstGSTMaster"></param>
		/// <returns></returns>
		public async Task<DataSet> SaveAndUpdateGSTMaster(ODBCHelper _objODBCHelper, List<GSTMaster> _lstGSTMaster)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_lstGSTMaster);
				if (!IsEmpty)
				{
					if (_lstGSTMaster != null && _lstGSTMaster.Count > 0)
					{
						var parameters = new List<(string, OdbcType, object, int?)>
						{
							("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
						};

						finalDataSet = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(_lstGSTMaster, _lstGSTMaster.GetType(), _lstGSTMaster, Helper.XML_PARAMS, StoredProcedure.GST_MASTER, parameters);
					}
				}

				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "GST_MASTER_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateGSTMaster()", ex.Message, false);
				throw;
			}

			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Get GST Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objGSTMasterDetailsRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetGSTMasterDetails(ODBCHelper _objODBCHelper, GSTMasterDetailsRequestParam _objGSTMasterDetailsRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				GSTMaster _objGSTMaster = new GSTMaster();
				_objGSTMaster.GSTID = _objGSTMasterDetailsRequestParam.GSTID;
				var parameters = new List<(string, OdbcType, object, int?)>
				{
					("ParamType", OdbcType.NVarChar, "GetGSTMasterDetails", 100)
				};
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objGSTMaster, Helper.XML_PARAMS, StoredProcedure.GST_MASTER, parameters);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "GST_MASTER_DETAILS");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetGSTMasterDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Get GST Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objGSTMasterListRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetGSTMasterList(ODBCHelper _objODBCHelper, GSTMasterListRequestParam _objGSTMasterListRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				GSTMaster _objGSTMaster = new GSTMaster();
				_objGSTMaster.PageSize = _objGSTMasterListRequestParam.PageSize;
				_objGSTMaster.PageNumber = _objGSTMasterListRequestParam.PageNumber;
				var parameters = new List<(string, OdbcType, object, int?)>
				{
					("ParamType", OdbcType.NVarChar, "GetGSTMasterListByPagination", 100)
				};
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objGSTMaster, Helper.XML_PARAMS, StoredProcedure.GST_MASTER, parameters);
				finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<GSTMasterListRequestParam>(_objGSTMasterListRequestParam, finalDataSet, "TOTAL_RECORDS", "GST_MASTER_LIST");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetGSTMasterList()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		#endregion [GST Master]

		#region [HSN Master]

		/// <summary>
		/// This Method Is Used To Save and Update HSN Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_lstHSNMaster"></param>
		/// <returns></returns>
		public async Task<DataSet> SaveAndUpdateHSNMaster(ODBCHelper _objODBCHelper, List<HSNMaster> _lstHSNMaster)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_lstHSNMaster);
				if (!IsEmpty)
				{
					if (_lstHSNMaster != null && _lstHSNMaster.Count > 0)
					{
						var parameters = new List<(string, OdbcType, object, int?)>
						{
							("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
						};

						finalDataSet = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(_lstHSNMaster, _lstHSNMaster.GetType(), _lstHSNMaster, Helper.XML_PARAMS, StoredProcedure.HSN_MASTER, parameters);
					}
				}

				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "HSN_MASTER_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateHSNMaster()", ex.Message, false);
				throw;
			}

			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Get HSN Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objHSNMasterDetailsRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetHSNMasterDetails(ODBCHelper _objODBCHelper, HSNMasterDetailsRequestParam _objHSNMasterDetailsRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				HSNMaster _objHSNMaster = new HSNMaster();
				_objHSNMaster.HSNID = _objHSNMasterDetailsRequestParam.HSNID;
				var parameters = new List<(string, OdbcType, object, int?)>
				{
					("ParamType", OdbcType.NVarChar, "GetHSNMasterDetails", 100)
				};
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objHSNMaster, Helper.XML_PARAMS, StoredProcedure.HSN_MASTER, parameters);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "HSN_MASTER_DETAILS");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetHSNMasterDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}
		/// <summary>
		/// This Method is Used to Get HSN Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objHSNMasterListRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetHSNMasterList(ODBCHelper _objODBCHelper, HSNMasterListRequestParam _objHSNMasterListRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				HSNMaster _objHSNMaster = new HSNMaster();
				_objHSNMaster.PageSize = _objHSNMasterListRequestParam.PageSize;
				_objHSNMaster.PageNumber = _objHSNMasterListRequestParam.PageNumber;
				var parameters = new List<(string, OdbcType, object, int?)>
				{
					("ParamType", OdbcType.NVarChar, "GetHSNMasterListByPagination", 100)
				};
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objHSNMaster, Helper.XML_PARAMS, StoredProcedure.HSN_MASTER, parameters);
				finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<HSNMasterListRequestParam>(_objHSNMasterListRequestParam, finalDataSet, "TOTAL_RECORDS", "HSN_MASTER_LIST");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetHSNMasterList()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		#endregion [HSN Master]

		#region [FG Inventory]

		/// <summary>
		/// This Method Is Used To Save and Update FG Inventory Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objFGInventory"></param>
		/// <returns></returns>
		public async Task<DataSet> SaveAndUpdateFGInventory(ODBCHelper _objODBCHelper, FGInventory _objFGInventory)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objFGInventory, Helper.XML_PARAMS, StoredProcedure.FG_INVENTORY);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "FG_INVENTORY_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateFGInventory()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Get FG Inventory Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objFGInventoryDetailsRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetFGInventoryDetails(ODBCHelper _objODBCHelper, FGInventoryDetailsRequestParam _objFGInventoryDetailsRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				FGInventory _objFGInventory = new FGInventory();
				_objFGInventory.FGItemID = _objFGInventoryDetailsRequestParam.FGItemID;
				_objFGInventory.ParamType = "GetFGInventoryDetails";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objFGInventory, Helper.XML_PARAMS, StoredProcedure.FG_INVENTORY);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "FG_INVENTORY_DETAILS_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetFGInventoryDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method Is Used To Delete FG Inventory Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteFGInventoryItem"></param>
		/// <returns></returns>
		public async Task<DataSet> DeleteFGInventory(ODBCHelper _objODBCHelper, DeleteFGInventoryItem _objDeleteFGInventoryItem)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				FGInventory _objFGInventory = new FGInventory();
				_objFGInventory.FGItemID = _objDeleteFGInventoryItem.FGItemID;
				_objFGInventory.ParamType = "DeleteFGInventoryItem";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objFGInventory, Helper.XML_PARAMS, StoredProcedure.FG_INVENTORY);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "FG_INVENTORY_DELETE_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.DeleteFGInventory()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Get FG Inventory List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objFGSearchInventoryListRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetFGInventoryList(ODBCHelper _objODBCHelper, FGSearchInventoryListRequestParam _objFGSearchInventoryListRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				FGInventory _objFGInventory = new FGInventory();
				_objFGInventory.PageSize = _objFGSearchInventoryListRequestParam.PageSize;
				_objFGInventory.SortColumns = (_objFGSearchInventoryListRequestParam.SearchFilter != null && _objFGSearchInventoryListRequestParam.SearchFilter.Any()) ? string.Join(",", _objFGSearchInventoryListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
				_objFGInventory.PageNumber = _objFGSearchInventoryListRequestParam.PageNumber;
				_objFGInventory.ColumnName = (_objFGSearchInventoryListRequestParam.SearchFilter != null && _objFGSearchInventoryListRequestParam.SearchFilter.Any()) ? string.Join(",", _objFGSearchInventoryListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
				_objFGInventory.IsGlobalSearch = _objFGSearchInventoryListRequestParam.IsGlobalSearch;
				_objFGInventory.SortOrder = _objFGSearchInventoryListRequestParam.SortOrder;
				_objFGInventory.SearchKeyword = (_objFGSearchInventoryListRequestParam.SearchFilter != null && _objFGSearchInventoryListRequestParam.SearchFilter.Any()) ? string.Join(",", _objFGSearchInventoryListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
				_objFGInventory.ParamType = "GetFGInventoryListByPagination";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objFGInventory, Helper.XML_PARAMS, StoredProcedure.FG_INVENTORY);
				finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<FGSearchInventoryListRequestParam>(_objFGSearchInventoryListRequestParam, finalDataSet, "TOTAL_RECORDS", "FG_INVENTORY_LIST");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetFGInventoryList()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method Is Used To Check FG Item Code Exist.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCheckFGItemCodeExist"></param>
		/// <returns></returns>
		public async Task<DataSet> CheckFGItemCodeExist(ODBCHelper _objODBCHelper, CheckFGItemCodeExistForFGInventory _objCheckFGItemCodeExist)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				FGInventory _objFGInventory = new FGInventory();
				_objFGInventory.ItemCode = _objCheckFGItemCodeExist.ItemCode;
				_objFGInventory.ParamType = "CheckFGItemCodeExist";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objFGInventory, Helper.XML_PARAMS, StoredProcedure.FG_INVENTORY);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "ITEM_CODE_EXISTENCE_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.CheckFGItemCodeExist()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		#endregion [FG Inventory]

		#region [Inventory Master]

		/// <summary>
		/// This Method Is Used To Save and Update FG Inventory Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objInventory"></param>
		/// <returns></returns>
		public async Task<DataSet> SaveAndUpdateInventory(ODBCHelper _objODBCHelper, Inventory _objInventory)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objInventory, Helper.XML_PARAMS, StoredProcedure.INVENTORY_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "INVENTORY_MASTER_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateInventory()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}
		/// <summary>
		/// This Method is Used to Get Inventory Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objInventoryDetailsRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetInventoryDetails(ODBCHelper _objODBCHelper, InventoryDetailsRequestParam _objInventoryDetailsRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				string TABLENAME = string.Empty;
				Inventory _objInventory = new Inventory();
				_objInventory.ItemID = _objInventoryDetailsRequestParam.ItemID;
				_objInventory.ParamType = "GetInventoryMasterDetails";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objInventory, Helper.XML_PARAMS, StoredProcedure.INVENTORY_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "INVENTORY_DETAILS_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetInventoryDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}
		/// <summary>
		/// This Method is Used to Delete Inventory Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteInventoryDetails"></param>
		/// <returns></returns>
		public async Task<DataSet> DeleteInventory(ODBCHelper _objODBCHelper, DeleteInventoryDetails _objDeleteInventoryDetails)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				Inventory _objInventory = new Inventory();
				_objInventory.ItemID = _objDeleteInventoryDetails.ItemID;
				_objInventory.ParamType = "DeleteInventoryItem";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objInventory, Helper.XML_PARAMS, StoredProcedure.INVENTORY_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "DELETE_INVENTORY_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.DeleteInventory()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}
		/// <summary>
		/// This Method is Used to Get Inventory Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objInventorySearchListRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetInventoryList(ODBCHelper _objODBCHelper, InventorySearchListRequestParam _objInventorySearchListRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				Inventory _objInventory = new Inventory();
				_objInventory.PageSize = _objInventorySearchListRequestParam.PageSize;
				_objInventory.PageNumber = _objInventorySearchListRequestParam.PageNumber;
				_objInventory.SortColumns = (_objInventorySearchListRequestParam.SearchFilter != null && _objInventorySearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objInventorySearchListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
				_objInventory.ColumnName = (_objInventorySearchListRequestParam.SearchFilter != null && _objInventorySearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objInventorySearchListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
				_objInventory.IsGlobalSearch = _objInventorySearchListRequestParam.IsGlobalSearch;
				_objInventory.SortOrder = _objInventorySearchListRequestParam.SortOrder;
				_objInventory.SearchKeyword = (_objInventorySearchListRequestParam.SearchFilter != null && _objInventorySearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objInventorySearchListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
				_objInventory.ParamType = "GetInventoryMasterListByPagination";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objInventory, Helper.XML_PARAMS, StoredProcedure.INVENTORY_MASTER);
				finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<InventorySearchListRequestParam>(_objInventorySearchListRequestParam, finalDataSet, "TOTAL_RECORDS", "INVENTORY_MASTER_LIST");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetInventoryList()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method Is Used To Check Item Code Exist.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCheckItemCodeExist"></param>
		/// <returns></returns>
		public async Task<DataSet> CheckInventoryItemCodeExist(ODBCHelper _objODBCHelper, CheckInventoryItemCodeExistForInventory _objCheckItemCodeExist)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				Inventory _objInventory = new Inventory();
				_objInventory.ItemCode = _objCheckItemCodeExist.ItemCode;
				_objInventory.ParamType = "CheckItemCodeExist";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objInventory, Helper.XML_PARAMS, StoredProcedure.INVENTORY_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "CHECK_ITEM_CODE_EXIST_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.CheckInventoryItemCodeExist()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

        /// <summary>
        /// This Method is Used to Get Item Code List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objItemCodeListByPaginationRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetItemCodeList(ODBCHelper _objODBCHelper, ItemCodeListByPaginationRequestParam _objItemCodeListByPaginationRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                Inventory _objInventory = new Inventory();
                _objInventory.PageSize = _objItemCodeListByPaginationRequestParam.PageSize;
                _objInventory.PageNumber = _objItemCodeListByPaginationRequestParam.PageNumber;
                _objInventory.SearchKeyword = _objItemCodeListByPaginationRequestParam.SearchKeyword;
                _objInventory.ParamType = "GetItemCodeListByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objInventory, Helper.XML_PARAMS, StoredProcedure.INVENTORY_MASTER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<ItemCodeListByPaginationRequestParam>(_objItemCodeListByPaginationRequestParam, finalDataSet, "TOTAL_RECORDS", "ITEM_CODE_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetItemCodeList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Inventory Master]

        #region [Supplier Master]

        /// <summary>
        /// This Method Is Used To Save and Update Supplier Master Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objSupplierMaster"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateSupplierMaster(ODBCHelper _objODBCHelper, SupplierMaster _objSupplierMaster)
		{
			DataSet finalDataSet = new DataSet();
            string TableName = "SUPPLIER_MASTER_RESPONSE";
            try
			{
				var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierMaster, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_MASTER);
				if (Helper.CheckDataSetIsNullOrEmpty(ds))
				{
                    string Status = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    string Message = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    if (Status == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
						int SupplierNo = 0;
						int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out SupplierNo);
						bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objSupplierMaster.SupplierContactMaster);

						if (!IsEmpty)
						{
							if (_objSupplierMaster.SupplierContactMaster != null && _objSupplierMaster.SupplierContactMaster.Count > 0)
							{
								List<SupplierContactMaster> lstSupplierContactMaster = new List<SupplierContactMaster>();
								lstSupplierContactMaster = _objSupplierMaster.SupplierContactMaster;
								lstSupplierContactMaster.ForEach(x => x.SupplierID = SupplierNo);

								var parameters = new List<(string, OdbcType, object, int?)>
								{
									("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
								};
								bool isInsert = _objSupplierMaster.SupplierID == 0;
								bool isContactProvided = _objSupplierMaster.SupplierContactMaster != null;
								bool isContactRemoved = isContactProvided && _objSupplierMaster.SupplierContactMaster.Count == 0;
								var dsSupplierContactMaster = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstSupplierContactMaster, lstSupplierContactMaster.GetType(), lstSupplierContactMaster, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_CONTACT_MASTER, parameters);

								if (dsSupplierContactMaster != null && dsSupplierContactMaster.Tables.Count > 0 && dsSupplierContactMaster.Tables[0].Rows.Count > 0)
								{
									string SupplierContactMasterStatus = Convert.ToString(dsSupplierContactMaster.Tables[0].Rows[0]["Status"].ToString());
									if (SupplierContactMasterStatus.ToUpper() == MessageTypeConstants.Success)
									{
									}
								}
								if (Status.Equals(MessageTypeConstants.Success, StringComparison.OrdinalIgnoreCase))
								{
									if (isInsert)
									{
										Message = "Supplier Master Saved Successfully !!!";
									}
									else
									{
										Message = "Supplier Master Updated Successfully !!!";
									}
								}
							}
						}
						else
						{
							SupplierContactMaster _objSupplierContactMaster = new SupplierContactMaster();
							_objSupplierContactMaster.SupplierID = _objSupplierMaster.SupplierID;

							bool isInsert = _objSupplierMaster.SupplierID == 0;
							bool isContactProvided = _objSupplierMaster.SupplierContactMaster != null;
							bool isContactRemoved = isContactProvided && _objSupplierMaster.SupplierContactMaster.Count == 0;

							var parameters = new List<(string, OdbcType, object, int?)>
							{
								("ParamType", OdbcType.NVarChar, "DeleteSupplierContactMaster", 100)
							};
							finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objSupplierContactMaster, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_CONTACT_MASTER, parameters);
							if (Status.Equals(MessageTypeConstants.Success, StringComparison.OrdinalIgnoreCase))
							{
								if (isInsert)
								{
									Message = "Supplier Master Saved Successfully !!!";
								}
								else
								{
									Message = "Supplier Master Updated Successfully !!!";
								}
							}
						}
						List<string> columns = new List<string> { "ID", "Status", "Message" };
						List<List<string>> rows = new List<List<string>>
						{
							new List<string> { SupplierNo.ToString(), Status, Message }
						};
						finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
					}
					else
					{
                        List<string> columns = new List<string> { "ID", "Status", "Message" };
                        List<List<string>> rows = new List<List<string>>
                        {
                                new List<string> { "0", Status, Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateSupplierMaster()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Get Supplier and Supplier Contact Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objSupplierMasterDetailsRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetSupplierMasterDetails(ODBCHelper _objODBCHelper, SupplierMasterDetailsRequestParam _objSupplierMasterDetailsRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				SupplierMaster _objSupplierMaster = new SupplierMaster();
				_objSupplierMaster.SupplierID = _objSupplierMasterDetailsRequestParam.SupplierID;
				_objSupplierMaster.ParamType = "GetSupplierMasterDetails";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierMaster, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_MASTER);
				if (finalDataSet.Tables.Contains(DataSetDataTableConstants.Table))
				{
					finalDataSet.Tables[DataSetDataTableConstants.Table].TableName = "SUPPLIER_MASTER_DETAILS";
				}
				if (finalDataSet.Tables.Contains(DataSetDataTableConstants.Table1))
				{
					finalDataSet.Tables[DataSetDataTableConstants.Table1].TableName = "SUPPLIER_CONTACT_MASTER_DETAILS";
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetSupplierMasterDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Check Supplier Name Exist Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCheckSupplierNameExist"></param>
		/// <returns></returns>
		public async Task<DataSet> CheckSupplierNameExistDetails(ODBCHelper _objODBCHelper, CheckSupplierNameExist _objCheckSupplierNameExist)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				SupplierMaster _objSupplierMaster = new SupplierMaster();
				_objSupplierMaster.SupplierName = _objCheckSupplierNameExist.SupplierName;
				_objSupplierMaster.ParamType = "CheckSupplierNameExist";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierMaster, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "CHECK_SUPPLIER_NAME_EXIST_DETAILS_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.CheckSupplierNameExistDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}
		
		/// <summary>
		/// This Method is Used to Get Supplier Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteSupplierMasterDetails"></param>
		/// <returns></returns>
		public async Task<DataSet> DeleteSupplierDetails(ODBCHelper _objODBCHelper, DeleteSupplierMasterDetails _objDeleteSupplierMasterDetails)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				SupplierMaster _objSupplierMaster = new SupplierMaster();
				_objSupplierMaster.SupplierID = _objDeleteSupplierMasterDetails.SupplierID;
				_objSupplierMaster.ParamType = "DeleteSupplierDetails";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierMaster, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "DELETE_SUPPLIER_DETAILS_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.DeleteSupplierDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Get Supplier Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objSupplierMasterListRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetSupplierMasterList(ODBCHelper _objODBCHelper, SearchSupplierMasterListRequestParam _objSupplierMasterListRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				SupplierMaster _objSupplierMaster = new SupplierMaster();
				_objSupplierMaster.PageSize = _objSupplierMasterListRequestParam.PageSize;
				_objSupplierMaster.PageNumber = _objSupplierMasterListRequestParam.PageNumber;
				_objSupplierMaster.SortColumns = (_objSupplierMasterListRequestParam.SearchFilter != null && _objSupplierMasterListRequestParam.SearchFilter.Any()) ? string.Join(",", _objSupplierMasterListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
				_objSupplierMaster.ColumnName = (_objSupplierMasterListRequestParam.SearchFilter != null && _objSupplierMasterListRequestParam.SearchFilter.Any()) ? string.Join(",", _objSupplierMasterListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
				_objSupplierMaster.IsGlobalSearch = _objSupplierMasterListRequestParam.IsGlobalSearch;
				_objSupplierMaster.SortOrder = _objSupplierMasterListRequestParam.SortOrder;
				_objSupplierMaster.SearchKeyword = (_objSupplierMasterListRequestParam.SearchFilter != null && _objSupplierMasterListRequestParam.SearchFilter.Any()) ? string.Join(",", _objSupplierMasterListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
				_objSupplierMaster.ParamType = "GetSupplierMasterByPagination";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierMaster, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_MASTER);
				finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<SearchSupplierMasterListRequestParam>(_objSupplierMasterListRequestParam, finalDataSet, "TOTAL_RECORDS", "SUPPLIER_MASTER_LIST");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetSupplierMasterList()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

        #endregion [Supplier Master]

        #region [Customer Master]

        /// <summary>
        /// This Method Is Used To Save and Update Customer Master Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objCustomerMaster"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateCustomerMaster(ODBCHelper _objODBCHelper, CustomerMaster _objCustomerMaster)
		{
			DataSet finalDataSet = new DataSet();
            string TableName = "CUSTOMER_MASTER_RESPONSE";
            try
			{
				var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objCustomerMaster, Helper.XML_PARAMS, StoredProcedure.CUSTOMER_MASTER);
				if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
				{
                    string Status = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    string Message = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    if (Status == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
						int CustomerNo = 0;
						int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out CustomerNo);
						bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objCustomerMaster.CustomerContactMaster);

						if (!IsEmpty)
						{
							if (_objCustomerMaster.CustomerContactMaster != null && _objCustomerMaster.CustomerContactMaster.Count > 0)
							{
								List<CustomerContactMaster> lstCustomerContactMaster = new List<CustomerContactMaster>();
								lstCustomerContactMaster = _objCustomerMaster.CustomerContactMaster;
								lstCustomerContactMaster.ForEach(x => x.CustomerID = CustomerNo);

								var parameters = new List<(string, OdbcType, object, int?)>
								{
									("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
								};
								bool isInsert = _objCustomerMaster.CustomerID == 0;
								bool isContactProvided = _objCustomerMaster.CustomerContactMaster != null;
								bool isContactRemoved = isContactProvided && _objCustomerMaster.CustomerContactMaster.Count == 0;
								var dsCustomerContactMaster = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstCustomerContactMaster, lstCustomerContactMaster.GetType(), lstCustomerContactMaster, Helper.XML_PARAMS, StoredProcedure.CUSTOMER_CONTACT_MASTER, parameters);

								if (dsCustomerContactMaster != null && dsCustomerContactMaster.Tables.Count > 0 && dsCustomerContactMaster.Tables[0].Rows.Count > 0)
								{
									string CustomerContactMasterStatus = Convert.ToString(dsCustomerContactMaster.Tables[0].Rows[0]["Status"].ToString());
									if (CustomerContactMasterStatus.ToUpper() == MessageTypeConstants.Success)
									{
									}
								}
								if (Status.Equals(MessageTypeConstants.Success, StringComparison.OrdinalIgnoreCase))
								{
									if (isInsert)
									{
										Message = "Customer Master Saved Successfully !!!";
									}
									else
									{
										Message = "Customer Master Updated Successfully !!!";
									}
								}
							}
						}
						else
						{
							CustomerContactMaster _objCustomerContactMaster = new CustomerContactMaster();
							_objCustomerContactMaster.CustomerID = _objCustomerMaster.CustomerID;
							var parameters = new List<(string, OdbcType, object, int?)>
							{
								("ParamType", OdbcType.NVarChar, "DeleteCustomerContactMaster", 100)
							};
							bool isInsert = _objCustomerMaster.CustomerID == 0;
							bool isContactProvided = _objCustomerMaster.CustomerContactMaster != null;
							bool isContactRemoved = isContactProvided && _objCustomerMaster.CustomerContactMaster.Count == 0;
							finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objCustomerContactMaster, Helper.XML_PARAMS, StoredProcedure.CUSTOMER_CONTACT_MASTER, parameters);
							if (Status.Equals(MessageTypeConstants.Success, StringComparison.OrdinalIgnoreCase))
							{
								if (isInsert)
								{
									Message = "Customer Master Saved Successfully !!!";
								}
								else
								{
									Message = "Customer Master Updated Successfully !!!";
								}
							}

						}
						List<string> columns = new List<string> { "ID", "Status", "Message" };
						List<List<string>> rows = new List<List<string>>
						{
							new List<string> { CustomerNo.ToString(), Status, Message }
						};
						finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
					}
					else
					{
                        List<string> columns = new List<string> { "ID", "Status", "Message" };
                        List<List<string>> rows = new List<List<string>>
						 {
								 new List<string> { "0", Status, Message }
						 };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateCustomerMaster()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Get Customer and Customer Contact Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCustomerMasterDetailsRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetCustomerMasterDetails(ODBCHelper _objODBCHelper, CustomerMasterDetailsRequestParam _objCustomerMasterDetailsRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
                CustomerMaster _objCustomerMaster = Helper.ToCopyClassProperties<CustomerMasterDetailsRequestParam, CustomerMaster>(_objCustomerMasterDetailsRequestParam);
                _objCustomerMaster.ParamType = "GetCustomerMasterDetails";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objCustomerMaster, Helper.XML_PARAMS, StoredProcedure.CUSTOMER_MASTER);
				if (finalDataSet.Tables.Contains(DataSetDataTableConstants.Table))
				{
					finalDataSet.Tables[DataSetDataTableConstants.Table].TableName = "CUSTOMER_MASTER_DETAILS";
				}
				if (finalDataSet.Tables.Contains(DataSetDataTableConstants.Table1))
				{
					finalDataSet.Tables[DataSetDataTableConstants.Table1].TableName = "CUSTOMER_CONTACT_MASTER_DETAILS";
				}
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetCustomerMasterDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Check Customer Name Exist Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCheckCustomerNameExist"></param>
		/// <returns></returns>
		public async Task<DataSet> CheckCustomerNameExistDetails(ODBCHelper _objODBCHelper, CheckCustomerNameExist _objCheckCustomerNameExist)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
                CustomerMaster _objCustomerMaster = Helper.ToCopyClassProperties<CheckCustomerNameExist, CustomerMaster>(_objCheckCustomerNameExist);
                _objCustomerMaster.ParamType = "CheckCustomerNameExist";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objCustomerMaster, Helper.XML_PARAMS, StoredProcedure.CUSTOMER_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "CHECK_CUSTOMER_NAME_EXIST_DETAILS_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.CheckCustomerNameExistDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Get Customer Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteCustomerMasterDetails"></param>
		/// <returns></returns>
		public async Task<DataSet> DeleteCustomerMasterDetails(ODBCHelper _objODBCHelper, DeleteCustomerMasterDetails _objDeleteCustomerMasterDetails)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
                CustomerMaster _objCustomerMaster = Helper.ToCopyClassProperties<DeleteCustomerMasterDetails, CustomerMaster>(_objDeleteCustomerMasterDetails);
                _objCustomerMaster.ParamType = "DeleteCustomerMaster";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objCustomerMaster, Helper.XML_PARAMS, StoredProcedure.CUSTOMER_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "DELETE_CUSTOMER_DETAILS_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.DeleteCustomerMasterDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Get Customer Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCustomerMasterSearchListRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetCustomerMasterList(ODBCHelper _objODBCHelper, CustomerMasterSearchListRequestParam _objCustomerMasterSearchListRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				CustomerMaster _objCustomerMaster = new CustomerMaster();
				_objCustomerMaster.PageSize = _objCustomerMasterSearchListRequestParam.PageSize;
				_objCustomerMaster.PageNumber = _objCustomerMasterSearchListRequestParam.PageNumber;
				_objCustomerMaster.SortColumns = (_objCustomerMasterSearchListRequestParam.SearchFilter != null && _objCustomerMasterSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objCustomerMasterSearchListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
				_objCustomerMaster.ColumnName = (_objCustomerMasterSearchListRequestParam.SearchFilter != null && _objCustomerMasterSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objCustomerMasterSearchListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
				_objCustomerMaster.IsGlobalSearch = _objCustomerMasterSearchListRequestParam.IsGlobalSearch;
				_objCustomerMaster.SortOrder = _objCustomerMasterSearchListRequestParam.SortOrder;
				_objCustomerMaster.SearchKeyword = (_objCustomerMasterSearchListRequestParam.SearchFilter != null && _objCustomerMasterSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objCustomerMasterSearchListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
				_objCustomerMaster.ParamType = "GetCustomerMasterByPagination";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objCustomerMaster, Helper.XML_PARAMS, StoredProcedure.CUSTOMER_MASTER);
				finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<CustomerMasterSearchListRequestParam>(_objCustomerMasterSearchListRequestParam, finalDataSet, "TOTAL_RECORDS", "CUSTOMER_MASTER_LIST");
            }
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetCustomerMasterList()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

        /// <summary>
		/// This Method is Used to Get Customer Master List In Quotation.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objCustomerQuotationSearchListRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetCustomerMasterListInQuotation(ODBCHelper _objODBCHelper, CustomerQuotationSearchListRequestParam _objCustomerQuotationSearchListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                CustomerMaster _objCustomerMaster = Helper.ToCopyClassProperties<CustomerQuotationSearchListRequestParam, CustomerMaster>(_objCustomerQuotationSearchListRequestParam);
                _objCustomerMaster.ParamType = "GetCustomerMasterInQuotationByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objCustomerMaster, Helper.XML_PARAMS, StoredProcedure.CUSTOMER_MASTER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<CustomerQuotationSearchListRequestParam>(_objCustomerQuotationSearchListRequestParam, finalDataSet, "TOTAL_RECORDS", "CUSTOMER_MASTER_LIST_IN_QUOTATION");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetCustomerMasterListInQuotation()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Customer Master List In Delivery Note.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objCustomerDeliveryNoteSearchListRequestParam"></param>
        /// <returns></returns>
		public async Task<DataSet> GetCustomerMasterListInDeliveryNote(ODBCHelper _objODBCHelper, CustomerDeliveryNoteSearchListRequestParam _objCustomerDeliveryNoteSearchListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                CustomerMaster _objCustomerMaster = Helper.ToCopyClassProperties<CustomerDeliveryNoteSearchListRequestParam, CustomerMaster>(_objCustomerDeliveryNoteSearchListRequestParam);
                _objCustomerMaster.ParamType = "GetCustomerMasterInDeliveryNoteByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objCustomerMaster, Helper.XML_PARAMS, StoredProcedure.CUSTOMER_MASTER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<CustomerDeliveryNoteSearchListRequestParam>(_objCustomerDeliveryNoteSearchListRequestParam, finalDataSet, "TOTAL_RECORDS", "CUSTOMER_MASTER_LIST_IN_DELIVERY_NOTE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetCustomerMasterListInDeliveryNote()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Customer Master]

        #region [Inspection Master]

        /// <summary>
        /// This Method Is Used To Save and Update Inspection Master Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_lstInspectionMaster"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateInspectionMaster(ODBCHelper _objODBCHelper, List<InspectionMaster> _lstInspectionMaster)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_lstInspectionMaster);
				if (!IsEmpty)
				{
					if (_lstInspectionMaster != null && _lstInspectionMaster.Count > 0)
					{
						var parameters = new List<(string, OdbcType, object, int?)>
						{
							("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
						};

						finalDataSet = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(_lstInspectionMaster, _lstInspectionMaster.GetType(), _lstInspectionMaster, Helper.XML_PARAMS, StoredProcedure.INSPECTION_MASTER, parameters);
					}
				}
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "INSPECTION_MASTER_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateInspectionMaster()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

        /// <summary>
        /// This Method is Used to Get Inspection Master Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInspectionMasterDetailsRequestParam"></param>
        /// <param name="webHostEnvironment"></param>
        /// <returns></returns>
        public async Task<DataSet> GetInspectionMasterDetails(ODBCHelper _objODBCHelper,  InspectionMasterDetailsRequestParam _objInspectionMasterDetailsRequestParam, IWebHostEnvironment webHostEnvironment)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				InspectionMaster _objInspectionMaster = new InspectionMaster();
				_objInspectionMaster.FgRmItemID = _objInspectionMasterDetailsRequestParam.FgRmItemID;
				_objInspectionMaster.ItemType = _objInspectionMasterDetailsRequestParam.ItemType;
				var parameters = new List<(string, OdbcType, object, int?)>
				{
					("ParamType", OdbcType.NVarChar, "GetInspectionMasterDetails", 100)
				};
				var ds = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objInspectionMaster, Helper.XML_PARAMS, StoredProcedure.INSPECTION_MASTER, parameters);
                if(Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string DBStatus = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    if(DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        foreach (DataTable table in ds.Tables)
                        {
                            foreach (DataRow row in table.Rows)
                            {
                                string ItemCode = Convert.ToString(row["item_code"]);
                                string InspectionID = Convert.ToString(row["insp_id"]);
                                string IsVideoUploaded = Convert.ToString(row["is_video_uploaded"]);
                                row["FileName"] = (IsVideoUploaded == "Y" ? GetInspectionVideoFileName(ItemCode, InspectionID, webHostEnvironment) : string.Empty);
                            }
                        }
                    }
                    else
                    {
                        finalDataSet = ds;
                    }
                }
				finalDataSet = Helper.CheckAndValidateDatasetTable(ds, "INSPECTION_MASTER_DETAILS");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetInspectionMasterDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

        /// <summary>
        /// This Method Is Used To Get Inspection Video File Name.
        /// </summary>
        /// <param name="ItemCode"></param>
        /// <param name="InspectionID"></param>
        /// <param name="webHostEnvironment"></param>
        /// <returns></returns>
        private string GetInspectionVideoFileName(string ItemCode, string InspectionID, IWebHostEnvironment webHostEnvironment)
        {
            string FileName = string.Empty;
            try
            {
                var FolderDetails = CommonHelper.GetIMFolderConfigurationDetails(webHostEnvironment, "InspectionVideos");
                var basePath = FolderDetails != null && FolderDetails.FileUploadPath != null ? FolderDetails.FileUploadPath.Trim() : string.Empty;
                string SubFolderName = $"{ItemCode}\\{InspectionID}";
                SubFolderName = SubFolderName.Replace("/", "-");
                string FolderFullPath = Path.Combine(basePath, SubFolderName);
                if (!string.IsNullOrWhiteSpace(FolderFullPath) && Directory.Exists(FolderFullPath))
                {
                    string filePath = Directory.EnumerateFiles(FolderFullPath).FirstOrDefault();
                    FileName = !string.IsNullOrWhiteSpace(filePath) ? Path.GetFileName(filePath) : string.Empty;
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetInspectionVideoFile()", ex.Message, false);
                throw;
            }
            return FileName;
        }

        /// <summary>
        /// This Method is Used to Get Inspection Master List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInspectionMasterSearchListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetInspectionMasterList(ODBCHelper _objODBCHelper, InspectionMasterSearchListRequestParam _objInspectionMasterSearchListRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				InspectionMaster _objInspectionMaster = new InspectionMaster();
				_objInspectionMaster.PageSize = _objInspectionMasterSearchListRequestParam.PageSize;
				_objInspectionMaster.PageNumber = _objInspectionMasterSearchListRequestParam.PageNumber;
				_objInspectionMaster.SortColumns = (_objInspectionMasterSearchListRequestParam.SearchFilter != null && _objInspectionMasterSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objInspectionMasterSearchListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
				_objInspectionMaster.ColumnName = (_objInspectionMasterSearchListRequestParam.SearchFilter != null && _objInspectionMasterSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objInspectionMasterSearchListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
				_objInspectionMaster.IsGlobalSearch = _objInspectionMasterSearchListRequestParam.IsGlobalSearch;
				_objInspectionMaster.SortOrder = _objInspectionMasterSearchListRequestParam.SortOrder;
				_objInspectionMaster.SearchKeyword = (_objInspectionMasterSearchListRequestParam.SearchFilter != null && _objInspectionMasterSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objInspectionMasterSearchListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
				_objInspectionMaster.ParamType = "GetInspectionMasterListByPagination";
				var parameters = new List<(string, OdbcType, object, int?)>
				{
					("ParamType", OdbcType.NVarChar, "GetInspectionMasterListByPagination", 100)
				};
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objInspectionMaster, Helper.XML_PARAMS, StoredProcedure.INSPECTION_MASTER, parameters);

				finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<InspectionMasterSearchListRequestParam>(_objInspectionMasterSearchListRequestParam, finalDataSet, "TOTAL_RECORDS", "INSPECTION_MASTER_LIST");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetInspectionMasterList()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		/// <summary>
		/// This Method is Used to Delete Inspection Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteInspectionMasterDetailsRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> DeleteInspectionMaster(ODBCHelper _objODBCHelper, DeleteInspectionMasterDetailsRequestParam _objDeleteInspectionMasterDetailsRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				InspectionMaster _objInspectionMaster = new InspectionMaster();
				_objInspectionMaster.FgRmItemID = _objDeleteInspectionMasterDetailsRequestParam.FgRmItemID;
				_objInspectionMaster.ItemType = _objDeleteInspectionMasterDetailsRequestParam.ItemType;
				var parameters = new List<(string, OdbcType, object, int?)>
				{
					("ParamType", OdbcType.NVarChar, "DeleteInspectionMaster", 100)
				};
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objInspectionMaster, Helper.XML_PARAMS, StoredProcedure.INSPECTION_MASTER, parameters);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "DELETE_INSPECTION_MASTER_DETAILS");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.DeleteInspectionMaster()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

		#endregion [Inspection Master]

		#region [Characteristic Master]

		/// <summary>
		/// This Method Is Used To Save and Update Characteristic Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_lstCharacteristicMaster"></param>
		/// <returns></returns>
		public async Task<DataSet> SaveAndUpdateCharacteristicMaster(ODBCHelper _objODBCHelper, List<CharacteristicMaster> _lstCharacteristicMaster)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_lstCharacteristicMaster);
				if (!IsEmpty)
				{
					if (_lstCharacteristicMaster != null && _lstCharacteristicMaster.Count > 0)
					{
						var parameters = new List<(string, OdbcType, object, int?)>
						{
							("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
						};

						finalDataSet = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(_lstCharacteristicMaster, _lstCharacteristicMaster.GetType(), _lstCharacteristicMaster, Helper.XML_PARAMS, StoredProcedure.CHARACTERISTICS_MASTER, parameters);
					}
				}

				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "CHARACTERISTICS_MASTER_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateCharacteristicMaster()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

        #endregion [Characteristic Master]

        #region [BOM Master]

        /// <summary>
        /// This Method Is Used To Save and Update BOM Master Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objBOMMaster"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateBOMMaster(ODBCHelper _objODBCHelper, BOMCommon _objBOMMaster)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string TableName = "BOM_MASTER_RESPONSE";
            try
            {
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objBOMMaster, Helper.XML_PARAMS, StoredProcedure.BOM_COMMON);
                if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
                {
                    string Status = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    string Message = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    if (Status == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        int BOMNo = 0;
                        int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out BOMNo);
                        bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objBOMMaster.BOMDetail);

                        if (!IsEmpty)
                        {
                            if (_objBOMMaster.BOMDetail != null && _objBOMMaster.BOMDetail.Count > 0)
                            {
                                List<BOMDetail> lstBOMDetail = new List<BOMDetail>();
                                lstBOMDetail = _objBOMMaster.BOMDetail;
                                lstBOMDetail.ForEach(x => x.BOMID = BOMNo);

                                var parameters = new List<(string, OdbcType, object, int?)>
                                {
                                    ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                                };
                                bool isInsert = _objBOMMaster.BOMID == 0;
                                bool isDetailProvided = _objBOMMaster.BOMDetail != null;
                                bool isDetailRemoved = isDetailProvided && _objBOMMaster.BOMDetail.Count == 0;
                                var dsBOMDetail = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstBOMDetail, lstBOMDetail.GetType(), lstBOMDetail, Helper.XML_PARAMS, StoredProcedure.BOM_DETAIL, parameters);

                                if (dsBOMDetail != null && dsBOMDetail.Tables.Count > 0 && dsBOMDetail.Tables[0].Rows.Count > 0)
                                {
                                    string BOMDetailStatus = Convert.ToString(dsBOMDetail.Tables[0].Rows[0]["Status"].ToString());
                                }
								Message = isInsert ? "BOM Master Saved Successfully !!!" : "BOM Master Updated Successfully !!!";
                            }
                        }
                        else
                        {
                            BOMDetail _objBOMDetail = new BOMDetail();
                            _objBOMDetail.BOMID = _objBOMMaster.BOMID;
                            var parameters = new List<(string, OdbcType, object, int?)>
                            {
                                ("ParamType", OdbcType.NVarChar, "DeleteBOMDetail", 100)
                            };
                            bool isInsert = _objBOMMaster.BOMID == 0;
                            var dsDeleteBOMDetail = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objBOMDetail, Helper.XML_PARAMS, StoredProcedure.BOM_DETAIL, parameters);
                            Message = isInsert ? "BOM Master Saved Successfully !!!" : "BOM Master Updated Successfully !!!";
                        }
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { BOMNo.ToString(), Status,  Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                                new List<string> { "0", Status, Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateBOMMaster()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

		/// <summary>
		/// This Method is Used to Get BOM Master Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objBOMMasterDetailsRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetBOMMasterDetails(ODBCHelper _objODBCHelper, BOMMasterDetailsRequestParam _objBOMMasterDetailsRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			string TableName = "BOM_MASTER_COMMON_RESPONSE";
			try
			{
				BOMCommon _objBOMCommon = new BOMCommon();
				_objBOMCommon.FGItemID = _objBOMMasterDetailsRequestParam.FGItemID;
                _objBOMCommon.BOMID = _objBOMMasterDetailsRequestParam.BOMID;
                _objBOMCommon.ParamType = "GetBOMCommonDetails";
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objBOMCommon, Helper.XML_PARAMS, StoredProcedure.BOM_COMMON);
                if(Helper.CheckDataSetIsNullOrEmpty(finalDataSet))
				{
                    string DBStatus = Helper.ToProperCase(Convert.ToString(finalDataSet.Tables[0].Rows[0]["Status"].ToString()));
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
					{
                        finalDataSet = Helper.CheckAndValidateMultipleDatasetTable(finalDataSet, (DataSetDataTableConstants.Table, TableName), (DataSetDataTableConstants.Table1, "BOM_MASTER_DETAILS_RESPONSE"));
                    }
					else
					{
						finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
					}
                }
            }
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetBOMMasterDetails()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}
        #endregion [BOM Master]

        #region [Work Order Header]

        /// <summary>
        /// This Method Is Used To Save and Update Work Order Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderHeader"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateWorkOrderHeader(ODBCHelper _objODBCHelper, WorkOrderHeader _objWorkOrderHeader)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string TableName = "WORK_ORDER_HEADER_RESPONSE";
            try
            {
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objWorkOrderHeader, Helper.XML_PARAMS, StoredProcedure.WORK_ORDER_HEADER);
                if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
                {
                    string Status = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    string Message = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    if (Status == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        int WorkOrderNo = 0;
                        int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out WorkOrderNo);
                        bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objWorkOrderHeader.WorkOrderDetail);

                        if (!IsEmpty)
                        {
                            if (_objWorkOrderHeader.WorkOrderDetail != null && _objWorkOrderHeader.WorkOrderDetail.Count > 0)
                            {
                                List<WorkOrderDetail> lstWorkOrderDetail = new List<WorkOrderDetail>();
                                lstWorkOrderDetail = _objWorkOrderHeader.WorkOrderDetail;
                                lstWorkOrderDetail.ForEach(x => x.WorkOrderID = WorkOrderNo);

                                var parameters = new List<(string, OdbcType, object, int?)>
                                {
                                    ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                                };
                                bool isInsert = _objWorkOrderHeader.WorkOrderID == 0;
                                var dsWorkOrderDetail = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstWorkOrderDetail, lstWorkOrderDetail.GetType(), lstWorkOrderDetail, Helper.XML_PARAMS, StoredProcedure.WORK_ORDER_DETAIL, parameters);

                                if (dsWorkOrderDetail != null && dsWorkOrderDetail.Tables.Count > 0 && dsWorkOrderDetail.Tables[0].Rows.Count > 0)
                                {
                                    string BOMDetailStatus = Convert.ToString(dsWorkOrderDetail.Tables[0].Rows[0]["Status"].ToString());
                                }
                                Message = isInsert ? "Work Order Saved Successfully !!!" : "Work Order Updated Successfully !!!";
                            }
                        }
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { WorkOrderNo.ToString(), Status,  Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                                new List<string> { "0", Status, Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateWorkOrderHeader()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Work Order Header and Work Order Detail Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderHeaderRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetWorkOrderHeaderDetails(ODBCHelper _objODBCHelper, WorkOrderHeaderDetailsRequestParam _objWorkOrderHeaderRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "WORK_ORDER_HEADER_RESPONSE";
            try
            {
                WorkOrderHeader _objWorkOrderHeader = new WorkOrderHeader();
                _objWorkOrderHeader.WorkOrderID = _objWorkOrderHeaderRequestParam.WorkOrderID;
                _objWorkOrderHeader.ParamType = "GetWorkOrderHeaderDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objWorkOrderHeader, Helper.XML_PARAMS, StoredProcedure.WORK_ORDER_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(finalDataSet))
                {
                    string DBStatus = Helper.ToProperCase(Convert.ToString(finalDataSet.Tables[0].Rows[0]["Status"].ToString()));
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        finalDataSet = Helper.CheckAndValidateMultipleDatasetTable(finalDataSet, (DataSetDataTableConstants.Table, TableName), (DataSetDataTableConstants.Table1, "WORK_ORDER_DETAILS_RESPONSE"));
                    }
                    else
                    {
                        finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetWorkOrderHeaderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Approve Work Order.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveWorkOrderHeaderDetails"></param>
        /// <returns></returns>
        public async Task<DataSet> ApproveWorkOrderDetails(ODBCHelper _objODBCHelper, ApproveWorkOrderHeaderDetails _objApproveWorkOrderHeaderDetails)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                WorkOrderHeader _objWorkOrderHeader = new WorkOrderHeader();
                _objWorkOrderHeader.WorkOrderID = _objApproveWorkOrderHeaderDetails.WorkOrderID;
                _objWorkOrderHeader.ApprovedBy = _objApproveWorkOrderHeaderDetails.ApprovedBy;
                _objWorkOrderHeader.ParamType = "ApproveWorkOrderHeaderDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objWorkOrderHeader, Helper.XML_PARAMS, StoredProcedure.WORK_ORDER_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "APPROVE_WORK_ORDER_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ApproveWorkOrderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Short Close Or Recal Work Order.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objShortCloseOrRecallWorkOrderDetails"></param>
        /// <returns></returns>
        public async Task<DataSet> ShortCloseOrRecallWorkOrderDetails(ODBCHelper _objODBCHelper, WorkOrderShortCloseORRecall _objShortCloseOrRecallWorkOrderDetails)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                WorkOrderHeader _objWorkOrderHeader = new WorkOrderHeader();
                _objWorkOrderHeader.WorkOrderID = _objShortCloseOrRecallWorkOrderDetails.WorkOrderID;
                _objWorkOrderHeader.ParamType = "WorkOrderShortCloseORRecall";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objWorkOrderHeader, Helper.XML_PARAMS, StoredProcedure.WORK_ORDER_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "SHORTCLOSE_OR_RECALL_WORK_ORDER_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ShortCloseOrRecallWorkOrderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Work Order Header List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderHeaderListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetWorkOrderHeaderList(ODBCHelper _objODBCHelper, WorkOrderHeaderSearchListRequestParam _objWorkOrderHeaderListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                WorkOrderHeader _objWorkOrderHeader = new WorkOrderHeader();
                _objWorkOrderHeader.PageSize = _objWorkOrderHeaderListRequestParam.PageSize;
                _objWorkOrderHeader.PageNumber = _objWorkOrderHeaderListRequestParam.PageNumber;
                _objWorkOrderHeader.SortColumns = (_objWorkOrderHeaderListRequestParam.SearchFilter != null && _objWorkOrderHeaderListRequestParam.SearchFilter.Any()) ? string.Join(",", _objWorkOrderHeaderListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objWorkOrderHeader.ColumnName = (_objWorkOrderHeaderListRequestParam.SearchFilter != null && _objWorkOrderHeaderListRequestParam.SearchFilter.Any()) ? string.Join(",", _objWorkOrderHeaderListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objWorkOrderHeader.IsGlobalSearch = _objWorkOrderHeaderListRequestParam.IsGlobalSearch;
                _objWorkOrderHeader.SortOrder = _objWorkOrderHeaderListRequestParam.SortOrder;
                _objWorkOrderHeader.SearchKeyword = (_objWorkOrderHeaderListRequestParam.SearchFilter != null && _objWorkOrderHeaderListRequestParam.SearchFilter.Any()) ? string.Join(",", _objWorkOrderHeaderListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objWorkOrderHeader.ParamType = "GetWorkOrderHeaderByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objWorkOrderHeader, Helper.XML_PARAMS, StoredProcedure.WORK_ORDER_HEADER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<WorkOrderHeaderSearchListRequestParam>(_objWorkOrderHeaderListRequestParam, finalDataSet, "TOTAL_RECORDS", "WORK_ORDER_HEADER_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetWorkOrderHeaderList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Work Order Header PDF.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderHeaderPDF"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <returns></returns>
        public async Task<DataSet> GetWorkOrderHeaderPDF(ODBCHelper _objODBCHelper, WorkOrderHeaderPDF _objWorkOrderHeaderPDF, IWebHostEnvironment _webHostEnvironment)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "WorkOrderID", "Status", "Message", "WorkOrderPDFFileName", "WorkOrderPDFBase64" };
            string TableName = "WORK_ORDER_PDF_RESPONSE";
            string TempWorkOrderHtmlFilePath = string.Empty;
            string WorkOrderPDFDocumentBase64 = string.Empty;
            try
            {
                WorkOrderHeader _objWorkOrderHeader = new WorkOrderHeader
                {
                    WorkOrderID = _objWorkOrderHeaderPDF.WorkOrderID,
                    ParamType = "GetWorkOrderHeaderPDF"
                };
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objWorkOrderHeader, Helper.XML_PARAMS, StoredProcedure.WORK_ORDER_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string DBStatus = Helper.ToProperCase(ds.Tables[0].Rows[0]["Status"].ToString());
					if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
					{
                        string WorkOrderID = Convert.ToString(ds.Tables[0].Rows[0]["WorkOrderID"]);
                        string WorkOrderNumber = Convert.ToString(ds.Tables[0].Rows[0]["WorkOrderNumber"]);
                        string WorkOrderDate = DateTimeHelper.ConvertDateTimeStringToSpecificFormat(Convert.ToString(ds.Tables[0].Rows[0]["WorkOrderDate"]), DateTimeFormatConstants.DDMMYYYY_SLASH_DATEFORMAT);
                        string SupplierName = Convert.ToString(ds.Tables[0].Rows[0]["SupplierName"]);
                        string SupplierAddress = Convert.ToString(ds.Tables[0].Rows[0]["SupplierAddress"]);
                        string Remarks = Convert.ToString(ds.Tables[0].Rows[0]["Remarks"]);
                        string ItemID = Convert.ToString(ds.Tables[0].Rows[0]["ItemID"]);
                        string ItemCode = Convert.ToString(ds.Tables[0].Rows[0]["ItemCode"]);
                        string ItemDescription = Convert.ToString(ds.Tables[0].Rows[0]["ItemDescription"]);
                        string QuantityOrdered = Convert.ToString(ds.Tables[0].Rows[0]["QuantityOrdered"]);
                        string DeliveryDate = DateTimeHelper.ConvertDateTimeStringToSpecificFormat(Convert.ToString(ds.Tables[0].Rows[0]["DeliveryDate"]), DateTimeFormatConstants.DDMMYYYY_SLASH_DATEFORMAT);
						string ItemUnit = Convert.ToString(ds.Tables[0].Rows[0]["ItemUnit"]);
                        int workOrderType = Convert.ToInt32(ds.Tables[0].Rows[0]["WorkOrderType"]);

                        string WorkOrderEmailBodyTemplate = await CommonHelper.ReadHTMLTemplateUsingStreamReaderAsync(_webHostEnvironment, "WorkOrderTemplate.html");

                        WorkOrderEmailBodyTemplate = WorkOrderEmailBodyTemplate.Replace("#WorkOrderID#", WorkOrderID);
                        WorkOrderEmailBodyTemplate = WorkOrderEmailBodyTemplate.Replace("#WorkOrderNumber#", WorkOrderNumber);
                        WorkOrderEmailBodyTemplate = WorkOrderEmailBodyTemplate.Replace("#WorkOrderDate#", WorkOrderDate);
                        WorkOrderEmailBodyTemplate = WorkOrderEmailBodyTemplate.Replace("#SupplierAddress#", SupplierAddress);
                        WorkOrderEmailBodyTemplate = WorkOrderEmailBodyTemplate.Replace("#Remarks#", Remarks);

                        StringBuilder supplierSection = new StringBuilder();

                        if (workOrderType == 2)
                        {
                            supplierSection.AppendLine("<div class='supplier'>");
                            supplierSection.AppendLine($"    <b>Sub-Contractor Name :</b> {SupplierName}<br>");
                            supplierSection.AppendLine($"    <b>Sub-Contractor Address :</b> {SupplierAddress}");
                            supplierSection.AppendLine("</div>");
                        }

                        int slNo = 1;
                        StringBuilder itemRows = new StringBuilder();
                        foreach (DataRow row in ds.Tables[0].Rows)
                        {
                            string itemCode = Convert.ToString(row["ItemCode"]);
                            string itemDescription = Convert.ToString(row["ItemDescription"]);
                            string qty = Convert.ToString(row["QuantityOrdered"]);
							string deliveryDate = DateTimeHelper.ConvertDateTimeStringToSpecificFormat(Convert.ToString(row["DeliveryDate"]), DateTimeFormatConstants.DDMMYYYY_SLASH_DATEFORMAT);
                            string unit = Convert.ToString(row["ItemUnit"]);

                            itemRows.AppendLine("<tr>");

                            itemRows.AppendLine($"    <td style='text-align:center;'>{slNo}</td>");

                            itemRows.AppendLine("    <td>");
                            itemRows.AppendLine($"        {itemCode}<br>");
                            itemRows.AppendLine($"        <small>{itemDescription}</small>");
                            itemRows.AppendLine("    </td>");

                            itemRows.AppendLine($"    <td style='text-align:right;'>{qty}</td>");
                            itemRows.AppendLine($"    <td style='text-align:center;'>{unit}</td>");
                            itemRows.AppendLine($"    <td style='text-align:center;'>{deliveryDate}</td>");

                            itemRows.AppendLine("</tr>");

                            slNo++;
                        }

                        string printDateTime = DateTimeHelper.ConvertDateTimeStringToSpecificFormat(DateTime.Now.ToString(), DateTimeFormatConstants.DDMMYYYY_SLASH_HHMM_DATETIMEFORMAT);

                        WorkOrderEmailBodyTemplate = WorkOrderEmailBodyTemplate.Replace("#PrintDateTime#", printDateTime);
                        WorkOrderEmailBodyTemplate = WorkOrderEmailBodyTemplate.Replace("#SupplierSection#", supplierSection.ToString());
                        WorkOrderEmailBodyTemplate = WorkOrderEmailBodyTemplate.Replace("#ItemRows#", itemRows.ToString());

                        string LogoFileName = "inspire-magnetics-logo.png";
                        string logoPath = Path.Combine(CommonHelper.GetActualPath(_webHostEnvironment, "Content"), "Images", LogoFileName);
                        if (File.Exists(logoPath))
                        {
                            string LogoBase64 = FileHelper.ConvertFileToBase64(logoPath);
                            if (!string.IsNullOrEmpty(LogoBase64))
                            {
                                string LogoImageFileContentType = CommonHelper.GetFileContentType(LogoFileName);
                                string imgSrc = $"data:{LogoImageFileContentType};base64,{LogoBase64}";
                                string LogoImage = $@"<img src='{imgSrc}' alt='Inspire Magnetics' class='logo-img'/>";
                                WorkOrderEmailBodyTemplate = WorkOrderEmailBodyTemplate.Replace("#CompanyLogoImage#", LogoImage);
                            }
                        }
                        string tempFolderPath = CommonHelper.GetActualPath(_webHostEnvironment, "TempPDFFiles");
                        var TempfileName = "TempWorkOrderTemplate.html";
                        string PDFFileName = $"WorkOrderPDF_{WorkOrderID.Replace("/", "-")}";
                        TempWorkOrderHtmlFilePath = Path.Combine(tempFolderPath, TempfileName);
                        Helper.DeleteFile(TempWorkOrderHtmlFilePath);
                        File.WriteAllText(TempWorkOrderHtmlFilePath, WorkOrderEmailBodyTemplate);
                        byte[] pdfBytes = PDFHelper.ConvertHTMLToPDF(TempWorkOrderHtmlFilePath, true, false, null, false, null, false, null, null);

                        if (pdfBytes.Length > 0)
                        {
                            string pdfBase64 = Convert.ToBase64String(pdfBytes);
                            if (!string.IsNullOrEmpty(pdfBase64))
                            {
                                var result = new FileHelper.Base64File(pdfBase64, PDFFileName, FileHelper.GetFileExtension(FileTypes.Pdf));
								WorkOrderPDFDocumentBase64 = result.Base64;
                            }
                        }

                        if (!string.IsNullOrEmpty(WorkOrderPDFDocumentBase64))
                        {
                            WorkOrderPDFDocumentBase64 = Helper.CleanBase64(WorkOrderPDFDocumentBase64);
                            List<List<string>> rows = new List<List<string>>
							{
								new List<string> { Convert.ToString(_objWorkOrderHeaderPDF.WorkOrderID), Helper.ToProperCase(MessageTypeConstants.Success), "Work Order PDF Generated Successfully !!!", $"{PDFFileName}.{FileTypes.Pdf}", WorkOrderPDFDocumentBase64 }
							};
                            finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        }
						else
						{
                            List<List<string>> rows = new List<List<string>>
							{
								new List<string> { Convert.ToString(_objWorkOrderHeaderPDF.WorkOrderID), Helper.ToProperCase(MessageTypeConstants.Error), "Failed To Generate Work Order PDF !!!", string.Empty, string.Empty }
							};
                            finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        }
                    }
                    else
                    {
                        string Message = ds.Tables[0].Rows[0]["Message"].ToString();
                        List<List<string>> rows = new List<List<string>>
						{
							new List<string> { Convert.ToString(_objWorkOrderHeaderPDF.WorkOrderID), Helper.ToProperCase(MessageTypeConstants.Error), Message, string.Empty, string.Empty }
						};
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
					{
						new List<string> { Convert.ToString(_objWorkOrderHeaderPDF.WorkOrderID), Helper.ToProperCase(MessageTypeConstants.Error), ResponseMessageConstants.NoDataFound, string.Empty, string.Empty }
					};
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.DeleteFile(TempWorkOrderHtmlFilePath);
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetWorkOrderHeaderPDF()", ex.Message, false);
                throw;
            }

            return finalDataSet;
        }

        #endregion [Work Order Header]

        #region[Job Card]

        /// <summary>
        /// This Method Is Used To Save and Update Job Card Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCard"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateJobCard(ODBCHelper _objODBCHelper, JobCard _objJobCard)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objJobCard, Helper.XML_PARAMS, StoredProcedure.JOB_CARD);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "JOB_CARD_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateJobCard()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Job Card Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetJobCardDetails(ODBCHelper _objODBCHelper, JobCardDetailsRequestParam _objJobCardDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                JobCard _objJobCard = new JobCard();
                _objJobCard.WorkOrderLineID = _objJobCardDetailsRequestParam.WorkOrderLineID;
                _objJobCard.JobCardID = _objJobCardDetailsRequestParam.JobCardID;
                _objJobCard.ParamType = "GetJobCardDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objJobCard, Helper.XML_PARAMS, StoredProcedure.JOB_CARD);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "JOB_CARD_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetJobCardDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Job Card List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardPaginationListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetJobCardList(ODBCHelper _objODBCHelper, SearchJobCardListRequestParam _objJobCardPaginationListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                JobCard _objJobCard = new JobCard();
                _objJobCard.PageSize = _objJobCardPaginationListRequestParam.PageSize;
                _objJobCard.PageNumber = _objJobCardPaginationListRequestParam.PageNumber;
                _objJobCard.SortColumns = (_objJobCardPaginationListRequestParam.SearchFilter != null && _objJobCardPaginationListRequestParam.SearchFilter.Any()) ? string.Join(",", _objJobCardPaginationListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objJobCard.ColumnName = (_objJobCardPaginationListRequestParam.SearchFilter != null && _objJobCardPaginationListRequestParam.SearchFilter.Any()) ? string.Join(",", _objJobCardPaginationListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objJobCard.IsGlobalSearch = _objJobCardPaginationListRequestParam.IsGlobalSearch;
                _objJobCard.SortOrder = _objJobCardPaginationListRequestParam.SortOrder;
                _objJobCard.SearchKeyword = (_objJobCardPaginationListRequestParam.SearchFilter != null && _objJobCardPaginationListRequestParam.SearchFilter.Any()) ? string.Join(",", _objJobCardPaginationListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objJobCard.ShortCut = _objJobCardPaginationListRequestParam.ShortCut;
                _objJobCard.ParamType = "GetJobCardListByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objJobCard, Helper.XML_PARAMS, StoredProcedure.JOB_CARD);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<SearchJobCardListRequestParam>(_objJobCardPaginationListRequestParam, finalDataSet, "TOTAL_RECORDS", "JOB_CARD_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetJobCardList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Logged In Person Job Card List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objLoggedInPersonJobCardPaginationListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetLoggedInPersonJobCardList(ODBCHelper _objODBCHelper, SearchLoggedInPersonJobCardListRequestParam _objLoggedInPersonJobCardPaginationListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                JobCard _objJobCard = new JobCard();
                _objJobCard.PageSize = _objLoggedInPersonJobCardPaginationListRequestParam.PageSize;
                _objJobCard.PageNumber = _objLoggedInPersonJobCardPaginationListRequestParam.PageNumber;
                _objJobCard.SortColumns = (_objLoggedInPersonJobCardPaginationListRequestParam.SearchFilter != null && _objLoggedInPersonJobCardPaginationListRequestParam.SearchFilter.Any()) ? string.Join(",", _objLoggedInPersonJobCardPaginationListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objJobCard.ColumnName = (_objLoggedInPersonJobCardPaginationListRequestParam.SearchFilter != null && _objLoggedInPersonJobCardPaginationListRequestParam.SearchFilter.Any()) ? string.Join(",", _objLoggedInPersonJobCardPaginationListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objJobCard.IsGlobalSearch = _objLoggedInPersonJobCardPaginationListRequestParam.IsGlobalSearch;
                _objJobCard.SortOrder = _objLoggedInPersonJobCardPaginationListRequestParam.SortOrder;
                _objJobCard.SearchKeyword = (_objLoggedInPersonJobCardPaginationListRequestParam.SearchFilter != null && _objLoggedInPersonJobCardPaginationListRequestParam.SearchFilter.Any()) ? string.Join(",", _objLoggedInPersonJobCardPaginationListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objJobCard.ShortCut = _objLoggedInPersonJobCardPaginationListRequestParam.ShortCut;
                _objJobCard.LoginID = _objLoggedInPersonJobCardPaginationListRequestParam.LoginID;
                _objJobCard.ParamType = "GetLoggedInPersonJobCardListByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objJobCard, Helper.XML_PARAMS, StoredProcedure.JOB_CARD);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<SearchLoggedInPersonJobCardListRequestParam>(_objLoggedInPersonJobCardPaginationListRequestParam, finalDataSet, "TOTAL_RECORDS", "LOGGED_IN_PERSON_JOB_CARD_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetLoggedInPersonJobCardList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Job Card List By Work Order List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardListByWorkOrderListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetJobCardListByWorkOrder(ODBCHelper _objODBCHelper, JobCardListByWorkOrderRequestParam _objJobCardListByWorkOrderListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                JobCard _objJobCard = new JobCard();
                _objJobCard.WorkOrderID = _objJobCardListByWorkOrderListRequestParam.WorkOrderID;
                _objJobCard.ParamType = "GetJobCardListByWorkOrder";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objJobCard, Helper.XML_PARAMS, StoredProcedure.JOB_CARD);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "JOB_CARD_LIST_BY_WORK_ORDER_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetJobCardListByWorkOrder()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion[Job Card]

        #region [Job Card Daily]

        /// <summary>
        /// This Method Is Used To Save and Update Job Card Daily Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardDaily"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateJobCardDaily(ODBCHelper _objODBCHelper, JobCardDaily _objJobCardDaily)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
			string TableName = "JOB_CARD_DAILY_RESPONSE";
            try
            {
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objJobCardDaily, Helper.XML_PARAMS, StoredProcedure.JOB_CARD_DAILY);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (OdbcException ex)
            {
                string ExceptionMessage = ODBCDBExceptionHelper.ExtractDatabaseErrorMessage(ex);
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { Convert.ToString(_objJobCardDaily.JobCardDailyID), Helper.ToProperCase(MessageTypeConstants.Error), ExceptionMessage }
                };
                finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                return finalDataSet;
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateJobCardDaily()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Job Card Daily Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardDailyDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetJobCardDailyDetails(ODBCHelper _objODBCHelper, JobCardDailyDetailsRequestParam _objJobCardDailyDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                JobCardDaily _objJobCardDaily = new JobCardDaily();
                _objJobCardDaily.JobCardDailyID = _objJobCardDailyDetailsRequestParam.JobCardDailyID;
                _objJobCardDaily.ParamType = "GetJobCardDailyDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objJobCardDaily, Helper.XML_PARAMS, StoredProcedure.JOB_CARD_DAILY);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "JOB_CARD_DAILY_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetJobCardDailyDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Job Card Daily List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objJobCardDailyListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetJobCardDailyList(ODBCHelper _objODBCHelper, SearchJobCardDailyListRequestParam _objJobCardDailyListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                JobCardDaily _objJobCardDaily = new JobCardDaily();
                _objJobCardDaily.PageSize = _objJobCardDailyListRequestParam.PageSize;
                _objJobCardDaily.PageNumber = _objJobCardDailyListRequestParam.PageNumber;
                _objJobCardDaily.SortColumns = (_objJobCardDailyListRequestParam.SearchFilter != null && _objJobCardDailyListRequestParam.SearchFilter.Any()) ? string.Join(",", _objJobCardDailyListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objJobCardDaily.ColumnName = (_objJobCardDailyListRequestParam.SearchFilter != null && _objJobCardDailyListRequestParam.SearchFilter.Any()) ? string.Join(",", _objJobCardDailyListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objJobCardDaily.IsGlobalSearch = _objJobCardDailyListRequestParam.IsGlobalSearch;
                _objJobCardDaily.SortOrder = _objJobCardDailyListRequestParam.SortOrder;
                _objJobCardDaily.SearchKeyword = (_objJobCardDailyListRequestParam.SearchFilter != null && _objJobCardDailyListRequestParam.SearchFilter.Any()) ? string.Join(",", _objJobCardDailyListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objJobCardDaily.JobCardID = _objJobCardDailyListRequestParam.JobCardID;
                _objJobCardDaily.ParamType = "GetJobCardDailyListByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objJobCardDaily, Helper.XML_PARAMS, StoredProcedure.JOB_CARD_DAILY);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<SearchJobCardDailyListRequestParam>(_objJobCardDailyListRequestParam, finalDataSet, "TOTAL_RECORDS", "JOB_CARD_DAILY_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetJobCardDailyList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Job Card Daily]

        #region [Purchase Order Header]

        /// <summary>
        /// This Method Is Used To Save and Update Purchase Order Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderHeader"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdatePurchaseOrderHeader(ODBCHelper _objODBCHelper, PurchaseOrderHeader _objPurchaseOrderHeader)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string TableName = "PURCAHSE_ORDER_HEADER_RESPONSE";
            try
            {
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objPurchaseOrderHeader, Helper.XML_PARAMS, StoredProcedure.PURCHASE_ORDER_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string Status = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    string Message = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    if (Status == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        int PurchaseOrderNo = 0;
                        int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out PurchaseOrderNo);
                        bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objPurchaseOrderHeader.PurchaseOrderDetail);
                        if (!IsEmpty)
                        {
                            if (_objPurchaseOrderHeader.PurchaseOrderDetail != null && _objPurchaseOrderHeader.PurchaseOrderDetail.Count > 0)
                            {
                                List<PurchaseOrderDetail> lstPurchaseOrderDetail = new List<PurchaseOrderDetail>();
                                lstPurchaseOrderDetail = _objPurchaseOrderHeader.PurchaseOrderDetail;
                                lstPurchaseOrderDetail.ForEach(x => x.PurchaseOrderID = PurchaseOrderNo);

                                var parameters = new List<(string, OdbcType, object, int?)>
                                {
                                    ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                                };
                                bool isInsert = _objPurchaseOrderHeader.PurchaseOrderID == 0;
                                var dsPurchaseOrderDetail = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstPurchaseOrderDetail, lstPurchaseOrderDetail.GetType(), lstPurchaseOrderDetail, Helper.XML_PARAMS, StoredProcedure.PURCHASE_ORDER_DETAIL, parameters);
                                if (Helper.CheckDataSetIsNullOrEmpty(dsPurchaseOrderDetail))
                                {
                                    string PurchaseOrderDetailStatus = Convert.ToString(dsPurchaseOrderDetail.Tables[0].Rows[0]["Status"].ToString());
                                }
                                Message = isInsert ? "Purchase Order Saved Successfully !!!" : "Purchase Order Updated Successfully !!!";
                            }
                        }
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { PurchaseOrderNo.ToString(), Status,  Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
							new List<string> { "0", Status, Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdatePurchaseOrderHeader()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Purchase Order Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderHeaderDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetPurchaseOrderHeaderDetails(ODBCHelper _objODBCHelper, PurchaseOrderHeaderDetailsRequestParam _objPurchaseOrderHeaderDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "PURCHASE_ORDER_HEADER_RESPONSE";
            try
            {
                PurchaseOrderHeader _objPurchaseOrderHeader = Helper.ToCopyClassProperties<PurchaseOrderHeaderDetailsRequestParam, PurchaseOrderHeader>(_objPurchaseOrderHeaderDetailsRequestParam);
                _objPurchaseOrderHeader.ParamType = "GetPurchaseOrderHeaderDetail";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objPurchaseOrderHeader, Helper.XML_PARAMS, StoredProcedure.PURCHASE_ORDER_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(finalDataSet))
                {
                    string DBStatus = Helper.ToProperCase(Convert.ToString(finalDataSet.Tables[0].Rows[0]["Status"].ToString()));
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        finalDataSet = Helper.CheckAndValidateMultipleDatasetTable(finalDataSet, (DataSetDataTableConstants.Table, TableName), (DataSetDataTableConstants.Table1, "PURCHASE_ORDER_DETAILS_RESPONSE"));
                    }
                    else
                    {
                        finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetPurchaseOrderHeaderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Purchase Order Header List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderHeaderListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetPurchaseOrderHeaderList(ODBCHelper _objODBCHelper, PurchaseOrderHeaderSearchListRequestParam _objPurchaseOrderHeaderListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                PurchaseOrderHeader _objPurchaseOrderHeader = new PurchaseOrderHeader();
                _objPurchaseOrderHeader.PageSize = _objPurchaseOrderHeaderListRequestParam.PageSize;
                _objPurchaseOrderHeader.PageNumber = _objPurchaseOrderHeaderListRequestParam.PageNumber;
                _objPurchaseOrderHeader.SortColumns = (_objPurchaseOrderHeaderListRequestParam.SearchFilter != null && _objPurchaseOrderHeaderListRequestParam.SearchFilter.Any()) ? string.Join(",", _objPurchaseOrderHeaderListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objPurchaseOrderHeader.ColumnName = (_objPurchaseOrderHeaderListRequestParam.SearchFilter != null && _objPurchaseOrderHeaderListRequestParam.SearchFilter.Any()) ? string.Join(",", _objPurchaseOrderHeaderListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objPurchaseOrderHeader.IsGlobalSearch = _objPurchaseOrderHeaderListRequestParam.IsGlobalSearch;
                _objPurchaseOrderHeader.SortOrder = _objPurchaseOrderHeaderListRequestParam.SortOrder;
                _objPurchaseOrderHeader.ShortCut = _objPurchaseOrderHeaderListRequestParam.ShortCut;
                _objPurchaseOrderHeader.SearchKeyword = (_objPurchaseOrderHeaderListRequestParam.SearchFilter != null && _objPurchaseOrderHeaderListRequestParam.SearchFilter.Any()) ? string.Join(",", _objPurchaseOrderHeaderListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objPurchaseOrderHeader.ParamType = "GetPurchaseOrderHeaderListByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objPurchaseOrderHeader, Helper.XML_PARAMS, StoredProcedure.PURCHASE_ORDER_HEADER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<PurchaseOrderHeaderSearchListRequestParam>(_objPurchaseOrderHeaderListRequestParam, finalDataSet, "TOTAL_RECORDS", "PURCHASE_ORDER_HEADER_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetPurchaseOrderHeaderList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Short Close Or Recal Purchase Order.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objShortCloseOrRecallPurchaseOrderDetails"></param>
        /// <returns></returns>
        public async Task<DataSet> ShortCloseOrRecallPurchaseOrderDetails(ODBCHelper _objODBCHelper, PurchaseOrderShortCloseORRecall _objShortCloseOrRecallPurchaseOrderDetails)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                PurchaseOrderHeader _objPurchaseOrderHeader = Helper.ToCopyClassProperties<PurchaseOrderShortCloseORRecall, PurchaseOrderHeader>(_objShortCloseOrRecallPurchaseOrderDetails);
                _objPurchaseOrderHeader.ParamType = "PurchaseOrderShortCloseORRecall";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objPurchaseOrderHeader, Helper.XML_PARAMS, StoredProcedure.PURCHASE_ORDER_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "SHORTCLOSE_OR_RECALL_PURCHASE_ORDER_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ShortCloseOrRecallPurchaseOrderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Approve Purchase Order.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApprovePurchaseOrderHeaderDetails"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <param name="mapper"></param>
        /// <returns></returns>
        public async Task<DataSet> ApprovePurchaseOrderHeaderDetails(ODBCHelper _objODBCHelper, PurchaseOrderHeaderApproveDetails _objApprovePurchaseOrderHeaderDetails, IWebHostEnvironment _webHostEnvironment, IMapper mapper)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string DBMessage = string.Empty;
            string TableName = "APPROVE_PURCHASE_ORDER_DETAILS_RESPONSE";
            try
            {
                PurchaseOrderHeader _objPurchaseOrderHeader = Helper.ToCopyClassProperties<PurchaseOrderHeaderApproveDetails, PurchaseOrderHeader>(_objApprovePurchaseOrderHeaderDetails);
                _objPurchaseOrderHeader.ParamType = "ApprovePurchaseOrderHeaderDetails";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objPurchaseOrderHeader, Helper.XML_PARAMS, StoredProcedure.PURCHASE_ORDER_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string DBStatus = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    DBMessage = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    string PurchaseOrderID = Convert.ToString(ds.Tables[0].Rows[0]["ID"].ToString());
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        _objPurchaseOrderHeader.ParamType = "ApprovedPurchaseOrderEmailConfig";
                        var dsApprovedPurchaseOrderEmailConfig = await _objODBCHelper.ExecuteXMLStoredProcedure(_objPurchaseOrderHeader, Helper.XML_PARAMS, StoredProcedure.PURCHASE_ORDER_HEADER);
                        if(Helper.CheckDataSetIsNullOrEmpty(dsApprovedPurchaseOrderEmailConfig))
                        {
                            string ApprovedPurchaseOrderEmailConfigDBStatus = Helper.ToProperCase(Convert.ToString(dsApprovedPurchaseOrderEmailConfig.Tables[0].Rows[0]["Status"].ToString()));
                            if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                            {
                                var row = dsApprovedPurchaseOrderEmailConfig.Tables[0].Rows[0];
                                string PurchaseOrderNo = Convert.ToString(row["PurchaseOrderNo"]);
                                string PurchaseOrderDate = Convert.ToString(row["PurchaseOrderDate"]);
                                string SupplierName = Convert.ToString(row["SupplierName"]);
                                string SupplierEmailID = Convert.ToString(row["SupplierEmailID"]);
                                string CompanyName = Convert.ToString(row["CompanyName"]);
                                if (!string.IsNullOrEmpty(SupplierEmailID))
                                {
                                    List<Attachment> FileAttachments = new List<Attachment>();
                                    string EmailBodyTemplate = await CommonHelper.ReadHTMLTemplateUsingStreamReaderAsync(_webHostEnvironment, "PurchaseOrderApprovedEmailTemplate.html");
                                    EmailBodyTemplate = EmailBodyTemplate.Replace("#PurchaseOrderNo#", PurchaseOrderNo);
                                    EmailBodyTemplate = EmailBodyTemplate.Replace("#PurchaseOrderDate#", PurchaseOrderDate);
                                    EmailBodyTemplate = EmailBodyTemplate.Replace("#SupplierName#", SupplierName);
                                    EmailBodyTemplate = EmailBodyTemplate.Replace("#ApproverName#", _objApprovePurchaseOrderHeaderDetails.ApprovedBy);
                                    EmailBodyTemplate = EmailBodyTemplate.Replace("#CompanyName#", CompanyName);
                                    EmailBodyTemplate = EmailBodyTemplate.Replace("#CurrentYear#", DateTime.Now.Year.ToString());

                                    SendEmailRequestParam objSendEmailRequestParam = new SendEmailRequestParam();
                                    objSendEmailRequestParam.ToEmail = SupplierEmailID;
                                    objSendEmailRequestParam.CCEmail = "";
                                    objSendEmailRequestParam.EmailSubject = $"Purchase Order Approved For PO No.: {PurchaseOrderNo}";
                                    objSendEmailRequestParam.EmailBody = EmailBodyTemplate;

                                    PurchaseOrderHeaderPDF _objPurchaseOrderHeaderPDF = Helper.ToCopyClassProperties<PurchaseOrderHeaderApproveDetails, PurchaseOrderHeaderPDF>(_objApprovePurchaseOrderHeaderDetails);
                                    var dsPurchaseOrderPDF = await GetPurchaseOrderHeaderPDF(_objODBCHelper, _objPurchaseOrderHeaderPDF, _webHostEnvironment);
                                    if(Helper.CheckDataSetIsNullOrEmpty(dsPurchaseOrderPDF))
                                    {
                                        string PurchaseOrderPDFDBStatus = Helper.ToProperCase(Convert.ToString(dsPurchaseOrderPDF.Tables[0].Rows[0]["Status"].ToString()));
                                        if (PurchaseOrderPDFDBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                                        {
                                            string PurchaseOrderPDFBase64 = Convert.ToString(dsPurchaseOrderPDF.Tables[0].Rows[0]["PurchaseOrderPDFBase64"].ToString());
                                            if (!string.IsNullOrWhiteSpace(PurchaseOrderPDFBase64))
                                            {
                                                var attachment = FileHelper.BuildAttachmentFromBase64(PurchaseOrderPDFBase64, $"{PurchaseOrderNo}");
                                                if (attachment != null)
                                                {
                                                    FileAttachments.Add(attachment);
                                                }
                                                var EmailReturnResult = CommonHelper.SendEmailAPIWithMultipleAttachments(_webHostEnvironment, objSendEmailRequestParam, mapper, FileAttachments);
                                                string ReturnResult = ObjectToJson.ConvertDataSetToJson(EmailReturnResult);
                                                JObject jObjectEmail = ApiHelper.GetDataInJObject(Util.OK(ReturnResult));
                                                string status = ApiHelper.CheckResByTableName(jObjectEmail, Helper.EMAIL_SENT_RESPONSE_TABLE_NAME, 1);
                                                string EmailSentResponseReturnResult = "But Failed To Send an Email Notification To Supplier !!!";
                                                if (status == "ok")
                                                {
                                                    var message = jObjectEmail["data"]?[Helper.EMAIL_SENT_RESPONSE_TABLE_NAME]?.ToObject<SendEmailResponseParam[]>()?.FirstOrDefault()?.Message;
                                                    if (string.Equals(message, Helper.EmailSuccess, StringComparison.OrdinalIgnoreCase))
                                                    {
                                                        DBMessage = DBMessage.Replace("!!!", ",");
                                                        DBMessage = Regex.Replace(DBMessage, @"\s+,", ",");
                                                        DBMessage += $" and Email Notification Sent To Supplier !!!";

                                                        List<List<string>> rows = new List<List<string>>
                                                        {
                                                            new List<string> { PurchaseOrderID.ToString(), Helper.ToProperCase(MessageTypeConstants.Success), DBMessage }
                                                        };
                                                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                                                        return finalDataSet;
                                                    }
                                                }
                                                else
                                                {
                                                    DBMessage = DBMessage.Replace("!!!", ",");
                                                    DBMessage = Regex.Replace(DBMessage, @"\s+,", ",");
                                                    DBMessage += $" {EmailSentResponseReturnResult}";
                                                    List<List<string>> rows = new List<List<string>>
                                                    {
                                                        new List<string> { PurchaseOrderID.ToString(), Helper.ToProperCase(MessageTypeConstants.Success), DBMessage }
                                                    };
                                                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                                                    return finalDataSet;
                                                }
                                            }
                                        }
                                        else
                                        {
                                            DBMessage = DBMessage.Replace("!!!", ",");
                                            DBMessage = Regex.Replace(DBMessage, @"\s+,", ",");
                                            DBMessage += " But Failed To Send Email Notification Due To Purchase Order PDF Not Available !!!";
                                            List<List<string>> rows = new List<List<string>>
                                            {
                                                new List<string> { PurchaseOrderID.ToString(), Helper.ToProperCase(MessageTypeConstants.Success), DBMessage }
                                            };
                                            finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                                            return finalDataSet;
                                        }
                                    }
                                }
                                else
                                {
                                    DBMessage = DBMessage.Replace("!!!", ",");
                                    DBMessage = Regex.Replace(DBMessage, @"\s+,", ",");
                                    DBMessage += " But Supplier Email ID Not Found To Send Email Notification !!!";
                                    List<List<string>> rows = new List<List<string>>
                                    {
                                        new List<string> { PurchaseOrderID.ToString(), Helper.ToProperCase(MessageTypeConstants.Success), DBMessage }
                                    };
                                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                                    return finalDataSet;
                                }
                            }
                            else
                            {
                                DBMessage = string.Empty;
                                DBMessage = Convert.ToString(dsApprovedPurchaseOrderEmailConfig.Tables[0].Rows[0]["Message"].ToString());
                                List<List<string>> rows = new List<List<string>>
                                {
                                    new List<string> { PurchaseOrderID.ToString(), Helper.ToProperCase(MessageTypeConstants.Error), DBMessage }
                                };
                                finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                                return finalDataSet;
                            }
                        }
                    }
                    else
                    {
                        DBMessage = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { _objApprovePurchaseOrderHeaderDetails.PurchaseOrderID.ToString(), Helper.ToProperCase(MessageTypeConstants.Error), DBMessage }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ApprovePurchaseOrderHeaderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Purchase Order Header PDF.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderHeaderPDF"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <returns></returns>
        public async Task<DataSet> GetPurchaseOrderHeaderPDF(ODBCHelper _objODBCHelper, PurchaseOrderHeaderPDF _objPurchaseOrderHeaderPDF, IWebHostEnvironment _webHostEnvironment)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "PurchaseOrderID", "Status", "Message", "PurchasePDFFileName", "PurchaseOrderPDFBase64" };
            string TableName = "PURCHASE_ORDER_PDF_RESPONSE";
            string TempPurchaseOrderHtmlFilePath = string.Empty;
            string PurchaseOrderPDFDocumentBase64 = string.Empty;
            try
            {
                PurchaseOrderHeader _objPurchaseOrderHeader = Helper.ToCopyClassProperties<PurchaseOrderHeaderPDF, PurchaseOrderHeader>(_objPurchaseOrderHeaderPDF);
                _objPurchaseOrderHeader.ParamType = "GetPurchaseOrderHeaderPDF";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objPurchaseOrderHeader, Helper.XML_PARAMS, StoredProcedure.PURCHASE_ORDER_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string DBStatus = Helper.ToProperCase(ds.Tables[0].Rows[0]["Status"].ToString());
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        string CompanyName = Convert.ToString(ds.Tables[0].Rows[0]["CompanyName"]);
                        string CompanyAddress = Convert.ToString(ds.Tables[0].Rows[0]["CompanyAddress"]);
                        string CompanyGSTINNo = Convert.ToString(ds.Tables[0].Rows[0]["CompanyGSTINNo"]);
                        string CompanyStateName = Convert.ToString(ds.Tables[0].Rows[0]["CompanyStateName"]);
                        string CompanyStateCode = Convert.ToString(ds.Tables[0].Rows[0]["CompanyStateCode"]);
                        string PONumber = Convert.ToString(ds.Tables[0].Rows[0]["VoucherNumber"]);
                        string Dated = DateTimeHelper.ConvertDateTimeStringToSpecificFormat(Convert.ToString(ds.Tables[0].Rows[0]["Dated"]), DateTimeFormatConstants.DDMMYYYY_SLASH_DATEFORMAT);
                        string ModeOrTermsOfPayment = Convert.ToString(ds.Tables[0].Rows[0]["ModeOrTermsOfPayment"]);
                        string ReferenceNoAndDate = Convert.ToString(ds.Tables[0].Rows[0]["ReferenceNoAndDate"]);
                        string OtherReferences = Convert.ToString(ds.Tables[0].Rows[0]["OtherReferences"]);
                        string DispatchedThrough = Convert.ToString(ds.Tables[0].Rows[0]["DispatchedThrough"]);
                        string Destination = Convert.ToString(ds.Tables[0].Rows[0]["Destination"]);
                        string TermsOfDelivery = Convert.ToString(ds.Tables[0].Rows[0]["TermsOfDelivery"]);
                        string ConsigneeCompanyName = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneeName"]);
                        string ConsigneeAddress = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneeAddress"]);
                        string ConsigneeAddressFiveLines = string.Join("<br />", ConsigneeAddress.Replace("\r\n", "\n")
                            .Replace("\r", "\n")
                            .Split('\n')
                            .Take(5));
                        string ConsigneeGSTIN = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneeGSTIN"]);
                        string ConsigneePANNo = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneePANNo"]);
                        string ConsigneeStateName = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneeStateName"]);
                        string ConsigneeStateCode = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneeStateCode"]);
                        string SupplierName = Convert.ToString(ds.Tables[0].Rows[0]["SupplierName"]);
                        string SupplierAddress = Convert.ToString(ds.Tables[0].Rows[0]["SupplierAddress"]);
                        string SupplierAddressFiveLines = string.Join("<br />", SupplierAddress.Replace("\r\n", "\n")
                            .Replace("\r", "\n")
                            .Split('\n')
                            .Take(5));
                        string SupplierGSTIN = Convert.ToString(ds.Tables[0].Rows[0]["SupplierGSTIN"]);
                        string SupplierStateName = Convert.ToString(ds.Tables[0].Rows[0]["SupplierStateName"]);
                        string SupplierStateCode = Convert.ToString(ds.Tables[0].Rows[0]["SupplierStateCode"]);

                        string PurchaseOrderID = Convert.ToString(ds.Tables[0].Rows[0]["PurchaseOrderID"]);

                        string PurchaseOrderEmailBodyTemplate = await CommonHelper.ReadHTMLTemplateUsingStreamReaderAsync(_webHostEnvironment, "PurchaseOrderTemplate.html");
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#InvoiceToCompanyName#", CompanyName);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#InvoiceToAddress#", CompanyAddress);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#InvoiceToGSTIN#", CompanyGSTINNo);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#CompanyStateName#", CompanyStateName);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#CompanyStateCode#", CompanyStateCode);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#PONo#", PONumber);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#Date#", Dated);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#PaymentTerms#", ModeOrTermsOfPayment);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#ReferenceNo#", ReferenceNoAndDate);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#OtherReferences#", OtherReferences);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#DispatchedThrough#", DispatchedThrough);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#Destination#", Destination);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#TermsOfDelivery#", TermsOfDelivery);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#ConsigneeCompanyName#", ConsigneeCompanyName);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#ConsigneeAddress#", ConsigneeAddressFiveLines);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#ConsigneeGSTIN#", ConsigneeGSTIN);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#ConsigneePAN#", ConsigneePANNo);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#ConsigneeStateName#", ConsigneeStateName);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#ConsigneeStateCode#", ConsigneeStateCode);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#SupplierName#", SupplierName);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#SupplierAddress#", SupplierAddressFiveLines);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#SupplierGSTIN#", SupplierGSTIN);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#SupplierStateName#", SupplierStateName);
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#SupplierStateCode#", SupplierStateCode);

                        int slNo = 1;
                        StringBuilder itemRows = new StringBuilder();
                        StringBuilder cgstRows = new StringBuilder();
                        StringBuilder sgstRows = new StringBuilder();
                        StringBuilder igstRows = new StringBuilder();
                        StringBuilder defaultRows = new StringBuilder();
                        StringBuilder totalRows = new StringBuilder();

                        foreach (DataRow row in ds.Tables[0].Rows)
                        {
                            string itemDescription = Convert.ToString(row["ItemDescription"]);
                            string DueOn = DateTimeHelper.ConvertDateTimeStringToSpecificFormat(Convert.ToString(row["DueOn"]), DateTimeFormatConstants.DDMMYYYY_SLASH_DATEFORMAT);
                            string qty = Convert.ToString(row["QuantityOrdered"]);
                            string itemUnit = Convert.ToString(row["Per"]);
                            decimal Rate = Convert.ToDecimal(row["Rate"]);
                            string Percentage = Convert.ToString(row["Per"]);
                            decimal Amount = Convert.ToDecimal(row["Amount"]);

                            itemRows.AppendLine("<tr>");
                            itemRows.AppendLine($"<td class='col-si'>{slNo}</td>");
                            itemRows.AppendLine($"<td class='col-desc'>{itemDescription}</td>");
                            itemRows.AppendLine($"<td class='col-dueon'>{DueOn}</td>");
                            itemRows.AppendLine($"<td class='col-qty'><strong>{qty} {itemUnit}</strong></td>");
                            itemRows.AppendLine($"<td class='col-rate'>{Helper.FormatToIndianCurrency<string>(Rate.ToString(), 2)}</td>");
                            itemRows.AppendLine($"<td class='col-per'>{Percentage}</td>");
                            itemRows.AppendLine($"<td class='col-amount'>{Helper.FormatToIndianCurrency<string>(Amount.ToString(), 2)}</td>");
                            itemRows.AppendLine("</tr>");
                            slNo++;
                        }

                        bool isIGSTRequired = bool.TryParse(Convert.ToString(ds.Tables[0].Rows[0]["IsIGSTRequired"]), out bool isIGSTRequiredResult) ? isIGSTRequiredResult : false;
                        decimal totalAmount = ds.Tables[0].AsEnumerable().Sum(r => r.Field<decimal?>("Amount") ?? 0);
                        decimal totalCGST = ds.Tables[0].AsEnumerable().Sum(r => r.Field<decimal?>("CGST") ?? 0);
                        decimal totalSGST = ds.Tables[0].AsEnumerable().Sum(r => r.Field<decimal?>("SGST") ?? 0);
                        decimal totalIGST = ds.Tables[0].AsEnumerable().Sum(r => r.Field<decimal?>("IGST") ?? 0);
                        decimal totalQuantityOrdered = ds.Tables[0].AsEnumerable().Sum(r => decimal.TryParse(Convert.ToString(r["QuantityOrdered"]), out decimal qty) ? qty : 0);
                        var units = ds.Tables[0].AsEnumerable().Select(r => r["Per"] == DBNull.Value ? string.Empty : r["Per"].ToString()).Distinct().ToList();
                        string TotalUnit = units.Count == 1 ? units.First() : string.Empty;
                        string DisplayTotalQuantityOrdered = units.Count == 1 ? totalQuantityOrdered.ToString() : string.Empty;
                        decimal GrandTotal = 0;
                        if (isIGSTRequired)
                        {
                            igstRows.AppendLine("<tr class='tax-row'>");
                            igstRows.AppendLine($"<td class='col-si'></td>");
                            igstRows.AppendLine($"<td class='col-desc' style='text-align: right; padding-right: 15px;'><strong>IGST</strong></td>");
                            igstRows.AppendLine($"<td class='col-dueon'></td>");
                            igstRows.AppendLine($"<td class='col-qty'></td>");
                            igstRows.AppendLine($"<td class='col-rate'></td>");
                            igstRows.AppendLine($"<td class='col-per'></td>");
                            igstRows.AppendLine($"<td class='col-amount'><strong>{Helper.FormatToIndianCurrency<string>(totalIGST.ToString(), 2)}</strong></td>");
                            igstRows.AppendLine("</tr>");
                            cgstRows.AppendLine(string.Empty);
                            sgstRows.AppendLine(string.Empty);
                            GrandTotal = totalAmount + totalIGST;
                        }
                        else
                        {
                            cgstRows.AppendLine("<tr class='tax-row'>");
                            cgstRows.AppendLine($"<td class='col-si'></td>");
                            cgstRows.AppendLine($"<td class='col-desc' style='text-align: right; padding-right: 15px;'><strong>CGST</strong></td>");
                            cgstRows.AppendLine($"<td class='col-dueon'></td>");
                            cgstRows.AppendLine($"<td class='col-qty'></td>");
                            cgstRows.AppendLine($"<td class='col-rate'></td>");
                            cgstRows.AppendLine($"<td class='col-per'></td>");
                            cgstRows.AppendLine($"<td class='col-amount'><strong>{Helper.FormatToIndianCurrency<string>(totalCGST.ToString(), 2)}</strong></td>");
                            cgstRows.AppendLine("</tr>");

                            sgstRows.AppendLine("<tr class='tax-row'>");
                            sgstRows.AppendLine($"<td class='col-si'></td>");
                            sgstRows.AppendLine($"<td class='col-desc' style='text-align: right; padding-right: 15px;'><strong>SGST</strong></td>");
                            sgstRows.AppendLine($"<td class='col-dueon'></td>");
                            sgstRows.AppendLine($"<td class='col-qty'></td>");
                            sgstRows.AppendLine($"<td class='col-rate'></td>");
                            sgstRows.AppendLine($"<td class='col-per'></td>");
                            sgstRows.AppendLine($"<td class='col-amount'><strong>{Helper.FormatToIndianCurrency<string>(totalSGST.ToString(), 2)}</strong></td>");
                            sgstRows.AppendLine("</tr>");

                            igstRows.AppendLine(string.Empty);

                            GrandTotal = totalAmount + totalCGST + totalSGST;
                        }

                        defaultRows.AppendLine("<tr style='height: 150px;'>");
                        defaultRows.AppendLine($"<td class='col-si'></td>");
                        defaultRows.AppendLine($"<td class='col-desc'></td>");
                        defaultRows.AppendLine($"<td class='col-dueon'></td>");
                        defaultRows.AppendLine($"<td class='col-qty'></td>");
                        defaultRows.AppendLine($"<td class='col-rate'></td>");
                        defaultRows.AppendLine($"<td class='col-per'></td>");
                        defaultRows.AppendLine($"<td class='col-amount'></td>");
                        defaultRows.AppendLine("</tr>");

                        totalRows.AppendLine("<tr class='total-row'>");
                        totalRows.AppendLine($"<td colspan='3' style='text-align: right; padding-right: 10px; border-top: 1px solid #000;'>Total</td>");
                        totalRows.AppendLine($"<td class='col-qty' style='border-top: 1px solid #000; text-align: center;'><strong>{DisplayTotalQuantityOrdered} {TotalUnit}</strong></td>");
                        totalRows.AppendLine($"<td colspan='2' style='border-top: 1px solid #000;'></td>");
                        totalRows.AppendLine($"<td class='col-amount' style='border-top: 1px solid #000;'><strong>&#x20B9;{Helper.FormatToIndianCurrency<string>(GrandTotal.ToString(), 2)}</strong></td>");
                        totalRows.AppendLine("</tr>");

                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#ItemRows#", itemRows.ToString());
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#CGSTRows#", cgstRows.ToString());
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#SGSTRows#", sgstRows.ToString());
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#IGSTRows#", igstRows.ToString());
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#DefaultRows#", defaultRows.ToString());

                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#TotalRows#", totalRows.ToString());
                        PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#AmountInWords#", NumberToWordsConverter.ToIndianWords(GrandTotal));

                        string LogoFileName = "inspire-magnetics-logo.png";
                        string logoPath = Path.Combine(CommonHelper.GetActualPath(_webHostEnvironment, "Content"), "Images", LogoFileName);
                        if (File.Exists(logoPath))
                        {
                            string LogoBase64 = FileHelper.ConvertFileToBase64(logoPath);
                            if (!string.IsNullOrEmpty(LogoBase64))
                            {
                                string LogoImageFileContentType = CommonHelper.GetFileContentType(LogoFileName);
                                string imgSrc = $"data:{LogoImageFileContentType};base64,{LogoBase64}";
                                string LogoImage = $@"<img src='{imgSrc}' alt='Inspire Magnetics' class='logo-img' width='90' height='75' style='display: block; object-fit: contain;'/>";
                                PurchaseOrderEmailBodyTemplate = PurchaseOrderEmailBodyTemplate.Replace("#CompanyLogoImage#", LogoImage);
                            }
                        }
                        string tempFolderPath = CommonHelper.GetActualPath(_webHostEnvironment, "TempPDFFiles");
                        var TempfileName = "TempPurchaseOrderTemplate.html";
                        string PDFFileName = $"PurchaseOrderPDF_{PurchaseOrderID.Replace("/", "-")}";
                        TempPurchaseOrderHtmlFilePath = Path.Combine(tempFolderPath, TempfileName);
                        Helper.DeleteFile(TempPurchaseOrderHtmlFilePath);
                        File.WriteAllText(TempPurchaseOrderHtmlFilePath, PurchaseOrderEmailBodyTemplate);
                        byte[] pdfBytes = PDFHelper.ConvertHTMLToPDF(TempPurchaseOrderHtmlFilePath, true, false, null, false, null, false, null, null);

                        if (pdfBytes.Length > 0)
                        {
                            string pdfBase64 = Convert.ToBase64String(pdfBytes);
                            if (!string.IsNullOrEmpty(pdfBase64))
                            {
                                //string Folder = CommonHelper.SaveFileToFolder(pdfBase64, FileTypes.Pdf, _webHostEnvironment);
                                var result = new FileHelper.Base64File(pdfBase64, PDFFileName, FileHelper.GetFileExtension(FileTypes.Pdf));
                                PurchaseOrderPDFDocumentBase64 = result.Base64;
                            }
                        }

                        if (!string.IsNullOrEmpty(PurchaseOrderPDFDocumentBase64))
                        {
                            PurchaseOrderPDFDocumentBase64 = Helper.CleanBase64(PurchaseOrderPDFDocumentBase64);
                            List<List<string>> rows = new List<List<string>>
                            {
                                new List<string> { Convert.ToString(_objPurchaseOrderHeaderPDF.PurchaseOrderID), Helper.ToProperCase(MessageTypeConstants.Success), "Purchase Order PDF Generated Successfully !!!", $"{PDFFileName}.{FileTypes.Pdf}", PurchaseOrderPDFDocumentBase64 }
                            };
                            finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        }
                        else
                        {
                            List<List<string>> rows = new List<List<string>>
                            {
                                new List<string> { Convert.ToString(_objPurchaseOrderHeaderPDF.PurchaseOrderID), Helper.ToProperCase(MessageTypeConstants.Error), "Failed To Generate Purchase Order PDF !!!", string.Empty, string.Empty }
                            };
                            finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        }
                    }
                    else
                    {
                        string Message = ds.Tables[0].Rows[0]["Message"].ToString();
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { Convert.ToString(_objPurchaseOrderHeaderPDF.PurchaseOrderID), Helper.ToProperCase(MessageTypeConstants.Error), Message, string.Empty, string.Empty }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { Convert.ToString(_objPurchaseOrderHeaderPDF.PurchaseOrderID), Helper.ToProperCase(MessageTypeConstants.Error), ResponseMessageConstants.NoDataFound, string.Empty, string.Empty }
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.DeleteFile(TempPurchaseOrderHtmlFilePath);
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetPurchaseOrderHeaderPDF()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Purchase Order Header]

        #region [Work Order GRN]

        /// <summary>
        /// This Method Is Used To Save and Update Work Order GRN Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objGRNHeader"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateWorkOrderGRN(ODBCHelper _objODBCHelper, GRNHeader _objGRNHeader)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string GRNID = string.Empty;
            string DBStatus = string.Empty;
            string DBMessage = string.Empty;
            string TableName = "WORK_ORDER_GRN_RESPONSE";
            bool IsEmpty = false;
            try
            {
                DataSet dsValidateWorkOrderPendingQty = new DataSet();
                IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objGRNHeader.GRNDetail);
                if (!IsEmpty)
                {
                    if (_objGRNHeader.GRNDetail != null && _objGRNHeader.GRNDetail.Count > 0)
                    {
                        List<GRNDetail> lstGRNDetailItems = new List<GRNDetail>();
                        lstGRNDetailItems = _objGRNHeader.GRNDetail;
                        var parameters = new List<(string, OdbcType, object, int?)>
                        {
                            ("ParamType", OdbcType.NVarChar, "ValidateWorkOrderPendingQty", 100)
                        };
                        dsValidateWorkOrderPendingQty = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstGRNDetailItems, lstGRNDetailItems.GetType(), lstGRNDetailItems, Helper.XML_PARAMS, StoredProcedure.GRN_DETAIL, parameters);
                    }
                }
                if (Helper.CheckDataSetIsNullOrEmpty(dsValidateWorkOrderPendingQty))
                {
                    string DBValidateWorkOrderPendingQtyStatus = Helper.ToProperCase(dsValidateWorkOrderPendingQty.Tables[0].Rows[0]["Status"].ToString());
                    DBMessage = dsValidateWorkOrderPendingQty.Tables[0].Rows[0]["Message"].ToString();
                    DBStatus = DBValidateWorkOrderPendingQtyStatus;
                    if (DBValidateWorkOrderPendingQtyStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objGRNHeader, Helper.XML_PARAMS, StoredProcedure.GRN_HEADER);
                        if (Helper.CheckDataSetIsNullOrEmpty(ds))
                        {
                            DBStatus = string.Empty;
                            DBMessage = string.Empty;
                            DBStatus = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                            DBMessage = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                            if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                            {
                                int GRNNo = 0;
                                int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out GRNNo);
                                IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objGRNHeader.GRNDetail);

                                if (!IsEmpty)
                                {
                                    if (_objGRNHeader.GRNDetail != null && _objGRNHeader.GRNDetail.Count > 0)
                                    {
                                        List<GRNDetail> lstGRNDetail = new List<GRNDetail>();
                                        lstGRNDetail = _objGRNHeader.GRNDetail;
                                        lstGRNDetail.ForEach(x => x.GRNID = GRNNo);

                                        var parameters = new List<(string, OdbcType, object, int?)>
                                        {
                                            ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                                        };
                                        bool isInsert = _objGRNHeader.GRNID == 0;
                                        var dsGRNDetail = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstGRNDetail, lstGRNDetail.GetType(), lstGRNDetail, Helper.XML_PARAMS, StoredProcedure.GRN_DETAIL, parameters);
                                        if (Helper.CheckDataSetIsNullOrEmpty(dsGRNDetail))
                                        {
                                            string dsGRNDetailStatus = Helper.ToProperCase(Convert.ToString(dsGRNDetail.Tables[0].Rows[0]["Status"].ToString()));
                                            if (dsGRNDetailStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                                            {
                                                DBMessage = isInsert ? "Work Order GRN Saved Successfully !!!" : "Work Order GRN Updated Successfully !!!";
                                            }
                                            else
                                            {
                                                string dsGRNDetailMessage = Convert.ToString(dsGRNDetail.Tables[0].Rows[0]["Message"].ToString());
                                                List<List<string>> row = new List<List<string>>
                                                {
                                                    new List<string> { GRNNo.ToString(), dsGRNDetailStatus, dsGRNDetailMessage }
                                                };
                                                finalDataSet = Helper.GenerateCommonMessage(columns, row, TableName);
                                                return finalDataSet;
                                            }
                                        }
                                        DBMessage = isInsert ? "Work Order GRN Saved Successfully !!!" : "Work Order GRN Updated Successfully !!!";
                                    }
                                }
                                List<List<string>> rows = new List<List<string>>
                                {
                                    new List<string> { GRNNo.ToString(), DBStatus,  DBMessage }
                                };
                                finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                            }
                            else
                            {
                                List<List<string>> rows = new List<List<string>>
                                {
                                    new List<string> { "0", DBStatus, DBMessage }
                                };
                                finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                                return finalDataSet;
                            }
                        }
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { GRNID, DBStatus, DBMessage}
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { GRNID, DBStatus, DBMessage}
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (OdbcException ex)
            {
                string ExceptionMessage = ODBCDBExceptionHelper.ExtractDatabaseErrorMessage(ex);
                List<List<string>> rows = new List<List<string>>
                 {
                     new List<string> { GRNID, Helper.ToProperCase(MessageTypeConstants.Error), ExceptionMessage }
                 };
                finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                return finalDataSet;
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateWorkOrderGRN()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Work Order GRN Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderGRNDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetWorkOrderGRNDetails(ODBCHelper _objODBCHelper, GRNHeaderDetailsRequestParam _objWorkOrderGRNDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "WORK_ORDER_GRN_HEADER_RESPONSE";
            try
            {
                GRNHeader _objGRNHeader = Helper.ToCopyClassProperties<GRNHeaderDetailsRequestParam, GRNHeader>(_objWorkOrderGRNDetailsRequestParam);
                _objGRNHeader.ParamType = "GetWorkOrderGRNDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objGRNHeader, Helper.XML_PARAMS, StoredProcedure.GRN_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(finalDataSet))
                {
                    string DBStatus = Helper.ToProperCase(Convert.ToString(finalDataSet.Tables[0].Rows[0]["Status"].ToString()));
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        finalDataSet = Helper.CheckAndValidateMultipleDatasetTable(finalDataSet, (DataSetDataTableConstants.Table, TableName), (DataSetDataTableConstants.Table1, "WORK_ORDER_GRN_DETAIL_RESPONSE"));
                    }
                    else
                    {
                        finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetWorkOrderGRNDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to to Get Work Order GRN Header List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objWorkOrderGRNListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetWorkOrderGRNList(ODBCHelper _objODBCHelper, GRNHeaderSearchListRequestParam _objWorkOrderGRNListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                GRNHeader _objGRNHeader = new GRNHeader();
                _objGRNHeader.PageSize = _objWorkOrderGRNListRequestParam.PageSize;
                _objGRNHeader.PageNumber = _objWorkOrderGRNListRequestParam.PageNumber;
                _objGRNHeader.SortColumns = (_objWorkOrderGRNListRequestParam.SearchFilter != null && _objWorkOrderGRNListRequestParam.SearchFilter.Any()) ? string.Join(",", _objWorkOrderGRNListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objGRNHeader.ColumnName = (_objWorkOrderGRNListRequestParam.SearchFilter != null && _objWorkOrderGRNListRequestParam.SearchFilter.Any()) ? string.Join(",", _objWorkOrderGRNListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objGRNHeader.IsGlobalSearch = _objWorkOrderGRNListRequestParam.IsGlobalSearch;
                _objGRNHeader.SortOrder = _objWorkOrderGRNListRequestParam.SortOrder;
                _objGRNHeader.SearchKeyword = (_objWorkOrderGRNListRequestParam.SearchFilter != null && _objWorkOrderGRNListRequestParam.SearchFilter.Any()) ? string.Join(",", _objWorkOrderGRNListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objGRNHeader.ParamType = "GetWorkOrderGRNHeaderByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objGRNHeader, Helper.XML_PARAMS, StoredProcedure.GRN_HEADER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<GRNHeaderSearchListRequestParam>(_objWorkOrderGRNListRequestParam, finalDataSet, "TOTAL_RECORDS", "WORK_ORDER_GRN_HEADER_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetWorkOrderGRNList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Cancel Work Order GRN Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objCancelWorkOrderGRNDetailsDetails"></param>
        /// <returns></returns>
        public async Task<DataSet> CancelWorkOrderGRNDetails(ODBCHelper _objODBCHelper, CancelWorkOrderGRNDetails _objCancelWorkOrderGRNDetailsDetails)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                GRNHeader _objGRNHeader = Helper.ToCopyClassProperties<CancelWorkOrderGRNDetails, GRNHeader>(_objCancelWorkOrderGRNDetailsDetails);
                _objGRNHeader.ParamType = "CancelWorkOrderGRN";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objGRNHeader, Helper.XML_PARAMS, StoredProcedure.GRN_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "CANCEL_WORK_ORDER_GRN_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.CancelWorkOrderGRNDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion  [GRN Header]

        #region [Purchase Order GRN]

        /// <summary>
        /// This Method Is Used To Save and Update Purchase Order GRN Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderGRNRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdatePurchaseOrderGRN(ODBCHelper _objODBCHelper, PurchaseOrderGRNHeader _objPurchaseOrderGRNRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string GRNID = string.Empty;
            string DBStatus = string.Empty;
            string DBMessage = string.Empty;
            bool IsEmpty = false;
            string TableName = "PURCHASE_ORDER_GRN_HEADER_RESPONSE";
            try
            {
                DataSet dsValidatePurchaseOrderPendingQty = new DataSet();
                IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objPurchaseOrderGRNRequestParam.GRNDetail);
                if (!IsEmpty)
                {
                    if (_objPurchaseOrderGRNRequestParam.GRNDetail != null && _objPurchaseOrderGRNRequestParam.GRNDetail.Count > 0)
                    {
                        List<GRNDetail> lstPurchaseOrderGRNDetailItems = new List<GRNDetail>();
                        lstPurchaseOrderGRNDetailItems = _objPurchaseOrderGRNRequestParam.GRNDetail;
                        var parameters = new List<(string, OdbcType, object, int?)>
                        {
                            ("ParamType", OdbcType.NVarChar, "ValidatePurchaseOrderPendingQty", 100)
                        };
                        dsValidatePurchaseOrderPendingQty = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstPurchaseOrderGRNDetailItems, lstPurchaseOrderGRNDetailItems.GetType(), lstPurchaseOrderGRNDetailItems, Helper.XML_PARAMS, StoredProcedure.GRN_DETAIL, parameters);
                    }
                }
                if (Helper.CheckDataSetIsNullOrEmpty(dsValidatePurchaseOrderPendingQty))
                {
                    string DBValidatePurchaseOrderPendingQtyStatus = Helper.ToProperCase(dsValidatePurchaseOrderPendingQty.Tables[0].Rows[0]["Status"].ToString());
                    DBMessage = dsValidatePurchaseOrderPendingQty.Tables[0].Rows[0]["Message"].ToString();
                    DBStatus = DBValidatePurchaseOrderPendingQtyStatus;
                    if (DBValidatePurchaseOrderPendingQtyStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        GRNHeader _objGRNHeader = new GRNHeader();
                        _objGRNHeader.GRNID = _objPurchaseOrderGRNRequestParam.GRNID;
                        _objGRNHeader.GRNNumber = _objPurchaseOrderGRNRequestParam.GRNNumber;
                        _objGRNHeader.PurchaseOrderID = _objPurchaseOrderGRNRequestParam.PurchaseOrderID;
                        _objGRNHeader.SupplierInvoiceReference = _objPurchaseOrderGRNRequestParam.SupplierInvoiceReference;
                        _objGRNHeader.SupplierInvoiceDate = _objPurchaseOrderGRNRequestParam.SupplierInvoiceDate;
                        _objGRNHeader.Remarks = _objPurchaseOrderGRNRequestParam.Remarks;
                        _objGRNHeader.SupplierID = _objPurchaseOrderGRNRequestParam.SupplierID;
                        _objGRNHeader.DocumentStatus = _objPurchaseOrderGRNRequestParam.DocumentStatus;
                        _objGRNHeader.CurrencyID = _objPurchaseOrderGRNRequestParam.CurrencyID;
                        _objGRNHeader.PreparedBy = _objPurchaseOrderGRNRequestParam.PreparedBy;
                        _objGRNHeader.UpdatedBy = _objPurchaseOrderGRNRequestParam.UpdatedBy;
                        _objGRNHeader.GRNDetail = _objPurchaseOrderGRNRequestParam.GRNDetail;
                        _objGRNHeader.ParamType = "ADDPurchaseOrderGRN";
                        var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objGRNHeader, Helper.XML_PARAMS, StoredProcedure.GRN_HEADER);
                        if (Helper.CheckDataSetIsNullOrEmpty(ds))
                        {
                            DBStatus = string.Empty;
                            DBMessage = string.Empty;
                            DBStatus = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                            DBMessage = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                            if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                            {
                                int GRNNo = 0;
                                int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out GRNNo);
                                IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objPurchaseOrderGRNRequestParam.GRNDetail);
                                if (!IsEmpty)
                                {
                                    if (_objPurchaseOrderGRNRequestParam.GRNDetail != null && _objPurchaseOrderGRNRequestParam.GRNDetail.Count > 0)
                                    {
                                        List<GRNDetail> lstPurchaseOrderGRNDetail = new List<GRNDetail>();
                                        lstPurchaseOrderGRNDetail = _objPurchaseOrderGRNRequestParam.GRNDetail;
                                        lstPurchaseOrderGRNDetail.ForEach(x => x.GRNID = GRNNo);

                                        var parameters = new List<(string, OdbcType, object, int?)>
                                        {
                                            ("ParamType", OdbcType.NVarChar, "ADDPurchaseOrderGRNDetail", 100)
                                        };
                                        bool isInsert = _objPurchaseOrderGRNRequestParam.GRNID == 0;

                                        var dsPurchaseOrderGRNDetail = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstPurchaseOrderGRNDetail, lstPurchaseOrderGRNDetail.GetType(), lstPurchaseOrderGRNDetail, Helper.XML_PARAMS, StoredProcedure.GRN_DETAIL, parameters);

                                        if (Helper.CheckDataSetIsNullOrEmpty(dsPurchaseOrderGRNDetail))
                                        {
                                            string dsPurchaseOrderGRNDetailStatus = Helper.ToProperCase(Convert.ToString(dsPurchaseOrderGRNDetail.Tables[0].Rows[0]["Status"].ToString()));
                                            if (dsPurchaseOrderGRNDetailStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                                            {
                                                DBMessage = isInsert ? "Purchase Order GRN Saved Successfully !!!" : "Purchase Order GRN Updated Successfully !!!";
                                            }
                                            else
                                            {
                                                string dsPurchaseOrderGRNDetailMessage = Convert.ToString(dsPurchaseOrderGRNDetail.Tables[0].Rows[0]["Message"].ToString());
                                                List<List<string>> row = new List<List<string>>
                                                {
                                                    new List<string> { GRNNo.ToString(), dsPurchaseOrderGRNDetailStatus, dsPurchaseOrderGRNDetailMessage }
                                                };
                                                finalDataSet = Helper.GenerateCommonMessage(columns, row, TableName);
                                                return finalDataSet;
                                            }
                                        }
                                    }
                                    List<List<string>> rows = new List<List<string>>
                                    {
                                        new List<string> { GRNNo.ToString(), DBStatus,  DBMessage }
                                    };
                                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                                }
                            }
                            else
                            {
                                List<List<string>> rows = new List<List<string>>
                                {
                                    new List<string> { "0", DBStatus, DBMessage }
                                };
                                finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                                return finalDataSet;
                            }
                        }
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { GRNID, DBStatus, DBMessage}
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { GRNID, DBStatus, DBMessage}
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (OdbcException ex)
            {
                string ExceptionMessage = ODBCDBExceptionHelper.ExtractDatabaseErrorMessage(ex);
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { GRNID, Helper.ToProperCase(MessageTypeConstants.Error), ExceptionMessage }
                };
                finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                return finalDataSet;
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdatePurchaseOrderGRN()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }
        
        /// <summary>
        /// This Method is Used to Get Purchase Order GRN Header Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderGRNDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetPurchaseOrderGRNHeaderDetails(ODBCHelper _objODBCHelper, PurchaseOrderGRNDetailsRequestParam _objPurchaseOrderGRNDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "PURCHASE_ORDER_GRN_HEADER_RESPONSE";
            try
            {
                GRNHeader _objGRNHeader = Helper.ToCopyClassProperties<PurchaseOrderGRNDetailsRequestParam, GRNHeader>(_objPurchaseOrderGRNDetailsRequestParam);
                _objGRNHeader.ParamType = "GetPurchaseOrderGRNDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objGRNHeader, Helper.XML_PARAMS, StoredProcedure.GRN_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(finalDataSet))
                {
                    string DBStatus = Helper.ToProperCase(Convert.ToString(finalDataSet.Tables[0].Rows[0]["Status"].ToString()));
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        finalDataSet = Helper.CheckAndValidateMultipleDatasetTable(finalDataSet, (DataSetDataTableConstants.Table, TableName), (DataSetDataTableConstants.Table1, "PURCHASE_ORDER_GRN_DETAIL_RESPONSE"));
                    }
                    else
                    {
                        finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetPurchaseOrderGRNHeaderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to to Get Purchase Order GRN Header List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderGRNListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetPurchaseOrderGRNHeaderList(ODBCHelper _objODBCHelper, PurchaseOrderGRNSearchListRequestParam _objPurchaseOrderGRNListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                GRNHeader _objGRNHeader = new GRNHeader();
                _objGRNHeader.PageSize = _objPurchaseOrderGRNListRequestParam.PageSize;
                _objGRNHeader.PageNumber = _objPurchaseOrderGRNListRequestParam.PageNumber;
                _objGRNHeader.SortColumns = (_objPurchaseOrderGRNListRequestParam.SearchFilter != null && _objPurchaseOrderGRNListRequestParam.SearchFilter.Any()) ? string.Join(",", _objPurchaseOrderGRNListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objGRNHeader.ColumnName = (_objPurchaseOrderGRNListRequestParam.SearchFilter != null && _objPurchaseOrderGRNListRequestParam.SearchFilter.Any()) ? string.Join(",", _objPurchaseOrderGRNListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objGRNHeader.IsGlobalSearch = _objPurchaseOrderGRNListRequestParam.IsGlobalSearch;
                _objGRNHeader.SortOrder = _objPurchaseOrderGRNListRequestParam.SortOrder;
                _objGRNHeader.SearchKeyword = (_objPurchaseOrderGRNListRequestParam.SearchFilter != null && _objPurchaseOrderGRNListRequestParam.SearchFilter.Any()) ? string.Join(",", _objPurchaseOrderGRNListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objGRNHeader.ParamType = "GetPurchaseOrderGRNHeaderByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objGRNHeader, Helper.XML_PARAMS, StoredProcedure.GRN_HEADER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<PurchaseOrderGRNSearchListRequestParam>(_objPurchaseOrderGRNListRequestParam, finalDataSet, "TOTAL_RECORDS", "PURCHASE_ORDER_GRN_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetPurchaseOrderGRNHeaderList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Purchase Order Or Work Order GRN PDF.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objPurchaseOrderOrWorkOrderGRNDetailsRequestParam"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <returns></returns>
        public async Task<DataSet> GetPurchaseOrderOrWorkOrderGRNPDF(ODBCHelper _objODBCHelper, PurchaseOrderOrWorkOrderGRNDetailsRequestParam _objPurchaseOrderOrWorkOrderGRNDetailsRequestParam, IWebHostEnvironment _webHostEnvironment)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "GRNID", "ItemCode", "Status", "Message", "PurchaseOrderOrWorkOrderGRNPDFFileName", "PurchaseOrderOrWorkOrderGRNPDFBase64" };
            string TableName = "PURCHASE_ORDER_OR_WORK_ORDER_GRN_PDF_RESPONSE";
            string CommonInitialSuccessMessage = "Purchase Order GRN PDF Generated Successfully For";
            string CommonInitialErrorMessage = "Failed To Generate Purchase Order GRN PDF For";
            string TempPurchaseOrderGRNHtmlFilePath = string.Empty;
            string CustomPDFFileName = string.Empty;
            string InitialSuccessMessage = string.Empty;
            string InitialErrorMessage = string.Empty;
            try
            {
                CustomPDFFileName = _objPurchaseOrderOrWorkOrderGRNDetailsRequestParam.Source switch
                {
                    "PurchaseOrderGRN" => "PurchaseOrderGRNPDF",
                    "WorkOrderGRN" => "WorkOrderGRNPDF",
                    _ => "PurchaseOrderGRNPDF"
                };

                InitialSuccessMessage = _objPurchaseOrderOrWorkOrderGRNDetailsRequestParam.Source switch
                {
                    "PurchaseOrderGRN" => CommonInitialSuccessMessage,
                    "WorkOrderGRN" => "Work Order GRN PDF Generated Successfully For",
                    _ => CommonInitialSuccessMessage
                };

                InitialErrorMessage = _objPurchaseOrderOrWorkOrderGRNDetailsRequestParam.Source switch
                {
                    "PurchaseOrderGRN" => CommonInitialErrorMessage,
                    "WorkOrderGRN" => "Failed To Generate Work Order GRN PDF For",
                    _ => CommonInitialErrorMessage
                };

                GRNHeader _objGRNHeader = Helper.ToCopyClassProperties<PurchaseOrderOrWorkOrderGRNDetailsRequestParam, GRNHeader>(_objPurchaseOrderOrWorkOrderGRNDetailsRequestParam);
                _objGRNHeader.ParamType = "GetPurchaseOrderORWorkOrderGRNPDF";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objGRNHeader, Helper.XML_PARAMS, StoredProcedure.GRN_HEADER);
                List<List<string>> SuccessRows = new List<List<string>>();
                string GRNID = Convert.ToString(_objPurchaseOrderOrWorkOrderGRNDetailsRequestParam.GRNID) ?? string.Empty;
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    DataTable dt = ds.Tables[0];
                    string DBStatus = Helper.ToProperCase(Convert.ToString(dt.Rows[0]["Status"]));
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        // Read HTML Template Only Once
                        string PurchaseOrderGRNPDFContentTemplate = await CommonHelper.ReadHTMLTemplateUsingStreamReaderAsync(_webHostEnvironment, "PurchaseOrderGRNAndWorkOrderTemplate.html");

                        // Get Company Logo Only Once
                        string LogoImage = string.Empty;
                        string LogoFileName = "inspire-magnetics-logo.png";
                        string logoPath = Path.Combine(CommonHelper.GetActualPath(_webHostEnvironment, "Content"), "Images", LogoFileName);

                        if (File.Exists(logoPath))
                        {
                            string LogoBase64 = FileHelper.ConvertFileToBase64(logoPath);

                            if (!string.IsNullOrEmpty(LogoBase64))
                            {
                                string LogoImageFileContentType = CommonHelper.GetFileContentType(LogoFileName);
                                string imgSrc = $"data:{LogoImageFileContentType};base64,{LogoBase64}";
                                LogoImage = $@"<img src='{imgSrc}' alt='Inspire Magnetics' class='logo-img'/>";
                            }
                        }
                        string tempFolderPath = CommonHelper.GetActualPath(_webHostEnvironment, "TempPDFFiles");

                        // Group Records Based On DescriptionAndPart
                        var groupedRecords = dt.AsEnumerable()
                            .GroupBy(
                            row => Convert.ToString(row["DescriptionAndPart"])?.Trim() ?? string.Empty,
                            StringComparer.OrdinalIgnoreCase)
                            .Select(group => new
                            {
                                ItemCode = Convert.ToString(group.First()["ItemCode"])?.Trim() ?? string.Empty,
                                DescriptionAndPart = group.Key,
                                Records = group
                                .OrderBy(row => int.TryParse(Convert.ToString(row["SampleInspectionLevel"]), out int level) ? level : int.MaxValue)
                                .ToList()
                            })
                        .ToList();

                        int PDFIndex = 0;

                        // Generate Separate PDF For Each DescriptionAndPart
                        foreach (var group in groupedRecords)
                        {
                            PDFIndex++;
                            string ItemCode = group.ItemCode;
                            string DescriptionAndPart = group.DescriptionAndPart;
                            string PDFFileName = string.Empty;
                            TempPurchaseOrderGRNHtmlFilePath = string.Empty;
                            try
                            {
                                DataRow firstRow = group.Records.First();
                                string SupplierName = Convert.ToString(firstRow["SupplierName"]) ?? string.Empty;
                                string InvoiceNoDate = Convert.ToString(firstRow["InvoiceNoAndDate"]) ?? string.Empty;
                                string QAStatus = Convert.ToString(firstRow["QAStatus"]) ?? string.Empty;
                                string QtyReceived = Convert.ToString(firstRow["QtyReceived"]) ?? string.Empty;
                                string QtyAccepted = Convert.ToString(firstRow["QtyAccepted"]) ?? string.Empty;
                                string QtyShortage = Convert.ToString(firstRow["QtyShortage"]) ?? string.Empty;
                                string PoNoDate = Convert.ToString(firstRow["PONoAndDate"]) ?? string.Empty;
                                string QtyRejected = Convert.ToString(firstRow["QtyRejected"]) ?? string.Empty;
                                string ReceivedDate = Convert.ToString(firstRow["ReceivedDate"]) ?? string.Empty;
                                string Remark = Convert.ToString(firstRow["Remarks"]) ?? string.Empty;
                                string InspectedBy = Convert.ToString(firstRow["InspectedBy"]) ?? string.Empty;
                                string InspectedDate = Convert.ToString(firstRow["InspectedDate"]) ?? string.Empty;
                                string AuthorisedBy = Convert.ToString(firstRow["AuthorisedBy"]) ?? string.Empty;
                                string AuthorisedDate = Convert.ToString(firstRow["AuthorisedDate"]) ?? string.Empty;


                                StringBuilder sb = new StringBuilder();
                                int SLNo = 0;

                                // Generate One HTML Row For Each Inspection Record
                                foreach (DataRow TableRows in group.Records)
                                {
                                    SLNo++;

                                    string InspectionMethodAndParameters = Convert.ToString(TableRows["InspectionMethodAndParameters"]) ?? string.Empty;
                                    string SampleInspectionLevel = Convert.ToString(TableRows["SampleInspectionLevel"]) ?? string.Empty;
                                    string ReferenceStandard = Convert.ToString(TableRows["ReferenceStandard"]) ?? string.Empty;
                                    string RequiredJigsToolsInstruments = Convert.ToString(TableRows["RequiredJigsToolsInstruments"]) ?? string.Empty;
                                    string ProductCheckPoints = Convert.ToString(TableRows["ProductCheckPoints"]) ?? string.Empty;
                                    string SampleSize = Convert.ToString(TableRows["SampleSize"]) ?? string.Empty;
                                    string Result = Convert.ToString(TableRows["Result"]) ?? string.Empty;
                                    string TestResult = Convert.ToString(TableRows["TestResult"]) ?? string.Empty;
                                    

                                    // Encode Dynamic Values For HTML
                                    string HtmlInspectionMethodAndParameters = Helper.EncodeHTMLText(InspectionMethodAndParameters);
                                    string HtmlSampleInspectionLevel = Helper.EncodeHTMLText(SampleInspectionLevel);
                                    string HtmlReferenceStandard = Helper.EncodeHTMLText(ReferenceStandard);
                                    string HtmlRequiredJigsToolsInstruments = Helper.EncodeHTMLText(RequiredJigsToolsInstruments);
                                    string HtmlProductCheckPoints = Helper.EncodeHTMLText(ProductCheckPoints);
                                    string HtmlSampleSize = Helper.EncodeHTMLText(SampleSize);
                                    string HtmlResult = Helper.EncodeHTMLText(Result);
                                    string HtmlTestResult = Helper.EncodeHTMLText(TestResult);

                                    // Preserve Line Breaks In Multiline Text
                                    HtmlInspectionMethodAndParameters = HtmlInspectionMethodAndParameters.Replace("\r\n", "<br>").Replace("\n", "<br>");
                                    HtmlSampleInspectionLevel = HtmlSampleInspectionLevel.Replace("\r\n", "<br>").Replace("\n", "<br>");
                                    HtmlReferenceStandard = HtmlReferenceStandard.Replace("\r\n", "<br>").Replace("\n", "<br>");
                                    HtmlRequiredJigsToolsInstruments = HtmlRequiredJigsToolsInstruments.Replace("\r\n", "<br>").Replace("\n", "<br>");
                                    HtmlProductCheckPoints = HtmlProductCheckPoints.Replace("\r\n", "<br>").Replace("\n", "<br>");

                                    // Generate Dynamic HTML Row
                                    sb.AppendLine("<tr class='row-visual'>");
                                    sb.AppendLine($"    <td colspan='1' class='td-sl'>{SLNo}</td>");
                                    sb.AppendLine($"    <td colspan='1' class='td-method-param'>{HtmlInspectionMethodAndParameters}</td>");
                                    sb.AppendLine($"    <td colspan='1' class='td-sample-lvl'>{HtmlSampleInspectionLevel}</td>");
                                    sb.AppendLine($"    <td colspan='1' class='td-ref-std'>{HtmlReferenceStandard}</td>");
                                    sb.AppendLine($"    <td colspan='1' class='td-jigs'>{HtmlRequiredJigsToolsInstruments}</td>");
                                    sb.AppendLine($"    <td colspan='2' class='td-checkpoints'>{HtmlProductCheckPoints}</td>");
                                    sb.AppendLine($"    <td colspan='1' class='td-sample-sz'>{HtmlSampleSize}</td>");
                                    sb.AppendLine($"    <td colspan='1' class='td-result'>{HtmlResult}</td>");
                                    sb.AppendLine($"    <td colspan='1' class='td-test-result'>{HtmlTestResult}</td>");
                                    sb.AppendLine("</tr>");
                                }

                                // Create Fresh HTML Template For Each DescriptionAndPart
                                string htmlContent = PurchaseOrderGRNPDFContentTemplate;

                                // Replace Dynamic Inspection Rows
                                htmlContent = htmlContent.Replace("#InspectionRows#", sb.ToString());

                                // Replace Common Header Details
                                htmlContent = htmlContent.Replace("#SupplierName#", SupplierName);
                                htmlContent = htmlContent.Replace("#DescriptionAndPart#", DescriptionAndPart);
                                htmlContent = htmlContent.Replace("#InvoiceNoDate#", InvoiceNoDate);
                                htmlContent = htmlContent.Replace("#LotStatus#", QAStatus);
                                htmlContent = htmlContent.Replace("#QtyReceived#", QtyReceived);
                                htmlContent = htmlContent.Replace("#QtyAccepted#", QtyAccepted);
                                htmlContent = htmlContent.Replace("#QtyShortage#", QtyShortage);
                                htmlContent = htmlContent.Replace("#PoNoDate#", PoNoDate);
                                htmlContent = htmlContent.Replace("#QtyRejected#", QtyRejected);
                                htmlContent = htmlContent.Replace("#ReceivedDate#", ReceivedDate);
                                htmlContent = htmlContent.Replace("#Remark#", Remark);
                                htmlContent = htmlContent.Replace("#InspectedBy#", InspectedBy);
                                htmlContent = htmlContent.Replace("#InspectedDate#", InspectedDate);
                                htmlContent = htmlContent.Replace("#AuthorisedBy#", AuthorisedBy);
                                htmlContent = htmlContent.Replace("#AuthorisedDate#", AuthorisedDate);
                                htmlContent = htmlContent.Replace("#CompanyLogoImage#", LogoImage);

                                string SafeGRNID = string.Concat(GRNID.Select(c => Path.GetInvalidFileNameChars().Contains(c) ? '-' : c));
                                string SafeDescriptionAndPart = string.Concat(DescriptionAndPart.Select(c => Path.GetInvalidFileNameChars().Contains(c) ? '-' : c));
                                PDFFileName = $"{CustomPDFFileName}_{SafeGRNID}_{PDFIndex}_{SafeDescriptionAndPart}";

                                // Generate Unique Temporary HTML File
                                string TempfileName = $"TempPurchaseOrderGRNTemplate_{Guid.NewGuid():N}.html";
                                TempPurchaseOrderGRNHtmlFilePath = Path.Combine(tempFolderPath, TempfileName);
                                await File.WriteAllTextAsync(TempPurchaseOrderGRNHtmlFilePath, htmlContent);

                                // Convert HTML To PDF
                                byte[] pdfBytes = PDFHelper.ConvertHTMLToPDF(TempPurchaseOrderGRNHtmlFilePath, true, false, null, false, null, false, null, null);
                                string PurchaseOrderGRNPDFDocumentBase64 = string.Empty;
                                if (pdfBytes != null && pdfBytes.Length > 0)
                                {
                                    string pdfBase64 = Convert.ToBase64String(pdfBytes);
                                    if (!string.IsNullOrEmpty(pdfBase64))
                                    {
                                        //string Folder = CommonHelper.SaveFileToFolder(pdfBase64, FileTypes.Pdf, _webHostEnvironment);
                                        var result = new FileHelper.Base64File(pdfBase64, PDFFileName, FileHelper.GetFileExtension(FileTypes.Pdf));
                                        PurchaseOrderGRNPDFDocumentBase64 = result.Base64;
                                    }
                                }
                                if (!string.IsNullOrEmpty(PurchaseOrderGRNPDFDocumentBase64))
                                {
                                    PurchaseOrderGRNPDFDocumentBase64 = Helper.CleanBase64(PurchaseOrderGRNPDFDocumentBase64);
                                }

                                if (!string.IsNullOrEmpty(PurchaseOrderGRNPDFDocumentBase64))
                                {
                                    // Add Successful PDF Base64 As New Row In Same DataSet
                                    SuccessRows.Add(new List<string>
                                    {
                                        GRNID, ItemCode, Helper.ToProperCase(MessageTypeConstants.Success), $"{InitialSuccessMessage} {DescriptionAndPart} !!!", $"{PDFFileName}.{FileTypes.Pdf}", PurchaseOrderGRNPDFDocumentBase64
                                    });
                                }
                                else
                                {
                                    // Add Error Response And Continue With Next PDF
                                    SuccessRows.Add(new List<string>
                                    {
                                        GRNID, ItemCode, Helper.ToProperCase(MessageTypeConstants.Error), $"{InitialErrorMessage} {DescriptionAndPart} !!!", string.Empty, string.Empty
                                    });
                                }
                            }
                            catch (Exception ex)
                            {
                                // Log Error For Current PDF Without Stopping Other PDFs
                                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetPurchaseOrderOrWorkOrderGRNPDF()", $"GRNID: {GRNID}, DescriptionAndPart: {DescriptionAndPart}, PDFIndex: {PDFIndex}, Error: {ex}", false);

                                // Add Failed PDF Response Into Same DataSet
                                SuccessRows.Add(new List<string>
                                {
                                    GRNID, ItemCode, Helper.ToProperCase(MessageTypeConstants.Error), $"{InitialErrorMessage} {DescriptionAndPart} !!! {ex.Message}", string.Empty, string.Empty
                                });
                            }
                            finally
                            {
                                // Delete Temporary HTML File Without Interrupting Next PDF
                                try
                                {
                                    if (!string.IsNullOrEmpty(TempPurchaseOrderGRNHtmlFilePath))
                                    {
                                        Helper.DeleteFile(TempPurchaseOrderGRNHtmlFilePath);
                                    }
                                }
                                catch (Exception cleanupEx)
                                {
                                    // Log Cleanup Error Without Stopping PDF Generation
                                    try
                                    {
                                        Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetPurchaseOrderOrWorkOrderGRNPDF()", $"Temporary HTML File Cleanup Failed. GRNID: {GRNID}, DescriptionAndPart: {DescriptionAndPart}, Error: {cleanupEx}", false);
                                    }
                                    catch
                                    {
                                        // Cleanup Logging Must Not Stop Remaining PDFs.
                                    }
                                }
                                TempPurchaseOrderGRNHtmlFilePath = string.Empty;
                            }
                        }
                        finalDataSet = Helper.GenerateCommonMessage(columns, SuccessRows, TableName);
                    }
                    else
                    {
                        string Message = ds.Tables[0].Rows[0]["Message"].ToString();
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { Convert.ToString(_objPurchaseOrderOrWorkOrderGRNDetailsRequestParam.GRNID), string.Empty, Helper.ToProperCase(MessageTypeConstants.Error), Message, string.Empty, string.Empty }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { Convert.ToString(_objPurchaseOrderOrWorkOrderGRNDetailsRequestParam.GRNID), string.Empty, Helper.ToProperCase(MessageTypeConstants.Error), "No Approved Inspection Report Found !!!", string.Empty, string.Empty }
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.DeleteFile(TempPurchaseOrderGRNHtmlFilePath);
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetPurchaseOrderOrWorkOrderGRNPDF()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Purchase Order GRN]

        #region [Goods Inspection Note]

        /// <summary>
        /// This Method is Used to Get Goods Inspection Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objGoodsInspectionGRNDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetGoodsInspectionGRNHeaderDetails(ODBCHelper _objODBCHelper, GoodsInspectionDetailsRequestParam _objGoodsInspectionGRNDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                string TABLENAME = string.Empty;
                GRNHeader _objGRNHeader = Helper.ToCopyClassProperties<GoodsInspectionDetailsRequestParam, GRNHeader>(_objGoodsInspectionGRNDetailsRequestParam);
                _objGRNHeader.ParamType = "GetGoodsInspectionNoteDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objGRNHeader, Helper.XML_PARAMS, StoredProcedure.GRN_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "GOODS_INSPECTION_DETAIL_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetInventoryDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to to Get Goods Inspection List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objGoodsInspectionGRNListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetGoodsInspectionGRNHeaderList(ODBCHelper _objODBCHelper, GoodsInspectionGRNSearchListRequestParam _objGoodsInspectionGRNListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                GRNHeader _objGRNHeader = new GRNHeader();
                _objGRNHeader.PageSize = _objGoodsInspectionGRNListRequestParam.PageSize;
                _objGRNHeader.PageNumber = _objGoodsInspectionGRNListRequestParam.PageNumber;
                _objGRNHeader.SortColumns = (_objGoodsInspectionGRNListRequestParam.SearchFilter != null && _objGoodsInspectionGRNListRequestParam.SearchFilter.Any()) ? string.Join(",", _objGoodsInspectionGRNListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objGRNHeader.ColumnName = (_objGoodsInspectionGRNListRequestParam.SearchFilter != null && _objGoodsInspectionGRNListRequestParam.SearchFilter.Any()) ? string.Join(",", _objGoodsInspectionGRNListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objGRNHeader.IsGlobalSearch = _objGoodsInspectionGRNListRequestParam.IsGlobalSearch;
                _objGRNHeader.SortOrder = _objGoodsInspectionGRNListRequestParam.SortOrder;
                _objGRNHeader.SearchKeyword = (_objGoodsInspectionGRNListRequestParam.SearchFilter != null && _objGoodsInspectionGRNListRequestParam.SearchFilter.Any()) ? string.Join(",", _objGoodsInspectionGRNListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objGRNHeader.ShortCut = _objGoodsInspectionGRNListRequestParam.ShortCut;
                _objGRNHeader.ParamType = "GetGoodsInspectionNoteListByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objGRNHeader, Helper.XML_PARAMS, StoredProcedure.GRN_HEADER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<GoodsInspectionGRNSearchListRequestParam>(_objGoodsInspectionGRNListRequestParam, finalDataSet, "TOTAL_RECORDS", "GOODS_INSPECTION_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetGoodsInspectionGRNHeaderList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Update Goods Inspection Note.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="lstUpdateGoodsInspectionNote"></param>
        /// <returns></returns>
        public async Task<DataSet> UpdateGoodsInspectionNote(ODBCHelper _objODBCHelper, List<UpdateGoodsInspectionNote> lstUpdateGoodsInspectionNote)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "Status", "Message" };
            string DBStatus = string.Empty;
            string DBMessage = string.Empty;
            string TableName = "GOODS_INSPECTION_NOTE_UPDATE_RESPONSE";
            try
            {
                bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(lstUpdateGoodsInspectionNote);
                if (!IsEmpty)
                {
                    if (lstUpdateGoodsInspectionNote != null && lstUpdateGoodsInspectionNote.Count > 0)
                    {
                        List<GRNDetail> lstGRNDetail = new List<GRNDetail>();
                        lstGRNDetail = Helper.ToCopyGenericListClassProperties<UpdateGoodsInspectionNote, GRNDetail>(lstUpdateGoodsInspectionNote);

                        var parameters = new List<(string, OdbcType, object, int?)>
                        {
                            ("ParamType", OdbcType.NVarChar, "UpdateGoodsInspectionNote", 100)
                        };
                        var dsUpdateGoodsInspectionNote = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstGRNDetail, lstGRNDetail.GetType(), lstGRNDetail, Helper.XML_PARAMS, StoredProcedure.GRN_DETAIL, parameters);
                        if (Helper.CheckDataSetIsNullOrEmpty(dsUpdateGoodsInspectionNote))
                        {
                            DBStatus = Helper.ToProperCase(Convert.ToString(dsUpdateGoodsInspectionNote.Tables[0].Rows[0]["Status"].ToString()));
                            DBMessage = Convert.ToString(dsUpdateGoodsInspectionNote.Tables[0].Rows[0]["Message"].ToString());

                            List<List<string>> rows = new List<List<string>>
                            {
                                new List<string> { DBStatus, DBMessage }
                            };
                            finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        }
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), ResponseMessageConstants.NoDataFound }
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.UpdateGoodsInspectionNote()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Goods Inspection Note]

        #region [Quotation]

        /// <summary>
        /// This Method Is Used To Save and Update Quotation Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotation"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateQuotationDetails(ODBCHelper _objODBCHelper, Quotation _objQuotation)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string TableName = "QUOTATION_RESPONSE";
            try
            {
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objQuotation, Helper.XML_PARAMS, StoredProcedure.QUOTATION_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string Status = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    string Message = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    if (Status == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        int QuotationIDNo = 0;
                        int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out QuotationIDNo);
                        bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objQuotation.QuotationDetail);
                        if (!IsEmpty)
                        {
                            if (_objQuotation.QuotationDetail != null && _objQuotation.QuotationDetail.Count > 0)
                            {
                                List<QuotationDetail> lstQuotationDetail = new List<QuotationDetail>();
                                lstQuotationDetail = _objQuotation.QuotationDetail;
                                lstQuotationDetail.ForEach(x => x.QuotationID = QuotationIDNo);

                                var parameters = new List<(string, OdbcType, object, int?)>
                                {
                                    ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                                };
                                bool isInsert = _objQuotation.QuotationID == 0;
                                var dsQuotationDetail = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstQuotationDetail, lstQuotationDetail.GetType(), lstQuotationDetail, Helper.XML_PARAMS, StoredProcedure.QUOTATION_DETAIL, parameters);
                                if (Helper.CheckDataSetIsNullOrEmpty(dsQuotationDetail))
                                {
                                    string QuotationDetailStatus = Convert.ToString(dsQuotationDetail.Tables[0].Rows[0]["Status"].ToString());
                                }
                                Message = isInsert ? "Quotation Saved Successfully !!!" : "Quotation Updated Successfully !!!";
                            }
                        }
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { QuotationIDNo.ToString(), Status,  Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { "0", Status, Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateQuotationDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Quotation Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotationDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetQuotationDetails(ODBCHelper _objODBCHelper, QuotationDetailsRequestParam _objQuotationDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "QUOTATION_HEADER_RESPONSE";
            try
            {
                Quotation _objQuotation = Helper.ToCopyClassProperties<QuotationDetailsRequestParam, Quotation>(_objQuotationDetailsRequestParam);
                _objQuotation.ParamType = "GetQuotationDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objQuotation, Helper.XML_PARAMS, StoredProcedure.QUOTATION_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(finalDataSet))
                {
                    string DBStatus = Helper.ToProperCase(Convert.ToString(finalDataSet.Tables[0].Rows[0]["Status"].ToString()));
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        finalDataSet = Helper.CheckAndValidateMultipleDatasetTable(finalDataSet, (DataSetDataTableConstants.Table, TableName), (DataSetDataTableConstants.Table1, "QUOTATION_DETAILS_RESPONSE"));
                    }
                    else
                    {
                        finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetQuotationDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Quotation List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotationListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetQuotationList(ODBCHelper _objODBCHelper, QuotationSearchListRequestParam _objQuotationListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                Quotation _objQuotation = new Quotation();
                _objQuotation.PageSize = _objQuotationListRequestParam.PageSize;
                _objQuotation.PageNumber = _objQuotationListRequestParam.PageNumber;
                _objQuotation.SortColumns = (_objQuotationListRequestParam.SearchFilter != null && _objQuotationListRequestParam.SearchFilter.Any()) ? string.Join(",", _objQuotationListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objQuotation.ColumnName = (_objQuotationListRequestParam.SearchFilter != null && _objQuotationListRequestParam.SearchFilter.Any()) ? string.Join(",", _objQuotationListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objQuotation.IsGlobalSearch = _objQuotationListRequestParam.IsGlobalSearch;
                _objQuotation.SortOrder = _objQuotationListRequestParam.SortOrder;
                _objQuotation.ShortCut = _objQuotationListRequestParam.ShortCut;
                _objQuotation.SearchKeyword = (_objQuotationListRequestParam.SearchFilter != null && _objQuotationListRequestParam.SearchFilter.Any()) ? string.Join(",", _objQuotationListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objQuotation.ParamType = "GetQuotationHeaderListByPagination";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objQuotation, Helper.XML_PARAMS, StoredProcedure.QUOTATION_HEADER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<QuotationSearchListRequestParam>(_objQuotationListRequestParam, ds, "TOTAL_RECORDS", "QUOTATION_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetQuotationList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to ShortClose Or Recall Quotation Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotationShortCloseORRecall"></param>
        /// <returns></returns>
        public async Task<DataSet> ShortCloseOrRecallQuotationDetails(ODBCHelper _objODBCHelper, QuotationShortCloseORRecall _objQuotationShortCloseORRecall)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                Quotation _objQuotation = Helper.ToCopyClassProperties<QuotationShortCloseORRecall, Quotation>(_objQuotationShortCloseORRecall);
                _objQuotation.ParamType = "QuotationShortCloseORRecall";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objQuotation, Helper.XML_PARAMS, StoredProcedure.QUOTATION_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "SHORTCLOSE_OR_RECALL_QUOTATION_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ShortCloseOrRecallQuotationDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Approve Quotation Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotationApproveDetails"></param>
        /// <returns></returns>
        public async Task<DataSet> ApproveQuotationDetails(ODBCHelper _objODBCHelper, QuotationApproveDetails _objQuotationApproveDetails)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                Quotation _objQuotation = Helper.ToCopyClassProperties<QuotationApproveDetails, Quotation>(_objQuotationApproveDetails);
                _objQuotation.ParamType = "ApproveQuotationDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objQuotation, Helper.XML_PARAMS, StoredProcedure.QUOTATION_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "APPROVE_QUOTATION_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ApproveQuotationDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Quotation Header PDF.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objQuotationHeaderPDF"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <returns></returns>
        public async Task<DataSet> GetQuotationHeaderPDF(ODBCHelper _objODBCHelper, QuotationHeaderPDF _objQuotationHeaderPDF, IWebHostEnvironment _webHostEnvironment)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "QuotationID", "Status", "Message", "QuotationPDFFileName", "QuotationPDFBase64" };
            string TableName = "QUOTATION_PDF_RESPONSE";
            string TempQuotationHtmlFilePath = string.Empty;
            string QuotationPDFDocumentBase64 = string.Empty;
            try
            {
                Quotation _objQuotation = Helper.ToCopyClassProperties<QuotationHeaderPDF, Quotation>(_objQuotationHeaderPDF);
                _objQuotation.ParamType = "GetQuotationHeaderPDF";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objQuotation, Helper.XML_PARAMS, StoredProcedure.QUOTATION_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string DBStatus = Helper.ToProperCase(ds.Tables[0].Rows[0]["Status"].ToString());
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        string CompanyName = Convert.ToString(ds.Tables[0].Rows[0]["CompanyName"]);
                        string CompanyAddress = Convert.ToString(ds.Tables[0].Rows[0]["CompanyAddress"]);
                        string CompanyGSTINNo = Convert.ToString(ds.Tables[0].Rows[0]["CompanyGSTINNo"]);
                        string CompanyStateName = Convert.ToString(ds.Tables[0].Rows[0]["CompanyStateName"]);
                        string CompanyStateCode = Convert.ToString(ds.Tables[0].Rows[0]["CompanyStateCode"]);
                        string CompanyEmail = Convert.ToString(ds.Tables[0].Rows[0]["CompanyEmail"]);
                        string QuotationNo = Convert.ToString(ds.Tables[0].Rows[0]["QuotationNo"]);
                        string Dated = DateTimeHelper.ConvertDateTimeStringToSpecificFormat(Convert.ToString(ds.Tables[0].Rows[0]["Dated"]), DateTimeFormatConstants.DDMMYYYY_SLASH_DATEFORMAT);
                        string ModeOrTermsOfPayment = Convert.ToString(ds.Tables[0].Rows[0]["ModeOrTermsOfPayment"]);
                        string BuyersReference = Convert.ToString(ds.Tables[0].Rows[0]["BuyersReference"]);
                        string OtherReferences = Convert.ToString(ds.Tables[0].Rows[0]["OtherReferences"]);
                        string DispatchedThrough = Convert.ToString(ds.Tables[0].Rows[0]["DispatchedThrough"]);
                        string Destination = Convert.ToString(ds.Tables[0].Rows[0]["Destination"]);
                        string TermsOfDelivery = Convert.ToString(ds.Tables[0].Rows[0]["TermsOfDelivery"]);
                        string ConsigneeCompanyName = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneeName"]);
                        string ConsigneeAddress = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneeAddress"]);
                        string ConsigneeAddressFiveLines = string.Join("<br />", ConsigneeAddress.Replace("\r\n", "\n")
                            .Replace("\r", "\n")
                            .Split('\n')
                            .Take(5));
                        string ConsigneeGSTIN = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneeGSTIN"]);
                        string ConsigneeStateName = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneeStateName"]);
                        string ConsigneeStateCode = Convert.ToString(ds.Tables[0].Rows[0]["ConsigneeStateCode"]);

                        string BuyerName = Convert.ToString(ds.Tables[0].Rows[0]["BuyerName"]);
                        string BuyerAddress = Convert.ToString(ds.Tables[0].Rows[0]["BuyerAddress"]);
                        string BuyerAddressFiveLines = string.Join("<br />", BuyerAddress.Replace("\r\n", "\n")
                            .Replace("\r", "\n")
                            .Split('\n')
                            .Take(5));
                        string BuyerGSTIN = Convert.ToString(ds.Tables[0].Rows[0]["BuyerGSTIN"]);
                        string BuyerStateName = Convert.ToString(ds.Tables[0].Rows[0]["BuyerStateName"]);
                        string BuyerStateCode = Convert.ToString(ds.Tables[0].Rows[0]["BuyerStateCode"]);

                        string QuotationID = Convert.ToString(_objQuotationHeaderPDF.QuotationID);

                        string QuotationEmailBodyTemplate = await CommonHelper.ReadHTMLTemplateUsingStreamReaderAsync(_webHostEnvironment, "QuotationTemplate.html");
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#QuotationToCompanyName#", CompanyName);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#QuotationToAddress#", CompanyAddress);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#QuotationToGSTIN#", CompanyGSTINNo);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#CompanyStateName#", CompanyStateName);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#CompanyStateCode#", CompanyStateCode);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#CompanyEmail#", CompanyEmail);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#QuotationReferenceNo#", QuotationNo);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#QuotationDate#", Dated);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#PaymentTerms#", ModeOrTermsOfPayment);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#BuyersReferenceOrderNumber#", BuyersReference);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#OtherReferences#", OtherReferences);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#DispatchedThrough#", DispatchedThrough);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#Destination#", Destination);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#TermsOfDelivery#", TermsOfDelivery);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#ConsigneeCompanyName#", ConsigneeCompanyName);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#ConsigneeAddress#", ConsigneeAddressFiveLines);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#ConsigneeGSTIN#", ConsigneeGSTIN);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#ConsigneeStateName#", ConsigneeStateName);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#ConsigneeStateCode#", ConsigneeStateCode);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#BuyerName#", BuyerName);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#BuyerAddress#", BuyerAddressFiveLines);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#BuyerGSTIN#", BuyerGSTIN);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#BuyerStateName#", BuyerStateName);
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#BuyerStateCode#", BuyerStateCode);

                        int slNo = 1;
                        StringBuilder itemRows = new StringBuilder();
                        StringBuilder cgstRows = new StringBuilder();
                        StringBuilder sgstRows = new StringBuilder();
                        StringBuilder igstRows = new StringBuilder();
                        StringBuilder defaultRows = new StringBuilder();
                        StringBuilder totalRows = new StringBuilder();

                        foreach (DataRow row in ds.Tables[0].Rows)
                        {
                            string itemDescription = Convert.ToString(row["ItemDescription"]);
                            string HSNCode = Convert.ToString(row["HSNCode"]);
                            string DueOn = DateTimeHelper.ConvertDateTimeStringToSpecificFormat(Convert.ToString(row["DueOn"]), DateTimeFormatConstants.DDMMYYYY_SLASH_DATEFORMAT);
                            string qty = Convert.ToString(row["Quantity"]);
                            string itemUnit = Convert.ToString(row["Per"]);
                            decimal Rate = Convert.ToDecimal(row["Rate"]);
                            string Percentage = Convert.ToString(row["Per"]);
                            decimal Amount = Convert.ToDecimal(row["Amount"]);

                            itemRows.AppendLine("<tr>");
                            itemRows.AppendLine($"<td class='col-si'>{slNo}</td>");
                            itemRows.AppendLine($"<td class='col-desc'>{itemDescription}</td>");
                            itemRows.AppendLine($"<td class='col-hsn'>{HSNCode}</td>");
                            itemRows.AppendLine($"<td class='col-dueon'>{DueOn}</td>");
                            itemRows.AppendLine($"<td class='col-qty'><strong>{qty} {itemUnit}</strong></td>");
                            itemRows.AppendLine($"<td class='col-rate'>{Helper.FormatToIndianCurrency<string>(Rate.ToString(), 2)}</td>");
                            itemRows.AppendLine($"<td class='col-per'>{Percentage}</td>");
                            itemRows.AppendLine($"<td class='col-amount'>{Helper.FormatToIndianCurrency<string>(Amount.ToString(), 2)}</td>");
                            itemRows.AppendLine("</tr>");
                            slNo++;
                        }

                        bool isIGSTRequired = bool.TryParse(Convert.ToString(ds.Tables[0].Rows[0]["IsIGSTRequired"]), out bool isIGSTRequiredResult) ? isIGSTRequiredResult : false;
                        decimal totalAmount = ds.Tables[0].AsEnumerable().Sum(r => r.Field<decimal?>("Amount") ?? 0);
                        decimal totalCGST = ds.Tables[0].AsEnumerable().Sum(r => r.Field<decimal?>("CGST") ?? 0);
                        decimal totalSGST = ds.Tables[0].AsEnumerable().Sum(r => r.Field<decimal?>("SGST") ?? 0);
                        decimal totalIGST = ds.Tables[0].AsEnumerable().Sum(r => r.Field<decimal?>("IGST") ?? 0);
                        decimal totalQuantity = ds.Tables[0].AsEnumerable().Sum(r => decimal.TryParse(Convert.ToString(r["Quantity"]), out decimal qty) ? qty : 0);
                        var units = ds.Tables[0].AsEnumerable().Select(r => r["Per"] == DBNull.Value ? string.Empty : r["Per"].ToString()).Distinct().ToList();
                        string TotalUnit = units.Count == 1 ? units.First() : string.Empty;
                        string DisplayTotalQuantity = units.Count == 1 ? totalQuantity.ToString() : string.Empty;
                        decimal GrandTotal = 0;
                        if (isIGSTRequired)
                        {
                            igstRows.AppendLine("<tr class='tax-row'>");
                            igstRows.AppendLine($"<td class='col-si'></td>");
                            igstRows.AppendLine($"<td class='col-desc tax-label-cell'><strong>IGST</strong></td>");
                            igstRows.AppendLine($"<td class='col-hsn'></td>");
                            igstRows.AppendLine($"<td class='col-dueon'></td>");
                            igstRows.AppendLine($"<td class='col-qty'></td>");
                            igstRows.AppendLine($"<td class='col-rate'></td>");
                            igstRows.AppendLine($"<td class='col-per'></td>");
                            igstRows.AppendLine($"<td class='col-amount'><strong>{Helper.FormatToIndianCurrency<string>(totalIGST.ToString(), 2)}</strong></td>");
                            igstRows.AppendLine("</tr>");
                            cgstRows.AppendLine(string.Empty);
                            sgstRows.AppendLine(string.Empty);
                            GrandTotal = totalAmount + totalIGST;
                        }
                        else
                        {
                            cgstRows.AppendLine("<tr class='tax-row'>");
                            cgstRows.AppendLine($"<td class='col-si'></td>");
                            cgstRows.AppendLine($"<td class='col-desc tax-label-cell'><strong>CGST</strong></td>");
                            cgstRows.AppendLine($"<td class='col-hsn'></td>");
                            cgstRows.AppendLine($"<td class='col-dueon'></td>");
                            cgstRows.AppendLine($"<td class='col-qty'></td>");
                            cgstRows.AppendLine($"<td class='col-rate'></td>");
                            cgstRows.AppendLine($"<td class='col-per'></td>");
                            cgstRows.AppendLine($"<td class='col-amount'><strong>{Helper.FormatToIndianCurrency<string>(totalCGST.ToString(), 2)}</strong></td>");
                            cgstRows.AppendLine("</tr>");

                            sgstRows.AppendLine("<tr class='tax-row'>");
                            sgstRows.AppendLine($"<td class='col-si'></td>");
                            sgstRows.AppendLine($"<td class='col-desc tax-label-cell'><strong>SGST</strong></td>");
                            sgstRows.AppendLine($"<td class='col-hsn'></td>");
                            sgstRows.AppendLine($"<td class='col-dueon'></td>");
                            sgstRows.AppendLine($"<td class='col-qty'></td>");
                            sgstRows.AppendLine($"<td class='col-rate'></td>");
                            sgstRows.AppendLine($"<td class='col-per'></td>");
                            sgstRows.AppendLine($"<td class='col-amount'><strong>{Helper.FormatToIndianCurrency<string>(totalSGST.ToString(), 2)}</strong></td>");
                            sgstRows.AppendLine("</tr>");

                            igstRows.AppendLine(string.Empty);

                            GrandTotal = totalAmount + totalCGST + totalSGST;
                        }

                        defaultRows.AppendLine("<tr class='filler-row'>");
                        defaultRows.AppendLine($"<td class='col-si'></td>");
                        defaultRows.AppendLine($"<td class='col-desc'></td>");
                        defaultRows.AppendLine($"<td class='col-hsn'></td>");
                        defaultRows.AppendLine($"<td class='col-dueon'></td>");
                        defaultRows.AppendLine($"<td class='col-qty'></td>");
                        defaultRows.AppendLine($"<td class='col-rate'></td>");
                        defaultRows.AppendLine($"<td class='col-per'></td>");
                        defaultRows.AppendLine($"<td class='col-amount'></td>");
                        defaultRows.AppendLine("</tr>");

                        totalRows.AppendLine("<tr class='total-row'>");
                        totalRows.AppendLine($"<td colspan='4' style='text-align: right; padding-right: 10px; border-top: 1px solid #000;'>Total</td>");
                        totalRows.AppendLine($"<td class='col-qty' style='border-top: 1px solid #000; text-align: center;'><strong>{DisplayTotalQuantity} {TotalUnit}</strong></td>");
                        totalRows.AppendLine($"<td colspan='2' style='border-top: 1px solid #000;'></td>");
                        totalRows.AppendLine($"<td class='col-amount' style='border-top: 1px solid #000;'><strong>&#x20B9;{Helper.FormatToIndianCurrency<string>(GrandTotal.ToString(), 2)}</strong></td>");
                        totalRows.AppendLine("</tr>");

                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#ItemRows#", itemRows.ToString());
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#CGSTRows#", cgstRows.ToString());
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#SGSTRows#", sgstRows.ToString());
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#IGSTRows#", igstRows.ToString());
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#DefaultRows#", defaultRows.ToString());

                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#TotalRows#", totalRows.ToString());
                        QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#AmountInWords#", NumberToWordsConverter.ToIndianWords(GrandTotal));

                        string LogoFileName = "inspire-magnetics-logo.png";
                        string logoPath = Path.Combine(CommonHelper.GetActualPath(_webHostEnvironment, "Content"), "Images", LogoFileName);
                        if (File.Exists(logoPath))
                        {
                            string LogoBase64 = FileHelper.ConvertFileToBase64(logoPath);
                            if (!string.IsNullOrEmpty(LogoBase64))
                            {
                                string LogoImageFileContentType = CommonHelper.GetFileContentType(LogoFileName);
                                string imgSrc = $"data:{LogoImageFileContentType};base64,{LogoBase64}";
                                string LogoImage = $@"<img src='{imgSrc}' alt='Inspire Magnetics' class='logo-img' width='90' height='75' style='display: block; object-fit: contain;'/>";
                                QuotationEmailBodyTemplate = QuotationEmailBodyTemplate.Replace("#CompanyLogoImage#", LogoImage);
                            }
                        }
                        string tempFolderPath = CommonHelper.GetActualPath(_webHostEnvironment, "TempPDFFiles");
                        var TempfileName = "TempQuotationTemplate.html";
                        string PDFFileName = $"QuotationPDF_{QuotationID.Replace("/", "-")}";
                        TempQuotationHtmlFilePath = Path.Combine(tempFolderPath, TempfileName);
                        Helper.DeleteFile(TempQuotationHtmlFilePath);
                        File.WriteAllText(TempQuotationHtmlFilePath, QuotationEmailBodyTemplate);
                        byte[] pdfBytes = PDFHelper.ConvertHTMLToPDF(TempQuotationHtmlFilePath, true, false, null, false, null, false, null, null);

                        if (pdfBytes.Length > 0)
                        {
                            string pdfBase64 = Convert.ToBase64String(pdfBytes);
                            if (!string.IsNullOrEmpty(pdfBase64))
                            {
                                //string Folder = CommonHelper.SaveFileToFolder(pdfBase64, FileTypes.Pdf, _webHostEnvironment);
                                var result = new FileHelper.Base64File(pdfBase64, PDFFileName, FileHelper.GetFileExtension(FileTypes.Pdf));
                                QuotationPDFDocumentBase64 = result.Base64;
                            }
                        }

                        if (!string.IsNullOrEmpty(QuotationPDFDocumentBase64))
                        {
                            QuotationPDFDocumentBase64 = Helper.CleanBase64(QuotationPDFDocumentBase64);
                            List<List<string>> rows = new List<List<string>>
                            {
                                new List<string> { Convert.ToString(_objQuotationHeaderPDF.QuotationID), Helper.ToProperCase(MessageTypeConstants.Success), "Quotation PDF Generated Successfully !!!", $"{PDFFileName}.{FileTypes.Pdf}", QuotationPDFDocumentBase64 }
                            };
                            finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        }
                        else
                        {
                            List<List<string>> rows = new List<List<string>>
                            {
                                new List<string> { Convert.ToString(_objQuotationHeaderPDF.QuotationID), Helper.ToProperCase(MessageTypeConstants.Error), "Failed To Generate Quotation PDF !!!", string.Empty, string.Empty }
                            };
                            finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        }
                    }
                    else
                    {
                        string Message = ds.Tables[0].Rows[0]["Message"].ToString();
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { Convert.ToString(_objQuotationHeaderPDF.QuotationID), Helper.ToProperCase(MessageTypeConstants.Error), Message, string.Empty, string.Empty }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { Convert.ToString(_objQuotationHeaderPDF.QuotationID), Helper.ToProperCase(MessageTypeConstants.Error), ResponseMessageConstants.NoDataFound, string.Empty, string.Empty }
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.DeleteFile(TempQuotationHtmlFilePath);
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetQuotationHeaderPDF()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Quotation]

        #region [Inspection]

        /// <summary>
        /// This Method Is Used To Save and Update Inspection Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInspectionHeader"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateInspectionDetails(ODBCHelper _objODBCHelper, InspectionHeader _objInspectionHeader)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string TableName = "INSPECTION_RESPONSE";
            try
            {
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objInspectionHeader, Helper.XML_PARAMS, StoredProcedure.INSPECTION_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string Status = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    string Message = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    if (Status == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        int InspectionIDNo = 0;
                        int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out InspectionIDNo);
                        bool IsInspectionDetailEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objInspectionHeader.InspectionDetail);
                        if (!IsInspectionDetailEmpty)
                        {
                            if (_objInspectionHeader.InspectionDetail != null && _objInspectionHeader.InspectionDetail.Count > 0)
                            {
                                List<InspectionDetail> lstInspectionDetail = new List<InspectionDetail>();
                                lstInspectionDetail = _objInspectionHeader.InspectionDetail;
                                lstInspectionDetail.ForEach(x => x.InspectionHeaderID = InspectionIDNo);
                                var parameters = new List<(string, OdbcType, object, int?)>
                                {
                                    ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                                };
                                bool isInsert = _objInspectionHeader.InspectionHeaderID == 0;
                                var dsInspectionDetail = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstInspectionDetail, lstInspectionDetail.GetType(), lstInspectionDetail, Helper.XML_PARAMS, StoredProcedure.INSPECTION_DETAIL, parameters);
                                if (Helper.CheckDataSetIsNullOrEmpty(dsInspectionDetail))
                                {
                                    string InspectionDetailStatus = Helper.ToProperCase(dsInspectionDetail.Tables[0].Rows[0]["Status"].ToString());
                                    bool isInspectionObservationEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objInspectionHeader.InspectionDetail?
                                        .Where(x => x.InspectionObservation != null).SelectMany(x => x.InspectionObservation).ToList());

                                    if (!isInspectionObservationEmpty)
                                    {
                                        if (_objInspectionHeader.InspectionDetail != null && _objInspectionHeader.InspectionDetail.Any(x => x.InspectionObservation?.Any() == true))
                                        {
                                            if (InspectionDetailStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                                            {
                                                List<InspectionObservation> lstInspectionObservation = new List<InspectionObservation>();
                                                string InspectionLineIds = dsInspectionDetail.Tables[0].Rows[0]["InspectionLineIDs"].ToString();

                                                List<int> lineIdList = InspectionLineIds.Split(',',StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                                    .Select(value =>
                                                    {
                                                        if (!int.TryParse(value, out int lineId) || lineId <= 0)
                                                        {
                                                            throw new ArgumentException($"Invalid Inspection Line ID: '{value}'.",nameof(InspectionLineIds));
                                                        }
                                                        return lineId;
                                                    })
                                                    .ToList();

                                                if (lineIdList.Count != lstInspectionDetail.Count)
                                                {
                                                    throw new InvalidOperationException($"Inspection Line ID count mismatch. " 
                                                        + $"Received {lineIdList.Count} Line IDs for " +
                                                        $"{lstInspectionDetail.Count} Inspection Detail records.");
                                                }

                                                int index = 0;

                                                foreach (InspectionDetail detail in lstInspectionDetail)
                                                {
                                                    detail.InspectionLineID = lineIdList[index];
                                                    index++;

                                                    if (detail.InspectionObservation == null ||
                                                        detail.InspectionObservation.Count == 0)
                                                    {
                                                        continue;
                                                    }

                                                    foreach (InspectionObservation observation in detail.InspectionObservation)
                                                    {
                                                        if (observation.UserSequenceNo == detail.UserSequenceNo)
                                                        {
                                                            observation.InspectionLineID = detail.InspectionLineID;
                                                        }
                                                    }
                                                }
                                                lstInspectionObservation = lstInspectionDetail.SelectMany(detail =>
                                                detail.InspectionObservation ?? Enumerable.Empty<InspectionObservation>()).ToList();
                                                if(lstInspectionObservation != null && lstInspectionObservation.Count > 0)
                                                {
                                                    var dsInspectionObservation = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstInspectionObservation, lstInspectionObservation.GetType(), lstInspectionObservation, Helper.XML_PARAMS, StoredProcedure.INSPECTION_OBSERVATION, parameters);
                                                }
                                            }
                                        }
                                    }
                                }
                                Message = isInsert ? "Inspection Saved Successfully !!!" : "Inspection Updated Successfully !!!";
                            }
                        }
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { InspectionIDNo.ToString(), Status,  Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { "0", Status, Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateInspectionDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Inspection Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInspectionDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetInspectionDetails(ODBCHelper _objODBCHelper, InspectionDetailsRequestParam _objInspectionDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "INSPECTION_HEADER_RESPONSE";
            try
            {
                InspectionHeader _objInspectionHeader = Helper.ToCopyClassProperties<InspectionDetailsRequestParam, InspectionHeader>(_objInspectionDetailsRequestParam);
                _objInspectionHeader.ParamType = "GetInspectionHeaderDetails";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objInspectionHeader, Helper.XML_PARAMS, StoredProcedure.INSPECTION_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string DBStatus = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        finalDataSet = Helper.CheckAndValidateMultipleDatasetTable(ds, (DataSetDataTableConstants.Table, TableName), (DataSetDataTableConstants.Table1, "INSPECTION_DETAILS_RESPONSE"));
                    }
                    else
                    {
                        finalDataSet = Helper.CheckAndValidateDatasetTable(ds, TableName);
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetInspectionDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Inspection Observation Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInspectionObservationDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetInspectionObservationDetails(ODBCHelper _objODBCHelper, InspectionObservationDetailsRequestParam _objInspectionObservationDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "INSPECTION_OBSERVATION_RESPONSE";
            try
            {
                InspectionObservation _objInspectionObservation = Helper.ToCopyClassProperties<InspectionObservationDetailsRequestParam, InspectionObservation>(_objInspectionObservationDetailsRequestParam);
                var parameters = new List<(string, OdbcType, object, int?)>
                {
                    ("ParamType", OdbcType.NVarChar, "GetInspectionObservationDetails", 100)
                };
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objInspectionObservation, Helper.XML_PARAMS, StoredProcedure.INSPECTION_OBSERVATION, parameters);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetInspectionObservationDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Approve Inspection Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveInspectionDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> ApproveInspectionDetails(ODBCHelper _objODBCHelper, ApproveInspectionDetailsRequestParam _objApproveInspectionDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                InspectionHeader _objInspectionHeader = Helper.ToCopyClassProperties<ApproveInspectionDetailsRequestParam, InspectionHeader>(_objApproveInspectionDetailsRequestParam);
                _objInspectionHeader.ParamType = "ApproveInspectionHeaderDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objInspectionHeader, Helper.XML_PARAMS, StoredProcedure.INSPECTION_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "APPROVE_INSPECTION_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ApproveInspectionDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Update Is Video Uploaded Or Deleted.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objUpdateInspectionVideoUploadedOrDeletedRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> UpdateIsVideoUploadedOrDeleted(ODBCHelper _objODBCHelper, UpdateInspectionVideoUploadedOrDeletedRequestParam _objUpdateInspectionVideoUploadedOrDeletedRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                InspectionMaster _objInspectionMaster = Helper.ToCopyClassProperties<UpdateInspectionVideoUploadedOrDeletedRequestParam, InspectionMaster>(_objUpdateInspectionVideoUploadedOrDeletedRequestParam);
                var parameters = new List<(string, OdbcType, object, int?)>
                {
                    ("ParamType", OdbcType.NVarChar, "UpdateIsVideoUploaded", 100)
                };
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objInspectionMaster, Helper.XML_PARAMS, StoredProcedure.INSPECTION_MASTER, parameters);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "UPDATE_VIDEO_UPLOADED_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.UpdateIsVideoUploadedOrDeleted()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Inspection]

        #region [Order]

        /// <summary>
        /// This Method Is Used To Save and Update Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOrder"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateOrderDetails(ODBCHelper _objODBCHelper, Order _objOrder)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string TableName = "ORDER_RESPONSE";
            try
            {
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objOrder, Helper.XML_PARAMS, StoredProcedure.ORDER_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string Status = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    string Message = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    if (Status == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        int OrderIDNo = 0;
                        int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out OrderIDNo);
                        bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objOrder.OrderDetail);
                        if (!IsEmpty)
                        {
                            if (_objOrder.OrderDetail != null && _objOrder.OrderDetail.Count > 0)
                            {
                                List<OrderDetail> lstOrderDetail = new List<OrderDetail>();
                                lstOrderDetail = _objOrder.OrderDetail;
                                lstOrderDetail.ForEach(x => x.OrderID = OrderIDNo);

                                var parameters = new List<(string, OdbcType, object, int?)>
                                {
                                    ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                                };
                                bool isInsert = _objOrder.OrderID == 0;
                                var dsOrderDetail = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstOrderDetail, lstOrderDetail.GetType(), lstOrderDetail, Helper.XML_PARAMS, StoredProcedure.ORDER_DETAIL, parameters);
                                if (Helper.CheckDataSetIsNullOrEmpty(dsOrderDetail))
                                {
                                    string OrderDetailStatus = Convert.ToString(dsOrderDetail.Tables[0].Rows[0]["Status"].ToString());
                                }
                                Message = isInsert ? "Order Saved Successfully !!!" : "Order Updated Successfully !!!";
                            }
                        }
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { OrderIDNo.ToString(), Status,  Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { "0", Status, Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateOrderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOrderDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetOrderDetails(ODBCHelper _objODBCHelper, OrderDetailsRequestParam _objOrderDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "ORDER_HEADER_RESPONSE";
            try
            {
                Order _objOrder = Helper.ToCopyClassProperties<OrderDetailsRequestParam, Order>(_objOrderDetailsRequestParam);
                _objOrder.ParamType = "GetOrderDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objOrder, Helper.XML_PARAMS, StoredProcedure.ORDER_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(finalDataSet))
                {
                    string DBStatus = Helper.ToProperCase(Convert.ToString(finalDataSet.Tables[0].Rows[0]["Status"].ToString()));
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        finalDataSet = Helper.CheckAndValidateMultipleDatasetTable(finalDataSet, (DataSetDataTableConstants.Table, TableName), (DataSetDataTableConstants.Table1, "ORDER_DETAILS_RESPONSE"));
                    }
                    else
                    {
                        finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetOrderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Order List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOrderListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetOrderList(ODBCHelper _objODBCHelper, OrderSearchListRequestParam _objOrderListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                Order _objOrder = new Order();
                _objOrder.PageSize = _objOrderListRequestParam.PageSize;
                _objOrder.PageNumber = _objOrderListRequestParam.PageNumber;
                _objOrder.SortColumns = (_objOrderListRequestParam.SearchFilter != null && _objOrderListRequestParam.SearchFilter.Any()) ? string.Join(",", _objOrderListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objOrder.ColumnName = (_objOrderListRequestParam.SearchFilter != null && _objOrderListRequestParam.SearchFilter.Any()) ? string.Join(",", _objOrderListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objOrder.IsGlobalSearch = _objOrderListRequestParam.IsGlobalSearch;
                _objOrder.SortOrder = _objOrderListRequestParam.SortOrder;
                _objOrder.ShortCut = _objOrderListRequestParam.ShortCut;
                _objOrder.SearchKeyword = (_objOrderListRequestParam.SearchFilter != null && _objOrderListRequestParam.SearchFilter.Any()) ? string.Join(",", _objOrderListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objOrder.ParamType = "GetOrderHeaderListByPagination";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objOrder, Helper.XML_PARAMS, StoredProcedure.ORDER_HEADER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<OrderSearchListRequestParam>(_objOrderListRequestParam, ds, "TOTAL_RECORDS", "ORDER_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetOrderList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to ShortClose Or Recall Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOrderShortCloseORRecall"></param>
        /// <returns></returns>
        public async Task<DataSet> ShortCloseOrRecallOrderDetails(ODBCHelper _objODBCHelper, OrderShortCloseORRecall _objOrderShortCloseORRecall)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                Order _objOrder = Helper.ToCopyClassProperties<OrderShortCloseORRecall, Order>(_objOrderShortCloseORRecall);
                _objOrder.ParamType = "OrderShortCloseORRecall";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objOrder, Helper.XML_PARAMS, StoredProcedure.ORDER_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "SHORTCLOSE_OR_RECALL_ORDER_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ShortCloseOrRecallOrderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Approve Order Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOrderApproveDetails"></param>
        /// <returns></returns>
        public async Task<DataSet> ApproveOrderDetails(ODBCHelper _objODBCHelper, OrderApproveDetails _objOrderApproveDetails)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                Order _objOrder = Helper.ToCopyClassProperties<OrderApproveDetails, Order>(_objOrderApproveDetails);
                _objOrder.ParamType = "ApproveOrderDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objOrder, Helper.XML_PARAMS, StoredProcedure.ORDER_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "APPROVE_ORDER_DETAILS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ApproveOrderDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Order]

        #region [Store Request]

        /// <summary>
        /// This Method is Used to Get Stock In Store Request List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objStoreRequestHeaderSearchListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetStockInStoreRequestList(ODBCHelper _objODBCHelper, StoreRequestHeaderSearchListRequestParam _objStoreRequestHeaderSearchListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string Table = "TOTAL_RECORDS";
            string Table1 = "STOCK_IN_STORE_REQUEST_LIST";
            try
            {
                StoreRequestHeader _objStoreRequestHeader = new StoreRequestHeader();
                _objStoreRequestHeader.PageSize = _objStoreRequestHeaderSearchListRequestParam.PageSize;
                _objStoreRequestHeader.PageNumber = _objStoreRequestHeaderSearchListRequestParam.PageNumber;
                _objStoreRequestHeader.SortColumns = (_objStoreRequestHeaderSearchListRequestParam.SearchFilter != null && _objStoreRequestHeaderSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objStoreRequestHeaderSearchListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objStoreRequestHeader.ColumnName = (_objStoreRequestHeaderSearchListRequestParam.SearchFilter != null && _objStoreRequestHeaderSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objStoreRequestHeaderSearchListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objStoreRequestHeader.IsGlobalSearch = _objStoreRequestHeaderSearchListRequestParam.IsGlobalSearch;
                _objStoreRequestHeader.SortOrder = _objStoreRequestHeaderSearchListRequestParam.SortOrder;
                _objStoreRequestHeader.ShortCut = _objStoreRequestHeaderSearchListRequestParam.ShortCut;
                _objStoreRequestHeader.SearchKeyword = (_objStoreRequestHeaderSearchListRequestParam.SearchFilter != null && _objStoreRequestHeaderSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objStoreRequestHeaderSearchListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objStoreRequestHeader.ParamType = "GetStockInStoreRequestByPagination";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objStoreRequestHeader, Helper.XML_PARAMS, StoredProcedure.STORE_REQUEST_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    if (ds.Tables.Contains(DataSetDataTableConstants.Table))
                    {
                        Helper.RenameDataSetTableName(ds, DataSetDataTableConstants.Table, Table);
                        if (!Helper.CheckDataSetIsNullOrEmpty(ds, Table))
                        {
                            ds.Tables[Table].Clear();
                        }
                    }
                    if (ds.Tables.Contains(DataSetDataTableConstants.Table1))
                    {
                        Helper.RenameDataSetTableName(ds, DataSetDataTableConstants.Table1, Table1);
                        if(!Helper.CheckDataSetIsNullOrEmpty(ds, Table1))
                        {
                            ds.Tables[Table1].Clear();
                        }
                    }
                }
                finalDataSet = ds;
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetStockInStoreRequestList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Stock Out Store Request List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objStoreRequestHeaderSearchListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetStockOutStoreRequestList(ODBCHelper _objODBCHelper, StoreRequestHeaderSearchListRequestParam _objStoreRequestHeaderSearchListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                StoreRequestHeader _objStoreRequestHeader = new StoreRequestHeader();
                _objStoreRequestHeader.PageSize = _objStoreRequestHeaderSearchListRequestParam.PageSize;
                _objStoreRequestHeader.PageNumber = _objStoreRequestHeaderSearchListRequestParam.PageNumber;
                _objStoreRequestHeader.SortColumns = (_objStoreRequestHeaderSearchListRequestParam.SearchFilter != null && _objStoreRequestHeaderSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objStoreRequestHeaderSearchListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objStoreRequestHeader.ColumnName = (_objStoreRequestHeaderSearchListRequestParam.SearchFilter != null && _objStoreRequestHeaderSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objStoreRequestHeaderSearchListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objStoreRequestHeader.IsGlobalSearch = _objStoreRequestHeaderSearchListRequestParam.IsGlobalSearch;
                _objStoreRequestHeader.SortOrder = _objStoreRequestHeaderSearchListRequestParam.SortOrder;
                _objStoreRequestHeader.ShortCut = _objStoreRequestHeaderSearchListRequestParam.ShortCut;
                _objStoreRequestHeader.SearchKeyword = (_objStoreRequestHeaderSearchListRequestParam.SearchFilter != null && _objStoreRequestHeaderSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objStoreRequestHeaderSearchListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objStoreRequestHeader.ParamType = "GetStockOutStoreRequestByPagination";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objStoreRequestHeader, Helper.XML_PARAMS, StoredProcedure.STORE_REQUEST_HEADER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<StoreRequestHeaderSearchListRequestParam>(_objStoreRequestHeaderSearchListRequestParam, ds, "TOTAL_RECORDS", "STOCK_OUT_STORE_REQUEST_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetStockInStoreRequestList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Store Request]

        #region [Batch Details]

        /// <summary>
        /// This Method Is Used To Save and Update Batch Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_lstBatchDetail"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateBatchDetails(ODBCHelper _objODBCHelper, List<BatchDetail> _lstBatchDetail)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "Status", "Message" };
            string TableName = "BATCH_DETAIL_RESPONSE";
            try
            {
                bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_lstBatchDetail);
                if (!IsEmpty)
                {
                    if (_lstBatchDetail != null && _lstBatchDetail.Count > 0)
                    {
                        var parameters = new List<(string, OdbcType, object, int?)>
                        {
                            ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                        };
                        finalDataSet = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(_lstBatchDetail, _lstBatchDetail.GetType(), _lstBatchDetail, Helper.XML_PARAMS, StoredProcedure.BATCH_DETAIL, parameters);
                        finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { Helper.ToProperCase(MessageTypeConstants.Error),  "Failed To Save/Update Batch Details !!!" }
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateBatchDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Get Batch Details By Store Request.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objGetBatchDetailRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetBatchDetailByStoreRequest(ODBCHelper _objODBCHelper, GetBatchDetailRequestParam _objGetBatchDetailRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string Table = "STORE_REQUEST_DETAILS_RESPONSE";
            string Table1 = "BATCH_DETAIL_BY_STORE_REQUEST_RESPONSE";
            try
            {
                BatchDetail _objBatchDetail = Helper.ToCopyClassProperties<GetBatchDetailRequestParam, BatchDetail>(_objGetBatchDetailRequestParam);
                var parameters = new List<(string, OdbcType, object, int?)>
                {
                    ("ParamType", OdbcType.NVarChar, "GetBatchDetailByStoreRequest", 100)
                };
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objBatchDetail, Helper.XML_PARAMS, StoredProcedure.BATCH_DETAIL, parameters);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    if (ds.Tables.Contains(DataSetDataTableConstants.Table))
                    {
                        string TableDBStatus = Helper.ToProperCase(ds.Tables[DataSetDataTableConstants.Table].Rows[0]["Status"].ToString());
                        Helper.RenameDataSetTableName(ds, DataSetDataTableConstants.Table, Table);
                        if (TableDBStatus == Helper.ToProperCase(MessageTypeConstants.Error))
                        {
                            ds.Tables[Table].Clear();
                        }
                    }
                    if (ds.Tables.Contains(DataSetDataTableConstants.Table1))
                    {
                        string Table1DBStatus = Helper.ToProperCase(ds.Tables[DataSetDataTableConstants.Table1].Rows[0]["Status"].ToString());
                        Helper.RenameDataSetTableName(ds, DataSetDataTableConstants.Table1, Table1);
                        if (Table1DBStatus == Helper.ToProperCase(MessageTypeConstants.Error))
                        {
                            ds.Tables[Table1].Clear();
                        }
                    }
                }
                finalDataSet = ds;
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetBatchDetailByStoreRequest()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Batch Details]

        #region [Batch Master]

        /// <summary>
        /// This Method Is Used to Get Current Stock List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objCurrentStockSearchListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetCurrentStockList(ODBCHelper _objODBCHelper, CurrentStockSearchListRequestParam _objCurrentStockSearchListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                BatchMaster _objBatchMaster = new BatchMaster();
                _objBatchMaster.PageSize = _objCurrentStockSearchListRequestParam.PageSize;
                _objBatchMaster.PageNumber = _objCurrentStockSearchListRequestParam.PageNumber;
                _objBatchMaster.SortColumns = (_objCurrentStockSearchListRequestParam.SearchFilter != null && _objCurrentStockSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objCurrentStockSearchListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objBatchMaster.ColumnName = (_objCurrentStockSearchListRequestParam.SearchFilter != null && _objCurrentStockSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objCurrentStockSearchListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objBatchMaster.IsGlobalSearch = _objCurrentStockSearchListRequestParam.IsGlobalSearch;
                _objBatchMaster.SortOrder = _objCurrentStockSearchListRequestParam.SortOrder;
                _objBatchMaster.ShortCut = _objCurrentStockSearchListRequestParam.ShortCut;
                _objBatchMaster.SearchKeyword = (_objCurrentStockSearchListRequestParam.SearchFilter != null && _objCurrentStockSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objCurrentStockSearchListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objBatchMaster.ParamType = "GetCurrentStockByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objBatchMaster, Helper.XML_PARAMS, StoredProcedure.BATCH_MASTER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<CurrentStockSearchListRequestParam>(_objCurrentStockSearchListRequestParam, finalDataSet, "TOTAL_RECORDS", "CURRENT_STOCK_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetCurrentStockList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Batch Master]

        #region [Stock Adjustment Request]

        /// <summary>
        /// This Method Is Used To Save and Update Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objStockAdjustmentRequestHeader"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        /// <exception cref="InvalidOperationException"></exception>
        public async Task<DataSet> SaveAndUpdateStockAdjustmentRequestDetails(ODBCHelper _objODBCHelper, StockAdjustmentRequestHeader _objStockAdjustmentRequestHeader)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string TableName = "STOCK_ADJUSTMENT_RESPONSE";
            try
            {
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objStockAdjustmentRequestHeader, Helper.XML_PARAMS, StoredProcedure.STOCK_ADJUSTMENT_REQUEST_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    string Status = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    string Message = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    if (Status == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        int AdjustmentID = 0;
                        int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out AdjustmentID);
                        bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objStockAdjustmentRequestHeader.StockAdjustmentRequestDetail);
                        if (!IsEmpty)
                        {
                            if (_objStockAdjustmentRequestHeader.StockAdjustmentRequestDetail != null && _objStockAdjustmentRequestHeader.StockAdjustmentRequestDetail.Count > 0)
                            {
                                List<StockAdjustmentRequestDetail> lstStockAdjustmentRequestHeaderDetail = new List<StockAdjustmentRequestDetail>();
                                lstStockAdjustmentRequestHeaderDetail = _objStockAdjustmentRequestHeader.StockAdjustmentRequestDetail;
                                lstStockAdjustmentRequestHeaderDetail.ForEach(x => x.AdjustmentID = AdjustmentID);

                                var parameters = new List<(string, OdbcType, object, int?)>
                                {
                                    ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                                };
                                bool isInsert = _objStockAdjustmentRequestHeader.AdjustmentID == 0;
                                var dsStockAdjustmentRequestHeaderDetail = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstStockAdjustmentRequestHeaderDetail, lstStockAdjustmentRequestHeaderDetail.GetType(), lstStockAdjustmentRequestHeaderDetail, Helper.XML_PARAMS, StoredProcedure.STOCK_ADJUSTMENT_REQUEST_DETAIL, parameters);
                                if (Helper.CheckDataSetIsNullOrEmpty(dsStockAdjustmentRequestHeaderDetail))
                                {
                                    string StockAdjustmentRequestHeaderDetailStatus = Convert.ToString(dsStockAdjustmentRequestHeaderDetail.Tables[0].Rows[0]["Status"].ToString());
                                }
                                Message = isInsert ? "Stock Adjustment Request Saved Successfully !!!" : "Stock Adjustment Request Updated Successfully !!!";
                            }
                        }
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { AdjustmentID.ToString(), Status,  Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { "0", Status, Message }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateStockAdjustmentRequestDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objStockAdjustmentRequestHeaderDetailsRequestParam"></param>
        /// <returns></returns>
		public async Task<DataSet> GetStockAdjustmentRequestDetails(ODBCHelper _objODBCHelper, StockAdjustmentRequestHeaderDetailsRequestParam _objStockAdjustmentRequestHeaderDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string Table = "STOCK_ADJUSTMENT_REQUEST_HEADER_DETAILS";
            string Table1 = "STOCK_ADJUSTMENT_REQUEST_DETAILS";
            try
            {
                StockAdjustmentRequestHeader _objStockAdjustmentRequestHeader = Helper.ToCopyClassProperties<StockAdjustmentRequestHeaderDetailsRequestParam, StockAdjustmentRequestHeader>(_objStockAdjustmentRequestHeaderDetailsRequestParam);
                _objStockAdjustmentRequestHeader.ParamType = "GetStockAdjustmentRequestDetails";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objStockAdjustmentRequestHeader, Helper.XML_PARAMS, StoredProcedure.STOCK_ADJUSTMENT_REQUEST_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    if (ds.Tables.Contains(DataSetDataTableConstants.Table))
                    {
                        string TableDBStatus = Helper.ToProperCase(ds.Tables[DataSetDataTableConstants.Table].Rows[0]["Status"].ToString());
                        Helper.RenameDataSetTableName(ds, DataSetDataTableConstants.Table, Table);
                        if (TableDBStatus == Helper.ToProperCase(MessageTypeConstants.Error))
                        {
                            ds.Tables[Table].Clear();
                        }
                    }
                    if (ds.Tables.Contains(DataSetDataTableConstants.Table1))
                    {
                        string Table1DBStatus = Helper.ToProperCase(ds.Tables[DataSetDataTableConstants.Table1].Rows[0]["Status"].ToString());
                        Helper.RenameDataSetTableName(ds, DataSetDataTableConstants.Table1, Table1);
                        if (Table1DBStatus == Helper.ToProperCase(MessageTypeConstants.Error))
                        {
                            ds.Tables[Table1].Clear();
                        }
                    }
                }
                finalDataSet = ds;
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetStockAdjustmentRequestDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Stock Adjustment Request List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objStockAdjustmentRequestHeaderSearchListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetStockAdjustmentRequestList(ODBCHelper _objODBCHelper, StockAdjustmentRequestHeaderSearchListRequestParam _objStockAdjustmentRequestHeaderSearchListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string Table = "TOTAL_RECORDS";
            string Table1 = "STOCK_ADJUSTMENT_REQUEST_LIST";
            try
            {
                StockAdjustmentRequestHeader _objStockAdjustmentRequestHeader = new StockAdjustmentRequestHeader();
                _objStockAdjustmentRequestHeader.PageSize = _objStockAdjustmentRequestHeaderSearchListRequestParam.PageSize;
                _objStockAdjustmentRequestHeader.PageNumber = _objStockAdjustmentRequestHeaderSearchListRequestParam.PageNumber;
                _objStockAdjustmentRequestHeader.SortColumns = (_objStockAdjustmentRequestHeaderSearchListRequestParam.SearchFilter != null && _objStockAdjustmentRequestHeaderSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objStockAdjustmentRequestHeaderSearchListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objStockAdjustmentRequestHeader.ColumnName = (_objStockAdjustmentRequestHeaderSearchListRequestParam.SearchFilter != null && _objStockAdjustmentRequestHeaderSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objStockAdjustmentRequestHeaderSearchListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objStockAdjustmentRequestHeader.IsGlobalSearch = _objStockAdjustmentRequestHeaderSearchListRequestParam.IsGlobalSearch;
                _objStockAdjustmentRequestHeader.SortOrder = _objStockAdjustmentRequestHeaderSearchListRequestParam.SortOrder;
                _objStockAdjustmentRequestHeader.ShortCut = _objStockAdjustmentRequestHeaderSearchListRequestParam.ShortCut;
                _objStockAdjustmentRequestHeader.SearchKeyword = (_objStockAdjustmentRequestHeaderSearchListRequestParam.SearchFilter != null && _objStockAdjustmentRequestHeaderSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objStockAdjustmentRequestHeaderSearchListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objStockAdjustmentRequestHeader.ParamType = "GetStockAdjustmentRequestHeaderListByPagination";
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objStockAdjustmentRequestHeader, Helper.XML_PARAMS, StoredProcedure.STOCK_ADJUSTMENT_REQUEST_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    if (ds.Tables.Contains(DataSetDataTableConstants.Table))
                    {
                        Helper.RenameDataSetTableName(ds, DataSetDataTableConstants.Table, Table);
                        if (!Helper.CheckDataSetIsNullOrEmpty(ds, Table))
                        {
                            ds.Tables[Table].Clear();
                        }
                    }
                    if (ds.Tables.Contains(DataSetDataTableConstants.Table1))
                    {
                        Helper.RenameDataSetTableName(ds, DataSetDataTableConstants.Table1, Table1);
                        if (!Helper.CheckDataSetIsNullOrEmpty(ds, Table1))
                        {
                            ds.Tables[Table1].Clear();
                        }
                    }
                }
                finalDataSet = ds;
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetStockAdjustmentRequestList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Approve Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveStockAdjustmentRequestDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> ApproveStockAdjustmentRequestDetails(ODBCHelper _objODBCHelper, ApproveStockAdjustmentRequestDetailsRequestParam _objApproveStockAdjustmentRequestDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                StockAdjustmentRequestHeader _objStockAdjustmentRequestHeader = Helper.ToCopyClassProperties<ApproveStockAdjustmentRequestDetailsRequestParam, StockAdjustmentRequestHeader>(_objApproveStockAdjustmentRequestDetailsRequestParam);
                _objStockAdjustmentRequestHeader.ParamType = "ApproveStockAdjustment";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objStockAdjustmentRequestHeader, Helper.XML_PARAMS, StoredProcedure.STOCK_ADJUSTMENT_REQUEST_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "APPROVE_STOCK_ADJUSTMENT_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ApproveInspectionDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Cancel Stock Adjustment Request Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objCancelStockAdjustmentRequestDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> CancelStockAdjustmentRequestDetails(ODBCHelper _objODBCHelper, CancelStockAdjustmentRequestDetailsRequestParam _objCancelStockAdjustmentRequestDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                StockAdjustmentRequestHeader _objStockAdjustmentRequestHeader = Helper.ToCopyClassProperties<CancelStockAdjustmentRequestDetailsRequestParam, StockAdjustmentRequestHeader>(_objCancelStockAdjustmentRequestDetailsRequestParam);
                _objStockAdjustmentRequestHeader.ParamType = "CancelStockAdjustment";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objStockAdjustmentRequestHeader, Helper.XML_PARAMS, StoredProcedure.STOCK_ADJUSTMENT_REQUEST_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "APPROVE_STOCK_ADJUSTMENT_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.CancelInspectionDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Stock Adjustment Request]

        #region [Delivery Note]

        /// <summary>
        /// This Method Is Used To Save and Update Delivery Note Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objDeliveryNoteHeader"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateDeliveryNoteDetails(ODBCHelper _objODBCHelper, DeliveryNoteHeader _objDeliveryNoteHeader)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string TableName = "DELIVERY_NOTE_RESPONSE";
            string DBStatus = string.Empty;
            string DBMessage = string.Empty;
            try
            {
                var ds = await _objODBCHelper.ExecuteXMLStoredProcedure(_objDeliveryNoteHeader, Helper.XML_PARAMS, StoredProcedure.DELIVERY_NOTE_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(ds))
                {
                    DBStatus = Helper.ToProperCase(Convert.ToString(ds.Tables[0].Rows[0]["Status"].ToString()));
                    DBMessage = Convert.ToString(ds.Tables[0].Rows[0]["Message"].ToString());
                    bool IsDeliveryNoteHeaderSaved = false;
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        IsDeliveryNoteHeaderSaved = true;
                        DBMessage = string.Empty;
                        int DeliveryNoteNo = 0;
                        int.TryParse(ds.Tables[0].Rows[0]["ID"]?.ToString(), out DeliveryNoteNo);
                        bool IsEmpty = Helper.CheckWhetherGenericListAndPropertiesAreEmpty(_objDeliveryNoteHeader.DeliveryNoteDetail);
                        if (!IsEmpty)
                        {
                            if (_objDeliveryNoteHeader.DeliveryNoteDetail != null && _objDeliveryNoteHeader.DeliveryNoteDetail.Count > 0)
                            {
                                List<DeliveryNoteDetail> lstDeliveryNoteDetail = new List<DeliveryNoteDetail>();
                                lstDeliveryNoteDetail = _objDeliveryNoteHeader.DeliveryNoteDetail;
                                lstDeliveryNoteDetail.ForEach(x => x.DeliveryNoteID = DeliveryNoteNo);

                                var parameters = new List<(string, OdbcType, object, int?)>
                                {
                                    ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                                };
                                bool IsDeliveryNoteDetailSaved = false;
                                bool isInsert = _objDeliveryNoteHeader.DeliveryNoteID == 0;
                                string DeliveryNoteDetailDBMessage = string.Empty;
                                var dsDeliveryNoteDetail = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(lstDeliveryNoteDetail, lstDeliveryNoteDetail.GetType(), lstDeliveryNoteDetail, Helper.XML_PARAMS, StoredProcedure.DELIVERY_NOTE_DETAIL, parameters);
                                if (Helper.CheckDataSetIsNullOrEmpty(dsDeliveryNoteDetail))
                                {
                                    DBStatus = Helper.ToProperCase(Convert.ToString(dsDeliveryNoteDetail.Tables[0].Rows[0]["Status"].ToString()));
                                    DeliveryNoteDetailDBMessage = Convert.ToString(dsDeliveryNoteDetail.Tables[0].Rows[0]["Message"].ToString());
                                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                                    {
                                        IsDeliveryNoteDetailSaved = true;
                                    }
                                }
                                if (IsDeliveryNoteHeaderSaved && IsDeliveryNoteDetailSaved)
                                {
                                    DBMessage = isInsert ? "Delivery Note Saved Successfully !!!" : "Delivery Note Updated Successfully !!!";
                                }
                                else if (IsDeliveryNoteHeaderSaved && IsDeliveryNoteDetailSaved == false)
                                {
                                    DBMessage = DeliveryNoteDetailDBMessage;
                                }
                            }
                        }
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { DeliveryNoteNo.ToString(), DBStatus, DBMessage }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { "0", DBStatus, DBMessage }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        return finalDataSet;
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateDeliveryNoteDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Delivery Note Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objDeliveryNoteDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetDeliveryNoteDetails(ODBCHelper _objODBCHelper, DeliveryNoteDetailsRequestParam _objDeliveryNoteDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "DELIVERY_NOTE_HEADER_RESPONSE";
            try
            {
                DeliveryNoteHeader _objDeliveryNoteHeader = Helper.ToCopyClassProperties<DeliveryNoteDetailsRequestParam, DeliveryNoteHeader>(_objDeliveryNoteDetailsRequestParam);
                _objDeliveryNoteHeader.ParamType = "GetDeliveryNoteDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objDeliveryNoteHeader, Helper.XML_PARAMS, StoredProcedure.DELIVERY_NOTE_HEADER);
                if (Helper.CheckDataSetIsNullOrEmpty(finalDataSet))
                {
                    string DBStatus = Helper.ToProperCase(Convert.ToString(finalDataSet.Tables[0].Rows[0]["Status"].ToString()));
                    if (DBStatus == Helper.ToProperCase(MessageTypeConstants.Success))
                    {
                        finalDataSet = Helper.CheckAndValidateMultipleDatasetTable(finalDataSet, (DataSetDataTableConstants.Table, TableName), (DataSetDataTableConstants.Table1, "DELIVERY_NOTE_DETAILS_RESPONSE"));
                    }
                    else
                    {
                        finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetDeliveryNoteDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Delivery Note List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objDeliveryNoteListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetDeliveryNoteList(ODBCHelper _objODBCHelper, DeliveryNoteSearchListRequestParam _objDeliveryNoteListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                DeliveryNoteHeader _objDeliveryNoteHeader = new DeliveryNoteHeader();
                _objDeliveryNoteHeader.PageSize = _objDeliveryNoteListRequestParam.PageSize;
                _objDeliveryNoteHeader.PageNumber = _objDeliveryNoteListRequestParam.PageNumber;
                _objDeliveryNoteHeader.SortColumns = (_objDeliveryNoteListRequestParam.SearchFilter != null && _objDeliveryNoteListRequestParam.SearchFilter.Any()) ? string.Join(",", _objDeliveryNoteListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objDeliveryNoteHeader.ColumnName = (_objDeliveryNoteListRequestParam.SearchFilter != null && _objDeliveryNoteListRequestParam.SearchFilter.Any()) ? string.Join(",", _objDeliveryNoteListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objDeliveryNoteHeader.IsGlobalSearch = _objDeliveryNoteListRequestParam.IsGlobalSearch;
                _objDeliveryNoteHeader.SortOrder = _objDeliveryNoteListRequestParam.SortOrder;
                _objDeliveryNoteHeader.ShortCut = _objDeliveryNoteListRequestParam.ShortCut;
                _objDeliveryNoteHeader.SearchKeyword = (_objDeliveryNoteListRequestParam.SearchFilter != null && _objDeliveryNoteListRequestParam.SearchFilter.Any()) ? string.Join(",", _objDeliveryNoteListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objDeliveryNoteHeader.ParamType = "GetDeliveryNoteHeaderListByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objDeliveryNoteHeader, Helper.XML_PARAMS, StoredProcedure.DELIVERY_NOTE_HEADER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<DeliveryNoteSearchListRequestParam>(_objDeliveryNoteListRequestParam, finalDataSet, "TOTAL_RECORDS", "DELIVERY_NOTE_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetDeliveryNoteHeaderList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used to Approve Delivery Note Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveDeliveryNoteDetails"></param>
        /// <returns></returns>
        public async Task<DataSet> ApproveDeliveryNoteDetails(ODBCHelper _objODBCHelper, ApproveDeliveryNoteDetails _objApproveDeliveryNoteDetails)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string DBMessage = string.Empty;
            string TableName = "APPROVE_DELIVERY_NOTE_DETAILS_RESPONSE";
            try
            {
                DeliveryNoteHeader _objDeliveryNoteHeader = Helper.ToCopyClassProperties<ApproveDeliveryNoteDetails, DeliveryNoteHeader>(_objApproveDeliveryNoteDetails);
                _objDeliveryNoteHeader.ParamType = "ApproveDeliveryNoteDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objDeliveryNoteHeader, Helper.XML_PARAMS, StoredProcedure.DELIVERY_NOTE_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ApproveDeliveryNoteDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used to Short Close Delivery Note Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objShortCloseDeliveryNoteDetails"></param>
        /// <returns></returns>
        public async Task<DataSet> ShortCloseDeliveryNoteDetails(ODBCHelper _objODBCHelper, ShortCloseDeliveryNoteDetails _objShortCloseDeliveryNoteDetails)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string DBMessage = string.Empty;
            string TableName = "SHORT_CLOSE_DELIVERY_NOTE_DETAILS_RESPONSE";
            try
            {
                DeliveryNoteHeader _objDeliveryNoteHeader = Helper.ToCopyClassProperties<ShortCloseDeliveryNoteDetails, DeliveryNoteHeader>(_objShortCloseDeliveryNoteDetails);
                _objDeliveryNoteHeader.ParamType = "ShortCloseDeliveryNoteDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objDeliveryNoteHeader, Helper.XML_PARAMS, StoredProcedure.DELIVERY_NOTE_HEADER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ShortCloseDeliveryNoteDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Delivery Note]

        #region [Inventory Transaction Log]

        /// <summary>
        /// This Method Is Used to Get Inventory Transaction Log List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objInventoryTransactionLogSearchListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetInventoryTransactionLogList(ODBCHelper _objODBCHelper, InventoryTransactionLogSearchListRequestParam _objInventoryTransactionLogSearchListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                InventoryTransactionLog _objInventoryTransactionLog = new InventoryTransactionLog();
                _objInventoryTransactionLog.ItemCode = _objInventoryTransactionLogSearchListRequestParam.ItemCode;
                _objInventoryTransactionLog.FromDate = _objInventoryTransactionLogSearchListRequestParam.FromDate;
                _objInventoryTransactionLog.ToDate = _objInventoryTransactionLogSearchListRequestParam.ToDate;
                _objInventoryTransactionLog.PageSize = _objInventoryTransactionLogSearchListRequestParam.PageSize;
                _objInventoryTransactionLog.PageNumber = _objInventoryTransactionLogSearchListRequestParam.PageNumber;
                _objInventoryTransactionLog.SortColumns = (_objInventoryTransactionLogSearchListRequestParam.SearchFilter != null && _objInventoryTransactionLogSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objInventoryTransactionLogSearchListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objInventoryTransactionLog.ColumnName = (_objInventoryTransactionLogSearchListRequestParam.SearchFilter != null && _objInventoryTransactionLogSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objInventoryTransactionLogSearchListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objInventoryTransactionLog.IsGlobalSearch = _objInventoryTransactionLogSearchListRequestParam.IsGlobalSearch;
                _objInventoryTransactionLog.SortOrder = _objInventoryTransactionLogSearchListRequestParam.SortOrder;
                _objInventoryTransactionLog.SearchKeyword = (_objInventoryTransactionLogSearchListRequestParam.SearchFilter != null && _objInventoryTransactionLogSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objInventoryTransactionLogSearchListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objInventoryTransactionLog.ParamType = "GetInventoryTransactionLogListByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objInventoryTransactionLog, Helper.XML_PARAMS, StoredProcedure.INVENTORY_TRANSACTION_LOG);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<InventoryTransactionLogSearchListRequestParam>(_objInventoryTransactionLogSearchListRequestParam, finalDataSet, "TOTAL_RECORDS", "INVENTORY_TRANSACTION_LOG_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetInventoryTransactionLogList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }


        #endregion [Inventory Transaction Log]

        #region [Supplier Items]

        /// <summary>
        /// This Method Is Used To Save and Update Delivery Note Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objSupplierItems"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateSupplierItemDetails(ODBCHelper _objODBCHelper, SupplierItems _objSupplierItems)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "SUPPLIER_ITEM_RESPONSE";
            try
            {
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierItems, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_ITEMS);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateSupplierItemDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Save and Update Delivery Note Details Demo Test.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objSupplierItems"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateSupplierItemDetailsDemoTest(ODBCHelper _objODBCHelper, SupplierItems _objSupplierItems)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "SUPPLIER_ITEM_RESPONSE1";
            try
            {
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierItems, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_ITEMS);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.SaveAndUpdateSupplierItemDetailsDemoTest()", ex.Message, false);
                throw;
            }
            return finalDataSet;

        }

        /// <summary>
        /// This Method Is Used to Get Supplier Item Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objSupplierItemsDetailsRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetSupplierItemDetails(ODBCHelper _objODBCHelper, SupplierItemsDetailsRequestParam _objSupplierItemsDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "SUPPLIER_ITEM_DETAIL_RESPONSE";
            try
            {
                SupplierItems _objSupplierItems = Helper.ToCopyClassProperties<SupplierItemsDetailsRequestParam, SupplierItems>(_objSupplierItemsDetailsRequestParam);
                _objSupplierItems.ParamType = "GetSupplierItemDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierItems, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_ITEMS);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetSupplierItemDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        public async Task<DataSet> GetSupplierItemDetailsTest(ODBCHelper _objODBCHelper, SupplierItemsDetailsRequestParam _objSupplierItemsDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "SUPPLIER_ITEM_DETAIL_RESPONSE";
            try
            {
                SupplierItems _objSupplierItems = Helper.ToCopyClassProperties<SupplierItemsDetailsRequestParam, SupplierItems>(_objSupplierItemsDetailsRequestParam);
                _objSupplierItems.ParamType = "GetSupplierItemDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierItems, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_ITEMS);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetSupplierItemDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        public async Task<DataSet> GetSupplierItemDetailsTestMethod(ODBCHelper _objODBCHelper, SupplierItemsDetailsRequestParam _objSupplierItemsDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            DataSet ds = new DataSet();
            string TableName = "SUPPLIER_ITEM_DETAIL_RESPONSE";
            try
            {
                SupplierItems _objSupplierItems = Helper.ToCopyClassProperties<SupplierItemsDetailsRequestParam, SupplierItems>(_objSupplierItemsDetailsRequestParam);
                _objSupplierItems.ParamType = "GetSupplierItemDetails";
                var ds1 = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierItems, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_ITEMS);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetSupplierItemDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        public async Task<DataSet> GetSupplierItemDetailsDemoMethod(ODBCHelper _objODBCHelper, SupplierDemoItemsDetailsRequestParam _objSupplierItemsDetailsRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            DataSet ds = new DataSet();
            string TableName = "SUPPLIER_ITEM_DETAIL_RESPONSE";
            try
            {
                SupplierItems _objSupplierItems = Helper.ToCopyClassProperties<SupplierDemoItemsDetailsRequestParam, SupplierItems>(_objSupplierItemsDetailsRequestParam);
                _objSupplierItems.ParamType = "GetSupplierItemDetails";
                var ds1 = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierItems, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_ITEMS);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"IMasterResp.GetSupplierItemDetailsDemoMethod()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used to Get Supplier Item List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objSupplierItemsSearchListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetSupplierItemList(ODBCHelper _objODBCHelper, SupplierItemsSearchListRequestParam _objSupplierItemsSearchListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                SupplierItems _objSupplierItems = new SupplierItems();
                _objSupplierItems.PageSize = _objSupplierItemsSearchListRequestParam.PageSize;
                _objSupplierItems.PageNumber = _objSupplierItemsSearchListRequestParam.PageNumber;
                _objSupplierItems.SortColumns = (_objSupplierItemsSearchListRequestParam.SearchFilter != null && _objSupplierItemsSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objSupplierItemsSearchListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objSupplierItems.ColumnName = (_objSupplierItemsSearchListRequestParam.SearchFilter != null && _objSupplierItemsSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objSupplierItemsSearchListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objSupplierItems.IsGlobalSearch = _objSupplierItemsSearchListRequestParam.IsGlobalSearch;
                _objSupplierItems.SortOrder = _objSupplierItemsSearchListRequestParam.SortOrder;
                _objSupplierItems.ShortCut = _objSupplierItemsSearchListRequestParam.ShortCut;
                _objSupplierItems.SearchKeyword = (_objSupplierItemsSearchListRequestParam.SearchFilter != null && _objSupplierItemsSearchListRequestParam.SearchFilter.Any()) ? string.Join(",", _objSupplierItemsSearchListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objSupplierItems.ParamType = "GetSupplierItemListByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierItems, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_ITEMS);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<SupplierItemsSearchListRequestParam>(_objSupplierItemsSearchListRequestParam, finalDataSet, "TOTAL_RECORDS", "SUPPLIER_ITEM_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetSupplierItemsList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
		/// This Method is Used to Get Supplier Master List In Supplier Item.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objSupplierMasterListRequestParam"></param>
		/// <returns></returns>
		public async Task<DataSet> GetSupplierMasterListInSupplierItem(ODBCHelper _objODBCHelper, SearchSupplierMasterListRequestParam _objSupplierMasterListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                SupplierMaster _objSupplierMaster = new SupplierMaster();
                _objSupplierMaster.PageSize = _objSupplierMasterListRequestParam.PageSize;
                _objSupplierMaster.PageNumber = _objSupplierMasterListRequestParam.PageNumber;
                _objSupplierMaster.SortColumns = (_objSupplierMasterListRequestParam.SearchFilter != null && _objSupplierMasterListRequestParam.SearchFilter.Any()) ? string.Join(",", _objSupplierMasterListRequestParam.SearchFilter.OrderByDescending(x => x.ColumnSequence).Select(x => x.ColumnName).FirstOrDefault()) : string.Empty;
                _objSupplierMaster.ColumnName = (_objSupplierMasterListRequestParam.SearchFilter != null && _objSupplierMasterListRequestParam.SearchFilter.Any()) ? string.Join(",", _objSupplierMasterListRequestParam.SearchFilter.Select(x => x.ColumnName)) : string.Empty;
                _objSupplierMaster.IsGlobalSearch = _objSupplierMasterListRequestParam.IsGlobalSearch;
                _objSupplierMaster.SortOrder = _objSupplierMasterListRequestParam.SortOrder;
                _objSupplierMaster.SearchKeyword = (_objSupplierMasterListRequestParam.SearchFilter != null && _objSupplierMasterListRequestParam.SearchFilter.Any()) ? string.Join(",", _objSupplierMasterListRequestParam.SearchFilter.Select(x => x.SearchKeyword)) : string.Empty;
                _objSupplierMaster.ParamType = "GetSupplierMasterInSupplierItemByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierMaster, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_MASTER);
                finalDataSet = Helper.CheckAndValidateMultipleDatasetTable<SearchSupplierMasterListRequestParam>(_objSupplierMasterListRequestParam, finalDataSet, "TOTAL_RECORDS", "SUPPLIER_MASTER_IN_SUPPLIER_ITEM_LIST");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.GetSupplierMasterListInSupplierItem()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used to Approve Supplier Item Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objApproveSupplierItemsDetails"></param>
        /// <returns></returns>
        public async Task<DataSet> ApproveSupplierItemDetails(ODBCHelper _objODBCHelper, ApproveSupplierItemsDetails _objApproveSupplierItemsDetails)
        {
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string DBMessage = string.Empty;
            string TableName = "APPROVE_SUPPLIER_ITEM_DETAILS_RESPONSE";
            try
            {
                SupplierItems _objSupplierItems = Helper.ToCopyClassProperties<ApproveSupplierItemsDetails, SupplierItems>(_objApproveSupplierItemsDetails);
                _objSupplierItems.ParamType = "ApproveSupplierItemDetails";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objSupplierItems, Helper.XML_PARAMS, StoredProcedure.SUPPLIER_ITEMS);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IMasterRespLogClassName}.ApproveSupplierItemDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Supplier Items]
    }
}