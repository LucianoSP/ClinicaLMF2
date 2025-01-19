'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  FileText,
  Users,
  CreditCard,
  FileCheck
} from 'lucide-react'

export default function CadastrosPage() {
  const modules = [
    {
      title: 'Planos de Saúde',
      description: 'Gerencia os planos de saúde cadastrados',
      icon: FileText,
      href: '/cadastros/planos'
    },
    {
      title: 'Pacientes',
      description: 'Cadastro e gestão de pacientes',
      icon: Users,
      href: '/cadastros/pacientes'
    },
    {
      title: 'Carteirinhas',
      description: 'Controle de carteirinhas emitidas',
      icon: CreditCard,
      href: '/cadastros/carteirinhas'
    },
    {
      title: 'Guias',
      description: 'Gerenciamento de guias médicas',
      icon: FileCheck,
      href: '/cadastros/guias'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cadastros</h1>
        <p className="text-muted-foreground">
          Gerencie os cadastros do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="p-6 hover:bg-accent/5 transition-colors cursor-pointer">
              <div className="flex flex-col items-start gap-4">
                <module.icon className="h-6 w-6 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{module.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {module.description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
