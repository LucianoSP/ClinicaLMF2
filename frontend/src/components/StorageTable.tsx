// components/StorageTable.tsx
import React from 'react';
import { TableProps } from '../types/storage';

export const StorageTable = <T extends { url: string }>({ data, columns }: TableProps<T>) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr className="bg-gray-50">
          {columns.map(col => (
            <th 
              key={String(col.key)} 
              className="px-4 py-2 text-left text-xs font-medium text-gray-600"
              style={{ whiteSpace: 'nowrap' }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr 
            key={index} 
            className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
          >
            {columns.map(col => (
              <td 
                key={String(col.key)} 
                className="px-4 py-2 text-xs text-gray-900"
              >
                {col.render ? col.render(item) : String(item[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);