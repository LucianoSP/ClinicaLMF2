from database import contar_protocolos, listar_guias


def verificar_estado_atual():
    """Verifica o estado atual das tabelas do banco de dados"""
    # Conta protocolos
    total_protocolos = contar_protocolos()
    print(f"\nTotal de protocolos no banco: {total_protocolos}")

    # Conta execucaos
    execucaos = listar_guias(limit=0)
    total_execucaos = execucaos["total"] if execucaos else 0
    print(f"Total de execucaos no banco: {total_execucaos}")

    if total_protocolos == 0:
        print("\nATENÇÃO: Não há protocolos cadastrados no banco!")
        print("Você precisa importar os dados do Excel primeiro.")

    if total_execucaos == 0:
        print("\nATENÇÃO: Não há execucaos cadastrados no banco!")
        print("Você precisa importar os execucaos primeiro.")


if __name__ == "__main__":
    verificar_estado_atual()
