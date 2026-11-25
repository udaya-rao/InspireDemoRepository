namespace InspireMagneticsWebAPI.DACHelper
{
    public static class LogNameSpaceConstants
    {
        /// <summary>
        /// API Project Name
        /// </summary>
        public static readonly string APIProjectName = "InspireMagneticsWebAPI";

        /// <summary>
        /// DAC Helper Log Namespace
        /// </summary>
        public static readonly string DACHelperLogNamespace = $"{APIProjectName}.DACHelper";

        /// <summary>
        /// MiddleWare Log Namespace
        /// </summary>
        public static readonly string MiddlewareLogNamespace = $"{APIProjectName}.Middleware";

        /// <summary>
        /// Repositories Log Namespace
        /// </summary>
        public static readonly string RepositoriesLogNamespace = $"{APIProjectName}.Repositories";

        /// <summary>
        /// Service Log Namespace
        /// </summary>
        public static readonly string ServiceLogNamespace = $"{APIProjectName}.Service";
    }
}
