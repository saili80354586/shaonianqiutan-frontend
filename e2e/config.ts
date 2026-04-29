export const APP_BASE_URL =
  process.env.E2E_APP_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

export const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:8080';

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
