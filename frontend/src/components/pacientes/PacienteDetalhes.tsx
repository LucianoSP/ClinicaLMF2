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
      <Card className="p-6 relative">
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback>{paciente.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{paciente.nome}</h2>
            <div className="text-sm text-muted-foreground">
              <p>Nome do Responsável: {paciente.nome_responsavel}</p>
              {paciente.tipo_responsavel && (
                <p>Tipo do Responsável: {paciente.tipo_responsavel}</p>
              )}
              {paciente.data_nascimento && (
                <p>Data de Nascimento: {format(new Date(paciente.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}</p>
              )}
              {paciente.cpf && <p>CPF: {paciente.cpf}</p>}
              {paciente.telefone && <p>Telefone: {paciente.telefone}</p>}
              {paciente.email && <p>Email: {paciente.email}</p>}
              {paciente.status && <p>Status: {paciente.status}</p>}
              {paciente.created_at && (
                <p>Data de Cadastro: {format(new Date(paciente.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
              )}
            </div>
          </div>
        </div>
        {paciente.observacoes_clinicas && (
          <div className="mt-4">
            <h3 className="font-semibold">Observações Clínicas</h3>
            <p className="text-sm text-muted-foreground">{paciente.observacoes_clinicas}</p>
          </div>
        )}
      </Card>

      {paciente.estatisticas && (
        <Card className="p-6">
          <PacienteDashboard estatisticas={paciente.estatisticas} />
        </Card>
      )}
    </div>
  )
}
