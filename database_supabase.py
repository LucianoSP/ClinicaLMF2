from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from config import supabase
from math import ceil
import logging
import traceback
import uuid
import random

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
                "numero_guia": str(registro["guia_id"]),
                "paciente_nome": str(registro["paciente_nome"]).upper(),
                "data_execucao": registro["data_execucao"],
                "paciente_carteirinha": str(registro["paciente_carteirinha"]),
                "paciente_id": id_para_uuid[str(registro["paciente_id"])],
                "codigo_ficha": None,
            }
            for registro in registros
        ]

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
        query = supabase.table("execucoes").select("*")

        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")

        count_response = query.execute()
        total = len(count_response.data)

        query = query.order("created_at", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        response = query.execute()
        registros = response.data

        registros_formatados = [
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
            for reg in registros
        ]

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
    """Salva as informações da ficha de presença no Supabase."""
    try:
        dados = {
            "data_atendimento": info["data_atendimento"],
            "paciente_carteirinha": info["paciente_carteirinha"],
            "paciente_nome": info["paciente_nome"].upper(),
            "numero_guia": info["numero_guia"],
            "codigo_ficha": info["codigo_ficha"],
            "possui_assinatura": info.get("possui_assinatura", False),
            "arquivo_digitalizado": info.get("arquivo_digitalizado"),
            "status": "pendente"
        }

        response = supabase.table("fichas_presenca").insert(dados).execute()

        if response.data:
            return response.data[0].get("id")
        return None

    except Exception as e:
        print(f"Erro ao salvar ficha de presença: {e}")
        traceback.print_exc()
        return None

def listar_fichas_presenca(
    limit: int = 100, 
    offset: int = 0, 
    paciente_nome: Optional[str] = None,
    status: Optional[str] = None
) -> Dict:
    """Retorna as fichas de presença com suporte a paginação e filtros."""
    try:
        query = supabase.table("fichas_presenca").select("*")

        if status and status.lower() != "todas":
            query = query.eq("status", status.lower())

        if paciente_nome and isinstance(paciente_nome, str):
            query = query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")

        count_response = query.execute()
        total = len(count_response.data)

        query = query.order("data_atendimento", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        response = query.execute()
        fichas = response.data

        for ficha in fichas:
            if ficha.get("data_atendimento"):
                try:
                    data = datetime.strptime(ficha["data_atendimento"], "%Y-%m-%d")
                    ficha["data_atendimento"] = data.strftime("%d/%m/%Y")
                except ValueError:
                    pass

        return {
            "fichas": fichas,
            "total": total,
            "total_pages": ceil(total / limit) if limit > 0 else 1,
        }

    except Exception as e:
        print(f"Erro ao listar fichas de presença: {e}")
        traceback.print_exc()
        return {"fichas": [], "total": 0, "total_pages": 1}

def atualizar_status_ficha(id: str, novo_status: str) -> bool:
    """
    Atualiza o status de uma ficha de presença.
    
    Args:
        id: ID da ficha
        novo_status: Novo status ('pendente' ou 'conferida')
        
    Returns:
        bool indicando sucesso da operação
    """
    try:
        response = (
            supabase.table("fichas_presenca")
            .update({"status": novo_status})
            .eq("id", id)
            .execute()
        )
        
        if response.data:
            print(f"Status da ficha {id} atualizado para {novo_status}")
            return True
        else:
            print("Erro: Resposta vazia do Supabase")
            return False
            
    except Exception as e:
        print(f"Erro ao atualizar status da ficha: {e}")
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
            "possui_assinatura": bool(row["possui_assinatura"]),
            "arquivo_digitalizado": row.get("arquivo_digitalizado"),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
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
    Exclui uma ficha de presença e seu arquivo digitalizado associado.

    Args:
        id: ID (UUID) da ficha a ser excluída

    Returns:
        bool indicando sucesso da operação
    """
    try:
        ficha = buscar_ficha_presenca(id, tipo_busca="id")
        if not ficha:
            print(f"Ficha não encontrada para exclusão: {id}")
            return False

        arquivo_digitalizado = ficha.get("arquivo_digitalizado")
        if arquivo_digitalizado:
            try:
                nome_arquivo = arquivo_digitalizado.split("/")[-1]
                deletar_arquivos_storage([nome_arquivo])
            except Exception as e:
                print(f"Erro ao excluir arquivo digitalizado: {e}")

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
        
        # Corrigido o operador && para and
        if carteirinha and carteirinha.get("planos_saude"):
            plano = carteirinha["planos_saude"]

        numero_carteirinha = carteirinha["numero_carteirinha"] if carteirinha else None
        if numero_carteirinha:
            guias_response = (
                supabase.table("guias")
                .select("*")
                .eq("paciente_carteirinha", numero_carteirinha)
                .order("created_at", desc=True)
                .execute()
            )

            guias = [
                {
                    **guia,
                    "data_emissao": formatar_data(guia["data_emissao"]) if guia.get("data_emissao") else None,
                    "data_validade": formatar_data(guia["data_validade"]) if guia.get("data_validade") else None
                }
                for guia in guias_response.data
            ]

            # Buscar fichas de presença
            fichas_response = (
                supabase.table("fichas_presenca")
                .select("*")
                .eq("paciente_carteirinha", numero_carteirinha)
                .order("data_atendimento", desc=True)
                .execute()
            )

            fichas = [
                {
                    **ficha,
                    "data_atendimento": formatar_data(ficha["data_atendimento"]) if ficha.get("data_atendimento") else None
                }
                for ficha in fichas_response.data
            ]

            return {
                "items": guias,
                "total": len(guias),
                "plano": plano,
                "fichas": fichas
            }
        else:
            print("Nenhuma carteirinha encontrada para o paciente")
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
