using System.Data;
using System.Net.Mail;
using AutoMapper;
using CommonLib;
using CommonLib.Constants;
using CommonLib.Constants.Client;
using InspireMagneticsWebAPI.Models;
using Microsoft.AspNetCore.StaticFiles;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SimpleCrypto;
using static CommonLib.CONST;
using SendEmailRequestParam = InspireMagneticsWebAPI.Models.SendEmailRequestParam;

namespace InspireMagneticsWebAPI.DACHelper
{
    public static class CommonHelper
    {
        /// <summary>
        /// Common Helper Log Namespace
        /// </summary>
        private static readonly string CommonHelperLogClassName = "CommonHelper";

        /// <summary>
        /// File Extension Content Type Provider
        /// </summary>
        private static readonly FileExtensionContentTypeProvider _fileExtensionContentTypeProvider = new();

        /// <summary>
        /// Key Option
        /// </summary>
        public static MyApplicationKeysOptions KeyOption { get; set; } = new MyApplicationKeysOptions();

        static CommonHelper()
        {
            Helper.EncryptDecryptKey = VUSYSSecretKeysConstant.InspireMagneticsEncryptDecryptKey;
            Helper.DefaultValue = VUSYSSecretKeysConstant.InspireMagneticsDefaultKey;
            Helper.AllowCorsURL = new string[] { "http://localhost:5173", "https://im-web.vusys.in:8381", "https://preprod-im-web.vusys.in:8382", "https://erp.inspiremagnetics.com:8080" };
            Helper.AllowAPIURL = new string[] { "https://localhost:44305", "https://im-webapi.vusys.in:8380", "https://preprod-im-webapi.vusys.in:8383", "https://api-erp.inspiremagnetics.com:8081" };
        }

