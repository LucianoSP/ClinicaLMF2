'use client';

import ExecucoesList from '@/components/ExecucoesList';
import ExcelUpload from '@/components/ExcelUpload';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ExecucoesPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-white text-card-foreground shadow-sm">
        <div className="p-6 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-[#8B4513]">Dados Importados do Excel</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('upload')}
              >
                Upload Excel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('list')}
              >
                Execuções
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            {activeTab === 'list' ? (
              <ExecucoesList />
            ) : (
              <ExcelUpload />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
