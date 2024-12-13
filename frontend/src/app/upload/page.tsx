'use client';

import FileUpload from '@/components/FileUpload';
import ExcelUpload from '@/components/ExcelUpload';
import StorageFileList from '@/components/StorageFileList';
import { useState, useRef } from 'react';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState('pdf');
  const storageListRef = useRef<{ fetchFiles: () => Promise<void> }>();

  const handleUploadSuccess = () => {
    // Atualiza a lista de arquivos quando um upload é bem sucedido
    storageListRef.current?.fetchFiles();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'pdf'
              ? 'bg-[#C5A880] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upload de PDF
        </button>
        <button
          onClick={() => setActiveTab('excel')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'excel'
              ? 'bg-[#C5A880] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upload de Excel
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'pdf' ? (
          <>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
            <StorageFileList ref={storageListRef} />
          </>
        ) : (
          <ExcelUpload />
        )}
      </div>
    </div>
  );
}
