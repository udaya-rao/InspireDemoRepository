using System.Data;
using System.Data.Odbc;
using CommonLib;
using CommonLib.Constants;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;

namespace InspireMagneticsWebAPI.Repositories
{
    public class IEmployeeResp : IEmployee
    {
        private readonly string IEmployeeRespLogClassName = "IEmployeeResp";

        #region [Employee Master]

        /// <summary>
        /// This Method Is Used To Save and Update Employee Master Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeMaster"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateEmployee(ODBCHelper _objODBCHelper, EmployeeMaster _objEmployeeMaster)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objEmployeeMaster, Helper.XML_PARAMS, StoredProcedure.EMPLOYEE_MASTER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "EMPLOYEE_MASTER_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IEmployeeRespLogClassName}.SaveAndUpdateEmployee()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Employee Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeMasterDetailRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetEmployeeDetails(ODBCHelper _objODBCHelper, EmployeeMasterDetailRequestParam _objEmployeeMasterDetailRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                string TABLENAME = string.Empty;
                switch (_objEmployeeMasterDetailRequestParam.ParamType)
                {
                    case "GetEmployeeDetails":
                        TABLENAME = "EMPLOYEE_DETAILS";
                        break;
                    case "GetEmployeeByAccessId":
                        TABLENAME = "EMPLOYEE_DETAILS_BY_ACCESS_ID";
                        break;
                    default:
                        TABLENAME = "EMPLOYEE_DETAILS";
                        break;
                }
                EmployeeMaster _objEmployeeMaster = new EmployeeMaster();
                _objEmployeeMaster.EmployeeID = _objEmployeeMasterDetailRequestParam.EmployeeID;
                _objEmployeeMaster.RuleID = _objEmployeeMasterDetailRequestParam.RuleID;
                _objEmployeeMaster.ParamType = _objEmployeeMasterDetailRequestParam.ParamType;
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objEmployeeMaster, Helper.XML_PARAMS, StoredProcedure.EMPLOYEE_MASTER);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TABLENAME);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IEmployeeRespLogClassName}.GetEmployeeDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Get Employee Master List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeMasterListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetEmployeeMasterList(ODBCHelper _objODBCHelper, EmployeeMasterListRequestParam _objEmployeeMasterListRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                EmployeeMaster _objEmployeeMaster = new EmployeeMaster();
                _objEmployeeMaster.PageSize = _objEmployeeMasterListRequestParam.PageSize;
                _objEmployeeMaster.PageNumber = _objEmployeeMasterListRequestParam.PageNumber;
                _objEmployeeMaster.ParamType = "GetEmployeeMasterListByPagination";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objEmployeeMaster, Helper.XML_PARAMS, StoredProcedure.EMPLOYEE_MASTER);
                if (finalDataSet.Tables.Contains(DataSetDataTableConstants.Table))
                {
                    finalDataSet.Tables[DataSetDataTableConstants.Table].TableName = "TOTAL_RECORDS";
                }
                if (finalDataSet.Tables.Contains(DataSetDataTableConstants.Table1))
                {
                    finalDataSet.Tables[DataSetDataTableConstants.Table1].TableName = "EMPLOYEE_MASTER_LIST";
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IEmployeeRespLogClassName}.GetEmployeeMasterList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

		/// <summary>
		/// This Method Is Used To Delete Employee Security Access Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteEmployeeMasterDetail"></param>
		/// <returns></returns>
		public async Task<DataSet> DeleteEmployeeMaster(ODBCHelper _objODBCHelper, DeleteEmployeeMasterDetail _objDeleteEmployeeMasterDetail)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				EmployeeMaster _objEmployeeMaster = new EmployeeMaster();
				_objEmployeeMaster.EmployeeID = _objDeleteEmployeeMasterDetail.EmployeeID;
				_objEmployeeMaster.ParamType = _objDeleteEmployeeMasterDetail.ParamType;
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objEmployeeMaster, Helper.XML_PARAMS, StoredProcedure.EMPLOYEE_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "EMPLOYEE_DELETE_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IEmployeeRespLogClassName}.DeleteEmployeeMaster()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

        /// <summary>
        /// This Method is Used to Get Responsible Person List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <returns></returns>
        public async Task<DataSet> GetResponsiblePersonList(ODBCHelper _objODBCHelper)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                EmployeeMaster _objEmployeeMaster = new EmployeeMaster();
                _objEmployeeMaster.ParamType = "GetResponsiblePersonList";
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objEmployeeMaster, Helper.XML_PARAMS, StoredProcedure.EMPLOYEE_MASTER);
                if (finalDataSet.Tables.Contains(DataSetDataTableConstants.Table))
                {
                    finalDataSet.Tables[DataSetDataTableConstants.Table].TableName = "RESPONSIBLE_PERSON_LIST";
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IEmployeeRespLogClassName}.GetResponsiblePersonList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Employee Master]

        #region [Employee Security Access]

        /// <summary>
        /// This Method Is Used To Save and Update Employee Security Access Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeSecurityAccessRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateEmployeeSecurityAccess(ODBCHelper _objODBCHelper, EmployeeSecurityAccessRequestParam _objEmployeeSecurityAccessRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                if(_objEmployeeSecurityAccessRequestParam != null && _objEmployeeSecurityAccessRequestParam.employeeSecurityAccess.Count > 0)
                {
                    List<EmployeeSecurityAccess> _objEmployeeSecurityAccessList = new List<EmployeeSecurityAccess>();
                    _objEmployeeSecurityAccessList = _objEmployeeSecurityAccessRequestParam.employeeSecurityAccess;
                    _objEmployeeSecurityAccessList.ForEach(x => x.ParamType = OperationTypeConstants.Add);
                    var parameters = new List<(string, OdbcType, object, int?)>
                    {
                        ("ParamType", OdbcType.NVarChar, OperationTypeConstants.Add, 100)
                    };
                    finalDataSet = await _objODBCHelper.ExecuteXMLListStoredProcedureWithMultipleParameters(_objEmployeeSecurityAccessList, _objEmployeeSecurityAccessList.GetType(), _objEmployeeSecurityAccessList, Helper.XML_PARAMS, StoredProcedure.EMPLOYEE_SECURITY_ACCESS, parameters);
                }
                else
                {
                    EmployeeSecurityAccess _objEmployeeSecurityAccess = new EmployeeSecurityAccess();
                    _objEmployeeSecurityAccess.EmployeeID = _objEmployeeSecurityAccessRequestParam.EmployeeID;
                    var parameters = new List<(string, OdbcType, object, int?)>
                    {
                        ("ParamType", OdbcType.NVarChar, "DELETE", 100)
                    };
                    finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedureWithMultipleParameters(_objEmployeeSecurityAccess, Helper.XML_PARAMS, StoredProcedure.EMPLOYEE_SECURITY_ACCESS, parameters);
                }
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "EMPLOYEE_SECURITY_ACCESS_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IEmployeeRespLogClassName}.SaveAndUpdateEmployeeSecurityAccess()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Delete Employee Security Access Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeSecurityAccessDelete"></param>
        /// <returns></returns>
        public async Task<DataSet> DeleteEmployeeSecurityAccess(ODBCHelper _objODBCHelper, EmployeeSecurityAccessDelete _objEmployeeSecurityAccessDelete)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                EmployeeSecurityAccess _objEmployeeSecurityAccess = new EmployeeSecurityAccess();
                _objEmployeeSecurityAccess.SecurityID = _objEmployeeSecurityAccessDelete.SecurityID;
                _objEmployeeSecurityAccess.EmployeeID = _objEmployeeSecurityAccessDelete.EmployeeID;
                _objEmployeeSecurityAccess.RuleID = _objEmployeeSecurityAccessDelete.RuleID;
                _objEmployeeSecurityAccess.ParamType = _objEmployeeSecurityAccessDelete.ParamType;
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objEmployeeSecurityAccess, Helper.XML_PARAMS, StoredProcedure.EMPLOYEE_SECURITY_ACCESS_LIST);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "EMPLOYEE_SECURITY_ACCESS_DELETE_RESPONSE");
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IEmployeeRespLogClassName}.DeleteEmployeeSecurityAccess()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Get Employee Security Access List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeSecurityAccessList"></param>
        /// <returns></returns>
        public async Task<DataSet> GetEmployeeSecurityAccessList(ODBCHelper _objODBCHelper, EmployeeSecurityAccessList _objEmployeeSecurityAccessList)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                EmployeeSecurityAccess _objEmployeeSecurityAccess = new EmployeeSecurityAccess();
                _objEmployeeSecurityAccess.EmployeeID = _objEmployeeSecurityAccessList.EmployeeID;
                _objEmployeeSecurityAccess.ParamType = _objEmployeeSecurityAccessList.ParamType;
                finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objEmployeeSecurityAccess, Helper.XML_PARAMS, StoredProcedure.EMPLOYEE_SECURITY_ACCESS_LIST);
                if (finalDataSet.Tables.Contains(DataSetDataTableConstants.Table))
                {
                    finalDataSet.Tables[DataSetDataTableConstants.Table].TableName = "EMPLOYEE_SECURITY_ACCESS_LIST";
                }
                if (finalDataSet.Tables.Contains(DataSetDataTableConstants.Table1))
                {
                    finalDataSet.Tables[DataSetDataTableConstants.Table1].TableName = "ASSIGNED_EMPLOYEE_SECURITY_ACCESS_LIST";
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IEmployeeRespLogClassName}.GetEmployeeSecurityAccessList()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [Employee Security Access]
    }
}
