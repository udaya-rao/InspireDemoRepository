using System.Data;
using AutoMapper;
using CommonLib;
using InspireMagneticsWebAPI.Models;
using InspireMagneticsWebAPI.Service;

namespace InspireMagneticsWebAPI.Contracts
{
    public interface IUserLogin
    {
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
        Task<DataSet> GetUserLoginDetails(ODBCHelper _objODBCHelper, IOTP OTPService, IWebHostEnvironment webHostEnvironment, ITokenStoreService TokenStoreService, TokenService tokenService, UserLogin objUserLogin);

        /// <summary>
        /// This Method Is Used To Get Refresh Token.
        /// </summary>
        /// <param name="objTokenRefreshRequest"></param>
        /// <param name="TokenStoreService"></param>
        /// <param name="tokenService"></param>
        /// <returns></returns>
        Task<DataSet> GetRefreshToken(TokenRefreshRequest objTokenRefreshRequest, ITokenStoreService TokenStoreService, TokenService tokenService);

        /// <summary>
        /// This Method Is Used To Change The Password.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objChangePassword"></param>
        /// <param name="Source"></param>
        /// <returns></returns>
		Task<DataSet> ChangePassword(ODBCHelper _objODBCHelper, ChangePassword _objChangePassword, string Source);

        /// <summary>
        /// This Method Is Used To Send Request For Reset Password.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_webHostEnvironment"></param>
        /// <param name="_objForgotPassword"></param>
        /// <param name="mapper"></param>
        /// <returns></returns>
		Task<DataSet> ForgotPassword(ODBCHelper _objODBCHelper, IWebHostEnvironment _webHostEnvironment, ForgotPassword _objForgotPassword, IMapper mapper);

        /// <summary>
        /// This Method Is Used To Logout.
        /// </summary>
        /// <param name="LoginID"></param>
        /// <param name="_objODBCHelper"></param>
        /// <param name="TokenStoreService"></param>
        /// <returns></returns>
        Task<DataSet> Logout(string LoginID, ODBCHelper _objODBCHelper, ITokenStoreService TokenStoreService);
    }
}
