using System.Data;
using System.Data.Odbc;
using AutoMapper;
using CommonLib;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;
using Newtonsoft.Json.Linq;

namespace InspireMagneticsWebAPI.Repositories
{
    public class IOTPResp : IOTP
    {
        private readonly string IOTPRespLogClassName = "IOTPResp";

        #region [OTP]

        /// <summary>
        /// This Method Is Used To Generate OTP.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOTP"></param>
        /// <param name="webHostEnvironment"></param>
        /// <param name="mapper"></param>
        /// <returns></returns>
        public async Task<DataSet> GenerateOTP(ODBCHelper _objODBCHelper, OTP _objOTP, IWebHostEnvironment webHostEnvironment, IMapper mapper)
        {
            DataSet finalDataSet = new DataSet();
            DataTable dt = new DataTable();
            DataSet _ds = new DataSet();
            try
            {
                _ds = await ManageOTP(_objODBCHelper, _objOTP);
                if (_ds.Tables[0].Rows.Count > 0)
                {
                    dt = await SendOTPEmail(_ds, webHostEnvironment, mapper);
                    finalDataSet = Helper.ConvertDataTableToDataSet(dt.Copy());
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IOTPRespLogClassName}.GenerateOTP()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Validate OTP.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOTP"></param>
        /// <returns></returns>
        public async Task<DataSet> ValidateOTP(ODBCHelper _objODBCHelper, OTP _objOTP)
        {
            DataSet finalDataSet = new DataSet();
            try
            {
                finalDataSet = await ManageOTP(_objODBCHelper, _objOTP);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IOTPRespLogClassName}.ValidateOTP()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Resend OTP.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOTP"></param>
        /// <param name="webHostEnvironment"></param>
        /// <param name="mapper"></param>
        /// <returns></returns>
        public async Task<DataSet> ResendOTP(ODBCHelper _objODBCHelper, OTP _objOTP, IWebHostEnvironment webHostEnvironment, IMapper mapper)
        {
            DataSet finalDataSet = new DataSet();
            DataTable dt = new DataTable();
            DataSet _ds = new DataSet();
            try
            {
                _ds = await ManageOTP(_objODBCHelper, _objOTP);
                if (_ds.Tables[0].Rows.Count > 0)
                {
                    dt = await SendOTPEmail(_ds, webHostEnvironment, mapper);
                    finalDataSet = Helper.ConvertDataTableToDataSet(dt.Copy());
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IOTPRespLogClassName}.ResendOTP()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Manage OTP.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOTP"></param>
        /// <returns></returns>
        public async Task<DataSet> ManageOTP(ODBCHelper _objODBCHelper, OTP _objOTP)
        {
            DataSet finalDataSet = new DataSet();
            DataTable dt = new DataTable();
            try
            {
                string TABLENAME = string.Empty;
                switch (_objOTP.ParamType)
                {
                    case "GenerateOTP":
                        TABLENAME = "GENERATE_OTP_RESPONSE";
                        break;
                    case "ValidateOTP":
                        TABLENAME = "VALIDATE_OTP_RESPONSE";
                        break;
                    case "ResendOTP":
                        TABLENAME = "RESEND_OTP_RESPONSE";
                        break;
                    default:
                        TABLENAME = "GENERATE_OTP_RESPONSE";
                        break;
                }
                var parameters = new List<(string, OdbcType, object, int?)>
                {
                    ("LoginID",      OdbcType.NVarChar, _objOTP.LoginID, 100),
                    ("OTP", OdbcType.NVarChar, _objOTP.OTPNumber, 100),
                    ("ParamType", OdbcType.NVarChar, _objOTP.ParamType, 100)
                };
                finalDataSet = await _objODBCHelper.ExecuteStoredProcedureWithMultipleParameters(StoredProcedure.OTP, parameters);
                finalDataSet = Helper.CheckAndValidateDatasetTable(finalDataSet, TABLENAME);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IOTPRespLogClassName}.ManageOTP()", ex.Message, false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Send an OTP to Email ID.
        /// </summary>
        /// <param name="ds"></param>
        /// <param name="webHostEnvironment"></param>
        /// <param name="mapper"></param>
        /// <returns></returns>
        public async Task<DataTable> SendOTPEmail(DataSet ds, IWebHostEnvironment webHostEnvironment, IMapper mapper)
        {
            DataTable dt = new DataTable();
            try
            {
                dt = Helper.ConvertDataSetToDataTable(ds);
                if (dt.Rows.Count > 0)
                {
                    string DBStatus = Convert.ToString(dt.Rows[0]["Status"].ToString());
                    if (DBStatus == "Success")
                    {
                        string EmailID = Convert.ToString(dt.Rows[0]["EmailID"].ToString());
                        string EmployeeName = Convert.ToString(dt.Rows[0]["EmployeeName"].ToString());
                        string Message = Convert.ToString(dt.Rows[0]["Message"].ToString());
                        string GeneratedOTP = Convert.ToString(dt.Rows[0]["OTP"].ToString());

                        string EmailBodyTemplate = await CommonHelper.ReadHTMLTemplateUsingStreamReaderAsync(webHostEnvironment, "OTPEmailTemplate.html");
                        EmailBodyTemplate = EmailBodyTemplate.Replace("#Name#", EmployeeName);
                        EmailBodyTemplate = EmailBodyTemplate.Replace("#OTP#", GeneratedOTP);
                        EmailBodyTemplate = EmailBodyTemplate.Replace("#CurrentYear#", DateTime.Now.Year.ToString());

                        string mailSubject = GeneratedOTP + " - OTP for Inspire Magnetics login";
                        var sendReq = CommonHelper.CreateSendEmailRequestParam(string.Empty, EmailID, string.Empty, string.Empty, string.Empty, string.Empty, mailSubject, EmailBodyTemplate);
                        var EmailReturnResult = CommonHelper.SendEmailAPI(webHostEnvironment, sendReq, mapper, string.Empty, string.Empty, false, false);
                        string ReturnResult = ObjectToJson.ConvertDataSetToJson(EmailReturnResult);
                        JObject jObjectEmail = ApiHelper.GetDataInJObject(Util.OK(ReturnResult));
                        string resultjObjectEmail = ApiHelper.CheckResByTableName(jObjectEmail, Helper.EMAIL_SENT_RESPONSE_TABLE_NAME, 1);
                        if (resultjObjectEmail == "ok")
                        {
                            var EmailResponseData = jObjectEmail["data"][Helper.EMAIL_SENT_RESPONSE_TABLE_NAME].ToObject<SendEmailResponseParam[]>();
                            if (EmailResponseData != null)
                            {
                                List<SendEmailResponseParam> lstSendEmailResponse = null;
                                lstSendEmailResponse = EmailResponseData.ToList();
                                if (lstSendEmailResponse != null && lstSendEmailResponse.Count > 0)
                                {
                                    string EmailResponseMessage = lstSendEmailResponse[0].Message;
                                    if (EmailResponseMessage != null && EmailResponseMessage == Helper.EmailSuccess)
                                    {
                                        EmailResponseMessage = string.Empty;
                                        Message = Message.Replace("!!!", "");
                                        EmailResponseMessage = Message + "" + "and Sent To Your Email ID !!!";
                                        Message = EmailResponseMessage;
                                    }
                                    else
                                    {
                                        EmailResponseMessage = string.Empty;
                                        Message = Message.Replace("!!!", "");
                                        EmailResponseMessage = Message + " " + "and Failed To Send To Your Email ID !!!";
                                        Message = EmailResponseMessage;
                                    }
                                    foreach (DataRow row in dt.Rows)
                                    {
                                        row.SetField("Message", Message);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IOTPRespLogClassName}.SendOTPEmail()", ex.Message, false);
                throw;
            }
            return dt;
        }

        #endregion [OTP]

    }
}
