// Insert a new record at the top of the current page within a full dataset array.
// Works with client-side pagination (all records in memory).
// - newRecord: object to insert
// - data: full array of records
// - currentPage: 1-based page index
// - pageSize: number of rows per page
export function insertAtCurrentPage(newRecord, data, currentPage, pageSize) {
  if (!Array.isArray(data)) return [newRecord];
  const safePage = Math.max(1, Number(currentPage) || 1);
  const safeSize = Math.max(1, Number(pageSize) || 1);
  const startIndex = (safePage - 1) * safeSize;
  return [
    ...data.slice(0, startIndex),
    newRecord,
    ...data.slice(startIndex)
  ];
}

// Convenience helper: given a React setState callback for data, insert in place.
// Usage:
//   setData(prev => insertAtCurrentPageIntoState(newRecord, prev, currentPage, pageSize));
export function insertAtCurrentPageIntoState(newRecord, prevData, currentPage, pageSize) {
  return insertAtCurrentPage(newRecord, prevData, currentPage, pageSize);
}


