import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download,
  Cloud, FileText, GraduationCap, Mail, Plus, RefreshCw, StickyNote, Trash2, UserRound, X,
} from 'lucide-react';
import {
  AuthError, dayKey, disconnect, fetchEvents, loadGis, readStoredToken, requestToken,
  type AccessToken, type LiveEvent,
} from '@/lib/google-calendar';
import {
  TIMETABLE_APP_URL, describeTimetableError, fetchTimetable, readCachedTimetable, splitLesson, type Lesson, type Timetable,
} from '@/lib/timetable';
import {
  STORAGE_KEY as ATTENDANCE_KEY, clearSession, countMarked, loadRecords, toggleStatus,
  type EntryInfo, type Records, type SessionInfo, type Status,
} from '@/lib/attendance';
import { readStoredMailToken } from '@/lib/gmail';
import { releaseService, requestServices, serviceLabel, type Service } from '@/lib/connect';
import { useDriveSync } from '@/lib/use-drive-sync';
import type { SyncSnapshot, SyncTask } from '@/lib/drive-sync';
import { AttendanceSheet } from '@/components/attendance-sheet';
import { MailSheet } from '@/components/mail-sheet';

type ScheduleFilter = '전체' | '캘린더' | '수업' | '학교' | '개인';
type TaskCategory = '학교' | '개인';
type PlannerTask = { id: number; title: string; detail: string; category: TaskCategory; done: boolean; start?: string; end?: string; updatedAt?: number };

const SAMPLE_KEYS = ['6', '7', '8', '9', '10'];
const DAY_STEP = 5;
function buildDays(shift = 0) {
  const today = new Date();
  return [-2, -1, 0, 1, 2].map((offset, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + shift + offset);
    return { key: dayKey(date), index, month: date.getMonth() + 1, date: String(date.getDate()), day: '일월화수목금토'[date.getDay()] };
  });
}
type CalendarEvent = { id?: string; time: string; title: string; note: string; tag?: string };
type ClassItem = { time: string; subject: string; room: string; period?: number; count?: number; marked?: number };
const calendarEventsByDate: Record<string, CalendarEvent[]> = {
  '6': [
    { time: '08:40', title: '아침 조회 · 2학년 3반', note: '담임 선생님 공지' },
    { time: '15:30', title: '학생회 임원 회의', note: '학생회실' },
  ],
  '7': [
    { time: '08:40', title: '아침 조회 · 2학년 3반', note: '담임 선생님 공지' },
    { time: '13:00', title: '진로 상담 신청 마감', note: '온라인 신청' },
    { time: '16:10', title: '동아리 활동', note: '각 동아리실' },
  ],
  '8': [
    { time: '08:40', title: '아침 조회 · 2학년 3반', note: '담임 선생님 공지' },
    { time: '14:30', title: '과학 수행평가 초안 제출', note: '온라인 클래스 · 오늘까지' },
    { time: '16:10', title: '도서관 자율 학습', note: '중앙도서관 2층' },
  ],
  '9': [
    { time: '08:40', title: '아침 조회 · 2학년 3반', note: '담임 선생님 공지' },
    { time: '09:00', title: '한국사 발표', note: '1교시 · 3장 분량' },
    { time: '17:00', title: '주말 외출 신청', note: '생활관' },
  ],
  '10': [
    { time: '10:00', title: '토요 특별 활동', note: '강당' },
  ],
};
const timetableByDate: Record<string, ClassItem[]> = {
  '6': [
    { time: '09:00', subject: '수학', room: '수학실' },
    { time: '10:00', subject: '영어', room: '3-3' },
    { time: '11:00', subject: '물리', room: '과학실' },
    { time: '13:30', subject: '체육', room: '체육관' },
  ],
  '7': [
    { time: '09:00', subject: '한국사', room: '3-3' },
    { time: '10:00', subject: '화학', room: '과학실' },
    { time: '11:00', subject: '영어', room: '3-3' },
    { time: '13:30', subject: '음악', room: '음악실' },
  ],
  '8': [
    { time: '09:00', subject: '국어', room: '3-3' },
    { time: '10:00', subject: '수학', room: '수학실' },
    { time: '11:00', subject: '생명과학', room: '과학실' },
    { time: '13:30', subject: '미술', room: '미술실' },
  ],
  '9': [
    { time: '09:00', subject: '한국사', room: '3-3' },
    { time: '10:00', subject: '국어', room: '3-3' },
    { time: '11:00', subject: '수학', room: '수학실' },
  ],
  '10': [
    { time: '09:00', subject: '자율 학습', room: '도서관' },
  ],
};
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const initialTasks: PlannerTask[] = [
  { id: 1, title: '한국사 발표 자료 마무리', detail: '금요일 1교시 · 3장 분량', category: '학교', done: false },
  { id: 2, title: '엄마 생신 선물 찾아보기', detail: '저녁에 온라인으로 보기', category: '개인', done: false },
  { id: 3, title: '영어 단어 20개 복습', detail: '이번 주 학습 루틴', category: '학교', done: true },
];
const STORAGE_TASKS = 'minjok-schedule.tasks.v1';
const STORAGE_LINKED = 'minjok-schedule.google-linked.v1';
const STORAGE_MAIL_LINKED = 'minjok-schedule.mail-linked.v1';
const STORAGE_NOTE = 'minjok-schedule.note.v1';
const STORAGE_NOTE_AT = 'minjok-schedule.note-at.v1';
const STORAGE_DELETED = 'minjok-schedule.tasks-deleted.v1';

