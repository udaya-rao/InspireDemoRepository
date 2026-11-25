import axios from "axios";
import { Quotation, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";
import { getDropdownData } from "./commonService";

const api = axios.create({ baseURL: baseUrl });

export async function fetchQuotationHeaderList(payload) {
  try {
    const res = await api.post(`${Quotation.getQuotationList}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function saveAndUpdateQuotationHeader(payload) {
  try {
    const res = await api.post(
      `${Quotation.saveAndUpdateQuotationDetails}`,
      payload,
      {
        headers: buildAuthHeaders(),
      },
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchQuotationHeaderDetails(payload) {
  try {
    const res = await api.post(`${Quotation.getQuotationDetails}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchQuotationHeaderPDF(payload) {
  try {
    const res = await api.post(`${Quotation.getQuotationHeaderPDF}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function approveQuotationDetails(payload) {
  try {
    const res = await api.post(
      `${Quotation.approveQuotationDetails}`,
      payload,
      {
        headers: buildAuthHeaders(),
      },
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function shortCloseOrRecallQuotationDetails(payload) {
  try {
    const res = await api.post(
      `${Quotation.shortCloseOrRecallQuotationDetails}`,
      payload,
      {
        headers: buildAuthHeaders(),
      },
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ── Dropdowns ──────────────────────────────────────────────────────────────────
export const fetchQuotationCustomers = async (payload) => {
  try {
    const res = await api.post(
      `${Quotation.getCustomerMasterListInQuotation}`,
      payload,
      {
        headers: buildAuthHeaders(),
      },
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const fetchQuotationCurrencies = () => getDropdownData("Currency");
export const fetchQuotationPriceScopes = () => getDropdownData("Pricescope");
export const fetchQuotationFGItems = (customerId) =>
  getDropdownData("QuotationProductsList", customerId.toString());
