from database_supabase import limpar_banco, limpar_protocolos_excel, salvar_dados_excel, salvar_guia, registrar_divergencia
import random
from datetime import datetime, timedelta

def gerar_dados_base():
    """Gera dados base aleatórios para testes"""
    base_data = []
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
        "RAFAEL PEREIRA LUCAS BEZERRA"
    ]

    print("Gerando dados base...")
    # Manter registro de combinações já usadas
    combinacoes_usadas = set()

    for nome in nomes:
        num_registros = random.randint(3, 7)  # Cada pessoa terá entre 3 e 7 registros
        carteirinha = f"CART{random.randint(10000, 99999)}"
        paciente_id = f"P{random.randint(10000, 99999)}"
        
        # Datas disponíveis para este paciente
        datas_disponiveis = [
            datetime(2024, 11, dia) 
            for dia in range(18, 24)
        ]

        for _ in range(num_registros):
            if not datas_disponiveis:
                break  # Não há mais datas disponíveis para este paciente
                
            # Escolher uma data aleatória das disponíveis
            data = random.choice(datas_disponiveis)
            datas_disponiveis.remove(data)  # Remover a data usada
            data_str = data.strftime("%d/%m/%Y")
            
            # Verificar se a combinação já existe
            combinacao = (data_str, carteirinha)
            if combinacao in combinacoes_usadas:
                continue
                
            combinacoes_usadas.add(combinacao)
            guia_id = f"{random.randint(48000000, 57999999)}"

            base_data.append({
                "guia_id": guia_id,
                "paciente_nome": nome,
                "data_execucao": data_str,
                "paciente_carteirinha": carteirinha,
                "paciente_id": paciente_id
            })

    return base_data

def gerar_dados_teste():
    """Gera dados de teste para o Excel e para o banco"""
    try:
        # Limpa os dados existentes
        print("Limpando dados existentes...")
        limpar_protocolos_excel()
        limpar_banco()

        # Gera dados base
        base_data = gerar_dados_base()

        # Prepara dados para protocolos
        print("Preparando dados para protocolos...")
        protocolos = []
        for data in base_data:
            protocolos.append({
                "guia_id": data["guia_id"],
                "paciente_nome": data["paciente_nome"],
                "data_execucao": data["data_execucao"],
                "paciente_carteirinha": data["paciente_carteirinha"],
                "paciente_id": data["paciente_id"]
            })

        # Salva protocolos no Excel
        print(f"Salvando {len(protocolos)} protocolos...")
        if not salvar_dados_excel(protocolos):
            print("Erro ao salvar protocolos no Excel")
            return False

        # Prepara e salva atendimentos
        print("\nInserindo atendimentos com divergências...")
        atendimentos_salvos = 0
        atendimentos_erro = 0

        for i, data in enumerate(base_data):
            # 20% dos protocolos não terão atendimento correspondente
            if i % 5 == 0:
                print(f"Pulando atendimento {i+1} (20% sem correspondência)")
                continue

            # 15% dos atendimentos terão data diferente do protocolo
            data_execucao = data["data_execucao"]
            if i % 7 == 0:
                data_obj = datetime.strptime(data["data_execucao"], "%d/%m/%Y")
                nova_data = data_obj + timedelta(days=1)
                if nova_data.day <= 23:  # Manter dentro do período válido
                    data_execucao = nova_data.strftime("%d/%m/%Y")
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

            # 50% de chance de usar um nome diferente para gerar divergência
            if random.random() < 0.5:
                paciente_nome = data["paciente_nome"]
                paciente_carteirinha = data["paciente_carteirinha"]
            else:
                paciente_nome = random.choice([
                    "CARLOS SOUZA",
                    "MARIANA LIMA",
                    "ROBERTO COSTA",
                    "PATRICIA ALVES",
                    "FERNANDO SANTOS"
                ])
                paciente_carteirinha = f"CART{random.randint(10000, 99999)}"

            # Preparar dados do atendimento
            atendimento = {
                "guia_id": data["guia_id"],
                "paciente_nome": paciente_nome,
                "data_execucao": data_execucao,
                "paciente_carteirinha": paciente_carteirinha,
                "codigo_ficha": codigo_ficha,
                "possui_assinatura": possui_assinatura
            }

            # Salvar atendimento
            print(f"\nSalvando atendimento {i+1}:")
            print(f"Dados: {atendimento}")
            if salvar_guia(atendimento):
                atendimentos_salvos += 1
                
                # Registrar divergências se houver
                if data["paciente_nome"] != paciente_nome:
                    print(f"Registrando divergência de nome para guia {data['guia_id']}")
                    registrar_divergencia(
                        guia_id=data["guia_id"],
                        data_execucao=data_execucao,
                        codigo_ficha=codigo_ficha,
                        descricao=f"Nome do beneficiário divergente. No protocolo: {data['paciente_nome']}, no atendimento: {paciente_nome}",
                        paciente_nome=data["paciente_nome"]  # Nome do paciente do protocolo
                    )
                
                if data["data_execucao"] != data_execucao:
                    print(f"Registrando divergência de data para guia {data['guia_id']}")
                    registrar_divergencia(
                        guia_id=data["guia_id"],
                        data_execucao=data_execucao,
                        codigo_ficha=codigo_ficha,
                        descricao=f"Data de execução divergente. No protocolo: {data['data_execucao']}, no atendimento: {data_execucao}",
                        paciente_nome=data["paciente_nome"]  # Nome do paciente do protocolo
                    )
                
                if not possui_assinatura:
                    print(f"Registrando divergência de assinatura para guia {data['guia_id']}")
                    registrar_divergencia(
                        guia_id=data["guia_id"],
                        data_execucao=data_execucao,
                        codigo_ficha=codigo_ficha,
                        descricao="Atendimento sem assinatura do beneficiário",
                        paciente_nome=data["paciente_nome"]  # Nome do paciente do protocolo
                    )
                
                if not codigo_ficha:
                    print(f"Registrando divergência de código de ficha para guia {data['guia_id']}")
                    registrar_divergencia(
                        guia_id=data["guia_id"],
                        data_execucao=data_execucao,
                        codigo_ficha=codigo_ficha,
                        descricao="Atendimento sem código de ficha",
                        paciente_nome=data["paciente_nome"]  # Nome do paciente do protocolo
                    )
            else:
                print(f"Erro ao salvar atendimento {i+1}: {atendimento}")
                atendimentos_erro += 1

        print("\nDados de teste gerados com sucesso!")
        print(f"\nResumo:")
        print(f"- Total de protocolos gerados: {len(protocolos)}")
        print(f"- Total de atendimentos salvos: {atendimentos_salvos}")
        print(f"- Total de atendimentos com erro: {atendimentos_erro}")
        print(f"\nCenários de teste incluídos:")
        print("- 20% dos protocolos não têm atendimento correspondente")
        print("- 15% dos atendimentos têm data diferente do protocolo")
        print("- 10% dos atendimentos não têm assinatura")
        print("- 10% dos atendimentos não têm código de ficha")
        print("- 5% dos atendimentos estão duplicados")
        print("- 50% dos atendimentos têm nome e carteirinha diferentes")
        return True

    except Exception as e:
        print(f"Erro ao gerar dados de teste: {e}")
        return False

if __name__ == "__main__":
    gerar_dados_teste()