function loadTasks(): PlannerTask[] {
  try {
    const value = localStorage.getItem(STORAGE_TASKS);
    if (value) {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as PlannerTask[];
    }
  } catch { /* Use the illustrative defaults when browser storage is unavailable. */ }
  return initialTasks;
}
const monthDay = (key: string) => { const [, month, day] = key.split('-'); return `${Number(month)}월 ${Number(day)}일`; };
const taskEnd = (task: PlannerTask) => task.end ?? task.start ?? '';
// A task belongs to a day if the day is inside its period; unfinished tasks past their end date also show on today.
function taskState(task: PlannerTask, key: string, todayKey: string): 'on' | 'overdue' | 'off' {
  if (!task.start) return 'on';
  if (key >= task.start && key <= taskEnd(task)) return 'on';
  if (!task.done && key === todayKey && taskEnd(task) < todayKey) return 'overdue';
  return 'off';
}
function taskDetail(task: PlannerTask, state: 'on' | 'overdue' | 'off') {
  if (!task.start) return task.detail || '날짜 없음 · 매일 보여요';
  const range = taskEnd(task) !== task.start ? `${monthDay(task.start)} ~ ${monthDay(taskEnd(task))}` : monthDay(task.start);
  return state === 'overdue' ? `${range} · 기한이 지났어요` : range;
}
function loadDeleted(): Record<string, number> {
  try { const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_DELETED) ?? '{}'); return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {}; } catch { return {}; }
}
function loadNoteAt() {
  try { return Number(localStorage.getItem(STORAGE_NOTE_AT) ?? 0) || 0; } catch { return 0; }
}
function loadNote() {
  try { return localStorage.getItem(STORAGE_NOTE) ?? '오늘 과학 수행평가 초안 제출하기. 끝나면 서점에 들러서 새 노트 구경하기.'; }
  catch { return '오늘 과학 수행평가 초안 제출하기. 끝나면 서점에 들러서 새 노트 구경하기.'; }
}

// Sample events are tagged 학교; live events show their calendar name, except when it is just an e-mail address.
function eventLabel(event: CalendarEvent) {
  if (event.tag === undefined) return '학교';
  return event.tag.includes('@') ? '' : event.tag;
}

