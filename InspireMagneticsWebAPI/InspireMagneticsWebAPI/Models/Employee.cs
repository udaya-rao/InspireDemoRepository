using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;
using InspireMagneticsWebAPI.Resolvers;

namespace InspireMagneticsWebAPI.Models
{
	public class Employee
	{
	}

	public class EmployeeMasterM : PaginationCommonModel, IHasLoginPassword
    {
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
		public int RuleID { get; set; }

		/// <summary>
		/// Employee Code
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Employee Code")]
		[Required(ErrorMessage = "Enter The Employee Code.")]
		public string EmployeeCode { get; set; }

		/// <summary>
		/// Login ID
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Login ID")]
		[Required(ErrorMessage = "Enter The Login ID.")]
		public string LoginID { get; set; }

		/// <summary>
		/// Employee Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Employee Name")]
		[Required(ErrorMessage = "Enter The Employee Name.")]
		public string EmployeeName { get; set; }

		/// <summary>
		/// Date of Birth
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Date of Birth")]
		[DOBValidation(ErrorMessage = "Enter The Valid Date of Birth in (yyyy-MM-dd) Format and Should Not Be Future Date.")]
		public string DateofBirth { get; set; }

		/// <summary>
		/// Department ID
		/// </summary>
		[Display(Name = "Department ID")]
		[Required(ErrorMessage = "Enter The Department ID.")]
        [NumberGreaterThanZeroValidation(NumberPropertyName = "DepartmentID", ErrorMessage = "Department ID Should Be Greater Than 0.")]
        public int DepartmentID { get; set; }

		/// <summary>
		/// Login Password
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Login Password")]
		[Required(ErrorMessage = "Enter The Login Password.")]
		[CommonValidation(CustomPropertyName = "LoginPassword", ValidationTypePropertyName = "Password", ErrorMessage = "Login Password must be minimum 8 characters and contain one uppercase letter, one lowercase letter, one digit and one special character.")]
		public string LoginPassword { get; set; }

		/// <summary>
		/// Employee Status
		/// </summary>
		[Display(Name = "Employee Status")]
		[Required(ErrorMessage = "Enter The Employee Status.")]
		public int EmployeeStatus { get; set; }

		/// <summary>
		/// Mobile Number
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Mobile Number")]
		[CommonValidation(CustomPropertyName = "MobileNumber", ValidationTypePropertyName = "MobileNumber", ErrorMessage = "Enter The Valid Mobile Number.")]
		public string MobileNumber { get; set; }

		/// <summary>
		/// Email ID
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Email ID")]
		[CommonValidation(CustomPropertyName = "EmailID", ValidationTypePropertyName = "Email", ErrorMessage = "Enter The Valid Email ID.")]
		public string EmailID { get; set; }

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

    public class EmployeeMaster : EmployeeMasterM, IHasPasswordHash
    {
        /// <summary>
        /// Encrypted Password
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Encrypted Password")]
        public string EncryptedPassword { get; set; }

        /// <summary>
        /// Password Salt
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Password Salt")]
        public string PasswordSalt { get; set; }
    }

    public class EmployeeMasterProfile : Profile
    {
        public EmployeeMasterProfile()
        {
            // Maps EmployeeMasterM -> EmployeeMaster
            CreateMap<EmployeeMasterM, EmployeeMaster>()
                .ForMember(dest => dest.ParamType,
                opt => opt.MapFrom(src => OperationTypeConstants.Add))
            .AfterMap<PasswordHashMappingAction<EmployeeMasterM, EmployeeMaster>>();
        }
    }

    public class EmployeeMasterDetailRequestParam
	{
		/// <summary>
		/// Employee ID
		/// </summary>
		[Display(Name = "Employee ID")]
		public int EmployeeID { get; set; }

		/// <summary>
		/// Rule ID
		/// </summary>
		[Display(Name = "Rule ID")]
		public int RuleID { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter The Param Type (GetEmployeeDetails/GetEmployeeByAccessId).")]
		public string ParamType { get; set; }
	}

	public class DeleteEmployeeMasterDetail
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
		[Required(ErrorMessage = "Enter The Param Type (DeleteEmployeeDetails).")]
		public string ParamType { get; set; }
	}

	public class UpdateEmployeePassword
	{
		/// <summary>
		/// Employee ID
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Employee ID")]
		public string EmployeeID { get; set; }

		/// <summary>
		/// Login ID
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Login ID")]
		public string LoginID { get; set; }

        /// <summary>
        /// Encrypted Password
        /// </summary>
        [DefaultValue("")]
		[Display(Name = "Encrypted Password")]
		public string EncryptedPassword { get; set; }

		/// <summary>
		/// Password Salt
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Password Salt")]
		public string PasswordSalt { get; set; }

        /// <summary>
        /// Encrypted Password2
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Encrypted Password2")]
        public string EncryptedPassword2 { get; set; }

        /// <summary>
        /// Password Salt2
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Password Salt2")]
        public string PasswordSalt2 { get; set; }

        /// <summary>
        /// Encrypted Password3
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Encrypted Password3")]
        public string EncryptedPassword3 { get; set; }

        /// <summary>
        /// Password Salt3
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Password Salt3")]
        public string PasswordSalt3 { get; set; }
    }

	public class EmployeeMasterListRequestParam : PaginationCommonMandatoryModel
	{

	}
}
