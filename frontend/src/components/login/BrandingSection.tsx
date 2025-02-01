import { DollarSign, LineChart } from "lucide-react"

export function BrandingSection() {
  return (
    <div className="hidden lg:flex flex-col justify-center p-8 animate-fadeInLeft">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative w-32 h-32 bg-gray-900 rounded-full shadow-lg flex items-center justify-center">
            <LineChart className="h-16 w-16 text-blue-400 animate-spin-slow" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white animate-fadeIn">
          Sistema de Gerenciamento de Faturamento
        </h1>
        <p className="text-xl text-gray-300 animate-fadeIn delay-200">
          Clínica Larissa Martins Ferreira
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <div className="w-16 h-16 bg-gray-900 shadow-lg rounded-xl flex items-center justify-center animate-bounce">
            <DollarSign className="h-8 w-8 text-blue-400" />
          </div>
          <div className="w-16 h-16 bg-gray-900 shadow-lg rounded-xl flex items-center justify-center animate-bounce delay-100">
            <LineChart className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  )
} 