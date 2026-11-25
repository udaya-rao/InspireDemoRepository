import React, {
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle,
    useRef,
    useMemo,
    useCallback,
} from "react";
import { FormField, ReactSelectField } from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import { useToast } from "../../components/useToast";
import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
import { fetchDailyJobDetails, fetchDropDownData, saveAndUpdateDailyJob } from "../../services/dailyJobService";
import FullPageLoader from "../../components/FullPageLoader";
import Loader from "../../components/Loader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS } from "../../utils/ConstVariables";
import { getPreparedBy } from "../../utils/userSession";


const initialForm = {
    dailyJobID: "",
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
    operationStatus: "1", // Default to positive/pending
    preparedBy: "",
    prepDate: "",
    updatedBy: "",
    updateDate: "",
    jobCardPrepDate: "",
    itemID: "",
    itemType: "",
};

const validation = {
    startTime: {
        required: false,
        fieldLabel: "Start Time",
        controlType: "textbox",
        validator: (value, allValues) => {
            if (!value) return "";
            if (allValues.jobCardPrepDate) {
                const startDateTime = new Date(value);
                const jobCardDateTime = new Date(allValues.jobCardPrepDate);

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
        required: false,
        fieldLabel: "Responsible Person",
        controlType: "dropdown",
    },
    operationStatus: {
        required: false,
        fieldLabel: "Operation Status",
        controlType: "dropdown",
    },
};

const SaveOrUpdateDailyJob = forwardRef(
    (
        { onSuccess, initialData, editMode: editModeProp = false, onDirtyChange, open = true, disabled = false },
        ref
    ) => {
        const { showToast } = useToast();
        const validatedFormRef = useRef();
        const valuesRef = useRef({ ...initialForm });

        const [submitting, setSubmitting] = useState(false);
        const [loadingDetails, setLoadingDetails] = useState(false);
        const [fetchedData, setFetchedData] = useState(null);
        const [operationStatusOptions, setOperationStatusOptions] = useState([]);
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
                        sourceTable: "OthersNum",
                        argumentValue: "JobStatus"
                    }).then(res => {
                        if (isMounted && res?.data?.DROPDOWN_LIST) {
                            const options = res.data.DROPDOWN_LIST.map(item => ({
                                value: String(item.ValueText),
                                label: item.DisplayText
                            }));
                            setOperationStatusOptions(options);
                        }
                    });

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

        // Fetch Details if initialData has IDs
        useEffect(() => {
            async function getDetails() {
                if (initialData && initialData.daily_job_id) {
                    const dailyJobId = initialData.daily_job_id;
                    const workOrderLineId = initialData.work_order_line_id || 0;

                    const key = `${dailyJobId}-${workOrderLineId}`;
                    if (fetchedWoIdRef.current === key) return;
                    fetchedWoIdRef.current = key;

                    setLoadingDetails(true);
                    try {
                        const res = await fetchDailyJobDetails({
                            workOrderLineID: Number(workOrderLineId) || 0,
                            jobCardID: Number(dailyJobId),
                        });
                        if (res && res.Status === SUCCESS_STATUS && res.data) {
                            const d = res.data.JOB_CARD_DETAILS_RESPONSE?.[0] || {};

                            setFetchedData({
                                dailyJobID: d.job_card_id || dailyJobId,
                                jobCardNumber: d.job_card_no || "",
                                dailyJobDate: d.job_card_date ? toDateOnly(d.job_card_date) : "",
                                workOrderLineID: d.work_order_line_id || "",
                                operationID: d.operation_id || "",
                                operationIDText: d.operation_id_text || "",
                                operationSequence: d.operation_sequence ?? "",
                                productionCycle: d.production_cycle ?? "",
                                qtyPlanned: d.qty_planned ?? "",
                                qtyInput: d.qty_input ?? "",
                                qtyOutput: d.qty_output ?? "",
                                qtyScrapped: d.qty_scrapped ?? "",
                                qtyCopperScrapped: d.qty_copper_scrapped ?? "",
                                workOrderID: d.work_order_id ?? "",
                                workOrderNumber: d.work_order_no || "",
                                itemCode: d.item_code || "",
                                itemDescription: d.item_description || "",
                                itemUnit: d.item_unit || "",
                                startTime: d.start_time ? toDateTimeLocal(d.start_time) : "",
                                endTime: d.end_time ? toDateTimeLocal(d.end_time) : "",
                                responsiblePersonId: d.responsible_person_id ? String(d.responsible_person_id) : "",
                                operationStatus: d.operation_status ? String(d.operation_status) : "1",
                                preparedBy: d.prep_by || "",
                                prepDate: d.prep_date ? toDateOnly(d.prep_date) : "",
                                updatedBy: d.update_by || "",
                                updateDate: d.update_date ? toDateOnly(d.update_date) : "",
                                jobCardPrepDate: d.prep_date || "",
                                itemID: d.item_id || "",
                                itemType: d.item_type || "",
                            });
                        }
                    } catch (e) {
                        console.error("Error fetching daily job details", e);
                    } finally {
                        setLoadingDetails(false);
                    }
                }
            }
            getDetails();
        }, [initialData, toDateOnly, toDateTimeLocal]);

        const initialValues = useMemo(() => {
            const sourceData = fetchedData || initialData;
            if (sourceData) {
                const iv = {
                    ...initialForm,
                    dailyJobID: sourceData.daily_job_id || sourceData.dailyJobID || "",
                    jobCardNumber: sourceData.job_card_no || sourceData.jobCardNumber || "",
                    dailyJobDate: (sourceData.daily_job_date || sourceData.dailyJobDate) ? toDateOnly(sourceData.daily_job_date || sourceData.dailyJobDate) : "",
                    workOrderLineID: sourceData.work_order_line_id || sourceData.workOrderLineID || "",
                    operationID: sourceData.operation_id || sourceData.operationID || "",
                    operationIDText: sourceData.operation_id_text || sourceData.operationIDText || "",
                    operationSequence: sourceData.operation_sequence ?? sourceData.operationSequence ?? "",
                    productionCycle: sourceData.production_cycle ?? sourceData.productionCycle ?? "",
                    qtyPlanned: sourceData.qty_planned ?? sourceData.qtyPlanned ?? "",
                    qtyInput: sourceData.qty_input ?? sourceData.qtyInput ?? "",
                    qtyOutput: sourceData.qty_output ?? sourceData.qtyOutput ?? "",
                    qtyScrapped: sourceData.qty_scrapped ?? sourceData.qtyScrapped ?? "",
                    qtyCopperScrapped: sourceData.qty_copper_scrapped ?? sourceData.qtyCopperScrapped ?? "",
                    workOrderID: sourceData.work_order_id ?? sourceData.workOrderID ?? "",
                    workOrderNumber: sourceData.work_order_no || sourceData.workOrderNumber || "",

                    itemCode: sourceData.item_code || sourceData.itemCode || "",
                    itemDescription: sourceData.item_description || sourceData.itemDescription || "",
                    itemUnit: sourceData.item_unit || sourceData.itemUnit || "",
                    responsiblePersonId: sourceData.responsible_person_id || sourceData.responsiblePersonId ? String(sourceData.responsible_person_id || sourceData.responsiblePersonId) : "",
                    operationStatus: sourceData.operation_status || sourceData.operationStatus ? String(sourceData.operation_status || sourceData.operationStatus) : "1",
                    preparedBy: sourceData.prep_by || sourceData.preparedBy || "",
                    prepDate: (sourceData.prep_date || sourceData.prepDate) ? toDateOnly(sourceData.prep_date || sourceData.prepDate) : "",
                    updatedBy: sourceData.update_by || sourceData.updatedBy || "",
                    updateDate: (sourceData.update_date || sourceData.updateDate) ? toDateOnly(sourceData.update_date || sourceData.updateDate) : "",
                    jobCardPrepDate: sourceData.prep_date || sourceData.jobCardPrepDate || "",
                    itemID: sourceData.item_id || sourceData.itemID || "",
                    itemType: sourceData.item_type || sourceData.itemType || "",
                    startTime: sourceData.start_time || sourceData.startTime ? toDateTimeLocal(sourceData.start_time || sourceData.startTime) : "",
                    endTime: sourceData.end_time || sourceData.endTime ? toDateTimeLocal(sourceData.end_time || sourceData.endTime) : "",
                };
                valuesRef.current = iv;
                return iv;
            }
            return { ...initialForm };
        }, [initialData, fetchedData, toDateOnly, toDateTimeLocal]);

        const DRAFT_KEY = "draft_dailyjob";

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
            setSubmitting(true);
            try {
                const payload = {
                    jobCardID: Number(values.dailyJobID),
                    jobCardNumber: values.jobCardNumber || "0",
                    workOrderLineID: Number(values.workOrderLineID),
                    operationID: Number(values.operationID),
                    operationSequence: Number(values.operationSequence),
                    quantityPlanned: Number(values.qtyPlanned),
                    quantityInput: Number(values.qtyInput),
                    quantityOutput: Number(values.qtyOutput),
                    quantityScrapped: Number(values.qtyScrapped),
                    quantityCopperScrapped: Number(values.qtyCopperScrapped) || 0,
                    productionCycle: Number(values.productionCycle),
                    operationStatus: Number(values.operationStatus),
                    startTime: formatToApiDate(values.startTime),
                    endTime: formatToApiDate(values.endTime),
                    responsiblePersonID: String(values.responsiblePersonId),
                    preparedBy: values.preparedBy || getPreparedBy(),
                    workOrderID: Number(values.workOrderID),
                    workOrderNumber: values.workOrderNumber || "0",
                    updatedBy: getPreparedBy(),
                    itemID: Number(values.itemID) || 0,
                    itemType: values.itemType || "",
                    shortCut: "",
                    paramType: "ADD"
                };

                const res = await saveAndUpdateDailyJob(payload);
                if (res && res.Status === SUCCESS_STATUS) {
                    showToast(res.data?.JOB_CARD_RESPONSE?.[0]?.Message || "Daily Job saved successfully!", SUCCESS_STATUS);
                    resetDirty();
                    const savedId = res.data?.JOB_CARD_RESPONSE?.[0]?.ID || Number(values.dailyJobID);
                    if (onSuccess) onSuccess(savedId);
                } else {
                    let errorMessage = "Failed to save Daily Job.";
                    if (res?.data?.JOB_CARD_RESPONSE?.[0]?.Message && res.data.JOB_CARD_RESPONSE[0].Message !== "OK") {
                        errorMessage = res.data.JOB_CARD_RESPONSE[0].Message;
                    } else if (res?.data?.ValidationErrors?.length > 0) {
                        errorMessage = res.data.ValidationErrors[0].Message;
                    } else if (res?.message && res.message !== "OK") {
                        errorMessage = res.message;
                    }
                    showToast(errorMessage, ERROR_STATUS.toLowerCase());
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
          `}</style>

                    <FullPageLoader
                        loading={submitting}
                        message="Saving Daily Job..."
                        logoSrc={inspireLogo}
                    />
                    {loadingDetails && <Loader />}

                    <ValidatedForm
                        key={fetchedData ? `dailyjob-${fetchedData.dailyJobID}` : (initialData ? `dailyjob-${initialData.daily_job_id}` : 'initial')}
                        ref={validatedFormRef}
                        initialValues={initialValues}
                        validation={validation}
                        onSubmit={handleSubmit}
                        onValuesChange={handleFormValuesChange}
                    >
                        {({ values, errors, handleChange, handleBlur }) => {
                            const isInitiallyCompleted = initialValues.operationStatus === "3" || initialValues.operationStatus === 3;
                            return (
                                <>
                                    <div className="row mb-4">
                                        <div className="col-md-3">
                                            <div className="row g-2">
                                                <div className="col-md-6">
                                                    <FormField
                                                        label="Job Card No"
                                                        name="jobCardNumber"
                                                        value={values.jobCardNumber}
                                                        disabled={true}
                                                        style={{ textAlign: 'right' }}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <FormField
                                                        label="WO No"
                                                        name="workOrderNumber"
                                                        value={values.workOrderNumber}
                                                        disabled={true}
                                                        style={{ textAlign: 'right' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-2">
                                            <FormField
                                                label="Date"
                                                name="dailyJobDate"
                                                type="date"
                                                value={values.dailyJobDate}
                                                disabled={true}
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

                                    <div className="row mb-4">
                                        <div className="col-md-3">
                                            <FormField
                                                label="Operation"
                                                name="operationIDText"
                                                value={values.operationIDText}
                                                disabled={true}
                                                style={{ textAlign: 'left' }}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <FormField
                                                label="Unit"
                                                name="itemUnit"
                                                value={values.itemUnit}
                                                disabled={true}
                                                style={{ textAlign: 'left' }}
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <FormField
                                                label="Operation Sequence"
                                                name="operationSequence"
                                                value={values.operationSequence}
                                                disabled={true}
                                                style={{ textAlign: 'right' }}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <FormField
                                                label="Production Cycle"
                                                name="productionCycle"
                                                value={values.productionCycle}
                                                disabled={true}
                                                style={{ textAlign: 'right' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-3">
                                            <FormField
                                                label="Qty Planned"
                                                name="qtyPlanned"
                                                value={values.qtyPlanned}
                                                disabled={true}
                                                style={{ textAlign: 'right' }}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <FormField
                                                label="Qty Input"
                                                name="qtyInput"
                                                value={values.qtyInput}
                                                disabled={true}
                                                style={{ textAlign: 'right' }}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <FormField
                                                label="Qty Output"
                                                name="qtyOutput"
                                                value={values.qtyOutput}
                                                disabled={true}
                                                style={{ textAlign: 'right' }}
                                            />
                                        </div>
                                        <div className="col">
                                            <FormField
                                                label="Qty Scrapped"
                                                name="qtyScrapped"
                                                value={values.qtyScrapped}
                                                disabled={true}
                                                style={{ textAlign: 'right' }}
                                            />
                                        </div>
                                        <div className="col">
                                            <FormField
                                                label="Qty Copper Scrapped"
                                                name="qtyCopperScrapped"
                                                value={values.qtyCopperScrapped}
                                                disabled={true}
                                                style={{ textAlign: 'right' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-3">
                                            <FormField
                                                label="Start Time"
                                                name="startTime"
                                                type="datetime-local"
                                                value={values.startTime}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isDisabledState}
                                                error={errors.startTime}
                                                min={values.jobCardPrepDate ? `${values.jobCardPrepDate.split("T")[0]}T00:00` : minDateTime}
                                            />
                                        </div>
                                        <div className="col-md-3">
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

                                        <div className="col-md-3">
                                            <ReactSelectField
                                                label="Operation Status"
                                                name="operationStatus"
                                                options={operationStatusOptions}
                                                value={values.operationStatus}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={true}
                                                error={errors.operationStatus}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <ReactSelectField
                                                label="Responsible Person"
                                                name="responsiblePersonId"
                                                options={responsiblePersonOptions}
                                                value={values.responsiblePersonId}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={true}
                                                error={errors.responsiblePersonId}
                                                required={false}
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-3">
                                            <FormField
                                                label="Prepared By"
                                                name="preparedBy"
                                                value={values.preparedBy}
                                                disabled={true}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <FormField
                                                label="Prep Date"
                                                name="prepDate"
                                                type="date"
                                                value={values.prepDate}
                                                disabled={true}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <FormField
                                                label="Updated By"
                                                name="updatedBy"
                                                value={values.updatedBy}
                                                disabled={true}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <FormField
                                                label="Update Date"
                                                name="updateDate"
                                                type="date"
                                                value={values.updateDate}
                                                disabled={true}
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

export default SaveOrUpdateDailyJob;
