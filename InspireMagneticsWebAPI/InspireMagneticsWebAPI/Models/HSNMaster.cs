using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using InspireMagneticsWebAPI.CustomAttribute;
using InspireMagneticsWebAPI.Models;

namespace InspireMagneticsWebAPI.Models
{
	public class HSNMaster : PaginationCommonModel
	{
		/// <summary>
		/// HSN ID
		/// </summary>
		[Display(Name = "HSN ID")]
		[Required(ErrorMessage = "Enter The HSN ID.")]
		public int HSNID { get; set; }

		/// <summary>
		/// HSN Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "HSN Name")]
		[Required(ErrorMessage = "Enter The HSN Name.")]
		public string HSNName { get; set; }

		/// <summary>
		/// HSN Code
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "HSN Code")]
		public string HSNCode { get; set; }

		/// <summary>
		/// Local GST ID
		/// </summary>
		[Display(Name = "Local GST ID")]
        [Required(ErrorMessage = "Enter The Local GST ID.")]
        [NumberGreaterThanZeroValidation(NumberPropertyName = "LocalGSTID", ErrorMessage = "Local GST ID Should Be Greater Than 0.")]
        public int LocalGSTID { get; set; }

		/// <summary>
		/// Inter State GST ID
		/// </summary>
		[Display(Name = "Inter State GST ID")]
        [Required(ErrorMessage = "Enter The Inter State GST ID.")]
        [NumberGreaterThanZeroValidation(NumberPropertyName = "InterStateGSTID", ErrorMessage = "Inter State GST ID Should Be Greater Than 0.")]
        public int InterStateGSTID { get; set; }

		/// <summary>
		/// HSN Status
		/// </summary>
		[Display(Name = "HSN Status")]
		public int HSNStatus { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter The Param Type (Insert/Update)")]
		public string ParamType { get; set; }
	}
	public class HSNMasterDetailsRequestParam
	{
		/// <summary>
		/// HSN ID
		/// </summary>
		[Display(Name = "HSN ID")]
		[Required(ErrorMessage = "Enter The HSN ID.")]
		public int HSNID { get; set; }

	}

	public class HSNMasterListRequestParam : PaginationCommonMandatoryModel
	{

	}
}
