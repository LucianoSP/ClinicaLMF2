from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
import traceback
from fastapi import APIRouter, HTTPException

# Add this import
from config import supabase

# Imports do database_supabase
from database_supabase import (listar_fichas_presenca, listar_execucoes,
                               listar_guias, formatar_data)

# Imports do auditoria_repository
from auditoria_repository import (
    registrar_execucao_auditoria,
    buscar_divergencias_view,
    obter_ultima_auditoria,
    atualizar_status_divergencia,
    calcular_estatisticas_divergencias,
    registrar_divergencia_detalhada,
    registrar_divergencia,
    limpar_divergencias_db,
    listar_divergencias,
    atualizar_ficha_ids_divergencias  # Movido para cá
)

# Configuração de logging
logging.basicConfig(level=logging.INFO)

# Criar router com prefixo
router = APIRouter(prefix="/divergencias", tags=["divergencias"])


def verificar_datas(protocolo: Dict, execucao: Dict) -> bool:
    """Verifica se as datas do protocolo e execucao correspondem"""
    try:
        data_protocolo = datetime.strptime(protocolo["dataExec"], "%d/%m/%Y")
        data_execucao = datetime.strptime(execucao["data_execucao"],
                                          "%d/%m/%Y")
        return data_protocolo == data_execucao
    except ValueError as e:
        logging.error(f"Erro ao comparar datas: {e}")
        return False


def verificar_quantidade_execucaos(protocolo: Dict,
                                   execucaos: List[Dict]) -> bool:
    """Verifica se a quantidade de execucaos corresponde ao protocolo"""
    try:
        qtd_protocolo = int(protocolo.get("quantidade", 1))
        return len(execucaos) == qtd_protocolo
    except ValueError as e:
        logging.error(f"Erro ao comparar quantidades: {e}")
        return False


def formatar_data_iso(data_str: str) -> str:
    """
    Converte uma data no formato YYYY-MM-DD para DD/MM/YYYY
    """
    try:
        data = datetime.strptime(data_str, "%Y-%m-%d")
        return data.strftime("%d/%m/%Y")
    except ValueError:
        return data_str


def verificar_validade_guia(guia: Dict) -> bool:
    """
    Verifica se a guia está dentro do prazo de validade.

    Args:
        guia: Dicionário contendo os dados da guia

    Returns:
        bool: True se a guia está válida, False caso contrário
    """
    try:
        if not guia.get("data_validade"):
            return True

        data_validade = datetime.strptime(guia["data_validade"], "%Y-%m-%d")
        return datetime.now() <= data_validade
    except ValueError as e:
        logging.error(f"Erro ao verificar validade da guia: {e}")
        return False


def verificar_quantidade_autorizada(guia: Dict) -> bool:
    """
    Verifica se a quantidade executada não excede a autorizada na guia.

    Args:
        guia: Dicionário contendo os dados da guia

    Returns:
        bool: True se a quantidade está dentro do limite, False caso contrário
    """
    try:
        qtd_autorizada = int(guia.get("quantidade_autorizada", 0))
        qtd_executada = int(guia.get("quantidade_executada", 0))
        return qtd_executada <= qtd_autorizada
    except ValueError as e:
        logging.error(f"Erro ao verificar quantidade autorizada: {e}")
        return False


