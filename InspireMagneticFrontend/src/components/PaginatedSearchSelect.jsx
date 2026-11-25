import React, { useCallback, useEffect, useRef, useState } from "react";
import Select from "react-select";
import { StableScrollMenuList } from "./FormElement"; // import, don't redeclare

const MENU_PORTAL_TARGET = typeof document !== "undefined" ? document.body : null;

export function PaginatedSearchSelect({
  label,
  name,
  value,
  inputLabel,
  fetchPage,
  pageSize = 20,
  debounceMs = 300,
  minSearchLength = 0,
  onChange,
  onBlur,
  placeholder = "Search...",
  disabled,
  error,
  isValid,
  required,
  noOptionsMessage,
  formatOptionLabel,
  extraParams,
}) {
  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchSeqRef = useRef(0);
  const searchTextRef = useRef("");
  const debounceTimerRef = useRef(null);
  const extraParamsRef = useRef(extraParams);
  extraParamsRef.current = extraParams;

  const runFetch = useCallback(
    async (pageToLoad, term, { append }) => {
      const seq = ++fetchSeqRef.current;
      setLoading(true);
      try {
        const res = await fetchPage({
          page: pageToLoad,
          pageSize,
          searchText: term || "",
          ...(extraParamsRef.current || {}),
        });

        if (seq !== fetchSeqRef.current) return;

        const nextOptions = res?.options || [];
        const nextHasMore =
          typeof res?.hasMore === "boolean"
            ? res.hasMore
            : nextOptions.length >= pageSize;

        setOptions((prev) => (append ? [...prev, ...nextOptions] : nextOptions));
        setHasMore(nextHasMore);
        setPage(pageToLoad);
      } catch (e) {
        console.error(`PaginatedSearchSelect (${name}) fetch error`, e);
        if (!append) setOptions([]);
        setHasMore(false);
      } finally {
        if (seq === fetchSeqRef.current) setLoading(false);
      }
    },
    [fetchPage, pageSize, name],
  );

  useEffect(() => {
    runFetch(0, "", { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = useCallback(
    (text, { action }) => {
      if (action !== "input-change") return;
      searchTextRef.current = text;
      setSearchText(text);

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (text.length >= minSearchLength) {
          runFetch(0, text, { append: false });
        } else if (text.length === 0) {
          runFetch(0, "", { append: false });
        }
      }, debounceMs);
    },
    [debounceMs, minSearchLength, runFetch],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleMenuScrollToBottom = useCallback(() => {
    if (loading || !hasMore) return;
    runFetch(page + 1, searchTextRef.current, { append: true });
  }, [loading, hasMore, page, runFetch]);

  // Fires when the user picks (or clears) an option. This is where the
  // "blank customer field after selecting a searched result" bug lived:
  // react-select suppresses rendering of the selected label while its
  // controlled `inputValue` (our `searchText`) is non-empty, since it
  // assumes the user is still actively typing/searching. We now reset
  // the search text on selection so the picked label renders immediately,
  // and we invalidate any pending/in-flight debounced fetch tied to the
  // old search term so it can't overwrite `options` out from under the
  // freshly-selected value.
  const handleChange = useCallback(
    (option) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      fetchSeqRef.current += 1; // ignore any fetch already in flight

      searchTextRef.current = "";
      setSearchText("");

      onChange?.(option);
    },
    [onChange],
  );

  const validationClass = error
    ? "react-select-invalid"
    : isValid
      ? "react-select-valid"
      : "";

  const resolvedValue =
    options.find((o) => String(o.value) === String(value)) ||
    (value !== undefined && value !== null && value !== ""
      ? { value, label: inputLabel || "" }
      : null);

  return (
    <div className="mb-2" style={{ width: "100%" }}>
      {label && (
        <label className={`form-label ${required ? "required" : ""}`}>{label}</label>
      )}
      <Select
        classNamePrefix="react-select"
        className={validationClass}
        name={name}
        options={options}
        value={resolvedValue}
        inputValue={searchText}
        onChange={handleChange}
        onInputChange={handleInputChange}
        onMenuScrollToBottom={handleMenuScrollToBottom}
        onBlur={onBlur}
        placeholder={placeholder}
        isDisabled={disabled}
        isLoading={loading}
        filterOption={null}
        formatOptionLabel={formatOptionLabel}
        noOptionsMessage={
          noOptionsMessage || (() => (loading ? "Loading..." : "No results"))
        }
        menuPortalTarget={MENU_PORTAL_TARGET}
        menuPosition="fixed"
        components={{ MenuList: StableScrollMenuList }}
        styles={{
          container: (p) => ({ ...p, width: "100%" }),
          control: (p) => ({
            ...p,
            minHeight: 38,
          }),
          menu: (p) => ({ ...p, zIndex: 99999 }),
          menuPortal: (b) => ({ ...b, zIndex: 99999 }),
          valueContainer: (p) => ({
            ...p,
            paddingTop: 2,
            paddingBottom: 2,
          }),
          // Wraps clear + dropdown icons together, right-aligned, centered vertically
          indicatorsContainer: (p) => ({
            ...p,
            alignItems: "center",
            alignSelf: "stretch",
          }),
          // Thin divider between clear (x) and dropdown arrow — remove if you'd rather not show it
          indicatorSeparator: (p) => ({
            ...p,
            marginTop: 8,
            marginBottom: 8,
          }),
          clearIndicator: (p) => ({
            ...p,
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }),
          dropdownIndicator: (p) => ({
            ...p,
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }),
          option: (p, state) => ({
            ...p,
            backgroundColor: state.isSelected
              ? "#E8E8E8"
              : state.isFocused
                ? "#F5F5F5"
                : "white",
            color: "#333",
            cursor: "pointer",
          }),
        }}
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}