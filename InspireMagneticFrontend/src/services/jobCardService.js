// src/services/jobCardService.js
import axios from "axios";
import { JobCard, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";

const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Job Card list.
 * @param {object} payload
 */
export async function fetchJobCardList(payload) {
  try {
    const res = await api.post(
      `${JobCard.getJobCardList}`,
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
 * Fetch Job Card details.
 * @param {object} payload - { workOrderLineID, jobCardID }
 */
export async function fetchJobCardDetails(payload) {
  try {
    const res = await api.post(
      `${JobCard.getJobCardDetails}`,
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
 * Fetch generic drop down data.
 * @param {object} payload - { sourceTable, argumentValue }
 */
export async function fetchDropDownData(payload) {
  try {
    const res = await api.post(
      `${baseUrl}/api/Master/GetDropDownData`,
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
 * Save or Update Job Card.
 * @param {object} payload
 */
export async function saveAndUpdateJobCard(payload) {
  try {
    const res = await api.post(
      `${JobCard.saveJobCard}`,
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
 * Fetch Job Cards by Work Order.
 * @param {object} payload - { workOrderID }
 */
export async function fetchJobCardsByWorkOrder(payload) {
  try {
    const res = await api.post(
      `${JobCard.getJobCardListByWorkOrder}`,
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
