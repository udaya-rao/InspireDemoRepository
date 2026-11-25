using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
	public class FGInventoryMasterRequestParam : PaginationCommonModel
	{
		/// <summary>
		/// FG Item ID
		/// </summary>
		[Display(Name = "FG Item ID")]
		[Required(ErrorMessage = "Enter The FG Item ID.")]
		public int FGItemID { get; set; } = 0;

		/// <summary>
		/// Item Code
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Code")]
		[Required(ErrorMessage = "Enter The Item Code.")]
		public string ItemCode { get; set; }

		/// <summary>
		/// Item Description
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Description")]
		[Required(ErrorMessage = "Enter The Item Description.")]
		public string ItemDescription { get; set; }

		/// <summary>
		/// Item Status
		/// </summary>
		[Display(Name = "Item Status")]
		[Required(ErrorMessage = "Enter The Item Status.")]
		public int ItemStatus { get; set; }

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
		/// Min Stock Level
		/// </summary>
		[Display(Name = "Min Stock Level"), DataType(DataType.Currency)]
		public decimal MinStockLevel { get; set; }

		/// <summary>
		/// Location
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Location")]
		public string Location { get; set; }

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
	public class FGInventory : FGInventoryMasterRequestParam
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
	public class FGInventoryProfile : Profile
	{
		public FGInventoryProfile()
		{
			// Maps FGInventoryMasterRequestParam -> FGInventory
			CreateMap<FGInventoryMasterRequestParam, FGInventory>()
				.ForMember(dest => dest.ColumnName, opt => opt.Ignore())
				.ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
				.ForMember(dest => dest.SortOrder, opt => opt.Ignore())
				.ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
	}
	public class FGInventoryDetailsRequestParam
	{
		/// <summary>
		/// FG Item ID
		/// </summary>
		[Display(Name = "FG Item ID")]
		[Required(ErrorMessage = "Enter the FG Item ID.")]
		public int FGItemID { get; set; } = 0;
	}
	public class FGSearchInventoryListRequestParam : CommonPaginationListRequestParam
	{
	}

	public class DeleteFGInventoryItem
	{
		/// <summary>
		/// FG Item ID
		/// </summary>
		[Display(Name = "FG Item ID")]
		[Required(ErrorMessage = "Enter The FG Item ID.")]
		public int FGItemID { get; set; } = 0;
	}
	public class CheckFGItemCodeExistForFGInventory
	{
		/// <summary>
		/// Item Code
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Code")]
		[Required(ErrorMessage = "Enter The Item Code.")]
		public string ItemCode { get; set; }
	}
}
