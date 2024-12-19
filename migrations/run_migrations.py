import os
from config import supabase

def run_migration(file_path: str) -> bool:
    """
    Executa um arquivo de migração SQL no Supabase.
    
    Args:
        file_path: Caminho para o arquivo .sql
        
    Returns:
        bool: True se a migração foi executada com sucesso, False caso contrário
    """
    try:
        # Lê o conteúdo do arquivo SQL
        with open(file_path, 'r', encoding='utf-8') as f:
            sql = f.read()
            
        # Divide o SQL em comandos individuais
        commands = sql.split(';')
        
        # Executa cada comando
        for command in commands:
            command = command.strip()
            if command:  # Ignora linhas vazias
                print(f"Executando comando:\n{command}\n")
                supabase.table('dummy').select('*').execute()  # Força autenticação
                # Execute o comando SQL bruto
                response = supabase.postgrest.schema('public').rpc('exec_sql', {'sql': command})
                print(f"Resposta: {response}\n")
                
        return True
        
    except Exception as e:
        print(f"Erro ao executar migração: {e}")
        return False

def main():
    """Executa todas as migrações pendentes."""
    # Diretório atual
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Lista todos os arquivos .sql no diretório
    migration_files = [f for f in os.listdir(current_dir) if f.endswith('.sql')]
    migration_files.sort()  # Ordena por nome para garantir ordem de execução
    
    print(f"Encontradas {len(migration_files)} migrações para executar:")
    for file in migration_files:
        print(f"- {file}")
    
    # Executa cada migração
    for file in migration_files:
        file_path = os.path.join(current_dir, file)
        print(f"\nExecutando migração: {file}")
        
        success = run_migration(file_path)
        if success:
            print(f"✓ Migração {file} executada com sucesso!")
        else:
            print(f"✗ Erro ao executar migração {file}")
            break

if __name__ == "__main__":
    main()
