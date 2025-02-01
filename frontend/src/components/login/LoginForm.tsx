'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  isLoading: boolean
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await onSubmit(email, password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700">
          Email
        </Label>
        <Input
          id="email"
          placeholder="seu.email@exemplo.com"
          type="email"
          className="bg-white border-gray-200 text-gray-800 focus:border-blue-400"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-700">
          Senha
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          className="bg-white border-gray-200 text-gray-800 focus:border-blue-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center justify-between">
        <Link
          href="/recuperar-senha"
          className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
        >
          Esqueceu sua senha?
        </Link>
      </div>
      <Button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  )
} 