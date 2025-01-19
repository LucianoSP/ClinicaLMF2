import './globals.css'
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
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
