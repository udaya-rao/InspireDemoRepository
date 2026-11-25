using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class InspectionObservation
    {
        /// <summary>
		/// Observation ID
		/// </summary>
		[Display(Name = "Observation ID")]
        [Required(ErrorMessage = "Enter The Observation ID.")]
        public int ObservationID { get; set; }

        /// <summary>
		/// Inspection Line ID
		/// </summary>
		[Display(Name = "Inspection Line ID")]
        [Required(ErrorMessage = "Enter The Inspection Line ID.")]
        public int InspectionLineID { get; set; }

        /// <summary>
		/// User Sequence No
		/// </summary>
		[Display(Name = "User Sequence No")]
        [Required(ErrorMessage = "Enter The User Sequence No.")]
        public int UserSequenceNo { get; set; }

        /// <summary>
        /// Sample Number
        /// </summary>
        [Display(Name = "Sample Number")]
        [Required(ErrorMessage = "Enter The Sample Number.")]
        public int SampleNumber { get; set; }

        /// <summary>
        /// Observed Reading
        /// </summary>
        [Display(Name = "Observed Reading"), DataType(DataType.Currency)]
        public decimal ObservedReading { get; set; }

        /// <summary>
        /// Observed Result
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Observed Result")]
        public string ObservedResult { get; set; }
    }

    public class InspectionObservationDetailsRequestParam
    {
        /// <summary>
		/// Inspection Line ID
		/// </summary>
		[Display(Name = "Inspection Line ID")]
        [Required(ErrorMessage = "Enter The Inspection Line ID.")]
        public int InspectionLineID { get; set; }
    }
}
