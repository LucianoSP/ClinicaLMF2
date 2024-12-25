// types/storage.ts
export interface StorageFile {
  nome: string;
  url: string;
  created_at: string;
  size: number;
  mime_type?: string;
}

export interface StorageFileListRef {
  fetchFiles: () => Promise<void>;
}
