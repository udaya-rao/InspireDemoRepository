import React, {
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle,
    useRef,
    useMemo,
    useCallback,
} from "react";
import { FormField, ReactSelectField, TextAreaFormField } from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import { useToast } from "../../components/useToast";
import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
import { fetchDailyJobDataDetails, fetchDailyJobDetails, fetchDropDownData, saveAndUpdateDailyJobData } from "../../services/dailyJobService";
import FullPageLoader from "../../components/FullPageLoader";
import Loader from "../../components/Loader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS } from "../../utils/ConstVariables";
import { getPreparedBy, getUser } from "../../utils/userSession";

const today = new Date().toISOString().split("T")[0];

const isZero = (val) => {
    if (val === "" || val === null || val === undefined) return false;
    const num = Number(val);
    return !Number.isNaN(num) && num === 0;
};

const initialForm = {
    jobCardDailyID: 0,
    jobCardDailyNumber: "0",
    jobCardID: "",
    jobCardNumber: "0",
    dailyJobDate: "",
    workOrderLineID: "",
    workOrderID: "",
    workOrderNumber: "",
    itemCode: "",
    itemDescription: "",
    itemUnit: "",
    operationID: "",
    operationIDText: "",
    operationSequence: "",
    productionCycle: "",
    qtyPlanned: "",
    qtyInput: "",
    qtyOutput: "",
    qtyScrapped: "",
    qtyCopperScrapped: "",
    startTime: "",
    endTime: "",
    responsiblePersonId: "",
    operationStatus: "1",
    remarks: "",
    preparedBy: getPreparedBy(),
    prepDate: today,
    updatedBy: "",
    updateDate: "",
    itemID: "",
    itemType: "",
};

const getDefaultResponsiblePersonId = (options) => {
    if (!Array.isArray(options) || !options.length) return "";
    const user = getUser();
    if (!user) return "";

    const userIds = [user.empl_auto_id, user.employeeID, user.login_id].filter(Boolean).map(String);
    const userName = String(user.empl_name || "").trim().toLowerCase();

    const match = options.find(opt =>
        userIds.includes(String(opt.value)) ||
        (userName && String(opt.label).trim().toLowerCase() === userName)
    );
    return match ? match.value : "";
};

const validation = {
    startTime: {
        required: false,
        fieldLabel: "Start Time",
        controlType: "textbox",
        validator: (value, allValues) => {
            if (!value) return "";
            if (allValues.dailyJobDate) {
                const startDateTime = new Date(value);
                const jobCardDateTime = new Date(allValues.dailyJobDate);

                // Pure date comparison
                const startDateOnly = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());
                const jobCardDateOnly = new Date(jobCardDateTime.getFullYear(), jobCardDateTime.getMonth(), jobCardDateTime.getDate());

                if (startDateOnly < jobCardDateOnly) {
                    const formattedJobCardDate = jobCardDateTime.toLocaleDateString('en-GB').replace(/\//g, '-');
                    return `Start Time cannot be earlier than the Job Card Date (${formattedJobCardDate}).`;
                }
            }
            return "";
        }
    },
    endTime: {
        required: false,
        fieldLabel: "End Time",
        controlType: "textbox",
        validator: (value, allValues) => {
            if (!value) return "";
            const date = new Date(value);
            const minDate = new Date();
            minDate.setDate(minDate.getDate() - 31);
            if (allValues.startTime) {
                const startDate = new Date(allValues.startTime);
                if (date < startDate) {
                    return "End Time cannot be less than Start Time.";
                }
            }
            return "";
        }
    },
    responsiblePersonId: {
        required: true,
        fieldLabel: "Responsible Person",
        controlType: "dropdown",
    },
    operationStatus: {
        required: false,
        fieldLabel: "Operation Status",
        controlType: "dropdown",
    },
    qtyOutput: {
        required: true,
        fieldLabel: "Qty Output",
        controlType: "textbox",
        validator: (value, allValues) => {
            if (value === "" || value === null || value === undefined) return "";
            const isNos = String(allValues.itemUnit || "").trim().toUpperCase() === "NOS";
            if (isNos && !/^\d+$/.test(String(value))) {
                return "Qty Output must be a whole number for unit NOS.";
            }
            if (isZero(value) && isZero(allValues.qtyScrapped)) {
                return "Both Qty Output and Qty Scrapped cannot be zero at the same time.";
            }
            return "";
        }
    },
    qtyScrapped: {
        required: true,
        fieldLabel: "Qty Scrapped",
        controlType: "textbox",
        validator: (value, allValues) => {
            if (value === "" || value === null || value === undefined) return "";
            const isNos = String(allValues.itemUnit || "").trim().toUpperCase() === "NOS";
            if (isNos && !/^\d+$/.test(String(value))) {
                return "Qty Scrapped must be a whole number for unit NOS.";
            }
            if (isZero(value) && isZero(allValues.qtyOutput)) {
                return "Both Qty Output and Qty Scrapped cannot be zero at the same time.";
            }
            return "";
        }
    },
};

