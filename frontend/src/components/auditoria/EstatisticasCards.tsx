"use client";
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
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface AuditoriaResultado {
  total_protocolos: number;
  total_divergencias: number;
  total_resolvidas: number;
  total_pendentes: number;
  total_fichas: number;
  total_execucoes: number;
  tempo_execucao: string;
  divergencias_por_tipo: {
    execucao_sem_ficha?: number;
    ficha_sem_execucao?: number;
    data_divergente?: number;
    ficha_sem_assinatura?: number;
    guia_vencida?: number;
    quantidade_excedida?: number;
    duplicidade?: number;
    [key: string]: number | undefined;
  };
  data_execucao: string;
}

interface EstatisticasCardsProps {
  resultadoAuditoria: AuditoriaResultado | null;
}

const EstatisticasCards = ({ resultadoAuditoria }: EstatisticasCardsProps) => {
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

  const {
    execucao_sem_ficha: execucao_sem_sessao = 0,
    ficha_sem_execucao: sessao_sem_execucao = 0,
    data_divergente = 0,
    ficha_sem_assinatura: sessao_sem_assinatura = 0,
    guia_vencida = 0,
    quantidade_excedida = 0,
    duplicidade = 0
  } = divergencias_por_tipo;

  return (
    <div className="grid gap-6">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Execuções */}
        <Card className="group hover:shadow-lg transition-all duration-300 bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total de Execuções</h3>
                <p className="text-2xl font-bold mt-1 text-blue-600">{total_execucoes}</p>
                <p className="text-xs text-gray-500 mt-0.5">Execuções analisadas</p>
              </div>
              <Files className="text-blue-500 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>

        {/* Total de Fichas */}
        <Card className="group hover:shadow-lg transition-all duration-300 bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total de Fichas</h3>
                <p className="text-2xl font-bold mt-1 text-blue-600">{total_fichas}</p>
                <p className="text-xs text-gray-500 mt-0.5">Fichas verificadas</p>
              </div>
              <FileCheck2 className="text-blue-500 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>

        {/* Divergências e Status */}
        <Card className="group hover:shadow-lg transition-all duration-300 bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Divergências</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold mt-1 text-blue-600">{total_divergencias}</p>
                  <p className="text-sm text-blue-500">
                    ({total_divergencias > 0
                      ? Math.round((total_resolvidas / total_divergencias) * 100)
                      : 0}% resolvidas)
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Total de divergências encontradas</p>
              </div>
              <AlertTriangle className="text-blue-500 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>

        {/* Última Execução */}
        <Card className="group hover:shadow-lg transition-all duration-300 bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Última Execução</h3>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {data_execucao ? format(new Date(data_execucao), "dd/MM/yyyy") : "-"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tempo_execucao ? `Há ${tempo_execucao}` : ""}
                </p>
              </div>
              <Clock className="text-blue-500 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Divergências */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalhamento das Divergências</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Sessões sem Assinatura', value: sessao_sem_assinatura, icon: FileSignature },
              { label: 'Execuções sem Ficha', value: execucao_sem_sessao, icon: FileWarning },
              { label: 'Fichas sem Execução', value: sessao_sem_execucao, icon: FileX },
              { label: 'Datas Divergentes', value: data_divergente, icon: Calendar },
              { label: 'Guias Vencidas', value: guia_vencida, icon: AlertCircle },
              { label: 'Duplicidades', value: duplicidade, icon: Copy }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <item.icon className="text-blue-500 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.label}</p>
                  <p className="text-lg font-semibold text-blue-600">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { EstatisticasCards };