'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SortableTable from '@/components/SortableTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { api } from '@/utils/api';
import { toast } from 'sonner';

interface GuiaUnimed {
  id: string;
  numero_guia: string;
  data_importacao: string;
  paciente_nome: string;
  paciente_carteirinha: string;
  status: string;
  data_execucao: string;
}

export default function UnimedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GuiaUnimed[]>([]);
  const [filters, setFilters] = useState({
    numeroGuia: '',
    dataInicio: '',
    dataFim: '',
  });

  const columns = [
    {
      key: 'numero_guia',
      label: 'Número da Guia',
    },
    {
      key: 'data_importacao',
      label: 'Data de Importação',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'paciente_nome',
      label: 'Paciente',
    },
    {
      key: 'paciente_carteirinha',
      label: 'Carteirinha',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'processado' ? 'bg-green-100 text-green-800' : 
          value === 'erro' ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'data_execucao',
      label: 'Data de Execução',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/unimed/guias', {
        params: {
          numero_guia: filters.numeroGuia,
          data_inicio: filters.dataInicio,
          data_fim: filters.dataFim,
        },
      });
      setData(response.data);
    } catch (error) {
      toast.error('Erro ao carregar guias');
      console.error('Erro ao carregar guias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleImport = async () => {
    try {
      setLoading(true);
      await api.post('/unimed/import');
      toast.success('Importação iniciada com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao iniciar importação');
      console.error('Erro ao iniciar importação:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Guias Unimed</h1>
        <Button onClick={handleImport} disabled={loading}>
          Importar Guias
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Número da Guia</label>
            <Input
              type="text"
              value={filters.numeroGuia}
              onChange={(e) => setFilters({ ...filters, numeroGuia: e.target.value })}
              placeholder="Buscar por número da guia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data Inicial</label>
            <DatePicker
              value={filters.dataInicio ? new Date(filters.dataInicio) : undefined}
              onChange={(date) => setFilters({ ...filters, dataInicio: date ? date.toISOString().split('T')[0] : '' })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data Final</label>
            <DatePicker
              value={filters.dataFim ? new Date(filters.dataFim) : undefined}
              onChange={(date) => setFilters({ ...filters, dataFim: date ? date.toISOString().split('T')[0] : '' })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <SortableTable
          data={data}
          columns={columns}
          loading={loading}
        />
      </div>
    </div>
  );
}