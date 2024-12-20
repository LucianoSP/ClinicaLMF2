from typing import Dict, List, Optional
from datetime import datetime
from config import supabase
from math import ceil
import os
import traceback
import uuid


def salvar_dados_excel(registros: List[Dict]) -> bool:
    """Salva os dados do Excel na tabela execucoes."""
    try:
        # Prepara os dados no formato correto
        dados_formatados = []
        for registro in registros:
            dados_formatados.append(
                {
                    # Removido o campo "id" para deixar o Supabase gerar automaticamente
                    "numero_guia": str(registro["guia_id"]),
                    "paciente_nome": str(registro["paciente_nome"]).upper(),
                    "data_execucao": registro["data_execucao"],
                    "paciente_carteirinha": str(registro["paciente_carteirinha"]),
                    "paciente_id": str(registro["paciente_id"]),
                    "quantidade_sessoes": 1,  # Valor padrão
                    "codigo_ficha": None,  # Novo campo adicionado
                }
            )

        # Insere os dados no Supabase
        response = supabase.table("execucoes").insert(dados_formatados).execute()

        print(f"Dados inseridos com sucesso! {len(dados_formatados)} registros.")
        return True

    except Exception as e:
        print(f"Erro ao salvar dados do Excel no Supabase: {e}")
        return False


def listar_dados_excel(
    limit: int = 100, offset: int = 0, paciente_nome: Optional[str] = None
) -> Dict:
    """Retorna os dados da tabela execucoes com suporte a paginação e filtro"""
    try:
        # Inicia a query
        query = supabase.table("execucoes").select("*")

        # Adiciona filtro se paciente_nome for fornecido
        if paciente_nome:
            query = query.ilike("paciente_nome", f"%{paciente_nome.upper()}%")

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
                    "guia_id": reg["numero_guia"],
                    "paciente_nome": reg["paciente_nome"],
                    "data_execucao": reg["data_execucao"],
                    "paciente_carteirinha": reg["paciente_carteirinha"],
                    "paciente_id": reg["paciente_id"],
                    "quantidade_sessoes": reg["quantidade_sessoes"],
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


def salvar_guia(info: Dict) -> Optional[int]:
    """
    Salva as informações do execucao no Supabase.
    Se o código da ficha já existir, atualiza o registro.
    """
    try:
        print(f"Tentando salvar execucao: {info}")

        # Formata os dados para o formato esperado pelo banco
        dados = {
            "data_execucao": info["data_execucao"],
            "paciente_carteirinha": info["paciente_carteirinha"],
            "paciente_nome": info["paciente_nome"],
            "guia_id": info["guia_id"],
            "possui_assinatura": info.get("possui_assinatura", False),
            "codigo_ficha": info.get("codigo_ficha"),
        }

        # Adiciona arquivo_url se existir
        if "arquivo_url" in info:
            dados["arquivo_url"] = info["arquivo_url"]

        # Verifica se já existe um registro com este código_ficha
        codigo_ficha = info.get("codigo_ficha")
        if codigo_ficha:
            existing = (
                supabase.table("execucaos")
                .select("id")
                .eq("codigo_ficha", codigo_ficha)
                .execute()
            )

            if existing.data and len(existing.data) > 0:
                # Atualiza o registro existente
                print(
                    f"Atualizando registro existente para codigo_ficha: {codigo_ficha}"
                )
                response = (
                    supabase.table("execucaos")
                    .update(dados)
                    .eq("codigo_ficha", codigo_ficha)
                    .execute()
                )
                if response.data:
                    print(f"execucao atualizado com sucesso: {response.data}")
                    return response.data[0].get("id")
                else:
                    print("Erro: Resposta vazia do Supabase ao atualizar")
                    return None

        # Se não existe, insere novo registro
        print(f"Inserindo novo registro para codigo_ficha: {codigo_ficha}")
        response = supabase.table("execucaos").insert(dados).execute()

        if response.data:
            print(f"execucao salvo com sucesso: {response.data}")
            return response.data[0].get("id")
        else:
            print("Erro: Resposta vazia do Supabase")
            return None

    except Exception as e:
        print(f"Erro ao salvar guia: {e}")
        print(f"Dados: {dados}")
        return None


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

        # Adiciona ordenação e paginação
        query = query.order("data_execucao", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        # Executa a query
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

        return {"execucaos": execucaos, "total": total}

    except Exception as e:
        print(f"Erro ao listar guias: {e}")
        return {"execucaos": [], "total": 0}


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


def limpar_banco() -> None:
    """Limpa a tabela de execucaos"""
    try:
        supabase.table("execucaos").delete().neq("id", 0).execute()
    except Exception as e:
        print(f"Erro ao limpar banco: {e}")


def registrar_divergencia(
    numero_guia: str,
    data_execucao: str,
    codigo_ficha: str,
    tipo_divergencia: str,
    descricao: str,
    paciente_nome: str = None,  # Novo parâmetro
) -> Optional[str]:
    """Registra uma nova divergência encontrada na auditoria"""
    try:
        dados = {
            "numero_guia": numero_guia,
            "data_execucao": data_execucao,
            "codigo_ficha": codigo_ficha,
            "tipo_divergencia": tipo_divergencia,
            "descricao": descricao,
            "paciente_nome": paciente_nome,  # Novo campo
            "status": "pendente",  # Usando o novo enum status_divergencia
        }

        response = supabase.table("divergencias").insert(dados).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]["id"]
        return None

    except Exception as e:
        print(f"Erro ao registrar divergência: {e}")
        traceback.print_exc()
        return None


