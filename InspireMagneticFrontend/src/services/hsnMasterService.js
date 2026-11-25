// src/services/hsnMasterService.js
import axios from "axios";
import { baseUrl, HSNMaster } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { getDropdownData } from "./commonService";
import { handleApiError } from "../lib/axiosSetup";

// Central axios instance for employee module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch HSN Master List.
 */
export async function fetchHSNMasterList() {
  const payload = {
    hsnid: 0,
    paramType: "GetAllHSNMasterList",
  };

  try {
    const res = await api.post(`${HSNMaster.getHSNMasterList}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

// HSN Status dropdown
export async function getHSNStatus() {
  return getDropdownData("OthersText", "HSNStatus");
}

// Local GST Data
export async function getLocalGSTData() {
  return getDropdownData("LocalGSTData", "");
}

// Inter State GST Data
export async function getInterStateGSTData() {
  return getDropdownData("InterstateGSTData", "");
}


// Save / Update HSN Master
export async function SaveAndUpdateHSNMaster(payload) {
  try {
    const response = await api.post(
      `${HSNMaster.SaveAndUpdateHSNMasterDetails}`,
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