'use client'

import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="font-semibold mb-2">Bem-vindo, {user?.nome}!</h2>
        <p className="text-gray-600">
          Tipo de usuário: {user?.tipo_usuario}
        </p>
      </div>
    </div>
  )
}