def listar_divergencias(
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
) -> Dict:
    """
    Lista as divergências encontradas na auditoria, com filtros opcionais por data e status,
    e suporte a paginação
    """
    try:
        # Inicia a query base para buscar divergências
        query = supabase.table("divergencias").select(
            "*, fichas_presenca!inner(id, codigo_ficha, possui_assinatura, arquivo_digitalizado, data_atendimento), execucoes!inner(id, paciente_nome, paciente_carteirinha, quantidade_sessoes, data_execucao)",
            count="exact"
        )

        # Adiciona filtros se fornecidos
        if data_inicio:
            query = query.gte("fichas_presenca.data_atendimento", data_inicio)
        if data_fim:
            query = query.lte("fichas_presenca.data_atendimento", data_fim)
        if status:
            query = query.eq("status", status)

        # Adiciona ordenação e paginação
        query = query.order("created_at", desc=True)
        if limit > 0:
            query = query.range(offset, offset + limit - 1)

        # Executa a query
        response = query.execute()
        divergencias = response.data
        total = response.count if response.count is not None else len(divergencias)

        # Formata os dados para retorno
        divergencias_formatadas = []
        for div in divergencias:
            ficha = div.get("fichas_presenca", {})
            execucao = div.get("execucoes", {})
            
            divergencias_formatadas.append({
                "id": div["id"],
                "guia_id": div["numero_guia"],
                "data_registro": ficha.get("data_atendimento"),  # Data da ficha de presença
                "data_execucao": execucao.get("data_execucao"),  # Data da execução
                "codigo_ficha": div["codigo_ficha"],
                "tipo_divergencia": div["tipo_divergencia"],
                "descricao_divergencia": div["descricao"],
                "paciente_nome": execucao.get("paciente_nome"),
                "paciente_carteirinha": execucao.get("paciente_carteirinha"),
                "possui_assinatura": ficha.get("possui_assinatura"),
                "arquivo_digitalizado": ficha.get("arquivo_digitalizado"),
                "observacoes": div.get("observacoes"),
                "quantidade_autorizada": execucao.get("quantidade_sessoes"),
                "quantidade_executada": execucao.get("quantidade_sessoes"),
                "status": div["status"],
                "created_at": div["created_at"]
            })

        return {
            "divergencias": divergencias_formatadas,
            "total": total,
            "paginas": ceil(total / limit) if limit > 0 else 1
        }

    except Exception as e:
        print(f"Erro ao listar divergências: {e}")
        traceback.print_exc()
        return {"divergencias": [], "total": 0, "paginas": 1}


