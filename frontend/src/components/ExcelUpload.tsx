'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export function ExcelUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setSuccess(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5000/upload-excel/', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFile(null);
        router.refresh();
      } else {
        setError(result.detail || 'Erro ao processar o arquivo');
      }
    } catch (err) {
      setError('Erro ao fazer upload do arquivo. Verifique se o servidor está rodando.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[#6b342f] bg-[#6b342f]/10' : 'border-gray-300 hover:border-[#6b342f]'}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          {isDragActive ? (
            <p className="text-[#6b342f]">Solte o arquivo aqui...</p>
          ) : (
            <>
              <p>Arraste e solte uma planilha Excel aqui, ou clique para selecionar</p>
              <p className="text-sm text-gray-500">Apenas arquivos .xls e .xlsx são aceitos</p>
            </>
          )}
        </div>
      </div>

      {file && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Arquivo selecionado:</p>
          <p className="font-medium">{file.name}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-3 rounded-lg flex items-center space-x-2 text-red-700">
          <XCircleIcon className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 p-3 rounded-lg flex items-center space-x-2 text-green-700">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
          <p>Arquivo processado com sucesso!</p>
        </div>
      )}

      <button
        onClick={uploadFile}
        disabled={!file || uploading}
        className={`
          flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium w-full
          ${!file || uploading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-[#b49d6b] text-white hover:bg-[#a08b5f] transition-colors'
          }`}
      >
        {uploading ? 'Processando...' : 'Processar Planilha'}
      </button>
    </div>
  );
}
