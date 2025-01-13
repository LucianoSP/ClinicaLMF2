'use client';

import { useState } from 'react';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/api';
import StorageFiles from '@/components/StorageFiles';
import { Button } from '@/components/ui/button';

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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos_arquivos_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      const response = await fetch(`${API_URL}/storage-files/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao limpar o storage');
      }

      toast({
        title: "Sucesso",
        description: "Storage limpo com sucesso",
      });

      window.location.reload();
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Arquivos Armazenados</h1>
      </div>

      <StorageFiles
        onDownloadAll={handleDownloadAll}
        onClearStorage={handleClearStorage}
        loading={loading}
      />
    </div>
  );
}