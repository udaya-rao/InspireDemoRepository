import React, { useCallback, useRef, useMemo, useEffect } from "react";
import Select, { components } from "react-select";
import CreatableSelect from "react-select/creatable";

// Reuse document body target for all react-select portals
const MENU_PORTAL_TARGET =
  typeof document !== "undefined" ? document.body : null;

// Helper: build Bootstrap validation classes
const buildValidationClass = (baseClass, error, isValid, extraClass = "") => {
  const stateClass = error ? " is-invalid" : isValid ? " is-valid" : "";
  const extra = extraClass ? ` ${extraClass}` : "";
  return `${baseClass}${stateClass}${extra}`;
};

// Helper: shared label rendering
const FormLabel = ({ label, required, tooltip, as = "label" }) => {
  const Tag = as;
  return (
    <Tag
      className={`form-label ${required ? "required" : ""}`}
      title={tooltip || ""}
    >
      {label}
    </Tag>
  );
};

// Helper: shared error message rendering
const FieldError = ({ error, block = false }) =>
  error ? (
    <div className={`invalid-feedback${block ? " d-block" : ""}`}>
      {error}
    </div>
  ) : null;

export function FormField({
  label,
  name,
  placeholder,
  type = "text",
  error,
  tooltip,
  isValid,
  minLength,
  maxLength,
  inputValueType, // "number", "alphanumeric", "alphanumeric-special"
  labelFieldshow, // consumed here so it is NOT forwarded to the DOM <input>
  ...rest
}) {

  const handleInputFilter = (e) => {
    let value = e.target.value;

    // Allow only numbers
    if (inputValueType === "number") {
      value = value.replace(/[^0-9]/g, "");
    }

    // Allow only alphanumeric
    else if (inputValueType === "alphanumeric") {
      value = value.replace(/[^a-zA-Z0-9]/g, "");
    }

    // Allow alphanumeric + special characters
    else if (inputValueType === "alphanumeric-special") {
      // Modify this allowed list based on requirement
      value = value.replace(/[^a-zA-Z0-9@#._\s-]/g, "");
    }

    e.target.value = value;
  };
  return (
    <div className="mb-2">
      <FormLabel label={label} required={rest.required} tooltip={tooltip} />
      <input
        type={type}
        className={buildValidationClass("form-control", error, isValid)}
        name={name}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        onInput={handleInputFilter}
        {...rest}
      />
      <FieldError error={error} />
    </div>
  );
}

export function TextAreaFormField({
  label,
  name,
  placeholder,
  error,
  isValid,
  tooltip,
  className,
  ...rest
}) {
  const extra = className ? ` ${className}` : "";
  return (
    <div className="mb-2">
      <FormLabel label={label} required={rest.required} tooltip={tooltip} />
      <textarea
        className={buildValidationClass("form-control", error, isValid, extra)}
        name={name}
        placeholder={placeholder}
        {...rest}
      />
      <FieldError error={error} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  options = [],
  multiple = false,
  error,
  isValid,
  ...rest
}) {
  return (
    <div className="mb-2">
      <FormLabel
        label={label}
        required={rest.required}
        tooltip={rest.tooltip}
        as="div"
      />
      <select
        className={buildValidationClass("form-select", error, isValid)}
        name={name}
        multiple={multiple}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <FieldError error={error} />
    </div>
  );
}

export function ToggleSwitchGroup({ label, tooltip, options = [], required }) {
  return (
    <div className="mb-2">
      <FormLabel label={label} required={required} tooltip={tooltip} as="div" />
      {options.map((opt, idx) => (
        <label
          className="form-check form-switch"
          required={opt.required}
          key={opt.value || idx}
        >
          <input
            className="form-check-input"
            type="checkbox"
            checked={!!opt.checked}
            disabled={!!opt.disabled}
            name={opt.name}
            onChange={opt.onChange}
          />
          <span className="form-check-label">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export function SingleSwitch({
  label,
  checked,
  disabled,
  name,
  onChange,
  required,
}) {
  return (
    <div className="mb-2">
      <FormLabel label={label} required={required} as="div" />
      <label className="form-check form-switch" required={required}>
        <input
          className="form-check-input"
          type="checkbox"
          checked={!!checked}
          disabled={!!disabled}
          name={name}
          onChange={onChange}
        />
        <span className="form-check-label">{label}</span>
      </label>
    </div>
  );
}

export function RadioGroup({
  label,
  name,
  options = [],
  inline = false,
  required,
}) {
  return (
    <div className="mb-2">
      <FormLabel label={label} required={required} as="div" />
      <div>
        {options.map((opt, idx) => (
          <label
            className={`form-check${inline ? " form-check-inline" : ""}`}
            key={opt.value || idx}
          >
            <input
              className="form-check-input"
              type="radio"
              name={name}
              value={opt.value}
              checked={!!opt.checked}
              disabled={!!opt.disabled}
              onChange={() =>
                opt.onChange({
                  target: { name, value: opt.value },
                })
              }
            />
            <span className="form-check-label">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function CheckboxGroup({
  label,
  options = [],
  inline = false,
  required,
  disabled,
  tooltip,
}) {
  return (
    <div className="mb-2">
      <FormLabel label={label} required={required} as="div" />
      <div>
        {options.map((opt, idx) => (
          <label
            className={`form-check${inline ? " form-check-inline" : ""}`}
            key={opt.value || idx}
          >
            <input
              className="form-check-input"
              type="checkbox"
              checked={!!opt.checked}
              disabled={!!disabled || !!opt.disabled}
              onChange={opt.onChange}
              name={opt.name}
              title={tooltip || ""}
            />
            <span className="form-check-label">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function URLFormField() {
  // TODO: Implement URLFormField
  return null;
}

export function CustomTimeDatePicker() {
  // TODO: Implement CustomTimeDatePicker
  return null;
}

// Custom MenuList component that prevents scroll reset on hover
export const StableScrollMenuList = (props) => {
  const { selectProps, innerRef, ...restProps } = props;
  const menuListRef = useRef(null);
  const hasScrolledRef = useRef(false);
  const savedScrollTopRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Set the ref for react-select
  const setMenuListRef = useCallback((node) => {
    menuListRef.current = node;
    if (typeof innerRef === "function") {
      innerRef(node);
    } else if (innerRef && typeof innerRef === "object") {
      innerRef.current = node;
    }
  }, [innerRef]);

  // Scroll to selected value on mount (when menu opens)
  useEffect(() => {
    if (!menuListRef.current || hasScrolledRef.current) return;

    const selectedEl = menuListRef.current.querySelector(
      ".react-select__option--is-selected"
    );
    if (selectedEl && selectedEl.scrollIntoView) {
      selectedEl.scrollIntoView({ block: "nearest", behavior: "auto" });
      hasScrolledRef.current = true;
      // Save the scroll position after initial scroll
      setTimeout(() => {
        if (menuListRef.current) {
          savedScrollTopRef.current = menuListRef.current.scrollTop;
        }
      }, 50);
    }
  }, []);

  // Reset scroll flag when menu closes
  useEffect(() => {
    if (!selectProps.menuIsOpen) {
      hasScrolledRef.current = false;
      savedScrollTopRef.current = 0;
      isUserScrollingRef.current = false;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    }
  }, [selectProps.menuIsOpen]);

  // Prevent scroll reset on focus/hover by maintaining scroll position
  useEffect(() => {
    if (!menuListRef.current || !hasScrolledRef.current) return;

    const menuList = menuListRef.current;

    // Track user-initiated scrolling (mouse wheel, touch)
    const handleWheel = () => {
      isUserScrollingRef.current = true;
      if (menuListRef.current && hasScrolledRef.current) {
        savedScrollTopRef.current = menuListRef.current.scrollTop;
      }
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 200);
    };

    const handleTouchStart = () => {
      isUserScrollingRef.current = true;
    };

    const handleTouchEnd = () => {
      if (menuListRef.current && hasScrolledRef.current) {
        savedScrollTopRef.current = menuListRef.current.scrollTop;
      }
      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 200);
    };

    const handleMouseDown = () => {
      isUserScrollingRef.current = true;
    };

    const handleMouseUp = () => {
      if (menuListRef.current && hasScrolledRef.current) {
        savedScrollTopRef.current = menuListRef.current.scrollTop;
      }
      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 200);
    };

    const handleScroll = () => {
      if (!hasScrolledRef.current || savedScrollTopRef.current === 0) return;

      // If user is scrolling, update saved position
      if (isUserScrollingRef.current) {
        savedScrollTopRef.current = menuList.scrollTop;
        return;
      }

      // If scroll changed significantly and it's not user-initiated,
      // it's likely react-select auto-scrolling to focused option
      const currentScroll = menuList.scrollTop;
      const diff = Math.abs(currentScroll - savedScrollTopRef.current);

      // If scroll changed by more than 20px (likely auto-scroll to focused option)
      // restore the saved position
      if (diff > 20) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          if (menuListRef.current && hasScrolledRef.current && !isUserScrollingRef.current) {
            menuListRef.current.scrollTop = savedScrollTopRef.current;
          }
        }, 10);
      }
    };

    menuList.addEventListener("scroll", handleScroll, { passive: true });
    menuList.addEventListener("wheel", handleWheel, { passive: true });
    menuList.addEventListener("touchstart", handleTouchStart, { passive: true });
    menuList.addEventListener("touchend", handleTouchEnd, { passive: true });
    menuList.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });

    return () => {
      menuList.removeEventListener("scroll", handleScroll);
      menuList.removeEventListener("wheel", handleWheel);
      menuList.removeEventListener("touchstart", handleTouchStart);
      menuList.removeEventListener("touchend", handleTouchEnd);
      menuList.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, [selectProps.menuIsOpen]);

  return (
    <components.MenuList
      {...restProps}
      innerRef={setMenuListRef}
    />
  );
};

export function ReactSelectField({
  label,
  name,
  options = [],
  value,
  onChange,
  onBlur,
  placeholder = "Select...",
  isClearable = false,
  disabled,
  error,
  isValid,
  onMenuOpen: userOnMenuOpen,
  autoScrollToValue = true,
  ...rest
}) {
  // dynamically assign validation classes
  const validationClass = error
    ? "react-select-invalid"
    : isValid
      ? "react-select-valid"
      : "";

  const selectRef = useRef(null);

  const handleMenuOpen = useCallback(() => {
    if (autoScrollToValue) {
      // Defer until menu DOM is rendered in the portal
      setTimeout(() => {
        try {
          const lists = document.querySelectorAll(".react-select__menu-list");
          const list = lists && lists.length ? lists[lists.length - 1] : null;
          if (!list) return;
          const selectedEl = list.querySelector(
            ".react-select__option--is-selected"
          );
          if (selectedEl && selectedEl.scrollIntoView) {
            selectedEl.scrollIntoView({ block: "nearest" });
          }
        } catch {
          // no-op
        }
      }, 0);
    }
    if (typeof userOnMenuOpen === "function") {
      userOnMenuOpen();
    }
  }, [autoScrollToValue, userOnMenuOpen]);

  return (
    <div className="mb-2" style={{ width: "100%" }}>
      <FormLabel label={label} required={rest.required} as="div" />
      <Select
        ref={selectRef}
        classNamePrefix="react-select"
        className={validationClass}
        name={name}
        options={options}
        value={
          options.find((opt) => String(opt.value) === String(value)) || null
        }
        onChange={(option) =>
          onChange({
            target: {
              name,
              value: option ? option.value : "",
            },
          })
        }
        onBlur={onBlur}
        onMenuOpen={handleMenuOpen}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={disabled}
        menuPortalTarget={MENU_PORTAL_TARGET}
        menuPosition="fixed"
        components={{
          MenuList: StableScrollMenuList,
          ...rest.components,
        }}
        styles={{
          container: (provided) => ({ ...provided, width: "100%" }),
          // control: (provided) => ({ ...provided, minHeight: 30 ,height: 30}),
          menu: (provided) => ({ ...provided, zIndex: 99999 }),
          menuPortal: (base) => ({ ...base, zIndex: 99999 }),
          valueContainer: (provided) => ({
            ...provided,
            paddingTop: 2,
            paddingBottom: 2,
          }),
          indicatorsContainer: (provided) => ({
            ...provided,
            paddingTop: 2,
            paddingBottom: 2,
          }),
          option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isDisabled
              ? "#f8f9fa"
              : state.isSelected
                ? "#E8E8E8"
                : state.isFocused
                  ? "#F5F5F5"
                  : "white",
            color: state.isDisabled ? "#adb5bd" : "#333",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            "&:active": {
              backgroundColor: state.isDisabled ? "#f8f9fa" : "#E8E8E8",
              color: state.isDisabled ? "#adb5bd" : "#333",
            },

          }),
        }}
        {...rest}
      />
      <FieldError error={error} block />
    </div>
  );
}

export function ReactCreatableSelectField({
  label,
  name,
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  isClearable = true,
  disabled,
  isMulti = false,
  error,
  isValid,
  ...rest
}) {
  const validationClass = error
    ? "react-select-invalid"
    : isValid
      ? "react-select-valid"
      : "";

  return (
    <div className="mb-2" style={{ width: "100%" }}>
      <FormLabel label={label} required={rest.required} as="div" />
      <CreatableSelect
        classNamePrefix="react-select"
        className={validationClass}
        name={name}
        options={options}
        isMulti={isMulti}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={disabled}
        menuPortalTarget={MENU_PORTAL_TARGET}
        menuPosition="fixed"
        styles={{
          container: (provided) => ({ ...provided, width: "100%" }),
          control: (provided) => ({ ...provided, minHeight: 30 }),
          menu: (provided) => ({ ...provided, zIndex: 99999 }),
          menuPortal: (base) => ({ ...base, zIndex: 99999 }),
          valueContainer: (provided) => ({
            ...provided,
            paddingTop: 2,
            paddingBottom: 2,
          }),
          indicatorsContainer: (provided) => ({
            ...provided,
            paddingTop: 2,
            paddingBottom: 2,
          }),
        }}
        {...rest}
      />
      <FieldError error={error} block />
    </div>
  );
}

// Helper functions for EditableSelectField
const normalizeValue = (val) => {
  if (val == null || val === "") return "";
  return String(val).trim();
};

const isEmptyValue = (val) => {
  return val == null || val === "" || val === 0;
};

const findOption = (options, searchValue) => {
  if (!searchValue) return null;
  return options.find(
    (opt) =>
      normalizeValue(opt.value) === searchValue ||
      normalizeValue(opt.label) === searchValue
  );
};

const positionCursorAtEnd = (inputElement, text) => {
  if (!inputElement || !text) return;
  inputElement.focus();
  const length = text.length;
  if (inputElement.setSelectionRange) {
    inputElement.setSelectionRange(length, length);
  }
};

// Shared styles for EditableSelectField
const EDITABLE_SELECT_STYLES = {
  container: (provided) => ({ ...provided, width: "100%" }),
  menu: (provided) => ({ ...provided, zIndex: 99999 }),
  menuPortal: (base) => ({ ...base, zIndex: 99999 }),
  valueContainer: (provided) => ({
    ...provided,
    paddingTop: 2,
    paddingBottom: 2,
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    paddingTop: 2,
    paddingBottom: 2,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#e8ecef"
      : state.isFocused
        ? "#f5f6f7"
        : "transparent",
    color: state.isSelected
      ? "#1a1d20"
      : state.isFocused
        ? "#1a1d20"
        : "#212529",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#dee2e6",
    },
  }),
};

// CSS styles for EditableSelectField (extracted outside component)
const EDITABLE_SELECT_CSS = `
  .react-select__option--is-focused[class*="create"],
  .react-select__option[class*="create"],
  div[class*="react-select"][class*="option"][class*="create"] {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .react-select__option--is-focused,
  .react-select__option--is-selected {
    background-color: #e8ecef !important;
    color: #1a1d20 !important;
  }
  .react-select__option:hover,
  .react-select__option:focus {
    background-color: #f5f6f7 !important;
    color: #1a1d20 !important;
  }
  .react-select__option--is-selected.react-select__option--is-focused {
    background-color: #dee2e6 !important;
    color: #1a1d20 !important;
  }
  .react-select__option[class*="is-focused"],
  .react-select__option[class*="is-selected"] {
    background-color: #e8ecef !important;
    color: #1a1d20 !important;
  }
`;

export function EditableSelectField({
  label,
  name,
  options = [],
  value,
  onChange,
  onBlur,
  placeholder = "Select or type...",
  isClearable = false,
  disabled,
  error,
  isValid,
  tooltip,
  inputTransform,
  ...rest
}) {
  const [inputValue, setInputValue] = React.useState("");
  const selectRef = React.useRef(null);
  const cursorTimeoutRef = React.useRef(null);

  // Memoize validation class
  const validationClass = useMemo(
    () => (error ? "react-select-invalid" : isValid ? "react-select-valid" : ""),
    [error, isValid]
  );

  // Memoize select options conversion
  const selectOptions = useMemo(
    () => options.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt)),
    [options]
  );

  // Memoize normalized value strings
  const normalizedValue = useMemo(() => normalizeValue(value), [value]);
  const normalizedInputValue = useMemo(() => normalizeValue(inputValue), [inputValue]);

  // Memoize hasValue check
  const hasValue = useMemo(
    () => normalizedInputValue !== "" || !isEmptyValue(value),
    [normalizedInputValue, value]
  );

  // Memoize clear button visibility
  const shouldShowClearButton = useMemo(() => hasValue || isClearable, [hasValue, isClearable]);

  // Memoize found option
  const foundOption = useMemo(
    () => (normalizedValue ? findOption(selectOptions, normalizedValue) : null),
    [selectOptions, normalizedValue]
  );

  // Memoize react-select value object
  const selectValue = useMemo(() => {
    // If user is typing, show inputValue
    if (normalizedInputValue !== "" && !disabled) {
      return { value: inputValue, label: inputValue };
    }

    // If no value, return null
    if (!normalizedValue) return null;

    // Return found option or create custom option
    return foundOption || { value: normalizedValue, label: normalizedValue };
  }, [normalizedInputValue, inputValue, normalizedValue, foundOption, disabled]);

  // Sync inputValue with value prop (for initial load, form reset)
  React.useEffect(() => {
    if (isEmptyValue(value)) {
      setInputValue("");
      return;
    }

    const stringValue = normalizeValue(value);
    const found = findOption(selectOptions, stringValue);

    // If value exists in options and inputValue is empty, clear inputValue to show selected option
    // If value doesn't exist in options, set inputValue for custom values
    if (found && !inputValue) {
      setInputValue("");
    } else if (!found && !inputValue) {
      setInputValue(stringValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selectOptions]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, []);

  // Memoized cursor positioning function
  const handleCursorPosition = useCallback(
    (text, delay = 50) => {
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
      cursorTimeoutRef.current = setTimeout(() => {
        const input = selectRef.current?.controlRef?.querySelector("input");
        if (input && text) {
          positionCursorAtEnd(input, text);
        }
      }, delay);
    },
    []
  );

  // Memoized handler for setting input value and positioning cursor
  const setInputAndPositionCursor = useCallback(
    (text, delay = 50) => {
      if (text) {
        setInputValue(text);
        handleCursorPosition(text, delay);
      }
    },
    [handleCursorPosition]
  );

  // Handle input changes - update value while typing
  const handleInputChange = useCallback(
    (newInputValue, { action }) => {
      if (action === "input-change") {
        const transformedValue = inputTransform
          ? inputTransform(newInputValue)
          : newInputValue;
        setInputValue(transformedValue);
        // Update form value while typing (allows editing)
        if (onChange) {
          onChange({
            target: {
              name,
              value: transformedValue || "",
            },
          });
        }
      } else if (action === "set-value") {
        setInputValue("");
      }
    },
    [name, onChange, inputTransform]
  );

  // Handle selection from dropdown - normal dropdown behavior
  const handleChange = useCallback(
    (option, actionMeta) => {
      if (!onChange) return;

      const action = actionMeta?.action;

      if (action === "select-option" || action === "create-option") {
        const newValue = option ? option.value || option.label || "" : "";
        setInputValue("");
        onChange({
          target: {
            name,
            value: newValue,
          },
        });
      } else if (action === "clear") {
        setInputValue("");
        onChange({
          target: {
            name,
            value: "",
          },
        });
      }
    },
    [name, onChange]
  );

  // Handle focus - position cursor at end if value exists
  const handleFocus = useCallback(() => {
    if (normalizedValue && !normalizedInputValue) {
      setInputAndPositionCursor(normalizedValue);
    }
  }, [normalizedValue, normalizedInputValue, setInputAndPositionCursor]);

  // Handle mouse down on control - also position cursor at end
  const handleMouseDown = useCallback(
    (e) => {
      const target = e.target;
      const isControlClick =
        target.closest(".react-select__control") &&
        !target.closest(".react-select__indicator") &&
        !target.closest(".react-select__clear-indicator");

      if (isControlClick && normalizedValue && !normalizedInputValue && !disabled) {
        // Small delay to ensure react-select processes the click first
        setInputAndPositionCursor(normalizedValue, 10);
      }
    },
    [normalizedValue, normalizedInputValue, disabled, setInputAndPositionCursor]
  );

  // Handle menu open - position cursor at end if value exists
  const handleMenuOpen = useCallback(() => {
    if (normalizedValue && !normalizedInputValue) {
      setInputAndPositionCursor(normalizedValue);
    }
  }, [normalizedValue, normalizedInputValue, setInputAndPositionCursor]);

  // Handle blur - reset inputValue if value matches an option
  const handleBlur = useCallback(
    (e) => {
      if (normalizedValue && foundOption) {
        setInputValue("");
      }
      if (onBlur) onBlur(e);
    },
    [normalizedValue, foundOption, onBlur]
  );

  // Memoized filter function
  const filterOption = useCallback((option, inputVal) => {
    if (!inputVal || inputVal.trim() === "") {
      return true;
    }
    const label = String(option.label || "").toLowerCase();
    const optionValue = String(option.value || "").toLowerCase();
    const search = inputVal.toLowerCase();
    return label.includes(search) || optionValue.includes(search);
  }, []);

  return (
    <div className="mb-2" style={{ width: "100%" }} onMouseDown={handleMouseDown}>
      <FormLabel label={label} required={rest.required} tooltip={tooltip} as="div" />
      <CreatableSelect
        ref={selectRef}
        classNamePrefix="react-select"
        className={validationClass}
        name={name}
        options={selectOptions}
        value={selectValue}
        inputValue={disabled ? "" : inputValue}
        onChange={handleChange}
        onInputChange={handleInputChange}
        onFocus={handleFocus}
        onMenuOpen={handleMenuOpen}
        onBlur={handleBlur}
        placeholder={placeholder}
        // isClearable={shouldShowClearButton}
        isDisabled={disabled}
        menuPortalTarget={MENU_PORTAL_TARGET}
        menuPosition="fixed"
        formatCreateLabel={() => null}
        isValidNewOption={() => false}
        createOptionPosition="first"
        isSearchable={true}
        filterOption={filterOption}
        styles={EDITABLE_SELECT_STYLES}
        {...rest}
      />
      <FieldError error={error} block />
      <style>{EDITABLE_SELECT_CSS}</style>
    </div>
  );
}

export function DateField({
  label,
  name,
  placeholder,
  error,
  tooltip,
  isValid,
  value,
  max,
  ...rest
}) {
  return (
    <div className="mb-2">
      <FormLabel label={label} required={rest.required} tooltip={tooltip} />

      <input
        type="date"
        name={name}
        placeholder={placeholder}
        value={value || ""}
        max={max}
        autoComplete="off"
        className={buildValidationClass("form-control", error, isValid)}
        {...rest} // onChange, onBlur, disabled, etc.
      />

      <FieldError error={error} />
    </div>
  );
}
