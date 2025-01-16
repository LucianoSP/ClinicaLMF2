from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid
import random

# Configuração inicial
load_dotenv()

# Valid status values for divergências:
# - pendente
# - em_analise
# - resolvida
# - cancelada
supabase: Client = create_client(os.getenv("SUPABASE_URL"),
                                 os.getenv("SUPABASE_KEY"))
hoje = datetime.now()

PACIENTE_ID = "e3649804-27b2-4601-b070-5386015c14b8"
PACIENTE_NOME = "Arthur Antunes Coimbra"


def criar_carteirinha_adicional():
    """Cria uma nova carteirinha para o paciente existente"""
    try:
        # Buscar um plano de saúde existente
        planos = supabase.table("planos_saude").select("*").execute()
        plano_id = planos.data[0]["id"] if planos.data else None

        if not plano_id:
            raise Exception("Nenhum plano de saúde encontrado")

        carteirinha = {
            "id": str(uuid.uuid4()),
            "paciente_id": PACIENTE_ID,
            "plano_saude_id": plano_id,
            "numero_carteirinha": "CART_ZICO_002",
            "titular": False
        }
        carteirinha_result = supabase.table("carteirinhas").insert(
            carteirinha).execute()
        return carteirinha_result.data[0]

    except Exception as e:
        print(f"Erro ao criar carteirinha adicional: {str(e)}")
        raise e


def criar_guias_e_fichas(carteirinha, usuario_id):
    """Cria guias e fichas com diferentes cenários de divergência"""
    try:
        guias_criadas = []

        # Criar 5 guias com quantidade de sessões variando de 4 a 10
        for i in range(5):
            guia = {
                "id": str(uuid.uuid4()),
                "numero_guia": f"GUIA_ZICO_{i+1}",
                "data_emissao": hoje.date().isoformat(),
                "tipo": "sessao",
                "status": "em_andamento",
                "paciente_nome": PACIENTE_NOME,
                "paciente_carteirinha": carteirinha["numero_carteirinha"],
                "quantidade_autorizada": random.randint(4, 10),
                "procedimento_nome": "FISIOTERAPIA"
            }
            guia_result = supabase.table("guias").insert(guia).execute()
            guias_criadas.append(guia_result.data[0])

        # Criar 10 fichas de presença com diferentes cenários
        for i in range(10):
            guia = random.choice(guias_criadas)

            ficha = {
                "id":
                str(uuid.uuid4()),
                "codigo_ficha":
                f"FICHA_ZICO_{i+1}",
                "numero_guia":
                guia["numero_guia"],
                "paciente_nome":
                PACIENTE_NOME,
                "paciente_carteirinha":
                carteirinha["numero_carteirinha"],
                "data_atendimento":
                (hoje -
                 timedelta(days=random.randint(0, 10))).date().isoformat()
            }
            ficha_result = supabase.table("fichas_presenca").insert(
                ficha).execute()

            # Criar sessões para cada ficha (2-4 sessões por ficha)
            num_sessoes = random.randint(2, 4)
            for j in range(num_sessoes):
                data_sessao = (hoje -
                               timedelta(days=random.randint(0, 5))).date()

                # Criar diferentes cenários de divergência
                possui_assinatura = random.choice([True, False])
                data_execucao = data_sessao + timedelta(days=random.randint(
                    -2, 2)) if random.random() < 0.3 else data_sessao

                sessao = {
                    "id": str(uuid.uuid4()),
                    "ficha_presenca_id": ficha_result.data[0]["id"],
                    "data_sessao": data_sessao.isoformat(),
                    "possui_assinatura": possui_assinatura,
                    "tipo_terapia": "FISIOTERAPIA",
                    "executado": True,
                    "data_execucao": data_execucao.isoformat(),
                    "executado_por": usuario_id
                }
                sessao_result = supabase.table("sessoes").insert(
                    sessao).execute()

                # Criar execução (com chance de duplicidade ou ausência)
                if random.random() > 0.2:  # 80% de chance de ter execução
                    execucao = {
                        "id": str(uuid.uuid4()),
                        "guia_id": guia["id"],
                        "sessao_id": sessao_result.data[0]["id"],
                        "data_execucao": data_execucao.isoformat(),
                        "paciente_nome": PACIENTE_NOME,
                        "paciente_carteirinha":
                        carteirinha["numero_carteirinha"],
                        "numero_guia": guia["numero_guia"],
                        "codigo_ficha": ficha["codigo_ficha"],
                        "usuario_executante": usuario_id
                    }
                    supabase.table("execucoes").insert(execucao).execute()

                    # 20% de chance de criar duplicidade
                    if random.random() < 0.2:
                        execucao["id"] = str(uuid.uuid4())
                        supabase.table("execucoes").insert(execucao).execute()

    except Exception as e:
        print(f"Erro ao criar guias e fichas: {str(e)}")
        raise e


if __name__ == "__main__":
    try:
        # Buscar um usuário existente
        usuarios = supabase.table("usuarios").select("*").execute()
        usuario_id = usuarios.data[0]["id"] if usuarios.data else None

        if not usuario_id:
            raise Exception("Nenhum usuário encontrado")

        carteirinha = criar_carteirinha_adicional()
        criar_guias_e_fichas(carteirinha, usuario_id)
        print("Dados de teste adicionais criados com sucesso!")

    except Exception as e:
        print(f"Erro ao executar script: {str(e)}")
