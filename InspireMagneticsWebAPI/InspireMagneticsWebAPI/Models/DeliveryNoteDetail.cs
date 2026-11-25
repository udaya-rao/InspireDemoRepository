using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class DeliveryNoteDetail
    {
        /// <summary>
		/// Delivery Note Line ID
		/// </summary>
		[Display(Name = "Delivery Note Line ID")]
        [Required(ErrorMessage = "Enter The Delivery Note Line ID.")]
        public int DeliveryNoteLineID { get; set; }

        /// <summary>
		/// Delivery Note ID
		/// </summary>
		[Display(Name = "Delivery Note ID")]
        [Required(ErrorMessage = "Enter The Delivery Note ID.")]
        public int DeliveryNoteID { get; set; }

        /// <summary>
        /// Document IStatus
        /// </summary>
        [Display(Name = "Document IStatus")]
        [Required(ErrorMessage = "Enter The Document IStatus.")]
        public int DocumentIStatus { get; set; }

        /// <summary>
		/// FG Item ID
		/// </summary>
        [Display(Name = "FG Item ID")]
        [Required(ErrorMessage = "Enter The FG Item ID.")]
        public int FGItemID { get; set; }

        /// <summary>
		/// Order ID
		/// </summary>
        [Display(Name = "Order ID")]
        public int OrderID { get; set; }

        /// <summary>
		/// Order Line ID
		/// </summary>
        [Display(Name = "Order Line ID")]
        public int OrderLineID { get; set; }

        /// <summary>
        /// Customer Item Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Item Code")]
        public string CustomerItemCode { get; set; }

        /// <summary>
		/// Quantity Shipped
		/// </summary>
		[Display(Name = "Quantity Shipped"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Shipped.")]
        public decimal QuantityShipped { get; set; }

        /// <summary>
		/// Unit Rate
		/// </summary>
		[Display(Name = "Unit Rate"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Unit Rate.")]
        public decimal UnitRate { get; set; }

        /// <summary>
        /// HSN Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "HSN Code")]
        public string HSNCode { get; set; }

        /// <summary>
        /// Currency Rate
        /// </summary>
        [Display(Name = "Currency Rate"), DataType(DataType.Currency)]
        public decimal CurrencyRate { get; set; }

        /// <summary>
        /// Delivery Note INotes
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Delivery Note INotes")]
        public string DeliveryNoteINotes { get; set; }

        /// <summary> 
        /// IGST Percentage
        /// </summary>
        [Display(Name = "IGST Percentage")]
        [DataType(DataType.Currency)]
        public decimal IgstPercentage { get; set; }

        /// <summary>
		/// CGST Percentage
		/// </summary>
		[Display(Name = "CGST Percentage")]
        [DataType(DataType.Currency)]
        public decimal CgstPercentage { get; set; }

        /// <summary>
        /// SGST Percentage
        /// </summary>
        [Display(Name = "SGST Percentage")]
        [DataType(DataType.Currency)]
        public decimal SgstPercentage { get; set; }

        /// <summary>
        /// IGST Amount
        /// </summary>
        [Display(Name = "IGST Amount"), DataType(DataType.Currency)]
        public decimal IgstAmount { get; set; }

        /// <summary>
        /// CGST Amount
        /// </summary>
        [Display(Name = "CGST Amount"), DataType(DataType.Currency)]
        public decimal CgstAmount { get; set; }

        /// <summary>
        /// SGST Amount
        /// </summary>
        [Display(Name = "SGST Amount"), DataType(DataType.Currency)]
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
