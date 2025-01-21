export const API_URLS = {
  MAIN_API: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  SCRAPING_API: process.env.NEXT_PUBLIC_SCRAPING_API_URL || 'https://72b32733-1de3-4ad4-9612-06b81c41b532-00-3ogme2rkcpgq4.janeway.replit.dev:3000'
} as const;
