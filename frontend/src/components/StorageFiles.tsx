'use client';

import { useState, useEffect } from 'react';
import { FiTrash2, FiDownload } from 'react-icons/fi';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SortableTable, { Column } from './SortableTable';
import { API_URL } from '../config/api';
import { formatFileSize } from '../utils/format';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useDebounce } from '@/hooks/useDebounce';

interface StorageFile {
  nome: string;
  size: number;
  created_at: string;
  url: string;
}

interface StorageFilesProps {
  onDownloadAll: () => void;
  onClearStorage: () => void;
  loading: boolean;
}

const StorageFiles = ({ onDownloadAll, onClearStorage, loading }: StorageFilesProps) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/storage-files/`);
      if (!response.ok) {
        throw new Error('Falha ao carregar arquivos');
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Erro ao carregar arquivos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo ${fileName}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/storage-files/${fileName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir arquivo');
      }

      fetchFiles();
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao excluir arquivo');
    }
  };

  const columns: Column<StorageFile>[] = [
    {
      key: 'nome',
      label: 'Nome do Arquivo'
    },
    {
      key: 'size',
      label: 'Tamanho',
      render: (value) => formatFileSize(value)
    },
    {
      key: 'created_at',
      label: 'Data de Criação',
      render: (value) => new Date(value).toLocaleString()
    }
  ];

  const filteredFiles = files.filter(file =>
    file.nome.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6b342f]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Buscar por nome do arquivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onDownloadAll}
            disabled={loading}
            className="gap-2"
          >
            <FiDownload className="h-4 w-4" />
            Download Todos
          </Button>
          <Button
            variant="outline"
            onClick={onClearStorage}
            disabled={loading}
            className="gap-2"
          >
            <FiTrash2 className="h-4 w-4" />
            Limpar Storage
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <SortableTable
          data={filteredFiles}
          columns={columns}
          actions={(item) => (
            <div className="flex gap-2">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b49d6b] hover:text-[#a08b5f] transition-colors duration-200"
                title="Download"
              >
                <FiDownload className="w-4 h-4" />
              </a>
              <button
                onClick={() => handleDelete(item.nome)}
                className="text-red-500 hover:text-red-700 transition-colors duration-200"
                title="Excluir"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default StorageFiles;
