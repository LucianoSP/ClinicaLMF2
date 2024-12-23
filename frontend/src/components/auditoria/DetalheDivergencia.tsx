import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarData } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { DivergenciaBadge } from "../ui/divergencia-badge";
import { StatusBadge } from "../ui/status-badge";

interface DetalheDivergenciaProps {
  divergencia: {
    id: string;
    numero_guia: string;
    data_execucao: string | null;
    data_atendimento: string | null;
    data_identificacao: string;
    codigo_ficha: string | null;
    paciente_nome: string | null;
    carteirinha: string | null;
    status: string;
    tipo_divergencia: string;
    prioridade: string;
    descricao: string | null;
    possui_assinatura: boolean;
    arquivo_digitalizado: string | null;
    observacoes: string | null;
    resolvido_por: string | null;
    data_resolucao: string | null;
    quantidade_autorizada: number | null;
    quantidade_executada: number | null;
  } | null;
  open: boolean;
  onClose: () => void;
}

export function DetalheDivergencia({ divergencia, open, onClose }: DetalheDivergenciaProps) {
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
                {divergencia.data_atendimento ? formatarData(new Date(divergencia.data_atendimento)) : '-'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Data da Execução</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {divergencia.data_execucao ? formatarData(new Date(divergencia.data_execucao)) : '-'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Data de Identificação</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {divergencia.data_identificacao ? formatarData(new Date(divergencia.data_identificacao)) : '-'}
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

          {(divergencia.quantidade_autorizada !== null || divergencia.quantidade_executada !== null) && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-sm font-medium text-gray-500">Quantidade Autorizada</h4>
                <p className="mt-1 text-gray-800 font-medium">{divergencia.quantidade_autorizada || '-'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-sm font-medium text-gray-500">Quantidade Executada</h4>
                <p className="mt-1 text-gray-800 font-medium">{divergencia.quantidade_executada || '-'}</p>
              </div>
            </div>
          )}

          {divergencia.descricao && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Descrição</h4>
              <p className="mt-1 text-gray-800">{divergencia.descricao}</p>
            </div>
          )}

          {divergencia.observacoes && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Observações</h4>
              <p className="mt-1 text-gray-800">{divergencia.observacoes}</p>
            </div>
          )}

          {divergencia.arquivo_digitalizado && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Arquivo Digitalizado</h4>
              <a
                href={divergencia.arquivo_digitalizado}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                Visualizar Arquivo
              </a>
            </div>
          )}

          {divergencia.status === 'resolvida' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-sm font-medium text-gray-500">Resolvido Por</h4>
                <p className="mt-1 text-gray-800 font-medium">{divergencia.resolvido_por || '-'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-sm font-medium text-gray-500">Data de Resolução</h4>
                <p className="mt-1 text-gray-800 font-medium">
                  {divergencia.data_resolucao ? formatarData(new Date(divergencia.data_resolucao)) : '-'}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
