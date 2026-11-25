using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
    public class OTP
    {
        /// <summary>
        /// Login ID
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Login ID")]
        [Required(ErrorMessage = "Enter The Login ID.")]
        public string LoginID { get; set; }

        /// <summary>
        /// Login ID
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "OTP")]
        [OTPValidationAttribute(OTPDigitsPropertyName = "OTPNumber", ErrorMessage = "Please Enter 6 Digits of OTP.")]
        public string OTPNumber { get; set; }


        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (GenerateOTP/ValidateOTP/ResendOTP)")]
        public string ParamType { get; set; }
    }
}
