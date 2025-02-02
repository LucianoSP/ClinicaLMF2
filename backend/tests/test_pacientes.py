from fastapi.testclient import TestClient
from datetime import datetime
from app import app

client = TestClient(app)

def test_criar_paciente():
    paciente_dados = {
        "nome": "Teste Paciente",
        "nome_responsavel": "Responsável Teste",
        "cpf": "12345678900",
        "data_nascimento": datetime.now().isoformat(),
        "telefone": "11999999999",
        "email": "teste@teste.com"
    }
    
    response = client.post("/pacientes", json=paciente_dados)
    assert response.status_code == 200
    assert response.json()["nome"] == paciente_dados["nome"]

def test_listar_pacientes():
    response = client.get("/pacientes")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
