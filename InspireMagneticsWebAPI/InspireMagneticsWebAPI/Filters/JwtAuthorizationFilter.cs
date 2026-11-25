using System.IdentityModel.Tokens.Jwt;
using System.Text;
using CommonLib;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.IdentityModel.Tokens;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.Models;
using InspireMagneticsWebAPI.Service;
using CommonLib.Constants;

namespace InspireMagneticsWebAPI.Filters
{
    public class JwtAuthorizationFilter : IAsyncActionFilter
    {
        private readonly string _secretKey;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly bool _validateissuer;
        private readonly bool _validateaudience;
        private readonly bool _validateissuersigningkey;
        private readonly ILogger<JwtAuthorizationFilter> _logger;
        private readonly SymmetricSecurityKey _signingKey;
        private readonly ITokenStoreService _TokenStoreService;
        public static JwtSettings objJWTSettings { get; set; } = new JwtSettings();
        private readonly string GlobalErrorResponseTableName = "GLOBAL_ERROR_RESPONSE";

        /// <summary>
        /// JWT Authorization Filter
        /// </summary>
        /// <param name="configuration"></param>
        /// <param name="logger"></param>
        /// <param name="tokenStoreService"></param>
        public JwtAuthorizationFilter(IConfiguration configuration, ILogger<JwtAuthorizationFilter> logger, ITokenStoreService tokenStoreService)
        {
            configuration.GetSection("JWTKeys").Bind(objJWTSettings);
            _secretKey = objJWTSettings.IssuerSigningKey;
            _issuer = objJWTSettings.ValidIssuer;
            _audience = objJWTSettings.ValidAudience;
            _validateissuer = objJWTSettings.ValidateIssuer;
            _validateaudience = objJWTSettings.ValidateAudience;
            _validateissuersigningkey = objJWTSettings.ValidateIssuerSigningKey;
            _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
            _logger = logger;
            _TokenStoreService = tokenStoreService;
        }

