import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { formatarData } from '@/lib/utils';

interface Divergencia {
  id: string;
  guia_id: string;
  data_execucao: string;
  codigo_ficha: string;
  descricao_divergencia: string;
  paciente_nome: string;
  status: string;
  data_registro: string;
  tipo_divergencia?: string;
}

interface TabelaDivergenciasProps {
  divergencias: Divergencia[];
  onResolve: (id: string) => void;
  loading: boolean;
}

const DivergenciaBadge = ({ tipo }: { tipo: string }) => {
  const getVariant = () => {
    switch (tipo) {
      case 'execucao_sem_ficha':
        return 'destructive';
      case 'ficha_sem_execucao':
        return 'warning';
      case 'ficha_sem_assinatura':
        return 'secondary';
      case 'data_divergente':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getLabel = () => {
    switch (tipo) {
      case 'execucao_sem_ficha':
        return 'Execução sem Ficha';
      case 'ficha_sem_execucao':
        return 'Ficha sem Execução';
      case 'ficha_sem_assinatura':
        return 'Sem Assinatura';
      case 'data_divergente':
        return 'Data Divergente';
      case 'quantidade_sessoes_divergente':
        return 'Qtd. Sessões Divergente';
      default:
        return tipo;
    }
  };

  return <Badge variant={getVariant()}>{getLabel()}</Badge>;
};

const StatusBadge = ({ status }: { status: string }) => (
  <Badge
    variant={status === 'resolvida' ? 'success' : 'warning'}
    className={status === 'resolvida' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
  >
    {status === 'resolvida' ? 'Resolvida' : 'Pendente'}
  </Badge>
);

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
            <TableHead className="w-[100px] text-xs">Data</TableHead>
            <TableHead className="text-xs">Tipo</TableHead>
            <TableHead className="text-xs">Guia</TableHead>
            <TableHead className="text-xs">Paciente</TableHead>
            <TableHead className="text-xs">Descrição</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-right text-xs">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {divergencias.map((divergencia) => (
            <TableRow
              key={divergencia.id}
              className="group hover:bg-gray-50 cursor-pointer"
            >
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {formatarData(divergencia.data_execucao, false)}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  <DivergenciaBadge tipo={divergencia.tipo_divergencia || 'execucao_sem_ficha'} />
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.guia_id}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.paciente_nome}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 text-xs text-gray-900">
                <span className="block w-full">
                  {divergencia.descricao_divergencia}
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
    </div>
  );
};