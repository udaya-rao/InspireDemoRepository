namespace InspireMagneticsWebAPI
{
    /// <summary>
    /// My Application Keys Options
    /// </summary>
    public class MyApplicationKeysOptions
    {
        /// <summary>
        /// API Error Log
        /// </summary>
        public string? APIErrorLog { get; set; }

        /// <summary>
        /// Request Logging Enabled
        /// </summary>
        public string RequestLoggingEnabled { get; set; }

        /// <summary>
        /// Global Error Logging Enabled
        /// </summary>
        public string GlobalErrorLoggingEnabled { get; set; }

        /// <summary>
        /// API Global Error Log
        /// </summary>
        public string APIGlobalErrorLog { get; set; }

        /// <summary>
        /// Database WarmUp Log
        /// </summary>
        public string DataBaseWarmUpLog { get; set; }

        /// <summary>
        /// Is Database WarmUp Log Enabled
        /// </summary>
        public string IsDataBaseWarmUpLogEnabled { get; set; }

        /// <summary>
        /// DB Connection Command Timeout Seconds
        /// </summary>
        public string DBConnectionCommandTimeoutSeconds { get; set; }

        /// <summary>
        /// IM File Uploaded Modified Date Format
        /// </summary>
        public string IMFileUploadedModifiedDateFormat { get; set; }

        /// <summary>
        /// API Request Body Log
        /// </summary>
        public string APIRequestBodyLog { get; set; }

        /// <summary>
        /// Connection String Key
        /// </summary>
        public string ConnectionStringKey { get; set; }

        /// <summary>
        /// API Type
        /// </summary>
        public string? APIType { get; set; }

        /// <summary>
        /// Front End Base URL
        /// </summary>
        public string? FrontEndBaseURL { get; set; }

        /// <summary>
        /// Reset Password Expiry In Minutes
        /// </summary>
        public string ResetPasswordLinkExpiryInMinutes { get; set; }

        /// <summary>
        /// Request DB Script Logging Enabled
        /// </summary>
        public string RequestDBScriptLoggingEnabled { get; set; }

        /// <summary>
        /// API Request DB Script Log
        /// </summary>
        public string APIRequestDBScriptLog { get; set; }
    }
}
