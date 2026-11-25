import '../../lib/axiosSetup';
import React, { useState, useRef, useEffect } from "react";
import ValidatedForm from "../../components/ValidatedForm";
import {
  FormField,
  ReactSelectField,
  TextAreaFormField,
  EditableSelectField,
} from "../../components/FormElement";
import { CustomMultiColumnDropdown } from "../../components/CustomVendorDropdown";
// import { SingleSwitch } from "../../components/FormElement";
import RightDrawer from "../../components/RightDrawer";
import { useToast } from "../../components/useToast";
import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
import NumericEditor from "../../components/NumericEditor";
import CopyButton from "../../components/CopyButton.jsx";
import { handleApiValidationErrors } from "../../utils/CustomValidation";
import FullPageLoader from "../../components/FullPageLoader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import {
  saveAndUpdateInventoryMaster,
  fetchInventoryDetails,
  fetchInventoryPartsList,
  getInventoryStatusOptions,
  getItemTypeOptions,
  getRohsOptions,
  getAutomotiveItemsOptions,
  getPlatingSurfaceAreaUnitOptions,
  getPlatingThicknessUnitOptions,
  getClassificationOptions,
  getHsnCodeOptions,
  getPlatingTypeOptions,
  getInspectionTypeOptions,
  getItemCategoryOptions,
  checkInventoryItemCodeExist,
} from "../../services/inventoryMasterService";
import { getPreparedBy } from "../../utils/userSession";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS } from "../../utils/ConstVariables";



const today = new Date().toISOString().split("T")[0];


const initialForm = {
  pageSize: 0,
  pageNumber: 0,
  itemCode: "",
  itemName: "",
  itemDescription: "",
  priUnit: "NOS",
  alternateUnit: "",
  conversionFactor: 0,
  openStock: 0,
  itemROL: 0,
  itemMinimumQuantity: 0,
  itemMaximumQuantity: 0,
  location: "",
  subContract: 0,
  drawingStatus: "",
  valid: 1,
  alternatePurchaseItemCode: "",
  itemQualityPlan: "",
  unitRate: 0,
  lastTransactionDate: "",
  itemType: "",
  quantityAccepted: 0,
  quantityIssued: 0,
  quantityReserved: 0,
  reservationInformation: "",
  reOrderLevelDate: "",
  itemClass: 0,
  inspectionType: "",
  itemStockTransfer: "",
  inspectionTypeStartDate: "",
  inspectionTypeEndDate: "",
  rawMaterialRate: 0,
  rawMaterialCurrency: "",
  rawMaterialUpdateDate: "",
  purchaseItemType: "",
  entryDate: today,
  remarks: "",
  preparedBy: getPreparedBy(),
  updatedBy: "",
  itemUnderROL: 0,
  purchaseIssues: "",
  openOrderIssue: "",
  drawingMapItemCode: "",
  autoProductionOrder: "",
  clearanceQuantity: 0,
  clearanceDate: "",
  transitQuantity: 0,
  plannedQuantity: 0,
  shelfLife: "",
  rohsEnable: "",
  itemStatusChangedBy: "",
  productionLeadtime: 0,
  changeRequired: "",
  changeApprovedBy: "",
  changeApprovedDate: "",
  qaAlertMessage: "",
  hsnid: 0,
  sendTestReportFormat: "",
  followFIFO: "",
  leadTimeWeek: 0,
  scrapApprovedStatus: "",
  scrapApprovedBy: "",
  scrapApprovedDate: "",
  scrapRemarks: "",
  platingPart: "",
  platingType: "",
  platingSurfaceArea: 0,
  platingSurfaceAreaUnit: "",
  platingThickness: 0,
  platingThicknessUnit: "",
  platingThicknessForCosting: 0,
  platingUpdatedBy: "",
  platingUpdatedDate: "",
  platingSNo: 0,
  automotiveItem: "",
  paramType: "ADD",
};

// Unit dropdown options (can be string array or object array)
const UNIT_OPTIONS = ["NOS", "KGS", "GMS"];

