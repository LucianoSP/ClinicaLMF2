import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarData } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useState } from "react";
import { DetalheDivergencia } from "./DetalheDivergencia";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Divergencia } from "@/app/auditoria/page";

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
          <TableRow className="h-12">
            <TableHead>Guia</TableHead>
            <TableHead>Código Ficha</TableHead>
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
            <TableRow key={divergencia.id} className="h-12">
              <TableCell>{divergencia.numero_guia}</TableCell>
              <TableCell>{divergencia.codigo_ficha || '-'}</TableCell>
              <TableCell>{divergencia.paciente_nome}</TableCell>
              <TableCell>{divergencia.data_atendimento ? formatarData(new Date(divergencia.data_atendimento)) : '-'}</TableCell>
              <TableCell>{divergencia.data_execucao ? formatarData(new Date(divergencia.data_execucao)) : '-'}</TableCell>
              <TableCell>
                <BadgeStatus value={divergencia.tipo_divergencia} />
              </TableCell>
              <TableCell>
                <BadgeStatus value={divergencia.status} />
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
        onResolverClick={() => {
          if (selectedDivergencia) {
            onResolve(selectedDivergencia.id);
            setSelectedDivergencia(null);
          }
        }}
      />
    </div>
  );
}