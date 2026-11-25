import axios from "axios";
import { Order, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";
import { getDropdownData } from "./commonService";

const api = axios.create({ baseURL: baseUrl });

export async function fetchOrderHeaderList(payload) {
  try {
    const res = await api.post(`${Order.getOrderList}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function saveAndUpdateOrderHeader(payload) {
  try {
    const res = await api.post(`${Order.saveAndUpdateOrderDetails}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchOrderHeaderDetails(payload) {
  try {
    const res = await api.post(`${Order.getOrderDetails}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchOrderHeaderPDF(payload) {
  try {
    const res = await api.post(`${Order.getOrderHeaderPDF}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function approveOrderDetails(payload) {
  try {
    const res = await api.post(`${Order.approveOrderDetails}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function shortCloseOrRecallOrderDetails(payload) {
  try {
    const res = await api.post(
      `${Order.shortCloseOrRecallOrderDetails}`,
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
export const fetchOrderCustomers = async (payload) => {
  try {
    const res = await api.post(
      `${Order.getCustomerMasterListInOrder}`,
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

export const fetchOrderCurrencies = () => getDropdownData("Currency");
export const fetchOrderPriceScopes = () => getDropdownData("Pricescope");

// NOTE: "OrderProductsList" is a guess at the dropdown-type key —
// confirm against the backend's GetDropdownData accepted keys for
// customer-scoped FG items on the Order screen (Quotation's equivalent
// key is "QuotationProductsList").
export const fetchOrderFGItems = (quotationId, customerId) =>
  getDropdownData(
    "OrderQuotationProductsList",
    customerId != null ? customerId.toString() : "",
    quotationId != null ? quotationId.toString() : "",
    true,
  );

export const fetchOrderQuotations = (quotationId) =>
  getDropdownData("OrderQuotationNo", quotationId.toString());
