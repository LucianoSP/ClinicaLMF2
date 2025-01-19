import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { outfit } from '@/lib/fonts'
import { Toaster } from '@/components/ui/toaster'
import "react-datepicker/dist/react-datepicker.css"
import { Providers } from './providers'
import { metadata } from './metadata'

export { metadata }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={outfit.className}>
      <body className="min-h-screen">
        <Providers>
          <div className="flex h-full">
            <Sidebar />
            <div className="flex-1">
              <main className="p-8">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
