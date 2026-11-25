import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  FormField,
  TextAreaFormField,
  ReactSelectField,
} from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import RightDrawer from "../../components/RightDrawer";
import { useToast } from "../../components/useToast";
import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
import "../../lib/axiosSetup";
import NumericEditor from "../../components/NumericEditor";
import { CustomMultiColumnDropdown } from "../../components/CustomVendorDropdown";
import {
  getStatusOptions,
  getHSNType,
  saveAndUpdateFGInventory,
  fetchFGInventoryDetails,
  checkFGInventoryItemCodeExist,
} from "../../services/fgInventoryMasterService.js";
import CopyButton from "../../components/CopyButton.jsx";

import { getPreparedBy } from "../../utils/userSession";
import { handleApiValidationErrors } from "../../utils/CustomValidation.js";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS } from "../../utils/ConstVariables";
import FullPageLoader from "../../components/FullPageLoader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";


const today = new Date().toISOString().split("T")[0];

const initialForm = {
  itemID: 0,
  itemCode: "",
  itemDescription: "",
  itemStatus: "1",
  valid: "1",
  itemUnit: "NOS",
  minStockLevel: 0,
  reorderLevel: 0,
  location: "",
  lastTransactionDate: "",
  itemRemarks: "",
  shelfLife: "",
  shelfLifeDays: "",
  preparedBy: getPreparedBy(),
  entryDate: today,
  updatedBy: "",
  updatedDate: "",
  hsnid: "",
  paramType: "ADD",
};

const validation = {
  itemCode: { required: true, fieldLabel: "Item Code" },
  itemDescription: { required: true, fieldLabel: "Description" },
  itemUnit: { required: true, fieldLabel: "Unit", controlType: "select" },
  valid: { required: true, fieldLabel: "Status", controlType: "select" },
  hsnid: { required: true, fieldLabel: "HSN Code", controlType: "select" },
};