const SaveOrUpdateDailyJobData = forwardRef(
    (
        { onSuccess, initialData, editMode: editModeProp = false, onDirtyChange, open = true, disabled = false, parentContext = null },
        ref
    ) => {
        const { showToast } = useToast();
        const validatedFormRef = useRef();
        const valuesRef = useRef({ ...initialForm });

        const [submitting, setSubmitting] = useState(false);
        const [loadingDetails, setLoadingDetails] = useState(false);
        const [fetchedData, setFetchedData] = useState(null);
        const [responsiblePersonOptions, setResponsiblePersonOptions] = useState([]);
        const fetchedWoIdRef = useRef(null);

        const [editMode, setEditMode] = useState(disabled ? false : editModeProp ?? false);

        const minDateTime = useMemo(() => {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return d.toISOString().slice(0, 16);
        }, []);

        useEffect(() => {
            setEditMode(disabled ? false : editModeProp ?? false);
        }, [editModeProp, disabled]);

        const toDateOnly = useCallback((v) => {
            if (!v) return "";
            const s = String(v);
            if (s.includes("T")) return s.split("T")[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            const d = new Date(s);
            return Number.isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
        }, []);

        const toDateTimeLocal = useCallback((v) => {
            if (!v) return "";
            let s = String(v).replace("Z", "");
            if (s.includes(" ")) s = s.replace(" ", "T");
            return s.slice(0, 16);
        }, []);

        // Fetch master dropdown data
        useEffect(() => {
            let isMounted = true;
            const loadDropdowns = async () => {
                try {

                    fetchDropDownData({
                        sourceTable: "ResponsiblePersonID",
                        argumentValue: ""
                    }).then(res => {
                        if (isMounted && res?.data?.DROPDOWN_LIST) {
                            const options = res.data.DROPDOWN_LIST.map(item => ({
                                value: String(item.ValueText),
                                label: item.DisplayText
                            }));
                            setResponsiblePersonOptions(options);
                        }
                    });

                } catch (error) {
                    console.error("Failed to load dropdowns", error);
                }
            };
            loadDropdowns();
            return () => { isMounted = false; };
        }, []);

        // In New mode, automatically select the current logged-in person when options load
        useEffect(() => {
            const isNewMode = !initialData || (!initialData.job_card_daily_id && !initialData.jobCardDailyID);
            if (isNewMode && responsiblePersonOptions.length > 0 && validatedFormRef.current) {
                const currentVals = validatedFormRef.current.getValues();
                if (!currentVals?.responsiblePersonId) {
                    const defaultId = getDefaultResponsiblePersonId(responsiblePersonOptions);
                    if (defaultId) {
                        validatedFormRef.current.setFieldValue("responsiblePersonId", defaultId);
                    }
                }
            }
        }, [initialData, responsiblePersonOptions]);

        // Fetch Details if initialData has IDs
        useEffect(() => {
            async function getDetails() {
                if (initialData && (initialData.job_card_daily_id || initialData.jobCardDailyID)) {
                    const dailyJobId = initialData.job_card_daily_id || initialData.jobCardDailyID;

                    const key = `daily-${dailyJobId}`;
                    if (fetchedWoIdRef.current === key) return;
                    fetchedWoIdRef.current = key;

                    setLoadingDetails(true);
                    try {
                        const res = await fetchDailyJobDataDetails({
                            jobCardDailyID: Number(dailyJobId),
                        });
                        if (res && res.Status === SUCCESS_STATUS && res.data) {
                            const d = res.data.JOB_CARD_DAILY_DETAILS_RESPONSE?.[0] || {};

                            setFetchedData({
                                jobCardDailyID: d.job_card_daily_id || dailyJobId,
                                jobCardDailyNumber: d.job_card_daily_no || "",
                                jobCardID: d.job_card_id || "",
                                jobCardNumber: d.job_card_no || "",
                                qtyOutput: d.qty_output ?? "",
                                qtyScrapped: d.qty_scrapped ?? "",
                                qtyCopperScrapped: d.qty_copper_scrapped ?? "",
                                remarks: d.remarks || "",
                                workOrderID: d.work_order_id ?? "",
                                workOrderNumber: d.work_order_no || "",
                                responsiblePersonId: d.responsible_person_id ? String(d.responsible_person_id) : "",
                                startTime: d.job_start_time ? toDateTimeLocal(d.job_start_time) : "",
                                endTime: d.job_end_time ? toDateTimeLocal(d.job_end_time) : "",
                                preparedBy: d.prep_by || "",
                                prepDate: d.prep_date ? toDateOnly(d.prep_date) : "",
                                updatedBy: d.update_by || "",
                                updateDate: d.update_date ? toDateOnly(d.update_date) : "",
                                dailyJobDate: d.job_card_prep_date || d.job_card_date || initialData.dailyJobDate || "",
                                itemID: d.item_id || initialData.item_id || "",
                                itemType: d.item_type || initialData.item_type || "",
                                // These might not be in the daily details response, but we keep them from initialData if available
                                workOrderLineID: d.work_order_line_id || initialData.work_order_line_id || "",
                                itemCode: d.item_code || initialData.item_code || "",
                                itemDescription: d.item_description || initialData.item_description || "",
                                itemUnit: d.item_unit || initialData.item_unit || "",
                                operationID: d.operation_id || initialData.operation_id || "",
                                operationIDText: d.operation_id_text || initialData.operation_id_text || "",
                                operationSequence: d.operation_sequence || initialData.operation_sequence || "",
                                productionCycle: d.production_cycle || initialData.production_cycle || "",
                                qtyPlanned: d.qty_planned || initialData.qty_planned || "",
                                qtyInput: d.qty_input || initialData.qty_input || "",
                                operationStatus: d.operation_status ? String(d.operation_status) : (initialData.operation_status ? String(initialData.operation_status) : "1"),
                            });
                        }
                    } catch (e) {
                        console.error("Error fetching daily job data details", e);
                    } finally {
                        setLoadingDetails(false);
                    }
                } else if (!initialData && parentContext?.jobCardID) {
                    // New record mode: Fetch Job Card header to populate Product, Description, Unit, etc.
                    const jobCardID = parentContext.jobCardID;
                    const key = `jobcardheader-${jobCardID}`;
                    if (fetchedWoIdRef.current === key) return;
                    fetchedWoIdRef.current = key;

                    setLoadingDetails(true);
                    try {
                        const res = await fetchDailyJobDetails({
                            workOrderLineID: Number(parentContext.workOrderLineID) || 0,
                            jobCardID: Number(jobCardID),
                        });
                        if (res && res.Status === SUCCESS_STATUS && res.data) {
                            const d = res.data.JOB_CARD_DETAILS_RESPONSE?.[0] || {};
                            setFetchedData({
                                // New record, so daily job ID is empty
                                jobCardID: jobCardID,
                                jobCardNumber: d.job_card_no || "",
                                workOrderID: parentContext.workOrderID || d.work_order_id || "",
                                workOrderNumber: d.work_order_no || "",
                                itemCode: d.item_code || "",
                                itemDescription: d.item_description || "",
                                itemUnit: d.item_unit || "",
                                workOrderLineID: d.work_order_line_id || "",
                                operationID: d.operation_id || "",
                                operationIDText: d.operation_id_text || "",
                                operationSequence: d.operation_sequence ?? "",
                                productionCycle: d.production_cycle ?? "",
                                qtyPlanned: d.qty_planned ?? "",
                                qtyInput: d.qty_input ?? "",
                                dailyJobDate: d.job_card_prep_date || d.job_card_date || "",
                                itemID: d.item_id || "",
                                itemType: d.item_type || "",
                            });
                        }
                    } catch (e) {
                        console.error("Error fetching job card header details", e);
                    } finally {
                        setLoadingDetails(false);
                    }
                }
            }
            getDetails();
        }, [initialData, parentContext?.jobCardID, parentContext?.workOrderID, parentContext?.workOrderLineID, toDateOnly, toDateTimeLocal]);

        const initialValues = useMemo(() => {
            const sourceData = fetchedData || initialData;
            const isNewMode = !sourceData || (!sourceData.job_card_daily_id && !sourceData.jobCardDailyID);
            const defaultPersonId = isNewMode ? getDefaultResponsiblePersonId(responsiblePersonOptions) : "";

            if (sourceData) {
                let iv = {
                    ...initialForm,
                    jobCardDailyID: sourceData.job_card_daily_id || sourceData.jobCardDailyID || 0,
                    jobCardDailyNumber: sourceData.job_card_daily_no || sourceData.jobCardDailyNumber || "0",
                    jobCardID: sourceData.job_card_id || sourceData.jobCardID || "",
                    jobCardNumber: sourceData.job_card_no || sourceData.jobCardNumber || "",
                    qtyOutput: isNewMode ? "" : (sourceData.qty_output ?? sourceData.qtyOutput ?? ""),
                    qtyScrapped: isNewMode ? "" : (sourceData.qty_scrapped ?? sourceData.qtyScrapped ?? ""),
                    qtyCopperScrapped: isNewMode ? "" : (sourceData.qty_copper_scrapped ?? sourceData.qtyCopperScrapped ?? ""),
                    remarks: sourceData.remarks || "",
                    workOrderID: sourceData.work_order_id ?? sourceData.workOrderID ?? "",
                    workOrderNumber: sourceData.work_order_no || sourceData.workOrderNumber || "",
                    responsiblePersonId: sourceData.responsible_person_id || sourceData.responsiblePersonId ? String(sourceData.responsible_person_id || sourceData.responsiblePersonId) : defaultPersonId,
                    startTime: sourceData.job_start_time || sourceData.startTime ? toDateTimeLocal(sourceData.job_start_time || sourceData.startTime) : "",
                    endTime: sourceData.job_end_time || sourceData.endTime ? toDateTimeLocal(sourceData.job_end_time || sourceData.endTime) : "",
                    preparedBy: sourceData.prep_by || sourceData.preparedBy || getPreparedBy(),
                    prepDate: (sourceData.prep_date || sourceData.prepDate) ? toDateOnly(sourceData.prep_date || sourceData.prepDate) : today,
                    updatedBy: sourceData.update_by || sourceData.updatedBy || "",
                    updateDate: (sourceData.update_date || sourceData.updateDate) ? toDateOnly(sourceData.update_date || sourceData.updateDate) : "",
                    dailyJobDate: sourceData.job_card_prep_date || sourceData.job_card_date || sourceData.dailyJobDate || "",
                    itemID: sourceData.item_id || sourceData.itemID || "",
                    itemType: sourceData.item_type || sourceData.itemType || "",

                    // Auxiliary Job Card fields (read-only)
                    workOrderLineID: sourceData.work_order_line_id || sourceData.workOrderLineID || "",
                    itemCode: sourceData.item_code || sourceData.itemCode || "",
                    itemDescription: sourceData.item_description || sourceData.itemDescription || "",
                    itemUnit: sourceData.item_unit || sourceData.itemUnit || "",
                    operationID: sourceData.operation_id || sourceData.operationID || "",
                    operationIDText: sourceData.operation_id_text || sourceData.operationIDText || "",
                    operationSequence: sourceData.operation_sequence ?? sourceData.operationSequence ?? "",
                    productionCycle: sourceData.production_cycle ?? sourceData.productionCycle ?? "",
                    qtyPlanned: sourceData.qty_planned ?? sourceData.qtyPlanned ?? "",
                    qtyInput: sourceData.qty_input ?? sourceData.qtyInput ?? "",
                    operationStatus: sourceData.operation_status || sourceData.operationStatus ? String(sourceData.operation_status || sourceData.operationStatus) : "1",
                };

                // If this is a new record being created, merge in the draft if one exists
                if (!initialData) {
                    try {
                        const rawDraft = localStorage.getItem("draft_dailyjobdata");
                        if (rawDraft) {
                            const parsed = JSON.parse(rawDraft);
                            // Only apply draft if it's for the same job card context
                            if (String(parsed.jobCardID) === String(iv.jobCardID)) {
                                iv = { ...iv, ...parsed };
                            }
                        }
                    } catch {
                        // ignore
                    }
                }

                valuesRef.current = iv;
                return iv;
            }

            // Fallback for new record if fetch hasn't completed yet
            let ivFallback = { ...initialForm };
            if (parentContext?.jobCardID || parentContext?.workOrderID) {
                ivFallback = {
                    ...ivFallback,
                    jobCardDailyID: 0,
                    jobCardID: parentContext.jobCardID ? String(parentContext.jobCardID) : "",
                    workOrderID: parentContext.workOrderID ? String(parentContext.workOrderID) : "",
                    responsiblePersonId: getDefaultResponsiblePersonId(responsiblePersonOptions),
                };
            }

            if (!initialData) {
                try {
                    const rawDraft = localStorage.getItem("draft_dailyjobdata");
                    if (rawDraft) {
                        const parsed = JSON.parse(rawDraft);
                        if (String(parsed.jobCardID) === String(ivFallback.jobCardID)) {
                            ivFallback = { ...ivFallback, ...parsed };
                        }
                    }
                } catch {
                    // ignore
                }
            }

            valuesRef.current = ivFallback;
            return ivFallback;
        }, [initialData, fetchedData, parentContext, responsiblePersonOptions, toDateOnly, toDateTimeLocal]);

        const DRAFT_KEY = "draft_dailyjobdata";

        const { isDirty, onValuesChange, resetDirty } = useDirtyDraftDrawer({
            open,
            initialValues,
            initialData,
            draftKey: DRAFT_KEY,
        });

        useEffect(() => {
            if (onDirtyChange) onDirtyChange(isDirty);
        }, [isDirty, onDirtyChange]);

        const handleFormValuesChange = useCallback(
            (nextValues) => {
                valuesRef.current = nextValues;
                if (onValuesChange) onValuesChange(nextValues);
            },
            [onValuesChange]
        );

        const formatToApiDate = (val) => {
            if (!val) return "";
            const date = new Date(val);
            if (isNaN(date.getTime())) return val;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const handleSubmit = async (values) => {
            if (isZero(values.qtyOutput) && isZero(values.qtyScrapped)) {
                showToast("Both Qty Output and Qty Scrapped cannot be zero at the same time.", ERROR_STATUS.toLowerCase());
                return;
            }

            setSubmitting(true);
            try {
                // For new records (ADD), use parentContext IDs if form values are empty
                const resolvedJobCardID = Number(values.jobCardID) || (parentContext?.jobCardID ? Number(parentContext.jobCardID) : 0);
                const resolvedWorkOrderID = Number(values.workOrderID) || (parentContext?.workOrderID ? Number(parentContext.workOrderID) : 0);

                const payload = {
                    pageSize: 0,
                    pageNumber: 0,
                    jobCardDailyID: Number(values.jobCardDailyID) || 0,
                    jobCardDailyNumber: values.jobCardDailyNumber || "0",
                    jobCardID: resolvedJobCardID,
                    jobCardNumber: values.jobCardNumber || "0",
                    quantityOutput: Number(values.qtyOutput),
                    quantityScrapped: Number(values.qtyScrapped),
                    quantityCopperScrapped: Number(values.qtyCopperScrapped) || 0,
                    remarks: values.remarks || "",
                    preparedBy: values.preparedBy || getPreparedBy(),
                    responsiblePersonID: String(values.responsiblePersonId),
                    updatedBy: getPreparedBy(),
                    workOrderID: resolvedWorkOrderID,
                    workOrderNumber: values.workOrderNumber || "0",
                    jobStartTime: formatToApiDate(values.startTime),
                    jobEndTime: formatToApiDate(values.endTime),
                    operationID: Number(values.operationID) || 0,
                    itemID: Number(values.itemID) || 0,
                    itemType: values.itemType || "",
                    paramType: "ADD"
                };

                const res = await saveAndUpdateDailyJobData(payload);
                if (res && res.Status === SUCCESS_STATUS) {
                    showToast(res.data?.JOB_CARD_DAILY_RESPONSE?.[0]?.Message || "Daily Job Data saved successfully!", SUCCESS_STATUS);
                    resetDirty();
                    if (onSuccess) onSuccess(res, values);
                } else {
                    const detailedError = res?.data?.JOB_CARD_DAILY_RESPONSE?.[0]?.Message;
                    const finalError = (detailedError && detailedError !== "OK") ? detailedError : (res?.message && res.message !== "OK" ? res.message : "Failed to save Daily Job Data.");
                    showToast(finalError, ERROR_STATUS.toLowerCase());
                }
            } catch (error) {
                console.error(error);
                showToast("An error occurred while saving changes.", ERROR_STATUS.toLowerCase());
            } finally {
                setSubmitting(false);
            }
        };

        useImperativeHandle(ref, () => ({
            submit: () => {
                if (validatedFormRef.current) {
                    validatedFormRef.current.submitForm();
                }
            },
            hasUnsavedChanges: () => isDirty,
            clearDraft: () => {
                try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
            },
            saveDraft: () => {
                try {
                    const latestFormValues =
                        validatedFormRef.current && typeof validatedFormRef.current.getValues === "function"
                            ? validatedFormRef.current.getValues()
                            : valuesRef.current || {};
                    localStorage.setItem(DRAFT_KEY, JSON.stringify(latestFormValues));
                } catch (err) { console.error("Failed to save draft", err); }
            },
            validate: () => {
                if (validatedFormRef.current && typeof validatedFormRef.current.validate === 'function') {
                    return validatedFormRef.current.validate();
                }
                return false;
            },
            confirmClose: () => {
                if (isDirty) {
                    return window.confirm(
                        "You have unsaved changes. Do you want to save them before leaving?"
                    );
                }
                return true;
            }
        }));

        const isDisabledState = disabled || !editMode;

        return (
            <>
                <div style={{ width: "100%", margin: "0 auto" }}>
                    <style>{`
            input:disabled, select:disabled, textarea:disabled {
              background-color: #e9ecef !important;
              color: #495057 !important;
              opacity: 1;
              cursor: not-allowed;
            }
            /* Hide arrows in number inputs */
            input::-webkit-outer-spin-button,
            input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            input[type=number] {
                -moz-appearance: textfield;
            }
          `}</style>

                    <FullPageLoader
                        loading={submitting}
                        message="Saving Daily Job Data..."
                        logoSrc={inspireLogo}
                    />
                    {loadingDetails && <Loader />}

                    <ValidatedForm
                        key={fetchedData ? `dailyjobdata-${fetchedData.jobCardDailyID || fetchedData.jobCardID || 'new'}` : (initialData ? `dailyjobdata-${initialData.job_card_daily_id || initialData.jobCardDailyID || 'row'}` : 'initial')}
                        ref={validatedFormRef}
                        initialValues={initialValues}
                        validation={validation}
                        onSubmit={handleSubmit}
                        onValuesChange={handleFormValuesChange}
                    >
                        {({ values, errors, handleChange, handleBlur }) => {
                            const isInitiallyCompleted = initialValues.operationStatus === "3" || initialValues.operationStatus === 3;
                            const isNos = String(values.itemUnit || "").trim().toUpperCase() === "NOS";

                            const bothZeroError = "Both Qty Output and Qty Scrapped cannot be zero at the same time.";
                            const areBothZero = isZero(values.qtyOutput) && isZero(values.qtyScrapped);

                            let displayQtyOutputError = errors.qtyOutput;
                            if (areBothZero) {
                                displayQtyOutputError = bothZeroError;
                            } else if (displayQtyOutputError === bothZeroError) {
                                displayQtyOutputError = "";
                            }

                            let displayQtyScrappedError = errors.qtyScrapped;
                            if (areBothZero) {
                                displayQtyScrappedError = bothZeroError;
                            } else if (displayQtyScrappedError === bothZeroError) {
                                displayQtyScrappedError = "";
                            }

                            const handleQtyChange = (e) => {
                                const { value } = e.target;
                                const valStr = String(value);

                                if (valStr === "") {
                                    handleChange(e);
                                    return;
                                }

                                // Pattern based on unit: 8 integer digits, 4 decimal places
                                const regex = isNos
                                    ? /^\d{0,8}$/
                                    : /^\d{0,8}(\.\d{0,4})?$/;

                                if (regex.test(valStr)) {
                                    handleChange(e);
                                }
                            };

                            const handleFocusSelect = (e) => {
                                setTimeout(() => {
                                    e.target.select();
                                }, 0);
                            };

                            const handleFocusClick = (e) => {
                                e.target.select();
                            };

                            return (
                                <>
                                    <div className="row mb-4 g-3">
                                        <div className="col-md-3">
                                            <div className="row g-2">
                                                <div className="col-md-6">
                                                    <FormField
                                                        label="Daily Job No"
                                                        name="jobCardDailyNumber"
                                                        value={values.jobCardDailyNumber}
                                                        disabled={true}
                                                        style={{ textAlign: 'right', paddingRight: '12px' }}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <FormField
                                                        label="Job Card No"
                                                        name="jobCardNumber"
                                                        value={values.jobCardNumber}
                                                        disabled={true}
                                                        style={{ textAlign: 'right', paddingRight: '12px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-2">
                                            <FormField
                                                label="WO No"
                                                name="workOrderNumber"
                                                value={values.workOrderNumber}
                                                disabled={true}
                                                style={{ textAlign: 'right', paddingRight: '12px' }}
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <FormField
                                                label="Product"
                                                name="itemCode"
                                                value={values.itemCode}
                                                disabled={true}
                                                style={{ textAlign: 'left' }}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <FormField
                                                label="Description"
                                                name="itemDescription"
                                                value={values.itemDescription}
                                                disabled={true}
                                                style={{ textAlign: 'left' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3 g-3">

                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="Operation"
                                                name="operationIDText"
                                                value={values.operationIDText}
                                                disabled={true}
                                                style={{ textAlign: 'left' }}
                                            />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="Start Time"
                                                name="startTime"
                                                type="datetime-local"
                                                value={values.startTime}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isDisabledState}
                                                error={errors.startTime}
                                                min={values.dailyJobDate ? `${values.dailyJobDate.split("T")[0]}T00:00` : minDateTime}
                                            />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="End Time"
                                                name="endTime"
                                                type="datetime-local"
                                                value={values.endTime}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isDisabledState}
                                                error={errors.endTime}
                                                min={minDateTime}
                                            />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <ReactSelectField
                                                label="Responsible Person"
                                                name="responsiblePersonId"
                                                options={responsiblePersonOptions}
                                                value={values.responsiblePersonId}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isDisabledState || isInitiallyCompleted}
                                                error={errors.responsiblePersonId}
                                                required={true}
                                            />
                                        </div>
                                    </div>


                                    <div className="row mb-3 g-3">
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="Qty Output"
                                                name="qtyOutput"
                                                type="text"
                                                inputMode={isNos ? "numeric" : "decimal"}
                                                value={values.qtyOutput}
                                                onChange={handleQtyChange}
                                                onFocus={handleFocusSelect}
                                                onClick={handleFocusClick}
                                                onBlur={handleBlur}
                                                disabled={isDisabledState}
                                                error={displayQtyOutputError}
                                                required={true}
                                                style={{ textAlign: 'right' }}
                                            />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="Qty Scrapped"
                                                name="qtyScrapped"
                                                type="text"
                                                inputMode={isNos ? "numeric" : "decimal"}
                                                value={values.qtyScrapped}
                                                onChange={handleQtyChange}
                                                onFocus={handleFocusSelect}
                                                onClick={handleFocusClick}
                                                onBlur={handleBlur}
                                                disabled={isDisabledState}
                                                error={displayQtyScrappedError}
                                                required={true}
                                                style={{ textAlign: 'right' }}
                                            />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="Qty Copper Scrapped"
                                                name="qtyCopperScrapped"
                                                type="text"
                                                inputMode={isNos ? "numeric" : "decimal"}
                                                value={values.qtyCopperScrapped}
                                                onChange={handleQtyChange}
                                                onFocus={handleFocusSelect}
                                                onClick={handleFocusClick}
                                                onBlur={handleBlur}
                                                disabled={isDisabledState}
                                                style={{ textAlign: 'right' }}
                                            />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="Unit"
                                                name="itemUnit"
                                                value={values.itemUnit}
                                                disabled={true}
                                                style={{ textAlign: 'left' }}
                                            />
                                        </div>

                                    </div>

                                    <div className="row mb-3 g-3">
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="Prepared By"
                                                name="preparedBy"
                                                value={values.preparedBy}
                                                disabled={true}
                                            />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="Prepared Date"
                                                name="prepDate"
                                                type="date"
                                                value={values.prepDate}
                                                disabled={true}
                                            />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="Updated By"
                                                name="updatedBy"
                                                value={values.updatedBy}
                                                disabled={true}
                                            />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md-3">
                                            <FormField
                                                label="Update Date"
                                                name="updateDate"
                                                type="date"
                                                value={values.updateDate}
                                                disabled={true}
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <TextAreaFormField
                                                rows="2"
                                                label="Remarks"
                                                name="remarks"
                                                value={values.remarks}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isDisabledState}
                                                error={errors.remarks}
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
    }
);

export default SaveOrUpdateDailyJobData;
