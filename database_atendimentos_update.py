def init_db():
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        # Criar tabela temporária com a nova estrutura
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS atendimentos_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_execucao TEXT NOT NULL,
            paciente_carteirinha TEXT NOT NULL,
            paciente_nome TEXT NOT NULL,
            guia_id TEXT NOT NULL,
            codigo_ficha TEXT,
            possui_assinatura BOOLEAN NOT NULL DEFAULT 1
        )
        ''')

        # Copiar dados da tabela antiga para a nova
        cursor.execute('''
        INSERT INTO atendimentos_new (
            id, data_execucao, paciente_carteirinha, paciente_nome, 
            guia_id, codigo_ficha, possui_assinatura
        )
        SELECT 
            id, data_atendimento, numero_carteira, nome_beneficiario,
            numero_guia_principal, codigo_ficha, possui_assinatura
        FROM atendimentos
        ''')

        # Remover tabela antiga
        cursor.execute('DROP TABLE atendimentos')

        # Renomear nova tabela
        cursor.execute('ALTER TABLE atendimentos_new RENAME TO atendimentos')

        conn.commit()
        conn.close()
        print("Tabela 'atendimentos' atualizada com sucesso!")
        return True
    except sqlite3.Error as e:
        print(f"Erro no SQLite ao atualizar a tabela atendimentos: {e}")
        return False