        /// <summary>
        /// This Method Is Used To Check Whether Directory Exists or Not.
        /// </summary>
        /// <param name="webHostEnvironment"></param>
        /// <param name="FolderName"></param>
        /// <returns></returns>
        public static bool CheckDirectoryExists(IWebHostEnvironment webHostEnvironment, string FolderName)
        {
            bool IsExists = false;
            try
            {
                string strPath = Path.Combine(webHostEnvironment.ContentRootPath, FolderName);
                if (!Directory.Exists(strPath))
                {
                    Directory.CreateDirectory(strPath);
                    IsExists = true;
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(KeyOption.APIErrorLog, LogNameSpaceConstants.DACHelperLogNamespace, $"{CommonHelperLogClassName}.CheckDirectoryExists()", ex.Message, false);
                throw;
            }
            return IsExists;
        }

        /// <summary>
        /// This Method Is Used To Get Actual Path.
        /// </summary>
        /// <param name="webHostEnvironment"></param>
        /// <param name="FolderName"></param>
        /// <returns></returns>
        public static string GetActualPath(IWebHostEnvironment webHostEnvironment, string FolderName)
        {
            CheckDirectoryExists(webHostEnvironment, FolderName);
            return Path.Combine(webHostEnvironment.ContentRootPath, FolderName);
        }

        /// <summary>
        /// This Method Is Used To Read HTML Template Async.
        /// </summary>
        /// <param name="webHostEnvironment"></param>
        /// <param name="fileName"></param>
        /// <returns></returns>
        public static async Task<string> ReadHTMLTemplateAsync(IWebHostEnvironment webHostEnvironment, string fileName = "DynamicEmailTemplate.html")
        {
            string templateFolderPath = GetActualPath(webHostEnvironment, "Templates");
            string templateFilePath = Path.Combine(templateFolderPath, fileName);
            return await File.ReadAllTextAsync(templateFilePath);
        }

        /// <summary>
        /// This Method Is Used To Read HTML Template Using StreamReader Async.
        /// </summary>
        /// <param name="webHostEnvironment"></param>
        /// <param name="fileName"></param>
        /// <returns></returns>
        public static async Task<string> ReadHTMLTemplateUsingStreamReaderAsync(IWebHostEnvironment webHostEnvironment, string fileName)
        {
            string templateFolderPath = GetActualPath(webHostEnvironment, "Templates");
            string templateFilePath = Path.Combine(templateFolderPath, fileName);

            using StreamReader rdrEmailBody = new StreamReader(templateFilePath);
            return await rdrEmailBody.ReadToEndAsync();
        }

        /// <summary>
        /// This Method Is Used To Replace HTML Email Template Placeholders.
        /// </summary>
        /// <param name="htmlTemplate"></param>
        /// <param name="mailBody"></param>
        /// <param name="mailSubject"></param>
        /// <returns></returns>
        public static string ReplaceHTMLEmailTemplatePlaceHolder(string htmlTemplate, string mailBody, string mailSubject)
        {
            return htmlTemplate
                .Replace("#EmailBody#", mailBody ?? string.Empty)
                .Replace("#Title#", mailSubject ?? string.Empty)
                .Replace("#CurrentYear#", DateTimeHelper.CurrentYear());
        }

        /// <summary>
        /// This Method Is Used To Create Send Email Request Parameters.
        /// </summary>
        /// <param name="FromDisplayName"></param>
        /// <param name="ToEmail"></param>
        /// <param name="CCEmail"></param>
        /// <param name="BCCEmail"></param>
        /// <param name="ReplyToEmails"></param>
        /// <param name="ReplyToDisplayNames"></param>
        /// <param name="EmailSubject"></param>
        /// <param name="EmailBody"></param>
        /// <returns></returns>
        public static SendEmailRequestParam CreateSendEmailRequestParam(string FromDisplayName, string ToEmail, string CCEmail, string BCCEmail, string ReplyToEmails, string ReplyToDisplayNames, string EmailSubject, string EmailBody)
        {
            return new SendEmailRequestParam
            {
                FromDisplayName = FromDisplayName,
                ToEmail = ToEmail,
                CCEmail = CCEmail,
                BCCEmail = BCCEmail,
                ReplyToEmails = ReplyToEmails,
                ReplyToDisplayNames = ReplyToDisplayNames,
                EmailSubject = EmailSubject,
                EmailBody = EmailBody
            };
        }

        /// <summary>
        /// This Method is Used To Sanitize File Name.
        /// </summary>
        /// <param name="name"></param>
        /// <returns></returns>
        public static string SanitizeFileName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "file";
            var sb = new System.Text.StringBuilder(name.Length);
            foreach (var ch in name)
            {
                if (char.IsLetterOrDigit(ch) || ch == '-' || ch == '_') sb.Append(ch);
                else sb.Append('_');
            }
            var cleaned = sb.ToString().Trim('_');
            return string.IsNullOrEmpty(cleaned) ? "file" : cleaned;
        }

        /// <summary>
        /// This Method Is Used To Get File Content Type.
        /// </summary>
        /// <param name="fileName"></param>
        /// <returns></returns>
        public static string GetFileContentType(string fileName)
        {
            if (!_fileExtensionContentTypeProvider.TryGetContentType(fileName, out var contentType))
            {
                // Fallback if not recognized
                contentType = ContentTypeConstants.BINARY_CONTENTTYPE;
            }
            return contentType;
        }

        /// <summary>
        /// This Method Is Used To Generate Password Hash.
        /// </summary>
        /// <param name="PlainPassword"></param>
        /// <param name="CryptoService"></param>
        /// <param name="SaltSize"></param>
        /// <param name="HashIterations"></param>
        /// <returns></returns>
        public static (string Hash, string Salt) GeneratePasswordHash(string PlainPassword, ICryptoService CryptoService, int SaltSize, int HashIterations)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(PlainPassword))
                    return (null, null);

                var hash = CryptoService.Compute(PlainPassword, SaltSize, HashIterations);
                var salt = CryptoService.Salt;

