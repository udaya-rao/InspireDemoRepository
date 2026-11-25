using CommonLib;
using CommonLib.Constants;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.Controllers.BaseControllers;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace InspireMagneticsWebAPI.Controllers
{
    public class EmployerController : BaseApiAuthorizationController
    {
		private readonly IEmployer IEmployerSvc = null;
		private readonly ODBCHelper _ODBCHelper;
        private const string ControllerLogName = "EmployeeController";

        /// <summary>
        /// Employer Controller Class Constructor
        /// </summary>
        /// <param name="ServiceRepository"></param>
        /// <param name="ODBCHelper"></param>
        public EmployerController(IEmployer ServiceRepository, ODBCHelper ODBCHelper)
		{
			IEmployerSvc = ServiceRepository;
			_ODBCHelper = ODBCHelper;
		}

		#region [Employer Master]

		/// <summary>
		/// This Post Action Method Is Used To Save and Update Employer Details.
		/// </summary>
		/// <param name="_objEmployer">
		/// To Save and Update Employer Details Below Request Parameters is required Such as Name,Address,Phone,Fax,EmailID,EmployerID,KSTRef,CSTRef, KSTDate,CSTDate, PANNo,ServiceTaxNo,
		/// MobileNumber, EnquiryDetails,OrdersDetails, DispatchDetails,MKTDetails,TechDetails,QuotationDetails,
		/// ExciseRegNo,ExciseRange,ExciseDivision,CommissionerRate,AccountsDetails,GSTNumber,CurrentLUTNo,	IPAddress, ParamType(Insert/Update). 
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the employee details.
		/// </returns>
		[HttpPost, ActionName("SaveAndUpdateEmployer")]
		public async Task<ActionResult<string>> SaveAndUpdateEmployer(Employer _objEmployer)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					_objEmployer.ParamType = "UPDATE";
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IEmployerSvc.SaveAndUpdateEmployer(_ODBCHelper, _objEmployer));
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
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateEmployer()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		/// <summary>
		/// This Post Action Method Is Used To Get Employer Details.
		/// </summary>
		/// <param name="_objEmployerListRequestParam">
		/// The Employer Master List Filter Request Parameters Such as Page Size and Page Number.
		/// </param>
		/// <returns>
		/// A JSON-formatted string representing the filtered employer list.
		/// </returns>
		[HttpPost, ActionName("GetEmployerList")]
		public async Task<ActionResult<string>> GetEmployerList(EmployerListRequestParam _objEmployerListRequestParam)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IEmployerSvc.GetEmployerList(_ODBCHelper, _objEmployerListRequestParam));
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
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetEmployerList()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

		#endregion [Employer Master]
	}
}
