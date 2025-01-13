import type { FC } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, FileDown, RefreshCcw } from 'lucide-react';

export type FiltrosAuditoriaProps = {
  dataInicial: Date | null;
  setDataInicial: (date: Date | null) => void;
  dataFinal: Date | null;
  setDataFinal: (date: Date | null) => void;
  statusFiltro: string;
  setStatusFiltro: (status: string) => void;
  tipoDivergencia: string;
  setTipoDivergencia: (tipo: string) => void;
  prioridade: string;  // Adicionado
  setPrioridade: (prioridade: string) => void;  // Adicionado
  onAuditoria: () => Promise<void>;
  onGerarRelatorio: () => Promise<void>;
  loading: boolean;
};

const tiposDivergencia = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'execucao_sem_ficha', label: 'Execução sem Ficha' },
  { value: 'ficha_sem_execucao', label: 'Ficha sem Execução' },
  { value: 'ficha_sem_assinatura', label: 'Ficha sem Assinatura' },
  { value: 'data_divergente', label: 'Data Divergente' },
  { value: 'guia_vencida', label: 'Guia Vencida' },
  { value: 'quantidade_excedida', label: 'Quantidade Excedida' },
] as const;

const statusOptions = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'resolvida', label: 'Resolvida' },
] as const;

const prioridadeOptions = [  // Adicionado
  { value: 'todas', label: 'Todas as prioridades' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Média' },
] as const;

const FiltrosAuditoria: FC<FiltrosAuditoriaProps> = ({
  dataInicial,
  setDataInicial,
  dataFinal,
  setDataFinal,
  statusFiltro,
  setStatusFiltro,
  tipoDivergencia,
  setTipoDivergencia,
  prioridade,  // Adicionado
  setPrioridade,  // Adicionado
  onAuditoria,
  onGerarRelatorio,
  loading
}) => {
  const limparFiltros = () => {
    setDataInicial(null);
    setDataFinal(null);
    setStatusFiltro('todos');
    setTipoDivergencia('todos');
    setPrioridade('todas');  // Adicionado
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={limparFiltros}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar Filtros
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-4">  {/* Alterado de 4 para 5 colunas */}
          <div className="flex flex-col">
            <Label className="mb-2">Data Inicial</Label>
            <DatePicker
              date={dataInicial}
              setDate={setDataInicial}
            />
          </div>

          <div className="flex flex-col">
            <Label className="mb-2">Data Final</Label>
            <DatePicker
              date={dataFinal}
              setDate={setDataFinal}
            />
          </div>

          <div className="flex flex-col">
            <Label className="mb-2">Status</Label>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <Label className="mb-2">Tipo de Divergência</Label>
            <Select value={tipoDivergencia} onValueChange={setTipoDivergencia}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposDivergencia.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adicionado select de Prioridade */}
          <div className="flex flex-col">
            <Label className="mb-2">Prioridade</Label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {prioridadeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Itens por página:</span>
          <Select defaultValue="10">
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onGerarRelatorio}
            disabled={loading}
            className="flex items-center"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="default"
            onClick={onAuditoria}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FiltrosAuditoria;