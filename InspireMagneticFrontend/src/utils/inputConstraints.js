// Generic, reusable input constraint helpers

// Format a numeric value to a fixed number of fraction digits (e.g., scale for SQL numeric)
export const formatNumericFixed = (value, fractionDigits = 0) => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  try {
    return n.toFixed(fractionDigits);
  } catch {
    return String(n);
  }
};

// Coerce an input string into a SQL-like numeric(precision, scale)
// precision: total digits (int + frac), scale: digits after decimal
// Behavior:
// - allow only digits and one dot
// - limit integer digits to (precision - scale)
// - limit fraction digits to scale
// - if integer exceeds limit, overflow digits moved to fraction (up to scale)
export const coerceNumeric = (raw, precision, scale) => {
  if (raw == null) return '';
  const maxInt = Math.max(0, (precision || 0) - (scale || 0));
  const maxFrac = Math.max(0, scale || 0);
  const s0 = String(raw);
  const hasNeg = /^\s*-/.test(s0);
  const s = s0.replace(/[^0-9.]/g, '');
  if (s === '') return hasNeg ? '-' : '';
  // keep first dot only
  const firstDot = s.indexOf('.');
  let cleaned = s;
  if (firstDot !== -1) {
    cleaned = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  let [intPart = '', fracPart = ''] = cleaned.split('.')
    .concat('')
    .slice(0, 2);
  // strip leading zeros intelligently (keep a single zero if all zeros)
  intPart = intPart.replace(/^0+(\d)/, '$1');
  if (intPart === '') intPart = '0';
  if (intPart.length > maxInt) {
    const overflow = intPart.slice(maxInt);
    intPart = intPart.slice(0, maxInt);
    fracPart = overflow + fracPart;
  }
  if (maxFrac >= 0) fracPart = fracPart.slice(0, maxFrac);
  const sign = hasNeg ? '-' : '';
  if (maxFrac === 0 || fracPart.length === 0) return `${sign}${intPart}`;
  return `${sign}${intPart}.${fracPart}`;
};

// Typing-friendly numeric coercion: allows trailing '.' while the user is typing,
// still enforces integer/fraction limits. Use this for onChange; then finalize with
// coerceNumeric onBlur.
export const coerceNumericTyping = (raw, precision, scale) => {
  if (raw == null) return '';
  const s0 = String(raw);
  const hasNeg = /^\s*-/.test(s0);
  const endsWithDot = s0.trim().endsWith('.');
  // sanitize
  const s = s0.replace(/[^0-9.]/g, '');
  if (s === '') return hasNeg ? '-' : '';
  const firstDot = s.indexOf('.');
  let cleaned = s;
  if (firstDot !== -1) {
    cleaned = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  const maxInt = Math.max(0, (precision || 0) - (scale || 0));
  const maxFrac = Math.max(0, scale || 0);
  let [intPart = '', fracPart = ''] = cleaned.split('.')
    .concat('')
    .slice(0, 2);
  // keep leading zeros as typed only until first non-zero digit; then normalize
  intPart = intPart.replace(/^0+(\d)/, '$1');
  if (intPart === '') intPart = '0';
  if (intPart.length > maxInt) {
    const overflow = intPart.slice(maxInt);
    intPart = intPart.slice(0, maxInt);
    fracPart = overflow + fracPart;
  }
  fracPart = fracPart.slice(0, maxFrac);
  const sign = hasNeg ? '-' : '';
  if (maxFrac > 0 && endsWithDot && fracPart.length === 0) {
    // permit trailing dot while typing
    return `${sign}${intPart}.`;
  }
  if (maxFrac === 0 || fracPart.length === 0) return `${sign}${intPart}`;
  return `${sign}${intPart}.${fracPart}`;
};

// Build an API-safe numeric string without using Number(), to avoid IEEE-754 rounding.
// Returns a string with up to 'scale' decimals (no rounding, just truncation),
// respecting total precision. Optionally pad with trailing zeros to exactly 'scale'.
export const toApiNumericString = (raw, precision, scale, { pad = false } = {}) => {
  const coerced = coerceNumeric(raw, precision, scale);
  if (coerced === '') return '';
  if (scale <= 0) return coerced.split('.')[0];
  const [i, f = ''] = coerced.split('.');
  if (pad) {
    const padded = (f + '0'.repeat(scale)).slice(0, scale);
    return `${i}.${padded}`;
  }
  return f.length > 0 ? `${i}.${f}` : i;
};

// Convert to Number for APIs that expect a numeric type (accepts precision/scale limits).
// Note: JavaScript Number is IEEE-754; very large/precise decimals may still round.
export const toNumericNumber = (raw, precision, scale) => {
  const s = toApiNumericString(raw, precision, scale, { pad: false });
  if (s === '') return 0;
  return Number(s);
};

// Coerce an integer-only input with max digits
export const coerceInteger = (raw, maxDigits) => {
  if (raw == null) return '';
  const s = String(raw).replace(/\D/g, '');
  if (s === '') return '';
  return s.slice(0, Math.max(0, maxDigits || 0));
};

// Coerce text input with options: maxLength, transform (upper/lower), allowPattern
export const coerceText = (raw, { maxLength, transform = 'none', allowPattern } = {}) => {
  if (raw == null) return '';
  let s = String(raw);
  if (allowPattern instanceof RegExp) {
    s = (s.match(new RegExp(allowPattern, 'g')) || []).join('');
  }
  if (typeof maxLength === 'number') s = s.slice(0, Math.max(0, maxLength));
  if (transform === 'upper') s = s.toUpperCase();
  else if (transform === 'lower') s = s.toLowerCase();
  return s;
};


