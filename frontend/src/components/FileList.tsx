'use client';

import React from 'react';
import { useState } from 'react';
import { TrashIcon } from './TrashIcon';
import { STORAGE_KEY } from '../config/storage';

interface UploadedFile {
  nome: string;
  url: string;
}

interface FileListProps {
  files: UploadedFile[];
  onDelete: (nome: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onDelete }) => {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  // Atualizar localStorage quando um arquivo for deletado
  const handleDelete = (nome: string) => {
    onDelete(nome);
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        const updatedFiles = parsedFiles.filter((file: UploadedFile) => file.nome !== nome);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
      } catch (e) {
        console.error('Erro ao atualizar localStorage:', e);
      }
    }
  };

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Arquivos Processados:</h3>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.nome}
            className="flex items-center justify-between p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <button
                onClick={() => setExpandedFile(expandedFile === file.nome ? null : file.nome)}
                className="text-left w-full"
              >
                <span className="font-medium text-gray-700">{file.nome}</span>
              </button>
              {expandedFile === file.nome && (
                <div className="mt-2 text-sm text-gray-600">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visualizar PDF
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => handleDelete(file.nome)}
              className="ml-2 p-1 text-red-600 hover:text-red-800 transition-colors"
              title="Remover arquivo"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
