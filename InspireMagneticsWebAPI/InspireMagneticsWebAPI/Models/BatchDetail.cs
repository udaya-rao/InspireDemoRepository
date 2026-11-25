using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
    public class BatchDetail
    {
        /// <summary>
		/// Batch Line ID
		/// </summary>
		[Display(Name = "Batch Line ID")]
        [Required(ErrorMessage = "Enter The Batch Line ID.")]
        public int BatchLineID { get; set; }

        /// <summary>
		/// Work Order ID
		/// </summary>
		[Display(Name = "Work Order ID")]
        public int WorkOrderID { get; set; }

        /// <summary>
		/// Work Order Line ID
		/// </summary>
		[Display(Name = "Work Order Line ID")]
        public int WorkOrderLineID { get; set; }

        /// <summary>
		/// Job Card ID
		/// </summary>
		[Display(Name = "Job Card ID")]
        public int JobCardID { get; set; }

        /// <summary>
		/// Purchase Order ID
		/// </summary>
		[Display(Name = "Purchase Order ID")]
        public int PurchaseOrderID { get; set; }

        /// <summary>
		/// Purchase Order Line ID
		/// </summary>
		[Display(Name = "Purchase Order Line ID")]
        public int PurchaseOrderLineID { get; set; }

        /// <summary>
		/// GRN ID
		/// </summary>
		[Display(Name = "GRN ID")]
        public int GRNID { get; set; }

        /// <summary>
		/// GRN Line ID
		/// </summary>
		[Display(Name = "GRN Line ID")]
        public int GRNLineID { get; set; }

        /// <summary>
		/// Delivery Note ID
		/// </summary>
		[Display(Name = "Delivery Note ID")]
        public int DeliveryNoteID { get; set; }

        /// <summary>
		/// Delivery Note Line ID
		/// </summary>
		[Display(Name = "Delivery Note Line ID")]
        public int DeliveryNoteLineID { get; set; }

        /// <summary>
        /// Transaction Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transaction Date")]
        [Required(ErrorMessage = "Enter The Transaction Date.")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid Transaction Date in (yyyy-MM-dd HH:mm:ss) Format.")]
        public string TransactionDate { get; set; }

        /// <summary>
		/// Transaction Type
		/// </summary>
		[Display(Name = "Transaction Type")]
        [Required(ErrorMessage = "Enter The Transaction Type.")]
        public int TransactionType { get; set; }

        /// <summary>
		/// Stock Effect
		/// </summary>
		[Display(Name = "Stock Effect")]
        [Required(ErrorMessage = "Enter The Stock Effect.")]
        public int StockEffect { get; set; }

        /// <summary>
		/// Store Request ID
		/// </summary>
		[Display(Name = "Store Request ID")]
        public int StoreRequestID { get; set; }

        /// <summary>
		/// Store Request Line ID
		/// </summary>
		[Display(Name = "Store Request Line ID")]
        public int StoreRequestLineID { get; set; }

        /// <summary>
		/// Batch ID
		/// </summary>
		[Display(Name = "Batch ID")]
        public int BatchID { get; set; }

        /// <summary>
		/// Location ID
		/// </summary>
		[Display(Name = "Location ID")]
        [Required(ErrorMessage = "Enter The Location ID.")]
        public int LocationID { get; set; }

        /// <summary>
        /// Quantity Received
        /// </summary>
        [Display(Name = "Quantity Received"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Received.")]
        public decimal QuantityReceived { get; set; }

        /// <summary>
        /// Quantity Issued
        /// </summary>
        [Display(Name = "Quantity Issued"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Issued.")]
        public decimal QuantityIssued { get; set; }

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
        /// Transaction By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Transaction By")]
        [Required(ErrorMessage = "Enter The Transaction By.")]
        public string TransactionBy { get; set; }

        /// <summary>
        /// Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Remarks")]
        public string Remarks { get; set; }
    }

    public class GetBatchDetailRequestParam
    {
        /// <summary>
		/// Store Request Line ID
		/// </summary>
		[Display(Name = "Store Request Line ID")]
        public int StoreRequestLineID { get; set; }
    }
}
