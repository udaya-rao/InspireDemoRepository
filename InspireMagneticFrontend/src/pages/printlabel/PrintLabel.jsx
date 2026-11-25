import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../components/useToast";
import { fetchLabelData, fetchTemplate, listTemplates } from "./labelApi";
/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
// Label printing POC. The JSON typed in the UI carries the template name and the rows:
//   { "template": "box-label-schneider-100x60", "data": [ { ... }, { ... } ] }
// The label settings (layout + field list) are fetched by that name through labelApi.js,
// which simulates an API call on top of the files in public/label-settings. The data can
// also be fetched by name (public/label-data), like a real data API would return it. Every template reads its own
// data format, so the same JSON field names are not shared between templates.
// Starting JSON (the Schneider box label sample):
const SAMPLE_JSON = `{
  "template": "box-label-schneider-100x60",
  "data": [
    {
      "date": "05-10-2026",
      "batchNo": "41 - 26",
      "partNo": "3W114250",
      "invoiceNo": "173 (BOX 1 OF 8)",
      "noOfItems": "375 No's",
      "to": [
        "SCHNEIDER ELECTRIC INDIA",
        "PRIVATE LIMITED,",
        "MPS Mysore Mfg. Plant,",
        "No.324-330, KIADB Industrial Estate,",
        "MYSORE – 570018"
      ]
    }
  ]
}`;
// Defaults for the 100 x 60 mm roll label (values in mm):
// one label across, 4 mm gap between labels. The user enters the actual gap; the pitch
// (label size + gap) is worked out internally in buildConfig.
// textShift moves the text inside each label to the right (the label box stays put).
const DEFAULT_FORM = {
  topMargin: "0",
  sideMargin: "0",
  verticalGap: "4",
  horizontalGap: "4",
  height: "60",
  width: "100",
  across: "1",
  down: "3",
  textShift: "3",
};
const DEFAULT_UNIT = "mm";
const TO_MM = { mm: 1, cm: 10, in: 25.4 };
const MM_TO_PT = 72 / 25.4; // PDF works in points (1 pt = 1/72 in)
// Most PDF viewers and printer drivers fail on pages longer than 200 inches.
const MAX_PAGE_MM = 5080;

// Label text: bold serif (Times), left aligned, shrunk to fit the label.
const FONT_CSS = '"Times New Roman", Times, serif';
const LINE_HEIGHT = 1.25; // line height as a multiple of the font size
const BASELINE = 0.96; // baseline position inside a line, as a multiple of the font size
const MAX_FONT_PT = 14; // largest text size on a 60 mm tall label (scales with the label)
const MIN_FONT_RATIO = 0.35; // text is never shrunk below this share of the largest size

/**
 * The PDF page size is not chosen by the user, it is worked out from the label settings
 * (like Word's "Page size: 34.09 cm roll"):
 *  - width  = side margins + Number across x horizontal pitch
 *  - height = top margin + Number down x vertical pitch
 * (the pitch is label size + gap, worked out in buildConfig), so the whole grid always
 * fits and nothing is cut off. If there are more labels than fit in one grid (Number across x Number
 * down), the rest go on the next pages.
 */
function getPageSpec(config, unit) {
  const f = TO_MM[unit];
  const wMm =
    (config.sideMargin * 2 + config.labelsAcross * config.horizontalPitch) * f;
  const hMm = (config.topMargin + config.labelsDown * config.verticalPitch) * f;
  if (hMm > MAX_PAGE_MM) {
    throw new Error(
      `Each page would be ${(hMm / 1000).toFixed(1)} m long, which is longer than PDF viewers and printers handle (about 5 m). Lower "Number down".`,
    );
  }
  return {
    wMm,
    hMm,
    topMm: config.topMargin * f,
    perPage: config.labelsAcross * config.labelsDown,
  };
}
/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
/** Case-insensitive key lookup. */
function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  const found = Object.keys(obj).find((k) => keys.includes(k.toLowerCase()));
  return found ? obj[found] : undefined;
}
/** Reads a value from a row with a dot path, e.g. "customer.name". */
function getPath(obj, path) {
  return String(path)
    .split(".")
    .reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj);
}
/** Value -> trimmed text. Lists are joined with commas, objects print nothing. */
function asText(v) {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(asText).filter(Boolean).join(", ");
  if (typeof v === "object") return "";
  return String(v).trim();
}

/**
 * One data row -> one label, as a list of text lines, following the template's fields
 * in the order the template lists them (the order of the keys in the JSON row does not
 * matter). Field types:
 *  - text      -> "CAPTION: - value" (or the field's own "format" with {caption} / {value})
 *  - block     -> optional caption line, then one line per entry of a list / text with line breaks
 *  - template  -> "format" with {some.path} placeholders filled from the row
 *  - static    -> fixed text
 * Empty values are skipped. A missing value of a "required" field throws an error.
 */
