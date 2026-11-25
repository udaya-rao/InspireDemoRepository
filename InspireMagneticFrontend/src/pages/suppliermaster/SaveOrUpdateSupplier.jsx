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
  getSupplierType,
  getSupplierSupplyOptions,
  saveAndUpdateSupplier,
  fetchSupplierDetails,
  checkSupplierNameExist,
} from "../../services/supplierMasterService.js";
import {
  hasPermission,
  menuPermissions,
} from "../../permissions/permissionUtils";
import CopyButton from "../../components/CopyButton.jsx";
import FullPageLoader from "../../components/FullPageLoader";
import { getPreparedBy } from "../../utils/userSession";
import inspireLogo from "../../assets/logo/IM_Icon-new.png";
import {
  CustomValidateField,
  handleApiValidationErrors,
} from "../../utils/CustomValidation.js";
import { DeleteConfirmDialog } from "../../components/Notification";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS, PARAM_TYPE_ADD, DEFAULT_COUNTRY, YES_VALUE, NO_VALUE, STATUS_UNKNOWN, TITLE_SUPPLIER_CONTACT_DETAILS, TITLE_ADD_CONTACT, TITLE_CLICK_EDIT_TO_ADD_CONTACTS } from "../../utils/ConstVariables";
import { EMAIL_REGEX, MOBILE_REGEX, PHONE_STRIP_REGEX } from "../../utils/regexUtils";


const today = new Date().toISOString().split("T")[0];

const initialForm = {
  supplierID: 0,
  supplierName: "",
  supplierAddress1: "",
  supplierAddress2: "",
  supplierStatus: "1",
  gstinNumber: "",
  panNumber: "",
  supplierWebsite: "",
  supplierPincode: "",
  preparedBy: getPreparedBy(),
  entryDate: today,
  updatedBy: "",
  updatedDate: "",
  supplierType: "", // keep empty string for required validation
  supplierSupply: "", // keep empty string for required validation
  paramType: PARAM_TYPE_ADD,
};

// Base validation rules used by ValidatedForm / validateField
const validation = {
  supplierName: {
    required: true,
    fieldLabel: "Supplier Name",
    controlType: "textbox",
  },
  panNumber: {
    required: true,
    fieldLabel: "PAN Number",
    controlType: "textbox",
  },
  supplierType: {
    required: true,
    fieldLabel: "Supplier Type",
    controlType: "dropdown",
  },
  supplierSupply: {
    required: true,
    fieldLabel: "Supplier Supply",
    controlType: "dropdown",
  },
  supplierAddress1: {
    required: true,
    fieldLabel: "Supplier Address1",
    controlType: "textbox",
  },
  gstinNumber: {
    required: true,
    fieldLabel: "GSTIN Number",
    controlType: "textbox",
  },
  supplierPincode: {
    required: true,
    fieldLabel: "Pincode",
    controlType: "textbox",
  },
  supplierStatus: {
    required: true,
    fieldLabel: "Status",
    controlType: "dropdown",
  },
};

