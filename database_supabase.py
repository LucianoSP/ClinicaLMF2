from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from config import supabase
from math import ceil
import logging
import traceback
import uuid
import random
import os
import pandas as pd

def gerar_uuid_consistente(valor: str) -> str:
    """Gera um UUID v5 consistente usando um namespace fixo e o valor como nome."""
    namespace = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
    return str(uuid.uuid5(namespace, valor))

def extrair_codigo_plano(numero_carteirinha: str) -> str:
    """Extrai o código do plano de saúde do número da carteirinha."""
    return numero_carteirinha.split(".")[0]

def formatar_data(data: str) -> str:
    """
    Formata uma data para o padrão DD/MM/YYYY.
    
    Args:
        data: Data em formato string (YYYY-MM-DD ou DD/MM/YYYY ou YYYY-MM-DDTHH:MM:SS.mmmmmm+00:00)
        
    Returns:
        Data formatada em DD/MM/YYYY
    """
    if not data:
        return None
        
    try:
        if '/' in data:
            return data
            
        # Se tem T na string, é um timestamp - pega só a parte da data
        if 'T' in data:
            data = data.split('T')[0]
            
        data_obj = datetime.strptime(data, '%Y-%m-%d')
        return data_obj.strftime('%d/%m/%Y')
    except Exception as e:
        print(f"Erro ao formatar data {data}: {e}")
        return data

def salvar_dados_excel(registros: List[Dict]) -> bool:
    """Salva os dados do Excel nas tabelas relacionadas."""
    try:
        # Processa planos de saúde
        codigos_planos = set(
            extrair_codigo_plano(str(registro["paciente_carteirinha"]))
            for registro in registros
        )

        planos_response = (
            supabase.table("planos_saude")
            .select("id, codigo")
            .in_("codigo", list(codigos_planos))
            .execute()
        )
        planos = {p["codigo"]: p["id"] for p in planos_response.data}

        # Cria planos faltantes
        planos_para_criar = [
            {
                "id": gerar_uuid_consistente(f"plano_{codigo}"),
                "codigo": codigo,
                "nome": f"Plano {codigo}",
            }
            for codigo in codigos_planos
            if codigo not in planos
        ]

        if planos_para_criar:
            response = (
                supabase.table("planos_saude")
                .upsert(planos_para_criar, on_conflict="codigo")
                .execute()
            )
            for plano in planos_para_criar:
                planos[plano["codigo"]] = plano["id"]

        # Processa pacientes
        pacientes_para_criar = []
        id_para_uuid = {}

        for registro in registros:
            id_excel = str(registro["paciente_id"])
            if id_excel not in id_para_uuid:
                id_uuid = gerar_uuid_consistente(id_excel)
                id_para_uuid[id_excel] = id_uuid
                pacientes_para_criar.append({
                    "id": id_uuid,
                    "nome": str(registro["paciente_nome"]).upper(),
                    "carteirinha": str(registro["paciente_carteirinha"]),
                })

        if pacientes_para_criar:
            supabase.table("pacientes").upsert(pacientes_para_criar, on_conflict="id").execute()

        # Processa carteirinhas
        carteirinhas_para_criar = []
        carteirinhas_processadas = set()

        for registro in registros:
            numero_carteirinha = str(registro["paciente_carteirinha"])
            id_excel = str(registro["paciente_id"])
            codigo_plano = extrair_codigo_plano(numero_carteirinha)

            if numero_carteirinha not in carteirinhas_processadas:
                carteirinhas_processadas.add(numero_carteirinha)
                carteirinhas_para_criar.append({
                    "numero_carteirinha": numero_carteirinha,
                    "paciente_id": id_para_uuid[id_excel],
                    "nome_titular": str(registro["paciente_nome"]).upper(),
                    "data_validade": None,
                    "titular": True,
                    "plano_saude_id": planos[codigo_plano],
                })

        if carteirinhas_para_criar:
            supabase.table("carteirinhas").upsert(
                carteirinhas_para_criar, 
                on_conflict="numero_carteirinha"
            ).execute()

        # Processa guias
        guias_para_criar = []
        guias_processadas = set()
        data_atual = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f%z")

        for registro in registros:
            numero_guia = str(registro["guia_id"])
            id_excel = str(registro["paciente_id"])

            if numero_guia not in guias_processadas:
                guias_processadas.add(numero_guia)
                guias_para_criar.append({
                    "numero_guia": numero_guia,
                    "paciente_nome": str(registro["paciente_nome"]).upper(),
                    "paciente_carteirinha": str(registro["paciente_carteirinha"]),
                    "paciente_id": id_para_uuid[id_excel],
                    "data_emissao": data_atual,
                    "data_validade": None,
                    "status": "pendente",
                    "quantidade_autorizada": 1,
                    "quantidade_executada": 0,
                    "tipo": "sp_sadt",
                    "procedimento_codigo": None,
                    "procedimento_nome": None,
                    "profissional_solicitante": None,
                    "profissional_executante": None,
                    "observacoes": None,
                })

        if guias_para_criar:
            supabase.table("guias").upsert(
                guias_para_criar, 
                on_conflict="numero_guia"
            ).execute()

        # Processa execuções
        execucoes = [
            {
                "id": str(uuid.uuid4()),
                "numero_guia": str(registro["guia_id"]),
                "paciente_nome": str(registro["paciente_nome"]).upper(),
                "data_execucao": registro["data_execucao"],
                "paciente_carteirinha": str(registro["paciente_carteirinha"]),
                "codigo_ficha": str(registro.get("codigo_ficha", f"F{random.randint(10000, 99999)}")),  # Generate if missing
                "guia_id": None,  # Will be linked after guia creation
                "sessao_id": None  # Will be linked if needed
            }
            for registro in registros
        ]

        # Update guia_id for each execucao
        for execucao in execucoes:
            guia_response = (
                supabase.table("guias")
                .select("id")
                .eq("numero_guia", execucao["numero_guia"])
                .execute()
            )
            if guia_response.data:
                execucao["guia_id"] = guia_response.data[0]["id"]

        supabase.table("execucoes").insert(execucoes).execute()

        print(f"Dados inseridos com sucesso! {len(execucoes)} registros.")
        return True

    except Exception as e:
        print(f"Erro ao salvar dados do Excel: {e}")
        traceback.print_exc()
        return False

