import React, { useMemo, useState } from "react";
import Select, { components as SelectComponents } from "react-select";
import { StableScrollMenuList } from "./FormElement";

const BASE_FLEX_WIDTH = 400; // fallback width for any flex column (description, etc.)
const DEFAULT_COL_WIDTH = 120;

// ---------- helpers --------------------------------------------------

const buildGridTemplate = (columns) => {
  if (!Array.isArray(columns) || columns.length === 0) return undefined;

  return columns
    .map((col) => {
      if (col.width) {
        return typeof col.width === "string" ? col.width : `${col.width}px`;
      }
      if (col.flex) {
        const minW = col.minWidth ? (typeof col.minWidth === "string" ? col.minWidth : `${col.minWidth}px`) : `${DEFAULT_COL_WIDTH}px`;
        const maxW = col.maxWidth ? (typeof col.maxWidth === "string" ? col.maxWidth : `${col.maxWidth}px`) : "1fr";
        let finalMinW = minW;
        if (typeof col.maxWidth === "string" && col.maxWidth.endsWith("px")) {
          const maxPx = parseInt(col.maxWidth, 10);
          const minPx = parseInt(minW, 10);
          if (!isNaN(maxPx) && !isNaN(minPx) && minPx > maxPx) {
            finalMinW = `${maxPx}px`;
          }
        } else if (typeof col.maxWidth === "number") {
          const minPx = parseInt(minW, 10);
          if (!isNaN(minPx) && minPx > col.maxWidth) {
            finalMinW = `${col.maxWidth}px`;
          }
        }
        return `minmax(${finalMinW}, ${maxW})`;
      }
      if (col.maxWidth) {
        return typeof col.maxWidth === "string" ? col.maxWidth : `${col.maxWidth}px`;
      }
      return `${DEFAULT_COL_WIDTH}px`;
    })
    .join(" ");
};

// const computeMenuWidthFromColumns = (columns) => {
//   if (!Array.isArray(columns) || columns.length === 0) return undefined;

//   const total = columns.reduce((sum, col) => {
//     if (col.width) {
//       const n = parseInt(String(col.width).replace(/[^0-9]/g, ""), 10);
//       return sum + (Number.isFinite(n) ? n : DEFAULT_COL_WIDTH);
//     }
//     if (col.flex) return sum + BASE_FLEX_WIDTH;
//     return sum + DEFAULT_COL_WIDTH;
//   }, 32); // padding allowance

//   return Math.max(total, 600);
// };

const defaultFilterOption = (option, rawInput) => {
  if (!rawInput) return true;

  const label = String(option.label ?? "");
  const value = String(option.value ?? "");
  const searchTerm = String(rawInput).toLowerCase();

  return (
    label.toLowerCase().includes(searchTerm) ||
    value.toLowerCase().includes(searchTerm)
  );
};

const buildCellStyle = (col, { isHeader = false } = {}) => ({
  minWidth: col.width
    ? typeof col.width === "string"
      ? col.width
      : `${col.width}px`
    : col.minWidth
      ? typeof col.minWidth === "string"
        ? col.minWidth
        : `${col.minWidth}px`
      : undefined,
  maxWidth: col.maxWidth
    ? typeof col.maxWidth === "string"
      ? col.maxWidth
      : `${col.maxWidth}px`
    : undefined,
  textAlign: col.align || "left",
  fontWeight: isHeader ? 500 : 400,
  color: isHeader ? "#495057" : "#333",
  fontSize: isHeader ? 12 : 13,
  whiteSpace: col.flex ? "normal" : "nowrap",
  overflow: col.flex ? "visible" : "hidden",
  textOverflow: col.flex ? "clip" : "ellipsis",
  wordBreak: col.flex ? "break-word" : "normal",
});

// ---------- main component --------------------------------------------

