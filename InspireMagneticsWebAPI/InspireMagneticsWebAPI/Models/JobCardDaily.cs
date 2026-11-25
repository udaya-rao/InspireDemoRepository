using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class JobCardDailyRequestParam : PaginationCommonModel
    {
        /// <summary>
		/// Job Card Daily ID
		/// </summary>
		[Display(Name = "Job Card Daily ID")]
        [Required(ErrorMessage = "Enter the Job Card Daily ID.")]
        public int JobCardDailyID { get; set; }

        /// <summary>
        /// Job Card Daily Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Job Card Daily Number")]
        [Required(ErrorMessage = "Enter The Job Card Daily Number.")]
        public string JobCardDailyNumber { get; set; }

        /// <summary>
		/// Job Card ID
		/// </summary>
		[Display(Name = "Job Card ID")]
        [Required(ErrorMessage = "Enter the Job Card ID.")]
        public int JobCardID { get; set; }

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
		/// Remarks
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Remarks")]
        public string Remarks { get; set; }

        /// <summary>
		/// Prepared By
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Prepared By")]
        [Required(ErrorMessage = "Enter the Prepared By.")]
        public string PreparedBy { get; set; }

        /// <summary>
		/// Responsible Person ID
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Responsible Person ID")]
        public string ResponsiblePersonID { get; set; }

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
		/// Job Start Time
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Job Start Time")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Job Start Time in (yyyy-MM-dd HH:mm:ss) Format.")]
        public string JobStartTime { get; set; }

        /// <summary>
		/// Job End Time
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Job End Time")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Job End Time in (yyyy-MM-dd HH:mm:ss) Format.")]
        [DateTimeRangeValidation("JobStartTime", "yyyy-MM-dd HH:mm:ss", "End Time Should Be Greater Than Job Start Time.")]
        public string JobEndTime { get; set; }

        /// <summary>
        /// Operation ID
        /// </summary>
        [Display(Name = "Operation ID")]
        public int OperationID { get; set; }

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
        /// Quantity Copper Scrapped
        /// </summary>
        [Display(Name = "Quantity Copper Scrapped"), DataType(DataType.Currency)]
        public decimal QuantityCopperScrapped { get; set; }

        /// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD)")]
        public string ParamType { get; set; }
    }
    public class JobCardDailyDetailsRequestParam
    {
        /// <summary>
		/// Job Card Daily ID
		/// </summary>
		[Display(Name = "Job Card Daily ID")]
        [Required(ErrorMessage = "Enter the Job Card Daily ID.")]
        public int JobCardDailyID { get; set; }
    }
    public class JobCardDaily : JobCardDailyRequestParam
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
    public class JobCardDailyProfile : Profile
    {
        public JobCardDailyProfile()
        {
            // Maps JobCardDailyRequestParam -> JobCardDaily
            CreateMap<JobCardDailyRequestParam, JobCardDaily>()
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }
    public class SearchJobCardDailyListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
		/// Job Card ID
		/// </summary>
		[Display(Name = "Job Card ID")]
        [Required(ErrorMessage = "Enter the Job Card ID.")]
        public int JobCardID { get; set; }
    }
}
