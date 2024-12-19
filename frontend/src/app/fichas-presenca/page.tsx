"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiTrash2, FiEdit, FiDownload, FiUpload, FiSearch } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SortableTable, Column } from '@/components/SortableTable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { CheckCircleIcon, XCircleIcon, PencilIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface FichaPresenca {
  id: string;
  data_execucao: string;
  paciente_carteirinha: string;
  paciente_nome: string;
  numero_guia: string;
  codigo_ficha: string;
  possui_assinatura: boolean;
  arquivo_digitalizado?: string;
}

export default function FichasPresenca() {
  const [fichas, setFichas] = useState<FichaPresenca[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<FichaPresenca | null>(null);
  const [editedFicha, setEditedFicha] = useState<Partial<FichaPresenca>>({});
  const { toast } = useToast();

  const fetchFichas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: perPage.toString(),
        offset: ((page - 1) * perPage).toString(),
      });

      if (debouncedSearchTerm.trim().length >= 2) {
        params.append('paciente_nome', debouncedSearchTerm.trim());
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setFichas(data.fichas);
        setTotalPages(data.paginas);
        setTotalRecords(data.total);
      } else {
        throw new Error(data.detail || 'Erro ao carregar fichas');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar as fichas de presença",
        variant: "destructive",
      });
      setFichas([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFicha) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca/${selectedFicha.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Ficha excluída com sucesso",
        });
        fetchFichas();
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Falha ao excluir ficha');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir a ficha",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedFicha(null);
    }
  };

  const handleSave = async () => {
    if (!selectedFicha || !editedFicha) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca/${selectedFicha.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedFicha),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Ficha atualizada com sucesso",
        });
        fetchFichas();
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Falha ao atualizar ficha');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar a ficha",
        variant: "destructive",
      });
    } finally {
      setShowEditDialog(false);
      setSelectedFicha(null);
      setEditedFicha({});
    }
  };

  const handleDownload = async (arquivo: string) => {
    try {
      window.open(arquivo, '_blank');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao baixar o arquivo",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Arquivos enviados com sucesso",
        });
        fetchFichas();
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Falha ao enviar arquivos');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar os arquivos",
        variant: "destructive",
      });
    }
  };

  const handleClear = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas_presenca/limpar`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Todas as fichas foram excluídas com sucesso",
        });
        fetchFichas();
        setShowClearDialog(false);
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Falha ao limpar fichas');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao limpar as fichas",
        variant: "destructive",
      });
    }
  };

  const handleClearTable = () => {
    setFichas([]);
  };

  const handleExportExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert the data to the format we want to export
    const exportData = fichas.map(ficha => ({
      'Data': format(new Date(ficha.data_execucao), 'dd/MM/yyyy'),
      'Paciente': ficha.paciente_nome,
      'Carteirinha': ficha.paciente_carteirinha,
      'Guia': ficha.numero_guia,
      'Código Ficha': ficha.codigo_ficha,
      'Assinatura': ficha.possui_assinatura ? 'Sim' : 'Não'
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Fichas de Presença');

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `fichas_presenca_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  useEffect(() => {
    fetchFichas();
  }, [page, debouncedSearchTerm]);

  const columns: Column<FichaPresenca>[] = [
    { key: 'data_execucao', label: 'Data' },
    { key: 'paciente_carteirinha', label: 'Carteirinha' },
    { key: 'paciente_nome', label: 'Paciente' },
    { key: 'numero_guia', label: 'Guia' },
    { key: 'codigo_ficha', label: 'Código Ficha' },
    { key: 'possui_assinatura', label: 'Assinatura', type: 'boolean' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6b342f]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[#8B4513]">Fichas de Presença</h1>
        <div className="flex gap-2">
          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf"
          />
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors"
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <FiUpload className="w-4 h-4" />
            Upload PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={fichas.length === 0}
            className="flex items-center space-x-1 px-3 py-2 bg-[#C5A880] text-white rounded-lg hover:bg-[#b49d6b] transition-colors disabled:opacity-50"
          >
            <FiDownload className="w-4 h-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => setShowClearDialog(true)}
            className="flex items-center space-x-1 px-3 py-2 bg-[#C5A880] text-white rounded-lg hover:bg-[#b49d6b] transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Limpar Fichas</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder="Buscar por nome do paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[300px] pl-8"
              />
              <MagnifyingGlassIcon className="absolute left-2 h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Itens por página:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="border rounded p-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <SortableTable
            data={fichas}
            columns={columns}
          />

          <div className="flex justify-between items-center mt-4">
            <div>
              Total: {totalRecords} registros
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta ficha de presença?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ficha</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="data" className="text-right">
                Data
              </Label>
              <Input
                id="data"
                type="date"
                value={editedFicha.data_execucao}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  data_execucao: e.target.value
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paciente" className="text-right">
                Paciente
              </Label>
              <Input
                id="paciente"
                value={editedFicha.paciente_nome}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  paciente_nome: e.target.value
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="carteirinha" className="text-right">
                Carteirinha
              </Label>
              <Input
                id="carteirinha"
                value={editedFicha.paciente_carteirinha}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  paciente_carteirinha: e.target.value
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="guia" className="text-right">
                Guia
              </Label>
              <Input
                id="guia"
                value={editedFicha.numero_guia}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  numero_guia: e.target.value
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codigo" className="text-right">
                Código Ficha
              </Label>
              <Input
                id="codigo"
                value={editedFicha.codigo_ficha}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  codigo_ficha: e.target.value
                })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Limpar Fichas de Presença</DialogTitle>
            <DialogDescription className="text-gray-700">
              Tem certeza que deseja excluir todas as fichas de presença? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              className="bg-white hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleClear}
              className="bg-[#C5A880] text-white hover:bg-[#b49d6b]"
            >
              Limpar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