def atualizar_status_divergencia(
    id: str, novo_status: str, usuario_id: Optional[str] = None
) -> bool:
    """Atualiza o status de uma divergência"""
    try:

        print(f"Tentando atualizar divergência {id} para status: {novo_status}")

        # Converte o ID para inteiro
        id_numerico = int(id)

        dados = {
            "status": novo_status,
            "data_resolucao": (
                datetime.now().isoformat() if novo_status != "pendente" else None
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

        return {
            "fichas": fichas,
            "total": total,
            "total_pages": ceil(total / limit) if limit > 0 else 1,
        }

    except Exception as e:
        print(f"Erro ao listar fichas de presença: {e}")
        traceback.print_exc()  # Isso imprimirá o traceback completo
        return {"fichas": [], "total": 0, "total_pages": 1}


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
        # Deleta todos os registros usando uma condição que sempre é verdadeira
        # Usamos gt.00000000-0000-0000-0000-000000000000 para pegar todos os UUIDs válidos
        supabase.table("divergencias").delete().gt(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()
        print("Tabela divergencias limpa com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao limpar divergências no Supabase: {e}")
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
) -> Optional[str]:
    """Registra uma nova execução de auditoria com seus metadados"""
    try:
        dados = {
            "data_inicial": data_inicial,
            "data_final": data_final,
            "total_protocolos": total_protocolos,
            "total_divergencias": total_divergencias,
            "divergencias_por_tipo": divergencias_por_tipo or {},
        }

        response = supabase.table("auditoria_execucoes").insert(dados).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]["id"]
        return None

    except Exception as e:
        print(f"Erro ao registrar execução de auditoria: {e}")
        traceback.print_exc()
        return None


def calcular_estatisticas_divergencias() -> Dict:
    """Calcula estatísticas das divergências para os cards"""
    try:
        # Busca todas as divergências com seus relacionamentos
        response = supabase.table("divergencias").select(
            "*, fichas_presenca!inner(possui_assinatura)"
        ).execute()
        divergencias = response.data
        
        # Calcula totais
        total_divergencias = len(divergencias)
        total_resolvidas = len([d for d in divergencias if d["status"] == "resolvida"])
        total_pendentes = len([d for d in divergencias if d["status"] == "pendente"])
        
        # Conta fichas sem assinatura olhando o campo possui_assinatura da tabela fichas_presenca
        total_fichas_sem_assinatura = len([
            d for d in divergencias 
            if d.get("fichas_presenca") and not d["fichas_presenca"].get("possui_assinatura", True)
        ])
        
        # Conta execuções sem ficha
        total_execucoes_sem_ficha = len([
            d for d in divergencias 
            if d["tipo_divergencia"] == "execucao_sem_ficha"
        ])
        
        return {
            "total_divergencias": total_divergencias,
            "total_resolvidas": total_resolvidas,
            "total_pendentes": total_pendentes,
            "total_fichas_sem_assinatura": total_fichas_sem_assinatura,
            "total_execucoes_sem_ficha": total_execucoes_sem_ficha
        }
    except Exception as e:
        print(f"Erro ao calcular estatísticas: {e}")
        traceback.print_exc()
        return {
            "total_divergencias": 0,
            "total_resolvidas": 0,
            "total_pendentes": 0,
            "total_fichas_sem_assinatura": 0,
            "total_execucoes_sem_ficha": 0
        }


def obter_ultima_auditoria() -> Dict:
    """
    Obtém o resultado da última auditoria realizada e calcula estatísticas das divergências
    """
    try:
        # Busca última auditoria
        response = supabase.table("auditoria_execucoes") \
            .select("*") \
            .order("data_execucao", desc=True) \
            .limit(1) \
            .execute()
        
        if not response.data:
            return None
            
        ultima_auditoria = response.data[0]
        
        # Calcula estatísticas das divergências
        estatisticas = calcular_estatisticas_divergencias()
        
        return {
            "total_protocolos": ultima_auditoria.get("total_protocolos", 0),
            "total_divergencias": estatisticas["total_divergencias"],
            "total_resolvidas": estatisticas["total_resolvidas"],
            "total_pendentes": estatisticas["total_pendentes"],
            "total_fichas_sem_assinatura": estatisticas["total_fichas_sem_assinatura"],
            "total_execucoes_sem_ficha": estatisticas["total_execucoes_sem_ficha"],
            "data_execucao": ultima_auditoria.get("data_execucao"),
            "tempo_execucao": "Tempo não disponível"  # TODO: Calcular tempo de execução se necessário
        }

    except Exception as e:
        print(f"Erro ao obter última auditoria: {e}")
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
    Retorna todas as guias de um paciente específico.
    """
    try:
        # Executa a query
        response = (
            supabase.table("guias")
            .select("*")
            .eq("paciente_id", paciente_id)
            .order("created_at", desc=True)
            .execute()
        )

        if not response.data:
            return {"items": [], "total": 0}

        return {"items": response.data, "total": len(response.data)}

    except Exception as e:
        print(f"Erro ao listar guias do paciente: {e}")
        traceback.print_exc()
        return {"items": [], "total": 0}
