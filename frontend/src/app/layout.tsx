'use client'

import './globals.css'
import type { Metadata } from 'next'
import { Sidebar } from '@/components/Sidebar'
import { outfit } from '@/lib/fonts'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/hooks/useAuth'
import "react-datepicker/dist/react-datepicker.css";

export const metadata: Metadata = {
  title: 'Processador de PDFs - Clínica Larissa',
  description: 'Sistema de processamento de PDFs para a Clínica Larissa',
  icons: {
    icon: [
      { url: '/icones/logo.png' },
      { url: '/icones/logo.png', type: 'image/png' }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={outfit.className}>
      <body className="min-h-screen">
        <AuthProvider>
          <div className="flex h-full">
            <Sidebar />
            <div className="flex-1">
              <main className="p-8">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
