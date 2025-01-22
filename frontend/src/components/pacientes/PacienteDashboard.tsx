'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Users,
  ClipboardCheck,
  Timer,
  BarChart,
  AlertTriangle
} from 'lucide-react'

interface PacienteEstatisticas {
  total: number;
  items: {
    status: string;
  }[];
  fichas: {
    status: string;
  }[];
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
      value: estatisticas.items?.length || 0,
      description: `${estatisticas.total || 0} total`,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Guias',
      value: estatisticas.items?.filter(item => item.status === 'pendente').length || 0,
      description: `${estatisticas.items?.length || 0} total`,
      icon: ClipboardCheck,
      color: 'text-green-500'
    },
    {
      title: 'Sessões',
      value: estatisticas.fichas?.length || 0,
      description: `${estatisticas.fichas?.filter(f => f.status === 'pendente').length || 0} pendentes`,
      icon: Timer,
      color: 'text-purple-500'
    },
    {
      title: 'Divergências',
      value: 0,
      description: 'pendentes',
      icon: AlertTriangle,
      color: 'text-red-500'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
