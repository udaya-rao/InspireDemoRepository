using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
    public class InspectionRequestParam : PaginationCommonModel
    {
        /// <summary>
        /// Inspection Header ID
        /// </summary>
        [Display(Name = "Inspection Header ID")]
        [Required(ErrorMessage = "Enter The Inspection Header ID.")]
        public int InspectionHeaderID { get; set; }

        /// <summary>
        /// GRN Line ID
        /// </summary>
        [Display(Name = "GRN Line ID")]
        [Required(ErrorMessage = "Enter The GRN Line ID.")]
        public int GRNLineID { get; set; }

        /// <summary>
        /// GRN ID
        /// </summary>
        [Display(Name = "GRN ID")]
        [Required(ErrorMessage = "Enter The GRN ID.")]
        public int GRNID { get; set; }

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
        /// Batch No
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Batch No")]
        [Required(ErrorMessage = "Enter The Batch No.")]
        public string BatchNo { get; set; }

        /// <summary>
        /// Quantity Offered For Inspection
        /// </summary>
        [Display(Name = "Quantity Offered For Inspection"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Offered For Inspection.")]
        public decimal QuantityOfferedForInspection { get; set; }

        /// <summary>
        /// Quantity Rejected
        /// </summary>
        [Display(Name = "Quantity Rejected"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Rejected.")]
        public decimal QuantityRejected { get; set; }

        /// <summary>
        /// Quantity Rejected
        /// </summary>
        [Display(Name = "Quantity Rejected"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Rejected.")]
        public decimal QuantityAccepted { get; set; }

        /// <summary>
        /// Quantity Testing Rejected
        /// </summary>
        [Display(Name = "Quantity Testing Rejected"), DataType(DataType.Currency)]
        public decimal QuantityTestingRejected { get; set; }

        /// <summary>
        /// Quantity Rejected Reason
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quantity Rejected Reason")]
        public string QuantityRejectedReason { get; set; }

        /// <summary>
        /// QA Status
        /// </summary>
        [Display(Name = "QA Status")]
        [Required(ErrorMessage = "Enter The QA Status.")]
        public int QAStatus { get; set; }

        /// <summary>
        /// QA Checked By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "QA Checked By")]
        public string QACheckedBy { get; set; }

        /// <summary>
        /// QA Checked Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "QA Checked Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid QA Checked Date in (yyyy-MM-dd) Format.")]
        public string QACheckedDate { get; set; }

        /// <summary>
        /// QA Notes
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "QA Notes")]
        public string QANotes { get; set; }

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
        /// Inspection Detail
        /// </summary>
        public List<InspectionDetail> InspectionDetail { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }
    public class InspectionHeader : InspectionRequestParam
    {
        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        public string ApprovedBy { get; set; }

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
    public class InspectionProfile : Profile
    {
        public InspectionProfile()
        {
            // Maps InspectionRequestParam -> InspectionHeader
            CreateMap<InspectionRequestParam, InspectionHeader>()
                .ForMember(dest => dest.ApprovedBy, opt => opt.Ignore())
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }

    public class InspectionDetailsRequestParam
    {
        /// <summary>
        /// Inspection Header ID
        /// </summary>
        [Display(Name = "Inspection Header ID")]
        [Required(ErrorMessage = "Enter The Inspection Header ID.")]
        public int InspectionHeaderID { get; set; }

        /// <summary>
        /// GRN Line ID
        /// </summary>
        [Display(Name = "GRN Line ID")]
        [Required(ErrorMessage = "Enter The GRN Line ID.")]
        public int GRNLineID { get; set; }
    }

    public class ApproveInspectionDetailsRequestParam
    {
        /// <summary>
        /// Inspection Header ID
        /// </summary>
        [Display(Name = "Inspection Header ID")]
        [Required(ErrorMessage = "Enter The Inspection Header ID.")]
        public int InspectionHeaderID { get; set; }

        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        [Required(ErrorMessage = "Enter The Approved By.")]
        public string ApprovedBy { get; set; }
    }
}