const validation = {
  itemName: { required: true, fieldLabel: "Item Code" },
  itemDescription: { required: true, fieldLabel: "Description" },
  valid: { required: true, fieldLabel: "Status", controlType: "select" },
  priUnit: { required: true, fieldLabel: "Unit", controlType: "select" },
  hsnid: { required: true, fieldLabel: "HSN Code", controlType: "select" },
};

// Note: getEmployeeName not used in this component; removed to satisfy linter

const SaveOrUpdateInventoryMaster = ({
  open,
  onClose,
  onSuccess,
  initialData,
  editMode: editModeProp,
  onEdit,
  onDisableEdit,
  onDirtyChange,
  disabled,
}) => {
  const { showToast } = useToast();
  const [editMode, setEditMode] = useState(initialData ? false : true);
  const [submitting, setSubmitting] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [shelfLifeError, setShelfLifeError] = useState("");
  const [, setRohsOptions] = useState([]);
  const [, setItemTypeOptions] = useState([]);
  const [, setAutomotiveItems] = useState([]);
  const [, setSurfaceAreaUnitOptions] = useState([]);
  const [, setThicknessUnitOptions] = useState([]);
  const [, setClassificationOptions] = useState([]);
  const [, setHsnCodeOptions] = useState([]);
  const [HSNOptions, setHSNTypeOptions] = useState([]);
  // const [changeRequestOptions, setChangeRequestOptions] = useState([]);
  const [, setPlatingTypeOptions] = useState([]);
  const [, setInspectionTypeOptions] = useState([]);
  const [, setAltCodeOptions] = useState([]);
  const [, setItemCategoryOptions] = useState([]);

  // No-op to avoid undefined in onFocus handlers
  const clearFieldError = () => { };

  // Ref to preserve initialData even during re-renders (e.g., when dialog opens)
  const initialDataRef = useRef(initialData);

  // Update ref when initialData changes
  useEffect(() => {
    if (initialData) {
      initialDataRef.current = initialData;
    }
  }, [initialData]);

  // Memoize initialValues for dirty tracking
  const initialValues = React.useMemo(
    () => {
      // Use ref as fallback to ensure data is always available
      const dataToUse = initialData || initialDataRef.current;

      return dataToUse
        ? (() => {
          const base = {
            ...initialForm,
            ...dataToUse,
            paramType: "UPDATE",
            classification: dataToUse.classification || "D&E",
            // Ensure itemID is set for UPDATE operations
            itemID: dataToUse.itemID || dataToUse.item_id || 0,
            // Convert hsnid to string for CustomMultiColumnDropdown
            hsnid: String(
              dataToUse.hsn_id ??
              dataToUse.hsnid ??
              dataToUse.cc_hsn_code ??
              ""
            ),
            valid: dataToUse.valid ?? dataToUse.item_status ?? 1,
          };
          return {
            ...base,
            itemName: base.itemName || base.itemCode || "",
            priUnit: base.priUnit || base.itemUnit || base.item_unit || "NOS",
            shelfLife: (base.shelfLife === 0 || base.shelfLife === "0" || base.shelf_life_days === 0 || base.shelf_life_days === "0" || (!base.shelfLife && !base.shelf_life_days)) ? "" : (base.shelfLife || base.shelf_life_days || "")
          };
        })()
        : { ...initialForm, paramType: "ADD", classification: "D&E", hsnid: "", itemID: 0 };
    },
    [initialData] // initialData is the primary dependency, ref is fallback
  );

  // Dirty save integration
  const {
    isDirty,
    onValuesChange,
    rightDrawerProps: dirtyDrawerProps,
    setIsDirty,
    resetDirty,
  } = useDirtyDraftDrawer({
    open,
    initialValues,
    initialData: initialData || initialDataRef.current, // Use ref as fallback
    draftKey: "draft_inventory_create",
  });

  // Notify parent component of dirty state changes
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  // Debug logging
  // console.log("initialData:", initialData);
  // console.log("final initialValues:", initialValues);
  // console.log("statusOptions:", statusOptions);

  useEffect(() => {
    if (editModeProp !== undefined) {
      setEditMode(editModeProp);
    } else {
      setEditMode(initialData ? false : true);
    }
  }, [initialData, editModeProp]);

  // Fetch status options from API
  useEffect(() => {
    const fetchStatusOptions = async () => {
      try {
        const data = await getInventoryStatusOptions();
        const options =
          data?.map((item) => ({
            value: Number(item.ValueText),
            label: item.DisplayText,
          })) || [];
        setStatusOptions(options);
      } catch {
        setStatusOptions([]);
      }
    };
    fetchStatusOptions();
  }, []);

  useEffect(() => {
    const fetchItemTypeOptions = async () => {
      try {
        const data = await getItemTypeOptions();
        const options = (data || []).map((opt) => ({
          value: opt.text,
          label: opt.text,
        }));
        setItemTypeOptions(options);
      } catch {
        setItemTypeOptions([]);
      }
    };
    fetchItemTypeOptions();
  }, []);

  useEffect(() => {
    const fetchRohsOptions = async () => {
      try {
        const data = await getRohsOptions();
        const options = (data || []).map((opt) => ({
          value: opt.ValueText,
          label: opt.DisplayText,
        }));
        setRohsOptions(options);
      } catch {
        console.error("Error fetching RoHS options");
        setRohsOptions([]);
      }
    };

    fetchRohsOptions();
  }, []);

  useEffect(() => {
    const fetchAutomotiveItems = async () => {
      try {
        const data = await getAutomotiveItemsOptions();
        const options = (data || []).map(
          (opt) => ({
            value: opt.ValueText,
            label: opt.DisplayText,
          })
        );
        setAutomotiveItems(options);
      } catch (error) {
        console.error("Error fetching automotive item dropdown:", error);
        setAutomotiveItems([]);
      }
    };
    fetchAutomotiveItems();
  }, []);

  // Fetch Plating Surface Unit options from API
  useEffect(() => {
    const fetchSurfaceAreaUnitOptions = async () => {
      try {
        const data = await getPlatingSurfaceAreaUnitOptions();
        const options = (data || []).map((opt) => ({
          value: opt.ValueText,
          label: opt.DisplayText,
        }));
        setSurfaceAreaUnitOptions(options);
      } catch {
        setSurfaceAreaUnitOptions([]);
      }
    };
    fetchSurfaceAreaUnitOptions();
  }, []);

  // Fetch Plating Thickness Unit options from API
  useEffect(() => {
    const fetchThicknessUnitOptions = async () => {
      try {
        const data = await getPlatingThicknessUnitOptions();
        const options = (data || []).map((opt) => ({
          value: opt.ValueText,
          label: opt.DisplayText,
        }));
        setThicknessUnitOptions(options);
      } catch {
        setThicknessUnitOptions([]);
      }
    };
    fetchThicknessUnitOptions();
  }, []);

  // Fetch Classification options from API
  useEffect(() => {
    const fetchClassificationOptions = async () => {
      try {
        const data = await getClassificationOptions();
        const options = (data || []).map((opt) => ({
          value: opt.ValueText,
          label: opt.DisplayText,
        }));
        setClassificationOptions(options);
      } catch {
        setClassificationOptions([]);
      }
    };
    fetchClassificationOptions();
  }, []);

  // Fetch HSN Code options from API
  useEffect(() => {
    const normalizeDropdownList = (res) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data?.data?.DROPDOWN_LIST))
        return res.data.data.DROPDOWN_LIST;
      if (Array.isArray(res?.data?.DROPDOWN_LIST))
        return res.data.DROPDOWN_LIST;
      if (Array.isArray(res?.DROPDOWN_LIST)) return res.DROPDOWN_LIST;
      return [];
    };

    const fetchHsnCodeOptions = async () => {
      try {
        const data = await getHsnCodeOptions();
        const hsnList = normalizeDropdownList(data);
        // Store raw HSN items for multi-column dropdown
        setHSNTypeOptions(hsnList);
        // Keep simple options for backward compatibility if needed
        const options = (hsnList || []).map((opt) => ({
          value: opt.hsn_code,
          label: opt.text,
        }));
        setHsnCodeOptions(options);
      } catch {
        setHsnCodeOptions([]);
        setHSNTypeOptions([]);
      }
    };
    fetchHsnCodeOptions();
  }, []);

  useEffect(() => {
    const fetchPlatingTypeOptions = async () => {
      try {
        const data = await getPlatingTypeOptions();
        const options = (data || []).map((opt) => ({
          value: opt.plating_name,
          label: opt.plating_name,
        }));
        setPlatingTypeOptions(options);
      } catch {
        setPlatingTypeOptions([]);
      }
    };
    fetchPlatingTypeOptions();
  }, []);

  // Fetch Inspection Type options from API
  useEffect(() => {
    const fetchInspectionTypeOptions = async () => {
      try {
        const data = await getInspectionTypeOptions();
        const options = (data || []).map((opt) => ({
          value: opt.ValueText,
          label: opt.DisplayText,
        }));
        setInspectionTypeOptions(options);
      } catch {
        console.error("Error fetching inspection type options");
        setInspectionTypeOptions([]);
      }
    };
    fetchInspectionTypeOptions();
  }, []);

  // Fetch Alt Code options from API
  useEffect(() => {
    const fetchAltCodeOptions = async () => {
      try {
        const res = await fetchInventoryPartsList({
          pageSize: 1000,
          pageNumber: 0,
          searchFilter: [],
          isGlobalSearch: 0,
          sortOrder: "ASC",
        });
        const options = (res?.data?.INVENTORY_MASTER_LIST || []).map((item) => ({
          value: item.item_code,
          label: `${item.item_code} - ${item.item_description}`,
          data: {
            itemCode: item.item_code,
            itemDescription: item.item_description,
            freeStock: 0, // Not available in new API response
          }
        }));
        setAltCodeOptions(options);
      } catch {
        console.error("Error fetching alt code options");
        setAltCodeOptions([]);
      }
    };
    fetchAltCodeOptions();
  }, []);

  useEffect(() => {
    const fetchItemCategoryOptions = async () => {
      try {
        const data = await getItemCategoryOptions();
        const options = (data || []).map((opt) => ({
          value: opt.ValueText,
          label: opt.DisplayText,
        }));
        setItemCategoryOptions(options);
      } catch {
        console.error("Error fetching item category options");
        setItemCategoryOptions([]);
      }
    };
    fetchItemCategoryOptions();
  }, []);

  // clearFieldError not used; removed to satisfy linter

  // API submit handler
  const handleSubmit = async (values) => {
    try {
      // Validate shelfLife only on submit
      if (values.shelfLife !== null && values.shelfLife !== undefined && values.shelfLife !== "") {
        const numValue = Number(values.shelfLife);
        if (numValue === 0) {
          setShelfLifeError("Shelf Life Should Be Greater Than 0.");
          return; // Prevent submission
        }
      }
      setShelfLifeError(""); // Clear error if validation passes
      setSubmitting(true);

      const toNum = (v) =>
        v === "" || v === null || v === undefined ? 0 : Number(v) || 0;

      // Get itemID from initialData or values if updating
      const itemID = initialData?.itemID || initialData?.item_id || values.itemID || values.item_id || 0;

      // Normalize status value (handle both object and primitive)
      const getStatusValue = (val) => {
        if (val == null || val === "") return 1;
        if (typeof val === "object" && val.value !== undefined) {
          return Number(val.value);
        }
        return Number(val);
      };


      // Build payload according to API structure
      // Always send "ADD" as paramType even when updating (as per API requirement)
      const isUpdate = initialData && (initialData.itemID || initialData.item_id);

      const payload = {
        itemID: toNum(itemID),
        itemCode: values.itemName || values.itemCode || "",
        itemDescription: values.itemDescription || "",
        itemUnit: values.priUnit || "",
        reorderLevel: toNum(values.itemROL),
        minimumStockLevel: toNum(values.itemMinimumQuantity),
        location: values.location || "",
        itemStatus: getStatusValue(values.valid),
        lastTransactionDate: values.lastTransactionDate || "",
        itemRemarks: values.remarks || "",
        preparedBy: getPreparedBy(),
        updatedBy: isUpdate ? getPreparedBy() : "",
        shelfLifeDays: toNum(values.shelfLife),
        hsnid: toNum(values.hsnid),
        paramType: "ADD", // Always send "ADD" even when updating
      };

      // Convert empty strings to empty strings (API expects empty string, not null)
      Object.keys(payload).forEach((k) => {
        if (payload[k] === null) payload[k] = "";
      });

      const result = await saveAndUpdateInventoryMaster(payload);

      const validationErrors = result?.data?.ValidationErrors;
      const inventoryMasterMessages = result?.data?.INVENTORY_MASTER_RESPONSE;
      const status = result?.Status;

      // Handle validation errors using utility function
      if (handleApiValidationErrors(validationErrors, showToast)) {
        setSubmitting(false);
        return;
      }

      let message = "";
      if (inventoryMasterMessages?.length > 0) {
        message = inventoryMasterMessages.map((e) => e.Message).join(" ");
      }

      if (message) {
        const toastType =
          status === SUCCESS_STATUS || status === MESSAGE_OK ? SUCCESS_STATUS : ERROR_STATUS.toLowerCase();

        if (showToast) showToast(message.trim(), toastType);

        if (toastType === ERROR_STATUS.toLowerCase()) {
          setSubmitting(false);
          return;
        }
      }

      if (status === SUCCESS_STATUS || status === MESSAGE_OK) {
        // Reset dirty state before closing to prevent unsaved changes popup
        setIsDirty(false);
        resetDirty();
        if (onDirtyChange) {
          onDirtyChange(false);
        }

        // Fetch the full details of the new/updated item
        const newId = inventoryMasterMessages?.[0]?.ID;
        if (newId) {
          try {
            const detailsResult = await fetchInventoryDetails(newId);
            const newItem = detailsResult?.data?.INVENTORY_DETAILS_RESPONSE?.[0];
            if (newItem) {
              onSuccess?.(newItem);
            } else {
              onSuccess?.({
                item_id: newId,
                itemID: newId,
                ID: newId,
                item_code: payload.itemCode,
                itemCode: payload.itemCode,
                item_description: payload.itemDescription,
                itemDescription: payload.itemDescription,
                ...payload,
              });
            }
          } catch (err) {
            console.error("Error fetching updated details:", err);
            if (err?.response?.status === 401) {
              window.dispatchEvent(new Event("sessionExpired"));
              setSubmitting(false);
              return;
            }
            // Fallback: pass the payload with the new ID mapped to API response format
            onSuccess?.({
              item_id: newId,
              itemID: newId,
              ID: newId,
              item_code: payload.itemCode,
              itemCode: payload.itemCode,
              item_description: payload.itemDescription,
              itemDescription: payload.itemDescription,
              ...payload,
            });
          }
        } else {
          // Fallback: pass the payload if no ID is returned, but try to extract ID from response
          const fallbackId = inventoryMasterMessages?.[0]?.itemID ||
            inventoryMasterMessages?.[0]?.item_id;
          onSuccess?.({
            item_id: fallbackId,
            itemID: fallbackId,
            item_code: payload.itemCode,
            itemCode: payload.itemCode,
            item_description: payload.itemDescription,
            itemDescription: payload.itemDescription,
            ...payload,
          });
        }
        onClose?.();
        setSubmitting(false);
        return;
      }

      if (showToast) {
        showToast("Unexpected response from server", ERROR_STATUS.toLowerCase());
      }
      setSubmitting(false);
    } catch (err) {
      console.error("Error saving inventory item:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Error saving inventory item";
      showToast(errorMessage, ERROR_STATUS.toLowerCase());
      setSubmitting(false);
    }
  };

  // Ref for ValidatedForm to trigger submit from RightDrawer header
  const validatedFormRef = useRef();
  const handleDrawerSave = () => {
    if (validatedFormRef.current) {
      validatedFormRef.current.submitForm();
    } else {
      console.error("ValidatedForm ref is null");
    }
  };

  // Build options for multi-column dropdown from raw HSN list
  const hsnMultiOptions = React.useMemo(
    () =>
      (HSNOptions || []).map((item) => ({
        value: String(item.hsn_id),
        label: `${item.hsn_code} - ${item.text}`,
        data: {
          hsn_code: item.hsn_code,
          text: item.text,
        },
      })),
    [HSNOptions]
  );

  // Columns refer to `data` keys above
  const idTextColumns = React.useMemo(
    () => [
      // Keep both columns evenly distributed across the dropdown width
      { key: "hsn_code", header: "HSN CODE", flex: true, align: "center" },
      { key: "text", header: "DESCRIPTION", flex: true, align: "center" },
    ],
    []
  );

  // const itemCategoryOptions = [
  //   { value: "None", label: "None" },
  //   { value: "Class A", label: "Class A" },
  //   { value: "Class B", label: "Class B" },
  //   { value: "Class C", label: "Class C" },
  // ];

  const rightDrawerProps = {
    ...dirtyDrawerProps,
    open,
    onClose,
    title: initialData
      ? editMode
        ? "Edit Inventory"
        : "Edit Inventory"
      : "Add Inventory",
    disableTabCloseConfirm: !!initialData && !editMode && !isDirty,
    onSave: editMode ? handleDrawerSave : undefined,
    showEdit: !!initialData && !editMode && !disabled,
    onEdit: () => {
      setEditMode(true);
      if (onEdit) onEdit();
    },
    disableEdit: !!initialData && editMode,
    onDisableEdit: () => {
      setEditMode(false);
      if (onDisableEdit) onDisableEdit();
    },
    tabKey: "inventorymaster",
  };
  return (
    <RightDrawer {...rightDrawerProps}>
      <FullPageLoader
        loading={submitting}
        message="Saving inventory item..."
        logoSrc={inspireLogo}
      />
      <div style={{ width: "100%", margin: "0 auto" }}>
        <ValidatedForm
          key={(initialData || initialDataRef.current)?.itemCode ||
            (initialData || initialDataRef.current)?.itemID ||
            (initialData || initialDataRef.current)?.item_id ||
            "new"} // Force re-render when item changes
          ref={validatedFormRef}
          initialValues={initialValues}
          validation={validation}
          onSubmit={handleSubmit}
          onValuesChange={onValuesChange}
          enableDraft={!initialData}
          draftKey={"draft_inventory_create"}
          clearDraftOnSubmit
        >
          {({ values, errors, handleChange, handleBlur }) => {
            return (
              <>
                <div>
                  {/* Row 1: Item Code, HSN Type, Status */}
                  <div className="row mb-2">
                    <div className="col-md-4">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ flexGrow: 1 }}>
                          <FormField
                            label="Item Code"
                            name="itemName"
                            maxLength={25}
                            value={values.itemName}
                            onChange={(e) => {
                              // Uppercase the value without mutating the original event
                              const uppercasedValue = e.target.value.toUpperCase();
                              handleChange({
                                target: {
                                  name: e.target.name,
                                  value: uppercasedValue
                                }
                              });
                            }}
                            onBlur={async (e) => {
                              handleBlur(e);

                              const itemCode = e.target.value?.trim();
                              if (!itemCode) return;

                              try {
                                const { message } =
                                  await checkInventoryItemCodeExist(itemCode);

                                if (message && message !== "No Data Available !!!") {
                                  // Duplicate detected: clear field and show error
                                  handleChange({
                                    target: { name: "itemName", value: "" },
                                  });
                                  showToast(message, ERROR_STATUS.toLowerCase());
                                }
                              } catch (error) {
                                console.error(
                                  "Error checking item code:",
                                  error
                                );
                                // On error: clear field and show error
                                handleChange({
                                  target: { name: "itemName", value: "" },
                                });
                                showToast(
                                  "Failed to validate item code. Please try again.",
                                  ERROR_STATUS.toLowerCase()
                                );
                              }
                            }}
                            error={errors.itemName}
                            required
                            disabled={!!initialData}
                          />
                        </div>

                        <CopyButton
                          text={values.itemName}
                          tooltip="By clicking this Item Code will be copied and you can paste it wherever you want."
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <CustomMultiColumnDropdown
                        placeholder="Select HSN Code"
                        classNamePrefix="react-select"
                        label="HSN Code"
                        name="hsnid"
                        required
                        error={errors.hsnid}
                        options={hsnMultiOptions}
                        columns={idTextColumns}
                        onDropdownIndicatorClick={() => { }}
                        value={values.hsnid}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isDisabled={!editMode}
                      />
                    </div>

                    <div className="col-md-4">
                      <ReactSelectField
                        label="Status"
                        name="valid"
                        options={statusOptions}
                        value={values.valid}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.valid}
                        required
                        disabled={!editMode}
                      />
                      {errors.valid && (
                        <div className="text-danger small">
                          {errors.valid}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Description */}
                  <div className="row mb-2">
                    <div className="col-md-12">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ flexGrow: 1 }}>
                          <TextAreaFormField
                            label="Description"
                            name="itemDescription"
                            rows="3"
                            value={values.itemDescription}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onFocus={(e) => clearFieldError(e.target.name)}
                            error={errors.itemDescription}
                            required
                            disabled={!editMode}
                          />
                        </div>
                        <CopyButton
                          text={values.itemDescription}
                          tooltip="By clicking this Item Description will be copied and you can paste it wherever you want."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Unit, Shelf Life, Re-Order Level, Min. Stock */}
                  <div className="row mb-2">
                    <div className="col-md-3">
                      <EditableSelectField
                        label="Unit"
                        name="priUnit"
                        value={values.priUnit || "NOS"}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        options={UNIT_OPTIONS}
                        placeholder="Select unit..."
                        error={errors.priUnit}
                        required
                        disabled={!editMode}
                        inputTransform={(value) => value ? value.toUpperCase() : value}
                      />
                    </div>

                    <div className="col-md-3">
                      <FormField
                        label="Shelf Life (Days)"
                        name="shelfLife"
                        type="number"
                        value={values.shelfLife ?? ""}
                        onChange={(e) => {
                          handleChange(e);
                          // Clear error when user starts typing
                          if (shelfLifeError) {
                            setShelfLifeError("");
                          }
                        }}
                        error={shelfLifeError || errors.shelfLife}
                        // onFocus={(e) => clearFieldError(e.target.name)}
                        onFocus={(e) => {
                          clearFieldError(e.target.name);
                          try {
                            e.target.select();
                          } catch (error) {
                            console.error("Error selecting text:", error);
                          }
                        }}
                        onBlur={handleBlur}
                        disabled={!editMode}
                      />
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Re-Order Level</label>

                      <NumericEditor
                        className={`form-control${errors.itemROL ? " is-invalid" : ""
                          }`}
                        name="itemROL"
                        value={values.itemROL}
                        onChange={(valOrEvent) => {
                          const value =
                            valOrEvent &&
                              typeof valOrEvent === "object" &&
                              "target" in valOrEvent
                              ? valOrEvent.target.value
                              : valOrEvent;
                          handleChange({
                            target: { name: "itemROL", value },
                          });
                        }}
                        onBlur={handleBlur}
                        row={values}
                        isNew={false}
                        precision={10}
                        scale={2}
                        decimals={2}
                        defaultValue="0.00"
                        enforceDefaultOnEmpty
                        disabled={!editMode}
                        style={{
                          textAlign: "right",
                          height: "38px",
                          minHeight: "38px",
                        }}
                        onFocus={() => clearFieldError("itemROL")}
                      />

                      {errors.itemROL && (
                        <div className="invalid-feedback d-block">
                          {errors.itemROL}
                        </div>
                      )}
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Min. Stock</label>

                      <NumericEditor
                        className={`form-control${errors.itemMinimumQuantity ? " is-invalid" : ""
                          }`}
                        name="itemMinimumQuantity"
                        value={values.itemMinimumQuantity}
                        onChange={(valOrEvent) => {
                          const value =
                            valOrEvent &&
                              typeof valOrEvent === "object" &&
                              "target" in valOrEvent
                              ? valOrEvent.target.value
                              : valOrEvent;
                          handleChange({
                            target: { name: "itemMinimumQuantity", value },
                          });
                        }}
                        onBlur={handleBlur}
                        row={values}
                        isNew={false}
                        precision={10}
                        scale={2}
                        decimals={2}
                        defaultValue="0.00"
                        enforceDefaultOnEmpty
                        disabled={!editMode}
                        style={{
                          textAlign: "right",
                          height: "38px",
                          minHeight: "38px",
                        }}
                        onFocus={() => clearFieldError("itemMinimumQuantity")}
                      />

                      {errors.itemMinimumQuantity && (
                        <div className="invalid-feedback d-block">
                          {errors.itemMinimumQuantity}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Location, Last Tran. Date, Remarks */}
                  <div className="row mb-2">

                    <div className="col-md-3">
                      <FormField
                        label="Location"
                        name="location"
                        value={values.location}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={!editMode}
                      />
                    </div>

                    <div className="col-md-6">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ flexGrow: 1 }}>
                          <TextAreaFormField
                            label="Remarks"
                            name="remarks"
                            rows="3"
                            value={values.remarks}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.remarks}
                            disabled={!editMode}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <FormField
                        label="Last Tran. Date"
                        name="lastTransactionDate"
                        type="date"
                        value={values.lastTransactionDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        // disabled={!editMode}
                        disabled={true}
                      />
                    </div>
                  </div>



                  {/* Row 5: Prep By, Date */}
                  <div className="row mb-2">
                    <div className="col-md-3">
                      <FormField
                        label="Prep By"
                        name="preparedBy"
                        value={values.preparedBy}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>

                    <div className="col-md-3">
                      <FormField
                        label="Date"
                        name="entryDate"
                        type="date"
                        value={values.entryDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>

                    <div className="col-md-3">
                      <FormField
                        label="Updated By"
                        name="updatedBy"
                        value={values.updatedBy}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>

                    <div className="col-md-3">
                      <FormField
                        label="Date"
                        name="updatedDate"
                        type="date"
                        value={values.updatedDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>
                  </div>
                </div>
              </>
            );
          }}
        </ValidatedForm>

        <style>{`
  /* Remove number input spinners in Chrome, Safari, Edge, Opera */
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Remove number input spinners in Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }

  /* Force dropdown option colors for Inventory Master page */
  /* Focused option (keyboard / mouse) - no background, only hover shows color */
  .react-select__option--is-focused:not(.react-select__option--is-selected) {
  background-color: transparent !important;
  color: inherit !important;
}

  /* Hover state - only show when actually hovering */
.react-select__option:hover:not(.react-select__option--is-selected) {
  background-color: #F2F2F2 !important;
  color: #222 !important;
}

/* Selected option */
.react-select__option--is-selected {
  background-color: #E0E0E0 !important;
  color: #222 !important;
  // font-weight: 500;
}

/* Selected + focused - show selected background even when focused */
.react-select__option--is-selected.react-select__option--is-focused {
  background-color: #E0E0E0 !important;
  color: #222 !important;
}

/* Hover on selected item */
.react-select__option--is-selected:hover {
  background-color: #D0D0D0 !important;
  color: #222 !important;
}

/* Active (mouse click) */
.react-select__option:active {
  background-color: #C8C8C8 !important;
  color: #111 !important;
}

`}</style>

      </div>
    </RightDrawer>
  );
};

export default SaveOrUpdateInventoryMaster;

