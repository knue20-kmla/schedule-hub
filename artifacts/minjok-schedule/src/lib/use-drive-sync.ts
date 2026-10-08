import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthError, GoogleApiError, loadGis, type AccessToken } from './google-auth';
import { readStoredDriveToken, syncOnce, type SyncSnapshot } from './drive-sync';

export type SyncStatus = 'off' | 'login' | 'idle' | 'syncing' | 'ok' | 'error';

const LINKED_KEY = 'minjok-schedule.drive-linked.v1';
const readLinked = () => { try { return localStorage.getItem(LINKED_KEY) === '1'; } catch { return false; } };
const writeLinked = (on: boolean) => { try { if (on) localStorage.setItem(LINKED_KEY, '1'); else localStorage.removeItem(LINKED_KEY); } catch { /* Optional hint only. */ } };

// getSnapshot must return the latest local data; apply writes merged data back into app state.
// changeKey changes whenever synced local data changes, which schedules an upload.
export function useDriveSync(getSnapshot: () => SyncSnapshot, apply: (snapshot: SyncSnapshot) => void, changeKey: string) {
  const [token, setToken] = useState<AccessToken | null>(readStoredDriveToken);
  const [linked, setLinked] = useState(readLinked);
  const [status, setStatus] = useState<SyncStatus>(() => (readLinked() ? (readStoredDriveToken() ? 'idle' : 'login') : 'off'));
  const [message, setMessage] = useState('');
  const [lastAt, setLastAt] = useState<number | null>(null);
  const gisReady = useRef(false);
  const busy = useRef(false);
  const skipNext = useRef(false);
  const getRef = useRef(getSnapshot);
  const applyRef = useRef(apply);
  getRef.current = getSnapshot;
  applyRef.current = apply;

  useEffect(() => { loadGis().then(() => { gisReady.current = true; }).catch(() => { /* Offline. */ }); }, []);

  const run = useCallback(async (active: AccessToken) => {
    if (busy.current) return;
    busy.current = true;
    setStatus('syncing');
    setMessage('');
    try {
      const result = await syncOnce(active, getRef.current());
      if (result.changedLocal) { skipNext.current = true; applyRef.current(result.merged); }
      setLastAt(Date.now());
      setStatus('ok');
    } catch (error) {
      if (error instanceof AuthError) { setToken(null); setStatus('login'); }
      else if (error instanceof GoogleApiError && error.status === 403) {
        setStatus('error');
        setMessage(/accessNotConfigured|has not been used|is disabled|SERVICE_DISABLED/i.test(error.detail)
          ? 'Google Cloud에서 Drive API가 꺼져 있어요. 라이브러리에서 Google Drive API를 "사용"으로 켜 주세요.'
          : '드라이브 권한이 허용되지 않았어요. 연결 해제 후 다시 연결하면서 권한을 체크해 주세요.');
      } else { setStatus('error'); setMessage('동기화하지 못했어요. 인터넷 연결을 확인해 주세요.'); }
    } finally { busy.current = false; }
  }, []);

  // The sign-in itself happens once for all services (see connect.ts); this just receives the token.
  const adoptToken = useCallback((fresh: AccessToken) => {
    setToken(fresh);
    setLinked(true);
    writeLinked(true);
    void run(fresh);
  }, [run]);

  const syncNow = useCallback(async () => {
    if (token) await run(token);
  }, [token, run]);

  // Called when the token's lifetime ran out, so the UI can ask for a new sign-in.
  const invalidate = useCallback(() => { setToken(null); setStatus((current) => (current === 'off' ? current : 'login')); }, []);

  const unlink = useCallback(() => {
    setToken(null);
    setLinked(false);
    writeLinked(false);
    setStatus('off');
    setMessage('');
  }, []);

  // Sync once when the app opens (if signed in), and when it comes back to the foreground.
  useEffect(() => { if (token) void run(token); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible' && token && !busy.current && (!lastAt || Date.now() - lastAt > 30000)) void run(token); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [token, lastAt, run]);

  // Upload shortly after local changes.
  const firstChange = useRef(true);
  useEffect(() => {
    if (firstChange.current) { firstChange.current = false; return undefined; }
    if (skipNext.current) { skipNext.current = false; return undefined; }
    if (!token) return undefined;
    let timer = 0;
    const attempt = () => { if (busy.current) { timer = window.setTimeout(attempt, 1500); return; } void run(token); };
    timer = window.setTimeout(attempt, 2500);
    return () => window.clearTimeout(timer);
  }, [changeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { linked, status, message, lastAt, token, adoptToken, syncNow, unlink, invalidate };
}
