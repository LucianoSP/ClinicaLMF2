from database import (
    init_db,
    limpar_banco,
    limpar_protocolos_excel,
    salvar_guia,
    salvar_dados_excel,
)
import sqlite3
from datetime import datetime, timedelta
import random
import os

# Usar o mesmo banco de dados da aplicação
DATABASE_FILE = "clinica_larissa.db"


def gerar_dados_base(quantidade=50):
    """Gera dados base para testes"""
    base_data = []
    start_date = datetime(2024, 11, 18)  # Começando em 18/11/2024

    # Lista de nomes fixos para garantir correspondência
    nomes = [
        "LUCAS ARANHA ALVES",
        "FELIPE BARROS LIMA",
        "MIGUEL CARLOS SANTOS SILVA",
        "VALENTINA LUIZ SILVA",
        "DANIEL SANTOS OLIVEIRA PINTO",
        "LUCA MESQUITA MARTINS",
        "VITOR GOMES CHAGAS",
        "JEANINE VIEIRA FARIA DOS SANTOS",
        "RAVI BARRETO BIANGULO",
        "RAFAEL PEREIRA LUCAS BEZERRA",
    ]

    # Para cada nome, gerar múltiplos registros
    for nome in nomes:
        num_registros = random.randint(3, 7)  # Cada pessoa terá entre 3 e 7 registros
        carteirinha = f"{random.randint(1000000, 9999999)}"
        id_paciente = f"P{random.randint(10000, 99999)}"

        for _ in range(num_registros):
            # Gerar data dentro do período de 18/11 a 23/11
            data = (start_date + timedelta(days=random.randint(0, 5))).strftime(
                "%d/%m/%Y"
            )
            guia_id = f"{random.randint(48000000, 58000000)}"

            base_data.append(
                {
                    "carteirinha": carteirinha,
                    "nome": nome,
                    "data": data,
                    "guia_id": guia_id,
                    "id_paciente": id_paciente,
                }
            )

    return base_data[:quantidade]  # Limitar ao número desejado de registros


def generate_test_data(quantidade=50):
    """
    Gera dados de teste com cenários específicos para auditoria:
    - Alguns atendimentos sem assinatura
    - Alguns atendimentos sem código de ficha
    - Alguns protocolos sem atendimento correspondente
    - Alguns atendimentos com data diferente do protocolo
    - Alguns atendimentos duplicados
    """
    print("\nIniciando geração de dados de teste...")

    # Inicializar banco de dados
    init_db()

    # Limpar dados existentes
    print("Limpando dados existentes...")
    limpar_banco()
    limpar_protocolos_excel()

    # Gerar dados base
    print(f"Gerando {quantidade} registros base...")
    base_data = gerar_dados_base(quantidade)

    # Preparar dados para protocolos
    print("Preparando dados para protocolos...")
    protocolos = []
    for data in base_data:
        protocolos.append(
            {
                "idGuia": data["guia_id"],
                "nomePaciente": data["nome"],
                "dataExec": data["data"],
                "carteirinha": data["carteirinha"],
                "idPaciente": data["id_paciente"],
            }
        )

    # Salvar protocolos
    print(f"Salvando {len(protocolos)} protocolos...")
    salvar_dados_excel(protocolos)

    # Inserir atendimentos com algumas divergências
    print("\nInserindo atendimentos com divergências...")
    atendimentos_salvos = 0
    atendimentos_com_erro = 0

    for i, data in enumerate(base_data):
        # 20% dos protocolos não terão atendimento correspondente
        if i % 5 == 0:
            print(f"Pulando atendimento {i+1} (20% sem correspondência)")
            continue

        # 15% dos atendimentos terão data diferente do protocolo
        data_execucao = data["data"]
        if i % 7 == 0:
            data_obj = datetime.strptime(data["data"], "%d/%m/%Y")
            data_execucao = (data_obj + timedelta(days=1)).strftime("%d/%m/%Y")
            print(f"Atendimento {i+1} com data diferente: {data_execucao}")

        # 10% dos atendimentos não terão assinatura
        possui_assinatura = True
        if i % 10 == 0:
            possui_assinatura = False
            print(f"Atendimento {i+1} sem assinatura")

        # 10% dos atendimentos não terão código de ficha
        codigo_ficha = f"F{random.randint(1000, 9999)}"
        if i % 10 == 0:
            codigo_ficha = ""
            print(f"Atendimento {i+1} sem código de ficha")

        # Preparar dados do atendimento
        atendimento = {
            "data_execucao": data_execucao,
            "numero_carteira": data["carteirinha"],
            "paciente_nome": data["nome"],
            "numero_guia_principal": data["guia_id"],
            "codigo_ficha": codigo_ficha,
            "possui_assinatura": possui_assinatura,
        }

        # Salvar atendimento
        try:
            print(f"\nSalvando atendimento {i+1}:")
            print(f"Dados: {atendimento}")
            salvar_guia(atendimento)
            atendimentos_salvos += 1

            # 5% dos atendimentos serão duplicados
            if i % 20 == 0:
                atendimento_duplicado = atendimento.copy()
                atendimento_duplicado["codigo_ficha"] = (
                    f"F{random.randint(1000, 9999)}"  # Código de ficha diferente
                )
                print(f"Duplicando atendimento {i+1}:")
                print(f"Dados: {atendimento_duplicado}")
                salvar_guia(atendimento_duplicado)
                atendimentos_salvos += 1
        except Exception as e:
            print(f"Erro ao salvar atendimento {i+1}: {e}")
            atendimentos_com_erro += 1

    print(
        f"""
    Dados de teste gerados com sucesso!
    
    Resumo:
    - Total de protocolos gerados: {len(protocolos)}
    - Total de atendimentos salvos: {atendimentos_salvos}
    - Total de atendimentos com erro: {atendimentos_com_erro}
    
    Cenários de teste incluídos:
    - 20% dos protocolos não têm atendimento correspondente
    - 15% dos atendimentos têm data diferente do protocolo
    - 10% dos atendimentos não têm assinatura
    - 10% dos atendimentos não têm código de ficha
    - 5% dos atendimentos estão duplicados
    """
    )


if __name__ == "__main__":
    generate_test_data()
