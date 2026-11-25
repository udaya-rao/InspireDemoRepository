import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    useCallback,
    useMemo,
    useEffect,
  } from "react";
import { FormField, TextAreaFormField } from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import { useToast } from "../../components/useToast";
import { saveOrUpdateEmployer } from "../../services/employerService";
import { CustomValidateField } from "../../utils/CustomValidation";
import FullPageLoader from "../../components/FullPageLoader";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
  
  const validation = {
    name: { required: true },
    address: { required: true },
    // employerID: { required: true },
    // paramType: { required: true },
    // email: { required: true },
    // mobileNumber: { required: true },
    // gstNumber: { required: true },
  };
  
  const SaveOrUpdateEmployerForm = forwardRef(
    ({ onClose, onSuccess, initialData, disabled, onDirtyChange }, ref) => {
      const toast = useToast();
      const showToast = toast?.showToast;
  
      const initialValues = useMemo(() => {
        const d = initialData || {};
        const mapped = {
          // direct passthroughs (if already camelCase)
          name: d.name ?? d.Name,
          address: d.address ?? d.Address,
          phone: d.phone ?? d.Phone,
          fax: d.fax ?? d.Fax,
          // map API response keys to form fields
          emailID: d.emailID ?? d.email ?? d.Email ?? "",
          employerID: d.employerID ?? d.emp_id ?? d.EMPLOYER_ID,
          panNo: d.panNo ?? d.pan_no ?? d.PANNo,
          mobileNumber: d.mobileNumber ?? d.mobile_no ?? d.MobileNumber,
          accountsDetails: d.accountsDetails ?? d.accounts_details,
          gstNumber: d.gstNumber ?? d.gstin_no ?? d.GSTNumber
        };
  
        return { ...mapped, paramType: "UPDATE" };
      }, [initialData]);
      const [isDirty, setIsDirty] = useState(false);
      const [submitting, setSubmitting] = useState(false);
  
      const [apiErrors, setApiErrors] = useState({});
  
      const validatedFormRef = useRef();
      useImperativeHandle(ref, () => ({
        submit: () => {
          if (validatedFormRef.current) {
            validatedFormRef.current.submitForm();
          }
        },
        hasUnsavedChanges: () => isDirty,
        confirmClose: () => {
          if (disabled && isDirty) {
            return window.confirm(
              "You have unsaved changes. Do you want to save them before leaving?"
            );
          }
          return true;
        },
      }));
  
      const computeDirty = useCallback(
        (vals) => {
          const dirtyNow = JSON.stringify(vals) !== JSON.stringify(initialValues);
          setIsDirty(dirtyNow);
          if (onDirtyChange) onDirtyChange(dirtyNow);
        },
        [onDirtyChange, initialValues]
      );

      useEffect(() => {
        const onDirtyPing = (e) => {
          if (!e?.detail?.ping) return;
          const targetKey = e.detail?.targetKey;
          if (targetKey && targetKey !== "employer") return;
          
          if (!isDirty) return;
          
          window.dispatchEvent(
            new CustomEvent("dirtyPromptState", {
              detail: { 
                active: true, 
                onSaveDraft: null, 
                onDiscardDraft: null, 
              },
            })
          );
        };
        
        window.addEventListener("dirtyPromptState", onDirtyPing);
        return () => window.removeEventListener("dirtyPromptState", onDirtyPing);
      }, [isDirty]);
  
      const handleSubmit = async (values) => {
        try {
          setApiErrors({}); // reset errors

          // Collect all client-side validation errors together
          const clientValidationErrors = {};

          // Validate Mobile Number
          const mobileError = CustomValidateField(
            "MobileNumber",
            values.mobileNumber,
            "Enter The Valid Mobile Number."
          );
          if (mobileError) {
            clientValidationErrors.mobileNumber = mobileError;
          }

          // Validate PAN Number
          const panNoError = CustomValidateField(
            "PANNumber",
            values.panNo,
            "Enter The Valid PAN Number."
          );
          if (panNoError) {
            clientValidationErrors.panNo = panNoError;
          }

          // Validate Email
          const emailError = CustomValidateField(
            "EmailID",
            values.emailID,
            "Enter The Valid Email ID."
          );
          if (emailError) {
            clientValidationErrors.emailID = emailError;
          }

          // Validate GSTIN Number
          const gstNumberError = CustomValidateField(
            "GSTNumber",
            values.gstNumber,
            "Enter The Valid GSTIN Number."
          );
          if (gstNumberError) {
            clientValidationErrors.gstNumber = gstNumberError;
          }

          // If there are any validation errors, set them all at once and return
          if (Object.keys(clientValidationErrors).length > 0) {
            setApiErrors(clientValidationErrors);
            return;
          }
          // Ensure payload uses email field as `emailID` and preserves existing values
          const payload = {
            ...values,
            employerID: initialData.employerID,
            paramType: "UPDATE",
          };
  
          setSubmitting(true);
          const res = await saveOrUpdateEmployer(payload);

          const validationErrors = res?.data?.ValidationErrors;
          if (validationErrors?.length > 0) {
            const fieldErrors = {};
            validationErrors.forEach((e) => {
              const keyMap = {
                PANNo: "panNo",
                MobileNumber: "mobileNumber",
                GSTNumber: "gstNumber",
                Email: "emailID",
                EmailID: "emailID",
                Name: "name",
                Address: "address",
              };
              const formKey = keyMap[e.Key] || e.Key;
              fieldErrors[formKey] = e.Message;
            });
            setApiErrors(fieldErrors);
            setSubmitting(false);
            return;
          }
  
          if (res?.message === "OK") {
            const successMsg =
              res?.data?.EMPLOYER_MASTER_RESPONSE?.[0]?.Message ||
              "Employer saved successfully!";
            showToast ? showToast(successMsg, "success") : alert(successMsg);
            if (onSuccess) onSuccess();
            if (onClose) onClose();
          } else {
            const errorMsg = res?.message || "Failed to save employer";
            showToast ? showToast(errorMsg, "error") : alert(errorMsg);
          }
          setSubmitting(false);
        } catch (err) {
          console.error(err);
          setSubmitting(false);
        }
      };
  
      return (
        <div style={{ maxWidth: "100%", margin: "0 auto" }}>
          <FullPageLoader
            loading={submitting}
            message="Saving company details..."
            logoSrc={inspireLogo}
          />
          <ValidatedForm
            ref={validatedFormRef}
            initialValues={initialValues}
            validation={validation}
            onSubmit={handleSubmit}
            onValuesChange={computeDirty}
          >
            {({ values, errors, handleChange, handleBlur }) => (
              <>
                <div>
                  <div className="row">
                    <div className="col-md-6">
                      <FormField
                        label="Name"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        error={errors.name || apiErrors.name}
                        disabled={disabled}
                      />
                      <FormField
                        label="Phone"
                        name="phone"
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={disabled}
                      />
                      <FormField
                        label="Fax"
                        name="fax"
                        value={values.fax}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={disabled}
                      />
                    </div>
                    <div className="col-md-6">
                      <TextAreaFormField
                        label="Address"
                        name="address"
                        value={values.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        rows="4"
                        required
                        error={errors.address || apiErrors.address}
                        disabled={disabled}
                        style={{
                          resize: "vertical",
                          overflowY: "auto",
                          minHeight: "115px",
                          maxHeight: "200px",
                        }}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <FormField
                        label="GSTIN No."
                        name="gstNumber"
                        value={values.gstNumber || ""}
                        onChange={(e) => {
                          const input = e.target;
                          const cursorPosition = input.selectionStart;
                          const originalValue = input.value;
                          
                          let inputValue = e.target.value;
                          
                          // Convert to uppercase and filter non-alphanumeric
                          inputValue = inputValue.toUpperCase().replace(/[^0-9A-Z]/g, '');
                          // Limit to 15 characters
                          if (inputValue.length > 15) {
                            inputValue = inputValue.substring(0, 15);
                          }
                          

                          const beforeCursor = originalValue.substring(0, cursorPosition);
                          const validBeforeCursor = beforeCursor.toUpperCase().replace(/[^0-9A-Z]/g, '');
                          const newCursorPosition = Math.min(validBeforeCursor.length, inputValue.length);
                          
                          e.target.value = inputValue;
                          
                          handleChange(e);
                          
                          setTimeout(() => {
                            input.setSelectionRange(newCursorPosition, newCursorPosition);
                          }, 0);
                          
                          // Clear API errors when user types
                          if (apiErrors.gstNumber) {
                            setApiErrors((prev) => {
                              const next = { ...prev };
                              delete next.gstNumber;
                              return next;
                            });
                          }
                        }}
                        onBlur={handleBlur}
                        onFocus={() => {
                          setApiErrors((prev) => {
                            const next = { ...prev };
                            delete next.gstNumber;
                            return next;
                          });
                        }}
                        disabled={disabled}
                        error={errors.gstNumber || apiErrors.gstNumber}
                        maxLength={15}
                        placeholder="GST No"
                      />
                    </div>
                    <div className="col-md-6">
                      <FormField
                        label="Mobile"
                        name="mobileNumber"
                    value={values.mobileNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    error={errors.mobileNumber || apiErrors.mobileNumber}
                    // inputValueType="number"
                    maxLength={10}
                    placeholder="Enter mobile number"
                  />
                    </div>
                  </div>
  
                  <div className="row">
                    <div className="col-md-6">
                      <FormField
                        label="PAN No."
                        name="panNo"
                        value={values.panNo || ""}
                        maxLength={10}
                        onChange={(e) => {
                          const input = e.target;
                          const cursorPosition = input.selectionStart;
                          
                          let inputValue = e.target.value;
                          
                          inputValue = inputValue.toUpperCase();
                          
                          const newCursorPosition = Math.min(cursorPosition, inputValue.length);
                          
                          e.target.value = inputValue;
                          
                          handleChange(e);
                          
                          setTimeout(() => {
                            input.setSelectionRange(newCursorPosition, newCursorPosition);
                          }, 0);
                          
                          if (apiErrors.panNo) {
                            setApiErrors((prev) => {
                              const next = { ...prev };
                              delete next.panNo;
                              return next;
                            });
                          }
                        }}
                        onBlur={handleBlur}
                        onFocus={() =>
                          setApiErrors((prev) => {
                            const next = { ...prev };
                            delete next.panNo;
                            return next;
                          })
                        }
                        disabled={disabled}
                        error={errors.panNo || apiErrors.panNo}
                      />
                    </div>
                    <div className="col-md-6">
                      <FormField
                        label="Email"
                        name="emailID"
                        value={values.emailID}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        type="email"
                        disabled={disabled}
                        error={errors.emailID || apiErrors.emailID}
                      />
                    </div>
                  </div>
  
                  <div className="row">
                    <div className="col-md-6">
                      <TextAreaFormField
                        label="Accounts Info"
                        name="accountsDetails"
                        value={values.accountsDetails}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        rows="4"
                        error={errors.accountsDetails || apiErrors.accountsDetails}
                        disabled={disabled}
                        style={{
                          resize: "vertical",
                          overflowY: "auto",
                          minHeight: "115px",
                          maxHeight: "200px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </ValidatedForm>
        </div>
      );
    }
  );
  
  export default SaveOrUpdateEmployerForm;
  