import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  fetchGstMasterList,
  fetchGstStatusOptions,
  fetchGstApplicableOptions,
  saveOrUpdateGstMaster,
} from "../../services/gstMasterService";

import InlineEditableTable from "../../components/InlineEditableTable";
import Loader from "../../components/Loader";
import FullPageLoader from "../../components/FullPageLoader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import { useToast } from "../../components/useToast";
import Select from "react-select";
import { buildInlineTableValidateCell } from "../../utils/inlineTableValidation";
import { handleApiValidationErrors } from "../../utils/CustomValidation";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS } from "../../utils/ConstVariables";


// ------------------------------------------------------
// Shared helpers (outside component to avoid re-creation)
// ------------------------------------------------------

const ACTIVE_BADGE_STYLE = {
  color: "#22c55e",
  background: "#dcfce7",
  borderRadius: 12,
  padding: "2px 12px",
  fontWeight: 600,
  fontSize: 12,
  display: "inline-block",
  border: "none",
};

const INACTIVE_BADGE_STYLE = {
  color: "#ef4444",
  background: "#fef2f2",
  borderRadius: 12,
  padding: "2px 12px",
  fontWeight: 600,
  fontSize: 12,
  display: "inline-block",
  border: "none",
};

/**
 * Helper to get DisplayText from ValueText
 * Handles both numeric and string comparisons
 */
function getDisplayText(options, value) {
  if (value == null) return value;
  // Try exact match first
  let found = options.find((opt) => opt.ValueText === value);
  // If not found and value is numeric, try numeric comparison
  if (!found && !isNaN(Number(value))) {
    found = options.find((opt) => Number(opt.ValueText) === Number(value));
  }
  return found ? found.DisplayText : value;
}

/**
 * Helper for CGST/SGST/IGST calculation
 * Handles numeric values: 1 = Local (CGST + SGST), 2 = Interstate (IGST only)
 * Backend uses SMALLINT: 1 = Local, 2 = Interstate
 */
function calculatePercentages(rate, applicableFor) {
  let cgst = 0,
    sgst = 0,
    igst = 0;

  // Convert to number (backend uses SMALLINT: 1 = Local, 2 = Interstate)
  const applicableForNum = applicableFor != null ? Number(applicableFor) : null;

  if (!isNaN(applicableForNum)) {
    if (applicableForNum === 1) {
      // Local/State (CGST + SGST)
      cgst = +(rate / 2).toFixed(2);
      sgst = +(rate / 2).toFixed(2);
      igst = 0;
    } else if (applicableForNum === 2) {
      // Interstate (IGST only)
      cgst = 0;
      sgst = 0;
      igst = +rate.toFixed(2);
    }
  }

  return { cgstPercentage: cgst, sgstPercentage: sgst, igstPercentage: igst };
}

/**
 * Find default "Active" status option.
 * Backend uses SMALLINT: 1 = Active, 0 = Inactive
 */
function findActiveStatusOption(options) {
  return options.find(
    (opt) => {
      // Check for numeric value 1 (Active)
      const valueNum = Number(opt.ValueText);
      if (!isNaN(valueNum) && valueNum === 1) return true;
      // Fallback to text matching
      return (
        opt.DisplayText?.toLowerCase().includes("active") ||
        opt.ValueText?.toLowerCase() === "a" ||
        opt.ValueText === "1"
      );
    }
  );
}

// ------------------------------------------------------
// Component
// ------------------------------------------------------

