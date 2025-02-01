'use client'

import { useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import {
  AlertCircle, Calendar, Clock, FileText, TrendingUp,
  CheckCircle2, XCircle, AlertTriangle, FileSignature
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Dados simulados
const generateData = () => ({
  atendimentosChart: Array.from({ length: 7 }, (_, i) => ({
    data: `${i + 1}/1`,
    atendimentos: Math.floor(Math.random() * 50) + 30,
    executados: Math.floor(Math.random() * 40) + 25,
  })),
  statusFichas: [
    { name: 'Assinadas', value: 85 },
    { name: 'Pendentes', value: 15 }
  ],
  divergencias: [
    { tipo: 'Sem Assinatura', quantidade: 8 },
    { tipo: 'Data Incorreta', quantidade: 5 },
    { tipo: 'Sem Execução', quantidade: 3 },
    { tipo: 'Duplicadas', quantidade: 2 }
  ]
})

const COLORS = ['#3b82f6', '#93c5fd', '#60a5fa', '#2563eb']

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const data = generateData()
  
  // Métricas calculadas
  const totalAtendimentos = data.atendimentosChart.reduce((sum, item) => sum + item.atendimentos, 0)
  const totalExecutados = data.atendimentosChart.reduce((sum, item) => sum + item.executados, 0)
  const taxaExecucao = ((totalExecutados / totalAtendimentos) * 100).toFixed(1)

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Visão geral do faturamento e auditoria</p>
        </div>
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

      {/* Alertas */}
      {/* <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <div className="flex-1">
          <h4 className="font-medium text-amber-800">Atenção Necessária</h4>
          <p className="text-sm text-amber-700">8 fichas pendentes de assinatura • 3 guias próximas do vencimento</p>
        </div>
        <Button variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-100">
          Ver Detalhes
        </Button>
      </div> */}

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Atendimentos Hoje</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">42</h3>
                <div className="flex items-center mt-1 text-green-600 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+8% vs ontem</span>
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Execução</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{taxaExecucao}%</h3>
                <div className="mt-2 w-full">
                  <Progress value={Number(taxaExecucao)} className="h-2" />
                </div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Fichas Pendentes</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">8</h3>
                <div className="flex items-center mt-1 text-amber-600 text-sm">
                  <FileSignature className="h-4 w-4 mr-1" />
                  <span>Necessitam assinatura</span>
                </div>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Guias Ativas</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">156</h3>
                <div className="flex items-center mt-1 text-blue-600 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>3 próximas do vencimento</span>
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Atendimentos vs Execuções</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.atendimentosChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="data" stroke="#6b7280" fontSize={12} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="atendimentos"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    name="Atendimentos"
                  />
                  <Line
                    type="monotone"
                    dataKey="executados"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={{ fill: '#60a5fa' }}
                    name="Executados"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráficos Status e Divergências */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Status das Fichas</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusFichas}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.statusFichas.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Assinadas</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-300 mr-2" />
                  <span className="text-sm text-gray-600">Pendentes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Divergências</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={data.divergencias} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      dataKey="tipo" 
                      type="category" 
                      fontSize={11}
                      width={100}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="quantidade" 
                      fill="#3b82f6" 
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
