'use client';

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

export interface StorageFileListRef {
  fetchFiles: () => Promise<void>;
}

const StorageFileList = forwardRef<StorageFileListRef>((props, ref) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/storage-files/`);
      if (!response.ok) {
        throw new Error('Erro ao buscar arquivos');
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setFiles(data);
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

  const downloadAllFiles = async () => {
    try {
      setDownloadingAll(true);
      const response = await fetch(`${API_URL}/download-all-files`);
      
      if (!response.ok) {
        throw new Error('Erro ao baixar arquivos');
      }

      // Obter o nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'fichas.zip';

      // Criar um blob com o conteúdo do ZIP
      const blob = await response.blob();
      
      // Criar um link temporário para download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar arquivos:', error);
      alert('Erro ao baixar arquivos. Por favor, tente novamente.');
    } finally {
      setDownloadingAll(false);
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
        throw new Error('Erro ao limpar storage');
      }
      setFiles([]);
    } catch (err) {
      console.error('Erro ao limpar storage:', err);
      setError(err instanceof Error ? err.message : 'Erro ao limpar storage');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    setDeletingFiles(prev => new Set(prev).add(fileName));
    setError(null);
    try {
      const encodedFileName = encodeURIComponent(fileName);
      const response = await fetch(`${API_URL}/storage-files/${encodedFileName}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Erro ao deletar arquivo');
      }
      setFiles(prevFiles => prevFiles.filter(file => file.nome !== fileName));
    } catch (err) {
      console.error('Erro ao deletar arquivo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar arquivo');
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
    }
  };

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
        <div className="flex gap-2">
          <button
            onClick={downloadAllFiles}
            disabled={downloadingAll || isLoading || files.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#C5A880] text-white rounded hover:bg-[#b49d6b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            {downloadingAll ? 'Baixando...' : 'Baixar Todos'}
          </button>
          <button
            onClick={deleteAllFiles}
            disabled={isLoading || files.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            Limpar Storage
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {files.length === 0 ? (
        <div className="text-gray-500">Nenhum arquivo encontrado</div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">{file.nome}</div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C5A880] hover:text-[#B39770] transition-colors"
                >
                  <FiDownload size={20} />
                </a>
                <button
                  onClick={() => deleteFile(file.nome)}
                  disabled={deletingFiles.has(file.nome)}
                  className={`text-[#C5A880] hover:text-[#B39770] transition-colors ${
                    deletingFiles.has(file.nome) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {deletingFiles.has(file.nome) ? (
                    <div className="w-5 h-5 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <TrashIcon className="w-5 h-5" />
                  )}
                </button>
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
