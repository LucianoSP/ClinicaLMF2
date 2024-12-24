import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

interface PatientDetailsProps {
  patient: {
    id: string
    nome: string
    carteirinha: string
    created_at: string
    updated_at: string
    plano_saude?: {
      nome: string
      codigo: string
    }
    carteirinha_info?: {
      numero_carteirinha: string
      data_validade: string
      titular: boolean
      nome_titular: string
    }
  }
  guides: Array<{
    id: string
    numero_guia: string
    data_emissao: string
    data_validade: string
    quantidade_autorizada: number
    quantidade_executada: number
    procedimento_nome: string
    procedimento_codigo: string
    status: string
    profissional_solicitante: string
    profissional_executante: string
    observacoes: string
  }>
}

export function PatientDetails({ patient, guides }: PatientDetailsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Nome</h3>
              <p>{patient.nome}</p>
            </div>
            <div>
              <h3 className="font-semibold">Carteirinha</h3>
              <p>{patient.carteirinha}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {patient.plano_saude && (
        <Card>
          <CardHeader>
            <CardTitle>Plano de Saúde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Nome do Plano</h3>
                <p>{patient.plano_saude.nome}</p>
              </div>
              <div>
                <h3 className="font-semibold">Código</h3>
                <p>{patient.plano_saude.codigo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {patient.carteirinha_info && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Carteirinha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Número da Carteirinha</h3>
                <p>{patient.carteirinha_info.numero_carteirinha}</p>
              </div>
              <div>
                <h3 className="font-semibold">Validade</h3>
                <p>{formatDate(patient.carteirinha_info.data_validade)}</p>
              </div>
              <div>
                <h3 className="font-semibold">Titular</h3>
                <p>{patient.carteirinha_info.titular ? 'Sim' : 'Não'}</p>
              </div>
              {!patient.carteirinha_info.titular && (
                <div>
                  <h3 className="font-semibold">Nome do Titular</h3>
                  <p>{patient.carteirinha_info.nome_titular}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {guides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Guias</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Qtd. Aut/Exec</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guides.map((guide) => (
                  <TableRow key={guide.id}>
                    <TableCell>{guide.numero_guia}</TableCell>
                    <TableCell>{formatDate(guide.data_emissao)}</TableCell>
                    <TableCell>{formatDate(guide.data_validade)}</TableCell>
                    <TableCell>{guide.procedimento_nome}</TableCell>
                    <TableCell>{guide.status}</TableCell>
                    <TableCell>{guide.quantidade_autorizada}/{guide.quantidade_executada}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
