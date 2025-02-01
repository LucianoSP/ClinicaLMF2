import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LockIcon } from "lucide-react"
import { LoginForm } from "./LoginForm"

interface LoginCardProps {
  onSubmit: (email: string, password: string) => Promise<void>
  isLoading: boolean
}

export function LoginCard({ onSubmit, isLoading }: LoginCardProps) {
  return (
    <Card className="bg-gray-900/85 backdrop-blur-lg shadow-2xl border-gray-700">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-blue-800 p-2 rounded-lg">
            <LockIcon className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-white font-bold">Login</CardTitle>
        </div>
        <CardDescription className="text-gray-300">
          Acesse o sistema de gerenciamento de faturamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm onSubmit={onSubmit} isLoading={isLoading} />
      </CardContent>
    </Card>
  )
} 