from database_supabase import (
    salvar_dados_excel,
    registrar_divergencia,
    limpar_protocolos_excel,
    limpar_banco,
    salvar_guia,
)
from datetime import datetime, timedelta
import random

# Nomes para gerar dados aleatórios
NOMES = [
    "Maria Silva",
    "João Santos",
    "Ana Oliveira",
    "Pedro Costa",
    "Julia Lima",
    "Carlos Souza",
    "Patricia Ferreira",
    "Lucas Ribeiro",
    "Fernanda Almeida",
    "Roberto Carvalho",
]


def gerar_id():
    return "".join(random.choices("0123456789", k=6))


def gerar_carteirinha():
    return "".join(random.choices("0123456789", k=8))


def gerar_data_aleatoria():
    hoje = datetime.now()
    dias_aleatorios = random.randint(-30, 0)  # últimos 30 dias
    data = hoje + timedelta(days=dias_aleatorios)
    return data.strftime("%d/%m/%Y")


def gerar_protocolos(quantidade):
    protocolos = []
    for _ in range(quantidade):
        protocolo = {
            "idGuia": f"G{gerar_id()}",
            "paciente_nome": random.choice(NOMES),
            "dataExec": gerar_data_aleatoria(),
            "carteirinha": gerar_carteirinha(),
            "paciente_id": f"P{gerar_id()}",
        }
        protocolos.append(protocolo)
    return protocolos


def gerar_divergencias(protocolos, quantidade_por_protocolo):
    tipos_divergencia = [
        "Procedimento não encontrado na ficha",
        "Data de execução divergente",
        "Nome do paciente diferente",
        "Carteirinha inválida",
        "Quantidade de procedimentos incorreta",
    ]

    for protocolo in protocolos:
        for _ in range(random.randint(0, quantidade_por_protocolo)):
            registrar_divergencia(
                guia_id=protocolo["idGuia"],
                data_execucao=protocolo["dataExec"],
                codigo_ficha=f"F{gerar_id()}",
                descricao=random.choice(tipos_divergencia),
                paciente_nome=protocolo["paciente_nome"],
            )


def gerar_atendimentos(protocolos):
    """Gera atendimentos para alguns dos protocolos"""
    codigos_ficha = [f"FICHA{i:03d}" for i in range(1, 100)]

    for protocolo in protocolos:
        # 70% de chance de gerar um atendimento para cada protocolo
        if random.random() < 0.7:
            info_atendimento = {
                "data_execucao": protocolo["dataExec"],
                "paciente_carteirinha": protocolo["carteirinha"],
                "paciente_nome": protocolo["paciente_nome"],
                "guia_id": protocolo["idGuia"],
                "codigo_ficha": random.choice(codigos_ficha),
                "possui_assinatura": random.choice([True, False]),
            }
            try:
                salvar_guia(info_atendimento)
            except Exception as e:
                print(f"Erro ao salvar atendimento: {e}")


def main():
    print("Limpando banco de dados...")
    limpar_banco()

    print("\nGerando protocolos...")
    protocolos = gerar_protocolos(20)  # Gera 20 protocolos
    if salvar_dados_excel(protocolos):
        print(f"✓ {len(protocolos)} protocolos gerados com sucesso!")

    print("\nGerando atendimentos...")
    gerar_atendimentos(protocolos)
    print("✓ Atendimentos gerados com sucesso!")

    print("\nGerando divergências...")
    gerar_divergencias(protocolos, 2)  # Até 2 divergências por protocolo
    print("✓ Divergências geradas com sucesso!")

    print("\nDados de teste gerados com sucesso!")


if __name__ == "__main__":
    main()