export default function App() {
  const todayKey = useMemo(() => dayKey(new Date()), []);
  const [dayShift, setDayShift] = useState(0);
  const days = useMemo(() => buildDays(dayShift), [dayShift]);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [token, setToken] = useState<AccessToken | null>(readStoredToken);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[] | null>(null);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [linked, setLinked] = useState(() => { try { return localStorage.getItem(STORAGE_LINKED) === '1'; } catch { return false; } });
  const gisReady = useRef(false);
  const [liveTimetable, setLiveTimetable] = useState<Timetable | null>(readCachedTimetable);
  const [timetableState, setTimetableState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [timetableProblem, setTimetableProblem] = useState('');
  const [records, setRecords] = useState<Records>(loadRecords);
  const [attendancePeriod, setAttendancePeriod] = useState<number | null>(null);
  const [mailOpen, setMailOpen] = useState(false);
  const [mailToken, setMailToken] = useState<AccessToken | null>(readStoredMailToken);
  const [mailLinked, setMailLinked] = useState(() => { try { return localStorage.getItem(STORAGE_MAIL_LINKED) === '1'; } catch { return false; } });
  const [reconnecting, setReconnecting] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ScheduleFilter>('전체');
  const [tasks, setTasks] = useState<PlannerTask[]>(loadTasks);
  const [note, setNote] = useState(loadNote);
  const [noteDraft, setNoteDraft] = useState(note);
  const [noteAt, setNoteAt] = useState(loadNoteAt);
  const [deleted, setDeleted] = useState(loadDeleted);
  const [profileOpen, setProfileOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallPrompt | null>(null);
  const [standalone, setStandalone] = useState(isStandalone);
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('학교');
  const [taskDated, setTaskDated] = useState(true);
  const [taskStart, setTaskStart] = useState('');
  const [taskEndDraft, setTaskEndDraft] = useState('');
  const [undoTask, setUndoTask] = useState<{ task: PlannerTask; index: number } | null>(null);
  const [notice, setNotice] = useState('');
  const [nav, setNav] = useState('오늘');
  const selectedDay = days.find((day) => day.key === selectedDate) ?? days[2];
  const connected = Boolean(token) && liveEvents !== null;
  const calendarEvents: CalendarEvent[] = connected
    ? liveEvents!.filter((event) => event.dayKey === selectedDay.key)
    : calendarEventsByDate[SAMPLE_KEYS[selectedDay.index]] ?? [];
  const sessionOf = (lesson: Lesson): SessionInfo => ({ date: selectedDay.key, day: selectedDay.day, period: lesson.period, label: lesson.text, subject: lesson.subject });
  const timetable: ClassItem[] = liveTimetable
    ? (liveTimetable.days[selectedDay.day] ?? []).map((lesson) => {
        const { name, block } = splitLesson(lesson.text);
        const count = lesson.groups.reduce((sum, group) => sum + group.students.length, 0);
        return { time: `${lesson.period}교시`, subject: name, room: block, period: lesson.period, count: count || undefined, marked: countMarked(records, sessionOf(lesson), lesson.groups) };
      })
    : timetableByDate[SAMPLE_KEYS[selectedDay.index]] ?? [];
  const attendanceLesson = attendancePeriod === null ? undefined : liveTimetable?.days[selectedDay.day]?.find((lesson) => lesson.period === attendancePeriod);
  const timetableNote = timetableState === 'ok'
    ? `구글 시트의 시간표예요 · ${new Date(liveTimetable!.loadedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준 · 수업을 누르면 명단과 출결을 볼 수 있어요`
    : timetableState === 'loading'
      ? (liveTimetable ? '저장된 시간표를 보여주며 최신 시간표를 불러오는 중이에요.' : '시간표를 불러오는 중이에요…')
      : `${liveTimetable ? '최신 시간표를 불러오지 못해 저장된 시간표를 보여줘요.' : '시간표를 불러오지 못해 샘플을 보여줘요.'} ${timetableProblem}`;

  const loadTimetable = () => {
    setTimetableState('loading');
    setTimetableProblem('');
    fetchTimetable()
      .then((fresh) => { setLiveTimetable(fresh); setTimetableState('ok'); })
      .catch((error) => { setTimetableProblem(describeTimetableError(error)); setTimetableState('error'); });
  };
  useEffect(() => { loadTimetable(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallPrompt); };
    const onInstalled = () => { setInstallEvent(null); setStandalone(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (event.key === ATTENDANCE_KEY) setRecords(loadRecords()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => {
    loadGis().then(() => { gisReady.current = true; }).catch(() => { /* Offline: the sample schedule still works. */ });
  }, []);
  useEffect(() => {
    if (token && liveEvents === null) void loadCalendar(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!undoTask) return undefined;
    const timer = window.setTimeout(() => setUndoTask(null), 8000);
    return () => window.clearTimeout(timer);
  }, [undoTask]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks)); } catch { /* Local-only app can still be used for this session. */ }
  }, [tasks]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_NOTE, note); } catch { /* Local-only app can still be used for this session. */ }
  }, [note]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_NOTE_AT, String(noteAt)); localStorage.setItem(STORAGE_DELETED, JSON.stringify(deleted)); } catch { /* Local-only app can still be used for this session. */ }
  }, [noteAt, deleted]);

  // Device sync (Google Drive app-data folder): tasks and the private memo only.
  const sync = useDriveSync(
    (): SyncSnapshot => ({ tasks: tasks as unknown as SyncTask[], deleted, note: { text: note, at: noteAt } }),
    (merged) => {
      setTasks(merged.tasks as unknown as PlannerTask[]);
      setDeleted(merged.deleted);
      setNote(merged.note.text);
      setNoteAt(merged.note.at);
    },
    JSON.stringify([tasks, deleted, note, noteAt]),
  );
  const syncCaption = sync.status === 'syncing' ? '동기화 중…'
    : sync.status === 'ok' ? `동기화됨 · ${new Date(sync.lastAt ?? Date.now()).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}`
    : sync.status === 'login' ? '다시 로그인하면 동기화돼요'
    : sync.status === 'error' || sync.message ? sync.message
    : sync.status === 'idle' ? '연결됨'
    : '연결되지 않음 · 메모와 할 일이 이 기기에만 저장돼요';

  const visibleCalendarEvents = activeFilter === '개인' || activeFilter === '수업' ? [] : calendarEvents;
  const showTimetable = activeFilter === '전체' || activeFilter === '수업';
  const isToday = selectedDay.key === todayKey;
  const inCategory = (task: PlannerTask) => activeFilter === '학교' ? task.category === '학교' : activeFilter === '개인' ? task.category === '개인' : true;
  const visibleTasks = activeFilter === '캘린더' || activeFilter === '수업'
    ? []
    : tasks.filter((task) => inCategory(task) && taskState(task, selectedDay.key, todayKey) !== 'off');
  const otherDayCount = activeFilter === '캘린더' || activeFilter === '수업'
    ? 0
    : tasks.filter((task) => inCategory(task) && !task.done && taskState(task, selectedDay.key, todayKey) === 'off' && taskEnd(task) >= todayKey).length;

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2300);
  }
  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done, updatedAt: Date.now() } : task));
    flash('작은 한 걸음, 잘 해냈어요.');
  }
  async function installApp() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    flash(choice.outcome === 'accepted' ? '앱으로 설치하고 있어요. 홈 화면을 확인해 보세요.' : '설치를 취소했어요. 개인정보에서 언제든 다시 설치할 수 있어요.');
  }
  function deleteTask(id: number) {
    const index = tasks.findIndex((task) => task.id === id);
    if (index < 0) return;
    setUndoTask({ task: tasks[index], index });
    setTasks((current) => current.filter((task) => task.id !== id));
    setDeleted((current) => ({ ...current, [String(id)]: Date.now() }));
  }
  function restoreTask() {
    if (!undoTask) return;
    const { task, index } = undoTask;
    setTasks((current) => { const next = [...current]; next.splice(Math.min(index, next.length), 0, { ...task, updatedAt: Date.now() }); return next; });
    setDeleted((current) => { const next = { ...current }; delete next[String(task.id)]; return next; });
    setUndoTask(null);
  }
  function openTaskForm() {
    setTaskDated(true);
    setTaskStart(selectedDay.key);
    setTaskEndDraft('');
    setTaskOpen(true);
  }
  function shiftDays(direction: 1 | -1) {
    const next = dayShift + direction * DAY_STEP;
    setDayShift(next);
    setSelectedDate(buildDays(next)[2].key);
  }
  function jumpToToday() {
    setDayShift(0);
    setSelectedDate(todayKey);
  }
  async function loadCalendar(active: AccessToken) {
    setCalendarBusy(true);
    try {
      const from = new Date(days[0].key + 'T00:00:00');
      const to = new Date(days[4].key + 'T00:00:00');
      to.setDate(to.getDate() + 1);
      setLiveEvents(await fetchEvents(active, from, to));
      return true;
    } catch (error) {
      if (error instanceof AuthError) { setToken(null); setLiveEvents(null); flash('로그인이 만료됐어요. 다시 연결해 주세요.'); }
      else flash('구글 캘린더를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      return false;
    } finally { setCalendarBusy(false); }
  }
  async function refreshCalendar() {
    if (!token || calendarBusy) return;
    if (await loadCalendar(token)) flash('학교 일정을 새로 불러왔어요.');
  }
  const tokensNow = (): Record<Service, AccessToken | null> => ({ cal: token, mail: mailToken, drive: sync.token });
  const anyLinked = linked || mailLinked || sync.linked;
  const needsLogin = (linked && !token) || (mailLinked && !mailToken) || (sync.linked && !sync.token);

  // One sign-in renews every linked service at once (and adds `add` when connecting a new one).
  async function reconnect(add?: Service) {
    if (reconnecting) return;
    if (!gisReady.current) { flash('구글 로그인을 준비하고 있어요. 잠시 뒤 다시 눌러 주세요.'); void loadGis().then(() => { gisReady.current = true; }).catch(() => flash('인터넷 연결을 확인해 주세요.')); return; }
    const wanted = new Set<Service>();
    if (linked) wanted.add('cal');
    if (mailLinked) wanted.add('mail');
    if (sync.linked) wanted.add('drive');
    if (add) wanted.add(add);
    setReconnecting(true);
    try {
      const { token: fresh, granted } = await requestServices([...wanted]);
      if (granted.includes('cal')) {
        setToken(fresh); setLinked(true);
        try { localStorage.setItem(STORAGE_LINKED, '1'); } catch { /* Optional hint only. */ }
        void loadCalendar(fresh);
      }
      if (granted.includes('mail')) {
        setMailToken(fresh); setMailLinked(true);
        try { localStorage.setItem(STORAGE_MAIL_LINKED, '1'); } catch { /* Optional hint only. */ }
      }
      if (granted.includes('drive')) sync.adoptToken(fresh);
      const missing = [...wanted].filter((service) => !granted.includes(service));
      if (missing.length) flash(`${missing.map(serviceLabel).join(', ')} 권한은 허용되지 않았어요. 권한 화면에서 모두 체크해 주세요.`);
      else flash(add && !wanted.has(add) ? '연결했어요.' : add ? `${serviceLabel(add)} 연결 완료` : '다시 연결했어요.');
    } catch (error) {
      const reason = error instanceof Error ? error.message : '';
      if (reason === 'popup_closed' || reason === 'access_denied') flash('연결을 취소했어요.');
      else if (reason === 'popup_failed_to_open') flash('팝업이 막혀 있어요. 팝업을 허용하고 다시 눌러 주세요.');
      else flash('구글 연결에 실패했어요. 잠시 뒤 다시 시도해 주세요.');
    } finally { setReconnecting(false); }
  }
  // The sign-in lasts about an hour: notice when it runs out (also after the app was in the background).
  const expireStale = () => {
    const now = Date.now();
    if (token && token.expires <= now) setToken(null);
    if (mailToken && mailToken.expires <= now) setMailToken(null);
    if (sync.token && sync.token.expires <= now) sync.invalidate();
  };
  useEffect(() => {
    const live = [token, mailToken, sync.token].filter((t): t is AccessToken => Boolean(t));
    const onVisible = () => { if (document.visibilityState === 'visible') expireStale(); };
    document.addEventListener('visibilitychange', onVisible);
    if (!live.length) return () => document.removeEventListener('visibilitychange', onVisible);
    const timer = window.setTimeout(expireStale, Math.max(Math.min(...live.map((t) => t.expires)) - Date.now(), 0) + 500);
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, mailToken, sync.token]);
  useEffect(() => { if (!needsLogin) setPromptDismissed(false); }, [needsLogin]);
  useEffect(() => { if (token && liveEvents !== null) void loadCalendar(token); }, [dayShift]); // eslint-disable-line react-hooks/exhaustive-deps
  const lostServices = [linked && !token ? 'cal' : '', mailLinked && !mailToken ? 'mail' : '', sync.linked && !sync.token ? 'drive' : ''].filter(Boolean) as Service[];
  const showReconnect = needsLogin && !promptDismissed && !reconnecting;

  async function connectGoogle() {
    if (calendarBusy) return;
    if (token) { if (await loadCalendar(token)) flash('구글 캘린더를 새로 불러왔어요.'); return; }
    await reconnect('cal');
  }
  function unlinkGoogle() {
    releaseService('cal', tokensNow());
    setToken(null);
    setLiveEvents(null);
    setLinked(false);
    try { localStorage.removeItem(STORAGE_LINKED); } catch { /* Optional hint only. */ }
    flash('구글 캘린더 연결을 해제했어요. 샘플 일정으로 돌아가요.');
  }
  function unlinkDrive() {
    releaseService('drive', tokensNow());
    sync.unlink();
  }
  function changeAttendance(apply: () => Records) {
    try { setRecords(apply()); } catch { flash('이 기기에 출결을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'); }
  }
  function toggleAttendance(entry: EntryInfo, status: Status) {
    if (attendanceLesson) changeAttendance(() => toggleStatus(sessionOf(attendanceLesson), entry, status));
  }
  function clearAttendance() {
    if (attendanceLesson && window.confirm('이 수업의 출결 기록을 모두 지울까요?')) changeAttendance(() => clearSession(sessionOf(attendanceLesson)));
  }
  async function connectMail() { await reconnect('mail'); }
  function unlinkMail() {
    releaseService('mail', tokensNow());
    setMailToken(null);
    setMailLinked(false);
    try { localStorage.removeItem(STORAGE_MAIL_LINKED); } catch { /* Optional hint only. */ }
    flash('Gmail 연결을 해제했어요.');
  }
  function closeMail() { setMailOpen(false); setNav('오늘'); }
  function saveNote() {
    const saved = noteDraft.trim();
    if (!saved) { flash('메모 내용을 한 줄 적어주세요.'); return; }
    setNote(saved);
    setNoteAt(Date.now());
    setNoteOpen(false);
    flash('나만의 메모에 저장했어요.');
  }
  function addTask() {
    const title = taskDraft.trim();
    if (!title) return;
    const start = taskDated ? taskStart || selectedDay.key : undefined;
    const end = start && taskEndDraft > start ? taskEndDraft : undefined;
    setTasks((current) => [{ id: Date.now(), title, detail: '', category: taskCategory, done: false, updatedAt: Date.now(), ...(start ? { start } : {}), ...(end ? { end } : {}) }, ...current]);
    setTaskDraft('');
    setTaskOpen(false);
    flash(start ? `${monthDay(start)}${end ? ` ~ ${monthDay(end)}` : ''} ${taskCategory} 할 일로 담았어요.` : `${taskCategory} 할 일로 담았어요. 날짜가 없어서 매일 보여요.`);
  }
  function chooseNav(label: string) {
    setNav(label);
    if (label === '메일') {
      setMailOpen(true);
    } else if (label === '메모') {
      setNoteDraft(note);
      setNoteOpen(true);
    } else if (label === '할 일') {
      document.getElementById('integrated-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      flash('학교와 개인 할 일을 모아봤어요.');
    } else if (label === '일정') {
      document.getElementById('integrated-agenda')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      flash('오늘의 일정을 확인해요.');
    } else {
      // Inside the desktop phone frame the page scrolls in .is-scroll; on real phones/tablets it is the window.
      const scroller = document.querySelector<HTMLElement>('.is-scroll');
      if (scroller && getComputedStyle(scroller).display !== 'contents') scroller.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      flash('오늘의 흐름을 한곳에 모았어요.');
    }
  }

  return (
    <div className="is-device"><div className="is-screen"><div className="is-scroll">
    <main className="is-root">
      <div className="is-shell">
        <header>
          <div className="is-topbar">
            <div className="is-brand">
              <img className="is-brand-mark" src={assetUrl('images/kmla-emblem.png')} alt="민족사관고등학교 촛불 교표" data-testid="img-school-emblem" />
              <span className="is-brand-copy">
                <span className="is-brand-title">민사고 김태완</span>
                <span className="is-brand-sub">MINJOK LEADERSHIP ACADEMY</span>
              </span>
            </div>
            <div className="is-topbar-actions">
              {anyLinked && <button type="button" className={`is-profile is-sync-chip${needsLogin || sync.status === 'error' ? ' attention' : ''}`} aria-label={needsLogin ? '다시 연결 (캘린더·Gmail·드라이브를 한 번에)' : '지금 동기화'} onClick={() => { if (needsLogin) void reconnect(); else if (sync.linked) void sync.syncNow(); else if (token) void refreshCalendar(); }} data-testid="button-sync-chip">
                {sync.status === 'syncing' || reconnecting ? <RefreshCw size={16} className="is-spin" /> : <Cloud size={17} strokeWidth={1.7} />}
              </button>}
              <button type="button" className="is-profile" aria-label="개인정보" data-testid="button-profile-notice" onClick={() => setProfileOpen(true)}>
                <UserRound size={17} strokeWidth={1.7} />
              </button>
            </div>
          </div>
          <section className="is-campus-hero" aria-label="민족사관고등학교 캠퍼스와 오늘의 일정">
            <img className="is-campus-photo" src={assetUrl('images/integrated-schedule-promo.jpg')} alt="나무 사이로 학교 건물과 동상이 보이는 민족사관고등학교 캠퍼스" data-testid="img-campus-photo" />
            <div className="is-campus-veil" aria-hidden="true" />
            <div className="is-campus-topline">{dayShift !== 0 && <button type="button" className="is-today-jump" onClick={jumpToToday} data-testid="button-today-jump">오늘로</button>}<span className="is-campus-weather"><span>18°</span><span aria-hidden="true">·</span><span>구름 조금</span></span></div>
            <div className="is-campus-copy">
              <p className="is-campus-date" data-testid="text-selected-date">{selectedDay.month}월 {selectedDay.date}일 {selectedDay.day}요일</p>
              <h1 className="is-heading">{isToday ? '오늘의 일정' : '선택한 날의 일정'}</h1>
            </div>
          </section>
        </header>

        <div className="is-date-strip" role="group" aria-label="날짜 선택">
          <button type="button" className="is-day-nav" onClick={() => shiftDays(-1)} aria-label={`이전 ${DAY_STEP}일`} data-testid="button-days-prev"><ChevronLeft size={18} strokeWidth={2.2} /></button>
          {days.map((day) => (
            <button key={day.key} type="button" className={`is-day${selectedDate === day.key ? ' active' : ''}`} aria-pressed={selectedDate === day.key} aria-label={`${day.month}월 ${day.date}일 ${day.day}요일`} data-testid={`button-date-${day.date}`} onClick={() => { setSelectedDate(day.key); flash(`${day.month}월 ${day.date}일 ${day.day}요일 일정이에요.`); }}>
              <span className="is-day-name">{day.day}</span><span className="is-day-number">{day.date}</span>
            </button>
          ))}
          <button type="button" className="is-day-nav" onClick={() => shiftDays(1)} aria-label={`다음 ${DAY_STEP}일`} data-testid="button-days-next"><ChevronRight size={18} strokeWidth={2.2} /></button>
        </div>
        <div className="is-filter-row" role="group" aria-label="일정 출처 및 분류">
          {(['전체', '캘린더', '수업', '학교', '개인'] as ScheduleFilter[]).map((filter) => (
            <button type="button" key={filter} aria-pressed={activeFilter === filter} className={`is-filter${activeFilter === filter ? ' active' : ''}`} data-testid={`button-filter-${filter}`} onClick={() => { setActiveFilter(filter); flash(`${filter} 항목을 모아봤어요.`); }}>
              {filter !== '전체' && <span className="is-filter-dot" aria-hidden="true" />}{filter}
            </button>
          ))}
        </div>

        <div className={`is-columns${activeFilter === '전체' ? '' : ' single'}`}>
        <div className="is-col">
        <section className="is-section" id="integrated-agenda" aria-label="학교 일정">
          {(activeFilter === '전체' || activeFilter === '캘린더') && <>
            <div className="is-section-head">
              <div>
                <div className="is-title-row">
                  <h2 className="is-section-title">학교 일정</h2>
                  {token && <button type="button" className="is-refresh" onClick={() => void refreshCalendar()} disabled={calendarBusy} aria-label="학교 일정 새로고침" data-testid="button-calendar-refresh"><RefreshCw size={14} className={calendarBusy ? 'is-spin' : undefined} /></button>}
                </div>
                <p className="is-section-sub">{connected ? '내 Google Calendar에서 가져온 일정이에요' : token ? '불러오는 중…' : '샘플 일정 · 오른쪽 위 프로필에서 구글 캘린더를 연결해요'}</p>
              </div>
              <button type="button" className="is-more" aria-label="일정 개수" onClick={() => flash(`${connected ? '' : '샘플 '}일정 ${calendarEvents.length}개를 보고 있어요.`)} data-testid="button-calendar-count">{calendarEvents.length}개 <ChevronDown size={13} /></button>
            </div>
            <div className="is-event-list">
              {!visibleCalendarEvents.length && <div className="is-empty-filter" data-testid="status-no-events">이 날은 등록된 일정이 없어요.</div>}
              {visibleCalendarEvents.map((event) => <article key={event.id ?? event.time} className="is-event" data-testid={`event-calendar-${event.time}`}>
                <time className="is-event-time">{event.time}</time><span className="is-event-marker" aria-hidden="true" />
                <div className="is-event-body"><p className="is-event-title"><span className="is-event-name">{event.title}</span>{eventLabel(event) && <span className="is-event-label">{eventLabel(event)}</span>}</p>{event.note && <p className="is-event-note">{event.note}</p>}</div>
              </article>)}
            </div>
          </>}
          {activeFilter === '수업' && <div className="is-section-head"><div><h2 className="is-section-title">내 수업 시간표</h2><p className="is-section-sub">캘린더 일정과 별도로 관리해요</p></div><BookOpen size={17} color="#68816b" /></div>}
          {activeFilter === '개인' && <div className="is-section-head"><div><h2 className="is-section-title">나를 위한 일정</h2><p className="is-section-sub">학교 밖의 시간도 놓치지 않도록</p></div><StickyNote size={17} color="#9b8060" /></div>}
          {activeFilter === '학교' && <div className="is-section-head"><div><h2 className="is-section-title">학교 할 일</h2><p className="is-section-sub">제출과 공부를 따로 챙겨요</p></div><GraduationCap size={18} color="#a16e53" /></div>}
        </section>

        {showTimetable && <section className="is-section is-timetable" aria-label="내 수업 시간표" data-testid="section-sample-timetable">
          <div className="is-timetable-head"><div className="is-timetable-label"><GraduationCap size={15} /> 내 수업 시간표</div><span className="is-class-tag">{liveTimetable ? (timetableState === 'ok' ? '시트 연동' : '저장본') : '샘플 시간표'}</span></div>
          <div className="is-class-row">{!timetable.length && <div className="is-empty-filter" style={{ width: '100%' }} data-testid="status-no-classes">이 날은 수업이 없어요.</div>}{timetable.map((item) => item.period === undefined
            ? <div className="is-class" key={item.time} data-testid={`class-${item.time}`}><span className="is-class-time">{item.time}</span><span className="is-class-name">{item.subject}</span><span className="is-class-room">{item.room}</span></div>
            : <button type="button" className="is-class is-class-button" key={item.time} onClick={() => setAttendancePeriod(item.period!)} aria-label={`${item.time} ${item.subject} 명단과 출결 열기`} data-testid={`class-${item.time}`}>
                <span className="is-class-time">{item.time}</span><span className="is-class-name">{item.subject}</span>
                <span className="is-class-room">{item.room}{item.room && item.count ? ' · ' : ''}{item.count ? `${item.count}명` : ''}</span>
                {item.marked ? <span className="is-class-mark" data-testid={`marked-${item.time}`}>출결 {item.marked}</span> : null}
              </button>)}</div>
          <p className="is-timetable-note" data-testid="text-timetable-note">{timetableNote}</p>
          {timetableState === 'error' && <button type="button" className="is-timetable-retry" onClick={loadTimetable} data-testid="button-timetable-retry"><RefreshCw size={13} /> 시간표 다시 불러오기</button>}
          <a className="is-timetable-connect" href={TIMETABLE_APP_URL} target="_blank" rel="noopener noreferrer" aria-label="시간표·출결부 앱을 새 창으로 열기" data-testid="link-timetable-app">
            <BookOpen size={13} /><span>시간표 · 출결부 앱</span><span className="is-connect-status">새 창</span>
          </a>
        </section>}

        </div>
        <div className="is-col">
        {(activeFilter === '전체' || activeFilter === '개인') && <section className="is-section" aria-label="개인 메모 미리보기">
          <button type="button" className="is-note-card" onClick={() => { setNoteDraft(note); setNoteOpen(true); }} data-testid="button-open-note">
            <span className="is-note-head"><span className="is-note-label"><StickyNote size={13} /> 나만 보는 메모</span><span className="is-note-open"><ChevronRight size={15} /></span></span>
            <span className="is-note-preview" data-testid="text-note-preview">{note || '오늘 기억해둘 일을 적어보세요.'}</span>
          </button>
        </section>}

        {activeFilter !== '캘린더' && activeFilter !== '수업' && <section className="is-section" id="integrated-tasks" aria-label="학교 및 개인 할 일">
          <div className="is-section-head"><div><h2 className="is-section-title">{isToday ? '오늘 챙길 일' : `${selectedDay.month}월 ${selectedDay.date}일 챙길 일`}</h2><p className="is-section-sub" data-testid="text-task-sub">{otherDayCount ? `다른 날 예정된 일 ${otherDayCount}개` : '학교도, 나의 일도 한눈에'}</p></div><span style={{ color: '#6f7868', fontSize: 12, fontWeight: 700 }} data-testid="text-open-task-count">{visibleTasks.filter((task) => !task.done).length}개 남음</span></div>
          <div className="is-task-list">
            {visibleTasks.length ? visibleTasks.map((task) => {
              const state = taskState(task, selectedDay.key, todayKey);
              return <article className={`is-task${task.done ? ' done' : ''}${state === 'overdue' ? ' overdue' : ''}`} key={task.id} data-testid={`task-item-${task.id}`}>
              <button type="button" className={`is-check${task.done ? ' checked' : ''}`} aria-label={`${task.title} ${task.done ? '완료 취소' : '완료'}`} aria-pressed={task.done} onClick={() => toggleTask(task.id)} data-testid={`button-toggle-task-${task.id}`}>{task.done && <Check size={14} strokeWidth={2.8} />}</button>
              <div className="is-task-content"><span className="is-task-title">{task.title}</span><span className="is-task-detail">{taskDetail(task, state)}</span></div>
              <span className={`is-task-category ${task.category === '학교' ? 'school' : 'personal'}`}>{task.category}</span>
              <button type="button" className="is-task-delete" aria-label={`${task.title} 삭제`} onClick={() => deleteTask(task.id)} data-testid={`button-delete-task-${task.id}`}><Trash2 size={16} /></button>
            </article>;
            }) : <div className="is-empty-filter" data-testid="status-no-tasks">이 날은 챙길 일이 없어요. 새 할 일을 담아보세요.</div>}
          </div>
          <button type="button" className="is-add" onClick={openTaskForm} data-testid="button-add-task"><Plus size={14} /> 할 일 추가하기</button>
        </section>}
        </div>
        </div>

        <aside className="is-section" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '1px 1px 0', color: '#6f7468', fontSize: 11 }} data-testid="text-data-source-note">
          <Clock3 size={12} /><span>수업 시간표와 가져온 학교 일정은 서로 다른 목록이에요.</span>
        </aside>
      </div>

      <nav className="is-bottom" aria-label="주요 메뉴">
        {[
          { label: '오늘', icon: <CalendarDays size={17} strokeWidth={1.9} /> },
          { label: '일정', icon: <Clock3 size={17} strokeWidth={1.9} /> },
          { label: '할 일', icon: <Check size={17} strokeWidth={2} /> },
          { label: '메일', icon: <Mail size={17} strokeWidth={1.8} /> },
          { label: '메모', icon: <FileText size={17} strokeWidth={1.8} /> },
        ].map((item) => <button type="button" key={item.label} className={`is-nav${nav === item.label ? ' active' : ''}`} onClick={() => chooseNav(item.label)} aria-label={`${item.label} 보기`} data-testid={`nav-${item.label}`}><span className="is-nav-icon">{item.icon}</span>{item.label}</button>)}
      </nav>
      {showReconnect && <div className="is-reconnect" role="alertdialog" aria-label="구글 연결이 풀렸어요" data-testid="prompt-reconnect">
        <div className="is-reconnect-text"><strong>구글 연결이 풀렸어요</strong><span>{lostServices.map(serviceLabel).join("·")} 연결을 한 번에 다시 할까요?</span></div>
        <button type="button" className="is-reconnect-go" onClick={() => void reconnect()} data-testid="button-reconnect-go">다시 연결</button>
        <button type="button" className="is-reconnect-later" onClick={() => setPromptDismissed(true)} data-testid="button-reconnect-later">나중에</button>
      </div>}
      {undoTask && <div className="is-toast is-toast-action" role="status" data-testid="status-task-deleted"><span>할 일을 삭제했어요</span><button type="button" onClick={restoreTask} data-testid="button-undo-delete">되돌리기</button></div>}
      {notice && <div className="is-toast" role="status" aria-live="polite" data-testid="status-toast">{notice}</div>}

      {profileOpen && <div className="is-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setProfileOpen(false); }}>
        <section className="is-modal" role="dialog" aria-label="개인정보">
          <div className="is-modal-head"><h2 className="is-modal-title">개인정보</h2><button type="button" className="is-close" aria-label="닫기" onClick={() => setProfileOpen(false)} data-testid="button-close-profile"><X size={17} /></button></div>
          <div className="is-source-card" style={{ marginBottom: 10 }} data-testid="status-install">
            <span className="is-google-mark"><Download size={17} strokeWidth={1.8} /></span>
            <div className="is-source-copy">
              <span className="is-source-title">앱으로 설치</span>
              <span className="is-source-caption">{standalone ? '설치됨 · 앱으로 열려 있어요' : installEvent ? '홈 화면에 추가해 앱처럼 쓸 수 있어요' : isIos() ? 'Safari 공유 버튼 → "홈 화면에 추가"를 눌러 주세요' : '브라우저 메뉴의 "앱 설치" 또는 "홈 화면에 추가"를 눌러 주세요'}</span>
            </div>
            {!standalone && installEvent && <button type="button" className="is-sync" onClick={() => void installApp()} aria-label="앱으로 설치" data-testid="button-install-app"><span>설치</span></button>}
          </div>
          <div className="is-source-card" style={{ marginBottom: 10 }} data-testid="status-sync">
            <span className="is-google-mark"><Cloud size={17} strokeWidth={1.8} /></span>
            <div className="is-source-copy"><span className="is-source-title">기기 간 동기화</span><span className="is-source-caption" data-testid="text-sync-caption">{syncCaption}</span></div>
            <button type="button" className="is-sync" onClick={() => { if (sync.token) void sync.syncNow(); else void reconnect('drive'); }} disabled={sync.status === 'syncing' || reconnecting} aria-label={sync.linked ? '지금 동기화' : '구글 드라이브 연결'} data-testid="button-sync-now"><span>{sync.token ? '지금 동기화' : sync.linked ? '다시 연결' : '드라이브 연결'}</span></button>
          </div>
          {sync.linked && <button type="button" className="is-link-btn" onClick={unlinkDrive} data-testid="button-sync-unlink">동기화 해제 (이 기기의 연결만 끊어요)</button>}
          <div className="is-source-card" data-testid="status-google-calendar">
            <span className="is-google-mark"><CalendarDays size={17} strokeWidth={1.8} /></span>
            <div className="is-source-copy"><span className="is-source-title">Google Calendar</span><span className="is-source-caption">{connected ? '연결됨 · 읽기 전용' : token ? '불러오는 중…' : linked ? '다시 연결이 필요해요' : '연결되지 않음 · 샘플 일정'}</span></div>
            {token
              ? <button type="button" className="is-sync" onClick={unlinkGoogle} aria-label="구글 캘린더 연결 해제" data-testid="button-google-unlink"><span>연결 해제</span></button>
              : <button type="button" className="is-sync" onClick={() => void connectGoogle()} disabled={calendarBusy} aria-label="구글 캘린더 연결" data-testid="button-google-connect"><RefreshCw size={12} className={calendarBusy ? 'is-spin' : undefined} /><span>{calendarBusy ? '연결 중…' : '구글 연결'}</span></button>}
          </div>
          <div className="is-source-card" style={{ marginTop: 10 }} data-testid="status-gmail">
            <span className="is-google-mark"><Mail size={17} strokeWidth={1.8} /></span>
            <div className="is-source-copy"><span className="is-source-title">Gmail</span><span className="is-source-caption">{mailToken ? '연결됨 · 읽기와 휴지통 이동' : mailLinked ? '다시 연결이 필요해요' : '연결되지 않음'}</span></div>
            {mailToken
              ? <button type="button" className="is-sync" onClick={unlinkMail} aria-label="Gmail 연결 해제" data-testid="button-mail-unlink"><span>연결 해제</span></button>
              : <button type="button" className="is-sync" onClick={() => void connectMail()} disabled={reconnecting} aria-label="Gmail 연결" data-testid="button-mail-connect-profile"><span>{reconnecting ? '연결 중…' : mailLinked ? '다시 연결' : 'Gmail 연결'}</span></button>}
          </div>
          <p className="is-modal-hint">연결한 서비스(캘린더·Gmail·드라이브)는 로그인이 풀리면 위쪽 구름 아이콘 한 번으로 한꺼번에 다시 연결돼요.</p>
          <p className="is-modal-hint">일정은 읽기만 해요. 메일은 읽고 휴지통으로 옮기는 것만 하고, 보내거나 영구 삭제하지 않아요. 불러온 내용은 이 기기에서만 보이고 따로 저장하지 않아요.</p>
          <p className="is-modal-hint">메모와 할 일은 이 기기에 저장되고, 동기화를 켜면 내 구글 드라이브의 앱 전용 숨김 폴더를 통해 다른 기기와 맞춰져요. 출결 기록은 학생 정보가 있어서 동기화하지 않고 이 기기에만 저장돼요(시간표·출결부 앱과 같은 기록).</p>
        </section>
      </div>}
      {attendanceLesson && <AttendanceSheet
        session={sessionOf(attendanceLesson)}
        dateLabel={`${selectedDay.month}월 ${selectedDay.date}일 (${selectedDay.day})`}
        groups={attendanceLesson.groups}
        rosterLoaded={Boolean(liveTimetable?.withRoster)}
        records={records}
        onToggle={toggleAttendance}
        onClear={clearAttendance}
        onClose={() => setAttendancePeriod(null)}
      />}
      {mailOpen && <MailSheet token={mailToken} connecting={reconnecting} onConnect={() => void connectMail()} onExpired={() => { setMailToken(null); flash('Gmail 로그인이 만료됐어요. 다시 연결해 주세요.'); }} onClose={closeMail} />}
      {noteOpen && <div className="is-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setNoteOpen(false); }}>
        <form className="is-modal" aria-label="메모 편집" onSubmit={(event) => { event.preventDefault(); saveNote(); }}>
          <div className="is-modal-head"><h2 className="is-modal-title">나만 보는 메모</h2><button type="button" className="is-close" aria-label="닫기" onClick={() => setNoteOpen(false)} data-testid="button-close-note"><X size={17} /></button></div>
          <textarea className="is-textarea" aria-label="메모 내용" data-testid="input-note-content" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="기억해둘 일을 적어보세요" />
          <p className="is-modal-hint">이 메모는 이 기기의 브라우저에 저장돼요.</p>
          <button type="submit" className="is-modal-submit" data-testid="button-save-note"><StickyNote size={14} /> 메모 저장하기</button>
        </form>
      </div>}
      {taskOpen && <div className="is-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setTaskOpen(false); }}>
        <form className="is-modal" aria-label="할 일 추가" onSubmit={(event) => { event.preventDefault(); addTask(); }}>
          <div className="is-modal-head"><h2 className="is-modal-title">새 할 일 담기</h2><button type="button" className="is-close" aria-label="닫기" onClick={() => setTaskOpen(false)} data-testid="button-close-task"><X size={17} /></button></div>
          <input autoFocus className="is-input" aria-label="할 일 제목" data-testid="input-task-title" value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="해야 할 일을 적어보세요" />
          <div className="is-category-toggle" role="group" aria-label="할 일 분류">
            {(['학교', '개인'] as TaskCategory[]).map((category) => <button type="button" key={category} className={`is-category-choice${taskCategory === category ? ' active' : ''}`} aria-pressed={taskCategory === category} onClick={() => setTaskCategory(category)} data-testid={`button-task-category-${category}`}>{category === '학교' ? '학교 업무' : '개인 업무'}</button>)}
          </div>
          <div className="is-category-toggle" role="group" aria-label="날짜 설정">
            <button type="button" className={`is-category-choice${taskDated ? ' active' : ''}`} aria-pressed={taskDated} onClick={() => setTaskDated(true)} data-testid="button-task-dated">날짜 지정</button>
            <button type="button" className={`is-category-choice${!taskDated ? ' active' : ''}`} aria-pressed={!taskDated} onClick={() => setTaskDated(false)} data-testid="button-task-undated">날짜 없음 (매일)</button>
          </div>
          {taskDated && <div className="is-date-fields">
            <label className="is-date-field"><span>시작</span><input type="date" className="is-input" value={taskStart} onChange={(event) => { setTaskStart(event.target.value); if (taskEndDraft && taskEndDraft <= event.target.value) setTaskEndDraft(''); }} data-testid="input-task-start" required /></label>
            <label className="is-date-field"><span>끝 (기간이면)</span><input type="date" className="is-input" value={taskEndDraft} min={taskStart || undefined} onChange={(event) => setTaskEndDraft(event.target.value)} data-testid="input-task-end" /></label>
          </div>}
          <button type="submit" className="is-modal-submit" disabled={!taskDraft.trim() || (taskDated && !taskStart)} data-testid="button-submit-task"><Plus size={15} /> 할 일 담기</button>
        </form>
      </div>}
    </main>
    </div></div></div>
  );
}
