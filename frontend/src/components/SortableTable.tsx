'use client';

import { useState } from 'react';
import { BiSortAlt2, BiSortUp, BiSortDown } from 'react-icons/bi';
import { BsCheckLg } from 'react-icons/bs';
import { IoClose } from 'react-icons/io5';
import { FiCheck, FiX } from 'react-icons/fi';

type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T;
  label: string;
  editable?: boolean;
  type?: 'boolean' | 'text' | 'string' | 'date';
  render?: (value: any, item: T) => React.ReactNode;
}

export function SortableTable<T>({ 
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
            {(onEdit || onDelete || onSave || actions) && (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                Ações
              </th>
            )}
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
                          // Prevent immediate save when editing codigo_ficha
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
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${
                            item[column.key] === true || String(item[column.key]) === 'true'
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
                <td className="px-4 py-2 text-xs text-gray-900">
                  <div className="flex gap-2">
                    {onEdit && editingId !== (item as any).codigo_ficha && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-[#b49d6b] hover:text-[#a08b5f] transition-colors duration-200"
                        title="Editar"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </button>
                    )}
                    {onSave && editingId === (item as any).codigo_ficha && (
                      <>
                        <button
                          onClick={() => onSave(item)}
                          className="text-green-600 hover:text-green-700 transition-colors duration-200"
                          title="Salvar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={onCancelEdit}
                          className="text-red-600 hover:text-red-700 transition-colors duration-200"
                          title="Cancelar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                    {onDelete && !editingId && (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-[#b49d6b] hover:text-[#a08b5f] transition-colors duration-200"
                        title="Excluir"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    )}
                    {actions && (
                      <td className="px-4 py-2">
                        {actions(item)}
                      </td>
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
                className="px-4 py-2 text-center text-xs text-gray-500"
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
