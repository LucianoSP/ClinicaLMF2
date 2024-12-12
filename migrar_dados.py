from database_supabase import migrar_beneficiario_para_paciente_nome

if __name__ == "__main__":
    print("Iniciando migração de dados...")
    if migrar_beneficiario_para_paciente_nome():
        print("Migração concluída com sucesso!")
    else:
        print("Erro durante a migração")
