'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { FiDownload } from 'react-icons/fi';
import { API_URL } from '../config/api';

interface StorageFile {
  nome: string;
  url: string;
  created_at: string;
  size: number;
}

interface Column {
  key: 'nome' | 'size' | 'created_at';
  label: string;
  render?: (value: any) => React.ReactNode;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export interface StorageFileListRef {
  fetchFiles: () => Promise<void>;
}

const StorageFileList = forwardRef<StorageFileListRef>((_, ref) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const columns: Column[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'size', label: 'Tamanho', render: formatFileSize },
    { key: 'created_at', label: 'Data', render: (date) => new Date(date).toLocaleDateString() }
  ];

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/storage-files/`);
      if (!response.ok) throw new Error('Erro ao buscar arquivos');
      const data = await response.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar arquivos');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAllFiles = async () => {
    let blobUrl: string | null = null;
    try {
      setDownloadingAll(true);
      const response = await fetch(`${API_URL}/download-all-files`);
      if (!response.ok) throw new Error('Erro ao baixar arquivos');
      const blob = await response.blob();
      blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'fichas.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      alert('Erro ao baixar arquivos. Por favor, tente novamente.');
    } finally {
      if (blobUrl) window.URL.revokeObjectURL(blobUrl);
      setDownloadingAll(false);
    }
  };

  useImperativeHandle(ref, () => ({ fetchFiles }));

  useEffect(() => {
    fetchFiles();
  }, []);

  if (isLoading) return <div className="mt-4 text-gray-600">Carregando arquivos...</div>;

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Arquivos no Storage</h2>
        <button
          onClick={downloadAllFiles}
          disabled={downloadingAll || files.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#C5A880] text-white rounded hover:bg-[#b49d6b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FiDownload className="w-4 h-4" />
          {downloadingAll ? 'Baixando...' : 'Baixar Todos'}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {files.length === 0 ? (
        <div className="text-gray-500">Nenhum arquivo encontrado</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="text-left p-2">{col.label}</th>
              ))}
              <th className="text-right p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <tr key={index} className="border-t">
                {columns.map(col => (
                  <td key={col.key} className="p-2">
                    {col.render ? col.render(file[col.key]) : file[col.key]}
                  </td>
                ))}
                <td className="p-2 text-right">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C5A880] hover:text-[#B39770] transition-colors"
                  >
                    <FiDownload size={20} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

StorageFileList.displayName = 'StorageFileList';

export default StorageFileList;