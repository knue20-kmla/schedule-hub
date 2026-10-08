// Teacher timetable + class rosters read from the same Google Sheet as the standalone timetable app
// (sheet-timetable-app, https://knue20-kmla.github.io/timetable/). The lesson/roster parsing rules mirror
// that app so both show the same classes. Student names are kept in memory only; the offline cache
// stores lesson names without rosters.

export const TIMETABLE_APP_URL = 'https://knue20-kmla.github.io/timetable/kim-taewan-attendance/';

const SHEET_ID = '1T1Dh0cqo3UwC_pkLpGBAVE5wIjJbOV8NMEWbCQ78qps';
const SHEETS = { original: '원본(818)', enroll: '수강현황(818)' };
const ROSTER_SHEETS = ['1h', 'A~H', '2M', '3M', '3V'];
const TEACHER = '김태완';
const DAYS = ['월', '화', '수', '목', '금'];
const DAY_STARTS: Record<string, number> = { 월: 4, 화: 12, 수: 20, 목: 28, 금: 36 };
const PERIOD_COUNT = 8;
const FIXED_LESSONS = new Map([['월|1', '애국조회/학급회의']]);
const PLAIN_BLOCK_RE = /^[A-H]+$/;
const GRADE_BLOCK_RE = /^([1-3](?:,[1-3])?)\/?([A-Za-z][A-Za-z0-9]*)$/;
const CACHE_KEY = 'minjok-schedule.timetable.v2';

export type Group = { label: string; subject: string; students: string[] };
export type Lesson = { period: number; text: string; subject: string; groups: Group[] };
export type Timetable = { loadedAt: number; days: Record<string, Lesson[]>; withRoster: boolean };

type Cell = { v?: unknown; f?: unknown } | null | undefined;
type Table = { cols: unknown[]; rows: { c: Cell[] }[] };
type EnrollItem = { teacher: string; block: string; subject: string; students: Set<string> };
type Enrollment = Map<string, EnrollItem>;
type RosterSection = { sheetName: string; label: string; students: string[] };
type Roster = Map<string, RosterSection>;
type Section = { label: string; students: string[]; subject?: string };
type Parsed = { text: string; subject: string; students: string[]; sections: Section[] };

const normalize = (value: unknown) => String(value ?? '').replace(/　/g, ' ').replace(/\r/g, '\n').trim();
const compact = (value: unknown) => normalize(value).replace(/\s+/g, '');
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cellValue = (cell: Cell) => normalize(cell?.f ?? cell?.v ?? '');
const koSort = (values: Iterable<string>) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ko'));
const subjectLabel = (text: string) => {
  const match = normalize(text).match(/^(.+?)\((.+)\)$/);
  return match ? normalize(match[2]) : normalize(text);
};

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

function buildEnrollment(rows: string[][]): Enrollment {
  const map: Enrollment = new Map();
  rows.forEach((row) => {
    const gradeCell = normalize(row[1]).replace(/\.0$/, '');
    const subject = normalize(row[2]);
    const blockCell = compact(row[4]);
    const teacher = normalize(row[5]);
    const student = normalize(row[6]);
    const code = compact(row[8]);
    if (!subject || !teacher) return;
    let grades = '';
    let block = blockCell;
    const match = code.match(new RegExp(`^${escapeRegExp(compact(teacher))}([1-3](?:,[1-3])?|[1-3]{2,3})\\/?([A-Za-z][A-Za-z0-9]*)$`));
    if (match) { grades = match[1].replace(/,/g, ''); block = match[2]; }
    else if (/^\d+$/.test(gradeCell) && block) grades = gradeCell;
    if (!grades || !block) return;
    const key = `${teacher}|${grades}|${block.toUpperCase()}`;
    if (!map.has(key)) map.set(key, { teacher, block, subject, students: new Set() });
    if (student) map.get(key)!.students.add(student);
  });
  return map;
}

