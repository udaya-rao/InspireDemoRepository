// src/utils/dateUtils.js
export const formatDate = (isoDate) => {
  if (!isoDate) return "";

  try {
    // Handle ISO date string like "2025-08-22T12:30:08"
    const date = new Date(isoDate);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "";
    }

    // Format as DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Generic date/time parser that handles most formats automatically.
 * Supports:
 * - "dd-MM-yyyy" / "dd/MM/yyyy"
 * - "yyyy-MM-dd" / "yyyy/MM/dd"
 * - "MM/dd/yyyy"
 * - "dd-MM-yyyy HH:mm:ss"
 * - ISO strings: "2025-11-10T12:00:00Z"
 * - Unix timestamps (seconds or milliseconds)
 * - Native Date objects
 */
export const parseDateTime = (input) => {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  // Timestamp check (seconds or milliseconds)
  if (!isNaN(Number(input))) {
    const ts = Number(input);
    const dt = new Date(ts > 1e12 ? ts : ts * 1000);
    return isNaN(dt.getTime()) ? null : dt;
  }

  let s = String(input).trim();
  if (!s) return null;

  // Normalize separators
  s = s.replace(/[.]/g, "-").replace(/\//g, "-");

  const [datePart, timePart = "00:00:00"] = s.split(/\s+/);
  const dmy = datePart.split("-");

  let yyyy = 0,
    mm = 0,
    dd = 0;

  // Detect format automatically
  if (dmy[0].length === 4) {
    // yyyy-MM-dd
    yyyy = parseInt(dmy[0], 10);
    mm = parseInt(dmy[1], 10);
    dd = parseInt(dmy[2], 10);
  } else if (dmy[2] && dmy[2].length === 4) {
    // dd-MM-yyyy
    dd = parseInt(dmy[0], 10);
    mm = parseInt(dmy[1], 10);
    yyyy = parseInt(dmy[2], 10);
  } else {
    return null;
  }

  // Parse time safely
  const [HH = "0", MM = "0", SS = "0"] = timePart
    .split(":")
    .map((x) => parseInt(x || "0", 10));

  // Create Date with manual order (year, monthIndex, day)
  const dt = new Date(yyyy, mm - 1, dd, HH, MM, SS);

  return isNaN(dt.getTime()) ? null : dt;
};

export const formatDateTime = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year}  ${hours}:${minutes}`;
};

export const formatDateTimeWithSeconds = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const customFormatDateTime = (dateOrString, format, originalValue) => {
  if (!dateOrString) return null;

  // If caller passes string, parse it first
  const dt =
    dateOrString instanceof Date
      ? dateOrString
      : parseDateTime(String(dateOrString).trim());

  if (!(dt instanceof Date) || isNaN(dt.getTime())) return null;

  // If format not provided → try infer from originalValue OR from input string
  if (!format) {
    const source =
      typeof originalValue === "string" ? originalValue : String(dateOrString);
    format = inferFormatFromString(source);
  }

  // Still no format → return null (no guessing)
  if (!format) return null;

  const pad2 = (v) => String(v).padStart(2, "0");

  const tokens = {
    yyyy: dt.getFullYear(),
    yy: String(dt.getFullYear()).slice(-2),
    MM: pad2(dt.getMonth() + 1),
    dd: pad2(dt.getDate()),
    HH: pad2(dt.getHours()),
    mm: pad2(dt.getMinutes()),
    ss: pad2(dt.getSeconds()),
  };

  return format.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, (t) => tokens[t]);
};

const inferFormatFromString = (value) => {
  const v = String(value || "").trim();

  // dd/MM/yyyy HH:mm:ss
  if (/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2}$/.test(v))
    return "dd/MM/yyyy HH:mm:ss";

  // dd/MM/yyyy HH:mm
  if (/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/.test(v)) return "dd/MM/yyyy HH:mm";

  // dd/MM/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return "dd/MM/yyyy";

  // yyyy-MM-dd HH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(v))
    return "yyyy-MM-dd HH:mm:ss";

  // yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return "yyyy-MM-dd";

  // dd-MM-yyyy HH:mm:ss
  if (/^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2}$/.test(v))
    return "dd-MM-yyyy HH:mm:ss";

  // dd-MM-yyyy
  if (/^\d{2}-\d{2}-\d{4}$/.test(v)) return "dd-MM-yyyy";

  return null;
};

export const parseAndFormatDateTime = (
  input,
  format = "dd/MM/yyyy HH:mm:ss"
) => {
  const date = parseDateTime(input);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return { date: null, text: null };
  }

  const text = customFormatDateTime(date, format);
  return { date, text };
};

export const getCurrentDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const getCurrentTime = (date = new Date()) => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};


export const getFinancialYearStartDate = (date = new Date()) => {
  const d = new Date(date);
  const fyYear = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${fyYear}-04-01`;
};

// src/utils/dateUtils.js

/**
 * Validate that a given date (YYYY-MM-DD) is not in the future.
 *
 * @param {string} dateStr - Date in ISO format (e.g. "1995-08-20")
 * @param {string} errorMessage - Custom error message to return if future DOB.
 * @returns {string|null} - Returns the error message if invalid, otherwise null.
 */
export function validateNotFutureDate(
  dateStr,
  errorMessage = "Date cannot be in the future."
) {
  if (!dateStr) return null; // let required validation handle empty case

  try {
    const selectedDate = new Date(dateStr);
    if (Number.isNaN(selectedDate.getTime())) {
      return "Invalid date format.";
    }

    const today = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return errorMessage;
    }

    return null;
  } catch {
    return "Invalid date format.";
  }
}
/**
 * Convert ISO date string to YYYY-MM-DD format
 * Example: "2024-08-20T10:24:57" -> "2024-08-20"
 * @param {string|Date} isoDate - ISO date string or Date object
 * @returns {string} Date in YYYY-MM-DD format or empty string if invalid
 */
export const toYYYYMMDD = (isoDate) => {
  if (!isoDate) return '';

  try {
    // Handle ISO date string like "2024-08-20T10:24:57"
    const date = new Date(isoDate);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error converting date to YYYY-MM-DD:', error);
    return '';
  }
};

export const getMinInvoiceDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().split("T")[0];
};

export const formatDateForInput = (dStr, defaultStr = "") => {
  if (!dStr) return defaultStr;
  const dt = parseDateTime(dStr);
  if (!dt) return defaultStr;
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};