const CustomMultiColumnDropdown = ({
  label,
  name,
  value,
  onChange,
  options = [],
  isDisabled,
  placeholder = "Select...",
  columns = [],
  groupLabel = "Options",
  required = false,
  error,
  isValid,
  onOptionSelected,
  isMulti = false,
  onInputChange,
  onKeyDown,
  noOptionsMessage,
  isSearchable = false,
  menuIsOpen,
  openMenuOnClick,
  openMenuOnFocus,
  onMenuOpen,
  onMenuClose,
  onBlur,
  isClearable = false,
  menuWidth,
  onDropdownIndicatorClick,
  filterOption,
  onMenuScrollToBottom,
  isLoading = false,
  menuPortalTarget = null,
}) => {
  // Track the current input text shown in the dropdown textbox
  const [inputValue, setInputValue] = useState("");

  // layout-related memoized values
  const gridTemplate = useMemo(
    () => buildGridTemplate(columns),
    [columns]
  );

  // When `menuWidth` is not provided, let react-select default behavior
  // keep the menu width equal to the control width (responsive).
  const menuWidthStyle =
    typeof menuWidth === "number" ? `${menuWidth}px` : menuWidth;

  const rowBase = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: gridTemplate,
      alignItems: "center",
      columnGap: 12,
      width: "max-content", // Allow the row to be as wide as its contents
      minWidth: "100%", // But at least as wide as the dropdown
      minHeight: "auto",
      // Padding is applied in header/option styles to keep them identical
      padding: 0,
    }),
    [gridTemplate]
  );

  const customStyles = useMemo(
    () => ({
      option: (provided, state) => ({
        ...provided,
        ...rowBase,
        padding: "8px 12px",
        minHeight: "auto",
        height: "auto",
        cursor: "pointer",
        backgroundColor: state.isSelected
          ? "#E8E8E8"
          : state.isFocused
            ? "#F5F5F5"
            : "white",
        color: "#333",
        borderBottom: "1px solid #f0f0f0",
      }),
      multiValue: (provided) => ({
        ...provided,
        maxWidth: "220px",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        fontWeight: 600,
        maxWidth: "100px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: "#0f172a",
        // show only code text
        ":after": { content: '""' },
      }),
      menu: (provided) => ({
        ...provided,
        zIndex: 99999,
        ...(menuWidthStyle != null
          ? { width: menuWidthStyle, minWidth: menuWidthStyle }
          : null),
        maxWidth: "90vw",
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 99999,
      }),
      menuList: (provided) => ({
        ...provided,
        paddingTop: 0,
        paddingBottom: 0,
        overflowY: "auto",
        overflowX: "auto",
        minHeight: "100px",
      }),
      group: (provided) => ({
        ...provided,
        padding: 0,
        width: "max-content",
        minWidth: "100%",
      }),
      groupHeading: (provided) => ({
        ...provided,
        padding: 0,
        width: "max-content",
        minWidth: "100%",
      }),
      control: (provided, state) => ({
        ...provided,
        borderColor: state.isFocused ? "#2196f3" : "#ccc",
        boxShadow: state.isFocused ? "0 0 0 1px #2196f3" : "none",
        width: "100%",
        "&:hover": {
          borderColor: "#2196f3",
        },
      }),
      container: (provided) => ({
        ...provided,
        width: "100%",
      }),
      valueContainer: (provided, state) => {
        // Apply custom style ONLY when multi + searchable
        if (!(state.selectProps.isMulti && state.selectProps.isSearchable)) {
          return provided;
        }

        return {
          ...provided,
          padding: "2px 8px",
          maxHeight: "80px",
          overflowY: "auto",
          overflowX: "hidden",
        };
      },
      indicatorsContainer: (provided) => ({
        ...provided,
        padding: "2px 6px",
      }),
    }),
    [rowBase, menuWidthStyle]
  );

  const formatOptionLabel = (option) => {
    const { label: optLabel, data } = option || {};
    if (columns.length === 0) {
      return <div>{optLabel}</div>;
    }

    // Prefer explicit option.data, else fallback to option and derive missing keys from label
    let source = data && typeof data === "object" ? data : option;
    const missingKeys = columns.filter(
      (c) => !source || source[c.key] == null || source[c.key] === ""
    );

    if (missingKeys.length > 0 && typeof optLabel === "string") {
      const parts = optLabel.split(" - ");
      if (parts.length >= 1 && columns[0]) {
        source = { ...source, [columns[0].key]: parts[0] };
      }
      if (parts.length >= 2 && columns[1]) {
        source = {
          ...source,
          [columns[1].key]: parts.slice(1).join(" - "),
        };
      }
    }


    return (
      <>
        {columns.map((col) => (
          <div
            key={col.key}
            style={buildCellStyle(col)}
            title={String((source && source[col.key]) ?? "")}
          >
            {(source && source[col.key]) ?? ""}
          </div>
        ))}
      </>
    );
  };

  const formatGroupLabel = () => (
    <div
      style={{
        ...rowBase,
        padding: "8px 12px",
        backgroundColor: "#f8f9fa",
        borderBottom: "1px solid #eaeaea",
      }}
    >
      {columns.map((col) => (
        <div key={col.key} style={buildCellStyle(col, { isHeader: true })} title={col.header}>
          {col.header}
        </div>
      ))}
    </div>
  );

  // For multi-select, ensure selected values are always in options
  const enhancedOptions = useMemo(() => {
    if (!isMulti || !Array.isArray(value) || value.length === 0) {
      return options;
    }

    const selectedValues = new Set(value);
    const existingValues = new Set(options.map((opt) => opt.value));
    const missingValues = Array.from(selectedValues).filter(
      (val) => !existingValues.has(val)
    );

    const firstColumnKey =
      Array.isArray(columns) && columns.length > 0 ? columns[0]?.key : null;

    const placeholderOptions = missingValues.map((val) => ({
      value: val,
      label: String(val),
      data: firstColumnKey
        ? { [firstColumnKey]: String(val) }
        : { itemCode: String(val), description: "", stock: 0 },
    }));

    return [...options, ...placeholderOptions];
  }, [options, value, isMulti, columns]);

  const groupedOptions = useMemo(
    () => [
      {
        label: groupLabel,
        options: enhancedOptions,
      },
    ],
    [groupLabel, enhancedOptions]
  );

  // Single value display in control
  const SingleValueComponent = useMemo(
    () =>
      function SingleValue(props) {
        const { data } = props;
        const firstColumnKey =
          Array.isArray(columns) && columns.length > 0 ? columns[0]?.key : null;

        let displayText = "";

        if (
          firstColumnKey &&
          data?.data &&
          Object.prototype.hasOwnProperty.call(data.data, firstColumnKey)
        ) {
          displayText = data.data[firstColumnKey] ?? "";
        } else if (data?.data?.vendorCode) {
          displayText = data.data.vendorCode ?? "";
        } else if (data?.data?.itemCode) {
          displayText = data.data.itemCode ?? "";
        } else if (typeof data?.label === "string") {
          displayText = data.label;
        } else {
          displayText = data?.value ?? "";
        }

        return (
          <SelectComponents.SingleValue {...props}>
            {displayText}
          </SelectComponents.SingleValue>
        );
      },
    [columns]
  );

  const DropdownIndicator = useMemo(() => {
    if (typeof onDropdownIndicatorClick !== "function") return SelectComponents.DropdownIndicator;

    return function DropdownIndicatorComponent(props) {
      return (
        <SelectComponents.DropdownIndicator
          {...props}
          innerProps={{
            ...props.innerProps,
            onClick: (e) => {
              // Call custom handler first to set flag
              onDropdownIndicatorClick();
              // Then call original onClick to allow react-select to open menu
              if (
                props.innerProps &&
                typeof props.innerProps.onClick === "function"
              ) {
                props.innerProps.onClick(e);
              }
            },
          }}
        />
      );
    };
  }, [onDropdownIndicatorClick]);

  const selectComponentsMap = useMemo(
    () => ({
      SingleValue: SingleValueComponent,
      DropdownIndicator: DropdownIndicator,
    }),
    [SingleValueComponent, DropdownIndicator]
  );

  const effectiveFilter = filterOption || defaultFilterOption;

  // Determine wrapper style: table cell vs normal form field
  const isInTable = !label;
  const wrapperStyle = isInTable
    ? { margin: 0, width: "100%", display: "flex", flexDirection: "column" }
    : { marginBottom: "0.5rem", width: "100%" };

  // derive `value` prop for Select
  const resolvedValue = useMemo(() => {
    if (isMulti) {
      if (!Array.isArray(value)) return [];
      return enhancedOptions.filter((opt) => value.includes(opt.value));
    }

    if (value && typeof value === "object" && value !== null) {
      return value;
    }

    return enhancedOptions.find((opt) => opt.value === value) || null;
  }, [isMulti, value, enhancedOptions]);

  return (
    <div style={wrapperStyle}>
      {label && (
        <div className={`form-label ${required ? "required" : ""}`}>
          {label}
        </div>
      )}

      <div style={{ width: "100%", minWidth: 0 }}>
        <Select
          classNamePrefix="react-select"
          className={
            error
              ? "react-select-invalid"
              : isValid
                ? "react-select-valid"
                : ""
          }
          name={name}
          options={groupedOptions}
          isMulti={isMulti}
          value={resolvedValue}
          onChange={(option, actionMeta) => {
            const actionType = actionMeta?.action;

            if (typeof onChange === "function") {
              if (isMulti) {
                const vals = Array.isArray(option)
                  ? option.map((o) => o.value)
                  : [];
                onChange({ target: { name, value: vals } });
              } else {
                onChange({
                  target: { name, value: option ? option.value : "" },
                });
              }
            }

            if (typeof onOptionSelected === "function") {
              const payload = isMulti ? option : option || null;
              onOptionSelected(payload);
            }

            // Only clear search when a new option is selected
            if (isSearchable && actionType === "select-option") {
              if (typeof onInputChange === "function") {
                onInputChange("", {
                  action: "set-value",
                  prevInputValue: inputValue,
                });
              }
              setInputValue("");
            }
          }}
          placeholder={placeholder}
          isDisabled={isDisabled}
          styles={customStyles}
          formatOptionLabel={formatOptionLabel}
          formatGroupLabel={formatGroupLabel}
          isClearable={isClearable}
          isSearchable={isSearchable}
          isLoading={isLoading}
          inputValue={isSearchable ? inputValue : undefined}
          menuIsOpen={
            typeof menuIsOpen === "boolean" ? menuIsOpen : undefined
          }
          openMenuOnClick={
            typeof openMenuOnClick === "boolean" ? openMenuOnClick : undefined
          }
          openMenuOnFocus={
            typeof openMenuOnFocus === "boolean" ? openMenuOnFocus : undefined
          }
          onMenuOpen={onMenuOpen}
          openMenuOnInput={false}
          blurInputOnSelect={false}
          onMenuClose={onMenuClose}
          onMenuScrollToBottom={onMenuScrollToBottom}
          onInputChange={(newValue, meta) => {
            // Let parent hook in first
            let nextValue = newValue;
            if (typeof onInputChange === "function") {
              const maybe = onInputChange(newValue, meta);
              if (typeof maybe === "string") {
                nextValue = maybe;
              }
            }

            const finalValue =
              nextValue !== undefined
                ? nextValue
                : newValue !== undefined
                  ? newValue
                  : "";
            setInputValue(finalValue || "");
            return finalValue;
          }}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            if (typeof onBlur === "function") onBlur(e);
            if (typeof onMenuClose === "function") onMenuClose();
          }}
          menuPortalTarget={menuPortalTarget}
          menuPosition="fixed"
          menuPlacement="auto"
          menuShouldScrollIntoView
          filterOption={effectiveFilter}
          noOptionsMessage={
            typeof noOptionsMessage === "function"
              ? noOptionsMessage
              : () => "No options found"
          }
          loadingMessage={() => "Loading..."}
          components={{
            ...selectComponentsMap,
            MenuList: StableScrollMenuList,
          }}
        />
      </div>

      {error ? (
        <div className="invalid-feedback d-block">{error}</div>
      ) : null}
    </div>
  );
};

