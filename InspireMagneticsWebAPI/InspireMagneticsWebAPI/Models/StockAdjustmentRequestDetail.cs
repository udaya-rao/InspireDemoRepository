using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class StockAdjustmentRequestDetail
    {
        /// <summary>
		/// Adjustment Line ID
		/// </summary>
		[Display(Name = "Adjustment Line ID")]
        [Required(ErrorMessage = "Enter The Adjustment Line ID.")]
        public int AdjustmentLineID { get; set; }

        /// <summary>
        /// Adjustment ID
        /// </summary>
        [Display(Name = "Adjustment ID")]
        [Required(ErrorMessage = "Enter The Adjustment ID.")]
        public int AdjustmentID { get; set; }

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
        /// Quantity Receive Requested
        /// </summary>
        [Display(Name = "Quantity Receive Requested"), DataType(DataType.Currency)]
        public decimal QuantityReceiveRequested { get; set; }

        /// <summary>
        /// Quantity Issue Requested
        /// </summary>
        [Display(Name = "Quantity Issue Requested"), DataType(DataType.Currency)]
        public decimal QuantityIssueRequested { get; set; }

        /// <summary>
        /// Batch No
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Batch No")]
        public string BatchNo { get; set; }
    }
}
