import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://fde1cb19-4f63-43d4-a9b7-a3d808e8d2b7-00-3cdk7z76k6er0.kirk.replit.dev';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false // Desabilitando withCredentials já que o backend está com CORS totalmente permissivo
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
