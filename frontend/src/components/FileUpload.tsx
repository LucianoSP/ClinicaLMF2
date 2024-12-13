'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { API_URL } from '../config/api';
import { STORAGE_KEY } from '../config/storage';
import FileList from './FileList';

interface FileInfo {
  nome: string;
  url: string;
}

interface UploadedFile {
  nome: string;
  url: string;
}

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Carregar arquivos do localStorage ao montar o componente
  useEffect(() => {
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        setUploadedFiles(parsedFiles);
      } catch (e) {
        console.error('Erro ao carregar arquivos do localStorage:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Atualizar localStorage sempre que uploadedFiles mudar
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles]);

  // Limpar mensagens de erro/sucesso ao mudar de página
  useEffect(() => {
    return () => {
      setError('');
      setSuccess('');
    };
  }, []);

  const handleDelete = (nome: string) => {
    setUploadedFiles(prev => prev.filter(file => file.nome !== nome));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('');
    setSuccess('');
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const handleUpload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (files.length === 0) {
      setError('Selecione pelo menos um arquivo para upload');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_URL}/upload-pdf/`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro no upload: ${response.status}`);
      }

      const results = await response.json();
      
      if (Array.isArray(results)) {
        // Separa resultados em sucesso e erro
        const successResults = results.filter(r => r.status === 'success');
        const errorResults = results.filter(r => r.status === 'error');

        // Processa arquivos com sucesso
        if (successResults.length > 0) {
          const newUploadedFiles = successResults.flatMap(r => r.uploaded_files || []);
          if (newUploadedFiles.length > 0) {
            setUploadedFiles(prev => {
              const uniqueFiles = [...prev];
              newUploadedFiles.forEach(newFile => {
                const existingIndex = uniqueFiles.findIndex(
                  file => file.nome.startsWith(newFile.nome.split('-')[0])
                );
                if (existingIndex >= 0) {
                  uniqueFiles[existingIndex] = newFile;
                } else {
                  uniqueFiles.push(newFile);
                }
              });
              return uniqueFiles;
            });
          }
          onUploadSuccess?.(); // Chama o callback de sucesso
        }

        // Monta mensagem de sucesso/erro
        const messages = [];
        if (successResults.length > 0) {
          messages.push(`${successResults.length} ${successResults.length === 1 ? 'arquivo processado' : 'arquivos processados'} com sucesso!`);
        }
        if (errorResults.length > 0) {
          const errorMessages = errorResults
            .map(r => `${r.filename}: ${r.message}`)
            .join('\n');
          messages.push(`Erros:\n${errorMessages}`);
        }

        // Atualiza mensagens na interface
        if (successResults.length > 0) {
          setSuccess(messages[0]);
        }
        if (errorResults.length > 0) {
          setError(messages[1]);
        }
      } else {
        setError('Resposta inválida do servidor');
      }
    } catch (err) {
      setError(`Erro ao fazer upload dos arquivos: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      console.error('Erro no upload:', err);
    } finally {
      setFiles([]);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[#C5A880] bg-[#C5A880]/10' : 'border-gray-300 hover:border-[#C5A880]'}`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          Arraste e solte arquivos PDF aqui, ou clique para selecionar
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-700">Arquivos Selecionados</h3>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="px-4 py-2 bg-[#C5A880] hover:bg-[#B39770] text-white rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Enviando...' : 'Enviar Arquivos'}
            </button>
          </div>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="mt-4 text-red-500">{error}</div>}
      {success && <div className="mt-4 text-green-500">{success}</div>}
    </div>
  );
};
