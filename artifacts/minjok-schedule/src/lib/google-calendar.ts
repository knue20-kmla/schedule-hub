// Read-only Google Calendar access from the browser (see google-auth.ts for the sign-in flow).
import {
  AuthError, googleGet, loadGis, readStoredToken as readSlot, requestToken as requestSlot, revokeToken,
  type AccessToken,
} from './google-auth';

export { AuthError, loadGis };
export type { AccessToken };

const SLOT = 'cal';
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const API = 'https://www.googleapis.com/calendar/v3';

export type LiveEvent = { id: string; dayKey: string; sort: string; time: string; title: string; note: string; tag: string };

export function dayKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const readStoredToken = () => readSlot(SLOT);
export const requestToken = (prompt: '' | 'consent' | 'select_account' = '') => requestSlot(SLOT, SCOPE, prompt);
export const disconnect = (token: AccessToken | null) => revokeToken(SLOT, token);

const api = <T>(token: AccessToken, path: string, params: Record<string, string> = {}) => googleGet<T>(SLOT, token, `${API}${path}`, params);

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
