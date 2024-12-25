import React, { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { TrashIcon } from './TrashIcon';
import { API_URL } from '../config/api';
import { FiDownload } from 'react-icons/fi';

type StorageFile = {
  nome: string;
  url: string;
  created_at: string;
  size: number;
  mime_type?: string;
};

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type StorageTableProps<T> = {
  data: T[];
  columns: Column<T>[];
};

type ApiResponse<T> = {
  data: T;
  error?: string;
};

export interface StorageFileListRef {
  fetchFiles: () => Promise<void>;
}

const StorageTable = <T extends StorageFile>({ data, columns }: StorageTableProps<T>) => {
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <table className="w-full">
      <thead>
        <tr>
          {columns.map(column => (
            <th key={String(column.key)} className="px-4 py-2 text-left">{column.label}</th>
          ))}
          <th className="px-4 py-2 text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-t">
            {columns.map(column => (
              <td key={String(column.key)} className="px-4 py-2">
                {column.render ? column.render(row) : String(row[column.key])}
              </td>
            ))}
            <td className="px-4 py-2 text-right">
              <div className="flex justify-end space-x-2">
                {isValidUrl(row.url) ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C5A880] hover:text-[#B39770] transition-colors"
                    onClick={(e) => {
                      if (row.mime_type && !row.mime_type.startsWith('application/')) {
                        e.preventDefault();
                        alert('Tipo de arquivo não suportado');
                      }
                    }}
                  >
                    <FiDownload size={20} />
                  </a>
                ) : (
                  <span className="text-red-500">URL inválida</span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StorageFileList = forwardRef<StorageFileListRef>((_, ref) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  const tableColumns: Column<StorageFile>[] = [
    {
      key: 'nome' as const,
      label: 'Nome'
    },
    {
      key: 'size' as const,
      label: 'Tamanho',
      render: (row: StorageFile) => formatFileSize(row.size)
    },
    {
      key: 'created_at' as const,
      label: 'Data',
      render: (row: StorageFile) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  const fetchFiles = useCallback(async (retryCount = 3) => {
    setIsLoading(true);
    setError(null);

    for (let i = 0; i < retryCount; i++) {
      try {
        const response = await fetch(`${API_URL}/storage-files/`);
        if (!response.ok) throw new Error('Erro ao buscar arquivos');

        const data = await response.json();
        if (Array.isArray(data)) {
          setFiles(data);
          break;
        } else {
          throw new Error('Formato de resposta inválido');
        }
      } catch (err) {
        if (i === retryCount - 1) {
          console.error('Erro ao buscar arquivos:', err);
          setError(err instanceof Error ? err.message : 'Erro ao buscar arquivos');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    setIsLoading(false);
  }, []);

  const downloadAllFiles = async () => {
    let blobUrl: string | null = null;
    try {
      setDownloadingAll(true);
      const response = await fetch(`${API_URL}/download-all-files`);
      if (!response.ok) throw new Error('Erro ao baixar arquivos');

      const contentType = response.headers.get('Content-Type');
      if (!contentType?.includes('application/zip')) {
        throw new Error('Formato de arquivo inválido');
      }

      const blob = await response.blob();
      blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'fichas.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar arquivos:', error);
      alert('Erro ao baixar arquivos. Por favor, tente novamente.');
    } finally {
      if (blobUrl) window.URL.revokeObjectURL(blobUrl);
      setDownloadingAll(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchFiles
  }));

  useEffect(() => {
    const controller = new AbortController();
    fetchFiles();
    return () => controller.abort();
  }, [fetchFiles]);

  if (isLoading) {
    return <div className="mt-4 text-gray-600">Carregando arquivos...</div>;
  }

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Arquivos no Storage</h2>
        <div className="flex gap-2">
          <button
            onClick={downloadAllFiles}
            disabled={downloadingAll || isLoading || files.length === 0 || processing.size > 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#C5A880] text-white rounded hover:bg-[#b49d6b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            {downloadingAll ? 'Baixando...' : 'Baixar Todos'}
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {files.length === 0 ? (
        <div className="text-gray-500">Nenhum arquivo encontrado</div>
      ) : (
        <div className="overflow-x-auto">
          <StorageTable<StorageFile>
            data={files}
            columns={tableColumns}
          />
        </div>
      )}
    </div>
  );
});

StorageFileList.displayName = 'StorageFileList';

export default StorageFileList;