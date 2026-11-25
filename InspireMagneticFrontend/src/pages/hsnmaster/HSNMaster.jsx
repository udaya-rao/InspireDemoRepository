import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  getHSNStatus,
  getLocalGSTData,
  getInterStateGSTData,
  fetchHSNMasterList,
  SaveAndUpdateHSNMaster,
} from "../../services/hsnMasterService";

import InlineEditableTable from "../../components/InlineEditableTable";
import Loader from "../../components/Loader";
import FullPageLoader from "../../components/FullPageLoader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import { useToast } from "../../components/useToast";
import Select from "react-select";
import { buildInlineTableValidateCell } from "../../utils/inlineTableValidation";
import { CustomMultiColumnDropdown } from "../../components/CustomVendorDropdown";
import { handleApiValidationErrors } from "../../utils/CustomValidation";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS } from "../../utils/ConstVariables";


const GST_COMMON_COLUMNS = [
  { key: "text", header: "GST NAME", width: "140px" },
  { key: "rate", header: "RATE", width: "80px" },
  { key: "applicableFor", header: "APPLICABLE FOR", width: "100px" },
];

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

const centerStyle = { textAlign: "center" };

/**
 * Find GST type option (by value, label, or data.text).
 */
function getGstTypeByName(nameOrId, options = []) {
  if (nameOrId === undefined || nameOrId === null || options.length === 0)
    return null;

  const s = String(nameOrId);

  return (
    options.find((opt) => {
      const optValue = opt?.value !== undefined ? String(opt.value) : "";
      const optLabel = opt?.label !== undefined ? String(opt.label) : "";
      const optDataText =
        opt?.data?.text !== undefined ? String(opt.data.text) : "";
      // match by id(value) OR label OR data.text
      return optValue === s || optLabel === s || optDataText === s;
    }) || null
  );
}

/**
 * Build dropdown options for GST lists from API responses.
 */
function mapGstApiDataToOptions(list = []) {
  return list.map((item) => ({
    value: item.data,
    label: String(item.text ?? ""),
    data: {
      id: item.data,
      text: item.text,
      rate: item.rate,
      applicableFor: item.applicable_for,
    },
  }));
}

/**
 * Factory to create renderEdit for GST dropdown columns.
 */
function createGstTypeRenderEdit({
  typeKey,
  rateKey,
  options,
  columns,
  groupLabel,
  placeholder,
}) {
  return function GstTypeRenderEdit({ row, setFields }) {
    const selectedOption =
      options.find((opt) => String(opt.value) === String(row[typeKey])) || null;

    return (
      <CustomMultiColumnDropdown
        name={typeKey}
        classNamePrefix="react-select"
        value={selectedOption}
        options={options}
        columns={columns}
        menuWidth={400}
        placeholder={placeholder}
        groupLabel={groupLabel}
        isClearable={false}
        onOptionSelected={(option) => {
          const id =
            typeof option?.value !== "undefined"
              ? option.value
              : option?.data?.id ?? "";

          if (String(row[typeKey] ?? "") === String(id ?? "")) {
            return;
          }

          setFields({
            [typeKey]: id, // numeric id for backend
            [rateKey]: option?.data?.rate ?? "",
            applicable_for: option?.data?.applicableFor ?? "",
          });
        }}
      />
    );
  };
}

/**
 * Find default "Active" status option.
 */
function findActiveStatusOption(options) {
  return options.find(
    (opt) =>
      opt.label?.toLowerCase().includes("active") ||
      opt.value?.toLowerCase() === "1"
  );
}

// ------------------------------------------------------
// Component
// ------------------------------------------------------