def realizar_auditoria(data_inicial: Optional[str] = None,
                       data_final: Optional[str] = None) -> bool:
    """
    Realiza a auditoria das fichas vs execuções
    """
    try:
        logging.info(
            f"Iniciando auditoria com data_inicial={data_inicial}, data_final={data_final}"
        )
        logging.info(
            "Iniciando processo de auditoria de fichas vs execuções...")

        # Limpa divergências antigas
        print("Iniciando limpeza da tabela divergencias...")
        if not limpar_divergencias_db():
            logging.error("Erro ao limpar divergências antigas")
            return False
        print("Tabela divergencias limpa com sucesso!")

        # Busca fichas e execuções
        fichas = listar_fichas_presenca(limit=0)
        execucoes = listar_execucoes(limit=0)

        logging.info(f"Total de fichas a serem auditadas: {len(fichas)}")
        logging.info(f"Total de execuções a serem auditadas: {len(execucoes)}")

        # Mapeia fichas por número da guia para facilitar a busca
        fichas_por_guia = {ficha.get("numero_guia"): ficha for ficha in fichas}
        execucoes_por_guia = {
            exec.get("numero_guia"): exec
            for exec in execucoes
        }

        # Verifica execuções sem ficha
        for execucao in execucoes:
            numero_guia = execucao.get("numero_guia")
            if not fichas_por_guia.get(numero_guia):
                registrar_divergencia(
                    numero_guia=numero_guia,
                    data_execucao=execucao.get("data_execucao"),
                    codigo_ficha=execucao.get("codigo_ficha"),
                    tipo_divergencia="execucao_sem_ficha",
                    descricao="Execução sem ficha de presença correspondente",
                    paciente_nome=execucao.get("paciente_nome"),
                    carteirinha=execucao.get("carteirinha"),
                    prioridade="ALTA",
                )

        # Verifica fichas sem execução
        for ficha in fichas:
            numero_guia = ficha.get("numero_guia")
            if not execucoes_por_guia.get(numero_guia):
                registrar_divergencia(
                    numero_guia=numero_guia,
                    data_atendimento=ficha.get("data_atendimento"),
                    codigo_ficha=ficha.get("codigo_ficha"),
                    tipo_divergencia="ficha_sem_execucao",
                    descricao="Ficha sem execução correspondente",
                    paciente_nome=ficha.get("paciente_nome"),
                    carteirinha=ficha.get("carteirinha"),
                    prioridade="ALTA",
                )

        # Registra metadados da auditoria
        total_registros = len(fichas) + len(execucoes)
        registrar_auditoria_execucoes(
            total_protocolos=total_registros,
            data_inicial=data_inicial,
            data_final=data_final,
        )

        return True

    except Exception as e:
        logging.error(f"Erro ao realizar auditoria: {str(e)}")
        logging.error(traceback.format_exc())
        return False


def safe_get_value(dict_obj: Dict, key: str, default=None):
    """Safely get value from dictionary with logging"""
    try:
        return dict_obj.get(key, default)
    except (TypeError, AttributeError) as e:
        logging.warning(f"Erro ao acessar {key}: {e}")
        return default


def get_divergencia_priority(tipo_divergencia: str) -> str:
    """Determina a prioridade baseada no tipo de divergência."""
    prioridades = {
        "ficha_sem_assinatura": "ALTA",
        "execucao_sem_ficha": "ALTA",
        "ficha_sem_execucao": "ALTA",
        "guia_vencida": "ALTA",
        "quantidade_excedida": "ALTA",
        "data_divergente": "MEDIA",
    }
    return prioridades.get(tipo_divergencia, "MEDIA")


def registrar_divergencia_detalhada(divergencia: Dict) -> bool:
    """Registra uma divergência com detalhes específicos."""
    try:
        # Garante valores padrão para campos obrigatórios
        numero_guia = divergencia.get("numero_guia")
        if not numero_guia:
            logging.warning(
                "Tentativa de registrar divergência sem número de guia")
            numero_guia = "SEM_GUIA"

        tipo_divergencia = divergencia.get("tipo_divergencia",
                                           "execucao_sem_ficha")

        # Define prioridade baseada no tipo se não foi especificada
        prioridade = divergencia.get("prioridade") or get_divergencia_priority(
            tipo_divergencia)

        dados = {
            "numero_guia":
            numero_guia,
            "tipo_divergencia":
            tipo_divergencia,
            "descricao":
            divergencia.get("descricao", "Divergência sem descrição"),
            "paciente_nome":
            divergencia.get("paciente_nome", "PACIENTE NÃO IDENTIFICADO"),
            "prioridade":
            prioridade,
            "status":
            divergencia.get("status", "pendente")
        }

        # Campos opcionais que não podem ser null
        campos_opcionais = [
            "data_execucao", "data_atendimento", "codigo_ficha", "carteirinha",
            "detalhes", "ficha_id", "execucao_id", "sessao_id"
        ]

        for campo in campos_opcionais:
            valor = divergencia.get(campo)
            if valor is not None:  # Só adiciona se não for None
                dados[campo] = valor

        logging.info(f"Registrando divergência: {dados}")
        return registrar_divergencia(**dados)

    except Exception as e:
        logging.error(f"Erro ao registrar divergência: {str(e)}")
        traceback.print_exc()
        return False


