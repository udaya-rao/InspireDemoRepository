// src/services/inventoryMasterService.js
import axios from "axios";
import { baseUrl, InventoryMaster } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { getDropdownData } from "./commonService";
import { handleApiError } from "../lib/axiosSetup";

// Central axios instance for inventory master module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Inventory Master List
 * Uses GetInventoryList API with search and pagination support
 * @param {Object} options - Search and pagination options
 * @param {number} options.pageSize - Number of items per page (default: 1000)
 * @param {number} options.pageNumber - Page number (default: 0)
 * @param {Array} options.searchFilter - Array of search filters with columnName and searchKeyword
 * @param {number} options.isGlobalSearch - Global search flag (default: 0)
 * @param {string} options.sortOrder - Sort order ASC/DESC (default: "ASC")
 */
export async function fetchInventoryMasterList(options = {}) {
  const payload = {
    pageSize: options.pageSize || 1000,
    pageNumber: options.pageNumber || 0,
    searchFilter: options.searchFilter || [],
    isGlobalSearch: options.isGlobalSearch || 0,
    sortOrder: options.sortOrder || "ASC",
  };

  try {
    const res = await api.post(InventoryMaster.getInventoryList, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Fetch Inventory List by Shortcut
 * @param {string} shortcutValue - Shortcut filter value (e.g., 'ValidOnly', 'PlatingPartsOnly')
 * @param {string} itemCode - Item code filter (default: empty string)
 */
export async function fetchInventoryByShortcut(shortcutValue, itemCode = "") {
  const payload = {
    ShortCut: shortcutValue,
    itemCode,
  };

  try {
    const res = await api.post(InventoryMaster.getInventoryShortCuts, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Fetch Inventory Details by Item ID
 * @param {number|string} itemID - Item ID (can be number or string that can be converted to number)
 * @param {string} paramType - Parameter type (default: 'GetInventoryMasterDetails')
 */
export async function fetchInventoryDetails(itemID) {
  // Convert itemID to number if it's a string
  const numericItemID = typeof itemID === 'string' ? parseInt(itemID, 10) : itemID;
  
  const payload = {
    itemID: numericItemID
  };

  try {
    const res = await api.post(InventoryMaster.getInventoryDetails, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Delete Inventory Item
 * @param {number|string} itemID - Item ID to delete
 * @param {string} paramType - Parameter type (default: 'DeleteInventoryItem')
 */
export async function deleteInventoryItem(itemID) {
  const payload = {
    itemID: typeof itemID === "string" ? Number(itemID) : itemID
  };

  try {
    const res = await api.post(InventoryMaster.deleteInventory, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Save or Update Inventory Master
 * @param {Object} payload - Inventory master data payload
 */
export async function saveAndUpdateInventoryMaster(payload) {
  try {
    const res = await api.post(InventoryMaster.saveAndUpdateInventory, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Check if an Inventory Item Code already exists
 * @param {string} itemCode - Item code to check
 */
export async function checkInventoryItemCodeExist(itemCode) {
  try {
    const response = await api.post(
      `${InventoryMaster.checkInventoryItemCodeExist}`,
      {
        itemCode: itemCode,
      },
      {
        headers: buildAuthHeaders(),
      }
    );
    const message = response?.data?.data?.CHECK_ITEM_CODE_EXIST_RESPONSE?.[0]?.Message;

    // Return both message and raw data (if you need more later)
    return { message, data: response?.data };
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Fetch Inventory Parts List (for Alt Code dropdown)
 * Uses GetInventoryList API with search and pagination support
 * @param {Object} options - Search and pagination options
 * @param {number} options.pageSize - Number of items per page (default: 1000 for dropdown)
 * @param {number} options.pageNumber - Page number (default: 0)
 * @param {Array} options.searchFilter - Array of search filters with columnName and searchKeyword
 * @param {number} options.isGlobalSearch - Global search flag (default: 0)
 * @param {string} options.sortOrder - Sort order ASC/DESC (default: "ASC")
 */
export async function fetchInventoryPartsList(options = {}) {
  const payload = {
    pageSize: options.pageSize || 1000,
    pageNumber: options.pageNumber || 0,
    searchFilter: options.searchFilter || [],
    isGlobalSearch: options.isGlobalSearch || 0,
    sortOrder: options.sortOrder || "ASC",
  };

  try {
    const res = await api.post(InventoryMaster.getInventoryList, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Dropdown data fetchers

/**
 * Fetch Status Options
 */
export async function getInventoryStatusOptions() {
  return getDropdownData("OthersNum", "InvStatus");
}

/**
 * Fetch Item Type Options
 */
export async function getItemTypeOptions() {
  return getDropdownData("itemType", "PP");
}

/**
 * Fetch RoHS Options
 */
export async function getRohsOptions() {
  return getDropdownData("OthersText", "InvRoHS");
}

/**
 * Fetch Automotive Items Options
 */
export async function getAutomotiveItemsOptions() {
  return getDropdownData("OthersText", "InvAuto");
}

/**
 * Fetch Plating Surface Area Unit Options
 */
export async function getPlatingSurfaceAreaUnitOptions() {
  return getDropdownData("OthersText", "InvSurface");
}

/**
 * Fetch Plating Thickness Unit Options
 */
export async function getPlatingThicknessUnitOptions() {
  return getDropdownData("OthersText", "InvThick");
}

/**
 * Fetch Classification Options
 */
export async function getClassificationOptions() {
  return getDropdownData("OthersNum", "InvClassi");
}

/**
 * Fetch HSN Code Options
 */
export async function getHsnCodeOptions() {
  return getDropdownData("FGHSNCode", "");
}

/**
 * Fetch Plating Type Options
 */
export async function getPlatingTypeOptions() {
  return getDropdownData("platingName", " ");
}

/**
 * Fetch Inspection Type Options
 */
export async function getInspectionTypeOptions() {
  return getDropdownData("OthersText", "InvInsType");
}

/**
 * Fetch Item Category Options
 */
export async function getItemCategoryOptions() {
  return getDropdownData("OthersNum", "INVItemCls");
}

