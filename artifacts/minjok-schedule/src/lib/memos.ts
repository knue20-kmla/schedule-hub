// Private memos: any number of them, each added / edited / deleted on its own and synced across devices.
// The single memo of older versions (minjok-schedule.note.v1) is migrated into the first memo on first load.

export type Memo = { id: number; text: string; updatedAt: number };

const KEY = 'minjok-schedule.memos.v1';
const DELETED_KEY = 'minjok-schedule.memos-deleted.v1';
const LEGACY_NOTE = 'minjok-schedule.note.v1';
const LEGACY_NOTE_AT = 'minjok-schedule.note-at.v1';
const SAMPLE_TEXT = '오늘 과학 수행평가 초안 제출하기. 끝나면 서점에 들러서 새 노트 구경하기.';

export function loadMemos(): Memo[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Memo[];
    }
    const legacy = localStorage.getItem(LEGACY_NOTE);
    const at = Number(localStorage.getItem(LEGACY_NOTE_AT) ?? 0) || 0;
    return [{ id: 1, text: legacy ?? SAMPLE_TEXT, updatedAt: at }];
  } catch { return [{ id: 1, text: SAMPLE_TEXT, updatedAt: 0 }]; }
}

export function loadMemosDeleted(): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DELETED_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch { return {}; }
}

export function saveMemos(memos: Memo[], deleted: Record<string, number>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(memos));
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
  } catch { /* Memos still work for this session when storage is unavailable. */ }
}

export const newestFirst = (memos: Memo[]) => [...memos].sort((a, b) => b.updatedAt - a.updatedAt || b.id - a.id);