export default function SaveOrUpdateFGInventory({
  open,
  onClose,
  initialData,
  onSuccess,
  disabled = false,
  initialEditMode = false,
  onEdit,
  onDirtyChange,
}) {
  const { showToast } = useToast();

  const [editMode, setEditMode] = useState(initialEditMode && !disabled);
  const [submitting, setSubmitting] = useState(false);

  // Dropdowns
  const [statusOptions, setStatusOptions] = useState([]);
  const [HSNOptions, setHSNTypeOptions] = useState([]);
  const [shelfLifeError, setShelfLifeError] = useState("");

  // Track original status from backend to enforce transition rules
  const originalStatusRef = useRef(null);
  const originalChangeRequiredRef = useRef(null);

  const validatedFormRef = useRef();

  // Ref to preserve initialData even during re-renders (e.g., when dialog opens)
  const initialDataRef = useRef(initialData);

  // Update ref when initialData changes
  useEffect(() => {
    if (initialData) {
      initialDataRef.current = initialData;
    }
  }, [initialData]);

  // Memoize initialValues - compute mapped data directly from initialData
  const initialValues = useMemo(() => {
    // Use ref as fallback to ensure data is always available
    const dataToUse = initialData || initialDataRef.current;

    if (dataToUse) {
      const statusValue = String(dataToUse.item_status ?? 1);
      return {
        ...initialForm,
        itemID: dataToUse.fg_item_id ?? 0,
        itemCode: dataToUse.item_code || "",
        itemStatus: statusValue,
        valid: statusValue,
        itemDescription: dataToUse.item_description || "",
        itemUnit: dataToUse.item_unit || "NOS",
        minStockLevel: dataToUse.min_stock_level || 0,
        reorderLevel: dataToUse.reorder_level || 0,
        location: dataToUse.location || "",
        lastTransactionDate: dataToUse.lasttran_date
          ? dataToUse.lasttran_date.split("T")[0]
          : "",
        shelfLife: (dataToUse.shelf_life_days === 0 || dataToUse.shelf_life_days === "0" || !dataToUse.shelf_life_days) ? "" : dataToUse.shelf_life_days,
        itemRemarks: dataToUse.item_remarks || "",
        preparedBy: dataToUse.prep_by || dataToUse.preparedBy || "",
        entryDate: (dataToUse.prep_date || dataToUse.entry_date || dataToUse.prepDate || dataToUse.entryDate)
          ? String(dataToUse.prep_date || dataToUse.entry_date || dataToUse.prepDate || dataToUse.entryDate).split("T")[0]
          : "",
        updatedDate: (dataToUse.updated_date || dataToUse.updatedDate || dataToUse.update_date)
          ? String(dataToUse.updated_date || dataToUse.updatedDate || dataToUse.update_date).split("T")[0]
          : "",
        updatedBy: dataToUse.updated_by || dataToUse.updatedBy || "",
        hsnid: String(
          dataToUse.hsn_id ??
          dataToUse.cc_hsn_code ??
          dataToUse.hsn_code ??
          ""
        ),
        paramType: "ADD",
      };
    } else {
      return { ...initialForm, paramType: "ADD", followFIFO: true };
    }
  }, [initialData]);

  const {
    isDirty,
    onValuesChange,
    rightDrawerProps: dirtyDrawerProps,
    setIsDirty,
    resetDirty,
  } = useDirtyDraftDrawer({
    open,
    initialValues,
    initialData: initialData || initialDataRef.current,
    draftKey: "draft_fg_inventory_create",
  });

  // Notify parent component of dirty state changes
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  // Update status refs when initialData changes
  useEffect(() => {
    if (initialData) {
      try {
        const statusValue = String(initialData.item_status ?? 1);
        originalStatusRef.current = statusValue;
      } catch {
        originalStatusRef.current = null;
      }
      try {
        originalChangeRequiredRef.current = String(
          initialData.change_required ?? ""
        );
      } catch {
        originalChangeRequiredRef.current = null;
      }
    } else {
      originalStatusRef.current = String(initialForm.itemStatus ?? "");
      originalChangeRequiredRef.current = null;
    }
  }, [initialData]);


  const handleEdit = () => {
    if (disabled) return;
    setEditMode(true);
    if (onEdit) onEdit();
  };

  useEffect(() => {
    if (!open) return;
    setEditMode(!initialData && !disabled);
  }, [open, initialData, disabled]);

  // Dropdown loader
  useEffect(() => {
    let isMounted = true;

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

    const loadDropdowns = async () => {
      try {
        const [statusRes, hsnRes] = await Promise.all([
          getStatusOptions(),
          getHSNType(),
        ]);

        if (!isMounted) return;

        const statusList = normalizeDropdownList(statusRes);
        const hsnList = normalizeDropdownList(hsnRes);

        setStatusOptions(
          statusList.map((item) => ({
            value: String(item.ValueText ?? item.value ?? item.StatusID),
            label: item.DisplayText ?? item.label ?? item.StatusName,
          }))
        );

        // store raw HSN items (hsn_id, hsn_code, text)
        setHSNTypeOptions(hsnList);
      } catch (error) {
        console.error("Error loading Status / HSN options:", error);
        showToast("Failed to load dropdowns", ERROR_STATUS.toLowerCase());
      }
    };

    loadDropdowns();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleDrawerSave = () => {
    if (validatedFormRef.current) {
      validatedFormRef.current.submitForm();
    }
  };

  function mapFormToApi(values) {
    const isUpdate = Boolean(
      initialData || initialDataRef.current || Number(values.itemID) > 0
    );

    return {
      fgItemID: Number(values.itemID) || 0,
      itemCode: values.itemCode,
      itemDescription: values.itemDescription,
      itemUnit: values.itemUnit || "NOS",

      reorderLevel:
        values.reorderLevel === "" || values.reorderLevel == null
          ? 0
          : Number(values.reorderLevel),
      minStockLevel:
        values.minStockLevel === "" || values.minStockLevel == null
          ? 0
          : Number(values.minStockLevel),

      location: values.location,
      itemStatus: (() => {
        const raw =
          values.valid !== undefined && values.valid !== null && values.valid !== ""
            ? values.valid
            : values.itemStatus;

        if (raw === undefined || raw === null || raw === "") return 1;
        if (typeof raw === "object" && raw.value !== undefined) {
          return Number(raw.value);
        }
        return Number(raw);
      })(),
      itemRemarks: values.itemRemarks,
      preparedBy: getPreparedBy(),
      updatedBy: isUpdate ? getPreparedBy() : "",

      shelfLifeDays:
        values.shelfLife === "" || values.shelfLife == null
          ? 0
          : Number(values.shelfLife),

      ParamType: values.paramType,
      lastTransactionDate: values.lastTransactionDate || "",
      // send numeric hsnid (HSN primary key) to API
      hsnid: Number(values.hsnid) || 0,
    };
  }

  // Build options for multi-column dropdown from raw HSN list
  const hsnMultiOptions = useMemo(
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
  const idTextColumns = useMemo(
    () => [
      // Keep both columns evenly distributed across the dropdown width
      { key: "hsn_code", header: "HSN CODE", flex: true, align: "center" },
      { key: "text", header: "DESCRIPTION", flex: true, align: "center" },
    ],
    []
  );

  // Utility: normalize any status value to string


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

      const payload = mapFormToApi(values);
      const res = await saveAndUpdateFGInventory(payload);

      const validationErrors = res?.data?.ValidationErrors;
      const fgInventoryMessages = res?.data?.FG_INVENTORY_RESPONSE;
      const status = res?.Status;
      if (handleApiValidationErrors(validationErrors, showToast)) {
        setSubmitting(false);
        return;
      }
      let message = "";
      if (fgInventoryMessages?.length > 0) {
        message += fgInventoryMessages.map((e) => e.Message).join(" ");
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

      // If SUCCESS, fetch updated details and close drawer
      if (status === SUCCESS_STATUS || status === MESSAGE_OK) {
        // Reset dirty state before closing to prevent unsaved changes popup
        setIsDirty(false);
        resetDirty();
        if (onDirtyChange) {
          onDirtyChange(false);
        }

        try {
          const newId = fgInventoryMessages?.[0]?.ID;
          const detailRes = await fetchFGInventoryDetails(newId);

          const details = detailRes?.data?.FG_INVENTORY_DETAILS_RESPONSE?.[0];

          if (onSuccess) onSuccess(details || payload);
        } catch (err) {
          if (onSuccess) onSuccess(payload);
          if (err?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
            setSubmitting(false);
            return;
          }
          const msg = err?.message || "Error saving FG Inventory";
          if (showToast) showToast(msg, ERROR_STATUS.toLowerCase());
        }

        if (onClose) onClose();
        setSubmitting(false);
        return;
      }

      // Handle unexpected scenario
      showToast("Unexpected response from server", ERROR_STATUS.toLowerCase());
      setSubmitting(false);
    } catch (err) {
      console.error("Error saving FG Inventory item:", err);
      showToast("Error saving FG Inventory item", ERROR_STATUS.toLowerCase());
      setSubmitting(false);
    }
  };

  const clearFieldError = () => { };

  const rightDrawerProps = {
    ...dirtyDrawerProps,
    open,
    onClose,
    title:
      initialData
        ? editMode
          ? "Edit FG Inventory"
          : "Edit FG Inventory"
        : "Add FG Inventory",
    onSave: editMode ? handleDrawerSave : undefined,
    showEdit: !!initialData && !editMode && !disabled,
    onEdit: handleEdit,
    disableEdit: !!initialData && editMode,
    onDisableEdit: () => setEditMode(false),
    tabKey: "fginventorymaster",
  };

  return (
    <RightDrawer {...rightDrawerProps}>
      <FullPageLoader
        loading={submitting}
        message="Saving finished goods item..."
        logoSrc={inspireLogo}
      />
      <div style={{ width: "100%", margin: "0 auto" }}>
        <ValidatedForm
          key={initialData?.fg_item_id || initialValues.itemID || "new"}
          ref={validatedFormRef}
          initialValues={initialValues}
          validation={validation}
          onSubmit={handleSubmit}
          onValuesChange={onValuesChange}
          enableDraft={!initialData}
          draftKey={"draft_fg_inventory_create"}
          clearDraftOnSubmit
        >
          {({ values, errors, handleChange, handleBlur }) => {

            return (
              <>
                <div>
                  {/* Row 1 */}
                  <div className="row mb-2">
                    <div className="col-md-4">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ flexGrow: 1 }}>
                          <FormField
                            label="Item Code"
                            name="itemCode"
                            maxLength={25}
                            value={values.itemCode}
                            onChange={(e) => {
                              e.target.value = e.target.value.toUpperCase();
                              handleChange(e);
                            }}
                            onBlur={async (e) => {
                              handleBlur(e);

                              const itemCode = e.target.value?.trim();
                              if (!itemCode) return;

                              try {
                                const { message } =
                                  await checkFGInventoryItemCodeExist(itemCode);

                                if (message && message !== "No Data Available !!!") {
                                  // Duplicate detected: clear field and show error
                                  handleChange({
                                    target: { name: "itemCode", value: "" },
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
                                  target: { name: "itemCode", value: "" },
                                });
                                showToast(
                                  "Failed to validate item code. Please try again.",
                                  ERROR_STATUS.toLowerCase()
                                );
                              }
                            }}
                            error={errors.itemCode}
                            required
                            disabled={!!initialData}
                          />
                        </div>

                        <CopyButton
                          text={values.itemCode}
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

                    {/* <div className="col-md-4">
                      <ReactSelectField
                        label="Status"
                        name="itemStatus"
                        options={statusOptions}
                        required
                        value={currentStatus}
                        getOptionValue={(opt) => String(opt?.value ?? "")}
                        getOptionLabel={(opt) => String(opt?.label ?? "")}
                        isOptionDisabled={(opt) => {
                          const optionVal = getStatusValue(opt);
                          const blockDiscToValid =
                            (currentStatus === "0" || originalStatus === "0") &&
                            optionVal === "1" &&
                            !canDiscontinueToValid;

                          const blockSpecToValid =
                            (currentStatus === "5" || originalStatus === "5") &&
                            optionVal === "1" &&
                            !canSpecialToValid;

                          const blockValidToDisc =
                            (currentStatus === "1" || originalStatus === "1") &&
                            optionVal === "0" &&
                            !canDiscontinueToValid;

                          const blockValidToSpec =
                            (currentStatus === "1" || originalStatus === "1") &&
                            optionVal === "5" &&
                            !canSpecialToValid;

                          return (
                            blockDiscToValid ||
                            blockSpecToValid ||
                            blockValidToDisc ||
                            blockValidToSpec
                          );
                        }}
                        onChange={(val) => {
                          const next = getStatusValue(val);

                          if (
                            (currentStatus === "0" || originalStatus === "0") &&
                            next === "1" &&
                            !canDiscontinueToValid
                          ) {
                            showToast(
                              "Not allowed to change status from Discontinued to Valid",
                              "error"
                            );
                            return;
                          }

                          if (
                            (currentStatus === "5" || originalStatus === "5") &&
                            next === "1" &&
                            !canSpecialToValid
                          ) {
                            showToast(
                              "Not allowed to change status from special category item to valid",
                              "error"
                            );
                            return;
                          }

                          handleChange({
                            target: { name: "itemStatus", value: next },
                          });
                        }}
                        onBlur={handleBlur}
                        disabled={!editMode}
                      />
                      {errors.itemStatus && (
                        <div className="text-danger small">
                          {errors.itemStatus}
                        </div>
                      )}
                      {currentStatus === "2" && (
                        <span style={{ fontWeight: 500 }}>
                          Obsoleted By : {getEmployeeDeptName()}
                        </span>
                      )}
                    </div> */}
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
                  </div>

                  {/* Row 2 */}
                  <div className="row mb-2">
                    <div className="col-md-3">
                      <FormField
                        label="Unit"
                        name="itemUnit"
                        value={values.itemUnit}
                        onChange={(e) => {
                          const uppercasedValue = e.target.value.toUpperCase();
                          handleChange({
                            target: {
                              name: e.target.name,
                              value: uppercasedValue
                            }
                          });
                        }}
                        onBlur={handleBlur}
                        onFocus={(e) => clearFieldError(e.target.name)}
                        error={errors.itemUnit}
                        required
                        disabled={!editMode}
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
                        onFocus={(e) => {
                          clearFieldError(e.target.name);
                          try {
                            e.target.select();
                          } catch (err) {
                            console.error("Error selecting text:", err);
                          }
                        }}
                        onBlur={handleBlur}
                        disabled={!editMode}
                      />
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Re-Order Level</label>

                      <NumericEditor
                        className={`form-control${errors.reorderLevel ? " is-invalid" : ""
                          }`}
                        name="reorderLevel"
                        value={values.reorderLevel}
                        onChange={(valOrEvent) => {
                          const value =
                            valOrEvent &&
                              typeof valOrEvent === "object" &&
                              "target" in valOrEvent
                              ? valOrEvent.target.value
                              : valOrEvent;
                          handleChange({
                            target: { name: "reorderLevel", value },
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
                        onFocus={() => clearFieldError("reorderLevel")}
                      />

                      {errors.reorderLevel && (
                        <div className="invalid-feedback d-block">
                          {errors.reorderLevel}
                        </div>
                      )}
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Min. Stock</label>
                      <NumericEditor
                        className={`form-control${errors.minStockLevel ? " is-invalid" : ""
                          }`}
                        name="minStockLevel"
                        value={values.minStockLevel}
                        onChange={(valOrEvent) => {
                          const value =
                            valOrEvent &&
                              typeof valOrEvent === "object" &&
                              "target" in valOrEvent
                              ? valOrEvent.target.value
                              : valOrEvent;
                          handleChange({
                            target: { name: "minStockLevel", value },
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
                        onFocus={() => clearFieldError("minStockLevel")}
                      />

                      {errors.minStockLevel && (
                        <div className="invalid-feedback d-block">
                          {errors.minStockLevel}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3 */}
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
                            name="itemRemarks"
                            rows="3"
                            value={values.itemRemarks}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.itemRemarks}
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
                        disabled={true}
                      />
                    </div>
                  </div>

                  {/* Row 4 */}
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
          input[type=number]::-webkit-outer-spin-button,
          input[type=number]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
        `}</style>
      </div>
    </RightDrawer>
  );
}
