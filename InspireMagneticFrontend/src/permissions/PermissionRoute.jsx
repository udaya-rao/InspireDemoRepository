import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasPermission, menuPermissions } from './permissionUtils';
import { useToast } from '../components/useToast';

// Route permission mapping
export const routePermissions = {
  '/dashboard': null, // No permission required for dashboard
  '/employees': menuPermissions.EMPLOYEE_MASTER,
  '/companyinformation': menuPermissions.COMPANY_INFORMATION,
  '/targetmaster': menuPermissions.TARGET_MASTER,
  '/suppliermaster': menuPermissions.SUPPLIER_MASTER,
  '/suppliermaster': menuPermissions.SUPPLIER_MASTER,
  '/supplieritem': menuPermissions.SUPPLIER_ITEM,
  '/inventorymaster': menuPermissions.INVENTORY_MASTER,
  '/fginventorymaster': menuPermissions.FG_INVENTORY_MASTER,
  '/gstmaster': menuPermissions.GST_MASTER,
  '/hsnmaster': menuPermissions.HSN_MASTER,
  '/hs-codemaster': menuPermissions.HS_CODE_MASTER,
  '/products': null, // No specific permission defined
  '/variable-setting': menuPermissions.VARIABLE_SETTING_COSTING,
  '/spares-inventory-master': menuPermissions.SPARES_INVENTORY_MASTER,
  '/divisionmaster': menuPermissions.DIVISION_MASTER,
  '/customerapproval': menuPermissions.CUSTOMER_APPROVAL,
  '/metalmaster': menuPermissions.METAL_MASTER,
  '/engineering-change-request': menuPermissions.ENGINEERING_CHANGE_REQUEST,
  '/engineering-change-notice': menuPermissions.ENGINEERING_CHANGE_NOTICE,
  '/currencymaster': menuPermissions.CURRENCY_MASTER,
  '/customermaster': menuPermissions.CUSTOMER_MASTER,
  '/item-type-master-fg': menuPermissions.ITEM_TYPE_MASTER_FG,
  '/item-type-master-pp': menuPermissions.ITEM_TYPE_MASTER_PP,
  '/certificate-info': null, // No specific permission defined
  '/view-file': null, // No specific permission defined
  '/customer-enquiry-list': null, // No specific permission defined
  '/raw-material-cost-master': menuPermissions.RAW_MATERIAL_COST_MASTER,
  '/wastage-cost-master': menuPermissions.WASTAGE_COST_MASTER,
  '/plating-cost-master': menuPermissions.PLATING_COST_MASTER,
  '/additional-cost-master': menuPermissions.ADDITIONAL_COST_MASTER,
  '/price-code-master': menuPermissions.PRICE_CODE_MASTER,
  '/inspectionmaster': menuPermissions.INSPECTION_MASTER,
  '/workorder': menuPermissions.WORK_ORDER,
  '/jobcard': menuPermissions.JOB_CARD,
  '/dailyjob': menuPermissions.JOB_CARD,
  '/dailyjobdata': menuPermissions.DAILY_JOB,
  '/purchase-order': menuPermissions.PURCHASE_ORDER,
  '/grn/work-order': menuPermissions.WORKORDER_GRN,
  '/grn/purchase': menuPermissions.PURCHASE_ORDER_GRN,
  '/quotation': menuPermissions.QUOTATION,
  '/order': menuPermissions.ORDER_ACCEPTANCE,
  '/delivery-notes': menuPermissions.DELIVERY_NOTE, 
  '/grn/quality': menuPermissions.GOODS_RECEIPT_NOTE_QUALITY,
  '/stores/stock-addition': menuPermissions.ALLOW_TO_ADD_DEDUCT_STOCK_OPERATIONS,
  '/stores/stock-deduction': menuPermissions.ALLOW_TO_ADD_DEDUCT_STOCK_OPERATIONS,
  '/stores/stock-adjustment': menuPermissions.ALLOW_TO_OPEN_STOCK_ADJUSTMENT,
};

function PermissionRoute({ children, path }) {
  const { showToast } = useToast();

  // Check if authentication is required
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Check if permission is required for this route
  const requiredPermission = routePermissions[path];

  // console.log('PermissionRoute Debug:', {
  //   path,
  //   requiredPermission,
  //   hasPermission: requiredPermission ? hasPermission(requiredPermission) : 'N/A'
  // });

  // If no permission is required, allow access
  if (requiredPermission === null) {
    console.log('No permission required, allowing access');
    return children;
  }

  // If permission is required, check if user has it
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log('Permission denied, redirecting to dashboard');
    // Show toast message and redirect to dashboard
    showToast(`You don't have permission to access this page. Required permission: ${requiredPermission}`, 'error');
    return <Navigate to="/dashboard" replace />;
  }

  // User has permission, allow access
  console.log('Permission granted, allowing access');
  return children;
}

export default PermissionRoute;