// Keep the old component for backward compatibility
const CustomVendorDropdown = ({
  label,
  name,
  value,
  onChange,
  options = [],
  isDisabled,
  placeholder = "Select Vendor...",
  isMulti = false,
  columns,
  groupLabel = "Vendors",
  onInputChange,
  onKeyDown,
  noOptionsMessage,
  isSearchable = false,
  menuIsOpen,
  openMenuOnClick,
  openMenuOnFocus,
  onMenuOpen,
  onMenuClose,
  onBlur,
  isClearable = false,
  menuWidth,
  onDropdownIndicatorClick,
  filterOption,
  onMenuScrollToBottom,
  isLoading = false,
  menuPortalTarget = null,
}) => {
  const defaultColumns = [
    { key: "vendorCode", header: "VENDOR CODE", width: "120px" },
    { key: "vendorName", header: "VENDOR NAME", width: "200px" },
  ];

  return (
    <CustomMultiColumnDropdown
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      options={options}
      isDisabled={isDisabled}
      placeholder={placeholder}
      columns={columns || defaultColumns}
      groupLabel={groupLabel}
      isMulti={isMulti}
      onInputChange={onInputChange}
      onKeyDown={onKeyDown}
      noOptionsMessage={noOptionsMessage}
      isSearchable={isSearchable}
      menuIsOpen={menuIsOpen}
      openMenuOnClick={openMenuOnClick}
      openMenuOnFocus={openMenuOnFocus}
      onMenuOpen={onMenuOpen}
      onMenuClose={onMenuClose}
      onBlur={onBlur}
      isClearable={isClearable}
      menuWidth={menuWidth}
      onDropdownIndicatorClick={onDropdownIndicatorClick}
      filterOption={filterOption}
      onMenuScrollToBottom={onMenuScrollToBottom}
      isLoading={isLoading}
      menuPortalTarget={menuPortalTarget}
    />
  );
};

export { CustomMultiColumnDropdown, CustomVendorDropdown };
export default CustomVendorDropdown;
