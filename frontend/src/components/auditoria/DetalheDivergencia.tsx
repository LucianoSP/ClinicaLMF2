import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarData } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface DetalheDivergenciaProps {
  divergencia: {
    id: string;
    guia_id: string;
    data_execucao: string;
    data_registro: string;
    codigo_ficha: string;
    paciente_nome: string;
    paciente_carteirinha: string;
    status: string;
    tipo_divergencia?: string;
    descricao_divergencia?: string;
    possui_assinatura: boolean;
    arquivo_digitalizado?: string;
    observacoes?: string;
    quantidade_autorizada?: number;
    quantidade_executada?: number;
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
              <p className="mt-1 text-gray-800 font-medium">{divergencia.guia_id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Paciente</h4>
              <p className="mt-1 text-gray-800 font-medium">{divergencia.paciente_nome}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Carteirinha</h4>
              <p className="mt-1 text-gray-800 font-medium">{divergencia.paciente_carteirinha}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Data de Execução</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {divergencia.data_execucao ? formatarData(new Date(divergencia.data_execucao), false) : '-'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Data do Atendimento</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {divergencia.data_registro ? formatarData(new Date(divergencia.data_registro), false) : '-'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Código da Ficha</h4>
              <p className="mt-1 text-gray-800 font-medium">{divergencia.codigo_ficha || '-'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Quantidade</h4>
              <p className="mt-1 text-gray-800 font-medium">
                {divergencia.quantidade_executada !== undefined ? 
                  `${divergencia.quantidade_executada}/${divergencia.quantidade_autorizada} executadas` : 
                  '-'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Assinatura</h4>
              <Badge 
                variant="outline" 
                className={`mt-1 ${divergencia.possui_assinatura ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
              >
                {divergencia.possui_assinatura ? 'Presente' : 'Ausente'}
              </Badge>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <Badge 
                variant="outline" 
                className={`mt-1 ${divergencia.status === 'resolvida' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
              >
                {divergencia.status.charAt(0).toUpperCase() + divergencia.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Tipo de Divergência</h4>
            <Badge 
              variant="outline" 
              className="text-sm bg-blue-50 text-blue-700 border-blue-200"
            >
              {divergencia.tipo_divergencia}
            </Badge>
            {divergencia.descricao_divergencia && (
              <p className="mt-2 text-gray-600">
                {divergencia.descricao_divergencia}
              </p>
            )}
          </div>

          {divergencia.observacoes && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Observações</h4>
              <p className="text-gray-600">{divergencia.observacoes}</p>
            </div>
          )}

          {divergencia.arquivo_digitalizado && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Arquivo Digitalizado</h4>
              <a 
                href={divergencia.arquivo_digitalizado} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                Visualizar arquivo
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
