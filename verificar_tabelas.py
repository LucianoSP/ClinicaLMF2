import sqlite3


def verificar_tabelas():
    conn = sqlite3.connect("clinica_larissa.db")
    cursor = conn.cursor()

    # Verificar protocolos_excel
    cursor.execute("SELECT COUNT(*) FROM protocolos_excel")
    total_protocolos = cursor.fetchone()[0]
    print(f"\nTotal de registros em protocolos_excel: {total_protocolos}")

    if total_protocolos > 0:
        cursor.execute("SELECT * FROM protocolos_excel LIMIT 1")
        exemplo = cursor.fetchone()
        print(f"Exemplo de registro em protocolos_excel: {exemplo}")

    # Verificar execucaos
    cursor.execute("SELECT COUNT(*) FROM execucaos")
    total_execucaos = cursor.fetchone()[0]
    print(f"\nTotal de registros em execucaos: {total_execucaos}")

    if total_execucaos > 0:
        cursor.execute("SELECT * FROM execucaos LIMIT 1")
        exemplo = cursor.fetchone()
        print(f"Exemplo de registro em execucaos: {exemplo}")

    # Verificar divergências
    cursor.execute("SELECT COUNT(*) FROM divergencias")
    total_divergencias = cursor.fetchone()[0]
    print(f"\nTotal de registros em divergencias: {total_divergencias}")

    if total_divergencias > 0:
        cursor.execute("SELECT * FROM divergencias LIMIT 1")
        exemplo = cursor.fetchone()
        print(f"Exemplo de registro em divergencias: {exemplo}")

    conn.close()


if __name__ == "__main__":
    verificar_tabelas()
