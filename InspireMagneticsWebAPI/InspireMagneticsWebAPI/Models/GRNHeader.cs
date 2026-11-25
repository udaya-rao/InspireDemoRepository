using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using InspireMagneticsWebAPI.CustomAttribute;
using AutoMapper;
using CommonLib.Constants;

namespace InspireMagneticsWebAPI.Models
{
    public class GRNHeaderRequestParam : PaginationCommonModel
    {
        /// <summary>
		/// GRN ID
		/// </summary>
		[Display(Name = "GRN ID")]
        [Required(ErrorMessage = "Enter The GRN ID.")]
        public int GRNID { get; set; }

        /// <summary>
		/// GRN Number
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "GRN Number")]
        [Required(ErrorMessage = "Enter The GRN Number.")]
        public string GRNNumber { get; set; }

        /// <summary>
		/// Work Order ID
		/// </summary>
		[Display(Name = "Work Order ID")]
        public int WorkOrderID { get; set; }

        /// <summary>
		/// Purchase Order ID
		/// </summary>
		[Display(Name = "Purchase Order ID")]
        public int PurchaseOrderID { get; set; }

        /// <summary>
		/// Supplier Invoice Reference
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Supplier Invoice Reference")]
        public string SupplierInvoiceReference { get; set; }

        /// <summary>
        /// Supplier Invoice Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Supplier Invoice Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Supplier Invoice Date in (yyyy-MM-dd HH:mm:ss.fff) format.")]
        public string SupplierInvoiceDate { get; set; }

        /// <summary>
        /// Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Remarks")]
        public string Remarks { get; set; }

        /// <summary>
		/// Supplier ID
		/// </summary>
		[Display(Name = "Supplier ID")]
        public string SupplierID { get; set; }

        /// <summary>
        /// Document Status
        /// </summary>
        [Display(Name = "Document Status")]
        [Required(ErrorMessage = "Enter The Document Status.")]
        public int DocumentStatus { get; set; }

        /// <summary>
        /// Currency ID
        /// </summary>
        [Display(Name = "Currency ID")]
        public int CurrencyID { get; set; }

        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }

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
        /// GRN Detail
        /// </summary>
        public List<GRNDetail> GRNDetail { get; set; }

        /// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }
    public class GRNHeader : GRNHeaderRequestParam
    {
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
    public class GRNProfile : Profile
    {
        public GRNProfile()
        {
            // Maps GRNHeaderRequestParam -> GRNHeader
            CreateMap<GRNHeaderRequestParam, GRNHeader>()
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }
    public class GRNHeaderDetailsRequestParam
    {
        /// <summary>
		/// GRN ID
		/// </summary>
		[Display(Name = "GRN ID")]
        [Required(ErrorMessage = "Enter The GRN ID.")]
        public int GRNID { get; set; }
    }
    public class GRNHeaderSearchListRequestParam : CommonPaginationListRequestParam
    {
    }
    public class CancelWorkOrderGRNDetails
    {
        /// <summary>
		/// GRN ID
		/// </summary>
		[Display(Name = "GRN ID")]
        [Required(ErrorMessage = "Enter The GRN ID.")]
        public int GRNID { get; set; }
    }
    public class PurchaseOrderGRNHeaderRequestParam : PaginationCommonModel
    {
        /// <summary>
		/// GRN ID
		/// </summary>
		[Display(Name = "GRN ID")]
        [Required(ErrorMessage = "Enter The GRN ID.")]
        public int GRNID { get; set; }

        /// <summary>
		/// GRN Number
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "GRN Number")]
        [Required(ErrorMessage = "Enter The GRN Number.")]
        public string GRNNumber { get; set; }

        /// <summary>
		/// Purchase Order ID
		/// </summary>
		[Display(Name = "Purchase Order ID")]
        public int PurchaseOrderID { get; set; }

        /// <summary>
		/// Supplier Invoice Reference
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Supplier Invoice Reference")]
        public string SupplierInvoiceReference { get; set; }

        /// <summary>
        /// Supplier Invoice Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Supplier Invoice Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Supplier Invoice Date in (yyyy-MM-dd HH:mm:ss.fff) format.")]
        public string SupplierInvoiceDate { get; set; }

        /// <summary>
        /// Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Remarks")]
        public string Remarks { get; set; }

        /// <summary>
		/// Supplier ID
		/// </summary>
		[Display(Name = "Supplier ID")]
        public string SupplierID { get; set; }

        /// <summary>
        /// Document Status
        /// </summary>
        [Display(Name = "Document Status")]
        [Required(ErrorMessage = "Enter The Document Status.")]
        public int DocumentStatus { get; set; }

        /// <summary>
        /// Currency ID
        /// </summary>
        [Display(Name = "Currency ID")]
        public int CurrencyID { get; set; }

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
        /// GRN Detail
        /// </summary>
        public List<GRNDetail> GRNDetail { get; set; }

        /// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE)")]
        public string ParamType { get; set; }
    }
    public class PurchaseOrderGRNProfile : Profile
    {
        public PurchaseOrderGRNProfile()
        {
         
            CreateMap<PurchaseOrderGRNHeaderRequestParam, PurchaseOrderGRNHeader>()
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }
    public class PurchaseOrderGRNHeader : PurchaseOrderGRNHeaderRequestParam
    {
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
    public class PurchaseOrderGRNSearchListRequestParam : CommonPaginationListRequestParam
    {

    }

    public class PurchaseOrderGRNDetailsRequestParam
    {
        /// <summary>
		/// GRN ID
		/// </summary>
		[Display(Name = "GRN ID")]
        [Required(ErrorMessage = "Enter The GRN ID.")]
        public int GRNID { get; set; }
    }
    public class GoodsInspectionGRNHeaderRequestParam : PaginationCommonModel
    {

    }
    public class GoodsInspectionGRNHeader : GoodsInspectionGRNHeaderRequestParam
    {
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
    public class GoodsInspectionGRNSearchListRequestParam : CommonPaginationListRequestParam
    {
        /// <summary>
        /// Short Cut
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Short Cut")]
        public string ShortCut { get; set; }
    }
    public class GoodsInspectionDetailsRequestParam
    {
        /// <summary>
		/// GRN ID
		/// </summary>
		[Display(Name = "GRN ID")]
        [Required(ErrorMessage = "Enter The GRN ID.")]
        public int GRNID { get; set; }
    }

    public class PurchaseOrderOrWorkOrderGRNDetailsRequestParam
    {
        /// <summary>
		/// GRN ID
		/// </summary>
		[Display(Name = "GRN ID")]
        [Required(ErrorMessage = "Enter The GRN ID.")]
        public int GRNID { get; set; }

        /// <summary>
        /// Source
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Source")]
        [Required(ErrorMessage = "Enter The Source.")]
        [RegularExpression("^(PurchaseOrderGRN|WorkOrderGRN)$", ErrorMessage = "Source Must Be PurchaseOrderGRN Or WorkOrderGRN.")]
        public string Source { get; set; }
    }
}
