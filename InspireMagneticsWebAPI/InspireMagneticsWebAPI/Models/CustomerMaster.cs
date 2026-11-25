using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using CommonLib.Constants;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
    public class CustomerMasterRequestParam : PaginationCommonModel
    {
        /// <summary>
        /// Customer ID
        /// </summary>
        [Display(Name = "Customer ID")]
		public int CustomerID { get; set; }

        /// <summary>
        /// Customer Name
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Name")]
        [Required(ErrorMessage = "Enter The Customer Name.")]
        public string CustomerName { get; set; }

        /// <summary>
        /// Address Line 1
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Address Line 1")]
        [Required(ErrorMessage = "Enter Address Line 1.")]
        public string CustomerPrimaryAddressLine1 { get; set; }

        /// <summary>
        /// Address Line 2
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Address Line 2")]
        public string CustomerPrimaryAddressLine2 { get; set; }

        /// <summary>
        /// Pin Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Pin Code")]
        [Required(ErrorMessage = "Enter The Pin Code.")]
        [CommonValidation(CustomPropertyName = "CustomerPinCode", ValidationTypePropertyName = "Pincode", ErrorMessage = "Enter The Valid Pin Code.")]
        public string CustomerPinCode { get; set; }

        /// <summary>
        /// Customer Type
        /// </summary>
        [Display(Name = "Customer Type")]
        [Required(ErrorMessage = "Enter The Customer Type.")]
        public int CustomerType { get; set; }

        /// <summary>
        /// Website
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Website")]
        public string CustomerWebsite { get; set; }

        /// <summary>
        /// GSTIN Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "GSTIN Number")]
        [Required(ErrorMessage = "Enter The GSTIN Number.")]
        public string GSTINNumber { get; set; }

        /// <summary>
        /// PAN Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "PAN Number")]
        [Required(ErrorMessage = "Enter The PAN Number.")]
        public string PanNumber { get; set; }

        /// <summary>
        /// Customer Status
        /// </summary>
        [Display(Name = "Customer Status")]
        [Required(ErrorMessage = "Enter The Customer Status.")]
        public int CustomerStatus { get; set; }

        /// <summary>
        /// Customer Supply
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Supply")]
        [Required(ErrorMessage = "Enter The Customer Supply.")]
        public string CustomerSupply { get; set; }

        /// <summary>
        /// Responsible Person ID
        /// </summary>
        [Display(Name = "Responsible Person ID")]
        public int ResponsiblePersonID { get; set; }

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
		/// Customer Contact Master
		/// </summary>
		public List<CustomerContactMaster> CustomerContactMaster { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Param Type")]
        [Required(ErrorMessage = "Enter The Param Type (ADD/UPDATE).")]
        public string ParamType { get; set; }
    }

    public class CustomerMaster : CustomerMasterRequestParam
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

    public class CustomerMasterProfile : Profile
    {
        public CustomerMasterProfile()
        {
            CreateMap<CustomerMasterRequestParam, CustomerMaster>()
                .ForMember(dest => dest.ColumnName, opt => opt.Ignore())
                .ForMember(dest => dest.IsGlobalSearch, opt => opt.Ignore())
                .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
                .ForMember(dest => dest.SearchKeyword, opt => opt.Ignore())
                .ForMember(dest => dest.ParamType, opt => opt.MapFrom(src => OperationTypeConstants.Add));
        }
    }

    public class CustomerMasterDetailsRequestParam
    {
        /// <summary>
        /// Customer ID
        /// </summary>
        [Display(Name = "Customer ID")]
        [Required(ErrorMessage = "Enter the Customer ID.")]
        public int CustomerID { get; set; }
    }
	public class CustomerMasterSearchListRequestParam : CommonPaginationListRequestParam
	{
		
	}

    public class CustomerQuotationSearchListRequestParam : PaginationCommonMandatoryModel
    {
        /// <summary>
		/// Search Keyword
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Search Keyword")]
        public string SearchKeyword { get; set; }
    }

    public class CheckCustomerNameExist
	{
		/// <summary>
		/// Customer Name
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Customer Name")]
		[Required(ErrorMessage = "Enter the Customer Name.")]
		public string CustomerName { get; set; }
	}
	public class DeleteCustomerMasterDetails
    {
        /// <summary>
        /// Customer ID
        /// </summary>
        [Display(Name = "Customer ID")]
        [Required(ErrorMessage = "Enter the Customer ID.")]
        public int CustomerID { get; set; }
    }

    public class CustomerDeliveryNoteSearchListRequestParam : PaginationCommonMandatoryModel
    {
        
    }
}
