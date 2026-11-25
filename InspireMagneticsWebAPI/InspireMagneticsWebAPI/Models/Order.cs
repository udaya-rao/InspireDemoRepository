using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class OrderRequestParam : PaginationCommonModel
    {
        /// <summary>
        /// Order ID
        /// </summary>
        [Display(Name = "Order ID")]
        [Required(ErrorMessage = "Enter The Order ID.")]
        public int OrderID { get; set; }

        /// <summary>
        /// Order Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Order Number")]
        [Required(ErrorMessage = "Enter The Order Number.")]
        public string OrderNumber { get; set; }

        /// <summary>
        /// Order Amount
        /// </summary>
        [Display(Name = "Order Amount"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Order Amount.")]
        public decimal OrderAmount { get; set; }

        /// <summary>
        ///  Customer ID
        /// </summary>
        [Display(Name = "Customer ID")]
        [Required(ErrorMessage = "Enter The Customer ID.")]
        public int CustomerID { get; set; }

        /// <summary>
        /// Customer Purchase Order Reference
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Purchase Order Reference")]
        public string CustomerPurchaseOrderReference { get; set; }

        /// <summary>
        /// Customer Purchase Order Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Purchase Order Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Customer Purchase Order Date in (yyyy-MM-dd) Format.")]
        public string CustomerPurchaseOrderDate { get; set; }

        /// <summary>
        /// Customer Billing AddressLine1
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Billing AddressLine1")]
        [Required(ErrorMessage = "Enter The Customer Billing AddressLine1.")]
        public string CustomerBillingAddressLine1 { get; set; }

        /// <summary>
        /// Customer Billing AddressLine2
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Billing AddressLine2")]
        public string CustomerBillingAddressLine2 { get; set; }

        /// <summary>
        /// Customer Billing PinCode
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Billing PinCode")]
        [Required(ErrorMessage = "Enter The Customer Billing PinCode.")]
        [CommonValidation(CustomPropertyName = "CustomerBillingPinCode", ValidationTypePropertyName = "Pincode", ErrorMessage = "Enter The Valid Customer Billing PinCode.")]
        public string CustomerBillingPinCode { get; set; }

        /// <summary>
        /// Customer Shipping AddressLine1
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Shipping AddressLine1")]
        [Required(ErrorMessage = "Enter The Customer Shipping AddressLine1.")]
        public string CustomerShippingAddressLine1 { get; set; }

        /// <summary>
        /// Customer Shipping AddressLine2
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Shipping AddressLine2")]
        public string CustomerShippingAddressLine2 { get; set; }

        /// <summary>
        /// Customer Shipping PinCode
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Shipping PinCode")]
        [Required(ErrorMessage = "Enter The Customer Shipping PinCode.")]
        [CommonValidation(CustomPropertyName = "CustomerShippingPinCode", ValidationTypePropertyName = "Pincode", ErrorMessage = "Enter The Valid Customer Shipping PinCode.")]
        public string CustomerShippingPinCode { get; set; }

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
        /// Order Notes
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Order Notes")]
        public string OrderNotes { get; set; }

        /// <summary>
        /// Document Status
        /// </summary>
        [Display(Name = "Document Status")]
        [Required(ErrorMessage = "Enter The Document Status.")]
        public int DocumentStatus { get; set; }

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
        ///  Order Detail
        /// </summary>
        public List<OrderDetail> OrderDetail { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }
    public class Order : OrderRequestParam
    {
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
    public class OrderProfile : Profile
    {
        public OrderProfile()
        {
            // Maps OrderRequestParam -> Order
            CreateMap<OrderRequestParam, Order>()
                .ForMember(dest => dest.ApprovedBy, opt => opt.Ignore())
                .ForMember(dest => dest.ShortCut, opt => opt.Ignore())
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }
    public class OrderDetailsRequestParam
    {
        /// <summary>
        ///  Order ID
        /// </summary>
        [Display(Name = " Order ID")]
        [Required(ErrorMessage = "Enter The  Order ID.")]
        public int OrderID { get; set; }
    }
    public class OrderSearchListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }
    }
    public class OrderShortCloseORRecall
    {
        /// <summary>
        ///  Order ID
        /// </summary>
        [Display(Name = " Order ID")]
        [Required(ErrorMessage = "Enter The  Order ID.")]
        public int OrderID { get; set; }
    }
    public class OrderApproveDetails
    {
        /// <summary>
        ///  Order ID
        /// </summary>
        [Display(Name = " Order ID")]
        [Required(ErrorMessage = "Enter The  Order ID.")]
        public int OrderID { get; set; }

        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        [Required(ErrorMessage = "Enter The ApprovedBy.")]
        public string ApprovedBy { get; set; }
    }
    
}
