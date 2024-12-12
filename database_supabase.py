from typing import Dict, List, Optional
from datetime import datetime
from config import supabase


def salvar_dados_excel(registros: List[Dict]) -> bool:
    """Salva os dados do Excel no Supabase"""
    try:
        # Prepara os dados no formato correto
        dados_formatados = []
        for registro in registros:
            dados_formatados.append(
                {
                    "guia_id": str(registro["idGuia"]),
                    "paciente_nome": str(registro["nomePaciente"]),
                    "data_execucao": registro[
                        "dataExec"
                    ],  # Já formatada como DD/MM/YYYY
                    "paciente_carteirinha": str(registro["carteirinha"]),
                    "paciente_id": str(registro["idPaciente"]),
                }
            )

        # Insere os dados no Supabase
        response = supabase.table("protocolos_excel").insert(dados_formatados).execute()
        print(f"Dados inseridos com sucesso! {len(dados_formatados)} registros.")
        return True

    except Exception as e:
        print(f"Erro ao salvar dados do Excel no Supabase: {e}")
        return False


def listar_dados_excel(
    limit: int = 100, offset: int = 0, paciente_nome: Optional[str] = None
) -> Dict:
    """Retorna os dados importados do Excel com suporte a paginação e filtro"""
    try:
        # Inicia a query
        query = supabase.table("protocolos_excel").select("*")

        # Adiciona filtro se paciente_nome for fornecido
        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome}%")

        # Conta total de registros
        count_query = query.count()
        total = count_query.execute().count

        # Adiciona ordenação e paginação
        query = query.order("created_at", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        # Executa a query
        response = query.execute()
        registros = response.data

        # Formata os dados para manter compatibilidade com o código existente
        registros_formatados = []
        for reg in registros:
            registros_formatados.append(
                {
                    "id": reg["id"],
                    "idGuia": reg["guia_id"],
                    "nomePaciente": reg["paciente_nome"],
                    "dataExec": reg["data_execucao"],
                    "carteirinha": reg["paciente_carteirinha"],
                    "idPaciente": reg["paciente_id"],
                    "created_at": reg["created_at"],
                }
            )

        return {
            "registros": registros_formatados,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
        }

    except Exception as e:
        print(f"Erro ao listar dados do Excel no Supabase: {e}")
        return {"registros": [], "total": 0, "total_pages": 1}


def limpar_protocolos_excel() -> bool:
    """Limpa a tabela de protocolos do Excel"""
    try:
        supabase.table("protocolos_excel").delete().neq("id", 0).execute()
        return True
    except Exception as e:
        print(f"Erro ao limpar protocolos do Excel no Supabase: {e}")
        return False


def contar_protocolos() -> int:
    """Retorna o número total de protocolos na tabela protocolos_excel"""
    try:
        response = (
            supabase.table("protocolos_excel").select("*", count="exact").execute()
        )
        return response.count
    except Exception as e:
        print(f"Erro ao contar protocolos no Supabase: {e}")
        return 0
