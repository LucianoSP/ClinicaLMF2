'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { API_URL } from '../config/api';
import { FileList } from './FileList';

interface FileInfo {
  nome: string;
  url: string;
}

const STORAGE_KEY = 'uploadedPDFFiles';

export function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);

  // Carregar arquivos do localStorage ao iniciar
  useEffect(() => {
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    if (savedFiles) {
      setUploadedFiles(JSON.parse(savedFiles));
    }
  }, []);

  // Salvar arquivos no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    setError(null);
    acceptedFiles.forEach(file => {
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 0
      }));
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const uploadFiles = async () => {
    setUploading(true);
    setError(null);

    try {
      const results = [];
      // Processar um arquivo por vez
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('files', file);

        try {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 1
          }));

          const response = await fetch(`${API_URL}/upload-pdf/`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            body: formData
          });

          const result = await response.json();
          const fileResult = result[0];

          if (fileResult.status === 'error') {
            setError(`Erro ao processar ${fileResult.filename}: ${fileResult.message}`);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: 0
            }));
          } else {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: 100
            }));
            
            // Adicionar arquivo à lista assim que for processado
            if (fileResult.uploaded_files && fileResult.uploaded_files.length > 0) {
              const newFile = fileResult.uploaded_files[0];
              setUploadedFiles(prev => {
                const exists = prev.some(file => file.nome === newFile.nome);
                if (!exists) {
                  return [...prev, newFile];
                }
                return prev;
              });
            }
          }

          results.push(fileResult);
        } catch (err) {
          console.error(`Erro ao processar ${file.name}:`, err);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 0
          }));
          setError(`Erro ao processar ${file.name}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
          results.push({
            status: 'error',
            filename: file.name,
            message: err instanceof Error ? err.message : 'Erro desconhecido'
          });
        }
      }

      const allSuccess = results.every(r => r.status === 'success');
      if (allSuccess) {
        const newUploadedFiles = results.flatMap(r => r.uploaded_files || []);
        if (newUploadedFiles.length > 0) {
          setUploadedFiles(prev => {
            const uniqueFiles = [...prev];
            newUploadedFiles.forEach(newFile => {
              const exists = uniqueFiles.some(file => file.nome === newFile.nome);
              if (!exists) {
                uniqueFiles.push(newFile);
              }
            });
            // Salvar no localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueFiles));
            return uniqueFiles;
          });
          setSuccess('Arquivos enviados com sucesso!');
        } else {
          setSuccess('Arquivos processados com sucesso!');
        }
        setFiles([]);
      }
    } catch (err) {
      setError('Erro ao fazer upload dos arquivos');
      console.error('Erro:', err);
    } finally {
      setUploading(false);
    }
  };

  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[#b49d6b] bg-[#b49d6b]/10' : 'border-gray-300 hover:border-[#b49d6b]'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-[#b49d6b]">Solte os arquivos aqui...</p>
        ) : (
          <p>Arraste e solte arquivos PDF aqui, ou <span className="text-[#b49d6b]">clique para selecionar</span></p>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Arquivos Selecionados</h3>
          <div className="bg-white rounded-lg shadow p-3">
            <div className="space-y-1">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="text-gray-700 text-sm truncate max-w-[70%]" title={file.name}>
                    {file.name}
                  </span>
                  {uploadProgress[file.name] > 0 && uploadProgress[file.name] < 100 && (
                    <span className="text-[#b49d6b] text-sm">Processando...</span>
                  )}
                  {uploadProgress[file.name] === 100 && (
                    <span className="text-green-500 text-sm">Concluído</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={uploadFiles}
            disabled={uploading}
            className={`mt-4 px-4 py-2 rounded text-white text-sm font-medium w-[120px] ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#b49d6b] hover:bg-[#a08b5f]'
            }`}
          >
            {uploading ? 'Processando...' : 'Processar'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <FileList files={uploadedFiles} onClear={clearUploadedFiles} />
      )}
    </div>
  );
}
