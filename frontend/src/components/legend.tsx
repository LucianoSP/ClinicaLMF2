import { Badge } from '@/components/ui/badge'

const items = [
  { label: 'Confirmado', color: 'bg-green-500' },
  { label: 'Falta', color: 'bg-yellow-500' },
  { label: 'A Confirmar', color: 'bg-blue-500' },
  { label: 'Reserva', color: 'bg-purple-500' },
  { label: 'Substituir Profissional', color: 'bg-cyan-500' },
]

export function Legend() {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="font-medium">Legenda:</span>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item.label} variant="outline" className="gap-2">
            <div className={`h-2 w-2 rounded-full ${item.color}`} />
            {item.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}

