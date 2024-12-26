import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "react-datepicker"; // Mudança aqui: import direto do react-datepicker
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ptBR } from 'date-fns/locale';

interface FiltrosProps {
  dataInicial: Date | undefined;
  dataFinal: Date | undefined;
  status: string;
  tipoDivergencia: string;
  onChangeDataInicial: (date: Date | undefined) => void;
  onChangeDataFinal: (date: Date | undefined) => void;
  onChangeStatus: (value: string) => void;
  onChangeTipoDivergencia: (value: string) => void;
  onSearch: () => void;
}

export function Filtros({
  dataInicial,
  dataFinal,
  status,
  tipoDivergencia,
  onChangeDataInicial,
  onChangeDataFinal,
  onChangeStatus,
  onChangeTipoDivergencia,
  onSearch,
}: FiltrosProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Data Inicial
          </label>
          <DatePicker
            selected={dataInicial}
            onChange={(date: Date | null) => onChangeDataInicial(date || undefined)}
            dateFormat="dd/MM/yyyy"
            locale={ptBR}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            placeholderText="Selecione uma data"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Data Final
          </label>
          <DatePicker
            selected={dataFinal}
            onChange={(date: Date | null) => onChangeDataFinal(date || undefined)}
            dateFormat="dd/MM/yyyy"
            locale={ptBR}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            placeholderText="Selecione uma data"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Status
          </label>
          <Select value={status} onValueChange={onChangeStatus}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg">
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="resolvida">Resolvida</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Tipo de Divergência
          </label>
          <Select value={tipoDivergencia} onValueChange={onChangeTipoDivergencia}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg">
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="EXECUCAO_SEM_FICHA">Execução sem Ficha</SelectItem>
              <SelectItem value="FICHA_SEM_EXECUCAO">Ficha sem Execução</SelectItem>
              <SelectItem value="QUANTIDADE_EXCEDIDA">Quantidade Excedida</SelectItem>
              <SelectItem value="DATA_INCONSISTENTE">Data Inconsistente</SelectItem>
              <SelectItem value="DOC_INCOMPLETO">Documentação Incompleta</SelectItem>
              <SelectItem value="ASSINATURA_AUSENTE">Assinatura Ausente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={onSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </div>
    </div>
  );
}