export default function GSTMaster() {
  const [gstData, setGstData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusOptions, setStatusOptions] = useState([]);
  const [applicableForOptions, setApplicableForOptions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();
  const tableRef = useRef();

  // ----------------------------
  // Fetch helpers
  // ----------------------------

  const fetchStatusOptions = useCallback(async () => {
    try {
      const options = await fetchGstStatusOptions();
      setStatusOptions(options);
    } catch (error) {
      if (error?.response?.status === 401) {
        window.dispatchEvent(new Event("sessionExpired"));
      } else {
        console.error("Error fetching GST Status:", error);
        setStatusOptions([]);
      }
    }
  }, []);

  const fetchApplicableForOptions = useCallback(async () => {
    try {
      const options = await fetchGstApplicableOptions();
      setApplicableForOptions(options);
    } catch (error) {
      if (error?.response?.status === 401) {
        window.dispatchEvent(new Event("sessionExpired"));
      } else {
        console.error("Error fetching GST Applicable For:", error);
        setApplicableForOptions([]);
      }
    }
  }, []);

  const fetchGSTMaster = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchGstMasterList({ pageSize: 0, pageNumber: 0 });
      const records = res?.data?.GST_MASTER_LIST || [];
      const mapped = records.map((item) => ({
        data: item.gst_id, // Map gst_id to data (used as identifier)
        text: item.tax_name, // Map tax_name to text (GST Text)
        rate: item.gst_perc, // Map gst_perc to rate (GST Rate)
        // Status: 1 = Active, 0 = Inactive (SMALLINT)
        status:
          item.status1 != null
            ? Number(item.status1)
            : item.status != null
              ? Number(item.status)
              : null,
        status_text: item.status_text || "", // Preserve text for display
        // Applicable For: 1 = Local, 2 = Interstate (SMALLINT)
        applicable_for: item.applicable_for != null ? Number(item.applicable_for) : null,
        applicable_for_text: item.applicable_for_text || "", // Preserve text for display
        // cgst: item.cgst_perc, // Map cgst_perc to cgst
        // sgst: item.sgst_perc, // Map sgst_perc to sgst
        // igst: item.igst_perc, // Map igst_perc to igst

        // Normalize CGST/SGST/IGST from API response (cgst_perc/sgst_perc/igst_perc) to table keys (cgst/sgst/igst)
        cgst: Number(item.cgst_perc ?? 0),
        sgst: Number(item.sgst_perc ?? 0),
        igst: Number(item.igst_perc ?? 0),
        // Preserve other fields that might be needed
        gstTaxApp: item.gstTaxApp || "",
        c_form_app: item.c_form_app || "",
      }));

      setGstData(mapped);
    } catch (error) {
      if (error?.response?.status === 401) {
        window.dispatchEvent(new Event("sessionExpired"));
      } else {
        console.error("Failed to fetch GST Master list", error);
        setGstData([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchGSTMaster();
    fetchStatusOptions();
    fetchApplicableForOptions();
  }, [fetchGSTMaster, fetchStatusOptions, fetchApplicableForOptions]);

  // ----------------------------
  // Column definitions (memoized)
  // ----------------------------

  const gstColumns = useMemo(() => {
    return [
      {
        key: "text",
        label: "Name",
        renderEdit: ({ value, onChange }) => (
          <input
            className="form-control form-control-sm"
            value={value || ""}
            onChange={onChange}
          />
        ),
        searchable: false,
        width: "130px",
        minWidth: "130px",
      },
      {
        key: "rate",
        label: "Rate (%)",
        render: (row) => {
          const rateValue = row.rate != null ? Number(row.rate) : null;
          const displayValue = rateValue != null && !isNaN(rateValue) ? rateValue.toFixed(2) : "0.00";
          return (
            <div style={{ textAlign: "center" }}>
              {displayValue}
            </div>
          );
        },
        renderEdit: ({ value, onChange, row, setFields }) => {
          const handleRateChange = (e) => {
            const newRate = Number(e.target.value) || 0;
            onChange(e);
            // Auto-calculate CGST/SGST/IGST when rate changes
            const { cgstPercentage, sgstPercentage, igstPercentage } =
              calculatePercentages(newRate, row.applicable_for);
            setFields({
              cgst: cgstPercentage,
              sgst: sgstPercentage,
              igst: igstPercentage,
            });
          };

          const inputValue = value != null && value !== "" ? String(value) : "";
          return (
            <input
              className="form-control form-control-sm"
              type="number"
              step="0.01"
              value={inputValue}
              onChange={handleRateChange}
              style={{ textAlign: "center" }}
            />
          );
        },
        searchable: false,
        width: "90px",
        minWidth: "80px",
        maxWidth: "100px",
        style: { textAlign: "center" },
      },
      {
        key: "applicable_for",
        label: "Applicable For",
        render: (row) => row.applicable_for_text || getDisplayText(applicableForOptions, row.applicable_for) || "-",
        renderEdit: ({ value, onChange, row, setFields }) => {
          // Convert dropdown options to numeric if possible (backend expects SMALLINT: 1 = Local, 2 = Interstate)
          const selectOptions = applicableForOptions.map((opt) => ({
            value: isNaN(Number(opt.ValueText)) ? opt.ValueText : Number(opt.ValueText),
            label: opt.DisplayText,
          }));

          const handleApplicableForChange = (opt) => {
            // Backend expects numeric: 1 = Local, 2 = Interstate
            const selectedValue = opt ? (isNaN(Number(opt.value)) ? opt.value : Number(opt.value)) : null;
            onChange({ target: { value: selectedValue } });
            // Auto-calculate CGST/SGST/IGST when applicable_for changes
            const rate = Number(row.rate) || 0;
            const { cgstPercentage, sgstPercentage, igstPercentage } =
              calculatePercentages(rate, selectedValue);
            setFields({
              cgst: cgstPercentage,
              sgst: sgstPercentage,
              igst: igstPercentage,
            });
          };

          // Find matching option (handle both string and number comparisons)
          const findOption = (val) => {
            if (val == null) return null;
            // Try exact match first
            let found = selectOptions.find((opt) => opt.value === val);
            // If not found and value is numeric, try numeric comparison
            if (!found && !isNaN(Number(val))) {
              found = selectOptions.find((opt) => Number(opt.value) === Number(val));
            }
            return found || null;
          };

          return (
            <Select
              classNamePrefix="react-select"
              value={findOption(value)}
              onChange={handleApplicableForChange}
              options={selectOptions}
              placeholder="Select"
              menuPlacement="auto"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                control: (provided) => ({
                  ...provided,
                  minWidth: "100px",
                  maxWidth: "400px",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                menu: (provided) => ({
                  ...provided,
                  zIndex: 9999,
                  minWidth: "140px",
                  width: "100%",
                }),
                menuList: (provided) => ({ ...provided, maxHeight: 180 }),
              }}
              isClearable={false}
              isSearchable
            />
          );
        },
        searchable: false,
        width: "115px",
        minWidth: "110px",
      },
      {
        key: "cgst",
        label: "CGST (%)",
        render: (row) => (
          <div style={{ textAlign: "center" }}>
            {Number(row.cgst ?? 0).toFixed(2)}
          </div>
        ),
        renderEdit: ({ row }) => {
          const rate = Number(row.rate) || 0;
          const { cgstPercentage } = calculatePercentages(
            rate,
            row.applicable_for
          );
          return (
            <input
              className="form-control form-control-sm"
              type="number"
              value={cgstPercentage.toFixed(2)}
              readOnly
              style={{ textAlign: "center", backgroundColor: "#e9ecef" }}
            />
          );
        },
        width: "90px",
        minWidth: "80px",
        maxWidth: "100px",
        style: { textAlign: "center" },
        searchable: false,
      },
      {
        key: "sgst",
        label: "SGST (%)",
        render: (row) => (
          <div style={{ textAlign: "center" }}>
            {Number(row.sgst ?? 0).toFixed(2)}
          </div>
        ),
        renderEdit: ({ row }) => {
          const rate = Number(row.rate) || 0;
          const { sgstPercentage } = calculatePercentages(
            rate,
            row.applicable_for
          );
          return (
            <input
              className="form-control form-control-sm"
              type="number"
              value={sgstPercentage.toFixed(2)}
              readOnly
              style={{ textAlign: "center", backgroundColor: "#e9ecef" }}
            />
          );
        },
        width: "90px",
        minWidth: "80px",
        maxWidth: "100px",
        style: { textAlign: "center" },
        searchable: false,
      },
      {
        key: "igst",
        label: "IGST (%)",
        render: (row) => (
          <div style={{ textAlign: "center" }}>
            {Number(row.igst ?? 0).toFixed(2)}
          </div>
        ),
        renderEdit: ({ row }) => {
          const rate = Number(row.rate) || 0;
          const { igstPercentage } = calculatePercentages(
            rate,
            row.applicable_for
          );
          return (
            <input
              className="form-control form-control-sm"
              type="number"
              value={igstPercentage.toFixed(2)}
              readOnly
              style={{ textAlign: "center", backgroundColor: "#e9ecef" }}
            />
          );
        },
        width: "90px",
        minWidth: "80px",
        maxWidth: "100px",
        style: { textAlign: "center" },
        searchable: false,
      },
      {
        key: "status",
        label: "Status",
        render: (row) => {
          // Backend uses SMALLINT: 1 = Active, 0 = Inactive
          const statusNum = Number(row.status);

          // Use status_text from API if available
          if (row.status_text) {
            const isActive = row.status_text.toLowerCase().includes("active") || statusNum === 1;
            return (
              <span style={isActive ? ACTIVE_BADGE_STYLE : INACTIVE_BADGE_STYLE}>
                {row.status_text}
              </span>
            );
          }

          // Handle numeric status: 1 = Active, 0 = Inactive
          if (!isNaN(statusNum)) {
            if (statusNum === 1) {
              return <span style={ACTIVE_BADGE_STYLE}>Active</span>;
            } else if (statusNum === 0) {
              return <span style={INACTIVE_BADGE_STYLE}>Inactive</span>;
            }
          }

          // Fallback to dropdown lookup
          return getDisplayText(statusOptions, row.status) || "-";
        },
        renderEdit: ({ value, onChange, isNew }) => {
          // Convert dropdown options to numeric if possible (backend expects SMALLINT: 1 = Active, 0 = Inactive)
          const selectOptions = statusOptions.map((opt) => ({
            value: isNaN(Number(opt.ValueText)) ? opt.ValueText : Number(opt.ValueText),
            label: opt.DisplayText,
          }));

          const activeOption = findActiveStatusOption(statusOptions);

          // Convert default value to number if it's numeric
          const getNumericValue = (val) => {
            if (val == null) return null;
            return isNaN(Number(val)) ? val : Number(val);
          };

          // Default to 1 (Active) for new rows if no active option found
          const defaultActiveValue = 1; // Backend: 1 = Active
          const defaultValue =
            !value && isNew
              ? (activeOption ? getNumericValue(activeOption.ValueText) : defaultActiveValue)
              : getNumericValue(value);

          // Apply default "Active" (1) for new rows
          if (!value && isNew && activeOption) {
            setTimeout(() => {
              onChange({ target: { value: defaultValue } });
            }, 0);
          }

          // Find matching option (handle both string and number comparisons)
          const findStatusOption = (val) => {
            if (val == null) return null;
            // Try exact match first
            let found = selectOptions.find((opt) => opt.value === val);
            // If not found and value is numeric, try numeric comparison
            if (!found && !isNaN(Number(val))) {
              found = selectOptions.find((opt) => Number(opt.value) === Number(val));
            }
            return found || null;
          };

          return (
            <Select
              classNamePrefix="react-select"
              isClearable={false}
              value={findStatusOption(defaultValue)}
              onChange={(opt) => {
                // Backend expects numeric: 1 = Active, 0 = Inactive
                const selectedValue = opt ? (isNaN(Number(opt.value)) ? opt.value : Number(opt.value)) : null;
                onChange({ target: { value: selectedValue } });
              }}
              options={selectOptions}
              placeholder="Select Status"
              menuPlacement="auto"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                control: (provided) => ({
                  ...provided,
                  minWidth: "100px",
                  maxWidth: "400px",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                menu: (provided) => ({
                  ...provided,
                  zIndex: 9999,
                  minWidth: "140px",
                  width: "100%",
                }),
                menuList: (provided) => ({ ...provided, maxHeight: 180 }),
              }}
              isSearchable
            />
          );
        },
        searchable: false,
        width: "80px",
        minWidth: "80px",
      },
      {
        key: "data",
        label: "Id",
        renderEdit: ({ value }) => (
          <input
            className="form-control form-control-sm"
            value={value || ""}
            disabled
            style={{ textAlign: "center" }}
          />
        ),
        searchable: false,
        width: "70px",
        minWidth: "60px",
        maxWidth: "80px",
        style: { textAlign: "center" },
      },
    ];
  }, [statusOptions, applicableForOptions]);

  // ----------------------------
  // Validation (memoized)
  // ----------------------------

  const validateCell = useMemo(
    () =>
      buildInlineTableValidateCell({
        required: {
          text: "Enter The Tax Name*",
          rate: "Enter The GST Rate*",
          applicable_for: "Select The Applicable For*",
          status: "Select The Status*",
        },
        getData: () => gstData,
      }),
    [gstData]
  );

  // ----------------------------
  // Save handler
  // ----------------------------

  const handleTableSave = useCallback(
    async ({ newRows, editedRows }) => {
      setIsSaving(true);
      try {
        let hasValidationErrors = false;

        // Patch CGST/SGST/IGST percentages before save
        function patchRows(rows) {
          return rows.map((row) => {
            const rate = Number(row.rate) || 0;
            const { cgstPercentage, sgstPercentage, igstPercentage } =
              calculatePercentages(rate, row.applicable_for);
            return {
              ...row,
              cgst: cgstPercentage,
              sgst: sgstPercentage,
              igst: igstPercentage,
            };
          });
        }

        // Basic required validation before API call
        const allRows = [...newRows, ...editedRows];
        for (const row of allRows) {
          const merged = row._originalRow
            ? { ...row._originalRow, ...row }
            : row;
          const taxName = (merged.text ?? "").toString().trim();
          // Allow 0% as valid rate, but reject null/undefined/empty or negative values
          const rateValue = merged.rate;
          const isRateValid = rateValue != null && rateValue !== "" && !isNaN(Number(rateValue)) && Number(rateValue) >= 0;
          // Backend expects numeric: applicable_for (1 or 2), status (1 or 0)
          const applicableFor = merged.applicable_for != null ? Number(merged.applicable_for) : null;
          const status = merged.status != null ? Number(merged.status) : null;

          // Validate: status must be 0 or 1, applicable_for must be 1 or 2, rate must be >= 0 (0% is allowed)
          if (!taxName || !isRateValid || applicableFor == null || status == null) {
            hasValidationErrors = true;
          }
        }

        if (hasValidationErrors) {
          return false;
        }

        // Build batched payload for new and edited rows
        const patchedNewRows = patchRows(newRows);
        const patchedEditedRows = patchRows(editedRows);

        const payloadArray = [
          ...patchedNewRows.map((row) => {
            const rate = Number(row.rate) || 0;
            const { cgstPercentage, sgstPercentage, igstPercentage } =
              calculatePercentages(rate, row.applicable_for);

            const statusValue =
              row.status != null ? Number(row.status) : 0;
            const applicableForValue =
              row.applicable_for != null ? Number(row.applicable_for) : 0;

            return {
              pageSize: 0,
              pageNumber: 0,
              gstid: 0,
              taxName: row.text || "",
              gstPerc: rate,
              gstStatus: statusValue,
              gstApplicableFor: applicableForValue,
              cgstPercentage,
              sgstPercentage,
              igstPercentage,
              paramType: "ADD",
            };
          }),
          ...patchedEditedRows.map((row) => {
            const merged = row._originalRow
              ? { ...row._originalRow, ...row }
              : row;

            const rate = Number(merged.rate) || 0;
            const { cgstPercentage, sgstPercentage, igstPercentage } =
              calculatePercentages(rate, merged.applicable_for);

            const statusValue =
              merged.status != null ? Number(merged.status) : 0;
            const applicableForValue =
              merged.applicable_for != null ? Number(merged.applicable_for) : 0;

            return {
              pageSize: 0,
              pageNumber: 0,
              gstid: merged.data || 0,
              taxName: merged.text || "",
              gstPerc: rate,
              gstStatus: statusValue,
              gstApplicableFor: applicableForValue,
              cgstPercentage,
              sgstPercentage,
              igstPercentage,
              paramType: "ADD",
            };
          }),
        ];

        // If nothing to save, just return true
        if (payloadArray.length === 0) {
          return true;
        }

        try {
          const apiResult = await saveOrUpdateGstMaster(payloadArray);

          const validationErrors = apiResult?.data?.ValidationErrors;
          const GSTMasterMessages = apiResult?.data?.GST_MASTER_RESPONSE;
          const status = apiResult?.Status;

          // Handle backend validation errors (if any)
          if (handleApiValidationErrors(validationErrors, showToast)) {
            return false;
          }

          let message = "";
          if (GSTMasterMessages?.length > 0) {
            message = GSTMasterMessages.map((e) => e.Message).join(" ");
          }

          const toastType =
            status === SUCCESS_STATUS || status === MESSAGE_OK ? SUCCESS_STATUS : ERROR_STATUS.toLowerCase();

          if (message && showToast) {
            showToast(message.trim(), toastType);
          }

          if (toastType === ERROR_STATUS.toLowerCase()) {
            return false;
          }

          // On success, refresh full GST list so IDs and data stay in sync
          await fetchGSTMaster();

          // After refresh, move newly created records to the top of the CURRENT PAGE
          if (patchedNewRows.length > 0) {
            const buildKey = (row) =>
              `${(row.text || "").toString().trim()}|${Number(
                row.rate ?? 0
              )}|${Number(row.applicable_for ?? 0)}|${Number(
                row.status ?? 0
              )}`;

            const newRowKeys = new Set(patchedNewRows.map(buildKey));

            // Determine the start index of the current page from the table ref
            const insertIndex =
              tableRef.current?.getInsertIndex?.() ?? 0;

            setGstData((prev) => {
              if (!Array.isArray(prev) || prev.length === 0) return prev;

              const safeIndex = Math.max(
                0,
                Math.min(insertIndex, prev.length)
              );

              const newRecords = [];
              const before = [];
              const pageAndAfter = [];

              prev.forEach((row, idx) => {
                const key = buildKey(row);
                const isNew = newRowKeys.has(key);

                if (isNew) {
                  newRecords.push(row);
                } else if (idx < safeIndex) {
                  before.push(row);
                } else {
                  pageAndAfter.push(row);
                }
              });

              // Place new records at the top of the current page (safeIndex)
              return [...before, ...newRecords, ...pageAndAfter];
            });
          }

          return true;
        } catch {
          if (showToast) {
            showToast("Network error during save", ERROR_STATUS.toLowerCase());
          }
          return false;
        }
      } finally {
        setIsSaving(false);
      }
    },
    [showToast, fetchGSTMaster, setGstData]
  );

  // ----------------------------
  // Render
  // ----------------------------

  return (
    <div style={{ position: "relative" }}>
      <FullPageLoader
        loading={isSaving}
        message="Saving GST Master..."
        logoSrc={inspireLogo}
      />
      {loading && <Loader />}
      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          <div className="gst-table-wrapper">
            <InlineEditableTable
              ref={tableRef}
              columns={gstColumns}
              data={gstData}
              title="GST Master"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: 6 }}
                >
                  <path d="M12 1v22M5 5h14a2 2 0 0 1 2 2v3H3V7a2 2 0 0 1 2-2zm-2 8h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7z" />
                </svg>
              }
              onSave={handleTableSave}
              newRowFocusKey="text"
              showValidation
              tabId="gstmaster"
              validationTrigger="onSave"
              validateCell={validateCell}
              onRefresh={fetchGSTMaster}
              showGlobalSearch={true}
              canAdd={true}
              canEdit={true}
            />
          </div>
        </div>
      </main>
      <style>{`
        .gst-table-wrapper .d-flex.align-items-center.justify-content-between.p-2 {
          display: none !important;
        }
        .gst-refresh-btn {
          border: 1px solid #d0d7de !important;
          background: #fff !important;
          box-shadow: none !important;
          transition: border-color 0.2s, background 0.2s;
        }
        .gst-refresh-btn:hover,
        .gst-refresh-btn:focus {
          border-color: #205084 !important;
          background: #f0f4fa !important;
        }

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
      `}</style>
    </div>
  );
} 