def listar_dados_excel(
    limit: int = 100, 
    offset: int = 0, 
    paciente_nome: Optional[str] = None
) -> Dict:
    """Retorna os dados da tabela execucoes com suporte a paginação e filtro"""
    try:
        # Construir query base apenas com colunas que existem na tabela
        query = supabase.table("execucoes").select(
            "id",
            "numero_guia",
            "paciente_nome",
            "data_execucao",
            "paciente_carteirinha",
            "codigo_ficha"
        )

        # Aplicar filtro de nome se existir
        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")

        # Obter contagem total antes da paginação
        total_response = query.execute()
        total = len(total_response.data)

        # Aplicar ordenação e paginação
        query = query.order('created_at', desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        # Executar query final
        response = query.execute()

        # Formatar dados mantendo compatibilidade com frontend
        registros_formatados = []
        for reg in response.data:
            try:
                data_execucao = formatar_data(reg.get("data_execucao"))
                
                registro = {
                    "id": reg["id"],
                    "numero_guia": reg.get("numero_guia"),  # Mantém nome original para compatibilidade
                    "paciente_nome": reg.get("paciente_nome"), # Mantém nome original
                    "data_execucao": data_execucao,
                    "paciente_carteirinha": reg.get("paciente_carteirinha"), # Mantém nome original
                    "codigo_ficha": reg.get("codigo_ficha")
                }
                registros_formatados.append(registro)
            except Exception as e:
                print(f"Erro ao formatar registro: {e}")
                continue

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
    """Salva uma nova guia no banco de dados."""
    try:
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
            "tipo": dados.get("tipo", "sp_sadt"),
        }

        supabase.table("guias").upsert(
            guia_formatada, 
            on_conflict="numero_guia"
        ).execute()

        return True

    except Exception as e:
        print(f"Erro ao salvar guia: {str(e)}")
        return False

def listar_guias(
    limit: int = 100, 
    offset: int = 0, 
    paciente_nome: Optional[str] = None
) -> Dict:
    """Retorna todas as guias com suporte a paginação e filtro."""
    try:
        query = supabase.table("guias").select("*")

        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome}%")

        total = len(query.execute().data)

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

def buscar_guia(guia_id: str) -> List[Dict]:
    """Busca execuções específicas pelo número da guia"""
    try:
        response = (
            supabase.table("execucaos")
            .select("*")
            .eq("guia_id", guia_id)
            .execute()
        )

        return [
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
            for row in response.data
        ]

    except Exception as e:
        print(f"Erro ao buscar guia: {e}")
        return []

def limpar_banco() -> None:
    """Limpa a tabela de execucoes"""
    try:
        supabase.table("execucoes").delete().neq("id", 0).execute()
    except Exception as e:
        print(f"Erro ao limpar banco: {e}")

