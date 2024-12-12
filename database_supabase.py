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
                    "guia_id": str(registro["guia_id"]),
                    "paciente_nome": str(registro["paciente_nome"]),
                    "data_execucao": registro[
                        "data_execucao"
                    ],  # Já formatada como DD/MM/YYYY
                    "paciente_carteirinha": str(registro["paciente_carteirinha"]),
                    "paciente_id": str(registro["paciente_id"]),
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

        # Busca todos os registros para contar
        count_response = query.execute()
        total = len(count_response.data)

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
                    "guia_id": reg["guia_id"],
                    "paciente_nome": reg["paciente_nome"],
                    "data_execucao": reg["data_execucao"],
                    "paciente_carteirinha": reg["paciente_carteirinha"],
                    "paciente_id": reg["paciente_id"],
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
        response = supabase.table("protocolos_excel").select("*").execute()
        return len(response.data)
    except Exception as e:
        print(f"Erro ao contar protocolos no Supabase: {e}")
        return 0


def salvar_guia(info: Dict) -> bool:
    """
    Salva as informações do atendimento no Supabase
    """
    try:
        # Formata os dados no padrão esperado
        dados = {
            "guia_id": str(info["guia_id"]),
            "paciente_nome": str(info["paciente_nome"]),
            "data_execucao": info["data_execucao"],
            "paciente_carteirinha": str(info["paciente_carteirinha"]),
            "codigo_ficha": str(info["codigo_ficha"]),
            "possui_assinatura": bool(info["possui_assinatura"]),
        }

        # Insere no Supabase
        print(f"Tentando salvar atendimento: {dados}")
        response = supabase.table("atendimentos").insert(dados).execute()
        return True

    except Exception as e:
        print(f"Erro ao salvar guia: {e}")
        print(f"Dados: {info}")
        return False


def listar_guias(
    limit: int = 100, offset: int = 0, paciente_nome: Optional[str] = None
) -> Dict:
    """Retorna todos os atendimentos como uma lista única com suporte a paginação e filtro"""
    try:
        # Inicia a query
        query = supabase.table("atendimentos").select("*")

        # Adiciona filtro por nome se fornecido
        if paciente_nome and isinstance(paciente_nome, str):
            paciente_nome = paciente_nome.strip()
            if len(paciente_nome) >= 2:
                # Divide o termo de busca em palavras
                palavras = paciente_nome.upper().split()

                # Cria condição para cada palavra
                for palavra in palavras:
                    query = query.ilike("paciente_nome", f"%{palavra}%")

        # Busca todos os registros para contar
        count_response = query.execute()
        total = len(count_response.data)

        # Adiciona ordenação e paginação
        query = query.order("data_execucao", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        # Executa a query
        response = query.execute()
        rows = response.data

        # Processa resultados
        atendimentos = []
        for row in rows:
            atendimento = {
                "id": row["id"],
                "data_execucao": row["data_execucao"],
                "paciente_carteirinha": row["paciente_carteirinha"],
                "paciente_nome": row["paciente_nome"],
                "guia_id": row["guia_id"],
                "codigo_ficha": row["codigo_ficha"],
                "possui_assinatura": bool(row["possui_assinatura"]),
            }
            atendimentos.append(atendimento)

        return {"atendimentos": atendimentos, "total": total}

    except Exception as e:
        print(f"Erro ao listar guias: {e}")
        return {"atendimentos": [], "total": 0}


def buscar_guia(guia_id: str) -> List[Dict]:
    """Busca atendimentos específicos pelo número da guia"""
    try:
        response = (
            supabase.table("atendimentos").select("*").eq("guia_id", guia_id).execute()
        )

        atendimentos = []
        for row in response.data:
            atendimentos.append(
                {
                    "id": row["id"],
                    "data_execucao": row["data_execucao"],
                    "paciente_carteirinha": row["paciente_carteirinha"],
                    "paciente_nome": row["paciente_nome"],
                    "guia_id": row["guia_id"],
                    "codigo_ficha": row["codigo_ficha"],
                    "possui_assinatura": bool(row["possui_assinatura"]),
                }
            )

        return atendimentos

    except Exception as e:
        print(f"Erro ao buscar guia: {e}")
        return []


def limpar_banco() -> None:
    """Limpa a tabela de atendimentos"""
    try:
        supabase.table("atendimentos").delete().neq("id", 0).execute()
    except Exception as e:
        print(f"Erro ao limpar banco: {e}")


def registrar_divergencia(
    guia_id: str,
    data_execucao: str,
    codigo_ficha: str,
    descricao: str,
    beneficiario: str = None,
) -> Optional[int]:
    """Registra uma nova divergência encontrada na auditoria"""
    try:
        dados = {
            "guia_id": guia_id,
            "data_execucao": data_execucao,
            "codigo_ficha": codigo_ficha,
            "descricao_divergencia": descricao,
            "beneficiario": beneficiario,
            "status": "Pendente",
        }

        response = supabase.table("divergencias").insert(dados).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]["id"]
        return None

    except Exception as e:
        print(f"Erro ao registrar divergência: {e}")
        return None


def listar_divergencias(
    limit: int = 100, offset: int = 0, status: Optional[str] = None
) -> Optional[Dict]:
    """Lista as divergências encontradas com suporte a paginação e filtro por status"""
    try:
        # Inicia a query
        query = supabase.table("divergencias").select("*")

        # Adiciona filtro por status
        if status:
            query = query.eq("status", status)

        # Busca todos os registros para contar
        count_response = query.execute()
        total_registros = len(count_response.data)

        # Adiciona ordenação e paginação
        query = query.order("created_at", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        # Executa a query
        response = query.execute()
        divergencias = response.data

        # Formata os resultados
        resultados = []
        for div in divergencias:
            resultados.append(
                {
                    "id": div["id"],
                    "guia_id": div["guia_id"],
                    "data_execucao": div["data_execucao"],
                    "codigo_ficha": div["codigo_ficha"],
                    "descricao_divergencia": div["descricao_divergencia"],
                    "status": div["status"],
                    "data_registro": div["created_at"],
                }
            )

        return {
            "divergencias": resultados,
            "total": total_registros,
            "paginas": (total_registros + limit - 1) // limit if limit > 0 else 1,
        }

    except Exception as e:
        print(f"Erro ao listar divergências: {e}")
        return None


def atualizar_status_divergencia(id: int, novo_status: str) -> bool:
    """Atualiza o status de uma divergência"""
    try:
        supabase.table("divergencias").update({"status": novo_status}).eq(
            "id", id
        ).execute()
        return True
    except Exception as e:
        print(f"Erro ao atualizar status da divergência: {e}")
        return False
