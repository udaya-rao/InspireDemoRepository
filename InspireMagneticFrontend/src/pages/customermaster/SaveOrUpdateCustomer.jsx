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
  TextAreaFormField,
  ReactSelectField,
} from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import { useToast } from "../../components/useToast";
import { useDirtyDraftDrawer } from "../../hooks/useDirtyDraftDrawer";
import {
  getStatusOptions,
  getCustomerType,
  getCustomerSupply,
  getResponsiblePerson,
  saveAndUpdateCustomer,
  fetchCustomerDetails,
  checkCustomerNameExist,
} from "../../services/customerMasterService.js";
import CopyButton from "../../components/CopyButton.jsx";
import FullPageLoader from "../../components/FullPageLoader";
import { getPreparedBy } from "../../utils/userSession";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import {
  CustomValidateField,
  handleApiValidationErrors,
} from "../../utils/CustomValidation.js";
import { DeleteConfirmDialog } from "../../components/Notification";
import {
  hasPermission,
  menuPermissions,
} from "../../permissions/permissionUtils";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS, PARAM_TYPE_ADD, DEFAULT_COUNTRY, YES_VALUE, NO_VALUE, STATUS_UNKNOWN } from "../../utils/ConstVariables";
import { EMAIL_REGEX, MOBILE_REGEX, PHONE_STRIP_REGEX } from "../../utils/regexUtils";

const today = new Date().toISOString().split("T")[0];

const initialForm = {
  customerID: 0,
  customerName: "",
  customerAddress1: "",
  customerAddress2: "",
  customerStatus: "1",
  gstinNumber: "",
  panNumber: "",
  customerWebsite: "",
  customerPincode: "",
  customerSupply: "", // Optional field from API
  responsiblePersonID: "", // Optional field from API
  preparedBy: getPreparedBy(),
  entryDate: today,
  updatedBy: "",
  updatedDate: "",
  customerType: "", // keep empty string for required validation
  paramType: PARAM_TYPE_ADD,
};

// Base validation rules used by ValidatedForm / validateField
const validation = {
  customerName: {
    required: true,
    fieldLabel: "Customer Name",
    controlType: "textbox",
  },
  panNumber: {
    required: true,
    fieldLabel: "PAN Number",
    controlType: "textbox",
  },
  customerType: {
    required: true,
    fieldLabel: "Customer Type",
    controlType: "dropdown",
  },
  customerAddress1: {
    required: true,
    fieldLabel: "Customer Address1",
    controlType: "textbox",
  },
  gstinNumber: {
    required: true,
    fieldLabel: "GSTIN Number",
    controlType: "textbox",
  },
  customerPincode: {
    required: true,
    fieldLabel: "Pincode",
    controlType: "textbox",
  },
  customerStatus: {
    required: true,
    fieldLabel: "Status",
    controlType: "dropdown",
  },
  customerSupply: {
    required: true,
    fieldLabel: "Customer Supply",
    controlType: "dropdown",
  },
  responsiblePersonID: {
    required: true,
    fieldLabel: "Responsible Person",
    controlType: "dropdown",
  },
};

