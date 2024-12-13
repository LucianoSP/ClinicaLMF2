'use client';

import { useState } from 'react';
import { API_URL } from '../config/api';

interface FileInfo {
  nome: string;
  url: string;
}

interface FileListProps {
  files: FileInfo[];
  onClear: () => void;
}

export function FileList({ files, onClear }: FileListProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClear = async () => {
    if (!confirm('Tem certeza que deseja apagar todos os arquivos?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/delete-files/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(files.map(f => f.nome)),
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar arquivos');
      }

      onClear();
    } catch (error) {
      console.error('Erro ao deletar arquivos:', error);
      alert('Erro ao deletar arquivos. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Arquivos Disponíveis</h3>
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3">
              <span className="text-gray-700 truncate max-w-[70%]" title={file.nome}>
                {file.nome}
              </span>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b49d6b] hover:text-[#a08b5f] transition-colors"
                download
                title="Download"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={handleClear}
        disabled={isDeleting}
        className={`mt-4 px-4 py-2 rounded text-white text-sm font-medium ${
          isDeleting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#dc3545] hover:bg-[#c82333]'
        }`}
      >
        {isDeleting ? 'Apagando...' : 'Apagar Todos os Arquivos'}
      </button>
    </div>
  );
}
