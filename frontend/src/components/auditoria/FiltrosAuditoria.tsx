import { Dispatch, SetStateAction } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface FiltrosAuditoriaProps {
  dataInicial: Date | null;
  setDataInicial: Dispatch<SetStateAction<Date | null>>;
  dataFinal: Date | null;
  setDataFinal: Dispatch<SetStateAction<Date | null>>;
  statusFiltro: string;
  setStatusFiltro: Dispatch<SetStateAction<string>>;
  tipoDivergencia: string;
  setTipoDivergencia: Dispatch<SetStateAction<string>>;
  onAuditoria: () => Promise<void>;
  onGerarRelatorio: () => Promise<void>;
  loading: boolean;
}

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
            <span className="mr-2">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.49999V8.41359L10.1819 6.18179C10.3576 6.00605 10.6425 6.00605 10.8182 6.18179C10.994 6.35753 10.994 6.64245 10.8182 6.81819L7.81825 9.81819C7.64251 9.99392 7.35759 9.99392 7.18185 9.81819L4.18185 6.81819C4.00611 6.64245 4.00611 6.35753 4.18185 6.18179C4.35759 6.00605 4.64251 6.00605 4.81825 6.18179L7.05005 8.41359V1.49999C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0037C11.5538 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0037 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </span>
            Exportar
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={onAuditoria}
            disabled={loading}
            className="text-base px-4 py-2"
          >
            <span className={`mr-2 ${loading ? 'animate-spin' : ''}`}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.84998 7.49998C1.84998 4.66458 4.05979 2.34998 6.89998 2.34998C7.97329 2.34998 8.97427 2.66498 9.82329 3.20295L10.2758 2.75041C10.4111 2.61514 10.6399 2.64816 10.7246 2.82073C10.772 2.91094 10.7654 3.01963 10.7068 3.10331L9.60858 4.60331C9.6065 4.60331 9.60442 4.60332 9.60234 4.60333C9.42258 4.61837 9.25056 4.51466 9.19093 4.33077L8.5923 2.70737C8.52557 2.49854 8.66123 2.27672 8.87006 2.20998C9.07889 2.14325 9.30071 2.27891 9.36744 2.48774L9.53799 3.06069C8.5777 2.45155 7.76791 2.34998 6.89998 2.34998C4.05979 2.34998 1.84998 4.66458 1.84998 7.49998C1.84861 8.21091 1.97276 8.91642 2.21664 9.58457C2.22069 9.59672 2.22541 9.60875 2.23078 9.62062L2.2307 9.62091C2.2389 9.64028 2.24893 9.6594 2.26074 9.67815C2.31872 9.79255 2.43012 9.87247 2.55781 9.89109C2.81032 9.93111 3.04533 9.75172 3.08535 9.49922C3.10525 9.36441 3.06074 9.22843 2.96579 9.13276C2.76606 8.61039 2.66376 8.05893 2.66376 7.49998H1.84998ZM13.15 7.49998C13.15 10.3354 10.9402 12.65 8.10001 12.65C7.02669 12.65 6.02571 12.335 5.17669 11.797L4.72417 12.2496C4.58891 12.3848 4.36005 12.3518 4.27539 12.1792C4.22797 12.089 4.23459 11.9803 4.29318 11.8967L5.39143 10.3967C5.39351 10.3967 5.39559 10.3966 5.39767 10.3966C5.57743 10.3816 5.74945 10.4853 5.80908 10.6692L6.40771 12.2926C6.47444 12.5014 6.33878 12.7233 6.12995 12.79C5.92112 12.8567 5.6993 12.7211 5.63257 12.5122L5.46201 11.9393C6.4223 12.5484 7.23209 12.65 8.10001 12.65C10.9402 12.65 13.15 10.3354 13.15 7.49998C13.1514 6.78906 13.0272 6.08355 12.7834 5.4154C12.7793 5.40325 12.7746 5.39121 12.7692 5.37934L12.7693 5.37905C12.7611 5.35968 12.7511 5.34056 12.7393 5.32182C12.6813 5.20741 12.5699 5.12749 12.4422 5.10888C12.1897 5.06886 11.9547 5.24825 11.9147 5.50075C11.8948 5.63555 11.9393 5.77154 12.0342 5.86721C12.2339 6.38957 12.3362 6.94103 12.3362 7.49998H13.15Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </span>
            Atualizar Auditoria
          </Button>
        </div>
      </div>
    </div>
  );
}