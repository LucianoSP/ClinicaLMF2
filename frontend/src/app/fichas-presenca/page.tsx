"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiTrash2, FiEdit, FiDownload, FiUpload, FiSearch } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SortableTable, { Column } from '@/components/SortableTable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { CheckCircleIcon, XCircleIcon, PencilIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface FichaPresenca {
  id: string;
  data_atendimento: string;
  paciente_carteirinha: string;
  paciente_nome: string;
  numero_guia: string;
  codigo_ficha: string;
  possui_assinatura: boolean;
  arquivo_digitalizado?: string;
  observacoes?: string;
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
      // Converter a data do formato YYYY-MM-DD para DD/MM/YYYY
      const [ano, mes, dia] = editedFicha.data_atendimento.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;

      // Construindo o payload com a data no formato correto
      const payload = JSON.stringify({
        data_atendimento: dataFormatada,
        paciente_carteirinha: editedFicha.paciente_carteirinha,
        paciente_nome: editedFicha.paciente_nome,
        numero_guia: editedFicha.numero_guia,
        codigo_ficha: editedFicha.codigo_ficha,
        possui_assinatura: editedFicha.possui_assinatura,
        arquivo_digitalizado: editedFicha.arquivo_digitalizado || null
      });

      console.log('Data original:', editedFicha.data_atendimento);
      console.log('Data formatada:', dataFormatada);
      console.log('Payload a ser enviado:', JSON.parse(payload));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca/${selectedFicha.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      const responseData = await response.json();
      console.log('Resposta do servidor:', responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || 'Falha ao atualizar ficha');
      }

      toast({
        title: "Sucesso",
        description: "Ficha atualizada com sucesso",
      });
      fetchFichas();
    } catch (error) {
      console.error('Erro completo:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar a ficha",
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
      'Data': ficha.data_atendimento,
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
    {
      key: 'data_atendimento',
      label: 'Data',
      render: (value) => {
        if (!value) return '-';
        try {
          const [dia, mes, ano] = value.split('/');
          return `${dia}/${mes}/${ano}`;
        } catch (error) {
          console.error('Erro ao formatar data:', value);
          return value || '-';
        }
      }
    },
    { key: 'paciente_carteirinha', label: 'Carteirinha' },
    { key: 'paciente_nome', label: 'Paciente' },
    { key: 'numero_guia', label: 'Guia' },
    { key: 'codigo_ficha', label: 'Código Ficha' },
    { key: 'possui_assinatura', label: 'Assinatura', type: 'boolean' },
    {
      key: 'acoes',
      label: 'Ações',
      render: (_, ficha) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFicha(ficha);

              // Formatar a data corretamente
              let dataAtendimento = '';
              if (ficha.data_atendimento) {
                try {
                  // Se a data vier como DD/MM/YYYY
                  if (ficha.data_atendimento.includes('/')) {
                    const [dia, mes, ano] = ficha.data_atendimento.split('/');
                    // Garantir que dia e mês tenham 2 dígitos
                    const diaFormatado = dia.padStart(2, '0');
                    const mesFormatado = mes.padStart(2, '0');
                    dataAtendimento = `${ano}-${mesFormatado}-${diaFormatado}`;
                  } else {
                    // Se a data vier em outro formato, tentar converter
                    const data = new Date(ficha.data_atendimento);
                    if (isNaN(data.getTime())) {
                      throw new Error('Data inválida');
                    }
                    dataAtendimento = format(data, 'yyyy-MM-dd');
                  }
                } catch (error) {
                  console.error('Erro ao formatar data:', error, ficha.data_atendimento);
                  dataAtendimento = new Date().toISOString().split('T')[0];
                }
              }

              console.log('Data original:', ficha.data_atendimento);
              console.log('Data formatada:', dataAtendimento);

              setEditedFicha({
                data_atendimento: dataAtendimento,
                paciente_nome: ficha.paciente_nome,
                paciente_carteirinha: ficha.paciente_carteirinha,
                numero_guia: ficha.numero_guia,
                codigo_ficha: ficha.codigo_ficha,
                possui_assinatura: ficha.possui_assinatura
              });
              setShowEditDialog(true);
            }}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFicha(ficha);
              setShowDeleteDialog(true);
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6b342f]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-white text-card-foreground shadow-sm">
        <div className="p-6 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-[#8B4513]">Fichas de Presença</h2>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={(e) => e.currentTarget.previousElementSibling?.click()}
                >
                  <FiUpload className="h-4 w-4" />
                  Upload PDF
                </Button>
              </label>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportExcel}
              >
                <FiDownload className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowClearDialog(true)}
              >
                <TrashIcon className="h-4 w-4" />
                Limpar Fichas
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 py-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border">
            <SortableTable
              data={fichas}
              columns={columns}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total: {totalRecords} registros
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Editar Ficha de Presença</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias nos campos abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="data" className="text-right">
                Data Atendimento
              </Label>
              <Input
                id="data"
                type="date"
                value={editedFicha.data_atendimento || ''}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  data_atendimento: e.target.value
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assinatura" className="text-right">
                Assinatura
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="assinatura"
                  checked={editedFicha.possui_assinatura}
                  onChange={(e) => setEditedFicha({
                    ...editedFicha,
                    possui_assinatura: e.target.checked
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
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

      {/* Modal de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Excluir Ficha de Presença</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta ficha de presença? Esta ação não pode ser desfeita.
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

      {/* Clear Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Limpar Fichas de Presença</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir todas as fichas de presença? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              Limpar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
