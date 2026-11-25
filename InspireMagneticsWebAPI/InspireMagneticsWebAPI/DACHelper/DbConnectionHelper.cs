using CommonLib;
using Newtonsoft.Json;
using InspireMagneticsWebAPI.Models;
namespace InspireMagneticsWebAPI.DACHelper
{
    public static class DbConnectionHelper
    {
        /// <summary>
        /// Db Connection Helper Log Namespace
        /// </summary>
        private static readonly string DbConnectionHelperLogClassName = "DbConnectionHelper";

        /// <summary>
        /// This Method Is Used To Get DB Decrypted Connection String.
        /// </summary>
        /// <param name="EncryptedConnectionString"></param>
        /// <returns></returns>
        public static string GetDBDecryptedConnectionString(string EncryptedConnectionString)
        {
            string ReturnDBConnectionString = string.Empty;
            try
            {
                var parts = EncryptedConnectionString.Split(';', StringSplitOptions.RemoveEmptyEntries);
                var dict = parts
                    .Select(p => p.Split('=', 2))
                    .Where(p => p.Length == 2)
                    .ToDictionary(p => p[0].Trim(), p => p[1].Trim());


                string Driver = dict.GetValueOrDefault("Driver");
                string CPOOL = dict.GetValueOrDefault("CPOOL");
                string CPTO = dict.GetValueOrDefault("CPTO");
                string MC = dict.GetValueOrDefault("MC");

                // Extract specific keys
                string EncryptedUid = dict.GetValueOrDefault("Uid");
                string EncryptedPwd = dict.GetValueOrDefault("Pwd");
                string EncryptedServer = dict.GetValueOrDefault("Server");
                string EncryptedHost = dict.GetValueOrDefault("Host");
                string EncryptedDatabase = dict.GetValueOrDefault("Database");

                // Decrypting the Values
                string DecryptedUid = AESEncrytDecry.DecryptAES256(EncryptedUid, Helper.EncryptDecryptKey);
                string DecryptedPwd = AESEncrytDecry.DecryptAES256(EncryptedPwd, Helper.EncryptDecryptKey);
                string DecryptedServer = AESEncrytDecry.DecryptAES256(EncryptedServer, Helper.EncryptDecryptKey);
                string DecryptedHost = AESEncrytDecry.DecryptAES256(EncryptedHost, Helper.EncryptDecryptKey);
                string DecryptedDatabase = AESEncrytDecry.DecryptAES256(EncryptedDatabase, Helper.EncryptDecryptKey);

                ReturnDBConnectionString = $"Driver={Driver};Uid={DecryptedUid};Pwd={DecryptedPwd};Server={DecryptedServer}; Host={DecryptedHost}; Database={DecryptedDatabase}; CPOOL={CPOOL}; CPTO={CPTO}; MC={MC};";
            }
            catch (Exception ex)
            {
                ReturnDBConnectionString = string.Empty;
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.DACHelperLogNamespace, $"{DbConnectionHelperLogClassName}.GetDBDecryptedConnectionString()", ex.Message, false);
            }
            return ReturnDBConnectionString;
        }

        /// <summary>
        /// This Method Is Used To Get DB Connection Details.
        /// </summary>
        /// <param name="DBName"></param>
        /// <param name="webHostEnvironment"></param>
        /// <returns></returns>
        public static string GetDBConnectionString(string DBName, IWebHostEnvironment webHostEnvironment)
        {
            string ReturnDBConnectionString = string.Empty;
            try
            {
                if (!string.IsNullOrEmpty(DBName))
                {
                    var ConnectionDetails = GetConnectionStringsList(webHostEnvironment);
                    if (ConnectionDetails != null && ConnectionDetails.Count > 0)
                    {
                        var CurrentSelectedConnection = ConnectionDetails.Where(x => x.Environment == DBName).ToList();

                        var CurrentDBConnection = CurrentSelectedConnection[0].Connections[CommonHelper.KeyOption.ConnectionStringKey];
                        ReturnDBConnectionString = GetDBDecryptedConnectionString(CurrentDBConnection);
                    }
                }
            }
            catch (Exception ex)
            {
                ReturnDBConnectionString = string.Empty;
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.DACHelperLogNamespace, $"{DbConnectionHelperLogClassName}.GetDBConnectionString()", ex.Message, false);
            }
            return ReturnDBConnectionString;
        }

        /// <summary>
        /// This Method Is Used To Get Connection String List.
        /// </summary>
        /// <param name="webHostEnvironment"></param>
        /// <returns></returns>
        public static List<ConfigureConnectionStrings> GetConnectionStringsList(IWebHostEnvironment webHostEnvironment)
        {
            List<ConfigureConnectionStrings> lstConnectionStrings = new List<ConfigureConnectionStrings>();
            try
            {
                string configurationFilesFolderPath = CommonHelper.GetActualPath(webHostEnvironment, "ConfigurationFiles");
                string configurationFilesPath = Path.Combine(configurationFilesFolderPath, "DBConnectionConfiguration.json");

                if (File.Exists(configurationFilesPath))
                {
                    // read json
                    string jsonData = File.ReadAllText(configurationFilesPath);

                    // deserialize directly into root object
                    ConnectionStringsRoot rootObj = JsonConvert.DeserializeObject<ConnectionStringsRoot>(jsonData);

                    if (rootObj?.ConnectionStrings != null && rootObj.ConnectionStrings.Count > 0)
                    {
                        lstConnectionStrings = rootObj.ConnectionStrings;
                    }
                    else
                    {
                        lstConnectionStrings = null;
                    }
                }
            }
            catch (Exception ex)
            {
                lstConnectionStrings = null;
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.DACHelperLogNamespace, $"{DbConnectionHelperLogClassName}.GetConnectionStringsList()", ex.Message, false);
            }
            return lstConnectionStrings;
        }
    }
}
