import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";

function validateField(value, rules = {}, allValues) {
  const {
    required,
    email,
    minLength,
    maxLength,
    validator,
    fieldLabel,
    controlType,
    requiredMessage, // optional explicit override
  } = rules;

  const label = fieldLabel || "This field";

  const isRequired =
    typeof required === "function" ? !!required(allValues) : !!required;

  const isEmpty = value === undefined || value === null || value === "";

  // ---------- REQUIRED ----------
  if (isRequired && isEmpty) {
    // Highest priority: explicit custom message
    if (requiredMessage) return requiredMessage;

    // Decide verb based on control type
    const action =
      controlType === "dropdown" || controlType === "select"
        ? "Select"
        : "Enter";

    // e.g. "Enter The Login ID." or "Select The Department."
    return `${action} The ${label}.`;
  }

  // If not required and empty → treat as valid, skip other rules
  if (!isRequired && isEmpty) {
    return "";
  }

  // ---------- EMAIL ----------
  if (email && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    // you can customize to use label if you prefer:
    // return `Enter The Valid ${label}.`;
    return "Invalid email address.";
  }

  // ---------- MIN / MAX LENGTH ----------
  if (minLength && value && value.length < minLength) {
    return `Minimum ${minLength} characters required.`;
  }

  if (maxLength && value && value.length > maxLength) {
    return `Maximum ${maxLength} characters allowed.`;
  }

  // ---------- CUSTOM VALIDATOR ----------
  if (typeof validator === "function") {
    try {
      const customMessage = validator(value, allValues);
      if (customMessage) return customMessage;
    } catch {
      /* no-op */
    }
  }

  // No errors
  return "";
}

const ValidatedForm = forwardRef(function ValidatedForm(
  {
    initialValues,
    validation,
    onSubmit,
    children,
    onValuesChange,
    enableDraft = false,
    draftKey = "",
    clearDraftOnSubmit = false,
  },
  ref
) {
  const [values, setValues] = useState(() => {
    try {
      if (enableDraft && draftKey) {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...initialValues, ...parsed };
        }
      }
    } catch {
      // ignore parse errors
    }
    return initialValues;
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const lastValidInitialValuesRef = useRef(initialValues);
  const skipOnValuesChangeRef = useRef(false); 
  const pendingValuesChangeRef = useRef(null); 
  
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      const hasData = Object.values(initialValues).some(val => 
        val !== null && val !== undefined && val !== ""
      );
      if (hasData) {
        lastValidInitialValuesRef.current = initialValues;
      }
    }
  }, [initialValues]);
  
  useEffect(() => {
    const formIsEmpty = !values || Object.keys(values).length === 0 || 
      !Object.values(values).some(val => 
        val !== null && val !== undefined && val !== ""
      );
    
    const hasValidInitialValues = lastValidInitialValuesRef.current && 
      Object.keys(lastValidInitialValuesRef.current).length > 0 &&
      Object.values(lastValidInitialValuesRef.current).some(val => 
        val !== null && val !== undefined && val !== ""
      );

    if (formIsEmpty && hasValidInitialValues) {
      skipOnValuesChangeRef.current = true; 
      setValues(lastValidInitialValuesRef.current);
    }
  }, [values]); 
  
  useEffect(() => {
    if (pendingValuesChangeRef.current && typeof onValuesChange === "function") {
      const valuesToReport = pendingValuesChangeRef.current;
      pendingValuesChangeRef.current = null;
      setTimeout(() => {
        onValuesChange(valuesToReport);
      }, 0);
    }
  });

  const persistDraft = (nextValues) => {
    if (!enableDraft || !draftKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(nextValues));
    } catch {
    }
  };

  const computeErrors = (vals) => {
    const newErrors = {};
    if (!validation) return newErrors;
    Object.keys(validation).forEach((name) => {
      const error = validateField(vals?.[name], validation[name], vals || {});
      if (error) newErrors[name] = error;
    });
    return newErrors;
  };

  const clearDraft = () => {
    if (!enableDraft || !draftKey) return;
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* no-op */
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => {
      const next = { ...v, [name]: value };

      if (validation && validation[name]) {
        try {
          setErrors((errs) => ({
            ...errs,
            [name]: validateField(value, validation[name], next),
          }));
        } catch {
          /* no-op */
        }
      }

      if (typeof onValuesChange === "function" && !skipOnValuesChangeRef.current) {
        pendingValuesChangeRef.current = next;
      } else if (skipOnValuesChangeRef.current) {
        skipOnValuesChangeRef.current = false;
      }

      persistDraft(next);
      return next;
    });
  };

  const setFieldValue = (name, value) => {
    if (!name) return;
    setValues((v) => {
      const next = { ...(v || {}), [name]: value };

      if (validation?.[name]) {
        try {
          setErrors((errs) => ({
            ...(errs || {}),
            [name]: validateField(value, validation[name], next),
          }));
        } catch {
          /* no-op */
        }
      }

      if (typeof onValuesChange === "function" && !skipOnValuesChangeRef.current) {
        pendingValuesChangeRef.current = next;
      } else if (skipOnValuesChangeRef.current) {
        skipOnValuesChangeRef.current = false;
      }

      persistDraft(next);
      return next;
    });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (validation && validation[name]) {
      setErrors((errs) => ({
        ...errs,
        [name]: validateField(value, validation[name], values),
      }));
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    console.log("ValidatedForm handleSubmit called"); // Debug log
    setSubmitted(true);

    const newErrors = computeErrors(values);

    setErrors(newErrors);
    console.log("Validation errors:", newErrors); // Debug log

    if (Object.keys(newErrors).length === 0) {
      console.log("No validation errors, calling onSubmit"); // Debug log
      if (clearDraftOnSubmit) clearDraft();
      onSubmit(values);
    } else {
      console.log("Validation errors found, not submitting"); // Debug log
    }
  };

  // Expose submitForm / clearDraft / loadDraft via ref
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      console.log("submitForm called from ref"); // Debug log
      handleSubmit();
    },
    setFieldValue,
    setValues,
    getValues: () => values,
    isValid: () => Object.keys(computeErrors(values)).length === 0,
    clearDraft,
    loadDraft: () => {
      try {
        if (enableDraft && draftKey) {
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            setValues((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch {
        /* no-op */
      }
    },
  }));

  return (
    <form onSubmit={handleSubmit} noValidate>
      {children({ values, errors, handleChange, handleBlur, submitted })}
    </form>
  );
});

export default ValidatedForm;
