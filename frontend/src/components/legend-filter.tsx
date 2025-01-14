import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"

const statuses = [
  { label: "Todos", value: "all" },
  { label: "Confirmado", value: "confirmed" },
  { label: "Falta", value: "missing" },
  { label: "A Confirmar", value: "toConfirm" },
  { label: "Reserva", value: "reserved" },
  { label: "Substituir Profissional", value: "substitute" },
]

export function LegendFilter({ onFilterChange }: { onFilterChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("all")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value ? statuses.find((status) => status.value === value)?.label : "Filtrar por status"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar status..." />
          <CommandEmpty>Nenhum status encontrado.</CommandEmpty>
          <CommandGroup>
            {statuses.map((status) => (
              <CommandItem
                key={status.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue)
                  onFilterChange(currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === status.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {status.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

