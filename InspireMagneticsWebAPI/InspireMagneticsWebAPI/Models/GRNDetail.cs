using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class GRNDetail
    {
        /// <summary>
		/// GRN Line ID
		/// </summary>
		[Display(Name = "GRN Line ID")]
        [Required(ErrorMessage = "Enter The GRN Line ID.")]
        public int GRNLineID { get; set; }

        /// <summary>
		/// GRN ID
		/// </summary>
		[Display(Name = "GRN ID")]
        [Required(ErrorMessage = "Enter The GRN ID.")]
        public int GRNID { get; set; }

        /// <summary>
		/// Item ID
		/// </summary>
		[Display(Name = "Item ID")]
        [Required(ErrorMessage = "Enter The Item ID.")]
        public int ItemID { get; set; }

        /// <summary>
        /// Quantity Advised
        /// </summary>
        [Display(Name = "Quantity Advised"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The Quantity Advised.")]
        public decimal QuantityAdvised { get; set; }

        /// <summary>
        /// Quantity Delivered
        /// </summary>
        public string QuantityDelivered { get; set; }

        /// <summary>
		/// Quantity Counted By
		/// </summary>
        [DefaultValue("")]
        [Display(Name = "Quantity Counted By")]
        public string QuantityCountedBy { get; set; }

        /// <summary>
        /// Quantity Counted Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quantity Counted Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Quantity Counted Date in (yyyy-MM-dd HH:mm:ss.fff) format.")]
        public string QuantityCountedDate { get; set; }

        /// <summary>
        /// Quantity Returned
        /// </summary>
        [Display(Name = "Quantity Returned"), DataType(DataType.Currency)]
        public decimal QuantityReturned { get; set; }

        /// <summary>
		/// Quantity Returned Reason
		/// </summary>
        [DefaultValue("")]
        [Display(Name = "Quantity Returned Reason")]
        public string QuantityReturnedReason { get; set; }

        /// <summary>
        /// Quantity Returned By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quantity Returned By")]
        public string QuantityReturnedBy { get; set; }

        /// <summary>
        /// Quantity Returned Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quantity Returned Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Quantity Returned Date in (yyyy-MM-dd HH:mm:ss.fff) format.")]
        public string QuantityReturnedDate { get; set; }

        /// <summary>
        /// Quantity Rejected
        /// </summary>
        [Display(Name = "Quantity Rejected"), DataType(DataType.Currency)]
        public decimal QuantityRejected { get; set; }

        /// <summary>
        /// Quantity Rejected Reason
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quantity Rejected Reason")]
        public string QuantityRejectedReason { get; set; }

        /// <summary>
        /// Quantity Testing Rejected
        /// </summary>
        [Display(Name = "Quantity Testing Rejected"), DataType(DataType.Currency)]
        public decimal QuantityTestingRejected { get; set; }

        /// <summary>
        /// QA Status
        /// </summary>
        [Display(Name = "QA Status")]
        [Required(ErrorMessage = "Enter The QA Status.")]
        public int QAStatus { get; set; }

        /// <summary>
        /// QA Checked By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "QA Checked By")]
        public string QACheckedBy { get; set; }

        /// <summary>
        /// QA Checked Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "QA Checked Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid QA Checked Date in (yyyy-MM-dd HH:mm:ss.fff) format.")]
        public string QACheckedDate { get; set; }

        /// <summary>
		/// Batch Number
		/// </summary>
        [DefaultValue("")]
        [Display(Name = "Batch Number")]
        [Required(ErrorMessage = "Enter The Batch Number.")]
        public string BatchNumber { get; set; }

        /// <summary>
		/// Work Order Line ID
		/// </summary>
		[Display(Name = "Work Order Line ID")]
        public int WorkOrderLineID { get; set; }

        /// <summary>
		/// Purchase Order Line ID
		/// </summary>
		[Display(Name = "Purchase Order Line ID")]
        public int PurchaseOrderLineID { get; set; }

        /// <summary>
        /// Document IStatus
        /// </summary>
        [Display(Name = "Document IStatus")]
        [Required(ErrorMessage = "Enter The Document IStatus.")]
        public int DocumentIStatus { get; set; }
    }

    public class UpdateGoodsInspectionNote
    {
        /// <summary>
		/// GRN Line ID
		/// </summary>
		[Display(Name = "GRN Line ID")]
        [Required(ErrorMessage = "Enter The GRN Line ID.")]
        public int GRNLineID { get; set; }

        /// <summary>
        /// Quantity Rejected
        /// </summary>
        [Display(Name = "Quantity Rejected"), DataType(DataType.Currency)]
        public decimal QuantityRejected { get; set; }

        /// <summary>
        /// Quantity Rejected Reason
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quantity Rejected Reason")]
        public string QuantityRejectedReason { get; set; }

        /// <summary>
        /// Quantity Testing Rejected
        /// </summary>
        [Display(Name = "Quantity Testing Rejected"), DataType(DataType.Currency)]
        public decimal QuantityTestingRejected { get; set; }

        /// <summary>
        /// QA Status
        /// </summary>
        [Display(Name = "QA Status")]
        [Required(ErrorMessage = "Enter The QA Status.")]
        public int QAStatus { get; set; }

        /// <summary>
        /// QA Checked By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "QA Checked By")]
        public string QACheckedBy { get; set; }

        /// <summary>
        /// QA Checked Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "QA Checked Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid QA Checked Date in (yyyy-MM-dd) format.")]
        public string QACheckedDate { get; set; }
    }
}
