using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using InspireMagneticsWebAPI.CustomAttribute;

namespace InspireMagneticsWebAPI.Models
{
	public class EnquiryCommon : PaginationCommonModel
    {
		/// <summary>
		/// Enquiry Reference
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Enquiry Reference")]
		[Required(ErrorMessage = "Enter The Enquiry Reference.")]
		public string EnquiryReference { get; set; }

        /// <summary>
        /// Enquiry Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Enquiry Date")]
		[CommonDateTimeValidation(ErrorMessage = "Enter a valid Enquiry Date in (yyyy-MM-dd HH:mm:ss.fff) format.")]
		[Required(ErrorMessage = "Enter The Enquiry Date.")]
		public string EnquiryDate { get; set; }

        /// <summary>
        /// Enquiry Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Enquiry Type")]
		[Required(ErrorMessage = "Enter The Enquiry Type.")]
		public string EnquiryType { get; set; }

        /// <summary>
        /// Project Information
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Project Information")]
		public string ProjectInformation { get; set; }

        /// <summary>
        /// Industrial Information
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Industrial Information")]
        public string IndustrialInformation { get; set; }

        /// <summary>
        /// Customer Code
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Code")]
        [Required(ErrorMessage = "Enter The Customer Code.")]
        public string CustomerCode { get; set; }

        /// <summary>
        /// Enquiry Product Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Enquiry Product Type")]
        [Required(ErrorMessage = "Enter The Enquiry Product Type.")]
        public string EnquiryProductType { get; set; }

        /// <summary>
        /// Open Status
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Open Status")]
        [Required(ErrorMessage = "Enter The Open Status.")]
        public string OpenStatus { get; set; }

        /// <summary>
        /// Action Plan
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Action Plan")]
        public string ActionPlan { get; set; }

        /// <summary>
        /// Customer Feedback
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Feedback")]
        public string CustomerFeedback { get; set; }

        /// <summary>
        /// Close Status
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Close Status")]
		public string CloseStatus { get; set; }

        /// <summary>
        /// Customer Reference
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Reference")]
        public string CustomerReference { get; set; }

        /// <summary>
        /// Development Class
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Development Class")]
        public string DevelopmentClass { get; set; }

        /// <summary>
        /// Enquiry Category
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Enquiry Category")]
        public string EnquiryCategory { get; set; }

