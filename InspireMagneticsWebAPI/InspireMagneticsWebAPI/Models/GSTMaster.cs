using InspireMagneticsWebAPI.CustomAttribute;
using InspireMagneticsWebAPI.Models;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
	public class GSTMaster : PaginationCommonModel
	{
		/// <summary>
		/// GST ID
		/// </summary>
		[Display(Name = "GST ID")]
		[Required(ErrorMessage = "Enter The GST ID.")]
		public int GSTID { get; set; }

		/// <summary>
		/// Tax Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Tax Name")]
		[Required(ErrorMessage = "Enter The Tax Name.")]
		public string TaxName { get; set; }

		/// <summary>
		/// GST Perc
		/// </summary>
		[Display(Name = "GSTPerc")]
		[Required(ErrorMessage = "Enter The GST Perc"), DataType(DataType.Currency)]
		public decimal GSTPerc { get; set; }

		/// <summary>
		/// GST Status
		/// </summary>
		[Display(Name = "GST Status")]
		public int GSTStatus { get; set; }

		/// <summary>
		/// GST Applicable For
		/// </summary>
		[Display(Name = "GST Applicable For")]
		public int GSTApplicableFor { get; set; }

		/// <summary>
		/// CGST Percentage
		/// </summary>
		[Display(Name = "CGST Percentage")]
		[DataType(DataType.Currency)]
		public decimal CGSTPercentage { get; set; }

		/// <summary>
		/// SGST Percentage
		/// </summary>
		[Display(Name = "SGST Percentage")]
		[DataType(DataType.Currency)]
		public decimal SGSTPercentage { get; set; }

		/// <summary> 
		/// IGST Percentage
		/// </summary>
		[Display(Name = "IGST Percentage")]
		[DataType(DataType.Currency)]
		public decimal IGSTPercentage { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter The Param Type (Insert/Update).")]
		public string ParamType { get; set; }
	}

	public class GSTMasterDetailsRequestParam
	{
		/// <summary>
		/// GST ID
		/// </summary>
		[Display(Name = "GST ID")]
		[Required(ErrorMessage = "Enter The GST ID.")]
		public int GSTID { get; set; }

	}

	public class GSTMasterListRequestParam : PaginationCommonMandatoryModel
	{

	}
}
