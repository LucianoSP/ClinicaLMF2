'use client'

import { Card } from '@/components/ui/card'
import {
  Users,
  ClipboardCheck,
  Timer,
  BarChart,
} from 'lucide-react'

interface PacienteEstatisticas {
  total_carteirinhas: number;
  carteirinhas_ativas: number;
  total_guias: number;
  guias_ativas: number;
  sessoes_autorizadas: number;
  sessoes_executadas: number;
  divergencias_pendentes: number;
  taxa_execucao: number;
  guias_por_status: {
    pendente: number;
    em_andamento: number;
    concluida: number;
    cancelada: number;
  };
}

interface PacienteDashboardProps {
  estatisticas: PacienteEstatisticas;
}

export function PacienteDashboard({ estatisticas }: PacienteDashboardProps) {
  console.log('PacienteDashboard - estatisticas recebidas:', estatisticas);
  if (!estatisticas) return null;

  const cards = [
    {
      title: 'Carteirinhas',
      value: estatisticas.carteirinhas_ativas,
      description: `${estatisticas.total_carteirinhas} total`,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Guias',
      value: estatisticas.guias_ativas,
      description: `${estatisticas.total_guias} total`,
      icon: ClipboardCheck,
      color: 'text-green-500'
    },
    {
      title: 'Sessões',
      value: estatisticas.sessoes_executadas,
      description: `${estatisticas.sessoes_autorizadas} autorizadas`,
      icon: Timer,
      color: 'text-purple-500'
    },
    {
      title: 'Taxa de Execução',
      value: `${estatisticas.taxa_execucao}%`,
      description: 'das sessões',
      icon: BarChart,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="bg-white border shadow-sm hover:bg-gray-50/50 transition-colors duration-200"
        >
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  {card.title}
                </h3>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {card.description}
                </p>
              </div>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
