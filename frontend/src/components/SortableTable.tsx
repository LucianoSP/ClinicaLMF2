'use client';

import { useState } from 'react';
import { BiSortAlt2, BiSortUp, BiSortDown } from 'react-icons/bi';
import { BsCheckLg } from 'react-icons/bs';
import { IoClose } from 'react-icons/io5';
import { FiCheck, FiX, FiEdit, FiTrash2 } from 'react-icons/fi';

type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T;
  label: string;
  editable?: boolean;
  type?: 'boolean' | 'text' | 'string' | 'date';
  render?: (value: any, item: T) => React.ReactNode;
  className?: string; // Adicionando suporte para className
  style?: React.CSSProperties; // Adicionando suporte para style
}

export default function SortableTable<T>({
  data,
  columns,
  onEdit,
  onDelete,
  editingId,
  onSave,
  onCancelEdit,
  onCellEdit,
  actions
}: {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  editingId?: string;
  onSave?: (item: T) => void;
  onCancelEdit?: () => void;
  onCellEdit?: (item: T, key: keyof T, value: any) => void;
  actions?: (item: T) => React.ReactNode;
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
                className={`px-3 py-1.5 text-left cursor-pointer select-none hover:bg-gray-100 transition-colors text-xs font-medium text-gray-500 ${column.className || ''}`}
                style={{ whiteSpace: 'nowrap', ...column.style }}
              >
                <div className="flex items-center gap-1">
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
            {(onEdit || onDelete || onSave || actions) && (
              <th className="px-3 py-1.5 text-xs font-medium text-gray-500 w-[100px]">
                <div className="text-center">Ações</div>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr
              key={index}
              className={`border-t border-gray-200 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              } hover:bg-gray-100`}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`px-3 py-1.5 text-xs text-gray-900 ${column.className || ''}`}
                  style={column.style}
                >
                  {column.editable && editingId === (item as any).codigo_ficha ? (
                    column.type === 'boolean' ? (
                      <select
                        value={String(item[column.key])}
                        onChange={(e) => onCellEdit?.(item, column.key, e.target.value === 'true')}
                        className="w-full px-2 py-1 border rounded focus:outline-none focus:border-[#b49d6b]"
                      >
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={String(item[column.key] || '')}
                        onChange={(e) => {
                          e.stopPropagation();
                          onCellEdit?.(item, column.key, e.target.value);
                        }}
                        onBlur={(e) => {
                          if (column.key === 'codigo_ficha') {
                            e.stopPropagation();
                          }
                        }}
                        className="w-full px-2 py-1 border rounded focus:outline-none focus:border-[#b49d6b]"
                        autoFocus={column.key !== 'codigo_ficha'}
                      />
                    )
                  ) : (
                    <span className="block w-full">
                      {column.render ? (
                        column.render(item[column.key], item)
                      ) : column.type === 'boolean' ? (
                        <div className="flex items-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${item[column.key] === true || String(item[column.key]) === 'true'
                            ? 'bg-[#dcfce7] text-[#15803d]'
                            : 'bg-[#fef9c3] text-[#854d0e]'
                            }`}>
                            {item[column.key] === true || String(item[column.key]) === 'true' ? (
                              <><FiCheck className="w-3 h-3" />Sim</>
                            ) : (
                              <><FiX className="w-3 h-3" />Não</>
                            )}
                          </span>
                        </div>
                      ) : String(item[column.key] || '')}
                    </span>
                  )}
                </td>
              ))}
              {(onEdit || onDelete || onSave || actions) && (
                <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap w-[100px]">
                  <div className="flex items-center justify-end space-x-2">
                    {actions ? (
                      actions(item)
                    ) : (
                      <>
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-[#b49d6b] hover:text-[#a08b5f] transition-colors"
                            title="Editar"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="Excluir"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + ((onEdit || onDelete || onSave || actions) ? 1 : 0)}
                className="px-3 py-1.5 text-center text-xs text-gray-500"
              >
                Nenhum registro encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}