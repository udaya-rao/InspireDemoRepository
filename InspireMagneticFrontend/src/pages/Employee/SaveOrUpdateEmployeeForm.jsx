// src/pages/.../SaveOrUpdateEmployeeForm.jsx

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  FormField,
  ReactSelectField,
  DateField,
} from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import { useToast } from "../../components/useToast";
import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
import FullPageLoader from "../../components/FullPageLoader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import {
  getDepartments,
  getEmployeeStatus,
  saveOrUpdateEmployee,
  getEmployeeDetailsById,
} from "../../services/employeeService";
import "../../style/Employee.css";
import { getPreparedBy } from "../../utils/userSession";
import { validateNotFutureDate } from "../../utils/dateUtils";
import {
  CustomValidateField,
  handleApiValidationErrors,
} from "../../utils/CustomValidation";

const initialForm = {
  pageSize: 0,
  pageNumber: 0,
  employeeID: 0,
  employeeCode: "",
  loginID: "",
  employeeName: "",
  dateofBirth: "",
  departmentID: "",
  loginPassword: "",
  employeeStatus: "1",
  mobileNumber: "",
  emailID: "",
  paramType: "ADD",
};

// Base validation rules used by ValidatedForm / validateField
const validation = {
  employeeCode: {
    required: true,
    fieldLabel: "Employee Code",
    controlType: "textbox",
  },
  loginID: {
    required: true,
    fieldLabel: "Login ID",
    controlType: "textbox",
  },
  employeeName: {
    required: true,
    fieldLabel: "Employee Name",
    controlType: "textbox",
  },
  loginPassword: {
    required: true,
    fieldLabel: "Login Password",
    controlType: "textbox",
  },
  emailID: {
    required: false,
    fieldLabel: "Email",
    controlType: "textbox",
  },
  mobileNumber: {
    required: false,
    fieldLabel: "Mobile Number",
    controlType: "textbox",
  },
  employeeStatus: {
    required: true,
    fieldLabel: "Status",
    controlType: "dropdown",
  },
  departmentID: {
    required: true,
    fieldLabel: "Department",
    controlType: "dropdown",
  },
};

// Password validation function
const validatePassword = (password) => {
  if (!password || password.trim() === "") {
    return ""; // Let required validation handle empty passwords
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]/.test(password);

  if (password.length < minLength) {
    return "New Password must be minimum 8 characters and contain one uppercase letter, one lowercase letter, one digit and one special character.";
  }

  if (!hasUpperCase || !hasLowerCase || !hasDigit || !hasSpecialChar) {
    return "New Password must be minimum 8 characters and contain one uppercase letter, one lowercase letter, one digit and one special character.";
  }

  return ""; // Valid password
};

