using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
    public class InventoryTransactionLogRequestParam : PaginationCommonModel
    {
        /// <summary>
		/// Log ID
		/// </summary>
		[Display(Name = "Log ID")]
        [Required(ErrorMessage = "Enter The Log ID.")]
        public int LogID { get; set; }

        /// <summary>
        /// Transaction Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transaction Date")]
        [Required(ErrorMessage = "Enter The Transaction Date.")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Transaction Date in (yyyy-MM-dd) format.")]
        public string TransactionDate { get; set; }

        /// <summary>
		/// Transaction Type
		/// </summary>
		[Display(Name = "Transaction Type")]
        [Required(ErrorMessage = "Enter The Transaction Type.")]
        public int TransactionType { get; set; }

        /// <summary>
		/// Item ID
		/// </summary>
		[Display(Name = "Item ID")]
        [Required(ErrorMessage = "Enter The Item ID.")]
        public int ItemID { get; set; }

        /// <summary>
        /// Item Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Item Type")]
        [Required(ErrorMessage = "Enter The Item Type.")]
        public string ItemType { get; set; }

        /// <summary>
        /// Item Description
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Item Description")]
        public string ItemDescription { get; set; }

        /// <summary>
        /// Qty Received
        /// </summary>
        [Display(Name = "Qty Received"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Qty Received.")]
        public decimal QtyReceived { get; set; }

        /// <summary>
        /// Qty Issued
        /// </summary>
        [Display(Name = "Qty Issued"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Qty Issued.")]
        public decimal QtyIssued { get; set; }

        /// <summary>
        /// Current Stock
        /// </summary>
        [Display(Name = "Current Stock"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Current Stock.")]
        public decimal CurrentStock { get; set; }

        /// <summary>
		/// Batch ID
		/// </summary>
		[Display(Name = "Batch ID")]
        [Required(ErrorMessage = "Enter The Batch ID.")]
        public int BatchID { get; set; }

        /// <summary>
		/// Location ID
		/// </summary>
		[Display(Name = "Location ID")]
        [Required(ErrorMessage = "Enter The Location ID.")]
        public int LocationID { get; set; }

        /// <summary>
		/// Transaction ID
		/// </summary>
		[Display(Name = "Transaction ID")]
        [Required(ErrorMessage = "Enter The Transaction ID.")]
        public int TransactionID { get; set; }

        /// <summary>
        /// Transaction No
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transaction No")]
        [Required(ErrorMessage = "Enter The Transaction No.")]
        public string TransactionNo { get; set; }

        /// <summary>
        /// Transaction By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transaction By")]
        [Required(ErrorMessage = "Enter The Transaction By.")]
        public string TransactionBy { get; set; }

        /// <summary>
        /// Transaction Details
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transaction Details")]
        public string TransactionDetails { get; set; }

        /// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }

    public class InventoryTransactionLog : InventoryTransactionLogRequestParam
    {
        /// <summary>
        /// Item Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Item Code")]
        public string ItemCode { get; set; }

        /// <summary>
        /// From Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "From Date")]
        public string FromDate { get; set; }

        /// <summary>
        /// To Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "To Date")]
        public string ToDate { get; set; }

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

    public class InventoryTransactionLogProfile : Profile
    {
        public InventoryTransactionLogProfile()
        {
            // Maps InventoryTransactionLogRequestParam -> InventoryTransactionLog
            CreateMap<InventoryTransactionLogRequestParam, InventoryTransactionLog>()
                .ForMember(dest => dest.ItemCode, opt => opt.Ignore())
                .ForMember(dest => dest.FromDate, opt => opt.Ignore())
                .ForMember(dest => dest.ToDate, opt => opt.Ignore())
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }

    public class InventoryTransactionLogSearchListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
        /// Item Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Item Code")]
        public string ItemCode { get; set; }

        /// <summary>
		/// From Date
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "From Date")]
        [Required(ErrorMessage = "Enter The From Date.")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid From Date in (yyyy-MM-dd) Format.")]
        public string FromDate { get; set; }

        /// <summary>
        /// To Date
        /// </summary>s
        [DefaultValue("")]
        [Display(Name = "To Date")]
        [Required(ErrorMessage = "Enter The To Date.")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid To Date in (yyyy-MM-dd) Format.")]
        [DateRangeValidation("FromDate", "yyyy-MM-dd", "To Date Should Be Greater Than From Date.")]
        public string ToDate { get; set; }
    }
}
