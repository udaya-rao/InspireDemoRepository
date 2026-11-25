using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;

namespace InspireMagneticsWebAPI.Models
{
    public class BOMDetail
    {
        /// <summary>
		/// BOM Line ID
		/// </summary>
		[Display(Name = "BOM Line ID")]
        [Required(ErrorMessage = "Enter The BOM Line ID.")]
        public int BOMLineID { get; set; }

        /// <summary>
        /// Line Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Line Type")]
        [Required(ErrorMessage = "Enter The Line Type.")]
        public string LineType { get; set; }

        /// <summary>
        /// BOM ID
        /// </summary>
        [Display(Name = "BOM ID")]
        [Required(ErrorMessage = "Enter The BOM ID.")]
        public int BOMID { get; set; } = 0;

        /// <summary>
		/// Item ID
		/// </summary>
		[Display(Name = "Item ID")]
        [Required(ErrorMessage = "Enter The Item ID.")]
        public int ItemID { get; set; }

        /// <summary>
        /// BOM IRemarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "BOM IRemarks")]
        public string BOMIRemarks { get; set; }

        /// <summary>
        /// Quantity Per Assembly
        /// </summary>
        [Display(Name = "Quantity Per Assembly"), DataType(DataType.Currency)]
        public decimal QuantityPerAssembly { get; set; }

        /// <summary>
        /// Hierarchy Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Hierarchy Code")]
        public string HierarchyCode { get; set; }

        /// <summary>
        /// Level Number
        /// </summary>
        [Display(Name = "Level Number")]
        public int LevelNumber { get; set; }

        /// <summary>
        /// Operation ID
        /// </summary>
        [Display(Name = "Operation ID")]
        public int OperationID { get; set; }

        /// <summary>
        /// Sort Sequence
        /// </summary>
        [Display(Name = "Sort Sequence")]
        public int SortSequence { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }
}
