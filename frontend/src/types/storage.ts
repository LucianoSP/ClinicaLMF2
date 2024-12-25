// types/storage.ts
export interface StorageFile {
  nome: string;
  url: string;
  created_at: string;
  size: number;
  mime_type?: string;
}

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
}

export interface StorageFileListRef {
  fetchFiles: () => Promise<void>;
}