def verificar_assinatura_ficha(ficha: Dict) -> bool:
    """
    Verifica se a ficha possui assinatura.

    Args:
        ficha: Dicionário contendo os dados da ficha

    Returns:
        bool: True se a ficha está assinada, False caso contrário
    """
    # Verifica se tem URL da ficha digitalizada
    if not ficha.get("arquivo_url"):
        return False

    # Verifica se tem o campo assinado
    if "assinado" in ficha:
        return ficha["assinado"] is True

    return False


def migrar_divergencias_assinatura():
    """Migra as divergências antigas de ficha_sem_assinatura para sessao_sem_assinatura"""
    try:
        # Buscar todas as divergências do tipo antigo
        response = supabase.table("divergencias") \
            .select("*") \
            .eq("tipo_divergencia", "ficha_sem_assinatura") \
            .execute()

        if not response.data:
            return True

        for div in response.data:
            # Atualizar para o novo tipo
            supabase.table("divergencias") \
                .update({
                    "tipo_divergencia": "sessao_sem_assinatura",
                    "descricao": "Sessão executada sem assinatura"
                }) \
                .eq("id", div["id"]) \
                .execute()

        return True
    except Exception as e:
        logging.error(f"Erro ao migrar divergências: {e}")
        return False
def verificar_duplicidade_execucoes(execucoes: List[Dict]) -> List[Dict]:
    """
    Verifica execuções duplicadas baseado em critérios específicos.
    Uma execução é considerada duplicada quando:
    - Mesmo código de ficha
    - Mesma sessão
    - Enviada/processada mais de uma vez
    """
    duplicatas = {}
    for exec in execucoes:
        codigo_ficha = exec.get("codigo_ficha")
        sessao_id = exec.get("sessao_id")
        
        if not codigo_ficha or not sessao_id:  # Ignora execuções sem código de ficha ou sessão
            continue
            
        # Criar chave composta de ficha e sessão
        chave = f"{codigo_ficha}_{sessao_id}"
        
        if chave in duplicatas:
            duplicatas[chave].append(exec)
        else:
            duplicatas[chave] = [exec]
    
    # Retorna apenas os grupos que têm mais de uma execução da mesma sessão na mesma ficha
    duplicados = [execs for execs in duplicatas.values() if len(execs) > 1]
    
    # Log para debug
    for grupo in duplicados:
        primeira = grupo[0]
        logging.info(f"""
            Duplicidade encontrada:
            Código Ficha: {primeira.get('codigo_ficha')}
            Sessão ID: {primeira.get('sessao_id')}
            Guia: {primeira.get('numero_guia')}
            Carteirinha: {primeira.get('carteirinha')}
            Total de duplicatas: {len(grupo)}
            Datas: {[exec.get('data_execucao') for exec in grupo]}
        """)
    
    return duplicados

