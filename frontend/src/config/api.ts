// URL do backend - altere para a URL do seu Replit quando necessário
export const API_URL = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace('http://', 'https://')
  : 'http://localhost:5000';