const SaveOrUpdateEmployeeForm = forwardRef(
  ({ onClose, onSuccess, initialData, editMode, onDirtyChange }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();
    const [departments, setDepartments] = useState([]);
    const [status, setStatus] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [apiErrors, setApiErrors] = useState({});

    const validatedFormRef = useRef();

    // --- Prevent browser from auto-filling saved credentials (Login ID / Password)
    const [autoFillLock, setAutoFillLock] = useState(true);
    const unlockAutofill = useCallback(() => setAutoFillLock(false), []);

    // Reset lock whenever drawer opens for create mode
    useEffect(() => {
      if (!initialData) {
        setAutoFillLock(true);
      }
    }, [initialData]);

    // Today's date in YYYY-MM-DD, used only to DISABLE future dates (not as value)
    const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

    const asArray = useCallback((payload) => {
      if (Array.isArray(payload)) return payload;
      const d1 = payload?.data;
      if (Array.isArray(d1)) return d1;

      if (d1 && typeof d1 === "object") {
        const arrKey = Object.keys(d1).find((k) => Array.isArray(d1[k]));
        if (arrKey) return d1[arrKey];
      }

      if (payload && typeof payload === "object") {
        const arrKey = Object.keys(payload).find((k) =>
          Array.isArray(payload[k])
        );
        if (arrKey) return payload[arrKey];
      }

      return [];
    }, []);

    const getOptValue = useCallback((obj) => {
      const v =
        obj?.ValueText ??
        obj?.valuetext ??
        obj?.valueText ??
        obj?.value ??
        obj?.id ??
        "";
      return String(v ?? "");
    }, []);

    const getOptLabel = useCallback((obj) => {
      const l =
        obj?.DisplayText ??
        obj?.displaytext ??
        obj?.displayText ??
        obj?.label ??
        obj?.name ??
        "";
      return String(l ?? "");
    }, []);

    const departmentOptions = useMemo(() => {
      const arr = asArray(departments);
      return Array.isArray(arr)
        ? arr.map((dept) => ({
          value: getOptValue(dept),
          label: getOptLabel(dept),
        }))
        : [];
    }, [departments, asArray, getOptValue, getOptLabel]);

    const statusOptions = useMemo(() => {
      const arr = asArray(status);
      return Array.isArray(arr)
        ? arr.map((s) => ({
          value: getOptValue(s),
          label: getOptLabel(s),
        }))
        : [];
    }, [status, asArray, getOptValue, getOptLabel]);

    // Dynamic validation:
    // - Create (no initialData): loginPassword required
    // - View/Edit (initialData present): no loginPassword rule
    const formValidation = useMemo(() => {
      if (!initialData) return validation;
      const rest = { ...validation };
      delete rest.loginPassword;
      return rest;
    }, [initialData]);

    useEffect(() => {
      let isMounted = true;

      const loadDepartments = async () => {
        try {
          const deptData = await getDepartments();
          const deptArr = asArray(deptData);

          if (isMounted) {
            console.log("Department API response (raw):", deptData);
            console.log("Department API response (array):", deptArr);
            setDepartments(deptArr);
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
          } else {
            console.error("Failed to fetch departments", error);
            if (showToast) showToast("Failed to load departments", "error");
          }
        }
      };

      loadDepartments();
      return () => {
        isMounted = false;
      };
    }, [showToast, asArray]);

    useEffect(() => {
      let isMounted = true;

      const loadStatus = async () => {
        try {
          const statusData = await getEmployeeStatus();
          const statusArr = asArray(statusData);

          if (isMounted) {
            setStatus(statusArr);
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
          } else {
            console.error("Failed to fetch status", error);
            if (showToast) showToast("Failed to load status", "error");
          }
        }
      };

      loadStatus();
      return () => {
        isMounted = false;
      };
    }, [showToast, asArray]);

    const initialValues = useMemo(() => {
      if (initialData) {
        return {
          ...initialData,

          // ensure dropdowns are STRING values matching option.value
          employeeStatus: initialData.empl_status
            ? String(initialData.empl_status)
            : String(initialData.employeeStatus ?? "1"),

          departmentID:
            initialData.departmentID != null &&
              String(initialData.departmentID) !== "0"
              ? String(initialData.departmentID)
              : "",

          paramType: "ADD",
        };
      }

      return {
        ...initialForm,
        employeeStatus: String(initialForm.employeeStatus ?? "1"),
        departmentID: String(initialForm.departmentID ?? ""),
        employeeID: 0,
        paramType: "ADD",
      };
    }, [initialData]);

    // Centralized dirty tracking + draft merge
    const { isDirty, onValuesChange, setIsDirty, resetDirty } = useDirtyDraftDrawer({
      open: true,
      initialValues,
      initialData,
      draftKey: "draft_employee_create",
    });

    useEffect(() => {
      if (onDirtyChange) onDirtyChange(isDirty);
    }, [isDirty, onDirtyChange]);

    const handleSubmit = useCallback(
      async (values) => {
        setApiErrors({});

        // Collect all client-side validation errors together
        const clientValidationErrors = {};

        // Validate Email
        const emailError = CustomValidateField(
          "EmailID",
          values.emailID,
          "Enter The Valid Email."
        );
        if (emailError) {
          clientValidationErrors.emailID = emailError;
        }

        // Validate Mobile Number
        const mobileNumberError = CustomValidateField(
          "MobileNumber",
          values.mobileNumber,
          "Enter The Valid Mobile Number."
        );
        if (mobileNumberError) {
          clientValidationErrors.mobileNumber = mobileNumberError;
        }

        // Validate Date of Birth
        const dobError = validateNotFutureDate(
          values.dateofBirth,
          "Date of Birth Cannot Be Future Date"
        );
        if (dobError) {
          clientValidationErrors.dateofBirth = dobError;
        }

        // Validate Login Password (only for new employees, not when editing)
        if (!initialData && values.loginPassword) {
          const passwordError = validatePassword(values.loginPassword);
          if (passwordError) {
            clientValidationErrors.loginPassword = passwordError;
          }
        }

        // If there are any validation errors, set them all at once and return
        if (Object.keys(clientValidationErrors).length > 0) {
          setApiErrors(clientValidationErrors);
          return;
        }

        const preparedBy = getPreparedBy();

        const submitValues = {
          ...values,
          employeeID: initialData ? initialData.employeeID : 0,
          employeeStatus: values.employeeStatus
            ? Number(values.employeeStatus)
            : 0,
          departmentID: values.departmentID ? Number(values.departmentID) : 0,
          preparedBy,
        };

        // In View/Edit mode, do NOT send loginPassword to API
        if (initialData) {
          delete submitValues.loginPassword;
        }

        console.log(
          "Employee Status being sent:",
          submitValues.employeeStatus,
          typeof submitValues.employeeStatus
        );

        setSubmitting(true);
        try {
          const apiResult = await saveOrUpdateEmployee(submitValues);

          const validationErrors = apiResult?.data?.ValidationErrors;
          const employeeMessages = apiResult?.data?.EMPLOYEE_MASTER_RESPONSE;
          const status = apiResult?.Status;
          if (handleApiValidationErrors(validationErrors, showToast)) {
            return;
          }

          let message = "";
          if (employeeMessages?.length > 0) {
            message += employeeMessages.map((e) => e.Message).join(" ");
          }

          if (message) {
            const toastType =
              status === "Success" || status === "OK" ? "success" : "error";
            if (showToast) showToast(message.trim(), toastType);
            if (toastType === "error") return;
          }

          if (status === "Success" || status === "OK") {
            const newId = employeeMessages?.[0]?.ID;
            if (newId) {
              try {
                const detailsRes = await getEmployeeDetailsById(newId);
                const newEmployee =
                  detailsRes?.data?.EMPLOYEE_DETAILS?.[0] ?? null;

                if (newEmployee) {
                  onSuccess && onSuccess(newEmployee);
                } else {
                  onSuccess && onSuccess(submitValues);
                }
              } catch {
                onSuccess && onSuccess(submitValues);
              }
            } else {
              onSuccess && onSuccess(submitValues);
            }

            // Reset dirty state before closing to prevent unsaved changes popup
            setIsDirty(false);
            resetDirty();
            if (onDirtyChange) onDirtyChange(false);

            onClose && onClose();
          } else {
            if (showToast) showToast("Failed to save employee", "error");
          }
        } catch (err) {
          if (err?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
            return;
          }
          const msg = err?.message || "Error saving employee";
          if (showToast) showToast(msg, "error");
          else alert(msg);
        } finally {
          setSubmitting(false);
        }
      },
      [initialData, onClose, onSuccess, onDirtyChange, showToast, resetDirty, setIsDirty]
    );

    useImperativeHandle(ref, () => ({
      submit: () => {
        if (validatedFormRef.current) {
          validatedFormRef.current.submitForm();
        }
      },
      clearDraft: () => {
        try {
          validatedFormRef.current?.clearDraft?.();
        } catch {
          /* no-op */
        }
      },
      loadDraft: () => {
        try {
          validatedFormRef.current?.loadDraft?.();
        } catch {
          /* no-op */
        }
      },
      hasUnsavedChanges: () => isDirty,
      confirmClose: () => {
        if (initialData && editMode && isDirty) {
          return window.confirm(
            "You have unsaved changes. Do you want to save them before leaving?"
          );
        }
        return true;
      },
    }));

    const isDisabled = initialData ? !editMode : false;

    const clearFieldError = useCallback((fieldName) => {
      setApiErrors((prev) => {
        if (!prev || !Object.prototype.hasOwnProperty.call(prev, fieldName))
          return prev;
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }, []);

    return (
      <div className="employee-form-wrapper">
        <FullPageLoader
          loading={submitting}
          message="Saving employee..."
          logoSrc={inspireLogo}
        />

        <ValidatedForm
          ref={validatedFormRef}
          initialValues={initialValues}
          validation={formValidation}
          onSubmit={handleSubmit}
          onValuesChange={onValuesChange}
          enableDraft={!initialData}
          draftKey="draft_employee_create"
          clearDraftOnSubmit
        >
          {({ values, errors, handleChange, handleBlur }) => {
            return (
              <>
                {/* --- Restrict Autofill browsers fill these instead of the real fields --- */}
                {!initialData ? (
                  <div
                    style={{
                      position: "absolute",
                      left: "-9999px",
                      top: "-9999px",
                      height: 0,
                      width: 0,
                      overflow: "hidden",
                      opacity: 0,
                      pointerEvents: "none",
                    }}
                    aria-hidden="true"
                  >
                    {/* Intentionally using common autocomplete tokens */}
                    <input
                      type="text"
                      name="username"
                      autoComplete="username"
                      tabIndex={-1}
                    />
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      tabIndex={-1}
                    />
                  </div>
                ) : null}

                {/* Employee Details Section */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <FormField
                      label="Employee Code"
                      name="employeeCode"
                      placeholder="Employee Code"
                      value={values.employeeCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={(e) => clearFieldError(e.target.name)}
                      required
                      disabled={isDisabled || (!!initialData && editMode)}
                      error={errors.employeeCode || apiErrors.employeeCode}
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-md-6">
                    <FormField
                      label="Login ID"
                      name="loginID"
                      placeholder="Login ID"
                      value={values.loginID}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={(e) => {
                        clearFieldError(e.target.name);
                        unlockAutofill();
                      }}
                      required
                      disabled={isDisabled || (!!initialData && editMode)}
                      error={errors.loginID || apiErrors.loginID}
                      autoComplete="off"
                      readOnly={!initialData && autoFillLock}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <FormField
                      label="Employee Name"
                      name="employeeName"
                      placeholder="Employee Name"
                      value={values.employeeName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={(e) => clearFieldError(e.target.name)}
                      required
                      disabled={isDisabled}
                      error={errors.employeeName || apiErrors.employeeName}
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-md-6">
                    <FormField
                      label="Email"
                      name="emailID"
                      type="email"
                      placeholder="Email"
                      value={values.emailID}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={(e) => clearFieldError(e.target.name)}
                      disabled={isDisabled}
                      error={errors.emailID || apiErrors.emailID}
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Login Password Section */}
                {!initialData ? (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <div className="mb-2">
                          <label className="form-label required">
                            Login Password
                          </label>
                          <div className="input-group input-group-flat">
                            <input
                              type={showPassword ? "text" : "password"}
                              className={`form-control${errors.loginPassword || apiErrors.loginPassword
                                  ? " is-invalid"
                                  : ""
                                }`}
                              placeholder="Login Password"
                              name="loginPassword"
                              value={values.loginPassword}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onFocus={(e) => {
                                clearFieldError(e.target.name);
                                unlockAutofill();
                              }}
                              required
                              disabled={isDisabled}
                              autoComplete="new-password"
                              readOnly={autoFillLock}
                            />
                            <span className="input-group-text">
                              <button
                                type="button"
                                className="link-secondary employee-password-toggle-btn"
                                title={
                                  showPassword ? "Hide password" : "Show password"
                                }
                                onClick={() => setShowPassword((v) => !v)}
                                disabled={isDisabled}
                              >
                                {showPassword ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="icon icon-tabler icon-tabler-eye-off"
                                  >
                                    <path d="M3 3l18 18"></path>
                                    <path d="M10.584 10.587a2 2 0 1 0 2.828 2.826"></path>
                                    <path d="M9.88 5.073a9.956 9.956 0 0 1 2.12 -.073c3.6 0 6.6 2 9 6c-.738 1.231 -1.558 2.266 -2.46 3.106"></path>
                                    <path d="M6.61 6.62c-1.72 1.23 -3.15 3.02 -4.61 5.38c2.4 4 5.4 6 9 6c1.264 0 2.46 -.207 3.59 -.62"></path>
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="icon icon-tabler icon-tabler-eye"
                                  >
                                    <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                                    <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"></path>
                                  </svg>
                                )}
                              </button>
                            </span>
                          </div>
                          {errors.loginPassword || apiErrors.loginPassword ? (
                            <div className="invalid-feedback d-block">
                              {errors.loginPassword || apiErrors.loginPassword}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <FormField
                          label="Mobile Number"
                          name="mobileNumber"
                          placeholder="Mobile Number"
                          value={values.mobileNumber}
                          onChange={handleChange}
                          inputValueType="number"
                          maxLength={10}
                          onBlur={handleBlur}
                          onFocus={(e) => clearFieldError(e.target.name)}
                          disabled={isDisabled}
                          error={errors.mobileNumber || apiErrors.mobileNumber}
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    {/* Other Details Section */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <ReactSelectField
                          label="Status"
                          name="employeeStatus"
                          options={statusOptions}
                          value={values.employeeStatus}
                          onChange={(e) => {
                            console.log(
                              "Status onChange:",
                              e.target.value,
                              typeof e.target.value
                            );
                            handleChange(e);
                          }}
                          onBlur={handleBlur}
                          onFocus={(e) => clearFieldError(e.target.name)}
                          placeholder="Select Status"
                          required
                          disabled={isDisabled}
                          isClearable={false}
                          error={
                            errors.employeeStatus || apiErrors.employeeStatus
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <ReactSelectField
                          label="Department"
                          name="departmentID"
                          options={departmentOptions}
                          value={values.departmentID}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          onFocus={(e) => clearFieldError(e.target.name)}
                          placeholder="Select Department"
                          disabled={isDisabled}
                          error={errors.departmentID || apiErrors.departmentID}
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <DateField
                          label="Date of Birth"
                          name="dateofBirth"
                          type="date"
                          value={values.dateofBirth || ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          onFocus={(e) => clearFieldError(e.target.name)}
                          disabled={isDisabled}
                          max={todayStr}
                          error={errors.dateofBirth || apiErrors.dateofBirth}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* EDIT/VIEW: */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <FormField
                          label="Mobile Number"
                          name="mobileNumber"
                          placeholder="Mobile Number"
                          value={values.mobileNumber}
                          onChange={handleChange}
                          inputValueType="number"
                          maxLength={10}
                          onBlur={handleBlur}
                          onFocus={(e) => clearFieldError(e.target.name)}
                          disabled={isDisabled}
                          error={errors.mobileNumber || apiErrors.mobileNumber}
                          autoComplete="off"
                        />
                      </div>

                      <div className="col-md-6">
                        <ReactSelectField
                          label="Status"
                          name="employeeStatus"
                          options={statusOptions}
                          value={values.employeeStatus}
                          onChange={(e) => {
                            console.log(
                              "Status onChange:",
                              e.target.value,
                              typeof e.target.value
                            );
                            handleChange(e);
                          }}
                          onBlur={handleBlur}
                          onFocus={(e) => clearFieldError(e.target.name)}
                          placeholder="Select Status"
                          required
                          disabled={isDisabled}
                          isClearable={false}
                          error={
                            errors.employeeStatus || apiErrors.employeeStatus
                          }
                        />
                      </div>
                    </div>

                    {/* EDIT/VIEW: Department | Date of Birth */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <ReactSelectField
                          label="Department"
                          name="departmentID"
                          options={departmentOptions}
                          value={values.departmentID}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          onFocus={(e) => clearFieldError(e.target.name)}
                          placeholder="Select Department"
                          disabled={isDisabled}
                          error={errors.departmentID || apiErrors.departmentID}
                        />
                      </div>

                      <div className="col-md-6">
                        <DateField
                          label="Date of Birth"
                          name="dateofBirth"
                          type="date"
                          value={values.dateofBirth || ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          onFocus={(e) => clearFieldError(e.target.name)}
                          disabled={isDisabled}
                          max={todayStr}
                          error={errors.dateofBirth || apiErrors.dateofBirth}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            );
          }}
        </ValidatedForm>
      </div>
    );
  }
);

export default SaveOrUpdateEmployeeForm;