function toLabelItem(row, fields) {
  const obj = row && typeof row === "object" && !Array.isArray(row) ? row : {};
  const lines = [];
  fields.forEach((f) => {
    if (f.type === "static") {
      lines.push(f.text);
      return;
    }
    if (f.type === "template") {
      const paths = [...f.format.matchAll(/\{([^}]+)\}/g)]
        .map((m) => m[1])
        .filter((p) => p !== "caption");
      if (paths.every((p) => !asText(getPath(obj, p)))) {
        if (f.required)
          throw new Error(`"${paths.join('" / "')}" is required.`);
        return;
      }
      const text = f.format
        .replace(/\{([^}]+)\}/g, (_, p) =>
          p === "caption" ? (f.caption ?? "") : asText(getPath(obj, p)),
        )
        .replace(/\s+/g, " ")
        .trim();
      if (text) lines.push(text);
      return;
    }
    const v = getPath(obj, f.path);
    if (f.type === "block") {
      const parts = (Array.isArray(v) ? v : String(v ?? "").split("\n"))
        .map((p) => (p && typeof p === "object" ? "" : String(p ?? "").trim()))
        .filter(Boolean);
      if (parts.length === 0) {
        if (f.required) throw new Error(`"${f.path}" is required.`);
        return;
      }
      if (f.caption) lines.push(f.caption);
      lines.push(...parts);
      return;
    }
    // text
    const value = asText(v);
    if (!value) {
      if (f.required) throw new Error(`"${f.path}" is required.`);
      return;
    }
    const format = f.format ?? (f.caption ? "{caption}: - {value}" : "{value}");
    lines.push(
      format.replace("{caption}", f.caption ?? "").replace("{value}", value),
    );
  });
  return { lines };
}

/** All rows of the JSON -> labels. Errors say which row is wrong. */
function rowsToLabels(rows, fields) {
  return rows.map((row, i) => {
    try {
      return toLabelItem(row, fields);
    } catch (e) {
      throw new Error(`Row ${i + 1}: ${e.message}`);
    }
  });
}

/**
 * Reads the JSON typed in the UI: { "template": "name", "data": [ ...rows ] }
 * (key names are case-insensitive). Never throws; returns { templateName, rows, error }.
 * templateName is filled whenever it could be read, so the template can load even while
 * the rows still have a mistake.
 */
function parseInput(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return {
      templateName: "",
      rows: null,
      error: "Invalid JSON. Check for missing commas, quotes or brackets.",
    };
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return {
      templateName: "",
      rows: null,
      error: 'The JSON must look like { "template": "name", "data": [ ... ] }.',
    };
  }
  const templateName = String(
    pick(json, ["template", "templatename", "template_name"]) ?? "",
  ).trim();
  if (!templateName) {
    return {
      templateName: "",
      rows: null,
      error: 'Add the template name to the JSON: "template": "<name>".',
    };
  }
  const rows = pick(json, ["data", "labels", "items", "rows"]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      templateName,
      rows: null,
      error: '"data" must be a non-empty array of labels.',
    };
  }
  return { templateName, rows, error: null };
}

/** A template's layout -> values for the Layout form (strings) and the unit. */
function layoutFormOf(template) {
  const layout = template.layout || {};
  const out = {};
  Object.keys(DEFAULT_FORM).forEach((k) => {
    if (layout[k] !== undefined && layout[k] !== null)
      out[k] = String(layout[k]);
  });
  return {
    form: { ...DEFAULT_FORM, ...out },
    unit: template.unit || DEFAULT_UNIT,
  };
}

/** Short description of what a template field reads, for the "fields" list. */
function fieldHint(f) {
  if (f.type === "static") return `"${f.text}" (fixed text)`;
  if (f.type === "template") return f.format;
  return f.type === "block" ? `${f.path} (list)` : f.path;
}

/** Whole number of copies, 1 to 999. */
function copiesCount(v) {
  const n = Number(v);
  if (v.trim() === "" || !Number.isFinite(n) || n < 1) {
    throw new Error('"Number of copies" must be 1 or more.');
  }
  const c = Math.floor(n);
  if (c > 999) throw new Error('"Number of copies" can be at most 999.');
  return c;
}
/** Each label is printed `copies` times in a row (A A A B B B), with exactly the same data. */
function expandCopies(labels, copies) {
  const c = copiesCount(copies);
  return c === 1
    ? labels
    : labels.flatMap((l) => Array.from({ length: c }, () => l));
}
/**
 * Turns the Layout form into a validated config.
 * The user enters the gap between labels; the pitch (distance from the start of one
 * label to the start of the next) is worked out here as label size + gap. Page size,
 * preview and PDF all use these same values, so they always agree.
 */
