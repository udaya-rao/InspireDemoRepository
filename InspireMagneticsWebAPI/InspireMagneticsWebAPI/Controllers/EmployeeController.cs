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
    public class EmployeeController : BaseApiAuthorizationController
    {
        private readonly IEmployee IEmployeeSvc = null;
        private readonly ODBCHelper _ODBCHelper;
        private readonly IMapper _mapper;
        private const string ControllerLogName = "EmployeeController";

        /// <summary>
        /// Employee Controller Class Constructor
        /// </summary>
        /// <param name="ServiceRepository"></param>
        /// <param name="ODBCHelper"></param>
        /// <param name="mapper"></param>
        public EmployeeController(IEmployee ServiceRepository, ODBCHelper ODBCHelper, IMapper mapper)
        {
			IEmployeeSvc = ServiceRepository;
            _ODBCHelper = ODBCHelper;
            _mapper = mapper;
        }

        #region [Employee Master]

        /// <summary>
        /// This Post Action Method Is Used To Save and Update Employee Details.
        /// </summary>
        /// <param name="_objEmployeeMasterM">
        /// To Save and Update Employee Details Below Request Parameters is required Such as EmployeeID, RuleID, EmployeeCode, LoginID, EmployeeName, DateofBirth (yyyy-MM-dd), DepartmentID, LoginPassword, EmployeeStatus, MobileNumber, EmailID, OTPEnable(Y/N), ParamType(Insert/Update).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Employee Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateEmployee")]
        public async Task<ActionResult<string>> SaveAndUpdateEmployee(EmployeeMasterM _objEmployeeMasterM)
        {
            string ReturnResult = string.Empty;
            try
            {
                bool IsValidEmployeeCode = (_objEmployeeMasterM.EmployeeCode == string.Empty) ? false : true;
                if(IsValidEmployeeCode)
                {
                    ModelState.Remove(nameof(EmployeeMasterM.LoginPassword));
                }
                if (ModelState.IsValid)
                {
                    _objEmployeeMasterM.EmployeeCode = IsValidEmployeeCode ? _objEmployeeMasterM.EmployeeCode : "0";
                    EmployeeMaster _objEmployeeMaster = _mapper.Map<EmployeeMaster>(_objEmployeeMasterM);
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IEmployeeSvc.SaveAndUpdateEmployee(_ODBCHelper, _objEmployeeMaster));
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateEmployee()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Employee Details.
        /// </summary>
        /// <param name="_objEmployeeMasterDetailRequestParam">
        /// The Employee Details Filter Request Parameters Such as Employee ID, Rule ID.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered employee details.
        /// </returns>
        [HttpPost, ActionName("GetEmployeeDetails")]
        public async Task<ActionResult<string>> GetEmployeeDetails(EmployeeMasterDetailRequestParam _objEmployeeMasterDetailRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IEmployeeSvc.GetEmployeeDetails(_ODBCHelper, _objEmployeeMasterDetailRequestParam));
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog,ControllerLogNamespace, $"{ControllerLogName}.GetEmployeeDetails()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Employee Master List.
        /// </summary>
        /// <param name="_objEmployeeMasterListRequestParam">
        /// The Employee Master List Filter Request Parameters Such as Page Size and Page Number.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the filtered employee master list.
        /// </returns>
        ///// <response code="200">Returns the employee master list</response>
        ///// <response code="404">If the result is empty or model validation fails</response>
        ///// <response code="500">If an internal error occurs</response>
        //[ProducesResponseType(StatusCodes.Status200OK)]
        //[ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPost, ActionName("GetEmployeeMasterList")]
        public async Task<ActionResult<string>> GetEmployeeMasterList(EmployeeMasterListRequestParam _objEmployeeMasterListRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IEmployeeSvc.GetEmployeeMasterList(_ODBCHelper, _objEmployeeMasterListRequestParam));
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetEmployeeMasterList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Delete Employee Details.
        /// </summary>
        /// <param name="_objDeleteEmployeeMasterDetail"></param>
        /// <returns></returns>
        [HttpPost, ActionName("DeleteEmployeeMaster")]
		public async Task<ActionResult<string>> DeleteEmployeeMaster(DeleteEmployeeMasterDetail _objDeleteEmployeeMasterDetail)
		{
			string ReturnResult = string.Empty;
			try
			{
				if (ModelState.IsValid)
				{
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IEmployeeSvc.DeleteEmployeeMaster(_ODBCHelper, _objDeleteEmployeeMasterDetail));
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
				Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.DeleteEmployeeMaster()", ex.Message, false);
				throw;
			}
			return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
		}

        /// <summary>
        /// This Post Action Method Is Used To Get Responsible Person List.
        /// </summary>
        /// To Get Responsible Person List.
        /// <returns>
        /// A JSON-formatted string representing the filtered Responsible Person list.
        /// </returns>
        [HttpPost, ActionName("GetResponsiblePersonList")]
        public async Task<ActionResult<string>> GetResponsiblePersonList()
        {
            string ReturnResult = string.Empty;
            try
            {
                ReturnResult = ObjectToJson.ConvertDataSetToJson(await IEmployeeSvc.GetResponsiblePersonList(_ODBCHelper));
                if (ReturnResult == null || ReturnResult == string.Empty)
                {
                    return NotFound();
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetResponsiblePersonList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Employee Master]

        #region [Employee Security Access]

        /// <summary>
        /// This Post Action Method Is Used To Save and Update Employee Security Access Details.
        /// </summary>
        /// <param name="_objEmployeeSecurityAccessRequestParam">
        /// To Save and Update Employee Security Access Details Below Request Parameters is required Such as SecurityID, EmployeeID, RuleID, PreparedBy, ParamType(Insert/Update) in Array List.
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Employee Security Access Details.
        /// </returns>
        [HttpPost, ActionName("SaveAndUpdateEmployeeSecurityAccess")]
        public async Task<ActionResult<string>> SaveAndUpdateEmployeeSecurityAccess(EmployeeSecurityAccessRequestParam _objEmployeeSecurityAccessRequestParam)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IEmployeeSvc.SaveAndUpdateEmployeeSecurityAccess(_ODBCHelper, _objEmployeeSecurityAccessRequestParam));
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.SaveAndUpdateEmployee()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Delete Employee Security Access Details.
        /// </summary>
        /// <param name="_objEmployeeSecurityAccessDelete">
        /// To Delete Employee Security Access Details Below Request Parameters is required Such as SecurityID, EmployeeID, RuleID, ParamType(DELETE).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Employee Security Access Details.
        /// </returns>
        [HttpPost, ActionName("DeleteEmployeeSecurityAccess")]
        public async Task<ActionResult<string>> DeleteEmployeeSecurityAccess(EmployeeSecurityAccessDelete _objEmployeeSecurityAccessDelete)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IEmployeeSvc.DeleteEmployeeSecurityAccess(_ODBCHelper, _objEmployeeSecurityAccessDelete));
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.DeleteEmployeeSecurityAccess()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Employee Security Access List.
        /// </summary>
        /// <param name="_objEmployeeSecurityAccessList">
        /// To Get Employee Security Access List Below Request Parameters is required Such as EmployeeID and ParamType(GetAllSecurityAccessList).
        /// </param>
        /// <returns>
        /// A JSON-formatted string representing the Employee Security Access List.
        /// </returns>
        [HttpPost, ActionName("GetEmployeeSecurityAccessList")]
        public async Task<ActionResult<string>> GetEmployeeSecurityAccessList(EmployeeSecurityAccessList _objEmployeeSecurityAccessList)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IEmployeeSvc.GetEmployeeSecurityAccessList(_ODBCHelper, _objEmployeeSecurityAccessList));
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.GetEmployeeSecurityAccessList()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONListOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        #endregion [Employee Security Access]
    }
}
