import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, History } from "lucide-react";

interface ExecucaoStatus {
  taskId: string;
  status: "Processing" | "Finalizado" | "Error" | "Iniciado";
  guias: string;
  duracao: string;
  inicio: string;
}

interface UnimedDashboardProps {
  execucoes: ExecucaoStatus[];
}

const statusColors = {
  Processing: "bg-blue-500",
  Finalizado: "bg-green-500",
  Error: "bg-red-500",
  Iniciado: "bg-gray-500",
};

const formatGuiasProgress = (guias: string) => {
  const [processadas, total] = guias.split("/").map(Number);
  const porcentagem = Math.round((processadas / total) * 100) || 0;
  return {
    processadas,
    total,
    porcentagem,
  };
};

const formatDuracao = (inicio: string) => {
  try {
    return formatDistanceToNow(parseISO(inicio), {
      locale: ptBR,
      addSuffix: true,
    });
  } catch {
    return "Data inválida";
  }
};

export function UnimedDashboard({ execucoes }: UnimedDashboardProps) {
  const execucoesEmAndamento = execucoes.filter(
    (exec) => exec.status === "Processing"
  ).length;

  const ultimasExecucoes = execucoes.slice(0, 10);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="p-6 hover:bg-accent/5 transition-colors">
        <div className="flex flex-col items-start gap-4">
          <Activity className="h-6 w-6 text-muted-foreground" />
          <div>
            <h3 className="card-title-cadastro">Status Atual</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Execuções em andamento: {execucoesEmAndamento}
            </p>
          </div>
        </div>
      </Card>

      <Card className="col-span-2 p-6 hover:bg-accent/5 transition-colors">
        <div className="flex flex-col items-start gap-4">
          <History className="h-6 w-6 text-muted-foreground" />
          <div className="w-full">
            <h3 className="card-title-cadastro">Histórico de Execuções (24h)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Últimas {ultimasExecucoes.length} execuções
            </p>
            <div className="space-y-4 mt-4">
              {ultimasExecucoes.map((execucao) => {
                const { processadas, total, porcentagem } = formatGuiasProgress(
                  execucao.guias
                );

                return (
                  <div key={execucao.taskId} className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Task ID: {execucao.taskId}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-white text-xs ${
                            statusColors[execucao.status]
                          }`}
                        >
                          {execucao.status}
                        </span>
                      </div>
                      <Progress value={porcentagem} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {processadas} de {total} guias processadas
                        </span>
                        <span>{formatDuracao(execucao.inicio)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
