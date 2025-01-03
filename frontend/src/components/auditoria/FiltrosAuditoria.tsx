import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FiltrosAuditoriaProps {
  dataInicial: Date | null;
  setDataInicial: (date: Date | null) => void;
  dataFinal: Date | null;
  setDataFinal: (date: Date | null) => void;
  statusFiltro: string;
  setStatusFiltro: (status: string) => void;
  tipoDivergencia: string;
  setTipoDivergencia: (tipo: string) => void;
}

const tiposDivergencia = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'execucao_sem_ficha', label: 'Execução sem Ficha' },
  { value: 'ficha_sem_execucao', label: 'Ficha sem Execução' },
  { value: 'quantidade_excedida', label: 'Quantidade Excedida' },
  { value: 'data_inconsistente', label: 'Data Inconsistente' },
  { value: 'doc_incompleto', label: 'Documentação Incompleta' },
  { value: 'assinatura_ausente', label: 'Assinatura Ausente' },
];

const statusOptions = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'resolvida', label: 'Resolvida' },
];

export const FiltrosAuditoria = ({
  dataInicial,
  setDataInicial,
  dataFinal,
  setDataFinal,
  statusFiltro,
  setStatusFiltro,
  tipoDivergencia,
  setTipoDivergencia,
}: FiltrosAuditoriaProps) => {
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

          <DatePicker label="Data Inicial"
            date={dataInicial}
            setDate={setDataInicial} />
        </div>

        <div className="space-y-2">

          <DatePicker label="Data Final"
            date={dataFinal}
            setDate={setDataFinal} />
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
    </div>
  );
};
