using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
    public class SupplierItemsRequestParam : PaginationCommonModel
    {
        /// <summary>
        /// Supplier Item ID
        /// </summary>
        [Display(Name = "Supplier Item ID")]
        [Required(ErrorMessage = "Enter The Supplier Item ID.")]
        public int SupplierItemID { get; set; }

        /// <summary>
        /// Item ID
        /// </summary>
        [Display(Name = "Item ID")]
        [Required(ErrorMessage = "Enter The Item ID.")]
        [NumberGreaterThanZeroValidation(NumberPropertyName = "ItemID", ErrorMessage = "Item ID Should Be Greater Than 0.")]
        public int ItemID { get; set; }

        /// <summary>
        /// Supplier ID
        /// </summary>
        [Display(Name = "Supplier ID")]
        [Required(ErrorMessage = "Enter The Supplier ID.")]
        [NumberGreaterThanZeroValidation(NumberPropertyName = "SupplierID", ErrorMessage = "Supplier ID Should Be Greater Than 0.")]
        public int SupplierID { get; set; }

        /// <summary>
        /// Valid To Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Valid To Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter The Valid To Date in (yyyy-MM-dd) Format.")]
        public string ValidToDate { get; set; }

        /// <summary>
        /// Supplier Item Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Supplier Item Code")]
        public string SupplierItemCode { get; set; }

        /// <summary>
        /// Currency ID
        /// </summary>
        [Display(Name = "Currency ID")]
        [Required(ErrorMessage = "Enter The Currency ID.")]
        [NumberGreaterThanZeroValidation(NumberPropertyName = "CurrencyID", ErrorMessage = "Currency ID Should Be Greater Than 0.")]
        public int CurrencyID { get; set; }

        /// <summary>
        /// Unit Rate
        /// </summary>
        [Display(Name = "Unit Rate"), DataType(DataType.Currency)]
        public decimal UnitRate { get; set; }

        /// <summary>
        /// Document Status
        /// </summary>
        [Display(Name = "Document Status")]
        [Required(ErrorMessage = "Enter The Document Status.")]
        public int DocumentStatus { get; set; }

        /// <summary>
        /// Purchase Notes
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Purchase Notes")]
        public string PurchaseNotes { get; set; }

        /// <summary>
        /// Prepared By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Prepared By")]
        [Required(ErrorMessage = "Enter The Prepared By.")]
        public string PreparedBy { get; set; }

        /// <summary>
        /// Updated By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Updated By")]
        public string UpdatedBy { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }

    public class SupplierItems : SupplierItemsRequestParam
    {
        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        public string ApprovedBy { get; set; }

        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }

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
    public class SupplierItemsProfile : Profile
    {
        public SupplierItemsProfile()
        {
            // Maps SupplierItemsRequestParam -> SupplierItems
            CreateMap<SupplierItemsRequestParam, SupplierItems>()
                .ForMember(dest => dest.ApprovedBy, opt => opt.Ignore())
                .ForMember(dest => dest.ShortCut, opt => opt.Ignore())
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }
    public class SupplierItemsDetailsRequestParam : CommonSupplierItemsDetailsRequestParam
    {
        
    }
    public class SupplierDemoItemsDetailsRequestParam : CommonDemoSupplierItemsDetailsRequestParam
    {

    }


    public class SupplierItemsSearchListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }
    }
    
    public class ApproveSupplierItemsDetails : CommonSupplierItemsDetailsRequestParam
    {
        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        [Required(ErrorMessage = "Enter The Approved By.")]
        public string ApprovedBy { get; set; }
    }

    public class CommonSupplierItemsDetailsRequestParam
    {
        /// <summary>
        /// Supplier Item ID
        /// </summary>
        [Display(Name = "Supplier Item ID")]
        [Required(ErrorMessage = "Enter The Supplier Item ID.")]
        public int SupplierItemID { get; set; }
    }

    public class CommonDemoSupplierItemsDetailsRequestParam
    {
        /// <summary>
        /// Supplier Item ID
        /// </summary>
        [Display(Name = "Supplier Item ID")]
        [Required(ErrorMessage = "Enter The Supplier Item ID.")]
        public int SupplierItemID { get; set; }
    }
}
