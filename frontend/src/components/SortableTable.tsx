'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
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
  className?: string;
  style?: React.CSSProperties;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  editingId?: string;
  onSave?: (item: T) => void;
  onCancelEdit?: () => void;
  onCellEdit?: (item: T, key: keyof T, value: any) => void;
  actions?: (item: T) => React.ReactNode;
  loading?: boolean;
  meta?: any;
}

const SortableTable = forwardRef(<T,>(props: TableProps<T>, ref: any) => {
  const {
    data,
    columns,
    onEdit,
    onDelete,
    editingId,
    onSave,
    onCancelEdit,
    onCellEdit,
    actions,
    loading = false,
    meta
  } = props;

  useImperativeHandle(ref, () => ({
    meta
  }));
  
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  if (loading) {
    return (
      <div className="overflow-x-auto border rounded-md bg-white">
        <div className="p-4 text-center">Carregando...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="overflow-x-auto border rounded-md bg-white">
        <div className="p-4 text-center">Nenhum dado encontrado</div>
      </div>
    );
  }

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
    <div ref={ref} className="overflow-x-auto border rounded-md bg-white">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                onClick={() => handleSort(column.key)}
                className={`h-12 px-4 py-3.0 text-left align-middle text-sm font-medium hover:bg-gray-100/80 transition-colors [&:has([role=checkbox])]:pr-0 border-b ${
                  column.className?.includes('text-center') ? 'text-center' : ''
                } ${column.className || ''}`}
                style={{ whiteSpace: 'nowrap', ...column.style }}
              >
                <div className={`flex items-center ${column.className?.includes('text-center') ? 'justify-center' : 'gap-1'}`}>
                  {column.label}
                  <span className="text-muted-foreground/50 ml-1">
                    {sortKey === column.key ? (
                      sortDirection === 'asc' ? (
                        <BiSortUp className="w-4 h-4" />
                      ) : (
                        <BiSortDown className="w-4 h-4" />
                      )
                    ) : (
                      <BiSortAlt2 className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                    )}
                  </span>
                </div>
              </th>
            ))}
            {(onEdit || onDelete || onSave || actions) && (
              <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground w-[100px] border-b">
                <div className="text-center">Ações</div>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50/50">
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`px-4 py-2 border-b text-sm ${column.className || ''}`}
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
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item[column.key] === true || String(item[column.key]) === 'true'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
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
                <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap w-[100px] border-b">
                  <div className="flex items-center justify-center space-x-2">
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
        </tbody>
      </table>
    </div>
  );
});

export default SortableTable;