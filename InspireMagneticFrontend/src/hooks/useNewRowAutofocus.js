import React, { useMemo } from "react";

// Provides a reusable autofocus helper for newly inserted rows in InlineEditableTable-like UIs
export function useNewRowAutofocus(tableScrollRef, columns, newRowFocusKey) {
  const firstEditableColKey = useMemo(() => {
    try {
      const editable = (columns || []).find(
        (c) => !c.readOnly && (typeof c.renderEdit === "function" || !c.readOnly)
      );
      return editable ? editable.key : null;
    } catch {
      return null;
    }
  }, [columns]);

  const focusNewRowField = React.useCallback(
    (rowIndex, colKey) => {
      try {
        const container = (tableScrollRef && tableScrollRef.current) || document;
        const key = colKey || newRowFocusKey || firstEditableColKey;
        if (!key) return;
        const selector =
          `[data-iet-row="new"][data-iet-row-index="${rowIndex}"][data-iet-col="${key}"] input, ` +
          `[data-iet-row="new"][data-iet-row-index="${rowIndex}"][data-iet-col="${key}"] select, ` +
          `[data-iet-row="new"][data-iet-row-index="${rowIndex}"][data-iet-col="${key}"] textarea, ` +
          `[data-iet-row="new"][data-iet-row-index="${rowIndex}"][data-iet-col="${key}"] [contenteditable="true"], ` +
          `[data-iet-row="new"][data-iet-row-index="${rowIndex}"][data-iet-col="${key}"] [tabindex]:not([tabindex="-1"])`;
        const el = container.querySelector(selector);
        if (el && typeof el.focus === "function") {
          el.focus();
          try {
            if (typeof el.select === "function") el.select();
          } catch {}
        }
      } catch {
        /* noop */
      }
    },
    [tableScrollRef, newRowFocusKey, firstEditableColKey]
  );

  return { focusNewRowField, firstEditableColKey };
}

export default useNewRowAutofocus;


