using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class DeliveryNoteRequestParam : PaginationCommonModel
    {
        /// <summary>
        /// Delivery Note ID
        /// </summary>
        [Display(Name = "Delivery Note ID")]
        [Required(ErrorMessage = "Enter The Delivery Note ID.")]
        public int DeliveryNoteID { get; set; }

        /// <summary>
        /// Delivery Note Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Delivery Note Number")]
        [Required(ErrorMessage = "Enter The Delivery Note Number.")]
        public string DeliveryNoteNo { get; set; }

        /// <summary>
        /// Delivery Note Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Delivery Note Date")]
        [Required(ErrorMessage = "Enter The Delivery Note Date.")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Delivery Note Date in (yyyy-MM-dd) Format.")]
        public string DeliveryNoteDate { get; set; }

        /// <summary>
        ///  Customer ID
        /// </summary>
        [Display(Name = "Customer ID")]
        [Required(ErrorMessage = "Enter The Customer ID.")]
        public int CustomerID { get; set; }

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
        /// Vehicle Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Vehicle Number")]
        public string VehicleNumber { get; set; }

        /// <summary>
        /// Eway Bill Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Eway Bill Number")]
        public string EwayBillNumber { get; set; }

        /// <summary>
        /// GST State Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "GST State Code")]
        public string GSTStateCode { get; set; }

        /// <summary>
        /// Eway Bill Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Eway Bill Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Eway Bill Date in (yyyy-MM-dd) Format.")]
        public string EwayBillDate { get; set; }

        /// <summary>
        /// Eway Bill URL
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Eway Bill URL")]
        public string EwayBillURL { get; set; }

        /// <summary>
        /// Eway Bill Valid Upto
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Eway Bill Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Eway Bill Valid Upto in (yyyy-MM-dd) Format.")]
        public string EwayBillValidUpto { get; set; }

        /// <summary>
		/// Shipment Distance Kilometer
		/// </summary>
		[Display(Name = "Shipment Distance Kilometer")]
        [DataType(DataType.Currency)]
        public decimal ShipmentDistanceKilometer { get; set; }

        /// <summary>
        /// Bill To GSTIN Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "BillTo GSTIN Number")]
        public string BillToGSTINNumber { get; set; }

        /// <summary>
        /// Transporter Name
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transporter Name")]
        public string TransporterName { get; set; }

        /// <summary>
        /// Transporter GSTIN Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transporter GSTIN Number")]
        public string TransporterGSTINNumber { get; set; }

        /// <summary>
        /// ShipTo Trade Name
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "ShipTo Trade Name")]
        public string ShipToTradeName { get; set; }

        /// <summary>
        /// ShipTo GSTIN Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "ShipTo GSTIN Number")]
        public string ShipToGSTINNumber { get; set; }

        /// <summary>
        /// Transaction Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transaction Type")]
        public string TransactionType { get; set; }

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
        /// Document Status
        /// </summary>
        [Display(Name = "Document Status")]
        [Required(ErrorMessage = "Enter The Document Status.")]
        public int DocumentStatus { get; set; }

        /// <summary>
        /// Total IGST Amount
        /// </summary>
        [Display(Name = "Total IGST Amount"), DataType(DataType.Currency)]
        public decimal TotalIGSTAmount { get; set; }

        /// <summary>
        /// Total CGST Amount
        /// </summary>
        [Display(Name = "Total CGST Amount"), DataType(DataType.Currency)]
        public decimal TotalCGSTAmount { get; set; }

        /// <summary>
        /// Total SGST Amount
        /// </summary>
        [Display(Name = "Total SGST Amount"), DataType(DataType.Currency)]
        public decimal TotalSGSTAmount { get; set; }

        /// <summary>
        /// Total Net Amount
        /// </summary>
        [Display(Name = "Total Net Amount"), DataType(DataType.Currency)]
        public decimal TotalNetAmount { get; set; }

        /// <summary>
        /// Delivery Note Amount
        /// </summary>
        [Display(Name = "Delivery Note Amount"), DataType(DataType.Currency)]
        public decimal DeliveryNoteAmount { get; set; }

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
        ///  Delivery Note Detail
        /// </summary>
        public List<DeliveryNoteDetail> DeliveryNoteDetail { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }

    public class DeliveryNoteHeader : DeliveryNoteRequestParam
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
    public class DeliveryNoteProfile : Profile
    {
        public DeliveryNoteProfile()
        {
            // Maps DeliveryNoteRequestParam -> DeliveryNoteHeader
            CreateMap<DeliveryNoteRequestParam, DeliveryNoteHeader>()
                .ForMember(dest => dest.ApprovedBy, opt => opt.Ignore())
                .ForMember(dest => dest.ShortCut, opt => opt.Ignore())
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }
    public class DeliveryNoteDetailsRequestParam : CommonDeliveryNoteDetailsRequestParam
    {
        
    }

    public class DeliveryNoteSearchListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }
    }
    
    public class ApproveDeliveryNoteDetails : CommonDeliveryNoteDetailsRequestParam
    {
        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        [Required(ErrorMessage = "Enter The Approved By.")]
        public string ApprovedBy { get; set; }
    }

    public class ShortCloseDeliveryNoteDetails : CommonDeliveryNoteDetailsRequestParam
    {
        
    }

    public class CommonDeliveryNoteDetailsRequestParam
    {
        /// <summary>
        /// Delivery Note ID
        /// </summary>
        [Display(Name = "Delivery Note ID")]
        [Required(ErrorMessage = "Enter The Delivery Note ID.")]
        public int DeliveryNoteID { get; set; }
    }
}
