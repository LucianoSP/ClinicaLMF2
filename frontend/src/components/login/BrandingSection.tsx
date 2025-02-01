import { DollarSign, LineChart } from "lucide-react"

export function BrandingSection() {
  return (
    <div className="hidden lg:flex flex-col justify-center p-8 animate-fadeInLeft">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative w-32 h-32 bg-white/90 rounded-full shadow-lg flex items-center justify-center">
            <LineChart className="h-16 w-16 text-blue-500 animate-spin-slow" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 animate-fadeIn">
          Sistema de Gerenciamento de Faturamento
        </h1>
        <p className="text-xl text-gray-600 animate-fadeIn delay-200">
          Clínica Larissa Martins Ferreira
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <div className="w-16 h-16 bg-white/90 shadow-lg rounded-xl flex items-center justify-center animate-bounce">
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
          <div className="w-16 h-16 bg-white/90 shadow-lg rounded-xl flex items-center justify-center animate-bounce delay-100">
            <LineChart className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  )
} 