        /// <summary>
        /// Date Reference
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Date Reference")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Date Reference in (yyyy-MM-dd) format.")]
        public string DateReference { get; set; }

        /// <summary>
        /// Prepared By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Prepared By")]
        [Required(ErrorMessage = "Enter The Prepared By.")]
        public string PreparedBy { get; set; }

        /// <summary>
        /// Quotation Send
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quotation Send")]
        public string QuotationSend { get; set; }

        /// <summary>
        /// Enquiry Status
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Enquiry Status")]
        public string EnquiryStatus { get; set; }

        /// <summary>
        /// Approved By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved By")]
        public string ApprovedBy { get; set; }

        /// <summary>
        /// Quotation Reference
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Quotation Reference")]
        public string QuotationReference { get; set; }

        /// <summary>
        /// Kind Attention
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Kind Attention")]
        public string KindAttention { get; set; }

        /// <summary>
        /// Enquiry Requirement
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Enquiry Requirement")]
        public string EnquiryRequirement { get; set; }

        /// <summary>
        /// Action Plan1
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Action Plan1")]
        public string ActionPlan1 { get; set; }

        /// <summary>
        /// Action Plan2
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Action Plan2")]
        public string ActionPlan2 { get; set; }

        /// <summary>
        /// Action Plan3
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Action Plan3")]
        public string ActionPlan3 { get; set; }

        /// <summary>
        /// Design Engineer
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Design Engineer")]
        public string DesignEngineer { get; set; }

        /// <summary>
        /// Demand Draft Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Demand Draft Number")]
        public string DemandDraftNumber { get; set; }

        /// <summary>
        /// Demand Draft Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Demand Draft Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Demand Draft Date in (yyyy-MM-dd) format.")]
        public string DemandDraftDate { get; set; }

        /// <summary>
        /// Sample User
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Sample User")]
        public string SampleUser { get; set; }

        /// <summary>
        /// Personal Visitor
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Personal Visitor")]
        public string PersonalVisitor { get; set; }

        /// <summary>
        /// Sample Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Sample Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Sample Date in (yyyy-MM-dd) format.")]
        public string SampleDate { get; set; }

        /// <summary>
        /// Design Engineer Review Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Design Engineer Review Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Design Engineer Review Date in (yyyy-MM-dd) format.")]
        public string DesignEngineerReviewDate { get; set; }

        /// <summary>
        /// Approved Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Approved Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Approved Date in (yyyy-MM-dd) format.")]
        public string ApprovedDate { get; set; }

        /// <summary>
        /// Ship Agency
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Ship Agency")]
        public string ShipAgency { get; set; }

        /// <summary>
        /// Ship Reference
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Ship Reference")]
        public string ShipReference { get; set; }

        /// <summary>
        /// Ship Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Ship Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Ship Date in (yyyy-MM-dd) format.")]
        public string ShipDate { get; set; }

        /// <summary>
        /// Email ID
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Email ID")]
        [CommonValidation(CustomPropertyName = "EmailID", ValidationTypePropertyName = "Email", ErrorMessage = "Enter The Valid Email ID.")]
        public string EmailID { get; set; }

        /// <summary>
        /// Future Follow Up Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Future Follow Up Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Future Follow Up Date in (yyyy-MM-dd) format.")]
        public string FutureFollowUpDate { get; set; }

        /// <summary>
        /// Follow Up Done Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Follow Up Done Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Follow Up Done Date in (yyyy-MM-dd) format.")]
        public string FollowUpDoneDate { get; set; }

        /// <summary>
        /// Updated By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Updated By")]
        public string UpdatedBy { get; set; }

        /// <summary>
        /// Category Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Category Type")]
        public string CategoryType { get; set; }

        /// <summary>
        /// Web Enquiry ID
        /// </summary>
        [Display(Name = "Web Enquiry ID")]
        public int WebEnquiryID { get; set; }

        /// <summary>
        /// Customer Name
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Name")]
        public string CustomerName { get; set; }

        /// <summary>
        /// Web Product Detail
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Web Product Detail")]
        public string WebProductDetail { get; set; }

        /// <summary>
        /// Web Phone Number
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Web Phone Number")]
        [CommonValidation(CustomPropertyName = "WebPhoneNumber", ValidationTypePropertyName = "MobileNumber", ErrorMessage = "Enter The Valid Web Phone Number.")]
        public string WebPhoneNumber { get; set; }

        /// <summary>
        /// Web Enquiry Subject
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Web Enquiry Subject")]
        public string WebEnquirySubject { get; set; }

        /// <summary>
        /// Web Enquiry Message
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Web Enquiry Message")]
        public string WebEnquiryMessage { get; set; }

        /// <summary>
        /// Responsible Person
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Responsible Person")]
        public string ResponsiblePerson { get; set; }

        /// <summary>
		/// Annual Quantity
		/// </summary>
		[Display(Name = "Annual Quantity")]
        [DataType(DataType.Currency)]
        public decimal AnnualQuantity { get; set; }

        /// <summary>
        /// Customer Address
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Address")]
        public string CustomerAddress { get; set; }

        /// <summary>
        /// Production Start Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Production Start Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Production Start Date in (yyyy-MM-dd) format.")]
        public string ProductionStartDate { get; set; }

        /// <summary>
        /// Customer Sample Request Status
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Sample Request Status")]
        public string CustomerSampleRequestStatus { get; set; }

        /// <summary>
        /// Customer Sample Request Received By
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Sample Request Received By")]
        public string CustomerSampleRequestReceivedBy { get; set; }

        /// <summary>
        /// Customer Sample Request Received Date
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Sample Request Received Date")]
        [CommonDateTimeValidation(ErrorMessage = "Enter a valid Customer Sample Request Received Date in (yyyy-MM-dd) format.")]
        public string CustomerSampleRequestReceivedDate { get; set; }

        /// <summary>
        /// Customer Sample Request Request
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Customer Sample Request Request")]
        public string CustomerSampleRequestRequest { get; set; }

        /// <summary>
        /// Manufacturing Measuring Facility
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Manufacturing Measuring Facility")]
        public string ManufacturingMeasuringFacility { get; set; }

        /// <summary>
        /// ROHS Reach Compliance
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "ROHS Reach Compliance")]
        public string ROHSReachCompliance { get; set; }

        /// <summary>
        /// Capacity To Cater Parts
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Capacity To Cater Parts")]
        public string CapacityToCaterParts { get; set; }

        /// <summary>
        /// Packing Requirement Defined
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Packing Requirement Defined")]
        public string PackingRequirementDefined { get; set; }

        /// <summary>
        /// Suitable Gauges Instruments Available
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Suitable Gauges Instruments Available")]
        public string SuitableGaugesInstrumentsAvailable { get; set; }

        /// <summary>
        /// Manufacturing Measuring Facility Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Manufacturing Measuring Facility Remarks")]
        public string ManufacturingMeasuringFacilityRemarks { get; set; }

        /// <summary>
        /// ROHS Reach Compliance Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "ROHS Reach Compliance Remarks")]
        public string ROHSReachComplianceRemarks { get; set; }

        /// <summary>
        /// Capacity To Cater Parts Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Capacity To Cater Parts Remarks")]
        public string CapacityToCaterPartsRemarks { get; set; }

        /// <summary>
        /// Packing Requirement Defined Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Packing Requirement Defined Remarks")]
        public string PackingRequirementDefinedRemarks { get; set; }

        /// <summary>
        /// Suitable Gauges Instruments Available Remarks
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Suitable Gauges Instruments Available Remarks")]
        public string SuitableGaugesInstrumentsAvailableRemarks { get; set; }

		/// <summary>
		/// Short Cut
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Short Cut")]
		public string ShortCut { get; set; }

		/// <summary>
		/// From Date
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "From Date")]
		[CommonDateTimeValidation(ErrorMessage = "Enter The Valid From Date in (yyyy-MM-dd) Format.")]
		public string FromDate { get; set; }

		/// <summary>
		/// To Date
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "To Date")]
		[CommonDateTimeValidation(ErrorMessage = "Enter The Valid To Date in (yyyy-MM-dd) Format.")]
		public string ToDate { get; set; }

		/// <summary>
		/// Param Type
		/// </summary>
		[DefaultValue("")]
        [Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter the Param Type (Insert/Update).")]
		public string ParamType { get; set; }
	}

	public class EnquiryCommonDetailsRequestParam
    {
        /// <summary>
        /// Enquiry Reference
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Enquiry Reference")]
        public string EnquiryReference { get; set; }

        /// <summary>
        /// Param Type
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Param Type")]
		[Required(ErrorMessage = "Enter the Param Type (GetEnquiryDetails/GetDesignReviewList/GetRegularEnquiryList/GetRegularEnquiryDetails/GetAllProductEnquiryList/GetProductEnquiryDetails/GetSampleLetterSummaryDetails/GetPreQuoteStageFormatDetails).")]
		public string ParamType { get; set; }
	}
	public class EnquiryCommonShortCutFilters
	{
		/// <summary>
		/// Short Cut
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Short Cut")]
		[Required(ErrorMessage = "Enter the ShortCut (Filter-Pending(IncludingSamplesPending)/Filter-SamplesPending/Filter-SamplesSent/Filter-Regret/Filter-Failed/Filter-OrderReceived/Filter-Closed/Filter-Successful/Filter-Tender/Filter-BidEnquiries/Filter-EmailQuote/Filter-PendingForCSR/Filter-Automotive/Filter-NonAutomotive/Filter-All).")]
		public string ShortCut { get; set; }
	}
	public class EnquiryCommonPrintCatlogCD
	{
		/// <summary>
		/// Enquiry Reference
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Enquiry Reference")]
		[Required(ErrorMessage = "Enter the Enquiry Reference.")]
		public string EnquiryReference { get; set; }
	}
	public class Approve
	{
		/// <summary>
		/// Enquiry Reference
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Enquiry Reference")]
		[Required(ErrorMessage = "Enter the Enquiry Reference.")]
		public string EnquiryReference { get; set; }

		/// <summary>
		/// Approved By
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Approved By")]
		public string ApprovedBy { get; set; }
	}
	public class DesignMOP
	{
		/// <summary>
		/// From Date
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "From Date")]
		[CommonDateTimeValidation(ErrorMessage = "Enter The Valid From Date in (yyyy-MM-dd) Format.")]
		public string FromDate { get; set; }

		/// <summary>
		/// To Date
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "To Date")]
		[CommonDateTimeValidation(ErrorMessage = "Enter The Valid To Date in (yyyy-MM-dd) Format.")]
		public string ToDate { get; set; }
	}
	public class EnquiryCommonListRequestParam : PaginationCommonMandatoryModel
    {

    }
}
