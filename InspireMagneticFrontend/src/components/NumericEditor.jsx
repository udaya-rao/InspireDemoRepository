import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useId,
} from "react";
import { coerceNumericTyping, coerceNumeric } from "../utils/inputConstraints";

// Helper: check if numeric(precision, scale) mode is enabled
const hasPrecisionScale = (precision, scale) =>
  typeof precision === "number" && typeof scale === "number";

// Helper: format incoming external value into an editable string
const formatExternalValue = (value, { isNew, defaultValue, decimals }) => {
  if (value === undefined || value === null || value === "") {
    return isNew ? defaultValue : "";
  }
  const n = parseFloat(value);
  return Number.isFinite(n) ? n.toFixed(decimals) : String(value);
};

const NumericEditor = ({
  value,
  label,
  tooltip,
  onChange,
  isNew,
  decimals = 4,
  defaultValue = "0.0000",
  enforceDefaultOnEmpty = false,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  disabled = false,
  className,
  style,
  inputProps = {},
  maxIntegerDigits,
  maxDecimalDigits,
  // Optional: when provided, NumericEditor will use inputConstraints
  // to coerce values as numeric(precision, scale) with overflow handling
  precision,
  scale,
  // Optional explicit id/name for label↔input
  id,
  name,
}) => {
  const [editValue, setEditValue] = useState(() =>
    formatExternalValue(value, { isNew, defaultValue, decimals })
  );

  const focusedRef = useRef(false);
  const inputRef = useRef(null);
  const nextCaretPosRef = useRef(null);

  // Stable fallback id if nothing is provided
  const autoId = useId();
  const inputId = id || inputProps.id || name || inputProps.name || autoId;

  const numericMode = hasPrecisionScale(precision, scale);

  // Keep local value in sync with external "value" when not focused
  useEffect(() => {
    if (!focusedRef.current) {
      setEditValue(
        formatExternalValue(value, { isNew, defaultValue, decimals })
      );
    }
  }, [value, isNew, decimals, defaultValue]);

  // After editValue changes, if a target caret position is queued, apply it
  useLayoutEffect(() => {
    try {
      const pos = nextCaretPosRef.current;
      if (focusedRef.current && typeof pos === "number" && inputRef.current) {
        const len = String(editValue || "").length;
        const clamped = Math.max(0, Math.min(pos, len));
        inputRef.current.setSelectionRange(clamped, clamped);
        nextCaretPosRef.current = null;
      }
    } catch {
      /* noop */
    }
  }, [editValue]);

  const handleFocus = (e) => {
    focusedRef.current = true;
    try {
      e.target.select();
    } catch {
      /* noop */
    }
    try {
      if (typeof onFocusProp === "function") onFocusProp(e);
    } catch {
      /* noop */
    }
  };

  const handleKeyDown = (e) => {
    // If precision/scale not provided, fallback blocking logic
    if (!numericMode) {
      if (e.key === "." || e.key === ",") {
        e.preventDefault();
      }
      return;
    }

    const val = editValue || "";
    const dot = val.indexOf(".");
    const cursorPos = e.target.selectionStart ?? val.length;
    const key = e.key;

    // Allow control/navigation keys
    if (
      key === "Backspace" ||
      key === "Delete" ||
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "Tab" ||
      key === "Home" ||
      key === "End"
    )
      return;

    // Only handle digit keys 0-9
    if (!/^\d$/.test(key)) return;

    const sanitized = coerceNumericTyping(val, precision, scale);
    const [, fracRaw = ""] = sanitized.split(".").concat("");
    const fracPart = fracRaw.slice(0, Math.max(0, scale));
    const atEnd = cursorPos === val.length;
    const inFrac = dot !== -1 && cursorPos > dot;

    // If fractional part is already full and caret is at the end, block additional digits
    if (scale > 0 && inFrac && atEnd && fracPart.length >= scale) {
      e.preventDefault();
    }
    // If integer is full, caret before dot (or no dot yet) and scale>0, allow behavior in onChange.
    // We do not block here to preserve overwrite/auto-dot logic.
  };

  const handleChange = (e) => {
    const raw = e.target.value || "";
    const selectionPosAfter = e.target.selectionStart ?? raw.length; // caret after browser insertion
    const prevSelectionStart = selectionPosAfter; // reflect actual browser position
    let v;
    let desiredPos = null;

    if (numericMode) {
      // Smart behavior around the integer threshold:
      // - On entering the last allowed integer digit, auto-append '.'
      // - If integer already full and cursor is in int, overwrite the digit at cursor
      // - Otherwise, fall back to typing-friendly coercion
      // We operate with the caret position AFTER insertion to detect end-of-string typing
      const cursorAfter = selectionPosAfter;
      const prev = editValue || "";
      let didCustom = false;

      try {
        const maxInt = Math.max(0, precision - scale);
        const prevSan = coerceNumericTyping(prev, precision, scale);
        const prevDot = prevSan.indexOf(".");
        const [prevInt = "", prevFracRaw = ""] = prevSan.split(".").concat("");
        const prevFrac = prevFracRaw.slice(0, Math.max(0, scale));

        const inInt = prevDot === -1 || cursorAfter <= prevDot;
        const inFrac = prevDot !== -1 && cursorAfter > prevDot;
        const atDot = prevDot !== -1 && cursorAfter === prevDot + 1; // cursor right after the dot

        // Robustly detect the inserted character
        let addedChar =
          e?.nativeEvent && typeof e.nativeEvent.data === "string"
            ? e.nativeEvent.data
            : "";

        if (!addedChar && raw.length === prev.length + 1) {
          for (let i = 0; i < raw.length; i++) {
            if (prev[i] !== raw[i]) {
              addedChar = raw[i];
              break;
            }
          }
        }

        const isSingleDigitAdd =
          raw.length === prev.length + 1 && /\d/.test(addedChar);
        const noDotYet = prevDot === -1;

        // debug removed
        if (isSingleDigitAdd) {
          if (noDotYet && prevInt.length === Math.max(0, maxInt - 1)) {
            // Entering the last allowed int digit -> show dot immediately
            const newInt = prevInt + addedChar;
            v = `${newInt}.`;
            didCustom = true;
            // place caret after the dot we just inserted
            desiredPos = v.length;
          } else if (inInt && noDotYet && prevInt.length >= maxInt && maxInt > 0) {
            // Int full and still typing in int: move new digit to start of fraction
            const newFrac = (addedChar + prevFrac).slice(0, Math.max(0, scale));
            v = `${prevInt}.${newFrac}`;
            didCustom = true;
            // keep caret where it was in integer part
            desiredPos = Math.min(
              cursorAfter,
              v.indexOf(".") !== -1 ? v.indexOf(".") : v.length
            );
          } else if (
            inInt &&
            !noDotYet &&
            prevInt.length >= maxInt &&
            maxInt > 0
          ) {
            // Int full and dot exists: overwrite the digit at cursor within int
            const idx = Math.max(0, Math.min(cursorAfter - 1, maxInt - 1));
            const newInt =
              prevInt.slice(0, idx) + addedChar + prevInt.slice(idx + 1);
            v = `${newInt}.${prevFrac}`;
            didCustom = true;
            // move caret to just after the inserted digit within integer
            const dotPos = v.indexOf(".");
            desiredPos = Math.min(
              idx + 1,
              dotPos === -1 ? v.length : dotPos
            );
          } else if ((inFrac || atDot) && prevFrac.length >= scale && scale > 0) {
            // Decimal part is already full. If the user is typing at the end,
            // block the input instead of overwriting the last decimal digit.
            const isAtEnd = cursorAfter === raw.length;
            if (isAtEnd) {
              v = prev; // block additional digit when at the end
              didCustom = true;
              desiredPos = prev.length;
            } else {
              // If cursor is within the decimal part (not at the end), allow targeted overwrite
              // of the digit at the cursor position for deliberate edits.
              let idx;
              if (atDot) {
                idx = 0;
              } else {
                const fracPos = Math.max(
                  0,
                  Math.min(cursorAfter - prevDot - 1, scale - 1)
                );
                idx = Math.max(0, Math.min(fracPos, scale - 1));
              }
              const newFrac =
                prevFrac.substring(0, idx) +
                addedChar +
                prevFrac.substring(idx + 1);
              v = `${prevInt}.${newFrac}`;
              didCustom = true;
              desiredPos = prevDot + 1 + idx + 1;
            }
          }
        }
      } catch {
        /* noop */
      }

      if (!didCustom) {
        v = coerceNumericTyping(raw, precision, scale);
        // keep caret position if possible
        desiredPos = Math.min(prevSelectionStart, String(v).length);
      }
    } else {
      // Legacy behavior with optional max digit limits
      v = String(raw).replace(/[^0-9.]/g, "");
      const firstDot = v.indexOf(".");
      if (firstDot !== -1) {
        v =
          v.slice(0, firstDot + 1) +
          v.slice(firstDot + 1).replace(/\./g, "");
      }

      const parts = v.split(".");
      let intPart = parts[0] || "";
      let decPart = parts[1] || "";

      if (
        typeof maxIntegerDigits === "number" &&
        intPart.length > maxIntegerDigits
      ) {
        intPart = intPart.slice(0, maxIntegerDigits);
      }
      if (
        typeof maxDecimalDigits === "number" &&
        decPart.length > maxDecimalDigits
      ) {
        decPart = decPart.slice(0, maxDecimalDigits);
      }

      const hadDotInRaw = raw.includes(".");
      const hasDotInSanitized = v.includes(".");
      const shouldKeepDot = hadDotInRaw || hasDotInSanitized;

      v = shouldKeepDot
        ? decPart.length > 0
          ? `${intPart}.${decPart}`
          : `${intPart}.`
        : intPart;

      desiredPos = Math.min(prevSelectionStart, String(v).length);
    }

    // Immediately set caret on the live target before any re-render
    try {
      const posImmediate =
        typeof desiredPos === "number"
          ? desiredPos
          : Math.min(prevSelectionStart, String(v).length);
      if (typeof posImmediate === "number" && e?.target?.setSelectionRange) {
        const clampedNow = Math.max(
          0,
          Math.min(posImmediate, String(v).length)
        );
        e.target.setSelectionRange(clampedNow, clampedNow);
      }
    } catch {
      /* noop */
    }

    setEditValue(v);
    onChange({ target: { value: v } });

    // Store caret target and apply after render using a stable ref (safety net)
    nextCaretPosRef.current =
      typeof desiredPos === "number"
        ? desiredPos
        : Math.min(prevSelectionStart, String(v).length);

    try {
      requestAnimationFrame(() => {
        const el = inputRef.current;
        const pos = nextCaretPosRef.current;
        if (
          el &&
          typeof el.setSelectionRange === "function" &&
          typeof pos === "number"
        ) {
          const clamped = Math.max(0, Math.min(pos, String(v).length));
          el.setSelectionRange(clamped, clamped);
        }
      });
    } catch {
      /* noop */
    }
  };

  const handleBlur = (e) => {
    focusedRef.current = false;
    let v = (editValue || "").trim();

    if (numericMode) {
      v = coerceNumeric(v, precision, scale);
      setEditValue(v);
      onChange({ target: { value: v } });
    }

    const n = parseFloat(v);

    if (v === "" || Number.isNaN(n)) {
      if (enforceDefaultOnEmpty) {
        // Use provided defaultValue when field is cleared
        const parsedDefault = parseFloat(defaultValue);
        if (!Number.isNaN(parsedDefault)) {
          const formattedDefault = parsedDefault.toFixed(decimals);
          setEditValue(formattedDefault);
          onChange({ target: { value: formattedDefault } });
        } else {
          setEditValue(defaultValue);
          onChange({ target: { value: defaultValue } });
        }
      } else {
        setEditValue("");
        onChange({ target: { value: "" } });
      }
    } else {
      const formatted = n.toFixed(decimals);
      setEditValue(formatted);
      onChange({ target: { value: formatted } });
    }

    try {
      if (typeof onBlurProp === "function") {
        const parsed = Number.isNaN(n) ? null : n;
        const formatted = Number.isNaN(n) ? "" : n.toFixed(decimals);
        onBlurProp(e, { raw: v, parsed, formatted });
      }
    } catch {
      /* noop */
    }
  };

  return (
    <div className="mb-2">
      {label && (
        <label
          className={`form-label ${
            inputProps?.required ? "required" : ""
          }`}
          title={tooltip || ""}
          htmlFor={inputId}
        >
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        name={name ?? inputProps.name}
        className={className || "form-control form-control-sm"}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        value={editValue}
        style={{ textAlign: "right", ...(style || {}) }}
        disabled={disabled}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={handleBlur}
        {...inputProps}
      />
    </div>
  );
};

export default NumericEditor;
