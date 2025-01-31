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
      description: 'Gestão de planos de saúde',
      icon: FileText,
      href: '/cadastros/planos'
    },
    {
      title: 'Pacientes',
      description: 'Gestão de pacientes',
      icon: Users,
      href: '/cadastros/pacientes'
    },
    {
      title: 'Carteirinhas',
      description: 'Gestão de carteirinhas',
      icon: CreditCard,
      href: '/cadastros/carteirinhas'
    },
    {
      title: 'Guias',
      description: 'Gestão de guias médicas',
      icon: FileCheck,
      href: '/cadastros/guias'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Cadastros</h1>
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
                  <h3 className="card-title-cadastro">{module.title}</h3>
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
