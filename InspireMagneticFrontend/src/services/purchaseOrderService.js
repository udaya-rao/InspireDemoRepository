import axios from "axios";
import { PurchaseOrder, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";
import { getDropdownData } from "./commonService";

const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Purchase Order Header list.
 * @param {object} payload
 */
export async function fetchPurchaseOrderList(payload) {
  try {
    const res = await api.post(
      `${PurchaseOrder.getPurchaseOrderHeaderList}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Save and Update Purchase Order Header.
 * @param {object} payload
 */
export async function saveAndUpdatePurchaseOrderHeader(payload) {
  try {
    const res = await api.post(
      `${PurchaseOrder.saveAndUpdatePurchaseOrderHeader}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Fetch Purchase Order Header Details.
 * @param {object} payload
 */
export async function fetchPurchaseOrderHeaderDetails(payload) {
  try {
    const res = await api.post(
      `${PurchaseOrder.getPurchaseOrderHeaderDetails}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Fetch Purchase Order Header PDF.
 * @param {object} payload - { purchaseOrderID: number }
 */
export const fetchPurchaseOrderHeaderPDF = async (payload) => {
  try {
    const res = await api.post(
      `${PurchaseOrder.getPurchaseOrderHeaderPDF}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Short Close or Recall Purchase Order Details.
 * @param {object} payload
 */
export async function shortCloseOrRecallPurchaseOrderDetails(payload) {
  try {
    const res = await api.post(
      `${PurchaseOrder.shortCloseOrRecallPurchaseOrderDetails}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Approve Purchase Order Details.
 * @param {object} payload
 */
export async function approvePurchaseOrderHeaderDetails(payload) {
  try {
    const res = await api.post(
      `${PurchaseOrder.approvePurchaseOrderHeaderDetails}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Fetch Purchase Order Types for dropdown.
 */
export async function fetchPurchaseOrderTypes() {
  return await getDropdownData("OthersNum", "PurType");
}

/**
 * Fetch Supplier Names for PO dropdown.
 */
export async function fetchPOSupplierNames() {
  return await getDropdownData("POSupplierName", "");
}

/**
 * Fetch Currencies for PO dropdown.
 */
export async function fetchPOCurrencies() {
  return await getDropdownData("Currency", "");
}

/**
 * Fetch Price Scopes for PO dropdown.
 */
export async function fetchPOPriceScopes() {
  return await getDropdownData("Pricescope", "");
}

/**
 * Fetch InvProductList for PO dropdown.
 * @param {string|number} supplierID
 */
export async function fetchPOInvProducts(supplierID = "") {
  return await getDropdownData("InvProductList", String(supplierID || ""));
}
