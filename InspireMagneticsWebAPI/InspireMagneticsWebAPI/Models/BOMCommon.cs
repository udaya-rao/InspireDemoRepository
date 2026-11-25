using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;

namespace InspireMagneticsWebAPI.Models
{
    public class BOMCommon
    {
        /// <summary>
		/// BOM ID
		/// </summary>
		[Display(Name = "BOM ID")]
        [Required(ErrorMessage = "Enter The BOM ID.")]
        public int BOMID { get; set; } = 0;

        /// <summary>
		/// Fg Item ID
		/// </summary>
		[Display(Name = "Fg Item ID")]
        [Required(ErrorMessage = "Enter The Fg Item ID.")]
        public int FGItemID { get; set; }

        /// <summary>
        /// FG Assembly Base Quantity
        /// </summary>
        [Display(Name = "FG Assembly Base Quantity"), DataType(DataType.Currency)]
        [Required(ErrorMessage = "Enter The FG Assembly Base Quantity.")]
        public decimal FGAssemblyBaseQuantity { get; set; }

        /// <summary>
		/// Prepared By
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Prepared By")]
        [Required(ErrorMessage = "Enter The Prepared By.")]
        public string PreparedBy { get; set; }

        /// <summary>
        /// BOM Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "BOM Remarks")]
        public string BOMRemarks { get; set; }

        /// <summary>
		/// Updated By
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Updated By")]
        public string UpdatedBy { get; set; }

        /// <summary>
		/// BOM Detail
		/// </summary>
		public List<BOMDetail> BOMDetail { get; set; }

        /// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }
    public class BOMMasterDetailsRequestParam
    {
        /// <summary>
        /// FG Item ID
        /// </summary>
        [Display(Name = "FG Item ID")]
        [Required(ErrorMessage = "Enter the FG Item ID.")]
        public int FGItemID { get; set; } = 0;

        /// <summary>
        /// BOM ID
        /// </summary>
        [Display(Name = "BOM ID")]
        [Required(ErrorMessage = "Enter The BOM ID.")]
        public int BOMID { get; set; } = 0;
    }
}
