using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{ 
    public class WorkOrderHeaderRequestParam : PaginationCommonModel
    {
        /// <summary>
		/// Work Order ID
		/// </summary>
		[Display(Name = "Work Order ID")]
        [Required(ErrorMessage = "Enter The Work Order ID.")]
        public int WorkOrderID { get; set; }

        /// <summary>
		/// Work Order Number
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Work Order Number")]
        [Required(ErrorMessage = "Enter The Work Order Number.")]
        public string WorkOrderNumber { get; set; }

        /// <summary>
        /// Work Order Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Work Order Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Work Order Date in (yyyy-MM-dd HH:mm:ss.fff) format.")]
        [Required(ErrorMessage = "Enter The Work Order Date.")]
        public string WorkOrderDate { get; set; }

        /// <summary>
        /// Work Order Type
        /// </summary>
        [Display(Name = "Work Order Type")]
        [Required(ErrorMessage = "Enter The Work Order Type.")]
        public int WorkOrderType { get; set; }

        /// <summary>
		/// Supplier ID
		/// </summary>
		[Display(Name = "Supplier ID")]
        public int SupplierID { get; set; }

        /// <summary>
        /// Document Status
        /// </summary>
        [Display(Name = "Document Status")]
        [Required(ErrorMessage = "Enter The Document Status.")]
        public int DocumentStatus { get; set; }

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
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        public string ApprovedBy { get; set; }

        /// <summary>
        /// Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Remarks")]
        public string Remarks { get; set; }

        /// <summary>
        /// Work Order Detail
        /// </summary>
        public List<WorkOrderDetail> WorkOrderDetail { get; set; }

        /// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }
    public class WorkOrderHeader : WorkOrderHeaderRequestParam
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
    public class WorkOrderProfile : Profile
    {
        public WorkOrderProfile()
        {
            // Maps WorkOrderHeaderRequestParam -> WorkOrderHeader
            CreateMap<WorkOrderHeaderRequestParam, WorkOrderHeader>()
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }
    public class WorkOrderHeaderDetailsRequestParam
    {
        /// <summary>
        /// Work Order ID
        /// </summary>
        [Display(Name = "Work Order ID")]
        [Required(ErrorMessage = "Enter The Work Order ID.")]
        public int WorkOrderID { get; set; }
    }
    public class WorkOrderHeaderSearchListRequestParam : CommonPaginationListRequestParam
    {
    }
    public class ApproveWorkOrderHeaderDetails
    {
        /// <summary>
		/// Work Order ID
		/// </summary>
		[Display(Name = "Work Order ID")]
        [Required(ErrorMessage = "Enter The Work Order ID.")]
        public int WorkOrderID { get; set; }

        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        [Required(ErrorMessage = "Enter The ApprovedBy.")]
        public string ApprovedBy { get; set; }
    }
    public class WorkOrderShortCloseORRecall
    {
        /// <summary>
		/// Work Order ID
		/// </summary>
		[Display(Name = "Work Order ID")]
        [Required(ErrorMessage = "Enter The Work Order ID.")]
        public int WorkOrderID { get; set; }
    }
    public class WorkOrderHeaderPDF
    {
        /// <summary>
		/// Work Order ID
		/// </summary>
		[Display(Name = "Work Order ID")]
        [Required(ErrorMessage = "Enter The Work Order ID.")]
        public int WorkOrderID { get; set; }
    }
}
