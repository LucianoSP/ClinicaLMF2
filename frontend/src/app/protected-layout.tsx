'use client'

import { Sidebar } from '@/components/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login')
    }
  }, [user, loading, pathname, router])

  // Se estiver carregando, mostra uma tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Se não estiver autenticado e não estiver na página de login, não renderiza nada
  if (!user && pathname !== '/login') {
    return null
  }

  // Se estiver na página de login e estiver autenticado, redireciona para home
  if (user && pathname === '/login') {
    router.replace('/')
    return null
  }

  // Se estiver na página de login, não mostra o layout protegido
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
