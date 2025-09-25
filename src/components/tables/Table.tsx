import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";

interface Column {
  id: string;
  key?: string;
  header?: string;
  cell?: (context: { row: any; value: any }) => React.ReactNode;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  accessorFn?: (row: any) => any;

}

interface CustomTableProps {
  data?: any[];
  columns?: Column[];
  pagination?: boolean;
  selection?: boolean;
  lastPage?: number;
  total?: number;
  loading?: boolean;
  checkedData?: any[];
  setCheckedData?: (data: any[]) => void;
  // Optional callbacks for parent notifications
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onRowClick?: (rowData: any) => void;
}

export default function CustomTable({
  data = [],
  columns = [],
  pagination = false,
  selection = false,
  lastPage = 1,
  total = 0,
  loading = false,
  checkedData = [],
  setCheckedData,
  onPageChange,
  onPerPageChange,
  onRowClick,
}: CustomTableProps) {
  // Internal pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Handle page change internally and notify parent if callback exists
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > lastPage) return;
    setPage(newPage);
    if (onPageChange) onPageChange(newPage);
  };

  // Handle perPage change internally, reset page to 1 and notify parent
  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
    if (onPerPageChange) onPerPageChange(newPerPage);
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (!setCheckedData) return;

    if (checked) {
      setCheckedData(data);
    } else {
      setCheckedData([]);
    }
  };

  // Handle individual row selection
  const handleRowSelect = (row: any, checked: boolean) => {
    if (!setCheckedData) return;

    if (checked) {
      setCheckedData([...checkedData, row]);
    } else {
      setCheckedData(checkedData.filter((item) => item.id !== row.id));
    }
  };

  // Check if all rows are selected
  const isAllSelected = data.length > 0 && checkedData.length == data.length;
  const isIndeterminate =
    checkedData.length > 0 && checkedData.length < data.length;

  // Render cell content based on column configuration
  const renderCellContent = (column: Column, row: any) => {
    const value = column.accessorFn ? column.accessorFn(row) : row[column.id];

    if (column.cell) {
      return column.cell({ row, value });
    }

    if (column.render) {
      return column.render(value, row);
    }

    return value;
  };

  // Pagination component using internal state and handlers
  const renderPagination = () => {
    if (!pagination) return null;

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
          <select
            value={perPage}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            className="ml-1 px-2 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value={20}>20</option>
            <option value={40}>40</option>
            <option value={60}>60</option>
            <option value={80}>80</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            from {total} rows
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} from {lastPage}
          </span>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page == 1}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200"
          >
            &lt;
          </button>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page == lastPage}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200"
          >
            &gt;
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }
  if (!data || data.length == 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-full">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {selection && (
                    <TableCell isHeader className="px-5 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={column?.id}
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      {column.header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          {/* Empty state */}
          <div className="flex flex-wrap justify-center p-6">
            {/* <img src="/assets/icons/empty.svg" alt="empty" className="w-32 h-32" /> */}
            <div className="w-full text-center">
              <h6 className="text-lg text-gray-700 font-medium">No Data Found</h6>
              <p className="text-gray-500">No data available to display</p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-full">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {selection && (
                  <TableCell isHeader className="px-5 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column?.id}
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    {column.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {data.length == 0 ? (
                <TableRow className="flex justify-center">
                  <TableCell
                    className="px-5 py-12 text-center flex justify-center text-gray-500 dark:text-gray-400"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => {
                  const isClickable = !!onRowClick;

                  return (
                    <TableRow key={row.id || index} onClick={() => isClickable && onRowClick(row)} className={isClickable ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : ""}>
                      {selection && (
                        <TableCell className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={checkedData.some(
                              (item) => item.id == row.id
                            )}
                            onChange={(e) =>
                              handleRowSelect(row, e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell key={column.id} className="px-5 py-4 text-start">
                          <div className="text-gray-800 text-theme-sm dark:text-white/90">
                            {renderCellContent(column, row)}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {renderPagination()}
    </div>
  );
}
