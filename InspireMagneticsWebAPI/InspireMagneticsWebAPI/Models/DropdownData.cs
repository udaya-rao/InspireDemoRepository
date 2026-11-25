using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace InspireMagneticsWebAPI.Models
{
	public class DropdownData
	{
		/// <summary>
		/// Source Table
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Source Table")]
		[Required(ErrorMessage = "Enter The Source Table (Department/EmployeeLoginID/LocalGSTData/InterstateGSTData/FGHSNCode/ResponsiblePersonID/InspectionItems/CharacteristicMaster/OperationID/ItemCode/SupplierName/FGProductList/InvProductList/Currency/Pricescope/POSupplierName/WorkOrderID/PurchaseOrderID/QuotationProductsList/SubCharacteristicNameList/OrderQuotationNo/OrderQuotationProductsList/BatchNo/StockAdjustmentItems/StateCode/DeliveryNoteOrderNo/DeliveryNoteOrderProductsList/SupplierItemProductList).")]
		public string SourceTable { get; set; }

		/// <summary>
		/// Argument Value
		/// </summary>
		[DefaultValue("")]
		[Display(Name = "Argument Value")]
		public string ArgumentValue { get; set; }

        /// <summary>
        /// Argument Value1
        /// </summary>
        [DefaultValue("")]
        [Display(Name = "Argument Value1")]
        public string ArgumentValue1 { get; set; }
    }
}
