import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { FormField } from "../../components/FormElement";
import { CharacteristicSelectField } from "../../components/CharacteristicSelectField";
import { CustomMultiColumnDropdown } from "../../components/CustomVendorDropdown";
import { useToast } from "../../components/useToast";
import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
import FullPageLoader from "../../components/FullPageLoader";
import Loader from "../../components/Loader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import { DeleteConfirmDialog } from "../../components/Notification";
import { getCharacteristicMasterOptions, getInspectionItemsOptions, saveAndUpdateCharacteristicMaster, saveAndUpdateInspectionMaster, getInspectionMasterDetails, viewOrDeleteInspectionVideoFiles } from "../../services/inspectionMasterService";
import { hasPermission, menuPermissions } from "../../permissions/permissionUtils";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS } from "../../utils/ConstVariables";
import { getPreparedBy } from "../../utils/userSession";
import { DECIMAL_QTY_REGEX } from "../../utils/regexUtils";
import InspectionVideoUploadModal from "./InspectionVideoUploadModal";


const today = new Date().toISOString().split("T")[0];

// Helper to extract dropdown list from API response
const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;

  const d1 = payload?.data;
  if (Array.isArray(d1)) return d1;

  const d2 =
    payload?.data?.data?.DROPDOWN_LIST ??
    payload?.data?.DROPDOWN_LIST ??
    payload?.data?.data ??
    payload?.data;

  if (Array.isArray(d2)) return d2;

  const d3 =
    payload?.data?.data?.data?.DROPDOWN_LIST ??
    payload?.data?.data?.data ??
    payload?.data?.data;

  if (Array.isArray(d3)) return d3;

  return [];
};


