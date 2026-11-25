import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  FormField,
  SelectField,
  TextAreaFormField,
  ReactSelectField,
} from "../../../components/FormElement";

import Select from "react-select";
import FullPageLoader from "../../../components/FullPageLoader";
import Loader from "../../../components/Loader";
import inspireLogo from "../../../assets/logo/IM_Icon-new.png";

import { CustomMultiColumnDropdown } from "../../../components/CustomVendorDropdown";
import { hasPermission, menuPermissions } from "../../../permissions/permissionUtils";
import {
  Print as PrintIcon,
} from "@mui/icons-material";
import NumericEditor from "../../../components/NumericEditor";

import BomPrintPreview from "./BomPrintPreview";
import { customFormatDateTime } from "../../../utils/dateUtils";
import { useToast } from "../../../components/useToast";
import { ConfirmDialog, YesNoDialog } from "../../../components/Notification";
import { getOperationOptions, getItemCodeList, getBOMMasterDetails } from "../../../services/billOfMaterialService";
import { getPreparedBy } from "../../../utils/userSession";
import { SUCCESS_STATUS, ERROR_STATUS } from "../../../utils/ConstVariables";

const today = customFormatDateTime(new Date(), "dd-MM-yyyy");


const getBOMHeaderActions = ({
  isEditMode,
  setIsEditMode,
  openPrintPreview,
  handleSaveBOM,
  headerLoading,
  onDisableEdit,
}) => {
  const themeColor = "rgb(122, 75, 120)";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
      }}
    >
      {/* Print button - only visible when NOT editing */}
      {!isEditMode && (
        <button
          className="btn btn-sm"
          style={{ background: themeColor, color: "white" }}
          title="Print"
          onClick={() => openPrintPreview?.()}
          // disabled
          hidden
        >
          <PrintIcon sx={{ fontSize: 18 }} />
        </button>
      )}
      {/* Mode Toggle Actions */}
      {hasPermission(menuPermissions.ALLOW_TO_EDIT_CREATE_BILL_OF_MATERIAL) && (
        <>
          {!isEditMode ? (
            <button
              className="btn btn-sm"
              style={{
                background: themeColor,
                color: "white",
                // opacity: docStatus?.toLowerCase() === "approved" ? 0.6 : 1,
                // pointerEvents:
                //   docStatus?.toLowerCase() === "approved" ? "none" : "auto",
              }}
              onClick={() => setIsEditMode(true)}
              title="Edit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
              </svg>
            </button>
          ) : (
            <>
              <button
                className="btn btn-sm"
                style={{ background: themeColor, color: "white" }}
                onClick={handleSaveBOM}
                disabled={headerLoading}
                title="Save"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              </button>
              <button
                className="btn btn-sm"
                onClick={onDisableEdit}
                title="Cancel Edit"
                style={{ background: themeColor, color: "white" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                  <line x1="4" y1="4" x2="20" y2="20" />
                </svg>
              </button>
            </>
          )}
        </>
      )}


    </div>
  );
};

