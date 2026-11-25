// src/services/employerService.js
import axios from "axios";
import { baseUrl, employer as employerUrls } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";

// Central axios instance for Employer module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Employer list.
 */
export async function fetchEmployerList() {
  const payload = {
    employerID: 0,
    paramType: "GetAllEmployerList",
  };

  try {
    const response = await api.post(
      `${employerUrls.getEmployerList}`,
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
 * Fetch Employer details for a specific employer.
 */
export async function fetchEmployerDetails(employerID) {
  try {
    const response = await api.post(
      `${employerUrls.getEmployerList}`,
      {
        employerID,
        paramType: "GetEmployerDetails",
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

/**
 * Save or update Employer record.
 */
export async function saveOrUpdateEmployer(payload) {
  try {
    const response = await api.post(
      `${employerUrls.SaveAndUpdateEmployerDetails}`,
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
