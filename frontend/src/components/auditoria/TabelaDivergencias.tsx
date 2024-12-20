import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ArrowUpDown } from 'lucide-react';
import { formatarData } from '@/lib/utils';
import { useState } from 'react';
import { DetalheDivergencia } from './DetalheDivergencia';

interface Divergencia {
  id: string;
  guia_id: string;
  data_execucao: string;
  data_registro: string;
  codigo_ficha: string;
  paciente_nome: string;
  paciente_carteirinha: string;
  status: string;
  tipo_divergencia?: string;
  possui_assinatura: boolean;
  arquivo_digitalizado?: string;
  observacoes?: string;
  quantidade_autorizada?: number;
  quantidade_executada?: number;
}

interface TabelaDivergenciasProps {
  divergencias: Divergencia[];
  onResolve: (id: string) => void;
  loading?: boolean;
}

const DivergenciaBadge = ({ tipo }: { tipo: string }) => {
  const tipos: { [key: string]: { label: string; className: string } } = {
    'EXECUCAO_SEM_FICHA': { label: 'Execução sem Ficha', className: 'bg-white border border-red-200 text-red-700' },
    'FICHA_SEM_EXECUCAO': { label: 'Ficha sem Execução', className: 'bg-white border border-yellow-200 text-yellow-700' },
    'QUANTIDADE_EXCEDIDA': { label: 'Quantidade Excedida', className: 'bg-white border border-orange-200 text-orange-700' },
    'DATA_INCONSISTENTE': { label: 'Data Inconsistente', className: 'bg-white border border-blue-200 text-blue-700' },
    'DOC_INCOMPLETO': { label: 'Documentação Incompleta', className: 'bg-white border border-purple-200 text-purple-700' },
    'ASSINATURA_AUSENTE': { label: 'Assinatura Ausente', className: 'bg-white border border-pink-200 text-pink-700' },
  };

  const { label, className } = tipos[tipo] || { label: tipo, className: 'bg-white border border-gray-200 text-gray-700' };

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    'pendente': 'bg-white border border-yellow-200 text-yellow-700',
    'resolvida': 'bg-white border border-green-200 text-green-700',
  };

  return (
    <Badge variant="outline" className={statusConfig[status] || 'bg-white border border-gray-200 text-gray-700'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const AcoesDropdown = ({ divergencia, onResolve }: { divergencia: Divergencia; onResolve: (id: string) => void }) => {
  if (divergencia.status === 'resolvida') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onResolve(divergencia.id)}
      className="opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Check className="w-4 h-4" />
      <span className="sr-only">Marcar como resolvida</span>
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

    if (sortConfig.key === 'data_execucao' || sortConfig.key === 'data_registro') {
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
            <SortableHeader sortKey="guia_id">Guia</SortableHeader>
            <SortableHeader sortKey="data_registro">Data do Atendimento</SortableHeader>
            <SortableHeader sortKey="data_execucao">Data Execução</SortableHeader>
            <SortableHeader sortKey="tipo_divergencia">Tipo</SortableHeader>
            <SortableHeader sortKey="paciente_nome">Paciente</SortableHeader>
            <SortableHeader sortKey="paciente_carteirinha">Carteirinha</SortableHeader>
            <SortableHeader sortKey="quantidade_executada">Qtd.</SortableHeader>
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
                  {divergencia.guia_id}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.data_registro ? formatarData(new Date(divergencia.data_registro), false) : '-'}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.data_execucao ? formatarData(new Date(divergencia.data_execucao), false) : '-'}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  <DivergenciaBadge tipo={divergencia.tipo_divergencia || 'execucao_sem_ficha'} />
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.paciente_nome}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.paciente_carteirinha}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.quantidade_executada !== undefined ? 
                    `${divergencia.quantidade_executada}/${divergencia.quantidade_autorizada}` : 
                    '-'}
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