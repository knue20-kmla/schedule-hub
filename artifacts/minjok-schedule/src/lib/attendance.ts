// Attendance records, stored under the same localStorage key and in the same shape as the standalone
// timetable/attendance app (kim-taewan-attendance). Both apps are served from knue20-kmla.github.io,
// so on one device/browser they read and write the same records.
// Only exceptions are stored (지각/결석/조퇴); a student without a record counts as present.

export const STORAGE_KEY = 'kim-taewan-attendance-v2';
export const STATUSES = ['지각', '결석', '조퇴'] as const;
export type Status = (typeof STATUSES)[number];

export type AttendanceRecord = {
  date: string; sessionKey: string; sessionLabel: string; subject: string; day: string; period: string;
  section: string; student: string; status: string; updatedAt: string;
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

export function statusOf(records: Records, session: SessionInfo, section: string, student: string): string {
  return records[recordKey(session.date, sessionKeyOf(session.date, session.period), section, student)]?.status ?? '';
}

// Read-modify-write so changes made meanwhile in the other app/tab are not lost. Tapping the active status clears it.
export function toggleStatus(session: SessionInfo, entry: EntryInfo, status: Status): Records {
  const records = loadRecords();
  const sessionKey = sessionKeyOf(session.date, session.period);
  const key = recordKey(session.date, sessionKey, entry.section, entry.student);
  if (records[key]?.status === status) delete records[key];
  else {
    records[key] = {
      date: session.date, sessionKey, sessionLabel: `${session.period}교시 · ${session.label}`,
      subject: entry.subject || session.subject, day: session.day, period: String(session.period),
      section: entry.section, student: entry.student, status, updatedAt: new Date().toISOString(),
    };
  }
  saveRecords(records);
  return records;
}

export function clearSession(session: SessionInfo): Records {
  const records = loadRecords();
  const sessionKey = sessionKeyOf(session.date, session.period);
  Object.keys(records).forEach((key) => { if (records[key].date === session.date && records[key].sessionKey === sessionKey) delete records[key]; });
  saveRecords(records);
  return records;
}

export function countMarked(records: Records, session: SessionInfo, groups: { label: string; students: string[] }[]): number {
  return groups.reduce((sum, group) => sum + group.students.filter((student) => statusOf(records, session, group.label, student)).length, 0);
}
