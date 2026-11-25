using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class EmployeeSecurityAccessRequestParam
    {
        /// <summary>
        /// Employee ID
        /// </summary>
        [Display(Name = "Employee ID")]
        [Required(ErrorMessage = "Enter The Employee ID.")]
        public int EmployeeID { get; set; }

        /// <summary>
        /// Employee Security Access
        /// </summary>
        [Display(Name = "Employee Security Access")]
        public List<EmployeeSecurityAccess> employeeSecurityAccess { get; set; }
    }

    public class EmployeeSecurityAccess: EmployeeSecurityAccessCommon
    {
        /// <summary>
		/// Prepared By
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Prepared By")]
        [Required(ErrorMessage = "Enter The Prepared By.")]
        public string PreparedBy { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (Insert/Update)")]
        public string ParamType { get; set; }
    }

    public class EmployeeSecurityAccessDelete: EmployeeSecurityAccessCommon
    {
        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (DELETE)")]
        public string ParamType { get; set; }
    }

    public class EmployeeSecurityAccessList
    {
        /// <summary>
        /// Employee ID
        /// </summary>
        [Display(Name = "Employee ID")]
        public int EmployeeID { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (GetAllSecurityAccessList)")]
        public string ParamType { get; set; }
    }

    public class EmployeeSecurityAccessCommon
    {
        /// <summary>
        /// Security ID
        /// </summary>
        [Display(Name = "Security ID")]
        [Required(ErrorMessage = "Enter The Security ID.")]
        public int SecurityID { get; set; }

        /// <summary>
        /// Employee ID
        /// </summary>
        [Display(Name = "Employee ID")]
        [Required(ErrorMessage = "Enter The Employee ID.")]
        public int EmployeeID { get; set; }

        /// <summary>
        /// Rule ID
        /// </summary>
        [Display(Name = "Rule ID")]
        [Required(ErrorMessage = "Enter The Rule ID.")]
        public int RuleID { get; set; }
    }
}
