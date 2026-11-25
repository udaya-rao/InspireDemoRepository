

import { SUCCESS_STATUS } from "../utils/ConstVariables";
import { formatDate } from "../utils/dateUtils";
import axios from "axios";
import { GRN, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { handleApiError } from "../lib/axiosSetup";
import { getDropdownData } from "./commonService";

const api = axios.create({
  baseURL: baseUrl,
});

export async function fetchGRNHeaderList(payload) {
  try {
    const res = await api.post(
      GRN.getGRNHeaderList,
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

export async function fetchGRNHeaderDetails(payload) {
  try {
    const res = await api.post(
      GRN.getGRNHeaderDetails,
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

export async function fetchPurchaseOrderGRNHeaderList(payload) {
  try {
    const res = await api.post(
      GRN.getPurchaseOrderGRNHeaderList,
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

export async function fetchPurchaseOrderGRNHeaderDetails(payload) {
  try {
    const res = await api.post(
      GRN.getPurchaseOrderGRNHeaderDetails,
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

export async function cancelWorkOrderGRNDetails(payload) {
  try {
    const res = await api.post(
      GRN.cancelWorkOrderGRNDetails,
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

export async function fetchWorkOrderNos() {
  return await getDropdownData("WorkOrderID", "");
}

export async function fetchGRNProducts(workOrderId) {
  return await getDropdownData("GRNProductList", String(workOrderId || ""));
}

export async function fetchPurchaseOrderNos() {
  return await getDropdownData("PurchaseOrderID", "");
}

export async function fetchPurchaseGRNProducts(purchaseOrderId) {
  return await getDropdownData("POGRNProductList", String(purchaseOrderId || ""));
}

export async function fetchQAStatusOptions() {
  return await getDropdownData("OthersNum", "GRNQAStat");
}

export async function fetchSubCharacteristicNameList(itemId, itemType = "") {
  return await getDropdownData("SubCharacteristicNameList", String(itemId || ""), String(itemType || ""));
}

export async function saveAndUpdateGRNHeader(payload) {
  try {
    const res = await api.post(
      GRN.saveAndUpdateGRNHeader,
      payload,
      { headers: buildAuthHeaders() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function saveAndUpdatePurchaseOrderGRN(payload) {
  try {
    const res = await api.post(
      GRN.saveAndUpdatePurchaseOrderGRN,
      payload,
      { headers: buildAuthHeaders() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function saveAndUpdateInspectionDetails(payload) {
  try {
    const res = await api.post(
      GRN.saveAndUpdateInspectionDetails,
      payload,
      { headers: buildAuthHeaders() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function approveInspectionDetails(payload) {
  try {
    const res = await api.post(
      GRN.approveInspectionDetails,
      payload,
      { headers: buildAuthHeaders() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchInspectionDetails(payload) {
  try {
    const res = await api.post(
      GRN.getInspectionDetails,
      payload,
      { headers: buildAuthHeaders() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchInspectionObservationDetails(payload) {
  try {
    const res = await api.post(
      GRN.getInspectionObservationDetails,
      payload,
      { headers: buildAuthHeaders() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ══════════════════════════════════════════════════════════════════
//  QUALITY GRN — Real API Service Functions
// ══════════════════════════════════════════════════════════════════
export async function fetchQualityGRNHeaderList(payload) {
  try {
    const res = await api.post(
      GRN.getQualityGRNHeaderList,
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

export async function saveAndUpdateQualityGRN(payload) {
  try {
    const res = await api.post(
      GRN.saveAndUpdateQualityGRN,
      payload,
      { headers: buildAuthHeaders() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Fetch Work Order GRN PDF.
 * @param {object} payload - { grnid: number, source?: string }
 */
export async function fetchWorkOrderGRNPDF(payload) {
  try {
    const res = await api.post(
      GRN.getPurchaseOrderOrWorkOrderGRNPDF,
      {
        grnid: Number(payload?.grnid ?? payload?.grnID ?? payload?.grn_id ?? 0),
        source: payload?.source || "WorkOrderGRN",
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
 * Fetch Purchase Order GRN PDF.
 * @param {object} payload - { grnid: number, source?: string }
 */
export async function fetchPurchaseOrderGRNPDF(payload) {
  try {
    const res = await api.post(
      GRN.getPurchaseOrderOrWorkOrderGRNPDF,
      {
        grnid: Number(payload?.grnid ?? payload?.grnID ?? payload?.grn_id ?? 0),
        source: payload?.source || "PurchaseOrderGRN",
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


