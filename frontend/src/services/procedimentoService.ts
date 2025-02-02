import { supabase } from "@/lib/supabase";
import { Procedimento } from "@/types/procedimento";

export async function listarProcedimentos(): Promise<Procedimento[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/procedimentos`,
    {
      headers: {
        "user-id": userId,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao listar procedimentos");
  }

  return response.json();
}

export async function criarProcedimento(
  data: Omit<Procedimento, "id" | "created_at" | "updated_at">
) {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/procedimentos`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "user-id": userId,
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao criar procedimento");
  }

  return response.json();
}

export async function atualizarProcedimento(
  id: string,
  data: Partial<Procedimento>
) {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/procedimentos/${id}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "user-id": userId,
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao atualizar procedimento");
  }

  return response.json();
}
