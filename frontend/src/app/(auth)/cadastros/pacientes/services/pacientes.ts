import { Paciente } from '@/types/paciente'
import { api } from '@/lib/api'

export async function getPacientes(): Promise<Paciente[]> {
  try {
    const { data } = await api.get<Paciente[]>('/pacientes')
    return data
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error)
    throw error
  }
}

export async function getPacienteById(id: string): Promise<Paciente> {
  try {
    const { data } = await api.get<Paciente>(`/pacientes/${id}`)
    return data
  } catch (error) {
    console.error('Erro ao buscar paciente:', error)
    throw error
  }
}

export async function createPaciente(paciente: Partial<Paciente>): Promise<Paciente> {
  try {
    const { data } = await api.post<Paciente>('/pacientes', paciente)
    return data
  } catch (error) {
    console.error('Erro ao criar paciente:', error)
    throw error
  }
}

export async function updatePaciente(id: string, paciente: Partial<Paciente>): Promise<Paciente> {
  try {
    const { data } = await api.put<Paciente>(`/pacientes/${id}`, paciente)
    return data
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error)
    throw error
  }
}

export async function deletePaciente(id: string): Promise<void> {
  try {
    await api.delete(`/pacientes/${id}`)
  } catch (error) {
    console.error('Erro ao deletar paciente:', error)
    throw error
  }
}