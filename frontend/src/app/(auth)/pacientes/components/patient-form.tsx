'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Paciente } from '@/types/paciente'

interface PatientFormProps {
  isOpen: boolean
  onClose: () => void
  patient?: Paciente
}

export function PatientForm({ isOpen, onClose, patient }: PatientFormProps) {
  const [formData, setFormData] = useState({
    nome: patient?.nome || '',
    carteirinha: patient?.carteirinhas?.[0]?.numero || '', // Alterado aqui
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement patient creation/update logic
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {patient ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
          <DialogDescription>
            {patient
              ? 'Edite as informações do paciente abaixo'
              : 'Preencha as informações do novo paciente'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="carteirinha" className="text-right">
                Carteirinha
              </Label>
              <Input
                id="carteirinha"
                value={formData.carteirinha}
                onChange={(e) =>
                  setFormData({ ...formData, carteirinha: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}