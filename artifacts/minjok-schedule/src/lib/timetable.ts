// Teacher timetable read from the same Google Sheet as the standalone timetable app
// (sheet-timetable-app, https://knue20-kmla.github.io/timetable/). The lesson-parsing rules mirror that app.
// Only lesson names are used; student rosters in the sheet are never read or kept.

export const TIMETABLE_APP_URL = 'https://knue20-kmla.github.io/timetable/kim-taewan-attendance/';

const SHEET_ID = '1T1Dh0cqo3UwC_pkLpGBAVE5wIjJbOV8NMEWbCQ78qps';
const SHEETS = { original: '원본(818)', enroll: '수강현황(818)' };
const TEACHER = '김태완';
const DAYS = ['월', '화', '수', '목', '금'];
const DAY_STARTS: Record<string, number> = { 월: 4, 화: 12, 수: 20, 목: 28, 금: 36 };
const PERIOD_COUNT = 8;
const FIXED_LESSONS = new Map([['월|1', '애국조회/학급회의']]);
const PLAIN_BLOCK_RE = /^[A-H]+$/;
const GRADE_BLOCK_RE = /^([1-3](?:,[1-3])?)\/?([A-Za-z][A-Za-z0-9]*)$/;
const CACHE_KEY = 'minjok-schedule.timetable.v1';

export type Lesson = { period: number; text: string };
export type Timetable = { loadedAt: number; days: Record<string, Lesson[]> };

type Cell = { v?: unknown; f?: unknown } | null | undefined;
type Table = { cols: unknown[]; rows: { c: Cell[] }[] };
type Enrollment = Map<string, { teacher: string; block: string; subject: string }>;

const normalize = (value: unknown) => String(value ?? '').replace(/　/g, ' ').replace(/\r/g, '\n').trim();
const compact = (value: unknown) => normalize(value).replace(/\s+/g, '');
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cellValue = (cell: Cell) => normalize(cell?.f ?? cell?.v ?? '');

let seq = 0;
function gvizLoad(sheetName: string): Promise<Table> {
  return new Promise((resolve, reject) => {
    const callback = `__gviz_${Date.now()}_${seq++}`;
    const script = document.createElement('script');
    const w = window as unknown as Record<string, unknown>;
    const cleanup = () => { delete w[callback]; script.remove(); };
    w[callback] = (response: { status?: string; errors?: { detailed_message?: string }[]; table: Table }) => {
      cleanup();
      if (response.status && response.status !== 'ok') { reject(new Error(response.errors?.[0]?.detailed_message ?? response.status)); return; }
      resolve(response.table);
    };
    script.onerror = () => { cleanup(); reject(new Error(`${sheetName} 시트를 불러오지 못했어요.`)); };
    const tqx = `out:json;responseHandler:${callback}`;
    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=${encodeURIComponent(tqx)}&sheet=${encodeURIComponent(sheetName)}&cache=${Date.now()}`;
    document.head.appendChild(script);
  });
}

const tableRows = (table: Table) => table.rows.map((row) => Array.from({ length: table.cols.length }, (_, i) => cellValue(row.c[i])));

// Subject name per teacher + grade + block (student names are skipped on purpose).
function buildEnrollment(rows: string[][]): Enrollment {
  const map: Enrollment = new Map();
  rows.forEach((row) => {
    const gradeCell = normalize(row[1]).replace(/\.0$/, '');
    const subject = normalize(row[2]);
    const blockCell = compact(row[4]);
    const teacher = normalize(row[5]);
    const code = compact(row[8]);
    if (!subject || !teacher) return;
    let grades = '';
    let block = blockCell;
    const match = code.match(new RegExp(`^${escapeRegExp(compact(teacher))}([1-3](?:,[1-3])?|[1-3]{2,3})\\/?([A-Za-z][A-Za-z0-9]*)$`));
    if (match) { grades = match[1].replace(/,/g, ''); block = match[2]; }
    else if (/^\d+$/.test(gradeCell) && block) grades = gradeCell;
    if (!grades || !block) return;
    const key = `${teacher}|${grades}|${block.toUpperCase()}`;
    if (!map.has(key)) map.set(key, { teacher, block, subject });
  });
  return map;
}

function parseToken(token: string, enroll: Enrollment): string[] {
  const value = compact(token);
  if (!value) return [];
  if (/^1h(10|[1-9])$/i.test(value) || PLAIN_BLOCK_RE.test(value) || /^[23][mv]\d/.test(value)) return [value];
  const gradeBlock = value.match(GRADE_BLOCK_RE);
  if (gradeBlock) {
    const grade = gradeBlock[1].replace(/,/g, '');
    const display = `${grade}${gradeBlock[2]}`;
    const found = enroll.get(`${TEACHER}|${grade}|${gradeBlock[2].toUpperCase()}`);
    return [found ? `${display}(${found.subject})` : display];
  }
  const subjects = new Set<string>();
  enroll.forEach((item) => { if (item.teacher === TEACHER && item.block.toUpperCase() === value.toUpperCase()) subjects.add(item.subject); });
  return [subjects.size === 1 ? `${value}(${[...subjects][0]})` : value];
}

function parseSlot(raw: string, enroll: Enrollment): string[] {
  const value = compact(raw);
  if (!value) return [];
  if (/애국|애조/.test(value)) return [normalize(raw) || '애국조회/학급회의'];
  if (GRADE_BLOCK_RE.test(value) || /^[23][mv]\d/.test(value) || /^1h(10|[1-9])$/i.test(value) || PLAIN_BLOCK_RE.test(value)) return parseToken(value, enroll);
  return value.split(/[+,]/).filter(Boolean).flatMap((token) => parseToken(token, enroll));
}

function buildTimetable(original: string[][], enroll: Enrollment): Timetable | null {
  const row = original.slice(4).find((item) => normalize(item[2]) === TEACHER);
  if (!row) return null;
  const days: Record<string, Lesson[]> = {};
  DAYS.forEach((day) => {
    days[day] = [];
    for (let period = 1; period <= PERIOD_COUNT; period++) {
      const raw = FIXED_LESSONS.get(`${day}|${period}`) ?? normalize(row[DAY_STARTS[day] + period - 1]);
      if (!raw) continue;
      const text = parseSlot(raw, enroll).join(' · ') || raw;
      days[day].push({ period, text });
    }
  });
  return { loadedAt: Date.now(), days };
}

export async function fetchTimetable(): Promise<Timetable> {
  const [original, enroll] = await Promise.all([gvizLoad(SHEETS.original), gvizLoad(SHEETS.enroll)]);
  const timetable = buildTimetable(tableRows(original), buildEnrollment(tableRows(enroll)));
  if (!timetable) throw new Error(`원본 시트에서 ${TEACHER} 선생님을 찾지 못했어요.`);
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(timetable)); } catch { /* Cache is optional. */ }
  return timetable;
}

export function readCachedTimetable(): Timetable | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Timetable) : null;
    return parsed?.days ? parsed : null;
  } catch { return null; }
}

// "2M(생명과학)" -> { name: "생명과학", block: "2M" }; plain text stays as the name.
export function splitLesson(text: string) {
  const match = text.match(/^(.+?)\((.+)\)$/);
  return match ? { name: match[2].trim(), block: match[1].trim() } : { name: text, block: '' };
}
