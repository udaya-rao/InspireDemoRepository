import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Employee from "../pages/Employee/Employee.jsx";
import ChangeEmployeePassword from "../pages/Employee/ChangeEmployeePassword.jsx";
import Employers from "../pages/employer/Employer.jsx";
import HSNMaster from "../pages/hsnmaster/HSNMaster.jsx";
import GSTMaster from "../pages/gstmaster/GSTMaster.jsx";
import FGInventoryMaster from "../pages/fginventorymaster/FGInventoryMasterList.jsx";
import SupplierMaster from "../pages/suppliermaster/SupplierMasterList.jsx";
import InventoryMaster from "../pages/inventorymaster/InventoryMasterList.jsx";
import CustomerMaster from "../pages/customermaster/CustomerMasterList.jsx";
import InspectionMasterList from "../pages/inspectionmaster/InspectionMasterList.jsx";
import WorkOrderList from "../pages/workorder/WorkOrderList.jsx";
import JobCardList from "../pages/jobcard/JobCardList.jsx";
import WorkOrderToJobCard from "../pages/jobcard/WorkOrderToJobCard.jsx";
import DailyJob from "../pages/dailyjob/DailyJob.jsx";
import DailyJobData from "../pages/dailyjob/DailyJobdata.jsx";
import PurchaseOrderList from "../pages/purchaseorder/PurchaseOrderList.jsx";
import WorkOrderGRNList from "../pages/grn/WorkOrderGRNList.jsx";
import PurchaseGRNList from "../pages/grn/PurchaseGRNList.jsx";
import QualityGRNList from "../pages/grn/QualityGRNList.jsx";
import QuotationList from "../pages/marketing/quotation/QuotationList.jsx";
import OrderList from "../pages/marketing/order/OrderList.jsx";
// import InspectionResult from "../pages/grn/InspectionResult.jsx";

// ── Stores ────────────────────────────────────────────────────────────────
import StockAddition from "../pages/stores/StockAddition.jsx";
import StockDeduction from "../pages/stores/StockDeduction.jsx";
import StockTransfer from "../pages/stores/StockTransfer.jsx";
import StockAdjustment from "../pages/stores/StockAdjustment.jsx";
import TransactionHistory from "../pages/stores/TransactionHistory.jsx";
import CurrentStock from "../pages/stores/CurrentStock.jsx";
import PrintLabel from "../pages/printlabel/PrintLabel.jsx";
import DeliveryNoteList from "../pages/marketing/deliveryNote/DeliveryNoteList.jsx";
import SupplierItemList from "../pages/supplieritem/SupplierItemList.jsx";

