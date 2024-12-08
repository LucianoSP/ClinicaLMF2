'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função para gerar dados aleatórios dos últimos 7 dias
const generateData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      data: format(date, 'dd/MM', { locale: ptBR }),
      processamentos: Math.floor(Math.random() * 50) + 10, // Número aleatório entre 10 e 60
    });
  }
  return data;
};

export default function Home() {
  const chartData = generateData();

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-[#6b342f]">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card - Arquivos Processados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Arquivos Processados</h3>
          <p className="text-4xl font-bold text-[#8f732b]">0</p>
          <p className="text-sm text-gray-500 mt-1">nas últimas 24 horas</p>
        </div>

        {/* Card - Taxa de Sucesso */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Taxa de Sucesso</h3>
          <p className="text-4xl font-bold text-[#8f732b]">100%</p>
          <p className="text-sm text-gray-500 mt-1">processamento bem-sucedido</p>
        </div>

        {/* Card - Tempo Médio */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Tempo Médio</h3>
          <p className="text-4xl font-bold text-[#8f732b]">2.5s</p>
          <p className="text-sm text-gray-500 mt-1">por arquivo</p>
        </div>
      </div>

      {/* Área para futuros gráficos e estatísticas */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processamentos por Dia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="data" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  labelStyle={{ color: '#374151' }}
                />
                <Line
                  type="monotone"
                  dataKey="processamentos"
                  stroke="#b49d6b"
                  strokeWidth={2}
                  dot={{ fill: '#b49d6b', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#8f732b' }}
                  name="Processamentos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimas Atividades</h3>
          <div className="space-y-4">
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <p className="text-gray-600">Arquivo processado com sucesso - 5 minutos atrás</p>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <p className="text-gray-600">Arquivo processado com sucesso - 15 minutos atrás</p>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <p className="text-gray-600">Arquivo processado com sucesso - 30 minutos atrás</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}