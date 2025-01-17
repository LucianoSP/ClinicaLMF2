import { api } from "@/lib/api";

export interface Carteirinha {
  id: string;
  numero: string;
  dataValidade: string;
  titular: boolean;
  nomeTitular: string;
  planoId: string;
  pacienteId: string;
  paciente?: {
    id: string;
    nome: string;
    cpf: string;
    email: string | null;
    telefone: string;
    data_nascimento: string;
    nome_responsavel: string;
  };
  plano_saude?: {
    id: string;
    nome: string;
    ativo: boolean;
    codigo: string;
  };
}

interface CarteirinhaResponse {
  items: Carteirinha[];
  total: number;
  pages: number;
}

// Função auxiliar para converter do formato do frontend para o backend
function toBackendFormat(carteirinha: Partial<Carteirinha>) {
  // Garantir que a data está no formato YYYY-MM-DD sem timezone
  const dataValidade = carteirinha.dataValidade 
    ? carteirinha.dataValidade.split('T')[0]
    : null;

  return {
    numero: carteirinha.numero,
    dataValidade: dataValidade,
    titular: carteirinha.titular,
    nomeTitular: carteirinha.nomeTitular,
    planoId: carteirinha.planoId,
    pacienteId: carteirinha.pacienteId,
  };
}

// Função auxiliar para converter do formato do backend para o frontend
function toFrontendFormat(data: any): Carteirinha {
  return {
    id: data.id || "",
    numero: data.numero || "",
    dataValidade: data.dataValidade || "",
    titular: data.titular || false,
    nomeTitular: data.nomeTitular || "",
    planoId: data.planoId || "",
    pacienteId: data.pacienteId || "",
    paciente: data.paciente,
    plano_saude: data.plano_saude
  };
}

export async function listarCarteirinhas(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<CarteirinhaResponse> {
  const offset = (page - 1) * limit;
  const response = await api.get("/carteirinhas", {
    params: { limit, offset, search },
  });
  
  // Os dados já vêm no formato correto do backend
  return {
    items: response.data.items || [],
    total: response.data.total || 0,
    pages: response.data.pages || 1,
  };
}

export async function criarCarteirinha(carteirinha: Partial<Carteirinha>): Promise<Carteirinha> {
  const response = await api.post("/carteirinhas", toBackendFormat(carteirinha));
  return toFrontendFormat(response.data);
}

export async function atualizarCarteirinha(
  id: string,
  carteirinha: Partial<Carteirinha>
): Promise<Carteirinha> {
  const response = await api.put(`/carteirinhas/${id}`, toBackendFormat(carteirinha));
  return toFrontendFormat(response.data);
}

export async function excluirCarteirinha(id: string): Promise<void> {
  await api.delete(`/carteirinhas/${id}`);
}