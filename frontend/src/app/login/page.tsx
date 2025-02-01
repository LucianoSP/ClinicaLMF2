'use client'

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { BrandingSection } from "@/components/login/BrandingSection"
import { LoginCard } from "@/components/login/LoginCard"
import "@/styles/animations.css"

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace("/")
    }
  }, [user, loading, router])

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await signIn(email, password)
      toast({
        title: "Login realizado com sucesso!",
        description: "Você será redirecionado para a página inicial.",
      })
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: "Verifique suas credenciais e tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-gray-100 to-white">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full relative bg-gradient-to-br from-blue-500 via-gray-100 to-white flex items-center justify-center p-4 overflow-hidden">
      {/* Blobs animados no fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container flex justify-center items-center mx-auto z-10">
        <div className="grid lg:grid-cols-2 gap-8 w-full max-w-5xl">
          <BrandingSection />
          <div className="w-full max-w-md mx-auto animate-fadeInRight">
            <LoginCard onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}
