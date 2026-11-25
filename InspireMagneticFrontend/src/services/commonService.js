// src/services/commonService.js
import axios from "axios";
import { common, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";

const api = axios.create({
  baseURL: baseUrl,
});

// Generic dropdown fetcher
export async function getDropdownData(
  sourceTable,
  argumentValue = "",
  argumentValue1 = "",
  argument1Mandatory = false,
) {
  try {
    const payload = { sourceTable, argumentValue };
    if (argument1Mandatory || argumentValue1) {
      payload.argumentValue1 = argumentValue1;
    }
    const response = await api.post(`${common.getDropdownList}`, payload, {
      headers: buildAuthHeaders(),
    });

    return response.data?.data?.DROPDOWN_LIST || [];
  } catch (error) {
    handleApiError(error);
  }
}
