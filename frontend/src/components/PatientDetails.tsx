import { formatarData } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Info } from "lucide-react"

interface PatientDetailsProps {
  patient: any
  guides: any[]
}

const statusColors = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  APROVADA: "bg-green-100 text-green-800",
  NEGADA: "bg-red-100 text-red-800",
  EM_ANALISE: "bg-blue-100 text-blue-800"
}

export default function PatientDetails({ patient, guides }: PatientDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Nome</h4>
          <p className="text-lg">{patient.nome}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Carteirinha</h4>
          <p className="text-lg">{patient.carteirinha}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Guias do Paciente</h3>
        {guides?.length ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Número</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Data Solicitação</TableHead>
                  <TableHead>Data Validade</TableHead>
                  <TableHead>Sessões</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guides.map((guide) => (
                  <TableRow key={guide.id}>
                    <TableCell className="font-medium">{guide.numero_guia}</TableCell>
                    <TableCell>{guide.procedimento_nome}</TableCell>
                    <TableCell>{formatarData(guide.data_emissao)}</TableCell>
                    <TableCell>{formatarData(guide.data_validade)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {guide.quantidade_executada}/{guide.quantidade_autorizada}
                        <Info className="h-4 w-4 text-muted-foreground" title="Quantidade executada / autorizada" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span 
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusColors[guide.status as keyof typeof statusColors]}`}
                      >
                        {guide.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="group relative">
                        <Info 
                          className="h-4 w-4 text-muted-foreground inline-block cursor-help" 
                        />
                        <div className="absolute hidden group-hover:block right-0 mt-2 w-48 p-2 bg-white border rounded-md shadow-lg z-10">
                          <div className="space-y-2 text-sm">
                            <p><strong>Código:</strong> {guide.procedimento_codigo}</p>
                            <p><strong>Solicitante:</strong> {guide.profissional_solicitante}</p>
                            {guide.observacoes && (
                              <p><strong>Observações:</strong> {guide.observacoes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma guia encontrada para este paciente.
          </div>
        )}
      </div>
    </div>
  )
}
