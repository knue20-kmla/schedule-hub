// Syncs tasks and the private memo across devices through the signed-in user's own Google Drive
// "app data" folder: a hidden, per-app folder that only this app can read (scope drive.appdata).
// There is no server of ours in between. Attendance records (with student names) are synced too, but only
// while the "출결 기록도 동기화" switch is on; with it off the remote copy is left untouched.
import {
  googleGet, googleSend, readStoredToken as readSlot, requestToken as requestSlot, revokeToken,
  type AccessToken,
} from './google-auth';

const SLOT = 'drive';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const SCOPE = DRIVE_SCOPE;
const FILES = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const FILE_NAME = 'schedule-hub-sync.json';
const TOMBSTONE_TTL = 90 * 24 * 3600 * 1000;

export const readStoredDriveToken = () => readSlot(SLOT);
export const requestDriveToken = (prompt: '' | 'consent' | 'select_account' = '') => requestSlot(SLOT, SCOPE, prompt);
export const disconnectDrive = (token: AccessToken | null) => revokeToken(SLOT, token);

export type SyncTask = { id: number; updatedAt?: number } & Record<string, unknown>;
export type SyncNote = { text: string; at: number };
export type SyncRecord = { updatedAt?: string } & Record<string, unknown>;
export type SyncAttendance = { records: Record<string, SyncRecord>; deleted: Record<string, number> };
export type SyncSnapshot = { tasks: SyncTask[]; deleted: Record<string, number>; note: SyncNote; attendance?: SyncAttendance };
type RemoteFile = { v: 1; tasks: Record<string, SyncTask>; deleted: Record<string, number>; note: SyncNote; attendance?: SyncAttendance };

const stamp = (task: SyncTask | undefined) => task?.updatedAt ?? 0;
const recordStamp = (record: SyncRecord | undefined) => (record?.updatedAt ? Date.parse(record.updatedAt) || 0 : 0);

// Same last-writer-wins rule per attendance record, with tombstones for removed records.
function mergeAttendance(local: SyncAttendance, remote: SyncAttendance, now: number): SyncAttendance {
  const deleted: Record<string, number> = {};
  [local.deleted, remote.deleted].forEach((map) => Object.entries(map).forEach(([key, at]) => {
    if (now - at < TOMBSTONE_TTL) deleted[key] = Math.max(deleted[key] ?? 0, at);
  }));
  const records: Record<string, SyncRecord> = {};
  new Set([...Object.keys(local.records), ...Object.keys(remote.records)]).forEach((key) => {
    const l = local.records[key];
    const r = remote.records[key];
    const pick = l && r ? (recordStamp(r) > recordStamp(l) ? r : l) : (l ?? r);
    if (pick && (deleted[key] ?? 0) <= recordStamp(pick)) records[key] = pick;
  });
  return { records, deleted };
}

// Last-writer-wins per task and for the memo; deletions are remembered as tombstones so a task removed on
// one device is not brought back by another.
export function mergeSnapshots(local: SyncSnapshot, remote: SyncSnapshot | null, now = Date.now()): SyncSnapshot {
  if (!remote) return local;
  const remoteById = new Map(remote.tasks.map((task) => [String(task.id), task]));
  const localById = new Map(local.tasks.map((task) => [String(task.id), task]));

  const deleted: Record<string, number> = {};
  [local.deleted, remote.deleted].forEach((map) => Object.entries(map).forEach(([id, at]) => {
    if (now - at < TOMBSTONE_TTL) deleted[id] = Math.max(deleted[id] ?? 0, at);
  }));

  const winner = (id: string): SyncTask | null => {
    const l = localById.get(id);
    const r = remoteById.get(id);
    const pick = l && r ? (stamp(r) > stamp(l) ? r : l) : (l ?? r);
    if (!pick) return null;
    return (deleted[id] ?? 0) > stamp(pick) ? null : pick;
  };

  const kept: SyncTask[] = [];
  local.tasks.forEach((task) => { const w = winner(String(task.id)); if (w) kept.push(w); });
  const fresh: SyncTask[] = [];
  remote.tasks.forEach((task) => { if (!localById.has(String(task.id))) { const w = winner(String(task.id)); if (w) fresh.push(w); } });
  fresh.sort((a, b) => Number(b.id) - Number(a.id));

  const note = remote.note.at > local.note.at ? remote.note : local.note;
  // Attendance off on this device: keep whatever the cloud already has instead of dropping it.
  const attendance = local.attendance ? (remote.attendance ? mergeAttendance(local.attendance, remote.attendance, now) : local.attendance) : remote.attendance;
  return { tasks: [...fresh, ...kept], deleted, note, ...(attendance ? { attendance } : {}) };
}

