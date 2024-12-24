import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarData } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { DivergenciaBadge } from "../ui/divergencia-badge";
import { StatusBadge } from "../ui/status-badge";
import { Button } from "@/components/ui/button";
import { Divergencia } from '@/types';

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
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Detalhes da Divergência
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Guia</h4>
              <p className="mt-1 text-gray-800 font-medium">{divergencia.numero_guia}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Paciente</h4>
              <p className="mt-1 text-gray-800 font-medium">{divergencia.paciente_nome || '-'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Carteirinha</h4>
              <p className="mt-1 text-gray-800 font-medium">{divergencia.carteirinha || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Data do Atendimento</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {formatarData(new Date(divergencia.data_atendimento))}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Data da Execução</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {formatarData(new Date(divergencia.data_execucao))}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Data de Identificação</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {formatarData(new Date(divergencia.data_identificacao))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Tipo de Divergência</h4>
              <div className="mt-1">
                <DivergenciaBadge tipo={divergencia.tipo_divergencia} />
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <div className="mt-1">
                <StatusBadge status={divergencia.status} />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500">Descrição</h4>
            <p className="mt-1 text-gray-800">{divergencia.descricao || '-'}</p>
          </div>

          {divergencia.observacoes && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Observações</h4>
              <p className="mt-1 text-gray-800">{divergencia.observacoes}</p>
            </div>
          )}

          {divergencia.status !== 'resolvido' && (
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => onResolverClick()}
                variant="default"
                size="lg"
              >
                Marcar como Resolvida
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