def realizar_auditoria_fichas_execucoes(data_inicial: str = None,
                                        data_final: str = None):
    """Realiza auditoria comparando sessões e execuções diretamente das tabelas."""
    try:
        # Limpa divergências antigas
        limpar_divergencias_db()

        # Busca os dados diretamente das tabelas
        try:
            sessoes = supabase.table("sessoes") \
                .select("*, fichas_presenca!inner(*)") \
                .execute()

            execucoes = supabase.table("execucoes") \
                .select("*, guias!execucoes_guia_id_fkey(*)") \
                .execute()

            # Modificar a query de busca de guias para incluir carteirinhas
            guias_response = supabase.table("guias") \
                .select("*, carteirinhas!inner(*)") \
                .execute()  # Adiciona join com carteirinhas
            guias = guias_response.data if guias_response and hasattr(
                guias_response, 'data') else []

            # Extract data from responses
            sessoes_data = sessoes.data if sessoes and hasattr(
                sessoes, 'data') else []
            execucoes_data = execucoes.data if execucoes and hasattr(
                execucoes, 'data') else []

        except Exception as e:
            logging.error(f"Erro ao buscar dados das tabelas: {e}")
            raise Exception(f"Erro ao buscar dados: {e}")

        # Garante que os dados são listas de dicionários com validação
        def validar_lista_dados(response, nome_item):
            if not response:
                logging.warning(f"Nenhum dado encontrado para {nome_item}")
                return []

            if isinstance(response, list):
                dados = response
            elif isinstance(response, dict):
                dados = response.get('data', [])
            else:
                logging.error(
                    f"Formato inválido para {nome_item}: {type(response)}")
                return []

            # Validação adicional
            dados_validos = []
            for item in dados:
                if isinstance(item, dict):
                    dados_validos.append(item)
                else:
                    logging.warning(
                        f"Item inválido em {nome_item}: {type(item)}")

            return dados_validos

        fichas = validar_lista_dados(sessoes_data, "fichas")
        execucoes = validar_lista_dados(execucoes_data, "execucoes")

        # Logging detalhado
        logging.info(f"Fichas válidas carregadas: {len(fichas)}")
        logging.info(f"Execuções válidas carregadas: {len(execucoes)}")

        # Indexação segura por código_ficha
        mapa_fichas = {}
        mapa_execucoes = {}
        execucoes_por_guia = {}

        # Correção aqui: precisamos pegar o código da ficha corretamente da estrutura aninhada
        for f in fichas:
            ficha_data = f.get("fichas_presenca", {})
            codigo = ficha_data.get("codigo_ficha")
            if codigo:
                mapa_fichas[codigo] = ficha_data
            else:
                logging.warning(f"Ficha sem código: {f}")

        for e in execucoes:
            codigo = safe_get_value(e, "codigo_ficha")
            numero_guia = safe_get_value(e, "numero_guia")

            if codigo:
                mapa_execucoes[codigo] = e
            else:
                logging.warning(f"Execução sem código: {e}")

            if numero_guia:
                if numero_guia not in execucoes_por_guia:
                    execucoes_por_guia[numero_guia] = []
                execucoes_por_guia[numero_guia].append(e)

        # 1. Verifica datas divergentes
        for codigo_ficha, execucao in mapa_execucoes.items():
            ficha = mapa_fichas.get(codigo_ficha)
            if ficha and ficha.get("data_atendimento") and ficha[
                    "data_atendimento"] != execucao["data_execucao"]:
                if not execucao.get("numero_guia"):
                    logging.warning(
                        f"Execução sem número de guia: {codigo_ficha}")
                    continue

                registrar_divergencia_detalhada({
                    "numero_guia":
                    execucao["numero_guia"],
                    "tipo_divergencia":
                    "data_divergente",
                    "descricao":
                    f"Data de atendimento ({ficha['data_atendimento']}) diferente da execução ({execucao['data_execucao']})",
                    "paciente_nome":
                    execucao["paciente_nome"] or ficha["paciente_nome"],
                    "codigo_ficha":
                    codigo_ficha,
                    "data_execucao":
                    execucao["data_execucao"],
                    "data_atendimento":
                    ficha[
                        "data_atendimento"],  # Garantir que está sendo passado
                    "prioridade":
                    "MEDIA",
                    "status":
                    "pendente",
                    "ficha_id":
                    ficha.get("id"),
                    "execucao_id":
                    execucao.get("id")
                })

        # 2. Verifica sessões sem assinatura
        for sessao in sessoes_data:
            ficha_dados = sessao.get("fichas_presenca", {})

            # Verifica se a sessão foi executada E não possui assinatura
            if sessao.get("executado"
                          ) is True and not sessao.get("possui_assinatura"):
                # Usar data_sessao tanto para data_execucao quanto para data_atendimento
                data_sessao = sessao.get("data_sessao")

                logging.info(f"""
                    Registrando divergência sessão sem assinatura:
                    Sessão ID: {sessao.get('id')}
                    Data sessão: {data_sessao}
                    Ficha: {ficha_dados.get('codigo_ficha')}
                """)

                registrar_divergencia_detalhada({
                    "numero_guia":
                    ficha_dados.get("numero_guia"),
                    "tipo_divergencia":
                    "sessao_sem_assinatura",
                    "descricao":
                    f"Sessão do dia {data_sessao} executada sem assinatura",
                    "paciente_nome":
                    ficha_dados.get("paciente_nome"),
                    "codigo_ficha":
                    ficha_dados.get("codigo_ficha"),
                    "data_execucao":
                    data_sessao,  # Adicionando data_sessao como data_execucao
                    "data_atendimento":
                    data_sessao,
                    "prioridade":
                    "ALTA",
                    "ficha_id":
                    sessao.get("ficha_presenca_id"),
                    "detalhes": {
                        "sessao_id": sessao.get("id"),
                        "data_sessao": data_sessao
                    }
                })

        # 3. e 4. Verifica execuções sem ficha e fichas sem execução
        todos_codigos = set(
            list(mapa_fichas.keys()) + list(mapa_execucoes.keys()))
        for codigo_ficha in todos_codigos:
            execucao = mapa_execucoes.get(codigo_ficha)
            ficha = mapa_fichas.get(codigo_ficha)

            if execucao and not ficha:
                registrar_divergencia_detalhada({
                    "numero_guia":
                    execucao.get("guias", {}).get("numero_guia"),
                    "tipo_divergencia":
                    "execucao_sem_ficha",
                    "descricao":
                    "Execução sem ficha correspondente",
                    "paciente_nome":
                    execucao.get("paciente_nome"),
                    "codigo_ficha":
                    codigo_ficha,
                    "data_execucao":
                    execucao.get("data_execucao"),
                    "prioridade":
                    "ALTA",
                    "execucao_id":
                    execucao.get("id")
                })

            elif ficha and not execucao:
                ficha_data = ficha.get("fichas_presenca", {})
                registrar_divergencia_detalhada({
                    "numero_guia":
                    ficha_data.get("numero_guia"),
                    "tipo_divergencia":
                    "ficha_sem_execucao",
                    "descricao":
                    "Ficha sem execução correspondente",
                    "paciente_nome":
                    ficha_data.get("paciente_nome"),
                    "codigo_ficha":
                    codigo_ficha,
                    "data_atendimento":
                    ficha_data.get("data_atendimento"),
                    "prioridade":
                    "ALTA",
                    "ficha_id":
                    ficha_data.get("id")
                })

        # 5. Verifica quantidade excedida por guia
        for guia in guias:
            execucoes_guia = execucoes_por_guia.get(guia["numero_guia"], [])
            if len(execucoes_guia) > guia.get("quantidade_autorizada", 0):
                registrar_divergencia_detalhada({
                    "numero_guia":
                    guia["numero_guia"],
                    "tipo_divergencia":
                    "quantidade_excedida",  # Changed from quantidade_excedida_guia
                    "descricao":
                    f"Quantidade de execuções ({len(execucoes_guia)}) excede o autorizado ({guia['quantidade_autorizada']})",
                    "paciente_nome":
                    execucoes_guia[0]["paciente_nome"]
                    if execucoes_guia else "",
                    "detalhes": {
                        "quantidade_autorizada": guia["quantidade_autorizada"],
                        "quantidade_executada": len(execucoes_guia)
                    },
                    "prioridade":
                    "ALTA",
                    "status":
                    "pendente"  # Added default status
                })

            # Adiciona verificação de guia vencida
            if guia.get("data_validade"):
                data_validade = datetime.strptime(guia["data_validade"],
                                                  "%Y-%m-%d")
                if datetime.now() > data_validade:
                    registrar_divergencia_detalhada({
                        "numero_guia":
                        guia["numero_guia"],
                        "tipo_divergencia":
                        "guia_vencida",
                        "descricao":
                        f"Guia vencida em {guia['data_validade']}",
                        "paciente_nome":
                        execucoes_guia[0]["paciente_nome"]
                        if execucoes_guia else "",
                        "detalhes": {
                            "data_validade": guia["data_validade"]
                        },
                        "prioridade":
                        "ALTA",
                        "status":
                        "pendente"
                    })

        # 6. Verificar duplicidades (Corrigido)
        duplicatas = verificar_duplicidade_execucoes(execucoes_data)
        for grupo_duplicado in duplicatas:
            primeira_exec = grupo_duplicado[0]
            
            # Busca a ficha correspondente para obter dados complementares
            ficha = None
            if primeira_exec.get("codigo_ficha"):
                ficha_response = (
                    supabase.table("fichas_presenca")
                    .select("*")
                    .eq("codigo_ficha", primeira_exec["codigo_ficha"])
                    .execute()
                )
                if ficha_response.data:
                    ficha = ficha_response.data[0]

            registrar_divergencia_detalhada({
                "numero_guia": primeira_exec["numero_guia"],
                "tipo_divergencia": "duplicidade",
                "descricao": (
                    f"Sessão {primeira_exec['sessao_id']} da ficha {primeira_exec['codigo_ficha']} "
                    f"processada {len(grupo_duplicado)} vezes"
                ),
                "paciente_nome": primeira_exec["paciente_nome"],
                "codigo_ficha": primeira_exec.get("codigo_ficha"),
                "data_execucao": primeira_exec["data_execucao"],
                "data_atendimento": ficha["data_atendimento"] if ficha else None,
                "carteirinha": primeira_exec.get("carteirinha"),
                "prioridade": "ALTA",
                "detalhes": {
                    "total_duplicatas": len(grupo_duplicado),
                    "execucoes_ids": [exec["id"] for exec in grupo_duplicado],
                    "datas_execucao": [exec["data_execucao"] for exec in grupo_duplicado],
                    "sessao_id": primeira_exec.get("sessao_id")
                }
            })

        # Atualizar estatísticas incluindo duplicidades
        stats = {
            "total_fichas": len(fichas),
            "total_execucoes": len(execucoes),
            "divergencias_por_tipo": {
                "execucao_sem_ficha": 0,
                "ficha_sem_execucao": 0,
                "data_divergente": 0,
                "sessao_sem_assinatura": 0,  # Atualizado nome
                "guia_vencida": 0,
                "quantidade_excedida": 0,
                "duplicidade": len(duplicatas)  # Novo contador
            },
            "total_divergencias": 0,
            "total_resolvidas": 0
        }

        # Buscar contagens da tabela de divergências
        divergencias_count = (
            supabase.table("divergencias")
            .select("tipo_divergencia, status", count="exact")
            .execute()
        )

        if divergencias_count.data:
            for div in divergencias_count.data:
                tipo = div.get("tipo_divergencia")
                if tipo in stats["divergencias_por_tipo"]:
                    stats["divergencias_por_tipo"][tipo] += 1
                    stats["total_divergencias"] += 1
                if div.get("status") == "resolvida":
                    stats["total_resolvidas"] += 1

        # Registrar execução da auditoria com estatísticas completas
        registrar_execucao_auditoria(
            data_inicial=data_inicial,
            data_final=data_final,
            total_protocolos=stats["total_execucoes"],
            total_divergencias=stats["total_divergencias"],
            divergencias_por_tipo=stats["divergencias_por_tipo"],
            total_fichas=stats["total_fichas"],
            total_execucoes=stats["total_execucoes"],
            total_resolvidas=stats["total_resolvidas"]
        )

        return {"success": True, "stats": stats}

    except Exception as e:
        logging.error(f"Erro na auditoria: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/")  # This will be accessible at /auditoria/divergencias
def listar_divergencias_route(
        page: int = 1,
        per_page: int = 10,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None,
        status: Optional[str] = None,
        tipo_divergencia: Optional[str] = None,
        prioridade: Optional[str] = None,  # Added priority parameter
):
    """
    Lista as divergências encontradas na auditoria
    """
    try:
        return listar_divergencias(
            page=page,
            per_page=per_page,
            data_inicio=data_inicio,
            data_fim=data_fim,
            status=status,
            tipo_divergencia=tipo_divergencia,
            prioridade=prioridade,  # Added priority parameter
        )
    except Exception as e:
        logging.error(f"Erro ao listar divergências: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500,
                            detail=f"Erro ao listar divergências: {str(e)}")


if __name__ == "__main__":
    # Exemplo de uso: python auditoria.py
    resultado = realizar_auditoria()
    print(f"""
    Resumo da Auditoria:
    - Total de protocolos processados: {resultado['total_protocolos']}
    - Total de divergências encontradas: {resultado['divergencias_encontradas']}

    Verifique o arquivo auditoria.log para mais detalhes. ok
    """)
