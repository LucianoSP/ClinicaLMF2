import { api } from "@/lib/api";
import { Plano } from "@/types/plano";

export async function listarPlanos(search?: string): Promise<Plano[]> {
  const response = await api.get("/planos", {
    params: {
      search
    }
  });
  return response.data;
}

export async function criarPlano(plano: Omit<Plano, "id">): Promise<Plano> {
  const response = await api.post("/planos", plano);
  return response.data;
}

export async function atualizarPlano(
  id: string,
  plano: Omit<Plano, "id">
): Promise<Plano> {
  const response = await api.put(`/planos/${id}`, plano);
  return response.data;
}

export async function deletarPlano(id: string): Promise<void> {
  await api.delete(`/planos/${id}`);
}
