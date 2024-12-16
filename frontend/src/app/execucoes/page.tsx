'use client';

import ExecucoesList from '@/components/ExecucoesList';
import ExcelUpload from '@/components/ExcelUpload';
import { useState } from 'react';

export default function ExecucoesPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'list'
              ? 'bg-[#C5A880] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Execuções
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'upload'
              ? 'bg-[#C5A880] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upload de Excel
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'list' ? (
          <ExecucoesList />
        ) : (
          <ExcelUpload />
        )}
      </div>
    </div>
  );
}
