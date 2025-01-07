import React from 'react';
import { ClipboardList, AlertCircle, CheckCircle2, FileSignature, FileWarning, Clock, Files, FileCheck2, AlertTriangle, FileX, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";

const EstatisticasCards = ({ resultadoAuditoria }) => {
  if (!resultadoAuditoria) return null;

  const {
    total_fichas_sem_execucao = 0,
    total_datas_divergentes = 0,
    total_fichas = 0,  
    total_execucoes = 0,  
    total_resolvidas = 0,  
    total_divergencias = 0,
  } = resultadoAuditoria;

  const CardWrapper = ({ children, className = "" }) => (
    <div className={`transform transition-all duration-300 hover:scale-105 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Linha superior - Cards neutros (azul) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CardWrapper>
          <Card className="bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-900">Total de Guias</CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <Files className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1">
                <div className="text-3xl font-bold text-blue-800">{total_execucoes}</div>
                <p className="text-xs text-blue-600">Guias analisadas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-900">Total de Fichas</CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <FileCheck2 className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1">
                <div className="text-3xl font-bold text-blue-800">{total_fichas}</div>
                <p className="text-xs text-blue-600">Fichas verificadas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-900">Resolvidas</CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1">
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
          <Card className="bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-900">Última Execução</CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1">
                <div className="text-3xl font-bold text-blue-800">
                  {resultadoAuditoria.data_execucao
                    ? format(new Date(resultadoAuditoria.data_execucao), "dd/MM/yyyy HH:mm")
                    : "-"}
                </div>
                <p className="text-xs text-blue-600">{resultadoAuditoria.tempo_execucao || "Tempo não disponível"}</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>
      </div>

      {/* Linha inferior - Cards de problemas (vermelho) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-red-900">Divergências</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1">
                <div className="text-3xl font-bold text-red-800">{total_divergencias}</div>
                <p className="text-xs text-red-600">Total de divergências encontradas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-red-900">Execuções sem Ficha</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <FileWarning className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1">
                <div className="text-3xl font-bold text-red-800">{resultadoAuditoria.total_execucoes_sem_ficha}</div>
                <p className="text-xs text-red-600">Fichas não encontradas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-red-900">Fichas sem Execução</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <FileX className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1">
                <div className="text-3xl font-bold text-red-800">{total_fichas_sem_execucao}</div>
                <p className="text-xs text-red-600">Execuções não encontradas</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>

        <CardWrapper>
          <Card className="bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-red-900">Datas Divergentes</CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1">
                <div className="text-3xl font-bold text-red-800">{total_datas_divergentes}</div>
                <p className="text-xs text-red-600">Datas não correspondem</p>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>
      </div>
    </div>
  );
};

export { EstatisticasCards };