/**
 * Simulated label API (POC). Two calls, both keyed by the template name:
 *
 *   fetchTemplate(name)   -> label SETTINGS (layout + field list)  public/label-settings/<name>.json
 *   fetchLabelData(name)  -> label DATA, i.e. the API response     public/label-data/<name>.json
 *
 * Later these become real endpoints, e.g. GET /label-settings/:name and GET /labels/:name/data.
 * Only the two functions below the constants need to change; PrintLabel.jsx does not care.
 *
 * Naming: "<document>-<WxH in mm>", all lower case, e.g. "delivery-note-100x75". The name is the
 * file name, the "name" key inside the settings file and the "template" key in the data JSON.
 *
 * Settings file format:
 * {
 *   "name": "delivery-note-100x75", "version": 1,
 *   "title": "Shown in the UI",
 *   "unit": "mm",                       // optional, default "mm"
 *   "layout": {                         // same fields as the Layout form
 *     "width": 100, "height": 75, "across": 1, "down": 3,
 *     "verticalGap": 4, "horizontalGap": 4,
 *     "topMargin": 0, "sideMargin": 0, "textShift": 3
 *   },
 *   "fields": [                         // printed top to bottom, in this order
 *     { "type": "text",     "path": "partNo", "caption": "PART NO", "required": true },
 *     { "type": "block",    "path": "to", "caption": "To:-" },        // list -> one line per entry
 *     { "type": "template", "format": "{city}, {state} - {pin}" },    // combine several values
 *     { "type": "static",   "text": "FRAGILE" }                       // fixed text
 *   ]
 * }
 * "path" is a dot path into the row, e.g. "customer.name". For "text" fields an optional
 * "format" can use {caption} and {value} (default: "CAPTION: - value").
 *
 * Data response format (different per template): { "template": "<name>", "data": [ { ... } ] }
 */

// Folders inside /public. Change these if the app is not served from the site root.
const SETTINGS_BASE = "/label-settings";
const DATA_BASE = "/label-data";
const SIMULATED_LATENCY_MS = 700;

const FIELD_TYPES = ["text", "block", "template", "static"];
const cache = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, what) {
  let res;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    throw new Error(`Network error while loading ${what}.`);
  }
  if (!res.ok) throw new Error(`${what} was not found.`);
  try {
    return await res.json();
  } catch {
    // Dev servers answer unknown files with index.html, which is not JSON.
    throw new Error(`${what} was not found (the server did not return JSON).`);
  }
}

function validateTemplate(raw, name) {
  const fail = (msg) => {
    throw new Error(`Template "${name}" is invalid: ${msg}`);
  };
  if (!raw || typeof raw !== "object") fail("it is not a JSON object.");
  const { layout, fields } = raw;
  if (!layout || !(Number(layout.width) > 0) || !(Number(layout.height) > 0)) {
    fail('"layout" needs a width and a height greater than 0.');
  }
  if (!Array.isArray(fields) || fields.length === 0) {
    fail('"fields" must be a non-empty list.');
  }
  const clean = fields.map((f, i) => {
    const field = { type: "text", ...f };
    const where = `field ${i + 1}`;
    if (!FIELD_TYPES.includes(field.type)) {
      fail(`${where} has an unknown type "${field.type}".`);
    }
    if ((field.type === "text" || field.type === "block") && !field.path) {
      fail(`${where} (${field.type}) needs a "path".`);
    }
    if (field.type === "template" && !field.format) {
      fail(`${where} (template) needs a "format".`);
    }
    if (field.type === "static" && !field.text) {
      fail(`${where} (static) needs a "text".`);
    }
    return field;
  });
  return { ...raw, fields: clean };
}

/** Lists the templates that can be loaded: [{ name, title, description }]. */
export async function listTemplates() {
  await sleep(SIMULATED_LATENCY_MS / 2);
  const json = await getJson(`${SETTINGS_BASE}/labelList.json`, "The template list");
  return Array.isArray(json.templates) ? json.templates : [];
}

/** Fetches one template by name (the "template" key of the JSON typed in the UI). */
export async function fetchTemplate(name) {
  if (!/^[A-Za-z0-9_-]+$/.test(name)) {
    throw new Error(
      `"${name}" is not a valid template name. Use letters, numbers, "-" and "_" only.`,
    );
  }
  if (cache.has(name)) return cache.get(name);
  await sleep(SIMULATED_LATENCY_MS); // pretend this is a network round trip
  const raw = await getJson(`${SETTINGS_BASE}/${name}.json`, `Label settings "${name}"`);
  const template = validateTemplate(raw, name);
  cache.set(name, template);
  return template;
}

/** Fetches the label data for a template (the API response). `params` is for the real API later. */
export async function fetchLabelData(name, params = {}) { // eslint-disable-line no-unused-vars
  if (!/^[A-Za-z0-9_-]+$/.test(name)) {
    throw new Error(`"${name}" is not a valid template name.`);
  }
  await sleep(SIMULATED_LATENCY_MS);
  const json = await getJson(`${DATA_BASE}/${name}.json`, `Label data for "${name}"`);
  if (!json || !Array.isArray(json.data)) {
    throw new Error(`Label data for "${name}" must look like { "template", "data": [...] }.`);
  }
  return json;
}