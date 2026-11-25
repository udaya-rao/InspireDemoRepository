import axios from "axios";
import { baseUrl, BOM } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { getDropdownData } from "./commonService";
import { handleApiError } from "../lib/axiosSetup";

// Central axios instance for Bill Of Material module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Operation dropdown options
 */
export async function getOperationOptions() {
  return getDropdownData("OperationID", "");
}

/**
 * Fetch paginated item codes
 */
export async function getItemCodeList({ pageNumber = 0, pageSize = 20, searchKeyword = "" } = {}) {
  try {
    const response = await api.post(
      BOM.getItemCodeList,
      {
        pageNumber,
        pageSize,
        searchKeyword,
      },
      {
        headers: {
          ...buildAuthHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Save and Update BOM Master
 */
export async function saveAndUpdateBOMMaster(payload) {
  try {
    const response = await api.post(
      BOM.saveAndUpdateBOMMaster,
      payload,
      {
        headers: {
          ...buildAuthHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Get BOM Master Details
 */
export async function getBOMMasterDetails(payload) {
  try {
    const response = await api.post(
      BOM.getBOMMasterDetails,
      payload,
      {
        headers: {
          ...buildAuthHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}
