using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CommonLib;

namespace InspireMagneticsWebAPI.Service
{
    public class TokenService
    {
        private readonly string _SecretKey = string.Empty; // This should be stored in a secure place
        private readonly string _Issuer = string.Empty;
        private readonly string _Audience = string.Empty;
        private readonly int _TokenExpirationInMinutes = 0;
        private readonly int _RefreshTokenExpirationInDays = 0;
        private readonly SymmetricSecurityKey _signingKey;
        public static JwtSettings objJWTSettings { get; set; } = new JwtSettings();
        private readonly string TokenServiceLogClassName = "TokenService";

        /// <summary>
        /// Token Service Class Constructor.
        /// </summary>
        /// <param name="configuration"></param>
        public TokenService(IConfiguration configuration)
        {
            configuration.GetSection("JWTKeys").Bind(objJWTSettings);
            _SecretKey = objJWTSettings.IssuerSigningKey;
            _Issuer = objJWTSettings.ValidIssuer;
            _Audience = objJWTSettings.ValidAudience;
            _TokenExpirationInMinutes = objJWTSettings.TokenExpirationInMinutes;
            _RefreshTokenExpirationInDays = objJWTSettings.RefreshTokenExpirationInDays;
            _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_SecretKey));
        }

        /// <summary>
        /// This Method Is Used To Generate Token.
        /// </summary>
        /// <param name="username"></param>
        /// <param name="loginid"></param>
        /// <returns></returns>
        public string GenerateToken(string username, string loginid)
        {
            string accessToken = string.Empty;
            try
            {
                var token = new JwtSecurityToken(
                    issuer: _Issuer,
                    audience: _Audience,
                    claims: new[]
                    {
                        new Claim("name", username),
                        new Claim("user_id", loginid),
                        new Claim("token_type", "access")
                    },
                    expires: DateTime.Now.AddMinutes(_TokenExpirationInMinutes),
                    signingCredentials: new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha512)
                );

                var tokenHandler = new JwtSecurityTokenHandler();
                accessToken = tokenHandler.WriteToken(token);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.ServiceLogNamespace, $"{TokenServiceLogClassName}.GenerateToken()", ex.Message, false);
                accessToken = string.Empty;
            }
            return accessToken;
        }

        /// <summary>
        /// This Method Is Used To Get Token Expiration In Minutes.
        /// </summary>
        /// <returns></returns>
        public int GetTokenExpirationInMinutes()
        {
            int TokenExpirationInMinutes = 0;
            try
            {
                TokenExpirationInMinutes = _TokenExpirationInMinutes;
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.ServiceLogNamespace, $"{TokenServiceLogClassName}.GetTokenExpirationInMinutes()", ex.Message, false);
                TokenExpirationInMinutes = 0;
            }
            return TokenExpirationInMinutes;
        }

        /// <summary>
        /// This Method Is Used To Checked Whether Token Is Expired Or Not.
        /// </summary>
        /// <param name="token"></param>
        /// <returns></returns>
        public bool IsTokenExpired(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            try
            {
                var jwtToken = tokenHandler.ReadJwtToken(token);
                return jwtToken.ValidTo < DateTime.UtcNow;
            }
            catch
            {
                return true;
            }
        }

        /// <summary>
        /// This Method Is Used To Get Token Details.
        /// </summary>
        /// <param name="token"></param>
        /// <returns></returns>
        public ClaimsPrincipal? GetTokenDetails(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_SecretKey);

            try
            {
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true, // Check Expiry
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return principal;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// This Method Is Used To Generate Refresh Token.
        /// </summary>
        /// <param name="username"></param>
        /// <param name="loginid"></param>
        /// <returns></returns>
        public string GenerateRefreshToken(string username, string loginid)
        {
            string accessToken = string.Empty;
            try
            {
                var token = new JwtSecurityToken(
                    issuer: _Issuer,
                    audience: _Audience,
                    claims: new[]
                    {
                        new Claim("name", username),
                        new Claim("user_id", loginid),
                        new Claim("token_type", "refresh")
                    },
                    expires: DateTime.UtcNow.AddDays(_RefreshTokenExpirationInDays),
                    signingCredentials: new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha512)
                );

                var tokenHandler = new JwtSecurityTokenHandler();
                accessToken = tokenHandler.WriteToken(token);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.ServiceLogNamespace, $"{TokenServiceLogClassName}.GenerateRefreshToken()", ex.Message, false);
                accessToken = string.Empty;
            }
            return accessToken;
        }

        /// <summary>
        /// This Method Is Used To Get Refresh Token Expiration In Days.
        /// </summary>
        /// <returns></returns>
        public int GetRefreshTokenExpirationInDays() => _RefreshTokenExpirationInDays;

        /// <summary>
        /// This Method Is Used To Get Refresh To Store.
        /// </summary>
        /// <param name="username"></param>
        /// <param name="login_id"></param>
        /// <param name="token"></param>
        /// <returns></returns>
        public RefreshToken GetRefreshTokenStore(string username, string login_id, string token)
        {
            var refreshToken = new RefreshToken
            {
                Token = token,
                UserName = username,
                UserID = login_id,
                ExpiresAt = DateTime.UtcNow.AddDays(_RefreshTokenExpirationInDays),
                IsRevoked = false
            };
            return refreshToken;
        }

        /// <summary>
        /// This Method Is Used To Validate Refresh Token.
        /// </summary>
        /// <param name="refreshToken"></param>
        /// <returns></returns>
        public ClaimsPrincipal? ValidateRefreshToken(string refreshToken)
        {
            return GetTokenDetails(refreshToken); // Reuse the same validation
        }
    }
}
