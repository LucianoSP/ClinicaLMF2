from typing import Dict, List, Optional
from datetime import datetime, timezone
import logging
import traceback
from config import supabase
from math import ceil
import uuid
from database_supabase import formatar_data  # Remove circular imports

# Configuração de logging
logging.basicConfig(level=logging.INFO)

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
    """Calcula estatísticas das divergências para os cards"""
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
        return {
            "total": 0,
            "por_tipo": {},
            "por_prioridade": {"ALTA": 0, "MEDIA": 0},
            "por_status": {"pendente": 0, "em_analise": 0, "resolvida": 0},
        }

def buscar_divergencias_view(
    page: int = 1,
    per_page: int = 10,
    status: Optional[str] = None,
    paciente_nome: Optional[str] = None,
    tipo_divergencia: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None
) -> Dict:
    """
    Busca divergências. Tenta usar a view materializada, mas se não existir usa a tabela divergencias.
    """
    try:
        # Calcula offset para paginação
        offset = (page - 1) * per_page
        
        # Inicia query na tabela divergencias ao invés da view
        query = supabase.table("divergencias").select("*")
        
        # Aplica filtros
        if status and status.lower() != "todos":
            query = query.eq("status", status.lower())
            
        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")
            
        if tipo_divergencia and tipo_divergencia.lower() != "todos":
            query = query.eq("tipo_divergencia", tipo_divergencia)
            
        if data_inicio:
            query = query.gte("data_execucao", data_inicio)
            
        if data_fim:
            query = query.lte("data_execucao", data_fim)
        
        # Ordena por data de identificação (mais recentes primeiro)
        query = query.order("created_at", desc=True)
        
        # Busca total de registros com os mesmos filtros
        total_query = supabase.table("divergencias").select("id", count="exact")
        
        # Aplica os mesmos filtros na query de contagem
        if status and status.lower() != "todos":
            total_query = total_query.eq("status", status.lower())
        if paciente_nome:
            total_query = total_query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")
        if tipo_divergencia and tipo_divergencia.lower() != "todos":
            total_query = total_query.eq("tipo_divergencia", tipo_divergencia)
        if data_inicio:
            total_query = total_query.gte("data_execucao", data_inicio)
        if data_fim:
            total_query = total_query.lte("data_execucao", data_fim)
        
        # Executa a query de contagem
        total_response = total_query.execute()
        total_registros = total_response.count if total_response.count is not None else len(total_response.data)
        
        # Aplica paginação na query principal
        query = query.range(offset, offset + per_page - 1)
        
        # Executa a query principal
        response = query.execute()
        divergencias = response.data if response.data else []
        
        # Formata datas para exibição
        for div in divergencias:
            for campo in ["data_execucao", "data_atendimento", "data_identificacao", "data_resolucao"]:
                if div.get(campo):
                    div[campo] = formatar_data(div[campo])
        
        # Atualiza ficha_ids se necessário usando a nova função
        divergencias_sem_ficha = [
            d for d in divergencias 
            if d.get("codigo_ficha") and not d.get("ficha_id")
        ]
        
        if divergencias_sem_ficha:
            atualizar_ficha_ids_divergencias(divergencias_sem_ficha)
        
        return {
            "divergencias": divergencias,
            "total": total_registros,
            "pagina_atual": page,
            "total_paginas": ceil(total_registros / per_page) if total_registros > 0 else 0,
            "por_pagina": per_page
        }
        
    except Exception as e:
        logging.error(f"Erro ao buscar divergências: {str(e)}")
        logging.error(traceback.format_exc())
        return {
            "divergencias": [],
            "total": 0,
            "pagina_atual": page,
            "total_paginas": 0,
            "por_pagina": per_page
        }

