'use client'

import { Toaster } from '@/components/ui/toaster'
import { outfit } from '@/lib/fonts'
import { Providers } from '../providers'

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Providers>
        {children}
        <Toaster />
      </Providers>
    </div>
  )
}
