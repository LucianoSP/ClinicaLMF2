import './globals.css'
import type { Metadata } from 'next'
import { Sidebar } from '@/components/Sidebar'
import { inter } from './fonts'

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
    <html lang="pt-BR" className={inter.className}>
      <head>
        <link rel="icon" href="/icones/logo.png" />
      </head>
      <body>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
