def init_db():
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        # Criar tabela temporária com a nova estrutura
        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS execucaos_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_execucao TEXT NOT NULL,
            paciente_carteirinha TEXT NOT NULL,
            paciente_nome TEXT NOT NULL,
            guia_id TEXT NOT NULL,
            codigo_ficha TEXT,
            possui_assinatura BOOLEAN NOT NULL DEFAULT 1
        )
        """
        )

        # Copiar dados da tabela antiga para a nova
        cursor.execute(
            """
        INSERT INTO execucaos_new (
            id, data_execucao, paciente_carteirinha, paciente_nome, 
            guia_id, codigo_ficha, possui_assinatura
        )
        SELECT 
            id, data_execucao, numero_carteira, paciente_nome,
            numero_guia_principal, codigo_ficha, possui_assinatura
        FROM execucaos
        """
        )

        # Remover tabela antiga
        cursor.execute("DROP TABLE execucaos")

        # Renomear nova tabela
        cursor.execute("ALTER TABLE execucaos_new RENAME TO execucaos")

        conn.commit()
        conn.close()
        print("Tabela 'execucaos' atualizada com sucesso!")
        return True
    except sqlite3.Error as e:
        print(f"Erro no SQLite ao atualizar a tabela execucaos: {e}")
        return False
