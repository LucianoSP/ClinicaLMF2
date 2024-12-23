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
  observacoes: string;
  resolvido_por: string;
  data_resolucao: string;
  detalhes: Record<string, any>;
}

interface TabelaDivergenciasProps {
  divergencias: Divergencia[];
  onResolverClick: (divergencia: Divergencia) => void;
}

export function TabelaDivergencias({ divergencias, onResolverClick }: TabelaDivergenciasProps) {
  const [selectedDivergencia, setSelectedDivergencia] = useState<Divergencia | null>(null);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Guia</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Data Execução</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {divergencias.map((divergencia) => (
            <TableRow key={divergencia.id} onClick={() => setSelectedDivergencia(divergencia)}>
              <TableCell>
                <StatusBadge status={divergencia.status} />
              </TableCell>
              <TableCell>
                <DivergenciaBadge tipo={divergencia.tipo_divergencia} />
              </TableCell>
              <TableCell>{divergencia.numero_guia}</TableCell>
              <TableCell>{divergencia.paciente_nome}</TableCell>
              <TableCell>{divergencia.data_execucao}</TableCell>
              <TableCell>{divergencia.descricao}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResolverClick(divergencia)}
                >
                  Resolver
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DetalheDivergencia
        divergencia={selectedDivergencia}
        open={!!selectedDivergencia}
        onClose={() => setSelectedDivergencia(null)}
      />
    </div>
  );
}