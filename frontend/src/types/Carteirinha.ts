export interface Carteirinha {
  id?: string;
  numeroCarteirinha: string;
  dataValidade: string;
  titular: boolean;
  nomeTitular: string;
  planoSaudeId: string;
  pacienteId: string;
  created_at?: string;
  updated_at?: string;
}