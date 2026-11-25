using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class PurchaseOrderHeaderRequestParam : PaginationCommonModel
    {
        /// <summary>
		/// Purchase Order ID
		/// </summary>
		[Display(Name = "Purchase Order ID")]
        [Required(ErrorMessage = "Enter The Purchase Order ID.")]
        public int PurchaseOrderID { get; set; }

        /// <summary>
        /// Purchase Order Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Purchase Order Number")]
        [Required(ErrorMessage = "Enter The Purchase Order Number.")]
        public string PurchaseOrderNumber { get; set; }

        /// <summary>
        /// Purchase Type
        /// </summary>
        [Display(Name = "Purchase Type")]
        [Required(ErrorMessage = "Enter The Purchase Type.")]
        public int PurchaseType { get; set; }

        /// <summary>
		/// Purchase Order Date
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Purchase Order Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Purchase Order Date in (yyyy-MM-dd HH:mm:ss) Format.")]
        public string PurchaseOrderDate { get; set; }

        /// <summary>
        /// Currency ID
        /// </summary>
        [Display(Name = "Currency ID")]
        [Required(ErrorMessage = "Enter The Currency ID.")]
        public int CurrencyID { get; set; }

        /// <summary>
        /// Currency Conversion Rate
        /// </summary>
        [Display(Name = "Currency Conversion Rate"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Currency Conversion Rate.")]
        public decimal CurrencyConversionRate { get; set; }

        /// <summary>
		/// Supplier ID
		/// </summary>
		[Display(Name = "Supplier ID")]
        public int SupplierID { get; set; }

        /// <summary>
        /// Gross Purchase Amount
        /// </summary>
        [Display(Name = "Gross Purchase Amount"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Gross Purchase Amount.")]
        public decimal GrossPurchaseAmount { get; set; }

        /// <summary>
        /// Freight Amount
        /// </summary>
        [Display(Name = "Freight Amount"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Freight Amount.")]
        public decimal FreightAmount { get; set; }

        /// <summary>
		/// Price Scope
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Price Scope")]
        public string PriceScope { get; set; }

        /// <summary>
        /// Transport Terms
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transport Terms")]
        public string TransportTerms { get; set; }

        /// <summary>
        /// Insurance Terms
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Insurance Terms")]
        public string InsuranceTerms { get; set; }

        /// <summary>
        /// Document Status
        /// </summary>
        [Display(Name = "Document Status")]
        [Required(ErrorMessage = "Enter The Document Status.")]
        public int DocumentStatus { get; set; }

        /// <summary>
        /// Customer Reference Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Reference Number")]
        public string CustomerReferenceNumber { get; set; }

        /// <summary>
        /// Customer Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Customer Date in (yyyy-MM-dd) format.")]
        public string CustomerDate { get; set; }

        /// <summary>
        /// Other Reference
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Other Reference")]
        public string OtherReference { get; set; }

        /// <summary>
        /// Total IGST Amount
        /// </summary>
        [Display(Name = "Total IGST Amount"), DataType(DataType.Currency)]
        public decimal TotalIgstAmount { get; set; }

        /// <summary>
        /// Total CGST Amount
        /// </summary>
        [Display(Name = "Total CGST Amount"), DataType(DataType.Currency)]
        public decimal TotalCgstAmount { get; set; }

        /// <summary>
        /// Total SGST Amount
        /// </summary>
        [Display(Name = "Total SGST Amount"), DataType(DataType.Currency)]
        public decimal TotalSgstAmount { get; set; }

        /// <summary>
        /// Total Net Amount
        /// </summary>
        [Display(Name = "Total Net Amount"), DataType(DataType.Currency)]
        public decimal TotalNetAmount { get; set; }

        /// <summary>
        /// Responsible Person
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Responsible Person")]
        public string ResponsiblePerson { get; set; }

        /// <summary>
        /// Ship Address
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Ship Address")]
        public string ShipAddress { get; set; }

        /// <summary>
        /// Delivery Information
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Delivery Information")]
        public string DeliveryInformation { get; set; }

        /// <summary>
        /// Payment Information
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Payment Information")]
        public string PaymentInformation { get; set; }

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
        /// Purchase Order Detail
        /// </summary>
        public List<PurchaseOrderDetail> PurchaseOrderDetail { get; set; }

        /// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }
    public class PurchaseOrderHeader : PurchaseOrderHeaderRequestParam
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
    public class PurchaseOrderProfile : Profile
    {
        public PurchaseOrderProfile()
        {
            // Maps PurchaseOrderHeaderRequestParam -> PurchaseOrderHeader
            CreateMap<PurchaseOrderHeaderRequestParam, PurchaseOrderHeader>()
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }
    public class PurchaseOrderHeaderDetailsRequestParam
    {
        /// <summary>
		/// Purchase Order ID
		/// </summary>
		[Display(Name = "Purchase Order ID")]
        [Required(ErrorMessage = "Enter The Purchase Order ID.")]
        public int PurchaseOrderID { get; set; }
    }
    public class PurchaseOrderHeaderSearchListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }
    }
    public class PurchaseOrderShortCloseORRecall
    {
        /// <summary>
		/// Purchase Order ID
		/// </summary>
		[Display(Name = "Purchase Order ID")]
        [Required(ErrorMessage = "Enter The Purchase Order ID.")]
        public int PurchaseOrderID { get; set; }
    }
    public class PurchaseOrderHeaderApproveDetails
    {
        /// <summary>
		/// Purchase Order ID
		/// </summary>
		[Display(Name = "Purchase Order ID")]
        [Required(ErrorMessage = "Enter The Purchase Order ID.")]
        public int PurchaseOrderID { get; set; }

        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        [Required(ErrorMessage = "Enter The ApprovedBy.")]
        public string ApprovedBy { get; set; }
    }
    public class PurchaseOrderHeaderPDF
    {
        /// <summary>
		/// Purchase Order ID
		/// </summary>
		[Display(Name = "Purchase Order ID")]
        [Required(ErrorMessage = "Enter The Purchase Order ID.")]
        public int PurchaseOrderID { get; set; }
    }
}
