import { api } from "@/lib/api";

export interface Carteirinha {
  id: string;
  paciente_id: string;
  plano_saude_id: string;
  numero_carteirinha: string;
  data_emissao: string | null;
  data_validade: string | null;
  titular: boolean;
  nome_titular: string | null;
  status: 'ativa' | 'vencida' | 'cancelada' | 'suspensa' | 'em_analise';
  motivo_inativacao: string | null;
  created_at: string;
  updated_at: string;
  // Campos auxiliares para o frontend
  numero?: string;
  dataValidade?: string;
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

// Função auxiliar para converter do formato do frontend para o backend
export function toBackendFormat(carteirinha: Partial<Carteirinha>) {
  console.log("Dados recebidos para conversão:", carteirinha);
  const backendData = {
    numero_carteirinha: carteirinha.numero_carteirinha || carteirinha.numero,
    data_validade: carteirinha.data_validade || carteirinha.dataValidade
      ? new Date(carteirinha.data_validade || carteirinha.dataValidade).toISOString().split('T')[0]
      : null,
    titular: carteirinha.titular ?? true,
    nome_titular: carteirinha.nome_titular || "",
    paciente_id: carteirinha.paciente_id,
    plano_saude_id: carteirinha.plano_saude_id,
    status: carteirinha.status || 'ativa',
    motivo_inativacao: carteirinha.motivo_inativacao || null
  };
  
  // Remove campos undefined ou null
  Object.keys(backendData).forEach(key => {
    if (backendData[key] === undefined || backendData[key] === null) {
      delete backendData[key];
    }
  });
  
  console.log("Dados convertidos para o backend:", backendData);
  return backendData;
}

// Função auxiliar para converter do formato do backend para o frontend
export function toFrontendFormat(data: any): Carteirinha {
  console.log("Dados brutos do backend:", data);
  const formatted = {
    id: data.id || "",
    paciente_id: data.paciente_id || "",
    plano_saude_id: data.plano_saude_id || "",
    numero_carteirinha: data.numero_carteirinha || "",
    numero: data.numero_carteirinha || "", // Campo auxiliar para compatibilidade
    data_emissao: data.data_emissao,
    data_validade: data.data_validade,
    dataValidade: data.data_validade, // Campo auxiliar para o frontend
    titular: data.titular ?? false,
    nome_titular: data.nome_titular || "",
    status: data.status || 'ativa',
    motivo_inativacao: data.motivo_inativacao,
    created_at: data.created_at || "",
    updated_at: data.updated_at || "",
    paciente: data.paciente,
    plano_saude: data.plano_saude
  };
  console.log("Dados formatados para o frontend:", formatted);
  return formatted;
}

export async function listarCarteirinhas(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<CarteirinhaResponse> {
  const offset = (page - 1) * limit;
  const response = await api.get("/carteirinhas/", {
    params: { limit, offset, search },
  });

  return {
    items: response.data.items || [],
    total: response.data.total || 0,
    pages: response.data.pages || 1,
  };
}

export async function criarCarteirinha(
  carteirinha: Partial<Carteirinha>
): Promise<Carteirinha> {
  const response = await api.post(
    "/carteirinhas/",
    toBackendFormat(carteirinha)
  );
  return toFrontendFormat(response.data);
}

export async function atualizarCarteirinha(
  id: string,
  carteirinha: Partial<Carteirinha>
): Promise<Carteirinha> {
  const response = await api.put(
    `/carteirinhas/${id}/`,
    toBackendFormat(carteirinha)
  );
  return toFrontendFormat(response.data);
}

export async function excluirCarteirinha(id: string): Promise<void> {
  await api.delete(`/carteirinhas/${id}/`);
}

interface CarteirinhaResponse {
  items: Carteirinha[];
  total: number;
  pages: number;
}
