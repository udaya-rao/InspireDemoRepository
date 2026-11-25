import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { FormField, ReactSelectField } from "../../components/FormElement";
import { useToast } from "../../components/useToast";
import { SUCCESS_STATUS, ERROR_STATUS } from "../../utils/ConstVariables";
import { PopupDialog } from "../../components/Notification";
import { DECIMAL_QTY_REGEX } from "../../utils/regexUtils";
import {
    fetchQAStatusOptions,
    fetchSubCharacteristicNameList,
    fetchInspectionDetails,
    saveAndUpdateInspectionDetails,
    fetchInspectionObservationDetails
} from "../../services/grnService";
import { viewOrDeleteInspectionVideoFiles } from "../../services/inspectionMasterService";
import { getPreparedBy } from "../../utils/userSession";
import FullPageLoader from "../../components/FullPageLoader";
import Loader from "../../components/Loader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";

const InspectionResult = forwardRef(({
    grnID: grnIDProp,
    grnNo: grnNoProp,
    rowData,
    editMode = false,
    onDirtyChange,
    onSuccess,
    inspectionHeaderID: inspectionHeaderIDProp,
    grnLineID: grnLineIDProp,
}, ref) => {
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [loadingDetails,] = useState(false);

    const grnID = grnIDProp || rowData?.grn_id || "";
    const grnNo = grnNoProp || rowData?.grn_no || grnID || "";

    // ── GENERAL INFORMATION STATE ──────────────────────────────────
    const [generalInfo, setGeneralInfo] = useState({
        grnNoDate: rowData
            ? `${rowData.grn_no || ""} / ${rowData.grn_date ? rowData.grn_date.substring(0, 10).split('-').reverse().join('-') : new Date().toISOString().substring(0, 10).split('-').reverse().join('-')}`
            : `${grnNo} / ${new Date().toISOString().substring(0, 10).split('-').reverse().join('-')}`,
        itemCode: rowData?.item_code || "",
        itemDescription: rowData?.item_description || "",
        unit: rowData?.unit || rowData?.item_unit || "Nos",
        batchNo: rowData?.batch_no || "",
        qtyOfferedForInspection: rowData?.qty_offered_for_inspection !== null && rowData?.qty_offered_for_inspection !== undefined
            ? String(rowData.qty_offered_for_inspection)
            : "",
        qtyRejected: rowData?.qty_rejected !== null && rowData?.qty_rejected !== undefined ? String(rowData.qty_rejected) : "",
        testingRejected: rowData?.qty_testing_rejected !== null && rowData?.qty_testing_rejected !== undefined ? String(rowData.qty_testing_rejected) : "",
        qtyRejectedReason: rowData?.qty_rejected_reason || "",
        qtyAccepted: rowData?.qty_accepted !== null && rowData?.qty_accepted !== undefined ? String(rowData.qty_accepted) : "",
        qtyAcceptedForSupplier: rowData?.qty_accepted_for_supplier !== null && rowData?.qty_accepted_for_supplier !== undefined ? String(rowData.qty_accepted_for_supplier) : "",
        qaStatus: rowData?.qa_status !== null && rowData?.qa_status !== undefined ? String(rowData.qa_status) : "0",
        documentStatus: rowData?.doc_status_text || "",
        qaCheckedBy: (rowData?.qa_status === 0 || rowData?.qa_status === "0" || rowData?.qa_status === 5 || rowData?.qa_status === "5") ? "" : (rowData?.qa_checked_by || rowData?.prep_by || getPreparedBy()),
        qaCheckedDate: (rowData?.qa_status === 0 || rowData?.qa_status === "0" || rowData?.qa_status === 5 || rowData?.qa_status === "5") ? "" : (rowData?.qa_checked_date ? rowData.qa_checked_date.substring(0, 10) : new Date().toISOString().substring(0, 10)),
        itemType: rowData?.item_type || rowData?.itemType || "",
    });

    // Resolve inspectionHeaderID and grnLineID from props or rowData
    const inspectionHeaderID = inspectionHeaderIDProp || rowData?.inspection_header_id || rowData?.inspectionHeaderID || 0;
    const grnLineID = grnLineIDProp || rowData?.grn_line_id || rowData?.grnLineID || 0;

    const lastLoadedRef = useRef({ headerID: null, lineID: null });

    useEffect(() => {
        // ── Helper: map a detail line from INSPECTION_DETAILS_RESPONSE ───────
        const mapDetailRow = (d, index) => {
            const rawObs = d.inspectionObservation || d.inspection_observation || [];
            const observedReadings = Array.isArray(rawObs)
                ? rawObs.map(o => {
                    const val = o.observedReading !== null && o.observedReading !== undefined ? o.observedReading : o.observed_reading;
                    return val !== null && val !== undefined ? String(val) : "";
                }).filter(Boolean)
                : [];

            const expMin = d.expectedMinimumReading !== null && d.expectedMinimumReading !== undefined ? d.expectedMinimumReading : d.expected_min_reading;
            const expMax = d.expectedMaximumReading !== null && d.expectedMaximumReading !== undefined ? d.expectedMaximumReading : d.expected_max_reading;
            const actMin = d.actualMinimumReading !== null && d.actualMinimumReading !== undefined ? d.actualMinimumReading : d.actual_min_reading;
            const actMax = d.actualMaximumReading !== null && d.actualMaximumReading !== undefined ? d.actualMaximumReading : d.actual_max_reading;

            return {
                slNo: index + 1,
                inspectionLineID: d.inspectionLineID || d.inspection_line_id || d.inspectionDetailID || 0,
                inspectionHeaderID: d.inspectionHeaderID || d.inspection_header_id || 0,
                characteristicId: d.characteristicID || d.characteristicId || d.characteristic_id || 0,
                characteristicSortSeq: d.characteristicSortSequence || d.characteristicSortSeq || d.characteristic_sort_seq || 0,
                characteristicName: d.characteristicName || d.characteristic_name || "",
                subCharacteristicName: d.subCharacteristicName || d.sub_characteristic_name || "",
                subSortSeq: d.subSortSequence || d.subSortSeq || d.sub_sort_seq || 0,
                expectedResult: d.expectedResult !== null && d.expectedResult !== undefined ? String(d.expectedResult) : (d.expected_result !== null && d.expected_result !== undefined ? String(d.expected_result) : ""),
                expectedMinReading: (expMin !== null && expMin !== undefined && Number(expMin) !== 0) ? String(expMin) : "",
                expectedMaxReading: (expMax !== null && expMax !== undefined && Number(expMax) !== 0) ? String(expMax) : "",
                actualResult: d.actualResult || d.actual_result || d.actualResult || "",
                actualMinReading: (actMin !== null && actMin !== undefined && Number(actMin) !== 0) ? String(actMin) : "",
                actualMaxReading: (actMax !== null && actMax !== undefined && Number(actMax) !== 0) ? String(actMax) : "",
                unitOfMeasure: d.unitOfMeasure || d.unit_of_measure || "",
                qaStatus: d.qaStatus !== null && d.qaStatus !== undefined ? String(d.qaStatus) : (d.qa_status !== null && d.qa_status !== undefined ? String(d.qa_status) : "0"),
                resultRemarks: d.resultRemarks || d.result_remarks || "",
                observedReadings: observedReadings,
                observedReading: "",
                rawObservations: Array.isArray(rawObs) ? rawObs : [],
                hasFetchedObservations: false,
                isVideoUploaded: String(d.is_video_uploaded || d.isVideoUploaded || "N").toUpperCase(),
                inspId: d.insp_id || d.inspId || d.inspectionID || d.inspection_id || d.inspectionId || 0,
                videoItemCode: d.item_code || d.itemCode || d.videoItemCode || ""
            };
        };

        // ── load sub-characteristics for a brand-new inspection ─────
        const loadSubCharacteristics = async (fetchedItemType = "") => {
            const itemId = rowData?.item_id;
            if (!itemId) return;
            try {
                const itemType = fetchedItemType || rowData?.item_type || "";
                const response = await fetchSubCharacteristicNameList(itemId, itemType);
                const dropdownList = Array.isArray(response)
                    ? response
                    : (response?.data?.DROPDOWN_LIST || response?.DROPDOWN_LIST || []);
                if (Array.isArray(dropdownList) && dropdownList.length > 0) {
                    const mappedRows = dropdownList.map((item, index) => {
                        const isNoData = !!item.Message && item.ID === "0";
                        return {
                            slNo: index + 1,
                            inspectionLineID: 0,
                            inspectionHeaderID: 0,
                            characteristicId: item.characteristic_id || 0,
                            characteristicSortSeq: item.characteristic_sort_seq || 0,
                            characteristicName: isNoData ? "" : (item.characteristic_name || ""),
                            subCharacteristicName: isNoData ? item.Message : (item.sub_characteristic_name || ""),
                            isNoData: isNoData,
                            subSortSeq: item.sub_sort_seq || 0,
                            expectedResult: item.expected_result !== null && item.expected_result !== undefined ? String(item.expected_result) : "",
                            expectedMinReading: (item.expected_min_reading !== null && item.expected_min_reading !== undefined && Number(item.expected_min_reading) !== 0) ? String(item.expected_min_reading) : "",
                            expectedMaxReading: (item.expected_max_reading !== null && item.expected_max_reading !== undefined && Number(item.expected_max_reading) !== 0) ? String(item.expected_max_reading) : "",
                            actualResult: "",
                            actualMinReading: "",
                            actualMaxReading: "",
                            unitOfMeasure: item.unit_of_measure || "",
                            qaStatus: "0",
                            resultRemarks: "",
                            observedReadings: [],
                            observedReading: "",
                            hasFetchedObservations: false,
                            // Video fields from sub-characteristic dropdown
                            isVideoUploaded: String(item.is_video_uploaded || "N").toUpperCase(),
                            inspId: item.insp_id || 0,
                            videoItemCode: item.item_code || ""
                        };
                    });
                    setRows(mappedRows);
                    setActiveIndex(0);
                }
            } catch (err) {
                console.error("Error loading Sub-Characteristics:", err);
            }
        };

        // ── Primary path: call GetInspectionDetails API ───────────────────────
        const loadInspectionDetails = async () => {
            const headerID = Number(inspectionHeaderID);
            const lineID = Number(grnLineID);

            if (lastLoadedRef.current.headerID === headerID && lastLoadedRef.current.lineID === lineID) {
                return;
            }
            lastLoadedRef.current = { headerID, lineID };

            // Call GetInspectionDetails endpoint if we have a grnLineID or inspectionHeaderID
            if (lineID > 0 || headerID > 0) {
                try {
                    const res = await fetchInspectionDetails({
                        inspectionHeaderID: headerID,
                        grnLineID: lineID,
                    });

                    if (res && res.Status === SUCCESS_STATUS && res.data) {
                        // ── Map header fields ─────────────────────────────────────
                        const header = res.data.INSPECTION_HEADER_RESPONSE?.[0];
                        if (header) {
                            setGeneralInfo({
                                grnNoDate: `${header.grn_no || ""} / ${header.grn_date ? header.grn_date.substring(0, 10).split('-').reverse().join('-') : ""}`,
                                itemCode: header.work_order_no ? (header.work_order_item_code || header.item_code || "") : (header.purchase_order_no ? (header.purchase_order_item_code || header.item_code || "") : (header.item_code || rowData?.item_code || "")),
                                itemDescription: header.work_order_no ? (header.work_order_item_description || header.item_description || "") : (header.purchase_order_no ? (header.purchase_order_item_description || header.item_description || "") : (header.item_description || rowData?.item_description || "")),
                                unit: header.item_unit || "",
                                batchNo: header.batch_no || "",
                                qtyOfferedForInspection: header.qty_offered_for_inspection !== null && header.qty_offered_for_inspection !== undefined ? String(header.qty_offered_for_inspection) : "",
                                qtyRejected: header.qty_rejected !== null && header.qty_rejected !== undefined ? String(header.qty_rejected) : "",
                                testingRejected: header.qty_testing_rejected !== null && header.qty_testing_rejected !== undefined ? String(header.qty_testing_rejected) : "",
                                qtyRejectedReason: header.qty_rejected_reason || "",
                                qtyAccepted: header.qty_accepted !== null && header.qty_accepted !== undefined ? String(header.qty_accepted) : "",
                                qtyAcceptedForSupplier: header.qty_accepted_for_supplier !== null && header.qty_accepted_for_supplier !== undefined ? String(header.qty_accepted_for_supplier) : "",
                                qaStatus: header.qa_status !== null && header.qa_status !== undefined ? String(header.qa_status) : "0",
                                documentStatus: header.doc_istatus_text || header.doc_status_text || "",
                                qaCheckedBy: (header.qa_status === 0 || header.qa_status === "0" || header.qa_status === 5 || header.qa_status === "5") ? "" : (header.qa_checked_by || header.prep_by || getPreparedBy()),
                                qaCheckedDate: (header.qa_status === 0 || header.qa_status === "0" || header.qa_status === 5 || header.qa_status === "5") ? "" : (header.qa_checked_date ? header.qa_checked_date.substring(0, 10) : new Date().toISOString().substring(0, 10)),
                                itemType: header.item_type || header.itemType || rowData?.item_type || rowData?.itemType || "FG",
                            });
                        }

                        // ── Map inspection detail lines ───────────────────────────
                        const details = res.data.INSPECTION_DETAILS_RESPONSE;
                        if (Array.isArray(details) && details.length > 0) {
                            const mappedRows = details.map(mapDetailRow);
                            setRows(mappedRows);
                            const firstPendingIndex = mappedRows.findIndex(row => !row.qaStatus || String(row.qaStatus) === "0" || String(row.qaStatus) === "5");
                            if (firstPendingIndex !== -1) {
                                setActiveIndex(firstPendingIndex);
                            } else {
                                setActiveIndex(0);
                            }
                        } else {
                            // Existing header but no lines yet — load the master sub-char list
                            await loadSubCharacteristics(header?.item_type);
                        }
                        return;
                    }
                } catch (err) {
                    console.error("Error loading inspection details:", err);
                }
                // If the API call failed, fall through to sub-characteristics
                await loadSubCharacteristics();
                return;
            }

            // No header/line IDs — this is a fresh record; load sub-characteristic master list
            await loadSubCharacteristics();
        };

        loadInspectionDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inspectionHeaderID, grnLineID, rowData?.item_id]);

    const [errors, setErrors] = useState({});
    const [qaStatusOptions, setQaStatusOptions] = useState([]);



    useEffect(() => {
        const loadQaStatusOptions = async () => {
            try {
                const data = await fetchQAStatusOptions();
                if (Array.isArray(data)) {
                    setQaStatusOptions(
                        data.map((item) => ({
                            value: String(item.ValueText),
                            label: item.DisplayText,
                        }))
                    );
                }
            } catch (err) {
                console.error("Error loading QA Status options:", err);
            }
        };
        loadQaStatusOptions();
    }, []);

    const [rows, setRows] = useState([]);

    const [activeIndex, setActiveIndex] = useState(0);

    // ── VIDEO PLAYER STATE ──────────────────────────────────────────
    const [videoState, setVideoState] = useState("idle"); // idle | loading | playing | error
    const [videoUrl, setVideoUrl] = useState("");
    const [videoError, setVideoError] = useState("");

    const activeRowLineID = Number(rows[activeIndex]?.inspectionLineID || rows[activeIndex]?.inspectionDetailID || 0);
    const hasFetched = rows[activeIndex]?.hasFetchedObservations;

    // Reset video state whenever the active row changes
    useEffect(() => {
        setVideoState("idle");
        setVideoUrl("");
        setVideoError("");
    }, [activeIndex]);

    useEffect(() => {
        if (activeRowLineID > 0 && hasFetched === false) {
            const fetchCurrentObservation = async () => {
                try {
                    const response = await fetchInspectionObservationDetails({ inspectionLineID: activeRowLineID });
                    if (response && response.Status === SUCCESS_STATUS) {
                        const rawList = response.data?.INSPECTION_OBSERVATION_RESPONSE || response.data || [];
                        const fetchedReadings = Array.isArray(rawList) ? rawList.map(o => {
                            const val = o.observedReading !== null && o.observedReading !== undefined ? o.observedReading : o.observed_reading;
                            return val !== null && val !== undefined ? String(val) : "";
                        }).filter(v => v !== "") : [];

                        setRows(prev => {
                            const newRows = [...prev];
                            newRows[activeIndex] = {
                                ...newRows[activeIndex],
                                observedReadings: fetchedReadings,
                                rawObservations: Array.isArray(rawList) ? rawList : [],
                                hasFetchedObservations: true
                            };
                            return newRows;
                        });
                    }
                } catch (err) {
                    console.error("Error fetching observation lazily:", err);
                }
            };
            fetchCurrentObservation();
        }
    }, [activeIndex, activeRowLineID, hasFetched]);

    useEffect(() => {
        if (rows.length > 0) {
            const anyRowHasInput = rows.some(row => {
                const actRes = row?.actualResult || "";
                const actMin = row?.actualMinReading || "";
                const actMax = row?.actualMaxReading || "";
                return actRes.trim() !== "" || actMin.trim() !== "" || actMax.trim() !== "";
            });

            if (anyRowHasInput) {
                if (String(generalInfo.qaStatus || "0") === "0") {
                    setGeneralInfo(prev => ({
                        ...prev,
                        qaStatus: "5",
                        qaCheckedBy: "",
                        qaCheckedDate: ""
                    }));
                }
            } else {
                if (String(generalInfo.qaStatus || "0") === "5") {
                    setGeneralInfo(prev => ({
                        ...prev,
                        qaStatus: "0",
                        qaCheckedBy: "",
                        qaCheckedDate: ""
                    }));
                }
            }
        }
    }, [rows, generalInfo.qaStatus]);

    const isRowValid = (idx) => {
        const row = rows[idx];
        if (!row) return true;

        const hasMinMax = row.expectedMinReading !== null && row.expectedMinReading !== undefined && String(row.expectedMinReading).trim() !== "" &&
            row.expectedMaxReading !== null && row.expectedMaxReading !== undefined && String(row.expectedMaxReading).trim() !== "";
        const hasExpectedResult = row.expectedResult !== null && row.expectedResult !== undefined && String(row.expectedResult).trim() !== "";

        if (hasExpectedResult && (!row.actualResult || !String(row.actualResult).trim())) {
            return false;
        }

        const lineID = Number(row.inspectionLineID || row.inspectionDetailID || 0);
        const hasObservations = (row.observedReadings && row.observedReadings.length > 0) ||
            (lineID > 0 && row.hasFetchedObservations === false && row.actualMinReading && row.actualMaxReading);

        if (hasMinMax && !hasObservations) {
            return false;
        }

        if (!row.qaStatus || String(row.qaStatus) === "0" || String(row.qaStatus) === "5") {
            return false;
        }

        return true;
    };

    const isRowAccessible = (targetIndex) => {
        if (targetIndex <= activeIndex) return true;
        for (let i = 0; i < targetIndex; i++) {
            if (!isRowValid(i)) return false;
        }
        return true;
    };

    const validateCurrentRow = () => {
        const row = rows[activeIndex];
        if (!row) return true;

        const hasMinMax = row.expectedMinReading !== null && row.expectedMinReading !== undefined && String(row.expectedMinReading).trim() !== "" &&
            row.expectedMaxReading !== null && row.expectedMaxReading !== undefined && String(row.expectedMaxReading).trim() !== "";
        const hasExpectedResult = row.expectedResult !== null && row.expectedResult !== undefined && String(row.expectedResult).trim() !== "";

        let isValid = true;
        let actualResultError = null;
        let actualMinReadingError = null;
        let actualMaxReadingError = null;
        let qaStatusError = null;

        if (hasExpectedResult && (!row.actualResult || !String(row.actualResult).trim())) {
            actualResultError = "Enter The Actual Result.";
            isValid = false;
        }

        const lineID = Number(row.inspectionLineID || row.inspectionDetailID || 0);
        const hasObservations = (row.observedReadings && row.observedReadings.length > 0) ||
            (lineID > 0 && row.hasFetchedObservations === false && row.actualMinReading && row.actualMaxReading);

        if (hasMinMax && !hasObservations) {
            actualMinReadingError = "Enter The Reading From Inspection Observation.";
            actualMaxReadingError = "Enter The Reading From Inspection Observation.";
            isValid = false;
        }

        if (!row.qaStatus || String(row.qaStatus) === "0" || String(row.qaStatus) === "5") {
            qaStatusError = "Select The Valid Status.";
            isValid = false;
        }

        if (!isValid) {
            setErrors(prev => {
                const newErrors = { ...prev };

                const allRowErrors = [...(prev.rows || [])];
                const rowErrs = { ...allRowErrors[activeIndex] };
                if (actualResultError) {
                    rowErrs.actualResult = actualResultError;
                } else {
                    delete rowErrs.actualResult;
                }

                if (actualMinReadingError) {
                    rowErrs.actualMinReading = actualMinReadingError;
                } else {
                    delete rowErrs.actualMinReading;
                }

                if (qaStatusError) {
                    rowErrs.qaStatus = qaStatusError;
                } else {
                    delete rowErrs.qaStatus;
                }

                if (actualMaxReadingError) {
                    rowErrs.actualMaxReading = actualMaxReadingError;
                } else {
                    delete rowErrs.actualMaxReading;
                }

                allRowErrors[activeIndex] = Object.keys(rowErrs).length > 0 ? rowErrs : undefined;
                newErrors.rows = allRowErrors;

                return newErrors;
            });

            return false;
        }

        setErrors(prev => {
            const allRowErrors = [...(prev.rows || [])];
            if (allRowErrors[activeIndex]) {
                const rowErrs = { ...allRowErrors[activeIndex] };
                delete rowErrs.actualResult;
                delete rowErrs.actualMinReading;
                delete rowErrs.actualMaxReading;
                delete rowErrs.qaStatus;
                allRowErrors[activeIndex] = Object.keys(rowErrs).length > 0 ? rowErrs : undefined;
            }
            return { ...prev, rows: allRowErrors };
        });

        return true;
    };

    const handleNavigate = (newIndex) => {
        if (newIndex > activeIndex) {
            if (!validateCurrentRow()) return;
        }
        setActiveIndex(newIndex);
    };

    const handlePrev = () => {
        if (activeIndex > 0) {
            handleNavigate(activeIndex - 1);
        }
    };

    const handleNext = () => {
        if (activeIndex < rows.length - 1) {
            handleNavigate(activeIndex + 1);
        }
    };

    const [showObservation, setShowObservation] = useState(false);
    const [tempObservedReadings, setTempObservedReadings] = useState([""]);

    useEffect(() => {
        if (showObservation && editMode) {
            const timer = setTimeout(() => {
                const firstInput = document.getElementById("observation-input-0");
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showObservation, editMode]);

    const handleOpenObservation = async () => {
        const row = rows[activeIndex];
        const lineID = Number(row?.inspectionLineID || row?.inspectionDetailID || 0);

        // 1. Check in-memory observedReadings first
        let existing = row?.observedReadings;
        if (!existing || existing.length === 0) {
            if (row?.observedReading && typeof row.observedReading === "string" && row.observedReading.trim() !== "") {
                existing = row.observedReading.split(",").map(s => s.trim()).filter(Boolean);
            }
        }

        // 2. Only fetch from API if we do not have in-memory readings, haven't fetched yet, and lineID > 0
        if ((!existing || existing.length === 0) && lineID > 0 && !row?.hasFetchedObservations) {
            try {
                const response = await fetchInspectionObservationDetails({ inspectionLineID: lineID });
                if (response && response.Status === SUCCESS_STATUS) {
                    const rawList = response.data?.INSPECTION_OBSERVATION_RESPONSE || response.data || [];
                    if (Array.isArray(rawList) && rawList.length > 0) {
                        const fetchedReadings = rawList.map(o => {
                            const val = o.observedReading !== null && o.observedReading !== undefined ? o.observedReading : o.observed_reading;
                            return val !== null && val !== undefined ? String(val) : "";
                        }).filter(v => v !== "");

                        if (fetchedReadings.length > 0) {
                            setRows(prev => prev.map((r, idx) => {
                                if (idx === activeIndex) {
                                    return {
                                        ...r,
                                        observedReadings: fetchedReadings,
                                        rawObservations: rawList,
                                        hasFetchedObservations: true
                                    };
                                }
                                return r;
                            }));

                            setTempObservedReadings([...fetchedReadings]);
                            setShowObservation(true);
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching inspection observation details:", err);
            }
        }

        // 3. If in-memory readings exist, load them into modal
        if (Array.isArray(existing) && existing.length > 0) {
            setTempObservedReadings([...existing]);
        } else {
            // 4. Fallback to actualMinReading / actualMaxReading if present
            const actMin = row?.actualMinReading != null && String(row.actualMinReading).trim() !== "" ? String(row.actualMinReading).trim() : "";
            const actMax = row?.actualMaxReading != null && String(row.actualMaxReading).trim() !== "" ? String(row.actualMaxReading).trim() : "";

            if (actMin && actMax) {
                if (actMin === actMax) {
                    setTempObservedReadings([actMin]);
                } else {
                    setTempObservedReadings([actMin, actMax]);
                }
            } else if (actMin) {
                setTempObservedReadings([actMin]);
            } else if (actMax) {
                setTempObservedReadings([actMax]);
            } else {
                setTempObservedReadings([""]);
            }
        }

        setShowObservation(true);
    };

    const handleAddObservationField = () => {
        setTempObservedReadings(prev => {
            const next = [...prev, ""];
            const targetIndex = next.length - 1;
            setTimeout(() => {
                const newEl = document.getElementById(`observation-input-${targetIndex}`);
                if (newEl) {
                    newEl.focus();
                    newEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }, 60);
            return next;
        });
    };

    const handleRemoveObservationField = (index) => {
        setTempObservedReadings(prev => {
            if (prev.length <= 1) return [""];
            const next = prev.filter((_, i) => i !== index);
            const targetIndex = Math.max(0, index - 1);
            setTimeout(() => {
                const el = document.getElementById(`observation-input-${targetIndex}`);
                if (el) el.focus();
            }, 60);
            return next;
        });
    };

    const handleObservationChange = (index, value) => {
        if (value === "" || DECIMAL_QTY_REGEX.test(value)) {
            setTempObservedReadings(prev => {
                const updated = [...prev];
                updated[index] = value;
                return updated;
            });
        }
    };

    const handleSaveObservation = () => {
        const validReadings = tempObservedReadings.map(s => s.trim()).filter(Boolean);
        const joinedStr = validReadings.join(", ");

        let minReading = "";
        let maxReading = "";
        if (validReadings.length > 0) {
            if (validReadings.length === 1) {
                // If only 1 reading is entered, use its exact string value for both min and max
                minReading = validReadings[0];
                maxReading = validReadings[0];
            } else {
                const numericReadings = validReadings.map(Number).filter(n => !isNaN(n));
                if (numericReadings.length > 0) {
                    minReading = String(Math.min(...numericReadings));
                    maxReading = String(Math.max(...numericReadings));
                }
            }
        }

        setRows(prev => prev.map((row, idx) => {
            if (idx === activeIndex) {
                const updatedRow = {
                    ...row,
                    observedReadings: validReadings,
                    observedReading: joinedStr,
                    actualMinReading: minReading,
                    actualMaxReading: maxReading,
                    hasFetchedObservations: true
                };

                const hasInput = (row.actualResult || "").trim() !== "" ||
                    minReading.trim() !== "" ||
                    maxReading.trim() !== "";

                if (hasInput) {
                    if (String(row.qaStatus || "0") === "0") {
                        updatedRow.qaStatus = "5"; // Inspection In Progress
                    }
                } else {
                    updatedRow.qaStatus = "0";
                }

                return updatedRow;
            }
            return row;
        }));

        setErrors(prev => {
            if (prev.rows && prev.rows[activeIndex]) {
                const nextRows = [...prev.rows];
                const nextRowErr = { ...nextRows[activeIndex] };
                delete nextRowErr.actualMinReading;
                delete nextRowErr.actualMaxReading;
                if (Object.keys(nextRowErr).length === 0) {
                    nextRows[activeIndex] = undefined;
                } else {
                    nextRows[activeIndex] = nextRowErr;
                }
                return { ...prev, rows: nextRows };
            }
            return prev;
        });

        setShowObservation(false);
        if (typeof onDirtyChange === "function") {
            onDirtyChange(true);
        }
    };

    const handleGeneralInfoChange = (name, value) => {
        if (name === "qtyRejected" || name === "testingRejected" || name === "qtyAccepted" || name === "qtyAcceptedForSupplier") {
            if (value !== "" && !DECIMAL_QTY_REGEX.test(value)) {
                return;
            }
        }
        setGeneralInfo(prev => {
            const next = { ...prev, [name]: value };
            if (name === "qtyRejected" && (Number(value) <= 0 || value === "")) {
                next.qtyRejectedReason = "";
            }
            if (name === "qaStatus") {
                if (String(value) === "0" || String(value) === "5") {
                    next.qaCheckedBy = "";
                    next.qaCheckedDate = "";
                } else {
                    next.qaCheckedBy = getPreparedBy() || "";
                    next.qaCheckedDate = new Date().toISOString().substring(0, 10);
                }
            }
            return next;
        });
        setErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
        if (typeof onDirtyChange === "function") {
            onDirtyChange(true);
        }
    };

    const handleRowChange = (index, field, value) => {
        setRows(prev => prev.map((row, idx) => {
            if (idx === index) {
                const updatedRow = { ...row, [field]: value };

                if (field !== "qaStatus") {
                    const hasInput = (field === "actualResult" ? value : (row.actualResult || "")).trim() !== "" ||
                        (field === "actualMinReading" ? value : (row.actualMinReading || "")).trim() !== "" ||
                        (field === "actualMaxReading" ? value : (row.actualMaxReading || "")).trim() !== "";

                    if (hasInput) {
                        if (String(row.qaStatus || "0") === "0") {
                            updatedRow.qaStatus = "5"; // Inspection In Progress
                        }
                    } else {
                        updatedRow.qaStatus = "0";
                    }
                }

                return updatedRow;
            }
            return row;
        }));
        setErrors(prev => {
            if (prev.rows && prev.rows[index]) {
                const nextRows = [...prev.rows];
                const nextRowErr = { ...nextRows[index] };
                delete nextRowErr[field];
                if (Object.keys(nextRowErr).length === 0) {
                    nextRows[index] = undefined;
                } else {
                    nextRows[index] = nextRowErr;
                }
                return { ...prev, rows: nextRows };
            }
            return prev;
        });
        if (typeof onDirtyChange === "function") {
            onDirtyChange(true);
        }
    };

    const handleSaveInspection = async () => {
        setSubmitting(true);
        try {
            if (rows.length === 1 && rows[0].isNoData) {
                showToast("No Inspection Master records found for this Item!", ERROR_STATUS.toLowerCase());
                throw new Error("No Inspection Master records found for this Item!");
            }

            const newErrors = {};
            if (generalInfo.qtyRejected === null || generalInfo.qtyRejected === undefined || String(generalInfo.qtyRejected).trim() === "") {
                newErrors.qtyRejected = "Enter The Qty Rejected.";
            }
            if (generalInfo.testingRejected === null || generalInfo.testingRejected === undefined || String(generalInfo.testingRejected).trim() === "") {
                newErrors.testingRejected = "Enter The Testing Rejected.";
            }
            if (Number(generalInfo.qtyRejected) > 0 && (!generalInfo.qtyRejectedReason || !String(generalInfo.qtyRejectedReason).trim())) {
                newErrors.qtyRejectedReason = "Enter The Qty Rejected Reason.";
            }
            if (!generalInfo.qaStatus || !String(generalInfo.qaStatus).trim()) {
                newErrors.qaStatus = "Required*";
            }

            const rowErrors = [];
            rows.forEach((row, idx) => {
                if (idx <= activeIndex) {
                    const hasMinMax = row.expectedMinReading !== null && row.expectedMinReading !== undefined && String(row.expectedMinReading).trim() !== "" &&
                        row.expectedMaxReading !== null && row.expectedMaxReading !== undefined && String(row.expectedMaxReading).trim() !== "";
                    const hasExpectedResult = row.expectedResult !== null && row.expectedResult !== undefined && String(row.expectedResult).trim() !== "";

                    const rowErr = {};
                    if (hasExpectedResult && (!row.actualResult || !String(row.actualResult).trim())) {
                        rowErr.actualResult = "Enter The Actual Result.";
                    }

                    const lineID = Number(row.inspectionLineID || row.inspectionDetailID || 0);
                    const hasObservations = (row.observedReadings && row.observedReadings.length > 0) ||
                        (lineID > 0 && row.hasFetchedObservations === false && row.actualMinReading && row.actualMaxReading);

                    if (hasMinMax && !hasObservations) {
                        rowErr.actualMinReading = "Enter The Reading From Inspection Observation.";
                        rowErr.actualMaxReading = "Enter The Reading From Inspection Observation.";
                    }

                    if (Object.keys(rowErr).length > 0) {
                        rowErrors[idx] = rowErr;
                    }
                }
            });

            const hasPrimaryErrors = Object.keys(newErrors).length > 0 || rowErrors.some(Boolean);

            if (hasPrimaryErrors) {
                setErrors({
                    ...newErrors,
                    rows: rowErrors
                });

                // Switch activeIndex to the first invalid row
                const firstInvalidRowIndex = rowErrors.findIndex(Boolean);
                if (firstInvalidRowIndex !== -1 && firstInvalidRowIndex !== activeIndex) {
                    setActiveIndex(firstInvalidRowIndex);
                }
                throw new Error("Validation failed");
            }

            const headerID = Number(inspectionHeaderID || 0);
            const payload = {
                pageSize: 0,
                pageNumber: 0,
                inspectionHeaderID: headerID,
                grnLineID: Number(grnLineID || 0),
                grnid: Number(rowData?.grn_id || rowData?.grnid || grnID || 0),
                itemID: Number(rowData?.item_id || rowData?.itemID || 0),
                itemType: generalInfo.itemType || rowData?.item_type || rowData?.itemType || "FG",
                batchNo: generalInfo.batchNo || rowData?.batch_no || "",
                quantityOfferedForInspection: Number(generalInfo.qtyOfferedForInspection || 0),
                quantityRejected: Number(generalInfo.qtyRejected || 0),
                quantityAccepted: Number(generalInfo.qtyAccepted || 0),
                quantityTestingRejected: Number(generalInfo.testingRejected || 0),
                quantityRejectedReason: generalInfo.qtyRejectedReason || "",
                qaStatus: Number(generalInfo.qaStatus || 0),
                qaCheckedBy: (String(generalInfo.qaStatus || "0") === "0" || String(generalInfo.qaStatus || "0") === "5") ? "" : (generalInfo.qaCheckedBy || rowData?.prep_by || ""),
                qaCheckedDate: (String(generalInfo.qaStatus || "0") === "0" || String(generalInfo.qaStatus || "0") === "5") ? "" : (generalInfo.qaCheckedDate || new Date().toISOString().substring(0, 10)),
                qaNotes: "",
                preparedBy: generalInfo.qaCheckedBy || rowData?.prep_by || "",
                updatedBy: generalInfo.qaCheckedBy || rowData?.prep_by || "",
                inspectionDetail: rows.map((row, index) => {
                    const userSeq = index + 1;
                    const validReadings = Array.isArray(row.observedReadings) ? row.observedReadings : [];
                    const lineID = Number(row.inspectionLineID || row.inspectionDetailID || 0);
                    return {
                        inspectionLineID: lineID,
                        inspectionHeaderID: headerID,
                        inspectionID: Number(row.inspId || 0),
                        userSequenceNo: userSeq,
                        characteristicID: Number(row.characteristicId || 0),
                        characteristicSortSequence: Number(row.characteristicSortSeq || 0),
                        characteristicName: row.characteristicName || "",
                        subCharacteristicName: row.subCharacteristicName || "",
                        subSortSequence: Number(row.subSortSeq || 0),
                        qaStatus: Number(row.qaStatus || 0),
                        expectedResult: row.expectedResult || "",
                        expectedMinimumReading: row.expectedMinReading !== "" ? Number(row.expectedMinReading) : 0,
                        expectedMaximumReading: row.expectedMaxReading !== "" ? Number(row.expectedMaxReading) : 0,
                        actualResult: row.actualResult || "",
                        actualMinimumReading: row.actualMinReading !== "" ? Number(row.actualMinReading) : 0,
                        actualMaximumReading: row.actualMaxReading !== "" ? Number(row.actualMaxReading) : 0,
                        unitOfMeasure: row.unitOfMeasure || "",
                        resultRemarks: row.resultRemarks || "",
                        inspectionObservation: validReadings.map((reading, obsIndex) => {
                            const matchingObs = Array.isArray(row.rawObservations) ? row.rawObservations[obsIndex] : null;
                            return {
                                observationID: Number(matchingObs?.observationID || matchingObs?.observation_id || matchingObs?.inspectionObservationID || 0),
                                inspectionLineID: lineID,
                                userSequenceNo: userSeq,
                                sampleNumber: obsIndex + 1,
                                observedReading: Number(reading) || 0,
                                observedResult: matchingObs?.observedResult || matchingObs?.observed_result || ""
                            };
                        })
                    };
                }),
                paramType: "ADD"
            };

            try {
                const response = await saveAndUpdateInspectionDetails(payload);
                if (response && response.Status === SUCCESS_STATUS) {
                    const header = response?.data?.INSPECTION_RESPONSE?.[0] || response?.data?.QUALITY_GRN_SAVE_RESPONSE?.[0] || response?.data?.[0];
                    const successMsg = header?.Message || header?.message || response?.message || "Inspection Saved Successfully !!!";
                    response.message = successMsg;
                    if (typeof onSuccess === "function") {
                        onSuccess(response);
                    }
                    return response;
                } else {
                    const header = response?.data?.INSPECTION_RESPONSE?.[0] || response?.data?.QUALITY_GRN_SAVE_RESPONSE?.[0] || response?.data?.[0];
                    const errorMsg = header?.Message || header?.message || (response?.message && response.message !== "OK" ? response.message : null) || "Failed to save inspection details";
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error("Error saving inspection details:", error);
                showToast(error.message || "An error occurred while saving inspection details", ERROR_STATUS.toLowerCase());
                throw error;
            }
        } finally {
            setSubmitting(false);
        }
    };

    useImperativeHandle(ref, () => ({
        submit: handleSaveInspection,
        getDocumentStatus: () => Number(inspectionHeaderID) > 0 ? (generalInfo.documentStatus || "") : "Not Approved"
    }));



    const allParametersChecked = rows.length > 0 && rows.every(row => String(row.qaStatus) !== "0" && String(row.qaStatus) !== "5" && !!row.qaStatus);
    const overallStatusDisabled = !editMode || !allParametersChecked;

    return (
        <div>
            <FullPageLoader
                loading={submitting}
                message="Saving inspection details..."
                logoSrc={inspireLogo}
            />
            {loadingDetails && <Loader />}
            <style>{`
                .qog-top-fields, .qog-details-fields {
                    padding: 0px 0px 4px 0px;
                }
                .qog-top-fields .form-control, .qog-details-fields .form-control {
                    padding: 0px 8px !important;
                    font-size: 13px !important;
                    height: 28px !important;
                    min-height: 28px !important;
                    line-height: 28px !important;
                }
                .qog-top-fields div[class*="-control"], .qog-details-fields div[class*="-control"] {
                    min-height: 28px !important;
                    height: 28px !important;
                    font-size: 13px !important;
                }
                .qog-top-fields div[class*="-singleValue"], .qog-top-fields div[class*="-placeholder"],
                 .qog-details-fields div[class*="-singleValue"], .qog-details-fields div[class*="-placeholder"] {
                     margin: 0 !important;
                     padding: 0 !important;
                     line-height: 26px !important;
                     text-align: left !important;
                     width: 100% !important;
                 }
                 .qog-top-fields div[class*="-ValueContainer"], .qog-details-fields div[class*="-ValueContainer"] {
                     padding: 0px 6px !important;
                     min-height: 26px !important;
                     height: 26px !important;
                     display: flex !important;
                     justify-content: flex-start !important;
                     align-items: center !important;
                     text-align: left !important;
                 }
                 /* Center option list items in dropdown menu lists */
                 div[class*="-option"] {
                     text-align: left !important;
                 }
                 /* Center label of "Select Sub-Characteristic" */
                 .sub-char-select-wrapper label,
                 .sub-char-select-wrapper .form-label {
                     text-align: center !important;
                     display: block !important;
                     width: 100% !important;
                 }
                 .qog-top-fields div[class*="-Input"], .qog-details-fields div[class*="-Input"] {
                     margin: 0 !important;
                     padding: 0 !important;
                 }
                .qog-top-fields div[class*="-IndicatorsContainer"], .qog-details-fields div[class*="-IndicatorsContainer"] {
                    height: 26px !important;
                }
                .qog-product-card {
                    margin: 8px 0px 0px 0px;
                    border: none;
                    border-radius: 7px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    background: #fff;
                    overflow: hidden;
                }
                /* Consistent disabled styling matching the screenshot for all non-editable form controls */
                .qog-top-fields input:disabled, .qog-top-fields select:disabled, .qog-top-fields textarea:disabled,
                .qog-details-fields input:disabled, .qog-details-fields select:disabled, .qog-details-fields textarea:disabled {
                    background-color: #e9ecef !important;
                    color: #495057 !important;
                    border: 1px solid #dee2e6 !important;
                    opacity: 1 !important;
                    cursor: not-allowed !important;
                }
                .qog-top-fields div[class*="-control"][aria-disabled="true"],
                .qog-details-fields div[class*="-control"][aria-disabled="true"] {
                    background-color: #e9ecef !important;
                    color: #495057 !important;
                    border: 1px solid #dee2e6 !important;
                    opacity: 1 !important;
                    cursor: not-allowed !important;
                }
                .qog-top-fields div[class*="-control"][aria-disabled="true"] div[class*="-singleValue"],
                .qog-top-fields div[class*="-control"][aria-disabled="true"] div[class*="-placeholder"],
                .qog-details-fields div[class*="-control"][aria-disabled="true"] div[class*="-singleValue"],
                .qog-details-fields div[class*="-control"][aria-disabled="true"] div[class*="-placeholder"] {
                    color: #495057 !important;
                }
                .qog-header {
                    background: rgb(147, 108, 145);
                    color: #fff;
                    padding: 6px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-top-left-radius: 7px;
                    border-top-right-radius: 7px;
                }
                /* ── Compact row spacing ── */
                .qog-top-fields .form-label,
                .qog-details-fields .form-label {
                    margin-bottom: 0px !important;
                    font-size: 14px !important;
                }
                .qog-top-fields .row.mb-1,
                .qog-top-fields .row.mb-2,
                .qog-top-fields .row.mb-3,
                .qog-details-fields .row.mb-1,
                .qog-details-fields .row.mb-2,
                .qog-details-fields .row.mb-3 {
                    margin-bottom: 2px !important;
                }
                .qog-top-fields .row,
                .qog-parameter-form-fields .row {
                    display: flex;
                    align-items: stretch;
                }
                .qog-top-fields [class*="col-"],
                .qog-parameter-form-fields [class*="col-"]:not(.text-center) {
                    display: flex;
                    flex-direction: column;
                    padding-top: 0px !important;
                    padding-bottom: 0px !important;
                }
                .qog-top-fields .mb-2,
                .qog-parameter-form-fields .mb-2 {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    flex-grow: 1;
                }
            `}</style>

            <div className="qog-top-fields mb-2" style={{ marginTop: "-10px", paddingTop: "0px", paddingBottom: "0px" }}>
                {/* Row 1: GRN No / Date, Item Code, Description, Unit */}
                <div className="row mb-1">
                    <div className="col-md-2 col-sm-4">
                        <FormField
                            label="GRN No / Date"
                            name="grnNoDate"
                            type="text"
                            value={generalInfo.grnNoDate || `${grnNo} / ${new Date().toISOString().substring(0, 10).split('-').reverse().join('-')}`}
                            onChange={(e) => handleGeneralInfoChange("grnNoDate", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>
                    <div className="col-md-3 col-sm-6">
                        <FormField
                            label="Item Code"
                            name="itemCode"
                            type="text"
                            value={generalInfo.itemCode}
                            onChange={(e) => handleGeneralInfoChange("itemCode", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>
                    <div className="col-md-5 col-sm-7">
                        <FormField
                            label="Description"
                            name="itemDescription"
                            type="text"
                            value={generalInfo.itemDescription}
                            onChange={(e) => handleGeneralInfoChange("itemDescription", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>
                    <div className="col-md-2 col-sm-6">
                        <FormField
                            label="Unit"
                            name="unit"
                            type="text"
                            value={generalInfo.unit}
                            onChange={(e) => handleGeneralInfoChange("unit", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>
                </div>

                {/* Row 2: Qty Offered For Inspection, Qty Rejected, Testing Rejected, Qty Rejected Reason, Qty Accepted, Qty Accepted For Supplier */}
                <div className="row mb-1">
                    <div className="col-lg-2 col-md-4 col-sm-6 col-12">
                        <FormField
                            label="Qty Offered For Inspection"
                            name="qtyOfferedForInspection"
                            type="text"
                            value={generalInfo.qtyOfferedForInspection}
                            onChange={(e) => handleGeneralInfoChange("qtyOfferedForInspection", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6 col-12">
                        <FormField
                            label="Qty Rejected"
                            name="qtyRejected"
                            type="text"
                            inputMode="decimal"
                            maxLength={13}
                            value={generalInfo.qtyRejected}
                            onChange={(e) => handleGeneralInfoChange("qtyRejected", e.target.value)}
                            disabled={!editMode}
                            required={true}
                            error={errors.qtyRejected}
                            style={{ background: !editMode ? "#e9ecef" : "" }}
                        />
                    </div>

                    <div className="col-lg-2 col-md-4 col-sm-6 col-12">
                        <FormField
                            label="Qty Rejected Reason"
                            name="qtyRejectedReason"
                            type="text"
                            value={generalInfo.qtyRejectedReason}
                            onChange={(e) => handleGeneralInfoChange("qtyRejectedReason", e.target.value)}
                            disabled={!editMode || !(Number(generalInfo.qtyRejected) > 0)}
                            required={Number(generalInfo.qtyRejected) > 0}
                            error={errors.qtyRejectedReason}
                            style={{ background: (!editMode || !(Number(generalInfo.qtyRejected) > 0)) ? "#e9ecef" : "" }}
                        />
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6 col-12">
                        <FormField
                            label="Testing Rejected"
                            name="testingRejected"
                            type="text"
                            inputMode="decimal"
                            maxLength={13}
                            value={generalInfo.testingRejected}
                            onChange={(e) => handleGeneralInfoChange("testingRejected", e.target.value)}
                            disabled={!editMode}
                            required={true}
                            error={errors.testingRejected}
                            style={{ background: !editMode ? "#e9ecef" : "" }}
                        />
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6 col-12">
                        <FormField
                            label="Qty Accepted"
                            name="qtyAccepted"
                            type="text"
                            value={generalInfo.qtyAccepted}
                            onChange={(e) => handleGeneralInfoChange("qtyAccepted", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6 col-12">
                        <FormField
                            label="Qty Accepted For Supplier"
                            name="qtyAcceptedForSupplier"
                            type="text"
                            value={generalInfo.qtyAcceptedForSupplier}
                            onChange={(e) => handleGeneralInfoChange("qtyAcceptedForSupplier", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>
                </div>

                {/* Row 3: QA Status, Document Status, Batch No, Checked By, Checked Date */}
                <div className="row mb-1">
                    <div className="col-md-2 col-sm-4">
                        <ReactSelectField
                            label="Overall Status"
                            name="qaStatus"
                            placeholder="Select Status"
                            value={generalInfo.qaStatus}
                            options={qaStatusOptions}
                            onChange={(e) => handleGeneralInfoChange("qaStatus", e.target.value)}
                            disabled={overallStatusDisabled}
                            error={errors.qaStatus}
                            style={{ background: overallStatusDisabled ? "#e9ecef" : "" }}
                        />
                    </div>
                    <div className="col-md-3 col-sm-6">
                        <FormField
                            label="Checked By"
                            name="qaCheckedBy"
                            type="text"
                            value={(String(generalInfo.qaStatus || "0") === "0" || String(generalInfo.qaStatus || "0") === "5") ? "" : (generalInfo.qaCheckedBy || "")}
                            onChange={(e) => handleGeneralInfoChange("qaCheckedBy", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>
                    <div className="col-md-2 col-sm-6">
                        <FormField
                            label="Checked Date"
                            name="qaCheckedDate"
                            type="date"
                            value={(String(generalInfo.qaStatus || "0") === "0" || String(generalInfo.qaStatus || "0") === "5") ? "" : (generalInfo.qaCheckedDate || "")}
                            onChange={(e) => handleGeneralInfoChange("qaCheckedDate", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>
                    <div className="col-md-3 col-sm-4">
                        <FormField
                            label="Batch No."
                            name="batchNo"
                            type="text"
                            value={generalInfo.batchNo}
                            onChange={(e) => handleGeneralInfoChange("batchNo", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>
                    <div className="col-md-2 col-sm-4">
                        <FormField
                            label="Document Status"
                            name="documentStatus"
                            type="text"
                            value={Number(inspectionHeaderID) > 0 ? (generalInfo.documentStatus || "") : "Not Approved"}
                            onChange={(e) => handleGeneralInfoChange("documentStatus", e.target.value)}
                            disabled={true}
                            style={{ background: "#e9ecef" }}
                        />
                    </div>


                </div>
            </div>

            <div className="card qog-product-card" style={{ boxShadow: "none", background: "none", marginTop: "0px" }}>
                <div className="qog-details-fields" style={{ overflowX: "hidden" }}>
                    {rows.length > 0 && (
                        <div className="row align-items-center mb-2 pb-1 border-bottom px-1" style={{ background: "#f8fafc", borderRadius: "6px", minHeight: "42px", margin: "0px" }}>
                            {/* Left side: Heading title */}
                            <div className="col-md-3 col-12 d-flex align-items-center">
                                <h6 className="fw-bold mb-0" style={{ color: "rgb(122, 75, 120)", fontSize: "15px", letterSpacing: "0.3px", marginLeft: "4px" }}>
                                    Inspection Parameters
                                </h6>
                            </div>

                            {/* Center: Select Sub-Characteristic label + Dropdown + Prev/Next buttons */}
                            <div className="col-md-6 col-12 d-flex align-items-end gap-2 py-1">
                                <div className="mb-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={handlePrev}
                                        disabled={activeIndex <= 0}
                                        style={{ height: "28px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px", fontSize: "12px" }}
                                    >
                                        &lt; Prev
                                    </button>
                                </div>
                                <div style={{ flex: 1 }} className="sub-char-select-wrapper">
                                    <ReactSelectField
                                        label="Select Sub-Characteristic"
                                        name="activeSubChar"
                                        value={String(activeIndex)}
                                        disabled={false}
                                        options={rows.map((row, index) => ({
                                            value: String(index),
                                            label: row.isNoData ? `${row.subCharacteristicName}` : `${row.characteristicName || ""} - ${row.subCharacteristicName || ""}`,
                                            isDisabled: !isRowAccessible(index)
                                        }))}
                                        onChange={(e) => handleNavigate(Number(e.target.value))}
                                    />
                                </div>
                                <div className="mb-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={handleNext}
                                        disabled={activeIndex >= rows.length - 1}
                                        style={{ height: "28px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px", fontSize: "12px" }}
                                    >
                                        Next &gt;
                                    </button>
                                </div>
                            </div>

                            {/* Right side: Empty column to balance center alignment */}
                            <div className="col-md-3 d-none d-md-block"></div>
                        </div>
                    )}

                    {rows[activeIndex] && (() => {
                        const row = rows[activeIndex];
                        const activeRowHasVideo = String(row.isVideoUploaded || "N").toUpperCase() === "Y";

                        const handlePlayVideo = async () => {
                            setVideoState("loading");
                            setVideoUrl("");
                            setVideoError("");
                            try {
                                const res = await viewOrDeleteInspectionVideoFiles({
                                    inspectionID: Number(row.inspId || 0),
                                    itemCode: String(row.videoItemCode || ""),
                                    fileName: "",
                                    paramType: "View",
                                });
                                // API returns FileURL in VIEW_INSPECTION_VIDEO_FILE_RESPONSE
                                const filesList = res?.data?.VIEW_INSPECTION_VIDEO_FILE_RESPONSE || [];
                                const validFile = filesList.find((f) => f && f.FileURL && !f.Message);
                                const fileUrl = validFile?.FileURL || "";
                                if (fileUrl) {
                                    setVideoUrl(fileUrl);
                                    setVideoState("playing");
                                } else {
                                    setVideoError("No video file found for this parameter.");
                                    setVideoState(ERROR_STATUS.toLowerCase());
                                }
                            } catch (err) {
                                console.error("Error loading video:", err);
                                setVideoError("Failed to load video. Please try again.");
                                setVideoState(ERROR_STATUS.toLowerCase());
                            }
                        };

                        const rowIndex = activeIndex;

                        const hasMinMax = row.expectedMinReading !== null && row.expectedMinReading !== undefined && String(row.expectedMinReading).trim() !== "" &&
                            row.expectedMaxReading !== null && row.expectedMaxReading !== undefined && String(row.expectedMaxReading).trim() !== "";
                        const hasExpectedResult = row.expectedResult !== null && row.expectedResult !== undefined && String(row.expectedResult).trim() !== "";

                        let isObservationEnabled = false;
                        let isActualResultEnabled = false;

                        if (hasMinMax && hasExpectedResult) {
                            isObservationEnabled = true;
                            isActualResultEnabled = true;
                        } else if (hasMinMax) {
                            isObservationEnabled = true;
                            isActualResultEnabled = false;
                        } else if (hasExpectedResult) {
                            isObservationEnabled = false;
                            isActualResultEnabled = true;
                        }

                        const observationAllowed = isObservationEnabled ||
                            (row.observedReadings && row.observedReadings.length > 0) ||
                            (row.actualMinReading && String(row.actualMinReading).trim() !== "") ||
                            (row.actualMaxReading && String(row.actualMaxReading).trim() !== "");

                        const isObservationBtnDisabled = editMode ? !isObservationEnabled : !observationAllowed;

                        const hasRowInput = (row.actualResult && String(row.actualResult).trim() !== "") ||
                            (row.actualMinReading && String(row.actualMinReading).trim() !== "") ||
                            (row.actualMaxReading && String(row.actualMaxReading).trim() !== "");

                        return (
                            <div className="mb-2 pb-1">
                                {/* Two-column layout: Left = Video Panel, Right = Form Fields */}
                                <div className="row" style={{ margin: 0 }}>
                                    {/* LEFT: Video Panel */}
                                    <div className="col-md-3" style={{ paddingRight: "10px", paddingLeft: "4px" }}>
                                        <div style={{
                                            border: "1px solid #e2d4e2",
                                            borderRadius: "8px",
                                            background: "#fdf8fd",
                                            minHeight: "220px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "12px",
                                            gap: "8px"
                                        }}>
                                            {activeRowHasVideo ? (
                                                <>
                                                    {videoState === "idle" && (
                                                        <>
                                                            <div style={{ color: "rgb(122,75,120)", marginBottom: "4px" }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
                                                                    <path d="M0 1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1zm4 0v6h6V1H4zm6 8H4v6h6V9zm-6-1h1V2H5v6zm1 0h1V2H6v6zm1 0h1V2H7v6zm1 0h1V2H8v6zm1 0h1V2H9v6zm-5 7h1v-5H5v5zm1 0h1v-5H6v5zm1 0h1v-5H7v5zm1 0h1v-5H8v5zm1 0h1v-5H9v5z" />
                                                                </svg>
                                                            </div>
                                                            <p style={{ fontSize: "12px", color: "#6b5b6b", margin: 0, textAlign: "center" }}>Video available for this parameter</p>
                                                            <button
                                                                type="button"
                                                                onClick={handlePlayVideo}
                                                                style={{
                                                                    background: "rgb(122, 75, 120)",
                                                                    color: "#fff",
                                                                    border: "none",
                                                                    borderRadius: "6px",
                                                                    padding: "6px 18px",
                                                                    fontSize: "13px",
                                                                    fontWeight: "500",
                                                                    cursor: "pointer",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "6px",
                                                                    marginTop: "4px"
                                                                }}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                                    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z" />
                                                                </svg>
                                                                Play Video
                                                            </button>
                                                        </>
                                                    )}
                                                    {videoState === "loading" && (
                                                        <>
                                                            <div className="spinner-border" role="status" style={{ color: "rgb(122,75,120)", width: "28px", height: "28px" }}>
                                                                <span className="visually-hidden">Loading...</span>
                                                            </div>
                                                            <p style={{ fontSize: "12px", color: "#6b5b6b", margin: 0 }}>Loading video...</p>
                                                        </>
                                                    )}
                                                    {videoState === "playing" && videoUrl && (
                                                        <video
                                                            src={videoUrl}
                                                            controls
                                                            autoPlay
                                                            style={{ width: "100%", borderRadius: "6px", maxHeight: "180px", background: "#000" }}
                                                            onError={() => {
                                                                setVideoError("Failed to play video. The file may be unavailable.");
                                                                setVideoState(ERROR_STATUS.toLowerCase());
                                                            }}
                                                        />
                                                    )}
                                                    {videoState === ERROR_STATUS.toLowerCase() && (
                                                        <>
                                                            <div style={{ color: "#dc3545" }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                                                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                                                                </svg>
                                                            </div>
                                                            <p style={{ fontSize: "12px", color: "#dc3545", margin: 0, textAlign: "center" }}>{videoError}</p>
                                                            <button
                                                                type="button"
                                                                onClick={handlePlayVideo}
                                                                style={{
                                                                    background: "transparent",
                                                                    color: "rgb(122, 75, 120)",
                                                                    border: "1px solid rgb(122, 75, 120)",
                                                                    borderRadius: "6px",
                                                                    padding: "4px 14px",
                                                                    fontSize: "12px",
                                                                    cursor: "pointer",
                                                                    marginTop: "2px"
                                                                }}
                                                            >
                                                                Retry
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ color: "#b0a0b0" }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z" />
                                                            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z" />
                                                        </svg>
                                                    </div>
                                                    <p style={{ fontSize: "12px", color: "#9e8e9e", margin: 0, textAlign: "center" }}>Video is not available for this Inspection</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT: Form fields */}
                                    <div className="col-md-9 qog-parameter-form-fields" style={{ paddingLeft: "4px" }}>

                                        {/* Row 1: Expected Min Reading vs Actual Min Reading */}
                                        <div className="row justify-content-md-start mb-1">
                                            <div className="col-md-4 col-sm-5">
                                                <FormField
                                                    label="Expected Min Reading"
                                                    type="number"
                                                    value={row.expectedMinReading}
                                                    disabled={true}
                                                    style={{ background: "#e9ecef" }}
                                                    onChange={(e) => handleRowChange(rowIndex, "expectedMinReading", e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-4 col-sm-5">
                                                <FormField
                                                    label="Actual Min Reading"
                                                    type="number"
                                                    value={row.actualMinReading}
                                                    disabled={true}
                                                    style={{ background: "#e9ecef" }}
                                                    onChange={(e) => handleRowChange(rowIndex, "actualMinReading", e.target.value)}
                                                    error={errors?.rows?.[rowIndex]?.actualMinReading}
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Expected Max Reading vs Actual Max Reading, QA Status on Right */}
                                        <div className="row justify-content-md-start mb-1">
                                            <div className="col-md-4 col-sm-5">
                                                <FormField
                                                    label="Expected Max Reading"
                                                    type="number"
                                                    value={row.expectedMaxReading}
                                                    disabled={true}
                                                    style={{ background: "#e9ecef" }}
                                                    onChange={(e) => handleRowChange(rowIndex, "expectedMaxReading", e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-4 col-sm-5">
                                                <FormField
                                                    label="Actual Max Reading"
                                                    type="number"
                                                    value={row.actualMaxReading}
                                                    disabled={true}
                                                    style={{ background: "#e9ecef" }}
                                                    onChange={(e) => handleRowChange(rowIndex, "actualMaxReading", e.target.value)}
                                                    error={errors?.rows?.[rowIndex]?.actualMaxReading}
                                                />
                                            </div>
                                            <div className="col-md-4 col-sm-12 mt-2 mt-md-0" style={{ margin: 0 }}>
                                                <ReactSelectField
                                                    label="Sub-Characteristic Result Status"
                                                    name={`rows[${rowIndex}].qaStatus`}
                                                    placeholder="Select Status"
                                                    value={row.qaStatus !== null && row.qaStatus !== undefined && row.qaStatus !== "" ? String(row.qaStatus) : ""}
                                                    options={qaStatusOptions}
                                                    disabled={!editMode || !hasRowInput}
                                                    style={{ background: (!editMode || !hasRowInput) ? "#e9ecef" : "" }}
                                                    onChange={(e) => handleRowChange(rowIndex, "qaStatus", e?.target?.value || e || "")}
                                                    error={errors?.rows?.[rowIndex]?.qaStatus}
                                                />
                                            </div>
                                        </div>

                                        {/* Row 3: Expected Result vs Actual Result */}
                                        <div className="row justify-content-md-start mb-1">
                                            <div className="col-md-4 col-sm-5">
                                                <FormField
                                                    label="Expected Result"
                                                    type="text"
                                                    value={row.expectedResult}
                                                    disabled={true}
                                                    style={{ background: "#e9ecef" }}
                                                    onChange={(e) => handleRowChange(rowIndex, "expectedResult", e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-4 col-sm-5">
                                                <FormField
                                                    label="Actual Result"
                                                    type="text"
                                                    value={row.actualResult}
                                                    disabled={!editMode || !isActualResultEnabled}
                                                    required={editMode && isActualResultEnabled}
                                                    style={{ background: (!editMode || !isActualResultEnabled) ? "#e9ecef" : "" }}
                                                    onChange={(e) => handleRowChange(rowIndex, "actualResult", e.target.value)}
                                                    error={errors?.rows?.[rowIndex]?.actualResult}
                                                />
                                            </div>
                                        </div>

                                        {/* Row 4: Result Remarks */}
                                        <div className="row justify-content-md-start mb-2">
                                            <div className="col-md-8 col-sm-10">
                                                <FormField
                                                    label="Result Remarks"
                                                    type="text"
                                                    value={row.resultRemarks}
                                                    disabled={true}
                                                    style={{ background: "#e9ecef" }}
                                                    onChange={(e) => handleRowChange(rowIndex, "resultRemarks", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Row 5: Inspection Observation button (Centered below Result Remarks) */}
                                        <div className="row justify-content-md-start mt-2">
                                            <div className="col-md-8 col-sm-10 text-center">
                                                <button
                                                    type="button"
                                                    className="btn text-white shadow-sm"
                                                    style={{
                                                        background: isObservationBtnDisabled ? "#6c757d" : "rgb(122, 75, 120)",
                                                        height: "32px",
                                                        width: "220px",
                                                        minWidth: "220px",
                                                        maxWidth: "220px",
                                                        padding: "0 16px",
                                                        fontSize: "13px",
                                                        fontWeight: "500",
                                                        border: "none",
                                                        borderRadius: "6px",
                                                        whiteSpace: "nowrap",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                        cursor: isObservationBtnDisabled ? "not-allowed" : "pointer",
                                                        opacity: isObservationBtnDisabled ? 0.65 : 1
                                                    }}
                                                    disabled={isObservationBtnDisabled}
                                                    onClick={handleOpenObservation}
                                                >
                                                    <i className="bi bi-eye"></i> Inspection Observation
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* END Right column */}
                                </div>
                                {/* END two-column row */}
                            </div>
                        );
                    })()}
                </div>
            </div>
            <PopupDialog
                open={showObservation}
                title="Inspection Observation"
                onClose={() => setShowObservation(false)}
                onCancel={() => setShowObservation(false)}
                onSave={editMode ? handleSaveObservation : undefined}
                saveLabel="Save"
                cancelLabel={editMode ? "Cancel" : "Close"}
            >
                <div className="mb-3 d-flex align-items-center justify-content-between pb-2 border-bottom">
                    <span className="fw-semibold text-secondary" style={{ fontSize: "14px" }}>
                        Observed Readings ({tempObservedReadings.length})
                    </span>
                    {editMode && (
                        <button
                            type="button"
                            className="btn btn-sm text-white shadow-sm"
                            style={{
                                background: "rgb(122, 75, 120)",
                                border: "none",
                                borderRadius: "5px",
                                padding: "4px 12px",
                                fontSize: "13px"
                            }}
                            onClick={handleAddObservationField}
                        >
                            + Add Reading
                        </button>
                    )}
                </div>

                <div style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "6px" }}>
                    {tempObservedReadings.length === 0 ? (
                        <div className="text-center py-3 text-muted" style={{ fontSize: "13px" }}>
                            No observed readings available for this parameter.
                        </div>
                    ) : (
                        tempObservedReadings.map((reading, idx) => (
                            <div key={idx} className="p-2 mb-2 rounded" style={{ background: "#f8f9fa", border: "1px solid #e9ecef" }}>
                                <div className="mb-1">
                                    <label
                                        htmlFor={`observation-input-${idx}`}
                                        className="form-label mb-0"
                                        style={{ fontSize: "12px", fontWeight: "600", color: "#495057" }}
                                    >
                                        Observed Reading {idx + 1}
                                    </label>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <input
                                        id={`observation-input-${idx}`}
                                        type="text"
                                        inputMode="decimal"
                                        maxLength={13}
                                        className="form-control form-control-sm"
                                        style={{
                                            height: "30px",
                                            fontSize: "13px",
                                            background: !editMode ? "#e9ecef" : "#fff",
                                            color: !editMode ? "#495057" : "inherit",
                                            cursor: !editMode ? "not-allowed" : "text",
                                            flex: 1
                                        }}
                                        placeholder={editMode ? `Enter reading ${idx + 1}` : ""}
                                        value={reading}
                                        disabled={!editMode}
                                        readOnly={!editMode}
                                        onChange={(e) => handleObservationChange(idx, e.target.value)}
                                    />
                                    {editMode && tempObservedReadings.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger p-0 d-flex align-items-center justify-content-center"
                                            title="Remove Reading"
                                            style={{ height: "30px", width: "30px", borderRadius: "4px", fontSize: "11px", flexShrink: 0 }}
                                            onClick={() => handleRemoveObservationField(idx)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </PopupDialog>
        </div>
    );
});

export default InspectionResult;