function buildRoster(tables: Map<string, string[][]>): Roster {
  const index: Roster = new Map();
  ROSTER_SHEETS.forEach((sheetName) => {
    const rows = tables.get(sheetName);
    if (!rows?.length) return;
    rows[0].forEach((headerCell, column) => {
      const label = compact(headerCell);
      if (!label) return;
      const students = [...new Set(rows.slice(1).map((row) => normalize(row[column])).filter(Boolean))];
      index.set(`${sheetName.toLowerCase()}|${label.toLowerCase()}`, { sheetName, label, students });
    });
  });
  return index;
}

function addRosterSection(roster: Roster, sections: RosterSection[], sheetName: string, label: string) {
  const section = roster.get(`${sheetName.toLowerCase()}|${label.toLowerCase()}`);
  if (section && !sections.some((item) => item.sheetName === section.sheetName && item.label.toLowerCase() === section.label.toLowerCase())) {
    sections.push({ ...section });
  }
}

function collectLowercaseModules(roster: Roster, token: string): RosterSection[] {
  const sections: RosterSection[] = [];
  const add = (sheetName: string, label: string) => addRosterSection(roster, sections, sheetName, label);
  const addNumbers = (grade: string, kind: string, digits: string) => {
    const sheetName = grade === '3' && kind === 'v' ? '3V' : `${grade}M`;
    let rest = digits;
    while (rest) {
      const two = `${grade}${kind}${rest.slice(0, 2)}`;
      if (rest.length >= 2 && roster.has(`${sheetName.toLowerCase()}|${two.toLowerCase()}`)) { add(sheetName, two); rest = rest.slice(2); }
      else { add(sheetName, `${grade}${kind}${rest[0]}`); rest = rest.slice(1); }
    }
  };
  const pattern = /([23])?([mv])([0-9]+)/g;
  let currentGrade = '';
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(token.toLowerCase()))) {
    if (match[1]) currentGrade = match[1];
    if (currentGrade) addNumbers(currentGrade, match[2], match[3]);
  }
  return sections;
}

function collectRosterSections(roster: Roster, token: string): RosterSection[] {
  const cleaned = compact(token).replace(/\(.*\)$/, '');
  const sections: RosterSection[] = [];
  roster.forEach((section) => {
    if (section.label.toLowerCase() === cleaned.toLowerCase()) addRosterSection(roster, sections, section.sheetName, section.label);
  });
  if (sections.length) return sections;
  if (/^1h(10|[1-9])$/i.test(cleaned)) { addRosterSection(roster, sections, '1h', `h${cleaned.replace(/^1h/i, '')}`); return sections; }
  if (/^[A-H]+$/.test(cleaned)) { cleaned.split('').forEach((letter) => addRosterSection(roster, sections, 'A~H', letter)); return sections; }
  return collectLowercaseModules(roster, cleaned);
}

type Ctx = { enroll: Enrollment; roster: Roster };

function parseToken(token: string, ctx: Ctx): Parsed[] {
  const value = compact(token);
  if (!value) return [];
  if (/^1h(10|[1-9])$/i.test(value) || PLAIN_BLOCK_RE.test(value) || /^[23][mv]\d/.test(value)) {
    const sections = collectRosterSections(ctx.roster, value);
    return [{ text: value, subject: '', students: [...new Set(sections.flatMap((section) => section.students))], sections }];
  }
  const gradeBlock = value.match(GRADE_BLOCK_RE);
  if (gradeBlock) {
    const grade = gradeBlock[1].replace(/,/g, '');
    const display = `${grade}${gradeBlock[2]}`;
    const found = ctx.enroll.get(`${TEACHER}|${grade}|${gradeBlock[2].toUpperCase()}`);
    const students = found ? koSort(found.students) : [];
    return [{ text: found ? `${display}(${found.subject})` : display, subject: found?.subject ?? '', students, sections: students.length ? [{ label: display, students }] : [] }];
  }
  const candidates: EnrollItem[] = [];
  ctx.enroll.forEach((item) => { if (item.teacher === TEACHER && item.block.toUpperCase() === value.toUpperCase()) candidates.push(item); });
  const subjects = [...new Set(candidates.map((item) => item.subject))];
  const students = koSort(candidates.flatMap((item) => [...item.students]));
  return [{ text: subjects.length === 1 ? `${value}(${subjects[0]})` : value, subject: subjects.length === 1 ? subjects[0] : '', students, sections: students.length ? [{ label: value, students }] : [] }];
}

