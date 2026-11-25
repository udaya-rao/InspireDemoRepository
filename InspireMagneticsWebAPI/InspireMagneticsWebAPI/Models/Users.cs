using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
	public class Users
	{
	}

	public class UserLogin: EmployeeLoginCommon
	{
        /// <summary>
        /// Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Password")]
		[Required(ErrorMessage = "Enter The Password.")]
		public string Password { get; set; }
	}

	public class EmployeeLoginCommon
	{
        /// <summary>
        ///Login ID
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Login ID")]
		[Required(ErrorMessage = "Enter The Login ID.")]
		public string LoginID { get; set; }
	}

	public class ChangePassword
    {
        /// <summary>
        /// Employee ID
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Employee ID")]
        [Required(ErrorMessage = "Enter The Employee ID.")]
        public string EmployeeID { get; set; }

        /// <summary>
        /// Old Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Old Password")]
        [Required(ErrorMessage = "Enter The Old Password.")]
        public string OldPassword { get; set; }

        /// <summary>
        /// New Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "New Password")]
        [Required(ErrorMessage = "Enter The New Password.")]
        [CommonValidation(CustomPropertyName = "NewPassword", ValidationTypePropertyName = "Password", ErrorMessage = "New Password must be minimum 8 characters and contain one uppercase letter, one lowercase letter, one digit and one special character.")]
        public string NewPassword { get; set; }

        /// <summary>
        /// Confirm Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Confirm Password")]
        [Required(ErrorMessage = "Enter The Confirm Password.")]
        [Compare("NewPassword", ErrorMessage = "New Password and Confirm Password Must Match.")]
        public string ConfirmPassword { get; set; }
    }

    public class ResetPassword
    {
        /// <summary>
        /// Login ID
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Login ID")]
        [Required(ErrorMessage = "Enter The Login ID.")]
        public string LoginID { get; set; }

        /// <summary>
        /// New Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "New Password")]
        [Required(ErrorMessage = "Enter The New Password.")]
        [CommonValidation(CustomPropertyName = "NewPassword", ValidationTypePropertyName = "Password", ErrorMessage = "New Password must be minimum 8 characters and contain one uppercase letter, one lowercase letter, one digit and one special character.")]
        public string NewPassword { get; set; }

        /// <summary>
        /// Confirm Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Confirm Password")]
        [Required(ErrorMessage = "Enter The Confirm Password.")]
        [Compare("NewPassword", ErrorMessage = "New Password and Confirm Password Must Match.")]
        public string ConfirmPassword { get; set; }
    }

    public class ForgotPassword
    {
        /// <summary>
		/// Logins ID
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Login ID")]
        [Required(ErrorMessage = "Enter The Login ID.")]
        public string LoginID { get; set; }
    }

    public class DesktopChangePassword
    {
        /// <summary>
        /// Login ID
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Login ID")]
        [Required(ErrorMessage = "Enter The Login ID.")]
        public string LoginID { get; set; }

        /// <summary>
        /// Old Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Old Password")]
        [Required(ErrorMessage = "Enter The Old Password.")]
        public string OldPassword { get; set; }

        /// <summary>
        /// New Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "New Password")]
        [Required(ErrorMessage = "Enter The New Password.")]
        [CommonValidation(CustomPropertyName = "NewPassword", ValidationTypePropertyName = "Password", ErrorMessage = "New Password must be minimum 8 characters and contain one uppercase letter, one lowercase letter, one digit and one special character.")]
        public string NewPassword { get; set; }

        /// <summary>
        /// Confirm Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Confirm Password")]
        [Required(ErrorMessage = "Enter The Confirm Password.")]
        [Compare("NewPassword", ErrorMessage = "New Password and Confirm Password Must Match.")]
        [CommonValidation(CustomPropertyName = "ConfirmPassword", ValidationTypePropertyName = "Password", ErrorMessage = "Confirm Password must be minimum 8 characters and contain one uppercase letter, one lowercase letter, one digit and one special character.")]
        public string ConfirmPassword { get; set; }
    }

    public class DesktopPassword
	{
        /// <summary>
        /// Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Password")]
        [Required(ErrorMessage = "Enter The Password.")]
        public string Password { get; set; }
    }

    public class EncryptTextRequest
    {
        /// <summary>
        /// Text
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Text")]
        [Required(ErrorMessage = "Enter The Text.")]
        public string Text { get; set; }

        /// <summary>
        /// Encrypt Decrypt Key
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "EncryptDecryptKey")]
        [Required(ErrorMessage = "Enter The Encrypt/Decrypt Key.")]
        public string EncryptDecryptKey { get; set; }
    }

    public class EncryptTextResponse
    {
        /// <summary>
        /// Plain Text
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "PlainText")]
        public string PlainText { get; set; }

        /// <summary>
        /// Encrypted Text
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Encrypted Text")]
        public string EncryptedText { get; set; }
    }

    public class DecryptTextRequest
    {
        /// <summary>
        /// Encrypted Text
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Encrypted Text")]
        [Required(ErrorMessage = "Enter The Encrypted Text.")]
        public string EncryptedText { get; set; }

        /// <summary>
        /// Encrypt Decrypt Key
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "EncryptDecryptKey")]
        [Required(ErrorMessage = "Enter The Encrypt/Decrypt Key.")]
        public string EncryptDecryptKey { get; set; }
    }

    public class DecryptTextResponse
    {
        /// <summary>
        /// Decrypted Text
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Decrypted Text")]
        public string DecryptedText { get; set; }

        /// <summary>
        /// Encrypted Text
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Encrypted Text")]
        public string EncryptedText { get; set; }
    }

    public class TokenRefreshRequest
    {
        /// <summary>
        /// Refresh Token
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Refresh Token")]
        [Required(ErrorMessage = "Enter The Refresh Token.")]
        public string RefreshToken { get; set; }
    }
}
