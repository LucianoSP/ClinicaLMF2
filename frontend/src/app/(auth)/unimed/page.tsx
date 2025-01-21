'use client';

import { useState } from 'react';
import SortableTable, { Column } from '@/components/SortableTable';
import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface GuiaUnimed {
  numero_guia: string;
  carteira: string;
  nome_paciente: string;
  data_execucao: string;
  nome_profissional: string;
  status: string;
}

export default function UnimedPage() {
  const [guias] = useState<GuiaUnimed[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const columns: Column[] = [
    {
      key: 'numero_guia',
      header: 'Número da Guia',
    },
    {
      key: 'carteira',
      header: 'Carteira',
    },
    {
      key: 'nome_paciente',
      header: 'Paciente',
    },
    {
      key: 'data_execucao',
      header: 'Data Execução',
    },
    {
      key: 'nome_profissional',
      header: 'Profissional',
    },
    {
      key: 'status',
      header: 'Status',
    },
  ];

  const filteredGuias = guias.filter((guia) => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      guia.numero_guia.toLowerCase().includes(searchTermLower) ||
      guia.carteira.toLowerCase().includes(searchTermLower) ||
      guia.nome_paciente.toLowerCase().includes(searchTermLower) ||
      guia.nome_profissional.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Guias Unimed</h1>
      </div>

      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar guias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <SortableTable
          data={filteredGuias}
          columns={columns}
          loading={false}
        />
      </div>
    </div>
  );
}
