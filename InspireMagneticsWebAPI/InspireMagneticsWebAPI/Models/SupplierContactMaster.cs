using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using InspireMagneticsWebAPI.Models;

namespace InspireMagneticsWebAPI.Models
{
	public class SupplierContactMaster : PaginationCommonModel
	{
		/// <summary>
		/// Supplier Contact ID
		/// </summary>
		[Display(Name = "Supplier Contact ID")]
		[Required(ErrorMessage = "Enter The Supplier Contact ID.")]
		public int SupplierContactID { get; set; }

		/// <summary>
		/// Supplier ID
		/// </summary>
		[Display(Name = "Supplier ID")]
		[Required(ErrorMessage = "Enter The Supplier ID.")]
		public int SupplierID { get; set; }

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
		/// City
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "City")]
		public string City { get; set; }

		/// <summary>
		/// Country
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Country")]
		public string Country { get; set; }

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
		/// Is Primary
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Is Primary")]
		[Required(ErrorMessage = "Enter The Is Primary.")]
		public string IsPrimary { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
		public string ParamType { get; set; }
	}
	public class SupplierContactMasterDetailsRequestParam
	{

	}
}
