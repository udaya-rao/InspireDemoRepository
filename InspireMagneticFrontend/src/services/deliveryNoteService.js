import axios from "axios";
import { DeliveryNote, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";
import { getDropdownData } from "./commonService";

const api = axios.create({ baseURL: baseUrl });

export async function fetchDeliveryNoteHeaderList(payload) {
  try {
    const res = await api.post(`${DeliveryNote.getDeliveryNoteList}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function saveAndUpdateDeliveryNoteHeader(payload) {
  try {
    const res = await api.post(
      `${DeliveryNote.saveAndUpdateDeliveryNoteDetails}`,
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

export async function fetchDeliveryNoteHeaderDetails(payload) {
  try {
    const res = await api.post(`${DeliveryNote.getDeliveryNoteDetails}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchDeliveryNoteHeaderPDF(payload) {
  try {
    const res = await api.post(
      `${DeliveryNote.getDeliveryNoteHeaderPDF}`,
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

export async function approveDeliveryNoteDetails(payload) {
  try {
    const res = await api.post(
      `${DeliveryNote.approveDeliveryNoteDetails}`,
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

export async function ShortCloseDeliveryNoteDetails(payload) {
  try {
    const res = await api.post(
      `${DeliveryNote.ShortCloseDeliveryNoteDetails}`,
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

export async function shortCloseOrRecallDeliveryNoteDetails(payload) {
  try {
    const res = await api.post(
      `${DeliveryNote.shortCloseOrRecallDeliveryNoteDetails}`,
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
// Customers and currencies reuse the Order screen's calls
// (fetchOrderCustomers / fetchOrderCurrencies from orderService).

export const fetchDeliveryNoteStateCodes = () => getDropdownData("StateCode");

// Orders of a customer (Order column in Item Details).
export const fetchDeliveryNoteOrders = (customerId) =>
  getDropdownData(
    "DeliveryNoteOrderNo",
    customerId != null ? customerId.toString() : "",
  );

// FG products. No args → all FG products; customer + order → that order's
// products. Argument order mirrors fetchOrderFGItems (customer first).
export const fetchDeliveryNoteOrderLines = (orderId, customerId) =>
  getDropdownData(
    "DeliveryNoteOrderProductsList",
    customerId != null ? customerId.toString() : "",
    orderId != null ? orderId.toString() : "",
    true,
  );

  // GetCustomerMasterListInDeliveryNote
  export const getCustomerMasterListInDeliveryNote = async (payload) => {
      try {
    const res = await api.post(
      `${DeliveryNote.getCustomerMasterListInDeliveryNote}`,
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