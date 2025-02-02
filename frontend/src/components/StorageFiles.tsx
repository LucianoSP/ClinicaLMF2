'use client';

import { useState, useEffect } from 'react';
import { FiTrash2, FiDownload } from 'react-icons/fi';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SortableTable, { Column } from './SortableTable';
import { API_URL } from '@/config/env';
import { formatFileSize } from '../utils/format';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { TableActions } from './ui/table-actions';
import { useDebounce } from '@/hooks/useDebounce';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface StorageFile {
  nome: string;
  size: number;
  created_at: string;
  url: string;
  [key: string]: any;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/storage-files?page=${currentPage}&per_page=${itemsPerPage}&search=${debouncedSearchTerm}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar arquivos');
      }
      const data = await response.json();
      console.log('Dados recebidos:', data);

      // Normalizar os dados para o formato esperado
      const normalizedFiles = Array.isArray(data) ? data : data.items || [];
      const files = normalizedFiles.map(file => ({
        nome: file.nome || file.name || '',
        size: typeof file.size === 'number' ? file.size : 0,
        created_at: file.created_at || file.createdAt || new Date().toISOString(),
        url: file.url || ''
      }));

      console.log('Dados normalizados:', files);
      setFiles(files);
      setTotalPages(Math.ceil(files.length / itemsPerPage));
    } catch (error) {
      console.error('Error:', error);
      setError('Erro ao carregar arquivos');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha ao baixar arquivo');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = url.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      const response = await fetch(`${API_URL}/delete-file/${fileName}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falha ao excluir arquivo');
      fetchFiles();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const columns: Column<StorageFile>[] = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (value) => value || 'Sem nome'
    },
    {
      key: 'size',
      label: 'Tamanho',
      sortable: true,
      render: (value) => formatFileSize(value || 0)
    },
    {
      key: 'created_at',
      label: 'Data de Criação',
      sortable: true,
      render: (value) => new Date(value || new Date()).toLocaleString()
    },
    {
      key: 'url',
      label: 'Ações',
      render: (_, file) => (
        <TableActions
          onDownload={() => handleDownload(file.url)}
          onDelete={() => handleDelete(file.nome)}
        />
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Buscar arquivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
          <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onDownloadAll}
            disabled={loading || !files.length}
          >
            <FiDownload className="h-4 w-4 mr-2" />
            Baixar Todos
          </Button>
          <Button
            onClick={onClearStorage}
            disabled={loading || !files.length}
            variant="destructive"
          >
            <FiTrash2 className="h-4 w-4 mr-2" />
            Limpar Storage
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        {error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <SortableTable<StorageFile>
            data={files}
            columns={columns}
            loading={isLoading}
          />
        )}
      </div>

      {totalPages > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          showItemsPerPageSelector={true}
        />
      )}
    </div>
  );
};

export default StorageFiles;
