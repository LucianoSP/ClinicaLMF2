'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { Activity, Users, CreditCard, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CarteirinhasList } from '@/components/carteirinhas/CarteirinhasList';
import { PacientesList } from '@/components/pacientes/PacientesList';
import { PlanosList } from '@/components/planos/PlanosList';

interface NavigationCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function CadastrosPage() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const navigationCards: NavigationCard[] = [
    {
      id: 'planos',
      title: 'Planos de Saúde',
      description: 'Gerencie os planos de saúde cadastrados',
      icon: Activity,
    },
    {
      id: 'pacientes',
      title: 'Pacientes',
      description: 'Cadastro e gestão de pacientes',
      icon: Users,
    },
    {
      id: 'carteirinhas',
      title: 'Carteirinhas',
      description: 'Controle de carteirinhas emitidas',
      icon: CreditCard,
    },
    {
      id: 'guias',
      title: 'Guias',
      description: 'Gerenciamento de guias médicas',
      icon: FileText,
    },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case 'planos':
        return <PlanosList />;
      case 'pacientes':
        return <PacientesList />;
      case 'carteirinhas':
        return <CarteirinhasList />;
      case 'guias':
        return <div>Conteúdo das Guias</div>;
      default:
        return null;
    }
  };

  // Se nenhuma seção estiver selecionada, mostra os cards
  if (!selectedSection) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <PageTitle>Cadastros</PageTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {navigationCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    "transform hover:-translate-y-1",
                    "border-2 hover:border-primary"
                  )}
                  onClick={() => setSelectedSection(card.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">
                          {card.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Quando uma seção está selecionada, mostra o conteúdo com botão de voltar
  const currentCard = navigationCards.find(card => card.id === selectedSection);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            className="flex items-center space-x-2"
            onClick={() => setSelectedSection(null)}
          >
            ← Voltar
          </Button>
          <PageTitle>{currentCard?.title}</PageTitle>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}