using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
	public class CustomerContactMaster : PaginationCommonModel
	{
		/// <summary>
		/// Customer Contact ID
		/// </summary>
		[Display(Name = "Customer Contact ID")]
		public int CustomerContactID { get; set; }

		/// <summary>
		/// Customer ID
		/// </summary>
		[Display(Name = "Customer ID")]
		[Required(ErrorMessage = "Enter The Customer ID.")]
		public int CustomerID { get; set; }

		/// <summary>
		/// Contact Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Contact Name")]
		[Required(ErrorMessage = "Enter The Contact Name.")]
		public string ContactName { get; set; }

		/// <summary>
		/// Phone Number
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Phone Number")]
		public string PhoneNumber { get; set; }

		/// <summary>
		/// Mobile Number
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Mobile Number")]
		public string MobileNumber { get; set; }

		/// <summary>
		/// Designation
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Designation")]
		public string Designation { get; set; }

		/// <summary>
		/// Email
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Email")]
		public string Email { get; set; }

		/// <summary>
		/// Is Primary Contact
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Is Primary")]
		[Required(ErrorMessage = "Enter Is Primary (Y/N).")]
		public string IsPrimary { get; set; }

		/// <summary>
		/// Prepared By
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Prepared By")]
		[Required(ErrorMessage = "Enter The Prepared By.")]
		public string PreparedBy { get; set; }

		/// <summary>
		/// Updated By
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Updated By")]
		public string UpdatedBy { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE).")]
		public string ParamType { get; set; }
	}
}
