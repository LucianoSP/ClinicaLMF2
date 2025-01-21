/**
 * Represents a Unimed medical guide record
 */
export interface GuiaUnimed {
  /** Unique identifier for the guide */
  id: string;
  
  /** Guide number from Unimed */
  numero_guia: string;
  
  /** Date when the guide was imported into the system */
  data_importacao: string;
  
  /** Patient's full name */
  paciente_nome: string;
  
  /** Patient's Unimed card number */
  paciente_carteirinha: string;
  
  /** Current status of the guide (processado, erro, pendente) */
  status: string;
  
  /** Date when the medical procedure was executed */
  data_execucao: string;
}