                return (hash, salt);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(KeyOption.APIErrorLog, LogNameSpaceConstants.DACHelperLogNamespace, $"{CommonHelperLogClassName}.GeneratePasswordHash()", ex.Message, false);
                return (null, null);
            }
        }

        /// <summary>
        /// This Method Is Used To Compute Password With Existing Salt.
        /// </summary>
        /// <param name="PlainPassword"></param>
        /// <param name="PasswordSalt"></param>
        /// <param name="CryptoService"></param>
        /// <returns></returns>
        public static (string Hash, string Salt) ComputePasswordWithExistingSalt(string PlainPassword, string PasswordSalt, ICryptoService CryptoService)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(PlainPassword) || string.IsNullOrWhiteSpace(PasswordSalt))
                    return (null, PasswordSalt);

                var hash = CryptoService.Compute(PlainPassword, PasswordSalt);
                return (hash, PasswordSalt);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(KeyOption.APIErrorLog, LogNameSpaceConstants.DACHelperLogNamespace, $"{CommonHelperLogClassName}.ComputePasswordWithExistingSalt()", ex.Message, false);
                return (null, PasswordSalt);
            }
        }

        /// <summary>
        /// This Method Is Used To Save Save File To Folder.
        /// </summary>
        /// <param name="fileBase64"></param>
        /// <param name="fileType"></param>
        /// <param name="webHostEnvironment"></param>
        /// <returns></returns>
        public static string SaveFileToFolder(string fileBase64, FileTypes fileType, IWebHostEnvironment webHostEnvironment)
        {
            string ReturnFullPath = string.Empty;
            try
            {
                string tempFolderPath = GetActualPath(webHostEnvironment, "TempPDFFiles");
                string extension = FileHelper.GetFileExtension(fileType);
                string fileName = $"Merged_{DateTime.Now.ToString(DateTimeFormatConstants.YYYYMMDD_HHMMSS_COMPACT_DATETIMEFORMAT)}{extension}";
                var fullPath = tempFolderPath + "\\" + fileName;
                var bytes = Convert.FromBase64String(Helper.CleanBase64(fileBase64));
                File.WriteAllBytes(fullPath, bytes);
                ReturnFullPath = fullPath;
            }
            catch (Exception ex)
            {
                ReturnFullPath = string.Empty;
                Helper.LogMessage(KeyOption.APIErrorLog, LogNameSpaceConstants.DACHelperLogNamespace, $"{CommonHelperLogClassName}.SaveFileToFolder()", ex.Message, false);
                throw;
            }
            return ReturnFullPath;
        }


        #region [Send Email]

        /// <summary>
        /// This Method Is Used To Send an Email.
        /// </summary>
        /// <param name="webHostEnvironment"></param>
        /// <param name="objSendEmailRequestParam"></param>
        /// <param name="mapper"></param>
        /// <param name="FolderPath"></param>
        /// <param name="FileName"></param>
        /// <param name="IsMultipleFiles"></param>
        /// <param name="HasAttachment"></param>
        /// <returns></returns>
        public static DataSet SendEmailAPI(IWebHostEnvironment webHostEnvironment, SendEmailRequestParam objSendEmailRequestParam, IMapper mapper, string FolderPath, string FileName, bool IsMultipleFiles, bool HasAttachment)
        {
            string FromEmailID = string.Empty;
            string Password = string.Empty;
            string SmtpHost = string.Empty;
            string PortNo = string.Empty;
            string DisplayName = string.Empty;
            DataSet finalDataSet = new DataSet();
            bool IsEmailSent = false;
            try
            {
                List<ConfigureEmail> lstConfigureEmail =new List<ConfigureEmail>();
                lstConfigureEmail = GetEmailConfigurationList(webHostEnvironment);

                if (lstConfigureEmail.Count > 0)
                {
                    FromEmailID = lstConfigureEmail[0].FromEmailID;
                    Password = lstConfigureEmail[0].Password;
                    SmtpHost = lstConfigureEmail[0].SmtpHost;
                    PortNo = lstConfigureEmail[0].PortNo;
                    DisplayName = lstConfigureEmail[0].DisplayName;
                    if (!string.IsNullOrWhiteSpace(objSendEmailRequestParam.FromDisplayName))
                    {
                        DisplayName = objSendEmailRequestParam.FromDisplayName;
                    }
                    objSendEmailRequestParam.FromDisplayName = DisplayName;
                    objSendEmailRequestParam.FromEmailID = FromEmailID;
                    objSendEmailRequestParam.Password = Password;
                    objSendEmailRequestParam.SmtpHost = SmtpHost;
                    objSendEmailRequestParam.PortNo = PortNo;
                    objSendEmailRequestParam.FolderPath = FolderPath;
                    objSendEmailRequestParam.FileName = FileName;
                    objSendEmailRequestParam.IsMultipleFiles = IsMultipleFiles;
                    objSendEmailRequestParam.HasAttachment = HasAttachment;

                    CommonLib.SendEmailRequestParam objCommonLibSendEmailRequestParam = mapper.Map<CommonLib.SendEmailRequestParam>(objSendEmailRequestParam);
                    IsEmailSent = Helper.SendEmail(objCommonLibSendEmailRequestParam);
                    List<SendEmailResponseParam> lstSendEmailResponseParam = new List<SendEmailResponseParam>();
                    if (IsEmailSent == true)
                    {
                        lstSendEmailResponseParam.Add(new SendEmailResponseParam { EmailSent = true, Message = Helper.EmailSuccess });
                    }
                    else
                    {
                        lstSendEmailResponseParam.Add(new SendEmailResponseParam { EmailSent = false, Message = Helper.EmailFailed });
                    }
                    var dt1 = Helper.ConvertListToDataTable(lstSendEmailResponseParam);
                    if (dt1.Rows.Count > 0)
                    {
                        finalDataSet = Helper.ConvertDataTableToDataSet(dt1);
                        finalDataSet.Tables[0].TableName = Helper.EMAIL_SENT_RESPONSE_TABLE_NAME;
                    }
                }
            }
            catch (Exception ex)
            {
                finalDataSet = null;
                Helper.LogMessage(KeyOption.APIErrorLog,"InspireMagneticsWebAPI.DACHelper", $"{CommonHelperLogClassName}.SendEmailAPI()", ex.Message, false);
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method Is Used To Send an Email With Multiple Attachments.
        /// </summary>
        /// <param name="webHostEnvironment"></param>
        /// <param name="objSendEmailRequestParam"></param>
        /// <param name="mapper"></param>
        /// <param name="attachments"></param>
        /// <returns></returns>
        public static DataSet SendEmailAPIWithMultipleAttachments(IWebHostEnvironment webHostEnvironment, SendEmailRequestParam objSendEmailRequestParam, IMapper mapper, IEnumerable<Attachment>? attachments)
        {
            string FromEmailID = string.Empty;
            string Password = string.Empty;
            string SmtpHost = string.Empty;
            string PortNo = string.Empty;
            string DisplayName = string.Empty;
            DataSet finalDataSet = new DataSet();
            bool IsEmailSent = false;
            CommonLib.SendEmailRequestParam objCommonLibSendEmailRequestParam = mapper.Map<CommonLib.SendEmailRequestParam>(objSendEmailRequestParam);
            try
            {
                List<ConfigureEmail> lstConfigureEmail = new List<ConfigureEmail>();
                lstConfigureEmail = GetEmailConfigurationList(webHostEnvironment);
                if (lstConfigureEmail.Count > 0)
                {
                    FromEmailID = lstConfigureEmail[0].FromEmailID;
                    Password = lstConfigureEmail[0].Password;
                    SmtpHost = lstConfigureEmail[0].SmtpHost;
                    PortNo = lstConfigureEmail[0].PortNo;
                    DisplayName = lstConfigureEmail[0].DisplayName;
                    if (!string.IsNullOrWhiteSpace(objSendEmailRequestParam.FromDisplayName))
                    {
                        DisplayName = objSendEmailRequestParam.FromDisplayName;
                    }

                    objSendEmailRequestParam.FromDisplayName = DisplayName;
                    objSendEmailRequestParam.FromEmailID = FromEmailID;
                    objSendEmailRequestParam.Password = Password;
                    objSendEmailRequestParam.SmtpHost = SmtpHost;
                    objSendEmailRequestParam.PortNo = PortNo;
                    objSendEmailRequestParam.attachments = attachments;

                    objCommonLibSendEmailRequestParam.FromDisplayName = objSendEmailRequestParam.FromDisplayName;
                    objCommonLibSendEmailRequestParam.ToEmail = objSendEmailRequestParam.ToEmail;
                    objCommonLibSendEmailRequestParam.CCEmail = objSendEmailRequestParam.CCEmail;
                    objCommonLibSendEmailRequestParam.BCCEmail = objSendEmailRequestParam.BCCEmail;
                    objCommonLibSendEmailRequestParam.EmailSubject = objSendEmailRequestParam.EmailSubject;
                    objCommonLibSendEmailRequestParam.EmailBody = objSendEmailRequestParam.EmailBody;
                    objCommonLibSendEmailRequestParam.FromEmailID = objSendEmailRequestParam.FromEmailID;
                    objCommonLibSendEmailRequestParam.Password = objSendEmailRequestParam.Password;
                    objCommonLibSendEmailRequestParam.SmtpHost = objSendEmailRequestParam.SmtpHost;
                    objCommonLibSendEmailRequestParam.PortNo = objSendEmailRequestParam.PortNo;
                    objCommonLibSendEmailRequestParam.attachments = objSendEmailRequestParam.attachments;
                    IsEmailSent = Helper.SendEmailWithMultipleAttachments(objCommonLibSendEmailRequestParam);
                    List<SendEmailResponseParam> lstSendEmailResponseParam = new List<SendEmailResponseParam>();
                    if (IsEmailSent == true)
                    {
                        lstSendEmailResponseParam.Add(new SendEmailResponseParam { EmailSent = true, Message = Helper.EmailSuccess });
                    }
                    else
                    {
                        lstSendEmailResponseParam.Add(new SendEmailResponseParam { EmailSent = false, Message = Helper.EmailFailed });
                    }
                    var dt1 = Helper.ConvertListToDataTable(lstSendEmailResponseParam);
                    if (dt1.Rows.Count > 0)
                    {
                        finalDataSet = Helper.ConvertDataTableToDataSet(dt1);
                        finalDataSet.Tables[0].TableName = Helper.EMAIL_SENT_RESPONSE_TABLE_NAME;
                    }
                }
            }
            catch (Exception ex)
            {
                finalDataSet = null;
                Helper.LogMessage(KeyOption.APIErrorLog, "InspireMagneticsWebAPI.DACHelper", $"{CommonHelperLogClassName}.SendEmailAPIWithMultipleAttachments()", ex.Message, false);
            }
            return finalDataSet;
        }

        #endregion [Send Email]

        #region [Read Configuration Files]

        /// <summary>
        /// This Method is Used to Get Email Configuration List.
        /// </summary>
        /// <param name="webHostEnvironment"></param>
        /// <returns></returns>
        public static List<ConfigureEmail> GetEmailConfigurationList(IWebHostEnvironment webHostEnvironment)
        {
            List<ConfigureEmail> lstConfigureEmail = new List<ConfigureEmail>();
            try
            {
                string ConfigurationFilesFolderPath = GetActualPath(webHostEnvironment, "ConfigurationFiles");
                string ConfigurationFilesPath = ConfigurationFilesFolderPath + "\\EmailConfiguration.json";

                //get the Json filepath
                if (File.Exists(ConfigurationFilesPath))
                {
                    //deserialize JSON from file
                    string JsonData = File.ReadAllText(ConfigurationFilesPath);
                    JObject objJsonResponseResult = JObject.Parse(JsonData);
                    string strEmailConfigurationDetails = string.Join(",", objJsonResponseResult["EmailConfigurationDetails"]);
                    if (strEmailConfigurationDetails != null && strEmailConfigurationDetails != "")
                    {
                        string strEmailConfigurationDetailsJsonResult = "[" + strEmailConfigurationDetails + "]";
                        if (strEmailConfigurationDetailsJsonResult != null && strEmailConfigurationDetailsJsonResult != "")
                        {
                            List<ConfigureEmail> lstEmailConfiguration = JsonConvert.DeserializeObject<List<ConfigureEmail>>(strEmailConfigurationDetailsJsonResult);
                            if (lstEmailConfiguration.Count > 0)
                            {
                                lstConfigureEmail = lstEmailConfiguration;
                            }
                            else
                            {
                                lstConfigureEmail = null;
                            }
                        }
                        else
                        {
                            lstConfigureEmail = null;
                        }
                    }
                    else
                    {
                        lstConfigureEmail = null;
                    }
                }
            }
            catch (Exception ex)
            {
                lstConfigureEmail = null;
                Helper.LogMessage(KeyOption.APIErrorLog, LogNameSpaceConstants.DACHelperLogNamespace, $"{CommonHelperLogClassName}.GetEmailConfigurationList()", ex.Message, false);
            }
            return lstConfigureEmail;
        }

        /// <summary>
        /// This Method is Used to Get IM Folder Configuration Details.
        /// </summary>
        /// <param name="webHostEnvironment"></param>
        /// <param name="Source"></param>
        /// <returns></returns>
        public static IMFolderConfig GetIMFolderConfigurationDetails(IWebHostEnvironment webHostEnvironment, string Source)
        {
            IMFolderConfig folderDetails = null;
            try
            {
                string configurationFilesFolderPath = GetActualPath(webHostEnvironment, "ConfigurationFiles");
                string configurationFilesPath = configurationFilesFolderPath + "\\IMFolderConfiguration.json";

                if (File.Exists(configurationFilesPath))
                {
                    // Read and parse JSON
                    string jsonData = File.ReadAllText(configurationFilesPath);
                    JObject objJsonResponseResult = JObject.Parse(jsonData);
                    string strFolderDetails = string.Join(",", objJsonResponseResult["IMFolders"]);

                    if (!string.IsNullOrWhiteSpace(strFolderDetails))
                    {
                        string strFolderDetailsJson = "[" + strFolderDetails + "]";
                        if (!string.IsNullOrWhiteSpace(strFolderDetailsJson))
                        {
                            List<IMFolderConfig> lstIMFolders = JsonConvert.DeserializeObject<List<IMFolderConfig>>(strFolderDetailsJson);

                            if (lstIMFolders != null && lstIMFolders.Count > 0)
                            {
                                folderDetails = lstIMFolders.FirstOrDefault(f => f.Source.Equals(Source, StringComparison.OrdinalIgnoreCase));
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                folderDetails = null;
                Helper.LogMessage(KeyOption.APIErrorLog, "InspireMagneticsWebAPI.DACHelper", $"{CommonHelperLogClassName}.GetPEPLFolderConfigurationDetails()", ex.Message, false);
            }
            return folderDetails;
        }

        /// <summary>
        /// This Method is Used to Get Folder Path Details.
        /// </summary>
        /// <param name="webHostEnvironment"></param>
        /// <param name="Source"></param>
        /// <returns></returns>
        public static string GetFolderUploadPathDetails(IWebHostEnvironment webHostEnvironment, string Source)
        {
            string FolderPath = string.Empty;
            try
            {
                string configurationFilesFolderPath = GetActualPath(webHostEnvironment, "ConfigurationFiles");
                string configurationFilesPath = configurationFilesFolderPath + "\\IMFolderConfiguration.json";

                if (File.Exists(configurationFilesPath))
                {
                    // Read and parse JSON
                    string jsonData = File.ReadAllText(configurationFilesPath);
                    JObject objJsonResponseResult = JObject.Parse(jsonData);
                    string strFolderDetails = string.Join(",", objJsonResponseResult["IMFolders"]);

                    if (!string.IsNullOrWhiteSpace(strFolderDetails))
                    {
                        string strFolderDetailsJson = "[" + strFolderDetails + "]";
                        if (!string.IsNullOrWhiteSpace(strFolderDetailsJson))
                        {
                            List<IMFolderConfig> lstIMFolders = JsonConvert.DeserializeObject<List<IMFolderConfig>>(strFolderDetailsJson);

                            if (lstIMFolders != null && lstIMFolders.Count > 0)
                            {
                                IMFolderConfig folderDetails = lstIMFolders.FirstOrDefault(f => f.Source.Equals(Source, StringComparison.OrdinalIgnoreCase));
                                FolderPath = folderDetails.FileUploadPath;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                FolderPath = string.Empty;
                Helper.LogMessage(KeyOption.APIErrorLog, "InspireMagneticsWebAPI.DACHelper", $"{CommonHelperLogClassName}.GetFolderUploadPathDetails()", ex.Message, false);
            }
            return FolderPath;
        }

        #endregion [Read Configuration Files]
    }
}