def registrar_divergencia_detalhada(divergencia: Dict) -> bool:
    """
    Registra uma divergência com detalhes específicos.
    Nunca preenche data_execucao automaticamente.
    """
    try:
        tipo = divergencia["tipo_divergencia"]
        paciente_nome = divergencia.get("paciente_nome", "PACIENTE NÃO IDENTIFICADO")
        numero_guia = divergencia.get("numero_guia", "SEM_GUIA")
        
        # Base comum para todos os tipos de divergência
        dados_base = {
            "numero_guia": numero_guia,
            "paciente_nome": paciente_nome,
            "codigo_ficha": divergencia.get("codigo_ficha"),
            "data_atendimento": divergencia.get("data_atendimento"),
            "prioridade": divergencia.get("prioridade", "MEDIA"),
            "carteirinha": divergencia.get("carteirinha"),
            "detalhes": divergencia.get("detalhes"),
            "ficha_id": divergencia.get("ficha_id"),
            "execucao_id": divergencia.get("execucao_id"),
        }
        
        # Se não tem data_execucao
        if not divergencia.get("data_execucao"):
            dados = {
                **dados_base,
                "tipo_divergencia": "falta_data_execucao",
                "descricao": "Data de execução não informada",
                "prioridade": "ALTA",
            }
        else:
            # Caso tenha data_execucao
            dados = {
                **dados_base,
                "tipo_divergencia": tipo,
                "descricao": divergencia["descricao"],
                "data_execucao": divergencia["data_execucao"],
            }

        # Remove campos None para evitar erro de tipo no banco
        dados = {k: v for k, v in dados.items() if v is not None}

        logging.info(f"Registrando divergência: {dados}")
        return registrar_divergencia(**dados)

    except Exception as e:
        logging.error(f"Erro ao registrar divergência detalhada: {e}")
        traceback.print_exc()
        return False

