from config import test_connection
from database_supabase import (
    contar_protocolos,
    salvar_dados_excel,
    listar_dados_excel,
    registrar_divergencia,
    listar_divergencias
)
from datetime import datetime

# Gera um ID único baseado no timestamp
unique_id = datetime.now().strftime("%Y%m%d%H%M%S")

# Testa a conexão
print("\nTestando conexão...")
test_connection()

# Testa contagem de protocolos
print("\nTestando contagem de protocolos...")
total = contar_protocolos()
print(f"Total de protocolos: {total}")

# Testa inserção de dados de exemplo
print("\nTestando inserção de dados...")
dados_teste = [{
    "idGuia": f"GUIA{unique_id}",
    "nomePaciente": "PACIENTE TESTE",
    "dataExec": "01/12/2024",
    "carteirinha": f"CART{unique_id}",
    "idPaciente": f"PAC{unique_id}"
}]

if salvar_dados_excel(dados_teste):
    print("Dados de teste inseridos com sucesso!")

# Testa listagem de dados
print("\nTestando listagem de dados...")
resultado = listar_dados_excel(limit=10)
print(f"Total de registros: {resultado['total']}")
if resultado['registros']:
    print("Primeiro registro:", resultado['registros'][0])

# Testa registro de divergência
print("\nTestando registro de divergência...")
div_id = registrar_divergencia(
    guia_id=f"GUIA{unique_id}",
    data_execucao="01/12/2024",
    codigo_ficha=f"FICHA{unique_id}",
    descricao="Teste de divergência"
)
if div_id:
    print(f"Divergência registrada com ID: {div_id}")

# Testa listagem de divergências
print("\nTestando listagem de divergências...")
divergencias = listar_divergencias(limit=10)
if divergencias:
    print(f"Total de divergências: {divergencias['total']}")
    if divergencias['divergencias']:
        print("Primeira divergência:", divergencias['divergencias'][0])
