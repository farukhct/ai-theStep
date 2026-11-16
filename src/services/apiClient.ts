export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, code = 'API_ERROR', status = 400, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie ? document.cookie.split('; ') : [];
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = decodeURIComponent(part.slice(0, idx));
    if (key === name) {
      return decodeURIComponent(part.slice(idx + 1));
    }
  }
  return null;
}

let cachedCsrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

// Strictly in-memory session fallback for cross-site iframes that block third-party cookies.
// Never persisted to localStorage or sessionStorage.
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let inMemoryMfaPendingToken: string | null = null;

export function setInMemorySessionTokens(tokens: {
  accessToken?: string;
  refreshToken?: string;
  mfaPendingToken?: string;
}): void {
  if (tokens.accessToken) inMemoryAccessToken = tokens.accessToken;
  if (tokens.refreshToken) inMemoryRefreshToken = tokens.refreshToken;
  if (tokens.mfaPendingToken) inMemoryMfaPendingToken = tokens.mfaPendingToken;
}

export function getInMemoryMfaPendingToken(): string | null {
  return inMemoryMfaPendingToken;
}

export function clearInMemorySessionTokens(): void {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  inMemoryMfaPendingToken = null;
}

export async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const existingCookie = readCookie('thesteps_csrf');
    if (existingCookie && existingCookie.length >= 16) {
      cachedCsrfToken = existingCookie;
      return existingCookie;
    }
    if (cachedCsrfToken && cachedCsrfToken.length >= 16) {
      return cachedCsrfToken;
    }
  }
  if (csrfPromise) return csrfPromise;

  csrfPromise = fetch('/api/auth/csrf', {
    method: 'GET',
    credentials: 'include'
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      const token = (data.csrfToken as string) || readCookie('thesteps_csrf') || '';
      if (token) cachedCsrfToken = token;
      return token;
    })
    .finally(() => {
      csrfPromise = null;
    });

  return csrfPromise;
}

let refreshFlight: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (refreshFlight) return refreshFlight;
  refreshFlight = (async () => {
    try {
      const csrf = await ensureCsrfToken();
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        body: inMemoryRefreshToken ? JSON.stringify({ refreshToken: inMemoryRefreshToken }) : undefined
      });
      if (!res.ok) {
        clearInMemorySessionTokens();
        return false;
      }
      const data = await res.json().catch(() => null);
      if (data?.accessToken || data?.refreshToken) {
        setInMemorySessionTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        });
      }
      return true;
    } catch {
      return false;
    } finally {
      refreshFlight = null;
    }
  })();
  return refreshFlight;
}

const SKIP_REFRESH_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/me',
  '/api/auth/verify-mfa',
  '/api/admin/auth/login',
  '/api/admin/auth/verify-mfa',
  '/api/admin/auth/refresh'
]);

export async function apiRequest<T = any>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    skipRefresh?: boolean;
  } = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  const headers: Record<string, string> = {};

  if (inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  if (method !== 'GET') {
    const csrf = await ensureCsrfToken();
    headers['X-CSRF-Token'] = csrf;
  }

  let bodyPayload: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyPayload = JSON.stringify(options.body);
  }

  let response = await fetch(url, {
    method,
    credentials: 'include',
    headers,
    body: bodyPayload
  });

  if (response.status === 403 && method !== 'GET') {
    const clone = response.clone();
    const errBody = await clone.json().catch(() => null);
    if (errBody?.error === 'CSRF_TOKEN_MISSING' || errBody?.error === 'CSRF_TOKEN_MISMATCH') {
      cachedCsrfToken = null;
      headers['X-CSRF-Token'] = await ensureCsrfToken(true);
      response = await fetch(url, {
        method,
        credentials: 'include',
        headers,
        body: bodyPayload
      });
    }
  }

  if (response.status === 401 && !options.skipRefresh && !SKIP_REFRESH_PATHS.has(url.split('?')[0])) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      if (inMemoryAccessToken) {
        headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
      }
      if (method !== 'GET') {
        headers['X-CSRF-Token'] = await ensureCsrfToken();
      }
      response = await fetch(url, {
        method,
        credentials: 'include',
        headers,
        body: bodyPayload
      });
    }
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(response.statusText || 'Request failed', 'HTTP_ERROR', response.status);
    }
    return (await response.text()) as unknown as T;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(
      data.message || 'Request failed',
      data.error || 'API_ERROR',
      response.status,
      data.details
    );
  }
  return data as T;
}
