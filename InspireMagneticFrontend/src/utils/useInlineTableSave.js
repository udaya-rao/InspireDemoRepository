/**
 * Custom React hook for handling InlineEditableTable save operations
 * with immediate ID updates from API responses
 * 
 * This hook provides a reusable pattern for saving inline editable table data
 * and immediately displaying the returned IDs without requiring a full refresh.
 * 
 * @module useInlineTableSave
 */

import { flushSync } from 'react-dom';
import { extractIdFromResponse, updateDataWithNewRowIds } from './inlineTableSaveHelpers';

/**
 * @typedef {Object} SaveConfig
 * @property {Function} saveNewRow - Function to save a new row. Should return { success: boolean, id?: number, message?: string, row?: Object }
 * @property {Function} saveEditedRow - Function to save an edited row. Should return { success: boolean, message?: string }
 * @property {Function} setData - React setState function for the table data
 * @property {Object} tableRef - Ref to the InlineEditableTable component
 * @property {Function} [showToast] - Optional toast notification function (message, type)
 * @property {Function} [onRefresh] - Optional function to refresh data after updates
 * @property {Function} [transformNewRow] - Optional function to transform new row before adding to state: (row, id) => transformedRow
 * @property {Function} [validateRows] - Optional validation function: ({ newRows, editedRows }) => boolean
 * @property {boolean} [refreshAfterUpdates] - Whether to refresh after updates (default: true)
 */

/**
 * Custom hook for handling inline table saves with immediate ID display
 * 
 * @param {SaveConfig} config - Configuration object
 * @returns {Function} save handler function compatible with InlineEditableTable's onSave prop
 * 
 * @example
 * const handleSave = useInlineTableSave({
 *   saveNewRow: async (row) => {
 *     const res = await axios.post('/api/save', row);
 *     const id = extractIdFromResponse(res.data, 'RESPONSE', ['ID']);
 *     return { success: true, id, message: 'Saved!' };
 *   },
 *   saveEditedRow: async (row) => {
 *     const res = await axios.post('/api/update', row);
 *     return { success: true, message: 'Updated!' };
 *   },
 *   setData: setTableData,
 *   tableRef: tableRef,
 *   showToast: showToast,
 *   transformNewRow: (row, id) => ({ ...row, my_id: id, updated_at: new Date() })
 * });
 */
