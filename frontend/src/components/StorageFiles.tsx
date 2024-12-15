'use client';

import { useState, useEffect } from 'react';
import { FiTrash2, FiDownload } from 'react-icons/fi';
import { StorageTable } from './StorageTable';
import { API_URL } from '../config/api';
import { formatFileSize } from '../utils/format';

interface StorageFile {
  nome: string;
  size: number;
  created_at: string;
  url: string;
}

const StorageFiles = () => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
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
      setLoading(false);
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

      // Atualiza a lista após excluir
      fetchFiles();
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao excluir arquivo');
    }
  };

  const columns = [
    {
      key: 'nome',
      label: 'Nome do Arquivo',
    },
    {
      key: 'size',
      label: 'Tamanho',
      render: (row: StorageFile) => formatFileSize(row.size)
    },
    {
      key: 'created_at',
      label: 'Data de Criação',
      render: (row: StorageFile) => new Date(row.created_at).toLocaleString()
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (row: StorageFile) => (
        <div className="flex gap-2">
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#b49d6b] hover:text-[#a08b5f]"
            title="Download"
          >
            <FiDownload className="w-4 h-4" />
          </a>
          <button
            onClick={() => handleDelete(row.nome)}
            className="text-[#8B4513] hover:text-[#7a3d10]"
            title="Excluir"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="w-full">
      <StorageTable
        data={files}
        columns={columns}
      />
    </div>
  );
};

export default StorageFiles;
