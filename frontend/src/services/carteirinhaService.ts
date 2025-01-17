import { api } from "@/lib/api";
import { Carteirinha } from "@/types/carteirinha";

export async function listarCarteirinhas(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<{ data: Carteirinha[]; total: number; pages: number }> {
  const offset = (page - 1) * limit;
  const response = await api.get("/carteirinhas", {
    params: { limit, offset, search },
  });
  return response.data;
}

export async function criarCarteirinha(carteirinha: Carteirinha): Promise<Carteirinha> {
  const response = await api.post("/carteirinhas", carteirinha);
  return response.data;
}

export async function atualizarCarteirinha(
  id: string,
  carteirinha: Carteirinha
): Promise<Carteirinha> {
  const response = await api.put(`/carteirinhas/${id}`, carteirinha);
  return response.data;
}

export async function excluirCarteirinha(id: string): Promise<void> {
  await api.delete(`/carteirinhas/${id}`);
}