def limpar_divergencias_db() -> bool:
    """Limpa a tabela de divergências"""
    try:
        print("Iniciando limpeza da tabela divergencias...")
        
        # Primeiro tenta remover dependências da view
        try:
            # Desabilita temporariamente a trigger de refresh da view
            supabase.rpc('disable_view_refresh_trigger').execute()
            
            # Agora tenta deletar os registros
            response = (
                supabase.table("divergencias")
                .delete()
                .gt("id", "00000000-0000-0000-0000-000000000000")
                .execute()
            )
            
            # Reabilita a trigger
            supabase.rpc('enable_view_refresh_trigger').execute()
            
            print("Tabela divergencias limpa com sucesso!")
            return True
            
        except Exception as view_error:
            print(f"Erro ao manipular view: {view_error}")
            # Tenta fazer o delete mesmo assim
            response = (
                supabase.table("divergencias")
                .delete()
                .gt("id", "00000000-0000-0000-0000-000000000000")
                .execute()
            )
            return True
            
    except Exception as e:
        print(f"Erro ao limpar tabela divergencias: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return False

def atualizar_status_divergencia(
    id: str, novo_status: str, usuario_id: Optional[str] = None
) -> bool:
    """Atualiza o status de uma divergência e da ficha relacionada"""
    try:
        print(f"Tentando atualizar divergência {id} para status: {novo_status}")

        # Primeiro busca a divergência para obter o ficha_id
        divergencia = supabase.table("divergencias").select("*").eq("id", id).execute()
        
        if not divergencia.data:
            print("Divergência não encontrada")
            return False
            
        ficha_id = divergencia.data[0].get("ficha_id")
        
        # Atualiza o status da divergência
        dados = {
            "status": novo_status,
            "data_resolucao": (
                datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                if novo_status != "pendente"
                else None
            ),
            "resolvido_por": usuario_id if novo_status != "pendente" else None,
        }
        
        response = supabase.table("divergencias").update(dados).eq("id", id).execute()
        
        # Se a divergência foi resolvida e temos um ficha_id, atualiza a ficha
        if novo_status == "resolvida" and ficha_id:
            print(f"Atualizando status da ficha {ficha_id} para conferida")
            ficha_response = (
                supabase.table("fichas_presenca")
                .update({"status": "conferida"})
                .eq("id", ficha_id)
                .execute()
            )
            if not ficha_response.data:
                print("Erro ao atualizar status da ficha")
        
        return True

    except Exception as e:
        print(f"Erro ao atualizar status da divergência: {e}")
        traceback.print_exc()
        return False

def obter_ultima_auditoria() -> Dict:
    """Obtém o resultado da última auditoria realizada"""
    try:
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
    Lista divergências com paginação e filtros usando a view materializada.
    """
    return buscar_divergencias_view(
        page=page,
        per_page=per_page,
        data_inicio=data_inicio,
        data_fim=data_fim,
        status=status,
        tipo_divergencia=tipo_divergencia,
        paciente_nome=None  # Mantém compatibilidade com a interface existente
    )


def registrar_divergencia(
    numero_guia: str,
    tipo_divergencia: str,
    descricao: str,
    paciente_nome: str,
    codigo_ficha: str = None,
    data_execucao: str = None,
    data_atendimento: str = None,
    carteirinha: str = None,
    prioridade: str = "MEDIA",
    status: str = "pendente",
    detalhes: Dict = None,
    ficha_id: str = None,
    execucao_id: str = None
) -> bool:
    """Registra uma nova divergência."""
    try:
        dados = {
            "numero_guia": numero_guia,
            "tipo_divergencia": tipo_divergencia,
            "descricao": descricao,
            "status": status,
            "data_identificacao": datetime.now(timezone.utc).isoformat(),
            "paciente_nome": paciente_nome,
            "prioridade": prioridade
        }

        campos_opcionais = {
            "codigo_ficha": codigo_ficha,
            "data_execucao": data_execucao,
            "data_atendimento": data_atendimento,
            "carteirinha": carteirinha,
            "detalhes": detalhes,
            "ficha_id": ficha_id,
            "execucao_id": execucao_id
        }

        for campo, valor in campos_opcionais.items():
            if valor is not None:
                dados[campo] = valor

        supabase.table("divergencias").insert(dados).execute()
        return True

    except Exception as e:
        print(f"Erro ao registrar divergência: {e}")
        traceback.print_exc()
        return False

def atualizar_ficha_ids_divergencias(divergencias: Optional[List[Dict]] = None) -> bool:
    """
    Atualiza os ficha_ids nas divergências.
    Se nenhuma divergência for fornecida, busca todas as pendentes.
    """
    try:
        if divergencias == None:
            response = (
                supabase.table("divergencias")
                .select("*")
                .is_("ficha_id", "null")
                .not_("codigo_ficha", "is", "null")
                .execute()
            )
            divergencias = response.data if response.data else []

        if not divergencias:
            logging.info("Nenhuma divergência para atualizar")
            return True

        codigos_ficha = list(set(
            div["codigo_ficha"] 
            for div in divergencias 
            if div.get("codigo_ficha")
        ))
        
        if not codigos_ficha:
            return True

        fichas_response = (
            supabase.table("fichas_presenca")
            .select("id,codigo_ficha")
            .in_("codigo_ficha", codigos_ficha)
            .execute()
        )
        
        mapa_fichas = {
            f["codigo_ficha"]: f["id"] 
            for f in fichas_response.data or []
        }

        count = 0
        for div in divergencias:
            if div.get("codigo_ficha") in mapa_fichas:
                ficha_id = mapa_fichas[div["codigo_ficha"]]
                try:
                    response = (
                        supabase.table("divergencias")
                        .update({"ficha_id": ficha_id})
                        .eq("id", div["id"])
                        .execute()
                    )
                    if response.data:
                        count += 1
                except Exception as e:
                    logging.error(f"Erro ao atualizar divergência {div['id']}: {e}")
                    continue

        logging.info(f"Atualizadas {count} divergências com ficha_id")
        return True

    except Exception as e:
        logging.error(f"Erro ao atualizar ficha_ids: {str(e)}")
        traceback.print_exc()
        return False



