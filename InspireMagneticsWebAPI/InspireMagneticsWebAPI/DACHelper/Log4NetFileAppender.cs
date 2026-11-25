using System.Globalization;
using CommonLib.Constants;
using log4net.Appender;
using log4net.Core;

namespace InspireMagneticsWebAPI.DACHelper
{
    public class Log4NetFileAppender : RollingFileAppender
    {
        public static string LogDirectory = string.Empty;
        protected override void Append(LoggingEvent loggingEvent)
        {
            string userId = loggingEvent.LookupProperty("UserID")?.ToString() ?? "UnknownUser";
            string date = DateTime.Now.ToString(DateTimeFormatConstants.DDMMMYYYY_COMPACT_DATEFORMAT, CultureInfo.InvariantCulture);

            string logFileName = $"{userId}_{date}_log.txt";
            string fullPath = Path.Combine(LogDirectory, logFileName);

            if (File != fullPath)
            {
                File = fullPath;
                ActivateOptions(); // re-apply file settings
            }

            base.Append(loggingEvent);
        }
    }
}
