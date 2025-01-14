import { addHours, format, setHours, setMinutes } from 'date-fns'
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Appointment } from '@/components/appointment'
import { generateMockAppointments, Appointment as AppointmentType } from '@/lib/mockData'

// Generate rooms
const rooms = Array.from({ length: 20 }, (_, i) => ({
  id: `C${String(i + 1).padStart(2, '0')}`,
  name: `C${String(i + 1).padStart(2, '0')}`,
}))

// Generate mock appointments for today
const mockAppointments = generateMockAppointments(new Date(), rooms.length)

interface CalendarProps {
  filter: string
}

export function Calendar({ filter }: CalendarProps) {
  // Generate time slots from 7:00 to 19:00
  const timeSlots = Array.from({ length: 13 }, (_, i) => 
    addHours(setHours(setMinutes(new Date(), 0), 7), i)
  )

  const filteredAppointments = filter === 'all'
    ? mockAppointments
    : mockAppointments.filter(apt => apt.status === filter)

  return (
    <div className="flex-1 rounded-lg border">
      <ScrollArea className="h-[calc(100vh-13rem)]">
        <div className="relative">
          {/* Header */}
          <div className="sticky top-0 z-20 flex bg-background">
            <div className="w-20 flex-none border-b border-r">
              <div className="h-12" />
            </div>
            <div className="flex">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex w-[150px] flex-none items-center justify-center border-b border-r py-3 text-sm font-medium"
                >
                  {room.name}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex">
            {/* Time column */}
            <div className="w-20 flex-none">
              {timeSlots.map((time) => (
                <div
                  key={time.toISOString()}
                  className="flex h-24 items-center justify-end border-b border-r px-4 text-sm text-muted-foreground"
                >
                  {format(time, 'HH:mm')}
                </div>
              ))}
            </div>

            {/* Appointment grid */}
            <div className="flex">
              {rooms.map((room) => (
                <div key={room.id} className="w-[150px] flex-none">
                  {timeSlots.map((time) => {
                    const appointment = filteredAppointments?.find(
                      (apt: AppointmentType) =>
                        apt.room === room.id &&
                        apt.startTime.getHours() === time.getHours()
                    )

                    return (
                      <div
                        key={time.toISOString()}
                        className={cn(
                          'relative h-24 border-b border-r',
                          appointment && 'bg-muted/50'
                        )}
                      >
                        {appointment && (
                          <Appointment
                            appointment={appointment}
                            className="absolute inset-1"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