function buildConfig(form) {
  const req = (v, name) => {
    const n = Number(v);
    if (v.trim() === "" || !Number.isFinite(n) || n <= 0) {
      throw new Error(`"${name}" must be a number greater than 0.`);
    }
    return n;
  };
  const opt = (v, name, fallback) => {
    if (v.trim() === "") return fallback;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0)
      throw new Error(`"${name}" must be zero or a positive number.`);
    return n;
  };
  const width = req(form.width, "Label width");
  const height = req(form.height, "Label height");
  return {
    width,
    height,
    labelsAcross: Math.max(1, Math.floor(req(form.across, "Number across"))),
    labelsDown: Math.max(1, Math.floor(req(form.down, "Number down"))),
    topMargin: opt(form.topMargin, "Top margin", 0),
    sideMargin: opt(form.sideMargin, "Side margin", 0),
    textShift: opt(form.textShift ?? "", "Text left shift", 0),
    horizontalPitch: width + opt(form.horizontalGap ?? "", "Horizontal gap", 0),
    verticalPitch: height + opt(form.verticalGap ?? "", "Vertical gap", 0),
  };
}
/* ---------- Text measuring and label layout (shared by the preview and the PDF) ---------- */
const n2 = (v) => v.toFixed(2);

/** Text width in points. Times New Roman Bold and the PDF's Times-Bold share metrics. */
const measureCtx = document.createElement("canvas").getContext("2d");
function textWidthPt(text, sizePt) {
  measureCtx.font = `bold 100px ${FONT_CSS}`;
  return (measureCtx.measureText(text).width * sizePt) / 100;
}
/** Greedy word wrap into lines no wider than maxW points. */
function wrapText(text, sizePt, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (line && textWidthPt(test, sizePt) > maxW) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
/**
 * Works out the text of one label: left aligned lines at the largest font size that
 * fits inside the label (with a padding of 8% of the shorter side). Long lines wrap.
 * shiftPt moves the text to the right and narrows the text area by the same amount.
 * `fits` is false only when even the smallest size does not fit.
 * Sizes are in points, as are w, h and shiftPt.
 */
function layoutLabel(l, wPt, hPt, shiftPt = 0) {
  const minSide = Math.min(wPt, hPt);
  const pad = 0.08 * minSide;
  const maxW = wPt - pad * 2 - shiftPt;
  const availH = hPt - pad * 2;
  const maxSize = MAX_FONT_PT * (minSide / (60 * MM_TO_PT));
  const minSize = maxSize * MIN_FONT_RATIO;
  let size = maxSize;
  for (;;) {
    const lines = l.lines.flatMap((t) => wrapText(t, size, maxW));
    const fits =
      lines.length * size * LINE_HEIGHT <= availH &&
      lines.every((t) => textWidthPt(t, size) <= maxW + 0.01);
    if (fits || size - 0.25 < minSize)
      return { size, pad, shift: shiftPt, lines, fits };
    size -= 0.25;
  }
}

/* ---------- Minimal PDF writer (no library) ---------- */
// Characters outside Latin-1 that exist in the PDF's WinAnsi encoding (en dash, quotes...).
const WIN_ANSI = {
  0x20ac: 0x80,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
};
/** Escapes text for a PDF string. Unsupported characters become "?". */
function pdfEscape(text) {
  let out = "";
  for (const ch of text) {
    const c = ch.codePointAt(0);
    const code = c <= 255 ? c : WIN_ANSI[c];
    if (ch === "\\" || ch === "(" || ch === ")") out += "\\" + ch;
    else if (code >= 32 && code <= 126) out += ch;
    else if (code >= 127 && code <= 255)
      out += "\\" + code.toString(8).padStart(3, "0");
    else out += "?";
  }
  return out;
}
/** Assembles page content streams into a complete PDF file. */
function buildPdfBlob(pageContents, pageW, pageH) {
  const objs = [];
  const pageIds = pageContents.map((_, i) => 4 + i * 2);
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objs[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageContents.length} >>`;
  objs[3] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>";
  pageContents.forEach((content, i) => {
    const pageId = 4 + i * 2;
    const contentId = pageId + 1;
    objs[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n2(pageW)} ${n2(pageH)}] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objs[contentId] =
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });
  let out = "%PDF-1.4\n";
  const offsets = [];
  for (let id = 1; id < objs.length; id++) {
    offsets[id] = out.length;
    out += `${id} 0 obj\n${objs[id]}\nendobj\n`;
  }
  const xrefPos = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objs.length; id++) {
    out += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return new Blob([out], { type: "application/pdf" });
}
/**
 * Builds the label PDF and downloads it. All positions are converted from
 * millimetres to PDF points, so a 100 mm label is exactly 100 mm in the file.
 * The label edge is not printed (the sticker already has it).
 * Returns { gridFits, textFits }: whether the label grid fits on the page, and whether
 * the text of every label fits inside its label.
 */
function downloadLabelsPdf({ config, labels }, unit, spec, fileName) {
  const { labelsAcross } = config;
  const perPage = spec.perPage;
  const f = TO_MM[unit];
  const pageW = spec.wMm * MM_TO_PT;
  const pageH = spec.hMm * MM_TO_PT;
  const wMm = config.width * f;
  const hMm = config.height * f;
  const wPt = wMm * MM_TO_PT;
  const hPt = hMm * MM_TO_PT;
  const toPt = (v) => v * f * MM_TO_PT;
  const left = toPt(config.sideMargin);
  const top = spec.topMm * MM_TO_PT;
  const hPitch = toPt(config.horizontalPitch);
  const vPitch = toPt(config.verticalPitch);
  const shiftPt = toPt(config.textShift);

  // Copies share the same label object, so each distinct label is laid out only once.
  const cache = new Map();
  let textFits = true;
  const layoutOf = (l) => {
    if (!cache.has(l)) {
      const lay = layoutLabel(l, wPt, hPt, shiftPt);
      if (!lay.fits) textFits = false;
      cache.set(l, lay);
    }
    return cache.get(l);
  };

  const pages = [];
  for (let start = 0; start < labels.length; start += perPage) {
    const ops = [];
    labels.slice(start, start + perPage).forEach((l, k) => {
      const lay = layoutOf(l);
      const x = left + (k % labelsAcross) * hPitch; // from the left edge
      const yTop = top + Math.floor(k / labelsAcross) * vPitch; // from the top edge
      lay.lines.forEach((line, i) => {
        // PDF y-axis starts at the bottom
        const baseline =
          pageH -
          (yTop + lay.pad + i * lay.size * LINE_HEIGHT + lay.size * BASELINE);
        ops.push(
          `BT /F1 ${n2(lay.size)} Tf ${n2(x + lay.pad + lay.shift)} ${n2(baseline)} Td (${pdfEscape(line)}) Tj ET`,
        );
      });
    });
    pages.push(ops.join("\n"));
  }
  const blob = buildPdfBlob(pages, pageW, pageH);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const rowsPerPage = perPage / labelsAcross;
  const gridW =
    (config.sideMargin + (labelsAcross - 1) * config.horizontalPitch) * f + wMm;
  const gridH = spec.topMm + (rowsPerPage - 1) * config.verticalPitch * f + hMm;
  return {
    gridFits: gridW <= spec.wMm + 0.01 && gridH <= spec.hMm + 0.01,
    textFits,
  };
}
/* ---------- Live preview: the exact page that will go into the PDF, scaled to fit ---------- */
const PREVIEW_BOX_W = 440;
const PREVIEW_BOX_H = 600;

function LabelPreview({ parsed, unit, spec }) {
  const [page, setPage] = useState(0);
  const { config, labels } = parsed;
  const f = TO_MM[unit];
  const perPage = spec.perPage;
  const pageCount = Math.max(1, Math.ceil(labels.length / perPage));
  const cur = Math.min(page, pageCount - 1);
  // px per mm, chosen so the whole page fits the preview box
  const scale = Math.min(PREVIEW_BOX_W / spec.wMm, PREVIEW_BOX_H / spec.hMm);
  const ptPx = scale / MM_TO_PT; // px per point
  const wMm = config.width * f;
  const hMm = config.height * f;
  const navBtn = {
    padding: "3px 12px",
    border: "1px solid #9ca3af",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  };
  return (
    <div>
      <div
        style={{
          background: "#e5e7eb",
          padding: 12,
          borderRadius: 6,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: "none",
            width: spec.wMm * scale,
            height: spec.hMm * scale,
            background: "#fff",
            boxShadow: "0 1px 6px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: perPage }).map((_, k) => {
            const l = labels[cur * perPage + k];
            const lay = l
              ? layoutLabel(
                  l,
                  wMm * MM_TO_PT,
                  hMm * MM_TO_PT,
                  config.textShift * f * MM_TO_PT,
                )
              : null;
            const x =
              (config.sideMargin +
                (k % config.labelsAcross) * config.horizontalPitch) *
              f *
              scale;
            const y =
              (spec.topMm +
                Math.floor(k / config.labelsAcross) *
                  config.verticalPitch *
                  f) *
              scale;
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: wMm * scale,
                  height: hMm * scale,
                  boxSizing: "border-box",
                  border: l ? "1px solid #cbd5e1" : "1px dashed #bbb",
                  borderRadius: Math.min(3, Math.min(wMm, hMm) / 10) * scale,
                  paddingTop: lay ? lay.pad * ptPx : 0,
                  paddingRight: lay ? lay.pad * ptPx : 0,
                  paddingBottom: lay ? lay.pad * ptPx : 0,
                  paddingLeft: lay ? (lay.pad + lay.shift) * ptPx : 0,
                  overflow: "hidden",
                  fontFamily: FONT_CSS,
                  fontWeight: 700,
                  color: "#000",
                }}
              >
                {lay &&
                  lay.lines.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: lay.size * ptPx,
                        lineHeight: `${lay.size * LINE_HEIGHT * ptPx}px`,
                        height: lay.size * LINE_HEIGHT * ptPx,
                        whiteSpace: "pre",
                      }}
                    >
                      {line}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginTop: 8,
          fontSize: 12,
          color: "#555",
        }}
      >
        <button
          type="button"
          style={navBtn}
          disabled={cur === 0}
          onClick={() => setPage(cur - 1)}
        >
          ‹
        </button>
        <span>
          Page {cur + 1} of {pageCount} · {spec.wMm.toFixed(1)} ×{" "}
          {spec.hMm.toFixed(1)} mm
        </span>
        <button
          type="button"
          style={navBtn}
          disabled={cur >= pageCount - 1}
          onClick={() => setPage(cur + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
/* ------------------------------------------------------------------ */
/* Styles (plain CSS-in-JS objects, no library)                        */
/* ------------------------------------------------------------------ */
const PURPLE = "#633761";
const GRADIENT = "linear-gradient(357deg, rgba(99,55,97,1), rgba(70,35,68,1))";

const s = {
  pageHead: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "4px 6px 12px",
    flex: "none",
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: PURPLE,
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "none",
  },
  chipGrey: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    background: "#f3f4f6",
    color: "#374151",
    fontSize: 12.5,
    fontWeight: 600,
  },
  cardTitleRow: { display: "flex", alignItems: "center", gap: 8 },
  footer: {
    flex: "none",
    background: "#fff",
    padding: "10px 16px",
    borderTop: "1px solid #e5e7eb",
    boxShadow: "0 -2px 8px rgba(16,24,40,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  headIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "rgba(99,55,97,0.1)",
    color: PURPLE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "none",
  },
  title: { fontSize: 18, fontWeight: 700, color: "#1f2937", lineHeight: 1.2 },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 16,
    boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
  },
  cardHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: 600, color: "#1f2937", margin: 0 },
  cardDesc: { fontSize: 12.5, color: "#6b7280", margin: "2px 0 0" },
  label: {
    display: "block",
    fontSize: 12.5,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 36,
    padding: "0 10px",
    border: "1px solid #d0d5dd",
    borderRadius: 6,
    fontSize: 14,
    color: "#1f2937",
    background: "#fff",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 220,
    padding: 10,
    border: "1px solid #d0d5dd",
    borderRadius: 6,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 12.5,
    lineHeight: 1.5,
    color: "#1f2937",
    resize: "vertical",
    boxSizing: "border-box",
  },
  stack: { display: "flex", flexDirection: "column", gap: 12 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" },
  unitWrap: { position: "relative" },
  unitText: {
    position: "absolute",
    right: 10,
    top: 0,
    height: 36,
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    color: "#9ca3af",
    pointerEvents: "none",
  },
  seg: {
    display: "inline-flex",
    border: "1px solid #d0d5dd",
    borderRadius: 6,
    overflow: "hidden",
  },
  segBtn: {
    height: 30,
    padding: "0 14px",
    border: "none",
    background: "#fff",
    color: "#374151",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  segBtnActive: { background: PURPLE, color: "#fff" },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(99,55,97,0.08)",
    color: PURPLE,
    fontSize: 12.5,
    fontWeight: 600,
  },
  btnRow: { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" },
  primaryBtn: {
    height: 36,
    padding: "0 16px",
    background: GRADIENT,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  dangerBtn: {
    height: 36,
    padding: "0 14px",
    background: "#fff",
    color: "#b42318",
    border: "1px solid #fda29b",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  note: { fontSize: 12, color: "#6b7280", margin: "8px 0 0", lineHeight: 1.5 },
  warn: {
    fontSize: 12.5,
    color: "#b54708",
    background: "#fffaeb",
    border: "1px solid #fedf89",
    borderRadius: 6,
    padding: "8px 10px",
    margin: "10px 0 0",
    lineHeight: 1.5,
  },
  tips: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 12.5,
    color: "#4b5563",
    lineHeight: 1.6,
  },
  previewEmpty: {
    background: "#f9fafb",
    border: "1px dashed #d0d5dd",
    borderRadius: 8,
    padding: 28,
    textAlign: "center",
    fontSize: 13,
    color: "#6b7280",
  },
  summary: { fontSize: 13, color: "#4b5563" },
};

/** One labelled number input, like a row in Word's Label Details dialog. */
function Field({ label, value, onChange, unit, id }) {
  return (
    <div>
      <label style={s.label} htmlFor={id}>
        {label}
      </label>
      <div style={s.unitWrap}>
        <input
          id={id}
          className="pl-input"
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...s.input, paddingRight: unit ? 34 : 10 }}
        />
        {unit && <span style={s.unitText}>{unit}</span>}
      </div>
    </div>
  );
}
/** Numbered card heading. */
function Head({ n, title, desc, right }) {
  return (
    <div style={s.cardHead}>
      <div>
        <div style={s.cardTitleRow}>
          <span style={s.stepBadge}>{n}</span>
          <h4 style={s.cardTitle}>{title}</h4>
        </div>
        <p style={{ ...s.cardDesc, marginLeft: 30 }}>{desc}</p>
      </div>
      {right}
    </div>
  );
}
const fmt = (n) => String(Number(n.toFixed(2)));
/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function PrintLabel() {
  const { showToast } = useToast();
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [copies, setCopies] = useState("1");
  const [catalog, setCatalog] = useState([]); // templates offered by the data dropdown
  const [catalogError, setCatalogError] = useState("");
  const [tpl, setTpl] = useState({
    name: "",
    status: "idle",
    template: null,
    error: null,
  });
  const layoutFor = useRef(""); // template whose layout is currently in the form
  const setField = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  // List of available templates (simulated API call)
  useEffect(() => {
    let off = false;
    listTemplates()
      .then((list) => {
        if (off) return;
        setCatalog(list);
        setCatalogError(list.length ? "" : "The template list is empty.");
      })
      .catch((e) => {
        // typing a template name still works, but tell the user why the list is empty
        if (!off)
          setCatalogError(e?.message || "Could not load the template list.");
      });
    return () => {
      off = true;
    };
  }, []);

  // Template name and rows, read from the JSON as the user types
  const input = useMemo(() => parseInput(jsonText), [jsonText]);

  // Fetch the template named in the JSON (simulated API call, short delay while typing)
  useEffect(() => {
    const name = input.templateName;
    if (!name) return undefined;
    let off = false;
    const timer = setTimeout(() => {
      fetchTemplate(name)
        .then((template) => {
          if (off) return;
          setTpl({ name, status: "ready", template, error: null });
          // A new template brings its own layout; the same template keeps the user's tweaks
          if (layoutFor.current !== name) {
            const r = layoutFormOf(template);
            setForm(r.form);
            setUnit(r.unit);
            layoutFor.current = name;
          }
        })
        .catch((e) => {
          if (off) return;
          setTpl({
            name,
            status: "error",
            template: null,
            error: e?.message || "Could not load the template.",
          });
        });
    }, 250);
    return () => {
      off = true;
      clearTimeout(timer);
    };
  }, [input.templateName]);

  const tplStatus = !input.templateName
    ? "idle"
    : tpl.name === input.templateName
      ? tpl.status
      : "loading";
  const activeTemplate = tplStatus === "ready" ? tpl.template : null;

  // Live parse so the summary and sheet preview update as the user edits the form or the JSON
  const { parsed, inputError, baseCount } = useMemo(() => {
    if (input.error) {
      return { parsed: null, inputError: input.error, baseCount: 0 };
    }
    if (!activeTemplate) {
      return { parsed: null, inputError: null, baseCount: 0 };
    }
    try {
      const base = rowsToLabels(input.rows, activeTemplate.fields);
      return {
        parsed: {
          config: buildConfig(form),
          labels: expandCopies(base, copies),
        },
        inputError: null,
        baseCount: base.length,
      };
    } catch (e) {
      return {
        parsed: null,
        inputError: e?.message || "Invalid input.",
        baseCount: 0,
      };
    }
  }, [form, input, activeTemplate, copies]);
  // Page size from the label settings (spec is null while the input is incomplete or invalid)
  const { spec, specError } = useMemo(() => {
    if (!parsed) return { spec: null, specError: null };
    try {
      return { spec: getPageSpec(parsed.config, unit), specError: null };
    } catch (e) {
      return { spec: null, specError: e?.message || "Invalid page size." };
    }
  }, [parsed, unit]);
  // True when some label has more text than fits inside it, even at the smallest text size
  const crowded = useMemo(() => {
    if (!parsed) return false;
    const f = TO_MM[unit] * MM_TO_PT;
    const wPt = parsed.config.width * f;
    const hPt = parsed.config.height * f;
    const shiftPt = parsed.config.textShift * f;
    return [...new Set(parsed.labels)].some(
      (l) => !layoutLabel(l, wPt, hPt, shiftPt).fits,
    );
  }, [parsed, unit]);
  // Like Word's "Page size: 34.09 cm roll", worked out from the label settings
  const pageSizeText = useMemo(() => {
    if (!spec) return null;
    const f = TO_MM[unit];
    return `${fmt(spec.wMm / f)} × ${fmt(spec.hMm / f)} ${unit}`;
  }, [spec, unit]);

  // Fetches the label data of a template (simulated API response) into the editor
  const handleFetchData = async (name) => {
    if (!name) return;
    try {
      const response = await fetchLabelData(name);
      setJsonText(JSON.stringify({ ...response, template: name }, null, 2));
    } catch (e) {
      showToast(e?.message || "Could not fetch the label data.", "error");
    }
  };
  const handleResetLayout = () => {
    if (!activeTemplate) return;
    const r = layoutFormOf(activeTemplate);
    setForm(r.form);
    setUnit(r.unit);
  };
  const handleDownload = () => {
    try {
      if (input.error) throw new Error(input.error);
      if (!activeTemplate) throw new Error("The template is not loaded yet.");
      const data = {
        config: buildConfig(form),
        labels: expandCopies(
          rowsToLabels(input.rows, activeTemplate.fields),
          copies,
        ),
      };
      const pageSpec = getPageSpec(data.config, unit);
      const base =
        input.templateName.replace(/[\\/:*?"<>|]+/g, "_") || "labels";
      const { gridFits, textFits } = downloadLabelsPdf(
        data,
        unit,
        pageSpec,
        `${base}.pdf`,
      );
      if (!gridFits) {
        showToast(
          "Some labels do not fit inside the page and will be cut off in the PDF. Check the unit (cm / mm / in) and the label sizes.",
          "warning",
        );
      } else if (!textFits) {
        showToast(
          "Some labels have more text than fits. The text was shrunk as far as it goes and may be cut off. Shorten the data or use a bigger label.",
          "warning",
        );
      }
    } catch (e) {
      showToast(e?.message || "Could not generate the PDF.", "error");
    }
  };
  const total = parsed ? parsed.labels.length : 0;
  const pageCountAll = parsed && spec ? Math.ceil(total / spec.perPage) : 0;
  const waitingText =
    tplStatus === "loading"
      ? `Fetching template "${input.templateName}"…`
      : tplStatus === "error"
        ? tpl.error
        : "Live preview appears here once the input is valid.";

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .pl-input:focus { outline: none; border-color: ${PURPLE} !important; box-shadow: 0 0 0 3px rgba(99,55,97,0.15); }
        .pl-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .pl-btn:disabled { opacity: 0.55; cursor: not-allowed !important; }
        .pl-ghost:hover:not(:disabled) { background: #f3f4f6 !important; }
        .pl-seg:hover { background: #f3f4f6; }
        .pl-root { flex: 1; min-height: 0; display: flex; flex-direction: column; }
        .pl-body { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(360px, 1fr) minmax(400px, 1.05fr); gap: 16px; padding: 0 6px; }
        .pl-pane { min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding: 2px 6px 16px 2px; scrollbar-width: thin; }
        @media (max-width: 1000px) {
          .pl-body { display: block; overflow-y: auto; }
          .pl-pane { overflow: visible; margin-bottom: 14px; padding-right: 2px; }
        }
      `}</style>
      <main
        className="p-1"
        style={{
          height: "calc(100vh - 120px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#f4f5f7",
        }}
      >
        <div className="pl-root">
          <div style={s.pageHead}>
            <div style={s.headIcon}>
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
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </div>
            <div>
              <div style={s.title}>Configure Label</div>
              <div style={s.subtitle}>
                {" "}
                Define layout dimensions, map data fields, and save custom
                templates for user printing modules.{" "}
              </div>
            </div>
          </div>

          <div className="pl-body">
            {/* Left: settings (scrolls on its own) */}
            <div className="pl-pane">
              <section style={s.card}>
                <Head
                  n="1"
                  title="Template"
                  desc='The label settings are picked by the "template" name in the JSON and fetched by that name (simulated API).'
                />
                <div style={s.stack}>
                  <div>
                    <label style={s.label} htmlFor="tpl-sample">
                      Fetch data from API for
                    </label>
                    <select
                      id="tpl-sample"
                      className="pl-input"
                      style={s.input}
                      value={
                        catalog.some((t) => t.name === input.templateName)
                          ? input.templateName
                          : ""
                      }
                      onChange={(e) => handleFetchData(e.target.value)}
                    >
                      <option value="">Choose a label…</option>
                      {catalog.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.title || t.name}
                        </option>
                      ))}
                    </select>
                    {catalogError && (
                      <p style={s.warn}>
                        {catalogError} Check that /label-settings/index.json
                        opens in the browser.
                      </p>
                    )}
                  </div>
                  <div>
                    {tplStatus === "ready" && (
                      <span style={s.chip}>
                        Template loaded · {activeTemplate.title || tpl.name}
                      </span>
                    )}
                    {tplStatus === "loading" && (
                      <span style={s.chipGrey}>
                        {`Fetching "${input.templateName}"…`}
                      </span>
                    )}
                    {tplStatus === "idle" && (
                      <span style={s.chipGrey}>
                        Add a "template" name to the JSON to load a template
                      </span>
                    )}
                    {tplStatus === "error" && (
                      <p style={{ ...s.warn, margin: 0 }}>{tpl.error}</p>
                    )}
                  </div>
                </div>
                {activeTemplate && (
                  <div style={{ marginTop: 14 }}>
                    <div style={s.label}>Fields these settings read</div>
                    <ul style={s.tips}>
                      {activeTemplate.fields.map((f, i) => (
                        <li key={i}>
                          <code>{fieldHint(f)}</code>
                          {f.required ? " (required)" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              <section style={s.card}>
                <Head
                  n="2"
                  title="Layout"
                  desc="Comes from the template. Change it here only if you need to tweak it."
                  right={
                    <div
                      style={s.seg}
                      role="group"
                      aria-label="Unit of measurement"
                    >
                      {["cm", "mm", "in"].map((u) => (
                        <button
                          key={u}
                          type="button"
                          className="pl-seg"
                          style={{
                            ...s.segBtn,
                            ...(unit === u ? s.segBtnActive : null),
                          }}
                          onClick={() => setUnit(u)}
                          aria-pressed={unit === u}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  }
                />
                <div style={s.grid}>
                  <Field
                    id="f-top"
                    label="Top margin"
                    value={form.topMargin}
                    onChange={setField("topMargin")}
                    unit={unit}
                  />
                  <Field
                    id="f-height"
                    label="Label height"
                    value={form.height}
                    onChange={setField("height")}
                    unit={unit}
                  />
                  <Field
                    id="f-side"
                    label="Side margin"
                    value={form.sideMargin}
                    onChange={setField("sideMargin")}
                    unit={unit}
                  />
                  <Field
                    id="f-width"
                    label="Label width"
                    value={form.width}
                    onChange={setField("width")}
                    unit={unit}
                  />
                  <Field
                    id="f-vg"
                    label="Vertical gap"
                    value={form.verticalGap}
                    onChange={setField("verticalGap")}
                    unit={unit}
                  />
                  <Field
                    id="f-across"
                    label="Number across"
                    value={form.across}
                    onChange={setField("across")}
                  />
                  <Field
                    id="f-hg"
                    label="Horizontal gap"
                    value={form.horizontalGap}
                    onChange={setField("horizontalGap")}
                    unit={unit}
                  />
                  <Field
                    id="f-down"
                    label="Number down"
                    value={form.down}
                    onChange={setField("down")}
                  />
                  <Field
                    id="f-shift"
                    label="Text left shift"
                    value={form.textShift}
                    onChange={setField("textShift")}
                    unit={unit}
                  />
                </div>
                <p style={s.note}>
                  Gap = the empty space between two labels (for example 4 mm on
                  a roll). Text left shift moves the text inside each label to
                  the right.
                </p>
                <div style={s.btnRow}>
                  {activeTemplate && (
                    <button
                      type="button"
                      className="pl-ghost"
                      style={{
                        ...s.segBtn,
                        height: 32,
                        border: "1px solid #d0d5dd",
                        borderRadius: 6,
                      }}
                      onClick={handleResetLayout}
                    >
                      Reset to template layout
                    </button>
                  )}
                  {pageSizeText && (
                    <span style={{ ...s.chip, alignSelf: "center" }}>
                      Page size · {pageSizeText}
                    </span>
                  )}
                </div>
              </section>

              <section style={s.card}>
                <Head
                  n="3"
                  title="Data & copies"
                  desc="The JSON holds the template name and the label rows. Each template reads its own fields."
                />
                <div style={{ maxWidth: 200 }}>
                  <Field
                    id="f-copies"
                    label="Number of copies"
                    value={copies}
                    onChange={setCopies}
                  />
                </div>
                <p style={s.note}>
                  Every label is printed this many times, one after another. All
                  copies carry the same data; the data does not change from copy
                  to copy.
                </p>
                <div style={{ marginTop: 14 }}>
                  <label style={s.label} htmlFor="label-json">
                    Label data (JSON)
                  </label>
                  <textarea
                    id="label-json"
                    className="pl-input"
                    style={s.textarea}
                    value={jsonText}
                    spellCheck={false}
                    onChange={(e) => setJsonText(e.target.value)}
                  />
                </div>
                <p style={s.note}>
                  Format:{" "}
                  {`{ "template": "<name>", "data": [ { ... }, { ... } ] }`}.
                  Each row in "data" is one label and must use the field names
                  of that template (see "Fields these settings read").
                </p>
              </section>
            </div>

            {/* Right: preview (own pane, does not move when the form scrolls) */}
            <div className="pl-pane">
              <section style={s.card}>
                <div style={s.cardHead}>
                  <div>
                    <h4 style={s.cardTitle}>Live preview</h4>
                    <p style={s.cardDesc}>
                      Exactly what will be printed. The grey outline is the
                      label edge and is not printed. Dashed boxes are empty
                      slots.
                    </p>
                  </div>
                </div>
                {parsed && spec ? (
                  <LabelPreview parsed={parsed} unit={unit} spec={spec} />
                ) : (
                  <div style={s.previewEmpty}>
                    {specError ?? inputError ?? waitingText}
                  </div>
                )}
                {crowded && (
                  <p style={s.warn}>
                    Some labels have more text than fits, even at the smallest
                    text size. Shorten the data or use a bigger label.
                  </p>
                )}
              </section>

              <section style={s.card}>
                <h4 style={{ ...s.cardTitle, marginBottom: 8 }}>
                  Printing tips
                </h4>
                <ul style={s.tips}>
                  <li>
                    Print the PDF at <b>Actual size (100%)</b>, not Fit to page.
                  </li>
                  <li>
                    The page size is worked out from your label settings, so
                    nothing is cut off. Extra labels continue on the next page.
                  </li>
                  <li>
                    For a roll printer that takes one label per page, set Number
                    down to 1.
                  </li>
                  <li>
                    The text is shrunk automatically so long addresses still fit
                    inside the label.
                  </li>
                </ul>
              </section>
            </div>
          </div>

          <div style={s.footer}>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {parsed && spec ? (
                <>
                  <span style={s.chipGrey}>
                    {total} label{total === 1 ? "" : "s"}
                    {baseCount !== total
                      ? ` (${baseCount} × ${total / baseCount})`
                      : ""}
                  </span>
                  <span style={s.chipGrey}>
                    {pageCountAll} page{pageCountAll === 1 ? "" : "s"}
                  </span>
                  <span style={s.chipGrey}>{pageSizeText}</span>
                </>
              ) : (
                <span style={s.summary}>
                  Complete the settings to enable download.
                </span>
              )}
            </div>
            <button
              type="button"
              className="pl-btn"
              style={s.primaryBtn}
              onClick={handleDownload}
              disabled={!(parsed && spec)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
