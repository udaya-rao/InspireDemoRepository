// src/services/supplierItemService.js
import axios from "axios";
import { SupplierItem, baseUrl } from "../utils/url";
import { buildAuthHeaders } from "../utils/authHeaders";
import { fetchOrderCurrencies } from "./orderService";
import { handleApiError } from "../lib/axiosSetup";
import { getDropdownData } from "./commonService";

// Central axios instance for Supplier Item module
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * Fetch Supplier Item list.
 * @param {object} payload
 */
export async function fetchSupplierItemList(payload) {
  try {
    const res = await api.post(`${SupplierItem.getSupplierItemList}`, payload, {
      headers: buildAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Fetch full details of a Supplier Item.
 * @param {object} payload - { supplierItemID }
 */
export async function fetchSupplierItemDetails(payload) {
  try {
    const res = await api.post(
      `${SupplierItem.getSupplierItemDetails}`,
      {
        supplierItemID: payload?.supplierItemID,
      },
      {
        headers: buildAuthHeaders(),
      },
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Save Or Update Supplier Item.
 * @param {object} payload
 */
export async function saveAndUpdateSupplierItem(payload) {
  try {
    const response = await api.post(
      `${SupplierItem.saveUpdateSupplierItem}`,
      payload,
      {
        headers: buildAuthHeaders(),
      },
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Approve a Supplier Item.
 * @param {object} payload - { supplierItemID, approvedBy }
 */
export async function approveSupplierItem(payload) {
  try {
    const res = await api.post(
      `${SupplierItem.approveSupplierItem}`,
      {
        supplierItemID: payload?.supplierItemID,
        approvedBy: payload?.approvedBy,
      },
      {
        headers: buildAuthHeaders(),
      },
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Paged Supplier dropdown (search as you type).
 * @param {object} payload - { pageNumber, pageSize, searchKeyword }
 */
export async function fetchSupplierItemSuppliers({
  pageNumber,
  pageSize,
  searchKeyword = "",
}) {
  try {
    const res = await api.post(
      SupplierItem.getSupplierDropdown,
      {
        pageSize,
        pageNumber,
        searchFilter: searchKeyword
          ? [
              {
                columnName: "SupplierName", // confirm the real column name
                searchKeyword,
                sortOrder: "",
                columnSequence: 0,
              },
            ]
          : [],
        isGlobalSearch: 0,
        sortOrder: "",
      },
      { headers: buildAuthHeaders() },
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

// Currency dropdown — same master lookup the Order form uses, so no new
// endpoint is needed. Returns an array of { ValueText, DisplayText }.
export async function fetchSupplierItemCurrencies() {
  return fetchOrderCurrencies();
}

export const fetchSupplierItemInventoryItems = () =>
  getDropdownData("SupplierItemProductList");
