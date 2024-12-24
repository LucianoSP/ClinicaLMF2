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

export default function PatientDetails({ patient, guides }: PatientDetailsProps) {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase().replace(/ /g, "_");
    return (
      statusConfig[normalizedStatus as keyof typeof statusConfig] || 
      {
        label: status,
        className: "bg-gray-50 text-gray-800 rounded-full"
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        {guides?.length ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Número</TableHead>
                  <TableHead className="w-[180px]">Procedimento</TableHead>
                  <TableHead className="w-[200px]">Profissional</TableHead>
                  <TableHead className="w-[180px]">Datas</TableHead>
                  <TableHead className="w-[120px]">Sessões</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[60px]">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guides.map((guide) => (
                  <TableRow key={guide.id}>
                    <TableCell className="font-medium">{guide.numero_guia}</TableCell>
                    <TableCell>
                      <div className="truncate">
                        <p className="font-medium truncate">{guide.procedimento_nome}</p>
                        <p className="text-sm text-muted-foreground truncate">{guide.procedimento_codigo}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm truncate">Solicitante: {guide.profissional_solicitante}</p>
                        <p className="text-sm truncate">Executante: {guide.profissional_executante}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Emissão:</span>{" "}
                          {formatarData(guide.data_emissao)}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Validade:</span>{" "}
                          {formatarData(guide.data_validade)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {guide.quantidade_executada}/{guide.quantidade_autorizada}
                          </span>
                          <div className="group relative inline-block">
                            <Info 
                              className="h-4 w-4 text-muted-foreground hover:text-gray-900 transition-colors cursor-help" 
                            />
                            <div className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-sm bg-gray-900 text-white rounded whitespace-nowrap">
                              Sessões executadas: {guide.quantidade_executada}
                              <br />
                              Sessões autorizadas: {guide.quantidade_autorizada}
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
                              width: `${(guide.quantidade_executada / guide.quantidade_autorizada) * 100}%`,
                              backgroundColor: guide.quantidade_executada >= guide.quantidade_autorizada ? '#ef4444' : '#22c55e'
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className={`px-3 py-1.5 text-sm font-medium inline-block whitespace-nowrap ${getStatusConfig(guide.status).className}`}
                      >
                        {getStatusConfig(guide.status).label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <div className="group relative">
                          <Info 
                            className="h-5 w-5 text-muted-foreground inline-block cursor-help" 
                          />
                          <div className="absolute hidden group-hover:block right-0 mt-2 w-64 p-3 bg-white border rounded-md shadow-lg z-10">
                            <div className="space-y-2 text-sm">
                              <p><strong>Procedimento:</strong> {guide.procedimento_nome}</p>
                              <p><strong>Código:</strong> {guide.procedimento_codigo}</p>
                              <p><strong>Solicitante:</strong> {guide.profissional_solicitante}</p>
                              <p><strong>Executante:</strong> {guide.profissional_executante}</p>
                              <p><strong>Sessões:</strong> {guide.quantidade_executada} de {guide.quantidade_autorizada}</p>
                              {guide.observacoes && (
                                <p><strong>Observações:</strong> {guide.observacoes}</p>
                              )}
                            </div>
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
