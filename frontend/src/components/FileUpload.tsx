'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { API_URL } from '../config/api';

export function FileUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

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
      // Processar arquivos sequencialmente
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('files', file);

        try {
          // Atualizar progresso para "processando"
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
          const fileResult = result[0]; // Pegar o primeiro resultado já que estamos enviando um arquivo por vez

          setUploadProgress(prev => ({
            ...prev,
            [file.name]: fileResult.status === 'success' ? 100 : 0
          }));

          if (fileResult.status === 'error') {
            setError(`Erro ao processar ${fileResult.filename}: ${fileResult.message}`);
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

      // Verificar se todos os arquivos foram processados com sucesso
      const allSuccess = results.every(r => r.status === 'success');
      if (allSuccess) {
        // Limpar arquivos e redirecionar para a página de relatórios
        setFiles([]);
        router.push('/atendimentos');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload dos arquivos');
      files.forEach(file => {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-larissa-primary bg-larissa-light' : 'border-larissa-secondary/30 hover:border-larissa-secondary'}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="flex justify-center">
                <svg className="h-12 w-12 text-larissa-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-larissa-dark">
                {isDragActive ? (
                  <p>Solte os arquivos aqui...</p>
                ) : (
                  <>
                    <p className="text-base">Arraste e solte arquivos PDF aqui, ou</p>
                    <p className="text-sm text-larissa-primary hover:text-larissa-primary-hover">clique para selecionar</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-4">
              {files.map(file => (
                <div key={file.name} className="bg-larissa-light/30 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-larissa-dark font-medium">{file.name}</span>
                    <span className="text-sm text-larissa-primary font-medium">
                      {uploadProgress[file.name]}%
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-larissa-light rounded-full h-2">
                    <div
                      className="bg-larissa-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={uploadFiles}
                disabled={uploading}
                className={`
                  flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium w-full
                  ${uploading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#b49d6b] text-white hover:bg-[#a08b5f] transition-colors'
                  }`}
              >
                {uploading ? `Processando (${Object.values(uploadProgress).filter(p => p === 100).length}/${files.length})...` : `Processar ${files.length} ${files.length === 1 ? 'Arquivo' : 'Arquivos'}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
