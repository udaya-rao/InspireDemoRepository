using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;
using InspireMagneticsWebAPI.Models;

namespace InspireMagneticsWebAPI.Models
{
	public class Supplier
	{
	}
	public class SupplierMasterRequestParam : PaginationCommonModel
	{
		/// <summary>
		/// Supplier ID
		/// </summary>
		[Display(Name = "Supplier ID")]
		[Required(ErrorMessage = "Enter The Supplier ID.")]
		public int SupplierID { get; set; }

		/// <summary>
		/// Supplier Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Supplier Name")]
		[Required(ErrorMessage = "Enter The Supplier Name.")]
		public string SupplierName { get; set; }

		/// <summary>
		/// Supplier Address1
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Supplier Address1")]
		[Required(ErrorMessage = "Enter The Supplier Address1.")]
		public string SupplierAddress1 { get; set; }

		/// <summary>
		/// Supplier Address2
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Supplier Address2")]
		public string SupplierAddress2 { get; set; }

		/// <summary>
		/// Supplier Pincode
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Supplier Pincode")]
		[Required(ErrorMessage = "Enter The Supplier Pincode.")]
        [CommonValidation(CustomPropertyName = "SupplierPincode", ValidationTypePropertyName = "Pincode", ErrorMessage = "Enter The Valid Supplier Pincode.")]
        public string SupplierPincode { get; set; }

		/// <summary>
		/// Supplier Type
		/// </summary>
		[Display(Name = "Supplier Type")]
		public int SupplierType { get; set; }

        /// <summary>
        /// Supplier Supply
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Supplier Supply")]
        public string SupplierSupply { get; set; }

        /// <summary>
        /// Supplier Website
        /// </summary>
        [DefaultValue("")]
		[Display(Name = "Supplier Website")]
		public string SupplierWebsite { get; set; }

		/// <summary>
		/// GST IN Number
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "GST IN Number")]
		[Required(ErrorMessage = "Enter The GST IN Number.")]
		public string GSTINNumber { get; set; }

		/// <summary>
		/// PAN Number
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "PAN Number")]
		[Required(ErrorMessage = "Enter The PAN Number.")]
		public string PANNumber { get; set; }

		/// <summary>
		/// Supplier Status
		/// </summary>
		[Display(Name = "Supplier Status")]
		public int SupplierStatus { get; set; }

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
		/// Supplier Contact Master
		/// </summary>
		public List<SupplierContactMaster> SupplierContactMaster { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
		public string ParamType { get; set; }
	}
	public class SupplierMaster : SupplierMasterRequestParam
	{
		/// <summary>
		/// Column Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Column Name")]
		public string ColumnName { get; set; }

		/// <summary>
		/// Is Global Search
		/// </summary>
		[Display(Name = "Is Global Search")]
		public int IsGlobalSearch { get; set; } = 0;

		/// <summary>
		/// Sort Order
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Sort Order")]
		public string SortOrder { get; set; }

		/// <summary>
		/// Search Keyword
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Search Keyword")]
		public string SearchKeyword { get; set; }

		/// <summary>
		/// Sort Columns
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Sort Columns")]
		public string SortColumns { get; set; }
	}
	public class SupplierMasterProfile : Profile
	{
		public SupplierMasterProfile()
		{
			// Maps SupplierMasterRequestParam -> SupplierMaster
			CreateMap<SupplierMasterRequestParam, SupplierMaster>()
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
				.ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
				.ForMember(dest => dest.SortOrder, opt => opt.Ignore())
				.ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
		}
	}
	public class SupplierMasterDetailsRequestParam
	{
		/// <summary>
		/// Supplier ID
		/// </summary>
		[Display(Name = "Supplier ID")]
		[Required(ErrorMessage = "Enter the SupplierID.")]
		public int SupplierID { get; set; }
	}
	public class SearchSupplierMasterListRequestParam : CommonPaginationListRequestParam
	{

	}
	
	public class CheckSupplierNameExist
	{
		/// <summary>
		/// Supplier Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Supplier Name")]
		[Required(ErrorMessage = "Enter The Supplier Name.")]
		public string SupplierName { get; set; }
	}
	public class DeleteSupplierMasterDetails
	{
		/// <summary>
		/// Supplier ID
		/// </summary>
		[Display(Name = "Supplier ID")]
		[Required(ErrorMessage = "Enter The Supplier ID.")]
		public int SupplierID { get; set; }

	}
}
