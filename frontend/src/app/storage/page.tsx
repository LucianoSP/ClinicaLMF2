'use client';

import { useState } from 'react';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/api';
import StorageFiles from '@/components/StorageFiles';

export default function StoragePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDownloadAll = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/download-all-files`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Falha ao baixar os arquivos');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos_arquivos_${new Date().toISOString().split('T')[0]}.zip`;
      
      // Append to body, click and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Download iniciado com sucesso",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Falha ao baixar os arquivos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearStorage = async () => {
    if (!window.confirm('Tem certeza que deseja limpar todo o storage? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/clear-storage`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Falha ao limpar o storage');
      }

      toast({
        title: "Sucesso",
        description: "Storage limpo com sucesso",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Falha ao limpar o storage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#8B4513]">Gerenciamento de Arquivos</h1>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadAll}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
            >
              <FiDownload className="w-4 h-4" />
              Download Todos
            </button>
            <button
              onClick={handleClearStorage}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#8B4513] text-white rounded hover:bg-[#7a3d10] transition-colors disabled:opacity-50"
            >
              <FiTrash2 className="w-4 h-4" />
              Limpar Storage
            </button>
          </div>
        </div>
        
        <StorageFiles />
      </div>
    </div>
  );
}
