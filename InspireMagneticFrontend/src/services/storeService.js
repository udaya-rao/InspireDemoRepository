import axios from "axios";
import { Stores, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";
import { getDropdownData } from "./commonService";

const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Stock In Store Request List.
 * @param {object} payload
 */
export async function fetchStockInStoreRequestList(payload) {
  try {
    const res = await api.post(
      `${Stores.getStockInStoreRequestList}`,
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
 * Fetch Batch Detail By Store Request.
 * @param {object} payload
 */
export async function fetchBatchDetailByStoreRequest(payload) {
  try {
    const res = await api.post(
      `${Stores.getBatchDetailByStoreRequest}`,
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
 * Save and Update Batch Details.
 * @param {Array|object} payload
 */
export async function saveAndUpdateBatchDetails(payload) {
  try {
    const res = await api.post(
      `${Stores.saveAndUpdateBatchDetails}`,
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
 * Fetch Stock Out Store Request List.
 * @param {object} payload
 */
export async function fetchStockOutStoreRequestList(payload) {
  try {
    const res = await api.post(
      `${Stores.getStockOutStoreRequestList}`,
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
 * Fetch Stock Adjustment Request List.
 * @param {object} payload
 */
export async function fetchStockAdjustmentRequestList(payload) {
  try {
    const res = await api.post(
      `${Stores.getStockAdjustmentRequestList}`,
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
 * Fetch Stock Adjustment Request Details.
 * @param {object} payload - { adjustmentID: number }
 */
export async function fetchStockAdjustmentRequestDetails(payload) {
  try {
    const res = await api.post(
      `${Stores.getStockAdjustmentRequestDetails}`,
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
 * Fetch Adjustment Reason Dropdown Options.
 */
export async function getAdjustmentReasonOptions() {
  return getDropdownData("OthersNum", "AdjReason", "");
}

/**
 * Fetch Stock Adjustment Items Dropdown Options.
 */
export async function getStockAdjustmentItems() {
  return getDropdownData("StockAdjustmentItems", "", "");
}

/**
 * Save and Update Stock Adjustment Request Details.
 * @param {object} payload
 */
export async function saveAndUpdateStockAdjustmentRequestDetails(payload) {
  try {
    const res = await api.post(
      `${Stores.saveAndUpdateStockAdjustmentRequestDetails}`,
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
 * Approve Stock Adjustment Request Details.
 * @param {object} payload - { adjustmentID: number, approvedBy: string }
 */
export async function approveStockAdjustmentRequestDetails(payload) {
  try {
    const res = await api.post(
      `${Stores.approveStockAdjustmentRequestDetails}`,
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

export async function cancelStockAdjustmentRequestDetails(payload) {
  try {
    const res = await api.post(
      `${Stores.cancelStockAdjustmentRequestDetails}`,
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
 * Fetch Inventory Transaction Log List (Transaction History Overview).
 * @param {object} payload - { pageSize, pageNumber, searchFilter, isGlobalSearch, sortOrder, itemCode, fromDate, toDate }
 */
export async function fetchInventoryTransactionLogList(payload) {
  try {
    const res = await api.post(
      `${Stores.getInventoryTransactionLogList}`,
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
 * Fetch Current Stock List.
 * @param {object} payload - { pageSize, pageNumber, searchFilter, isGlobalSearch, sortOrder, shortCut, itemCode }
 */
export async function fetchCurrentStockList(payload) {
  try {
    const res = await api.post(
      `${Stores.getCurrentStockList}`,
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

