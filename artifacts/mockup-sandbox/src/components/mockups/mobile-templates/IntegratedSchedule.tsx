import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  Plus,
  RefreshCw,
  StickyNote,
  UserRound,
  X,
} from "lucide-react";

type ScheduleFilter = "전체" | "캘린더" | "수업" | "학교" | "개인";
type TaskCategory = "학교" | "개인";

type PlannerTask = {
  id: number;
  title: string;
  detail: string;
  category: TaskCategory;
  done: boolean;
};

const days = [
  { day: "화", date: "6" },
  { day: "수", date: "7" },
  { day: "목", date: "8" },
  { day: "금", date: "9" },
  { day: "토", date: "10" },
];

const calendarEvents = [
  { time: "08:40", title: "아침 조회 · 2학년 3반", note: "담임 선생님 공지", color: "calendar" },
  { time: "14:30", title: "과학 수행평가 초안 제출", note: "온라인 클래스 · 오늘까지", color: "calendar" },
  { time: "16:10", title: "도서관 자율 학습", note: "중앙도서관 2층", color: "calendar" },
];

const initialTasks: PlannerTask[] = [
  { id: 1, title: "한국사 발표 자료 마무리", detail: "금요일 1교시 · 3장 분량", category: "학교", done: false },
  { id: 2, title: "엄마 생신 선물 찾아보기", detail: "저녁에 온라인으로 보기", category: "개인", done: false },
  { id: 3, title: "영어 단어 20개 복습", detail: "이번 주 학습 루틴", category: "학교", done: true },
];

const timetable = [
  { time: "09:00", subject: "국어", room: "3-3" },
  { time: "10:00", subject: "수학", room: "수학실" },
  { time: "11:00", subject: "생명과학", room: "과학실" },
  { time: "13:30", subject: "미술", room: "미술실" },
];

