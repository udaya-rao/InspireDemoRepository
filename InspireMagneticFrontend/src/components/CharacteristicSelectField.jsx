import React, { useState, useRef, useMemo, useCallback, useLayoutEffect } from "react";
import CreatableSelect from "react-select/creatable";
import { components } from "react-select";

const MENU_PORTAL_TARGET =
  typeof document !== "undefined" ? document.body : null;

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

const FieldError = ({ error, block = false }) =>
  error ? (
    <div className={`invalid-feedback${block ? " d-block" : ""}`}>
      {error}
    </div>
  ) : null;

const normalizeValue = (val) => {
  if (val == null || val === "") return "";
  return String(val).trim();
};

const isEmptyValue = (val) => {
  return val == null || val === "" || val === 0;
};


const findOption = (options, searchValue) => {
  if (!searchValue) return null;
  const lowerSearch = normalizeValue(searchValue).toLowerCase();

  return options.find(
    (opt) => normalizeValue(opt.label).toLowerCase() === lowerSearch
  ) || null;
};

// CSS styles for CharacteristicSelectField
const CHARACTERISTIC_SELECT_CSS = `
  .react-select__option--is-focused[class*="create"],
  .react-select__option[class*="create"],
  div[class*="react-select"][class*="option"][class*="create"] {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Force dropdown option colors for Characteristic Select Field */
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
`;

// Shared styles for CharacteristicSelectField
const CHARACTERISTIC_SELECT_STYLES = {
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
  option: (provided, state) => {

    let backgroundColor = "transparent";
    let color = "#212529";

    if (state.isSelected) {
      backgroundColor = "#E0E0E0";
      color = "#222";
    }

    return {
      ...provided,
      backgroundColor,
      color,
      cursor: "pointer",
      "&:active": {
        backgroundColor: state.isSelected ? "#D0D0D0" : "#C8C8C8",
      },
    };
  },
};

