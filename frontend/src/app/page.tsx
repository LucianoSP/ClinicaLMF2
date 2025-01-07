'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, Clock, FileText, TrendingUp, Calendar } from 'lucide-react';

const generateData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      data: format(date, 'dd/MM', { locale: ptBR }),
      atendimentos: Math.floor(Math.random() * 50) + 30,
      executados: Math.floor(Math.random() * 45) + 25,
    });
  }
  return data;
};

export default function DashboardHome() {
  const chartData = generateData();
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 15d, 30d

  // Estatísticas calculadas
  const totalAtendimentos = chartData.reduce((sum, item) => sum + item.atendimentos, 0);
  const totalExecutados = chartData.reduce((sum, item) => sum + item.executados, 0);
  const taxaExecucao = ((totalExecutados / totalAtendimentos) * 100).toFixed(1);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#6b342f]">Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded ${timeRange === '7d' ? 'bg-[#8f732b] text-white' : 'bg-gray-100'}`}
          >
            7 dias
          </button>
          <button
            onClick={() => setTimeRange('15d')}
            className={`px-3 py-1 rounded ${timeRange === '15d' ? 'bg-[#8f732b] text-white' : 'bg-gray-100'}`}
          >
            15 dias
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded ${timeRange === '30d' ? 'bg-[#8f732b] text-white' : 'bg-gray-100'}`}
          >
            30 dias
          </button>
        </div>
      </div>

      {/* Alerta customizado com Tailwind */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">3 guias precisam de atenção: assinaturas pendentes</p>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Atendimentos Hoje</h3>
              <p className="text-3xl font-bold text-[#8f732b] mt-2">42</p>
              <p className="text-sm text-green-600 mt-1">↑ 8% vs ontem</p>
            </div>
            <Clock className="text-[#8f732b] h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Taxa de Execução</h3>
              <p className="text-3xl font-bold text-[#8f732b] mt-2">{taxaExecucao}%</p>
              <p className="text-sm text-green-600 mt-1">Meta: 95%</p>
            </div>
            <TrendingUp className="text-[#8f732b] h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Guias Ativas</h3>
              <p className="text-3xl font-bold text-[#8f732b] mt-2">156</p>
              <p className="text-sm text-amber-600 mt-1">12 vencem em 7 dias</p>
            </div>
            <FileText className="text-[#8f732b] h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Agenda do Dia</h3>
              <p className="text-3xl font-bold text-[#8f732b] mt-2">28</p>
              <p className="text-sm text-gray-600 mt-1">3 horários livres</p>
            </div>
            <Calendar className="text-[#8f732b] h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Gráficos e Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Atendimentos vs Execuções</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="atendimentos"
                  stroke="#8f732b"
                  strokeWidth={2}
                  dot={{ fill: '#8f732b' }}
                  name="Atendimentos"
                />
                <Line
                  type="monotone"
                  dataKey="executados"
                  stroke="#6b342f"
                  strokeWidth={2}
                  dot={{ fill: '#6b342f' }}
                  name="Executados"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
          <div className="space-y-4">
            {[
              { status: 'success', text: 'Guia #1234 - Execução registrada com sucesso', time: '5 min' },
              { status: 'warning', text: 'Assinatura pendente - Paciente Ana Silva', time: '15 min' },
              { status: 'success', text: 'Novo paciente cadastrado - João Santos', time: '30 min' },
              { status: 'info', text: 'Atualização de agenda - Dr. Carlos', time: '1h' },
              { status: 'success', text: 'Relatório diário gerado', time: '2h' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-amber-500' :
                        'bg-blue-500'
                    }`} />
                  <p className="text-gray-600">{activity.text}</p>
                </div>
                <span className="text-gray-400 text-xs">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}