using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class InspectionDetail
    {
        /// <summary>
		/// Inspection Line ID
		/// </summary>
		[Display(Name = "Inspection Line ID")]
        [Required(ErrorMessage = "Enter The Inspection Line ID.")]
        public int InspectionLineID { get; set; }

        /// <summary>
        /// Inspection Header ID
        /// </summary>
        [Display(Name = "Inspection Header ID")]
        [Required(ErrorMessage = "Enter The Inspection Header ID.")]
        public int InspectionHeaderID { get; set; }

        /// <summary>
		/// Inspection ID
		/// </summary>
		[Display(Name = "Inspection ID")]
        [Required(ErrorMessage = "Enter The Inspection ID.")]
        public int InspectionID { get; set; } = 0;

        /// <summary>
		/// User Sequence No
		/// </summary>
		[Display(Name = "User Sequence No")]
        [Required(ErrorMessage = "Enter The User Sequence No.")]
        public int UserSequenceNo { get; set; }

        /// <summary>
        /// Characteristic ID
        /// </summary>
        [Display(Name = "Characteristic ID")]
        [Required(ErrorMessage = "Enter The Characteristic ID.")]
        public int CharacteristicID { get; set; }

        /// <summary>
		/// Characteristic Sort Sequence
		/// </summary>
        [Display(Name = "Characteristic Sort Sequence")]
        [Required(ErrorMessage = "Enter The Characteristic Sort Sequence.")]
        public int CharacteristicSortSequence { get; set; }

        /// <summary>
        /// Characteristic Name
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Characteristic Name")]
        [Required(ErrorMessage = "Enter The Characteristic Name.")]
        public string CharacteristicName { get; set; }

        /// <summary>
        /// Sub Characteristic Name
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Sub Characteristic Name")]
        [Required(ErrorMessage = "Enter The Sub Characteristic Name.")]
        public string SubCharacteristicName { get; set; }

        /// <summary>
		/// Sub Sort Sequence
		/// </summary>
        [Display(Name = "Sub Sort Sequence")]
        [Required(ErrorMessage = "Enter The Sub Sort Sequence.")]
        public int SubSortSequence { get; set; }

        /// <summary>
        /// QA Status
        /// </summary>
        [Display(Name = "QA Status")]
        [Required(ErrorMessage = "Enter The QA Status.")]
        public int QAStatus { get; set; }

        /// <summary>
        /// Expected Result
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Expected Result")]
        public string ExpectedResult { get; set; }

        /// <summary>
        /// Expected Minimum Reading
        /// </summary>
        [Display(Name = "Expected Minimum Reading"), DataType(DataType.Currency)]
        public decimal ExpectedMinimumReading { get; set; }

        /// <summary>
        /// Expected Maximum Reading
        /// </summary>
        [Display(Name = "Expected Maximum Reading"), DataType(DataType.Currency)]
        public decimal ExpectedMaximumReading { get; set; }

        /// <summary>
        /// Actual Result
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Actual Result")]
        public string ActualResult { get; set; }

        /// <summary>
        /// Actual Minimum Reading
        /// </summary>
        [Display(Name = "Actual Minimum Reading"), DataType(DataType.Currency)]
        public decimal ActualMinimumReading { get; set; }

        /// <summary>
        /// Actual Maximum Reading
        /// </summary>
        [Display(Name = "Actual Maximum Reading"), DataType(DataType.Currency)]
        public decimal ActualMaximumReading { get; set; }

        /// <summary>
        /// Unit Of Measure
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Unit Of Measure")]
        public string UnitOfMeasure { get; set; }

        /// <summary>
        /// Result Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Result Remarks")]
        public string ResultRemarks { get; set; }

        /// <summary>
        /// Inspection Observation
        /// </summary>
        public List<InspectionObservation> InspectionObservation { get; set; }
    }
}
