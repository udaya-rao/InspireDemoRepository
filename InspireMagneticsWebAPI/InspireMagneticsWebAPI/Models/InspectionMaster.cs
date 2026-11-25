using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
	public class InspectionMasterRequestParam : PaginationCommonModel
	{
		/// <summary>
		/// Inspection ID
		/// </summary>
		[Display(Name = "Inspection ID")]
		[Required(ErrorMessage = "Enter The Inspection ID.")]
		public int InspectionID { get; set; } = 0;

		/// <summary>
		/// Fg Rm Item ID
		/// </summary>
		[Display(Name = "Fg Rm Item ID")]
		[Required(ErrorMessage = "Enter The Fg Rm Item ID.")]
		public int FgRmItemID { get; set; }

		/// <summary>
		/// Item Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Type")]
		[Required(ErrorMessage = "Enter The Item Type.")]
		public string ItemType { get; set; }

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
		/// Prepared By
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Prepared By")]
		public string PreparedBy { get; set; }

		/// <summary>
		/// Updated By
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Updated By")]
		public string UpdatedBy { get; set; }

		/// <summary>
		/// Instrument Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Instrument Name")]
		public string InstrumentName { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
		public string ParamType { get; set; }
	}
	public class InspectionMaster : InspectionMasterRequestParam
	{
        /// <summary>
        /// Is Video Uploaded
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Is Video Uploaded")]
        public string IsVideoUploaded { get; set; }

        /// <summary>
        /// Column Name
        /// </summary>
        [DefaultValue("")]
		[Display(Name = "Column Name")]
		public string ColumnName { get; set; }

		/// <summary>
		/// Is Global Search
		/// </summary>
		[Display(Name = "Is Global Search")]
		public int IsGlobalSearch { get; set; } = 0;

		/// <summary>
		/// Sort Order
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Sort Order")]
		public string SortOrder { get; set; }

		/// <summary>
		/// Search Keyword
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Search Keyword")]
		public string SearchKeyword { get; set; }

		/// <summary>
		/// Sort Columns
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Sort Columns")]
		public string SortColumns { get; set; }
	}
	public class InspectionMasterProfile : Profile
	{
		public InspectionMasterProfile()
		{
			CreateMap<InspectionMasterRequestParam, InspectionMaster>()
                .ForMember(dest => dest.IsVideoUploaded, opt => opt.Ignore())
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
				.ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
				.ForMember(dest => dest.SortOrder, opt => opt.Ignore())
				.ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
				.ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
		}
	}
	public class InspectionMasterDetailsRequestParam
	{
		/// <summary>
		/// Fg Rm Item ID
		/// </summary>
		[Display(Name = "FgRmItemID")]
		public int FgRmItemID { get; set; }

		/// <summary>
		/// Item Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Type")]
		public string ItemType { get; set; }
	}

    public class UpdateInspectionVideoUploadedOrDeletedRequestParam
    {
        /// <summary>
        /// Inspection ID
        /// </summary>
        [Display(Name = "Inspection ID")]
        [Required(ErrorMessage = "Enter The Inspection ID.")]
        public int InspectionID { get; set; } = 0;

        /// <summary>
        /// Is Video Uploaded
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Is Video Uploaded")]
        [Required(ErrorMessage = "Enter The Is Video Uploaded.")]
        public string IsVideoUploaded { get; set; }
    }

    public class InspectionMasterSearchListRequestParam : CommonPaginationListRequestParam
	{

	}
	public class DeleteInspectionMasterDetailsRequestParam
	{
		/// <summary>
		/// Fg Rm Item ID
		/// </summary>
		[Display(Name = "FgRmItemID")]
		public int FgRmItemID { get; set; }

		/// <summary>
		/// Item Type
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Item Type")]
		[Required(ErrorMessage = "Enter The Item Type.")]
		public string ItemType { get; set; }
	}

    public class InspectionVideoFileUploadRequestParam : ViewInspectionVideoFileRequestParam
    {
        /// <summary>
        /// File Upload
        /// </summary>
        [Display(Name = "File Upload")]
        [Required(ErrorMessage = "Select The File To Upload.")]
        [FileExtensionValidation(fileExtensions = "mp4,MP4,webm,WEBM", ErrorMessage = "Upload Only Valid MP4/WEBM File.")]
        [FileSizeValidation(MaxFileSizeInMB = 10, ErrorMessage = "File Size Cannot Exceed 10 MB.")]
        public List<IFormFile> UploadFiles { get; set; } = new();
    }

    public class ViewInspectionVideoFileRequestParam
    {
        /// <summary>
        /// Inspection ID
        /// </summary>
        [Display(Name = "Inspection ID")]
        [Required(ErrorMessage = "Enter The Inspection ID.")]
        public int InspectionID { get; set; } = 0;

        /// <summary>
        /// Item Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Item Code")]
        [Required(ErrorMessage = "Enter The Item Code.")]
        public string ItemCode { get; set; }
    }

    public class ViewDeleteInspectionVideoFileRequestParam : ViewInspectionVideoFileRequestParam
    {
        /// <summary>
        /// File Name
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "File Name")]
        public string FileName { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (View/Delete).")]
        public string ParamType { get; set; }
    }
}