export function IntegratedSchedule() {
  const [selectedDate, setSelectedDate] = useState("8");
  const [activeFilter, setActiveFilter] = useState<ScheduleFilter>("전체");
  const [tasks, setTasks] = useState(initialTasks);
  const [note, setNote] = useState("오늘 과학 수행평가 초안 제출하기. 끝나면 서점에 들러서 새 노트 구경하기.");
  const [noteDraft, setNoteDraft] = useState(note);
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState("");
  const [taskCategory, setTaskCategory] = useState<TaskCategory>("학교");
  const [notice, setNotice] = useState("");
  const [syncLabel, setSyncLabel] = useState("샘플 일정 · 동기화 예시");
  const [nav, setNav] = useState("오늘");

  const selectedDay = days.find((day) => day.date === selectedDate) ?? days[2];
  const visibleCalendarEvents = activeFilter === "개인" || activeFilter === "수업"
    ? []
    : calendarEvents;
  const showTimetable = activeFilter === "전체" || activeFilter === "수업";
  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === "캘린더" || activeFilter === "수업") return false;
    if (activeFilter === "학교") return task.category === "학교";
    if (activeFilter === "개인") return task.category === "개인";
    return true;
  });

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2300);
  }

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
    flash("작은 한 걸음, 잘 해냈어요.");
  }

  function syncPreview() {
    setSyncLabel("방금 확인 · 샘플 데이터");
    flash("샘플 학교 일정이 최신 상태예요.");
  }

  function saveNote() {
    const saved = noteDraft.trim();
    if (!saved) {
      flash("메모 내용을 한 줄 적어주세요.");
      return;
    }
    setNote(saved);
    setNoteOpen(false);
    flash("나만의 메모에 저장했어요.");
  }

  function addTask() {
    const title = taskDraft.trim();
    if (!title) return;
    setTasks((current) => [
      { id: Date.now(), title, detail: "오늘 할 일", category: taskCategory, done: false },
      ...current,
    ]);
    setTaskDraft("");
    setTaskOpen(false);
    flash(`${taskCategory} 할 일로 담았어요.`);
  }

  function chooseNav(label: string) {
    setNav(label);
    if (label === "메모") {
      setNoteDraft(note);
      setNoteOpen(true);
    } else if (label === "할 일") {
      document.getElementById("integrated-tasks")?.scrollIntoView({ behavior: "smooth", block: "start" });
      flash("학교와 개인 할 일을 모아봤어요.");
    } else if (label === "일정") {
      document.getElementById("integrated-agenda")?.scrollIntoView({ behavior: "smooth", block: "start" });
      flash("오늘의 일정을 확인해요.");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      flash("오늘의 흐름을 한곳에 모았어요.");
    }
  }

  return (
    <main className="is-root">
      <style>{`
        .is-root, .is-root * { box-sizing: border-box; }
        .is-root {
          --paper: #f5f3eb;
          --surface: #fffdf7;
          --ink: #27342f;
          --muted: #81877c;
          --line: #e6e5d9;
          --pine: #466753;
          --pine-soft: #e3ebe1;
          --terracotta: #b66f51;
          --blue: #687f99;
          position: relative;
          width: 100%;
          min-height: 100dvh;
          overflow-x: hidden;
          color: var(--ink);
          background:
            radial-gradient(ellipse at 92% 5%, rgba(220, 228, 208, .48), transparent 32%),
            var(--paper);
          font-family: 'DM Sans', 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .is-shell {
          width: 100%;
          max-width: 430px;
          min-height: 100dvh;
          margin: 0 auto;
          padding: 19px 20px calc(112px + env(safe-area-inset-bottom));
          animation: is-enter .5s ease both;
        }
        @keyframes is-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .is-topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; }
        .is-brand { display:flex; align-items:center; gap:8px; color:#4b6c55; font-size:14px; font-weight:800; letter-spacing:-.06em; }
        .is-brand-mark { display:grid; place-items:center; width:29px; height:29px; border-radius:10px; background:#dce7d9; }
        .is-profile {
          display:grid; place-items:center; width:40px; height:40px; padding:0;
          border:1px solid #e4e4d8; border-radius:50%; background:rgba(255,253,247,.72); color:#6f8172; cursor:pointer;
        }
        .is-profile:active { transform:scale(.94); }
        .is-eyebrow { margin:0 0 5px; color:#7d887d; font-size:11px; font-weight:700; letter-spacing:.08em; }
        .is-heading { margin:0; font-size:26px; line-height:1.3; letter-spacing:-.075em; font-weight:750; }
        .is-heading em { color:#55735e; font-style:normal; }
        .is-hello { display:flex; align-items:flex-end; justify-content:space-between; }
        .is-weather { display:flex; align-items:center; gap:5px; padding:7px 10px; margin-bottom:2px; border-radius:12px; background:#e9ecdf; color:#687765; font-size:10px; font-weight:700; white-space:nowrap; }
        .is-date-strip { display:flex; justify-content:space-between; gap:6px; margin:18px 0 16px; }
        .is-day {
          display:flex; flex:1; min-width:0; height:57px; flex-direction:column; align-items:center; justify-content:center; gap:3px;
          border:1px solid transparent; border-radius:15px; background:transparent; color:#8b9086; font:inherit; cursor:pointer; transition:background .18s ease, transform .18s ease;
        }
        .is-day:active { transform:scale(.94); }
        .is-day-name { font-size:10px; font-weight:600; }
        .is-day-number { font-size:15px; font-weight:700; }
        .is-day.active { border-color:#dce6d8; background:#e5ece1; color:#44664f; }
        .is-day.active .is-day-name { color:#738572; }
        .is-filter-row { display:flex; gap:7px; overflow:auto; margin:0 -2px 13px; padding:0 2px 2px; scrollbar-width:none; }
        .is-filter-row::-webkit-scrollbar { display:none; }
        .is-filter {
          display:flex; align-items:center; gap:5px; min-height:34px; padding:0 11px;
          border:1px solid #e6e6dc; border-radius:999px; background:rgba(255,253,247,.62); color:#81867c;
          font:inherit; font-size:10px; font-weight:700; white-space:nowrap; cursor:pointer;
        }
        .is-filter.active { border-color:#d8e3d5; background:#e6ede2; color:#4d6b54; }
        .is-filter-dot { width:6px; height:6px; border-radius:50%; background:#b98262; }
        .is-filter:nth-child(3) .is-filter-dot { background:#6e8ba3; }
        .is-filter:nth-child(4) .is-filter-dot { background:#8a9d73; }
        .is-source-card {
          display:flex; align-items:center; gap:10px; min-height:63px; padding:10px 11px; margin-bottom:18px;
          border:1px solid #e6e7dc; border-radius:16px; background:rgba(255,253,247,.78);
        }
        .is-google-mark { display:grid; flex:0 0 33px; width:33px; height:33px; place-items:center; border-radius:11px; background:#f2ece1; color:#a9734d; }
        .is-source-copy { min-width:0; flex:1; }
        .is-source-title { display:block; color:#46534a; font-size:11px; font-weight:750; letter-spacing:-.03em; }
        .is-source-caption { display:block; margin-top:3px; color:#93958a; font-size:9px; letter-spacing:-.02em; }
        .is-sync {
          display:flex; align-items:center; justify-content:center; gap:5px; min-height:38px; padding:0 9px;
          border:1px solid #e8e7dc; border-radius:11px; background:#fbfaf4; color:#627564; font:inherit; font-size:9px; font-weight:700; cursor:pointer;
        }
        .is-sync:active { background:#eaf0e7; }
        .is-sync-caption { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
        .is-section { margin-top:18px; scroll-margin-top:16px; }
        .is-section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .is-section-title { margin:0; font-size:16px; font-weight:750; letter-spacing:-.065em; }
        .is-section-sub { margin:3px 0 0; color:#92948a; font-size:9px; }
        .is-more { display:flex; align-items:center; gap:2px; padding:7px 0 7px 8px; border:0; background:transparent; color:#81887e; font:inherit; font-size:10px; cursor:pointer; }
        .is-event-list { position:relative; display:flex; flex-direction:column; gap:7px; }
        .is-event-list::before { position:absolute; top:10px; bottom:10px; left:43px; width:1px; background:#e7e6db; content:""; }
        .is-event {
          position:relative; display:grid; grid-template-columns:37px 11px minmax(0,1fr); align-items:start; gap:7px; min-height:54px;
        }
        .is-event-time { padding-top:8px; color:#80877d; font-size:10px; font-variant-numeric:tabular-nums; font-weight:650; }
        .is-event-marker { z-index:1; width:9px; height:9px; margin:9px 0 0; border:2px solid #fffdf7; border-radius:50%; background:#b97859; box-shadow:0 0 0 1px #d9b49f; }
        .is-event-body { min-width:0; padding:7px 10px 8px; border:1px solid #eee9dd; border-radius:12px; background:rgba(255,253,247,.78); }
        .is-event-title { display:flex; align-items:center; gap:6px; margin:0; color:#39453d; font-size:11px; font-weight:700; letter-spacing:-.035em; }
        .is-event-note { margin:4px 0 0; color:#92948a; font-size:9px; }
        .is-event-label { padding:2px 5px; border-radius:5px; background:#f3e6dc; color:#a36c51; font-size:8px; font-weight:700; white-space:nowrap; }
        .is-empty-filter { padding:15px; border:1px dashed #dfe2d6; border-radius:14px; color:#8a9086; font-size:11px; text-align:center; }
        .is-timetable {
          padding:13px 12px 11px; border:1px solid #e3e8df; border-radius:16px; background:#e9eee5;
        }
        .is-timetable-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:11px; }
        .is-timetable-label { display:flex; align-items:center; gap:6px; color:#526c57; font-size:11px; font-weight:750; }
        .is-class-tag { padding:4px 7px; border-radius:7px; background:#f7f7ef; color:#788474; font-size:8px; font-weight:700; }
        .is-class-row { display:flex; gap:7px; overflow:auto; scrollbar-width:none; }
        .is-class-row::-webkit-scrollbar { display:none; }
        .is-class {
          display:flex; min-width:65px; flex:1; flex-direction:column; gap:5px; padding:8px 8px 7px;
          border:1px solid rgba(204,215,200,.8); border-radius:10px; background:rgba(255,255,250,.72);
        }
        .is-class-time { color:#92988b; font-size:8px; font-variant-numeric:tabular-nums; }
        .is-class-name { color:#445b49; font-size:10px; font-weight:750; letter-spacing:-.04em; }
        .is-class-room { color:#959a8f; font-size:8px; }
        .is-task-list { display:flex; flex-direction:column; gap:8px; }
        .is-task {
          display:flex; align-items:center; gap:10px; min-height:63px; padding:10px 11px;
          border:1px solid #e7e7dd; border-radius:15px; background:rgba(255,253,247,.82);
          transition:background .18s ease, transform .18s ease;
        }
        .is-task:active { transform:scale(.99); }
        .is-task.done { background:#eff1e9; }
        .is-check {
          display:grid; flex:0 0 23px; width:23px; height:23px; place-items:center; padding:0;
          border:1.5px solid #cbd0c5; border-radius:8px; background:transparent; color:#fff; cursor:pointer;
        }
        .is-check.checked { border-color:#52725b; background:#52725b; }
        .is-task-content { min-width:0; flex:1; }
        .is-task-title { display:block; overflow:hidden; color:#39443c; font-size:11px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }
        .is-task.done .is-task-title { color:#95998e; text-decoration:line-through; }
        .is-task-detail { display:block; margin-top:4px; color:#91948a; font-size:9px; }
        .is-task-category { padding:4px 7px; border-radius:7px; font-size:8px; font-weight:750; white-space:nowrap; }
        .is-task-category.school { background:#f2e5db; color:#9c684d; }
        .is-task-category.personal { background:#e4ebdf; color:#5e795f; }
        .is-add {
          display:flex; width:100%; align-items:center; justify-content:center; gap:6px; min-height:44px; margin-top:9px;
          border:1px dashed #bccbb9; border-radius:13px; background:transparent; color:#547158; font:inherit; font-size:10px; font-weight:750; cursor:pointer;
        }
        .is-add:active { background:#e9eee5; }
        .is-note-card {
          position:relative; display:block; width:100%; padding:14px 14px 13px; overflow:hidden;
          border:0; border-radius:15px; background:#efe8dc; color:#695e4e; text-align:left; cursor:pointer;
        }
        .is-note-card::after { position:absolute; top:-29px; right:-7px; width:88px; height:88px; border:1px solid rgba(164,139,103,.16); border-radius:50%; content:""; }
        .is-note-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:7px; }
        .is-note-label { display:flex; align-items:center; gap:6px; color:#806d54; font-size:10px; font-weight:750; }
        .is-note-open { display:grid; place-items:center; width:26px; height:26px; border-radius:8px; background:#e5dac8; color:#8d775a; }
        .is-note-preview { display:-webkit-box; overflow:hidden; margin:0; color:#716755; font-size:10px; line-height:1.55; letter-spacing:-.025em; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
        .is-bottom {
          position:fixed; z-index:5; right:0; bottom:0; left:0; display:flex; justify-content:space-around;
          width:min(100%,430px); margin:0 auto; padding:9px 14px calc(10px + env(safe-area-inset-bottom));
          border-top:1px solid rgba(222,224,213,.92); background:rgba(249,248,241,.96); backdrop-filter:blur(16px);
        }
        .is-nav {
          display:flex; min-width:61px; min-height:50px; flex-direction:column; align-items:center; justify-content:center; gap:3px;
          border:0; background:transparent; color:#92978d; font:inherit; font-size:9px; font-weight:600; cursor:pointer;
        }
        .is-nav-icon { display:grid; width:34px; height:27px; place-items:center; border-radius:10px; }
        .is-nav.active { color:#4d7058; font-weight:750; }
        .is-nav.active .is-nav-icon { background:#e3ebe0; }
        .is-nav:active .is-nav-icon { transform:scale(.92); }
        .is-toast {
          position:fixed; z-index:12; right:20px; bottom:calc(81px + env(safe-area-inset-bottom)); left:20px; width:fit-content; max-width:calc(100% - 40px); margin:auto;
          padding:11px 15px; border-radius:999px; background:#354a3b; color:#f6f5ec; font-size:10px; font-weight:650; box-shadow:0 8px 20px rgba(38,54,42,.14);
          animation:is-fade .2s ease both;
        }
        @keyframes is-fade { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        .is-modal-backdrop {
          position:fixed; z-index:10; inset:0; display:flex; align-items:flex-end; justify-content:center; padding:14px;
          background:rgba(34,44,38,.28); animation:is-fade .18s ease both;
        }
        .is-modal {
          width:min(100%,410px); padding:19px 18px 18px; border:1px solid rgba(229,229,218,.7); border-radius:22px 22px 18px 18px;
          background:#fbfaf4; box-shadow:0 15px 55px rgba(37,49,40,.17); animation:is-sheet .22s ease both;
        }
        @keyframes is-sheet { from { opacity:.6; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }
        .is-modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:13px; }
        .is-modal-title { margin:0; color:#344138; font-size:15px; font-weight:750; letter-spacing:-.055em; }
        .is-close { display:grid; width:34px; height:34px; place-items:center; border:0; border-radius:50%; background:#eff0e8; color:#70786e; cursor:pointer; }
        .is-textarea, .is-input {
          display:block; width:100%; border:1px solid #e0e3d9; border-radius:13px; outline:none; background:#f7f6ef; color:#344138; font:inherit; font-size:12px;
        }
        .is-textarea { min-height:116px; padding:12px 13px; line-height:1.65; resize:vertical; }
        .is-input { height:46px; padding:0 13px; }
        .is-textarea:focus, .is-input:focus { border-color:#91a992; box-shadow:0 0 0 3px #e8eee4; }
        .is-modal-hint { margin:8px 0 0; color:#96998e; font-size:9px; }
        .is-modal-submit {
          display:flex; width:100%; min-height:46px; align-items:center; justify-content:center; gap:6px; margin-top:12px;
          border:0; border-radius:12px; background:#4c6d54; color:#fbfaf3; font:inherit; font-size:12px; font-weight:750; cursor:pointer;
        }
        .is-modal-submit:disabled { opacity:.55; cursor:not-allowed; }
        .is-category-toggle { display:flex; gap:7px; margin-top:10px; }
        .is-category-choice { flex:1; min-height:40px; border:1px solid #e4e5da; border-radius:11px; background:#f6f5ee; color:#84897e; font:inherit; font-size:10px; font-weight:700; cursor:pointer; }
        .is-category-choice.active { border-color:#d5e1d2; background:#e6ede2; color:#4e6d55; }
        .is-root button:focus-visible { outline:3px solid rgba(88,124,94,.38); outline-offset:2px; }
        @media (min-width:600px) { .is-shell { padding-top:25px; } }
        @media (prefers-reduced-motion: reduce) {
          .is-root *, .is-root *::before, .is-root *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; scroll-behavior:auto !important; }
        }
      `}</style>

      <div className="is-shell">
        <header>
          <div className="is-topbar">
            <div className="is-brand">
              <span className="is-brand-mark"><CalendarDays size={16} strokeWidth={1.9} /></span>
              하루결 <span style={{ color: "#9b9d91", fontWeight: 500 }}>· 일정 허브</span>
            </div>
            <button type="button" className="is-profile" aria-label="프로필 알림" onClick={() => flash("학교와 나의 하루를 차분히 살펴봐요.")}>
              <UserRound size={17} strokeWidth={1.7} />
            </button>
          </div>
          <div className="is-hello">
            <div>
              <p className="is-eyebrow">10월 {selectedDay.date}일 {selectedDay.day}요일</p>
              <h1 className="is-heading">오늘의 일정,<br /><em>한곳에서 차분히</em></h1>
            </div>
            <div className="is-weather"><span>18°</span><span aria-hidden="true">·</span><span>구름 조금</span></div>
          </div>
        </header>

        <div className="is-date-strip" role="group" aria-label="날짜 선택">
          {days.map((day) => (
            <button
              key={day.date}
              type="button"
              className={`is-day${selectedDate === day.date ? " active" : ""}`}
              aria-pressed={selectedDate === day.date}
              onClick={() => { setSelectedDate(day.date); flash(`10월 ${day.date}일 ${day.day}요일 일정이에요.`); }}
            >
              <span className="is-day-name">{day.day}</span>
              <span className="is-day-number">{day.date}</span>
            </button>
          ))}
        </div>

        <div className="is-filter-row" role="group" aria-label="일정 출처 및 분류">
          {(["전체", "캘린더", "수업", "학교", "개인"] as ScheduleFilter[]).map((filter) => (
            <button
              type="button"
              key={filter}
              aria-pressed={activeFilter === filter}
              className={`is-filter${activeFilter === filter ? " active" : ""}`}
              onClick={() => { setActiveFilter(filter); flash(`${filter} 항목을 모아봤어요.`); }}
            >
              {filter !== "전체" && <span className="is-filter-dot" />}
              {filter}
            </button>
          ))}
        </div>

        {(activeFilter === "전체" || activeFilter === "캘린더") && (
          <section className="is-source-card" aria-label="Google Calendar 학교 일정 샘플">
            <span className="is-google-mark"><CalendarDays size={17} strokeWidth={1.8} /></span>
            <div className="is-source-copy">
              <span className="is-source-title">Google Calendar · 학교 일정</span>
              <span className="is-source-caption">{syncLabel} · 실제 계정 연결 아님</span>
            </div>
            <button type="button" className="is-sync" onClick={syncPreview} aria-label="샘플 일정 동기화 미리보기">
              <RefreshCw size={12} /><span>샘플 동기화</span>
            </button>
          </section>
        )}

        <section className="is-section" id="integrated-agenda" aria-label="학교 캘린더 일정">
          {(activeFilter === "전체" || activeFilter === "캘린더") && (
            <>
              <div className="is-section-head">
                <div>
                  <h2 className="is-section-title">학교 캘린더</h2>
                  <p className="is-section-sub">Google Calendar에서 가져온 샘플 일정</p>
                </div>
                <button type="button" className="is-more" onClick={() => flash("학교 캘린더 샘플 3개를 보고 있어요.")}>
                  3개 <ChevronDown size={13} />
                </button>
              </div>
              <div className="is-event-list">
                {visibleCalendarEvents.map((event) => (
                  <article key={event.time} className="is-event">
                    <time className="is-event-time">{event.time}</time>
                    <span className="is-event-marker" aria-hidden="true" />
                    <div className="is-event-body">
                      <p className="is-event-title">{event.title}<span className="is-event-label">학교</span></p>
                      <p className="is-event-note">{event.note}</p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          {activeFilter === "수업" && (
            <div className="is-section-head">
              <div><h2 className="is-section-title">내 수업 시간표</h2><p className="is-section-sub">캘린더 일정과 별도로 관리해요</p></div>
              <BookOpen size={17} color="#68816b" />
            </div>
          )}
          {activeFilter === "개인" && (
            <div className="is-section-head">
              <div><h2 className="is-section-title">나를 위한 일정</h2><p className="is-section-sub">학교 밖의 시간도 놓치지 않도록</p></div>
              <StickyNote size={17} color="#9b8060" />
            </div>
          )}
          {activeFilter === "학교" && (
            <div className="is-section-head">
              <div><h2 className="is-section-title">학교 할 일</h2><p className="is-section-sub">제출과 공부를 따로 챙겨요</p></div>
              <GraduationCap size={18} color="#a16e53" />
            </div>
          )}
        </section>

        {showTimetable && (
          <section className="is-section is-timetable" aria-label="내 수업 시간표">
            <div className="is-timetable-head">
              <div className="is-timetable-label"><GraduationCap size={15} /> 내 수업 시간표</div>
              <span className="is-class-tag">내가 등록한 수업</span>
            </div>
            <div className="is-class-row">
              {timetable.map((item) => (
                <div className="is-class" key={item.time}>
                  <span className="is-class-time">{item.time}</span>
                  <span className="is-class-name">{item.subject}</span>
                  <span className="is-class-room">{item.room}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {(activeFilter === "전체" || activeFilter === "개인") && (
          <section className="is-section" aria-label="개인 메모 미리보기">
            <button type="button" className="is-note-card" onClick={() => { setNoteDraft(note); setNoteOpen(true); }}>
              <span className="is-note-head">
                <span className="is-note-label"><StickyNote size={13} /> 나만 보는 메모</span>
                <span className="is-note-open"><ChevronRight size={15} /></span>
              </span>
              <span className="is-note-preview">{note || "오늘 기억해둘 일을 적어보세요."}</span>
            </button>
          </section>
        )}

        {activeFilter !== "캘린더" && activeFilter !== "수업" && (
          <section className="is-section" id="integrated-tasks" aria-label="학교 및 개인 할 일">
            <div className="is-section-head">
              <div>
                <h2 className="is-section-title">오늘 챙길 일</h2>
                <p className="is-section-sub">학교도, 나의 일도 한눈에</p>
              </div>
              <span style={{ color: "#899083", fontSize: 9, fontWeight: 700 }}>
                {visibleTasks.filter((task) => !task.done).length}개 남음
              </span>
            </div>
            <div className="is-task-list">
              {visibleTasks.map((task) => (
                <article className={`is-task${task.done ? " done" : ""}`} key={task.id}>
                  <button
                    type="button"
                    className={`is-check${task.done ? " checked" : ""}`}
                    aria-label={`${task.title} ${task.done ? "완료 취소" : "완료"}`}
                    aria-pressed={task.done}
                    onClick={() => toggleTask(task.id)}
                  >
                    {task.done && <Check size={14} strokeWidth={2.8} />}
                  </button>
                  <div className="is-task-content">
                    <span className="is-task-title">{task.title}</span>
                    <span className="is-task-detail">{task.detail}</span>
                  </div>
                  <span className={`is-task-category ${task.category === "학교" ? "school" : "personal"}`}>{task.category}</span>
                </article>
              ))}
            </div>
            <button type="button" className="is-add" onClick={() => setTaskOpen(true)}>
              <Plus size={14} /> 할 일 추가하기
            </button>
          </section>
        )}

        <aside className="is-section" style={{ display: "flex", alignItems: "center", gap: 8, padding: "1px 1px 0", color: "#8c9085", fontSize: 9 }}>
          <Clock3 size={12} />
          <span>수업 시간표와 가져온 학교 일정은 서로 다른 목록이에요.</span>
        </aside>
      </div>

      <nav className="is-bottom" aria-label="주요 메뉴">
        {[
          { label: "오늘", icon: <CalendarDays size={17} strokeWidth={1.9} /> },
          { label: "일정", icon: <Clock3 size={17} strokeWidth={1.9} /> },
          { label: "할 일", icon: <Check size={17} strokeWidth={2} /> },
          { label: "메모", icon: <FileText size={17} strokeWidth={1.8} /> },
        ].map((item) => (
          <button type="button" key={item.label} className={`is-nav${nav === item.label ? " active" : ""}`} onClick={() => chooseNav(item.label)}>
            <span className="is-nav-icon">{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>

      {notice && <div className="is-toast" role="status">{notice}</div>}

      {noteOpen && (
        <div className="is-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setNoteOpen(false); }}>
          <form className="is-modal" onSubmit={(event) => { event.preventDefault(); saveNote(); }}>
            <div className="is-modal-head">
              <h2 className="is-modal-title">나만 보는 메모</h2>
              <button type="button" className="is-close" aria-label="닫기" onClick={() => setNoteOpen(false)}><X size={17} /></button>
            </div>
            <textarea className="is-textarea" aria-label="메모 내용" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="기억해둘 일을 적어보세요" />
            <p className="is-modal-hint">이 메모는 이 화면 안에서만 저장되는 미리보기예요.</p>
            <button type="submit" className="is-modal-submit"><StickyNote size={14} /> 메모 저장하기</button>
          </form>
        </div>
      )}

      {taskOpen && (
        <div className="is-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setTaskOpen(false); }}>
          <form className="is-modal" onSubmit={(event) => { event.preventDefault(); addTask(); }}>
            <div className="is-modal-head">
              <h2 className="is-modal-title">새 할 일 담기</h2>
              <button type="button" className="is-close" aria-label="닫기" onClick={() => setTaskOpen(false)}><X size={17} /></button>
            </div>
            <input autoFocus className="is-input" aria-label="할 일 제목" value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="해야 할 일을 적어보세요" />
            <div className="is-category-toggle" role="group" aria-label="할 일 분류">
              {(["학교", "개인"] as TaskCategory[]).map((category) => (
                <button type="button" key={category} className={`is-category-choice${taskCategory === category ? " active" : ""}`} aria-pressed={taskCategory === category} onClick={() => setTaskCategory(category)}>
                  {category === "학교" ? "학교 업무" : "개인 업무"}
                </button>
              ))}
            </div>
            <button type="submit" className="is-modal-submit" disabled={!taskDraft.trim()}><Plus size={15} /> 오늘에 담기</button>
          </form>
        </div>
      )}
    </main>
  );
}
