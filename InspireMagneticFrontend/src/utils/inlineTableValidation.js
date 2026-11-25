// Reusable validation builder for InlineEditableTable
// Provides a validateCell function that shows messages only for:
// - new rows (row._isNewRow)
// - or the specific column currently being edited (row._isDirtyRow + row._dirtyColKeys[col.key])
// Usage:
// const validateCell = buildInlineTableValidateCell({
//   required: { fieldA: 'Required', fieldB: 'Required' },
//   unique: [{ field: 'code', message: 'Code must be unique.', identityField: 'id' }],
//   getData: () => rows,
// });

export function buildInlineTableValidateCell(config) {
  const requiredMap = (config && config.required) || {};
  const uniqueDefs = (config && config.unique) || [];
  const getData = (config && config.getData) || (() => []);
  const customValidators = (config && config.custom) || {};

  const isTargetCell = (row, colKey) => {
    if (!row) return false;
    // If the row is explicitly marked to show validation (after a Save attempt),
    // always consider its cells as targets for validation display
    if (row._showValidation) return true;
    if (row._isNewRow) return true;
    if (row._isDirtyRow && row._dirtyColKeys && row._dirtyColKeys[colKey]) return true;
    return false;
  };

  const checkRequired = (field, value) => {
    const msg = requiredMap[field];
    if (!msg) return null;
    const v = (value === 0 || value === false) ? String(value) : (value || '').toString();
    if (v.trim() === '') return msg;
    return null;
  };

  const checkUnique = (field, value, row) => {
    if (!uniqueDefs || uniqueDefs.length === 0) return null;
    // If the row has just been saved, or page logic marked it to suppress duplicates,
    // skip uniqueness validation to avoid flicker during post-save refresh
    if (row && (row._saved || row._suppressDuplicateCheck)) return null;
    const def = uniqueDefs.find(d => d.field === field);
    if (!def) return null;
    const msg = def.message || 'Must be unique.';
    const identityField = def.identityField || 'id';
    const val = (value || '').toString().toUpperCase();
    if (val.trim() === '') return null; // handled by required
    const data = getData() || [];
    const dup = data.some(r => {
      const same = (r[identityField] ?? r.id ?? r.key) === (row[identityField] ?? row.id ?? row.key);
      if (same) return false;
      return (String(r[field] || '').toUpperCase() === val);
    });
    return dup ? msg : null;
  };

  const checkCustom = (field, value) => {
    const customValidator = customValidators[field];
    if (!customValidator) return null;
    return customValidator(value);
  };

  return function validateCell(column, value, row /*, isNew */) {
    const colKey = column && column.key;
    if (!colKey) return null;
    // Suppress validation for freshly added rows until the next explicit save attempt
    if (row && row._suppressValidationUntilNextAttempt) return null;
    if (!isTargetCell(row, colKey)) return null;
    // required first
    const reqMsg = checkRequired(colKey, value);
    if (reqMsg) return reqMsg;
    // then custom validation
    const customMsg = checkCustom(colKey, value);
    if (customMsg) return customMsg;
    // then unique
    const uniqMsg = checkUnique(colKey, value, row);
    if (uniqMsg) return uniqMsg;
    return null;
  };
}



// Reusable batch validation + save helper for InlineEditableTable flows
// Validates ALL rows first; if any invalid, aborts without making API calls
/**
 * @typedef {Object} ValidateAndSaveOptions
 * @property {Array<any>} newRows
 * @property {Array<any>} editedRows
 * @property {Array<any>} currentData - existing list used for uniqueness checks
 * @property {(row:any)=>{ok:boolean,message?:string}} validateNew - per-row validation for new rows
 * @property {(row:any)=>{ok:boolean,message?:string}} validateEdit - per-row validation for edited rows
 * @property {(row:any)=>string} getCode - returns the unique code string
 * @property {(row:any)=>string|number|null|undefined} getEntityId - returns stable entity id
 * @property {(a:any,b:any)=>boolean} isSameEntity - comparer between two entity ids
 * @property {(msg:string,type?:'error'|'success'|'info')=>void} showToast
 * @property {(row:any)=>Promise<boolean>} saveAdd - API call for ADD
 * @property {(row:any)=>Promise<boolean>} saveUpdate - API call for UPDATE
 */

/**
 * Validate and save in two passes. Returns boolean success.
 * @param {ValidateAndSaveOptions} opts
 */
export async function validateAndSaveBatch(opts) {
  const {
    newRows = [],
    editedRows = [],
    currentData = [],
    validateNew,
    validateEdit,
    getCode,
    getEntityId,
    isSameEntity = (a, b) => a === b,
    showToast = () => {},
    saveAdd,
    saveUpdate,
  } = opts || {};

  const toUpper = (v) => (v == null ? '' : String(v).trim().toUpperCase());
  const codeSet = new Set((currentData || []).map((r) => toUpper(getCode(r))));

  const validNew = [];
  const validEdited = [];
  let hasErrors = false;

  // Validate new rows
  for (const row of newRows) {
    const code = toUpper(getCode(row));
    if (!code) {
      hasErrors = true;
      if (validateNew) validateNew(row); // page-level can set messages
      continue;
    }
    if (codeSet.has(code)) {
      hasErrors = true;
      continue;
    }
    if (validateNew) {
      const res = validateNew(row) || { ok: true };
      if (!res.ok) {
        hasErrors = true;
        if (res.message) showToast(res.message, 'error');
        continue;
      }
    }
    validNew.push(row);
  }

  // Validate edited rows
  for (const row of editedRows) {
    const original = row._originalRow || {};
    const code = toUpper(getCode(row) || getCode(original));
    if (!code) {
      hasErrors = true;
      if (validateEdit) validateEdit(row);
      continue;
    }
    const originalCode = toUpper(getCode(original));
    const idChanged = code !== originalCode;
    if (idChanged) {
      const entityId = getEntityId(row) ?? getEntityId(original);
      const duplicate = (currentData || []).some((r) => {
        const same = isSameEntity(getEntityId(r), entityId);
        if (same) return false;
        return toUpper(getCode(r)) === code;
      });
      if (duplicate) {
        hasErrors = true;
        continue;
      }
    }
    if (validateEdit) {
      const res = validateEdit(row) || { ok: true };
      if (!res.ok) {
        hasErrors = true;
        if (res.message) showToast(res.message, 'error');
        continue;
      }
    }
    validEdited.push(row);
  }

  if (hasErrors) return false;

  let okCount = 0;
  for (const r of validNew) {
    const ok = await saveAdd(r);
    if (ok) okCount++;
    if (ok) {
      try {
        r._saved = true;
        r._suppressDuplicateCheck = true;
        r._showValidation = false;
        r._suppressValidationUntilNextAttempt = true;
      } catch {
        /* noop */
      }
    }
  }
  for (const r of validEdited) {
    const ok = await saveUpdate(r);
    if (ok) okCount++;
    if (ok) {
      try {
        r._saved = true;
        r._suppressDuplicateCheck = true;
        r._showValidation = false;
        r._suppressValidationUntilNextAttempt = true;
      } catch {
        /* noop */
      }
    }
  }
  return okCount > 0;
}
