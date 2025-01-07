import { type Dispatch, type SetStateAction } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileDown, RefreshCw, X } from 'lucide-react';

type SetState<T> = Dispatch<SetStateAction<T>>;

type FiltrosAuditoriaProps = {
  dataInicial: Date | null;
  setDataInicial: SetState<Date | null>;
  dataFinal: Date | null;
  setDataFinal: SetState<Date | null>;
  statusFiltro: string;
  setStatusFiltro: SetState<string>;
  tipoDivergencia: string;
  setTipoDivergencia: SetState<string>;
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

export function FiltrosAuditoria({
  dataInicial,
  setDataInicial,
  dataFinal,
  setDataFinal,
  statusFiltro,
  setStatusFiltro,
  tipoDivergencia,
  setTipoDivergencia,
  onAuditoria,
  onGerarRelatorio,
  loading
}: FiltrosAuditoriaProps) {
  const limparFiltros = () => {
    setDataInicial(null);
    setDataFinal(null);
    setStatusFiltro('todos');
    setTipoDivergencia('todos');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <DatePicker
            label="Data Inicial"
            date={dataInicial}
            setDate={setDataInicial}
          />
        </div>

        <div className="space-y-2">
          <DatePicker
            label="Data Final"
            date={dataFinal}
            setDate={setDataFinal}
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
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

        <div className="space-y-2">
          <Label>Tipo de Divergência</Label>
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
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <Label>Itens por página:</Label>
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
            size="default"
            onClick={onGerarRelatorio}
            disabled={loading}
            className="text-base px-4 py-2"
          >
            <FileDown className="w-5 h-5 mr-2" />
            Exportar
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={onAuditoria}
            disabled={loading}
            className="text-base px-4 py-2"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Auditoria
          </Button>
        </div>
      </div>
    </div>
  );
}