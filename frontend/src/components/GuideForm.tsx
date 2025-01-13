'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { API_URL } from "@/config/api"

interface GuideFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  patientId: string
  carteirinha?: string
  guia?: Guide // Add this prop for editing
}

const formatDateForInput = (dateStr: string | null) => {
  if (!dateStr) return ''
  // If date contains 'T', it's an ISO string, take only the date part
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0]
  }
  // If date is in DD/MM/YYYY format, convert to YYYY-MM-DD
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return dateStr
}

export function GuideForm({ isOpen, onClose, onSuccess, patientId, carteirinha, guia }: GuideFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    numero_guia: '',
    data_emissao: '',
    data_validade: '',
    quantidade_autorizada: 0,
    tipo: '',
    procedimento_nome: '',
    paciente_carteirinha: carteirinha || ''
  })

  // Initialize form with guia data when editing
  useEffect(() => {
    if (guia) {
      setFormData({
        numero_guia: guia.numero_guia,
        data_emissao: formatDateForInput(guia.data_emissao),
        data_validade: formatDateForInput(guia.data_validade),
        quantidade_autorizada: guia.quantidade_autorizada,
        tipo: guia.tipo,
        procedimento_nome: guia.procedimento_nome || '',
        paciente_carteirinha: guia.paciente_carteirinha
      })
    } else {
      // Reset form when creating new
      setFormData({
        numero_guia: '',
        data_emissao: '',
        data_validade: '',
        quantidade_autorizada: 0,
        tipo: '',
        procedimento_nome: '',
        paciente_carteirinha: carteirinha || ''
      })
    }
  }, [guia, carteirinha])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = guia 
        ? `${API_URL}/pacientes/${patientId}/guias/${guia.id}`
        : `${API_URL}/pacientes/${patientId}/guias`

      const response = await fetch(url, {
        method: guia ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          paciente_carteirinha: carteirinha,
          tipo: 'consulta',
          status: guia?.status || 'pendente'
        }),
      })

      if (!response.ok) throw new Error('Falha ao salvar guia')

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar guia:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="text-left">
            <DialogTitle className="text-[#8B4513] text-xl font-semibold">
              {guia ? 'Editar Guia' : 'Nova Guia'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Preencha os dados da {guia ? 'guia de autorização para edição' : 'nova guia de autorização'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numero_guia" className="text-right">
                Número
              </Label>
              <Input
                id="numero_guia"
                value={formData.numero_guia}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_guia: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="data_emissao" className="text-right">
                Data Emissão
              </Label>
              <Input
                id="data_emissao"
                type="date"
                value={formData.data_emissao}
                onChange={(e) => setFormData(prev => ({ ...prev, data_emissao: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="data_validade" className="text-right">
                Data Validade
              </Label>
              <Input
                id="data_validade"
                type="date"
                value={formData.data_validade}
                onChange={(e) => setFormData(prev => ({ ...prev, data_validade: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantidade" className="text-right">
                Qtd. Sessões
              </Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={formData.quantidade_autorizada}
                onChange={(e) => setFormData(prev => ({ ...prev, quantidade_autorizada: Number(e.target.value) }))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="procedimento" className="text-right">
                Procedimento
              </Label>
              <Input
                id="procedimento"
                value={formData.procedimento_nome}
                onChange={(e) => setFormData(prev => ({ ...prev, procedimento_nome: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
