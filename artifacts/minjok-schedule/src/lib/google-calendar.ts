// Read-only Google Calendar access from the browser (Google Identity Services token flow).
// The OAuth client ID is public by design; no client secret is used or needed.

export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  '828976910521-clsh5dom9ms4e6ha7lduqldst6n37j5i.apps.googleusercontent.com';

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const TOKEN_KEY = 'minjok-schedule.gtoken.v1';
const API = 'https://www.googleapis.com/calendar/v3';

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
export type LiveEvent = { id: string; dayKey: string; sort: string; time: string; title: string; note: string; tag: string };

export class AuthError extends Error {}

export function dayKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isReady() { return Boolean(window.google?.accounts?.oauth2); }

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

export function readStoredToken(): AccessToken | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const token = JSON.parse(raw) as AccessToken;
    return token.value && token.expires > Date.now() ? token : null;
  } catch { return null; }
}
function storeToken(token: AccessToken | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* The token only lives for this tab anyway. */ }
}

// Call from a click handler, with the script already loaded, so the browser allows the popup.
export function requestToken(prompt: '' | 'consent' | 'select_account' = ''): Promise<AccessToken> {
  return new Promise((resolve, reject) => {
    if (!isReady()) { reject(new Error('구글 로그인 스크립트가 아직 준비되지 않았어요.')); return; }
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) { reject(new Error(response.error ?? 'no_token')); return; }
        const token = { value: response.access_token, expires: Date.now() + (Number(response.expires_in ?? 3600) - 60) * 1000 };
        storeToken(token);
        resolve(token);
      },
      error_callback: (error) => reject(new Error(error.type ?? 'popup_failed')),
    });
    client.requestAccessToken({ prompt });
  });
}

export function disconnect(token: AccessToken | null) {
  storeToken(null);
  if (token && isReady()) window.google!.accounts.oauth2.revoke(token.value);
}

async function api<T>(token: AccessToken, path: string, params: Record<string, string> = {}): Promise<T> {
  const url = `${API}${path}?${new URLSearchParams(params)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token.value}` } });
  if (response.status === 401) { storeToken(null); throw new AuthError('expired'); }
  if (!response.ok) throw new Error(`calendar_${response.status}`);
  return response.json() as Promise<T>;
}

type ApiCalendar = { id: string; summary?: string; summaryOverride?: string; selected?: boolean };
type ApiEvent = {
  id: string; status?: string; summary?: string; location?: string;
  start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string };
};

const pad2 = (n: number) => String(n).padStart(2, '0');

// Fetches events of every calendar the user has switched on, for [from, to) in local time.
export async function fetchEvents(token: AccessToken, from: Date, to: Date): Promise<LiveEvent[]> {
  const list = await api<{ items?: ApiCalendar[] }>(token, '/users/me/calendarList', { minAccessRole: 'reader', maxResults: '50' });
  const calendars = (list.items ?? []).filter((calendar) => calendar.selected).slice(0, 12);
  const windowKeys = new Set<string>();
  for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) windowKeys.add(dayKey(d));

  const perCalendar = await Promise.all(calendars.map(async (calendar) => {
    const data = await api<{ items?: ApiEvent[] }>(token, `/calendars/${encodeURIComponent(calendar.id)}/events`, {
      timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '100',
    });
    const tag = calendar.summaryOverride ?? calendar.summary ?? '캘린더';
    const events: LiveEvent[] = [];
    for (const item of data.items ?? []) {
      if (item.status === 'cancelled' || !item.start) continue;
      const title = item.summary?.trim() || '(제목 없음)';
      const note = item.location?.trim() ?? '';
      if (item.start.dateTime) {
        const start = new Date(item.start.dateTime);
        const time = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;
        events.push({ id: `${calendar.id}:${item.id}`, dayKey: dayKey(start), sort: time, time, title, note, tag });
      } else if (item.start.date) {
        // All-day events: `end.date` is exclusive; show the event on each day of the window it covers.
        const [sy, sm, sd] = item.start.date.split('-').map(Number);
        const [ey, em, ed] = (item.end?.date ?? item.start.date).split('-').map(Number);
        const last = new Date(ey, em - 1, ed);
        for (let d = new Date(sy, sm - 1, sd); d < last || dayKey(d) === item.start.date; d.setDate(d.getDate() + 1)) {
          const key = dayKey(d);
          if (windowKeys.has(key)) events.push({ id: `${calendar.id}:${item.id}:${key}`, dayKey: key, sort: '00:00', time: '종일', title, note, tag });
        }
      }
    }
    return events;
  }));
  return perCalendar.flat().sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.sort.localeCompare(b.sort));
}
