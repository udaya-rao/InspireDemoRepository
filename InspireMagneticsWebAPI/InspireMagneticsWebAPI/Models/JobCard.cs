using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class JobCardRequestParam : PaginationCommonModel
    {
        /// <summary>
		/// Job Card ID
		/// </summary>
		[Display(Name = "Job Card ID")]
        [Required(ErrorMessage = "Enter the Job Card ID.")]
        public int JobCardID { get; set; }

        /// <summary>
        /// Job Card Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Job Card Number")]
        [Required(ErrorMessage = "Enter The Job Card Number.")]
        public string JobCardNumber { get; set; }

        /// <summary>
		/// Work Order Line ID
		/// </summary>
		[Display(Name = "Work Order Line ID")]
        [Required(ErrorMessage = "Enter The Work Order Line ID.")]
        public int WorkOrderLineID { get; set; }

        /// <summary>
		/// Operation ID
		/// </summary>
		[Display(Name = "Operation ID")]
        [Required(ErrorMessage = "Enter The Operation ID.")]
        public int OperationID { get; set; }

        /// <summary>
		/// Operation Sequence
		/// </summary>
		[Display(Name = "Operation Sequence")]
        [Required(ErrorMessage = "Enter The Operation Sequence.")]
        public int OperationSequence { get; set; }

        /// <summary>
		/// Quantity Planned
		/// </summary>
		[Display(Name = "Quantity Planned"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Planned.")]
        public decimal QuantityPlanned { get; set; }

        /// <summary>
        /// Quantity Input
        /// </summary>
        [Display(Name = "Quantity Input"), DataType(DataType.Currency)]
        public decimal QuantityInput { get; set; }

        /// <summary>
        /// Quantity Output
        /// </summary>
        [Display(Name = "Quantity Output"), DataType(DataType.Currency)]
        public decimal QuantityOutput { get; set; }

        /// <summary>
        /// Quantity Scrapped
        /// </summary>
        [Display(Name = "Quantity Scrapped"), DataType(DataType.Currency)]
        public decimal QuantityScrapped { get; set; }

        /// <summary>
		/// Production Cycle
		/// </summary>
		[Display(Name = "Production Cycle")]
        [Required(ErrorMessage = "Enter The Production Cycle.")]
        public int ProductionCycle { get; set; }

        /// <summary>
		/// Operation Status
		/// </summary>
		[Display(Name = "Operation Status")]
        [Required(ErrorMessage = "Enter The Operation Status.")]
        public int OperationStatus { get; set; }

        /// <summary>
		/// Start Time
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Start Time")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Start Time in (yyyy-MM-dd HH:mm:ss) Format.")]
        public string StartTime { get; set; }

        /// <summary>
		/// End Time
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "End Time")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid End Time in (yyyy-MM-dd HH:mm:ss) Format.")]
        [DateTimeRangeValidation("StartTime", "yyyy-MM-dd HH:mm:ss", "End Time Should Be Greater Than Start Time.")]
        public string EndTime { get; set; }

        /// <summary>
		/// Responsible Person ID
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Responsible Person ID")]
        public string ResponsiblePersonID { get; set; }

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
		/// Work Order ID
		/// </summary>
		[Display(Name = "Work Order ID")]
        public int WorkOrderID { get; set; }

        /// <summary>
		/// Item ID
		/// </summary>
		[Display(Name = "Item ID")]
        public int ItemID { get; set; }

        /// <summary>
        /// Item Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Item Type")]
        public string ItemType { get; set; }

        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }

        /// <summary>
        /// Login ID
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Login ID")]
        public string LoginID { get; set; }

        /// <summary>
		/// Quantity Copper Scrapped
		/// </summary>
		[Display(Name = "Quantity Copper Scrapped"), DataType(DataType.Currency)]
        public decimal QuantityCopperScrapped { get; set; }

        /// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }
    public class JobCardDetailsRequestParam
    {
        /// <summary>
		/// Work Order Line ID
		/// </summary>
		[Display(Name = "Work Order Line ID")]
        [Required(ErrorMessage = "Enter The Work Order Line ID.")]
        public int WorkOrderLineID { get; set; }

        /// <summary>
		/// Job Card ID
		/// </summary>
		[Display(Name = "Job Card ID")]
        [Required(ErrorMessage = "Enter the Job Card ID.")]
        public int JobCardID { get; set; }
    }
    public class JobCard : JobCardRequestParam
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
    public class JobCardProfile : Profile
    {
        public JobCardProfile()
        {
            // Maps JobCardRequestParam -> JobCard
            CreateMap<JobCardRequestParam, JobCard>()
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }
    public class SearchJobCardListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }
    }
    public class SearchLoggedInPersonJobCardListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }

        /// <summary>
        /// Login ID
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Login ID")]
        public string LoginID { get; set; }
    }
    public class JobCardListByWorkOrderRequestParam
    {
        /// <summary>
		/// Work Order ID
		/// </summary>
		[Display(Name = "Work Order ID")]
        [Required(ErrorMessage = "Enter The Work Order ID.")]
        public int WorkOrderID { get; set; }
    }
}
