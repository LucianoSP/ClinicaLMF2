def salvar_guia(info: Dict):
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        cursor.execute(
            """
        INSERT INTO execucaos (
            data_execucao, paciente_carteirinha, paciente_nome, 
            guia_id, codigo_ficha, possui_assinatura
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
            (
                info["data_execucao"],
                info["paciente_carteirinha"],
                info["paciente_nome"],
                info["guia_id"],
                info.get("codigo_ficha"),
                info.get("possui_assinatura", True),
            ),
        )

        last_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return last_id
    except sqlite3.Error as e:
        print(f"Erro ao salvar guia: {e}")
        return None


def listar_guias(limit: int = 100, offset: int = 0, paciente_nome: str = None):
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        # Base da query
        query = "SELECT * FROM execucaos"
        params = []

        # Adiciona filtro por nome se fornecido
        if paciente_nome:
            query += " WHERE paciente_nome LIKE ?"
            params.append(f"%{paciente_nome}%")

        # Adiciona paginação
        query += " ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        guias = cursor.fetchall()

        # Converter para lista de dicionários
        columns = [description[0] for description in cursor.description]
        result = []
        for guia in guias:
            guia_dict = dict(zip(columns, guia))
            result.append(guia_dict)

        conn.close()
        return result
    except sqlite3.Error as e:
        print(f"Erro ao listar guias: {e}")
        return []


def buscar_guia(guia_id: str):
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        cursor.execute(
            """
        SELECT * FROM execucaos WHERE guia_id = ?
        """,
            (guia_id,),
        )

        guias = cursor.fetchall()

        # Converter para lista de dicionários
        columns = [description[0] for description in cursor.description]
        result = []
        for guia in guias:
            guia_dict = dict(zip(columns, guia))
            result.append(guia_dict)

        conn.close()
        return result
    except sqlite3.Error as e:
        print(f"Erro ao buscar guia: {e}")
        return []
