// components/StorageFileList.tsx
'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { FiDownload } from 'react-icons/fi';
import { API_URL } from '../config/api';
import { StorageFile, Column, StorageFileListRef } from '../types/storage';
import { StorageTable } from './StorageTable';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const columns: Column<StorageFile>[] = [
  {
    key: 'nome',
    label: 'Nome'
  },
  {
    key: 'size',
    label: 'Tamanho',
    render: (row: StorageFile) => formatFileSize(row.size)
  },
  {
    key: 'created_at',
    label: 'Data',
    render: (row: StorageFile) => new Date(row.created_at).toLocaleDateString()
  }
];

const StorageFileList = forwardRef<StorageFileListRef>((_, ref) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

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

  if (isLoading) return <div className="text-gray-600">Carregando arquivos...</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
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
        <div className="text-gray-500 text-center py-4">Nenhum arquivo encontrado</div>
      ) : (
        <div className="overflow-x-auto">
          <StorageTable<StorageFile>
            data={files}
            columns={columns}
          />
        </div>
      )}
    </>
  );
});

StorageFileList.displayName = 'StorageFileList';

export default StorageFileList;