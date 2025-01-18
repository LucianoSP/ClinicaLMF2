// app/cadastros/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/page-title';
import { Activity, Users, CreditCard, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Mudando para named imports
import { CarteirinhasList } from '@/components/CarteirinhasList';
import { PacientesList } from '@/components/pacientes/PacientesList';
import { PlanosList } from '@/components/planos/PlanosList';

interface NavigationCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ReactNode;
}

export default function CadastrosPage() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const navigationCards: NavigationCard[] = [
    {
      id: 'planos',
      title: 'Planos de Saúde',
      description: 'Gerencie os planos de saúde cadastrados',
      icon: Activity,
      component: <PlanosList />,
    },
    {
      id: 'pacientes',
      title: 'Pacientes',
      description: 'Cadastro e gestão de pacientes',
      icon: Users,
      component: <PacientesList />,
    },
    {
      id: 'carteirinhas',
      title: 'Carteirinhas',
      description: 'Controle de carteirinhas emitidas',
      icon: CreditCard,
      component: <CarteirinhasList />,
    },
    {
      id: 'guias',
      title: 'Guias',
      description: 'Gerenciamento de guias médicas',
      icon: FileText,
      component: <div>Conteúdo das Guias</div>,
    },
  ];

  const handleCardClick = (id: string) => {
    setSelectedSection(id);
  };

  const handleBack = () => {
    setSelectedSection(null);
  };

  if (selectedSection) {
    const currentSection = navigationCards.find(card => card.id === selectedSection);
    
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="flex items-center space-x-2"
              onClick={handleBack}
            >
              ← Voltar
            </Button>
            <PageTitle>{currentSection?.title}</PageTitle>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {currentSection?.component}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                onClick={() => handleCardClick(card.id)}
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