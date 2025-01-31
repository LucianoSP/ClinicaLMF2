'use client'

import { Card } from '@/components/ui/card'
import { PacienteDashboard } from './PacienteDashboard'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface PacienteDetalhesProps {
  paciente: {
    nome: string;
    nome_responsavel: string;
    tipo_responsavel?: string;
    data_nascimento?: string;
    cpf?: string;
    telefone?: string;
    email?: string;
    status?: string;
    observacoes_clinicas?: string;
    created_at?: string;
    estatisticas?: {
      total_carteirinhas: number;
      carteirinhas_ativas: number;
      total_guias: number;
      guias_ativas: number;
      sessoes_autorizadas: number;
      sessoes_executadas: number;
      divergencias_pendentes: number | null;
      taxa_execucao: number;
      guias_por_status: {
        pendente: number;
        em_andamento: number;
        concluida: number;
        cancelada: number;
      };
    };
  };
  onClose: () => void;
}

export function PacienteDetalhes({ paciente, onClose }: PacienteDetalhesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback>
            {paciente.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{paciente.nome}</h2>
          <p className="text-muted-foreground">
            Cadastrado em {paciente.created_at ? format(new Date(paciente.created_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Nome do Responsável: {paciente.nome_responsavel}
          </p>
          {paciente.tipo_responsavel && (
            <p className="text-sm text-muted-foreground">
              Tipo do Responsável: {paciente.tipo_responsavel}
            </p>
          )}
          {paciente.data_nascimento && (
            <p className="text-sm text-muted-foreground">
              Data de Nascimento: {format(new Date(paciente.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          )}
          {paciente.cpf && <p className="text-sm text-muted-foreground">CPF: {paciente.cpf}</p>}
          {paciente.telefone && <p className="text-sm text-muted-foreground">Telefone: {paciente.telefone}</p>}
          {paciente.email && <p className="text-sm text-muted-foreground">Email: {paciente.email}</p>}
          {paciente.status && <p className="text-sm text-muted-foreground">Status: {paciente.status}</p>}
        </div>
        {paciente.observacoes_clinicas && (
          <div>
            <h3 className="font-semibold">Observações Clínicas</h3>
            <p className="text-sm text-muted-foreground">{paciente.observacoes_clinicas}</p>
          </div>
        )}
      </div>

      {paciente.estatisticas && (
        <Card className="p-6">
          <PacienteDashboard estatisticas={paciente.estatisticas} />
        </Card>
      )}
    </div>
  )
}