        /// <summary>
        /// This Method Is Used To Execute When We Call Any API.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="next"></param>
        /// <returns></returns>
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            List<string> columns = new List<string> { "Status", "ErrorStatus", "ErrorDetail" };
            var tokenService = context.HttpContext.RequestServices.GetRequiredService<TokenService>();
            var blacklistService = context.HttpContext.RequestServices.GetRequiredService<ITokenStoreService>();
            // Retrieve the Authorization header value
            var token = context.HttpContext.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("Authorization header is missing.");
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), StatusCodes.Status401Unauthorized.ToString(), "Authorization header is missing." }
                };

                var dataSet = Helper.GenerateCommonMessage(columns, rows, GlobalErrorResponseTableName);
                string json = Util.JSONOK(ObjectToJson.ConvertDataSetToJson(dataSet));
                context.HttpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.HttpContext.Response.ContentType = ContentTypeConstants.JSON_CONTENTTYPE;
                await context.HttpContext.Response.WriteAsync(json);
                return;
            }
            if (blacklistService.IsTokenBlacklisted(token))
            {
                _logger.LogError("Token has been revoked.");
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), StatusCodes.Status401Unauthorized.ToString(), "Token has been revoked." }
                };

                var dataSet = Helper.GenerateCommonMessage(columns, rows, GlobalErrorResponseTableName);
                string json = Util.JSONOK(ObjectToJson.ConvertDataSetToJson(dataSet));
                context.HttpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.HttpContext.Response.ContentType = ContentTypeConstants.JSON_CONTENTTYPE;
                await context.HttpContext.Response.WriteAsync(json);
                return;
            }

            // Use TokenService to check if token is expired
            if (tokenService.IsTokenExpired(token))
            {
                _logger.LogError("Token has expired.");
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), StatusCodes.Status401Unauthorized.ToString(), "Token has expired." }
                };

                var dataSet = Helper.GenerateCommonMessage(columns, rows, GlobalErrorResponseTableName);
                string json = Util.JSONOK(ObjectToJson.ConvertDataSetToJson(dataSet));
                context.HttpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.HttpContext.Response.ContentType = ContentTypeConstants.JSON_CONTENTTYPE;
                await context.HttpContext.Response.WriteAsync(json);
                return;
            }
            // Validate the token
            if (!await ValidateToken(token, context.HttpContext))
            {
                _logger.LogError("Token Expired or You Have Logged-Out. Please Try Login Again !!!");
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), StatusCodes.Status401Unauthorized.ToString(), "Token Expired or You Have Logged-Out. Please Try Login Again !!!" }
                };

                var dataSet = Helper.GenerateCommonMessage(columns, rows, GlobalErrorResponseTableName);
                string json = Util.JSONOK(ObjectToJson.ConvertDataSetToJson(dataSet));
                context.HttpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.HttpContext.Response.ContentType = ContentTypeConstants.JSON_CONTENTTYPE;
                await context.HttpContext.Response.WriteAsync(json);
                return;
            }

            // Validate the token
            var principal = tokenService.GetTokenDetails(token);

            if (principal == null)
            {
                _logger.LogError("Invalid token.");
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), StatusCodes.Status401Unauthorized.ToString(), "Invalid token." }
                };

                var dataSet = Helper.GenerateCommonMessage(columns, rows, GlobalErrorResponseTableName);
                string json = Util.JSONOK(ObjectToJson.ConvertDataSetToJson(dataSet));
                context.HttpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.HttpContext.Response.ContentType = ContentTypeConstants.JSON_CONTENTTYPE;
                await context.HttpContext.Response.WriteAsync(json);
                return;
            }
            else
            {
                var tokenType = principal.FindFirst("token_type")?.Value;
                if (tokenType == "refresh")
                {
                    _logger.LogError("Refresh token cannot be used to access protected APIs.");
                    List<List<string>> rows = new List<List<string>>
                    {
                        new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), StatusCodes.Status401Unauthorized.ToString(), "Refresh token cannot be used to access protected APIs." }
                    };

                    var dataSet = Helper.GenerateCommonMessage(columns, rows, GlobalErrorResponseTableName);
                    string json = Util.JSONOK(ObjectToJson.ConvertDataSetToJson(dataSet));
                    context.HttpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.HttpContext.Response.ContentType = ContentTypeConstants.JSON_CONTENTTYPE;
                    await context.HttpContext.Response.WriteAsync(json);
                    return;
                }
            }

            // Continue to the next action in the pipeline
            await next();
        }

        /// <summary>
        /// This Method Is Used To Validate The Token.
        /// </summary>
        /// <param name="token"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        private async Task<bool> ValidateToken(string token, HttpContext context)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            try
            {
                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = _validateissuer,
                    ValidateAudience = _validateaudience,
                    ValidateIssuerSigningKey = _validateissuersigningkey,
                    ValidIssuer = _issuer,
                    ValidAudience = _audience,
                    IssuerSigningKey = _signingKey,
                    ClockSkew = TimeSpan.FromMinutes(5),
                };

                // Validate token and get claims
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var validatedToken);

                // Optionally, you can access the validated token and extract claims here:
                var jwtToken = validatedToken as JwtSecurityToken;
                if (jwtToken != null)
                {
                    // Access claims (e.g., username)
                    var username = jwtToken.Claims.FirstOrDefault(c => c.Type == "name")?.Value;
                    var user_id = jwtToken.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                    if (username == null || user_id == null)
                    {
                        _logger.LogError("Username claim not found in token.");
                        return false;
                    }
                    else
                    {
                        var TokenDetails = await _TokenStoreService.GetTokenInfo(user_id);
                        if (TokenDetails != null)
                        {
                            if (TokenDetails.Name == username && TokenDetails.LoginId == user_id)
                            {
                                context.Items["UserName"] = username;
                                context.Items["UserID"] = user_id;
                            }
                            else
                            {
                                _logger.LogError("Token is invalid.");
                                return false;
                            }
                        }
                        else
                        {
                            _logger.LogError("Token Expired or You Have Logged-Out. Please Try Login Again !!!");
                            return false;
                        }
                    }
                }

                return true; // Token is valid
            }
            catch (SecurityTokenExpiredException)
            {
                _logger.LogError("Token is expired.");
                return false; // Token expired
            }
            catch (SecurityTokenException)
            {
                _logger.LogError("Token is invalid.");
                return false; // Invalid token
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error validating token: {ex.Message}");
                return false;
            }
        }
    }
}
