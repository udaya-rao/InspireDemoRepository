// src/services/supplierMasterService.js
import axios from "axios";
import { SupplierMaster, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { getDropdownData } from "./commonService";
import { handleApiError } from "../lib/axiosSetup";

// Central axios instance for Supplier Master module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Supplier Master list.
 * @param {object} payload
 */
export async function fetchSupplierList(payload) {
  try {
    const res = await api.post(
      `${SupplierMaster.getSupplierList}`,
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
 * Fetch full details of Supplier Master.
 * @param {number} supplierID
 */
export async function fetchSupplierDetails(supplierID) {
  try {
    const res = await api.post(
      `${SupplierMaster.getSupplierDetails}`,
      {
        supplierID: supplierID
      },
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
 * Delete Supplier Master Details.
 *
 * @param {string} supplierID
 */
export async function deleteSupplier(supplierID) {
  try {
    const res = await api.post(
      `${SupplierMaster.deleteSupplierDetails}`,
      {
        supplierID: supplierID
      },
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
 * Check Supplier Name Exists.
 *
 * @param {string} supplierName
 */
export async function checkSupplierNameExist(supplierName) {
  try {
    const response = await api.post(
      `${SupplierMaster.checkItemCodeSupplier}`,
      {
        supplierName: supplierName,
      },
      {
        headers: buildAuthHeaders(),
      }
    );
    const message = response?.data?.data?.CHECK_SUPPLIER_NAME_EXIST_DETAILS_RESPONSE?.[0]?.Message;

    // Return both message and raw data (if you need more later)
    return { message, data: response?.data };
  } catch (error) {
    handleApiError(error);
  }
}

// Status Options Dropdown
export async function getStatusOptions() {
  return getDropdownData("OthersNum", "SupStatus");
}

// Supplier Type dropdown
export async function getSupplierType() {
  return getDropdownData("SupplierORCustomerType", "SupVenType");
}

// Supplier Supply dropdown
export async function getSupplierSupplyOptions() {
  return getDropdownData("OthersNum", "SupSupply");
}

/**
 * Save Or Update Supplier Master List.
 * @param {object} payload
 */
export async function saveAndUpdateSupplier(payload) {
  try {
    const response = await api.post(
      `${SupplierMaster.saveUpdateSupplier}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


