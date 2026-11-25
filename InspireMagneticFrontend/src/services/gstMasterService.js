// src/services/gstMasterService.js
import axios from "axios";
import { common, baseUrl, GSTMaster } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";

// Central axios instance for GST Master module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch GST Master List.
 * Uses the same URL / baseUrl pattern as hsnMasterService.
 */
export async function fetchGstMasterList(payload = { pageSize: 0, pageNumber: 0 }) {
  try {
    const response = await api.post(
      `${GSTMaster.getGSTMasterList}`,
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

/**
 * Fetch GST Master details for a specific GST Id.
 */
export async function fetchGstMasterDetails(gstId) {
  try {
    const response = await api.post(
      `${GSTMaster.getGSTMasterList}`,
      {
        gstid: gstId,
        paramType: "GetGSTMasterDetails",
      },
      {
        headers: buildAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// Generic dropdown fetcher (shared pattern with hsnMasterService)
async function getDropdownData(sourceTable, argumentValue = "") {
  try {
    const response = await api.post(
      `${common.getDropdownList}`,
      {
        sourceTable,
        argumentValue,
      },
      {
        headers: buildAuthHeaders(),
      }
    );

    return response.data?.data?.DROPDOWN_LIST || [];
  } catch (error) {
    handleApiError(error);
  }
}

// GST specific dropdowns
export const fetchGstPartnerOptions = () =>
  getDropdownData("PartnerName");

export const fetchGstStatusOptions = () =>
  getDropdownData("OthersNum", "GSTStatus");

export const fetchGstApplicableOptions = () =>
  getDropdownData("OthersNum", "GSTApplfor");

export async function saveOrUpdateGstMaster(payload) {
  try {
    const response = await api.post(
      `${GSTMaster.SaveAndUpdateGSTMasterDetails}`,
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
