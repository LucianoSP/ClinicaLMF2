import axios from 'axios';
import { API_URL } from '@/config/env';

const baseURL = API_URL;

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Desabilitando withCredentials já que o backend está com CORS totalmente permissivo
  timeout: 10000, // 10 segundos
});

// Interceptor para normalizar URLs (remover barras finais)
api.interceptors.request.use(
  (config) => {
    // Log da requisição
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data,
    });

    // Remover barras finais da URL, exceto se for apenas "/"
    if (config.url && config.url !== "/" && config.url.endsWith("/")) {
      config.url = config.url.slice(0, -1);
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => {
    // Log da resposta
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      console.error('[API Error]', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });
    } else {
      console.error('[API Unknown Error]', error);
    }
    return Promise.reject(error);
  }
);

export { axios };
