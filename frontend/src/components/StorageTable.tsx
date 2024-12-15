'use client';

import { useState } from 'react';
import { BiSortAlt2, BiSortUp, BiSortDown } from 'react-icons/bi';

type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (item: T) => React.ReactNode;
}

export function StorageTable<T>({ 
  data, 
  columns,
}: { 
  data: T[]; 
  columns: Column<T>[];
}) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;

    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                onClick={() => handleSort(column.key)}
                className="px-4 py-2 text-left cursor-pointer select-none hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600"
                style={{ whiteSpace: 'nowrap' }}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  <span className="text-gray-400">
                    {sortKey === column.key ? (
                      sortDirection === 'asc' ? (
                        <BiSortUp className="w-3 h-3" />
                      ) : (
                        <BiSortDown className="w-3 h-3" />
                      )
                    ) : (
                      <BiSortAlt2 className="w-3 h-3" />
                    )}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr 
              key={index}
              className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-4 py-2 text-xs text-gray-900"
                >
                  {column.render ? column.render(item) : String(item[column.key] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