const SaveOrUpdateInspection = forwardRef(
  (
    {
      onClose,
      onSuccess,
      initialData,
      editMode: propEditMode,
      initialEditMode,
      onDirtyChange,
      open = true,
      // canDelete = true,
    },
    ref
  ) => {
    // Determine edit mode: use propEditMode if provided, otherwise use initialEditMode (for new records)
    const editMode = propEditMode !== undefined ? propEditMode : (initialEditMode !== undefined ? initialEditMode : true);
    const { showToast } = useToast();
    const [itemCode, setItemCode] = useState("");
    const [itemType, setItemType] = useState(""); // Store item type (FG or RM)
    const [itemDescription, setItemDescription] = useState(""); // Store item description
    const [apiItemData, setApiItemData] = useState(null); // Store item data from API response (item_code, item_id, item_description)
    const [selectedCharacteristic, setSelectedCharacteristic] = useState("");
    const [characteristics, setCharacteristics] = useState([]);
    const [inspectionItems, setInspectionItems] = useState([]);
    const [inspectionData, setInspectionData] = useState({}); // Store data for all characteristics: { characteristicValue: [items] }
    const [displayedCharacteristics, setDisplayedCharacteristics] = useState([]); // Track all displayed characteristics: [{ value, label }]
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [expandedCharacteristic, setExpandedCharacteristic] = useState(null); // Track which characteristic is expanded (only one at a time)
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [inspectionToDelete, setInspectionToDelete] = useState(null);
    // Video Upload Modal state
    const [videoUploadModal, setVideoUploadModal] = useState({ open: false, row: null });
    const [isAddingNewCharacteristic, setIsAddingNewCharacteristic] = useState(false);
    const [newCharacteristicInput, setNewCharacteristicInput] = useState("");
    const [characteristicInputResetKey, setCharacteristicInputResetKey] = useState(0);
    const [isSavingCharacteristic, setIsSavingCharacteristic] = useState(false);
    const [previousSelectedCharacteristic, setPreviousSelectedCharacteristic] = useState(null); // Store previous selection before entering "New" mode
    const [isEditingCharacteristic, setIsEditingCharacteristic] = useState(false);
    const [editingCharacteristicId, setEditingCharacteristicId] = useState(null);
    const [editingCharacteristicName, setEditingCharacteristicName] = useState("");
    const [isInlineEditingCharacteristic, setIsInlineEditingCharacteristic] = useState(false);
    const characteristicSelectRef = useRef(null);
    const lastHandledSelectedCharacteristicRef = useRef(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsLoaded, setDetailsLoaded] = useState(false); // Track if details have been loaded
    const [fieldErrors, setFieldErrors] = useState({}); // Track validation errors: { itemId: { fieldName: "error message" } }
    const canDeleteInspection = hasPermission(menuPermissions.INSPECTION_MASTER_DELETE);
    const canEditInspection = hasPermission(menuPermissions.INSPECTION_MASTER_EDIT);
    const initialInspectionDataRef = useRef(null); // Store initial inspection data for comparison
    const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if initial data is being loaded
    const skipNextDraftSaveRef = useRef(false);
    const DRAFT_KEY = "draft_inspection_master";
    const [, setBaseCharacteristic] = useState(""); // used by handleSaveNewCharacteristic, handleEditClickFromDropdown, handleSaveEditCharacteristic

    // Initialize form values
    const initialValues = useMemo(() => {
      const base = initialData ? {
        itemCode: initialData.itemCode || initialData.item_code || "",
        characteristic: initialData.characteristic || initialData.characteristic_name || "",
        itemDescription: initialData.item_description || initialData.itemDescription || "",
      } : {
        itemCode: "",
        characteristic: "",
        itemDescription: "",
      };

      return {
        ...base,
        itemType: "",
        displayedCharacteristics: [],
        inspectionData: {},
        expandedCharacteristic: null,
        expandedCategories: [],
      };
    }, [initialData]);

    const { onValuesChange, resetDirty } = useDirtyDraftDrawer({
      open: open,
      initialValues,
      initialData,
      draftKey: DRAFT_KEY,
    });


    const cleanBaselineRef = useRef(null);
    const videosToDeleteRef = useRef([]); // Track [{ inspectionID, itemCode }] for post-save deletion
    const hasDirtyChangedRef = useRef(false);

    // Store onValuesChange in a ref so it's always up-to-date but never causes useEffect re-runs
    const onValuesChangeRef = useRef(onValuesChange);
    useEffect(() => {
      onValuesChangeRef.current = onValuesChange;
    }, [onValuesChange]);

    // Load draft data on mount if in "Add" mode
    useEffect(() => {
      // If we are in edit mode or drawer is closed, skip
      if (initialData || !open) {
        if (!open) {
          // When drawer closes, reset flags for next open
          setIsInitialLoad(true);
          hasDirtyChangedRef.current = false;
          cleanBaselineRef.current = null;
          videosToDeleteRef.current = [];
        }
        return;
      }

      const loadDraftData = () => {
        setIsInitialLoad(true);
        hasDirtyChangedRef.current = false;
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          let loadedDraft = null;
          if (raw) {
            loadedDraft = JSON.parse(raw);
            setItemCode(loadedDraft.itemCode || "");
            setItemType(loadedDraft.itemType || "");
            setItemDescription(loadedDraft.itemDescription || "");
            setSelectedCharacteristic(loadedDraft.characteristic || "");
            setDisplayedCharacteristics(loadedDraft.displayedCharacteristics || []);
            setInspectionData(loadedDraft.inspectionData || {});
            setExpandedCharacteristic(loadedDraft.expandedCharacteristic || null);
            setExpandedCategories(new Set(loadedDraft.expandedCategories || []));
          } else {
            // No draft — reset all fields
            setItemCode("");
            setItemType("");
            setItemDescription("");
            setSelectedCharacteristic("");
            setDisplayedCharacteristics([]);
            setInspectionData({});
            setExpandedCharacteristic(null);
            setExpandedCategories(new Set());
            videosToDeleteRef.current = [];
          }

          // Set the clean baseline to whatever was just loaded (draft or empty)
          const baseline = {
            itemCode: loadedDraft?.itemCode || "",
            itemType: loadedDraft?.itemType || "",
            itemDescription: loadedDraft?.itemDescription || "",
            characteristic: loadedDraft?.characteristic || "",
            displayedCharacteristics: loadedDraft?.displayedCharacteristics || [],
            inspectionData: loadedDraft?.inspectionData || {},
            expandedCharacteristic: loadedDraft?.expandedCharacteristic || null,
            expandedCategories: loadedDraft?.expandedCategories || [],
          };
          cleanBaselineRef.current = JSON.stringify(baseline);
        } catch (e) {
          console.error("Failed to load/reset inspection draft", e);
          cleanBaselineRef.current = null;
        } finally {
          setTimeout(() => {
            setIsInitialLoad(false);
          }, 500);
        }
      };

      loadDraftData();
    }, [initialData, open]);

    // Set base characteristic whenever initialData changes
    useEffect(() => {
      if (initialValues.characteristic) {
        setBaseCharacteristic(String(initialValues.characteristic));
      } else {
        setBaseCharacteristic("");
      }
    }, [initialValues.characteristic, initialData]);


    // useEffect(() => {
    //   setBaseCharacteristic(
    //     initialValues.characteristic
    //       ? String(initialValues.characteristic)
    //       : ""
    //   );
    // }, [initialValues.characteristic]);


    useEffect(() => {
      if (initialData || isInitialLoad || !open) return;

      // If clearDraft was just called, reset the skip flag and bail out of this run
      if (skipNextDraftSaveRef.current) {
        skipNextDraftSaveRef.current = false;
        return;
      }

      const draft = {
        itemCode,
        itemType,
        itemDescription,
        characteristic: selectedCharacteristic,
        displayedCharacteristics,
        inspectionData,
        expandedCharacteristic,
        expandedCategories: Array.from(expandedCategories),
      };

      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        console.error("Failed to save inspection draft", e);
      }

      try {
        const currentSnapshot = JSON.stringify(draft);
        const isDirtyNow = cleanBaselineRef.current !== null
          ? currentSnapshot !== cleanBaselineRef.current
          : false; // Baseline not set yet — not dirty

        if (onDirtyChange) {
          onDirtyChange(isDirtyNow);
        }
      } catch {
        // If comparison fails, be conservative — don't trigger dirty
      }
    }, [itemCode, itemType, itemDescription, selectedCharacteristic, displayedCharacteristics, inspectionData, expandedCharacteristic, expandedCategories, initialData, isInitialLoad, open, onDirtyChange]);

    // Track dirty state in Edit mode (when initialData is present)
    useEffect(() => {
      if (!initialData || isInitialLoad || !open) return;

      const checkEditDirty = () => {
        if (!initialInspectionDataRef.current) return false;

        try {
          // Compare current inspectionData with the initial baseline
          // We use JSON.stringify for a deep comparison of the grouped data
          const currentSnapshot = JSON.stringify(inspectionData);
          const initialSnapshot = JSON.stringify(initialInspectionDataRef.current);

          return currentSnapshot !== initialSnapshot;
        } catch (e) {
          console.error("Error checking edit dirty state:", e);
          return false;
        }
      };

      const isDirty = checkEditDirty();
      if (onDirtyChange) {
        onDirtyChange(isDirty);
      }
    }, [inspectionData, initialData, isInitialLoad, open, onDirtyChange]);

    // const lastDirtyRef = useRef(null);

    const handleEditingStateChange = useCallback((isEditing) => {
      setIsInlineEditingCharacteristic(isEditing);
    }, []);


    // Helper functions for dropdown options
    const getOptValue = useCallback((opt) => (opt?.ValueText ?? opt?.value ?? ""), []);
    const getOptLabel = useCallback((opt) => (opt?.DisplayText ?? opt?.label ?? ""), []);

    // Load Characteristic Master options from API
    useEffect(() => {
      let isMounted = true;

      const loadCharacteristics = async () => {
        try {
          const characteristicData = await getCharacteristicMasterOptions();
          const characteristicArr = asArray(characteristicData);
          if (isMounted) {
            setCharacteristics(characteristicArr);
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
          } else {
            console.error("Failed to fetch Characteristic Master", error);
            if (showToast) showToast("Failed to load Characteristic Master", ERROR_STATUS.toLowerCase());
          }
        }
      };

      loadCharacteristics();
      return () => {
        isMounted = false;
      };
    }, [showToast]);

    // Map characteristics to options format
    const characteristicOptions = useMemo(() => {
      return (characteristics || []).map((char) => ({
        value: getOptValue(char),
        label: getOptLabel(char),
      }));
    }, [characteristics, getOptValue, getOptLabel]);

    // Human-readable label for the currently selected characteristic (DisplayText)
    const selectedCharacteristicDisplayText = useMemo(() => {
      if (!selectedCharacteristic) return "";
      const selectedRaw = String(selectedCharacteristic).trim();
      const match = characteristicOptions.find((opt) => {
        const optValue = String(opt.value ?? "").trim();
        const optLabel = String(opt.label ?? "").trim();
        if (optValue === selectedRaw) return true;
        const numOpt = Number(optValue);
        const numSel = Number(selectedRaw);
        if (!Number.isNaN(numOpt) && !Number.isNaN(numSel) && numOpt === numSel) return true;
        return optLabel.toLowerCase() === selectedRaw.toLowerCase();
      });
      return match?.label || selectedCharacteristic;
    }, [selectedCharacteristic, characteristicOptions]);

    // Load Inspection Items options from API
    useEffect(() => {
      let isMounted = true;

      const loadInspectionItems = async () => {
        try {
          const itemsData = await getInspectionItemsOptions();
          const itemsArr = asArray(itemsData);
          if (isMounted) {
            setInspectionItems(itemsArr);
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
          } else {
            console.error("Failed to fetch Inspection Items", error);
            if (showToast) showToast("Failed to load Inspection Items", ERROR_STATUS.toLowerCase());
          }
        }
      };

      loadInspectionItems();
      return () => {
        isMounted = false;
      };
    }, [showToast]);


    const itemMultiOptions = useMemo(() => {
      const arr = asArray(inspectionItems);
      const uniqueOptionsMap = new Map();

      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          const id = String(item.Item_ID ?? item.item_id ?? "");
          const type = String(item.Item_Type ?? item.item_type ?? item.ItemType ?? "").trim();
          // Use composite key to allow same ID with different types
          const val = type ? `${id}|${type}` : id;

          if (val && !uniqueOptionsMap.has(val)) {
            uniqueOptionsMap.set(val, {
              value: val,
              label: item.Item_Code ?? item.item_code ?? "",
              data: {
                item_code: item.Item_Code ?? item.item_code ?? "",
                description: item.Item_Description ?? item.item_description ?? "",
                item_type: type,
              },
            });
          }
        });
      }

      let options = Array.from(uniqueOptionsMap.values());
      // If we have API item data and it's not in the options, add it
      if (apiItemData) {
        const apiItemId = String(apiItemData.item_id || apiItemData.fg_rm_item_id || "");
        const apiItemType = String(apiItemData.item_type || "").trim();
        const compositeValue = apiItemType ? `${apiItemId}|${apiItemType}` : apiItemId;

        const existingIndex = options.findIndex(opt => String(opt.value) === compositeValue);

        if (apiItemId) {
          if (existingIndex >= 0) {
            // Update existing option to match latest API item data (code/description/type)
            const existing = options[existingIndex];
            options[existingIndex] = {
              ...existing,
              label: apiItemData.item_code || existing.label,
              data: {
                ...(existing.data || {}),
                item_code: apiItemData.item_code || existing.data?.item_code || "",
                description: apiItemData.item_description || existing.data?.description || "",
                item_type: apiItemData.item_type || existing.data?.item_type || "",
              },
            };
          } else {
            // Add the API item as an option so the dropdown can display it
            options = [
              {
                value: compositeValue,
                label: apiItemData.item_code || "",
                data: {
                  item_code: apiItemData.item_code || "",
                  description: apiItemData.item_description || "",
                  item_type: apiItemData.item_type || "",
                },
              },
              ...options,
            ];
          }
        }
      }

      return options;
    }, [inspectionItems, apiItemData]);

    // Define columns for multi-column dropdown
    const itemCodeColumns = useMemo(
      () => [
        { key: "item_code", header: "Item Code", maxWidth: "165px", align: "center" },
        { key: "description", header: "Description", maxWidth: "245px", align: "center" },
        { key: "item_type", header: "Item Type", maxWidth: "145px", align: "center" },
      ],
      []
    );

    // Load inspection data when characteristic is selected

    const displayedCharacteristicsRef = useRef(displayedCharacteristics);
    useEffect(() => {
      displayedCharacteristicsRef.current = displayedCharacteristics;
    }, [displayedCharacteristics]);

    useEffect(() => {
      // Don't load data during initial load or characteristic management
      if (isInitialLoad || isAddingNewCharacteristic || isEditingCharacteristic) {
        return;
      }

      if (selectedCharacteristic) {
        // Find the DisplayText (label) of the selected characteristic
        const selectedOption = characteristicOptions.find((opt) => {
          const optValue = String(opt.value || "").trim();
          const selectedValue = String(selectedCharacteristic).trim();
          if (optValue === selectedValue) return true;
          if (!isNaN(Number(optValue)) && !isNaN(Number(selectedValue))) {
            return Number(optValue) === Number(selectedValue);
          }
          return false;
        });

        if (!selectedOption) return;

        const characteristicDisplayText = selectedOption.label;
        const characteristicKey = String(selectedCharacteristic).trim();

        // Check if this characteristic is already displayed (using ref to read current value)
        const currentDisplayed = displayedCharacteristicsRef.current;
        const isAlreadyDisplayed = currentDisplayed.some(
          (char) => String(char.value).trim() === characteristicKey
        );

        if (!isAlreadyDisplayed) {
          setDisplayedCharacteristics((prev) => {
            const alreadyExists = prev.some(
              (char) => String(char.value).trim() === characteristicKey
            );
            if (alreadyExists) return prev;
            return [
              ...prev,
              { value: characteristicKey, label: characteristicDisplayText },
            ];
          });
        }

        setInspectionData((prev) => {
          if (!characteristicKey) return prev;

          if (prev[characteristicKey] && prev[characteristicKey].length > 0) {
            return prev;
          }

          // Use ref for current count to calculate sort sequence
          const newCharacteristicIndex = displayedCharacteristicsRef.current.length;
          const newSortSeq = newCharacteristicIndex + 1;

          const emptyRow = {
            id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            category: characteristicDisplayText,
            characteristicName: "",
            sortSeq: newSortSeq,
            subSortSeq: 1,
            value: "",
            minReading: "",
            maxReading: "",
            preparedBy: getPreparedBy(),
            preparedDate: today,
            updatedBy: "",
            updatedDate: "",
            isCategory: false,
            parentId: null,
            is_video_uploaded: "N",
          };

          return {
            ...prev,
            [characteristicKey]: [emptyRow],
          };
        });

        if (selectedCharacteristic !== lastHandledSelectedCharacteristicRef.current) {
          setExpandedCategories(new Set([characteristicDisplayText]));
          setExpandedCharacteristic(characteristicKey);
          lastHandledSelectedCharacteristicRef.current = selectedCharacteristic;
        }
      } else {
        setInspectionData((prev) => {
          if (Object.keys(prev).length === 0) return prev;
          return {};
        });
        setDisplayedCharacteristics((prev) => {
          if (prev.length === 0) return prev;
          return [];
        });
        setExpandedCategories((prev) => {
          if (prev.size === 0) return prev;
          return new Set();
        });
        setExpandedCharacteristic((prev) => {
          if (prev === null) return prev;
          return null;
        });
        lastHandledSelectedCharacteristicRef.current = null;
      }
    }, [selectedCharacteristic, isInitialLoad, characteristicOptions, isAddingNewCharacteristic, isEditingCharacteristic]);

    // Reset detailsLoaded when initialData changes (to allow re-fetching master details without remounting)
    useEffect(() => {
      if (initialData) {
        setDetailsLoaded(false);
        videosToDeleteRef.current = [];
      }
    }, [initialData?.inspection_id, initialData, initialData?.item_id, initialData?.fg_rm_item_id]);

    // Load inspection master details when initialData is provided
    useEffect(() => {
      const loadInspectionDetails = async () => {
        // Only load if we have initialData with itemCode and itemType, and haven't loaded yet
        if (!initialData || detailsLoaded) {
          // Clear API item data if no initialData
          if (!initialData) {
            setApiItemData(null);
            // Clear initial inspection data ref when no initialData
            initialInspectionDataRef.current = null;
            // Note: isInitialLoadRef.current is handled by the draft loader in Add mode
          }
          return;
        }

        // Mark that we're starting initial load
        setIsInitialLoad(true);


        const numericID = initialData.fg_rm_item_id || initialData.item_id || initialData.inspection_id || null;
        const itemCodeString = initialData.itemCode || initialData.item_code || "";
        const itemTypeValue = initialData.item_type || initialData.itemType || "";

        // Use numeric ID if available, otherwise try to convert itemCode to number
        let fgRmItemID = 0;
        if (numericID != null) {
          fgRmItemID = isNaN(Number(numericID)) ? 0 : Number(numericID);
        } else if (itemCodeString) {
          fgRmItemID = isNaN(Number(itemCodeString)) ? 0 : Number(itemCodeString);
        }

        if (!fgRmItemID || fgRmItemID === 0 || !itemTypeValue) {
          // If no valid numeric ID or itemType, just set basic values
          const compositeValue = itemTypeValue ? `${fgRmItemID || numericID || itemCodeString}|${itemTypeValue.toUpperCase()}` : String(itemCodeString || numericID || "");
          setItemCode(compositeValue);
          setItemType(itemTypeValue || "");
          setItemDescription("");
          setSelectedCharacteristic(initialData.characteristic || initialData.characteristic_name || "");
          // Store empty initial data for dirty tracking
          initialInspectionDataRef.current = {};

          // Mark initial load as complete
          setTimeout(() => {
            setIsInitialLoad(false);
            // Reset dirty state after initial load
            if (onDirtyChange) onDirtyChange(false);
          }, 0);
          return;
        }

        // Check if details were already fetched and passed in initialData
        const preFetchedDetails = initialData._detailsResponse;
        let details = [];

        if (Array.isArray(preFetchedDetails) && preFetchedDetails.length > 0) {
          // Use pre-fetched details from parent component
          details = preFetchedDetails;
          setDetailsLoaded(true); // Mark as loaded
        } else {
          // Need to fetch details from API
          setLoadingDetails(true);
          setDetailsLoaded(true); // Mark as loaded to prevent re-fetching

          try {
            // Call API to get inspection master details
            const response = await getInspectionMasterDetails({
              fgRmItemID: fgRmItemID,
              itemType: itemTypeValue.toUpperCase(),
            });

            // Check response status
            if (response?.Status === SUCCESS_STATUS || response?.message === MESSAGE_OK) {
              details = response?.data?.INSPECTION_MASTER_DETAILS || [];
            } else {
              details = [];
            }
          } catch (error) {
            console.error("Error loading inspection master details:", error);
            if (error?.response?.status === 401) {
              window.dispatchEvent(new Event("sessionExpired"));
            }
            details = [];
          } finally {
            setLoadingDetails(false);
          }
        }

        // Process details (whether pre-fetched or API-fetched)
        if (Array.isArray(details) && details.length > 0) {
          const firstItem = details[0];
          const apiItemCode = firstItem?.item_code || "";
          const apiItemId = firstItem?.item_id || firstItem?.fg_rm_item_id || null;
          const apiItemDescription = firstItem?.item_description || firstItem?.description || "";
          const apiItemType = firstItem?.item_type || "";

          // Set basic item info
          const compositeValue = apiItemType ? `${apiItemId}|${apiItemType}` : String(apiItemId || "");
          setItemCode(compositeValue);
          setItemType(apiItemType);
          setItemDescription(apiItemDescription);

          // Store API item data so it can be added to dropdown options if needed
          if (apiItemId && apiItemCode) {
            setApiItemData({
              item_id: apiItemId,
              fg_rm_item_id: firstItem?.fg_rm_item_id || apiItemId,
              item_code: apiItemCode,
              item_description: apiItemDescription,
              item_type: apiItemType,
            });
          }

          // Group items by characteristic_id
          const groupedByCharacteristic = {};
          const characteristicsMap = new Map(); // Track unique characteristics

          details.forEach((item) => {
            const characteristicID = String(item.characteristic_id || "").trim();

            if (!characteristicID) {
              return; // Skip items without characteristic_id
            }

            // Find the characteristic label from options
            let characteristicLabel = "";
            const charOption = characteristicOptions.find((opt) => {
              const optValue = String(opt.value || "").trim();
              return optValue === characteristicID;
            });
            characteristicLabel = charOption?.label || characteristicID;

            // Track this characteristic
            if (!characteristicsMap.has(characteristicID)) {
              characteristicsMap.set(characteristicID, {
                value: characteristicID,
                label: characteristicLabel,
              });
            }

            // Map API response to component data structure
            const mappedItem = {
              id: item.insp_id || `existing_${item.insp_id}`,
              inspectionID: item.insp_id || 0,
              inspection_id: item.insp_id || 0,
              category: characteristicLabel, // Use characteristic label as category
              characteristicName: item.sub_characteristic_name || "",
              sortSeq: item.characteristic_sort_seq != null ? Number(item.characteristic_sort_seq) : null,
              subSortSeq: item.sub_sort_seq != null ? Number(item.sub_sort_seq) : null,
              value: item.expected_result || "",
              minReading: (() => {
                const hasExpRes = item.expected_result != null && String(item.expected_result).trim() !== "";
                const isZeroMinMax = (item.expected_min_reading == null || Number(item.expected_min_reading) === 0) &&
                                     (item.expected_max_reading == null || Number(item.expected_max_reading) === 0);
                if (hasExpRes && isZeroMinMax) return "";
                return item.expected_min_reading != null && item.expected_min_reading !== ""
                  ? String(item.expected_min_reading)
                  : "";
              })(),
              maxReading: (() => {
                const hasExpRes = item.expected_result != null && String(item.expected_result).trim() !== "";
                const isZeroMinMax = (item.expected_min_reading == null || Number(item.expected_min_reading) === 0) &&
                                     (item.expected_max_reading == null || Number(item.expected_max_reading) === 0);
                if (hasExpRes && isZeroMinMax) return "";
                return item.expected_max_reading != null && item.expected_max_reading !== ""
                  ? String(item.expected_max_reading)
                  : "";
              })(),
              preparedBy: item.prep_by || getPreparedBy(),
              preparedDate: item.prep_date
                ? new Date(item.prep_date).toISOString().split('T')[0]
                : today,
              updatedBy: item.update_by || "",
              updatedDate: item.update_date
                ? new Date(item.update_date).toISOString().split('T')[0]
                : "",
              requiredJigs: item.instrument_name || "",
              isCategory: false,
              parentId: null,
              is_video_uploaded: item.is_video_uploaded || "N",
              fileName: item.FileName || item.fileName || "",
              FileName: item.FileName || item.fileName || "",
            };

            // Group by characteristic_id
            if (!groupedByCharacteristic[characteristicID]) {
              groupedByCharacteristic[characteristicID] = [];
            }
            groupedByCharacteristic[characteristicID].push(mappedItem);
          });

          // Set displayed characteristics
          const displayedChars = Array.from(characteristicsMap.values());
          setDisplayedCharacteristics(displayedChars);

          // Store initial inspection data for dirty tracking (deep copy) BEFORE setting state
          initialInspectionDataRef.current = JSON.parse(JSON.stringify(groupedByCharacteristic));

          // Set inspection data
          setInspectionData(groupedByCharacteristic);

          // Mark initial load as complete after state is set
          setTimeout(() => {
            setIsInitialLoad(false);
            // Reset dirty state after initial load to ensure clean state
            if (onDirtyChange) onDirtyChange(false);
          }, 0);


          // Set the first characteristic as selected (or use initialData.characteristic if provided)
          const firstCharID = displayedChars.length > 0 ? displayedChars[0].value : "";
          const selectedChar = initialData.characteristic || initialData.characteristic_name || firstCharID;

          if (selectedChar) {
            setSelectedCharacteristic(String(selectedChar));

            // Expand the first characteristic
            const firstChar = displayedChars.find((c) => String(c.value).trim() === String(selectedChar).trim()) || displayedChars[0];
            if (firstChar) {
              setExpandedCharacteristic(String(firstChar.value).trim());
              setExpandedCategories(new Set([firstChar.label]));
            }
          }
        } else {
          // No details found, just set basic values
          const compositeValue = itemTypeValue ? `${fgRmItemID}|${itemTypeValue.toUpperCase()}` : String(numericID || fgRmItemID || itemCodeString || "");
          setItemCode(compositeValue);
          setItemType(itemTypeValue);
          setSelectedCharacteristic(initialData.characteristic || initialData.characteristic_name || "");
          // Clear API item data if no details found
          setApiItemData(null);
          // Store empty initial data for dirty tracking
          initialInspectionDataRef.current = {};

          // Mark initial load as complete
          setTimeout(() => {
            setIsInitialLoad(false);
            // Reset dirty state after initial load to ensure clean state
            if (onDirtyChange) onDirtyChange(false);
          }, 0);
        }
      };

      // Only load if characteristics are loaded
      if (characteristicOptions.length > 0) {
        loadInspectionDetails();
      }
    }, [initialData, characteristicOptions, detailsLoaded, onDirtyChange]);

    // Toggle category expansion (allows multiple categories to be expanded simultaneously)
    const toggleCategory = useCallback((category, characteristicValue) => {
      const characteristicKey = String(characteristicValue || "").trim();
      setExpandedCategories((prev) => {
        const next = new Set(prev);
        if (next.has(category)) {
          next.delete(category);
        } else {
          next.add(category);
          // Set this as the active expanded characteristic for any auto-scroll or highlighting logic
          setExpandedCharacteristic(characteristicKey);
        }
        return next;
      });
    }, []);

    // Handle add new inspection entry - add under the currently expanded characteristic
    const handleAddInspection = useCallback(() => {
      if (!selectedCharacteristic) {
        showToast("Please select an Inspection Method first", ERROR_STATUS.toLowerCase());
        return;
      }

      // Find the DisplayText (label) from characteristicOptions based on selectedCharacteristic (ValueText)
      const selectedOption = characteristicOptions.find((opt) => {
        const optValue = String(opt.value || "").trim();
        const selectedValue = String(selectedCharacteristic).trim();
        // Try exact match first
        if (optValue === selectedValue) return true;
        // Try numeric comparison
        if (!isNaN(Number(optValue)) && !isNaN(Number(selectedValue))) {
          return Number(optValue) === Number(selectedValue);
        }
        return false;
      });

      // Use DisplayText (label) as category, fallback to selectedCharacteristic if not found
      const categoryDisplayText = selectedOption?.label || selectedCharacteristic;
      const characteristicKey = String(selectedCharacteristic).trim();

      // Get existing items for this category
      const existingItemsForCategory = (inspectionData[characteristicKey] || []).filter(
        (item) => String(item.category || "").trim() === String(categoryDisplayText).trim()
      );

      // Get the sortSeq for this characteristic (use the first item's sortSeq if it exists, otherwise use the characteristic index)
      const characteristicIndex = displayedCharacteristics.findIndex(
        (char) => String(char.value).trim() === characteristicKey
      );
      const characteristicSortSeq = existingItemsForCategory[0]?.sortSeq || (characteristicIndex >= 0 ? characteristicIndex + 1 : 1);

      // Calculate the next subSortSeq (should be sequential: 1, 2, 3, etc.)
      const maxSubSortSeq = existingItemsForCategory.length > 0
        ? Math.max(...existingItemsForCategory.map((item) => item.subSortSeq || 0))
        : 0;
      const nextSubSortSeq = maxSubSortSeq + 1;

      const newEntry = {
        id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique temporary ID
        category: categoryDisplayText, // Use DisplayText instead of ValueText
        characteristicName: "",
        sortSeq: characteristicSortSeq, // Use the characteristic's sortSeq
        subSortSeq: nextSubSortSeq, // Sequential subSortSeq (1, 2, 3, etc.)
        value: "",
        minReading: "",
        maxReading: "",
        preparedBy: getPreparedBy(),
        preparedDate: today,
        updatedBy: "",
        updatedDate: "",
        isCategory: false,
        parentId: null,
        is_video_uploaded: "N",
      };

      // Add new entry to the data for this characteristic
      setInspectionData((prev) => ({
        ...prev,
        [characteristicKey]: [...(prev[characteristicKey] || []), newEntry],
      }));

      // Ensure the category is expanded after adding a new entry
      setExpandedCategories((prev) => {
        const next = new Set(prev);
        next.add(categoryDisplayText);
        return next;
      });

      // Ensure the characteristic is marked as expanded
      setExpandedCharacteristic(String(selectedCharacteristic).trim());
    }, [selectedCharacteristic, inspectionData, characteristicOptions, displayedCharacteristics, showToast]);

    // Perform actual deletion of inspection row
    const performDeleteRow = useCallback((rowId, characteristicValue) => {
      const characteristicKey = String(characteristicValue || "").trim();
      const wasSelected = selectedCharacteristic && String(selectedCharacteristic).trim() === characteristicKey;
      const wasExpanded = expandedCharacteristic === characteristicKey;

      // Find the characteristic info before deletion
      const charToRemove = displayedCharacteristics.find((char) => String(char.value).trim() === characteristicKey);
      const charLabel = charToRemove?.label;
      const characteristicDisplayText = charLabel || "";

      const originalChars = [...displayedCharacteristics];
      const deletedIndex = originalChars.findIndex(
        (char) => String(char.value).trim() === characteristicKey
      );

      // If the video was already deleted via the modal, is_video_uploaded will already be "N"
      const currentRowsForKey = inspectionData[characteristicKey] || [];
      const rowToDeleteCurrent = currentRowsForKey.find(
        (item) => item && String(item.id) === String(rowId)
      );
      if (rowToDeleteCurrent) {
        const inspId = rowToDeleteCurrent.inspectionID || rowToDeleteCurrent.inspection_id || 0;
        const hasVideo = String(rowToDeleteCurrent.is_video_uploaded).toUpperCase() === "Y";
        if (inspId && hasVideo) {
          // Dedup — don't push the same inspectionID twice
          const alreadyTracked = videosToDeleteRef.current.some(v => v.inspectionID === Number(inspId));
          if (!alreadyTracked) {
            const cleanCode = itemMultiOptions?.find(opt => String(opt.value) === String(itemCode))?.label || (typeof itemCode === 'string' ? itemCode.split('|')[0] : itemCode) || "";
            videosToDeleteRef.current.push({
              inspectionID: Number(inspId),
              itemCode: cleanCode,
              fileName: rowToDeleteCurrent.fileName || rowToDeleteCurrent.FileName || "",
            });
            console.log("Tracked video for deletion after save:", inspId, cleanCode, rowToDeleteCurrent.fileName || rowToDeleteCurrent.FileName);
          }
        }
      }

      // Update inspectionData and determine if characteristic becomes empty
      setInspectionData((prev) => {
        const updatedData = { ...prev };
        let becomesEmpty = false;

        if (updatedData[characteristicKey] && Array.isArray(updatedData[characteristicKey])) {
          const rowIdStr = String(rowId);
          const beforeLength = updatedData[characteristicKey].length;
          updatedData[characteristicKey] = updatedData[characteristicKey].filter(
            (item) => {
              if (!item || item.id == null) return true; // Keep items without valid id
              const itemIdStr = String(item.id);
              return itemIdStr !== rowIdStr;
            }
          );
          const afterLength = updatedData[characteristicKey].length;

          if (beforeLength - afterLength > 1) {
            console.warn(`Unexpected: Deleted ${beforeLength - afterLength} rows instead of 1. RowId: ${rowId}, Characteristic: ${characteristicKey}`);
          }

          // Check if characteristic becomes empty after filtering by category (same as rendering logic)
          const characteristicItems = updatedData[characteristicKey].filter(
            (item) => String(item.category || "").trim() === String(characteristicDisplayText).trim()
          );

          // If this characteristic has no more records (after filtering by category), remove it completely
          if (characteristicItems.length === 0) {
            becomesEmpty = true;
            // Remove from inspectionData
            delete updatedData[characteristicKey];
          }
        } else {
          // If characteristic doesn't exist in inspectionData, it's already empty
          becomesEmpty = true;
        }

        // If the characteristic becomes empty, prepare data for removal and auto-selection
        if (becomesEmpty) {
          // Calculate remaining characteristics after removal
          const remainingChars = originalChars.filter((char) => String(char.value).trim() !== characteristicKey);

          // Filter to only characteristics that still have data (same logic as table rendering)
          const charsWithData = remainingChars.filter((char) => {
            const key = String(char.value).trim();
            const items = (updatedData[key] || []).filter(
              (item) => String(item.category || "").trim() === String(char.label).trim()
            );
            return items.length > 0;
          });

          // Find the previous characteristic to select (if needed)
          let charToSelect = null;
          if (wasSelected && charsWithData.length > 0) {
            // Try to find the previous characteristic from the original list
            if (deletedIndex > 0) {
              // Look backwards from the deleted characteristic
              for (let i = deletedIndex - 1; i >= 0; i--) {
                const prevChar = originalChars[i];
                // Check if this previous characteristic still has data
                const found = charsWithData.find(
                  (char) => String(char.value).trim() === String(prevChar.value).trim()
                );
                if (found) {
                  charToSelect = found;
                  break;
                }
              }
            }

            // If no previous characteristic found, select the first one with data
            if (!charToSelect && charsWithData.length > 0) {
              charToSelect = charsWithData[0];
            }
          }


          setTimeout(() => {
            // Update displayedCharacteristics
            setDisplayedCharacteristics(() => remainingChars);

            // If this was the currently selected characteristic, auto-select the previous one
            if (wasSelected) {
              if (charToSelect) {
                setSelectedCharacteristic(String(charToSelect.value).trim());
                setExpandedCharacteristic(String(charToSelect.value).trim());
                setExpandedCategories(new Set([charToSelect.label]));
              } else {
                // No characteristics with data remaining, clear selection
                setSelectedCharacteristic("");
                setExpandedCharacteristic(null);
                setExpandedCategories(new Set());
              }
            } else if (wasExpanded) {
              // If it was expanded but not selected, just clear the expanded state
              setExpandedCharacteristic(null);
              setExpandedCategories((prev) => {
                const next = new Set(prev);
                if (charLabel) {
                  next.delete(charLabel);
                }
                return next;
              });
            }
          }, 10);
        }

        return updatedData;
      });
    }, [expandedCharacteristic, selectedCharacteristic, displayedCharacteristics, inspectionData, itemCode, itemMultiOptions]);

    // Show confirmation dialog before deleting inspection row
    const handleDeleteRow = useCallback((rowId, characteristicValue) => {
      const characteristicKey = String(characteristicValue || "").trim();
      // Use functional update to get the latest inspectionData
      setInspectionData((prev) => {
        const characteristicData = prev[characteristicKey] || [];
        const inspection = characteristicData.find((item) => {
          // Compare IDs as strings to handle type mismatches
          return String(item.id) === String(rowId);
        });
        if (inspection) {
          setInspectionToDelete({
            id: rowId,
            characteristicName: inspection.characteristicName || "this inspection",
            characteristicValue: characteristicKey,
          });
          setShowDeleteConfirm(true);
        }
        return prev; // Don't modify data here, just check
      });
    }, []);

    const confirmDeleteRow = useCallback(() => {
      if (
        inspectionToDelete?.id === undefined ||
        inspectionToDelete.id === null
      ) {
        return;
      }
      performDeleteRow(inspectionToDelete.id, inspectionToDelete.characteristicValue);
      setShowDeleteConfirm(false);
      setInspectionToDelete(null);
    }, [inspectionToDelete, performDeleteRow]);

    const cancelDeleteRow = useCallback(() => {
      setShowDeleteConfirm(false);
      setInspectionToDelete(null);
    }, []);

    // Handle enable add new characteristic mode
    const handleEnableAddNew = useCallback(() => {
      setPreviousSelectedCharacteristic(selectedCharacteristic);
      setIsAddingNewCharacteristic(true);
      setSelectedCharacteristic(""); // Clear selection to show placeholder
      setNewCharacteristicInput(""); // Clear input
      setCharacteristicInputResetKey((k) => k + 1); // Force-clear react-select internal search text
      // Focus the dropdown after a short delay to ensure it's rendered
      setTimeout(() => {
        if (characteristicSelectRef.current) {
          const input = characteristicSelectRef.current.querySelector('input[id*="react-select"]') ||
            characteristicSelectRef.current.querySelector('input[type="text"]') ||
            characteristicSelectRef.current.querySelector('input');
          if (input) {
            input.focus();
            input.click(); // Also click to open the menu if needed
          }
        }
      }, 150);
    }, [selectedCharacteristic]);

    const handleCharacteristicInputChange = useCallback((e, meta) => {
      const value = e?.target?.value ?? "";
      const trimmedValue = String(value).trim();
      const action = meta?.action;

      if (isEditingCharacteristic) {
        // In edit mode: update the editing name
        setEditingCharacteristicName(trimmedValue);
        return;
      }

      const isUserTyping = action === "input-change";

      if (isAddingNewCharacteristic) {
        let existingOption = null;

        if (!isUserTyping && trimmedValue) {
          if (action === "select-option") {
            existingOption = characteristicOptions.find(
              (opt) => {
                const optValue = String(opt.value || "").trim();
                return optValue === trimmedValue;
              }
            );
          }

          // Case-insensitive label match
          if (!existingOption) {
            existingOption = characteristicOptions.find(
              (opt) => {
                const optLabel = String(opt.label || "").trim();
                return optLabel.toLowerCase() === trimmedValue.toLowerCase();
              }
            );
          }
        }

        if (existingOption) {
          setIsAddingNewCharacteristic(false);
          setNewCharacteristicInput("");
          const selectedValue = String(existingOption.value);
          setSelectedCharacteristic(selectedValue);
        } else {
          setNewCharacteristicInput(trimmedValue);
        }
      } else {
        let existingOption = null;


        if (!isUserTyping && trimmedValue) {
          if (action === "select-option") {
            existingOption = characteristicOptions.find(
              (opt) => {
                const optValue = String(opt.value || "").trim();
                return optValue === trimmedValue;
              }
            );
          }

          // Case-insensitive label match for explicit selections
          if (!existingOption) {
            existingOption = characteristicOptions.find(
              (opt) => {
                const optLabel = String(opt.label || "").trim();
                return optLabel.toLowerCase() === trimmedValue.toLowerCase();
              }
            );
          }
        }

        if (existingOption) {
          const selectedValue = String(existingOption.value);
          if (selectedCharacteristic !== selectedValue) {
            setSelectedCharacteristic(selectedValue);
          }
        } else if (!trimmedValue && !isUserTyping) {
          // Only clear selection on explicit clear, not while typing
          if (selectedCharacteristic) {
            setSelectedCharacteristic("");
          }
        }
      }
    }, [isAddingNewCharacteristic, isEditingCharacteristic, characteristicOptions, selectedCharacteristic]);

    // Handle save new characteristic master
    const handleSaveNewCharacteristic = useCallback(async () => {
      const trimmedName = newCharacteristicInput.trim();

      if (!trimmedName) {
        showToast("Please enter a characteristic name", ERROR_STATUS.toLowerCase());
        return;
      }

      // Check if characteristic already exists
      const exists = characteristicOptions.some(
        (opt) => opt.label?.toLowerCase() === trimmedName.toLowerCase()
      );

      if (exists) {
        showToast("This inspection method already exists", ERROR_STATUS.toLowerCase());
        return;
      }

      setIsSavingCharacteristic(true);

      try {
        // Prepare API payload
        const payload = [
          {
            characteristicID: 0, // 0 for new characteristic
            characteristicName: trimmedName,
          }
        ];

        // Call API to save new characteristic master
        const response = await saveAndUpdateCharacteristicMaster(payload);

        // Check response status
        if (response?.Status === SUCCESS_STATUS || response?.message === MESSAGE_OK) {
          const responseMessage = response?.data?.CHARACTERISTICS_MASTER_RESPONSE?.[0]?.Message ||
            "Characteristic Master saved successfully";

          // Refresh characteristic options from API
          try {
            const updatedOptions = await getCharacteristicMasterOptions();
            setCharacteristics(updatedOptions);

            // Find the newly added characteristic in the updated list
            const newCharacteristic = updatedOptions.find(
              (opt) => opt.DisplayText?.toLowerCase() === trimmedName.toLowerCase()
            );

            if (newCharacteristic) {
              const newValue = String(newCharacteristic.ValueText);
              // Update both current and base so it's not considered dirty
              setSelectedCharacteristic(newValue);
              setBaseCharacteristic(newValue);
            }
          } catch (refreshError) {
            console.error("Error refreshing characteristics:", refreshError);
          }

          // Reset add mode
          setIsAddingNewCharacteristic(false);
          setNewCharacteristicInput("");

          showToast(responseMessage, SUCCESS_STATUS);
        } else {
          // Handle API error response
          const errorMessage = response?.data?.CHARACTERISTICS_MASTER_RESPONSE?.[0]?.Message ||
            response?.message ||
            "Failed to save Characteristic Master";
          showToast(errorMessage, ERROR_STATUS.toLowerCase());
        }
      } catch (error) {
        console.error("Error adding characteristic master:", error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          const errorMessage = error?.response?.data?.message ||
            error?.message ||
            "Failed to add Characteristic Master";
          showToast(errorMessage, ERROR_STATUS.toLowerCase());
        }
      } finally {
        setIsSavingCharacteristic(false);
      }
    }, [newCharacteristicInput, characteristicOptions, showToast]);

    // Handle edit click from dropdown option - for inline editing in dropdown
    const handleEditClickFromDropdown = useCallback(async (optionData) => {

      if (!optionData || !optionData.value) {
        showToast("Invalid characteristic data", ERROR_STATUS.toLowerCase());
        return;
      }

      const optionValue = String(optionData.value || "").trim();
      const newName = String(optionData.label || "").trim();

      if (!newName) {
        showToast("Please enter a characteristic name", ERROR_STATUS.toLowerCase());
        return;
      }

      // Find the original characteristic object to get the ID
      const originalChar = characteristics.find((char) => {
        const charValue = getOptValue(char);
        return String(charValue).trim() === optionValue;
      });

      if (!originalChar) {
        showToast("Characteristic data not found", ERROR_STATUS.toLowerCase());
        return;
      }

      // Get the characteristic ID (ValueText)
      const charId = getOptValue(originalChar);

      // Check if name already exists (excluding the current one)
      const exists = characteristicOptions.some(
        (opt) => {
          const optValue = String(opt.value || "").trim();
          // Skip if it's the same characteristic
          if (optValue === optionValue) return false;
          // Check if name matches
          return opt.label?.toLowerCase() === newName.toLowerCase();
        }
      );

      if (exists) {
        showToast("This inspection method already exists", ERROR_STATUS.toLowerCase());
        throw new Error("Duplicate name");
      }

      setIsSavingCharacteristic(true);

      try {
        const characteristicID = isNaN(Number(charId))
          ? charId
          : Number(charId);

        // Prepare API payload
        const payload = [
          {
            characteristicID: characteristicID, // Use the existing ID for update
            characteristicName: newName,
          }
        ];

        // Call API to update characteristic master
        const response = await saveAndUpdateCharacteristicMaster(payload);

        // Check response status
        if (response?.Status === SUCCESS_STATUS || response?.message === MESSAGE_OK) {
          const responseMessage = response?.data?.CHARACTERISTICS_MASTER_RESPONSE?.[0]?.Message ||
            "Characteristic Master updated successfully";

          // Refresh characteristic options from API
          try {
            const updatedOptions = await getCharacteristicMasterOptions();
            setCharacteristics(updatedOptions);

            // Find the updated characteristic in the new list
            const updatedChar = updatedOptions.find(
              (opt) => {
                const optValue = getOptValue(opt);
                return String(optValue).trim() === optionValue;
              }
            );

            if (updatedChar) {
              const updatedCharValue = getOptValue(updatedChar);
              const updatedCharLabel = getOptLabel(updatedChar);
              const characteristicKey = String(optionValue).trim();

              // Update displayed characteristics with new label
              setDisplayedCharacteristics((prev) => {
                return prev.map((char) => {
                  if (String(char.value).trim() === characteristicKey) {
                    return {
                      ...char,
                      label: updatedCharLabel,
                      value: String(updatedCharValue), // Update value in case it changed
                    };
                  }
                  return char;
                });
              });


              setInspectionData((prev) => {
                const updatedData = { ...prev };

                if (updatedData[characteristicKey] && Array.isArray(updatedData[characteristicKey])) {
                  updatedData[characteristicKey] = updatedData[characteristicKey].map((item) => ({
                    ...item,
                    category: updatedCharLabel, // Update category to new label
                  }));
                }

                return updatedData;
              });



              // Update base characteristic so it's not considered dirty
              setBaseCharacteristic(String(updatedCharValue));

              // Update initialInspectionDataRef baseline for data rows to prevent it being marked dirty due to label change
              if (initialInspectionDataRef.current) {
                const characteristicKey = String(optionValue).trim();
                const initialDataForChar = initialInspectionDataRef.current[characteristicKey];
                if (initialDataForChar && Array.isArray(initialDataForChar)) {
                  initialInspectionDataRef.current[characteristicKey] = initialDataForChar.map(item => ({
                    ...item,
                    category: updatedCharLabel
                  }));
                }
              }
            }
          } catch (refreshError) {
            console.error("Error refreshing characteristics:", refreshError);
            // Still show success even if refresh fails
          }


          if (isAddingNewCharacteristic) {
            setNewCharacteristicInput("");
          }

          showToast(responseMessage, SUCCESS_STATUS.toLowerCase());
        } else {
          // Handle API error response
          const errorMessage = response?.data?.CHARACTERISTICS_MASTER_RESPONSE?.[0]?.Message ||
            response?.message ||
            "Failed to update Characteristic Master";
          showToast(errorMessage, ERROR_STATUS.toLowerCase());
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("Error updating characteristic master:", error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else if (!error.message || error.message !== "Duplicate name") {
          const errorMessage = error?.response?.data?.message ||
            error?.message ||
            "Failed to update Characteristic Master";
          showToast(errorMessage, ERROR_STATUS.toLowerCase());
        }
        throw error; // Re-throw to prevent closing edit mode
      } finally {
        setIsSavingCharacteristic(false);
      }
    }, [characteristics, characteristicOptions, getOptValue, getOptLabel, showToast, isAddingNewCharacteristic]);


    // Handle save edited characteristic master
    const handleSaveEditCharacteristic = useCallback(async () => {
      const trimmedName = editingCharacteristicName.trim();

      if (!trimmedName) {
        showToast("Please enter a characteristic name", ERROR_STATUS.toLowerCase());
        return;
      }

      if (!editingCharacteristicId) {
        showToast("Characteristic ID not found", ERROR_STATUS.toLowerCase());
        return;
      }

      // Check if characteristic name already exists (excluding the current one)
      const exists = characteristicOptions.some(
        (opt) => {
          const optValue = String(opt.value || "").trim();
          const editingValue = String(editingCharacteristicId).trim();
          // Skip if it's the same characteristic
          if (optValue === editingValue) return false;
          // Check if name matches
          return opt.label?.toLowerCase() === trimmedName.toLowerCase();
        }
      );

      if (exists) {
        showToast("This inspection method already exists", ERROR_STATUS.toLowerCase());
        return;
      }

      setIsSavingCharacteristic(true);

      try {
        // Convert characteristicID to number (ValueText might be string)
        const characteristicID = isNaN(Number(editingCharacteristicId))
          ? editingCharacteristicId
          : Number(editingCharacteristicId);

        // Prepare API payload
        const payload = [
          {
            characteristicID: characteristicID, // Use the existing ID for update
            characteristicName: trimmedName,
          }
        ];

        // Call API to update characteristic master
        const response = await saveAndUpdateCharacteristicMaster(payload);

        // Check response status
        if (response?.Status === SUCCESS_STATUS || response?.message === MESSAGE_OK) {
          const responseMessage = response?.data?.CHARACTERISTICS_MASTER_RESPONSE?.[0]?.Message ||
            "Characteristic Master updated successfully";

          // Refresh characteristic options from API
          try {
            const updatedOptions = await getCharacteristicMasterOptions();
            setCharacteristics(updatedOptions);

            // Find the updated characteristic in the updated list
            const updatedCharacteristic = updatedOptions.find(
              (opt) => {
                const optValue = getOptValue(opt);
                return String(optValue).trim() === String(editingCharacteristicId).trim();
              }
            );

            if (updatedCharacteristic) {
              // Update the selected characteristic (keep the same ID)
              setSelectedCharacteristic(String(editingCharacteristicId));

              // Update displayed characteristics if needed
              setDisplayedCharacteristics((prev) => {
                return prev.map((char) => {
                  if (String(char.value).trim() === String(editingCharacteristicId).trim()) {
                    return {
                      ...char,
                      label: getOptLabel(updatedCharacteristic),
                    };
                  }
                  return char;
                });
              });

              // Update base characteristic so it's not considered dirty
              setBaseCharacteristic(String(editingCharacteristicId));

              // Update initialInspectionDataRef baseline for data rows to prevent it being marked dirty due to label change
              if (initialInspectionDataRef.current) {
                const charKey = String(editingCharacteristicId).trim();
                const initialDataForChar = initialInspectionDataRef.current[charKey];
                if (initialDataForChar && Array.isArray(initialDataForChar)) {
                  const updatedLabel = getOptLabel(updatedCharacteristic);
                  initialInspectionDataRef.current[charKey] = initialDataForChar.map(item => ({
                    ...item,
                    category: updatedLabel
                  }));
                }
              }
            }
          } catch (refreshError) {
            console.error("Error refreshing characteristics:", refreshError);
          }

          // Reset edit mode
          setIsEditingCharacteristic(false);
          setEditingCharacteristicId(null);
          setEditingCharacteristicName("");

          showToast(responseMessage, SUCCESS_STATUS.toLowerCase());
        } else {
          // Handle API error response
          const errorMessage = response?.data?.CHARACTERISTICS_MASTER_RESPONSE?.[0]?.Message ||
            response?.message ||
            "Failed to update Characteristic Master";
          showToast(errorMessage, ERROR_STATUS.toLowerCase());
        }
      } catch (error) {
        console.error("Error updating characteristic master:", error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          const errorMessage = error?.response?.data?.message ||
            error?.message ||
            "Failed to update Characteristic Master";
          showToast(errorMessage, ERROR_STATUS.toLowerCase());
        }
      } finally {
        setIsSavingCharacteristic(false);
      }
    }, [editingCharacteristicName, editingCharacteristicId, characteristicOptions, showToast, getOptValue, getOptLabel]);

    // Validate field
    const validateField = useCallback((itemId, field, value) => {
      const errors = { ...fieldErrors };
      if (!errors[itemId]) errors[itemId] = {};

      // Required field validation
      if (field === "characteristicName") {
        if (!value || String(value).trim() === "") {
          errors[itemId][field] = "Required*";
        } else {
          delete errors[itemId][field];
        }
      }

      if (field === "subSortSeq") {
        if (value === null || value === undefined || value === "") {
          errors[itemId][field] = "Required*";
        } else if (Number(value) === 0) {
          errors[itemId][field] = "Sort sequence should be greater than zero";
        } else {
          delete errors[itemId][field];
        }
      }

      if (field === "minReading") {
        if (value !== null && value !== "" && !isNaN(Number(value)) && Number(value) < 0) {
          errors[itemId][field] = "Min Reading cannot be negative";
        } else {
          delete errors[itemId][field];
        }
      }

      if (field === "maxReading") {
        if (value !== null && value !== "" && !isNaN(Number(value)) && Number(value) < 0) {
          errors[itemId][field] = "Max Reading cannot be negative";
        } else {
          delete errors[itemId][field];
        }
      }

      // Clean up empty error objects
      if (Object.keys(errors[itemId]).length === 0) {
        delete errors[itemId];
      }

      setFieldErrors(errors);
    }, [fieldErrors]);

    // Handle field change in edit mode
    const handleFieldChange = useCallback((rowId, field, value, characteristicValue) => {
      const characteristicKey = String(characteristicValue || "").trim();
      setInspectionData((prev) => {
        const updatedData = { ...prev };
        if (updatedData[characteristicKey]) {
          updatedData[characteristicKey] = updatedData[characteristicKey].map((item) =>
            item.id === rowId ? { ...item, [field]: value } : item
          );
        }
        return updatedData;
      });

      // Clear validation error for this field when user starts typing
      setFieldErrors((prev) => {
        const updated = { ...prev };
        if (updated[rowId]) {
          const itemErrors = { ...updated[rowId] };
          delete itemErrors[field];
          if (Object.keys(itemErrors).length === 0) {
            delete updated[rowId];
          } else {
            updated[rowId] = itemErrors;
          }
        }
        return updated;
      });
    }, []);

    // Handle save
    const handleSave = useCallback(async () => {
      if (!itemCode) {
        showToast("Please select an Item Code", ERROR_STATUS.toLowerCase());
        return;
      }

      if (!itemType) {
        showToast("Item type is required", ERROR_STATUS.toLowerCase());
        return;
      }

      // Validate inspection data (check all characteristics)
      const allInspectionItems = Object.values(inspectionData).flat();

      if (allInspectionItems.length === 0) {
        showToast("Please add atleast one inspection method", ERROR_STATUS.toLowerCase());
        return;
      }

      // Validate all fields and collect errors
      const errors = {};
      let hasValidationErrors = false;
      const categoriesToExpand = new Set(expandedCategories);
      let expansionNeeded = false;
      let partialEntryError = false;
      let minMaxReadingError = false;

      allInspectionItems.forEach((item) => {
        const itemErrors = {};

        // Validate Characteristic Name (Inspection Method & Parameters) - required
        if (!item.characteristicName || item.characteristicName.trim() === "") {
          itemErrors.characteristicName = "Required*";
          hasValidationErrors = true;

          // Add the category (characteristic label) to expansion set if it's not already expanded
          if (item.category && !expandedCategories.has(item.category)) {
            categoriesToExpand.add(item.category);
            expansionNeeded = true;
          }
        }

        // Validate Sub Sort Seq
        if (item.subSortSeq === null || item.subSortSeq === undefined || item.subSortSeq === "") {
          itemErrors.subSortSeq = "Required*";
          hasValidationErrors = true;
          if (item.category && !expandedCategories.has(item.category)) {
            categoriesToExpand.add(item.category);
            expansionNeeded = true;
          }
        } else if (Number(item.subSortSeq) === 0) {
          itemErrors.subSortSeq = "Sort sequence should be greater than zero";
          hasValidationErrors = true;
          if (item.category && !expandedCategories.has(item.category)) {
            categoriesToExpand.add(item.category);
            expansionNeeded = true;
          }
        }

        // Partial Entry Validation
        const hasMin = item.minReading != null && String(item.minReading).trim() !== "";
        const hasMax = item.maxReading != null && String(item.maxReading).trim() !== "";
        const hasValue = item.value != null && String(item.value).trim() !== "";

        const isPartialMinMax = (hasMin || hasMax) && !(hasMin && hasMax);
        const isEmptyRow = !hasMin && !hasMax && !hasValue;
        const isNameProvided = !!(item.characteristicName && item.characteristicName.trim() !== "");

        if (isPartialMinMax || isEmptyRow) {
          if (isNameProvided) partialEntryError = true;
          hasValidationErrors = true;

          // if (isPartialMinMax) {
          //   if (!hasMin) itemErrors.minReading = "Required*";
          //   if (!hasMax) itemErrors.maxReading = "Required*";
          // } else {
          //   itemErrors.value = "Required*";
          //   itemErrors.minReading = "Required*";
          //   itemErrors.maxReading = "Required*";
          // }

          if (item.category && !expandedCategories.has(item.category)) {
            categoriesToExpand.add(item.category);
            expansionNeeded = true;
          }
        }

        // Validate Min Reading >= 0 (if provided and not empty)
        if (item.minReading != null && String(item.minReading).trim() !== "") {
          const minVal = Number(item.minReading);
          if (!isNaN(minVal) && minVal < 0) {
            itemErrors.minReading = "Min Reading cannot be negative";
            hasValidationErrors = true;

            if (item.category && !expandedCategories.has(item.category)) {
              categoriesToExpand.add(item.category);
              expansionNeeded = true;
            }
          }
        }

        // Validate Max Reading >= 0 (if provided and not empty)
        if (item.maxReading != null && String(item.maxReading).trim() !== "") {
          const maxVal = Number(item.maxReading);
          if (!isNaN(maxVal) && maxVal < 0) {
            itemErrors.maxReading = "Max Reading cannot be negative";
            hasValidationErrors = true;

            if (item.category && !expandedCategories.has(item.category)) {
              categoriesToExpand.add(item.category);
              expansionNeeded = true;
            }
          }
        }

        // Min <= Max Reading Validation
        const minNum = Number(item.minReading);
        const maxNum = Number(item.maxReading);
        if (item.minReading !== "" && item.maxReading !== "" && item.minReading != null && item.maxReading != null && !isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
          if (isNameProvided) minMaxReadingError = true;
          // No field-level errors set here to avoid red border as requested
          hasValidationErrors = true;

          if (item.category && !expandedCategories.has(item.category)) {
            categoriesToExpand.add(item.category);
            expansionNeeded = true;
          }
        }

        if (Object.keys(itemErrors).length > 0) {
          errors[item.id] = { ...(errors[item.id] || {}), ...itemErrors };
        }
      });

      if (hasValidationErrors) {
        setFieldErrors(errors);
        if (expansionNeeded) {
          setExpandedCategories(categoriesToExpand);
        }

        if (partialEntryError) {
          if (showToast) showToast("Either Enter Both Expected Min And Max Readings OR Enter Expected Result. Partial Entry Is Not Allowed!!!", ERROR_STATUS.toLowerCase());
        } else if (minMaxReadingError) {
          if (showToast) showToast("Expected Minimum Reading Must Be Less Than Or Equal To Expected Maximum Reading!!!", ERROR_STATUS.toLowerCase());
        } else {
          // General validation toast
          // if (showToast) showToast("Please correct validation errors", ERROR_STATUS.toLowerCase());
        }
        return;
      }

      // Clear any previous errors if validation passes
      setFieldErrors({});

      setSubmitting(true);

      try {
        // Convert itemCode to number (fgRmItemID)
        let fgRmItemID = 0;
        if (String(itemCode).includes("|")) {
          fgRmItemID = Number(itemCode.split("|")[0]);
        } else {
          fgRmItemID = isNaN(Number(itemCode)) ? 0 : Number(itemCode);
        }

        if (fgRmItemID === 0) {
          showToast("Invalid Item Code", ERROR_STATUS.toLowerCase());
          setSubmitting(false);
          return;
        }

        // Map all inspection items to API payload format
        const payload = allInspectionItems.map((item) => {

          let characteristicID = 0;
          if (item.category) {
            // Find the characteristic in displayedCharacteristics by label
            const char = displayedCharacteristics.find(
              (c) => String(c.label).trim() === String(item.category).trim()
            );
            if (char) {
              characteristicID = isNaN(Number(char.value)) ? 0 : Number(char.value);
            }
          }

          // Fallback to selectedCharacteristic if not found
          if (characteristicID === 0) {
            characteristicID = isNaN(Number(selectedCharacteristic)) ? 0 : Number(selectedCharacteristic);
          }


          const isNewRecord = String(item.id || "").startsWith("new_");
          const inspectionID = isNewRecord ? 0 : (item.inspectionID || item.inspection_id || 0);

          // Convert sortSeq and subSortSeq to numbers
          const characteristicSortSequence = item.sortSeq != null ? Number(item.sortSeq) : 0;
          const subSortSequence = item.subSortSeq != null ? Number(item.subSortSeq) : 0;

          // Convert min/max readings to numbers (default to 0 if empty)
          const expectedMinimumReading = item.minReading != null && item.minReading !== "" && !isNaN(Number(item.minReading))
            ? Number(item.minReading)
            : 0;
          const expectedMaximumReading = item.maxReading != null && item.maxReading !== "" && !isNaN(Number(item.maxReading))
            ? Number(item.maxReading)
            : 0;

          // Get current logged-in user
          const currentUser = getPreparedBy();

          const preparedByValue = isNewRecord
            ? currentUser
            : ((item.preparedBy || "").trim() || currentUser);
          const updatedByValue = currentUser; // Always set updatedBy to current user when saving

          return {
            pageSize: 0,
            pageNumber: 0,
            inspectionID: inspectionID,
            fgRmItemID: fgRmItemID,
            itemType: itemType.toUpperCase(), // Ensure FG or RM
            characteristicID: characteristicID,
            characteristicSortSequence: characteristicSortSequence,
            subCharacteristicName: (item.characteristicName || "").trim(),
            subSortSequence: subSortSequence,
            expectedResult: (item.value || "").trim(),
            expectedMinimumReading: expectedMinimumReading,
            expectedMaximumReading: expectedMaximumReading,
            preparedBy: preparedByValue,
            updatedBy: updatedByValue,
            instrumentName: (item.requiredJigs || "").trim(),
            paramType: "ADD",
          };
        });

        // Validate that all items have valid characteristicID
        const invalidItems = payload.filter((item) => item.characteristicID === 0);
        if (invalidItems.length > 0) {
          showToast("Some inspection records have invalid characteristics. Please check your data.", ERROR_STATUS.toLowerCase());
          setSubmitting(false);
          return;
        }

        // Call API to save/update inspection master
        const response = await saveAndUpdateInspectionMaster(payload);

        // Check response status - must be "Success" (not just message === "OK")
        const isSuccess = response?.Status === SUCCESS_STATUS;
        const isError = response?.Status === ERROR_STATUS.toLowerCase();

        if (isError) {
          // Handle validation errors from backend
          const errorMessage = response?.data?.INSPECTION_MASTER_RESPONSE?.[0]?.Message ||
            response?.message ||
            "Failed to save Inspection Master";

          showToast(errorMessage, ERROR_STATUS.toLowerCase());

          // If it's a partial entry error from API, expand the problematic rows
          if (errorMessage.includes("Partial Entry Is Not Allowed")) {
            const newErrors = {};
            const newCategoriesToExpand = new Set(expandedCategories);
            let anyExpansion = false;

            allInspectionItems.forEach((item) => {
              const hMin = item.minReading != null && String(item.minReading).trim() !== "";
              const hMax = item.maxReading != null && String(item.maxReading).trim() !== "";
              const hValue = item.value != null && String(item.value).trim() !== "";

              if (((hMin || hMax) && !(hMin && hMax)) || (!hMin && !hMax && !hValue)) {
                newErrors[item.id] = {
                  minReading: "Incomplete",
                  maxReading: "Incomplete",
                  value: "Incomplete"
                };
                if (item.category && !newCategoriesToExpand.has(item.category)) {
                  newCategoriesToExpand.add(item.category);
                  anyExpansion = true;
                }
              }
            });

            if (anyExpansion) {
              setFieldErrors((prev) => ({ ...prev, ...newErrors }));
              setExpandedCategories(newCategoriesToExpand);
            }
          }

          // If it's a min > max error from API, expand the problematic rows
          if (errorMessage.includes("Minimum Reading Must Be Less Than Or Equal To")) {
            const newCategoriesToExpand = new Set(expandedCategories);
            let anyExpansion = false;

            allInspectionItems.forEach((item) => {
              const curMin = Number(item.minReading);
              const curMax = Number(item.maxReading);
              if (item.minReading !== "" && item.maxReading !== "" && !isNaN(curMin) && !isNaN(curMax) && curMin > curMax) {
                if (item.category && !newCategoriesToExpand.has(item.category)) {
                  newCategoriesToExpand.add(item.category);
                  anyExpansion = true;
                }
              }
            });

            if (anyExpansion) {
              setExpandedCategories(newCategoriesToExpand);
            }
          }

          setSubmitting(false);
          return; // Don't proceed with success flow
        }

        // Check response status - only proceed if Status is "Success"
        if (isSuccess) {
          // Trigger deletions for tracked videos
          if (videosToDeleteRef.current && videosToDeleteRef.current.length > 0) {
            const deletions = videosToDeleteRef.current.map(async (v) => {
              try {
                const delRes = await viewOrDeleteInspectionVideoFiles({
                  inspectionID: v.inspectionID,
                  itemCode: v.itemCode,
                  fileName: v.fileName || "",
                  paramType: "Delete"
                });
                console.log("Post-save video delete result for inspectionID:", v.inspectionID, delRes);
              } catch (err) {
                console.error("Failed to delete video post-save for inspectionID:", v.inspectionID, err);
              }
            });
            // Clear ref immediately so we don't duplicate calls
            videosToDeleteRef.current = [];
            Promise.all(deletions);
          }

          const responseMessage = response?.data?.INSPECTION_MASTER_RESPONSE?.[0]?.Message ||
            "Inspection Master saved successfully";

          // Clear draft on successful save
          try {
            localStorage.removeItem(DRAFT_KEY);
          } catch (e) {
            console.error("Failed to clear draft on success", e);
          }

          showToast(responseMessage, SUCCESS_STATUS.toLowerCase());


          let itemIdNum = 0;
          if (String(itemCode).includes("|")) {
            itemIdNum = Number(itemCode.split("|")[0]);
          } else {
            itemIdNum = isNaN(Number(itemCode)) ? 0 : Number(itemCode);
          }

          // Fetch updated inspection master details after successful save
          if (itemIdNum > 0 && itemType) {
            try {
              const detailsResponse = await getInspectionMasterDetails({
                fgRmItemID: itemIdNum,
                itemType: itemType.toUpperCase(),
              });

              // Check response status
              if (detailsResponse?.Status === SUCCESS_STATUS || detailsResponse?.message === MESSAGE_OK) {
                const details = detailsResponse?.data?.INSPECTION_MASTER_DETAILS || [];

                if (Array.isArray(details) && details.length > 0) {
                  // Extract item data from the first item (all items have the same item_code, item_id, etc.)
                  const firstItem = details[0];
                  const apiItemCode = firstItem?.item_code || "";
                  const apiItemId = firstItem?.item_id || firstItem?.fg_rm_item_id || itemIdNum;
                  const apiItemDescription = firstItem?.item_description || firstItem?.description || "";
                  const apiItemType = firstItem?.item_type || itemType;

                  // Prepare complete saved data with API response
                  const savedData = {
                    itemCode: String(apiItemId),
                    item_code: apiItemCode || String(apiItemId),
                    item_id: apiItemId,
                    fg_rm_item_id: apiItemId,
                    inspection_id: apiItemId,
                    itemType: apiItemType,
                    item_type: apiItemType,
                    item_description: apiItemDescription,
                    characteristic: selectedCharacteristic,
                    characteristic_name: selectedCharacteristic,
                    inspectionData: allInspectionItems,
                    // Include the full details response for parent component
                    INSPECTION_MASTER_DETAILS: details,
                    _detailsResponse: details, // Store for potential reuse
                  };

                  if (onSuccess) {
                    onSuccess(savedData);
                  }
                } else {
                  // No details found, use fallback data
                  const savedData = {
                    itemCode: String(itemIdNum),
                    item_code: String(itemIdNum),
                    item_id: itemIdNum,
                    fg_rm_item_id: itemIdNum,
                    inspection_id: itemIdNum,
                    itemType: itemType,
                    item_type: itemType,
                    item_description: "",
                    characteristic: selectedCharacteristic,
                    characteristic_name: selectedCharacteristic,
                    inspectionData: allInspectionItems,
                  };

                  if (onSuccess) {
                    onSuccess(savedData);
                  }
                }
              } else {
                // Details API failed, use fallback data
                const savedData = {
                  itemCode: String(itemIdNum),
                  item_code: String(itemIdNum),
                  item_id: itemIdNum,
                  fg_rm_item_id: itemIdNum,
                  inspection_id: itemIdNum,
                  itemType: itemType,
                  item_type: itemType,
                  item_description: "",
                  characteristic: selectedCharacteristic,
                  characteristic_name: selectedCharacteristic,
                  inspectionData: allInspectionItems,
                };

                if (onSuccess) {
                  onSuccess(savedData);
                }
              }
            } catch (detailsError) {
              console.error("Error fetching inspection master details:", detailsError);
              const savedData = {
                itemCode: String(itemIdNum),
                item_code: String(itemIdNum),
                item_id: itemIdNum,
                fg_rm_item_id: itemIdNum,
                inspection_id: itemIdNum,
                itemType: itemType,
                item_type: itemType,
                item_description: "",
                characteristic: selectedCharacteristic,
                characteristic_name: selectedCharacteristic,
                inspectionData: allInspectionItems,
              };

              if (onSuccess) {
                onSuccess(savedData);
              }
            }
          } else {
            // No valid item ID or itemType, use fallback data
            const savedData = {
              itemCode: String(itemIdNum),
              item_code: String(itemIdNum),
              item_id: itemIdNum,
              fg_rm_item_id: itemIdNum,
              inspection_id: itemIdNum,
              itemType: itemType,
              item_type: itemType,
              item_description: "",
              characteristic: selectedCharacteristic,
              characteristic_name: selectedCharacteristic,
              inspectionData: allInspectionItems,
            };

            if (onSuccess) {
              onSuccess(savedData);
            }
          }

          if (onClose) {
            onClose();
          }
        } else {
          // Handle other error cases (Status is neither "Success" nor "Error")
          const errorMessage = response?.data?.INSPECTION_MASTER_RESPONSE?.[0]?.Message ||
            response?.message ||
            "Failed to save Inspection Master";
          showToast(errorMessage, ERROR_STATUS.toLowerCase());
        }
      } catch (error) {
        console.error("Error saving inspection master:", error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          const errorMessage = error?.response?.data?.message ||
            error?.response?.data?.INSPECTION_MASTER_RESPONSE?.[0]?.Message ||
            error?.message ||
            "Failed to save Inspection Master";
          showToast(errorMessage, ERROR_STATUS.toLowerCase());
        }
      } finally {
        setSubmitting(false);
      }
    }, [itemCode, itemType, selectedCharacteristic, inspectionData, displayedCharacteristics, onSuccess, onClose, showToast, expandedCategories]);


    const forceSaveDraft = useCallback(() => {
      if (initialData) return;
      const draft = {
        itemCode,
        itemType,
        itemDescription,
        characteristic: selectedCharacteristic,
        displayedCharacteristics,
        inspectionData,
        expandedCharacteristic,
        expandedCategories: Array.from(expandedCategories),
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        console.error("Manual draft save failed", e);
      }
    }, [itemCode, itemType, itemDescription, selectedCharacteristic, displayedCharacteristics, inspectionData, expandedCharacteristic, expandedCategories, initialData]);

    const clearDraft = useCallback(() => {
      try {
        skipNextDraftSaveRef.current = true;
        localStorage.removeItem(DRAFT_KEY);
        // Reset the clean baseline to empty so any re-open is treated as clean
        const emptyBaseline = {
          itemCode: "", itemType: "", itemDescription: "",
          characteristic: "", displayedCharacteristics: [],
          inspectionData: {}, expandedCharacteristic: null, expandedCategories: [],
        };
        cleanBaselineRef.current = JSON.stringify(emptyBaseline);
        if (typeof resetDirty === "function") {
          resetDirty();
        }
        // Immediately tell the parent the form is clean
        if (onDirtyChange) onDirtyChange(false);
      } catch (e) {
        console.error("Failed to clear inspection draft", e);
      }
    }, [DRAFT_KEY, resetDirty, onDirtyChange]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      submit: handleSave,
      hasUnsavedChanges: () => {
        if (initialData) return false; // edit mode: rely on parent-tracked dirty state
        if (cleanBaselineRef.current === null) return false;
        try {
          const currentSnapshot = JSON.stringify({
            itemCode, itemType, itemDescription,
            characteristic: selectedCharacteristic,
            displayedCharacteristics, inspectionData,
            expandedCharacteristic,
            expandedCategories: Array.from(expandedCategories),
          });
          return currentSnapshot !== cleanBaselineRef.current;
        } catch {
          return false;
        }
      },
      isCharacteristicEditing: () => isAddingNewCharacteristic || isEditingCharacteristic || isInlineEditingCharacteristic,
      clearDraft: clearDraft,
      saveDraft: forceSaveDraft,
    }));


    const isItemCodeDisabled = !!initialData;

    const isDisabled = !!initialData && !editMode;

    return (
      <div className="inspection-master-form-wrapper">
        <FullPageLoader
          loading={submitting}
          message="Saving inspection master..."
          logoSrc={inspireLogo}
        />
        {loadingDetails && <Loader />}

        {/* Item Code Dropdown */}
        <div className="row mb-3 g-3">
          <div className="col-12 col-lg-6">
            <CustomMultiColumnDropdown
              label="Item Code"
              name="itemCode"
              classNamePrefix="react-select"
              options={itemMultiOptions}
              columns={itemCodeColumns}
              isSearchable={true}
              value={itemCode || null}
              onChange={(e) => {
                const value = e?.target?.value ?? "";
                setItemCode(String(value));

                // Find the selected item to get itemType and description
                const selectedItem = itemMultiOptions.find(opt => String(opt.value) === String(value));

                if (selectedItem?.data?.item_type) {
                  setItemType(selectedItem.data.item_type);
                } else {
                  setItemType("FG"); // Default fallback
                }

                // Update item description
                if (selectedItem?.data?.description) {
                  setItemDescription(selectedItem.data.description);
                } else {
                  setItemDescription("");
                }
              }}
              placeholder="Select Item Code"
              isDisabled={isItemCodeDisabled}

              onDropdownIndicatorClick={() => { }}
            />
          </div>
          <div className="col-12 col-lg-6">
            <FormField
              label="Item Description"
              name="itemDescription"
              value={itemDescription || ""}
              readOnly
              placeholder="Item Description"
              style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
            />
          </div>
        </div>

        {/* Inspection Table - Always visible */}
        <div className="row mb-3">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header" style={{ background: "rgb(147, 108, 145)", color: "rgb(255, 255, 255)", padding: "12px 15px", marginBottom: "15px", borderRadius: "10px" }}>
                <div className="d-flex flex-wrap align-items-center justify-content-between w-100 gap-3">
                  {/* Left Side */}
                  <div className="d-flex align-items-center">
                    <h5 style={{ fontSize: "16px", margin: 0, color: "#fff", fontWeight: "600", whiteSpace: "nowrap" }}>
                      Inspection Details
                    </h5>
                  </div>

                  {/* Right Side */}
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="mb-0 d-none d-sm-block" style={{ fontSize: "15px", margin: 0, color: "#fff", fontWeight: "600", whiteSpace: "nowrap" }}>
                        Current Selected Inspection Method:
                      </h5>

                      <div style={{ width: "250px" }} ref={characteristicSelectRef}>
                        <div style={{ marginBottom: 0 }}>
                          <CharacteristicSelectField
                            label=""
                            name="characteristic"
                            options={characteristicOptions}
                            value={isAddingNewCharacteristic ? newCharacteristicInput : (isEditingCharacteristic ? editingCharacteristicName : selectedCharacteristicDisplayText)}
                            onChange={handleCharacteristicInputChange}
                            placeholder={isEditingCharacteristic ? "Edit..." : (isAddingNewCharacteristic ? "Enter New Inspection Method..." : "Select Inspection Method...")}
                            disabled={isDisabled}
                            error={null}
                            isValid={false}
                            onNewClick={handleEnableAddNew}
                            hideNewButton={isAddingNewCharacteristic || isEditingCharacteristic}
                            positionCursorAtEnd={isEditingCharacteristic}
                            onEditClick={handleEditClickFromDropdown}
                            onEditingStateChange={handleEditingStateChange}
                            resolveValueByLabelOnly={isAddingNewCharacteristic}
                            resetInputKey={characteristicInputResetKey}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {isAddingNewCharacteristic && (
                        <div className="d-flex align-items-center gap-1">
                          <button
                            className="btn btn-sm"
                            type="button"
                            onClick={handleSaveNewCharacteristic}
                            disabled={isDisabled || isSavingCharacteristic || !newCharacteristicInput.trim()}
                            style={{
                              background: "rgb(122, 75, 120)",
                              color: "#fff",
                              borderRadius: "6px",
                              padding: "8px",
                              height: "33px",
                              width: "33px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                              cursor: (isDisabled || isSavingCharacteristic || !newCharacteristicInput.trim()) ? "not-allowed" : "pointer",
                              opacity: (isDisabled || isSavingCharacteristic || !newCharacteristicInput.trim()) ? 0.6 : 1,
                            }}
                            title="Save New Inspection Method"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                              <polyline points="17 21 17 13 7 13 7 21"></polyline>
                              <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                          </button>
                          <button
                            className="btn btn-sm"
                            type="button"
                            onClick={() => {
                              setIsAddingNewCharacteristic(false);
                              setNewCharacteristicInput("");
                              if (previousSelectedCharacteristic) {
                                setSelectedCharacteristic(previousSelectedCharacteristic);
                              }
                            }}
                            disabled={isDisabled || isSavingCharacteristic}
                            style={{
                              background: "#6B7280",
                              color: "#fff",
                              borderRadius: "6px",
                              width: "33px",
                              height: "33px",
                              border: "none",
                              cursor: (isDisabled || isSavingCharacteristic) ? "not-allowed" : "pointer",
                              opacity: (isDisabled || isSavingCharacteristic) ? 0.6 : 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Cancel"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {isEditingCharacteristic && (
                        <div className="d-flex align-items-center gap-1">
                          <button
                            className="btn btn-sm"
                            type="button"
                            onClick={handleSaveEditCharacteristic}
                            disabled={isDisabled || isSavingCharacteristic || !editingCharacteristicName.trim()}
                            style={{
                              background: "rgb(122, 75, 120)",
                              color: "#fff",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              height: "33px",
                              fontSize: "13px",
                              fontWeight: "500",
                              border: "none",
                              cursor: (isDisabled || isSavingCharacteristic || !editingCharacteristicName.trim()) ? "not-allowed" : "pointer",
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-sm"
                            type="button"
                            onClick={() => {
                              setIsEditingCharacteristic(false);
                              setEditingCharacteristicId(null);
                              setEditingCharacteristicName("");
                            }}
                            disabled={isDisabled || isSavingCharacteristic}
                            style={{
                              background: "#6B7280",
                              color: "#fff",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              height: "33px",
                              fontSize: "13px",
                              fontWeight: "500",
                              border: "none",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <button
                        className="btn btn-sm"
                        type="button"
                        onClick={handleAddInspection}
                        disabled={isDisabled || isAddingNewCharacteristic || isEditingCharacteristic}
                        style={{
                          background: (isDisabled || isAddingNewCharacteristic || isEditingCharacteristic) ? "#cccccc" : "#7A4B78",
                          color: "#fff",
                          borderRadius: "6px",
                          width: "33px",
                          height: "33px",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          cursor: (isDisabled || isAddingNewCharacteristic || isEditingCharacteristic) ? "not-allowed" : "pointer",
                        }}
                        title="Add Inspection"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Show table data - preserve data when switching modes */}
              {displayedCharacteristics.length > 0 ? (
                <div className="card-body p-0">
                  <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto", overflowX: "auto" }}>
                    <table
                      className="table table-vcenter inspection-details-table"
                      style={{
                        minWidth: "1800px",
                        width: "100%",
                        tableLayout: "fixed",
                        marginBottom: 0,
                        borderCollapse: "separate",
                        borderSpacing: 0,
                      }}
                    >
                      <thead className="inspection-details-thead" style={{ position: "sticky", top: 0, background: "#7A4B78", zIndex: 10 }}>
                        <tr>
                          <th className={`inspection-details-th inspection-details-th-actions ${!canDeleteInspection ? "d-none" : ""}`} style={{ width: "100px", minWidth: "100px", maxWidth: "100px", textAlign: "center", color: "#fff", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px" }}>
                            <span>Actions</span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "80px", minWidth: "80px", maxWidth: "80px", textAlign: "center", color: "#fff", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px" }}>
                            <span>SL.No.</span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "255px", minWidth: "255px", maxWidth: "255px", color: "#fff", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px" }}>
                            <span>Inspection Method & Parameters</span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "120px", minWidth: "120px", maxWidth: "120px", textAlign: "center", color: "#fff", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px" }}>
                            <span>Sort Sequence</span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "265px", minWidth: "265px", maxWidth: "265px", textAlign: "center", color: "#fff", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px" }}>
                            <span>Required JIGS / Tolls / Instruments </span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "250px", minWidth: "250px", maxWidth: "200px", color: "#fff", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px", textAlign: "center" }}>
                            <span>Product Check Points</span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "120px", minWidth: "120px", maxWidth: "120px", textAlign: "center", color: "#fff", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px" }}>
                            <span>Min Reading</span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "120px", minWidth: "120px", maxWidth: "120px", textAlign: "center", color: "#fff", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px" }}>
                            <span>Max Reading</span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", color: "#fff", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px" }}>
                            <span>Prepared By</span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "160px", minWidth: "160px", maxWidth: "160px", color: "#fff", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px" }}>
                            <span>Prepared Date</span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", color: "#fff", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid rgba(255, 255, 255, 0.3)", padding: "8px 12px" }}>
                            <span>Updated By</span>
                          </th>
                          <th className="inspection-details-th" style={{ width: "160px", minWidth: "160px", maxWidth: "160px", color: "#fff", textAlign: "center", border: "1px solid #dee2e6", padding: "8px 12px" }}>
                            <span>Updated Date</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="inspection-details-tbody">
                        {displayedCharacteristics
                          .map((char) => {
                            const characteristicKey = String(char.value).trim();
                            const characteristicDisplayText = char.label;

                            // Get items for this characteristic
                            const characteristicItems = (inspectionData[characteristicKey] || []).filter(
                              (item) => String(item.category || "").trim() === String(characteristicDisplayText).trim()
                            );

                            return {
                              char,
                              characteristicKey,
                              characteristicDisplayText,
                              characteristicItems,
                            };
                          })
                          .filter(({ characteristicItems }) => characteristicItems.length > 0) // Only show characteristics with items
                          .map(({ characteristicKey, characteristicDisplayText, characteristicItems }, charIndex) => {

                            const firstItemSortSeq = characteristicItems[0]?.sortSeq;
                            const characteristicSortSeq = (firstItemSortSeq != null && firstItemSortSeq !== "")
                              ? firstItemSortSeq
                              : (charIndex + 1);
                            // Get the actual sortSeq value for the input (allows null/empty for clearing)
                            const actualSortSeq = firstItemSortSeq != null ? firstItemSortSeq : null;

                            // Sort by subSortSeq first, then by sortSeq
                            characteristicItems.sort((a, b) => {
                              const aSubSort = a.subSortSeq || 0;
                              const bSubSort = b.subSortSeq || 0;
                              if (aSubSort !== bSubSort) {
                                return aSubSort - bSubSort;
                              }
                              // If subSortSeq is the same or both are 0, sort by sortSeq
                              const aSort = a.sortSeq || 0;
                              const bSort = b.sortSeq || 0;
                              return aSort - bSort;
                            });

                            const isExpanded = expandedCategories.has(characteristicDisplayText);

                            return (
                              <React.Fragment key={characteristicKey}>
                                {/* Characteristic Header Row (Parent) */}
                                <tr
                                  style={{
                                    background: isExpanded ? "#f8f9fa" : "#fff",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                  }}
                                  onClick={() => toggleCategory(characteristicDisplayText, characteristicKey)}
                                >
                                  <td className={`inspection-details-td ${!canDeleteInspection ? "d-none" : ""}`} style={{ width: "100px", minWidth: "100px", maxWidth: "100px", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px" }}>
                                    {/* Actions column - empty for characteristic header */}
                                  </td>
                                  <td className="inspection-details-td" style={{ width: "80px", minWidth: "80px", maxWidth: "80px", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px" }}>
                                    <span style={{ marginRight: "8px" }}>
                                      {isExpanded ? "▼" : "▶"}
                                    </span>
                                    {characteristicSortSeq}
                                  </td>
                                  <td className="inspection-details-td" style={{ width: "250px", minWidth: "250px", maxWidth: "200px", paddingLeft: "20px", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px" }}>
                                    {characteristicDisplayText}
                                  </td>
                                  <td className="inspection-details-td" style={{ width: "120px", minWidth: "120px", maxWidth: "120px", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", backgroundColor: "#e3f2fd" }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="number"
                                      step="1"
                                      className="form-control form-control-sm inspection-details-input"
                                      value={actualSortSeq != null ? actualSortSeq : ""}
                                      onKeyDown={(e) => {
                                        // Prevent decimal points, commas, and scientific notation
                                        if (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                          e.preventDefault();
                                        }
                                      }}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const inputValue = e.target.value;
                                        // Allow empty string for clearing
                                        if (inputValue === "") {
                                          // Clear sortSeq for all items in this characteristic
                                          characteristicItems.forEach((item) => {
                                            handleFieldChange(item.id, "sortSeq", null, characteristicKey);
                                          });
                                        } else {
                                          // Update sortSeq for all items in this characteristic
                                          // Ensure only integer values are accepted
                                          const newSortSeq = parseInt(inputValue, 10);
                                          if (!isNaN(newSortSeq) && newSortSeq >= 0) {
                                            characteristicItems.forEach((item) => {
                                              handleFieldChange(item.id, "sortSeq", newSortSeq, characteristicKey);
                                            });
                                          }
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      onFocus={(e) => e.stopPropagation()}
                                      disabled={isDisabled}
                                      style={{ textAlign: "center", backgroundColor: "#fff", fontWeight: 600, border: "2px solid rgb(165, 207, 241)" }}
                                      placeholder=""
                                      title="Characteristic Sort Sequence"
                                    />
                                  </td>
                                  <td className="inspection-details-td" colSpan="8" style={{ border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px" }}>
                                  </td>
                                </tr>

                                {/* Characteristic Items (Children) */}
                                {isExpanded &&
                                  characteristicItems.map((item, itemIndex) => {
                                    const indentLevel = item.parentId ? 2 : 1;

                                    return (
                                      <tr key={item.id}>
                                        {/* Actions Column - First */}
                                        <td className={`inspection-details-td inspection-details-td-actions ${!canDeleteInspection ? "d-none" : ""}`} style={{ width: "100px", minWidth: "100px", maxWidth: "100px", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 6px", verticalAlign: "middle" }}>
                                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>

                                            {/* Upload Video Button */}
                                            {(() => {
                                              const isNewRow = !item.inspectionID && !item.inspection_id || String(item.id).startsWith("new_");
                                              const hasVideo = String(item.is_video_uploaded).toUpperCase() === "Y";
                                              const buttonContent = (
                                                <button
                                                  type="button"
                                                  className="btn btn-sm btn-danger"
                                                  disabled={isNewRow}
                                                  onClick={() => setVideoUploadModal({ open: true, row: item })}
                                                  style={{
                                                    background: "transparent",
                                                    border: "none",
                                                    color: isNewRow ? "#c0c0c0" : (hasVideo ? "#16a34a" : "#7A4B78"),
                                                    cursor: isNewRow ? "not-allowed" : "pointer",
                                                    padding: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: "4px",
                                                    pointerEvents: isNewRow ? "none" : "auto",
                                                  }}
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
                                                    <polygon points="23 7 16 12 23 17 23 7" />
                                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                                  </svg>
                                                </button>
                                              );

                                              if (isNewRow) {
                                                return (
                                                  <span
                                                    title="Please save the record before uploading the video"
                                                    style={{ display: "inline-flex", cursor: "not-allowed" }}
                                                  >
                                                    {buttonContent}
                                                  </span>
                                                );
                                              }

                                              return (
                                                <span title={isDisabled ? "View Video" : "Upload Video"} style={{ display: "inline-flex" }}>
                                                  {buttonContent}
                                                </span>
                                              );
                                            })()}

                                            {/* Delete Button */}
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-danger"
                                              onClick={() => handleDeleteRow(item.id, characteristicKey)}
                                              disabled={isDisabled}
                                              style={{
                                                padding: "4px",
                                                fontSize: "14px",
                                                background: "transparent",
                                                color: "rgb(22, 119, 255)",
                                                border: "none",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderRadius: "4px",
                                                cursor: isDisabled ? "not-allowed" : "pointer",
                                              }}
                                              title="Remove row"
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
                                                <path d="M4 7h16" />
                                                <path d="M10 11v6" />
                                                <path d="M14 11v6" />
                                                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
                                                <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                                              </svg>
                                            </button>

                                          </div>
                                        </td>
                                        {/* SL.No. */}
                                        <td className="inspection-details-td" style={{ width: "80px", minWidth: "80px", maxWidth: "80px", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle" }}>
                                          {characteristicSortSeq}.{item.subSortSeq != null ? item.subSortSeq : (itemIndex + 1)}
                                        </td>
                                        {/* Characteristic Name */}
                                        <td className="inspection-details-td" style={{ width: "200px", minWidth: "200px", maxWidth: "200px", paddingLeft: `${indentLevel * 20}px`, border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle" }}>
                                          <input
                                            type="text"
                                            className={`form-control form-control-sm inspection-details-input${fieldErrors[item.id]?.characteristicName
                                              ? " is-invalid"
                                              : ""
                                              }`}
                                            value={item.characteristicName || ""}
                                            onChange={(e) =>
                                              handleFieldChange(item.id, "characteristicName", e.target.value, characteristicKey)
                                            }
                                            onBlur={(e) =>
                                              validateField(item.id, "characteristicName", e.target.value)
                                            }
                                            disabled={isDisabled}
                                            required
                                          />
                                          {fieldErrors[item.id]?.characteristicName && (
                                            <div className="invalid-feedback d-block" style={{ fontSize: "12px", marginTop: "2px" }}>
                                              {fieldErrors[item.id].characteristicName}
                                            </div>
                                          )}
                                        </td>
                                        {/* Sort - Sub Sort Seq */}
                                        <td className="inspection-details-td" style={{ width: "120px", minWidth: "120px", maxWidth: "120px", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle", backgroundColor: "#fff3e0" }}>
                                          <input
                                            type="number"
                                            step="1"
                                            className={`form-control form-control-sm inspection-details-input${fieldErrors[item.id]?.subSortSeq ? " is-invalid" : ""}`}
                                            value={item.subSortSeq != null ? item.subSortSeq : ""}
                                            onKeyDown={(e) => {
                                              // Prevent decimal points, commas, and scientific notation
                                              if (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                                e.preventDefault();
                                              }
                                            }}
                                            onChange={(e) => {
                                              const inputValue = e.target.value;
                                              // Allow empty string for clearing
                                              if (inputValue === "") {
                                                // Clear subSortSeq for this item
                                                handleFieldChange(item.id, "subSortSeq", null, characteristicKey);
                                              } else {
                                                // Update subSortSeq for this item
                                                // Ensure only integer values are accepted
                                                const newValue = parseInt(inputValue, 10);
                                                if (!isNaN(newValue) && newValue >= 0) {
                                                  handleFieldChange(item.id, "subSortSeq", newValue, characteristicKey);
                                                }
                                              }
                                            }}
                                            onBlur={(e) =>
                                              validateField(item.id, "subSortSeq", e.target.value)
                                            }
                                            disabled={isDisabled}
                                            style={{ textAlign: "center", backgroundColor: "#fff", fontWeight: 500, border: "2px solid rgb(233, 205, 163)" }}
                                            placeholder=""
                                            title="Sub Characteristic Sort Sequence"
                                          />
                                          {fieldErrors[item.id]?.subSortSeq && (
                                            <div className="invalid-feedback d-block" style={{ fontSize: "12px", marginTop: "2px", textAlign: "left" }}>
                                              {fieldErrors[item.id].subSortSeq}
                                            </div>
                                          )}
                                        </td>
                                        {/* REQUIRED JIGS / TOLLS / INSTRUMENTS */}
                                        <td className="inspection-details-td" style={{ width: "120px", minWidth: "120px", maxWidth: "120px", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle" }}>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm inspection-details-input"
                                            value={item.requiredJigs || ""}
                                            onChange={(e) =>
                                              handleFieldChange(item.id, "requiredJigs", e.target.value, characteristicKey)
                                            }
                                            disabled={isDisabled}
                                          />
                                        </td>
                                        {/* Value */}
                                        <td className="inspection-details-td" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle" }}>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm inspection-details-input"
                                            value={item.value || ""}
                                            onChange={(e) =>
                                              handleFieldChange(item.id, "value", e.target.value, characteristicKey)
                                            }
                                            disabled={isDisabled}
                                          />
                                        </td>
                                        {/* Min Reading */}
                                        <td className="inspection-details-td" style={{ width: "120px", minWidth: "120px", maxWidth: "120px", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle" }}>
                                          <input
                                            type="text"
                                            inputMode="decimal"
                                            className={`form-control form-control-sm inspection-details-input${fieldErrors[item.id]?.minReading ? " is-invalid" : ""}`}
                                            value={item.minReading != null ? item.minReading : ""}
                                            onKeyDown={(e) => {
                                              // Prevent scientific notation and signs
                                              if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                                e.preventDefault();
                                              }
                                            }}
                                            onChange={(e) => {
                                              const inputValue = e.target.value;
                                              if (inputValue === "" || DECIMAL_QTY_REGEX.test(inputValue)) {
                                                handleFieldChange(item.id, "minReading", inputValue, characteristicKey);
                                              }
                                            }}
                                            onBlur={(e) => {
                                              let finalVal = item.minReading != null ? String(item.minReading) : "";
                                              if (finalVal === ".") {
                                                finalVal = "";
                                                handleFieldChange(item.id, "minReading", "", characteristicKey);
                                              }
                                              validateField(item.id, "minReading", finalVal);
                                            }}
                                            disabled={isDisabled}
                                          />
                                          {fieldErrors[item.id]?.minReading && (
                                            <div
                                              className="invalid-feedback d-block"
                                              style={{ fontSize: "12px", marginTop: "2px", textAlign: "left" }}
                                            >
                                              {fieldErrors[item.id].minReading}
                                            </div>
                                          )}
                                        </td>
                                        {/* Max Reading */}
                                        <td className="inspection-details-td" style={{ width: "120px", minWidth: "120px", maxWidth: "120px", textAlign: "center", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle" }}>
                                          <input
                                            type="text"
                                            inputMode="decimal"
                                            className={`form-control form-control-sm inspection-details-input${fieldErrors[item.id]?.maxReading ? " is-invalid" : ""}`}
                                            value={item.maxReading != null ? item.maxReading : ""}
                                            onKeyDown={(e) => {
                                              // Prevent scientific notation and signs
                                              if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                                e.preventDefault();
                                              }
                                            }}
                                            onChange={(e) => {
                                              const inputValue = e.target.value;
                                              if (inputValue === "" || DECIMAL_QTY_REGEX.test(inputValue)) {
                                                handleFieldChange(item.id, "maxReading", inputValue, characteristicKey);
                                              }
                                            }}
                                            onBlur={(e) => {
                                              let finalVal = item.maxReading != null ? String(item.maxReading) : "";
                                              if (finalVal === ".") {
                                                finalVal = "";
                                                handleFieldChange(item.id, "maxReading", "", characteristicKey);
                                              }
                                              validateField(item.id, "maxReading", finalVal);
                                            }}
                                            disabled={isDisabled}
                                          />
                                          {fieldErrors[item.id]?.maxReading && (
                                            <div
                                              className="invalid-feedback d-block"
                                              style={{ fontSize: "12px", marginTop: "2px", textAlign: "left" }}
                                            >
                                              {fieldErrors[item.id].maxReading}
                                            </div>
                                          )}
                                        </td>
                                        {/* Prepared By */}
                                        <td className="inspection-details-td" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle" }}>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm inspection-details-input"
                                            value={item.preparedBy || ""}
                                            disabled
                                            readOnly
                                          />
                                        </td>
                                        {/* Prepared Date */}
                                        <td className="inspection-details-td" style={{ width: "160px", minWidth: "160px", maxWidth: "160px", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle" }}>
                                          <input
                                            type="date"
                                            className="form-control form-control-sm inspection-details-input"
                                            value={item.preparedDate || ""}
                                            disabled
                                            readOnly
                                          />
                                        </td>
                                        {/* Updated By */}
                                        <td className="inspection-details-td" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle" }}>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm inspection-details-input"
                                            value={item.updatedBy || ""}
                                            disabled
                                            readOnly
                                          />
                                        </td>
                                        {/* Updated Date */}
                                        <td className="inspection-details-td" style={{ width: "160px", minWidth: "160px", maxWidth: "160px", border: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px 12px", verticalAlign: "middle" }}>
                                          <input
                                            type="date"
                                            className="form-control form-control-sm inspection-details-input"
                                            value={item.updatedDate || ""}
                                            disabled
                                            readOnly
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </React.Fragment>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card-body text-center text-muted py-5">
                  <p>No inspection data available.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          .inspection-master-form-wrapper .table {
            border-collapse: separate;
            border-spacing: 0;
          }
          
          .inspection-master-form-wrapper .table thead th {
            background: #7A4B78 !important;
            color: #ffffff !important;
            border: 1px solid #dee2e6 !important;
            border-right: 1px solid rgba(255, 255, 255, 0.3) !important;
            padding: 8px 12px !important;
          }
          
          .inspection-master-form-wrapper .table thead th:last-child {
            border-right: 1px solid #dee2e6 !important;
          }
          
          .inspection-master-form-wrapper .table tbody tr:hover {
            background-color: #f8f9fa;
          }
          
          .inspection-master-form-wrapper .table tbody tr td {
            vertical-align: middle;
            border: 1px solid #dee2e6 !important;
            border-right: 1px solid #dee2e6 !important;
            padding: 8px 12px !important;
          }
          
          .inspection-master-form-wrapper .table tbody tr td:last-child {
            border-right: 1px solid #dee2e6 !important;
          }

          /* Header dropdown styling */
          .inspection-master-form-wrapper .card-header .react-select__control {
            min-height: 32px !important;
            height: 32px !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .inspection-master-form-wrapper .card-header .react-select__control:hover {
            border-color: rgba(255, 255, 255, 0.5) !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;
          }

          .inspection-master-form-wrapper .card-header .react-select__control--is-focused {
            border-color: rgba(255, 255, 255, 0.8) !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3) !important;
          }

          .inspection-master-form-wrapper .card-header .react-select__value-container {
            padding: 0 8px !important;
            height: 32px !important;
          }

          .inspection-master-form-wrapper .card-header .react-select__indicators {
            height: 32px !important;
            padding: 0 6px !important;
          }

          .inspection-master-form-wrapper .card-header .react-select__single-value {
            color: #333 !important;
            font-size: 13px !important;
          }

          .inspection-master-form-wrapper .card-header .react-select__placeholder {
            color: #666 !important;
            font-size: 13px !important;
          }

          .inspection-master-form-wrapper .card-header .react-select__input-container {
            color: #333 !important;
            font-size: 13px !important;
          }

          /* CharacteristicSelectField in header - hide label and adjust spacing */
          .inspection-master-form-wrapper .card-header .form-label:empty {
            display: none !important;
          }

          .inspection-master-form-wrapper .card-header .mb-2 {
            margin-bottom: 0 !important;
          }

          /* Inspection Details Table Styles */
          .inspection-details-table {
            border-collapse: separate;
            border-spacing: 0;
          }

          .inspection-details-table thead {
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .inspection-details-table thead th {
            position: sticky;
            top: 0;
            background: #7A4B78;
            color: #fff;
            font-weight: bold;
          }

          .inspection-details-th {
            padding: 8px 12px !important;
            font-weight: bold !important;
            border: 1px solid #dee2e6;
            border-right: 1px solid rgba(255, 255, 255, 0.3);
            text-transform: none !important;
          }

          .inspection-details-th span {
            text-transform: none !important;
            font-size: 14px !important;
          }

          .inspection-details-th:last-child {
            border-right: 1px solid #dee2e6;
          }

          .inspection-details-td {
            padding: 8px 12px !important;
            vertical-align: middle;
            border: 1px solid #dee2e6;
            border-right: 1px solid #dee2e6;
          }

          .inspection-details-td:last-child {
            border-right: 1px solid #dee2e6;
          }

          .inspection-details-input {
            width: 100%;
            border: 1px solid #ced4da;
            border-radius: 0.25rem;
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
          }

          .inspection-details-input:disabled {
            background-color: #e9ecef;
            opacity: 1;
            cursor: not-allowed;
          }

          .inspection-details-input:focus {
            border-color: #80bdff;
            outline: 0;
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
          }

          /* Remove number input spinners in Chrome, Safari, Edge, Opera */
          .inspection-details-input[type="number"]::-webkit-outer-spin-button,
          .inspection-details-input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }

          /* Remove number input spinners in Firefox */
          .inspection-details-input[type="number"] {
            -moz-appearance: textfield;
          }
        `}</style>

        <DeleteConfirmDialog
          open={showDeleteConfirm}
          title="Confirm Delete"
          message={
            inspectionToDelete?.characteristicName
              ? ` ${inspectionToDelete.characteristicName}`
              : ""
          }
          onConfirm={confirmDeleteRow}
          onCancel={cancelDeleteRow}
        />

        {/* Inspection Video Upload Modal */}
        <InspectionVideoUploadModal
          open={videoUploadModal.open}
          onClose={() => setVideoUploadModal({ open: false, row: null })}
          inspectionRow={videoUploadModal.row}
          itemCode={itemMultiOptions?.find(opt => String(opt.value) === String(itemCode))?.label || (typeof itemCode === 'string' ? itemCode.split('|')[0] : itemCode)}
          onUploadSuccess={(apiResponse, file, row) => {
            if (showToast) {
              showToast("Video Uploaded Successfully!", SUCCESS_STATUS.toLowerCase());
            }
            console.log("Video uploaded successfully:", file?.name, "for row:", row, "Response:", apiResponse);
            setInspectionData(prevData => {
              const updatedData = { ...prevData };
              for (const charKey in updatedData) {
                const items = updatedData[charKey] || [];
                const itemIdx = items.findIndex(item => item && item.id === row.id);
                if (itemIdx !== -1) {
                  const updatedItems = [...items];
                  const uploadedDetails = apiResponse?.data?.UPLOADED_RESPONSE?.[0];
                  const uploadedFileName = uploadedDetails?.FileName || file?.name || "";
                  updatedItems[itemIdx] = {
                    ...updatedItems[itemIdx],
                    is_video_uploaded: "Y",
                    fileName: uploadedFileName,
                    FileName: uploadedFileName
                  };
                  updatedData[charKey] = updatedItems;
                  break;
                }
              }

              // Update dirty-check baselines so this doesn't trigger "Unsaved Changes"
              if (initialInspectionDataRef.current) {
                initialInspectionDataRef.current = JSON.parse(JSON.stringify(updatedData));
              }
              if (cleanBaselineRef.current !== null) {
                try {
                  const baselineObj = JSON.parse(cleanBaselineRef.current);
                  baselineObj.inspectionData = updatedData;
                  cleanBaselineRef.current = JSON.stringify(baselineObj);
                } catch (e) {
                  // ignore
                  console.error("Error updating cleanBaselineRef after video upload:", e);
                }
              }

              return updatedData;
            });
          }}
          onDeleteSuccess={(apiResponse, row) => {
            setInspectionData(prevData => {
              const updatedData = { ...prevData };
              for (const charKey in updatedData) {
                const items = updatedData[charKey] || [];
                const itemIdx = items.findIndex(item => item && item.id === row.id);
                if (itemIdx !== -1) {
                  const updatedItems = [...items];
                  updatedItems[itemIdx] = {
                    ...updatedItems[itemIdx],
                    is_video_uploaded: "N",
                    fileName: "",
                    FileName: ""
                  };
                  updatedData[charKey] = updatedItems;
                  break;
                }
              }

              // Update dirty-check baselines so this doesn't trigger "Unsaved Changes"
              if (initialInspectionDataRef.current) {
                initialInspectionDataRef.current = JSON.parse(JSON.stringify(updatedData));
              }
              if (cleanBaselineRef.current !== null) {
                try {
                  const baselineObj = JSON.parse(cleanBaselineRef.current);
                  baselineObj.inspectionData = updatedData;
                  cleanBaselineRef.current = JSON.stringify(baselineObj);
                } catch (e) {
                  // ignore
                  console.error("Error updating cleanBaselineRef after video delete:", e);
                }
              }

              return updatedData;
            });
          }}
          readOnly={isDisabled || !canEditInspection}
        />

      </div>
    );
  }
);

SaveOrUpdateInspection.displayName = "SaveOrUpdateInspection";

export default SaveOrUpdateInspection;

