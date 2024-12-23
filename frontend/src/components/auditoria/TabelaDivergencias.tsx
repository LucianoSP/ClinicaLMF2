import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarData } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { DetalheDivergencia } from "./DetalheDivergencia";
import { DivergenciaBadge } from "../ui/divergencia-badge";
import { StatusBadge } from "../ui/status-badge";
import { Badge } from "../ui/badge";

interface Divergencia {
  id: string;
  numero_guia: string;
  data_execucao: string | null;
  data_atendimento: string | null;
  data_identificacao: string;
  codigo_ficha: string | null;
  paciente_nome: string | null;
  carteirinha: string | null;
  status: string;
  tipo_divergencia: string;
  prioridade: string;
  descricao: string | null;
  possui_assinatura: boolean;
  arquivo_digitalizado: string | null;
  observacoes: string | null;
  resolvido_por: string | null;
  data_resolucao: string | null;
  quantidade_autorizada: number | null;
  quantidade_executada: number | null;
}

interface TabelaDivergenciasProps {
  divergencias: Divergencia[];
  onResolve: (id: string) => void;
  loading?: boolean;
}

const AcoesDropdown = ({ divergencia, onResolve }: { divergencia: Divergencia; onResolve: (id: string) => void }) => {
  if (divergencia.status === 'resolvida') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onResolve(divergencia.id);
      }}
      className="opacity-0 group-hover:opacity-100"
    >
      <Check className="w-4 h-4" />
    </Button>
  );
};

export const TabelaDivergencias = ({
  divergencias,
  onResolve,
  loading,
}: TabelaDivergenciasProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [selectedDivergencia, setSelectedDivergencia] = useState<Divergencia | null>(null);

  const sortedDivergencias = [...divergencias].sort((a, b) => {
    if (!sortConfig) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (sortConfig.key === 'data_execucao' || sortConfig.key === 'data_identificacao' || sortConfig.key === 'data_atendimento') {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      return sortConfig.direction === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
    }

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const SortableHeader = ({ children, sortKey }: { children: React.ReactNode; sortKey: string }) => (
    <TableHead className="text-xs cursor-pointer" onClick={() => handleSort(sortKey)}>
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <ArrowUpDown className="w-3 h-3 text-gray-400" />
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (divergencias.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">Nenhuma divergência encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader sortKey="numero_guia">Guia</SortableHeader>
            <SortableHeader sortKey="data_atendimento">Data do Atendimento</SortableHeader>
            <SortableHeader sortKey="data_execucao">Data Execução</SortableHeader>
            <SortableHeader sortKey="tipo_divergencia">Tipo</SortableHeader>
            <SortableHeader sortKey="paciente_nome">Paciente</SortableHeader>
            <SortableHeader sortKey="carteirinha">Carteirinha</SortableHeader>
            <SortableHeader sortKey="possui_assinatura">Assinatura</SortableHeader>
            <SortableHeader sortKey="status">Status</SortableHeader>
            <TableHead className="text-xs">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDivergencias.map((divergencia) => (
            <TableRow
              key={divergencia.id}
              className="group hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedDivergencia(divergencia)}
            >
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.numero_guia}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.data_atendimento ? formatarData(new Date(divergencia.data_atendimento), false) : '-'}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.data_execucao ? formatarData(new Date(divergencia.data_execucao), false) : '-'}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  <DivergenciaBadge tipo={divergencia.tipo_divergencia} />
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.paciente_nome || '-'}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.carteirinha || '-'}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  <Badge variant="outline" className={divergencia.possui_assinatura ? 'bg-white border border-green-200 text-green-700' : 'bg-white border border-red-200 text-red-700'}>
                    {divergencia.possui_assinatura ? 'Sim' : 'Não'}
                  </Badge>
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  <StatusBadge status={divergencia.status} />
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  <AcoesDropdown
                    divergencia={divergencia}
                    onResolve={onResolve}
                  />
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DetalheDivergencia
        divergencia={selectedDivergencia}
        open={!!selectedDivergencia}
        onClose={() => setSelectedDivergencia(null)}
      />
    </div>
  );
};