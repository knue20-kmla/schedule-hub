// Shared Google Identity Services (token flow) helpers. One access token per scope group, kept
// only in this tab's sessionStorage; no client secret is involved.

export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  '828976910521-clsh5dom9ms4e6ha7lduqldst6n37j5i.apps.googleusercontent.com';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

type TokenResponse = { access_token?: string; expires_in?: number | string; error?: string };
type TokenClient = { requestAccessToken: (options?: { prompt?: string }) => void };
type GoogleGlobal = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type?: string }) => void;
      }) => TokenClient;
      revoke: (token: string, done?: () => void) => void;
    };
  };
};
declare global {
  interface Window { google?: GoogleGlobal }
}

export type AccessToken = { value: string; expires: number };
export class AuthError extends Error {}
export class GoogleApiError extends Error {
  constructor(readonly status: number, readonly detail: string) { super(`google_${status}`); }
}

const isReady = () => Boolean(window.google?.accounts?.oauth2);

let gisLoading: Promise<void> | null = null;
export function loadGis(): Promise<void> {
  if (isReady()) return Promise.resolve();
  if (gisLoading) return gisLoading;
  gisLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { gisLoading = null; script.remove(); reject(new Error('구글 로그인 스크립트를 불러오지 못했어요.')); };
    document.head.appendChild(script);
  });
  return gisLoading;
}

const storageName = (slot: string) => `minjok-schedule.gtoken.${slot}.v1`;

export function readStoredToken(slot: string): AccessToken | null {
  try {
    const raw = sessionStorage.getItem(storageName(slot));
    if (!raw) return null;
    const token = JSON.parse(raw) as AccessToken;
    return token.value && token.expires > Date.now() ? token : null;
  } catch { return null; }
}
export function storeToken(slot: string, token: AccessToken | null) {
  try {
    if (token) sessionStorage.setItem(storageName(slot), JSON.stringify(token));
    else sessionStorage.removeItem(storageName(slot));
  } catch { /* The token only lives for this tab anyway. */ }
}

// Call from a click handler with the script already loaded, so the browser allows the popup.
export function requestToken(slot: string, scope: string, prompt: '' | 'consent' | 'select_account' = ''): Promise<AccessToken> {
  return new Promise((resolve, reject) => {
    if (!isReady()) { reject(new Error('구글 로그인 스크립트가 아직 준비되지 않았어요.')); return; }
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope,
      callback: (response) => {
        if (response.error || !response.access_token) { reject(new Error(response.error ?? 'no_token')); return; }
        const token = { value: response.access_token, expires: Date.now() + (Number(response.expires_in ?? 3600) - 60) * 1000 };
        storeToken(slot, token);
        resolve(token);
      },
      error_callback: (error) => reject(new Error(error.type ?? 'popup_failed')),
    });
    client.requestAccessToken({ prompt });
  });
}

export function revokeToken(slot: string, token: AccessToken | null) {
  storeToken(slot, null);
  if (token && isReady()) window.google!.accounts.oauth2.revoke(token.value);
}

async function send<T>(slot: string, token: AccessToken, url: string, method: 'GET' | 'POST'): Promise<T> {
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token.value}` } });
  if (response.status === 401) { storeToken(slot, null); throw new AuthError('expired'); }
  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as { error?: { message?: string; status?: string; errors?: { reason?: string }[] } };
      detail = [body.error?.status, body.error?.errors?.[0]?.reason, body.error?.message].filter(Boolean).join(' · ');
    } catch { /* No JSON body. */ }
    throw new GoogleApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

export function googleGet<T>(slot: string, token: AccessToken, url: string, params: Record<string, string | string[]> = {}): Promise<T> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => (Array.isArray(value) ? value : [value]).forEach((v) => query.append(key, v)));
  return send<T>(slot, token, `${url}?${query}`, 'GET');
}

export const googlePost = <T>(slot: string, token: AccessToken, url: string) => send<T>(slot, token, url, 'POST');
