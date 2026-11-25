/**
 * Utility functions for handling InlineEditableTable save operations
 * with immediate ID updates from API responses
 */

/**
 * Extracts ID from API response for new rows
 * Supports common response patterns:
 * - { data: { RESPONSE: [{ ID: 123 }] } }
 * - { data: { RESPONSE: [{ entityId: 123 }] } }
 * - { data: { RESPONSE: [{ entity_id: 123 }] } }
 * 
 * @param {Object} response - API response object
 * @param {string} responseKey - Key in response.data (e.g., 'DIVISION_MASTER_RESPONSE', 'HS_CODE_RESPONSE')
 * @param {string|Array<string>} idKeys - Possible ID field names (e.g., 'ID', 'division_id', ['ID', 'hsCodeID'])
 * @returns {number|null} - Extracted ID or null if not found
 */
export function extractIdFromResponse(response, responseKey, idKeys = ['ID']) {
  if (!response?.data?.[responseKey]?.[0]) return null;
  
  const responseItem = response.data[responseKey][0];
  const keys = Array.isArray(idKeys) ? idKeys : [idKeys];
  
  for (const key of keys) {
    if (responseItem[key] !== undefined && responseItem[key] !== null) {
      return responseItem[key];
    }
  }
  
  return null;
}

/**
 * Updates data state with newly saved rows that have IDs
 * This ensures IDs appear immediately without requiring a refresh
 * 
 * @param {Function} setData - React setState function for data
 * @param {Array} savedNewRows - Array of saved row objects with IDs
 * @param {number} insertIndex - Optional index to insert at (for current page insertion). If not provided, prepends at index 0.
 * @param {string|Array<string>} idField - Field name(s) to use for ID comparison to prevent duplicates (e.g., 'hs_code_id', 'data', ['id', 'hs_code_id'])
 */
export function updateDataWithNewRowIds(setData, savedNewRows, insertIndex = 0, idField = null) {
  if (!savedNewRows || savedNewRows.length === 0) return;
  
  setData((prevData) => {
    // Determine ID field(s) to check for duplicates
    // Try to auto-detect common ID field names if not provided
    let idFields = idField;
    if (!idFields) {
      // Check first saved row for common ID field names
      const firstRow = savedNewRows[0];
      if (firstRow.hs_code_id !== undefined) idFields = 'hs_code_id';
      else if (firstRow.data !== undefined && typeof firstRow.data === 'number') idFields = 'data';
      else if (firstRow.id !== undefined) idFields = 'id';
      else if (firstRow.division_id !== undefined) idFields = 'division_id';
      else if (firstRow.target_id !== undefined) idFields = 'target_id';
      else if (firstRow.platingSNo !== undefined) idFields = 'platingSNo';
      else idFields = ['id', 'hs_code_id', 'data', 'division_id', 'target_id', 'platingSNo'];
    }
    
    const idFieldsArray = Array.isArray(idFields) ? idFields : [idFields];
    
    // Collect IDs from new rows to check for duplicates
    const newRowIds = new Set();
    savedNewRows.forEach(newRow => {
      idFieldsArray.forEach(field => {
        if (newRow[field] !== undefined && newRow[field] !== null) {
          newRowIds.add(String(newRow[field])); // Convert to string for consistent comparison
        }
      });
    });
    
    // Remove any existing rows that have the same ID as the new rows to prevent duplicates
    // This handles the case where a refresh might have already included the new row from server
    // IMPORTANT: Also filter out rows that don't have an ID yet but match by content
    // This prevents replacing a row that was just inserted but doesn't have an ID yet
    const filteredPrevData = prevData.filter(existingRow => {
      // Check if this existing row matches any of the new rows by ID
      const matchesNewRowById = idFieldsArray.some(field => {
        const existingId = existingRow[field];
        if (existingId === undefined || existingId === null) return false;
        return newRowIds.has(String(existingId));
      });
      
      // If it matches by ID, remove it (we'll replace it with the new row that has the ID)
      if (matchesNewRowById) return false;
      
      // CRITICAL FIX: Only match by content if the existing row truly has NO ID
      // This prevents matching rows that already have IDs when saving sequentially
      const hasNoId = idFieldsArray.every(field => {
        const existingId = existingRow[field];
        return existingId === undefined || existingId === null || existingId === '';
      });
      
      // If existing row has no ID, check if it matches any new row by comparing all fields
      // This prevents keeping a row without ID when we're inserting a row with the same content but with ID
      // IMPORTANT: Only match if existing row has NO ID at all - if it has any ID, skip content matching
      if (hasNoId) {
        const matchesNewRowByContent = savedNewRows.some(newRow => {
          // First, ensure the new row actually has an ID (should always be true, but double-check)
          const newRowHasId = idFieldsArray.some(field => {
            const newId = newRow[field];
            return newId !== undefined && newId !== null && newId !== '';
          });
          
          // If new row doesn't have an ID, don't match (shouldn't happen, but safety check)
          if (!newRowHasId) return false;
          
          // Compare all non-ID fields to see if they're the same row
          // Use a more strict matching: require at least one key field to match
          const allKeys = new Set([...Object.keys(existingRow), ...Object.keys(newRow)]);
          let matches = true;
          let hasAtLeastOneNonEmptyMatch = false;
          
          for (const key of allKeys) {
            // Skip ID fields, internal fields
            if (idFieldsArray.includes(key)) continue;
            if (key.startsWith('_')) continue;
            
            const existingVal = existingRow[key];
            const newVal = newRow[key];
            
            // If both are empty/null/undefined, consider them equal but don't count as a match
            if ((!existingVal || existingVal === '') && (!newVal || newVal === '')) continue;
            
            // If we have at least one non-empty value, mark that we have a potential match
            if (existingVal || newVal) {
              hasAtLeastOneNonEmptyMatch = true;
            }
            
            // Compare values
            if (String(existingVal || '').trim() !== String(newVal || '').trim()) {
              matches = false;
              break;
            }
          }
          
          // Only return true if all fields match AND we have at least one non-empty field
          // This prevents matching empty rows or rows with only default values
          return matches && hasAtLeastOneNonEmptyMatch;
        });
        
        // If it matches by content, remove it (it's likely the same row without ID)
        if (matchesNewRowByContent) return false;
      }
      
      // Keep the row if it doesn't match any new row
      return true;
    });
    
    // Also filter out duplicates within savedNewRows itself (just in case)
    const uniqueSavedRows = [];
    const seenIds = new Set();
    savedNewRows.forEach(newRow => {
      let isDuplicate = false;
      idFieldsArray.forEach(field => {
        const id = newRow[field];
        if (id !== undefined && id !== null) {
          const idStr = String(id);
          if (seenIds.has(idStr)) {
            isDuplicate = true;
          } else {
            seenIds.add(idStr);
          }
        }
      });
      if (!isDuplicate) {
        uniqueSavedRows.push(newRow);
      }
    });
    
    // Insert new rows with IDs at the specified position (or top if not specified)
    // InlineEditableTable's useEffect will sync this to its tableData,
    // updating the rows that were just inserted (without IDs) with the IDs
    const index = Math.max(0, Math.min(insertIndex, filteredPrevData.length));
    return [
      ...filteredPrevData.slice(0, index),
      ...uniqueSavedRows,
      ...filteredPrevData.slice(index)
    ];
  });
}