const pages = [
  {
    key: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    content: <Dashboard />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="icon icon-tabler icons-tabler-outline icon-tabler-home"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
        <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
        <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
      </svg>
    ),
  },
  {
    key: "employer",
    title: "Company Information",
    path: "/companyinformation",
    content: <Employers />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18" />
        <path d="M9 8h6" />
        <path d="M10 12h4" />
        <path d="M3 10V3h18v7" />
        <path d="M4 21v-4h16v4" />
      </svg>
    ),
  },

  {
    key: "employee",
    title: "Employee Master",
    path: "/employees",
    content: <Employee />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },

  {
    key: "change-employee-password",
    title: "Change Employee Password",
    path: "/change-employee-password",
    content: <ChangeEmployeePassword />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },

  {
    key: "print-label",
    title: "Print Label",
    path: "/print-label",
    content: <PrintLabel />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
  },

  {
    key: "gstmaster",
    title: "GST Master",
    path: "/gstmaster",
    content: <GSTMaster />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M12 1v22M5 5h14a2 2 0 0 1 2 2v3H3V7a2 2 0 0 1 2-2zm-2 8h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7z" />
      </svg>
    ),
  },

  {
    key: "hsnmaster",
    title: "HSN Master",
    path: "/hsnmaster",
    content: <HSNMaster />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h10M7 12h6" />
      </svg>
    ),
  },
  {
    key: "fginventorymaster",
    title: "FG Inventory Master",
    path: "/fginventorymaster",
    content: <FGInventoryMaster />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="16" height="14" rx="2" />
        <path d="M16 3h-1a2 2 0 0 0-2 2v2" />
        <path d="M8 3h1a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
  {
    key: "inventorymaster",
    title: "Inventory Master",
    path: "/inventorymaster",
    content: <InventoryMaster />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      </svg>
    ),
  },

  {
    key: "suppliermaster",
    title: "Supplier Master",
    path: "/suppliermaster",
    content: <SupplierMaster />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18" />
        <path d="M3 10l4-3v3l4-3v6" />
        <path d="M13 13h4v8h-4z" />
        <path d="M17 13h4v8h-4z" />
      </svg>
    ),
  },
    {
    key: "supplieritem",
    title: "Supplier Item",
    path: "/supplieritem",
    content: <SupplierItemList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    key: "customermaster",
    title: "Customer Master",
    path: "/customermaster",
    content: <CustomerMaster />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },

  {
    key: "inspectionmaster",
    title: "Inspection Master",
    path: "/inspectionmaster",
    content: <InspectionMasterList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .69.41 1.31 1.01 1.58.28.13.59.2.9.2h.09a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    key: "workorder",
    title: "Work Order",
    path: "/workorder",
    content: <WorkOrderList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .69.41 1.31 1.01 1.58.28.13.59.2.9.2h.09a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    key: "jobcard",
    title: "Job Card",
    path: "/jobcard",
    content: <JobCardList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    key: "dailyjob",
    title: "My Job Card",
    path: "/dailyjob",
    content: <DailyJob />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    key: "dailyjobdata",
    title: "Daily Job Data",
    path: "/dailyjobdata",
    content: <DailyJobData />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    key: "wo-jobcards",
    title: "Job Cards",
    path: "/wo-jobcards",
    content: <WorkOrderToJobCard />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        style={{ marginRight: 6 }}
      >
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
      </svg>
    ),
  },
  {
    key: "purchase-order",
    title: "Purchase Order",
    path: "/purchase-order",
    content: <PurchaseOrderList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  // ── Marketing: Quotation ──────────────────────────────────────
  {
    key: "quotation",
    title: "Quotation",
    path: "/quotation",
    content: <QuotationList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    key: "order",
    title: "Order Acceptance",
    path: "/order",
    content: <OrderList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    key: "delivery-notes",
    title: "Delivery Notes",
    path: "/delivery-notes",
    content: <DeliveryNoteList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },

  // ── GRN: Work Order Goods Receipt ──────────────────────────────
  {
    key: "grn-work-order",
    title: "Work Order Goods Receipt",
    path: "/grn/work-order",
    content: <WorkOrderGRNList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },

  // ── GRN: Purchase Goods Receipt ──────────────────────────────
  {
    key: "grn-purchase",
    title: "Purchase Goods Receipt",
    path: "/grn/purchase",
    content: <PurchaseGRNList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },

  // ── GRN: Quality Inspection ────────────────────────────────
  {
    key: "grn-quality",
    title: "Quality Inspection",
    path: "/grn/quality",
    content: <QualityGRNList />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },

  // ── Stores ───────────────────────────────────────────────────────────────
  {
    key: "stores-stock-addition",
    title: "Stock Addition",
    path: "/stores/stock-addition",
    content: <StockAddition />,
    icon: (
      <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        style={{ marginRight: 6 }}
      >
        <path
          d="M16.75,15.25 v-1.25 a0.75,0.75 0 0,0 -1.5,0 v1.25 h-1.25 a0.75,0.75 0 0,0 0,1.5 h1.25 v1.25 a0.75,0.75 0 0,0 1.5,0 v-1.25 h1.25 a0.75,0.75 0 0,0 0,-1.5 h-1.25 zM20.454,19.637c-1.135,1.39-2.791,2.111-4.459,2.111-1.279,0-2.565-.423-3.631-1.293-1.144-.934-1.858-2.247-2.05-3.704h-5.314c-1.517,0-2.75-1.233-2.75-2.75V6c0-1.517,1.233-2.75,2.75-2.75h12c1.517,0,2.75,1.233,2.75,2.75v5.659c2.342,2.025,2.674,5.564.704,7.977ZM4.954,4.759l5.32,3.8c.435.311,1.019.31,1.453,0l5.32-3.8c-.016,0-.03-.009-.046-.009H5c-.016,0-.03.009-.046.009Zm10.468,5.52c.981-.101,1.947.051,2.828.428v-4.708c0-.08-.031-.149-.045-.224l-5.606,4.004c-.478.342-1.039.513-1.599.513s-1.121-.171-1.599-.513L3.795,5.776c-.014.075-.045.145-.045.224v8c0,.689.561,1.25,1.25,1.25h5.313c.137-1.049.547-2.046,1.233-2.887.972-1.189,2.348-1.93,3.876-2.084Zm3.266,2.429c-.879-.719-1.988-1.05-3.115-.937-1.129.114-2.147.661-2.865,1.541-.718.879-1.051,1.986-.937,3.115s.661,2.147,1.541,2.865c1.816,1.482,4.499,1.211,5.98-.604,1.482-1.815,1.211-4.498-.604-5.98Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    key: "stores-stock-deduction",
    title: "Stock Deduction",
    path: "/stores/stock-deduction",
    content: <StockDeduction />,
    icon: (
      <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        style={{ marginRight: 6 }}
      >
        <path
          d="M18,15.25 h-4 a0.75,0.75 0 0,0 0,1.5 h4 a0.75,0.75 0 0,0 0,-1.5 zM20.454,19.637c-1.135,1.39-2.791,2.111-4.459,2.111-1.279,0-2.565-.423-3.631-1.293-1.144-.934-1.858-2.247-2.05-3.704h-5.314c-1.517,0-2.75-1.233-2.75-2.75V6c0-1.517,1.233-2.75,2.75-2.75h12c1.517,0,2.75,1.233,2.75,2.75v5.659c2.342,2.025,2.674,5.564.704,7.977ZM4.954,4.759l5.32,3.8c.435.311,1.019.31,1.453,0l5.32-3.8c-.016,0-.03-.009-.046-.009H5c-.016,0-.03.009-.046.009Zm10.468,5.52c.981-.101,1.947.051,2.828.428v-4.708c0-.08-.031-.149-.045-.224l-5.606,4.004c-.478.342-1.039.513-1.599.513s-1.121-.171-1.599-.513L3.795,5.776c-.014.075-.045.145-.045.224v8c0,.689.561,1.25,1.25,1.25h5.313c.137-1.049.547-2.046,1.233-2.887.972-1.189,2.348-1.93,3.876-2.084Zm3.266,2.429c-.879-.719-1.988-1.05-3.115-.937-1.129.114-2.147.661-2.865,1.541-.718.879-1.051,1.986-.937,3.115s.661,2.147,1.541,2.865c1.816,1.482,4.499,1.211,5.98-.604,1.482-1.815,1.211-4.498-.604-5.98Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    key: "stores-stock-transfer",
    title: "Stock Transfer",
    path: "/stores/stock-transfer",
    content: <StockTransfer />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
  },
  {
    key: "stores-stock-adjustment",
    title: "Stock Adjustment",
    path: "/stores/stock-adjustment",
    content: <StockAdjustment />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    key: "stores-transaction-history",
    title: "Transaction History",
    path: "/stores/transaction-history",
    content: <TransactionHistory />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    key: "stores-current-stock",
    title: "Current Stock",
    path: "/stores/current-stock",
    content: <CurrentStock />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 6 }}
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 3h-1a2 2 0 0 0-2 2v2M8 3h1a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
];

export default pages;