export const sameSnapshot = (a: SyncSnapshot, b: SyncSnapshot) => {
  const norm = (s: SyncSnapshot) => JSON.stringify({
    tasks: [...s.tasks].sort((x, y) => Number(x.id) - Number(y.id)),
    deleted: Object.fromEntries(Object.entries(s.deleted).sort()),
    note: s.note,
    attendance: s.attendance ? { records: Object.fromEntries(Object.entries(s.attendance.records).sort()), deleted: Object.fromEntries(Object.entries(s.attendance.deleted).sort()) } : null,
  });
  return norm(a) === norm(b);
};

const toRemote = (snapshot: SyncSnapshot): RemoteFile => ({
  v: 1,
  tasks: Object.fromEntries(snapshot.tasks.map((task) => [String(task.id), task])),
  deleted: snapshot.deleted,
  note: snapshot.note,
  ...(snapshot.attendance ? { attendance: snapshot.attendance } : {}),
});
const fromRemote = (file: RemoteFile): SyncSnapshot => ({
  tasks: Object.values(file.tasks ?? {}),
  deleted: file.deleted ?? {},
  note: file.note ?? { text: '', at: 0 },
  ...(file.attendance ? { attendance: file.attendance } : {}),
});

async function findFile(token: AccessToken): Promise<string | null> {
  const list = await googleGet<{ files?: { id: string }[] }>(SLOT, token, FILES, {
    spaces: 'appDataFolder', q: `name='${FILE_NAME}' and trashed=false`, fields: 'files(id)', pageSize: '1',
  });
  return list.files?.[0]?.id ?? null;
}

export async function readRemote(token: AccessToken): Promise<{ id: string | null; snapshot: SyncSnapshot | null }> {
  const id = await findFile(token);
  if (!id) return { id: null, snapshot: null };
  const file = await googleGet<RemoteFile>(SLOT, token, `${FILES}/${id}`, { alt: 'media' });
  return { id, snapshot: file && typeof file === 'object' ? fromRemote(file) : null };
}

export async function writeRemote(token: AccessToken, id: string | null, snapshot: SyncSnapshot): Promise<void> {
  const body = JSON.stringify(toRemote(snapshot));
  if (id) {
    await googleSend(SLOT, token, `${UPLOAD}/${id}?uploadType=media`, 'PATCH', body, 'application/json');
    return;
  }
  const boundary = `hub${Date.now()}`;
  const multipart = [
    `--${boundary}`, 'Content-Type: application/json; charset=UTF-8', '',
    JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] }),
    `--${boundary}`, 'Content-Type: application/json', '', body,
    `--${boundary}--`, '',
  ].join('\r\n');
  await googleSend(SLOT, token, `${UPLOAD}?uploadType=multipart&fields=id`, 'POST', multipart, `multipart/related; boundary=${boundary}`);
}

// One full round: read remote, merge with local, return what to apply locally and whether to upload.
export async function syncOnce(token: AccessToken, local: SyncSnapshot) {
  const { id, snapshot } = await readRemote(token);
  const merged = mergeSnapshots(local, snapshot);
  const needsUpload = !snapshot || !sameSnapshot(merged, snapshot);
  if (needsUpload) await writeRemote(token, id, merged);
  // Cloud-only attendance (switch off here) is not something to apply locally.
  const mergedForLocal = local.attendance ? merged : { ...merged, attendance: undefined };
  return { merged, changedLocal: !sameSnapshot(mergedForLocal, local), uploaded: needsUpload };
}
