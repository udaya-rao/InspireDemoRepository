using System.Data;
using AutoMapper;
using CommonLib;
using InspireMagneticsWebAPI.Models;

namespace InspireMagneticsWebAPI.Contracts
{
    public interface IOTP
    {
        #region [OTP]

        /// <summary>
        /// This Method Is Used To Generate OTP.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOTP"></param>
        /// <param name="webHostEnvironment"></param>
        /// <param name="mapper"></param>
        /// <returns></returns>
        Task<DataSet> GenerateOTP(ODBCHelper _objODBCHelper, OTP _objOTP, IWebHostEnvironment webHostEnvironment, IMapper mapper);

        /// <summary>
        /// This Method Is Used To Validate OTP.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOTP"></param>
        /// <returns></returns>
        Task<DataSet> ValidateOTP(ODBCHelper _objODBCHelper, OTP _objOTP);

        /// <summary>
        /// This Method Is Used To Resend OTP.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objOTP"></param>
        /// <param name="webHostEnvironment"></param>
        /// <param name="mapper"></param>
        /// <returns></returns>
        Task<DataSet> ResendOTP(ODBCHelper _objODBCHelper, OTP _objOTP, IWebHostEnvironment webHostEnvironment, IMapper mapper);

        #endregion [OTP]

    }
}
