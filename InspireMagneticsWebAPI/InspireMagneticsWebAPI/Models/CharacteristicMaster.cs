using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
namespace InspireMagneticsWebAPI.Models
{
	public class CharacteristicMaster
	{
		/// <summary>
		/// Characteristic ID
		/// </summary>
		[Display(Name = "Characteristic ID")]
		[Required(ErrorMessage = "Enter The Characteristic ID.")]
		public int CharacteristicID { get; set; } = 0;

		/// <summary>
		/// Characteristic Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Characteristic Name")]
		[Required(ErrorMessage = "Enter The Characteristic Name.")]
		public string CharacteristicName { get; set; }
	}
}
