const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api'
);

export const getApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const getWebSocketUrl = (token: string) => {
  const configuredUrl = (import.meta.env.VITE_WS_URL || '').trim();
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const withToken = (url: URL) => {
    if (url.protocol === 'https:') url.protocol = 'wss:';
    if (url.protocol === 'http:') url.protocol = 'ws:';
    if (url.pathname === '/' || url.pathname === '') url.pathname = '/ws';
    url.searchParams.set('token', token);
    return url.toString();
  };

  if (!configuredUrl) {
    return `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
  }

  if (configuredUrl.startsWith('ws://') || configuredUrl.startsWith('wss://')) {
    return withToken(new URL(configuredUrl));
  }

  if (configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')) {
    return withToken(new URL(configuredUrl));
  }

  if (configuredUrl.startsWith('/')) {
    return withToken(new URL(configuredUrl, window.location.origin));
  }

  return withToken(new URL(`${protocol}//${trimTrailingSlash(configuredUrl)}`));
};
