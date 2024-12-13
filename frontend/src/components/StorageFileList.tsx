'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { TrashIcon } from './TrashIcon';
import { API_URL } from '../config/api';

interface StorageFile {
  nome: string;
  url: string;
  created_at: string;
  size: number;
}

export interface StorageFileListRef {
  fetchFiles: () => Promise<void>;
}

const StorageFileList = forwardRef<StorageFileListRef>((props, ref) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Buscando arquivos do storage...');
      const response = await fetch(`${API_URL}/storage-files/`);
      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar arquivos');
      }
      
      const data = await response.json();
      console.log('Dados recebidos:', data);
      
      if (Array.isArray(data)) {
        setFiles(data);
        console.log('Total de arquivos:', data.length);
      } else {
        console.error('Resposta não é um array:', data);
        setFiles([]);
      }
    } catch (err) {
      console.error('Erro ao buscar arquivos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar arquivos');
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchFiles
  }));

  const deleteAllFiles = async () => {
    if (!confirm('Tem certeza que deseja apagar todos os arquivos?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/storage-files/`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Erro ao deletar arquivos');
      }
      await fetchFiles(); // Recarrega a lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar arquivos');
    } finally {
      setIsLoading(false);
    }
  };

  // Formata o tamanho do arquivo para exibição
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  if (isLoading) {
    return <div className="mt-4 text-gray-600">Carregando arquivos...</div>;
  }

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Arquivos no Storage</h2>
        {files.length > 0 && (
          <button
            onClick={deleteAllFiles}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <TrashIcon className="h-5 w-5" />
            Apagar Todos
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <p className="text-gray-600">Nenhum arquivo encontrado no storage.</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.nome}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-800">{file.nome}</p>
                <p className="text-sm text-gray-600">
                  Tamanho: {formatFileSize(file.size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={file.url}
                  download
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

StorageFileList.displayName = 'StorageFileList';

export default StorageFileList;
