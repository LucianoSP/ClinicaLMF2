'use client'

import { AlertCircle, Calendar, Clock, FileText, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const generateData = () => {
  const data = [];
  for (let i = 0; i < 7; i++) {
    data.push({
      data: `${i + 1}/1`,
      atendimentos: Math.floor(Math.random() * 50) + 30,
      executados: Math.floor(Math.random() * 40) + 25,
    });
  }
  return data;
};

export default function DashboardPage() {
  const chartData = generateData();
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 15d, 30d

  // Estatísticas calculadas
  const totalAtendimentos = chartData.reduce((sum, item) => sum + item.atendimentos, 0);
  const totalExecutados = chartData.reduce((sum, item) => sum + item.executados, 0);
  const taxaExecucao = ((totalExecutados / totalAtendimentos) * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('7d')}
          >
            7 dias
          </Button>
          <Button
            variant={timeRange === '15d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('15d')}
          >
            15 dias
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('30d')}
          >
            30 dias
          </Button>
        </div>
      </div>

      {/* Alerta */}
      <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-medium">3 guias precisam de atenção: assinaturas pendentes</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-lg border p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Atendimentos Hoje</h3>
              <p className="text-3xl font-bold mt-2">42</p>
              <p className="text-sm text-green-600 mt-1">↑ 8% vs ontem</p>
            </div>
            <Clock className="text-muted-foreground h-6 w-6" />
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Taxa de Execução</h3>
              <p className="text-3xl font-bold mt-2">{taxaExecucao}%</p>
              <p className="text-sm text-green-600 mt-1">Meta: 95%</p>
            </div>
            <TrendingUp className="text-muted-foreground h-6 w-6" />
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Guias Ativas</h3>
              <p className="text-3xl font-bold mt-2">156</p>
              <p className="text-sm text-amber-600 mt-1">12 vencem em 7 dias</p>
            </div>
            <FileText className="text-muted-foreground h-6 w-6" />
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Agenda do Dia</h3>
              <p className="text-3xl font-bold mt-2">28</p>
              <p className="text-sm text-gray-600 mt-1">3 horários livres</p>
            </div>
            <Calendar className="text-muted-foreground h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Gráficos e Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Atendimentos vs Execuções</h3>
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
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Atendimentos"
                />
                <Line
                  type="monotone"
                  dataKey="executados"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--muted-foreground))' }}
                  name="Executados"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
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
  )
}
