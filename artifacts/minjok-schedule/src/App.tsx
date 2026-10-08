import { useEffect, useState } from 'react';
import {
  BookOpen, CalendarDays, Check, ChevronDown, ChevronRight, Clock3,
  FileText, GraduationCap, Plus, RefreshCw, StickyNote, UserRound, X,
} from 'lucide-react';

type ScheduleFilter = '전체' | '캘린더' | '수업' | '학교' | '개인';
type TaskCategory = '학교' | '개인';
type PlannerTask = { id: number; title: string; detail: string; category: TaskCategory; done: boolean };

const days = [
  { day: '화', date: '6' }, { day: '수', date: '7' }, { day: '목', date: '8' },
  { day: '금', date: '9' }, { day: '토', date: '10' },
];
const calendarEvents = [
  { time: '08:40', title: '아침 조회 · 2학년 3반', note: '담임 선생님 공지' },
  { time: '14:30', title: '과학 수행평가 초안 제출', note: '온라인 클래스 · 오늘까지' },
  { time: '16:10', title: '도서관 자율 학습', note: '중앙도서관 2층' },
];
const initialTasks: PlannerTask[] = [
  { id: 1, title: '한국사 발표 자료 마무리', detail: '금요일 1교시 · 3장 분량', category: '학교', done: false },
  { id: 2, title: '엄마 생신 선물 찾아보기', detail: '저녁에 온라인으로 보기', category: '개인', done: false },
  { id: 3, title: '영어 단어 20개 복습', detail: '이번 주 학습 루틴', category: '학교', done: true },
];
const timetable = [
  { time: '09:00', subject: '국어', room: '3-3' },
  { time: '10:00', subject: '수학', room: '수학실' },
  { time: '11:00', subject: '생명과학', room: '과학실' },
  { time: '13:30', subject: '미술', room: '미술실' },
];
const STORAGE_TASKS = 'minjok-schedule.tasks.v1';
const STORAGE_NOTE = 'minjok-schedule.note.v1';

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
function loadNote() {
  try { return localStorage.getItem(STORAGE_NOTE) ?? '오늘 과학 수행평가 초안 제출하기. 끝나면 서점에 들러서 새 노트 구경하기.'; }
  catch { return '오늘 과학 수행평가 초안 제출하기. 끝나면 서점에 들러서 새 노트 구경하기.'; }
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState('8');
  const [activeFilter, setActiveFilter] = useState<ScheduleFilter>('전체');
  const [tasks, setTasks] = useState<PlannerTask[]>(loadTasks);
  const [note, setNote] = useState(loadNote);
  const [noteDraft, setNoteDraft] = useState(note);
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('학교');
  const [notice, setNotice] = useState('');
  const [syncLabel, setSyncLabel] = useState('샘플 일정 · 동기화 예시');
  const [nav, setNav] = useState('오늘');
  const selectedDay = days.find((day) => day.date === selectedDate) ?? days[2];

  useEffect(() => {
    try { localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks)); } catch { /* Local-only app can still be used for this session. */ }
  }, [tasks]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_NOTE, note); } catch { /* Local-only app can still be used for this session. */ }
  }, [note]);

  const visibleCalendarEvents = activeFilter === '개인' || activeFilter === '수업' ? [] : calendarEvents;
  const showTimetable = activeFilter === '전체' || activeFilter === '수업';
  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === '캘린더' || activeFilter === '수업') return false;
    if (activeFilter === '학교') return task.category === '학교';
    if (activeFilter === '개인') return task.category === '개인';
    return true;
  });

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2300);
  }
  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
    flash('작은 한 걸음, 잘 해냈어요.');
  }
  function syncPreview() {
    setSyncLabel('방금 확인 · 샘플 데이터');
    flash('샘플 학교 일정이 최신 상태예요. 실제 Google Calendar는 연결되지 않았어요.');
  }
  function saveNote() {
    const saved = noteDraft.trim();
    if (!saved) { flash('메모 내용을 한 줄 적어주세요.'); return; }
    setNote(saved);
    setNoteOpen(false);
    flash('나만의 메모에 저장했어요.');
  }
  function addTask() {
    const title = taskDraft.trim();
    if (!title) return;
    setTasks((current) => [{ id: Date.now(), title, detail: '오늘 할 일', category: taskCategory, done: false }, ...current]);
    setTaskDraft('');
    setTaskOpen(false);
    flash(`${taskCategory} 할 일로 담았어요.`);
  }
  function chooseNav(label: string) {
    setNav(label);
    if (label === '메모') {
      setNoteDraft(note);
      setNoteOpen(true);
    } else if (label === '할 일') {
      document.getElementById('integrated-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      flash('학교와 개인 할 일을 모아봤어요.');
    } else if (label === '일정') {
      document.getElementById('integrated-agenda')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      flash('오늘의 일정을 확인해요.');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      flash('오늘의 흐름을 한곳에 모았어요.');
    }
  }

  return (
    <main className="is-root">
      <div className="is-shell">
        <header>
          <div className="is-topbar">
            <div className="is-brand">
              <img className="is-brand-mark" src="/images/kmla-emblem.png" alt="민족사관고등학교 촛불 교표" data-testid="img-school-emblem" />
              <span className="is-brand-copy">
                <span className="is-brand-title">민사고 김태완</span>
                <span className="is-brand-sub">MINJOK LEADERSHIP ACADEMY</span>
              </span>
            </div>
            <button type="button" className="is-profile" aria-label="프로필 알림" data-testid="button-profile-notice" onClick={() => flash('학교와 나의 하루를 차분히 살펴봐요.')}>
              <UserRound size={17} strokeWidth={1.7} />
            </button>
          </div>
          <section className="is-campus-hero" aria-label="민족사관고등학교 캠퍼스와 오늘의 일정">
            <img className="is-campus-photo" src="/images/integrated-schedule-promo.jpg" alt="나무 사이로 학교 건물과 동상이 보이는 민족사관고등학교 캠퍼스" data-testid="img-campus-photo" />
            <div className="is-campus-veil" aria-hidden="true" />
            <div className="is-campus-topline"><span className="is-campus-weather"><span>18°</span><span aria-hidden="true">·</span><span>구름 조금</span></span></div>
            <div className="is-campus-copy">
              <p className="is-campus-date" data-testid="text-selected-date">10월 {selectedDay.date}일 {selectedDay.day}요일</p>
              <h1 className="is-heading">오늘의 일정</h1>
            </div>
          </section>
        </header>

        <div className="is-date-strip" role="group" aria-label="날짜 선택">
          {days.map((day) => (
            <button key={day.date} type="button" className={`is-day${selectedDate === day.date ? ' active' : ''}`} aria-pressed={selectedDate === day.date} aria-label={`10월 ${day.date}일 ${day.day}요일`} data-testid={`button-date-${day.date}`} onClick={() => { setSelectedDate(day.date); flash(`10월 ${day.date}일 ${day.day}요일 일정이에요.`); }}>
              <span className="is-day-name">{day.day}</span><span className="is-day-number">{day.date}</span>
            </button>
          ))}
        </div>
        <div className="is-filter-row" role="group" aria-label="일정 출처 및 분류">
          {(['전체', '캘린더', '수업', '학교', '개인'] as ScheduleFilter[]).map((filter) => (
            <button type="button" key={filter} aria-pressed={activeFilter === filter} className={`is-filter${activeFilter === filter ? ' active' : ''}`} data-testid={`button-filter-${filter}`} onClick={() => { setActiveFilter(filter); flash(`${filter} 항목을 모아봤어요.`); }}>
              {filter !== '전체' && <span className="is-filter-dot" aria-hidden="true" />}{filter}
            </button>
          ))}
        </div>

        {(activeFilter === '전체' || activeFilter === '캘린더') && (
          <section className="is-source-card" aria-label="Google Calendar 학교 일정 샘플" data-testid="status-google-calendar">
            <span className="is-google-mark"><CalendarDays size={17} strokeWidth={1.8} /></span>
            <div className="is-source-copy"><span className="is-source-title">Google Calendar · 학교 일정</span><span className="is-source-caption">{syncLabel} · 연결되지 않음</span></div>
            <button type="button" className="is-sync" onClick={syncPreview} aria-label="샘플 일정 확인" data-testid="button-sample-calendar-check"><RefreshCw size={12} /><span>샘플 확인</span></button>
          </section>
        )}

        <section className="is-section" id="integrated-agenda" aria-label="학교 캘린더 일정">
          {(activeFilter === '전체' || activeFilter === '캘린더') && <>
            <div className="is-section-head">
              <div><h2 className="is-section-title">학교 캘린더</h2><p className="is-section-sub">Google Calendar에서 가져온 샘플 일정 · 실시간 연동 아님</p></div>
              <button type="button" className="is-more" aria-label="샘플 일정 개수" onClick={() => flash('학교 캘린더 샘플 3개를 보고 있어요.')} data-testid="button-calendar-count">3개 <ChevronDown size={13} /></button>
            </div>
            <div className="is-event-list">
              {visibleCalendarEvents.map((event) => <article key={event.time} className="is-event" data-testid={`event-calendar-${event.time}`}>
                <time className="is-event-time">{event.time}</time><span className="is-event-marker" aria-hidden="true" />
                <div className="is-event-body"><p className="is-event-title">{event.title}<span className="is-event-label">학교</span></p><p className="is-event-note">{event.note}</p></div>
              </article>)}
            </div>
          </>}
          {activeFilter === '수업' && <div className="is-section-head"><div><h2 className="is-section-title">내 수업 시간표</h2><p className="is-section-sub">캘린더 일정과 별도로 관리해요</p></div><BookOpen size={17} color="#68816b" /></div>}
          {activeFilter === '개인' && <div className="is-section-head"><div><h2 className="is-section-title">나를 위한 일정</h2><p className="is-section-sub">학교 밖의 시간도 놓치지 않도록</p></div><StickyNote size={17} color="#9b8060" /></div>}
          {activeFilter === '학교' && <div className="is-section-head"><div><h2 className="is-section-title">학교 할 일</h2><p className="is-section-sub">제출과 공부를 따로 챙겨요</p></div><GraduationCap size={18} color="#a16e53" /></div>}
        </section>

        {showTimetable && <section className="is-section is-timetable" aria-label="내 수업 시간표" data-testid="section-sample-timetable">
          <div className="is-timetable-head"><div className="is-timetable-label"><GraduationCap size={15} /> 내 수업 시간표</div><span className="is-class-tag">샘플 시간표</span></div>
          <div className="is-class-row">{timetable.map((item) => <div className="is-class" key={item.time} data-testid={`class-sample-${item.time}`}><span className="is-class-time">{item.time}</span><span className="is-class-name">{item.subject}</span><span className="is-class-room">{item.room}</span></div>)}</div>
          <p className="is-timetable-note">실제 수업은 기존 시간표 웹앱 연결 후 불러올 예정이에요.</p>
          <button type="button" className="is-timetable-connect" onClick={() => flash('기존 수업 시간표 웹앱은 다음 단계에서 연결할게요.')} aria-label="기존 수업 시간표 웹앱 연결은 추후 진행" data-testid="button-timetable-pending">
            <BookOpen size={13} /><span>기존 수업 시간표 웹앱</span><span className="is-connect-status">추후 연결</span>
          </button>
        </section>}

        {(activeFilter === '전체' || activeFilter === '개인') && <section className="is-section" aria-label="개인 메모 미리보기">
          <button type="button" className="is-note-card" onClick={() => { setNoteDraft(note); setNoteOpen(true); }} data-testid="button-open-note">
            <span className="is-note-head"><span className="is-note-label"><StickyNote size={13} /> 나만 보는 메모</span><span className="is-note-open"><ChevronRight size={15} /></span></span>
            <span className="is-note-preview" data-testid="text-note-preview">{note || '오늘 기억해둘 일을 적어보세요.'}</span>
          </button>
        </section>}

        {activeFilter !== '캘린더' && activeFilter !== '수업' && <section className="is-section" id="integrated-tasks" aria-label="학교 및 개인 할 일">
          <div className="is-section-head"><div><h2 className="is-section-title">오늘 챙길 일</h2><p className="is-section-sub">학교도, 나의 일도 한눈에</p></div><span style={{ color: '#899083', fontSize: 9, fontWeight: 700 }} data-testid="text-open-task-count">{visibleTasks.filter((task) => !task.done).length}개 남음</span></div>
          <div className="is-task-list">
            {visibleTasks.length ? visibleTasks.map((task) => <article className={`is-task${task.done ? ' done' : ''}`} key={task.id} data-testid={`task-item-${task.id}`}>
              <button type="button" className={`is-check${task.done ? ' checked' : ''}`} aria-label={`${task.title} ${task.done ? '완료 취소' : '완료'}`} aria-pressed={task.done} onClick={() => toggleTask(task.id)} data-testid={`button-toggle-task-${task.id}`}>{task.done && <Check size={14} strokeWidth={2.8} />}</button>
              <div className="is-task-content"><span className="is-task-title">{task.title}</span><span className="is-task-detail">{task.detail}</span></div>
              <span className={`is-task-category ${task.category === '학교' ? 'school' : 'personal'}`}>{task.category}</span>
            </article>) : <div className="is-empty-filter" data-testid="status-no-tasks">아직 챙길 일이 없어요. 새 할 일을 담아보세요.</div>}
          </div>
          <button type="button" className="is-add" onClick={() => setTaskOpen(true)} data-testid="button-add-task"><Plus size={14} /> 할 일 추가하기</button>
        </section>}

        <aside className="is-section" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '1px 1px 0', color: '#8c9085', fontSize: 9 }} data-testid="text-data-source-note">
          <Clock3 size={12} /><span>수업 시간표와 가져온 학교 일정은 서로 다른 목록이에요.</span>
        </aside>
      </div>

      <nav className="is-bottom" aria-label="주요 메뉴">
        {[
          { label: '오늘', icon: <CalendarDays size={17} strokeWidth={1.9} /> },
          { label: '일정', icon: <Clock3 size={17} strokeWidth={1.9} /> },
          { label: '할 일', icon: <Check size={17} strokeWidth={2} /> },
          { label: '메모', icon: <FileText size={17} strokeWidth={1.8} /> },
        ].map((item) => <button type="button" key={item.label} className={`is-nav${nav === item.label ? ' active' : ''}`} onClick={() => chooseNav(item.label)} aria-label={`${item.label} 보기`} data-testid={`nav-${item.label}`}><span className="is-nav-icon">{item.icon}</span>{item.label}</button>)}
      </nav>
      {notice && <div className="is-toast" role="status" aria-live="polite" data-testid="status-toast">{notice}</div>}

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
          <button type="submit" className="is-modal-submit" disabled={!taskDraft.trim()} data-testid="button-submit-task"><Plus size={15} /> 오늘에 담기</button>
        </form>
      </div>}
    </main>
  );
}
