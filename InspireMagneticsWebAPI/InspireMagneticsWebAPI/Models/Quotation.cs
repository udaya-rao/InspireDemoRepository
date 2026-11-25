using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
    public class QuotationRequestParam : PaginationCommonModel
    {
        /// <summary>
        /// Quotation ID
        /// </summary>
        [Display(Name = "Quotation ID")]
        [Required(ErrorMessage = "Enter The Quotation ID.")]
        public int QuotationID { get; set; }

        /// <summary>
        /// Quotation Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quotation Number")]
        [Required(ErrorMessage = "Enter The Quotation Number.")]
        public string QuotationNumber { get; set; }

        /// <summary>
        /// Quotation Amount
        /// </summary>
        [Display(Name = "Quotation Amount"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quotation Amount.")]
        public decimal QuotationAmount { get; set; }

        /// <summary>
        /// Other Reference
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Other Reference")]
        public string OtherReference { get; set; }

        /// <summary>
        /// Customer ID
        /// </summary>
        [Display(Name = "Customer ID")]
        [Required(ErrorMessage = "Enter The Customer ID.")]
        public int CustomerID { get; set; }

        /// <summary>
        /// Customer Enquiry Reference
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Enquiry Reference")]
        public string CustomerEnquiryReference { get; set; }

        /// <summary>
        /// Customer Enquiry Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Enquiry Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Customer Enquiry Date in (yyyy-MM-dd) Format.")]
        public string CustomerEnquiryDate { get; set; }

        /// <summary>
        /// Customer Required Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Required Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Customer Required Date in (yyyy-MM-dd) Format.")]
        public string CustomerRequiredDate { get; set; }

        /// <summary>
        /// Price Scope
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Price Scope")]
        public string PriceScope { get; set; }

        /// <summary>
        /// Currency ID
        /// </summary>
        [Display(Name = "Currency ID")]
        [Required(ErrorMessage = "Enter The Currency ID.")]
        public int CurrencyID { get; set; }

        /// <summary>
        /// Kind Attention Name
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Kind Attention Name")]
        [Required(ErrorMessage = "Enter The Kind Attention Name.")]
        public string KindAttentionName { get; set; }

        /// <summary>
        /// Contact Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Contact Number")]
        public string ContactNumber { get; set; }

        /// <summary>
        /// Quotation Notes
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quotation Notes")]
        public string QuotationNotes { get; set; }

        /// <summary>
        /// Quotation Validity Days
        /// </summary>
        [Display(Name = "Quotation Validity Days")]
        public int QuotationValidityDays { get; set; }

        /// <summary>
        /// Document Status
        /// </summary>
        [Display(Name = "Document Status")]
        [Required(ErrorMessage = "Enter The Document Status.")]
        public int DocumentStatus { get; set; }

        /// <summary>
        /// Followup Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Followup Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Followup Date in (yyyy-MM-dd) Format.")]
        public string FollowupDate { get; set; }

        /// <summary>
        /// Document Delivery Mode
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Document Delivery Mode")]
        public string DocumentDeliveryMode { get; set; }

        /// <summary>
        /// Transport Mode
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transport Mode")]
        public string TransportMode { get; set; }

        /// <summary>
        /// Payment Terms
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Payment Terms")]
        public string PaymentTerms { get; set; }

        /// <summary>
        /// Freight Terms
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Freight Terms")]
        public string FreightTerms { get; set; }

        /// <summary>
        /// Insurance Terms
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Insurance Terms")]
        public string InsuranceTerms { get; set; }

        /// <summary>
        /// Total Net Amount
        /// </summary>
        [Display(Name = "Total Net Amount"), DataType(DataType.Currency)]
        public decimal TotalNetAmount { get; set; }

        /// <summary>
        /// Total Igst Amount
        /// </summary>
        [Display(Name = "Total Igst Amount"), DataType(DataType.Currency)]
        public decimal TotalIgstAmount { get; set; }

        /// <summary>
        /// Total Cgst Amount
        /// </summary>
        [Display(Name = "Total Cgst Amount"), DataType(DataType.Currency)]
        public decimal TotalCgstAmount { get; set; }

        /// <summary>
        /// Total Sgst Amount
        /// </summary>
        [Display(Name = "Total Sgst Amount"), DataType(DataType.Currency)]
        public decimal TotalSgstAmount { get; set; }

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
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }

        /// <summary>
        /// Quotation Detail
        /// </summary>
        public List<QuotationDetail> QuotationDetail { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }
    public class Quotation : QuotationRequestParam
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
    public class QuotationProfile : Profile
    {
        public QuotationProfile()
        {
            // Maps QuotationRequestParam -> Quotation
            CreateMap<QuotationRequestParam, Quotation>()
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }

    public class QuotationDetailsRequestParam
    {
        /// <summary>
        /// Quotation ID
        /// </summary>
        [Display(Name = "Quotation ID")]
        [Required(ErrorMessage = "Enter The Quotation ID.")]
        public int QuotationID { get; set; }
    }

    public class QuotationSearchListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }
    }

    public class QuotationShortCloseORRecall
    {
        /// <summary>
        /// Quotation ID
        /// </summary>
        [Display(Name = "Quotation ID")]
        [Required(ErrorMessage = "Enter The Quotation ID.")]
        public int QuotationID { get; set; }
    }
    public class QuotationApproveDetails
    {
        /// <summary>
        /// Quotation ID
        /// </summary>
        [Display(Name = "Quotation ID")]
        [Required(ErrorMessage = "Enter The Quotation ID.")]
        public int QuotationID { get; set; }

        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        [Required(ErrorMessage = "Enter The ApprovedBy.")]
        public string ApprovedBy { get; set; }
    }

    public class QuotationHeaderPDF
    {
        /// <summary>
        /// Quotation ID
        /// </summary>
        [Display(Name = "Quotation ID")]
        [Required(ErrorMessage = "Enter The Quotation ID.")]
        public int QuotationID { get; set; }
    }
}
