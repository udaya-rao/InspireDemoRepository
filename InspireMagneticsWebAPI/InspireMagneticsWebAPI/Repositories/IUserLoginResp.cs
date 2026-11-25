using System.Data;
using System.Data.Odbc;
using AutoMapper;
using CommonLib;
using CommonLib.Constants;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;
using InspireMagneticsWebAPI.Service;
using Newtonsoft.Json.Linq;
using SimpleCrypto;

namespace InspireMagneticsWebAPI.Repositories
{
    public class IUserLoginResp : IUserLogin
    {
        private readonly string IUserLoginRespLogClassName = "IUserLoginResp";
        private readonly ICryptoService _cryptoService = new PBKDF2();
        private const int SALT_SIZE = 16;
        private const int HASH_ITERATIONS = 100;

        /// <summary>
        /// This Method Is Used To Get User Login Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="OTPService"></param>
        /// <param name="webHostEnvironment"></param>
        /// <param name="TokenStoreService"></param>
        /// <param name="tokenService"></param>
        /// <param name="objUserLogin"></param>
        /// <returns></returns>
		public async Task<DataSet> GetUserLoginDetails(ODBCHelper _objODBCHelper, IOTP OTPService, IWebHostEnvironment webHostEnvironment, ITokenStoreService TokenStoreService, TokenService tokenService, UserLogin objUserLogin)
        {
            DataTable dt = new DataTable();
            DataSet _ds = new DataSet();
            DataSet finalDataSet = new DataSet();
            List<string> columns = new List<string> { "ID", "Status", "Message" };
            string TableName = "USER_LOGIN_DETAILS";
            try
            {
                _ds = await GetEmployeeDetails(_objODBCHelper, objUserLogin.LoginID, objUserLogin.Password, 0, "CheckEmployeeExist");
                if (_ds != null && _ds.Tables.Count > 0)
                {
                    if (_ds.Tables[0].Rows.Count > 0)
                    {
                        dt = Helper.ConvertDataSetToDataTable(_ds);
                    }
                    if (dt.Rows.Count > 0)
                    {
                        string DBMessage = Convert.ToString(dt.Rows[0]["Message"].ToString());
                        if (DBMessage == Helper.ToProperCase(MessageTypeConstants.Success))
                        {
                            string PasswordSalt = Convert.ToString(dt.Rows[0]["password_salt"].ToString());
                            string DBPassword = Convert.ToString(dt.Rows[0]["empl_encrypted_pwd"].ToString());
                            string strHashPassword = CommonHelper.ComputePasswordWithExistingSalt(objUserLogin.Password, PasswordSalt, _cryptoService).Hash;
                            if (DBPassword == strHashPassword)
                            {
                                Helper.RemoveColumnFromDataTable(dt, "Message");
                                Helper.RemoveColumnFromDataTable(dt, "empl_encrypted_pwd");
                                Helper.RemoveColumnFromDataTable(dt, "empl_encrypted_pwd_2");
                                Helper.RemoveColumnFromDataTable(dt, "empl_encrypted_pwd_3");
                                Helper.RemoveColumnFromDataTable(dt, "password_salt");
                                Helper.RemoveColumnFromDataTable(dt, "password_salt_2");
                                Helper.RemoveColumnFromDataTable(dt, "password_salt_3");

                                string EmployeeName = Convert.ToString(dt.Rows[0]["empl_name"].ToString());
                                string EmployeeEmailID = Convert.ToString(dt.Rows[0]["email_id"].ToString());
                                string strLoginID = Convert.ToString(dt.Rows[0]["login_id"].ToString());

                                Helper.AddNewColumnToDataTable(dt, "rule_ids_array", typeof(object));
                                Helper.AddNewColumnToDataTable(dt, "login_date_time", typeof(string));
                                Helper.AddNewColumnToDataTable(dt, "token_generated_date_time", typeof(string));
                                Helper.AddNewColumnToDataTable(dt, "accessToken", typeof(string));
                                Helper.AddNewColumnToDataTable(dt, "refreshToken", typeof(string));
                                Helper.AddNewColumnToDataTable(dt, "token_expiry_date_time", typeof(string));
                                Helper.AddNewColumnToDataTable(dt, "TokenExpirationInMinutes", typeof(int));
                                Helper.AddNewColumnToDataTable(dt, "RefreshTokenExpiresAt", typeof(int));

                                string accessToken = tokenService.GenerateToken(EmployeeName, objUserLogin.LoginID);
                                var RefreshAccessToken = tokenService.GenerateRefreshToken(EmployeeName, objUserLogin.LoginID);
                                var RefreshToken = tokenService.GetRefreshTokenStore(EmployeeName, objUserLogin.LoginID, RefreshAccessToken);
                                foreach (DataRow row in dt.Rows)
                                {
                                    string ruleIdsStr = row.Field<string>("rule_ids");
                                    int[] ruleIdsArray = ruleIdsStr
                                        .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                                        .Select(int.Parse)
                                        .ToArray();

                                    row["rule_ids_array"] = ruleIdsArray;
                                    row.SetField("login_date_time", DateTimeHelper.ConvertDateTimeStringToSpecificFormat(DateTime.Now.ToString("O"), DateTimeFormatConstants.MMDDYYYY_SLASH_12HSS_DATETIMEFORMAT));
                                    row.SetField("token_generated_date_time", Convert.ToString(DateTime.Now));
                                    row.SetField("accessToken", accessToken);
                                    row.SetField("refreshToken", RefreshAccessToken);
                                    row.SetField("token_expiry_date_time", Convert.ToString(DateTime.Now.AddMinutes(tokenService.GetTokenExpirationInMinutes())));
                                    row.SetField("TokenExpirationInMinutes", tokenService.GetTokenExpirationInMinutes());
                                    row.SetField("RefreshTokenExpiresAt", tokenService.GetRefreshTokenExpirationInDays());
                                }
                                Helper.RemoveColumnFromDataTable(dt, "rule_ids");
                                Helper.RenameDataTableColumnName(dt, "rule_ids_array", "rule_ids");
                                TimeSpan time = TimeSpan.FromMinutes(tokenService.GetTokenExpirationInMinutes());
                                var expirationTime = DateTime.Now.AddHours(time.TotalHours);
                                await TokenStoreService.SaveTokenInfoAsync(Convert.ToString(dt.Rows[0]["empl_name"].ToString()), objUserLogin.LoginID, accessToken, true, expirationTime);
                                TokenStoreService.Save(RefreshToken);
                                finalDataSet = Helper.ConvertDataTableToDataSet(dt.Copy());
                                finalDataSet.Tables[DataSetDataTableConstants.Table].TableName = TableName;
                            }
                            else
                            {
                                List<List<string>> rows = new List<List<string>>
                                {
                                    new List<string> { "0", Helper.ToProperCase(MessageTypeConstants.Error), "Enter The Valid Password !!!" }
                                };
                                finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                            }
                        }
                        else
                        {
                            List<List<string>> rows = new List<List<string>>
                            {
                                new List<string> { "0", Helper.ToProperCase(MessageTypeConstants.Error), "Enter The Valid LoginID and Password !!!" }
                            };
                            finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        }
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { "0", Helper.ToProperCase(MessageTypeConstants.Error), "Enter The Valid LoginID and Password !!!" }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { "0", Helper.ToProperCase(MessageTypeConstants.Error), "Enter The Valid LoginID and Password !!!" }
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IUserLoginRespLogClassName}.GetUserLoginDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Change The Password.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objChangePassword"></param>
        /// <param name="Source"></param>
        /// <returns></returns>
		public async Task<DataSet> ChangePassword(ODBCHelper _objODBCHelper, ChangePassword _objChangePassword, string Source)
        {
            DataSet finalDataSet = new DataSet();
            DataTable dt = new DataTable();
            string TableName = string.Empty;
            try
            {
                var _ds = await GetEmployeeDetails(_objODBCHelper, Convert.ToString(_objChangePassword.EmployeeID), string.Empty, 0, "GetEmployeeDetailsForPasswordChange");
                if (_ds.Tables[0].Rows.Count > 0)
                {
                    dt = Helper.ConvertDataSetToDataTable(_ds);
                }
                if (dt.Rows.Count > 0)
                {
                    int EmployeeID = Convert.ToInt32(dt.Rows[0]["EmployeeID"].ToString());
                    string LoginID = Convert.ToString(dt.Rows[0]["LoginID"].ToString());

                    string CurrentPasswordSalt = Convert.ToString(dt.Rows[0]["PasswordSalt"]);
                    string CurrentPasswordEncrypted = Convert.ToString(dt.Rows[0]["EncryptedPassword"]);

                    string PasswordSalt2 = Convert.ToString(dt.Rows[0]["PasswordSalt2"]);
                    string EncryptedPassword2 = Convert.ToString(dt.Rows[0]["EncryptedPassword2"]);

                    string PasswordSalt3 = Convert.ToString(dt.Rows[0]["PasswordSalt3"]);
                    string EncryptedPassword3 = Convert.ToString(dt.Rows[0]["EncryptedPassword3"]);

                    string OldPlainPassword = string.Empty;
                    string NewPlainPassword = string.Empty;
                    string OldPasswordEncrypted = string.Empty;

                    if (Source == "ChangePassword" || Source == "ChangeEmployeePassword")
                    {
                        OldPlainPassword = _objChangePassword.OldPassword;
                        // Verify Old Plain Password and Encrypt With Current Password Salt For Stored Procedure Check.
                        OldPasswordEncrypted = CommonHelper.ComputePasswordWithExistingSalt(OldPlainPassword, CurrentPasswordSalt, _cryptoService).Hash;
                        TableName = "CHANGE_PASSWORD_RESPONSE";
                    }
                    else
                    {
                        OldPasswordEncrypted = CurrentPasswordEncrypted;
                        TableName = "RESET_PASSWORD_RESPONSE";
                    }
                    NewPlainPassword = _objChangePassword.NewPassword;

                    // Generate New Password Salt and Encrypted which will be as Level 1.
                    string NewPasswordEncryptedWithNewSalt = string.Empty;
                    string NewPasswordSalt = string.Empty;

                    (NewPasswordEncryptedWithNewSalt, NewPasswordSalt) = CommonHelper.GeneratePasswordHash(NewPlainPassword, _cryptoService, SALT_SIZE, HASH_ITERATIONS);

                    // Pre-Compute Comparisons For History Check
                    string NewWithCurrentSalt = CommonHelper.ComputePasswordWithExistingSalt(NewPlainPassword, CurrentPasswordSalt, _cryptoService).Hash;
                    string NewWithPasswordSalt2 = string.IsNullOrEmpty(PasswordSalt2) ? null : CommonHelper.ComputePasswordWithExistingSalt(NewPlainPassword, PasswordSalt2, _cryptoService).Hash;
                    string NewWithPasswordSalt3 = string.IsNullOrEmpty(PasswordSalt3) ? null : CommonHelper.ComputePasswordWithExistingSalt(NewPlainPassword, PasswordSalt3, _cryptoService).Hash;

                    var parameters = new List<(string, OdbcType, object, int?)>
                    {
                        ("LoginID",      OdbcType.NVarChar, LoginID, 100),
                        ("OldPassword", OdbcType.NVarChar, OldPasswordEncrypted, 100),
                        ("NewPassword", OdbcType.NVarChar, NewPasswordEncryptedWithNewSalt, 1000),
                        ("PasswordSalt", OdbcType.NVarChar, NewPasswordSalt, 1000),
                        ("NewPasswordWithCurrentSalt", OdbcType.NVarChar, NewWithCurrentSalt, 1000),
                        ("NewPasswordWithSalt2", OdbcType.NVarChar, (object?)NewWithPasswordSalt2 ?? DBNull.Value, 1000),
                        ("NewPasswordWithSalt3", OdbcType.NVarChar, (object?)NewWithPasswordSalt3 ?? DBNull.Value, 1000),
                        ("ExistingPassword2", OdbcType.NVarChar, EncryptedPassword2, 1000),
                        ("ExistingPasswordSalt2", OdbcType.NVarChar, PasswordSalt2, 1000),
                        ("ExistingPassword3", OdbcType.NVarChar, EncryptedPassword3, 1000),
                        ("ExistingPasswordSalt3", OdbcType.NVarChar, PasswordSalt3, 1000),
                        ("ParamType", OdbcType.NVarChar, "ChangePassword", 100)
                    };
                    
                    finalDataSet = await _objODBCHelper.ExecuteStoredProcedureWithMultipleParameters(StoredProcedure.CHANGE_PASSWORD, parameters);
                    finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IUserLoginRespLogClassName}.ChangePassword()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Send Request For Reset Password.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <param name="_objForgotPassword"></param>
        /// <param name="mapper"></param>
        /// <returns></returns>
		public async Task<DataSet> ForgotPassword(ODBCHelper _objODBCHelper, IWebHostEnvironment _webHostEnvironment, ForgotPassword _objForgotPassword, IMapper mapper)
        {
            DataSet finalDataSet = new DataSet();
            DataTable dt = new DataTable();
            List<string> columns = new List<string> { "LoginID", "Status", "Message" };
            string DBStatus = string.Empty;
            string DBMessage = string.Empty;
            string EmployeeEmailID = string.Empty;
            string TableName = "FORGOT_PASSWORD_RESPONSE";
            try
            {
                var _ds = await GetEmployeeDetails(_objODBCHelper, _objForgotPassword.LoginID, string.Empty, 0, "CheckEmployeeExistByLoginID");
                if (_ds != null && _ds.Tables[0].Rows.Count > 0)
                {
                    dt = Helper.ConvertDataSetToDataTable(_ds);
                    if (dt.Rows.Count > 0)
                    {
                        DBStatus = Convert.ToString(dt.Rows[0]["Status"].ToString());
                        DBMessage = Convert.ToString(dt.Rows[0]["Message"].ToString());
                        if (DBStatus.ToUpper() == MessageTypeConstants.Success)
                        {
                            EmployeeEmailID = Convert.ToString(dt.Rows[0]["email_id"].ToString());
                            if (!string.IsNullOrEmpty(EmployeeEmailID))
                            {
                                var dsUpdateResetPassword = await GetEmployeeDetails(_objODBCHelper, _objForgotPassword.LoginID, string.Empty, Convert.ToInt32(CommonHelper.KeyOption.ResetPasswordLinkExpiryInMinutes), "UpdateResetPasswordRequest");
                                if (dsUpdateResetPassword != null && dsUpdateResetPassword.Tables[0].Rows.Count > 0)
                                {
                                    string DBUpdateStatus = Convert.ToString(dsUpdateResetPassword.Tables[0].Rows[0]["Status"].ToString());
                                    string DBUpdateMessage = Convert.ToString(dsUpdateResetPassword.Tables[0].Rows[0]["Message"].ToString());
                                    if (DBUpdateStatus.ToUpper() == MessageTypeConstants.Success)
                                    {
                                        string EmployeeName = Convert.ToString(dsUpdateResetPassword.Tables[0].Rows[0]["empl_name"].ToString());
                                        string strLoginID = Convert.ToString(dsUpdateResetPassword.Tables[0].Rows[0]["login_id"].ToString());
                                        string PasswordExpiryDateTime = DateTimeHelper.ConvertDateTimeStringToSpecificFormat(Convert.ToString(dsUpdateResetPassword.Tables[0].Rows[0]["password_expiry_date_time"]), DateTimeFormatConstants.DDMMYYYY_SLASH_HHMMSS_DATETIMEFORMAT);

                                        string EmailBodyTemplate = await CommonHelper.ReadHTMLTemplateUsingStreamReaderAsync(_webHostEnvironment, "ResetPasswordEmailTemplate.html");

                                        string LinkURL = CommonHelper.KeyOption.FrontEndBaseURL + "/reset-password?LoginID=" + Helper.EncodeStringToBase64(strLoginID) + "&ResetPasswordLinkInMinutes=" + Helper.EncodeStringToBase64(CommonHelper.KeyOption.ResetPasswordLinkExpiryInMinutes) + "&PasswordExpiryDateTime=" + Helper.EncodeStringToBase64(PasswordExpiryDateTime);
                                        EmailBodyTemplate = EmailBodyTemplate.Replace("#Name#", EmployeeName);
                                        EmailBodyTemplate = EmailBodyTemplate.Replace("#URLLink#", LinkURL);
                                        EmailBodyTemplate = EmailBodyTemplate.Replace("#PasswordLinkExpiryInMinutes#", CommonHelper.KeyOption.ResetPasswordLinkExpiryInMinutes);
                                        EmailBodyTemplate = EmailBodyTemplate.Replace("#CurrentYear#", DateTime.Now.Year.ToString());

                                        string mailSubject = $"Inspire Magnetics - Reset Password Request";
                                        var sendReq = CommonHelper.CreateSendEmailRequestParam(string.Empty, EmployeeEmailID, string.Empty, string.Empty, string.Empty, string.Empty, mailSubject, EmailBodyTemplate);

                                        var EmailReturnResult = CommonHelper.SendEmailAPI(_webHostEnvironment, sendReq, mapper, string.Empty, string.Empty, false, false);
                                        string ReturnResult = ObjectToJson.ConvertDataSetToJson(EmailReturnResult);
                                        JObject jObjectEmail = ApiHelper.GetDataInJObject(Util.OK(ReturnResult));
                                        string resultjObjectEmail = ApiHelper.CheckResByTableName(jObjectEmail, Helper.EMAIL_SENT_RESPONSE_TABLE_NAME, 1);
                                        string EmailSentResponseReturnResult = string.Empty;

                                        if (resultjObjectEmail == "ok")
                                        {
                                            var EmailResponseData = jObjectEmail["data"][Helper.EMAIL_SENT_RESPONSE_TABLE_NAME].ToObject<SendEmailResponseParam[]>();
                                            if (EmailResponseData != null)
                                            {
                                                List<SendEmailResponseParam> lstSendEmailResponse = null;
                                                lstSendEmailResponse = EmailResponseData.ToList();
                                                if (lstSendEmailResponse != null && lstSendEmailResponse.Count > 0)
                                                {
                                                    string Message = lstSendEmailResponse[0].Message;
                                                    if (Message != null && Message == Helper.EmailSuccess)
                                                    {
                                                        DBUpdateMessage = DBUpdateMessage.Replace("!!!", "");
                                                        EmailSentResponseReturnResult = $"Reset Password Link Has Been Sent To Your Email ID !!!";

                                                        List<string> resetpasswordcolumns = new List<string> { "LoginID", "ResetPasswordLinkInMinutes", "ResetPasswordLink", "Status", "Message" };
                                                        List<List<string>> rows = new List<List<string>>
                                                        {
                                                            new List<string> { _objForgotPassword.LoginID, CommonHelper.KeyOption.ResetPasswordLinkExpiryInMinutes, LinkURL, DBUpdateStatus, EmailSentResponseReturnResult }
                                                        };
                                                        finalDataSet = Helper.GenerateCommonMessage(resetpasswordcolumns, rows, TableName);
                                                    }
                                                    else
                                                    {
                                                        EmailSentResponseReturnResult = Helper.Email_Failed;
                                                    }
                                                }
                                                else
                                                {
                                                    EmailSentResponseReturnResult = Helper.Email_Failed;
                                                }
                                            }
                                            else
                                            {
                                                EmailSentResponseReturnResult = Helper.Email_Failed;
                                            }
                                        }
                                        else
                                        {
                                            EmailSentResponseReturnResult = Helper.Email_Failed;
                                        }
                                    }
                                    else
                                    {
                                        List<List<string>> rows = new List<List<string>>
                                        {
                                            new List<string> { _objForgotPassword.LoginID, "Error", "Failed To Reset The Password !!!" }
                                        };
                                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                                    }
                                }
                                else
                                {
                                    List<List<string>> rows = new List<List<string>>
                                    {
                                        new List<string> { _objForgotPassword.LoginID, "Error", "Failed To Reset The Password !!!" }
                                    };
                                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                                }
                            }
                            else
                            {
                                List<List<string>> rows = new List<List<string>>
                                {
                                    new List<string> { _objForgotPassword.LoginID, "Error", "The Email ID is not mapped to your login ID. Please update your email ID in the Employee Master and try again !!!" }
                                };
                                finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                            }
                        }
                        else
                        {
                            List<List<string>> rows = new List<List<string>>
                            {
                                new List<string> { _objForgotPassword.LoginID, DBStatus, DBMessage }
                            };
                            finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                        }
                    }
                    else
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { _objForgotPassword.LoginID, DBStatus, DBMessage }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { _objForgotPassword.LoginID, DBStatus, DBMessage }
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IUserLoginRespLogClassName}.ForgotPassword()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Get Refresh Token.
        /// </summary>
        /// <param name="objTokenRefreshRequest"></param>
        /// <param name="TokenStoreService"></param>
        /// <param name="tokenService"></param>
        /// <returns></returns>
        public async Task<DataSet> GetRefreshToken(TokenRefreshRequest objTokenRefreshRequest, ITokenStoreService TokenStoreService, TokenService tokenService)
        {
            DataTable dt = new DataTable();
            DataSet finalDataSet = new DataSet();
            string TableName = "REFRESH_TOKEN_RESPONSE";
            try
            {
                var token = TokenStoreService.Get(objTokenRefreshRequest.RefreshToken);
                if (token == null)
                {
                    List<string> columns = new List<string> { "Status", "Message" };
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { "Error","Provided Refresh Token Is Invalid or Expired Token !!!" }
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
                else
                {
                    TokenStoreService.Revoke(objTokenRefreshRequest.RefreshToken);
                    string accessToken = tokenService.GenerateToken(token.UserName, token.UserID);
                    var RefreshAccessToken = tokenService.GenerateRefreshToken(token.UserName, token.UserID);
                    var RefreshToken = tokenService.GetRefreshTokenStore(token.UserName, token.UserID, RefreshAccessToken);
                    TokenStoreService.Save(RefreshToken);
                    Helper.AddNewColumnToDataTable(dt, "accessToken", typeof(string));
                    Helper.AddNewColumnToDataTable(dt, "refreshToken", typeof(string));
                    Helper.AddNewColumnToDataTable(dt, "TokenExpirationInMinutes", typeof(int));
                    Helper.AddNewColumnToDataTable(dt, "RefreshTokenExpiresAt", typeof(int));
                    Helper.AddNewColumnToDataTable(dt, "Status", typeof(string));

                    DataRow dr = null;
                    dr = dt.NewRow();
                    dr["accessToken"] = accessToken;
                    dr["refreshToken"] = RefreshAccessToken;
                    dr["TokenExpirationInMinutes"] = tokenService.GetTokenExpirationInMinutes();
                    dr["RefreshTokenExpiresAt"] = tokenService.GetRefreshTokenExpirationInDays();
                    dr["Status"] = Helper.ToProperCase(MessageTypeConstants.Success);
                    dt.Rows.Add(dr);
                    TimeSpan timeSpan = TimeSpan.FromMinutes(tokenService.GetTokenExpirationInMinutes());
                    var expirationTime = DateTime.Now.AddHours(timeSpan.Hours);
                    await TokenStoreService.SaveTokenInfoAsync(token.UserName, token.UserID, accessToken, true, expirationTime);
                    finalDataSet = Helper.ConvertDataTableToDataSet(dt.Copy());
                    finalDataSet.Tables[DataSetDataTableConstants.Table1].TableName = DataSetDataTableConstants.Table;
                    finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IUserLoginRespLogClassName}.GetRefreshToken()", ex.Message, false);
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Logout.
        /// </summary>
        /// <param name="LoginID"></param>
        /// <param name="_objODBCHelper"></param>
        /// <param name="TokenStoreService"></param>
        /// <returns></returns>
        public async Task<DataSet> Logout(string LoginID, ODBCHelper _objODBCHelper, ITokenStoreService TokenStoreService)
        {
            DataSet finalDataSet = new DataSet();
            string TableName = "USER_LOGOUT_RESPONSE";
            try
            {
                List<string> columns = new List<string> { "Id", "Status", "Message" };
                var ds = await GetEmployeeDetails(_objODBCHelper, LoginID, string.Empty, 0, "GetEmployeeDetails");
                if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
                {
                    var TokenDetails = TokenStoreService.GetTokenInfo(LoginID);
                    if (TokenDetails == null)
                    {
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { LoginID, "Error", "Token Is Invalid or Expired Token !!!" }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                    else
                    {
                        await TokenStoreService.DeleteTokenAsync(LoginID);
                        List<List<string>> rows = new List<List<string>>
                        {
                            new List<string> { LoginID, "Success", "You Have Successfully Logged Out !!!" }
                        };
                        finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                    }
                }
                else
                {
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { LoginID, "Error", "Invalid Login ID. Enter The Valid Login ID !!!" }
                    };
                    finalDataSet = Helper.GenerateCommonMessage(columns, rows, TableName);
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IUserLoginRespLogClassName}.Logout()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Get Employee Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="LoginID"></param>
        /// <param name="Password"></param>
        /// <param name="AddNumberOfMinutes"></param>
        /// <param name="Type"></param>
        /// <returns></returns>
        public async Task<DataSet> GetEmployeeDetails(ODBCHelper _objODBCHelper, string LoginID, string Password, int AddNumberOfMinutes, string Type)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                var parameters = new List<(string, OdbcType, object, int?)>
                {
                    ("LoginID",      OdbcType.NVarChar, LoginID, 100),
                    ("LoginPassword", OdbcType.NVarChar, Password, 100),
                    ("NumberofMinutes", OdbcType.Int, AddNumberOfMinutes, 100),
                    ("ParamType", OdbcType.NVarChar, Type, 100)
                };

                finalDataSet = await _objODBCHelper.ExecuteStoredProcedureWithMultipleParameters(StoredProcedure.EMPLOYEE_LOGIN, parameters);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IUserLoginRespLogClassName}.GetEmployeeDetails()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }
    }
}
