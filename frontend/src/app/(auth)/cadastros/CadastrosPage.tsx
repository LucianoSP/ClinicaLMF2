import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import PlanoSaudeList from './plano-saude/PlanoSaudeList';
import PacienteList from './paciente/PacienteList';
import CarteirinhaList from './carteirinha/CarteirinhaList';

interface TabOption {
  value: string;
  label: string;
  component: React.ReactNode;
}

export default function CadastrosPage() {
  const [activeTab, setActiveTab] = useState('planos');

  const tabOptions: TabOption[] = [
    {
      value: 'planos',
      label: 'Planos de Saúde',
      component: <PlanoSaudeList />,
    },
    {
      value: 'pacientes',
      label: 'Pacientes',
      component: <PacienteList />,
    },
    {
      value: 'carteirinhas',
      label: 'Carteirinhas',
      component: <CarteirinhaList />,
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <Card className="p-6">
        <Tabs
          defaultValue="planos"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            {tabOptions.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabOptions.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}