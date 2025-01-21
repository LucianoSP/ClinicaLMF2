import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { guia_id, status, data_execucao } = await request.json();

    if (!guia_id || !status) {
      return NextResponse.json(
        { error: "ID da guia e status são obrigatórios" },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (data_execucao) {
      updateData.data_execucao = data_execucao;
    }

    const { data, error } = await supabase
      .from("guias_unimed")
      .update(updateData)
      .eq("id", guia_id)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data?.[0] || null);
  } catch (error) {
    console.error("Erro ao atualizar status da guia:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status da guia" },
      { status: 500 }
    );
  }
}
