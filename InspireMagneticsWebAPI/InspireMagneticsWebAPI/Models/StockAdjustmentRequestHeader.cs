using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using CommonLib.Constants;

namespace InspireMagneticsWebAPI.Models
{
    public class StockAdjustmentRequestHeaderParam : PaginationCommonModel
    {
        /// <summary>
        /// Adjustment ID
        /// </summary>
        [Display(Name = "Adjustment ID")]
        [Required(ErrorMessage = "Enter The Adjustment ID.")]
        public int AdjustmentID { get; set; }

        /// <summary>
        /// Adjustment Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Adjustment Number")]
        [Required(ErrorMessage = "Enter The Adjustment Number.")]
        public string AdjustmentNumber { get; set; }

        /// <summary>
        /// From Location ID
        /// </summary>
        [Display(Name = "From Location ID")]
        public int FromLocationID { get; set; }

        /// <summary>
        /// To Location ID
        /// </summary>
        [Display(Name = "To Location ID")]
        public int ToLocationID { get; set; }

        /// <summary>
        /// Adjustment Type
        /// </summary>
        [Display(Name = "Adjustment Type")]
        [Required(ErrorMessage = "Enter The Adjustment Type.")]
        public int AdjustmentType { get; set; }

        /// <summary>
        /// Adjustment Reason ID
        /// </summary>
        [Display(Name = "Adjustment Reason ID")]
        [Required(ErrorMessage = "Enter The Adjustment Reason ID.")]
        public int AdjustmentReasonID { get; set; }

        /// <summary>
        /// Request Status
        /// </summary>
        [Display(Name = "Request Status")]
        [Required(ErrorMessage = "Enter The Request Status.")]
        public int RequestStatus { get; set; }

        /// <summary>
        /// Requested By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Requested By")]
        [Required(ErrorMessage = "Enter The Requested By.")]
        public string RequestedBy { get; set; }

        /// <summary>
        /// Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Remarks")]
        public string Remarks { get; set; }

        /// <summary>
        /// Stock Adjustment Request Detail
        /// </summary>
        public List<StockAdjustmentRequestDetail> StockAdjustmentRequestDetail { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD)")]
        public string ParamType { get; set; }
    }
    public class StockAdjustmentRequestHeader : StockAdjustmentRequestHeaderParam
    {
        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }

        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        public string ApprovedBy { get; set; }

        /// <summary>
        /// Cancelled By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Cancelled By")]
        public string CancelledBy { get; set; }

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
    public class StockAdjustmentRequestProfile : Profile
    {
        public StockAdjustmentRequestProfile()
        {
            // Maps StockAdjustmentRequestHeaderParam -> StockAdjustmentRequestHeader
            CreateMap<StockAdjustmentRequestHeaderParam, StockAdjustmentRequestHeader>()
                .ForMember(dest => dest.ApprovedBy, opt => opt.Ignore())
                .ForMember(dest => dest.CancelledBy, opt => opt.Ignore())
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }

    public class StockAdjustmentRequestHeaderSearchListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }
    }

    public class StockAdjustmentRequestHeaderDetailsRequestParam
    {
        /// <summary>
        /// Adjustment ID
        /// </summary>
        [Display(Name = "Adjustment ID")]
        [Required(ErrorMessage = "Enter The Adjustment ID.")]
        public int AdjustmentID { get; set; }
    }

    public class ApproveStockAdjustmentRequestDetailsRequestParam : StockAdjustmentRequestHeaderDetailsRequestParam
    {
        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        [Required(ErrorMessage = "Enter The Approved By.")]
        public string ApprovedBy { get; set; }
    }

    public class CancelStockAdjustmentRequestDetailsRequestParam : StockAdjustmentRequestHeaderDetailsRequestParam
    {
        /// <summary>
        /// Cancelled By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Cancelled By")]
        [Required(ErrorMessage = "Enter The Cancelled By.")]
        public string CancelledBy { get; set; }
    }
}
