import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Aqui podemos adicionar lógica para tratar erros específicos
    // Por exemplo, redirecionar para login se receber 401
    return Promise.reject(error);
  }
);
