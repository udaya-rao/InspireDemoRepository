import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  FormField,
  TextAreaFormField,
  ReactSelectField,
} from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import useDirtyDraftDrawer from "../../hooks/useDirtyDraftDrawer";
import { useToast } from "../../components/useToast";
import Loader from "../../components/Loader";
import { getPreparedBy } from "../../utils/userSession";
import { SUCCESS_STATUS } from "../../utils/ConstVariables";
import {
  saveAndUpdateSupplierItem,
  fetchSupplierItemDetails,
  fetchSupplierItemCurrencies,
  fetchSupplierItemSuppliers,
  fetchSupplierItemInventoryItems,
} from "../../services/supplierItemService";
import {
  DOC_STATUS,
  PARAM_TYPE,
  DRAFT_KEY,
  UNIT_RATE_PATTERN,
  initialForm,
  today,
  NEW_RECORD_STATUS_TEXT,
  SUPPLIER_ITEM_FORM_STYLES,
} from "../../utils/constants/SupplierItemConstants";
import { PaginatedSearchSelect } from "../../components/PaginatedSearchSelect";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import FullPageLoader from "../../components/FullPageLoader";

// ─────────────────────────────────────────────────────────────────────────────
// Module-level helpers (pure — kept outside the component body)
// ─────────────────────────────────────────────────────────────────────────────

const dateOnly = (v) => (v ? String(v).split("T")[0] : "");

// Builds the form's initialValues from the record (fetched details merged over
// the list row) or, for a new record, from the saved draft / blank form.
const buildSupplierItemInitialValues = (src, baseForm) => {
  if (src) {
    return {
      ...baseForm,
      ...src,
      supplierItemID: src.supplier_item_id || 0,
      supplierID: src.supplier_id ?? "",
      supplierName: src.supplier_name || "",
      itemID: src.item_id ?? "",
      itemCode: src.item_code || "",
      itemDescription: src.item_description || "",
      itemUnit: src.item_unit || "",
      supplierItemCode: src.supplier_item_code || "",
      currencyID: src.currency_id ?? "",
      currencyCode: src.currency_code || "",
      unitRate: src.unit_rate != null ? String(src.unit_rate) : "",
      validToDate: dateOnly(src.valid_to_date),
      purchaseNotes: src.purchase_notes || "",
      docStatus: src.doc_status ?? 0,
      docStatusText: src.doc_status_text || NEW_RECORD_STATUS_TEXT,
      prepBy: src.prep_by || getPreparedBy(),
      prepDate: src.prep_date ? dateOnly(src.prep_date) : today,
      updateBy: src.update_by || "",
      updateDate: dateOnly(src.update_date),
      approvedBy: src.approved_by || "",
      approvedDate: dateOnly(src.approved_date),
    };
  }

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return { ...baseForm, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to read Supplier Item draft", e);
  }
  return { ...baseForm };
};

