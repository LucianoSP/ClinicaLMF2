from database import contar_protocolos, listar_guias

def verificar_estado_atual():
    """Verifica o estado atual das tabelas do banco de dados"""
    # Conta protocolos
    total_protocolos = contar_protocolos()
    print(f"\nTotal de protocolos no banco: {total_protocolos}")
    
    # Conta atendimentos
    atendimentos = listar_guias(limit=0)
    total_atendimentos = atendimentos['total'] if atendimentos else 0
    print(f"Total de atendimentos no banco: {total_atendimentos}")
    
    if total_protocolos == 0:
        print("\nATENÇÃO: Não há protocolos cadastrados no banco!")
        print("Você precisa importar os dados do Excel primeiro.")
    
    if total_atendimentos == 0:
        print("\nATENÇÃO: Não há atendimentos cadastrados no banco!")
        print("Você precisa importar os atendimentos primeiro.")

if __name__ == '__main__':
    verificar_estado_atual()
