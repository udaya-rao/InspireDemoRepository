using InspireMagneticsWebAPI.Models;

namespace InspireMagneticsWebAPI.Contracts
{
    public interface ITokenStoreService
    {
        /// <summary>
        /// This Method Is Used To Add Token To Blacklist.
        /// </summary>
        /// <param name="Token"></param>
        void BlacklistToken(string Token);

        /// <summary>
        /// This Method Is Used To Check Whether The Token is Blacklisted Or Not.
        /// </summary>
        /// <param name="Token"></param>
        /// <returns></returns>
        bool IsTokenBlacklisted(string Token);

        /// <summary>
        /// This Method Is Used To Save Token Details.
        /// </summary>
        /// <param name="Name"></param>
        /// <param name="LoginID"></param>
        /// <param name="token"></param>
        /// <param name="isActive"></param>
        /// <param name="expiresAt"></param>
        /// <returns></returns>
        Task SaveTokenInfoAsync(string Name, string LoginID, string token, bool isActive, DateTime expiresAt);

        /// <summary>
        /// This Method Is Used To Get Token Details.
        /// </summary>
        /// <param name="LoginID"></param>
        /// <returns></returns>
        Task<TokenInfo> GetTokenInfo(string LoginID);

        /// <summary>
        /// This Method Is Used To Delete Token Details.
        /// </summary>
        /// <param name="LoginID"></param>
        /// <returns></returns>
        Task DeleteTokenAsync(string LoginID);

        /// <summary>
        /// This Method Is Used To Save Refresh Token.
        /// </summary>
        /// <param name="token"></param>
        void Save(RefreshToken token);

        /// <summary>
        /// This Method Is Used To Get Refresh Token.
        /// </summary>
        /// <param name="token"></param>
        /// <returns></returns>
        RefreshToken? Get(string token);

        /// <summary>
        /// This Method Is Used To Get Refresh Token Details By Username.
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        RefreshToken? GetByUsername(string username);

        /// <summary>
        /// This Method Is Used To Revoke Refresh Token.
        /// </summary>
        /// <param name="token"></param>
        void Revoke(string token);
    }
}
