// URL do backend - altere para a URL do seu Replit quando necessário
const isProduction = process.env.NODE_ENV === 'production';

export const API_URL = process.env.NEXT_PUBLIC_API_URL 
  ? isProduction 
    ? process.env.NEXT_PUBLIC_API_URL.replace('http://', 'https://')
    : process.env.NEXT_PUBLIC_API_URL
  : 'http://localhost:5000';
