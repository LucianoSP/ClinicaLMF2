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
  carteirinhas = 0,
  guias = 0,
  sessoes = 0,
  divergencias = 0
}: PacienteDashboardProps) {
  const modules = [
    {
      title: 'Carteirinhas',
      value: carteirinhas,
      description: `De total`,
      icon: CreditCard
    },
    {
      title: 'Guias',
      value: guias,
      description: `De total`,
      icon: FileCheck
    },
    {
      title: 'Sessões',
      value: sessoes,
      description: `autorizadas (5)`,
      icon: Activity
    },
    {
      title: 'Divergências',
      value: divergencias,
      description: 'Divergências pendentes',
      icon: AlertTriangle
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {modules.map((module, index) => (
        <Card
          key={index}
          className="!bg-white border shadow-sm hover:bg-gray-50/50 transition-colors duration-200"
        >
          <div className="p-4 !bg-transparent">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  {module.title}
                </h3>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {module.value || 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {module.description}
                </p>
              </div>
              <module.icon className="text-gray-500 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
