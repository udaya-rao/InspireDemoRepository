namespace InspireMagneticsWebAPI.Models
{
    public class RefreshToken
    {
        /// <summary>
        /// Token
        /// </summary>
        public string Token { get; set; }

        /// <summary>
        /// User ID
        /// </summary>
        public string UserID { get; set; }

        /// <summary>
        /// User Name
        /// </summary>
        public string UserName { get; set; }

        /// <summary>
        /// Expires At
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// Is Revoked
        /// </summary>
        public bool IsRevoked { get; set; }
    }
}
