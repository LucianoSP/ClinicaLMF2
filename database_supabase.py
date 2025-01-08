from typing import Dict, List, Optional
from datetime import datetime, timezone
from config import supabase
from math import ceil
import os
import traceback
import logging
import uuid


def gerar_uuid_consistente(valor: str) -> str:
    """Gera um UUID v5 consistente usando um namespace fixo e o valor como nome."""
    # Usa o namespace DNS como base
    namespace = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
    # Gera um UUID v5 usando o namespace e o valor
    return str(uuid.uuid5(namespace, valor))


def extrair_codigo_plano(numero_carteirinha: str) -> str:
    """Extrai o código do plano de saúde do número da carteirinha."""
    return numero_carteirinha.split(".")[0]


def salvar_dados_excel(registros: List[Dict]) -> bool:
    """Salva os dados do Excel na tabela execucoes."""
    try:
        # Primeiro, vamos buscar os planos de saúde que precisamos
        codigos_planos = set(
            extrair_codigo_plano(str(registro["paciente_carteirinha"]))
            for registro in registros
        )

        # Busca os planos no Supabase
        planos_response = (
            supabase.table("planos_saude")
            .select("id, codigo")
            .in_("codigo", list(codigos_planos))
            .execute()
        )
        planos = {p["codigo"]: p["id"] for p in planos_response.data}

        # Se algum plano não existir, cria
        planos_para_criar = []
        for codigo in codigos_planos:
            if codigo not in planos:
                # Gera um UUID consistente para o plano
                plano_id = gerar_uuid_consistente(f"plano_{codigo}")
                planos[codigo] = plano_id  # Já adiciona ao dicionário
                planos_para_criar.append(
                    {
                        "id": plano_id,
                        "codigo": codigo,
                        "nome": f"Plano {codigo}",  # Nome temporário
                    }
                )

        if planos_para_criar:
            response = (
                supabase.table("planos_saude")
                .upsert(planos_para_criar, on_conflict="codigo")
                .execute()
            )
            print("Resposta ao criar planos:", response.data)

        # Primeiro, vamos criar os pacientes que não existem
        pacientes_para_criar = []
        pacientes_processados = set()

        # Mapeamento de ID do Excel para UUID
        id_para_uuid = {}

        for registro in registros:
            id_excel = str(registro["paciente_id"])
            if id_excel not in pacientes_processados:
                pacientes_processados.add(id_excel)
                # Gera um UUID consistente baseado no ID do Excel
                id_uuid = gerar_uuid_consistente(id_excel)
                id_para_uuid[id_excel] = id_uuid

                pacientes_para_criar.append(
                    {
                        "id": id_uuid,
                        "nome": str(registro["paciente_nome"]).upper(),
                        "carteirinha": str(registro["paciente_carteirinha"]),
                    }
                )

        # Insere os pacientes no Supabase usando upsert
        if pacientes_para_criar:
            response = (
                supabase.table("pacientes")
                .upsert(pacientes_para_criar, on_conflict="id")
                .execute()
            )
            print("Resposta ao criar pacientes:", response.data)

        # Agora vamos criar as carteirinhas que não existem
        carteirinhas_para_criar = []
        carteirinhas_processadas = set()

        for registro in registros:
            numero_carteirinha = str(registro["paciente_carteirinha"])
            id_excel = str(registro["paciente_id"])
            codigo_plano = extrair_codigo_plano(numero_carteirinha)

            if numero_carteirinha not in carteirinhas_processadas:
                carteirinhas_processadas.add(numero_carteirinha)
                carteirinhas_para_criar.append(
                    {
                        "numero_carteirinha": numero_carteirinha,
                        "paciente_id": id_para_uuid[id_excel],  # UUID gerado
                        "nome_titular": str(registro["paciente_nome"]).upper(),
                        "data_validade": None,  # Opcional
                        "titular": True,  # Por padrão é o titular
                        "plano_saude_id": planos[
                            codigo_plano
                        ],  # ID do plano encontrado
                    }
                )

        # Insere as carteirinhas no Supabase usando upsert
        if carteirinhas_para_criar:
            response = (
                supabase.table("carteirinhas")
                .upsert(carteirinhas_para_criar, on_conflict="numero_carteirinha")
                .execute()
            )
            print("Resposta ao criar carteirinhas:", response.data)

        # Agora vamos criar as guias
        guias_para_criar = []
        guias_processadas = set()  # Conjunto para controlar guias já processadas
        data_atual = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f%z")

        for registro in registros:
            numero_guia = str(registro["guia_id"])
            id_excel = str(registro["paciente_id"])
            # Só adiciona se ainda não processamos esta guia
            if numero_guia not in guias_processadas:
                guias_processadas.add(numero_guia)
                guias_para_criar.append(
                    {
                        "numero_guia": numero_guia,
                        "paciente_nome": str(registro["paciente_nome"]).upper(),
                        "paciente_carteirinha": str(registro["paciente_carteirinha"]),
                        "paciente_id": id_para_uuid[id_excel],  # UUID gerado
                        "data_emissao": data_atual,
                        "data_validade": None,  # Opcional
                        "status": "pendente",
                        "quantidade_autorizada": 1,
                        "quantidade_executada": 0,
                        "tipo": "sp_sadt",  # Valor correto do enum tipo_guia
                        "procedimento_codigo": None,  # Opcional
                        "procedimento_nome": None,  # Opcional
                        "profissional_solicitante": None,  # Opcional
                        "profissional_executante": None,  # Opcional
                        "observacoes": None,  # Opcional
                    }
                )

        # Insere as guias no Supabase usando upsert para evitar duplicatas
        if guias_para_criar:
            response = (
                supabase.table("guias")
                .upsert(guias_para_criar, on_conflict="numero_guia")
                .execute()
            )
            print("Resposta ao criar guias:", response.data)

        # Agora prepara os dados das execuções
        dados_formatados = []
        for registro in registros:
            id_excel = str(registro["paciente_id"])
            dados_formatados.append(
                {
                    "numero_guia": str(registro["guia_id"]),
                    "paciente_nome": str(registro["paciente_nome"]).upper(),
                    "data_execucao": registro["data_execucao"],
                    "paciente_carteirinha": str(registro["paciente_carteirinha"]),
                    "paciente_id": id_para_uuid[id_excel],  # UUID gerado
                    "codigo_ficha": None,
                }
            )

        # Insere as execuções no Supabase
        response = supabase.table("execucoes").insert(dados_formatados).execute()

        print(f"Dados inseridos com sucesso! {len(dados_formatados)} registros.")
        return True

    except Exception as e:
        print(f"Erro ao salvar dados do Excel no Supabase: {e}")
        traceback.print_exc()  # Adiciona mais detalhes do erro
        return False


