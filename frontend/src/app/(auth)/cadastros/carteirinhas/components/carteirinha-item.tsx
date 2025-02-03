'use client'

interface CarteirinhaItemProps {
  carteirinha: {
    id: string
    paciente: {
      nome: string
    }
    dataEmissao: string
    dataValidade: string
    status: string
  }
}

export function CarteirinhaItem({ carteirinha }: CarteirinhaItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="font-medium">{carteirinha.paciente.nome}</h3>
        <div className="text-sm text-muted-foreground">
          Emissão: {new Date(carteirinha.dataEmissao).toLocaleDateString()}
          {' | '}
          Validade: {new Date(carteirinha.dataValidade).toLocaleDateString()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs ${
          carteirinha.status === 'ATIVA' ? 'bg-green-100 text-green-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {carteirinha.status}
        </span>
      </div>
    </div>
  )
}
