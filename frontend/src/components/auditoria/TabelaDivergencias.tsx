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
  status: string;
  tipo_divergencia?: string;
}

interface TabelaDivergenciasProps {
  divergencias: Divergencia[];
  onResolve: (id: string) => void;
  loading?: boolean;
}

const DivergenciaBadge = ({ tipo }: { tipo: string }) => {
  const tipos: { [key: string]: { label: string; className: string } } = {
    'EXECUCAO_SEM_FICHA': { label: 'Execução sem Ficha', className: 'bg-red-100 text-red-800' },
    'FICHA_SEM_EXECUCAO': { label: 'Ficha sem Execução', className: 'bg-yellow-100 text-yellow-800' },
    'QUANTIDADE_EXCEDIDA': { label: 'Quantidade Excedida', className: 'bg-orange-100 text-orange-800' },
    'DATA_INCONSISTENTE': { label: 'Data Inconsistente', className: 'bg-blue-100 text-blue-800' },
    'DOC_INCOMPLETO': { label: 'Documentação Incompleta', className: 'bg-purple-100 text-purple-800' },
    'ASSINATURA_AUSENTE': { label: 'Assinatura Ausente', className: 'bg-pink-100 text-pink-800' },
  };

  const { label, className } = tipos[tipo] || { label: tipo, className: 'bg-gray-100 text-gray-800' };

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    'pendente': 'bg-yellow-100 text-yellow-800',
    'resolvida': 'bg-green-100 text-green-800',
  };

  return (
    <Badge variant="outline" className={statusConfig[status] || 'bg-gray-100'}>
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
        <ArrowUpDown className="w-4 h-4" />
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
            <SortableHeader sortKey="data_registro">Data Registro</SortableHeader>
            <SortableHeader sortKey="data_execucao">Data Execução</SortableHeader>
            <SortableHeader sortKey="tipo_divergencia">Tipo</SortableHeader>
            <SortableHeader sortKey="paciente_nome">Paciente</SortableHeader>
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