def listar_dados_excel(
    limit: int = 100, offset: int = 0, paciente_nome: Optional[str] = None
) -> Dict:
    """Retorna os dados da tabela execucoes com suporte a paginação e filtro"""
    try:
        print(
            f"Iniciando listagem de dados com limit={limit}, offset={offset}, paciente_nome={paciente_nome}"
        )

        # Verifica se o Supabase está configurado
        if not supabase:
            print("Erro: Supabase não está configurado")
            return {
                "success": False,
                "data": {"registros": [], "pagination": {"total_pages": 1, "total": 0}},
            }

        # Testa a conexão
        try:
            test_response = supabase.table("execucoes").select("*").limit(1).execute()
            print("Conexão com Supabase OK")
        except Exception as e:
            print(f"Erro ao testar conexão com Supabase: {e}")
            return {
                "success": False,
                "data": {"registros": [], "pagination": {"total_pages": 1, "total": 0}},
            }

        # Inicia a query
        query = supabase.table("execucoes").select("*")

        # Adiciona filtro se paciente_nome for fornecido
        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")

        # Busca todos os registros para contar
        print("Buscando contagem total de registros...")
        count_response = query.execute()
        total = len(count_response.data)
        print(f"Total de registros encontrados: {total}")

        # Adiciona ordenação e paginação
        query = query.order("created_at", desc=True)
        if limit > 0:
            print(f"Aplicando paginação: range({offset}, {offset + limit - 1})")
            query = query.range(offset, offset + limit - 1)

        # Executa a query
        print("Executando query final...")
        response = query.execute()
        registros = response.data
        print(f"Registros retornados: {len(registros)}")

        # Formata os dados para manter compatibilidade com o código existente
        registros_formatados = []
        for reg in registros:
            registros_formatados.append(
                {
                    "id": reg["id"],
                    "guia_id": reg["numero_guia"],
                    "paciente_nome": reg["paciente_nome"],
                    "data_execucao": reg["data_execucao"],
                    "paciente_carteirinha": reg["paciente_carteirinha"],
                    "paciente_id": reg["paciente_id"],
                    "codigo_ficha": reg.get("codigo_ficha"),
                    "usuario_executante": reg.get("usuario_executante"),
                    "created_at": reg["created_at"],
                    "updated_at": reg.get("updated_at"),
                }
            )

        return {
            "success": True,
            "data": {
                "registros": registros_formatados,
                "pagination": {
                    "total_pages": ceil(total / limit) if limit > 0 else 1,
                    "total": total,
                },
            },
        }

    except Exception as e:
        print(f"Erro ao listar dados do Excel: {e}")
        traceback.print_exc()
        return {
            "success": False,
            "data": {"registros": [], "pagination": {"total_pages": 1, "total": 0}},
        }


