import { useState, useCallback } from 'react';
import { insertAtCurrentPage } from '../utils/paginationUtils';

// Reusable hook to control SortableTable pagination and easily insert new rows
// Usage:
//   const { rows, setRows, tableProps, insertNewRowAtTopOfCurrentPage } = usePaginatedTable(initialRows);
//   <SortableTable {...tableProps} data={rows} />
//   onCreateSuccess: insertNewRowAtTopOfCurrentPage(fullRecord)
export default function usePaginatedTable(initialRows = [], defaultPageSize = 25, _serverMode = false) {
  const [rows, setRows] = useState(Array.isArray(initialRows) ? initialRows : []);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');

  const insertNewRowAtTopOfCurrentPage = useCallback((record) => {
    setRows((prev) => insertAtCurrentPage(record, prev, currentPage, pageSize));
  }, [currentPage, pageSize]);

  const tableProps = {
    currentPage,
    onPageChange: setCurrentPage,
    pageSize,
    onPageSizeChange: setPageSize,
    totalRecords,
    setTotalRecords,
    sortConfig,
    setSortConfig,
    searchTerm,
    setSearchTerm,
  };

  return {
    rows,
    setRows,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalRecords,
    setTotalRecords,
    sortConfig,
    setSortConfig,
    searchTerm,
    setSearchTerm,
    tableProps,
    insertNewRowAtTopOfCurrentPage,
  };
}


