// src/services/fgInventoryMasterService.js
import axios from "axios";
import { FGInventoryMaster, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { getDropdownData } from "./commonService";
import { handleApiError } from "../lib/axiosSetup";

// Central axios instance for FG Inventory Master module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch FG Inventory master list.
 * @param {object} payload
 */
export async function fetchFGInventoryList(payload) {
  try {
    const res = await api.post(
      `${FGInventoryMaster.getFGInventoryList}`,
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
 * Fetch full details of FG Inventory Master.
 * @param {number} fgItemID
 */
export async function fetchFGInventoryDetails(fgItemID) {
  try {
    const res = await api.post(
      `${FGInventoryMaster.getFGInventoryDetails}`,
      {
        fgItemID: fgItemID
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
 * Delete FG Inventory Master Details.
 *
 * @param {string} fgItemID
 */
export async function deleteFGInventory(fgItemID) {
  try {
    const res = await api.post(
      `${FGInventoryMaster.deleteFGInventoryDetails}`,
      {
        fgItemID: fgItemID
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
 * Check FG Inventory Item Code Exists.
 *
 * @param {string} itemCode
 */
export async function checkFGInventoryItemCodeExist(itemCode) {
  try {
    const response = await api.post(
      `${FGInventoryMaster.checkItemCodeFGInventory}`,
      {
        itemCode: itemCode,
      },
      {
        headers: buildAuthHeaders(),
      }
    );
    const message = response?.data?.data?.ITEM_CODE_EXISTENCE_RESPONSE?.[0]?.Message;

    // Return both message and raw data (if you need more later)
    return { message, data: response?.data };
  } catch (error) {
    handleApiError(error);
  }
}

// Item Type Dropdown
export async function getItemType() {
  return getDropdownData("ItemType", "FG");
}

// Status Options Dropdown
export async function getStatusOptions() {
  return getDropdownData("OthersNum", "InvStatus");
}

// HSN Type dropdown
export async function getHSNType() {
  return getDropdownData("FGHSNCode", "");
}

/**
 * Save Or Update FG Inventory Master List.
 * @param {object} payload
 */
export async function saveAndUpdateFGInventory(payload) {
  try {
    const response = await api.post(
      `${FGInventoryMaster.saveUpdateFGInventory}`,
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
