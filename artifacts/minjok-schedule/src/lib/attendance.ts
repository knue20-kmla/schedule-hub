// Attendance records, stored under the same localStorage key and in the same shape as the standalone
// timetable/attendance app (kim-taewan-attendance). Both apps are served from knue20-kmla.github.io,
// so on one device/browser they read and write the same records.
// Only exceptions are stored (지각/결석/조퇴); a student without a record counts as present.
// 인정/미인정 is stored in a separate `recognition` field so `status` stays 지각/결석/조퇴 and the standalone app
// keeps working (it ignores the extra field and shows the record as a plain 지각/결석/조퇴).

export const STORAGE_KEY = 'kim-taewan-attendance-v2';
export const STATUSES = ['지각', '결석', '조퇴'] as const;
export type Status = (typeof STATUSES)[number];
export const RECOGNITIONS = ['미인정', '인정'] as const;
export type Recognition = (typeof RECOGNITIONS)[number];

export type AttendanceRecord = {
  date: string; sessionKey: string; sessionLabel: string; subject: string; day: string; period: string;
  section: string; student: string; status: string; recognition?: string; updatedAt: string;
};
export type Records = Record<string, AttendanceRecord>;

export type SessionInfo = { date: string; day: string; period: number; label: string; subject: string };
export type EntryInfo = { section: string; subject: string; student: string };

export const sessionKeyOf = (date: string, period: number) => `${date}|${period}`;
export const recordKey = (date: string, sessionKey: string, section: string, student: string) => [date, sessionKey, section, student].join('|');

export function loadRecords(): Records {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Records) : {};
  } catch { return {}; }
}
function saveRecords(records: Records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// Removed records are remembered (key -> time) so device sync does not bring them back. The standalone
// attendance app writes to the same key when it removes a record.
export const DELETED_KEY = 'minjok-schedule.att-deleted.v1';
export function loadDeleted(): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DELETED_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch { return {}; }
}
function markDeleted(keys: string[]) {
  if (!keys.length) return;
  const map = loadDeleted();
  const now = Date.now();
  keys.forEach((key) => { map[key] = now; });
  try { localStorage.setItem(DELETED_KEY, JSON.stringify(map)); } catch { /* Optional. */ }
}
export function replaceAll(records: Records, deleted: Record<string, number>) {
  saveRecords(records);
  try { localStorage.setItem(DELETED_KEY, JSON.stringify(deleted)); } catch { /* Optional. */ }
}

export function statusOf(records: Records, session: SessionInfo, section: string, student: string): string {
  return records[recordKey(session.date, sessionKeyOf(session.date, session.period), section, student)]?.status ?? '';
}

export function recognitionOf(records: Records, session: SessionInfo, section: string, student: string): string {
  return records[recordKey(session.date, sessionKeyOf(session.date, session.period), section, student)]?.recognition ?? '';
}

// Read-modify-write so changes made meanwhile in the other app/tab are not lost.
// Tapping the active status with the same 인정/미인정 clears it; with the other one it switches the recognition.
export function toggleStatus(session: SessionInfo, entry: EntryInfo, status: Status, recognition: Recognition): Records {
  const records = loadRecords();
  const sessionKey = sessionKeyOf(session.date, session.period);
  const key = recordKey(session.date, sessionKey, entry.section, entry.student);
  if (records[key]?.status === status && records[key]?.recognition === recognition) { delete records[key]; markDeleted([key]); }
  else {
    records[key] = {
      date: session.date, sessionKey, sessionLabel: `${session.period}교시 · ${session.label}`,
      subject: entry.subject || session.subject, day: session.day, period: String(session.period),
      section: entry.section, student: entry.student, status, recognition, updatedAt: new Date().toISOString(),
    };
  }
  saveRecords(records);
  return records;
}

export function clearSession(session: SessionInfo): Records {
  const records = loadRecords();
  const sessionKey = sessionKeyOf(session.date, session.period);
  const removed: string[] = [];
  Object.keys(records).forEach((key) => { if (records[key].date === session.date && records[key].sessionKey === sessionKey) { delete records[key]; removed.push(key); } });
  markDeleted(removed);
  saveRecords(records);
  return records;
}

export function countMarked(records: Records, session: SessionInfo, groups: { label: string; students: string[] }[]): number {
  return groups.reduce((sum, group) => sum + group.students.filter((student) => statusOf(records, session, group.label, student)).length, 0);
}
