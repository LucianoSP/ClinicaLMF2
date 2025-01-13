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
    total_execucoes: int = 0,  # Changed from total_guias
    total_resolvidas: int = 0,
) -> bool:
    """Registra uma nova execução de auditoria com seus metadados."""
    try:
        logging.info("Registrando execução de auditoria")
        logging.info(f"Dados recebidos: {locals()}")
        
        # Generate UUID for the new record
        new_id = str(uuid.uuid4())
        
        # Handle empty date strings
        data_inicial = None if not data_inicial else data_inicial
        data_final = None if not data_final else data_final
        
        # Garantir que todos os tipos de divergência existam no dicionário
        tipos_base = {
            "execucao_sem_sessao": 0,
            "sessao_sem_execucao": 0,
            "data_divergente": 0,
            "sessao_sem_assinatura": 0,
            "guia_vencida": 0,
            "quantidade_excedida": 0,
            "duplicidade": 0
        }
        
        # Mesclar com os valores recebidos
        if divergencias_por_tipo:
            tipos_base.update(divergencias_por_tipo)

        data = {
            "id": new_id,
            "data_execucao": datetime.now(timezone.utc).isoformat(),
            "data_inicial": data_inicial,
            "data_final": data_final,
            "total_protocolos": total_protocolos,
            "total_divergencias": total_divergencias,
            "total_fichas": total_fichas,
            "total_execucoes": total_execucoes,  # Changed from total_guias
            "total_resolvidas": total_resolvidas,
            "divergencias_por_tipo": tipos_base,
            "status": "finalizado"
        }

        logging.info(f"Tentando inserir dados: {data}")
        
        try:
            # First, get all existing records
            existing_records = supabase.table("auditoria_execucoes").select("id").execute()
            
            # Then delete them one by one if they exist
            if existing_records.data:
                for record in existing_records.data:
                    try:
                        supabase.table("auditoria_execucoes").delete().eq("id", record["id"]).execute()
                        logging.info(f"Registro {record['id']} deletado com sucesso")
                    except Exception as del_error:
                        logging.warning(f"Erro ao deletar registro {record['id']}: {del_error}")
                        continue
            
            logging.info("Limpeza de registros anteriores concluída")
            
        except Exception as e:
            logging.warning(f"Erro ao limpar registros anteriores: {e}")
            # Continue with insert even if cleanup fails

        # Remove any empty string dates before insert
        insert_data = {k: v for k, v in data.items() if v != ""}
        
        # Insert new audit record
        response = supabase.table("auditoria_execucoes").insert(insert_data).execute()
        
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
    Busca divergências com suporte a paginação e filtros.
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
            # Handle data_identificacao separately since it's a timestamp
            if div.get("data_identificacao"):
                try:
                    dt = datetime.fromisoformat(div["data_identificacao"].replace("Z", "+00:00"))
                    div["data_identificacao"] = dt.strftime("%d/%m/%Y")
                except (ValueError, TypeError) as e:
                    logging.error(f"Data inválida em data_identificacao: {div['data_identificacao']}")
                    div["data_identificacao"] = None

            # Handle regular dates
            for campo in ["data_execucao", "data_atendimento", "data_resolucao"]:
                try:
                    if div.get(campo):
                        data = div[campo]
                        if isinstance(data, str):
                            if "T" in data:  # ISO format with time
                                data = data.split("T")[0]
                            elif "-" in data:  # YYYY-MM-DD format
                                # Ensure it's a valid date
                                datetime.strptime(data, "%Y-%m-%d")
                                # Convert to DD/MM/YYYY
                                div[campo] = datetime.strptime(data, "%Y-%m-%d").strftime("%d/%m/%Y")
                            elif "/" in data:  # Already in DD/MM/YYYY format
                                # Validate the date
                                datetime.strptime(data, "%d/%m/%Y")
                                div[campo] = data
                            else:
                                div[campo] = None
                    else:
                        div[campo] = None
                except (ValueError, TypeError) as e:
                    logging.error(f"Data inválida em {campo}: {div.get(campo)}")
                    div[campo] = None

        # Update divergencias missing data_atendimento
        divergencias_para_atualizar = [
            d for d in divergencias 
            if d.get("codigo_ficha") and (not d.get("ficha_id") or not d.get("data_atendimento"))
        ]
        
        if divergencias_para_atualizar:
            # Fetch ficha data
            codigos_ficha = list(set(d["codigo_ficha"] for d in divergencias_para_atualizar))
            fichas_response = (
                supabase.table("fichas_presenca")
                .select("id,codigo_ficha,data_atendimento")
                .in_("codigo_ficha", codigos_ficha)
                .execute()
            )
            
            # Create mapping
            fichas_map = {
                f["codigo_ficha"]: {
                    "id": f["id"],
                    "data_atendimento": f["data_atendimento"]
                }
                for f in fichas_response.data or []
            }
            
            # Update divergencias
            for div in divergencias:
                if div.get("codigo_ficha") in fichas_map:
                    ficha_data = fichas_map[div["codigo_ficha"]]
                    
                    # Update in database
                    update_data = {
                        "ficha_id": ficha_data["id"],
                        "data_atendimento": ficha_data["data_atendimento"]
                    }
                    
                    try:
                        response = (
                            supabase.table("divergencias")
                            .update(update_data)
                            .eq("id", div["id"])
                            .execute()
                        )
                        
                        if response.data:
                            # Update local object
                            div.update(update_data)
                            if div["data_atendimento"]:
                                # Format date to DD/MM/YYYY
                                div["data_atendimento"] = datetime.strptime(
                                    div["data_atendimento"], "%Y-%m-%d"
                                ).strftime("%d/%m/%Y")
                    except Exception as e:
                        logging.error(f"Erro ao atualizar divergência {div['id']}: {e}")

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
    """Registra uma divergência com detalhes específicos."""
    try:
        tipo = divergencia["tipo_divergencia"]
        paciente_nome = divergencia.get("paciente_nome", "PACIENTE NÃO IDENTIFICADO")
        numero_guia = divergencia.get("numero_guia", "SEM_GUIA")
        
        # Mantém as datas no formato original (YYYY-MM-DD) do banco
        data_atendimento = divergencia.get("data_atendimento")
        data_execucao = divergencia.get("data_execucao")

        # Log das datas para debug
        logging.info(f"Datas recebidas - data_atendimento: {data_atendimento}, data_execucao: {data_execucao}")
        
        # Base comum para todos os tipos de divergência
        dados = {
            "numero_guia": numero_guia,
            "tipo_divergencia": tipo,
            "paciente_nome": paciente_nome,
            "codigo_ficha": divergencia.get("codigo_ficha"),
            "data_atendimento": data_atendimento,  # Mantém o formato YYYY-MM-DD
            "data_execucao": data_execucao,  # Mantém o formato YYYY-MM-DD
            "carteirinha": divergencia.get("carteirinha"),
            "prioridade": divergencia.get("prioridade", "MEDIA"),
            "status": divergencia.get("status", "pendente"),
            "descricao": divergencia.get("descricao", "Sem descrição"),
            "detalhes": divergencia.get("detalhes"),
            "ficha_id": divergencia.get("ficha_id"),
            "execucao_id": divergencia.get("execucao_id")
        }

        # Remove campos None para evitar erro de tipo no banco
        dados = {k: v for k, v in dados.items() if v is not None}

        # Log dos dados antes do insert para debug
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
        
        # Simplify the deletion process
        response = (
            supabase.table("divergencias")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")  # Changed from gt to neq
            .execute()
        )
        
        print("Tabela divergencias limpa com sucesso!")
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
        # Validação de campos obrigatórios
        if not all([numero_guia, tipo_divergencia, descricao, paciente_nome]):
            logging.error("Campos obrigatórios faltando")
            return False

        # Improved date parsing function
        def parse_date(date_str):
            if not date_str:
                return None
            try:
                # If already in YYYY-MM-DD format
                if isinstance(date_str, str):
                    if len(date_str) == 10 and "-" in date_str:
                        # Validate date format
                        datetime.strptime(date_str, "%Y-%m-%d")
                        return date_str

                    # If in DD/MM/YYYY format
                    if "/" in date_str:
                        day, month, year = date_str.split("/")
                        # Convert to YYYY-MM-DD
                        date_obj = datetime(int(year), int(month), int(day))
                        return date_obj.strftime("%Y-%m-%d")

                    # If timestamp, extract just the date
                    if "T" in date_str:
                        return date_str.split("T")[0]

                return None
            except Exception as e:
                logging.error(f"Erro ao parsear data: {date_str} - {str(e)}")
                return None

        # Enhanced debug logging for ficha data lookup
        if codigo_ficha:
            try:
                logging.info(f"Buscando ficha com código: {codigo_ficha}")
                
                # First check if ficha exists
                ficha_exists_response = (
                    supabase.table("fichas_presenca")
                    .select("count", count="exact")
                    .eq("codigo_ficha", codigo_ficha)
                    .execute()
                )
                
                total_fichas = ficha_exists_response.count
                logging.info(f"Total de fichas encontradas: {total_fichas}")

                # Then get the actual data
                ficha_response = (
                    supabase.table("fichas_presenca")
                    .select("*")  # Select all fields for better debugging
                    .eq("codigo_ficha", codigo_ficha)
                    .execute()
                )
                
                if ficha_response.data:
                    ficha = ficha_response.data[0]
                    logging.info(f"Dados da ficha encontrada: {ficha}")
                    
                    data_atendimento = ficha.get("data_atendimento")
                    if data_atendimento:
                        logging.info(f"Data de atendimento encontrada: {data_atendimento}")
                    else:
                        logging.warning("Data de atendimento não encontrada na ficha")
                        
                    carteirinha = ficha.get("paciente_carteirinha")
                    if carteirinha:
                        logging.info(f"Carteirinha encontrada: {carteirinha}")
                    else:
                        logging.warning("Carteirinha não encontrada na ficha")
                        
                    # Get ficha_id for linking
                    ficha_id = ficha.get("id")
                    if ficha_id:
                        logging.info(f"ID da ficha encontrado: {ficha_id}")
                    else:
                        logging.warning("ID da ficha não encontrado")
                    
                else:
                    logging.warning(f"Nenhuma ficha encontrada com código: {codigo_ficha}")
                    
            except Exception as e:
                logging.error(f"Erro ao buscar dados da ficha: {str(e)}")
                logging.error(traceback.format_exc())

        # Format data_identificacao to be just the date part
        data_identificacao = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Dados base da divergência
        dados = {
            "numero_guia": numero_guia,
            "tipo_divergencia": tipo_divergencia,
            "descricao": descricao,
            "paciente_nome": paciente_nome.upper(),
            "status": status,
            "data_identificacao": data_identificacao,
            "prioridade": prioridade,
            "codigo_ficha": codigo_ficha,
            "data_execucao": parse_date(data_execucao),
            "data_atendimento": parse_date(data_atendimento),
            "carteirinha": carteirinha,
            "detalhes": detalhes,
            "ficha_id": ficha_id if 'ficha_id' in locals() else None,
            "execucao_id": execucao_id
        }

        # Log full data before insert
        logging.info(f"Dados completos antes do insert: {dados}")

        # Remove None values but keep empty strings for text fields
        dados = {k: (v if v is not None else '') for k, v in dados.items() 
                if k in ['carteirinha', 'codigo_ficha'] or v is not None}

        # Log final data to be inserted
        logging.info(f"Dados finais para insert: {dados}")

        # Insere no banco
        response = supabase.table("divergencias").insert(dados).execute()
        
        if response.data:
            logging.info(f"Divergência registrada com sucesso: {response.data[0]}")
            return True
        else:
            logging.error("Erro: Resposta vazia do Supabase")
            return False

    except Exception as e:
        logging.error(f"Erro ao registrar divergência: {e}")
        traceback.print_exc()
        return False

