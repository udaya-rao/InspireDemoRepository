using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class WorkOrderDetail
    {
        /// <summary>
		/// Work Order Line ID
		/// </summary>
		[Display(Name = "Work Order Line ID")]
        [Required(ErrorMessage = "Enter The Work Order Line ID.")]
        public int WorkOrderLineID { get; set; }

        /// <summary>
		/// Work Order ID
		/// </summary>
		[Display(Name = "Work Order ID")]
        [Required(ErrorMessage = "Enter The Work Order ID.")]
        public int WorkOrderID { get; set; }

        /// <summary>
		/// Customer Order Reference
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Customer Order Reference")]
        public string CustomerOrderReference { get; set; }

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
        [Required(ErrorMessage = "Enter the Item ID.")]
        public int ItemID { get; set; }

        /// <summary>
		/// Parent FG Item ID
		/// </summary>
		[Display(Name = "Parent FG Item ID")]
        public int ParentFGItemID { get; set; } = 0;

        /// <summary>
		/// Item Type
		/// </summary>
        [DefaultValue("")]
        [Display(Name = "Item Type")]
        [Required(ErrorMessage = "Enter The Item Type.")]
        public string ItemType { get; set; }

        /// <summary>
        /// Quantity Ordered
        /// </summary>
        [Display(Name = "Quantity Ordered"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Ordered.")]
        public decimal QuantityOrdered { get; set; }

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
        /// Work Order Completed Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Work Order Completed Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Work Order Completed Date in (yyyy-MM-dd HH:mm:ss.fff) format.")]
        public string WorkOrderCompletedDate { get; set; }

        /// <summary>
		/// BOM ID
		/// </summary>
		[Display(Name = "BOM ID")]
        [Required(ErrorMessage = "Enter The BOM ID.")]
        public int BOMID { get; set; } = 0;
    }
}
