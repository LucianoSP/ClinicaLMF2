import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarData } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { DetalheDivergencia } from "./DetalheDivergencia";
import { DivergenciaBadge } from "../ui/divergencia-badge";
import { StatusBadge } from "../ui/status-badge";
import { Badge } from "../ui/badge";

interface Divergencia {
  id: string;
  numero_guia: string;
  data_execucao: string;
  data_atendimento: string;
  data_identificacao: string;
  codigo_ficha: string;
  paciente_nome: string;
  carteirinha: string;
  status: string;
  tipo_divergencia: string;
  descricao: string;
  observacoes?: string;
  resolvido_por?: string;
  data_resolucao?: string;
  detalhes: Record<string, any>;
}

interface TabelaDivergenciasProps {
  divergencias: Divergencia[];
  onResolve: (id: string) => void;
  loading?: boolean;
}

export function TabelaDivergencias({ divergencias, onResolve, loading }: TabelaDivergenciasProps) {
  const [selectedDivergencia, setSelectedDivergencia] = useState<Divergencia | null>(null);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guia</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Data Atendimento</TableHead>
            <TableHead>Data Execução</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {divergencias.map((divergencia) => (
            <TableRow key={divergencia.id}>
              <TableCell>{divergencia.numero_guia}</TableCell>
              <TableCell>{divergencia.paciente_nome}</TableCell>
              <TableCell>{formatarData(new Date(divergencia.data_atendimento))}</TableCell>
              <TableCell>{formatarData(new Date(divergencia.data_execucao))}</TableCell>
              <TableCell>
                <DivergenciaBadge tipo={divergencia.tipo_divergencia} />
              </TableCell>
              <TableCell>
                <StatusBadge status={divergencia.status} />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDivergencia(divergencia)}
                  >
                    Detalhes
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DetalheDivergencia
        divergencia={selectedDivergencia}
        open={!!selectedDivergencia}
        onClose={() => setSelectedDivergencia(null)}
        onResolverClick={(divergencia) => {
          onResolve(divergencia.id);
          setSelectedDivergencia(null);
        }}
      />
    </div>
  );
}