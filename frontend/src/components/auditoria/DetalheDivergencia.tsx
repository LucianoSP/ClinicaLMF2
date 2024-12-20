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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Divergência</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Guia</h4>
              <p className="mt-1">{divergencia.guia_id}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Paciente</h4>
              <p className="mt-1">{divergencia.paciente_nome}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Carteirinha</h4>
              <p className="mt-1">{divergencia.paciente_carteirinha}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Data de Execução</h4>
              <p className="mt-1">
                {divergencia.data_execucao ? formatarData(new Date(divergencia.data_execucao), false) : '-'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Data do Atendimento</h4>
              <p className="mt-1">
                {divergencia.data_registro ? formatarData(new Date(divergencia.data_registro), false) : '-'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Código da Ficha</h4>
              <p className="mt-1">{divergencia.codigo_ficha || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Quantidade</h4>
              <p className="mt-1">
                {divergencia.quantidade_executada !== undefined ? 
                  `${divergencia.quantidade_executada}/${divergencia.quantidade_autorizada} executadas` : 
                  '-'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Assinatura</h4>
              <Badge 
                variant="outline" 
                className={divergencia.possui_assinatura ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
              >
                {divergencia.possui_assinatura ? 'Presente' : 'Ausente'}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <Badge 
                variant="outline" 
                className={divergencia.status === 'resolvida' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
              >
                {divergencia.status.charAt(0).toUpperCase() + divergencia.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Tipo de Divergência</h4>
            <Badge 
              variant="outline" 
              className="text-sm"
            >
              {divergencia.tipo_divergencia}
            </Badge>
          </div>

          {divergencia.descricao_divergencia && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Descrição</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {divergencia.descricao_divergencia}
              </p>
            </div>
          )}

          {divergencia.observacoes && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Observações</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {divergencia.observacoes}
              </p>
            </div>
          )}

          {divergencia.arquivo_digitalizado && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Arquivo Digitalizado</h4>
              <a 
                href={divergencia.arquivo_digitalizado}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
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
