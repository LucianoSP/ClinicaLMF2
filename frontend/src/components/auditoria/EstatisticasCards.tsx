import React from 'react';
import { 
  ClipboardList, 
  AlertCircle, 
  CheckCircle2, 
  FileSignature, 
  Calendar,
  Clock, 
  Files, 
  FileCheck2, 
  AlertTriangle,
  FileWarning,
  FileX,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Type definition for audit data
interface AuditoriaData {
  total_protocolos: number;
  total_divergencias: number;
  total_fichas: number;
  total_execucoes: number;
  total_resolvidas: number;
  data_execucao: string;
  tempo_execucao: string;
  divergencias_por_tipo: {
    execucao_sem_sessao: number;
    sessao_sem_execucao: number;
    data_divergente: number;
    sessao_sem_assinatura: number;
    guia_vencida: number;
    quantidade_excedida: number;
    duplicidade: number;
  };
}

const EstatisticasCards = ({ resultadoAuditoria }: { resultadoAuditoria: AuditoriaData | null }) => {
  if (!resultadoAuditoria) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">Nenhuma auditoria realizada ainda.</p>
      </div>
    );
  }

  const {
    total_divergencias = 0,
    total_resolvidas = 0,
    total_fichas = 0,
    total_execucoes = 0,
    data_execucao,
    tempo_execucao,
    divergencias_por_tipo = {}
  } = resultadoAuditoria;

  // Ensure all required fields exist in divergencias_por_tipo with proper defaults
  const {
    execucao_sem_sessao = 0,
    sessao_sem_execucao = 0,
    data_divergente = 0,
    sessao_sem_assinatura = 0,
    guia_vencida = 0,
    quantidade_excedida = 0,
    duplicidade = 0
  } = divergencias_por_tipo || {};

  // Debug logging
  console.log("Received audit data:", resultadoAuditoria);

  const CardWrapper = ({ children, className = "" }) => (
    <div className={`transform transition-all duration-300 hover:scale-105 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* First row - Status Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CardWrapper>
          <Card className="bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-blue-900">Total de Execuções</CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <Files className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-blue-800">{total_execucoes}</div>
                <p className="text-xs text-blue-600">Execuções analisadas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-blue-900">Total de Fichas</CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <FileCheck2 className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-blue-800">{total_fichas}</div>
                <p className="text-xs text-blue-600">Fichas verificadas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-blue-900">Resolvidas</CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-blue-800">
                  {total_divergencias > 0
                    ? Math.round((total_resolvidas / total_divergencias) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-blue-600">Divergências resolvidas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-blue-900">Última Execução</CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-2xl font-bold text-blue-800 flex items-baseline gap-2">
                  {data_execucao
                    ? format(new Date(data_execucao), "dd/MM/yyyy")
                    : "-"}
                  <span className="text-lg">
                    {data_execucao
                      ? format(new Date(data_execucao), "HH:mm")
                      : ""}
                  </span>
                </div>
                <p className="text-xs text-blue-600">{tempo_execucao || "Tempo não disponível"}</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>
      </div>

      {/* Linha inferior - Cards de problemas (vermelho) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-red-900">Divergências</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-red-800">{total_divergencias}</div>
                <p className="text-xs text-red-600">Total de divergências encontradas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-red-900">Sessões sem Assinatura</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <FileSignature className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-red-800">{sessao_sem_assinatura}</div>
                <p className="text-xs text-red-600">Sessões executadas sem assinatura</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-red-900">Execuções sem Ficha</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <FileWarning className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-red-800">{execucao_sem_sessao}</div>
                <p className="text-xs text-red-600">Execuções sem sessão correspondente</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-red-900">Fichas sem Execução</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <FileX className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-red-800">{sessao_sem_execucao}</div>
                <p className="text-xs text-red-600">Execuções não encontradas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-red-900">Datas Divergentes</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-red-800">{data_divergente}</div>
                <p className="text-xs text-red-600">Datas não correspondem</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-red-900">Guias Vencidas</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-red-800">{guia_vencida}</div>
                <p className="text-xs text-red-600">Guias expiradas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-red-900">Qtd. Excedida</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <ClipboardList className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-red-800">{quantidade_excedida}</div>
                <p className="text-xs text-red-600">Quantidade excedida na guia</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        {/* Fix the incorrect closing CardWrapper tag structure */}
        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow h-[135px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-red-900">Duplicidades</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <Copy className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-red-800">{duplicidade}</div>
                <p className="text-xs text-red-600">Execuções duplicadas detectadas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>
      </div>
    </div>
  );
};

export { EstatisticasCards };