export function CharacteristicSelectField({
  label,
  name,
  options = [],
  value,
  onChange,
  onBlur,
  placeholder = "Select Characteristic...",
  disabled,
  error,
  isValid,
  tooltip,
  inputTransform,
  onNewClick,
  hideNewButton = false,
  positionCursorAtEnd = false, // New prop to trigger cursor positioning
  onEditClick, // New prop for edit functionality
  onEditingStateChange, // New prop to notify parent of editing state
  resolveValueByLabelOnly = false, // When true, only resolve value by DisplayText (label); never by ValueText (value). Use in "Enter New" mode so typed text stays as-is.
  resetInputKey = 0,
  ...rest
}) {
  const [inputValue, setInputValue] = useState("");
  const selectRef = useRef(null);
  const needsCursorPositionRef = useRef(false);
  const [editingOptionValue, setEditingOptionValue] = useState(null);
  const [editingOptionText, setEditingOptionText] = useState("");
  const [inlineEditError, setInlineEditError] = useState(null);
  const rootRef = React.useRef(null);
  const editInputRefsMap = React.useRef(new Map());
  const lastActionRef = React.useRef(null);
  // Saves the search text typed before entering inline-edit mode so it can be restored after
  const searchTextBeforeEditRef = React.useRef("");

  const editingOptionValueRef = React.useRef(null);

  React.useEffect(() => {
    setInputValue("");
    needsCursorPositionRef.current = false;
    lastActionRef.current = null;
    searchTextBeforeEditRef.current = "";
  }, [resetInputKey]);

  React.useEffect(() => {
    if (editingOptionValue) {
      const editInputRef = editInputRefsMap.current.get(editingOptionValue);

      if (editInputRef && editInputRef.current && document.activeElement !== editInputRef.current) {
        const focusInput = () => {
          if (editInputRef.current && document.activeElement !== editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.readOnly = false;
            editInputRef.current.disabled = false;
            const textLength = editingOptionText.length;
            if (editInputRef.current.setSelectionRange) {
              editInputRef.current.setSelectionRange(textLength, textLength);
            }
          }
        };

        setTimeout(focusInput, 100);
      }
    }
  }, [editingOptionValue, editingOptionText]);

  // Notify parent of editing state changes
  React.useEffect(() => {
    if (onEditingStateChange) {
      onEditingStateChange(!!editingOptionValue);
    }
    if (!editingOptionValue) {
      setInlineEditError(null);
    }
  }, [editingOptionValue, onEditingStateChange]);

  const validationClass = useMemo(
    () => (error ? "react-select-invalid" : isValid ? "react-select-valid" : ""),
    [error, isValid]
  );

  const selectOptions = useMemo(
    () => options.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt)),
    [options]
  );

  const normalizedValue = useMemo(() => normalizeValue(value), [value]);
  const normalizedInputValue = useMemo(() => normalizeValue(inputValue), [inputValue]);




  const foundOption = useMemo(() => {
    if (!normalizedValue) return null;

    // 1) Match only by label (DisplayText). Filtering/search always uses DisplayText.
    const byLabel = findOption(selectOptions, normalizedValue);
    if (byLabel) return byLabel;

    // 2) When resolveValueByLabelOnly (e.g. "Enter New Inspection Method" mode),
    //    do NOT resolve by ValueText so the input keeps showing what the user typed (e.g. "2").
    if (resolveValueByLabelOnly) return null;

    // 3) Otherwise: if value is an ID (ValueText), map to option to show DisplayText (e.g. "Visual").
    const byValue = selectOptions.find((opt) => {
      const optVal = normalizeValue(opt.value);
      return optVal && optVal.toLowerCase() === normalizedValue.toLowerCase();
    });

    return byValue || null;
  }, [selectOptions, normalizedValue, resolveValueByLabelOnly]);




  const prevPositionCursorRef = React.useRef(false);
  React.useLayoutEffect(() => {
    if (positionCursorAtEnd && !prevPositionCursorRef.current) {
      const valueText = String(value || "").trim();
      if (valueText) {
        setInputValue(valueText);
      }

      needsCursorPositionRef.current = true;

      const expectedText = String(value || "").trim();
      const expectedLength = expectedText.length;

      const positionCursor = (attempt = 0) => {
        const inputElement = selectRef.current?.inputRef;

        if (!inputElement) {
          if (attempt < 15) {
            setTimeout(() => positionCursor(attempt + 1), 30 + (attempt * 15));
          } else {
            needsCursorPositionRef.current = false;
          }
          return;
        }

        inputElement.focus();

        let actualText = inputElement.value || "";

        if (!actualText || actualText.length === 0) {
          const control = selectRef.current?.controlRef;
          if (control) {
            const singleValue = control.querySelector('.react-select__single-value');
            if (singleValue) {
              actualText = singleValue.textContent || "";
            }
          }
        }

        if (!actualText || actualText.length === 0) {
          actualText = expectedText;
        }

        const actualLength = actualText.length;

        if (actualLength > 0 || expectedLength > 0) {
          const textLength = actualLength > 0 ? actualLength : expectedLength;

          if (inputElement.setSelectionRange) {
            const tryPosition = (posAttempt = 0) => {
              if (posAttempt < 5) {
                setTimeout(() => {
                  const currentValue = inputElement.value || "";
                  const currentLength = currentValue.length > 0 ? currentValue.length : textLength;

                  if (currentLength > 0) {
                    inputElement.setSelectionRange(currentLength, currentLength);
                    inputElement.focus();
                    needsCursorPositionRef.current = false;
                  } else {
                    tryPosition(posAttempt + 1);
                  }
                }, 20 + (posAttempt * 10));
              } else {
                inputElement.setSelectionRange(textLength, textLength);
                inputElement.focus();
                needsCursorPositionRef.current = false;
              }
            };
            tryPosition(0);
          } else if (inputElement.createTextRange) {
            const range = inputElement.createTextRange();
            range.collapse(false);
            range.select();
            needsCursorPositionRef.current = false;
          }
        } else if (attempt < 15) {
          setTimeout(() => positionCursor(attempt + 1), 30 + (attempt * 15));
        } else {
          needsCursorPositionRef.current = false;
        }
      };

      Promise.resolve().then(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            positionCursor(0);
          }, 50);
        });
      });
    }
    prevPositionCursorRef.current = positionCursorAtEnd;
  }, [positionCursorAtEnd, value]);

  const selectValue = useMemo(() => {

    if (positionCursorAtEnd) {
      const editText = String(value || "").trim();
      if (editText) {
        return { value: editText, label: editText };
      }
      if (normalizedInputValue !== "") {
        return { value: inputValue, label: inputValue };
      }
      return null;
    }

    // If no value, return null (unless user is typing)
    if (!normalizedValue) {
      if (normalizedInputValue !== "") {
        return { value: inputValue, label: inputValue };
      }
      return null;
    }


    if (normalizedInputValue !== "") {
      // While typing, if we found an EXACT label match, return that option.
      // Otherwise return a dummy object for the typed text.
      // We check specifically for label match here to avoid ID collision.
      const exactLabelMatch = selectOptions.find(opt => normalizeValue(opt.label).toLowerCase() === normalizedInputValue.toLowerCase());
      if (exactLabelMatch) return exactLabelMatch;

      return { value: inputValue, label: inputValue };
    }


    if (foundOption) {

      return foundOption;
    }


    const fallbackFound = findOption(selectOptions, normalizedValue);
    if (fallbackFound) {
      return fallbackFound;
    }

    return { value: normalizedValue, label: normalizedValue };
  }, [normalizedInputValue, inputValue, normalizedValue, foundOption, selectOptions, positionCursorAtEnd, value]);

  React.useEffect(() => {

    if (editingOptionValueRef.current) {
      return;
    }

    if (isEmptyValue(value)) {
      setInputValue("");
      return;
    }

    const stringValue = normalizeValue(value);
    const found = findOption(selectOptions, stringValue);

    if (found) {
      const isExplicitSelect = ["select-option", "create-option", "set-value"].includes(lastActionRef.current);
      // const matchLabel = normalizeValue(inputValue) === normalizeValue(found.label);
      const isUserTyping = lastActionRef.current === "input-change";

      // Only clear input (to show single-value label) if:
      // 1. It was an explicit selection from the list
      // 2. We are not typing (initial load/prop change)
      if (isExplicitSelect || !isUserTyping) {
        setInputValue("");
      } else {
        // User typed something (like an ID "11") that matches a value but not the name.
        // Keep the typed text visible instead of switching to the label.
        setInputValue(stringValue);
      }
    } else {
      // Value not in options, show the value itself (for custom values)
      setInputValue(stringValue);
    }
  }, [value, selectOptions]);


  useLayoutEffect(() => {
    if (!needsCursorPositionRef.current) {
      return;
    }


    const inputElement = selectRef.current?.inputRef;

    if (!inputElement) {
      Promise.resolve().then(() => {
        const retryInput = selectRef.current?.inputRef;
        if (retryInput && needsCursorPositionRef.current) {
          const currentText = inputValue || selectValue?.label || "";
          if (currentText && retryInput.setSelectionRange) {
            retryInput.setSelectionRange(currentText.length, currentText.length);
            needsCursorPositionRef.current = false;
          }
        }
      });
      return;
    }

    const currentText = inputValue || selectValue?.label || "";

    if (!currentText) {
      needsCursorPositionRef.current = false;
      return;
    }


    Promise.resolve().then(() => {
      if (needsCursorPositionRef.current && inputElement && inputElement.setSelectionRange) {
        const text = inputValue || selectValue?.label || "";
        if (text) {
          inputElement.setSelectionRange(text.length, text.length);
          needsCursorPositionRef.current = false;
        }
      }
    });
  }, [inputValue, selectValue]);

  const handleInputChange = useCallback(
    (newInputValue, { action }) => {
      lastActionRef.current = action;
      if (action === "input-change") {
        const transformedValue = inputTransform
          ? inputTransform(newInputValue)
          : newInputValue;
        setInputValue(transformedValue);
        needsCursorPositionRef.current = true;

        if (onChange) {
          onChange({
            target: {
              name,
              value: transformedValue || "",
            },
          }, { action });
        }
      } else if (action === "set-value" || action === "select-option") {

        if (!editingOptionValueRef.current) {
          setInputValue("");
        }
        needsCursorPositionRef.current = false;
      }
    },
    [name, onChange, inputTransform]
  );

  const handleChange = useCallback(
    (option, actionMeta) => {
      if (!onChange) return;

      const action = actionMeta?.action;
      lastActionRef.current = action;

      if (action === "select-option" || action === "create-option") {
        const newValue = option ? option.value || option.label || "" : "";
        // Only clear inputValue if we are NOT in an inline-edit (which fires select-option internally)
        if (!editingOptionValue) {
          setInputValue("");
        }
        needsCursorPositionRef.current = true;
        if (!editingOptionValue && selectRef.current) {
          setTimeout(() => {
            if (selectRef.current) {
              selectRef.current.blur();
            }
          }, 0);
        }
        onChange({
          target: {
            name,
            value: newValue,
          },
        }, actionMeta);
      } else if (action === "clear") {
        setInputValue("");
        needsCursorPositionRef.current = false;
        onChange({
          target: {
            name,
            value: "",
          },
        });
      }
    },
    [name, onChange, editingOptionValue]
  );

  const handleFocus = useCallback(() => {
    const currentText = inputValue || selectValue?.label || "";
    if (currentText) {
      needsCursorPositionRef.current = true;
    }
  }, [inputValue, selectValue]);

  const handleMouseDown = useCallback(
    () => {
      const currentText = inputValue || selectValue?.label || "";
      if (currentText) {
        needsCursorPositionRef.current = true;
      }
    },
    [inputValue, selectValue]
  );


  const handleMenuOpen = useCallback(() => {
    if (positionCursorAtEnd) {
      return;
    }
    // setInputValue("");

    if (!editingOptionValue) {
      setEditingOptionText("");
    }
    if (selectValue?.label) {
      needsCursorPositionRef.current = true;
    }
  }, [selectValue, positionCursorAtEnd, editingOptionValue]);

  const handleMenuClose = useCallback(() => {

  }, []);

  const handleBlur = useCallback(
    (e) => {
      // If inline editing is active or starting (ref is set synchronously on
      // Edit button mousedown, before blur fires), do NOT clear the search text.
      if (editingOptionValueRef.current) {
        needsCursorPositionRef.current = false;
        if (onBlur) onBlur(e);
        return;
      }
      if (normalizedValue && foundOption) {
        setInputValue("");
      }
      // Reset cursor positioning flag on blur
      needsCursorPositionRef.current = false;
      if (onBlur) onBlur(e);
    },
    [normalizedValue, foundOption, onBlur]
  );

  // When inline editing is active, close it when user clicks anywhere outside
  React.useEffect(() => {
    if (!editingOptionValue) return;

    const handleDocumentMouseDown = (event) => {
      const rootEl = rootRef.current;
      const target = event.target;
      const menuEl = selectRef.current?.menuRef;

      // If click is inside the inline edit container, treat it as inside
      if (target.closest && target.closest(".inline-edit-option")) {
        return;
      }

      // If clicking on Save button, allow it to work (don't close edit mode)
      if (target.closest && target.closest('.save-edit-btn')) {
        return;
      }

      // If click is inside the main control or inside the menu portal,
      // treat it as "inside" the component and DO NOT close inline edit.
      if (
        (rootEl && rootEl.contains(target)) ||
        (menuEl && menuEl.contains(target))
      ) {
        return;
      }

      // Click is truly outside the component – exit inline edit mode
      editingOptionValueRef.current = null;
      setEditingOptionValue(null);
      setEditingOptionText("");

      // Return focus to main input and clear editing mode
      if (selectRef.current) {
        selectRef.current.focus();
        // Close menu but keep focus so cursor blinks
        if (selectRef.current.setState) {
          selectRef.current.setState({ menuIsOpen: false });
        }
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown, true);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown, true);
    };
  }, [editingOptionValue]);

  // Memoized filter function
  const filterOption = useCallback((option, inputVal) => {
    // If this specific option is being edited inline, it MUST remain visible
    if (editingOptionValue && String(option.value).trim() === String(editingOptionValue).trim()) {
      return true;
    }

    // In Add New mode, we want to see existing options as we type to avoid duplicates
    // react-select handles this by default, but we ensure it works with our custom filter
    if (!inputVal || inputVal.trim() === "") {
      return true;
    }
    const label = String(option.label || "").toLowerCase();
    const search = inputVal.toLowerCase();
    return label.includes(search);
  }, [editingOptionValue]);

  // Custom Option component with Edit button and inline editing
  const CustomOption = useCallback((props) => {
    const { children, data, innerRef, innerProps } = props;
    const optionValue = String(data?.value || "").trim();
    const optionLabel = String(data?.label || "").trim();
    const isEditing = editingOptionValue === optionValue;

    // Get or create ref for this option
    if (!editInputRefsMap.current.has(optionValue)) {
      editInputRefsMap.current.set(optionValue, { current: null });
    }
    const editInputRef = editInputRefsMap.current.get(optionValue);

    const handleEditClick = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (e && e.stopPropagation) e.stopPropagation();
      if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();

      if (onEditClick && data && !isEditing) {
        // Save the current search text so we can restore it after the edit
        searchTextBeforeEditRef.current = inputValue || "";


        editingOptionValueRef.current = optionValue;
        setEditingOptionValue(optionValue);
        setEditingOptionText(optionLabel);
        setInlineEditError(null);

        // Ensure main input is focused while we transition to inline edit
        if (selectRef.current) {
          selectRef.current.focus();
        }

        editInputRefsMap.current.set(`_editing_${optionValue}`, true);

        requestAnimationFrame(() => {
          if (selectRef.current) {
            // Force menu to stay open
            const currentState = selectRef.current.state;
            if (currentState && !currentState.menuIsOpen) {
              // Menu was closed, reopen it
              selectRef.current.onMenuOpen();
            }
          }
        });
      }
    };

    const handleSaveEdit = async (e) => {
      // Prevent any default behavior and stop propagation
      if (e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }

      const trimmedText = (editingOptionText || "").trim();
      if (!trimmedText) {
        // Show error if empty
        setInlineEditError("Required*");
        return;
      }
      setInlineEditError(null);

      if (!onEditClick) {
        console.error("Cannot save: onEditClick handler is not provided");
        return;
      }

      if (!data) {
        console.error("Cannot save: option data is missing");
        return;
      }

      try {
        // Call the parent's onEditClick handler (which makes the API call)
        await onEditClick({
          value: optionValue,
          label: trimmedText,
          data: data,
        });

        // Exit edit mode after successful save
        editingOptionValueRef.current = null;
        setEditingOptionValue(null);
        setEditingOptionText("");

        // Restore the search text that was active before editing so filtering continues
        const savedSearch = searchTextBeforeEditRef.current;
        searchTextBeforeEditRef.current = "";
        if (savedSearch) {
          setInputValue(savedSearch);
        }

        setTimeout(() => {
          if (selectRef.current) {
            selectRef.current.focus();
            if (selectRef.current.setState) {
              selectRef.current.setState({ menuIsOpen: true });
            }
          }
        }, 0);
      } catch (error) {
        // Don't exit edit mode if save failed
        console.error("Error saving characteristic:", error);
        throw error;
      }
    };

    const handleCancelEdit = () => {
      editingOptionValueRef.current = null;
      setEditingOptionValue(null);
      setEditingOptionText("");

      // Restore the search text that was active before editing so filtering continues
      const savedSearch = searchTextBeforeEditRef.current;
      searchTextBeforeEditRef.current = "";
      if (savedSearch) {
        setInputValue(savedSearch);
      }

      // Return focus to main input and keep menu open
      if (selectRef.current) {
        selectRef.current.focus();
        if (selectRef.current.setState) {
          selectRef.current.setState({ menuIsOpen: true });
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleSaveEdit(e);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleCancelEdit();
      }
    };

    // Callback ref to handle focus when input is mounted
    const setInputRef = (element) => {
      // Only update ref when element changes
      if (editInputRef.current !== element) {
        editInputRef.current = element;

        // Focus the input when it's mounted and we're in edit mode
        if (element && isEditing) {
          // Use a single focus attempt with a small delay to ensure DOM is ready
          const focusInput = () => {
            if (editInputRef.current && document.activeElement !== editInputRef.current) {
              editInputRef.current.focus();
              editInputRef.current.readOnly = false;
              editInputRef.current.disabled = false;
              const textLength = editingOptionText.length;
              if (editInputRef.current.setSelectionRange) {
                editInputRef.current.setSelectionRange(textLength, textLength);
              }
            }
          };

          // Try immediately, then once more after a short delay
          focusInput();
          setTimeout(focusInput, 50);
        }
      }
    };

    if (isEditing) {
      // Show inline edit input
      // Extract innerProps but prevent option selection when in edit mode
      const {
        // onMouseDown: innerOnMouseDown,
        // onClick: innerOnClick,
        ...restInnerPropsEdit
      } = innerProps || {};

      return (
        <div
          ref={innerRef}
          className="inline-edit-option"
          {...restInnerPropsEdit}
          style={{
            ...innerProps?.style,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 8px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            margin: "2px 4px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
          onMouseDown={(e) => {
            // Prevent react-select from selecting the option when in edit mode
            // Allow normal behavior for INPUT and BUTTON elements (for Save button)
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
              if (e && e.preventDefault) e.preventDefault();
            }
            if (e && e.stopPropagation) e.stopPropagation();
            if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
            // Don't call innerOnMouseDown - we're in edit mode, don't want selection
          }}
          onClick={(e) => {
            // Allow Save button clicks to work normally
            if (e.target.closest && e.target.closest('.save-edit-btn')) {
              return; // Let the button handle its own click
            }
            // Prevent option selection when clicking in edit mode
            if (e && e.stopPropagation) e.stopPropagation();
            if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
            // Don't call innerOnClick - we're in edit mode
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <input
              ref={setInputRef}
              type="text"
              value={editingOptionText || ""}
              readOnly={false}
              disabled={false}
              onChange={(e) => {
                e.stopPropagation();
                // Don't prevent default - allow normal input behavior
                const newValue = e.target.value;
                setEditingOptionText(newValue);
                if (inlineEditError) setInlineEditError(null);
              }}
              onKeyPress={(e) => {
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                handleKeyDown(e);
              }}
              onFocus={(e) => {
                e.stopPropagation();
                // Don't prevent default - allow normal focus behavior
                e.target.style.borderColor = inlineEditError ? "#ff4d4f" : "#1677ff";
                e.target.style.boxShadow = inlineEditError ? "0 0 0 2px rgba(255, 77, 79, 0.1)" : "0 0 0 2px rgba(22, 119, 255, 0.1)";
              }}
              onBlur={(e) => {
                // Don't prevent blur - allow normal behavior
                e.stopPropagation();
                e.target.style.borderColor = inlineEditError ? "#ff4d4f" : "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
              onInput={(e) => {
                e.stopPropagation();
              }}
              style={{
                flex: 1,
                padding: "6px 10px",
                border: `1px solid ${inlineEditError ? "#ff4d4f" : "#d1d5db"}`,
                borderRadius: "4px",
                fontSize: "13px",
                outline: "none",
                backgroundColor: "#fff",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onClick={(e) => {
                e.target.focus();
                e.target.readOnly = false;
                e.target.disabled = false;
              }}
              autoFocus={false}
            />
            {inlineEditError && (
              <span style={{
                color: "#ff4d4f",
                fontSize: "11px",
                fontWeight: "600",
                marginLeft: "2px"
              }}>
                {inlineEditError}
              </span>
            )}
          </div>
          <button
            type="button"
            className="save-edit-btn"
            onClick={(e) => {
              if (e && e.preventDefault) e.preventDefault();
              if (e && e.stopPropagation) e.stopPropagation();
              if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
              handleSaveEdit(e);
            }}
            onMouseDown={(e) => {
              // Don't prevent default here - let onClick fire
              if (e && e.stopPropagation) e.stopPropagation();
              if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
            }}
            style={{
              background: "rgb(122, 75, 120)",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgb(122, 75, 120)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgb(122, 75, 120)";
            }}
            title="Save (Enter)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          </button>
        </div>
      );
    }


    const {
      onMouseDown: innerOnMouseDown,
      onClick: innerOnClick,
      ...restInnerProps
    } = innerProps || {};

    const handleMouseDown = (e) => {
      if (e.target.closest(".edit-option-btn")) {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        return;
      }

      if (innerOnMouseDown) {
        innerOnMouseDown(e);
      }
    };

    const handleClick = (e) => {
      if (e.target.closest(".edit-option-btn")) {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        return;
      }

      if (innerOnClick) {
        innerOnClick(e);
      }
    };

    return (
      <div
        ref={innerRef}
        {...restInnerProps}
        style={{
          ...innerProps?.style,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          cursor: "pointer",
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        <span style={{ flex: 1 }}>{children}</span>
        {onEditClick && !disabled && !isEditing && (
          <button
            type="button"
            className="edit-option-btn"
            onMouseDown={(e) => {

              if (!isEditing) {
                editingOptionValueRef.current = optionValue;
                searchTextBeforeEditRef.current = inputValue || "";
              }
              if (e && e.preventDefault) e.preventDefault();
              if (e && e.stopPropagation) e.stopPropagation();
              if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
              handleEditClick(e);
            }}
            style={{
              background: "transparent",
              border: "1px solid #e5e7eb",
              color: "#1677ff",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "4px",
              marginLeft: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f0f7ff";
              e.target.style.borderColor = "#1677ff";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.borderColor = "#e5e7eb";
            }}
            title="Edit this Inspection Method"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        )}
      </div>
    );
  }, [onEditClick, disabled, editingOptionValue, editingOptionText, inlineEditError, inputValue]);

  // Custom MenuList component with "New" button at the top
  const CustomMenuList = useCallback((props) => {
    const { children, ...restProps } = props;
    return (
      <components.MenuList {...restProps}>
        {onNewClick && !hideNewButton && (
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #e0e0e0",
              background: "#fff",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNewClick();
                // Return focus to main input
                if (selectRef.current) {
                  selectRef.current.focus();
                }
              }}
              disabled={disabled}
              style={{
                width: "100%",
                background: disabled ? "#cccccc" : "#1677ff",
                color: "#fff",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 500,
                border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
                textAlign: "center",
              }}
              title="Add New Inspection Method"
            >
              Add New Inspection Method?
            </button>
          </div>
        )}
        {children}
      </components.MenuList>
    );
  }, [onNewClick, disabled, hideNewButton]);

  return (
    <div
      ref={rootRef}
      className="mb-2"
      style={{ width: "100%" }}
      onMouseDown={handleMouseDown}
    >
      <FormLabel label={label} required={rest.required} tooltip={tooltip} as="div" />
      <CreatableSelect
        ref={selectRef}
        classNamePrefix="react-select"
        className={validationClass}
        name={name}
        options={selectOptions}
        value={selectValue}
        inputValue={inputValue}
        onChange={handleChange}
        onInputChange={handleInputChange}
        onFocus={handleFocus}
        onMenuOpen={handleMenuOpen}
        onMenuClose={handleMenuClose}
        onBlur={handleBlur}
        placeholder={placeholder}
        // isClearable={shouldShowClearButton}
        isDisabled={disabled}
        menuPortalTarget={MENU_PORTAL_TARGET}
        menuPosition="fixed"

        menuIsOpen={
          editingOptionValue
            ? true
            : undefined
        }
        closeMenuOnSelect={!editingOptionValue} // Close menu on select unless editing inline
        formatCreateLabel={() => null}
        isValidNewOption={() => false}
        createOptionPosition="first"
        isSearchable={true}
        filterOption={filterOption}
        openMenuOnFocus={true} // Open menu on focus even in edit mode to allow filtering
        components={{
          MenuList: CustomMenuList,
          Option: onEditClick ? CustomOption : components.Option,
          ...rest.components,
        }}
        styles={CHARACTERISTIC_SELECT_STYLES}
        {...rest}
      />
      <FieldError error={error} block />
      <style>{CHARACTERISTIC_SELECT_CSS}</style>
    </div>
  );
}
