'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  FileText,
  Users,
  Clock,
  Filter,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface AuditStats {
  totalexecucaos: number;
  divergenciasAbertas: number;
  guiasVencendo: number;
  protocolosPendentes: number;
}

interface Divergencia {
  id: number;
  guiaId: string;
  descricao: string;
  status: 'aberta' | 'em_analise' | 'resolvida';
  dataCriacao: string;
  dataAtualizacao: string;
}

export default function AuditoriaV2Page() {
  const [stats, setStats] = useState<AuditStats>({
    totalexecucaos: 0,
    divergenciasAbertas: 0,
    guiasVencendo: 0,
    protocolosPendentes: 0
  });

  const [divergencias, setDivergencias] = useState<Divergencia[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement API calls
    // Simulated data for now
    setStats({
      totalexecucaos: 1250,
      divergenciasAbertas: 23,
      guiasVencendo: 15,
      protocolosPendentes: 8
    });

    setDivergencias([
      {
        id: 1,
        guiaId: "G123456",
        descricao: "Assinatura ausente no execucao",
        status: "aberta",
        dataCriacao: "2024-01-15",
        dataAtualizacao: "2024-01-15"
      },
      // Add more mock data as needed
    ]);

    setLoading(false);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Auditoria</h1>
        <Button className="bg-primary">
          Nova Auditoria
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total execucaos
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalexecucaos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Divergências Abertas
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.divergenciasAbertas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Guias Vencendo
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.guiasVencendo}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Protocolos Pendentes
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats.protocolosPendentes}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="divergencias">Divergências</TabsTrigger>
          <TabsTrigger value="protocolos">Protocolos</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Últimas Divergências</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {divergencias.map((div) => (
                      <div key={div.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">Guia: {div.guiaId}</p>
                          <p className="text-sm text-muted-foreground">{div.descricao}</p>
                        </div>
                        <Badge
                          variant={div.status === 'aberta' ? 'destructive' :
                            div.status === 'em_analise' ? 'warning' : 'success'}
                        >
                          {div.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Resolução</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add charts/graphs here */}
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Gráfico de Estatísticas
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="divergencias">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gerenciamento de Divergências</CardTitle>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Buscar divergências..."
                      className="w-[200px]"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="aberta">Abertas</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="resolvida">Resolvidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guia</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divergencias.map((div) => (
                    <TableRow key={div.id}>
                      <TableCell>{div.guiaId}</TableCell>
                      <TableCell>{div.descricao}</TableCell>
                      <TableCell>
                        <Badge
                          variant={div.status === 'aberta' ? 'destructive' :
                            div.status === 'em_analise' ? 'warning' : 'success'}
                        >
                          {div.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{div.dataCriacao}</TableCell>
                      <TableCell>{div.dataAtualizacao}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocolos">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Protocolos</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add protocol management interface */}
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Interface de Gestão de Protocolos
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios e Análises</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add reports interface */}
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Interface de Relatórios
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
