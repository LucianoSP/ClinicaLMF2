import { addHours, setHours, setMinutes } from 'date-fns'

export type AppointmentStatus = 'confirmed' | 'missing' | 'toConfirm' | 'reserved' | 'substitute'

export interface Appointment {
  id: string
  room: string
  startTime: Date
  endTime: Date
  patientName: string
  therapistName: string
  therapyType: string
  status: AppointmentStatus
}

const patientNames = [
  'Maria Silva', 'João Santos', 'Ana Oliveira', 'Pedro Costa', 'Carla Ferreira',
  'Ricardo Almeida', 'Sofia Rodrigues', 'Miguel Pereira', 'Beatriz Gomes', 'Luís Martins'
]

const therapistNames = [
  'Dr. Silva', 'Dra. Santos', 'Dr. Oliveira', 'Dra. Costa', 'Dr. Ferreira',
  'Dra. Almeida', 'Dr. Rodrigues', 'Dra. Pereira', 'Dr. Gomes', 'Dra. Martins'
]

const therapyTypes = ['Fonoaudiologia', 'ABA', 'Terapia Ocupacional', 'Fisioterapia', 'Psicologia']

const statuses: AppointmentStatus[] = ['confirmed', 'missing', 'toConfirm', 'reserved', 'substitute']

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function generateMockAppointments(date: Date, roomCount: number): Appointment[] {
  const appointments: Appointment[] = []
  const startHour = 7
  const endHour = 19

  for (let hour = startHour; hour < endHour; hour++) {
    for (let room = 1; room <= roomCount; room++) {
      if (Math.random() < 0.7) { // 70% chance of an appointment in each slot
        const startTime = setHours(setMinutes(date, 0), hour)
        const endTime = addHours(startTime, 1)
        const roomId = `C${String(room).padStart(2, '0')}`

        appointments.push({
          id: `${roomId}-${startTime.getTime()}`,
          room: roomId,
          startTime,
          endTime,
          patientName: getRandomItem(patientNames),
          therapistName: getRandomItem(therapistNames),
          therapyType: getRandomItem(therapyTypes),
          status: getRandomItem(statuses)
        })
      }
    }
  }

  return appointments
}

