// src/utils/CustomValidation.js
import { EMAIL_REGEX, INDIAN_MOBILE_REGEX } from "./regexUtils";
/**
 * Generic field validator that returns the provided message if invalid.
 *
 * @param {string} fieldName - e.g. "EmailID" | "MobileNumber" | "PANNumber" | "AadharNumber" | "Pincode"
 * @param {string} value - User input
 * @param {string} message - Message to return when validation fails
 *
 * @returns {string} - error message if invalid, else ""
 */
export function CustomValidateField(fieldName, value, message) {
  const val = (value ?? "").toString().trim();

  // If empty → do not validate (your required() will handle separately)
  if (!val) return "";

  switch (fieldName) {
    case "EmailID":
    case "email":
    case "emailID": {
      if (!EMAIL_REGEX.test(val)) return message;
      return "";
    }

    case "MobileNumber":
    case "mobile":
    case "mobileNumber": {
      if (!INDIAN_MOBILE_REGEX.test(val)) return message;
      return "";
    }

    case "PANNumber":
    case "PAN":
    case "panNumber": {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
      if (!panRegex.test(val)) return message;
      return "";
    }

    case "AadharNumber":
    case "AadhaarNumber":
    case "Aadhar":
    case "aadhaar": {
      const aadhaarRegex = /^\d{12}$/;
      if (!aadhaarRegex.test(val)) return message;
      return "";
    }

    case "Pincode":
    case "PIN":
    case "pinCode":
    case "PINCode": {
      const pinRegex = /^[1-9][0-9]{5}$/;
      if (!pinRegex.test(val)) return message;
      return "";
    }

    case "GSTIN":
    case "GSTINNumber":
    case "GSTNumber":
    case "gstNumber":
    case "gstinNumber": {
      const upperVal = val.toUpperCase();
      
      // Check if it's exactly 15 uppercase alphanumeric characters
      if (!/^[0-9A-Z]{15}$/.test(upperVal)) {
        return message;
      }
      
      // Validate GSTIN structure
      const stateCode = upperVal.substring(0, 2);
      const pan = upperVal.substring(2, 12);
      const entityCode = upperVal.substring(12, 13);
      const constantZ = upperVal.substring(13, 14);
      const checksum = upperVal.substring(14, 15);
      
      const stateCodeNum = parseInt(stateCode, 10);
      if (
        !/^[0-9]{2}$/.test(stateCode) ||
        stateCodeNum < 1 ||
        stateCodeNum > 37 ||
        !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan) ||
        !/^[1-9A-Z]{1}$/.test(entityCode) ||
        constantZ !== "Z" ||
        !/^[0-9A-Y]{1}$/.test(checksum)
      ) {
        return message;
      }
      
      return "";
    }

    case "Website":
    case "website":
    case "URL":
    case "url": {
      // URL validation: accepts protocol (http://, https://), www. prefix, or plain domain
      // Examples: http://example.com, https://example.com, www.example.com, example.com
      const urlRegex = /^(https?:\/\/)?(www\.)?[^\s.]+\.[^\s]{2,}$/i;
      if (!urlRegex.test(val)) return message;
      return "";
    }

    default:
      return "";
  }
}

/**
 * Handle API validation errors in a reusable way.
 *
 * @param {Array<any>} validationErrors - Array of validation error objects from API.
 * @param {(msg: string, type?: string) => void} [showToast] - Optional toast function from context.
 * @returns {boolean} true if validation errors were handled (toast shown), false otherwise.
 */
export function handleApiValidationErrors(validationErrors, showToast) {
  if (!validationErrors || !Array.isArray(validationErrors) || validationErrors.length === 0) {
    return false; // nothing to handle
  }

  const listText = validationErrors
    .map((e, idx) => {
      // Try common property names; fallback to JSON
      const msg =
        e.Message ||
        e.message ||
        e.Error ||
        e.error ||
        JSON.stringify(e);
      return `${idx + 1}. ${msg}`;
    })
    .join("\n");

  const toastMessage = `API Validations\n\n${listText}`;

  if (typeof showToast === "function") {
    showToast(toastMessage, "error");
  } else if (typeof window !== "undefined" && typeof window.showToast === "function") {
    // Optional global fallback
    window.showToast(toastMessage, "error");
  } else {
    // Last-resort fallback to console
    console.error("[API VALIDATIONS]", toastMessage);
  }

  return true;
}