def salvar_ficha_presenca(info: Dict) -> Optional[str]:
    """Salva as informações da ficha de presença e suas sessões no Supabase."""
    try:
        # Validar dados obrigatórios
        if not all([info.get("codigo_ficha"), 
                    info.get("numero_guia"),
                    info.get("paciente_nome"),
                    info.get("paciente_carteirinha")]):
            logger.error("Dados obrigatórios faltando")
            return None

        # Verificar se já existe uma ficha com o mesmo código
        existing = (
            supabase.table("fichas_presenca")
            .select("id, codigo_ficha")
            .eq("codigo_ficha", info["codigo_ficha"])
            .execute()
        )

        if existing.data:
            # Se existe, atualiza a ficha existente
            ficha_id = existing.data[0]["id"]
            dados_ficha = {
                "numero_guia": info["numero_guia"],
                "paciente_nome": info["paciente_nome"].upper(),
                "paciente_carteirinha": info["paciente_carteirinha"],
                "arquivo_digitalizado": info.get("arquivo_digitalizado"),
                "observacoes": info.get("observacoes"),
                "status": "pendente",
                "data_atendimento": info.get("data_atendimento")
            }
            
            supabase.table("fichas_presenca").update(dados_ficha).eq("id", ficha_id).execute()

            # Atualizar sessões existentes
            if info.get("sessoes"):
                for sessao in info["sessoes"]:
                    sessao_data = {
                        "ficha_presenca_id": ficha_id,
                        "data_sessao": sessao.get("data_sessao"),
                        "possui_assinatura": sessao.get("possui_assinatura", False),
                        "status": "pendente"
                    }
                    supabase.table("sessoes").upsert(sessao_data).execute()

            return ficha_id
            
        else:
            # Se não existe, cria uma nova ficha
            ficha_id = str(uuid.uuid4())
            dados_ficha = {
                "id": ficha_id,
                "codigo_ficha": info["codigo_ficha"],
                "numero_guia": info["numero_guia"],
                "paciente_nome": info["paciente_nome"].upper(),
                "paciente_carteirinha": info["paciente_carteirinha"],
                "arquivo_digitalizado": info.get("arquivo_digitalizado"),
                "observacoes": info.get("observacoes"),
                "status": "pendente",
                "data_atendimento": info.get("data_atendimento")
            }
            
            response = supabase.table("fichas_presenca").insert(dados_ficha).execute()
            if not response.data:
                return None

            # Criar sessões para a nova ficha
            if info.get("sessoes"):
                for sessao in info["sessoes"]:
                    sessao_id = str(uuid.uuid4())
                    sessao_data = {
                        "id": sessao_id,
                        "ficha_presenca_id": ficha_id,
                        "data_sessao": sessao.get("data_sessao"),
                        "possui_assinatura": sessao.get("possui_assinatura", False),
                        "status": "pendente"
                    }

                    try:
                        # Criar sessão
                        supabase.table("sessoes").insert(sessao_data).execute()

                        # Criar execução correspondente
                        execucao_data = {
                            "id": str(uuid.uuid4()),
                            "sessao_id": sessao_id,
                            "data_execucao": sessao.get("data_sessao"),
                            "paciente_nome": info["paciente_nome"].upper(),
                            "paciente_carteirinha": info["paciente_carteirinha"],
                            "numero_guia": info["numero_guia"],
                            "codigo_ficha": info["codigo_ficha"]
                        }
                        supabase.table("execucoes").insert(execucao_data).execute()
                    except Exception as e:
                        logger.error(f"Erro ao criar sessão/execução: {e}")
                        continue
                
            return ficha_id

    except Exception as e:
        print(f"Erro ao salvar ficha de presença: {e}")
        traceback.print_exc()
        return None

def listar_fichas_presenca(
    limit: int = 100, 
    offset: int = 0,
    search: Optional[str] = None,  # Changed from paciente_nome to search
    status: Optional[str] = None,
    order: Optional[str] = None  # Added order parameter
) -> Dict:
    """Retorna as fichas de presença com suas sessões."""
    try:
        # Query base para fichas
        query = supabase.table("fichas_presenca").select(
            "*,sessoes(*)"  # Inclui todas as sessões relacionadas
        )

        # Aplica filtros
        if status and status != "todas":
            query = query.eq("status", status)

        if search:
            query = query.ilike("paciente_nome", f"%{search.upper()}%")

        # Aplica ordenação
        if order:
            field, direction = order.split('.')
            query = query.order(field, desc=(direction == 'desc'))
        else:
            query = query.order('created_at', desc=True)

        # Obtém contagem total antes da paginação
        total = len(query.execute().data)

        # Aplica paginação
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        response = query.execute()
        
        # Formata os dados
        fichas = []
        for ficha in response.data:
            sessoes = ficha.pop("sessoes", [])  # Remove e armazena sessões
            
            # Formata datas da ficha
            ficha["created_at"] = format_date(ficha.get("created_at"))
            ficha["updated_at"] = format_date(ficha.get("updated_at"))
            
            # Formata sessões
            sessoes_formatadas = []
            for sessao in sessoes:
                if sessao:  # Verifica se a sessão não é None
                    sessao["data_sessao"] = format_date(sessao.get("data_sessao"))
                    sessao["data_execucao"] = format_date(sessao.get("data_execucao"))
                    sessoes_formatadas.append(sessao)
            
            ficha["sessoes"] = sessoes_formatadas
            fichas.append(ficha)

        return {
            "fichas": fichas,
            "total": total,
            "total_pages": ceil(total / limit) if limit > 0 else 1,
        }

    except Exception as e:
        print(f"Erro ao listar fichas de presença: {e}")
        traceback.print_exc()
        return {"fichas": [], "total": 0, "total_pages": 1}

