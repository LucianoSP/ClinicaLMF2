from storage_r2 import storage
import os

def test_r2_connection():
    print("Testando conexão com R2...")
    
    # Testa listagem de arquivos
    print("\n1. Testando listagem de arquivos:")
    files = storage.list_files()
    print(f"Arquivos encontrados: {len(files)}")
    for file in files:
        print(f"- {file['nome']} ({file['size']} bytes)")
    
    # Testa upload de arquivo
    print("\n2. Testando upload de arquivo:")
    # Cria um arquivo de teste
    test_file = "test_file.txt"
    with open(test_file, "w") as f:
        f.write("Teste de upload R2")
    
    try:
        url = storage.upload_file(test_file, "test_upload.txt")
        print(f"Upload realizado com sucesso!")
        print(f"URL pública: {url}")
        
        # Testa deleção
        print("\n3. Testando deleção de arquivo:")
        success = storage.delete_files(["test_upload.txt"])
        if success:
            print("Arquivo deletado com sucesso!")
        else:
            print("Erro ao deletar arquivo")
            
    finally:
        # Limpa o arquivo de teste
        if os.path.exists(test_file):
            os.remove(test_file)

if __name__ == "__main__":
    test_r2_connection()
