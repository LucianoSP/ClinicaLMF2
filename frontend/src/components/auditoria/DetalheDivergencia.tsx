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
      <DialogContent className="max-w-4xl bg-white dark:bg-gray-800 shadow-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Detalhes da Divergência
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Guia</h4>
              <p className="mt-1 text-gray-900 dark:text-white font-medium">{divergencia.guia_id}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Paciente</h4>
              <p className="mt-1 text-gray-900 dark:text-white font-medium">{divergencia.paciente_nome}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Carteirinha</h4>
              <p className="mt-1 text-gray-900 dark:text-white font-medium">{divergencia.paciente_carteirinha}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Data de Execução</h4>
              <p className="mt-1 text-gray-900 dark:text-white font-medium">
                {divergencia.data_execucao ? formatarData(new Date(divergencia.data_execucao), false) : '-'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Data do Atendimento</h4>
              <p className="mt-1 text-gray-900 dark:text-white font-medium">
                {divergencia.data_registro ? formatarData(new Date(divergencia.data_registro), false) : '-'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Código da Ficha</h4>
              <p className="mt-1 text-gray-900 dark:text-white font-medium">{divergencia.codigo_ficha || '-'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Quantidade</h4>
              <p className="mt-1 text-gray-900 dark:text-white font-medium">
                {divergencia.quantidade_executada !== undefined ? 
                  `${divergencia.quantidade_executada}/${divergencia.quantidade_autorizada} executadas` : 
                  '-'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Assinatura</h4>
              <Badge 
                variant="outline" 
                className={`mt-1 ${divergencia.possui_assinatura ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}
              >
                {divergencia.possui_assinatura ? 'Presente' : 'Ausente'}
              </Badge>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</h4>
              <Badge 
                variant="outline" 
                className={`mt-1 ${divergencia.status === 'resolvida' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'}`}
              >
                {divergencia.status.charAt(0).toUpperCase() + divergencia.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Tipo de Divergência</h4>
            <Badge 
              variant="outline" 
              className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
            >
              {divergencia.tipo_divergencia}
            </Badge>
            {divergencia.descricao_divergencia && (
              <p className="mt-2 text-gray-700 dark:text-gray-300">
                {divergencia.descricao_divergencia}
              </p>
            )}
          </div>

          {divergencia.observacoes && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Observações</h4>
              <p className="text-gray-700 dark:text-gray-300">{divergencia.observacoes}</p>
            </div>
          )}

          {divergencia.arquivo_digitalizado && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Arquivo Digitalizado</h4>
              <a 
                href={divergencia.arquivo_digitalizado} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
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
