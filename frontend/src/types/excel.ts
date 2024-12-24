export interface ExcelData {
  id: string;
  numero_guia: string;
  paciente_nome: string;
  data_execucao: string;
  paciente_carteirinha: string;
  paciente_id: string;
  codigo_ficha: string | null;
  usuario_executante: string | null;
  created_at: string;
  updated_at: string | null;
}

export type ExcelColumn = {
  key: keyof ExcelData;
  label: string;
};
