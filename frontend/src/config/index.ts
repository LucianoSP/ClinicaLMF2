import { API_URL } from './env';

export const config = {
  MAIN_API: API_URL,
  SCRAPING_API: process.env.NEXT_PUBLIC_SCRAPING_API_URL || 'https://72b32733-1de3-4ad4-9612-06b81c41b532-00-3ogme2rkcpgq4.janeway.replit.dev:3000'
} as const;
