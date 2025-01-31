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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Guia } from "@/services/guiaService"
import { toast } from "sonner"
import { API_URL } from "@/config/api"

interface GuiaFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  pacienteId: string
  carteirinha?: string
  guia?: Guia
}

const formatarDataParaInput = (dataStr: string | null) => {
  if (!dataStr) return ''
  // Se a data contém 'T', é uma string ISO, pega apenas a parte da data
  if (dataStr.includes('T')) {
    dataStr = dataStr.split('T')[0]
  }
  return dataStr
}

export function GuiaForm({ isOpen, onClose, onSuccess, pacienteId, carteirinha, guia }: GuiaFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<{
    numero_guia: string;
    data_emissao: string;
    data_validade: string;
    tipo: 'sp_sadt' | 'consulta' | 'internacao';
    status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
    carteirinha_id: string;
    paciente_carteirinha: string;
    paciente_nome: string;
    quantidade_autorizada: number;
    quantidade_executada: number;
    procedimento_codigo: string;
    procedimento_nome: string;
    profissional_solicitante: string;
    profissional_executante: string;
    observacoes: string;
  }>({
    numero_guia: '',
    data_emissao: '',
    data_validade: '',
    tipo: 'sp_sadt',
    status: 'pendente',
    carteirinha_id: carteirinha || '',
    paciente_carteirinha: '',
    paciente_nome: '',
    quantidade_autorizada: 0,
    quantidade_executada: 0,
    procedimento_codigo: '',
    procedimento_nome: '',
    profissional_solicitante: '',
    profissional_executante: '',
    observacoes: ''
  })

  useEffect(() => {
    if (guia) {
      setFormData({
        numero_guia: guia.numero_guia,
        data_emissao: formatarDataParaInput(guia.data_emissao),
        data_validade: formatarDataParaInput(guia.data_validade),
        tipo: guia.tipo,
        status: guia.status,
        carteirinha_id: guia.carteirinha_id,
        paciente_carteirinha: guia.paciente_carteirinha,
        paciente_nome: guia.paciente_nome,
        quantidade_autorizada: guia.quantidade_autorizada,
        quantidade_executada: guia.quantidade_executada,
        procedimento_codigo: guia.procedimento_codigo,
        procedimento_nome: guia.procedimento_nome,
        profissional_solicitante: guia.profissional_solicitante,
        profissional_executante: guia.profissional_executante,
        observacoes: guia.observacoes
      })
    } else {
      setFormData({
        numero_guia: '',
        data_emissao: '',
        data_validade: '',
        tipo: 'sp_sadt',
        status: 'pendente',
        carteirinha_id: carteirinha || '',
        paciente_carteirinha: '',
        paciente_nome: '',
        quantidade_autorizada: 0,
        quantidade_executada: 0,
        procedimento_codigo: '',
        procedimento_nome: '',
        profissional_solicitante: '',
        profissional_executante: '',
        observacoes: ''
      })
    }
  }, [guia, carteirinha])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = guia
        ? `${API_URL}/pacientes/${pacienteId}/guias/${guia.id}`
        : `${API_URL}/pacientes/${pacienteId}/guias`

      const response = await fetch(url, {
        method: guia ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar guia')
      }

      toast.success(guia ? 'Guia atualizada com sucesso!' : 'Guia criada com sucesso!')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar guia:', error)
      toast.error('Erro ao salvar guia')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{guia ? 'Editar Guia' : 'Nova Guia'}</DialogTitle>
          <DialogDescription>
            {guia ? 'Edite os dados da guia' : 'Preencha os dados da nova guia'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numero_guia" className="text-right">
                Número
              </Label>
              <Input
                id="numero_guia"
                value={formData.numero_guia}
                onChange={(e) => setFormData({ ...formData, numero_guia: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipo" className="text-right">
                Tipo
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: 'sp_sadt' | 'consulta' | 'internacao') =>
                  setFormData({ ...formData, tipo: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sp_sadt">SP/SADT</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="internacao">Internação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantidade_autorizada" className="text-right">
                Qtd. Autorizada
              </Label>
              <Input
                id="quantidade_autorizada"
                type="number"
                value={formData.quantidade_autorizada}
                onChange={(e) => setFormData({ ...formData, quantidade_autorizada: parseInt(e.target.value) })}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="procedimento_codigo" className="text-right">
                Cód. Procedimento
              </Label>
              <Input
                id="procedimento_codigo"
                value={formData.procedimento_codigo}
                onChange={(e) => setFormData({ ...formData, procedimento_codigo: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="procedimento_nome" className="text-right">
                Procedimento
              </Label>
              <Input
                id="procedimento_nome"
                value={formData.procedimento_nome}
                onChange={(e) => setFormData({ ...formData, procedimento_nome: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="profissional_solicitante" className="text-right">
                Solicitante
              </Label>
              <Input
                id="profissional_solicitante"
                value={formData.profissional_solicitante}
                onChange={(e) => setFormData({ ...formData, profissional_solicitante: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="profissional_executante" className="text-right">
                Executante
              </Label>
              <Input
                id="profissional_executante"
                value={formData.profissional_executante}
                onChange={(e) => setFormData({ ...formData, profissional_executante: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="observacoes" className="text-right">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
