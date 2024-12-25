import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { TrashIcon } from './TrashIcon';
import { API_URL } from '../config/api';
import { FiDownload } from 'react-icons/fi';

interface StorageFile {
  nome: string;
  url: string;
  created_at: string;
  size: number;
}

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StorageFileList = forwardRef<StorageTableRef>((props, ref) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);

  const columns: Column<StorageFile>[] = [
    {
      key: 'nome' as keyof StorageFile,
      label: 'Nome'
    },
    {
      key: 'size' as keyof StorageFile,
      label: 'Tamanho',
      render: (row: StorageFile) => formatFileSize(row.size)
    },
    {
      key: 'created_at' as keyof StorageFile,
      label: 'Data',
      render: (row: StorageFile) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  export interface StorageFileListRef {
    fetchFiles: () => Promise<void>;
  }

  const StorageFileList = forwardRef<StorageFileListRef>((props, ref) => {
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
    const [downloadingAll, setDownloadingAll] = useState(false);



    // Rest of the code remains the same...

    return (
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        {/* ... other UI elements ... */}
        <StorageTable
          data={files}
          columns={columns}
        />
      </div>
    );
  });

  interface StorageTableProps<T> {
    data: T[];
    columns: Column<T>[];
  }

  function StorageTable<T>({ data, columns }: StorageTableProps<T>) {
    return (
      <table className="w-full">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={String(column.key)}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(column => (
                <td key={String(column.key)}>
                  {column.render ? column.render(row) : String(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  StorageFileList.displayName = 'StorageFileList';

  export default StorageFileList;