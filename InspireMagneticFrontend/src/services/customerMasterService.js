// src/services/customerMasterService.js
import axios from "axios";
import { CustomerMaster, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { getDropdownData } from "./commonService";
import { handleApiError } from "../lib/axiosSetup";

// Central axios instance for Customer Master module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Customer Master list.
 * @param {object} payload
 */
export async function fetchCustomerList(payload) {
  try {
    const res = await api.post(
      `${CustomerMaster.getCustomerList}`,
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
 * Fetch full details of Customer Master.
 * @param {number} customerID
 */
export async function fetchCustomerDetails(customerID) {
  try {
    const res = await api.post(
      `${CustomerMaster.getCustomerDetails}`,
      {
        customerID: customerID
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
 * Delete Customer Master Details.
 *
 * @param {string} customerID
 */
export async function deleteCustomer(customerID) {
  try {
    const res = await api.post(
      `${CustomerMaster.deleteCustomerDetails}`,
      {
        customerID: customerID
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
 * Check Customer Name Exists.
 *
 * @param {string} customerName
 */
export async function checkCustomerNameExist(customerName) {
  try {
    const response = await api.post(
      `${CustomerMaster.checkItemCodeCustomer}`,
      {
        customerName: customerName,
      },
      {
        headers: buildAuthHeaders(),
      }
    );
    const message = response?.data?.data?.CHECK_CUSTOMER_NAME_EXIST_DETAILS_RESPONSE?.[0]?.Message;

    // Return both message and raw data (if you need more later)
    return { message, data: response?.data };
  } catch (error) {
    handleApiError(error);
  }
}

// Status Options Dropdown
export async function getStatusOptions() {
  return getDropdownData("OthersNum", "CustStatus");
}

// Customer Type dropdown
export async function getCustomerType() {
  return getDropdownData("SupplierORCustomerType", "CustType");
}

// Customer Supply dropdown
export async function getCustomerSupply() {
  return getDropdownData("OthersNum", "CustSupply");
}

// Responsible Person dropdown
export async function getResponsiblePerson() {
  return getDropdownData("ResponsiblePersonID", "");
}
/**
 * Save Or Update Customer Master List.
 * @param {object} payload
 */
export async function saveAndUpdateCustomer(payload) {
  try {
    const response = await api.post(
      `${CustomerMaster.saveUpdateCustomer}`,
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

