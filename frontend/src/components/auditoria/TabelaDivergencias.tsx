import { formatarData } from "@/lib/utils";
import { parse } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useState } from "react";
import { DetalheDivergencia } from "./DetalheDivergencia";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Divergencia } from "@/app/(auth)/auditoria/page";
import SortableTable, { Column } from '@/components/SortableTable';

interface TabelaDivergenciasProps {
  divergencias: Divergencia[];
  onMarcarResolvido: (id: string) => void;
  loading?: boolean;
}

export function TabelaDivergencias({ divergencias, onMarcarResolvido, loading }: TabelaDivergenciasProps) {
  const [selectedDivergencia, setSelectedDivergencia] = useState<Divergencia | null>(null);

  const columns: Column<Divergencia>[] = [
    {
      key: 'numero_guia',
      label: 'Guia',
    },
    {
      key: 'sessao_id',
      label: 'Sessão ID',
      render: (value, item) => {
        const sessaoId = value || (item.detalhes?.sessao_id);
        return sessaoId || '-';
      }
    },
    {
      key: 'codigo_ficha',
      label: 'Código Ficha',
      render: (value) => value || '-'
    },
    {
      key: 'paciente_nome',
      label: 'Paciente',
    },
    {
      key: 'data_atendimento',
      label: 'Data Atendimento',
      render: (value) => {
        if (!value) return '-';
        try {
          const date = value.includes('/') ? parse(value, 'dd/MM/yyyy', new Date()) : new Date(value);
          return formatarData(date);
        } catch {
          return '-';
        }
      }
    },
    {
      key: 'data_execucao',
      label: 'Data Execução',
      render: (value) => {
        if (!value) return '-';
        try {
          const date = value.includes('/') ? parse(value, 'dd/MM/yyyy', new Date()) : new Date(value);
          return formatarData(date);
        } catch {
          return '-';
        }
      }
    },
    {
      key: 'tipo_divergencia',
      label: 'Tipo',
      render: (value) => <BadgeStatus value={value} />
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <BadgeStatus value={value} />
    }
  ];

  const actions = (item: Divergencia) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setSelectedDivergencia(item)}
    >
      Detalhes
    </Button>
  );

  return (
    <>
      <SortableTable
        data={divergencias}
        columns={columns}
        actions={actions}
      />

      <DetalheDivergencia
        divergencia={selectedDivergencia}
        open={!!selectedDivergencia}
        onClose={() => setSelectedDivergencia(null)}
        onResolverClick={() => {
          if (selectedDivergencia) {
            onMarcarResolvido(selectedDivergencia.id);
            setSelectedDivergencia(null);
          }
        }}
      />
    </>
  );
}