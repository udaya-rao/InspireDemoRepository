// src/services/employeeService.js
import axios from "axios";
import { employee, auth, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { getDropdownData } from "./commonService";
import { handleApiError } from "../lib/axiosSetup";

// Central axios instance for employee module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch employee master list.
 * @param {{ pageSize?: number, pageNumber?: number }} opts
 */
export async function fetchEmployeeList(opts = {}) {
  const payload = {
    pageSize: opts.pageSize ?? 0,
    pageNumber: opts.pageNumber ?? 0,
  };

  try {
    const res = await api.post(`${employee.getEmployeeList}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Fetch full details of a single employee.
 * @param {number} employeeID
 */
export async function fetchEmployeeDetails(employeeID) {
  try {
    const res = await api.post(
      `${employee.getEmployeeDetails}`,
      {
        employeeID,
        ruleID: 0,
        paramType: "GetEmployeeDetails",
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
 * Delete employee.
 * @param {number} employeeID
 */
export async function deleteEmployee(employeeID) {
  try {
    const res = await api.post(
      `${employee.deleteEmployeeDetails}`,
      {
        employeeID,
        paramType: "DeleteEmployeeDetails",
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

// Department dropdown
export async function getDepartments() {
  return getDropdownData("Department", "");
}

// Login ID Dropdown in Change Employee Password Screen.
export async function getLoginIDs() {
  return getDropdownData("EmployeeLoginID", "");
}

// Employee status dropdown
export async function getEmployeeStatus() {
  return getDropdownData("OthersNum", "EmpStatus");
}

// Save / Update employee
export async function saveOrUpdateEmployee(payload) {
  try {
    const response = await api.post(
      `${employee.saveUpdateEmployeeDetails}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    // { Status, data: { ValidationErrors, EMPLOYEE_MASTER_RESPONSE, ... } }
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// Get employee details by ID
export async function getEmployeeDetailsById(employeeID) {
  try {
    const response = await api.post(
      `${employee.getEmployeeDetails}`,
      {
        employeeID,
        ruleID: 0,
        paramType: "GetEmployeeDetails",
      },
      {
        headers: buildAuthHeaders(),
      }
    );
    // { data: { EMPLOYEE_DETAILS: [...] }, Status? }
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function changeEmployeePassword(payload) {
  try {
    const response = await api.post(
      `${auth.change_employee_password}`,
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
