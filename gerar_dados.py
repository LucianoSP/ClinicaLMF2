from database_supabase import gerar_dados_teste
import random

if __name__ == "__main__":
    random.seed(42)  # Mantém a reprodutibilidade
    print("\n=== INICIANDO GERAÇÃO DE DADOS DE TESTE ===\n")
    sucesso = gerar_dados_teste()
    
    if sucesso:
        print("\n=== DADOS GERADOS COM SUCESSO! ===")
    else:
        print("\n=== ERRO AO GERAR DADOS ===")
