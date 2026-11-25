import axios from "axios";
import { DailyJob, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";

const api = axios.create({
    baseURL: baseUrl,
});

/**
 * Fetch Daily Job list (GetLoggedInPersonJobCardList).
 * @param {object} payload
 */
export async function fetchDailyJobList(payload) {
    try {
        const res = await api.post(
            `${DailyJob.getDailyJobList}`,
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
 * Fetch Daily Job details.
 * @param {object} payload - { workOrderLineID, dailyJobID }
 */
export async function fetchDailyJobDetails(payload) {
    try {
        const res = await api.post(
            `${DailyJob.getDailyJobDetails}`,
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
 * Save or Update Daily Job.
 * @param {object} payload
 */
export async function saveAndUpdateDailyJob(payload) {
    try {
        const res = await api.post(
            `${DailyJob.saveDailyJob}`,
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
 * Fetch Daily Job Data list (GetJobCardDailyList).
 * @param {object} payload
 */
export async function fetchDailyJobDataList(payload) {
    try {
        const res = await api.post(
            `${DailyJob.getDailyJobDataList}`,
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
 * Fetch Daily Job Data details (GetJobCardDailyDetails).
 * @param {object} payload
 */
export async function fetchDailyJobDataDetails(payload) {
    try {
        const res = await api.post(
            `${DailyJob.getDailyJobDataDetails}`,
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
 * Save or Update Daily Job Data (SaveAndUpdateJobCardDaily).
 * @param {object} payload
 */
export async function saveAndUpdateDailyJobData(payload) {
    try {
        const res = await api.post(
            `${DailyJob.saveDailyJobData}`,
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

export { fetchDropDownData } from "./jobCardService";
