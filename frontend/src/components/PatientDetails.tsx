'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { format } from 'date-fns'

interface Guide {
  id: string
  numero_guia: string
  data_emissao: string | null
  data_validade: string | null
  quantidade_autorizada: number
  quantidade_executada: number
  status: string
  tipo: string
}

interface PatientDetailsProps {
  patient: {
    id: string
    nome: string
    carteirinha: string
    plano?: {
      id: string
      nome: string
      codigo: string
    }
    guias: Guide[]
  }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  try {
    // Primeiro verifica se a data já está no formato DD/MM/YYYY
    if (dateStr.includes('/')) {
      return dateStr
    }
    // Se não estiver, assume que está em formato ISO e converte
    const date = new Date(dateStr)
    return format(date, 'dd/MM/yyyy')
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return '-'
  }
}

export default function PatientDetails({ patient }: PatientDetailsProps) {
  console.log('PatientDetails - Dados recebidos:', {
    paciente: patient,
    guias: patient.guias,
    plano: patient.plano
  })

  return (
    <div className="space-y-6">
      {/* Card do Plano */}
      {patient.plano && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#8B4513]">
              Plano de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome do Plano</p>
                <p className="text-base font-medium">{patient.plano.nome}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Código</p>
                <p className="text-base font-medium">{patient.plano.codigo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card das Guias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#8B4513]">Guias</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.guias.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data de Emissão</TableHead>
                  <TableHead>Data de Validade</TableHead>
                  <TableHead>Sessões</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.guias.map((guia) => (
                  <TableRow key={guia.id}>
                    <TableCell>{guia.numero_guia}</TableCell>
                    <TableCell>{guia.data_emissao}</TableCell>
                    <TableCell>{guia.data_validade}</TableCell>
                    <TableCell>
                      {guia.quantidade_executada}/{guia.quantidade_autorizada}
                    </TableCell>
                    <TableCell>{guia.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma guia encontrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
