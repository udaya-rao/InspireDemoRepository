using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
    public class QuotationDetail
    {
        /// <summary>
		/// Quotation Line ID
		/// </summary>
		[Display(Name = "Quotation Line ID")]
        [Required(ErrorMessage = "Enter The Quotation Line ID.")]
        public int QuotationLineID { get; set; }

        /// <summary>
		/// Quotation ID
		/// </summary>
		[Display(Name = "Quotation ID")]
        [Required(ErrorMessage = "Enter The Quotation ID.")]
        public int QuotationID { get; set; }

        /// <summary>
        /// Document Status
        /// </summary>
        [Display(Name = "Document Status")]
        [Required(ErrorMessage = "Enter The Document Status.")]
        public int DocumentStatus { get; set; }

        /// <summary>
		/// FG Item ID
		/// </summary>
        [Display(Name = "FG Item ID")]
        [Required(ErrorMessage = "Enter The FG Item ID.")]
        public int FGItemID { get; set; }

        /// <summary>
        /// Customer Item Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Item Code")]
        public string CustomerItemCode { get; set; }

        /// <summary>
        /// Quantity Quoted
        /// </summary>
        [Display(Name = "Quantity Quoted"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Quoted.")]
        public decimal QuantityQuoted { get; set; }

        /// <summary>
        /// Unit Rate
        /// </summary>
        [Display(Name = "Unit Rate"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Unit Rates.")]
        public decimal UnitRate { get; set; }

        /// <summary>
        /// Discount Percent
        /// </summary>
        [Display(Name = "Discount Percent"), DataType(DataType.Currency)]
        public decimal DiscountPercent { get; set; }

        /// <summary>
        /// Delivery Terms
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Delivery Terms")]
        public string DeliveryTerms { get; set; }

        /// <summary>
        /// Quotation INotes
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quotation INotes")]
        public string QuotationINotes { get; set; }

        /// <summary>
        /// Currency Rate
        /// </summary>
        [Display(Name = "Currency Rate"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Currency Rate.")]
        public decimal CurrencyRate { get; set; }

        /// <summary>
		/// Customer Order ID
		/// </summary>
        [Display(Name = "Customer Order ID")]
        public int CustomerOrderID { get; set; }

        /// <summary>
        /// Delivery Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Delivery Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Delivery Date in (yyyy-MM-dd) Format.")]
        public string DeliveryDate { get; set; }

        /// <summary>
        /// Quantity Ordered
        /// </summary>
        [Display(Name = "Quantity Ordered"), DataType(DataType.Currency)]
        public decimal QuantityOrdered { get; set; }

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
        /// Updated By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Updated By")]
        public string UpdatedBy { get; set; }
    }
}