const SaveOrUpdateSupplier = forwardRef(
  ({ onClose, onSuccess, initialData, editMode, onDirtyChange, open = true }, ref) => {
    const { showToast } = useToast();
    const [supplierTypes, setSupplierTypes] = useState([]);
    const [supplierSupplies, setSupplierSupplies] = useState([]);
    const [status, setStatus] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [apiErrors, setApiErrors] = useState({});
    const validatedFormRef = useRef();
    const valuesRef = useRef({ ...initialForm });
    const initialDataRef = useRef(initialData);

    // Supplier Contact Details state
    const [supplierContacts, setSupplierContacts] = useState([]);
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

    const normalizeSupplierTypeValue = useCallback((v) => {
      if (v == null) return "";
      const s = String(v);
      return s === "0" ? "" : s;
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

    const supplierTypeOptions = useMemo(() => {
      const arr = asArray(supplierTypes);
      return Array.isArray(arr)
        ? arr.map((dept) => ({
          value: getOptValue(dept),
          label: getOptLabel(dept),
        }))
        : [];
    }, [supplierTypes, asArray, getOptValue, getOptLabel]);

    const supplierSupplyOptions = useMemo(() => {
      const arr = asArray(supplierSupplies);
      return Array.isArray(arr)
        ? arr.map((item) => ({
          value: getOptValue(item),
          label: getOptLabel(item),
        }))
        : [];
    }, [supplierSupplies, asArray, getOptValue, getOptLabel]);

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

    const formValidation = useMemo(() => {
      return validation;
    }, []);

    useEffect(() => {
      let isMounted = true;

      const loadSupplierType = async () => {
        try {
          const supplierTypeData = await getSupplierType();
          const supplierTypeArr = asArray(supplierTypeData);
          if (isMounted) {
            setSupplierTypes(supplierTypeArr);
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
          } else {
            console.error("Failed to fetch Supplier Type", error);
            if (showToast) showToast("Failed to load Supplier Type", ERROR_STATUS.toLowerCase());
          }
        }
      };

      const loadSupplierSupply = async () => {
        try {
          const supplierSupplyData = await getSupplierSupplyOptions();
          const supplierSupplyArr = asArray(supplierSupplyData);
          if (isMounted) {
            setSupplierSupplies(supplierSupplyArr);
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
          } else {
            console.error("Failed to fetch Supplier Supply", error);
            if (showToast) showToast("Failed to load Supplier Supply", ERROR_STATUS.toLowerCase());
          }
        }
      };

      loadSupplierType();
      loadSupplierSupply();
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
        const iv = {
          ...dataToUse,

          supplierID: dataToUse.supplierID || dataToUse.supplier_id || 0,
          supplierName: dataToUse.supplierName || dataToUse.supplier_name || "",
          supplierAddress1: dataToUse.supplierAddress1 || dataToUse.supplier_address1 || "",
          supplierAddress2: dataToUse.supplierAddress2 || dataToUse.supplier_address2 || "",
          supplierPincode: dataToUse.supplierPincode || dataToUse.supplier_pin_code || "",
          gstinNumber: dataToUse.gstinNumber || dataToUse.gstin_number || "",
          panNumber: dataToUse.panNumber || dataToUse.pan_number || "",
          supplierWebsite: dataToUse.supplierWebsite || dataToUse.supplier_website || "",

          supplierStatus: dataToUse.supplierStatus !== undefined
            ? String(dataToUse.supplierStatus)
            : (dataToUse.supplier_status !== undefined ? String(dataToUse.supplier_status) : "1"),

          supplierType: normalizeSupplierTypeValue(
            dataToUse.supplierType != null
              ? String(dataToUse.supplierType)
              : (dataToUse.supplier_type != null ? String(dataToUse.supplier_type) : "")
          ),

          supplierSupply: normalizeSupplierTypeValue(
            dataToUse.supplierSupply != null
              ? String(dataToUse.supplierSupply)
              : (dataToUse.supplier_supply != null ? String(dataToUse.supplier_supply) : "")
          ),

          entryDate: toDateOnly(dataToUse.entryDate || dataToUse.EntryDate || dataToUse.prep_date || dataToUse.prep_date_raw),
          updatedDate: toDateOnly(
            dataToUse.updatedDate || dataToUse.UpdatedDate || dataToUse.update_date
          ),

          preparedBy:
            dataToUse.preparedBy || dataToUse.PreparedBy || dataToUse.prep_by || getPreparedBy(),
          updatedBy: dataToUse.updatedBy || dataToUse.UpdatedBy || dataToUse.update_by || "",
          paramType: "add",
        };

        valuesRef.current = iv;
        return iv;
      }

      const iv = {
        ...initialForm,
        supplierStatus: String(initialForm.supplierStatus ?? "1"),
        supplierType: normalizeSupplierTypeValue(initialForm.supplierType),
        supplierSupply: normalizeSupplierTypeValue(initialForm.supplierSupply),
        supplierID: 0,
        entryDate: toDateOnly(initialForm.entryDate),
        updatedDate: "",
        preparedBy: getPreparedBy(),
        paramType: "Insert",
      };

      valuesRef.current = iv;
      return iv;
    }, [initialData, toDateOnly, normalizeSupplierTypeValue]); // initialData is the primary dependency, ref is fallback

    const DRAFT_KEY = "draft_supplier_master_create_v2";
    const CONTACTS_DRAFT_KEY = "draft_supplier_contacts_create_v2";

    const {
      isDirty,
      onValuesChange,
      resetDirty,
    } = useDirtyDraftDrawer({
      open,
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
              setSupplierContacts(draft);
              initialContactsRef.current = JSON.parse(JSON.stringify(draft));
              draftLoaded = true;
            }
          }
        } catch (e) {
          console.error("Failed to load supplier contacts draft", e);
        } finally {
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 500);
        }

        if (!draftLoaded) {
          setSupplierContacts([]);
          initialContactsRef.current = [];
        }
      };

      loadDraftData();
    }, [initialData]);

    // Background draft saving for contacts
    useEffect(() => {
      if (initialData || isInitialLoadRef.current) return;

      try {
        localStorage.setItem(CONTACTS_DRAFT_KEY, JSON.stringify(supplierContacts));
      } catch (e) {
        console.error("Failed to save supplier contacts draft", e);
      }
    }, [supplierContacts, initialData]);

    const onValuesChangeNormalized = useCallback(
      (nextValues) => {
        const safe = nextValues || {};
        const normalized = {
          ...safe,
          supplierType: normalizeSupplierTypeValue(safe.supplierType),
          supplierSupply: normalizeSupplierTypeValue(safe.supplierSupply),
        };

        valuesRef.current = normalized;
        onValuesChange && onValuesChange(normalized);
      },
      [onValuesChange, normalizeSupplierTypeValue]
    );

    // Check if supplier contacts have changed from initial state
    const areContactsDirty = useCallback(() => {
      try {
        const currentContacts = JSON.stringify(supplierContacts);
        const initialContacts = JSON.stringify(initialContactsRef.current);
        return currentContacts !== initialContacts;
      } catch {
        // If comparison fails, consider not dirty to avoid blocking UX
        return false;
      }
    }, [supplierContacts]);

    // Combined dirty state: form dirty OR contacts dirty
    const combinedIsDirty = isDirty || areContactsDirty();

    useEffect(() => {
      if (onDirtyChange) onDirtyChange(combinedIsDirty);
    }, [combinedIsDirty, onDirtyChange]);

    // ========== Supplier Contact Details Functions ==========

    useEffect(() => {
      if (!initialData) return;
      let isMounted = true;

      const contactList =
        initialData?.supplierContacts ||
        initialData?.SUPPLIER_CONTACT_MASTER_DETAILS ||
        [];

      if (isMounted && Array.isArray(contactList) && contactList.length > 0) {
        // Map API response to component state structure
        const mappedContacts = contactList.map((contact) => ({
          slNo: contact.supplier_contact_id || contact.supplierContactID || null,
          supplierContactID: contact.supplier_contact_id || contact.supplierContactID || null,
          supplierID: contact.supplier_id || contact.supplierID || initialData?.supplierID || initialData?.supplier_id || null,
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
            String(contact.is_primary || contact.isPrimary || "").toUpperCase() === YES_VALUE,
          preparedBy: contact.prep_by || contact.preparedBy || getPreparedBy(),
          preparedDate: contact.prep_date ? toDateOnly(contact.prep_date) : (contact.preparedDate ? toDateOnly(contact.preparedDate) : today),
          updatedBy: contact.update_by || contact.updatedBy || "",
          updatedDate: contact.update_date ? toDateOnly(contact.update_date) : (contact.updatedDate ? toDateOnly(contact.updatedDate) : ""),
        }));

        setSupplierContacts(mappedContacts);
        // Store initial contacts for dirty tracking - reset baseline when drawer opens
        initialContactsRef.current = JSON.parse(JSON.stringify(mappedContacts));
      } else if (isMounted) {
        setSupplierContacts([]);
        // Store empty array as initial state - reset baseline when drawer opens
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
      const updated = [...supplierContacts];
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

      setSupplierContacts(updated);
      validateContactField(rowIndex, field, value);
    }, [supplierContacts, validateContactField]);

    // Add new contact
    const handleAddContact = useCallback(() => {
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

      // Insert new rows at the top so they appear before existing records
      setSupplierContacts((prev) => {
        newContactIndexRef.current = 0;
        return [newContact, ...(prev || [])];
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
    }, [supplierContacts.length, editMode]);

    // Perform actual deletion of contact
    const performDeleteContact = useCallback((rowIndex) => {
      const updated = supplierContacts.filter((_, idx) => idx !== rowIndex);
      setSupplierContacts(updated);

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
    }, [supplierContacts, contactErrors]);

    // Show confirmation dialog before deleting contact
    const handleDeleteContact = useCallback((rowIndex) => {
      const contact = supplierContacts[rowIndex];
      if (contact) {
        setContactToDelete({
          index: rowIndex,
          contactName: contact.contactName || "this contact",
        });
        setShowDeleteConfirm(true);
      }
    }, [supplierContacts]);

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
      if (supplierContacts.length > 0) {
        const hasPrimary = supplierContacts.some((contact) => contact.isPrimary === true);
        if (!hasPrimary) {
          // Set error on first contact to indicate primary is required
          if (!errors[0]) errors[0] = {};
          errors[0].isPrimary = "At least one contact must be marked as primary";
        }
      }

      supplierContacts.forEach((contact, idx) => {
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
    }, [supplierContacts]);

    const handleSubmit = useCallback(
      async (values) => {
        setApiErrors({});

        // Validate all contacts before submit (only if contacts exist)
        if (supplierContacts.length > 0 && !validateAllContacts()) {
          showToast("Please fix contact details validation errors", ERROR_STATUS.toLowerCase());
          return;
        }

        // Collect all client-side validation errors together
        const clientValidationErrors = {};

        // Validate Pincode (optional - only validate if value exists)
        if (values.supplierPincode && String(values.supplierPincode).trim() !== "") {
          const PinCodeError = CustomValidateField(
            "Pincode",
            values.supplierPincode,
            "Enter The Valid Pincode."
          );
          if (PinCodeError) {
            clientValidationErrors.supplierPincode = PinCodeError;
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
          values.supplierWebsite,
          "Enter The Valid Supplier Website."
        );
        if (WebSiteError) {
          clientValidationErrors.supplierWebsite = WebSiteError;
        }

        // If there are any validation errors, set them all at once and return
        if (Object.keys(clientValidationErrors).length > 0) {
          setApiErrors(clientValidationErrors);
          return;
        }

        // Prepare supplier base data
        const supplierID = initialData ? Number(initialData.supplierID || 0) : 0;
        const paramType = PARAM_TYPE_ADD;

        // Map contacts to API format (only if contacts exist)
        const supplierContactMaster = supplierContacts.length > 0
          ? supplierContacts.map((contact) => ({
            supplierContactID: contact.supplierContactID && Number(contact.supplierContactID) > 0
              ? Number(contact.supplierContactID)
              : 0,
            supplierID: supplierID, // Will be updated with returned ID if new supplier
            contactName: String(contact.contactName || "").trim(),
            phoneNumber: String(contact.phoneNumber || "").trim(),
            mobileNumber: String(contact.mobileNumber || "").trim(),
            designation: String(contact.designation || "").trim(),
            email: String(contact.email || "").trim(),
            city: String(contact.city || "").trim(),
            country: String(contact.country || DEFAULT_COUNTRY).trim(),
            preparedBy: contact.preparedBy || getPreparedBy(),
            updatedBy: getPreparedBy(), // Always use current user when saving
            isPrimary: contact.isPrimary === true ? YES_VALUE : NO_VALUE, // Convert boolean to "Y"/"N"
            paramType: PARAM_TYPE_ADD, // Always "ADD" for contacts in unified API
          }))
          : []; // Empty array if no contacts

        // Prepare unified payload with supplier + contacts
        const submitValues = {
          supplierID: supplierID,
          supplierName: String(values.supplierName || "").trim(),
          supplierAddress1: String(values.supplierAddress1 || "").trim(),
          supplierAddress2: String(values.supplierAddress2 || "").trim(),
          supplierStatus: values.supplierStatus
            ? Number(values.supplierStatus)
            : 0,
          supplierType: normalizeSupplierTypeValue(values.supplierType)
            ? Number(values.supplierType)
            : 0,
          supplierSupply: normalizeSupplierTypeValue(values.supplierSupply)
            ? String(values.supplierSupply)
            : "",
          gstinNumber: String(values.gstinNumber || "").trim(),
          panNumber: String(values.panNumber || "").trim(),
          supplierWebsite: String(values.supplierWebsite || "").trim(),
          supplierPincode: String(values.supplierPincode || "").trim(),
          preparedBy: getPreparedBy(),
          updatedBy: getPreparedBy(),
          supplierContactMaster: supplierContactMaster, // Contacts array (can be empty)
          paramType: paramType, // "ADD" for insert, "UPDATE" for update
        };

        setSubmitting(true);
        try {
          const apiResult = await saveAndUpdateSupplier(submitValues);
          const validationErrors = apiResult?.data?.ValidationErrors;
          const supplierMessages = apiResult?.data?.SUPPLIER_MASTER_RESPONSE;
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
            // Get supplier ID from response (for new suppliers) or use existing
            const returnedSupplierID = supplierMessages?.[0]?.ID
              ? Number(supplierMessages[0].ID)
              : supplierID;

            // Update contact supplierIDs if supplier was newly created
            if (returnedSupplierID > 0 && returnedSupplierID !== supplierID && supplierContacts.length > 0) {
              setSupplierContacts((prev) =>
                prev.map((contact) => ({
                  ...contact,
                  supplierID: returnedSupplierID,
                }))
              );
            }

            // Fetch updated supplier details
            if (returnedSupplierID > 0) {
              try {
                const detailsRes = await fetchSupplierDetails(returnedSupplierID);
                const details =
                  detailsRes?.data?.SUPPLIER_MASTER_DETAILS?.[0] ?? null;

                if (details) {
                  onSuccess && onSuccess(details);
                } else {
                  // Fallback: pass submitValues with mapped fields
                  onSuccess && onSuccess({
                    ...submitValues,
                    supplier_id: returnedSupplierID,
                    supplierID: returnedSupplierID,
                    ID: returnedSupplierID,
                    supplier_name: submitValues.supplierName,
                    supplierName: submitValues.supplierName,
                    supplier_address1: submitValues.supplierAddress1,
                    supplier_address2: submitValues.supplierAddress2,
                    supplier_status: submitValues.supplierStatus,
                    supplier_type: submitValues.supplierType,
                    supplier_supply: submitValues.supplierSupply,
                    gstin_number: submitValues.gstinNumber,
                    pan_number: submitValues.panNumber,
                    supplier_website: submitValues.supplierWebsite,
                    supplier_pin_code: submitValues.supplierPincode,
                    prep_by: submitValues.preparedBy,
                    prep_date: new Date().toISOString(),
                    update_by: submitValues.updatedBy,
                    update_date: new Date().toISOString(),
                  });
                }
              } catch {
                // Fallback: pass submitValues with mapped fields
                onSuccess && onSuccess({
                  ...submitValues,
                  supplier_id: returnedSupplierID,
                  supplierID: returnedSupplierID,
                  ID: returnedSupplierID,
                  supplier_name: submitValues.supplierName,
                  supplierName: submitValues.supplierName,
                  supplier_address1: submitValues.supplierAddress1,
                  supplier_address2: submitValues.supplierAddress2,
                  supplier_status: submitValues.supplierStatus,
                  supplier_type: submitValues.supplierType,
                  supplier_supply: submitValues.supplierSupply,
                  gstin_number: submitValues.gstinNumber,
                  pan_number: submitValues.panNumber,
                  supplier_website: submitValues.supplierWebsite,
                  supplier_pin_code: submitValues.supplierPincode,
                  prep_by: submitValues.preparedBy,
                  prep_date: new Date().toISOString(),
                  update_by: submitValues.updatedBy,
                  update_date: new Date().toISOString(),
                });
              }
            } else {
              // Fallback: pass submitValues with mapped fields
              onSuccess && onSuccess({
                ...submitValues,
                supplier_id: submitValues.supplierID,
                supplierID: submitValues.supplierID,
                supplier_name: submitValues.supplierName,
                supplierName: submitValues.supplierName,
                supplier_address1: submitValues.supplierAddress1,
                supplier_address2: submitValues.supplierAddress2,
                supplier_status: submitValues.supplierStatus,
                supplier_type: submitValues.supplierType,
                supplier_supply: submitValues.supplierSupply,
                gstin_number: submitValues.gstinNumber,
                pan_number: submitValues.panNumber,
                supplier_website: submitValues.supplierWebsite,
                supplier_pin_code: submitValues.supplierPincode,
                prep_by: submitValues.preparedBy,
                prep_date: new Date().toISOString(),
                update_by: submitValues.updatedBy,
                update_date: new Date().toISOString(),
              });
            }

            // setIsDirty(false);
            resetDirty();

            // Reset initial contacts baseline after successful save
            initialContactsRef.current = JSON.parse(JSON.stringify(supplierContacts));

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
            if (showToast) showToast("Failed to save Supplier Master", ERROR_STATUS.toLowerCase());
          }
        } catch (err) {
          if (err?.response?.status === 401) {
            window.dispatchEvent(new Event("sessionExpired"));
            return;
          }
          const msg = err?.message || "Error saving Supplier Master";
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
        normalizeSupplierTypeValue,
        validateAllContacts,
        supplierContacts,
        resetDirty,

      ]
    );

    useImperativeHandle(ref, () => ({
      submit: () => {
        const current = valuesRef.current || {};
        const st = normalizeSupplierTypeValue(current.supplierType);
        const ss = normalizeSupplierTypeValue(current.supplierSupply);

        if (!st) {
          setApiErrors((prev) => ({
            ...(prev || {}),
            supplierType: "Select The Supplier Type.",
          }));
        } else {
          // Clear supplierType error if valid
          setApiErrors((prev) => {
            if (
              !prev ||
              !Object.prototype.hasOwnProperty.call(prev, "supplierType")
            )
              return prev;
            const next = { ...prev };
            delete next.supplierType;
            return next;
          });
        }

        if (!ss) {
          setApiErrors((prev) => ({
            ...(prev || {}),
            supplierSupply: "Select The Supplier Supply.",
          }));
        } else {
          setApiErrors((prev) => {
            if (
              !prev ||
              !Object.prototype.hasOwnProperty.call(prev, "supplierSupply")
            )
              return prev;
            const next = { ...prev };
            delete next.supplierSupply;
            return next;
          });
        }
        validatedFormRef.current?.submitForm?.();
      },
      saveDraft: () => {
        if (initialData) return;
        try {
          // Contacts saving
          localStorage.setItem(CONTACTS_DRAFT_KEY, JSON.stringify(supplierContacts));

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
            if (Array.isArray(parsed)) setSupplierContacts(parsed);
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

    // ========== Supplier Contact Details Functions ==========


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
      <div className="supplier-master-form-wrapper">
        <FullPageLoader
          loading={submitting}
          message="Saving supplier master..."
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
                            label="Supplier Name"
                            name="supplierName"
                            maxLength={25}
                            value={values.supplierName}
                            onChange={(e) => {
                              e.target.value = (
                                e.target.value || ""
                              ).toUpperCase();
                              handleChange(e);
                            }}
                            onBlur={async (e) => {
                              handleBlur(e);

                              const supplierName = e.target.value?.trim();
                              if (!supplierName) return;

                              try {
                                const { message } =
                                  await checkSupplierNameExist(supplierName);

                                if (
                                  message &&
                                  message !== "No Data Available !!!"
                                ) {
                                  // Duplicate detected: clear field and show error
                                  handleChange({
                                    target: { name: "supplierName", value: "" },
                                  });
                                  showToast(message, ERROR_STATUS.toLowerCase());
                                }
                              } catch (error) {
                                console.error(
                                  "Error checking supplier name:",
                                  error
                                );
                                showToast(
                                  "Failed to validate supplier name. Please try again.",
                                  ERROR_STATUS.toLowerCase()
                                );
                              }
                            }}
                            error={
                              errors.supplierName || apiErrors.supplierName
                            }
                            required
                            disabled={isDisabled || (!!initialData && editMode)}
                          />
                        </div>

                        <CopyButton
                          text={values.supplierName}
                          tooltip="By clicking this Supplier Name will be copied and you can paste it wherever you want."
                        />
                      </div>
                    </div>

                    <div className="col-md-3">
                      <ReactSelectField
                        label="Supplier Type"
                        name="supplierType"
                        options={supplierTypeOptions}
                        value={normalizeSupplierTypeValue(values.supplierType)}
                        onChange={(e) => {
                          // Clear API errors immediately
                          clearFieldError("supplierType");
                          // Update the value - handleChange will validate immediately
                          handleChange(e);
                          // If a valid value is selected, ensure validation passes
                          // by re-validating after the value is set in form state
                          const selectedValue = e.target.value;
                          if (selectedValue && selectedValue !== "" && String(selectedValue) !== "0") {
                            // Value is valid, trigger validation to clear any errors
                            // Use setTimeout to ensure form state is updated first
                            setTimeout(() => {
                              handleBlur({ target: { name: "supplierType", value: selectedValue } });
                            }, 100);
                          }
                        }}
                        onBlur={() => {
                          // Validate with current form value
                          handleBlur({ target: { name: "supplierType", value: values.supplierType } });
                        }}
                        required
                        onFocus={() => clearFieldError("supplierType")}
                        placeholder="Select Supplier Type"
                        disabled={isDisabled}
                        error={errors.supplierType || apiErrors.supplierType}
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

                          // Auto-populate Supplier Supply based on GSTIN prefix matching Employer GSTIN prefix
                          if (inputValue) {
                            if (inputValue.startsWith("URP")) {
                              handleChange({
                                target: {
                                  name: "supplierSupply",
                                  value: "",
                                },
                              });
                            } else {
                              const empGstinObj = supplierTypes.find(item => item && (item.EmployerGSTIN || item.EmployerGstin || item.employergstin || item.employerGstin));
                              const empGstin = empGstinObj ? (empGstinObj.EmployerGSTIN || empGstinObj.EmployerGstin || empGstinObj.employergstin || empGstinObj.employerGstin) : "";
                              const empPrefix = empGstin ? String(empGstin).substring(0, 2) : "29";

                              const isLocal = inputValue.startsWith(empPrefix);
                              const targetLabel = isLocal ? "local" : "interstate";
                              const matchedOpt = supplierSupplyOptions.find(opt => {
                                const label = String(opt.label || "").toLowerCase().trim().replace(/\s+/g, "");
                                return label === targetLabel;
                              });

                              if (matchedOpt) {
                                handleChange({
                                  target: {
                                    name: "supplierSupply",
                                    value: matchedOpt.value,
                                  },
                                });
                                clearFieldError("supplierSupply");
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
                        label="Supplier Supply"
                        name="supplierSupply"
                        options={supplierSupplyOptions}
                        value={normalizeSupplierTypeValue(values.supplierSupply)}
                        onChange={(e) => {
                          clearFieldError("supplierSupply");
                          handleChange(e);
                          const selectedValue = e.target.value;
                          if (selectedValue && selectedValue !== "" && String(selectedValue) !== "0") {
                            setTimeout(() => {
                              handleBlur({ target: { name: "supplierSupply", value: selectedValue } });
                            }, 100);
                          }
                        }}
                        onBlur={() => {
                          handleBlur({ target: { name: "supplierSupply", value: values.supplierSupply } });
                        }}
                        required
                        onFocus={() => clearFieldError("supplierSupply")}
                        placeholder="Select Supplier Supply"
                        disabled={isDisabled}
                        error={errors.supplierSupply || apiErrors.supplierSupply}
                      />
                    </div>



                    <div className="row mb-2">
                      <div className="col-md-6">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div style={{ flexGrow: 1 }}>
                            <TextAreaFormField
                              label="Address1"
                              name="supplierAddress1"
                              rows="3"
                              value={values.supplierAddress1}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onFocus={(e) => clearFieldError(e.target.name)}
                              error={
                                errors.supplierAddress1 ||
                                apiErrors.supplierAddress1
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
                              name="supplierAddress2"
                              rows="3"
                              value={values.supplierAddress2}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onFocus={(e) => clearFieldError(e.target.name)}
                              error={
                                errors.supplierAddress2 ||
                                apiErrors.supplierAddress2
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
                        name="supplierPincode"
                        type="text"
                        maxLength={6}
                        inputValueType="number"
                        value={values.supplierPincode}
                        onChange={handleChange}
                        error={
                          errors.supplierPincode || apiErrors.supplierPincode
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
                        label="Supplier Website"
                        name="supplierWebsite"
                        value={values.supplierWebsite}
                        onChange={handleChange}
                        error={
                          errors.supplierWebsite || apiErrors.supplierWebsite
                        }
                        onFocus={(e) => clearFieldError(e.target.name)}
                        onBlur={handleBlur}
                        disabled={isDisabled}
                      />
                    </div>
                    <div className="col-md-3">
                      <ReactSelectField
                        label="Status"
                        name="supplierStatus"
                        options={statusOptions}
                        value={values.supplierStatus}
                        onChange={(e) => {
                          console.log(
                            "Status onChange:",
                            e.target.value,
                            typeof e.target.value
                          );
                          // Clear API errors when value changes
                          clearFieldError("supplierStatus");
                          handleChange(e);
                        }}
                        onBlur={handleBlur}
                        onFocus={(e) => clearFieldError(e?.target?.name)}
                        placeholder="Select Status"
                        required
                        disabled={isDisabled}
                        isClearable={false}
                        error={
                          errors.supplierStatus || apiErrors.supplierStatus
                        }
                      />
                    </div>
                  </div>

                  {/* Row 3 */}
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

                  {/* Supplier Contact Details Section */}
                  <div
                    className="card contact-details-card"
                    id="supplier-contact-details-section"
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
                            <h5 style={{ fontSize: "16px", margin: 0, lineHeight: "1", color: "rgb(255, 255, 255)" }}>{TITLE_SUPPLIER_CONTACT_DETAILS}</h5>
                          </div>
                        </div>
                        {/* Right: Add Button */}
                        {/* <div
                          className="d-flex align-items-center gap-2 ms-auto"
                          style={{ flexShrink: 0 }}
                        >
                          {(editMode || !initialData) && (
                            <button
                              className="btn btn-sm"
                              type="button"
                              onClick={handleAddContact}
                              style={{
                                background: "#7A4B78",
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
                                cursor: "pointer",
                              }}
                              title="Add Contact"
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
                          )}
                        </div> */}


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
                                    handleAddContact();
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
                                title={isEnabled ? TITLE_ADD_CONTACT : TITLE_CLICK_EDIT_TO_ADD_CONTACTS}
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
                      {supplierContacts.length === 0 ? (
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
                                <th className={`contact-details-th contact-details-th-actions ${!hasPermission(menuPermissions.SUPPLIER_MASTER_DELETE) ? "d-none" : ""}`} style={{ width: "100px", minWidth: "100px", maxWidth: "100px", textAlign: "center" }}>
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
                              {supplierContacts.map((contact, rowIndex) => (
                                <tr key={rowIndex}>
                                  <td className={`contact-details-td contact-details-td-actions ${!hasPermission(menuPermissions.SUPPLIER_MASTER_DELETE) ? "d-none" : ""}`} style={{ width: "100px", minWidth: "100px", maxWidth: "100px", textAlign: "center" }}>
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
          /* Supplier Contact Details Table Styles */
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
export default SaveOrUpdateSupplier;
