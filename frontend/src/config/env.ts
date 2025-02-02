// Configuração centralizada das URLs da API
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fde1cb19-4f63-43d4-a9b7-a3d808e8d2b7-00-3cdk7z76k6er0.kirk.replit.dev';

// Exporta outras configurações de ambiente se necessário
export const ENV = {
  API_URL,
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};
