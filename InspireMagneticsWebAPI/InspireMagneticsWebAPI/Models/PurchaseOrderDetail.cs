using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class PurchaseOrderDetail
    {
        /// <summary>
		/// Purchase Order Line ID
		/// </summary>
		[Display(Name = "Purchase Order Line ID")]
        [Required(ErrorMessage = "Enter The Purchase Order Line ID.")]
        public int PurchaseOrderLineID { get; set; }

        /// <summary>
		/// Purchase Order ID
		/// </summary>
		[Display(Name = "Purchase Order ID")]
        [Required(ErrorMessage = "Enter The Purchase Order ID.")]
        public int PurchaseOrderID { get; set; }

        /// <summary>
        /// Document IStatus
        /// </summary>
        [Display(Name = "Document IStatus")]
        [Required(ErrorMessage = "Enter The Document IStatus.")]
        public int DocumentIStatus { get; set; }

        /// <summary>
		/// Item ID
		/// </summary>
        [Display(Name = "Item ID")]
        [Required(ErrorMessage = "Enter The Item ID.")]
        public int ItemID { get; set; }

        /// <summary>
        /// Supplier Item Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Supplier Item Code")]
        public string SupplierItemCode { get; set; }

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
        /// Delivery Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Delivery Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Delivery Date in (yyyy-MM-dd HH:mm:ss.fff) format.")]
        [Required(ErrorMessage = "Enter The Delivery Date.")]
        public string DeliveryDate { get; set; }

        /// <summary>
        /// Quantity Delivered
        /// </summary>
        [Display(Name = "Quantity Delivered"), DataType(DataType.Currency)]
        public decimal QuantityDelivered { get; set; }

        /// <summary>
        /// Quantity Accepted
        /// </summary>
        [Display(Name = "Quantity Accepted"), DataType(DataType.Currency)]
        public decimal QuantityAccepted { get; set; }

        /// <summary>
        /// Purchase Order Completed Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Purchase Order Completed Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Purchase Order Completed Date in (yyyy-MM-dd HH:mm:ss.fff) format.")]
        public string PurchaseOrderCompletedDate { get; set; }

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
    }
}