export default function BillOfMaterial({
  fgItemID,
  bomID,
  itemDescription,
  itemCode,
  onHeaderActionsReady,
  onEditModeChange,
}) {
  const [bomData, setBomData] = useState([]);
  const [docStatus, setDocStatus] = useState("");
  const { showToast } = useToast();
  const [productInfo, setProductInfo] = useState({
    productName: itemDescription || "",
    productCode: itemCode || "",
    quantity: "1",
    unit: "",
    remarks: "",
    doc_status: 0,
    doc_status_text: " ",
    revNo: "",
    preparedBy: getPreparedBy() || "",
    preparedDate: today || "",
    bom_id: bomID || 0,
    rev_by: "",
    revisedDate: "",
    approvedBy: "",
    approvedDate: "",
    updatedBy: "",
    updatedDate: "",
    qtyProducedPerDay: "",
  });

  // no-op



  // State for loading indicators (previously used in API integration)
  const [headerLoading, setHeaderLoading] = useState(false);
  const [itemsLoading] = useState(false);
  const [loading, setLoading] = useState(false);



  const [operationOptions, setOperationOptions] = useState([]);

  // Edit mode
  const [isEditMode, setIsEditModeState] = useState(false);
  // Track whether header/items have unsaved changes
  const [_hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const setIsEditMode = React.useCallback((next) => {
    setIsEditModeState((prev) =>
      typeof next === "function" ? next(prev) : next
    );
  }, []);

  // Mark form as dirty when user changes header or BOM items
  const markDirty = React.useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Call onEditModeChange when hasUnsavedChanges changes
  useEffect(() => {
    onEditModeChange?.(_hasUnsavedChanges);
  }, [_hasUnsavedChanges, onEditModeChange]);

  /**
   * resolveItemDetailsForRows
   * For any Item rows that have an itemCode but no itemUnit or itemDescription, 
   * this fetches the details from the item code list API and updates bomData.
   * Returns the fully-resolved mappedDetails array.
   */
  const resolveItemDetailsForRows = useCallback(async (mappedDetails) => {
    const rowsMissingDetails = mappedDetails.filter(
      d => d.itemType === "Item" && d.itemCode && (!d.itemUnit || !d.itemDescription)
    );
    if (rowsMissingDetails.length === 0) return mappedDetails;

    const uniqueCodes = [...new Set(rowsMissingDetails.map(d => d.itemCode))];
    const detailsMap = new Map();
    try {
      await Promise.all(
        uniqueCodes.map(async (code) => {
          const res = await getItemCodeList({
            searchKeyword: code,
            pageNumber: 0,
            pageSize: 20,
          });
          const items = res?.data?.ITEM_CODE_LIST || [];
          const match = items.find(
            it => String(it.item_code).toUpperCase() === String(code).toUpperCase()
          );
          if (match) {
            detailsMap.set(code, {
              unit: match.item_unit || "NOS",
              description: match.item_description || ""
            });
          }
        })
      );
    } catch (err) {
      console.warn("[BOM] Could not resolve details for some item codes:", err);
    }

    if (detailsMap.size === 0) return mappedDetails;
    return mappedDetails.map(row => {
      if (row.itemType === "Item" && row.itemCode && (!row.itemUnit || !row.itemDescription)) {
        const resolved = detailsMap.get(row.itemCode);
        if (resolved) {
          return {
            ...row,
            itemUnit: row.itemUnit || resolved.unit,
            itemDescription: row.itemDescription || resolved.description
          };
        }
      }
      return row;
    });
  }, []);

  // Clear dirty flag after a successful save
  const clearDirty = React.useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  // Fetch BOM details if fgItemID is provided
  useEffect(() => {
    if (!fgItemID) return;

    const fetchBOMDetails = async () => {
      try {
        setLoading(true);
        // Reset state before fetching new data to prevent showing old data
        setBomData([]);
        setProductInfo(prev => ({
          ...prev,
          quantity: "1",
          remarks: "",
          doc_status: 0,
          doc_status_text: " ",
          preparedBy: getPreparedBy() || "",
          preparedDate: today || "",
          bom_id: 0
        }));
        setDocStatus("");
        setRowErrorsByRow({});
        setHeaderErrors({});

        const response = await getBOMMasterDetails({
          fgItemID: Number(fgItemID) || 0,
          bomid: Number(bomID) || 0
        });

        if (response?.Status === SUCCESS_STATUS && response.data) {
          const header = response.data.BOM_MASTER_COMMON_RESPONSE?.[0];
          const details = response.data.BOM_MASTER_DETAILS_RESPONSE || [];

          if (header) {
            setProductInfo(prev => ({
              ...prev,
              productName: header.item_description || prev.productName,
              productCode: header.item_code || prev.productCode, // Update code from header
              quantity: String(header.fg_assembly_base_qty || "1"),
              preparedBy: header.prep_by || prev.preparedBy,
              preparedDate: header.prep_date ? customFormatDateTime(header.prep_date, "dd-MM-yyyy") : prev.preparedDate,
              remarks: header.bom_remarks || "",
              doc_status: header.doc_status || 0,
              doc_status_text: header.doc_status_text || " ",
              updatedBy: header.updated_by || header.update_by || "",
              updatedDate: (header.updated_date || header.update_date) ? customFormatDateTime(header.updated_date || header.update_date, "dd-MM-yyyy") : "",
              bom_id: header.bom_id || 0,
              unit: header.item_unit || ""
            }));
            setDocStatus(header.doc_status_text || "");
          }

          if (Array.isArray(details) && details.length > 0) {
            // Debug: log to see what fields the API returns for unit
            // if (details[0]) console.log("[BOM Detail fields]", details[0]);

            const mappedDetails = details.map(it => ({
              id: it.bom_line_id || Date.now() + Math.random(),
              sNo: it.bom_line_id || 0,
              itemType: it.line_type === "0" ? "Operation" : "Item",
              itemID: it.item_id || 0,
              itemCode: it.item_id_text || it.item_code || "",
              itemDescription: it.item_description || "",
              // Try every possible field name the API might use for unit
              itemUnit: it.item_unit_text || it.item_unit || it.uom || it.unit || it.UOM || it.Unit || it.ItemUnit || "",
              remarks: it.bom_iremarks || "",
              quantity: String(it.qty_per_assembly ?? "1.000000"),
              hierCode: it.hier_code || "",
              levelNumber: it.level_nr || 0,
              operation: it.operation_id ? String(it.operation_id) : "",
              sortSequence: it.sort_sequence ? String(it.sort_sequence) : "",
              parentId: null,
            }));

            // Link parent IDs based on hierarchy codes for existing data
            const hierMap = new Map();
            mappedDetails.forEach(d => {
              if (d.hierCode) hierMap.set(d.hierCode, d.id);
            });

            mappedDetails.forEach(d => {
              if (d.hierCode && d.hierCode.length > 2) {
                const parentHier = d.hierCode.slice(0, -2);
                d.parentId = hierMap.get(parentHier) || null;
              }
            });


            const resolved = await resolveItemDetailsForRows(mappedDetails);

            resolved.sort((a, b) => (a.hierCode || "").localeCompare(b.hierCode || ""));

            setBomData(resolved);

          }
        }
      } catch (err) {
        console.error("Failed to fetch BOM details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBOMDetails();
  }, [fgItemID, bomID, resolveItemDetailsForRows]);

  // Fetch Operations dropdown on mount
  useEffect(() => {
    let isMounted = true;
    const fetchOps = async () => {
      try {
        const list = await getOperationOptions();
        if (isMounted && Array.isArray(list)) {
          setOperationOptions(
            list.map((item) => ({
              value: String(item.ValueText ?? ""),
              label: String(item.DisplayText ?? ""),
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load operation options:", err);
      }
    };
    fetchOps();
    return () => { isMounted = false; };
  }, []);

  const handleBOMItemChange = (id, field, value) => {
    // Block zero for sort sequence
    if (field === "sortSequence" && value === "0") {
      return;
    }

    // console.log("Updating BOM item:", { id, field, value });
    setBomData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // console.log("Updated item:", updatedItem);
          return updatedItem;
        }
        return item;
      })
    );

    // Clear validation error when field is updated
    if (value && String(value).trim() !== "") {
      setRowErrorsByRow((prev) => {
        if (!prev[id] || !prev[id][field]) return prev;
        const nextRow = { ...prev[id] };
        delete nextRow[field];
        if (Object.keys(nextRow).length === 0) {
          const { [id]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [id]: nextRow };
      });
    }
    // Any change to BOM rows counts as unsaved change
    markDirty();
  };

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [lastAddedId, setLastAddedId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 });
  const [dropdownDirection, setDropdownDirection] = useState("down");
  const [deletedIds, setDeletedIds] = useState(new Set()); // Track items marked for deletion
  const actionBtnRefs = useRef({});
  const bomContainerRef = useRef(null);


  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState("");


  // 1. Add loading state after other useState hooks
  // Item code search (Select field) state per row
  const [itemCodeOptionsByRow, setItemCodeOptionsByRow] = useState({});
  const [itemCodeLoadingByRow, setItemCodeLoadingByRow] = useState({});
  const [itemCodeInputValueByRow, setItemCodeInputValueByRow] = useState({});
  const [, setItemCodeMenuOpenByRow] = useState({});
  const [rowErrorsByRow, setRowErrorsByRow] = useState({}); // Row validation errors: { rowId: { field: errorMsg } }
  const [headerErrors, setHeaderErrors] = useState({}); // Header validation errors: { field: errorMsg }
  const [itemCodePageByRow, setItemCodePageByRow] = useState({});
  const [itemCodeHasMoreByRow, setItemCodeHasMoreByRow] = useState({});
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const openPrintPreview = useCallback(() => setPrintPreviewOpen(true), []);



  // Fetch from paginated API
  const loadItemCodeOptions = async (rowId, keyword = "", page = 0, isLoadMore = false) => {
    try {
      setItemCodeLoadingByRow((prev) => ({ ...prev, [rowId]: true }));
      const response = await getItemCodeList({
        searchKeyword: keyword,
        pageNumber: page,
        pageSize: 20
      });

      const items = response?.data?.ITEM_CODE_LIST || [];
      const formattedItems = items.map(it => ({
        value: String(it.item_code),
        label: `${it.item_code} - ${it.item_description}`,
        data: {
          itemCode: it.item_code,
          description: it.item_description,
          cc_stock: it.cc_stock || "-",
          item_id: it.item_id || it.id || 0,
          unit: it.item_unit || "NOS" // Capture item_unit from API
        }
      }));

      setItemCodeOptionsByRow(prev => ({
        ...prev,
        [rowId]: isLoadMore ? [...(prev[rowId] || []), ...formattedItems] : formattedItems
      }));

      setItemCodePageByRow(prev => ({ ...prev, [rowId]: page }));
      setItemCodeHasMoreByRow(prev => ({ ...prev, [rowId]: items.length >= 20 }));

    } catch (e) {
      console.error("Item code search failed", e);
      if (!isLoadMore) {
        setItemCodeOptionsByRow((prev) => ({ ...prev, [rowId]: [] }));
      }
    } finally {
      setItemCodeLoadingByRow((prev) => ({ ...prev, [rowId]: false }));
    }
  };

  // Handle item code initial load when menu is opened via arrow click
  const handleItemCodeMenuOpen = async (rowId) => {
    // Skip if we already have options
    if (itemCodeOptionsByRow[rowId] && itemCodeOptionsByRow[rowId].length > 0) {
      return;
    }
    await loadItemCodeOptions(rowId, "", 0, false);
  };

  // Handle item code search input change for Select component
  const handleItemCodeInputChange = async (rowId, inputValue) => {
    const clean = (inputValue || "").trim();

    // Track input value
    setItemCodeInputValueByRow((prev) => ({ ...prev, [rowId]: clean }));

    await loadItemCodeOptions(rowId, clean, 0, false);
  };

  // Handle scroll to bottom of dropdown
  const handleItemCodeScrollToBottom = async (rowId) => {
    const currentLoading = itemCodeLoadingByRow[rowId];
    const hasMore = itemCodeHasMoreByRow[rowId];
    if (currentLoading || hasMore === false) return;

    const currentPage = itemCodePageByRow[rowId] || 0;
    const currentKeyword = itemCodeInputValueByRow[rowId] || "";

    await loadItemCodeOptions(rowId, currentKeyword, currentPage + 1, true);
  };

  // Handle item code selection
  const handleItemCodeChange = (rowId, selectedOption) => {
    if (!selectedOption) {
      // User cleared the selection
      handleBOMItemChange(rowId, "itemCode", "");
      handleBOMItemChange(rowId, "itemDescription", "");
      handleBOMItemChange(rowId, "itemUnit", ""); // Reset unit
      setItemCodeInputValueByRow((prev) => ({ ...prev, [rowId]: "" }));
      setItemCodeOptionsByRow((prev) => ({ ...prev, [rowId]: [] }));
      setItemCodeMenuOpenByRow((prev) => ({ ...prev, [rowId]: false }));
      // Set validation error when field is cleared
      setRowErrorsByRow((prev) => ({
        ...prev,
        [rowId]: { ...(prev[rowId] || {}), itemCode: "Required*" }
      }));
      return;
    }

    const value = selectedOption?.value || "";
    // Prefer description from data property, fallback to parsing label
    const description = selectedOption?.data?.description
      ? String(selectedOption.data.description).trim()
      : (() => {
        const label = selectedOption?.label || "";
        return label.includes(" - ")
          ? label.split(" - ").slice(1).join(" - ").trim()
          : "";
      })();

    // Extract item details
    const itemId = selectedOption?.data?.item_id || 0;
    const itemUnit = selectedOption?.data?.unit || "";

    handleBOMItemChange(rowId, "itemCode", value);
    handleBOMItemChange(rowId, "itemDescription", description);
    handleBOMItemChange(rowId, "itemID", itemId);
    handleBOMItemChange(rowId, "itemUnit", itemUnit); // Update unit in row state

    // Clear validation error when valid item is selected
    if (value && value.trim() !== "") {
      setRowErrorsByRow((prev) => {
        if (!prev[rowId] || !prev[rowId].itemCode) return prev;
        const nextRow = { ...prev[rowId] };
        delete nextRow.itemCode;
        if (Object.keys(nextRow).length === 0) {
          const { [rowId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [rowId]: nextRow };
      });
    }

    // Close menu after selection
    setItemCodeMenuOpenByRow((prev) => ({ ...prev, [rowId]: false }));
  };





  const handleAddChild = (parentId) => {
    const newId = Date.now();
    // Determine if this is a root-level operation or a child item
    const isRootOperation = parentId === null;

    const newItem = {
      id: newId,
      sNo: null, // New items don't have s_no yet, will be assigned by API
      itemType: isRootOperation ? "Operation" : "Item", // Set default value based on context
      itemCode: "",
      itemDescription: "",
      hierCode: "", // Will be assigned based on parent
      quantity: "1.000000",
      operation: "",
      sortSequence: isRootOperation
        ? (() => {
          const ops = bomData.filter(r => r.itemType === "Operation" && !deletedIds.has(r.id));
          const maxSeq = ops.reduce((max, r) => {
            const seq = parseInt(r.sortSequence, 10);
            return isNaN(seq) ? max : Math.max(max, seq);
          }, 0);
          return (maxSeq + 1).toString();
        })()
        : "",
      qtyProdDay: "0.00",
      uom: "NOS",
      remarks: "",
      rateRemarks: "",
      qtyProdAssemblyForCosting: "",
      parentId: parentId,
      itemOption: "",
      itemUnit: "", // Initialize unit field
    };
    setBomData((prev) => {
      let list = [...prev];

      let insertIndex;
      if (parentId === null) {
        // Root operation always goes at the very end of the entire table
        insertIndex = list.length;
      } else {
        // Child row goes within its parent's scope
        const parentIndex = list.findIndex((r) => r.id === parentId);

        const parent = list[parentIndex];
        const parentHier = parent?.hierCode || "";

        let lastDescIndex = -1;
        if (parentHier && parentIndex >= 0) {
          // Since the list is kept in hierarchy order, descendants are contiguous
          for (let i = parentIndex + 1; i < list.length; i++) {
            if (list[i].hierCode && list[i].hierCode.startsWith(parentHier)) {
              lastDescIndex = i;
            } else {
              break; // End of this parent's branch
            }
          }
        }

        if (lastDescIndex >= 0) {
          insertIndex = lastDescIndex + 1;
        } else if (parentIndex >= 0) {
          insertIndex = parentIndex + 1;
        } else {
          insertIndex = list.length;
        }
      }

      list.splice(insertIndex, 0, newItem);
      // assign hierarchy code based on parent's hierarchy code (for internal hierarchy structure)
      const hierCode = getNextHierarchyCode(list, parentId);
      list = list.map((r) =>
        r.id === newId ? { ...r, hierCode: hierCode } : r
      );
      return list;
    });

    setSelectedRowId(newId);
    setLastAddedId(newId);


    markDirty();
  };

  // Get next hierarchy code for a child based on parent's hierarchy code
  const getNextHierarchyCode = (list, parentId) => {
    const pad2 = (n) => String(n).padStart(2, "0");

    // Get parent's hierarchy code
    const parent = parentId ? list.find((x) => x.id === parentId) : null;
    const parentHierCode = parent?.hierCode || "";

    // Get all siblings (children of the same parent)
    const siblings = list.filter((x) =>
      parentId ? x.parentId === parentId : !x.parentId
    );

    // Extract the last 2 digits from each sibling's hierarchy code
    const nums = siblings
      .map((s) => {
        const hierCode = s.hierCode || "";
        if (!hierCode || hierCode.length < 2) return null;
        // Get the last 2 digits
        const lastTwo = hierCode.slice(-2);
        const num = parseInt(lastTwo, 10);
        return isNaN(num) ? null : num;
      })
      .filter((n) => n !== null);

    // Find the maximum number and increment by 1
    const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;

    // For root-level items (no parent), return just the number
    // For child items, return parent's hierarchy code + next number
    return parentHierCode ? parentHierCode + pad2(nextNum) : pad2(nextNum);
  };



  const indexCodes = React.useMemo(() => {
    // Show hier_code as index when available
    const map = new Map();
    bomData.forEach((r) => map.set(r.id, r.hierCode || r.itemCode || ""));
    return map;
  }, [bomData]);

  const handleDeleteItem = (id) => {
    const hasChildren = bomData.some((r) => r.parentId === id);
    const item = bomData.find((r) => r.id === id);
    const itemName = item?.itemCode || "this item";
    // console.log("hasChildren", hasChildren);
    // console.log("item", item);
    // console.log("itemName", itemName);
    if (hasChildren) {
      setDeleteConfirmMessage(
        <>
          This item has child rows.
          <br />
          Do you want to delete it along with all its children?
        </>
      );
    } else {
      setDeleteConfirmMessage(`Are you sure you want to delete ${itemName}?`);
    }

    setItemToDelete(id);
    setDeleteConfirmOpen(true);
    setOpenDropdownId(null); // Close dropdown after action
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;

    // Collect all descendant ids to mark for deletion
    const collectDescendants = (rootId, list, acc) => {
      const children = list.filter((r) => r.parentId === rootId);
      children.forEach((ch) => {
        acc.add(ch.id);
        collectDescendants(ch.id, list, acc);
      });
    };

    // Mark items for deletion instead of removing them
    const toDelete = new Set([itemToDelete]);
    collectDescendants(itemToDelete, bomData, toDelete);
    setDeletedIds((prev) => {
      const newSet = new Set(prev);
      toDelete.forEach((itemId) => newSet.add(itemId));
      return newSet;
    });
    // Deleting rows is also an unsaved change
    markDirty();

    // Reset confirmation dialog state
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
    setDeleteConfirmMessage("");
  };

  const cancelDeleteItem = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
    setDeleteConfirmMessage("");
  };

  const toggleDropdown = (id, e) => {
    e.stopPropagation(); // Prevent row selection
    if (openDropdownId === id) {
      setOpenDropdownId(null);
      return;
    }

    // Highlight the row when opening the actions menu
    setSelectedRowId(id);

    // Calculate dropdown position
    try {
      const el = actionBtnRefs.current[id];
      const rect = el ? el.getBoundingClientRect() : null;
      const estimatedMenuHeight = 60; // px, conservative estimate
      if (rect) {
        // Save viewport coordinates for fixed-position menu
        setDropdownPos({ left: rect.left + 43, top: rect.bottom + 4 });
        const spaceBelow = (window.innerHeight || 0) - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
          setDropdownDirection("up");
          setDropdownPos({ left: rect.left + 43, top: rect.top - 4 });
        } else {
          setDropdownDirection("down");
        }
      } else setDropdownDirection("down");
    } catch {
      setDropdownDirection("down");
    }
    setOpenDropdownId(id);
  };

  useEffect(() => {
    if (lastAddedId) {
      // Small timeout to ensure the row is rendered in the DOM
      const timer = setTimeout(() => {
        const el = document.getElementById(`bom-row-${lastAddedId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        setLastAddedId(null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lastAddedId, bomData]);

  // Lock scrolling when actions dropdown is open
  useEffect(() => {
    if (openDropdownId !== null && bomContainerRef.current) {
      const container = bomContainerRef.current;
      const lockedElements = [];

      // Helper: check if an element is scrollable
      const isScrollable = (el) => {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;
        const overflow = style.overflow;
        const canScroll = ["auto", "scroll", "overlay"].some(
          (v) => overflowY === v || overflowX === v || overflow === v
        );
        return canScroll && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth);
      };

      // Step 1: Lock all scrollable CHILDREN inside the BOM container
      const innerScrollables = container.querySelectorAll(
        ".table-responsive, .card-body, .product-hierarchy-tree-scroll"
      );
      innerScrollables.forEach((el) => {
        lockedElements.push({
          el,
          overflow: el.style.overflow,
          overflowY: el.style.overflowY,
          overflowX: el.style.overflowX,
        });
        el.style.overflow = "hidden";
        el.style.overflowY = "hidden";
        el.style.overflowX = "hidden";
      });

      // Step 2: Walk UP the DOM from the BOM container and lock all scrollable ANCESTORS
      // (this catches the modal, drawer, or any intermediate wrapper)
      let ancestor = container.parentElement;
      while (ancestor && ancestor !== document.documentElement) {
        if (isScrollable(ancestor)) {
          lockedElements.push({
            el: ancestor,
            overflow: ancestor.style.overflow,
            overflowY: ancestor.style.overflowY,
            overflowX: ancestor.style.overflowX,
          });
          ancestor.style.overflowY = "hidden";
          ancestor.style.overflowX = "hidden";
        }
        ancestor = ancestor.parentElement;
      }

      // Step 3: Lock the document body as a final safety net
      const originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        // Restore all previously locked elements
        lockedElements.forEach(({ el, overflow, overflowY, overflowX }) => {
          el.style.overflow = overflow;
          el.style.overflowY = overflowY;
          el.style.overflowX = overflowX;
        });
        document.body.style.overflow = originalBodyOverflow;
      };
    }
  }, [openDropdownId]);

  const closeDropdown = () => {
    setOpenDropdownId(null);
  };

  // Close dropdown and handle selection persistence when clicking/tapping
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle action dropdown closure
      if (openDropdownId && !event.target.closest(".dropdown-container")) {
        closeDropdown();
      }

      // Clear row selection only when clicking clearly outside the BOM component
      // We check if the click is outside the main container, and not on a portaled menu or modal element
      if (
        !deleteConfirmOpen &&
        bomContainerRef.current &&
        !bomContainerRef.current.contains(event.target) &&
        !event.target.contains(bomContainerRef.current) && // Prevent deselect when clicking parent scrollbars
        !event.target.closest("[class*='react-select']") &&
        !event.target.closest(".modal") &&
        !event.target.closest(".draggable-modal-window")
      ) {
        setSelectedRowId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId, deleteConfirmOpen]);


  // Keep dropdown positioned correctly when scrolling
  useEffect(() => {
    if (openDropdownId === null) return;
    const updatePos = () => {
      try {
        const el = actionBtnRefs.current[openDropdownId];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const y = dropdownDirection === "up" ? rect.top - 4 : rect.bottom + 4;
        setDropdownPos({ left: rect.left + 43, top: y });
      } catch {
        /* ignore positioning errors */
      }
    };
    updatePos();
    window.addEventListener("scroll", updatePos, { passive: true });
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [openDropdownId, dropdownDirection]);

  // (removed) unused add top-level helper

  // Build hierarchical tree structure dynamically from the table rows
  const buildTree = () => {
    const items = Array.isArray(bomData)
      ? bomData.filter((item) => !deletedIds.has(item.id))
      : [];
    const idToNode = new Map();
    // create nodes
    items.forEach((item) => {
      let baseLabel = "Unnamed";
      if (item.itemType === "Operation" && item.operation) {
        const opOpt = operationOptions.find(opt => opt.value === String(item.operation));
        baseLabel = opOpt ? opOpt.label : item.operation;
      } else {
        // Use itemCode if available, otherwise use hierCode, fallback to "Unnamed"
        const itemCodeValue = (item.itemCode || "").trim();
        const hierCodeValue = (item.hierCode || "").trim();
        baseLabel = itemCodeValue || hierCodeValue || "Unnamed";
      }
      const optionSuffix = item.itemOption ? ` (${item.itemOption})` : "";
      idToNode.set(item.id, {
        id: item.id,
        name: `${baseLabel}${optionSuffix}`,
        type: item.itemType || "",
        option: item.itemOption || "",
        children: [],
      });
    });
    // connect parent-child
    const roots = [];
    items.forEach((item) => {
      const node = idToNode.get(item.id);
      if (item.parentId && idToNode.has(item.parentId)) {
        idToNode.get(item.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });
    return { name: productInfo.productCode, children: roots };
  };

  // Track collapsed nodes by unique path
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  const toggleNode = (path) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const bomPreviewData = useMemo(() => {
    const finishedProduct = {
      code: productInfo.productCode || "-",
      name: productInfo.productName || "",
      dwgStatus: "NA",
      qty:
        productInfo.quantity !== undefined && productInfo.quantity !== null
          ? String(productInfo.quantity)
          : "-",
      stock: "-",
      reserved: "0",
      unit: productInfo.unit || "NOS",
      remark: productInfo.remarks || "",
      pending: {
        oa: "0",
        purchase: "0",
        production: "0",
        grn: "0",
      },
      meta: {
        status: productInfo.status || "-",
        approvedBy: productInfo.approvedBy || "-",
        approvedDate: productInfo.approvedDate || "-",
      },
    };

    const rowsSource = Array.isArray(bomData)
      ? bomData.filter((item) => !deletedIds.has(item.id))
      : [];

    const optionBuckets = new Map();

    rowsSource.forEach((item) => {
      const rawLabel = item.itemOption || "Default";
      const normalizedKey = rawLabel.replace(/\s+/g, "-").toLowerCase() || "default";
      if (!optionBuckets.has(normalizedKey)) {
        optionBuckets.set(normalizedKey, { label: rawLabel, rows: [] });
      }
      optionBuckets.get(normalizedKey).rows.push({
        code: item.itemCode || "-",
        description: item.itemDescription || "",
        dwgStatus: item.dwgStatus || "NA",
        qty:
          item.quantity !== undefined && item.quantity !== null
            ? String(item.quantity)
            : "-",
        stock: "0",
        reserved: "0",
        unit: item.uom || productInfo.unit || "NOS",
        remark: item.remarks || "",
        pending: { oa: "0", purchase: "0", production: "0", grn: "0" },
      });
    });

    const options = optionBuckets.size
      ? Array.from(optionBuckets.entries()).map(([key, bucket]) => ({
        key,
        label: `Option : ${bucket.label}`,
        totalItems: bucket.rows.length,
        sections: [
          {
            key: `${key}-section`,
            label: "Finished Piece Parts",
            totalItems: bucket.rows.length,
            rows: bucket.rows,
          },
        ],
      }))
      : [];

    return { finishedProduct, options };
  }, [bomData, deletedIds, productInfo]);



  const renderTreeNode = (node, level = 0, path = node.name, ancestorLines = [], isLast = true) => {
    const hasChildren =
      Array.isArray(node.children) && node.children.length > 0;
    const isCollapsed = collapsedNodes.has(path);
    const isSelected = selectedRowId === node.id;
    const isRoot = level === 0;

    // ── connector constants ──────────────────────────────
    const LINE_COLOR = "#bbb";
    const INDENT = 20; // px per level
    const COL_W = 20;  // width of each ancestor-line column

    const gutterCols = ancestorLines.map((hasLine, i) => (
      <span
        key={i}
        style={{
          display: "inline-block",
          width: COL_W,
          minWidth: COL_W,
          position: "relative",
          alignSelf: "stretch",
          flexShrink: 0,
        }}
      >
        {hasLine && (
          // Vertical dotted line running the full height of the row
          <span
            style={{
              position: "absolute",
              left: COL_W / 2 - 0.5,
              top: 0,
              bottom: 0,
              borderLeft: `1.5px dashed ${LINE_COLOR}`,
            }}
          />
        )}
      </span>
    ));

    // The connector for the current node (only if not root)
    const nodeConnector = !isRoot && (
      <span
        style={{
          display: "inline-block",
          width: COL_W,
          minWidth: COL_W,
          position: "relative",
          alignSelf: "stretch",
          flexShrink: 0,
        }}
      >
        {/* Vertical part: from top down to mid-row (and continues if not last) */}
        <span
          style={{
            position: "absolute",
            left: COL_W / 2 - 0.5,
            top: 0,
            bottom: isLast ? "50%" : 0,
            borderLeft: `1.5px dashed ${LINE_COLOR}`,
          }}
        />
        {/* Horizontal branch: mid-row to the right */}
        <span
          style={{
            position: "absolute",
            left: COL_W / 2,
            top: "50%",
            width: COL_W / 2,
            borderTop: `1.5px dashed ${LINE_COLOR}`,
          }}
        />
      </span>
    );

    // Icon for the node
    let nodeIcon;
    if (isRoot) {
      nodeIcon = (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          style={{ color: "#7a4b78", flexShrink: 0 }}
        >
          <path d="M12 3c1.2 0 2 .8 2 2s-.8 2-2 2-2-.8-2-2 .8-2 2-2z" fill="currentColor" />
          <path d="M6 13c0-2.2 2.7-4 6-4s6 1.8 6 4c0 1.4-1 2.6-2.6 3.2-1.2.4-2.8.6-3.4 1.8-.4.8-1.6.8-2 0-.6-1.2-2.2-1.4-3.4-1.8C7 15.6 6 14.4 6 13z" fill="currentColor" />
        </svg>
      );
    } else if (hasChildren) {
      // folder / operation node
      nodeIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="#e6a817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    } else {
      // leaf item
      nodeIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    }

    // Expand/collapse chevron for nodes that have children
    const chevron = hasChildren && (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#7a4b78"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          flexShrink: 0,
          transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );

    return (
      <div key={path}>
        {/* Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            minHeight: 30,
            cursor: hasChildren ? "pointer" : "default",
            background: isSelected ? "#f5f0f5" : "transparent",
            borderRadius: 4,
            padding: "2px 4px 2px 0",
            borderLeft: isSelected ? "3px solid #7a4b78" : "3px solid transparent",
          }}
          onClick={() => {
            if (node.id) setSelectedRowId(node.id);
            if (hasChildren) toggleNode(path);
          }}
        >
          {/* Ancestor gutter lines */}
          {gutterCols}

          {/* Current node connector */}
          {nodeConnector}

          {/* Icons and label */}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0, flexShrink: 1 }}>
            {chevron}
            {nodeIcon}
            <span
              style={{
                fontSize: 17,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: isRoot ? "bold" : isSelected ? "bold" : "normal",
                color: isSelected ? "#7a4b78" : "#374151",
              }}
            >
              {node.name}
            </span>
          </span>
        </div>

        {/* Children */}
        {hasChildren && !isCollapsed && (
          <div>
            {node.children.map((child, idx) => {
              const childIsLast = idx === node.children.length - 1;
              // Pass down whether THIS level should show a continuing vertical line
              const nextAncestorLines = isRoot
                ? []
                : [...ancestorLines, !isLast];
              return renderTreeNode(
                child,
                level + 1,
                `${path}/${child.name}-${idx}`,
                nextAncestorLines,
                childIsLast
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderBOMRow = (item) => {
    return (
      <tr
        key={item.id}
        id={`bom-row-${item.id}`}
        style={{
          background: item.id === selectedRowId ? "#f5f0f5" : undefined,
          cursor: "pointer",
          borderLeft: item.id === selectedRowId ? "4px solid #2196f3" : undefined,
        }}
        onClick={() => setSelectedRowId(item.id)}
      >
        <td>
          <div className="d-flex align-items-center" style={{ padding: "0.25rem 0.5rem" }}>
            {item.itemType === "Operation" && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChild(item.id);
                }}
                title="Add child item"
                disabled={!isEditMode}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>
            )}
            <div className="dropdown-container position-relative">
              <span
                ref={(el) => (actionBtnRefs.current[item.id] = el)}
                onClick={(e) => isEditMode && toggleDropdown(item.id, e)}
                title="More actions"
                style={{
                  cursor: !isEditMode ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: 4,
                  borderRadius: 6,
                  transition: "background 0.2s",
                  opacity: !isEditMode ? 0.5 : 1,
                  background: openDropdownId === item.id ? "#f3f4f6" : "transparent"
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                </svg>
              </span>
              {openDropdownId === item.id && (
                <div
                  className="dropdown-menu show"
                  style={{
                    display: "block",
                    position: "fixed",
                    left: dropdownPos.left,
                    top: dropdownPos.top,
                    transform: dropdownDirection === "up" ? "translateY(-100%)" : "none",
                    minWidth: 160,
                    zIndex: 4000,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                    background: "#fff",
                    border: "1px solid #e1e5e9",
                    borderRadius: "6px",
                  }}
                >
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                    style={{ color: "#374151", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 7h16" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
                      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </td>
        <td>
          <FormField
            labelFieldshow={false}
            value={item.itemType || ""}
            onChange={(e) => handleBOMItemChange(item.id, "itemType", e.target.value)}
            disabled={true} // Always disabled - Line Type is non-editable
            style={{ textAlign: "center" }}
          />
        </td>
        {item.itemType === "Item" ? (
          <td colSpan={2}>
            <input type="text" className="form-control" disabled value="" />
          </td>
        ) : (
          <>
            <td>
              <div style={{ position: "relative" }}>
                <ReactSelectField
                  name={`operation-${item.id}`}
                  value={item.operation || ""}
                  options={operationOptions}
                  onChange={(e) => handleBOMItemChange(item.id, "operation", e.target.value)}
                  disabled={!isEditMode}
                  error={rowErrorsByRow[item.id]?.operation}
                  placeholder={!isEditMode && !item.operation ? "" : "Select..."}
                  menuPortalTarget={document.body}
                />
              </div>
            </td>
            <td>
              <FormField
                labelFieldshow={false}
                value={item.sortSequence || ""}
                onChange={(e) => handleBOMItemChange(item.id, "sortSequence", e.target.value)}
                disabled={!isEditMode}
                inputValueType="number"
                error={rowErrorsByRow[item.id]?.sortSequence}
                style={{ textAlign: "center" }}
              />
            </td>
          </>
        )}
        {item.itemType === "Operation" ? (
          <td colSpan={3}>
            <input type="text" className="form-control" disabled value="" />
          </td>
        ) : (
          <>
            <td>
              <div style={{ position: "relative" }}>
                <CustomMultiColumnDropdown
                  name="itemCode"
                  value={item.itemCode ? {
                    value: item.itemCode,
                    label: item.itemDescription ? `${item.itemCode} - ${item.itemDescription}` : item.itemCode,
                    data: { itemCode: item.itemCode, description: item.itemDescription }
                  } : null}
                  columns={[
                    { key: "itemCode", header: "ITEM CODE", width: "120px", display: "true" },
                    { key: "description", header: "DESCRIPTION", width: "120px" },
                    // { key: "cc_stock", header: "CC stock", width: "200px" },
                  ]}
                  placeholder={!isEditMode && !item.itemCode ? "" : "Type to search..."}
                  onOptionSelected={(opt) => handleItemCodeChange(item.id, opt)}
                  onInputChange={(val) => handleItemCodeInputChange(item.id, val)}
                  options={itemCodeOptionsByRow[item.id] || []}
                  isDisabled={!isEditMode}
                  isLoading={itemCodeLoadingByRow[item.id] || false}
                  error={rowErrorsByRow[item.id]?.itemCode}
                  menuPortalTarget={document.body}
                  isSearchable={true}
                  onMenuOpen={() => handleItemCodeMenuOpen(item.id)}
                  onMenuScrollToBottom={() => handleItemCodeScrollToBottom(item.id)}
                />
              </div>
            </td>
            <td>
              <div
                style={{ width: "100%", height: "100%" }}
                onMouseEnter={(e) => {
                  const inputEl = e.currentTarget.querySelector('input');
                  if (inputEl && inputEl.scrollWidth > inputEl.clientWidth) {
                    e.currentTarget.title = item.itemDescription;
                  } else {
                    e.currentTarget.title = "";
                  }
                }}
              >
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={item.itemDescription || ""}
                  style={{ textAlign: "left", textOverflow: "ellipsis", pointerEvents: "none" }}
                />
              </div>
            </td>
            <td className="qty-td">
              <div className="qty-unit-wrapper">
                <NumericEditor
                  value={item.quantity}
                  onChange={(e) => handleBOMItemChange(item.id, "quantity", e.target.value)}
                  precision={10}
                  scale={6}
                  disabled={!isEditMode}
                  className={`form-control form-control-sm text-center ${rowErrorsByRow[item.id]?.quantity ? "is-invalid" : ""}`}
                  style={{
                    boxSizing: "border-box",
                    paddingRight: item.itemUnit ? "45px" : "4px"
                  }}
                />
                {item.itemUnit && (
                  <span className="qty-unit-label" style={{ fontWeight: "bold" }}>
                    {item.itemUnit}
                  </span>
                )}
              </div>
              {rowErrorsByRow[item.id]?.quantity && (
                <div className="invalid-feedback d-block" style={{ fontSize: "11px", textAlign: "center" }}>
                  {rowErrorsByRow[item.id].quantity}
                </div>
              )}
            </td>
          </>
        )}
        <td>
          <FormField
            labelFieldshow={false}
            value={item.remarks}
            onChange={(e) => handleBOMItemChange(item.id, "remarks", e.target.value)}
            disabled={!isEditMode}
          />
        </td>
        <td><span>{indexCodes.get(item.id)}</span></td>
      </tr>
    );
  };

  // API call to save/update BOM header
  const [showUpdateInfoModal] = useState(false);
  const [, setChangeDescription] = useState("");


  // Function to transform BOM data to API payload format
  const transformBOMDataToPayload = useCallback(
    (items) => {
      // Filter out deleted items (or handle deleted logic if API supports it later)
      const activeItems = items.filter((item) => !deletedIds.has(item.id));

      const getLevelNumber = (hierCode) => {
        if (!hierCode || hierCode.length === 0) return 0; // Return numeric level
        return Math.floor(hierCode.length / 2);
      };

      const bomDetails = activeItems.map((item) => {
        const isNewItem = item.sNo === null || item.sNo === undefined || item.sNo === 0;
        const isOperation = item.itemType === "Operation";

        return {
          bomLineID: isNewItem ? 0 : Number(item.sNo),
          lineType: isOperation ? "0" : "1",
          bomid: productInfo.bom_id || 0,
          itemID: isOperation ? 0 : Number(item.itemID) || 0,
          bomiRemarks: item.remarks || "",
          quantityPerAssembly: isOperation ? 0 : Number(item.quantity) || 0,
          hierarchyCode: item.hierCode || "",
          levelNumber: getLevelNumber(item.hierCode),
          operationID: isOperation ? Number(item.operation) || 0 : 0,
          sortSequence: isOperation ? Number(item.sortSequence) || 0 : 0,
          paramType: "ADD"
        };
      });

      return {
        bomid: productInfo.bom_id || 0,
        fgItemID: Number(fgItemID) || 0,
        fgAssemblyBaseQuantity: Number(productInfo.quantity) || 0,
        preparedBy: productInfo.preparedBy || getPreparedBy() || "",
        bomRemarks: productInfo.remarks || "",
        updatedBy: (productInfo.bom_id > 0) ? getPreparedBy() : "",
        bomDetail: bomDetails,
        paramType: "ADD"
      };
    },
    [productInfo, deletedIds, fgItemID]
  );

  // Validate BOM items before saving
  const validateBOMItems = useCallback(() => {
    const rowErrors = {};
    const hErrors = {};
    let isValid = true;

    // Validate Header
    if (!productInfo.quantity || String(productInfo.quantity).trim() === "" || Number(productInfo.quantity) < 1) {
      hErrors.quantity = "Required*";
      isValid = false;
    }

    // Validate Rows
    const activeItems = bomData.filter((item) => !deletedIds.has(item.id));
    activeItems.forEach((item) => {
      const errors = {};
      if (item.itemType === "Item") {
        if (!item.itemCode || String(item.itemCode).trim() === "") {
          errors.itemCode = "Required*";
          isValid = false;
        }
        if (!item.quantity || String(item.quantity).trim() === "" || Number(item.quantity) === 0) {
          errors.quantity = "Required*";
          isValid = false;
        }
      } else if (item.itemType === "Operation") {
        if (!item.operation || String(item.operation).trim() === "") {
          errors.operation = "Required*";
          isValid = false;
        }
        if (!item.sortSequence || String(item.sortSequence).trim() === "") {
          errors.sortSequence = "Required*";
          isValid = false;
        }
      }

      if (Object.keys(errors).length > 0) {
        rowErrors[item.id] = errors;
      }
    });

    setRowErrorsByRow(rowErrors);
    setHeaderErrors(hErrors);
    return isValid;
  }, [bomData, deletedIds, productInfo.quantity]);

  // API call to save/update history card


  // Reset textarea when modal opens - always start empty for user to add description
  useEffect(() => {
    if (showUpdateInfoModal) {
      setChangeDescription(""); // Always start with empty textarea
    }
  }, [showUpdateInfoModal]);

  // Save handler that validates and only calls APIs if valid
  const handleSaveBOM = useCallback(async () => {
    if (!validateBOMItems()) {
      // showToast("Please fill all required fields", "warning");
      return;
    }

    try {
      setHeaderLoading(true);
      const payload = transformBOMDataToPayload(bomData);

      const { saveAndUpdateBOMMaster } = await import("../../../services/billOfMaterialService");
      const result = await saveAndUpdateBOMMaster(payload);

      if (result?.Status === SUCCESS_STATUS) {
        const successMsg = result?.data?.BOM_MASTER_RESPONSE?.[0]?.Message || "BOM Saved Successfully";
        const newBomId = result?.data?.BOM_MASTER_RESPONSE?.[0]?.ID;

        showToast(successMsg, SUCCESS_STATUS);

        // Capture the final bomid (use newly returned ID if this was a first-time save)
        const latestBomId = newBomId ? Number(newBomId) : productInfo.bom_id;

        // Immediately re-fetch BOM details to sync UI state with backend
        try {
          const refreshed = await getBOMMasterDetails({
            fgItemID: Number(fgItemID) || 0,
            bomid: latestBomId || 0
          });

          if (refreshed?.Status === SUCCESS_STATUS && refreshed.data) {
            const header = refreshed.data.BOM_MASTER_COMMON_RESPONSE?.[0];
            const details = refreshed.data.BOM_MASTER_DETAILS_RESPONSE || [];

            if (header) {
              setProductInfo(prev => ({
                ...prev,
                productName: header.item_description || prev.productName,
                productCode: header.item_code || prev.productCode,
                quantity: String(header.fg_assembly_base_qty || "1"),
                preparedBy: header.prep_by || prev.preparedBy,
                preparedDate: header.prep_date ? customFormatDateTime(header.prep_date, "dd-MM-yyyy") : prev.preparedDate,
                remarks: header.bom_remarks || "",
                doc_status: header.doc_status || 0,
                doc_status_text: header.doc_status_text || " ",
                updatedBy: header.updated_by || header.update_by || "",
                updatedDate: (header.updated_date || header.update_date) ? customFormatDateTime(header.updated_date || header.update_date, "dd-MM-yyyy") : "",
                bom_id: header.bom_id || latestBomId,
                unit: header.item_unit || prev.unit
              }));
              setDocStatus(header.doc_status_text || "");
            }

            if (Array.isArray(details) && details.length > 0) {
              // Pre-seed units from the pre-save bomData (free — no extra API call needed)
              // Build a map of itemCode -> itemUnit from the current state before it's overwritten
              const preSaveUnitCache = new Map();
              bomData.forEach(row => {
                if (row.itemCode && row.itemUnit) {
                  preSaveUnitCache.set(row.itemCode, row.itemUnit);
                }
              });

              const mappedDetails = details.map(it => {
                const itemCode = it.item_id_text || it.item_code || "";
                // Try every unit field the API might return, then fall back to the pre-save cache
                const itemUnit =
                  it.item_unit_text || it.item_unit || it.uom || it.unit || it.UOM || it.Unit ||
                  preSaveUnitCache.get(itemCode) || "";

                return {
                  id: it.bom_line_id || Date.now() + Math.random(),
                  sNo: it.bom_line_id || 0,
                  itemType: it.line_type === "0" ? "Operation" : "Item",
                  itemID: it.item_id || 0,
                  itemCode,
                  itemDescription: it.item_description || "",
                  itemUnit,
                  remarks: it.bom_iremarks || "",
                  quantity: String(it.qty_per_assembly ?? "1.000000"),
                  hierCode: it.hier_code || "",
                  levelNumber: it.level_nr || 0,
                  operation: it.operation_id ? String(it.operation_id) : "",
                  sortSequence: it.sort_sequence ? String(it.sort_sequence) : "",
                  parentId: null,
                };
              });

              // Link parent IDs based on hierarchy codes for existing data
              const hierMap = new Map();
              mappedDetails.forEach(d => {
                if (d.hierCode) hierMap.set(d.hierCode, d.id);
              });

              mappedDetails.forEach(d => {
                if (d.hierCode && d.hierCode.length > 2) {
                  const parentHier = d.hierCode.slice(0, -2);
                  d.parentId = hierMap.get(parentHier) || null;
                }
              });

              // For any rows still missing details (e.g. new items from this save),
              // call the resolver which uses getItemCodeList API
              const resolved = await resolveItemDetailsForRows(mappedDetails);

              resolved.sort((a, b) => (a.hierCode || "").localeCompare(b.hierCode || ""));

              setBomData(resolved);
            } else {
              // Clear bomData when API returns empty details (all rows deleted)
              setBomData([]);
            }
          }
        } catch (refreshErr) {
          console.error("Failed to refresh BOM details after save:", refreshErr);
        }

        setDeletedIds(new Set());
        setRowErrorsByRow({});
        setHeaderErrors({});
        clearDirty();
        setIsEditMode(false);
      } else {
        showToast("Failed to save BOM", ERROR_STATUS.toLowerCase());
      }
    } catch (e) {
      console.error("Save BOM failed", e);
      showToast("An error occurred while saving BOM", ERROR_STATUS.toLowerCase());
    } finally {
      setHeaderLoading(false);
    }
  }, [validateBOMItems, showToast, bomData, clearDirty, setIsEditMode, transformBOMDataToPayload, fgItemID, productInfo.bom_id, resolveItemDetailsForRows]);

  const handleDisableEdit = useCallback(() => {
    setIsEditMode(false);
  }, [setIsEditMode]);

  // Provide headerActions to parent via callback
  useEffect(() => {
    if (onHeaderActionsReady) {
      const actions = getBOMHeaderActions({
        isEditMode,
        setIsEditMode,
        docStatus,
        openPrintPreview,
        handleSaveBOM,
        headerLoading,
        onDisableEdit: handleDisableEdit,
      });
      onHeaderActionsReady(actions);
    }
  }, [
    isEditMode,
    docStatus,
    headerLoading,
    onHeaderActionsReady,
    openPrintPreview,
    setIsEditMode,
    handleSaveBOM,
    handleDisableEdit,
  ]);

  return (
    <div ref={bomContainerRef} className="bom-main-container">

      {/* Loader overlay */}
      <FullPageLoader
        loading={headerLoading}
        message="Saving Bill of Material..."
        logoSrc={inspireLogo}
      />
      {(itemsLoading || loading) && <Loader />}

      {/* Theme style overrides */}
      <style>{`
        .bom-table .mb-2 {
          margin-bottom: 0 !important;
        }
        .bom-table .form-label {
          display: none !important;
        }
        .bom-table td {
          vertical-align: middle;
        }
        .bom-main-container .btn-primary {
          background-color: rgb(122, 75, 120) !important;
          border-color: rgb(122, 75, 120) !important;
        }
        .bom-main-container .btn-outline-primary {
          color: rgb(122, 75, 120) !important;
          border-color: rgb(122, 75, 120) !important;
        }
        .bom-main-container .btn-outline-primary:hover {
          background-color: rgb(122, 75, 120) !important;
          color: white !important;
        }
        .bom-main-container .card-header {
           background-color: rgb(122, 75, 120) !important;
        }
      `}</style>



      {/* Below: Component List (left) + Product Hierarchy (right) */}
      <div className="row">
        <div className="col-md-9">
          {/* Component List Table */}
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div className="card">
              <div
                className="card-header d-flex justify-content-between align-items-center"
                style={{
                  backgroundColor: "rgb(122, 75, 120)",
                  color: "white",
                  padding: "10px",
                }}
              >
                <h5 className="mb-0">Component List</h5>
                {/* Removed Add child button from here */}
              </div>
              <div className="card-body p-0" style={{ maxHeight: "530px", overflowY: "auto" }}>
                <div className="table-responsive" style={{ overflow: "auto", maxHeight: "530px" }}>
                  <table
                    className="table table-bordered table-sm mb-0 bom-table"
                    style={{ fontSize: 12, minWidth: "1400px", marginBottom: "0" }}
                  >
                    <thead style={{ backgroundColor: "#e9ecef" }}>
                      <tr>
                        <th
                          style={{
                            width: "5%",
                            minWidth: "100px",
                            textTransform: "none",
                            textAlign: "center",
                            padding: "8px 8px"
                          }}
                        >
                          Actions
                        </th>
                        <th
                          style={{
                            width: "4.5%",
                            minWidth: "120px",
                            textTransform: "none",
                            textAlign: "center",
                            padding: "8px 8px"
                          }}
                        >
                          Type
                        </th>
                        <th
                          style={{
                            width: "12%",
                            minWidth: "220px",
                            textTransform: "none",
                            textAlign: "center",
                            padding: "8px 8px"
                          }}
                        >
                          Operation
                        </th>
                        <th
                          style={{
                            width: "4.5%",
                            minWidth: "120px",
                            textTransform: "none",
                            textAlign: "center",
                            padding: "8px 8px"
                          }}
                        >
                          Sort Seq
                        </th>
                        <th
                          style={{
                            width: "8%",
                            minWidth: "160px",
                            textTransform: "none",
                            textAlign: "center",
                            padding: "8px 4px"
                          }}
                        >
                          Item Code
                        </th>
                        <th
                          style={{
                            width: "16%",
                            minWidth: "350px",
                            textTransform: "none",
                            textAlign: "center",
                            padding: "8px 8px"
                          }}
                        >
                          Item Description
                        </th>
                        <th
                          style={{
                            width: "10%",
                            minWidth: "160px",
                            textTransform: "none",
                            textAlign: "center",
                            padding: "8px 8px"
                          }}
                        >
                          Qty per Assembly
                        </th>
                        <th
                          style={{
                            width: "16%",
                            minWidth: "350px",
                            textTransform: "none",
                            textAlign: "center",
                            padding: "8px 8px"
                          }}
                        >
                          Remarks
                        </th>
                        <th
                          style={{
                            width: "10%",
                            minWidth: "120px",
                            textTransform: "none",
                            textAlign: "center",
                            padding: "8px 8px"
                          }}
                        >
                          Index
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Product row as first row */}
                      <tr
                        style={{
                          background: "#e3f2fd",
                          fontWeight: "bold",
                        }}
                      >
                        <td>
                          <div
                            className="d-flex align-items-center"
                            style={{ padding: "0.25rem 0.5rem" }}
                          >
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddChild(null);
                              }} // Add root level item
                              title="Add operation"
                              disabled={!isEditMode}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  d="M12 5v14m-7-7h14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="3"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                        {/* Line Type, Operation, Sort Sequence combined */}
                        <td colSpan={3} style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                          Product : {itemCode || ""} , {productInfo.productName || ""}
                        </td>
                        {/* Item Code & Item Description */}
                        <td colSpan={2}></td>
                        {/* Qty/Assembly and Remarks combined to remove vertical lines and center content */}
                        <td colSpan={2}>
                          <div className="d-flex align-items-center gap-2">
                            <FormField
                              labelFieldshow={false}
                              type="text"
                              name="quantity"
                              value={productInfo.quantity || ""}
                              onChange={(e) => {
                                let digitsOnly = String(e.target.value || "")
                                  .replace(/\D/g, "")
                                  .slice(0, 6);

                                if (digitsOnly.startsWith("0")) {
                                  digitsOnly = digitsOnly.replace(/^0+/, "");
                                }

                                setProductInfo((prev) => ({
                                  ...prev,
                                  quantity: digitsOnly,
                                }));

                                if (digitsOnly !== "") {
                                  setHeaderErrors((prev) => {
                                    if (!prev.quantity) return prev;
                                    const { quantity: _, ...rest } = prev;
                                    return rest;
                                  });
                                }

                                markDirty();
                              }}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (!val || parseInt(val, 10) < 1) {
                                  setProductInfo((prev) => ({
                                    ...prev,
                                    quantity: "1",
                                  }));
                                  markDirty();
                                }
                              }}
                              className="form-control form-control-sm"
                              style={{
                                textAlign: "center",
                                width: "100px", // Fixed width for the input for better alignment
                                marginLeft: "28px"
                              }}
                              onWheel={(e) => e.target.blur()}
                              maxLength={6}
                              inputMode="numeric"
                              pattern="\\d*"
                              error={headerErrors.quantity}
                              disabled={!isEditMode}
                            />
                            <span style={{
                              fontSize: "11px",
                              color: "#6c757d",
                              whiteSpace: "nowrap",
                              display: "inline-flex",
                              alignItems: "center",
                              height: "24px" // Match input height for perfect centering
                            }}>
                              {productInfo.unit || "NOS"} of : {itemCode}
                            </span>
                          </div>
                        </td>
                        {/* Index */}
                        <td></td>
                      </tr>
                      {Array.isArray(bomData) && bomData.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            style={{ textAlign: "center", color: "#6c757d" }}
                          >
                            No data available
                          </td>
                        </tr>
                      )}
                      {bomData
                        .filter((item) => !deletedIds.has(item.id))
                        .map((item) => renderBOMRow(item))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3" style={{ alignSelf: "flex-start" }}>
          {/* Product Hierarchy Tree */}
          <div>
            <div
              className="card"
              style={{
                width: "100%",
              }}
            >
              <div
                className="card-header"
                style={{
                  backgroundColor: "rgb(122, 75, 120)",
                  color: "white",
                  padding: "10px",
                }}
              >
                <h5 className="mb-0">Product Hierarchy</h5>
              </div>
              <div
                className="card-body"
                style={{ overflow: "auto", width: "100%", maxHeight: "530px" }}
              >
                <div
                  className="product-hierarchy-tree-scroll"
                  style={{
                    padding: "10px",
                    backgroundColor: "white",
                    borderRadius: "5px",
                    minWidth: "100%",
                    width: "max-content",
                  }}
                >
                  {renderTreeNode(buildTree())}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit and Remarks Section moved below Component List & Hierarchy */}

      <div className="row g-2 mb-2 mt-3">
        <div className="col-12 col-md-8">
          <TextAreaFormField
            label="Remarks"
            name="remarks"
            value={productInfo.remarks}
            onChange={(e) => {
              setProductInfo((prev) => ({
                ...prev,
                remarks: e.target.value,
              }));
              markDirty();
            }}
            className="form-control"
            rows="1"
            style={{ width: "100%", minHeight: "80px" }}
            placeholder="Enter remarks..."
            disabled={!isEditMode}
          />
        </div>
      </div>


      <div className="row g-2 mb-2">
        <div className="col-6 col-sm-3 col-md-2">
          <div className="mb-2">
            <FormField
              label="Prepared By"
              type="text"
              name="preparedBy"
              value={productInfo.preparedBy}
              className="form-control form-control-sm"
              style={{ width: "100%" }}
              disabled
            />
          </div>
        </div>
        <div className="col-6 col-sm-3 col-md-2">
          <div className="mb-2">
            <FormField
              label="Prepared Date"
              type="text"
              name="preparedDate"
              value={productInfo.preparedDate}
              className="form-control form-control-sm"
              style={{ width: "100%" }}
              disabled
            />
          </div>
        </div>
        <div className="col-6 col-sm-3 col-md-2">
          <div className="mb-2">
            <FormField
              label="Updated By"
              type="text"
              name="updatedBy"
              value={productInfo.updatedBy}
              className="form-control form-control-sm"
              style={{ width: "100%" }}
              disabled
            />
          </div>
        </div>
        <div className="col-6 col-sm-3 col-md-2">
          <div className="mb-2">
            <FormField
              label="Updated Date"
              type="text"
              name="updatedDate"
              value={productInfo.updatedDate}
              className="form-control form-control-sm"
              style={{ width: "100%" }}
              disabled
            />
          </div>
        </div>
      </div>





      <BomPrintPreview
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        itemCode={productInfo.productCode}
        bomData={bomPreviewData}
        height={"90%"}
        maxHeight={"100%"}
        width={"90%"}
        maxWidth={"100%"}
        modalTitle="Bill Of Material Preview"
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Confirm Delete"
        message={deleteConfirmMessage}
        onConfirm={confirmDeleteItem}
        onCancel={cancelDeleteItem}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />



      {/* <DrawingViewModal
        open={drawingModalOpen}
        onClose={() => setDrawingModalOpen(false)}
        itemCode={drawingItemCode}
        drawingMappedItemCode={drawingMappedItemCode}
        dwgStatus={drawingDwgStatus}
      /> */}

      {/* <YesNoDialog
        open={revisionConfirmOpen}
        title="Confirmation"
        message="Do you want to revise it?"
        onYes={handleSaveConfirmYes}
        onNo={handleSaveConfirmNo}
      /> */}

      <style>{`
            /* Align cells vertically and normalize react-select height within this table */
            .bom-table {
              border-collapse: collapse;
              table-layout: fixed;
            }
            .bom-table td { 
              vertical-align: middle; 
              padding: 0px 4px !important;
            }
            .bom-table th { 
              vertical-align: middle; 
              padding: 6px 4px !important;
            }
            .bom-table thead th { 
              position: sticky; 
              top: 0; 
              z-index: 10; 
              background-color: #e9ecef !important;
              box-shadow: inset 0 -1px 0 #dee2e6;
              color: #6B7280;
            }
            
            /* Target the wrapper divs created by FormField and NumericEditor inside cells */
            .bom-table td > div,
            .bom-table td > .mb-2 {
              // margin-bottom: 0 !important;
            }
            .bom-table .qty-td > .mb-2 {
              margin-bottom: 0 !important;
            }

            .bom-table input, .bom-table select, .bom-table .form-control {
              height: 24px !important;
              min-height: 24px !important;
              font-size: 11px !important;
              padding: 0px 4px !important;
              border-radius: 4px;
            }
            .bom-table .btn-sm {
              padding: 0px 6px !important;
              height: 24px !important;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .bom-table .react-select__control {
              min-height: 24px !important; 
              height: 24px !important; 
              font-size: 11px !important;
              border-radius: 4px;
            }
            .bom-table .react-select__value-container {
              height: 22px !important; 
              padding: 0 4px !important;
            }
            .bom-table .react-select__indicators { height: 22px !important; }
            .bom-table .react-select__indicator { padding: 0 4px !important; }
            .bom-table .react-select__input-container { margin: 0; padding: 0; }
            .bom-table .react-select__input { min-width: 200px !important; }
            
            /* Disabled field styling - grey background and reduced opacity */
            .bom-main-container input:disabled,
            .bom-main-container select:disabled,
            .bom-main-container .form-control:disabled,
            .bom-main-container textarea:disabled,
            .bom-main-container .react-select__control--is-disabled {
              background-color: #e9ecef !important;
              color: #495057 !important;
              opacity: 1 !important;
              cursor: not-allowed !important;
              border-color: #ced4da !important;
            }
            
            /* Disabled react-select specific styling */
            .bom-main-container .react-select__control--is-disabled .react-select__single-value {
              color: #495057 !important;
            }
            
            .bom-main-container .react-select__control--is-disabled .react-select__placeholder {
              color: #adb5bd !important;
            }

            /* Custom styles for the Qty with Unit overlay */
            .qty-td .qty-unit-wrapper {
              position: relative;
              display: flex;
              align-items: center;
              width: 100%;
            }
            .qty-td .qty-unit-wrapper .mb-2 {
              margin-bottom: 0 !important;
              width: 100%;
            }
            .qty-td .qty-unit-label {
              position: absolute;
              right: 8px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 10px;
              color: #6c757d;
              font-weight: 600;
              pointer-events: none;
              z-index: 5;
              white-space: nowrap;
            }
          `}</style>
    </div>
  );
}
