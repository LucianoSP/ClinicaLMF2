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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useRouter } from 'next/navigation';

interface PatientDetailsProps {
  patient: any
}

const statusConfig = {
  pendente: {
    label: "Pendente",
    className: "bg-yellow-50 text-yellow-800 rounded-full"
  },
  aprovada: {
    label: "Aprovada",
    className: "bg-green-50 text-green-800 rounded-full"
  },
  negada: {
    label: "Negada",
    className: "bg-red-50 text-red-800 rounded-full"
  },
  em_analise: {
    label: "Em análise",
    className: "bg-blue-50 text-blue-800 rounded-full"
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-red-50 text-red-800 rounded-full"
  },
  em_andamento: {
    label: "Em andamento",
    className: "bg-green-50 text-green-800 rounded-full"
  },
  data_divergente: {
    label: "Data Divergente",
    className: "bg-red-50 text-red-800 rounded-full"
  },
  execucao_sem_ficha: {
    label: "Execução Sem Ficha",
    className: "bg-red-50 text-red-800 rounded-full"
  }
} as const;

export default function PatientDetails({ patient }: PatientDetailsProps) {
  const router = useRouter()
  console.log("Patient data:", patient) // Debug

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{patient?.nome}</h2>
        <Button variant="outline" size="sm" onClick={() => router.push(`/pacientes/${patient?.id}/editar`)}>
          Editar Paciente
        </Button>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-base font-medium text-gray-900">Guias do Paciente</h3>
            <span className="text-sm text-gray-500">Carteirinha: {patient?.carteirinha}</span>
          </div>
          
          {patient?.guias?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Número</TableHead>
                  <TableHead className="w-[180px]">Procedimento</TableHead>
                  <TableHead className="w-[200px]">Profissional</TableHead>
                  <TableHead className="w-[180px]">Datas</TableHead>
                  <TableHead className="w-[120px]">Sessões</TableHead>
                  <TableHead className="w-[140px]">Tipo</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[60px]">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.guias.map((guia: any) => (
                  <TableRow key={guia.id}>
                    <TableCell className="font-medium">{guia.numero_guia}</TableCell>
                    <TableCell>
                      <div className="truncate max-w-[160px]">
                        <div className="font-medium">{guia.procedimento_nome}</div>
                        <div className="text-sm text-muted-foreground">{guia.procedimento_codigo}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="truncate max-w-[180px]">
                          <div className="text-sm">Solicitante: {guia.profissional_solicitante}</div>
                          <div className="text-sm">Executante: {guia.profissional_executante}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">Emissão: {format(new Date(guia.data_emissao), 'dd/MM/yyyy')}</div>
                        <div className="text-sm">Validade: {format(new Date(guia.data_validade), 'dd/MM/yyyy')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {guia.quantidade_executada}/{guia.quantidade_autorizada}
                          </span>
                          <div className="group relative inline-block">
                            <Info 
                              className="h-4 w-4 text-muted-foreground hover:text-gray-900 transition-colors cursor-help" 
                            />
                            <div className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-sm bg-gray-900 text-white rounded whitespace-nowrap">
                              Sessões executadas: {guia.quantidade_executada}
                              <br />
                              Sessões autorizadas: {guia.quantidade_autorizada}
                              <div className="absolute left-1/2 transform -translate-x-1/2 top-full">
                                <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all"
                            style={{ 
                              width: `${(guia.quantidade_executada / guia.quantidade_autorizada) * 100}%`,
                              backgroundColor: guia.quantidade_executada >= guia.quantidade_autorizada ? '#ef4444' : '#22c55e'
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          "inline-flex items-center px-4 py-1 text-xs font-medium rounded-full",
                          {
                            "bg-[#dcfce7] text-[#15803d]": guia.tipo === "Data Divergente",
                            "bg-[#fef9c3] text-[#854d0e]": guia.tipo === "Execucao Sem Ficha",
                          }
                        )}
                      >
                        {guia.tipo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          "inline-flex items-center px-4 py-1 text-xs font-medium rounded-full",
                          {
                            "bg-[#fef9c3] text-[#854d0e]": guia.status === "pendente",
                            "bg-[#dcfce7] text-[#15803d]": guia.status === "em_andamento",
                            "bg-[#fee2e2] text-[#991b1b]": guia.status === "cancelada",
                            "bg-[#dbeafe] text-[#1e40af]": guia.status === "concluida",
                          }
                        )}
                      >
                        {guia.status === "pendente" && "Pendente"}
                        {guia.status === "em_andamento" && "Em andamento"}
                        {guia.status === "cancelada" && "Cancelada"}
                        {guia.status === "concluida" && "Concluída"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma guia encontrada para este paciente.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
