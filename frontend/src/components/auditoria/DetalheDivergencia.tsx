import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatarData } from "@/lib/utils";
import { DivergenciaBadge } from "../ui/divergencia-badge";
import { StatusBadge } from "../ui/status-badge";
import { Button } from "@/components/ui/button";
import { Divergencia } from "@/app/auditoria/page";
import { CheckCircle2, X } from "lucide-react";

interface DetalheDivergenciaProps {
  divergencia: Divergencia | null;
  open: boolean;
  onClose: () => void;
  onResolverClick: () => void;
}

export function DetalheDivergencia({ divergencia, open, onClose, onResolverClick }: DetalheDivergenciaProps) {
  if (!divergencia) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Detalhes da Divergência
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-500">ID da Sessão</h4>
              <p className="mt-1 text-gray-800 font-medium">{divergencia.sessao_id}</p>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-500">Guia</h4>
              <p className="mt-1 text-gray-800 font-medium">{divergencia.numero_guia}</p>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-500">Paciente</h4>
              <p className="mt-1 text-gray-800 font-medium">{divergencia.paciente_nome || '-'}</p>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-500">Carteirinha</h4>
              <p className="mt-1 text-gray-800 font-medium">{divergencia.carteirinha || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-500">Data do Atendimento</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {formatarData(new Date(divergencia.data_atendimento))}
              </p>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-500">Data da Execução</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {formatarData(new Date(divergencia.data_execucao))}
              </p>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-500">Data de Identificação</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {formatarData(new Date(divergencia.data_identificacao))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-500">Tipo de Divergência</h4>
              <div className="mt-1">
                <DivergenciaBadge tipo={divergencia.tipo_divergencia} />
              </div>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <div className="mt-1">
                <StatusBadge status={divergencia.status} />
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-sm font-medium text-gray-500">Descrição</h4>
            <p className="mt-1 text-gray-800">{divergencia.descricao || '-'}</p>
          </div>

          {divergencia.observacoes && (
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-500">Observações</h4>
              <p className="mt-1 text-gray-800">{divergencia.observacoes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {divergencia.status !== 'resolvido' && (
              <Button
                onClick={onResolverClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="lg"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Marcar como Resolvida
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
