using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
	public class InventoryMasterRequestParam : PaginationCommonModel
	{
		/// <summary>
		/// Item ID
		/// </summary>
		[Display(Name = "Item ID")]
		[Required(ErrorMessage = "Enter the Item ID.")]
		public int ItemID { get; set; }

		/// <summary>
		/// Item Code
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Code")]
		[Required(ErrorMessage = "Enter the Item Code.")]
		public string ItemCode { get; set; }

		/// <summary>
		/// Item Description
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Description")]
		[Required(ErrorMessage = "Enter The Item Description.")]
		public string ItemDescription { get; set; }

		/// <summary>
		/// Item Unit
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Unit")]
		[Required(ErrorMessage = "Enter The Item Unit.")]
		public string ItemUnit { get; set; }

		/// <summary>
		/// Reorder Level
		/// </summary>
		[Display(Name = "Reorder Level"), DataType(DataType.Currency)]
		public decimal ReorderLevel { get; set; }

		/// <summary>
		/// Minimum Stock Level
		/// </summary>
		[Display(Name = "Minimum Stock Level"), DataType(DataType.Currency)]
		public decimal MinimumStockLevel { get; set; }

		/// <summary>
		/// Location
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Location")]
		public string Location { get; set; }

		/// <summary>
		/// Item Status
		/// </summary>
		[Display(Name = "Item Status")]
		[Required(ErrorMessage = "Enter The Item Status.")]
		public int ItemStatus { get; set; }

		/// <summary>
		/// Last Transaction Date
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Last Transaction Date")]
		[CommonDateTimeValidation(ErrorMessage = "Enter The Valid Last Transaction Date in (yyyy-MM-dd) Format.")]
		public string LastTransactionDate { get; set; }

		/// <summary>
		/// Item Remarks
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Remarks")]
		public string ItemRemarks { get; set; }


		/// <summary>
		/// Prepared By
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Prepared By")]
		public string PreparedBy { get; set; }

		/// <summary>
		/// Updated By
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Updated By")]
		public string UpdatedBy { get; set; }

		/// <summary>
		/// Shelf Life Days
		/// </summary>
		[Display(Name = "Shelf Life Days")]
		public int ShelfLifeDays { get; set; }

		/// <summary>
		/// HSN ID
		/// </summary>
		[Display(Name = "HSN ID")]
		[Required(ErrorMessage = "Enter The HSN ID.")]
		public int HSNID { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
		public string ParamType { get; set; }
	}
	public class Inventory : InventoryMasterRequestParam
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
	public class InventoryProfile : Profile
	{
		public InventoryProfile()
		{
			// Maps InventoryMasterRequestParam -> Inventory
			CreateMap<InventoryMasterRequestParam, Inventory>()
				.ForMember(dest => dest.ColumnName, opt => opt.Ignore())
				.ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
				.ForMember(dest => dest.SortOrder, opt => opt.Ignore())
				.ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
				.ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
	}
	public class InventoryDetailsRequestParam
	{
		/// <summary>
		/// Item ID
		/// </summary>
		[Display(Name = "Item ID")]
		[Required(ErrorMessage = "Enter the Item ID.")]
		public int ItemID { get; set; }
	}
	public class InventorySearchListRequestParam : CommonPaginationListRequestParam
	{
	}
	public class DeleteInventoryDetails
	{
		/// <summary>
		/// Item ID
		/// </summary>
		[Display(Name = "Item ID")]
		[Required(ErrorMessage = "Enter the Item ID.")]
		public int ItemID { get; set; }

	}
	public class CheckInventoryItemCodeExistForInventory
	{
		/// <summary>
		/// Item Code
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Code")]
		[Required(ErrorMessage = "Enter the Item Code.")]
		public string ItemCode { get; set; }
	}
    public class ItemCodeListByPaginationRequestParam 
    {

        /// <summary>
        /// Page Size
        /// </summary>
        [Display(Name = "Page Size")]
        [Required(ErrorMessage = "Enter The Page Size.")]
        public int PageSize { get; set; } = 0;

        /// <summary>
        /// Page Number
        /// </summary>
        [Display(Name = "Page Number")]
        [Required(ErrorMessage = "Enter The Page Number.")]
        public int PageNumber { get; set; } = 0;

        /// <summary>
        /// Search Keyword
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Search Keyword")]
        public string SearchKeyword { get; set; }
    }
}