export default function HSNMaster() {
  const [hsnData, setHsnData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localGstOptions, setLocalGstOptions] = useState([]);
  const [interstateGstOptions, setInterstateGstOptions] = useState([]);
  const [hsnStatus, setHsnStatus] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();
  const tableRef = useRef();

  // ----------------------------
  // Fetch helpers
  // ----------------------------

  const fetchHsnStatus = useCallback(async () => {
    try {
      const HSNStatusData = await getHSNStatus();
      const mappedOptions = HSNStatusData.map((item) => ({
        value: item.ValueText,
        label: item.DisplayText,
      }));

      const activeOption = findActiveStatusOption(mappedOptions);

      setHsnStatus(mappedOptions);

      // Apply default active status if not already set
      if (activeOption) {
        setHsnData((prev) =>
          prev.map((row) => ({
            ...row,
            hsn_status: row.hsn_status || activeOption.value,
          }))
        );
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        window.dispatchEvent(new Event("sessionExpired"));
      } else {
        console.error("Failed to fetch HSN status", error);
        if (showToast) showToast("Failed to load HSN status", ERROR_STATUS.toLowerCase());
      }
    }
  }, [showToast]);

  const fetchLocalGstData = useCallback(async () => {
    try {
      const LocalGSTData = await getLocalGSTData();
      setLocalGstOptions(mapGstApiDataToOptions(LocalGSTData));
    } catch (error) {
      console.error("Error fetching Local GST Data:", error);
      setLocalGstOptions([]);
    }
  }, []);

  const fetchInterstateGstData = useCallback(async () => {
    try {
      const InterStateGSTData = await getInterStateGSTData();
      setInterstateGstOptions(mapGstApiDataToOptions(InterStateGSTData));
    } catch (error) {
      console.error("Error fetching Interstate GST Data:", error);
      setInterstateGstOptions([]);
    }
  }, []);

  const fetchHSNMaster = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHSNMasterList();
      const records = data?.data?.HSN_MASTER_LIST || [];

      setHsnData(
        records.map((item) => ({
          ...item,
          local_gst_id: item.local_gst_id ?? "",
          interstate_gst_id: item.interstate_gst_id ?? "",
        }))
      );
    } catch (error) {
      if (error?.response?.status === 401) {
        window.dispatchEvent(new Event("sessionExpired"));
      } else {
        console.error("Failed to fetch HSN Master list", error);
        setHsnData([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchHSNMaster();
    fetchLocalGstData();
    fetchInterstateGstData();
    fetchHsnStatus();
  }, [
    fetchHSNMaster,
    fetchLocalGstData,
    fetchInterstateGstData,
    fetchHsnStatus,
  ]);

  // ----------------------------
  // Column definitions (memoized)
  // ----------------------------

  const localGstColumns = useMemo(() => GST_COMMON_COLUMNS, []);
  const interstateGstColumns = useMemo(() => GST_COMMON_COLUMNS, []);

  const hsnColumns = useMemo(() => {
    const localGstRenderEdit = createGstTypeRenderEdit({
      typeKey: "local_gst_id",
      rateKey: "cc_local_gst_rate",
      options: localGstOptions,
      columns: localGstColumns,
      groupLabel: "Local GST Data",
      placeholder: "Select Local GST",
    });

    const interStateGstRenderEdit = createGstTypeRenderEdit({
      typeKey: "interstate_gst_id",
      rateKey: "cc_interstate_gst_rate",
      options: interstateGstOptions,
      columns: interstateGstColumns,
      groupLabel: "Interstate GST Data",
      placeholder: "Select Inter State GST",
    });

    const getLocalGstSortValue = (row) => {
      const gstId = row.local_gst_id;

      if (gstId === undefined || gstId === null || gstId === "" || gstId === 0) {
        return null;
      }

      const gstIdStr = String(gstId).trim();
      if (gstIdStr === "" || gstIdStr === "0") {
        return null;
      }


      if (!Array.isArray(localGstOptions) || localGstOptions.length === 0) {
        return gstIdStr;
      }

      const gstOption = getGstTypeByName(gstId, localGstOptions);

      if (!gstOption) {
        return null;
      }

      const sortValue = gstOption?.label || gstOption?.data?.text;
      if (sortValue === undefined || sortValue === null || sortValue === "") {
        return null;
      }

      const result = String(sortValue).trim();
      return result || null;
    };

    const getInterstateGstSortValue = (row) => {
      const gstId = row.interstate_gst_id;

      if (gstId === undefined || gstId === null || gstId === "" || gstId === 0) {
        return null;
      }

      const gstIdStr = String(gstId).trim();
      if (gstIdStr === "" || gstIdStr === "0") {
        return null;
      }

      if (!Array.isArray(interstateGstOptions) || interstateGstOptions.length === 0) {
        return gstIdStr;
      }

      const gstOption = getGstTypeByName(gstId, interstateGstOptions);

      if (!gstOption) {
        return null;
      }

      const sortValue = gstOption?.label || gstOption?.data?.text;
      if (sortValue === undefined || sortValue === null || sortValue === "") {
        return null;
      }

      const result = String(sortValue).trim();
      return result || null;
    };

    const getStatusSortValue = (row) => {
      const status = row.hsn_status;
      if (status === undefined || status === null || status === "") {
        return null;
      }
      const statusNum = Number(status);
      if (!isNaN(statusNum) && statusNum === 1) return "Active";
      if (!isNaN(statusNum) && statusNum === 0) return "Inactive";
      const statusOption = hsnStatus.find((opt) => opt.value === status);
      const result = statusOption?.label || String(status || "");
      return result || null;
    };

    return [
      {
        key: "text",
        label: "HSN Description",
        minWidth: 250,
        width: 350,
        renderEdit: ({ value, onChange }) => (
          <input
            className="form-control form-control-sm"
            value={value || ""}
            onChange={(e) => {
              // allow only alphanumeric characters and spaces
              const cleaned = (e.target.value || "").replace(
                /[^a-zA-Z0-9\s]/g,
                ""
              );
              e.target.value = cleaned;
              onChange(e);
            }}
          />
        ),
        searchable: false,
      },
      {
        key: "hsn_code",
        label: "HSN Code",
        renderEdit: ({ value, onChange }) => (
          <input
            className="form-control form-control-sm"
            value={value || ""}
            onChange={(e) => {
              // allow only numeric
              e.target.value = (e.target.value || "").replace(/\D/g, "");
              onChange(e);
            }}
            maxLength={8}
          />
        ),
        searchable: true,
      },
      {
        key: "local_gst_id",
        label: "Local GST Type",
        minWidth: 200,
        width: 350,
        renderEdit: localGstRenderEdit,
        searchable: false,
        sortValue: getLocalGstSortValue,
      },
      {
        key: "cc_local_gst_rate",
        label: " GST %",
        render: (row) => row.cc_local_gst_rate,
        renderEdit: ({ value }) => (
          <input
            className="form-control form-control-sm"
            value={value ?? ""}
            style={centerStyle}
            disabled
          />
        ),
        searchable: false,
      },
      {
        key: "interstate_gst_id",
        label: "Inter State GST Type",
        minWidth: 300,
        width: 350,
        renderEdit: interStateGstRenderEdit,
        searchable: false,
        sortValue: getInterstateGstSortValue,
      },
      {
        key: "cc_interstate_gst_rate",
        label: "GST %",
        render: (row) => row.cc_interstate_gst_rate,
        renderEdit: ({ value }) => (
          <input
            className="form-control form-control-sm"
            value={value ?? ""}
            style={centerStyle}
            disabled
          />
        ),
        searchable: false,
      },
      {
        key: "hsn_status",
        label: "Status",
        render: (row) =>
          row.hsn_status === 1 ? (
            <span style={ACTIVE_BADGE_STYLE}>Active</span>
          ) : row.hsn_status === 0 ? (
            <span style={INACTIVE_BADGE_STYLE}>Inactive</span>
          ) : (
            row.hsn_status
          ),
        renderEdit: ({ value, onChange, isNew }) => {
          const activeOption = findActiveStatusOption(hsnStatus);

          const defaultValue =
            !value && isNew && activeOption ? activeOption.value : value;

          // Apply default "Active" for new rows
          if (!value && isNew && activeOption) {
            setTimeout(() => {
              onChange({ target: { value: activeOption.value } });
            }, 0);
          }

          return (
            <Select
              classNamePrefix="react-select"
              isClearable={false}
              value={
                hsnStatus.find((opt) => opt.value === defaultValue) || null
              }
              onChange={(opt) => {
                const selectedValue = opt ? opt.value : "";
                onChange({ target: { value: selectedValue } });
              }}
              options={hsnStatus}
              placeholder="Select Status"
              menuPlacement="auto"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                control: (provided) => ({
                  ...provided,
                  minWidth: "140px",
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
            />
          );
        },
        searchable: false,
        sortValue: getStatusSortValue,
      },
      {
        key: "hsn_id",
        label: "Id",
        renderEdit: ({ value }) => (
          <input
            className="form-control form-control-sm"
            value={value || ""}
            style={centerStyle}
            disabled
          />
        ),
        searchable: false,
      },
    ];
  }, [
    localGstOptions,
    interstateGstOptions,
    localGstColumns,
    interstateGstColumns,
    hsnStatus,
  ]);

  // ----------------------------
  // Validation (memoized)
  // ----------------------------

  // Base required-field validation
  const baseValidateCell = useMemo(
    () =>
      buildInlineTableValidateCell({
        required: {
          text: "Enter The HSN Description*",
          local_gst_id: "Select The Local GST Type*",
          interstate_gst_id: "Select The Inter State GST Type*",
        },
        getData: () => hsnData,
      }),
    [hsnData]
  );

  // Extended validation to also enforce alphanumeric + spaces for HSN Description on Save
  const validateCell = useCallback(
    (columnKey, row, value) => {
      // Run existing required validation first
      const baseError = baseValidateCell(columnKey, row, value);
      if (baseError) return baseError;

      if (columnKey === "text") {
        const v = (value ?? "").toString();
        // If non-empty, enforce pattern
        if (v && !/^[a-zA-Z0-9\s]+$/.test(v)) {
          return "HSN Description allows only letters, numbers, and spaces.";
        }
      }

      return null;
    },
    [baseValidateCell]
  );

  // ----------------------------
  // Save handler
  // ----------------------------

  const handleTableSave = useCallback(
    async ({ newRows, editedRows }) => {
      setIsSaving(true);
      try {
        let hasValidationErrors = false;

        // Patch GST rates before save
        function patchRows(rows) {
          return rows.map((row) => {
            [
              ["local_gst_id", "cc_local_gst_rate"],
              ["interstate_gst_id", "cc_interstate_gst_rate"],
            ].forEach(([typeKey, rateKey]) => {
              if (row[typeKey]) {
                const gst = getGstTypeByName(row[typeKey], [
                  ...localGstOptions,
                  ...interstateGstOptions,
                ]);
                if (gst) {
                  const rateFromOption = gst?.data?.rate ?? gst.rate ?? "";
                  row[rateKey] = rateFromOption;
                }
              }
            });
            return row;
          });
        }

        // Helper to get GST ID value (numeric)
        const getGstDataValue = (val, options) => {
          if (val === undefined || val === null || val === "") return 0;

          // If val already numeric id, return it
          const asNumber = Number(val);
          if (
            !Number.isNaN(asNumber) &&
            options.some((opt) => String(opt.value) === String(val))
          ) {
            return asNumber;
          }

          const gst = getGstTypeByName(val, options);
          if (!gst) return 0;
          return gst.value ?? 0;
        };

        // Basic required + pattern validation before API call
        const allRows = [...newRows, ...editedRows];
        for (const row of allRows) {
          const merged = row._originalRow
            ? { ...row._originalRow, ...row }
            : row;

          const hsnName = (merged.text ?? "").toString().trim();
          const localGstId = merged.local_gst_id;
          const interstateGstId = merged.interstate_gst_id;

          if (!hsnName || !localGstId || !interstateGstId) {
            hasValidationErrors = true;
          }

          // pattern check again at save level (defensive, though UI validation already covers it)
          if (hsnName && !/^[a-zA-Z0-9\s]+$/.test(hsnName)) {
            hasValidationErrors = true;
          }
        }

        if (hasValidationErrors) {
          // returning false will keep rows in edit mode;
          // InlineEditableTable will use validateCell to show red borders + messages.
          return false;
        }

        // Build batched payload for new and edited rows
        const patchedNewRows = patchRows(newRows);
        const patchedEditedRows = patchRows(editedRows);

        const payloadArray = [
          ...patchedNewRows.map((row) => {
            return {
              pageSize: 0,
              pageNumber: 0,
              hsnid: 0,
              hsnName: row.text || "",
              hsnCode: row.hsn_code || "",
              localGSTID: getGstDataValue(row.local_gst_id, localGstOptions),
              interStateGSTID: getGstDataValue(
                row.interstate_gst_id,
                interstateGstOptions
              ),
              hsnStatus: row.hsn_status != null ? Number(row.hsn_status) : 0,
              paramType: "ADD",
            };
          }),
          ...patchedEditedRows.map((row) => {
            const merged = row._originalRow
              ? { ...row._originalRow, ...row }
              : row;

            return {
              pageSize: 0,
              pageNumber: 0,
              hsnid: merged.hsn_id || 0,
              hsnName: merged.text || "",
              hsnCode: merged.hsn_code || "",
              localGSTID: getGstDataValue(merged.local_gst_id, localGstOptions),
              interStateGSTID: getGstDataValue(
                merged.interstate_gst_id,
                interstateGstOptions
              ),
              hsnStatus:
                merged.hsn_status != null ? Number(merged.hsn_status) : 0,
              paramType: "ADD",
            };
          }),
        ];

        // If nothing to save, just return true
        if (payloadArray.length === 0) {
          return true;
        }

        try {
          const apiResult = await SaveAndUpdateHSNMaster(payloadArray);

          const validationErrors = apiResult?.data?.ValidationErrors;
          const HSNMasterMessages = apiResult?.data?.HSN_MASTER_RESPONSE;
          const status = apiResult?.Status;

          // Handle backend validation errors (if any)
          if (handleApiValidationErrors(validationErrors, showToast)) {
            return false;
          }

          let message = "";
          if (HSNMasterMessages?.length > 0) {
            message = HSNMasterMessages.map((e) => e.Message).join(" ");
          }

          const toastType =
            status === SUCCESS_STATUS || status === MESSAGE_OK ? SUCCESS_STATUS : ERROR_STATUS.toLowerCase();

          if (message && showToast) {
            showToast(message.trim(), toastType);
          }

          if (toastType === ERROR_STATUS.toLowerCase()) {
            return false;
          }

          // On success, refresh full HSN list so IDs and data stay in sync
          await fetchHSNMaster();

          // After refresh, move newly created records to the top of the CURRENT PAGE
          if (patchedNewRows.length > 0) {
            const buildKey = (row) =>
              `${(row.text || "").toString().trim()}|${row.hsn_code || ""}|${Number(
                row.local_gst_id ?? 0
              )}|${Number(row.interstate_gst_id ?? 0)}|${Number(
                row.hsn_status ?? 0
              )}`;

            const newRowKeys = new Set(patchedNewRows.map(buildKey));

            setHsnData((prev) => {
              if (!Array.isArray(prev) || prev.length === 0) return prev;

              // Get current page start index from table
              const currentPageStartIndex =
                tableRef.current?.getInsertIndex?.() ?? 0;

              const newRecords = [];
              const beforePageRecords = [];
              const afterPageRecords = [];

              prev.forEach((row, index) => {
                const key = buildKey(row);
                if (newRowKeys.has(key)) {
                  newRecords.push(row);
                } else if (index < currentPageStartIndex) {
                  beforePageRecords.push(row);
                } else {
                  afterPageRecords.push(row);
                }
              });

              // Place new records at the top of the current page
              return [
                ...beforePageRecords,
                ...newRecords,
                ...afterPageRecords,
              ];
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
    [
      localGstOptions,
      interstateGstOptions,
      showToast,
      fetchHSNMaster,
      setHsnData,
    ]
  );

  // ----------------------------
  // Render
  // ----------------------------

  return (
    <div style={{ position: "relative" }}>
      <FullPageLoader
        loading={isSaving}
        message="Saving HSN Master..."
        logoSrc={inspireLogo}
      />
      {loading && <Loader />}
      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          <div className="hsn-table-wrapper">
            <InlineEditableTable
              ref={tableRef}
              columns={hsnColumns}
              data={hsnData}
              title="HSN Master"
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
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M7 8h10M7 12h6" />
                </svg>
              }
              onSave={handleTableSave}
              newRowFocusKey="text"
              showValidation
              tabId="hsnmaster"
              validationTrigger="onSave"
              validateCell={validateCell}
              onRefresh={fetchHSNMaster}
              showGlobalSearch={true}
              canAdd={true}
              canEdit={true}
            />
          </div>
        </div>
      </main>
      <style>{`
        .hsn-table-wrapper .d-flex.align-items-center.justify-content-between.p-2 {
          display: none !important;
        }
        .hsn-refresh-btn {
          border: 1px solid #d0d7de !important;
          background: #fff !important;
          box-shadow: none !important;
          transition: border-color 0.2s, background 0.2s;
        }
        .hsn-refresh-btn:hover,
        .hsn-refresh-btn:focus {
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
