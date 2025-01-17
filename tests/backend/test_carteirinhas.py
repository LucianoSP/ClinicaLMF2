import pytest
from app import app
import json
from datetime import datetime

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

class TestCarteirinhas:
    def setup_method(self):
        # Sample data for testing
        self.valid_carteirinha = {
            "numero": "123456789",
            "validade": "2024-12-31",
            "plano_id": 1,
            "paciente_id": 1
        }
        
        self.invalid_carteirinha = {
            "numero": "",
            "validade": "",
            "plano_id": None,
            "paciente_id": None
        }

    def test_create_carteirinha_success(self, client):
        response = client.post('/api/carteirinhas',
                             data=json.dumps(self.valid_carteirinha),
                             content_type='application/json')
        data = json.loads(response.data)
        
        assert response.status_code == 201
        assert data['message'] == 'Carteirinha created successfully'
        assert 'id' in data
        assert data['carteirinha']['numero'] == self.valid_carteirinha['numero']

    def test_create_carteirinha_invalid(self, client):
        response = client.post('/api/carteirinhas',
                             data=json.dumps(self.invalid_carteirinha),
                             content_type='application/json')
        data = json.loads(response.data)
        
        assert response.status_code == 400
        assert 'error' in data

    def test_get_carteirinhas(self, client):
        # First create a carteirinha
        client.post('/api/carteirinhas',
                   data=json.dumps(self.valid_carteirinha),
                   content_type='application/json')
        
        # Then get all carteirinhas
        response = client.get('/api/carteirinhas')
        data = json.loads(response.data)
        
        assert response.status_code == 200
        assert isinstance(data, list)
        assert len(data) > 0

    def test_get_carteirinha_by_id(self, client):
        # First create a carteirinha
        create_response = client.post('/api/carteirinhas',
                                    data=json.dumps(self.valid_carteirinha),
                                    content_type='application/json')
        created_data = json.loads(create_response.data)
        carteirinha_id = created_data['id']
        
        # Then get the specific carteirinha
        response = client.get(f'/api/carteirinhas/{carteirinha_id}')
        data = json.loads(response.data)
        
        assert response.status_code == 200
        assert data['id'] == carteirinha_id
        assert data['numero'] == self.valid_carteirinha['numero']

    def test_get_carteirinha_not_found(self, client):
        response = client.get('/api/carteirinhas/99999')
        data = json.loads(response.data)
        
        assert response.status_code == 404
        assert 'error' in data

    def test_update_carteirinha_success(self, client):
        # First create a carteirinha
        create_response = client.post('/api/carteirinhas',
                                    data=json.dumps(self.valid_carteirinha),
                                    content_type='application/json')
        created_data = json.loads(create_response.data)
        carteirinha_id = created_data['id']
        
        # Update data
        updated_data = {
            "numero": "987654321",
            "validade": "2025-12-31",
            "plano_id": 1,
            "paciente_id": 1
        }
        
        response = client.put(f'/api/carteirinhas/{carteirinha_id}',
                            data=json.dumps(updated_data),
                            content_type='application/json')
        data = json.loads(response.data)
        
        assert response.status_code == 200
        assert data['message'] == 'Carteirinha updated successfully'
        assert data['carteirinha']['numero'] == updated_data['numero']

    def test_update_carteirinha_invalid(self, client):
        response = client.put('/api/carteirinhas/1',
                            data=json.dumps(self.invalid_carteirinha),
                            content_type='application/json')
        data = json.loads(response.data)
        
        assert response.status_code == 400
        assert 'error' in data

    def test_delete_carteirinha_success(self, client):
        # First create a carteirinha
        create_response = client.post('/api/carteirinhas',
                                    data=json.dumps(self.valid_carteirinha),
                                    content_type='application/json')
        created_data = json.loads(create_response.data)
        carteirinha_id = created_data['id']
        
        # Then delete it
        response = client.delete(f'/api/carteirinhas/{carteirinha_id}')
        data = json.loads(response.data)
        
        assert response.status_code == 200
        assert data['message'] == 'Carteirinha deleted successfully'

    def test_delete_carteirinha_not_found(self, client):
        response = client.delete('/api/carteirinhas/99999')
        data = json.loads(response.data)
        
        assert response.status_code == 404
        assert 'error' in data

    def test_create_carteirinha_duplicate_numero(self, client):
        # First create a carteirinha
        client.post('/api/carteirinhas',
                   data=json.dumps(self.valid_carteirinha),
                   content_type='application/json')
        
        # Try to create another carteirinha with the same number
        response = client.post('/api/carteirinhas',
                             data=json.dumps(self.valid_carteirinha),
                             content_type='application/json')
        data = json.loads(response.data)
        
        assert response.status_code == 400
        assert 'error' in data
        assert 'duplicate' in data['error'].lower()