const SaveOrUpdateCustomer = forwardRef(
  ({ onClose, onSuccess, initialData, editMode, onDirtyChange }, ref) => {

    const { showToast } = useToast();
    const [customerTypes, setCustomerTypes] = useState([]);
    const [status, setStatus] = useState([]);
    const [customerSupply, setCustomerSupply] = useState([]);
    const [responsiblePersons, setResponsiblePersons] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [apiErrors, setApiErrors] = useState({});
    const validatedFormRef = useRef();
    const valuesRef = useRef({ ...initialForm });
    const initialDataRef = useRef(initialData);

    // Customer Contact Details state
    const [customerContacts, setCustomerContacts] = useState([]);
    const [contactErrors, setContactErrors] = useState({}); // { rowIndex: { field: "error" } }
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);
    const contactNameRefs = useRef([]); // per-row ref for Contact Name input
    const newContactIndexRef = useRef(null); // Track index of newly added contact for auto-focus
    const initialContactsRef = useRef([]); // Store initial contacts for dirty tracking

    const toDateOnly = useCallback((v) => {
      if (!v) return "";
      const s = String(v);
      if (s.includes("T")) return s.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
    }, []);

    const normalizeCustomerTypeValue = useCallback((v) => {
      if (v == null) return "";
      const s = String(v);
      return s === "0" ? "" : s;
    }, []);

    const normalizeCustomerSupplyValue = useCallback((v) => {
      if (v == null || v === "") return "";
      const s = String(v).trim();
      // Return empty string for "0" or empty values to show placeholder
      return s === "0" || s === "" ? "" : s;
    }, []);

    const normalizeResponsiblePersonValue = useCallback((v) => {
      if (v == null || v === "") return "";
      const numValue = Number(v);
      // Return empty string for 0, null, or invalid values to show placeholder
      return numValue > 0 ? String(numValue) : "";
    }, []);

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

    const customerTypeOptions = useMemo(() => {
      const arr = asArray(customerTypes);
      return Array.isArray(arr)
        ? arr.map((dept) => ({
          value: getOptValue(dept),
          label: getOptLabel(dept),
        }))
        : [];
    }, [customerTypes, asArray, getOptValue, getOptLabel]);

    const statusOptions = useMemo(() => {
      const arr = asArray(status);
      const allOptions = Array.isArray(arr)
        ? arr.map((s) => ({
          value: getOptValue(s),
          label: getOptLabel(s),
        }))
        : [];


      return allOptions.filter((opt) => {
        const label = String(opt.label || "").toLowerCase().trim();
        const value = String(opt.value || "").trim();

        const isInactiveLabel = label.includes("inactive");
        const isActiveLabel = label.includes("active") && !isInactiveLabel;

        const numValue = Number(value);
        const isActiveValue = numValue === 1;
        const isInactiveValue = numValue === 0;

        return isActiveLabel || isInactiveLabel || isActiveValue || isInactiveValue;
      });
    }, [status, asArray, getOptValue, getOptLabel]);

    const customerSupplyOptions = useMemo(() => {
      const arr = asArray(customerSupply);
      return Array.isArray(arr)
        ? arr.map((item) => ({
          value: getOptValue(item),
          label: getOptLabel(item),
        }))
        : [];
    }, [customerSupply, asArray, getOptValue, getOptLabel]);

    // Helper to find option by value or label (for API text matching)
    // const findCustomerSupplyOption = useCallback((value, text) => {
    //   if (!value && !text) return null;
    //   return customerSupplyOptions.find(
    //     (opt) =>
    //       (value && String(opt.value || "").trim() === String(value).trim()) ||
    //       (text && String(opt.label || "").trim() === String(text).trim())
    //   );
    // }, [customerSupplyOptions]);

    const responsiblePersonOptions = useMemo(() => {
      const arr = asArray(responsiblePersons);
      return Array.isArray(arr)
        ? arr.map((item) => ({
          value: getOptValue(item),
          label: getOptLabel(item),
        }))
        : [];
    }, [responsiblePersons, asArray, getOptValue, getOptLabel]);

    // Helper to find option by value or label (for API text matching)
    // const findResponsiblePersonOption = useCallback((value, text) => {
    //   if (!value && !text) return null;
    //   return responsiblePersonOptions.find(
    //     (opt) =>
    //       (value && String(opt.value || "").trim() === String(value).trim()) ||
    //       (text && String(opt.label || "").trim() === String(text).trim())
    //   );
    // }, [responsiblePersonOptions]);

    const formValidation = useMemo(() => {
      return validation;
    }, []);

    useEffect(() => {
      let isMounted = true;

      const loadCustomerType = async () => {
        try {
          const customerTypeData = await getCustomerType();
          const customerTypeArr = asArray(customerTypeData);
          if (isMounted) {
            setCustomerTypes(customerTypeArr);
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
          } else {
            console.error("Failed to fetch Customer Type", error);
            if (showToast) showToast("Failed to load Customer Type", ERROR_STATUS.toLowerCase());
          }
        }
      };

      loadCustomerType();
      return () => {
        isMounted = false;
      };
    }, [showToast, asArray]);

    useEffect(() => {
      let isMounted = true;

      const loadStatus = async () => {
        try {
          const statusData = await getStatusOptions();
          const statusArr = asArray(statusData);

          if (isMounted) {
            setStatus(statusArr);
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
          } else {
            console.error("Failed to fetch status", error);
            if (showToast) showToast("Failed to load status", ERROR_STATUS.toLowerCase());
          }
        }
      };

      loadStatus();
      return () => {
        isMounted = false;
      };
    }, [showToast, asArray]);

    useEffect(() => {
      let isMounted = true;

      const loadCustomerSupply = async () => {
        try {
          const supplyData = await getCustomerSupply();
          const supplyArr = asArray(supplyData);

          if (isMounted) {
            setCustomerSupply(supplyArr);
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
          } else {
            console.error("Failed to fetch Customer Supply", error);
            if (showToast) showToast("Failed to load Customer Supply", ERROR_STATUS.toLowerCase());
          }
        }
      };

      loadCustomerSupply();
      return () => {
        isMounted = false;
      };
    }, [showToast, asArray]);
    useEffect(() => {
      let isMounted = true;
      const loadResponsiblePerson = async () => {
        try {
          const responsiblePersonData = await getResponsiblePerson();
          const responsiblePersonArr = asArray(responsiblePersonData);
          if (isMounted) {
            setResponsiblePersons(responsiblePersonArr);
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
          } else {
            console.error("Failed to fetch Responsible Person", error);
            if (showToast) showToast("Failed to load Responsible Person", ERROR_STATUS.toLowerCase());
          }
        }
      };
      loadResponsiblePerson();
      return () => {
        isMounted = false;
      };
    }, [showToast, asArray]);

    // Update ref when initialData changes
    useEffect(() => {
      if (initialData) {
        initialDataRef.current = initialData;
      }
    }, [initialData]);

    const initialValues = useMemo(() => {
      // Use ref as fallback to ensure data is always available
      const dataToUse = initialData || initialDataRef.current;

      if (dataToUse) {
        // Map API response fields to component fields
        const iv = {
          customerID: dataToUse.customerID || dataToUse.customer_id || 0,
          customerName: dataToUse.customerName || dataToUse.customer_name || "",
          customerAddress1: dataToUse.customerAddress1 || dataToUse.customer_primary_address_line1 || dataToUse.customer_address1 || "",
          customerAddress2: dataToUse.customerAddress2 || dataToUse.customer_primary_address_line2 || dataToUse.customer_address2 || "",
          customerPincode: dataToUse.customerPincode || dataToUse.customer_pin_code || "",
          customerType: normalizeCustomerTypeValue(
            dataToUse.customerType != null
              ? String(dataToUse.customerType)
              : (dataToUse.customer_type != null ? String(dataToUse.customer_type) : "")
          ),
          customerWebsite: dataToUse.customerWebsite || dataToUse.customer_website || "",
          gstinNumber: dataToUse.gstinNumber || dataToUse.gstin_number || "",
          panNumber: dataToUse.panNumber || dataToUse.pan_number || "",
          customerStatus:
            dataToUse.customerStatus != null
              ? String(dataToUse.customerStatus)
              : dataToUse.customer_status != null
                ? String(dataToUse.customer_status)
                : "1",
          customerSupply: normalizeCustomerSupplyValue(
            (dataToUse.customerSupply !== undefined && dataToUse.customerSupply !== null)
              ? String(dataToUse.customerSupply)
              : (dataToUse.customer_supply !== undefined && dataToUse.customer_supply !== null
                ? String(dataToUse.customer_supply)
                : "")
          ),
          responsiblePersonID: normalizeResponsiblePersonValue(
            (dataToUse.responsiblePersonID !== undefined && dataToUse.responsiblePersonID !== null)
              ? String(dataToUse.responsiblePersonID)
              : (dataToUse.responsible_person_id !== undefined && dataToUse.responsible_person_id !== null
                ? String(dataToUse.responsible_person_id)
                : ""),
          ),
          // Store text values for fallback matching
          customerSupplyText: dataToUse.customer_supply_text || dataToUse.customerSupplyText || "",
          responsiblePersonName: dataToUse.responsible_person_name || dataToUse.responsiblePersonName || "",
          entryDate: toDateOnly(
            dataToUse.entryDate ||
            dataToUse.EntryDate ||
            dataToUse.prep_date ||
            dataToUse.prepDate
          ),
          updatedDate: toDateOnly(
            dataToUse.updatedDate ||
            dataToUse.UpdatedDate ||
            dataToUse.update_date ||
            dataToUse.updateDate
          ),
          preparedBy: dataToUse.preparedBy || dataToUse.PreparedBy || dataToUse.prep_by || getPreparedBy(),
          updatedBy: dataToUse.updatedBy || dataToUse.UpdatedBy || dataToUse.update_by || "",
          paramType: PARAM_TYPE_ADD,
        };

        valuesRef.current = iv;
        return iv;
      }

      const iv = {
        ...initialForm,
        customerStatus: String(initialForm.customerStatus ?? "1"),
        customerType: normalizeCustomerTypeValue(initialForm.customerType),
        customerID: 0,
        entryDate: toDateOnly(initialForm.entryDate),
        updatedDate: "",
        preparedBy: getPreparedBy(),
        paramType: "Insert",
      };

      valuesRef.current = iv;
      return iv;
    }, [initialData, toDateOnly, normalizeCustomerTypeValue, normalizeResponsiblePersonValue, normalizeCustomerSupplyValue]); // initialData is the primary dependency, ref is fallback

    const DRAFT_KEY = "draft_customer_master_create_v2"; // Form fields draft key
    const CONTACTS_DRAFT_KEY = "draft_customer_contacts_create_v2"; // Contacts draft key

    const { isDirty, onValuesChange, resetDirty } = useDirtyDraftDrawer({
      open: true,
      initialValues,
      initialData,
      draftKey: DRAFT_KEY,
    });

    const isInitialLoadRef = useRef(true);

    // Initial draft load for contacts (fields are handled by ValidatedForm)
    useEffect(() => {
      if (initialData) {
        isInitialLoadRef.current = false;
        return;
      }

      const loadDraftData = () => {
        let draftLoaded = false;
        try {
          const raw = localStorage.getItem(CONTACTS_DRAFT_KEY);
          if (raw) {
            const draft = JSON.parse(raw);
            if (Array.isArray(draft)) {
              setCustomerContacts(draft);
              initialContactsRef.current = JSON.parse(JSON.stringify(draft));
              draftLoaded = true;
            }
          }
        } catch (e) {
          console.error("Failed to load customer contacts draft", e);
        } finally {
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 500);
        }

        if (!draftLoaded) {
          setCustomerContacts([]);
          initialContactsRef.current = [];
        }
      };

      loadDraftData();
    }, [initialData]);

    // Background draft saving for contacts
    useEffect(() => {
      if (initialData || isInitialLoadRef.current) return;

      try {
        localStorage.setItem(CONTACTS_DRAFT_KEY, JSON.stringify(customerContacts));
      } catch (e) {
        console.error("Failed to save customer contacts draft", e);
      }
    }, [customerContacts, initialData]);

    const onValuesChangeNormalized = useCallback(
      (nextValues) => {
        const safe = nextValues || {};
        const normalized = {
          ...safe,
          customerType: normalizeCustomerTypeValue(safe.customerType),
        };

        valuesRef.current = normalized;
        onValuesChange && onValuesChange(normalized);
      },
      [onValuesChange, normalizeCustomerTypeValue]
    );

    // Check if customer contacts have changed from initial state
    const areContactsDirty = useCallback(() => {
      try {
        const currentContacts = JSON.stringify(customerContacts);
        const initialContacts = JSON.stringify(initialContactsRef.current);
        return currentContacts !== initialContacts;
      } catch {
        // If comparison fails, consider not dirty to avoid blocking UX
        return false;
      }
    }, [customerContacts]);

    // Combined dirty state: form dirty OR contacts dirty
    const combinedIsDirty = isDirty || areContactsDirty();

    useEffect(() => {
      if (onDirtyChange) onDirtyChange(combinedIsDirty);
    }, [combinedIsDirty, onDirtyChange]);

    // ========== Customer Contact Details Functions ==========

    useEffect(() => {
      if (!initialData) return;
      let isMounted = true;

      // Check multiple possible locations for contact data
      const contactList =
        initialData?.customerContacts ||
        initialData?.CUSTOMER_CONTACT_MASTER_DETAILS ||
        (initialData?.data?.CUSTOMER_CONTACT_MASTER_DETAILS) ||
        [];

      if (isMounted && Array.isArray(contactList) && contactList.length > 0) {
        // Map API response to component state structure
        const mappedContacts = contactList.map((contact) => ({
          slNo: contact.customer_contact_id || contact.customerContactID || null,
          customerContactID: contact.customer_contact_id || contact.customerContactID || null,
          customerID: contact.customer_id || contact.customerID || initialData?.customerID || initialData?.customer_id || null,
          contactName: contact.contact_name || contact.contactName || "",
          phoneNumber: contact.phone_number || contact.phoneNumber || "",
          mobileNumber: contact.mobile_number || contact.mobileNumber || "",
          designation: contact.designation || "",
          email: contact.email || "",
          city: contact.city || "",
          country: contact.country || DEFAULT_COUNTRY,
          isPrimary: contact.is_primary?.toLowerCase() === YES_VALUE.toLowerCase() ||
            contact.is_primary === true ||
            contact.isPrimary === true ||
            String(contact.is_primary || "").toUpperCase() === YES_VALUE,
          preparedBy: contact.prep_by || contact.preparedBy || getPreparedBy(),
          preparedDate: contact.prep_date ? toDateOnly(contact.prep_date) : (contact.preparedDate ? toDateOnly(contact.preparedDate) : today),
          updatedBy: contact.update_by || contact.updatedBy || "",
          updatedDate: contact.update_date ? toDateOnly(contact.update_date) : (contact.updatedDate ? toDateOnly(contact.updatedDate) : ""),
        }));

        setCustomerContacts(mappedContacts);
        // Store initial contacts for dirty tracking
        initialContactsRef.current = JSON.parse(JSON.stringify(mappedContacts));
      } else if (isMounted) {
        setCustomerContacts([]);
        // Store empty array as initial state
        initialContactsRef.current = [];
      }

      return () => {
        isMounted = false;
      };
    }, [initialData, toDateOnly]);

    // Validate contact field
    const validateContactField = useCallback((rowIndex, field, value) => {
      const errors = { ...contactErrors };
      if (!errors[rowIndex]) errors[rowIndex] = {};

      // Required field validation
      if (field === "contactName") {
        if (!value || String(value).trim() === "") {
          errors[rowIndex][field] = "Required*";
        } else {
          delete errors[rowIndex][field];
        }
      }

      // Phone validation: should be exactly 10 digits
      // if (field === "phoneNumber") {
      //   if (value && String(value).trim() !== "") {
      //     const phoneStr = String(value).trim().replace(/[\s-]/g, "");
      //     if (!/^\d{10}$/.test(phoneStr)) {
      //       errors[rowIndex][field] = "Phone number must be exactly 10 digits";
      //     } else {
      //       delete errors[rowIndex][field];
      //     }
      //   } else {
      //     delete errors[rowIndex][field];
      //   }
      // }

      // Mobile validation: should be exactly 10 digits
      if (field === "mobileNumber") {
        if (value && String(value).trim() !== "") {
          const mobileStr = String(value).trim().replace(PHONE_STRIP_REGEX, "");
          if (!MOBILE_REGEX.test(mobileStr)) {
            errors[rowIndex][field] = "Mobile number must be exactly 10 digits";
          } else {
            delete errors[rowIndex][field];
          }
        } else {
          delete errors[rowIndex][field];
        }
      }

      // Email validation: should be valid email format
      if (field === "email") {
        if (value && String(value).trim() !== "") {
          const emailStr = String(value).trim();
          if (!EMAIL_REGEX.test(emailStr)) {
            errors[rowIndex][field] = "Please enter a valid email address";
          } else {
            delete errors[rowIndex][field];
          }
        } else {
          delete errors[rowIndex][field];
        }
      }

      // Clean up empty error objects
      if (Object.keys(errors[rowIndex]).length === 0) {
        delete errors[rowIndex];
      }

      setContactErrors(errors);
    }, [contactErrors]);

    // Handle contact field change
    const handleContactFieldChange = useCallback((rowIndex, field, value) => {
      const updated = [...customerContacts];
      // const contact = updated[rowIndex];

      // Special handling for "isPrimary" checkbox - only one can be checked
      if (field === "isPrimary" && value === true) {
        // Uncheck all other rows
        updated.forEach((contact, idx) => {
          if (idx !== rowIndex) {
            updated[idx] = { ...contact, isPrimary: false };
          }
        });
        updated[rowIndex] = {
          ...updated[rowIndex],
          [field]: value,
        };
      } else {
        updated[rowIndex] = {
          ...updated[rowIndex],
          [field]: value,
        };
      }

      setCustomerContacts(updated);
      validateContactField(rowIndex, field, value);
    }, [customerContacts, validateContactField]);

    // Add new contact
    const handleAddContact = useCallback(() => {
      console.log("[Customer Contact] handleAddContact called");
      const newContact = {
        slNo: null,
        contactName: "",
        phoneNumber: "",
        mobileNumber: "",
        designation: "",
        email: "",
        city: "",
        country: DEFAULT_COUNTRY, // Default value
        isPrimary: false,
        preparedBy: getPreparedBy(),
        preparedDate: today,
        updatedBy: "",
        updatedDate: "",
      };

      console.log("[Customer Contact] New contact object created:", newContact);

      // Insert new rows at the top so they appear before existing records
      setCustomerContacts((prev) => {
        console.log("[Customer Contact] Previous contacts count:", prev?.length || 0);
        newContactIndexRef.current = 0;
        const updated = [newContact, ...(prev || [])];
        console.log("[Customer Contact] Updated contacts count:", updated.length);
        return updated;
      });
    }, []);

    // After adding a new contact, auto-focus the Contact Name field of that new row
    useEffect(() => {
      if (!editMode) return;
      const idx = newContactIndexRef.current;
      if (idx === null || idx === undefined) return;
      const el = contactNameRefs.current[idx];
      if (el && typeof el.focus === "function") {
        try {
          el.focus();
          if (typeof el.select === "function") el.select();
        } catch {
          // ignore focus errors
        }
      }
      newContactIndexRef.current = null;
    }, [customerContacts.length, editMode]);

    // Perform actual deletion of contact
    const performDeleteContact = useCallback((rowIndex) => {
      const updated = customerContacts.filter((_, idx) => idx !== rowIndex);
      setCustomerContacts(updated);

      // Clean up errors for deleted row
      const errors = { ...contactErrors };
      delete errors[rowIndex];

      // Reindex errors for rows after deleted one
      const reindexed = {};
      Object.keys(errors).forEach((key) => {
        const idx = Number(key);
        if (idx > rowIndex) {
          reindexed[idx - 1] = errors[key];
        } else {
          reindexed[key] = errors[key];
        }
      });
      setContactErrors(reindexed);
    }, [customerContacts, contactErrors]);

    // Show confirmation dialog before deleting contact
    const handleDeleteContact = useCallback((rowIndex) => {
      const contact = customerContacts[rowIndex];
      if (contact) {
        setContactToDelete({
          index: rowIndex,
          contactName: contact.contactName || "this contact",
        });
        setShowDeleteConfirm(true);
      }
    }, [customerContacts]);

    const confirmDeleteContact = useCallback(() => {
      if (
        contactToDelete?.index === undefined ||
        contactToDelete.index === null
      ) {
        return;
      }
      performDeleteContact(contactToDelete.index);
      setShowDeleteConfirm(false);
      setContactToDelete(null);
    }, [contactToDelete, performDeleteContact]);

    const cancelDeleteContact = useCallback(() => {
      setShowDeleteConfirm(false);
      setContactToDelete(null);
    }, []);

    // Validate all contacts before submit
    const validateAllContacts = useCallback(() => {
      const errors = {};

      // If contacts exist, at least one must be primary
      if (customerContacts.length > 0) {
        const hasPrimary = customerContacts.some((contact) => contact.isPrimary === true);
        if (!hasPrimary) {
          // Set error on first contact to indicate primary is required
          if (!errors[0]) errors[0] = {};
          errors[0].isPrimary = "At least one contact must be marked as primary";
        }
      }

      customerContacts.forEach((contact, idx) => {
        const rowErrors = errors[idx] || {};

        // Required: Contact Name
        if (!contact.contactName || String(contact.contactName).trim() === "") {
          rowErrors.contactName = "Required*";
        }

        // Phone: exactly 10 digits if provided
        // if (contact.phoneNumber && String(contact.phoneNumber).trim() !== "") {
        //   const phoneStr = String(contact.phoneNumber).trim().replace(/[\s-]/g, "");
        //   if (!/^\d{10}$/.test(phoneStr)) {
        //     rowErrors.phoneNumber = "Phone number must be exactly 10 digits";
        //   }
        // }

        // Mobile: exactly 10 digits if provided
        if (contact.mobileNumber && String(contact.mobileNumber).trim() !== "") {
          const mobileStr = String(contact.mobileNumber).trim().replace(PHONE_STRIP_REGEX, "");
          if (!MOBILE_REGEX.test(mobileStr)) {
            rowErrors.mobileNumber = "Mobile number must be exactly 10 digits";
          }
        }

        // Email: basic format check if provided
        if (contact.email && String(contact.email).trim() !== "") {
          const emailStr = String(contact.email).trim();
          if (!EMAIL_REGEX.test(emailStr)) {
            rowErrors.email = "Please enter a valid email address";
          }
        }

        if (Object.keys(rowErrors).length > 0) {
          errors[idx] = rowErrors;
        }
      });

      setContactErrors(errors);
      return Object.keys(errors).length === 0;
    }, [customerContacts]);

    const handleSubmit = useCallback(
      async (values) => {
        setApiErrors({});

        // Validate all contacts before submit (only if contacts exist)
        if (customerContacts.length > 0 && !validateAllContacts()) {
          showToast("Please fix contact details validation errors", ERROR_STATUS.toLowerCase());
          return;
        }

        // Collect all client-side validation errors together
        const clientValidationErrors = {};

        // Validate Pincode (optional - only validate if value exists)
        if (values.customerPincode && String(values.customerPincode).trim() !== "") {
          const PinCodeError = CustomValidateField(
            "Pincode",
            values.customerPincode,
            "Enter The Valid Pincode."
          );
          if (PinCodeError) {
            clientValidationErrors.customerPincode = PinCodeError;
          }
        }

        // Validate GSTIN Number (accepts "URP" or valid 15-character GSTIN)
        const gstinValue = String(values.gstinNumber || "").trim().toUpperCase();
        let gstinNumberError = "";

        if (gstinValue === "URP") {
          // "URP" is a valid value, no error
          gstinNumberError = "";
        } else if (gstinValue) {
          // Validate as regular GSTIN
          gstinNumberError = CustomValidateField(
            "GSTNumber",
            values.gstinNumber,
            "Enter The Valid GSTIN Number or URP."
          );
        }

        if (gstinNumberError) {
          clientValidationErrors.gstinNumber = gstinNumberError;
        }

        // Validate PAN Number
        const PANNumberError = CustomValidateField(
          "PANNumber",
          values.panNumber,
          "Enter The Valid PAN Number."
        );
        if (PANNumberError) {
          clientValidationErrors.panNumber = PANNumberError;
        }

        // Validate Website
        const WebSiteError = CustomValidateField(
          "Website",
          values.customerWebsite,
          "Enter The Valid Customer Website."
        );
        if (WebSiteError) {
          clientValidationErrors.customerWebsite = WebSiteError;
        }

        // If there are any validation errors, set them all at once and return
        if (Object.keys(clientValidationErrors).length > 0) {
          setApiErrors(clientValidationErrors);
          return;
        }

        // Prepare supplier base data
        const customerID = initialData ? Number(initialData.customerID || 0) : 0;
        const paramType = PARAM_TYPE_ADD;


        const customerContactMaster = customerContacts.length > 0
          ? customerContacts.map((contact) => ({
            customerContactID: contact.customerContactID && Number(contact.customerContactID) > 0
              ? Number(contact.customerContactID)
              : 0,
            customerID: customerID, // Will be updated with returned ID if new customer
            contactName: String(contact.contactName || "").trim(),
            phoneNumber: String(contact.phoneNumber || "").trim(),
            mobileNumber: String(contact.mobileNumber || "").trim(),
            designation: String(contact.designation || "").trim(),
            email: String(contact.email || "").trim(),
            isPrimary: contact.isPrimary === true ? YES_VALUE : NO_VALUE, // Convert boolean to "Y"/"N"
            preparedBy: contact.preparedBy || getPreparedBy(),
            updatedBy: getPreparedBy(), // Always use current user when saving
            paramType: PARAM_TYPE_ADD, // Always "ADD" for contacts in unified API
          }))
          : []; // Empty array if no contacts


        const submitValues = {
          customerID: customerID,
          customerName: String(values.customerName || "").trim(),
          customerPrimaryAddressLine1: String(values.customerAddress1 || "").trim(),
          customerPrimaryAddressLine2: String(values.customerAddress2 || "").trim(),
          customerPinCode: String(values.customerPincode || "").trim(),
          customerType: normalizeCustomerTypeValue(values.customerType)
            ? Number(values.customerType)
            : 0,
          customerWebsite: String(values.customerWebsite || "").trim(),
          gstinNumber: String(values.gstinNumber || "").trim(),
          panNumber: String(values.panNumber || "").trim(),
          customerStatus: values.customerStatus
            ? Number(values.customerStatus)
            : 0,
          customerSupply: String(values.customerSupply || "").trim(), // Optional field
          responsiblePersonID: Number(values.responsiblePersonID || 0), // Optional field, default 0
          preparedBy: getPreparedBy(),
          updatedBy: getPreparedBy(),
          customerContactMaster: customerContactMaster, // Contacts array (can be empty)
          paramType: paramType, // "ADD" for insert, "UPDATE" for update
        };

        setSubmitting(true);
        try {
          const apiResult = await saveAndUpdateCustomer(submitValues);
          const validationErrors = apiResult?.data?.ValidationErrors;
          const supplierMessages = apiResult?.data?.CUSTOMER_MASTER_RESPONSE;
          const status = apiResult?.Status || apiResult?.status;

          if (handleApiValidationErrors(validationErrors, showToast)) {
            return;
          }

          let message = "";
          if (supplierMessages?.length > 0) {
            message += supplierMessages.map((e) => e.Message).join(" ");
          }

          if (message) {
            const toastType =
              status === SUCCESS_STATUS || status === MESSAGE_OK || status === STATUS_UNKNOWN ? SUCCESS_STATUS : ERROR_STATUS.toLowerCase();
            if (showToast) showToast(message.trim(), toastType);
            if (toastType === ERROR_STATUS.toLowerCase()) return;
          }

          if (status === SUCCESS_STATUS || status === MESSAGE_OK || status === STATUS_UNKNOWN) {
            // Get customer ID from response (for new customers) or use existing
            // API returns ID as string, convert to number
            const returnedCustomerID = supplierMessages?.[0]?.ID
              ? Number(supplierMessages[0].ID)
              : customerID;

            // Update contact customerIDs if customer was newly created
            if (returnedCustomerID > 0 && returnedCustomerID !== customerID && customerContacts.length > 0) {
              setCustomerContacts((prev) =>
                prev.map((contact) => ({
                  ...contact,
                  customerID: returnedCustomerID,
                }))
              );
            }

            // Fetch updated customer details
            if (returnedCustomerID > 0) {
              try {
                const detailsRes = await fetchCustomerDetails(returnedCustomerID);
                const details =
                  detailsRes?.data?.CUSTOMER_MASTER_DETAILS?.[0] ?? null;
                const contactDetails =
                  detailsRes?.data?.CUSTOMER_CONTACT_MASTER_DETAILS || [];

                if (details) {
                  // Include contact details in the response
                  const responseData = {
                    ...details,
                    customerContacts: contactDetails,
                    CUSTOMER_CONTACT_MASTER_DETAILS: contactDetails,
                  };
                  onSuccess && onSuccess(responseData);
                } else {
                  // Fallback: pass submitValues with mapped fields
                  onSuccess && onSuccess({
                    customer_id: returnedCustomerID,
                    customerID: returnedCustomerID,
                    ID: returnedCustomerID,
                    customer_name: submitValues.customerName,
                    customerName: submitValues.customerName,
                    customer_primary_address_line1: submitValues.customerAddress1,
                    customer_primary_address_line2: submitValues.customerAddress2,
                    customer_pin_code: submitValues.customerPincode,
                    customer_type: submitValues.customerType,
                    customer_website: submitValues.customerWebsite,
                    gstin_number: submitValues.gstinNumber,
                    pan_number: submitValues.panNumber,
                    customer_status: submitValues.customerStatus,
                    ...submitValues,
                  });
                }
              } catch {
                // Fallback: pass submitValues with mapped fields
                onSuccess && onSuccess({
                  customer_id: returnedCustomerID,
                  customerID: returnedCustomerID,
                  ID: returnedCustomerID,
                  customer_name: submitValues.customerName,
                  customerName: submitValues.customerName,
                  customer_primary_address_line1: submitValues.customerAddress1,
                  customer_primary_address_line2: submitValues.customerAddress2,
                  customer_pin_code: submitValues.customerPincode,
                  customer_type: submitValues.customerType,
                  customer_website: submitValues.customerWebsite,
                  gstin_number: submitValues.gstinNumber,
                  pan_number: submitValues.panNumber,
                  customer_status: submitValues.customerStatus,
                  ...submitValues,
                });
              }
            } else {
              // Fallback: pass submitValues with mapped fields
              onSuccess && onSuccess({
                customer_id: submitValues.customerID,
                customerID: submitValues.customerID,
                customer_name: submitValues.customerName,
                customerName: submitValues.customerName,
                customer_primary_address_line1: submitValues.customerAddress1,
                customer_primary_address_line2: submitValues.customerAddress2,
                customer_pin_code: submitValues.customerPincode,
                customer_type: submitValues.customerType,
                customer_website: submitValues.customerWebsite,
                gstin_number: submitValues.gstinNumber,
                pan_number: submitValues.panNumber,
                customer_status: submitValues.customerStatus,
                ...submitValues,
              });
            }

            // Reset initial contacts baseline after successful save
            initialContactsRef.current = JSON.parse(JSON.stringify(customerContacts));

            // Clear draft from localStorage on success
            try {
              localStorage.removeItem(DRAFT_KEY);
              localStorage.removeItem(CONTACTS_DRAFT_KEY);
            } catch (e) {
              console.error("Failed to clear drafts after successful save", e);
            }

            onClose && onClose();
            if (onDirtyChange) onDirtyChange(false);
          } else {
            if (showToast) showToast("Failed to save Customer Master", ERROR_STATUS.toLowerCase());
          }
        } catch (err) {
          if (err?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
            return;
          }
          const msg = err?.message || "Error saving Customer Master";
          if (showToast) showToast(msg, ERROR_STATUS.toLowerCase());
          else alert(msg);
        } finally {
          setSubmitting(false);
        }
      },
      [
        initialData,
        onClose,
        onSuccess,
        onDirtyChange,
        showToast,
        normalizeCustomerTypeValue,
        validateAllContacts,
        customerContacts,
      ]
    );

    useImperativeHandle(ref, () => ({
      submit: () => {
        const current = valuesRef.current || {};
        const st = normalizeCustomerTypeValue(current.customerType);
        const supplyValue = normalizeCustomerSupplyValue(current.customerSupply);

        if (!st) {
          setApiErrors((prev) => ({
            ...(prev || {}),
            customerType: "Select The Customer Type.",
          }));
        } else {
          // Clear customerType error if valid
          setApiErrors((prev) => {
            if (
              !prev ||
              !Object.prototype.hasOwnProperty.call(prev, "customerType")
            )
              return prev;
            const next = { ...prev };
            delete next.customerType;
            return next;
          });
        }

        if (!supplyValue) {
          setApiErrors((prev) => ({
            ...(prev || {}),
            customerSupply: "Select The Customer Supply.",
          }));
        } else {
          // Clear customerSupply error if valid
          setApiErrors((prev) => {
            if (
              !prev ||
              !Object.prototype.hasOwnProperty.call(prev, "customerSupply")
            )
              return prev;
            const next = { ...prev };
            delete next.customerSupply;
            return next;
          });
        }

        const responsiblePersonValue = normalizeResponsiblePersonValue(current.responsiblePersonID);
        if (!responsiblePersonValue) {
          setApiErrors((prev) => ({
            ...(prev || {}),
            responsiblePersonID: "Select The Responsible Person.",
          }));
        } else {
          // Clear responsiblePersonID error if valid
          setApiErrors((prev) => {
            if (
              !prev ||
              !Object.prototype.hasOwnProperty.call(prev, "responsiblePersonID")
            )
              return prev;
            const next = { ...prev };
            delete next.responsiblePersonID;
            return next;
          });
        }

        validatedFormRef.current?.submitForm?.();
      },
      saveDraft: () => {
        if (initialData) return;
        try {
          // Contacts saving
          localStorage.setItem(CONTACTS_DRAFT_KEY, JSON.stringify(customerContacts));

          // Form fields saving (ValidatedForm usually does this, but we force it here)
          localStorage.setItem(DRAFT_KEY, JSON.stringify(valuesRef.current));

          if (showToast) showToast("Draft saved successfully", SUCCESS_STATUS);
        } catch (e) {
          console.error("Failed to manual save draft", e);
        }
      },
      clearDraft: () => {
        try {
          localStorage.removeItem(DRAFT_KEY);
          localStorage.removeItem(CONTACTS_DRAFT_KEY);
          resetDirty?.();
          validatedFormRef.current?.clearDraft?.();
        } catch {
          /* no-op */
        }
      },
      loadDraft: () => {
        try {
          const contactRaw = localStorage.getItem(CONTACTS_DRAFT_KEY);
          if (contactRaw) {
            const parsed = JSON.parse(contactRaw);
            if (Array.isArray(parsed)) setCustomerContacts(parsed);
          }
          validatedFormRef.current?.loadDraft?.();
        } catch {
          /* no-op */
        }
      },
      hasUnsavedChanges: () => combinedIsDirty,
      confirmClose: () => {
        if (initialData && editMode && combinedIsDirty) {
          return window.confirm(
            "You have unsaved changes. Do you want to save them before leaving?"
          );
        }
        return true;
      },
    }));

    const isDisabled = initialData ? !editMode : false;

    // ========== Customer Contact Details Functions ==========


    const clearFieldError = useCallback((fieldName) => {
      if (!fieldName) return;
      setApiErrors((prev) => {
        if (!prev || !Object.prototype.hasOwnProperty.call(prev, fieldName))
          return prev;
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }, []);

    return (
      <div className="customer-master-form-wrapper">
        <FullPageLoader
          loading={submitting}
          message="Saving customer master..."
          logoSrc={inspireLogo}
        />
        <ValidatedForm
          ref={validatedFormRef}
          initialValues={initialValues}
          validation={formValidation}
          onSubmit={handleSubmit}
          onValuesChange={onValuesChangeNormalized}
          enableDraft={!initialData}
          draftKey={DRAFT_KEY}
          clearDraftOnSubmit
        >
          {({ values, errors, handleChange, handleBlur }) => {
            valuesRef.current = values;

            return (
              <>
                <div>
                  {/* Row 1 */}
                  <div className="row mb-2">
                    <div className="col-md-3">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ flexGrow: 1 }}>
                          <FormField
                            label="Customer Name"
                            name="customerName"
                            maxLength={25}
                            value={values.customerName}
                            onChange={(e) => {
                              e.target.value = (
                                e.target.value || ""
                              ).toUpperCase();
                              handleChange(e);
                            }}
                            onBlur={async (e) => {
                              handleBlur(e);

                              const customerName = e.target.value?.trim();
                              if (!customerName) return;

                              try {
                                const { message } =
                                  await checkCustomerNameExist(customerName);

                                if (
                                  message &&
                                  message !== "No Data Available !!!"
                                ) {
                                  // Duplicate detected: clear field and show error
                                  handleChange({
                                    target: { name: "customerName", value: "" },
                                  });
                                  showToast(message, ERROR_STATUS.toLowerCase());
                                }
                              } catch (error) {
                                console.error(
                                  "Error checking customer name:",
                                  error
                                );
                                showToast(
                                  "Failed to validate customer name. Please try again.",
                                  ERROR_STATUS.toLowerCase()
                                );
                              }
                            }}
                            error={
                              errors.customerName || apiErrors.customerName
                            }
                            required
                            disabled={isDisabled || (!!initialData && editMode)}
                          />
                        </div>

                        <CopyButton
                          text={values.customerName}
                          tooltip="By clicking this Customer Name will be copied and you can paste it wherever you want."
                        />
                      </div>
                    </div>

                    <div className="col-md-3">
                      <ReactSelectField
                        label="Customer Type"
                        name="customerType"
                        options={customerTypeOptions}
                        value={normalizeCustomerTypeValue(values.customerType)}
                        onChange={(e) => {
                          // Clear API errors immediately
                          clearFieldError("customerType");
                          // Update the value - handleChange will validate immediately
                          handleChange(e);
                          // If a valid value is selected, ensure validation passes
                          // by re-validating after the value is set in form state
                          const selectedValue = e.target.value;
                          if (selectedValue && selectedValue !== "" && String(selectedValue) !== "0") {
                            // Value is valid, trigger validation to clear any errors
                            // Use setTimeout to ensure form state is updated first
                            setTimeout(() => {
                              handleBlur({ target: { name: "customerType", value: selectedValue } });
                            }, 100);
                          }
                        }}
                        onBlur={() => {
                          // Validate with current form value
                          handleBlur({ target: { name: "customerType", value: values.customerType } });
                        }}
                        required
                        onFocus={() => clearFieldError("customerType")}
                        placeholder="Select Customer Type"
                        disabled={isDisabled}
                        error={errors.customerType || apiErrors.customerType}
                      />
                    </div>
                    <div className="col-md-3">
                      <FormField
                        label="GSTIN Number"
                        name="gstinNumber"
                        value={values.gstinNumber || ""}
                        required
                        onChange={(e) => {
                          const input = e.target;
                          const cursorPosition = input.selectionStart;
                          const originalValue = input.value;

                          let inputValue = e.target.value;

                          // Convert to uppercase and filter non-alphanumeric
                          inputValue = inputValue.toUpperCase().replace(/[^0-9A-Z]/g, '');

                          // Allow "URP" as a complete valid value (exactly 3 characters)
                          // If user types "URP", keep it as is (3 chars max)
                          if (inputValue.startsWith("URP")) {
                            inputValue = inputValue.substring(0, 3); // Limit to "URP" only
                          }
                          // Limit to 15 characters for regular GSTIN
                          else if (inputValue.length > 15) {
                            inputValue = inputValue.substring(0, 15);
                          }


                          const beforeCursor = originalValue.substring(0, cursorPosition);
                          const validBeforeCursor = beforeCursor.toUpperCase().replace(/[^0-9A-Z]/g, '');
                          const newCursorPosition = Math.min(validBeforeCursor.length, inputValue.length);

                          e.target.value = inputValue;

                          handleChange(e);

                          // Auto-populate Customer Supply based on GSTIN prefix matching Employer GSTIN prefix
                          if (inputValue) {
                            if (inputValue.startsWith("URP")) {
                              handleChange({
                                target: {
                                  name: "customerSupply",
                                  value: "",
                                },
                              });
                            } else {
                              const empGstinObj = customerTypes.find(item => item && (item.EmployerGSTIN || item.EmployerGstin || item.employergstin || item.employerGstin));
                              const empGstin = empGstinObj ? (empGstinObj.EmployerGSTIN || empGstinObj.EmployerGstin || empGstinObj.employergstin || empGstinObj.employerGstin) : "";
                              const empPrefix = empGstin ? String(empGstin).substring(0, 2) : "29";

                              const isLocal = inputValue.startsWith(empPrefix);
                              const targetLabel = isLocal ? "local" : "interstate";
                              const matchedOpt = customerSupplyOptions.find(opt => {
                                const label = String(opt.label || "").toLowerCase().trim().replace(/\s+/g, "");
                                return label === targetLabel;
                              });

                              if (matchedOpt) {
                                handleChange({
                                  target: {
                                    name: "customerSupply",
                                    value: matchedOpt.value,
                                  },
                                });
                                clearFieldError("customerSupply");
                              }
                            }
                          }

                          // Auto-populate PAN from GSTIN when GSTIN is exactly 15 characters
                          // PAN is characters 3-12 (indices 2-11) of GSTIN
                          if (inputValue.length === 15 && !inputValue.startsWith("URP")) {
                            const panFromGstin = inputValue.substring(2, 12); // Extract characters 3-12 (10 characters)
                            handleChange({
                              target: {
                                name: "panNumber",
                                value: panFromGstin,
                              },
                            });
                            // Clear PAN API errors when auto-populated
                            if (apiErrors.panNumber) {
                              setApiErrors((prev) => {
                                const next = { ...prev };
                                delete next.panNumber;
                                return next;
                              });
                            }
                          }

                          setTimeout(() => {
                            input.setSelectionRange(newCursorPosition, newCursorPosition);
                          }, 0);

                          // Clear API errors when user types
                          if (apiErrors.gstinNumber) {
                            setApiErrors((prev) => {
                              const next = { ...prev };
                              delete next.gstinNumber;
                              return next;
                            });
                          }
                        }}
                        onBlur={handleBlur}
                        onFocus={() => {
                          setApiErrors((prev) => {
                            const next = { ...prev };
                            delete next.gstinNumber;
                            return next;
                          });
                        }}
                        disabled={isDisabled}
                        error={errors.gstinNumber || apiErrors.gstinNumber}
                        maxLength={15}
                      // placeholder="GST No"
                      />
                    </div>

                    <div className="col-md-3">
                      <ReactSelectField
                        label="Customer Supply"
                        name="customerSupply"
                        options={customerSupplyOptions}
                        value={(() => {
                          // Get the raw value from form values
                          const rawValue = values.customerSupply;
                          const normalized = normalizeCustomerSupplyValue(rawValue);

                          // If no value, return empty
                          if (!normalized) return "";

                          // If options haven't loaded yet, return the normalized value (will be set once options load)
                          if (customerSupplyOptions.length === 0) {
                            return normalized;
                          }

                          // Try to find by value (handle both string and number comparisons)
                          const foundByValue = customerSupplyOptions.find(opt => {
                            const optValue = String(opt.value || "").trim();
                            const normalizedValue = String(normalized).trim();
                            // Try exact match first
                            if (optValue === normalizedValue) return true;
                            // Try numeric comparison if both are numeric
                            if (!isNaN(Number(optValue)) && !isNaN(Number(normalizedValue))) {
                              return Number(optValue) === Number(normalizedValue);
                            }
                            return false;
                          });

                          if (foundByValue) {
                            return String(foundByValue.value || "").trim();
                          }

                          // If value doesn't match, try to find by text from API response
                          const supplyText = values.customerSupplyText ||
                            (initialData || initialDataRef.current)?.customer_supply_text ||
                            (initialData || initialDataRef.current)?.customerSupplyText || "";
                          if (supplyText) {
                            const foundByText = customerSupplyOptions.find(
                              opt => {
                                const optLabel = String(opt.label || "").trim();
                                const textToMatch = String(supplyText).trim();
                                // Case-insensitive comparison
                                return optLabel.toLowerCase() === textToMatch.toLowerCase() ||
                                  optLabel === textToMatch;
                              }
                            );
                            if (foundByText) {
                              return String(foundByText.value || "").trim();
                            }
                          }

                          // If no match found, return the normalized value anyway (might be valid but options not loaded yet)
                          return normalized;
                        })()}
                        onChange={(e) => {
                          // Clear API errors when value changes
                          clearFieldError("customerSupply");
                          handleChange(e);
                        }}
                        onBlur={handleBlur}
                        onFocus={() => clearFieldError("customerSupply")}
                        placeholder="Select Customer Supply"
                        disabled={isDisabled}
                        required
                        error={errors.customerSupply || apiErrors.customerSupply}
                      />
                    </div>



                    <div className="row mb-2">
                      <div className="col-md-6">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div style={{ flexGrow: 1 }}>
                            <TextAreaFormField
                              label="Address1"
                              name="customerAddress1"
                              rows="3"
                              value={values.customerAddress1}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onFocus={(e) => clearFieldError(e.target.name)}
                              error={
                                errors.customerAddress1 ||
                                apiErrors.customerAddress1
                              }
                              required
                              disabled={isDisabled}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div style={{ flexGrow: 1 }}>
                            <TextAreaFormField
                              label="Address2"
                              name="customerAddress2"
                              rows="3"
                              value={values.customerAddress2}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onFocus={(e) => clearFieldError(e.target.name)}
                              error={
                                errors.customerAddress2 ||
                                apiErrors.customerAddress2
                              }
                              disabled={isDisabled}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="row mb-2">
                    <div className="col-md-3">
                      <FormField
                        label="Pincode"
                        name="customerPincode"
                        type="text"
                        maxLength={6}
                        inputValueType="number"
                        value={values.customerPincode}
                        onChange={handleChange}
                        error={
                          errors.customerPincode || apiErrors.customerPincode
                        }
                        onFocus={(e) => clearFieldError(e.target.name)}
                        onBlur={handleBlur}
                        disabled={isDisabled}
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <FormField
                        label="PAN Number"
                        name="panNumber"
                        value={values.panNumber || ""}
                        required
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

                          if (apiErrors.panNumber) {
                            setApiErrors((prev) => {
                              const next = { ...prev };
                              delete next.panNumber;
                              return next;
                            });
                          }
                        }}
                        onBlur={handleBlur}
                        onFocus={() =>
                          setApiErrors((prev) => {
                            const next = { ...prev };
                            delete next.panNumber;
                            return next;
                          })
                        }
                        disabled={isDisabled}
                        error={errors.panNumber || apiErrors.panNumber}
                      />
                    </div>

                    <div className="col-md-3">
                      <FormField
                        label="Customer Website"
                        name="customerWebsite"
                        value={values.customerWebsite}
                        onChange={handleChange}
                        error={
                          errors.customerWebsite || apiErrors.customerWebsite
                        }
                        onFocus={(e) => clearFieldError(e.target.name)}
                        onBlur={handleBlur}
                        disabled={isDisabled}
                      />
                    </div>
                    <div className="col-md-3">
                      <ReactSelectField
                        label="Status"
                        name="customerStatus"
                        options={statusOptions}
                        value={values.customerStatus}
                        onChange={(e) => {
                          console.log(
                            "Status onChange:",
                            e.target.value,
                            typeof e.target.value
                          );
                          // Clear API errors when value changes
                          clearFieldError("customerStatus");
                          handleChange(e);
                        }}
                        onBlur={handleBlur}
                        onFocus={(e) => clearFieldError(e?.target?.name)}
                        placeholder="Select Status"
                        required
                        disabled={isDisabled}
                        isClearable={false}
                        error={
                          errors.customerStatus || apiErrors.customerStatus
                        }
                      />
                    </div>
                  </div>

                  {/* Row 3 - Responsible Person */}
                  <div className="row mb-2">
                    <div className="col-md-12 d-flex justify-content-center">
                      <div style={{ width: "100%", maxWidth: "400px" }}>
                        <ReactSelectField
                          label="Responsible Person"
                          name="responsiblePersonID"
                          options={responsiblePersonOptions}
                          value={(() => {
                            // Get the raw value from form values
                            const rawValue = values.responsiblePersonID;
                            const normalized = normalizeResponsiblePersonValue(rawValue);

                            // If no value, return empty
                            if (!normalized) return "";

                            // If options haven't loaded yet, return the normalized value (will be set once options load)
                            if (responsiblePersonOptions.length === 0) {
                              return normalized;
                            }

                            // Try to find by value (handle both string and number comparisons)
                            const foundByValue = responsiblePersonOptions.find(opt => {
                              const optValue = String(opt.value || "").trim();
                              const normalizedValue = String(normalized).trim();
                              // Try exact match first
                              if (optValue === normalizedValue) return true;
                              // Try numeric comparison if both are numeric
                              if (!isNaN(Number(optValue)) && !isNaN(Number(normalizedValue))) {
                                return Number(optValue) === Number(normalizedValue);
                              }
                              return false;
                            });

                            if (foundByValue) {
                              return String(foundByValue.value || "").trim();
                            }

                            // If value doesn't match, try to find by text from API response
                            const personName = values.responsiblePersonName ||
                              (initialData || initialDataRef.current)?.responsible_person_name ||
                              (initialData || initialDataRef.current)?.responsiblePersonName || "";
                            if (personName) {
                              const foundByText = responsiblePersonOptions.find(
                                opt => {
                                  const optLabel = String(opt.label || "").trim();
                                  const nameToMatch = String(personName).trim();
                                  // Case-insensitive comparison
                                  return optLabel.toLowerCase() === nameToMatch.toLowerCase() ||
                                    optLabel === nameToMatch;
                                }
                              );
                              if (foundByText) {
                                return String(foundByText.value || "").trim();
                              }
                            }

                            // If no match found, return the normalized value anyway (might be valid but options not loaded yet)
                            return normalized;
                          })()}
                          onChange={(e) => {
                            // Clear API errors when value changes
                            clearFieldError("responsiblePersonID");
                            handleChange(e);
                          }}
                          onBlur={handleBlur}
                          onFocus={() => clearFieldError("responsiblePersonID")}
                          placeholder="Select Responsible Person"
                          disabled={isDisabled}
                          required
                          error={errors.responsiblePersonID || apiErrors.responsiblePersonID}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="row mb-2">
                    <div className="col-md-3">
                      <FormField
                        label="Prep By"
                        name="preparedBy"
                        value={values.preparedBy}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>

                    <div className="col-md-3">
                      <FormField
                        label="Date"
                        name="entryDate"
                        type="date"
                        value={values.entryDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>

                    <div className="col-md-3">
                      <FormField
                        label="Updated By"
                        name="updatedBy"
                        value={values.updatedBy}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>

                    <div className="col-md-3">
                      <FormField
                        label="Date"
                        name="updatedDate"
                        type="date"
                        value={values.updatedDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>
                  </div>

                  {/* Customer Contact Details Section */}
                  <div
                    className="card contact-details-card"
                    id="customer-contact-details-section"
                    style={{ marginTop: "20px" }}
                  >
                    {/* Header matching InlineEditableTable style */}
                    <div className="card-header contact-details-header"
                      style={{
                        background: "rgb(147, 108, 145)",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        marginBottom: "15px",
                        borderRadius: "7px",
                      }}
                    >
                      <div className="d-flex flex-wrap align-items-center justify-content-between w-100 contact-details-header-content">
                        {/* Left: Title */}
                        <div className="contact-details-title-container">
                          <div className="contact-details-title-wrapper">
                            <h5 style={{ fontSize: "16px", margin: 0, lineHeight: "1", color: "rgb(255, 255, 255)" }}>Customer Contact Details</h5>
                          </div>
                        </div>
                        {/* Right: Add Button */}
                        <div
                          className="d-flex align-items-center gap-2 ms-auto"
                          style={{ flexShrink: 0 }}
                        >
                          {(() => {
                            // Debug logging
                            const isEnabled = editMode || !initialData;
                            return (
                              <button
                                className="btn btn-sm"
                                type="button"
                                onClick={() => {
                                  if (isEnabled) {
                                    console.log("[Customer Contact Add Button] Clicked - handleAddContact called");
                                    handleAddContact();
                                  } else {
                                    console.log("[Customer Contact Add Button] Clicked but disabled - editMode is false");
                                  }
                                }}
                                disabled={!isEnabled}
                                style={{
                                  background: isEnabled ? "#7A4B78" : "#cccccc",
                                  color: "#fff",
                                  borderRadius: "6px",
                                  width: 33,
                                  height: 33,
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "none",
                                  border: "none",
                                  cursor: isEnabled ? "pointer" : "not-allowed",
                                  opacity: isEnabled ? 1 : 0.6,
                                }}
                                title={isEnabled ? "Add Contact" : "Click Edit to add contacts"}
                              >
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
                                >
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    {/* Table Body */}
                    <div className="card-body p-0 flex-grow-1 contact-details-table-container">
                      {customerContacts.length === 0 ? (
                        <div
                          className="text-center text-muted py-4"
                          style={{ width: "100%" }}
                        >
                          No Contacts Added
                        </div>
                      ) : (
                        <div
                          className="table-responsive contact-details-table-responsive"
                          style={{
                            overflowX: "auto",
                            overflowY: "visible",
                            width: "100%",
                            maxHeight: "500px",
                          }}
                        >
                          <table
                            className="table table-vcenter contact-details-table"
                            style={{
                              minWidth: "1800px",
                              width: "100%",
                              tableLayout: "fixed",
                            }}
                          >
                            <thead className="contact-details-thead">
                              <tr>
                                <th className={`contact-details-th contact-details-th-actions ${!hasPermission(menuPermissions.ALLOW_TO_DELETE_CUSTOMER) ? "d-none" : ""}`} style={{ width: "100px", minWidth: "100px", maxWidth: "100px", textAlign: "center" }}>
                                  <span>Actions</span>
                                </th>
                                <th className="contact-details-th contact-details-th-contact-name" style={{ width: "180px", minWidth: "180px", maxWidth: "180px", textAlign: "center" }}>
                                  <span>Contact Name</span>
                                </th>
                                <th className="contact-details-th contact-details-th-is-primary" style={{ width: "120px", minWidth: "120px", maxWidth: "120px", textAlign: "center" }}>
                                  <span>Is Primary?</span>
                                </th>
                                <th className="contact-details-th contact-details-th-phone" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", textAlign: "center" }}>
                                  <span>Phone No</span>
                                </th>
                                <th className="contact-details-th contact-details-th-mobile" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", textAlign: "center" }}>
                                  <span>Mobile No</span>
                                </th>
                                <th className="contact-details-th contact-details-th-designation" style={{ width: "180px", minWidth: "180px", maxWidth: "180px", textAlign: "center" }}>
                                  <span>Designation</span>
                                </th>
                                <th className="contact-details-th contact-details-th-email" style={{ width: "220px", minWidth: "220px", maxWidth: "220px", textAlign: "center" }}>
                                  <span>Email</span>
                                </th>
                                {/* <th className="contact-details-th contact-details-th-city" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", textAlign: "center" }}>
                                  <span>City</span>
                                </th> */}
                                {/* <th className="contact-details-th contact-details-th-country" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", textAlign: "center" }}>
                                  <span>Country</span>
                                </th> */}

                                <th className="contact-details-th contact-details-th-prepared-by" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", textAlign: "center" }}>
                                  <span>Prepared By</span>
                                </th>
                                <th className="contact-details-th contact-details-th-prepared-date" style={{ width: "160px", minWidth: "160px", maxWidth: "160px", textAlign: "center" }}>
                                  <span>Prepared Date</span>
                                </th>
                                <th className="contact-details-th contact-details-th-updated-by" style={{ width: "150px", minWidth: "150px", maxWidth: "150px", textAlign: "center" }}>
                                  <span>Updated By</span>
                                </th>
                                <th className="contact-details-th contact-details-th-updated-date" style={{ width: "160px", minWidth: "160px", maxWidth: "160px", textAlign: "center" }}>
                                  <span>Updated Date</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="contact-details-tbody">
                              {customerContacts.map((contact, rowIndex) => (
                                <tr key={rowIndex}>
                                  <td className={`contact-details-td contact-details-td-actions ${!hasPermission(menuPermissions.ALLOW_TO_DELETE_CUSTOMER) ? "d-none" : ""}`} style={{ width: "100px", minWidth: "100px", maxWidth: "100px", textAlign: "center" }}>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-danger"
                                      onClick={() => handleDeleteContact(rowIndex)}
                                      disabled={!(editMode || !initialData)}
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        gap: "4px",
                                        background: "rgb(255, 255, 255)",
                                        color: "rgb(22, 119, 255)",
                                        border: "none"
                                      }}
                                      title="Remove row"
                                    >
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
                                      >
                                        <path d="M4 7h16" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
                                        <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                                      </svg>
                                    </button>
                                  </td>
                                  <td className="contact-details-td" style={{ width: "180px", minWidth: "180px", maxWidth: "180px" }}>
                                    <div className="contact-details-input-wrapper">
                                      <input
                                        type="text"
                                        className={`form-control form-control-sm contact-details-input${contactErrors[rowIndex]?.contactName
                                          ? " is-invalid"
                                          : ""
                                          }`}
                                        ref={(el) =>
                                          (contactNameRefs.current[rowIndex] = el)
                                        }
                                        value={contact.contactName || ""}
                                        onChange={(e) =>
                                          handleContactFieldChange(
                                            rowIndex,
                                            "contactName",
                                            e.target.value
                                          )
                                        }
                                        onBlur={(e) =>
                                          validateContactField(
                                            rowIndex,
                                            "contactName",
                                            e.target.value
                                          )
                                        }
                                        disabled={!(editMode || !initialData)}
                                      />
                                      {contactErrors[rowIndex]?.contactName && (
                                        <div className="invalid-feedback d-block contact-details-error">
                                          {contactErrors[rowIndex].contactName}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="contact-details-td-center" style={{ width: "120px", minWidth: "120px", maxWidth: "120px", borderRight: "1px solid #dee2e6" }}>
                                    <div className="contact-details-input-wrapper">
                                      <input
                                        type="checkbox"
                                        className={`form-check-input${contactErrors[rowIndex]?.isPrimary
                                          ? " is-invalid"
                                          : ""
                                          }`}
                                        checked={!!contact.isPrimary}
                                        onChange={(e) =>
                                          handleContactFieldChange(
                                            rowIndex,
                                            "isPrimary",
                                            e.target.checked
                                          )
                                        }
                                        disabled={!(editMode || !initialData)}
                                      />
                                      {contactErrors[rowIndex]?.isPrimary && (
                                        <div className="invalid-feedback d-block contact-details-error">
                                          {contactErrors[rowIndex].isPrimary}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="contact-details-td" style={{ width: "150px", minWidth: "150px", maxWidth: "150px" }}>
                                    <div className="contact-details-input-wrapper">
                                      <input
                                        type="text"
                                        className={`form-control form-control-sm contact-details-input${contactErrors[rowIndex]?.phoneNumber
                                          ? " is-invalid"
                                          : ""
                                          }`}
                                        value={contact.phoneNumber || ""}
                                        onChange={(e) =>
                                          handleContactFieldChange(
                                            rowIndex,
                                            "phoneNumber",
                                            e.target.value
                                              .replace(/\D/g, "")
                                              .slice(0, 10)
                                          )
                                        }
                                        onBlur={(e) =>
                                          validateContactField(
                                            rowIndex,
                                            "phoneNumber",
                                            e.target.value
                                          )
                                        }
                                        disabled={!(editMode || !initialData)}
                                        maxLength={10}
                                      />
                                      {/* {contactErrors[rowIndex]?.phoneNumber && (
                                        <div className="invalid-feedback d-block contact-details-error">
                                          {contactErrors[rowIndex].phoneNumber}
                                        </div>
                                      )} */}
                                    </div>
                                  </td>
                                  <td className="contact-details-td" style={{ width: "150px", minWidth: "150px", maxWidth: "150px" }}>
                                    <div className="contact-details-input-wrapper">
                                      <input
                                        type="text"
                                        className={`form-control form-control-sm contact-details-input${contactErrors[rowIndex]?.mobileNumber
                                          ? " is-invalid"
                                          : ""
                                          }`}
                                        value={contact.mobileNumber || ""}
                                        onChange={(e) =>
                                          handleContactFieldChange(
                                            rowIndex,
                                            "mobileNumber",
                                            e.target.value
                                              .replace(/\D/g, "")
                                              .slice(0, 10)
                                          )
                                        }
                                        onBlur={(e) =>
                                          validateContactField(
                                            rowIndex,
                                            "mobileNumber",
                                            e.target.value
                                          )
                                        }
                                        disabled={!(editMode || !initialData)}
                                        maxLength={10}
                                      />
                                      {contactErrors[rowIndex]?.mobileNumber && (
                                        <div className="invalid-feedback d-block contact-details-error">
                                          {contactErrors[rowIndex].mobileNumber}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="contact-details-td" style={{ width: "180px", minWidth: "180px", maxWidth: "180px" }}>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={contact.designation || ""}
                                      onChange={(e) =>
                                        handleContactFieldChange(
                                          rowIndex,
                                          "designation",
                                          e.target.value
                                        )
                                      }
                                      disabled={!(editMode || !initialData)}
                                    />
                                  </td>
                                  <td className="contact-details-td" style={{ width: "220px", minWidth: "220px", maxWidth: "220px" }}>
                                    <div className="contact-details-input-wrapper">
                                      <input
                                        type="email"
                                        className={`form-control form-control-sm contact-details-input${contactErrors[rowIndex]?.email
                                          ? " is-invalid"
                                          : ""
                                          }`}
                                        value={contact.email || ""}
                                        onChange={(e) =>
                                          handleContactFieldChange(
                                            rowIndex,
                                            "email",
                                            e.target.value
                                          )
                                        }
                                        onBlur={(e) =>
                                          validateContactField(
                                            rowIndex,
                                            "email",
                                            e.target.value
                                          )
                                        }
                                        disabled={!(editMode || !initialData)}
                                      />
                                      {contactErrors[rowIndex]?.email && (
                                        <div className="invalid-feedback d-block contact-details-error">
                                          {contactErrors[rowIndex].email}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  {/* <td className="contact-details-td" style={{ width: "150px", minWidth: "150px", maxWidth: "150px" }}>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={contact.city || ""}
                                      onChange={(e) =>
                                        handleContactFieldChange(
                                          rowIndex,
                                          "city",
                                          e.target.value
                                        )
                                      }
                                      disabled={!(editMode || !initialData)}
                                    />
                                  </td> */}
                                  {/* <td className="contact-details-td" style={{ width: "150px", minWidth: "150px", maxWidth: "150px" }}>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={contact.country || "INDIA"}
                                      onChange={(e) =>
                                        handleContactFieldChange(
                                          rowIndex,
                                          "country",
                                          e.target.value
                                        )
                                      }
                                      disabled={!(editMode || !initialData)}
                                    />
                                  </td> */}

                                  <td className="contact-details-td" style={{ width: "150px", minWidth: "150px", maxWidth: "150px" }}>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={contact.preparedBy || ""}
                                      disabled
                                      readOnly
                                    />
                                  </td>
                                  <td className="contact-details-td" style={{ width: "160px", minWidth: "160px", maxWidth: "160px" }}>
                                    <input
                                      type="date"
                                      className="form-control form-control-sm contact-details-input"
                                      value={contact.preparedDate || ""}
                                      disabled
                                      readOnly
                                    />
                                  </td>
                                  <td className="contact-details-td" style={{ width: "150px", minWidth: "150px", maxWidth: "150px" }}>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm contact-details-input"
                                      value={contact.updatedBy || ""}
                                      disabled
                                      readOnly
                                    />
                                  </td>
                                  <td className="contact-details-td" style={{ width: "160px", minWidth: "160px", maxWidth: "160px" }}>
                                    <input
                                      type="date"
                                      className="form-control form-control-sm contact-details-input"
                                      value={contact.updatedDate || ""}
                                      disabled
                                      readOnly
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          }}
        </ValidatedForm>
        <DeleteConfirmDialog
          open={showDeleteConfirm}
          title="Confirm Delete"
          message={
            contactToDelete?.contactName
              ? ` ${contactToDelete.contactName}`
              : ""
          }
          onConfirm={confirmDeleteContact}
          onCancel={cancelDeleteContact}
        />
        <style>{`
          /* Customer Contact Details Table Styles */
          .contact-details-table-container {
            overflow: hidden;
          }
            .card-header contact-details-header{
            padding-top: .45rem;
            padding-bottom: .45rem;
            }
            .markdown>table thead th, .table thead th{
              background: #7A4B78 !important;
              color: #ffffff;
            }
          
          .contact-details-table-responsive {
            overflow-x: auto !important;
            overflow-y: visible !important;
            -webkit-overflow-scrolling: touch;
          }
          
          .contact-details-table {
            border-collapse: separate;
            border-spacing: 0;
          }
          
          .contact-details-table thead {
            position: sticky;
            top: 0;
            z-index: 24;
            background: #f8f9fa;
          }
          
          .contact-details-table thead th {
            position: sticky;
            top: 0;
            z-index: 25;
          }
          
          .contact-details-th {
            padding: 4px 8px !important;
            font-weight: bold !important;
            font-size: 13px !important;
            text-transform: none !important;
            white-space: nowrap;
            border-bottom: 2px solid #dee2e6;
            border-right: 1px solid rgba(255, 255, 255, 0.3);
            background: #7A4B78;
            color: #ffffff;
          }
          
          .contact-details-th:last-child {
            border-right: none;
          }
          
          .contact-details-td {
            padding: 8px 12px !important;
            vertical-align: middle;
            border-bottom: 1px solid #dee2e6;
            border-right: 1px solid #dee2e6;
            overflow: visible !important;
            word-wrap: break-word !important;
            position: relative;
          }
          
          .contact-details-td:last-child {
            border-right: none;
          }
          
          .contact-details-td-center {
            padding: 8px 12px !important;
            vertical-align: middle;
            text-align: center;
            border-bottom: 1px solid #dee2e6;
          }
          
          /* Input field styles */
          .contact-details-input {
            width: 100% !important;
            min-width: 100% !important;
            padding: 6px 10px !important;
            font-size: 13px;
          }
          
          .contact-details-input-wrapper {
            width: 100%;
            position: relative;
            overflow: visible;
          }
          
          /* Error message styling - constrain within column */
          .contact-details-error {
            font-size: 11px !important;
            line-height: 1.2 !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
            white-space: normal !important;
            max-width: 100% !important;
            overflow-wrap: break-word !important;
            display: block !important;
            margin-top: 2px !important;
            padding: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          
          /* Actions column styling */
          .contact-details-actions-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
          }
          
          /* Scrollbar styling */
          .contact-details-table-responsive::-webkit-scrollbar {
            height: 8px;
          }
          
          .contact-details-table-responsive::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          .contact-details-table-responsive::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          
          .contact-details-table-responsive::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          
          /* Ensure table rows don't break, but allow error messages to wrap */
          .contact-details-table tbody tr {
            white-space: nowrap;
          }
          
          .contact-details-table tbody tr .contact-details-error {
            white-space: normal !important;
          }
          
          /* Sticky Actions column - Header (needs highest z-index for both top and left sticky) */
          .contact-details-table thead tr th.contact-details-th-actions {
            position: sticky !important;
            left: 0 !important;
            top: 0 !important;
            z-index: 50 !important;
            background: #7A4B78 !important;
            border-right: 2px solid #fff !important;
            box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
          }
          
          .contact-details-table thead tr th.contact-details-th-actions * {
            background: #7A4B78 !important;
          }
          
          /* Sticky Actions column - Body cells */
          .contact-details-table tbody tr td.contact-details-td-actions {
            position: sticky !important;
            left: 0 !important;
            z-index: 10 !important;
            background: #fff !important;
            border-right: 2px solid #dee2e6 !important;
            box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
          }
          
          /* Hover state for sticky actions column */
          .contact-details-table tbody tr:hover td.contact-details-td-actions {
            background: #f8f9fa !important;
          }
          
          /* Ensure table container allows horizontal scrolling */
          .contact-details-table-responsive {
            position: relative;
            overflow-x: auto !important;
          }
          
          .contact-details-table {
            position: relative;
          }
        `}</style>
      </div>
    );
  }
);
export default SaveOrUpdateCustomer;
