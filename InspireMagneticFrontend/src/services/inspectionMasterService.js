// src/services/inspectionMasterService.js
import axios from "axios";
import { InspectionMaster, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";
import { getDropdownData } from "./commonService";

// Central axios instance for Inspection Master module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Inspection Master list.
 
 */
export async function fetchInspectionMasterList(payload) {
  try {
    const res = await api.post(
      `${InspectionMaster.getInspectionList}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Fetch Characteristic Master dropdown options
 */
export async function getCharacteristicMasterOptions() {
  return getDropdownData("CharacteristicMaster", "");
}

/**
 * Fetch Inspection Items dropdown options
 */
export async function getInspectionItemsOptions() {
  return getDropdownData("InspectionItems", "");
}

/**
 * Save or Update Characteristic Master
 * @param {Array} payload - Array of characteristic objects
 * @param {number} payload[].characteristicID - Characteristic ID (0 for new, existing ID for update)
 * @param {string} payload[].characteristicName - Characteristic name
 */
export async function saveAndUpdateCharacteristicMaster(payload) {
  try {
    const res = await api.post(
      `${InspectionMaster.saveAndUpdateCharacteristicMaster}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Get Inspection Master Details
 * @param {object} payload - Request payload
 * @param {number} payload.fgRmItemID - Item ID
 * @param {string} payload.itemType - Item type ("FG" or "RM")
 */
export async function getInspectionMasterDetails(payload) {
  try {
    const res = await api.post(
      `${InspectionMaster.getInspectionMasterDetails}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Save or Update Inspection Master

 */
export async function saveAndUpdateInspectionMaster(payload) {
  try {
    const res = await api.post(
      `${InspectionMaster.saveAndUpdateInspectionMaster}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Delete Inspection Master
 * @param {object} payload
 * @param {number} payload.fgRmItemID - Item ID
 * @param {string} payload.itemType - Item type ("FG" or "RM")
 */
export async function deleteInspectionMaster(payload) {
  try {
    const res = await api.post(
      `${InspectionMaster.deleteInspectionMaster}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Upload Inspection Video File
 * @param {object} params
 * @param {string} params.itemCode - Item Code
 * @param {string} params.characteristicName - Characteristic Name (category)
 * @param {string} params.subCharacteristicName - Sub Characteristic Name
 * @param {File} params.file - Video File
 * @param {function} onUploadProgress - Progress callback
 */
export async function uploadInspectionVideoFiles({ inspectionID, itemCode, file }, onUploadProgress) {
  try {
    const formData = new FormData();
    formData.append("UploadFiles", file);

    const queryParams = new URLSearchParams({
      InspectionID: inspectionID,
      ItemCode: itemCode,
    }).toString();

    const res = await api.post(
      `${InspectionMaster.uploadInspectionVideoFiles}?${queryParams}`,
      formData,
      {
        headers: {
          ...buildAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * View or Delete Inspection Video Files
 * @param {object} payload
 * @param {string} payload.itemCode
 * @param {string} payload.characteristicName
 * @param {string} payload.subCharacteristicName
 * @param {string} payload.fileName
 * @param {string} payload.paramType - "View" or "Delete"
 */
export async function viewOrDeleteInspectionVideoFiles(payload) {
  try {
    const res = await api.post(
      `${InspectionMaster.viewOrDeleteInspectionVideoFiles}`,
      payload,
      {
        headers: buildAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}