def format_date(date_str: Optional[str]) -> Optional[str]:
    """Formata uma data para o padrão DD/MM/YYYY."""
    if not date_str:
        return None
        
    try:
        if isinstance(date_str, str):
            if 'T' in date_str:
                date_str = date_str.split('T')[0]
            
            if '/' in date_str:
                return date_str
                
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            return date_obj.strftime('%d/%m/%Y')
            
        return date_str
        
    except Exception as e:
        print(f"Erro ao formatar data {date_str}: {e}")
        return date_str

def atualizar_status_ficha(id: str, novo_status: str) -> bool:
    """Atualiza o status de uma ficha e suas sessões."""
    try:
        # Atualiza a ficha
        ficha_response = (
            supabase.table("fichas_presenca")
            .update({"status": novo_status})
            .eq("id", id)
            .execute()
        )
        
        # Atualiza todas as sessões da ficha
        sessoes_response = (
            supabase.table("sessoes")
            .update({"status": novo_status})
            .eq("ficha_presenca_id", id)
            .execute()
        )
        
        return bool(ficha_response.data)
            
    except Exception as e:
        print(f"Erro ao atualizar status: {e}")
        traceback.print_exc()
        return False

def buscar_ficha_presenca(
    identificador: str, 
    tipo_busca: str = "codigo"
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
        campo = "id" if tipo_busca == "id" else "codigo_ficha"

        response = (
            supabase.table("fichas_presenca")
            .select("*")
            .eq(campo, identificador)
            .execute()
        )

        if not response.data:
            return None

        row = response.data[0]

        ficha = {
            "id": row["id"],
            "data_atendimento": row["data_atendimento"],
            "paciente_carteirinha": row["paciente_carteirinha"],
            "paciente_nome": row["paciente_nome"],
            "numero_guia": row["numero_guia"],
            "codigo_ficha": row["codigo_ficha"],
            "arquivo_digitalizado": row.get("arquivo_digitalizado"),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "possui_assinatura": False  # Valor default se não existir no banco
        }

        if ficha["data_atendimento"]:
            try:
                data = datetime.strptime(ficha["data_atendimento"], "%Y-%m-%d")
                ficha["data_atendimento"] = data.strftime("%d/%m/%Y")
            except ValueError:
                pass

        return ficha

    except Exception as e:
        print(f"Erro ao buscar ficha: {e}")
        return None

def excluir_ficha_presenca(id: str) -> bool:
    """
    Exclui uma ficha de presença e suas sessões associadas.
    """
    try:
        # Primeiro, exclui todas as sessões associadas
        supabase.table("sessoes").delete().eq("ficha_presenca_id", id).execute()
        
        # Depois, exclui a ficha
        response = supabase.table("fichas_presenca").delete().eq("id", id).execute()
        
        return bool(response.data)
        
    except Exception as e:
        print(f"Erro ao excluir ficha: {e}")
        traceback.print_exc()
        return False

def limpar_fichas_presenca() -> bool:
    """Limpa a tabela de fichas_presenca"""
    try:
        supabase.table("fichas_presenca").delete().gt(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()
        print("Tabela fichas_presenca limpa com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao limpar tabela fichas_presenca: {e}")
        return False

def listar_execucoes(
    limit: int = 100, 
    offset: int = 0, 
    paciente_nome: Optional[str] = None
) -> Dict:
    """Retorna todas as execuções com suporte a paginação e filtro."""
    try:
        query = supabase.table("execucoes").select("*")

        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")

        query = query.order("data_execucao", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        response = query.execute()
        execucoes = response.data

        for execucao in execucoes:
            if execucao.get("data_execucao"):
                try:
                    data = datetime.strptime(execucao["data_execucao"], "%Y-%m-%d")
                    execucao["data_execucao"] = data.strftime("%d/%m/%Y")
                except ValueError:
                    pass

        if limit > 0:
            total = len(supabase.table("execucoes").select("id").execute().data)
            return {
                "execucoes": execucoes,
                "total": total,
                "total_pages": (total + limit - 1) // limit,
            }

        return execucoes

    except Exception as e:
        print(f"Erro ao listar execuções: {e}")
        traceback.print_exc()
        return [] if limit == 0 else {"execucoes": [], "total": 0, "total_pages": 1}

def listar_pacientes(
    limit: int = 100, 
    offset: int = 0, 
    paciente_nome: Optional[str] = None
) -> Dict:
    """Retorna todos os pacientes com suporte a paginação e filtro."""
    try:
        query = supabase.table("pacientes").select("*")

        if paciente_nome:
            query = query.ilike("nome", f"%{paciente_nome.upper()}%")

        query = query.order("nome")
        response = query.execute()

        if not response.data:
            return {"items": [], "total": 0}

        return {"items": response.data, "total": len(response.data)}

    except Exception as e:
        print(f"Erro ao listar pacientes: {e}")
        traceback.print_exc()
        return {"items": [], "total": 0}

def listar_guias_paciente(paciente_id: str) -> Dict:
    """Lista todas as guias de um paciente específico e suas informações de plano."""
    try:
        paciente_query = (
            "*, "  # Dados do paciente
            "carteirinhas(*, "  # Dados da carteirinha
            "planos_saude(*))"  # Dados do plano de saúde
        )
        
        # Busca dados do paciente com carteirinhas e planos
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
        carteirinha = paciente["carteirinhas"][0] if paciente.get("carteirinhas") else None
        plano = None
        
        if carteirinha and carteirinha.get("planos_saude"):
            plano = carteirinha["planos_saude"]

        numero_carteirinha = carteirinha["numero_carteirinha"] if carteirinha else None
        if numero_carteirinha:
            # Busca as guias - quantidade_executada já vem do banco
            guias_response = (
                supabase.table("guias")
                .select("*")
                .eq("paciente_carteirinha", numero_carteirinha)
                .order("created_at", desc=True)
                .execute()
            )

            guias = [{
                **guia,
                "data_emissao": formatar_data(guia["data_emissao"]),
                "data_validade": formatar_data(guia["data_validade"])
            } for guia in guias_response.data]

            # Busca fichas de presença
            fichas_response = (
                supabase.table("fichas_presenca")
                .select("*")
                .eq("paciente_carteirinha", numero_carteirinha)
                .order("data_atendimento", desc=True)
                .execute()
            )

            fichas = [{
                **ficha,
                "data_atendimento": formatar_data(ficha["data_atendimento"]) 
                if ficha.get("data_atendimento") else None
            } for ficha in fichas_response.data]

            return {
                "items": guias,
                "total": len(guias),
                "plano": plano,
                "fichas": fichas
            }

        return {"items": [], "total": 0, "plano": None}

    except Exception as e:
        print(f"Erro ao listar guias do paciente: {e}")
        traceback.print_exc()
        return {"items": [], "total": 0, "plano": None}

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

def gerar_dados_teste() -> bool:
    """
    Gera dados de execução baseados nas fichas existentes, criando diversos tipos de divergências.
    """
    try:
        print("\n=== Iniciando geração de dados de teste ===")
        
        # Busca todas as fichas existentes
        fichas_response = supabase.table("fichas_presenca").select("*").execute()
        if not fichas_response.data:
            print("Nenhuma ficha encontrada para gerar dados")
            return False
        
        fichas = fichas_response.data
        total_fichas = len(fichas)
        print(f"Total de fichas encontradas: {total_fichas}")

        execucoes = []
        stats = {
            "total_execucoes": 0,
            "codigos_iguais": 0,
            "codigos_diferentes": 0,
            "sem_codigo": 0,
            "datas_diferentes": 0,
            "fichas_sem_execucao": 0
        }

        print("\nProcessando fichas e gerando execuções...")
        
        for ficha in fichas:
            tipo_divergencia = random.choices(
                ["normal", "codigo_diferente", "sem_codigo", "data_diferente", "sem_execucao"],
                weights=[70, 10, 10, 5, 5]  # 70% normais, 30% com divergências
            )[0]
            
            if tipo_divergencia == "sem_execucao":
                stats["fichas_sem_execucao"] += 1
                continue
                
            execucao = {
                "numero_guia": ficha["numero_guia"],
                "paciente_nome": ficha["paciente_nome"],
                "paciente_carteirinha": ficha["paciente_carteirinha"],
                "data_execucao": ficha["data_atendimento"],
            }
            
            if tipo_divergencia == "normal":
                execucao["codigo_ficha"] = ficha["codigo_ficha"]
                stats["codigos_iguais"] += 1
                
            elif tipo_divergencia == "codigo_diferente":
                codigo_original = ficha["codigo_ficha"]
                novo_codigo = f"{codigo_original[:-3]}{random.randint(100, 999)}"
                execucao["codigo_ficha"] = novo_codigo
                stats["codigos_diferentes"] += 1
                
            elif tipo_divergencia == "sem_codigo":
                execucao["codigo_ficha"] = None
                stats["sem_codigo"] += 1
                
            elif tipo_divergencia == "data_diferente":
                data_original = datetime.strptime(ficha["data_atendimento"], "%Y-%m-%d")
                dias_diferenca = random.randint(1, 5)
                nova_data = data_original + timedelta(days=dias_diferenca)
                execucao["data_execucao"] = nova_data.strftime("%Y-%m-%d")
                execucao["codigo_ficha"] = ficha["codigo_ficha"]
                stats["datas_diferentes"] += 1
            
            execucoes.append(execucao)
            stats["total_execucoes"] += 1

        # Limpa tabela de execuções existente
        print("\nLimpando tabela de execuções...")
        supabase.table("execucoes").delete().gt(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()
        
        # Insere as novas execuções em lotes
        print("\nInserindo execuções...")
        total_lotes = ceil(len(execucoes) / 100)
        for i in range(0, len(execucoes), 100):
            lote = execucoes[i:i+100]
            try:
                supabase.table("execucoes").insert(lote).execute()
                print(f"Processado lote {i//100 + 1} de {total_lotes}")
            except Exception as e:
                print(f"Erro ao processar lote: {e}")
                continue
        
        # Imprime estatísticas
        print("\n=== Estatísticas da geração ===")
        print(f"Total de fichas processadas: {total_fichas}")
        print(f"Total de execuções geradas: {stats['total_execucoes']}")
        print(f"Execuções com mesmo código: {stats['codigos_iguais']}")
        print(f"Execuções com código diferente: {stats['codigos_diferentes']}")
        print(f"Execuções sem código: {stats['sem_codigo']}")
        print(f"Execuções com data diferente: {stats['datas_diferentes']}")
        print(f"Fichas sem execução: {stats['fichas_sem_execucao']}")
        print("================================\n")
        
        return True
        
    except Exception as e:
        print(f"\nErro ao gerar dados de teste: {e}")
        traceback.print_exc()
        return False

# Funções auxiliares para Storage
def upload_arquivo_storage(arquivo_path: str, novo_nome: str) -> Optional[str]:
    """Faz upload de um arquivo para o Supabase Storage."""
    try:
        print(f"Iniciando upload do arquivo {novo_nome}")

        with open(arquivo_path, "rb") as f:
            arquivo = f.read()

        try:
            response = supabase.storage.from_("fichas_renomeadas").upload(
                path=novo_nome,
                file=arquivo,
                file_options={"content-type": "application/pdf"},
            )

        except Exception as upload_error:
            if "Duplicate" in str(upload_error):
                url = supabase.storage.from_("fichas_renomeadas").get_public_url(novo_nome)
                return url
            else:
                raise upload_error

        url = supabase.storage.from_("fichas_renomeadas").get_public_url(novo_nome)
        return url

    except Exception as e:
        print(f"Erro ao fazer upload do arquivo: {e}")
        traceback.print_exc()
        return None

def deletar_arquivos_storage(nomes_arquivos: list[str]) -> bool:
    """Deleta múltiplos arquivos do Storage."""
    try:
        bucket = "fichas_renomeadas"

        files = supabase.storage.from_(bucket).list()
        if not files:
            return True

        nomes_encontrados = [f["name"] for f in files if f["name"] in nomes_arquivos]
        if not nomes_encontrados:
            return True

        for nome in nomes_encontrados:
            try:
                supabase.storage.from_(bucket).remove(nome)
            except Exception as e:
                print(f"Erro ao deletar {nome}: {str(e)}")
                return False

        files_after = supabase.storage.from_(bucket).list()
        remaining_files = [f["name"] for f in files_after]
        failed_deletions = [nome for nome in nomes_encontrados if nome in remaining_files]

        if failed_deletions:
            print(f"Falha ao deletar os arquivos: {failed_deletions}")
            return False

        return True

    except Exception as e:
        print(f"Erro ao deletar arquivos: {str(e)}")
        traceback.print_exc()
        return False

def list_storage_files():
    """Lista todos os arquivos do bucket fichas_renomeadas."""
    try:
        response = supabase.storage.from_("fichas_renomeadas").list()
        return response
    except Exception as e:
        print(f"Erro em list_storage_files: {e}")
        return []
    

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

def verificar_formatos_data_banco():
    """Retorna uma amostra de datas de cada tabela para verificação"""
    try:
        amostras = {}
        
        # Verifica fichas_presenca
        fichas = supabase.table("fichas_presenca").select("id,data_atendimento").limit(5).execute()
        amostras["fichas_presenca"] = [(f["id"], f["data_atendimento"]) for f in fichas.data]
        
        # Verifica execucoes
        execucoes = supabase.table("execucoes").select("id,data_execucao").limit(5).execute()
        amostras["execucoes"] = [(e["id"], e["data_execucao"]) for e in execucoes.data]
        
        # Verifica divergencias 
        divergencias = supabase.table("divergencias").select("id,data_execucao,data_atendimento").limit(5).execute()
        amostras["divergencias"] = [(d["id"], d["data_execucao"], d["data_atendimento"]) for d in divergencias.data]
        
        return amostras
        
    except Exception as e:
        print(f"Erro ao verificar formatos: {e}")
        return None

def listar_divergencias(
    page: int = 1,
    per_page: int = 10,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    status: Optional[str] = None,
    tipo_divergencia: Optional[str] = None,
    prioridade: Optional[str] = None  # Added priority parameter
) -> Dict:
    """Lista divergências com filtros."""
    try:
        query = supabase.table("divergencias").select("*")

        # Aplica filtros
        if data_inicio:
            query = query.gte("data_identificacao", data_inicio)
        if data_fim:
            query = query.lte("data_identificacao", data_fim)
        if status and status != "todos":
            query = query.eq("status", status)
        if tipo_divergencia and tipo_divergencia != "todos":
            query = query.eq("tipo_divergencia", tipo_divergencia)
        if prioridade and prioridade != "todas":  # Added priority filter
            query = query.eq("prioridade", prioridade)

        # Ordenação por prioridade e data
        query = query.order("prioridade", desc=True).order("data_identificacao", desc=True)

        # Paginação
        total = len(query.execute().data)
        if per_page > 0:
            offset = (page - 1) * per_page
            query = query.range(offset, offset + per_page - 1)

        response = query.execute()

        # Formata datas
        divergencias = []
        for div in response.data:
            div["data_identificacao"] = formatar_data(div["data_identificacao"])
            div["data_execucao"] = formatar_data(div["data_execucao"])
            div["data_atendimento"] = formatar_data(div["data_atendimento"])
            div["data_resolucao"] = formatar_data(div["data_resolucao"])
            divergencias.append(div)

        return {
            "divergencias": divergencias,
            "total": total,
            "total_pages": ceil(total / per_page) if per_page > 0 else 1
        }

    except Exception as e:
        logging.error(f"Erro ao listar divergências: {e}")
        traceback.print_exc()
        return {"divergencias": [], "total": 0, "total_pages": 1}

def obter_estatisticas_gerais() -> Dict:
    """Retorna estatísticas gerais para o dashboard."""
    try:
        # Quantidade de guias
        guias = supabase.table("guias").select("count", count="exact").execute()
        total_guias = guias.count if guias else 0

        # Quantidade de carteirinhas ativas
        carteirinhas = supabase.table("carteirinhas").select("count", count="exact").eq("ativo", True).execute()
        total_carteirinhas = carteirinhas.count if carteirinhas else 0

        # Sessões autorizadas e executadas
        guias_stats = supabase.table("guias").select("quantidade_autorizada, quantidade_executada").execute()
        total_autorizadas = sum(g["quantidade_autorizada"] for g in guias_stats.data)
        total_executadas = sum(g["quantidade_executada"] for g in guias_stats.data)

        # Divergências pendentes
        divergencias = supabase.table("divergencias").select("count", count="exact").eq("status", "pendente").execute()
        total_divergencias = divergencias.count if divergencias else 0

        # Pacientes ativos (com carteirinha ativa)
        pacientes = supabase.table("pacientes").select("count", count="exact").execute()
        total_pacientes = pacientes.count if pacientes else 0

        return {
            "total_guias": total_guias,
            "total_carteirinhas": total_carteirinhas,
            "sessoes_autorizadas": total_autorizadas,
            "sessoes_executadas": total_executadas,
            "divergencias_pendentes": total_divergencias,
            "total_pacientes": total_pacientes,
            "taxa_execucao": round((total_executadas / total_autorizadas * 100) if total_autorizadas > 0 else 0, 2)
        }

    except Exception as e:
        print(f"Erro ao obter estatísticas: {e}")
        return {
            "total_guias": 0,
            "total_carteirinhas": 0,
            "sessoes_autorizadas": 0,
            "sessoes_executadas": 0,
            "divergencias_pendentes": 0,
            "total_pacientes": 0,
            "taxa_execucao": 0
        }

def obter_estatisticas_paciente(paciente_id: str) -> Dict:
    """Retorna estatísticas específicas de um paciente."""
    try:
        print(f"Buscando estatísticas para paciente {paciente_id}")
        
        # Busca paciente com carteirinhas
        paciente = (
            supabase.table("pacientes")
            .select("*, carteirinhas(*)")
            .eq("id", paciente_id)
            .execute()
        ).data[0]

        if not paciente:
            raise ValueError("Paciente não encontrado")
            
        carteirinhas = paciente.get("carteirinhas", [])
        carteirinha_atual = carteirinhas[0] if carteirinhas else None
        numero_carteirinha = carteirinha_atual["numero_carteirinha"] if carteirinha_atual else None

        print(f"Carteirinha encontrada: {numero_carteirinha}")

        if not numero_carteirinha:
            return {"error": "Paciente sem carteirinha"}

        # Busca guias
        guias = (
            supabase.table("guias")
            .select("*")
            .eq("paciente_carteirinha", numero_carteirinha)
            .execute()
        ).data

        print(f"Total de guias encontradas: {len(guias)}")

        # Estatísticas das guias
        guias_por_status = {"pendente": 0, "em_andamento": 0, "concluida": 0, "cancelada": 0}
        sessoes_autorizadas = 0
        sessoes_executadas = 0
        
        for guia in guias:
            status = guia["status"]
            guias_por_status[status] = guias_por_status.get(status, 0) + 1
            sessoes_autorizadas += guia["quantidade_autorizada"]
            sessoes_executadas += guia["quantidade_executada"]

        print(f"Sessões: {sessoes_executadas}/{sessoes_autorizadas}")
        
        # Busca divergências
        divergencias = (
            supabase.table("divergencias")
            .select("count")
            .eq("carteirinha", numero_carteirinha)
            .eq("status", "pendente")
            .execute()
        )

        resultado = {
            "total_carteirinhas": len(carteirinhas),
            "carteirinhas_ativas": len([c for c in carteirinhas if c["ativo"]]),
            "total_guias": len(guias),
            "guias_ativas": guias_por_status["pendente"] + guias_por_status["em_andamento"],
            "sessoes_autorizadas": sessoes_autorizadas,
            "sessoes_executadas": sessoes_executadas,
            "divergencias_pendentes": divergencias.count if divergencias else 0,
            "taxa_execucao": round((sessoes_executadas / sessoes_autorizadas * 100) if sessoes_autorizadas > 0 else 0, 2),
            "guias_por_status": guias_por_status
        }

        print("Estatísticas calculadas:", resultado)
        return resultado

    except Exception as e:
        print(f"Erro ao obter estatísticas do paciente: {e}")
        traceback.print_exc()
        return {
            "total_carteirinhas": 0,
            "carteirinhas_ativas": 0,
            "total_guias": 0,
            "guias_ativas": 0,
            "sessoes_autorizadas": 0,
            "sessoes_executadas": 0,
            "divergencias_pendentes": 0,
            "taxa_execucao": 0,
            "guias_por_status": {"pendente": 0, "em_andamento": 0, "concluida": 0, "cancelada": 0}
        }

def criar_guia(paciente_id: str, dados_guia: dict) -> bool:
    """
    Cria uma nova guia para um paciente.
    """
    try:
        # Busca o paciente com suas carteirinhas
        paciente = supabase.table("pacientes").select(
            "nome, carteirinhas(numero_carteirinha)"
        ).eq("id", paciente_id).execute()

        if not paciente.data:
            print("Paciente não encontrado")
            return False
            
        # Pega a primeira carteirinha do paciente
        carteirinha = None
        if paciente.data[0].get("carteirinhas"):
            carteirinha = paciente.data[0]["carteirinhas"][0]["numero_carteirinha"]
        
        if not carteirinha:
            print("Paciente não possui carteirinha")
            return False

        # Prepara os dados da guia
        nova_guia = {
            "id": str(uuid.uuid4()),
            "numero_guia": dados_guia["numero_guia"],
            "data_emissao": dados_guia["data_emissao"],
            "data_validade": dados_guia["data_validade"],
            "tipo": dados_guia.get("tipo", "consulta"),
            "status": dados_guia.get("status", "pendente"),
            "paciente_carteirinha": carteirinha,  # Use a carteirinha encontrada
            "paciente_nome": paciente.data[0]["nome"],
            "quantidade_autorizada": dados_guia["quantidade_autorizada"],
            "quantidade_executada": 0,
            "procedimento_nome": dados_guia.get("procedimento_nome")
        }

        # Insere a guia no banco
        response = supabase.table("guias").insert(nova_guia).execute()
        
        return bool(response.data)

    except Exception as e:
        print(f"Erro ao criar guia: {e}")
        return False

def atualizar_guia(guia_id: str, dados_guia: dict) -> bool:
    """
    Atualiza uma guia existente.
    """
    try:
        # Remove campos que não devem ser atualizados
        dados_atualizados = {
            "numero_guia": dados_guia["numero_guia"],
            "data_emissao": dados_guia["data_emissao"],
            "data_validade": dados_guia["data_validade"],
            "quantidade_autorizada": dados_guia["quantidade_autorizada"],
            "procedimento_nome": dados_guia.get("procedimento_nome"),
            "status": dados_guia.get("status", "pendente"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        response = supabase.table("guias").update(
            dados_atualizados
        ).eq("id", guia_id).execute()
        
        return bool(response.data)

    except Exception as e:
        print(f"Erro ao atualizar guia: {e}")
        return False

# ...rest of the file

def criar_plano(dados: Dict):
    """Cria um novo plano de saúde."""
    try:
        # Adiciona timestamps
        dados['created_at'] = datetime.now(timezone.utc).isoformat()
        dados['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        # Gera um UUID para o id
        dados['id'] = str(uuid.uuid4())
        
        response = supabase.table('planos_saude').insert(dados).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logging.error(f"Erro ao criar plano: {str(e)}")
        return None

def atualizar_plano(plano_id: str, dados: Dict):
    """Atualiza um plano de saúde existente."""
    try:
        dados['updated_at'] = datetime.now(timezone.utc).isoformat()
        response = supabase.table('planos_saude').update(dados).eq('id', plano_id).execute()
        if not response.data:
            raise ValueError("Plano não encontrado")
        return response.data[0]
    except Exception as e:
        logging.error(f"Erro ao atualizar plano: {str(e)}")
        raise

def deletar_plano(plano_id: str):
    """Deleta um plano de saúde."""
    try:
        response = supabase.table('planos_saude').delete().eq('id', plano_id).execute()
        if not response.data:
            raise ValueError("Plano não encontrado")
        return True
    except Exception as e:
        logging.error(f"Erro ao deletar plano: {str(e)}")
        raise

def listar_planos():
    """Lista todos os planos de saúde."""
    try:
        response = supabase.table('planos_saude').select('*').execute()
        return response.data
    except Exception as e:
        logging.error(f"Erro ao listar planos: {str(e)}")
        raise