def limpar_protocolos_excel() -> bool:
    """Limpa a tabela de execucoes."""
    try:
        # Deleta todos os registros usando uma condição que sempre é verdadeira
        # Usamos gt.00000000-0000-0000-0000-000000000000 para pegar todos os UUIDs válidos
        supabase.table("execucoes").delete().gt(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()
        print("Tabela execucoes limpa com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao limpar tabela execucoes: {e}")
        return False


def contar_execucoes() -> int:
    """Retorna o número total de execuções na tabela execucoes"""
    try:
        response = supabase.table("execucoes").select("id", count="exact").execute()
        return response.count
    except Exception as e:
        print(f"Erro ao contar execuções: {e}")
        return 0


def salvar_guia(dados: Dict) -> bool:
    """
    Salva uma nova guia no banco de dados.

    Args:
        dados: Dicionário com os dados da guia

    Returns:
        bool indicando sucesso da operação
    """
    try:
        # Prepara os dados no formato correto
        guia_formatada = {
            "numero_guia": str(dados["numero_guia"]),
            "paciente_nome": str(dados["paciente_nome"]).upper(),
            "paciente_id": str(dados["paciente_id"]),
            "paciente_carteirinha": str(dados["paciente_carteirinha"]),
            "data_inicio": dados.get("data_inicio"),
            "data_fim": dados.get("data_fim"),
            "status": dados.get("status", "ATIVO"),
            "data_emissao": dados.get("data_emissao"),
            "quantidade_autorizada": dados.get("quantidade_autorizada", 1),
            "quantidade_executada": dados.get("quantidade_executada", 0),
            "tipo": dados.get("tipo", "sp_sadt"),  # Valor correto do enum tipo_guia
        }

        # Usa upsert ao invés de insert para atualizar se já existir
        response = (
            supabase.table("guias")
            .upsert(guia_formatada, on_conflict="numero_guia")
            .execute()
        )

        print(f"Guia salva com sucesso: {guia_formatada['numero_guia']}")
        return True

    except Exception as e:
        print(f"Erro ao salvar guia: {str(e)}")
        return False


def listar_guias(
    limit: int = 100, offset: int = 0, paciente_nome: Optional[str] = None
) -> Dict:
    """Retorna todos os execucaos como uma lista única com suporte a paginação e filtro"""
    try:
        # Inicia a query
        query = supabase.table("execucaos").select("*")

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

        # Inicializa contadores
        total_por_tipo = 0
        total_por_status = 0
        total_por_prioridade = 0

        # Lista de valores válidos
        tipos_validos = [
            "execucao_sem_ficha",
            "ficha_sem_execucao",
            "quantidade_excedida",
            "data_inconsistente",
            "doc_incompleto",
            "assinatura_ausente",
        ]
        status_validos = ["pendente", "em_analise", "resolvida"]
        prioridades_validas = [
            "alta",
            "media",
            "ALTA",
            "MEDIA",
        ]  # Aceita maiúsculas e minúsculas

        # Calcula as contagens para o resumo
        for div in count_response.data:
            tipo_div = div.get("tipo_divergencia", "").lower()
            status_div = div.get("status", "").lower()
            prioridade_div = div.get("prioridade", "media").lower()

            if tipo_div in tipos_validos:
                total_por_tipo += 1
            if status_div in status_validos:
                total_por_status += 1
            if prioridade_div.lower() in ["alta", "media"]:  # Compara em minúsculas
                total_por_prioridade += 1

        # Consulta paginada para obter as divergências
        query = supabase.table("execucaos").select(
            """
            id,
            numero_guia,
            data_execucao,
            codigo_ficha,
            tipo_divergencia,
            descricao,
            status,
            data_identificacao,
            data_resolucao,
            resolvido_por,
            observacoes,
            created_at,
            updated_at,
            paciente_nome,
            ficha_id,
            execucao_id,
            prioridade,
            detalhes,
            data_atendimento,
            carteirinha
            """
        )

        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")

        query = query.order("data_execucao", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        response = query.execute()
        rows = response.data

        # Processa resultados
        execucaos = []
        for row in rows:
            execucao = {
                "id": row["id"],
                "data_execucao": row["data_execucao"],
                "paciente_carteirinha": row["paciente_carteirinha"],
                "paciente_nome": row["paciente_nome"],
                "guia_id": row["guia_id"],
                "codigo_ficha": row["codigo_ficha"],
                "possui_assinatura": bool(row["possui_assinatura"]),
                "arquivo_url": row.get("arquivo_url", None),
            }
            execucaos.append(execucao)

        return {
            "execucaos": execucaos,
            "total": total,
            "resumo": {
                "total": total,
                "por_tipo": {},
                "por_prioridade": {"ALTA": 0, "MEDIA": 0},
                "por_status": {"pendente": 0, "em_analise": 0, "resolvida": 0},
            },
        }

    except Exception as e:
        print(f"Erro ao listar guias: {e}")
        return {
            "execucaos": [],
            "total": 0,
            "resumo": {
                "total": 0,
                "por_tipo": {},
                "por_prioridade": {"ALTA": 0, "MEDIA": 0},
                "por_status": {"pendente": 0, "em_analise": 0, "resolvida": 0},
            },
        }


def buscar_guia(guia_id: str) -> List[Dict]:
    """Busca execucaos específicos pelo número da guia"""
    try:
        response = (
            supabase.table("execucaos").select("*").eq("guia_id", guia_id).execute()
        )

        execucaos = []
        for row in response.data:
            execucaos.append(
                {
                    "id": row["id"],
                    "data_execucao": row["data_execucao"],
                    "paciente_carteirinha": row["paciente_carteirinha"],
                    "paciente_nome": row["paciente_nome"],
                    "guia_id": row["guia_id"],
                    "codigo_ficha": row["codigo_ficha"],
                    "possui_assinatura": bool(row["possui_assinatura"]),
                    "arquivo_url": row.get("arquivo_url", None),
                }
            )

        return execucaos

    except Exception as e:
        print(f"Erro ao buscar guia: {e}")
        return []


# Limpar tabela de execucoes
def limpar_banco() -> None:
    """Limpa a tabela de execucoes"""
    try:
        supabase.table("execucoes").delete().neq("id", 0).execute()
    except Exception as e:
        print(f"Erro ao limpar banco: {e}")


def registrar_divergencia(
    numero_guia: str,
    data_execucao: Optional[str] = None,
    data_atendimento: Optional[str] = None,
    codigo_ficha: Optional[str] = None,
    tipo_divergencia: Optional[str] = None,
    descricao: Optional[str] = None,
    paciente_nome: Optional[str] = None,
    prioridade: Optional[str] = None,
    carteirinha: Optional[str] = None,
    detalhes: Optional[Dict] = None,
    **kwargs,
) -> bool:
    """
    Registra uma nova divergência no banco de dados.
    """
    try:
        divergencia_id = str(uuid.uuid4())

        # Se não tiver data_execucao, usa a data atual
        if not data_execucao:
            data_execucao = datetime.now().strftime("%d/%m/%Y")

        # Monta o dicionário base
        divergencia = {
            "id": divergencia_id,
            "numero_guia": numero_guia,
            "data_execucao": data_execucao,
            "data_atendimento": data_atendimento,
            # or data_execucao,  # Se não tiver data_atendimento, usa data_execucao
            "codigo_ficha": codigo_ficha,
            "tipo_divergencia": tipo_divergencia,
            "descricao": descricao,
            "paciente_nome": paciente_nome,
            "prioridade": prioridade or "ALTA",
            "carteirinha": carteirinha,
            "status": "pendente",
            "data_identificacao": datetime.now(timezone.utc).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            "detalhes": detalhes or {},
        }

        # Remove campos que são None
        divergencia = {k: v for k, v in divergencia.items() if v is not None}

        # Adiciona campos extras ao detalhes
        if kwargs:
            divergencia["detalhes"].update(kwargs)

        # Insere no Supabase
        response = supabase.table("divergencias").insert(divergencia).execute()

        if response.data:
            logging.info(f"Divergência registrada com sucesso: {divergencia_id}")
            return True
        else:
            logging.error("Erro: Resposta vazia do Supabase ao registrar divergência")
            return False

    except Exception as e:
        logging.error(f"Erro ao registrar divergência: {str(e)}")
        logging.error(traceback.format_exc())
        return False


def buscar_divergencias(
    page: int = 1,
    per_page: int = 10,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    status: Optional[str] = None,
    tipo_divergencia: Optional[str] = None,
    prioridade: Optional[str] = None,
) -> Dict:
    """
    Busca divergências com paginação e filtros
    """
    try:
        logging.info(
            f"Buscando divergências - página: {page}, por página: {per_page}, data_inicio: {data_inicio}, data_fim: {data_fim}, status: {status}"
        )
        print(
            f"Buscando divergências - página: {page}, por página: {per_page}, data_inicio: {data_inicio}, data_fim: {data_fim}, status: {status}"
        )

        # Calcula offset para paginação
        offset = (page - 1) * per_page

        # Busca registros com paginação e ordenação
        query = (
            supabase.table("divergencias")
            .select("*")
            .order("data_identificacao", desc=True)
        )

        # Aplica filtros se fornecidos
        if status and status.lower() != "todos":
            query = query.eq("status", status.lower())

        if tipo_divergencia and tipo_divergencia.lower() != "todos":
            query = query.eq("tipo_divergencia", tipo_divergencia)

        if prioridade and prioridade.lower() != "todos":
            query = query.eq("prioridade", prioridade.upper())

        # Aplica filtros de data
        if data_inicio:
            query = query.gte("data_execucao", data_inicio)
        if data_fim:
            query = query.lte("data_execucao", data_fim)

        # Aplica paginação
        query = query.range(offset, offset + per_page - 1)

        # Executa a query
        response = query.execute()
        divergencias = response.data if response.data else []

        # Busca total de registros
        total_query = supabase.table("divergencias").select("id", count="exact")
        if status and status.lower() != "todos":
            total_query = total_query.eq("status", status.lower())
        if tipo_divergencia and tipo_divergencia.lower() != "todos":
            total_query = total_query.eq("tipo_divergencia", tipo_divergencia)
        if prioridade and prioridade.lower() != "todos":
            total_query = total_query.eq("prioridade", prioridade.upper())
        if data_inicio:
            total_query = total_query.gte("data_execucao", data_inicio)
        if data_fim:
            total_query = total_query.lte("data_execucao", data_fim)

        total_response = total_query.execute()
        total_registros = (
            total_response.count if total_response.count is not None else 0
        )

        return {
            "divergencias": divergencias,
            "total": total_registros,
            "pagina_atual": page,
            "total_paginas": (
                ceil(total_registros / per_page) if total_registros > 0 else 0
            ),
            "por_pagina": per_page,
            "resumo": {
                "total": total_registros,
                "por_tipo": {},
                "por_prioridade": {"ALTA": 0, "MEDIA": 0},
                "por_status": {"pendente": 0, "em_analise": 0, "resolvida": 0},
            },
        }

    except Exception as e:
        logging.error(f"Erro ao buscar divergências: {str(e)}")
        logging.error(traceback.format_exc())
        return {
            "divergencias": [],
            "total": 0,
            "pagina_atual": page,
            "total_paginas": 0,
            "por_pagina": per_page,
            "resumo": {
                "total": 0,
                "por_tipo": {},
                "por_prioridade": {"ALTA": 0, "MEDIA": 0},
                "por_status": {"pendente": 0, "em_analise": 0, "resolvida": 0},
            },
        }


def listar_divergencias(
    page: int = 1,
    per_page: int = 10,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    status: Optional[str] = None,
    tipo_divergencia: Optional[str] = None,
    prioridade: Optional[str] = None,
) -> Dict:
    """
    Lista divergências com paginação e filtros
    """
    return buscar_divergencias(
        page=page,
        per_page=per_page,
        data_inicio=data_inicio,
        data_fim=data_fim,
        status=status,
        tipo_divergencia=tipo_divergencia,
        prioridade=prioridade,
    )


def atualizar_status_divergencia(
    id: str, novo_status: str, usuario_id: Optional[str] = None
) -> bool:
    """Atualiza o status de uma divergência"""
    try:
        print(f"Tentando atualizar divergência {id} para status: {novo_status}")

        dados = {
            "status": novo_status,
            "data_resolucao": (
                datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                if novo_status != "pendente"
                else None
            ),
            "resolvido_por": usuario_id if novo_status != "pendente" else None,
        }
        print(f"Dados para atualização: {dados}")

        response = supabase.table("divergencias").update(dados).eq("id", id).execute()
        print(f"Resposta do Supabase: {response.data}")
        return True

    except Exception as e:
        print(f"Erro ao atualizar status da divergência: {e}")
        traceback.print_exc()
        return False


def atualizar_execucao(codigo_ficha: str, dados: Dict) -> bool:
    """
    Atualiza um execucao no Supabase
    """
    try:
        # Formata os dados no padrão esperado
        dados_atualizados = {
            "guia_id": str(dados["guia_id"]),
            "paciente_nome": str(dados["paciente_nome"]),
            "data_execucao": dados["data_execucao"],
            "paciente_carteirinha": str(dados["paciente_carteirinha"]),
            "codigo_ficha": str(dados["codigo_ficha"]),
            "possui_assinatura": bool(dados["possui_assinatura"]),
            "arquivo_url": dados.get("arquivo_url", None),
        }

        # Verifica se o registro existe
        check_response = (
            supabase.table("execucaos")
            .select("id")
            .eq("codigo_ficha", codigo_ficha)
            .execute()
        )
        if not check_response.data:
            return False

        # Se o código da ficha está sendo alterado, verifica se o novo código já existe
        if codigo_ficha != dados_atualizados["codigo_ficha"]:
            check_new_code = (
                supabase.table("execucaos")
                .select("id")
                .eq("codigo_ficha", dados_atualizados["codigo_ficha"])
                .execute()
            )
            if check_new_code.data:
                raise ValueError("O novo código da ficha já existe")

        # Atualiza o registro no Supabase
        response = (
            supabase.table("execucaos")
            .update(dados_atualizados)
            .eq("codigo_ficha", codigo_ficha)
            .execute()
        )

        return True

    except Exception as e:
        print(f"Erro ao atualizar execucao: {e}")
        raise e


def upload_arquivo_storage(arquivo_path: str, novo_nome: str) -> Optional[str]:
    """
    Faz upload de um arquivo para o Supabase Storage.

    Args:
        arquivo_path (str): Caminho local do arquivo
        novo_nome (str): Nome do arquivo no Storage

    Returns:
        str: URL pública do arquivo ou None se houver erro
    """
    try:
        print(f"Iniciando upload do arquivo {novo_nome}")

        # Lê o arquivo
        with open(arquivo_path, "rb") as f:
            arquivo = f.read()
            print(f"Arquivo lido com sucesso. Tamanho: {len(arquivo)} bytes")

        print("Iniciando upload para o bucket fichas_renomeadas...")

        try:
            # Tenta fazer o upload
            response = supabase.storage.from_("fichas_renomeadas").upload(
                path=novo_nome,
                file=arquivo,
                file_options={"content-type": "application/pdf"},
            )
            print(f"Response do upload: {response}")

        except Exception as upload_error:
            # Se o arquivo já existe, tenta obter a URL dele
            if "Duplicate" in str(upload_error):
                print(f"Arquivo {novo_nome} já existe no Storage. Obtendo URL...")
                url = supabase.storage.from_("fichas_renomeadas").get_public_url(
                    novo_nome
                )
                print(f"URL do arquivo existente: {url}")
                return url
            else:
                raise upload_error

        # Gera a URL pública
        url = supabase.storage.from_("fichas_renomeadas").get_public_url(novo_nome)
        print(f"URL pública gerada: {url}")
        print(f"Arquivo {novo_nome} enviado com sucesso para o Storage")
        return url

    except Exception as e:
        print(f"Erro ao fazer upload do arquivo para o Storage: {e}")
        print(f"Tipo do erro: {type(e)}")
        print(f"Traceback completo: {traceback.format_exc()}")
        return None


def deletar_arquivos_storage(nomes_arquivos: list[str]) -> bool:
    """
    Deleta múltiplos arquivos do Supabase Storage de uma vez.
    """
    try:
        bucket = "fichas_renomeadas"

        # Lista todos os arquivos no bucket
        files = supabase.storage.from_(bucket).list()
        if not files:
            print("Nenhum arquivo encontrado no bucket")
            return True

        # Pega todos os nomes de arquivos que existem
        nomes_encontrados = [f["name"] for f in files if f["name"] in nomes_arquivos]
        if not nomes_encontrados:
            print("Nenhum dos arquivos especificados foi encontrado no bucket")
            return True

        print(f"Tentando deletar {len(nomes_encontrados)} arquivos de uma vez")

        # Deleta os arquivos um por um, mas em uma única função
        # O Supabase não suporta deleção em massa, então precisamos fazer isso
        for nome in nomes_encontrados:
            try:
                supabase.storage.from_(bucket).remove(nome)
                print(f"Arquivo {nome} deletado com sucesso")
            except Exception as e:
                print(f"Erro ao deletar {nome}: {str(e)}")
                return False

        # Verifica se todos os arquivos foram deletados
        files_after = supabase.storage.from_(bucket).list()
        remaining_files = [f["name"] for f in files_after]

        # Verifica se algum dos arquivos ainda existe
        failed_deletions = [
            nome for nome in nomes_encontrados if nome in remaining_files
        ]

        if failed_deletions:
            print(f"Falha ao deletar os seguintes arquivos: {failed_deletions}")
            return False

        print("Todos os arquivos foram deletados com sucesso!")
        return True

    except Exception as e:
        print(f"Erro ao deletar arquivos do Storage: {str(e)}")
        print(f"Detalhes do erro: {traceback.format_exc()}")
        return False


def list_storage_files():
    """
    Lista todos os arquivos do bucket fichas_renomeadas.
    Retorna uma lista com os nomes dos arquivos.
    """
    try:
        # Lista os arquivos no bucket
        response = supabase.storage.from_("fichas_renomeadas").list()
        print("Resposta do list_storage_files:", response)
        return response
    except Exception as e:
        print(f"Erro em list_storage_files: {e}")
        return []


def salvar_ficha_presenca(info: Dict) -> Optional[str]:
    """
    Salva as informações da ficha de presença no Supabase.
    Se o código da ficha já existir, atualiza o registro.
    """
    try:
        print(f"Tentando salvar ficha de presença: {info}")

        # Formata os dados para o formato esperado pelo banco
        dados = {
            "data_atendimento": info["data_atendimento"],
            "paciente_carteirinha": info["paciente_carteirinha"],
            "paciente_nome": info["paciente_nome"].upper(),
            "numero_guia": info["numero_guia"],
            "codigo_ficha": info["codigo_ficha"],
            "possui_assinatura": info.get("possui_assinatura", False),
            "arquivo_digitalizado": info.get("arquivo_digitalizado"),
        }

        # Verifica se já existe um registro com o mesmo código de ficha
        codigo_ficha = info.get("codigo_ficha")
        if codigo_ficha:
            existing = (
                supabase.table("fichas_presenca")
                .select("id")
                .eq("codigo_ficha", codigo_ficha)
                .execute()
            )

            if existing.data:
                print(
                    f"Atualizando registro existente para codigo_ficha: {codigo_ficha}"
                )
                response = (
                    supabase.table("fichas_presenca")
                    .update(dados)
                    .eq("codigo_ficha", codigo_ficha)
                    .execute()
                )
                if response.data:
                    print(f"Ficha atualizada com sucesso: {response.data}")
                    return response.data[0].get("id")
                else:
                    print("Erro: Resposta vazia do Supabase ao atualizar")
                    return None

        # Se não existe, insere novo registro
        print(f"Inserindo novo registro para codigo_ficha: {codigo_ficha}")
        response = supabase.table("fichas_presenca").insert(dados).execute()

        if response.data:
            print(f"Ficha salva com sucesso: {response.data}")
            return response.data[0].get("id")
        else:
            print("Erro: Resposta vazia do Supabase")
            return None

    except Exception as e:
        print(f"Erro ao salvar ficha de presença: {e}")
        return None


def listar_fichas_presenca(
    limit: int = 100, offset: int = 0, paciente_nome: Optional[str] = None
) -> Dict:
    """
    Retorna todas as fichas de presença com suporte a paginação e filtro.
    Se limit for 0, retorna todos os registros.
    """
    try:
        # Inicia a query
        query = supabase.table("fichas_presenca").select("*")

        # Adiciona filtro por nome se fornecido
        if paciente_nome and isinstance(paciente_nome, str):
            query = query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")

        # Busca todos os registros para contar
        count_response = query.execute()
        total = len(count_response.data)

        # Adiciona ordenação e paginação
        query = query.order("data_atendimento", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        # Executa a query
        response = query.execute()
        fichas = response.data

        # Formata as datas se necessário
        for ficha in fichas:
            if ficha.get("data_atendimento"):
                try:
                    data = datetime.strptime(ficha["data_atendimento"], "%Y-%m-%d")
                    ficha["data_atendimento"] = data.strftime("%d/%m/%Y")
                except ValueError:
                    pass  # Mantém o formato original se não conseguir converter

        # Se limit = 0, retorna todas as fichas como lista
        if limit == 0:
            return fichas

        # Se limit > 0, retorna com paginação
        total = len(supabase.table("fichas_presenca").select("id").execute().data)
        return {
            "fichas": fichas,
            "total": total,
            "total_pages": ceil(total / limit) if limit > 0 else 1,
        }

    except Exception as e:
        print(f"Erro ao listar fichas de presença: {e}")
        traceback.print_exc()  # Isso imprimirá o traceback completo
        return [] if limit == 0 else {"fichas": [], "total": 0, "total_pages": 1}


def buscar_ficha_presenca(
    identificador: str, tipo_busca: str = "codigo"
) -> Optional[Dict]:
    """
    Busca uma ficha de presença específica.

    Args:
        identificador: ID da ficha ou código da ficha
        tipo_busca: 'id' para buscar por ID, 'codigo' para buscar por código da ficha

    Returns:
        Dict com os dados da ficha ou None se não encontrada
    """
    try:
        # Determina o campo de busca com base no tipo
        campo = "id" if tipo_busca == "id" else "codigo_ficha"

        # Executa a busca
        response = (
            supabase.table("fichas_presenca")
            .select("*")
            .eq(campo, identificador)
            .execute()
        )

        if not response.data:
            return None

        row = response.data[0]

        # Formata o resultado
        ficha = {
            "id": row["id"],
            "data_atendimento": row["data_atendimento"],
            "paciente_carteirinha": row["paciente_carteirinha"],
            "paciente_nome": row["paciente_nome"],
            "numero_guia": row["numero_guia"],
            "codigo_ficha": row["codigo_ficha"],
            "possui_assinatura": bool(row["possui_assinatura"]),
            "arquivo_digitalizado": row.get("arquivo_digitalizado"),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }

        # Formata a data se necessário
        if ficha["data_atendimento"]:
            try:
                data = datetime.strptime(ficha["data_atendimento"], "%Y-%m-%d")
                ficha["data_atendimento"] = data.strftime("%d/%m/%Y")
            except ValueError:
                pass  # Mantém o formato original se não conseguir converter

        return ficha

    except Exception as e:
        print(f"Erro ao buscar ficha: {e}")
        return None


def excluir_ficha_presenca(id: str) -> bool:
    """
    Exclui uma ficha de presença e seu arquivo digitalizado associado.

    Args:
        id: ID (UUID) da ficha a ser excluída

    Returns:
        bool indicando sucesso da operação
    """
    try:
        # Primeiro busca a ficha para obter o arquivo digitalizado
        ficha = buscar_ficha_presenca(id, tipo_busca="id")
        if not ficha:
            print(f"Ficha não encontrada para exclusão: {id}")
            return False

        # Se tem arquivo digitalizado, exclui do storage
        arquivo_digitalizado = ficha.get("arquivo_digitalizado")
        if arquivo_digitalizado:
            try:
                # Extrai o nome do arquivo da URL ou path
                nome_arquivo = arquivo_digitalizado.split("/")[-1]
                deletar_arquivos_storage([nome_arquivo])
            except Exception as e:
                print(f"Erro ao excluir arquivo digitalizado: {e}")
                # Continua mesmo se falhar a exclusão do arquivo

        # Exclui o registro da ficha
        response = supabase.table("fichas_presenca").delete().eq("id", id).execute()

        if response.data:
            print(f"Ficha excluída com sucesso: {id}")
            return True
        else:
            print("Erro: Resposta vazia do Supabase ao excluir")
            return False

    except Exception as e:
        print(f"Erro ao excluir ficha: {e}")
        traceback.print_exc()
        return False


def limpar_divergencias_db() -> bool:
    """Limpa a tabela de divergências"""
    try:
        print("Iniciando limpeza da tabela divergencias...")
        # Deleta todos os registros
        response = (
            supabase.table("divergencias")
            .delete()
            .gt("id", "00000000-0000-0000-0000-000000000000")
            .execute()
        )
        print(f"Resposta do Supabase: {response}")
        print("Tabela divergencias limpa com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao limpar tabela divergencias: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return False


def limpar_fichas_presenca() -> bool:
    """Limpa a tabela de fichas_presenca"""
    try:
        # Deleta todos os registros
        supabase.table("fichas_presenca").delete().gt(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()
        print("Tabela fichas_presenca limpa com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao limpar tabela fichas_presenca: {e}")
        return False


def listar_execucoes(
    limit: int = 100, offset: int = 0, paciente_nome: Optional[str] = None
) -> Dict:
    """
    Retorna todas as execuções com suporte a paginação e filtro.
    Se limit for 0, retorna todos os registros.
    """
    try:
        # Inicia a query
        query = supabase.table("execucoes").select("*")

        # Adiciona filtro se paciente_nome for fornecido
        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")

        # Adiciona ordenação e paginação
        query = query.order("data_execucao", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        # Executa a query
        response = query.execute()
        execucoes = response.data

        # Formata as datas se necessário
        for execucao in execucoes:
            if execucao.get("data_execucao"):
                try:
                    data = datetime.strptime(execucao["data_execucao"], "%Y-%m-%d")
                    execucao["data_execucao"] = data.strftime("%d/%m/%Y")
                except ValueError:
                    pass  # Mantém o formato original se não conseguir converter

        # Se limit > 0, retorna com paginação
        if limit > 0:
            total = len(supabase.table("execucoes").select("id").execute().data)
            return {
                "execucoes": execucoes,
                "total": total,
                "total_pages": (total + limit - 1) // limit,
            }

        # Se limit = 0, retorna todas as execuções
        return execucoes

    except Exception as e:
        print(f"Erro ao listar execuções: {e}")
        traceback.print_exc()
        return [] if limit == 0 else {"execucoes": [], "total": 0, "total_pages": 1}


def registrar_execucao_auditoria(
    data_inicial: str = None,
    data_final: str = None,
    total_protocolos: int = 0,
    total_divergencias: int = 0,
    divergencias_por_tipo: dict = None,
    total_fichas: int = 0,
    total_execucoes: int = 0,
    total_resolvidas: int = 0,
) -> bool:
    """Registra uma nova execução de auditoria com seus metadados."""
    try:
        logging.info(f"Registrando execução de auditoria com {total_fichas} fichas e {total_execucoes} execuções")
        data = {
            "data_execucao": datetime.now(timezone.utc).isoformat(),
            "data_inicial": data_inicial,
            "data_final": data_final,
            "total_protocolos": total_protocolos,
            "total_divergencias": total_divergencias,
            "divergencias_por_tipo": divergencias_por_tipo or {},
            "total_fichas": total_fichas,
            "total_execucoes": total_execucoes,
            "total_resolvidas": total_resolvidas,
        }

        response = supabase.table("auditoria_execucoes").insert(data).execute()
        if response.data:
            logging.info("Execução de auditoria registrada com sucesso")
            return True
        else:
            logging.error("Erro ao registrar execução de auditoria: response.data está vazio")
            return False

    except Exception as e:
        logging.error(f"Erro ao registrar execução de auditoria: {str(e)}")
        traceback.print_exc()
        return False


def calcular_estatisticas_divergencias() -> Dict:
    """
    Calcula estatísticas das divergências para os cards
    """
    try:
        # Busca todas as divergências
        response = supabase.table("divergencias").select("*").execute()
        divergencias = response.data if response.data else []

        # Inicializa contadores
        por_tipo = {}
        por_prioridade = {"ALTA": 0, "MEDIA": 0}
        por_status = {"pendente": 0, "em_analise": 0, "resolvida": 0}

        # Conta divergências por tipo, prioridade e status
        for div in divergencias:
            # Por tipo
            tipo = div.get("tipo_divergencia", "outros")
            por_tipo[tipo] = por_tipo.get(tipo, 0) + 1

            # Por prioridade
            prioridade = div.get("prioridade", "MEDIA")
            por_prioridade[prioridade] = por_prioridade.get(prioridade, 0) + 1

            # Por status
            status = div.get("status", "pendente")
            por_status[status] = por_status.get(status, 0) + 1

        # Garante que todos os campos são inteiros
        por_tipo = {k: int(v) for k, v in por_tipo.items()}
        por_prioridade = {k: int(v) for k, v in por_prioridade.items()}
        por_status = {k: int(v) for k, v in por_status.items()}

        return {
            "total": len(divergencias),
            "por_tipo": por_tipo,
            "por_prioridade": por_prioridade,
            "por_status": por_status,
        }

    except Exception as e:
        logging.error(f"Erro ao calcular estatísticas: {str(e)}")
        logging.error(traceback.format_exc())
        # Retorna estrutura vazia em caso de erro
        return {
            "total": 0,
            "por_tipo": {},
            "por_prioridade": {"ALTA": 0, "MEDIA": 0},
            "por_status": {"pendente": 0, "em_analise": 0, "resolvida": 0},
        }


def obter_ultima_auditoria() -> Dict:
    """Obtém o resultado da última auditoria realizada e calcula estatísticas das divergências."""
    try:
        # Busca a última execução de auditoria
        response = (
            supabase.table("auditoria_execucoes")
            .select("*")
            .order("data_execucao", desc=True)
            .limit(1)
            .execute()
        )

        if not response.data:
            return {
                "total_protocolos": 0,
                "total_divergencias": 0,
                "divergencias_por_tipo": {},
                "total_fichas": 0,
                "total_execucoes": 0,
                "total_resolvidas": 0,
                "data_execucao": None,
                "tempo_execucao": None
            }

        ultima_auditoria = response.data[0]

        # Calcula o tempo desde a última execução
        data_execucao = datetime.fromisoformat(ultima_auditoria["data_execucao"].replace("Z", "+00:00"))
        agora = datetime.now(timezone.utc)
        diferenca = agora - data_execucao

        # Formata o tempo de execução
        if diferenca.days > 0:
            tempo_execucao = f"Há {diferenca.days} dias"
        elif diferenca.seconds > 3600:
            tempo_execucao = f"Há {diferenca.seconds // 3600} horas"
        elif diferenca.seconds > 60:
            tempo_execucao = f"Há {diferenca.seconds // 60} minutos"
        else:
            tempo_execucao = f"Há {diferenca.seconds} segundos"

        return {
            "total_protocolos": ultima_auditoria.get("total_protocolos", 0),
            "total_divergencias": ultima_auditoria.get("total_divergencias", 0),
            "divergencias_por_tipo": ultima_auditoria.get("divergencias_por_tipo", {}),
            "total_fichas": ultima_auditoria.get("total_fichas", 0),
            "total_execucoes": ultima_auditoria.get("total_execucoes", 0),
            "total_resolvidas": ultima_auditoria.get("total_resolvidas", 0),
            "data_execucao": ultima_auditoria["data_execucao"],
            "tempo_execucao": tempo_execucao
        }

    except Exception as e:
        logging.error(f"Erro ao obter última auditoria: {str(e)}")
        traceback.print_exc()
        return None


def listar_pacientes(
    limit: int = 100, offset: int = 0, paciente_nome: Optional[str] = None
) -> Dict:
    """
    Retorna todos os pacientes com suporte a paginação e filtro.
    Se limit for 0, retorna todos os registros.
    """
    try:
        # Inicia a query
        query = supabase.table("pacientes").select("*")

        # Adiciona filtro se paciente_nome for fornecido
        if paciente_nome:
            query = query.ilike("nome", f"%{paciente_nome.upper()}%")

        # Adiciona ordenação
        query = query.order("nome")

        # Executa a query
        response = query.execute()

        if not response.data:
            return {"items": [], "total": 0}

        # Formata a resposta
        return {"items": response.data, "total": len(response.data)}

    except Exception as e:
        print(f"Erro ao listar pacientes: {e}")
        traceback.print_exc()
        return {"items": [], "total": 0}


def listar_guias_paciente(paciente_id: str) -> Dict:
    """
    Lista todas as guias de um paciente específico e suas informações de plano.
    """
    try:
        # Primeiro busca o paciente e sua carteirinha associada ao plano
        print(f"Buscando paciente com ID: {paciente_id}")
        paciente_query = (
            "*, "  # Dados do paciente
            "carteirinhas(*, "  # Dados da carteirinha
            "planos_saude(*))"  # Dados do plano de saúde
        )
        
        paciente_response = (
            supabase.table("pacientes")
            .select(paciente_query)
            .eq("id", paciente_id)
            .execute()
        )

        if not paciente_response.data:
            print("Paciente não encontrado")
            return {"items": [], "total": 0, "plano": None}

        paciente = paciente_response.data[0]
        print(f"Paciente encontrado: {paciente}")

        # Extrai informações do plano
        carteirinha = paciente["carteirinhas"][0] if paciente.get("carteirinhas") else None
        plano = None
        if carteirinha and carteirinha.get("planos_saude"):
            plano = carteirinha["planos_saude"]
            print(f"Plano encontrado: {plano}")

        # Se temos uma carteirinha, busca as guias
        numero_carteirinha = carteirinha["numero_carteirinha"] if carteirinha else None
        if numero_carteirinha:
            print(f"Buscando guias para carteirinha: {numero_carteirinha}")
            guias_response = (
                supabase.table("guias")
                .select("*")
                .eq("paciente_carteirinha", numero_carteirinha)
                .order("created_at", desc=True)
                .execute()
            )

            guias = []
            for guia in guias_response.data:
                guia_formatada = {
                    **guia,
                    "data_emissao": formatar_data(guia["data_emissao"]) if guia.get("data_emissao") else None,
                    "data_validade": formatar_data(guia["data_validade"]) if guia.get("data_validade") else None
                }
                guias.append(guia_formatada)

            print(f"Total de guias encontradas: {len(guias)}")
            print("DEBUG - Guias antes de retornar:", [
                {
                    "id": g["id"],
                    "numero_guia": g["numero_guia"],
                    "status": g["status"]  # Verifique o valor do status aqui
                } 
                for g in guias_response.data
            ])
            return {
                "items": guias,
                "total": len(guias),
                "plano": plano
            }
        else:
            print("Nenhuma carteirinha encontrada para o paciente")
            return {"items": [], "total": 0, "plano": None}

    except Exception as e:
        print(f"Erro ao listar guias do paciente: {e}")
        traceback.print_exc()
        return {"items": [], "total": 0, "plano": None}


def listar_guias(
    limit: int = 100, offset: int = 0, paciente_nome: Optional[str] = None
) -> Dict:
    """Retorna todas as guias com suporte a paginação e filtro.
    Se limit for 0, retorna todos os registros.

    Args:
        limit: Número máximo de registros a retornar
        offset: Número de registros a pular
        paciente_nome: Nome do paciente para filtrar

    Returns:
        Dict contendo os registros e metadados da paginação
    """
    try:
        query = supabase.table("guias").select("*")

        # Aplica filtro por nome do paciente se fornecido
        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome}%")

        # Conta total de registros para paginação
        total = len(query.execute().data)

        # Aplica paginação se limit > 0
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        response = query.execute()

        if response.data is None:
            return {"registros": [], "total": 0, "paginas": 0}

        registros = response.data
        paginas = ceil(total / limit) if limit > 0 else 1

        return {"registros": registros, "total": total, "paginas": paginas}

    except Exception as e:
        print(f"Erro ao listar guias: {str(e)}")
        return {"registros": [], "total": 0, "paginas": 0}


def listar_divergencias(
    page: int = 1,
    per_page: int = 10,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    status: Optional[str] = None,
    tipo_divergencia: Optional[str] = None,
    prioridade: Optional[str] = None,
) -> Dict:
    """
    Lista divergências com paginação e filtros
    """
    return buscar_divergencias(
        page=page,
        per_page=per_page,
        data_inicio=data_inicio,
        data_fim=data_fim,
        status=status,
        tipo_divergencia=tipo_divergencia,
        prioridade=prioridade,
    )


def registrar_auditoria_execucoes(
    total_protocolos: int,
    data_inicial: Optional[str] = None,
    data_final: Optional[str] = None,
) -> bool:
    """
    Registra os metadados da auditoria de execuções
    """
    try:
        dados = {
            "id": str(uuid.uuid4()),
            "data_execucao": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "total_protocolos": total_protocolos,
            "data_inicial": data_inicial,
            "data_final": data_final,
        }

        response = supabase.table("auditoria_execucoes").insert(dados).execute()

        if response.data:
            logging.info(f"Metadados da auditoria registrados com sucesso")
            return True
        else:
            logging.error("Erro ao registrar metadados da auditoria: resposta vazia")
            return False

    except Exception as e:
        logging.error(f"Erro ao registrar metadados da auditoria: {str(e)}")
        logging.error(traceback.format_exc())
        return False

def get_plano_by_carteirinha(carteirinha: str) -> Dict:
    """Busca informações do plano de saúde usando o número da carteirinha"""
    try:
        codigo_plano = carteirinha.split('.')[0]
        response = (
            supabase.table("planos_saude")
            .select("*")
            .eq("codigo", codigo_plano)
            .execute()
        )
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Erro ao buscar plano: {e}")
        return None


def listar_divergencias(
    page: int = 1,
    per_page: int = 10,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    status: Optional[str] = None,
    tipo_divergencia: Optional[str] = None,
    prioridade: Optional[str] = None,
) -> Dict:
    """
    Lista divergências com paginação e filtros
    """
    return buscar_divergencias(
        page=page,
        per_page=per_page,
        data_inicio=data_inicio,
        data_fim=data_fim,
        status=status,
        tipo_divergencia=tipo_divergencia,
        prioridade=prioridade,
    )


def registrar_auditoria_execucoes(
    total_protocolos: int,
    data_inicial: Optional[str] = None,
    data_final: Optional[str] = None,
) -> bool:
    """
    Registra os metadados da auditoria de execuções
    """
    try:
        dados = {
            "id": str(uuid.uuid4()),
            "data_execucao": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "total_protocolos": total_protocolos,
            "data_inicial": data_inicial,
            "data_final": data_final,
        }

        response = supabase.table("auditoria_execucoes").insert(dados).execute()

        if response.data:
            logging.info(f"Metadados da auditoria registrados com sucesso")
            return True
        else:
            logging.error("Erro ao registrar metadados da auditoria: resposta vazia")
            return False

    except Exception as e:
        logging.error(f"Erro ao registrar metadados da auditoria: {str(e)}")
        logging.error(traceback.format_exc())
        return False


def formatar_data(data: str) -> str:
    """
    Formata uma data para o padrão DD/MM/YYYY.
    
    Args:
        data: Data em formato string (YYYY-MM-DD ou DD/MM/YYYY)
        
    Returns:
        Data formatada em DD/MM/YYYY
    """
    if not data:
        return None
        
    try:
        # Se já estiver no formato DD/MM/YYYY
        if '/' in data:
            return data
            
        # Converte de YYYY-MM-DD para DD/MM/YYYY
        from datetime import datetime
        data_obj = datetime.strptime(data, '%Y-%m-%d')
        return data_obj.strftime('%d/%m/%Y')
    except Exception as e:
        print(f"Erro ao formatar data {data}: {e}")
        return data
