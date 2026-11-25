// src/services/securityMasterService.js
// Centralised API calls for SecurityMaster

import axios from "axios";
import { baseUrl, employee } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";

// Axios instance for SecurityMaster
const api = axios.create({
  baseURL: baseUrl,
});

// ----------------------------------------------------------------------
// Fetch all rules + rules assigned to a given employee
// ----------------------------------------------------------------------
export const getEmployeeSecurityAccessLists = async (employeeId) => {
  try {
    // Fetch all available rules
    const allRulesRequest = api.post(
      `${employee.getEmployeeSecurityAccessList}`,
      { paramType: "GetAllSecurityAccessList" },
      {
        headers: buildAuthHeaders(),
      }
    );

    // Fetch employee's assigned rules
    const assignedPayload = {
      employeeID: employeeId,
      paramType: "GetAllSecurityAccessList",
    };

    const assignedRulesRequest = api.post(
      `${employee.getEmployeeSecurityAccessList}`,
      assignedPayload,
      {
        headers: buildAuthHeaders(),
      }
    );

    const [allRulesResponse, assignedRulesResponse] = await Promise.all([
      allRulesRequest,
      assignedRulesRequest,
    ]);

    return { allRulesResponse, assignedRulesResponse };
  } catch (error) {
    handleApiError(error);
  }
};

// ----------------------------------------------------------------------
// Save / update employee security access
// ----------------------------------------------------------------------
export const saveEmployeeSecurityAccess = async (requestBody) => {
  try {
    const response = await api.post(
      `${employee.saveUpdateEmployeeSecurityAccess}`,
      requestBody,
      {
        headers: buildAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
