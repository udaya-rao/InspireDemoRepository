// src/services/workOrderService.js
import axios from "axios";
import { WorkOrder, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";
import { getDropdownData } from "./commonService";

const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Work Order Header list.
 * @param {object} payload
 */
export async function fetchWorkOrderHeaderList(payload) {
  try {
    const res = await api.post(
      `${WorkOrder.getWorkOrderHeaderList}`,
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
 * Save and Update Work Order Header.
 * @param {object} payload
 */
export async function saveAndUpdateWorkOrderHeader(payload) {
  try {
    const res = await api.post(
      `${WorkOrder.saveAndUpdateWorkOrderHeader}`,
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
 * Fetch Work Order Header Details.
 * @param {object} payload
 */
export async function fetchWorkOrderHeaderDetails(payload) {
  try {
    const res = await api.post(
      `${WorkOrder.getWorkOrderHeaderDetails}`,
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
 * Fetch Work Order Types for dropdown.
 */
export async function fetchWorkOrderTypes() {
  return await getDropdownData("OthersNum", "WOType");
}

/**
 * Fetch Supplier Names for dropdown.
 */
export async function fetchSupplierNames() {
  return await getDropdownData("SupplierName", "");
}

/**
 * Approve Work Order Details.
 * @param {object} payload
 */
export async function approveWorkOrderDetails(payload) {
  try {
    const res = await api.post(
      `${WorkOrder.approveWorkOrderDetails}`,
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
 * Short Close or Recall Work Order Details.
 * @param {object} payload
 */
export async function shortCloseWorkOrderDetails(payload) {
  try {
    const res = await api.post(
      `${WorkOrder.shortCloseWorkOrderDetails}`,
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
 * Fetch FG Product List for dropdown.
 */
export async function fetchFGProductList() {
  return await getDropdownData("FGProductList", "");
}

/**
 * Fetch Work Order Header PDF.
 * @param {object} payload
 */
export async function fetchWorkOrderHeaderPDF(payload) {
  try {
    const res = await api.post(
      `${WorkOrder.getWorkOrderHeaderPDF}`,
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
