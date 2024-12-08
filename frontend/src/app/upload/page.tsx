'use client';

import { FileUpload } from '@/components/FileUpload';
import { ExcelUpload } from '@/components/ExcelUpload';
import { useState } from 'react';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<'pdf' | 'excel'>('pdf');

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-[#6b342f]">Upload de Arquivos</h1>
      
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
            activeTab === 'pdf'
              ? 'bg-[#b49d6b] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } rounded hover:bg-[#a08b5f] transition-colors`}
        >
          Upload de PDF
        </button>
        <button
          onClick={() => setActiveTab('excel')}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
            activeTab === 'excel'
              ? 'bg-[#b49d6b] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } rounded hover:bg-[#a08b5f] transition-colors`}
        >
          Upload de Excel
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-2xl mx-auto">
          {activeTab === 'pdf' ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Selecione um arquivo PDF para processar
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  O arquivo será processado automaticamente após o upload
                </p>
              </div>
              <FileUpload />
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Selecione uma planilha Excel para importar
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Apenas arquivos .xls e .xlsx são aceitos
                </p>
              </div>
              <ExcelUpload />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
