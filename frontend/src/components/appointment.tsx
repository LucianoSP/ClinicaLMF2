import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Appointment as AppointmentType } from '@/lib/mockData'
import { AppointmentDetails } from './appointment-details'

interface AppointmentProps extends React.ComponentProps<typeof Card> {
  appointment: AppointmentType
}

const statusStyles = {
  confirmed: 'border-l-4 border-l-green-500',
  missing: 'border-l-4 border-l-yellow-500',
  toConfirm: 'border-l-4 border-l-blue-500',
  reserved: 'border-l-4 border-l-purple-500',
  substitute: 'border-l-4 border-l-cyan-500',
}

export function Appointment({ appointment, className, ...props }: AppointmentProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleClick = () => {
    setIsDetailsOpen(true)
  }

  return (
    <>
      <Card
        className={cn(
          'h-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer',
          statusStyles[appointment.status],
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <CardHeader className="p-2">
          <CardTitle className="text-sm font-medium">
            {appointment.patientName}
          </CardTitle>
          <CardDescription className="text-xs">
            {appointment.therapistName}
          </CardDescription>
        </CardHeader>
      </Card>
      <AppointmentDetails
        appointment={appointment}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  )
}

