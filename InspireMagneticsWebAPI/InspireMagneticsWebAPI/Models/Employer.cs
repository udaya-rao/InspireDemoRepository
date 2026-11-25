using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel;

namespace InspireMagneticsWebAPI.Models
{
	public class Employer
	{
		/// <summary>
		/// Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Name")]
		[Required(ErrorMessage = "Enter The Name.")]
		public string Name { get; set; }

		/// <summary>
		/// Address
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Address")]
		[Required(ErrorMessage = "Enter The Address.")]
		public string Address { get; set; }

		/// <summary>
		/// Phone Number
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Phone Number")]
		public string Phone { get; set; }

		/// <summary>
		/// Fax
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Fax")]
		public string Fax { get; set; }

		/// <summary>
		/// Email ID
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Email ID")]
		[CommonValidation(CustomPropertyName = "EmailID", ValidationTypePropertyName = "Email", ErrorMessage = "Enter The Valid Email ID.")]
		public string EmailID { get; set; }

		/// <summary>
		/// Employee ID
		/// </summary>
		[Display(Name = "Employer ID")]
		[Required(ErrorMessage = "Enter Employee ID.")]
		public int EmployerID { get; set; }

		/// <summary>
		/// PAN No
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "PAN No")]
		[CommonValidation(CustomPropertyName = "PANNo", ValidationTypePropertyName = "PANNumber", ErrorMessage = "Enter The Valid PAN No.")]
		public string PANNo { get; set; }

		/// <summary>
		/// Mobile Number
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Mobile Number")]
		[CommonValidation(CustomPropertyName = "MobileNumber", ValidationTypePropertyName = "MobileNumber", ErrorMessage = "Enter The Valid Mobile Number.")]
		public string MobileNumber { get; set; }

		/// <summary>
		///Accounts Details
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Accounts Details")]
		public string AccountsDetails { get; set; }

		/// <summary>
		/// GST Number
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "GST Number.")]
		public string GSTNumber { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter The Param Type (Insert/Update)")]
		public string ParamType { get; set; }
	}

	public class EmployerListRequestParam
	{
		/// <summary>
		/// Employer ID
		/// </summary>
		[Display(Name = "Employer ID")]
		public int EmployerID { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter The Param Type (GetAllEmployerList/GetEmployerDetails).")]
		public string ParamType { get; set; }
	}
}


