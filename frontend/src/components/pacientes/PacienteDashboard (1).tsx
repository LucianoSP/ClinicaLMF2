'use client'

import { Card } from '@/components/ui/card'
import {
  CreditCard,
  FileCheck,
  Activity,
  AlertTriangle
} from 'lucide-react'

interface PacienteDashboardProps {
  carteirinhas: number;
  guias: number;
  sessoes: number;
  divergencias: number;
}

export function PacienteDashboard({ 
  carteirinhas, 
  guias, 
  sessoes, 
  divergencias 
}: PacienteDashboardProps) {
  const modules = [
    {
      title: 'Carteirinhas',
      value: carteirinhas,
      description: `De ${carteirinhas} total`,
      icon: CreditCard,
      href: '#carteirinhas'
    },
    {
      title: 'Guias',
      value: guias,
      description: `De ${guias} total`,
      icon: FileCheck,
      href: '#guias'
    },
    {
      title: 'Sessões',
      value: sessoes,
      description: `${sessoes} autorizadas (0%)`,
      icon: Activity,
      href: '#sessoes'
    },
    {
      title: 'Divergências',
      value: divergencias,
      description: 'Divergências pendentes',
      icon: AlertTriangle,
      href: '#divergencias'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {modules.map((module) => (
        <Card 
          key={module.href} 
          className="p-6 hover:bg-accent/5 transition-colors cursor-pointer"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <module.icon className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-500">
                {module.value}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">
                {module.title}
              </h3>
              <p className="text-xs text-muted-foreground/80 mt-1">
                {module.description}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
