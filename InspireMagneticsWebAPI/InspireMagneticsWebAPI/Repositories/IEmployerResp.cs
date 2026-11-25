using CommonLib;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;
using System.Data;

namespace InspireMagneticsWebAPI.Repositories
{
	public class IEmployerResp : IEmployer
	{
        private readonly string IEmployerRespLogClassName = "IEmployerResp";

        #region [Employer Master]

        /// <summary>
        /// This Method Is Used To Save and Update Employer Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployer"></param>
        /// <returns></returns>
        public async Task<DataSet> SaveAndUpdateEmployer(ODBCHelper _objODBCHelper, Employer _objEmployer)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objEmployer, Helper.XML_PARAMS, StoredProcedure.EMPLOYER_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, "EMPLOYER_MASTER_RESPONSE");
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IEmployerRespLogClassName}.SaveAndUpdateEmployer()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

        /// <summary>
        /// This Method is Used to Get Employer List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployerListRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> GetEmployerList(ODBCHelper _objODBCHelper, EmployerListRequestParam _objEmployerListRequestParam)
		{
			DataSet finalDataSet = new DataSet();
			try
			{
				string TABLENAME = string.Empty;
				switch (_objEmployerListRequestParam.ParamType)
				{
					case "GetAllEmployerList":
						TABLENAME = "EMPLOYER_LIST";
						break;
					case "GetEmployerDetails":
						TABLENAME = "EMPLOYER_DETAILS";
						break;
					default:
						TABLENAME = "EMPLOYER_LIST";
						break;
				}
				Employer _objEmployer = new Employer();
				_objEmployer.EmployerID = _objEmployerListRequestParam.EmployerID;
				_objEmployer.ParamType = _objEmployerListRequestParam.ParamType;
				finalDataSet = await _objODBCHelper.ExecuteXMLStoredProcedure(_objEmployer, Helper.XML_PARAMS, StoredProcedure.EMPLOYER_MASTER);
				finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TABLENAME);
			}
			catch (Exception ex)
			{
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IEmployerRespLogClassName}.GetEmployerList()", ex.Message, false);
				throw;
			}
			return finalDataSet;
		}

        #endregion [Employer Master]
    }
}
