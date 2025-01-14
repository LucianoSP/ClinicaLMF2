import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Appointment } from '@/lib/mockData'

interface AppointmentDetailsProps {
  appointment: Appointment
  isOpen: boolean
  onClose: () => void
}

export function AppointmentDetails({ appointment, isOpen, onClose }: AppointmentDetailsProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(isOpen)
  }, [isOpen])

  const handleClose = () => {
    setOpen(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
          <X className="absolute right-4 top-4 cursor-pointer opacity-70 transition-opacity hover:opacity-100" onClick={handleClose} />
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold">Paciente:</span>
            <span className="col-span-3">{appointment.patientName}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold">Terapeuta:</span>
            <span className="col-span-3">{appointment.therapistName}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold">Terapia:</span>
            <span className="col-span-3">{appointment.therapyType}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold">Horário:</span>
            <span className="col-span-3">
              {appointment.startTime.toLocaleTimeString()} - {appointment.endTime.toLocaleTimeString()}
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold">Sala:</span>
            <span className="col-span-3">{appointment.room}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold">Status:</span>
            <span className="col-span-3">{appointment.status}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