def atualizar_ficha_ids_divergencias(divergencias: Optional[List[Dict]] = None) -> bool:
    """
    Atualiza os ficha_ids e data_atendimento nas divergências.
    """
    try:
        if divergencias == None:
            # Busca divergências sem ficha_id
            response = (
                supabase.table("divergencias")
                .select("*")
                .is_("ficha_id", "null")
                .not_.is_("codigo_ficha", "null")
                .execute()
            )
            divergencias = response.data if response.data else []

        if not divergencias:
            logging.info("Nenhuma divergência para atualizar")
            return True

        # Get unique codigo_ficha values
        codigos_ficha = list(set(
            div["codigo_ficha"] 
            for div in divergencias 
            if div.get("codigo_ficha")
        ))
        
        if not codigos_ficha:
            return True

        # Include data_atendimento in the select
        fichas_response = (
            supabase.table("fichas_presenca")
            .select("id,codigo_ficha,data_atendimento")  # Added data_atendimento
            .in_("codigo_ficha", codigos_ficha)
            .execute()
        )
        
        # Map both id and data_atendimento
        mapa_fichas = {
            f["codigo_ficha"]: {
                "id": f["id"],
                "data_atendimento": f["data_atendimento"]
            }
            for f in fichas_response.data or []
        }

        count = 0
        for div in divergencias:
            if div.get("codigo_ficha") in mapa_fichas:
                ficha_data = mapa_fichas[div["codigo_ficha"]]
                try:
                    # Update both ficha_id and data_atendimento
                    response = (
                        supabase.table("divergencias")
                        .update({
                            "ficha_id": ficha_data["id"],
                            "data_atendimento": ficha_data["data_atendimento"]
                        })
                        .eq("id", div["id"])
                        .execute()
                    )
                    if response.data:
                        count += 1
                except Exception as e:
                    logging.error(f"Erro ao atualizar divergência {div['id']}: {e}")
                    continue

        logging.info(f"Atualizadas {count} divergências com ficha_id e data_atendimento")
        return True

    except Exception as e:
        logging.error(f"Erro ao atualizar ficha_ids: {str(e)}")
        traceback.print_exc()
        return False