export function useInlineTableSave(config) {
  const {
    saveNewRow,
    saveEditedRow,
    setData,
    tableRef,
    showToast = () => {},
    onRefresh,
    transformNewRow = (row, id) => ({ ...row, id }),
    validateRows,
    refreshAfterUpdates = true,
  } = config;

  /**
   * Save handler for InlineEditableTable
   * @param {Object} params - { newRows: Array, editedRows: Array }
   * @returns {Promise<boolean>} - true on success, false on error
   */
  const handleSave = async ({ newRows = [], editedRows = [] }) => {
    let hasValidationErrors = false;
    let hasSuccessfulUpdates = false;
    const savedNewRows = []; // Store successfully saved new rows with their IDs
    const messages = []; // Collect success/error messages

    // Run custom validation if provided
    if (validateRows) {
      const isValid = validateRows({ newRows, editedRows });
      if (!isValid) {
        return false;
      }
    }

    // Process new rows (ADD operation)
    for (const newRow of newRows) {
      try {
        // Create a deep copy of the row to avoid any reference issues
        // This ensures each row gets its own unique data
        // CRITICAL: Use deep copy to prevent any shared references between sequential saves
        const rowCopy = JSON.parse(JSON.stringify(newRow));
        const result = await saveNewRow(rowCopy);
        
        if (result?.success) {
          if (result.id) {
            // Transform the row with the ID and add to saved rows
            // CRITICAL: Create a completely fresh deep copy to ensure no shared references
            // This is essential when saving rows sequentially - each row must be independent
            const freshRowCopy = JSON.parse(JSON.stringify(newRow));
            const transformedRow = transformNewRow(freshRowCopy, result.id);
            
            // Verify the transformed row has the correct ID
            // This helps catch any issues with the transformation
            const idFields = ['hs_code_id', 'data', 'id', 'division_id', 'target_id'];
            const hasCorrectId = idFields.some(field => {
              const transformedId = transformedRow[field];
              return transformedId !== undefined && transformedId !== null && transformedId === result.id;
            });
            
            if (!hasCorrectId) {
              console.error('CRITICAL: Transformed row does not have the expected ID:', {
                expectedId: result.id,
                transformedRow,
                originalRow: newRow,
                freshRowCopy: freshRowCopy
              });
              
              // Force the ID to be set correctly as a fallback
              // Check which ID field exists in the transformed row (transformNewRow might have set it but with wrong value)
              // or detect based on common patterns
              let idFieldToUse = null;
              
              // Check if any ID field exists but has wrong value - clear it first
              for (const field of idFields) {
                if (transformedRow[field] !== undefined && transformedRow[field] !== null) {
                  if (transformedRow[field] !== result.id) {
                    console.warn(`Found ID field '${field}' with wrong value ${transformedRow[field]}, will overwrite with ${result.id}`);
                  }
                  idFieldToUse = field;
                  break;
                }
              }
              
              // If no ID field found, try to detect based on row structure
              if (!idFieldToUse) {
                // Check for common patterns in the row
                if ('text' in transformedRow && 'rate' in transformedRow) {
                  // Likely GST Master - use 'data'
                  idFieldToUse = 'data';
                } else if ('main_category' in transformedRow || 'sub_category' in transformedRow) {
                  // Likely HS Code - use 'hs_code_id'
                  idFieldToUse = 'hs_code_id';
                } else if ('division_name' in transformedRow) {
                  // Likely Division - use 'division_id'
                  idFieldToUse = 'division_id';
                } else if ('target_name' in transformedRow) {
                  // Likely Target - use 'target_id'
                  idFieldToUse = 'target_id';
                } else {
                  // Default to 'data' for GST Master compatibility
                  idFieldToUse = 'data';
                }
              }
              
              // Set the ID in the detected field
              transformedRow[idFieldToUse] = result.id;
              
              console.warn('Fixed missing/incorrect ID in transformed row:', {
                id: result.id,
                fieldUsed: idFieldToUse,
                transformedRow
              });
            }
            
            // CRITICAL: Double-check that the ID is correct before adding to savedNewRows
            // This prevents rows with wrong IDs from being added
            const finalIdCheck = idFields.some(field => {
              const finalId = transformedRow[field];
              return finalId !== undefined && finalId !== null && finalId === result.id;
            });
            
            if (!finalIdCheck) {
              console.error('FATAL: Row still does not have correct ID after fix attempt:', {
                expectedId: result.id,
                transformedRow,
                result
              });
              // Don't add this row - it will cause issues
              throw new Error(`Failed to set ID ${result.id} on transformed row`);
            }
            
            // Log for debugging sequential saves
            console.log('Saved new row:', {
              id: result.id,
              rowIdField: idFields.find(f => transformedRow[f] === result.id),
              rowData: { ...transformedRow, _debugId: result.id },
              savedNewRowsCount: savedNewRows.length
            });
            
            savedNewRows.push(transformedRow);
          }
          if (result.message) {
            messages.push({ type: 'success', message: result.message });
          }
        } else {
          hasValidationErrors = true;
          if (result?.message) {
            messages.push({ type: 'error', message: result.message });
            showToast(result.message, 'error');
          }
        }
      } catch (error) {
        hasValidationErrors = true;
        const errorMsg = error.message || 'Failed to save row';
        messages.push({ type: 'error', message: errorMsg });
        showToast(errorMsg, 'error');
      }
    }

    // Process edited rows (UPDATE operation)
    for (const editedRow of editedRows) {
      try {
        const result = await saveEditedRow(editedRow);
        
        if (result?.success) {
          hasSuccessfulUpdates = true;
          if (result.message) {
            messages.push({ type: 'success', message: result.message });
          }
        } else {
          hasValidationErrors = true;
          if (result?.message) {
            messages.push({ type: 'error', message: result.message });
            showToast(result.message, 'error');
          }
        }
      } catch (error) {
        hasValidationErrors = true;
        const errorMsg = error.message || 'Failed to update row';
        messages.push({ type: 'error', message: errorMsg });
        showToast(errorMsg, 'error');
      }
    }

    // Update local data state with newly saved rows that have IDs
    // This ensures the ID appears immediately without requiring a refresh
    // BUT: If both new rows AND edited rows exist, skip local insertion and refresh instead
    // This allows new rows to appear in their natural server position, not forced to top
    const hasBothNewAndEdited = savedNewRows.length > 0 && hasSuccessfulUpdates;
    
    if (savedNewRows.length > 0 && !hasValidationErrors && !hasBothNewAndEdited) {
      // Only insert locally if there are NO edited rows
      // This way new rows appear at top when only creating
      // Get insertion index from table to maintain current page position
      const insertIndex = tableRef?.current?.getInsertIndex?.() ?? 0;
      // Use flushSync to ensure state update completes before InlineEditableTable clears newRows
      // Also pass idField to help prevent duplicates if refresh happens
      flushSync(() => {
        // Auto-detect ID field from first saved row
        const firstRow = savedNewRows[0];
        let idField = null;
        if (firstRow.hs_code_id !== undefined) idField = 'hs_code_id';
        else if (firstRow.data !== undefined && typeof firstRow.data === 'number') idField = 'data';
        else if (firstRow.id !== undefined) idField = 'id';
        else if (firstRow.division_id !== undefined) idField = 'division_id';
        else if (firstRow.target_id !== undefined) idField = 'target_id';
        
        // Log for debugging sequential saves
        console.log('Updating data with new row IDs:', {
          savedNewRows: savedNewRows.map(r => ({
            id: r.hs_code_id || r.data || r.id || r.division_id || r.target_id,
            idField: idField
          })),
          insertIndex: insertIndex
        });
        
        updateDataWithNewRowIds(setData, savedNewRows, insertIndex, idField);
      });
    }

    // Show success messages (only the last one to avoid spam)
    const successMessages = messages.filter(m => m.type === 'success');
    if (successMessages.length > 0 && !hasValidationErrors) {
      const lastSuccessMsg = successMessages[successMessages.length - 1].message;
      showToast(lastSuccessMsg, 'success');
    }

    // Refresh logic:
    // 1. If only edited rows: refresh to get authoritative server data
    // 2. If both new AND edited rows: refresh to get natural server order (new rows not at top)
    // 3. If only new rows: skip refresh (already inserted locally at top)
    if ((hasSuccessfulUpdates || hasBothNewAndEdited) && refreshAfterUpdates && onRefresh && !hasValidationErrors) {
      await onRefresh();
    }

    // Return false if there were validation errors to prevent InlineEditableTable from clearing rows
    if (hasValidationErrors) {
      return false;
    }

    // Signal success to InlineEditableTable
    return true;
  };

  return handleSave;
}

