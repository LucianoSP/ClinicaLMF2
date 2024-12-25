// components/StorageTable.tsx
import React from 'react';
import { FiDownload } from 'react-icons/fi';
import { TableProps } from '../types/storage';

export const StorageTable = <T extends { url: string }>({ data, columns }: TableProps<T>) => (
  <table className="w-full">
    <thead>
      <tr className="bg-gray-50">
        {columns.map(col => (
          <th key={String(col.key)} className="text-left p-4 text-sm font-medium text-gray-600">{col.label}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((item, index) => (
        <tr key={index} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
          {columns.map(col => (
            <td key={String(col.key)} className="p-4 text-sm text-gray-900">
              {col.render ? col.render(item) : String(item[col.key])}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);