function parseSlot(raw: string, ctx: Ctx): Parsed[] {
  const value = compact(raw);
  if (!value) return [];
  if (/애국|애조/.test(value)) return [{ text: normalize(raw) || '애국조회/학급회의', subject: '', students: [], sections: [] }];
  if (GRADE_BLOCK_RE.test(value) || /^[23][mv]\d/.test(value) || /^1h(10|[1-9])$/i.test(value) || PLAIN_BLOCK_RE.test(value)) return parseToken(value, ctx);
  return value.split(/[+,]/).filter(Boolean).flatMap((token) => parseToken(token, ctx));
}

function groupsOf(lessons: Parsed[]): Group[] {
  return lessons.flatMap((lesson) => {
    const sections = lesson.sections.length ? lesson.sections : lesson.students.length ? [{ label: lesson.text, students: lesson.students }] : [];
    return sections.map((section) => ({
      label: section.label || lesson.text,
      subject: section.subject || lesson.subject || subjectLabel(lesson.text) || section.label || lesson.text,
      students: koSort(section.students),
    }));
  }).filter((group) => group.students.length);
}

function buildTimetable(original: string[][], ctx: Ctx, withRoster: boolean): Timetable | null {
  const row = original.slice(4).find((item) => normalize(item[2]) === TEACHER);
  if (!row) return null;
  const days: Record<string, Lesson[]> = {};
  DAYS.forEach((day) => {
    days[day] = [];
    for (let period = 1; period <= PERIOD_COUNT; period++) {
      const raw = FIXED_LESSONS.get(`${day}|${period}`) ?? normalize(row[DAY_STARTS[day] + period - 1]);
      if (!raw) continue;
      const lessons = parseSlot(raw, ctx);
      const subjects = [...new Set(lessons.map((lesson) => normalize(lesson.subject || subjectLabel(lesson.text) || lesson.text)).filter(Boolean))];
      days[day].push({ period, text: lessons.map((lesson) => lesson.text).join(' · ') || raw, subject: subjects.length === 1 ? subjects[0] : '', groups: groupsOf(lessons) });
    }
  });
  return { loadedAt: Date.now(), days, withRoster };
}

export async function fetchTimetable(): Promise<Timetable> {
  const [original, enroll] = await Promise.all([gvizLoad(SHEETS.original), gvizLoad(SHEETS.enroll)]);
  const rosterResults = await Promise.allSettled(ROSTER_SHEETS.map((name) => gvizLoad(name)));
  const rosterTables = new Map<string, string[][]>();
  rosterResults.forEach((result, index) => { if (result.status === 'fulfilled') rosterTables.set(ROSTER_SHEETS[index], tableRows(result.value)); });
  const timetable = buildTimetable(tableRows(original), { enroll: buildEnrollment(tableRows(enroll)), roster: buildRoster(rosterTables) }, rosterTables.size > 0);
  if (!timetable) throw new Error(`원본 시트에서 ${TEACHER} 선생님을 찾지 못했어요.`);
  // Cache lesson names only; student lists are never written to browser storage by this app.
  try {
    const slim: Timetable = { ...timetable, withRoster: false, days: Object.fromEntries(Object.entries(timetable.days).map(([day, lessons]) => [day, lessons.map((lesson) => ({ ...lesson, groups: [] }))])) };
    localStorage.setItem(CACHE_KEY, JSON.stringify(slim));
  } catch { /* Cache is optional. */ }
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
