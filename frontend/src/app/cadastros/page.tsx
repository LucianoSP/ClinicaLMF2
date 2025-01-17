'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { PlanosList } from "@/components/planos/PlanosList";
import { PacientesList } from "@/components/pacientes/PacientesList";
import CarteirinhasList from "./carteirinhas/CarteirinhasList";

export default function CadastrosPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <PageTitle>Cadastros</PageTitle>
        
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="planos" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="planos">Planos de Saúde</TabsTrigger>
                <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
                <TabsTrigger value="carteirinhas">Carteirinhas</TabsTrigger>
                <TabsTrigger value="guias">Guias</TabsTrigger>
              </TabsList>

              <TabsContent value="planos" className="mt-4">
                <PlanosList />
              </TabsContent>

              <TabsContent value="pacientes" className="mt-4">
                <PacientesList />
              </TabsContent>

              <TabsContent value="carteirinhas" className="mt-4">
                <CarteirinhasList />
              </TabsContent>
              
              <TabsContent value="guias" className="mt-4">
                <h3 className="text-lg font-semibold mb-4">Guias</h3>
                {/* Conteúdo da aba de Guias */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
