import { DatePicker } from '@/components/ui/date-picker';
import { SelectField } from '@/components/ui/select-field';

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
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DatePicker
          label="Data Inicial"
          date={dataInicial}
          setDate={setDataInicial}
        />
        <DatePicker
          label="Data Final"
          date={dataFinal}
          setDate={setDataFinal}
        />
        <SelectField
          label="Status"
          value={statusFiltro}
          onChange={setStatusFiltro}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'pendente', label: 'Pendentes' },
            { value: 'resolvida', label: 'Resolvidas' },
          ]}
        />
        <SelectField
          label="Tipo de Divergência"
          value={tipoDivergencia}
          onChange={setTipoDivergencia}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'data', label: 'Datas' },
            { value: 'documentacao', label: 'Documentação' },
            { value: 'quantidade', label: 'Quantitativas' },
          ]}
        />
      </div>
    </div>
  );
};
