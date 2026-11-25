using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
    public class OrderDetail
    {
        /// <summary>
		/// Order Line ID
		/// </summary>
		[Display(Name = "Order Line ID")]
        [Required(ErrorMessage = "Enter The Order Line ID.")]
        public int OrderLineID { get; set; }

        /// <summary>
		/// Order ID
		/// </summary>
		[Display(Name = "Order ID")]
        [Required(ErrorMessage = "Enter The Order ID.")]
        public int OrderID { get; set; }

        /// <summary>
        /// Document Status
        /// </summary>
        [Display(Name = "Document Status")]
        [Required(ErrorMessage = "Enter The Document Status.")]
        public int DocumentIStatus { get; set; }

        /// <summary>
		/// FG Item ID
		/// </summary>
        [Display(Name = "FG Item ID")]
        [Required(ErrorMessage = "Enter The FG Item ID.")]
        public int FGItemID { get; set; }

        /// <summary>
		/// Quotation ID
		/// </summary>
		[Display(Name = "Quotation ID")]
        public int QuotationID { get; set; }

        /// <summary>
		/// Quotation Line ID
		/// </summary>
		[Display(Name = "Quotation Line ID")]
        public int QuotationLineID { get; set; }

        /// <summary>
        /// Customer Item Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Item Code")]
        public string CustomerItemCode { get; set; }

        /// <summary>
        /// Quantity Ordered
        /// </summary>
        [Display(Name = "Quantity Ordered"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Ordered.")]
        public decimal QuantityOrdered { get; set; }

        /// <summary>
        /// Unit Rate
        /// </summary>
        [Display(Name = "Unit Rate"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Unit Rate.")]
        public decimal UnitRate { get; set; }

        /// <summary>
        /// Discount Percentage
        /// </summary>
        [Display(Name = "Discount Percentage"), DataType(DataType.Currency)]
        public decimal DiscountPercentage { get; set; }

        /// <summary>
        /// Delivery Terms
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Delivery Terms")]
        public string DeliveryTerms { get; set; }

        /// <summary>
        /// Delivery Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Delivery Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Delivery Date in (yyyy-MM-dd) Format.")]
        public string DeliveryDate { get; set; }

        /// <summary>
        /// Order INotes
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Order INotes")]
        public string OrderINotes { get; set; }

        /// <summary>
        /// Currency Rate
        /// </summary>
        [Display(Name = "Currency Rate"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Currency Rate.")]
        public decimal CurrencyRate { get; set; }

        /// <summary>
        /// Igst Percentage
        /// </summary>
        [Display(Name = "Igst Percentage"), DataType(DataType.Currency)]
        public decimal IgstPercentage { get; set; }

        /// <summary>
        /// Cgst Percentage
        /// </summary>
        [Display(Name = "Cgst Percentage"), DataType(DataType.Currency)]
        public decimal CgstPercentage { get; set; }

        /// <summary>
        /// Sgst Percentage
        /// </summary>
        [Display(Name = "Sgst Percentage"), DataType(DataType.Currency)]
        public decimal SgstPercentage { get; set; }

        /// <summary>
        /// Igst Amount
        /// </summary>
        [Display(Name = "Igst Amount"), DataType(DataType.Currency)]
        public decimal IgstAmount { get; set; }

        /// <summary>
        /// Cgst Amount
        /// </summary>
        [Display(Name = "Cgst Amount"), DataType(DataType.Currency)]
        public decimal CgstAmount { get; set; }

        /// <summary>
        /// Sgst Amount
        /// </summary>
        [Display(Name = "Sgst Amount"), DataType(DataType.Currency)]
        public decimal SgstAmount { get; set; }

        /// <summary>
        /// Net Amount
        /// </summary>
        [Display(Name = "Net Amount"), DataType(DataType.Currency)]
        public decimal NetAmount { get; set; }

        /// <summary>
        /// Updated By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Updated By")]
        public string UpdatedBy { get; set; }
    }
}