// Paged supplier lookup (stable reference — no component state used).
const fetchSuppliersPaged = async ({ page, pageSize, searchText }) => {
  const res = await fetchSupplierItemSuppliers({
    pageNumber: page,
    pageSize,
    searchKeyword: searchText || "",
  });
  const list = res?.data?.SUPPLIER_MASTER_IN_SUPPLIER_ITEM_LIST || [];
  const total = res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords ?? null;
  const options = list.map((s) => ({
    value: s.ValueText,
    label: s.DisplayText,
    raw: s,
  }));
  return {
    options,
    hasMore:
      total !== null
        ? (page + 1) * pageSize < total
        : options.length >= pageSize,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const SaveOrUpdateSupplierItem = forwardRef(
  (
    {
      onSuccess,
      initialData,
      editMode: editModeProp,
      onDirtyChange,
      disabled,
      onValuesChange,
      open = true,
    },
    ref,
  ) => {
    const { showToast } = useToast();
    const isCreate = !initialData;

    const editMode = disabled
      ? false
      : editModeProp === undefined
        ? isCreate
        : editModeProp;
    const isDisabled = initialData ? !editMode : false;

    // ── State / refs ────────────────────────────────────────────────────────
    const validatedFormRef = useRef();
    const fetchedIdRef = useRef(null);
    const onDirtyChangeRef = useRef(onDirtyChange);

    const [submitting, setSubmitting] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [fetchedData, setFetchedData] = useState(null);
    const [currencyOptions, setCurrencyOptions] = useState([]);
    const [itemOptions, setItemOptions] = useState([]);

    const itemById = useMemo(() => {
      const map = new Map();
      itemOptions.forEach((o) => map.set(String(o.value), o.raw));
      return map;
    }, [itemOptions]);

    useEffect(() => {
      onDirtyChangeRef.current = onDirtyChange;
    }, [onDirtyChange]);

    // ── Effects: lookups (loaded once) ──────────────────────────────────────
    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const data = await fetchSupplierItemCurrencies();
          if (!cancelled && Array.isArray(data)) {
            setCurrencyOptions(
              data.map((i) => ({ value: i.ValueText, label: i.DisplayText })),
            );
          }
        } catch (error) {
          console.error("Error fetching Currencies:", error);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await fetchSupplierItemInventoryItems();
          const list = Array.isArray(res)
            ? res
            : (res?.data?.DROPDOWN_LIST ??
              res?.data?.data?.DROPDOWN_LIST ??
              (Array.isArray(res?.data) ? res.data : []));
          if (!cancelled) {
            setItemOptions(
              list.map((i) => ({
                value: i.ValueText,
                label: i.Item_Code,
                raw: i,
              })),
            );
          }
        } catch (error) {
          console.error("Error fetching inventory items:", error);
          if (!cancelled) showToast("Failed to load items", "error");
        }
      })();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Effect: load full record for view / edit ────────────────────────────
    const supplierItemId = initialData?.supplier_item_id;
    useEffect(() => {
      onDirtyChangeRef.current?.(false);
      if (!supplierItemId) return;
      if (fetchedIdRef.current === supplierItemId) return;
      fetchedIdRef.current = supplierItemId;

      (async () => {
        setLoadingDetails(true);
        try {
          const res = await fetchSupplierItemDetails({
            supplierItemID: supplierItemId,
          });
          const h = res?.data?.SUPPLIER_ITEM_DETAIL_RESPONSE?.[0];
          if (res?.Status === SUCCESS_STATUS && h) {
            setFetchedData({ ...h, paramType: PARAM_TYPE.EDIT });
          } else {
            fetchedIdRef.current = null; // allow a retry
            showToast("No details found for this Supplier Item", "error");
          }
        } catch (e) {
          fetchedIdRef.current = null; // allow a retry
          console.error("Error fetching Supplier Item details", e);
          showToast("Failed to load details", "error");
        } finally {
          setLoadingDetails(false);
        }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supplierItemId]);

    // ── Derived: initialValues ──────────────────────────────────────────────
    const initialValues = useMemo(
      () =>
        buildSupplierItemInitialValues(
          fetchedData ? { ...initialData, ...fetchedData } : initialData,
          initialForm,
        ),
      [initialData, fetchedData],
    );

    // Latest form values without re-rendering on every keystroke.
    const currentFormValuesRef = useRef(initialValues);
    useEffect(() => {
      currentFormValuesRef.current = initialValues;
    }, [initialValues]);

    // ── Dirty-draft tracking ────────────────────────────────────────────────
    const {
      isDirty: isFormDirty,
      onValuesChange: onFormValuesChange,
      resetDirty,
      updateBaseline,
    } = useDirtyDraftDrawer({
      open,
      initialValues,
      initialData,
      draftKey: DRAFT_KEY,
    });

    const updateBaselineRef = useRef(updateBaseline);
    updateBaselineRef.current = updateBaseline;

    const clearDraft = useCallback(() => {
      localStorage.removeItem(DRAFT_KEY);
      resetDirty?.();
    }, [resetDirty]);

    const saveDraft = useCallback(() => {
      const latest =
        validatedFormRef.current?.getValues?.() ?? currentFormValuesRef.current;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(latest));
    }, []);

    useEffect(() => {
      onDirtyChange?.(isFormDirty);
    }, [isFormDirty, onDirtyChange]);

    // ── Default currency → INR, NEW records only ────────────────────────────
    // Never touches an existing record. The default is not a user edit, so the
    // dirty baseline is moved with it.
    const inrCurrencyOption = useMemo(
      () =>
        currencyOptions.find((o) =>
          String(o.label || "")
            .toUpperCase()
            .includes("INR"),
        ),
      [currencyOptions],
    );

    useEffect(() => {
      if (!isCreate || !inrCurrencyOption) return;
      if (currentFormValuesRef.current?.currencyID) return;

      const form = validatedFormRef.current;
      if (form) {
        form.setFieldValue("currencyID", inrCurrencyOption.value);
        form.setFieldValue("currencyCode", inrCurrencyOption.label);
        setTimeout(() => {
          const vals = validatedFormRef.current?.getValues?.() || {};
          updateBaselineRef.current?.({
            ...vals,
            currencyID: inrCurrencyOption.value,
            currencyCode: inrCurrencyOption.label,
          });
        }, 50);
      }
      currentFormValuesRef.current = {
        ...currentFormValuesRef.current,
        currencyID: inrCurrencyOption.value,
        currencyCode: inrCurrencyOption.label,
      };
    }, [isCreate, inrCurrencyOption]);

    // ── Validation ──────────────────────────────────────────────────────────
    const originalValidToDate = isCreate ? "" : initialValues.validToDate || "";
    const validation = useMemo(
      () => ({
        supplierName: { required: true, fieldLabel: "Supplier" },
        itemCode: { required: true, fieldLabel: "Item" },
        currencyID: {
          required: true,
          fieldLabel: "Currency",
          controlType: "dropdown",
        },
        unitRate: {
          required: true,
          fieldLabel: "Unit Rate",
          validator: (value) => {
            if (value === "" || value === null || value === undefined)
              return "";
            if (!UNIT_RATE_PATTERN.test(String(value)))
              return "Enter a valid rate (max 4 decimals).";
            if (Number(value) <= 0) return "Unit Rate must be greater than 0.";
            return "";
          },
        },
        supplierItemCode: {
          required: false,
          fieldLabel: "Supplier Item Code",
          validator: (value) =>
            value && String(value).length > 40 ? "Maximum 40 characters." : "",
        },
        validToDate: {
          required: false,
          fieldLabel: "Valid To",
          validator: (value) => {
            if (!value) return "";
            // Allow an existing record to keep its already-saved date;
            // any newly entered date must not be in the past.
            if (value === originalValidToDate) return "";
            if (String(value) < today) return "Valid To cannot be a past date.";
            return "";
          },
        },
      }),
      [originalValidToDate],
    );

    // ── Change handlers ─────────────────────────────────────────────────────
    const handleSupplierChange = useCallback((option, handleChange) => {
      const setField = (name, value) =>
        handleChange({ target: { name, value } });
      setField("supplierID", option?.value ?? "");
      setField("supplierName", option?.label ?? "");
    }, []);

    const handleItemSelect = useCallback(
      (e, handleChange) => {
        const id = e?.target?.value ?? e?.value ?? "";
        const raw = itemById.get(String(id));
        const setField = (name, value) =>
          handleChange({ target: { name, value } });
        setField("itemID", id);
        setField("itemCode", raw?.Item_Code ?? "");
        setField("itemDescription", raw?.Item_Description ?? "");
        setField("itemUnit", raw?.Item_Unit ?? "");
      },
      [itemById],
    );

    const handleUnitRateChange = useCallback((e, handleChange) => {
      const v = e?.target?.value ?? "";
      if (v !== "" && !UNIT_RATE_PATTERN.test(v)) return;
      handleChange({ target: { name: "unitRate", value: v } });
    }, []);

    const handleFormValuesChange = useCallback(
      (values) => {
        currentFormValuesRef.current = values;
        onFormValuesChange(values);
        onValuesChange?.(values);
      },
      [onValuesChange, onFormValuesChange],
    );

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async (values) => {
      if (validatedFormRef.current?.isValid?.() === false) return;

      setSubmitting(true);
      try {
        const id = Number(values.supplierItemID) || 0;

        const payload = {
          pageSize: 0,
          pageNumber: 0,
          supplierItemID: id,
          supplierID: Number(values.supplierID) || 0,
          itemID: Number(values.itemID) || 0,
          supplierItemCode: values.supplierItemCode || "",
          currencyID: Number(values.currencyID) || 0,
          unitRate: Number(values.unitRate) || 0,
          validToDate: values.validToDate
            ? `${values.validToDate}T00:00:00.000`
            : "",
          purchaseNotes: values.purchaseNotes || "",
          documentStatus: id > 0 ? DOC_STATUS.AMENDMENT : DOC_STATUS.NEW,
          preparedBy: values.prepBy || getPreparedBy(),
          updatedBy: getPreparedBy(),
          paramType: id > 0 ? PARAM_TYPE.EDIT : PARAM_TYPE.ADD,
        };

        const response = await saveAndUpdateSupplierItem(payload);

        if (response?.Status === SUCCESS_STATUS) {
          clearDraft();

          // The save API returns { ID, Message } under SUPPLIER_ITEM_RESPONSE
          // (or a detail row under SUPPLIER_ITEM_DETAIL_RESPONSE).
          const resp =
            response?.data?.SUPPLIER_ITEM_DETAIL_RESPONSE?.[0] ??
            response?.data?.SUPPLIER_ITEM_RESPONSE?.[0];

          // FIX: the new record's id comes back as `ID` — it was never read
          // before, so generatedId fell back to 0 for new records and the
          // detail fetch / list refresh was skipped.
          const generatedId =
            Number(
              resp?.ID ??
                resp?.supplier_item_id ??
                resp?.supplierItemID ??
                id,
            ) || 0;

          if (generatedId > 0) {
            const detail = await fetchSupplierItemDetails({
              supplierItemID: generatedId,
            });
            onSuccess?.(detail?.Status === SUCCESS_STATUS ? detail : response);
          } else {
            onSuccess?.(response);
          }
          showToast(
            resp?.Message || "Supplier Item saved successfully",
            "success",
          );
        } else {
          const msg =
            response?.data?.SUPPLIER_ITEM_DETAIL_RESPONSE?.[0]?.Message ||
            response?.data?.SUPPLIER_ITEM_RESPONSE?.[0]?.Message ||
            response?.message ||
            "Failed to save Supplier Item.";
          showToast(msg, "error");
        }
      } catch (error) {
        console.error("Save error:", error);
        showToast("An error occurred while saving", "error");
      } finally {
        setSubmitting(false);
      }
    };

    // ── Imperative handle ───────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      submit: () => validatedFormRef.current?.submitForm?.(),
      saveDraft,
      clearDraft,
      hasUnsavedChanges: () => isFormDirty,
      confirmClose: () => {
        if (isFormDirty) {
          return window.confirm(
            "You have unsaved changes. Do you want to save them before leaving?",
          );
        }
        return true;
      },
    }));

    // ── Render ──────────────────────────────────────────────────────────────
    return (
      <>
        <style>{SUPPLIER_ITEM_FORM_STYLES}</style>

        <FullPageLoader
          loading={submitting}
          message="Saving Supplier Item..."
          logoSrc={inspireLogo}
        />

        <div
          className="save-update-supplier-item pb-4 h-100 d-flex flex-column"
          style={{ width: "100%", margin: "0 auto" }}
        >
          {(submitting || loadingDetails) && <Loader />}

          <ValidatedForm
            key={
              fetchedData
                ? `fetched-${fetchedData.supplier_item_id}`
                : "initial"
            }
            ref={validatedFormRef}
            initialValues={initialValues}
            validation={validation}
            onSubmit={handleSubmit}
            onValuesChange={handleFormValuesChange}
          >
            {({ values, handleChange, handleBlur, errors }) => {
              const selectedItem = itemById.get(String(values.itemID));
              return (
                <>
                  {/* Row 1 - Supplier, Item Code, Description, Unit */}
                  <div className="row mb-3">
                    <div className="col-12 col-md-3">
                      <PaginatedSearchSelect
                        label="Supplier"
                        name="supplierID"
                        value={values.supplierID}
                        inputLabel={values.supplierName}
                        fetchPage={fetchSuppliersPaged}
                        onChange={(option) =>
                          handleSupplierChange(option, handleChange)
                        }
                        onBlur={handleBlur}
                        error={errors.supplierName}
                        placeholder="Search supplier..."
                        disabled={isDisabled || !isCreate}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      {isCreate && !isDisabled ? (
                        <ReactSelectField
                          label="Item Code"
                          name="itemID"
                          value={values.itemID}
                          options={itemOptions}
                          onChange={(e) => handleItemSelect(e, handleChange)}
                          onBlur={handleBlur}
                          error={errors.itemCode}
                          placeholder="Select item"
                          required
                        />
                      ) : (
                        <FormField
                          label="Item Code"
                          name="itemCode"
                          value={values.itemCode || ""}
                          disabled
                          required
                        />
                      )}
                    </div>
                    <div className="col-12 col-md-4">
                      <FormField
                        label="Description"
                        name="itemDescription"
                        value={
                          values.itemDescription ||
                          selectedItem?.Item_Description ||
                          ""
                        }
                        disabled
                      />
                    </div>
                    <div className="col-12 col-md-2">
                      <FormField
                        label="Unit"
                        name="itemUnit"
                        value={values.itemUnit || selectedItem?.Item_Unit || ""}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Row 2 - Supplier Item Code, Unit Rate, Currency, Valid To */}
                  <div className="row mb-3">
                    <div className="col-12 col-md-3">
                      <FormField
                        label="Supplier Item Code"
                        name="supplierItemCode"
                        value={values.supplierItemCode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.supplierItemCode}
                        disabled={isDisabled}
                        maxLength={40}
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <FormField
                        label="Unit Rate"
                        name="unitRate"
                        value={values.unitRate}
                        onChange={(e) => handleUnitRateChange(e, handleChange)}
                        onBlur={handleBlur}
                        onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                        error={errors.unitRate}
                        style={{ textAlign: "right", width: "100%" }}
                        disabled={isDisabled}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      {!isDisabled ? (
                        <ReactSelectField
                          label="Currency"
                          name="currencyID"
                          value={values.currencyID}
                          options={currencyOptions}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.currencyID}
                          placeholder="Select Currency"
                          required
                        />
                      ) : (
                        <FormField
                          label="Currency"
                          name="currencyCode"
                          value={values.currencyCode || ""}
                          disabled
                          required
                        />
                      )}
                    </div>
                    <div className="col-12 col-md-3">
                      <FormField
                        label="Valid To"
                        name="validToDate"
                        type="date"
                        value={values.validToDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        min={today}
                        disabled={isDisabled}
                      />
                    </div>
                  </div>

                  {/* Row 3 - Purchase Notes, Document Status */}
                  <div className="row mb-3">
                    <div className="col-12 col-md-9">
                      <TextAreaFormField
                        label="Purchase Notes"
                        name="purchaseNotes"
                        value={values.purchaseNotes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isDisabled}
                        rows={3}
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <FormField
                        label="Document Status"
                        name="docStatusText"
                        value={values.docStatusText}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Row 4 - Prepared / Updated / Approved by */}
                  <div className="row mt-2 mb-3">
                    <div className="col-12 col-md-4">
                      <FormField
                        label="Prepared By"
                        name="prepBy"
                        value={values.prepBy}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <FormField
                        label="Updated By"
                        name="updateBy"
                        value={values.updateBy}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <FormField
                        label="Approved By"
                        name="approvedBy"
                        value={values.approvedBy}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Row 5 - Prepared / Updated / Approved dates */}
                  <div className="row mb-6">
                    <div className="col-12 col-md-4">
                      <FormField
                        label="Prepared Date"
                        name="prepDate"
                        type="date"
                        value={values.prepDate}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <FormField
                        label="Updated Date"
                        name="updateDate"
                        type="date"
                        value={values.updateDate}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <FormField
                        label="Approved Date"
                        name="approvedDate"
                        type="date"
                        value={values.approvedDate}
                        disabled
                      />
                    </div>
                  </div>
                </>
              );
            }}
          </ValidatedForm>
        </div>
      </>
    );
  },
);

SaveOrUpdateSupplierItem.displayName = "SaveOrUpdateSupplierItem";
export default SaveOrUpdateSupplierItem;