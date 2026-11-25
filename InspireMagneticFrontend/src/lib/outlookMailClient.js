import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const normalizeList = (value = "") =>
  value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(",");

const isFileLike = (file) => {
  if (!file) return false;
  if (typeof File !== "undefined" && file instanceof File) return true;
  if (typeof Blob !== "undefined" && file instanceof Blob) return true;
  return typeof file === "object" && "name" in file && "size" in file;
};

const toHtmlBody = (text = "") =>
  text.replace(/\r\n|\n|\r/g, "<br />");

const toFormData = ({ to, cc, bcc, subject, message, attachments = [] }) => {
  const fd = new FormData();

  const toField = normalizeList(to);
  if (!toField) {
    throw new Error("Enter at least one To email address.");
  }
  fd.append("to", toField);

  if (cc) {
    const ccField = normalizeList(cc);
    if (ccField) fd.append("cc", ccField);
  }

  if (bcc) {
    const bccField = normalizeList(bcc);
    if (bccField) fd.append("bcc", bccField);
  }

  fd.append("subject", subject || "");
  fd.append("body", toHtmlBody(message || ""));

  attachments.filter(isFileLike).forEach((file) => fd.append("attachments", file));

  return fd;
};

export async function prepareOutlookMail(payload) {
  if (!API_BASE) {
    throw new Error("Missing VITE_API_BASE_URL. Unable to prepare the mail.");
  }

  const response = await axios.post(
    `${API_BASE}/api/OutlookMail/PrepareMail`,
    toFormData(payload)
  );

  const token = response?.data?.token;
  if (!token) {
    throw new Error("PrepareMail API did not return an Outlook token.");
  }

  return token;
}

export function launchOutlookCompose(token) {
  if (!token) {
    throw new Error("Missing Outlook token. Cannot open compose window.");
  }

  window.location.href = `protectron-outlook-mail://OutlookMail?token=${encodeURIComponent(
    token
  )}`;
}

export async function cleanupOutlookCompose(token) {
  if (!API_BASE || !token) return;
  try {
    await axios.post(`${API_BASE}/api/OutlookMail/${encodeURIComponent(token)}/cleanup`);
  } catch (err) {
    console.error("Failed to cleanup Outlook compose token", err);
  }
}


