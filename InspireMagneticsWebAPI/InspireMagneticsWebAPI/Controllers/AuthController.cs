using AutoMapper;
using CommonLib;
using CommonLib.Constants;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.Controllers.BaseControllers;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;
using InspireMagneticsWebAPI.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InspireMagneticsWebAPI.Controllers
{
    public class AuthController : BaseApiController
    {
        private readonly IUserLogin IUserLoginSvc = null;
        private readonly IOTP IOTPSvc = null;
        private readonly IConfiguration Configuration;
        private readonly ODBCHelper _ODBCHelper;
        private readonly IWebHostEnvironment webHostEnvironment;
        private readonly ITokenStoreService _tokenStoreService;
        private readonly TokenService _tokenService;
        private readonly IMapper _mapper;
        private const string ControllerLogName = "AuthController";

        /// <summary>
        /// Auth Controller Class Constructor
        /// </summary>
        /// <param name="ServiceRepository"></param>
        /// <param name="OTPServiceRepository"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <param name="ODBCHelper"></param>
        /// <param name="TokenStoreService"></param>
        /// <param name="configuration"></param>
        /// <param name="mapper"></param>
        public AuthController(IUserLogin ServiceRepository, IOTP OTPServiceRepository, IWebHostEnvironment _webHostEnvironment, ODBCHelper ODBCHelper,
            ITokenStoreService TokenStoreService, IConfiguration configuration, IMapper mapper)
        {
            IUserLoginSvc = ServiceRepository;
            IOTPSvc = OTPServiceRepository;
            _tokenStoreService = TokenStoreService;
            webHostEnvironment = _webHostEnvironment;
            _ODBCHelper = ODBCHelper;
            Configuration = configuration;
            _tokenService = new TokenService(Configuration);
            _mapper = mapper;
        }

        /// <summary>
        /// This Post Action Method Is Used To Login.
        /// </summary>
        /// <param name="objUserLogin"></param>
        /// <returns></returns>
        [HttpPost, ActionName("Login")]
        public async Task<ActionResult<string>> Login(UserLogin objUserLogin)
        {
            string ReturnResult = string.Empty;
            try
            {
				if (ModelState.IsValid)
                {
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IUserLoginSvc.GetUserLoginDetails(_ODBCHelper, IOTPSvc, webHostEnvironment, _tokenStoreService, _tokenService, objUserLogin));
					if (ReturnResult == null || ReturnResult == string.Empty)
					{
						return Unauthorized();
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.Login()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
		/// This Post Action Method Is Used To Change Password.
		/// </summary>
		/// <param name="_objChangePassword"></param>
		/// <returns></returns>
		[Authorize]
        [HttpPost, ActionName("ChangePassword")]
        public async Task<ActionResult<string>> ChangePassword(ChangePassword _objChangePassword)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IUserLoginSvc.ChangePassword(_ODBCHelper, _objChangePassword, "ChangePassword"));
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ChangePassword()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
		/// This Post Action Method Is Used To Send Request For Reset Password.
		/// </summary>
		/// <param name="_objForgotPassword"></param>
		/// <returns></returns>
        [HttpPost, ActionName("ForgotPasswordRequest")]
        public async Task<ActionResult<string>> ForgotPasswordRequest(ForgotPassword _objForgotPassword)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IUserLoginSvc.ForgotPassword(_ODBCHelper, webHostEnvironment, _objForgotPassword, _mapper));
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ForgotPasswordRequest()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
		/// This Post Action Method Is Used To Reset Password.
		/// </summary>
		/// <param name="_objResetPassword"></param>
		/// <returns></returns>
        [HttpPost, ActionName("ResetPassword")]
        public async Task<ActionResult<string>> ResetPassword(ResetPassword _objResetPassword)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ChangePassword _objChangePassword = new ChangePassword();
                    _objChangePassword.EmployeeID = _objResetPassword.LoginID;
                    _objChangePassword.NewPassword = _objResetPassword.NewPassword;

                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IUserLoginSvc.ChangePassword(_ODBCHelper, _objChangePassword, "ResetPassword"));
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ResetPassword()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
		/// This Post Action Method Is Used To Change Employee Password.
		/// </summary>
		/// <param name="_objResetPassword"></param>
		/// <returns></returns>
        [Authorize]
        [HttpPost, ActionName("ChangeEmployeePassword")]
        public async Task<ActionResult<string>> ChangeEmployeePassword(ResetPassword _objResetPassword)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ChangePassword _objChangePassword = new ChangePassword();
                    _objChangePassword.EmployeeID = _objResetPassword.LoginID;
                    _objChangePassword.NewPassword = _objResetPassword.NewPassword;

                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IUserLoginSvc.ChangePassword(_ODBCHelper, _objChangePassword, "ChangeEmployeePassword"));
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.ChangeEmployeePassword()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Logout.
        /// </summary>
        /// <param name="objEmployeeLoginCommon"></param>
        /// <returns></returns>
        [HttpPost, ActionName("Logout")]
        public async Task<ActionResult<string>> Logout(EmployeeLoginCommon objEmployeeLoginCommon)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
					ReturnResult = ObjectToJson.ConvertDataSetToJson(await IUserLoginSvc.Logout(objEmployeeLoginCommon.LoginID, _ODBCHelper, _tokenStoreService));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return Unauthorized();
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.Logout()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Get Refresh Token.
        /// </summary>
        /// <param name="objTokenRefreshRequest"></param>
        /// <returns></returns>
        [HttpPost, ActionName("RefreshToken")]
        public async Task<ActionResult<string>> RefreshToken(TokenRefreshRequest objTokenRefreshRequest)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    ReturnResult = ObjectToJson.ConvertDataSetToJson(await IUserLoginSvc.GetRefreshToken(objTokenRefreshRequest, _tokenStoreService, _tokenService));
                    if (ReturnResult == null || ReturnResult == string.Empty)
                    {
                        return Unauthorized();
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.RefreshToken()", ex.Message, false);
                throw;
            }
            return Content(Util.JSONOK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Encrypt Text.
        /// </summary>
        /// <param name="_objEncryptTextRequest"></param>
        /// <returns></returns>
        [HttpPost, ActionName("EncryptText")]
        public async Task<ActionResult<string>> EncryptText(EncryptTextRequest _objEncryptTextRequest)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    if (_objEncryptTextRequest.EncryptDecryptKey == Helper.EncryptDecryptKey)
                    {
                        string EncryptedText = AESEncrytDecry.EncryptAES256(_objEncryptTextRequest.Text, _objEncryptTextRequest.EncryptDecryptKey);
                        string PlainText = _objEncryptTextRequest.Text;
                        var EncryptTextResponse = new EncryptTextResponse { PlainText = PlainText, EncryptedText = EncryptedText };
                        ReturnResult = ObjectToJson.ConvertDataSetToJson(Helper.ConvertClassObjectToDataSet(EncryptTextResponse, "ENCRYPTED_TEXT_RESPONSE"));
                        if (ReturnResult == null || ReturnResult == string.Empty)
                        {
                            return NotFound();
                        }
                    }
                    else
                    {
                        List<string> columns = new List<string> { "ID", "Message" };
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { "0", "Encrypt/Decrypt Key Is In-Valid !!!" }
                        };
                        ReturnResult = ObjectToJson.ConvertDataSetToJson(Helper.GenerateCommonMessage(columns, rows, "ENCRYPTED_TEXT_RESPONSE"));
                        if (ReturnResult == null || ReturnResult == string.Empty)
                        {
                            return NotFound();
                        }
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.EncryptText()", ex.Message, false);
                throw;
            }
            return Content(Util.OK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }

        /// <summary>
        /// This Post Action Method Is Used To Decrypt Text.
        /// </summary>
        /// <param name="_objDecryptTextRequest"></param>
        /// <returns></returns>
        [HttpPost, ActionName("DecryptText")]
        public async Task<ActionResult<string>> DecryptText(DecryptTextRequest _objDecryptTextRequest)
        {
            string ReturnResult = string.Empty;
            try
            {
                if (ModelState.IsValid)
                {
                    if (_objDecryptTextRequest.EncryptDecryptKey == Helper.EncryptDecryptKey)
                    {
                        string DecryptedText = AESEncrytDecry.DecryptAES256(_objDecryptTextRequest.EncryptedText, _objDecryptTextRequest.EncryptDecryptKey);
                        string EncryptedText = _objDecryptTextRequest.EncryptedText;
                        var DecryptTextResponse = new DecryptTextResponse { DecryptedText = DecryptedText, EncryptedText = EncryptedText };
                        ReturnResult = ObjectToJson.ConvertDataSetToJson(Helper.ConvertClassObjectToDataSet(DecryptTextResponse, "DECRYPTED_TEXT_RESPONSE"));
                        if (ReturnResult == null || ReturnResult == string.Empty)
                        {
                            return NotFound();
                        }
                    }
                    else
                    {
                        List<string> columns = new List<string> { "ID", "Message" };
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { "0", "Encrypt/Decrypt Key Is In-Valid !!!" }
                        };
                        ReturnResult = ObjectToJson.ConvertDataSetToJson(Helper.GenerateCommonMessage(columns, rows, "DECRYPTED_TEXT_RESPONSE"));
                        if (ReturnResult == null || ReturnResult == string.Empty)
                        {
                            return NotFound();
                        }
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
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, ControllerLogNamespace, $"{ControllerLogName}.DecryptText()", ex.Message, false);
                throw;
            }
            return Content(Util.OK(ReturnResult), ContentTypeConstants.JSON_CONTENTTYPE);
        }
    }
}
