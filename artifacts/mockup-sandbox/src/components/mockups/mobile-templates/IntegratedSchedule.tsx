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
          --paper:#edf1f8; --surface:#fffefa; --ink:#202b45; --muted:#69758c;
          --line:#dce2ec; --navy:#1E3A8A; --deep:#233067; --gold:#E3C588;
          position:relative; width:100%; min-height:100dvh; overflow-x:hidden; color:var(--ink);
          background:radial-gradient(ellipse at 92% 0%,rgba(227,197,136,.2),transparent 29%),linear-gradient(145deg,#eff3fa 0%,#f5f4ef 48%,#e9eef7 100%);
          font-family:'DM Sans','Noto Sans KR','Apple SD Gothic Neo',sans-serif; -webkit-font-smoothing:antialiased;
        }
        .is-shell { width:100%; max-width:430px; min-height:100dvh; margin:0 auto; padding:16px 20px calc(112px + env(safe-area-inset-bottom)); animation:is-enter .5s ease both; }
        @keyframes is-enter { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .is-topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
        .is-brand { display:flex; align-items:center; gap:10px; color:var(--deep); font-size:14px; font-weight:800; letter-spacing:-.055em; }
        .is-brand-copy { display:flex; flex-direction:column; gap:2px; }
        .is-brand-title { color:var(--deep); font-size:13px; line-height:1.2; }
        .is-brand-sub { color:#73809b; font-size:9px; font-weight:650; letter-spacing:.04em; }
        .is-brand-mark { display:block; width:43px; height:43px; flex:0 0 43px; object-fit:contain; border-radius:50%; background:#fffefa; box-shadow:0 2px 9px rgba(35,48,103,.12); }
        .is-profile { display:grid; place-items:center; width:40px; height:40px; padding:0; border:1px solid #dbe1eb; border-radius:50%; background:rgba(255,254,250,.8); color:var(--navy); cursor:pointer; }
        .is-profile:active { transform:scale(.94); }
        .is-eyebrow { margin:0 0 5px; color:#63718e; font-size:11px; font-weight:700; letter-spacing:.07em; }
        .is-heading { margin:0; color:var(--deep); font-size:26px; line-height:1.3; letter-spacing:-.075em; font-weight:800; }
        .is-hello { display:flex; align-items:flex-end; justify-content:space-between; }
        .is-weather { display:flex; align-items:center; gap:5px; padding:7px 10px; margin-bottom:2px; border:1px solid #e5d7b7; border-radius:12px; background:#f5eedf; color:#665638; font-size:10px; font-weight:700; white-space:nowrap; }
        .is-date-strip { display:flex; justify-content:space-between; gap:6px; margin:17px 0 14px; padding:5px; border:1px solid rgba(213,221,234,.9); border-radius:18px; background:rgba(255,254,250,.62); }
        .is-day { display:flex; flex:1; min-width:0; height:55px; flex-direction:column; align-items:center; justify-content:center; gap:3px; border:1px solid transparent; border-radius:13px; background:transparent; color:#71809a; font:inherit; cursor:pointer; transition:background .18s ease,transform .18s ease; }
        .is-day:active { transform:scale(.94); }
        .is-day-name { font-size:10px; font-weight:600; }
        .is-day-number { font-size:15px; font-weight:700; }
        .is-day.active { border-color:#d8bd7f; background:var(--deep); color:#fffdf7; box-shadow:0 4px 10px rgba(35,48,103,.15); }
        .is-day.active .is-day-name { color:#f0dba7; }
        .is-filter-row { display:flex; gap:7px; overflow:auto; margin:0 -2px 13px; padding:0 2px 2px; scrollbar-width:none; }
        .is-filter-row::-webkit-scrollbar { display:none; }
        .is-filter { display:flex; align-items:center; gap:5px; min-height:36px; padding:0 11px; border:1px solid #dfe4ed; border-radius:999px; background:rgba(255,254,250,.76); color:#69758c; font:inherit; font-size:10px; font-weight:700; white-space:nowrap; cursor:pointer; }
        .is-filter.active { border-color:var(--navy); background:var(--navy); color:#fff; }
        .is-filter-dot { width:6px; height:6px; border-radius:50%; background:#c09a4e; }
        .is-filter:nth-child(3) .is-filter-dot { background:#7189bd; }
        .is-filter:nth-child(4) .is-filter-dot { background:#b69b62; }
        .is-source-card { display:flex; align-items:center; gap:10px; min-height:63px; padding:10px 11px; margin-bottom:18px; border:1px solid #dfe4ec; border-radius:16px; background:rgba(255,254,250,.84); box-shadow:0 4px 14px rgba(35,48,103,.035); }
        .is-google-mark { display:grid; flex:0 0 34px; width:34px; height:34px; place-items:center; border-radius:11px; background:#edf0f6; color:var(--navy); }
        .is-source-copy { min-width:0; flex:1; }
        .is-source-title { display:block; color:var(--deep); font-size:11px; font-weight:750; letter-spacing:-.03em; }
        .is-source-caption { display:block; margin-top:3px; color:#7b8496; font-size:9px; letter-spacing:-.02em; }
        .is-sync { display:flex; align-items:center; justify-content:center; gap:5px; min-height:40px; padding:0 9px; border:1px solid #e4d4ad; border-radius:11px; background:#faf5e9; color:#665633; font:inherit; font-size:9px; font-weight:700; cursor:pointer; }
        .is-sync:active { background:#f1e5c9; }
        .is-sync-caption { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
        .is-section { margin-top:18px; scroll-margin-top:16px; }
        .is-section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .is-section-title { margin:0; color:var(--deep); font-size:16px; font-weight:800; letter-spacing:-.065em; }
        .is-section-sub { margin:3px 0 0; color:#78839a; font-size:9px; }
        .is-more { display:flex; align-items:center; gap:2px; padding:7px 0 7px 8px; border:0; background:transparent; color:#65718b; font:inherit; font-size:10px; cursor:pointer; }
        .is-event-list { position:relative; display:flex; flex-direction:column; gap:7px; }
        .is-event-list::before { position:absolute; top:10px; bottom:10px; left:43px; width:1px; background:#d8dfeb; content:""; }
        .is-event { position:relative; display:grid; grid-template-columns:37px 11px minmax(0,1fr); align-items:start; gap:7px; min-height:54px; }
        .is-event-time { padding-top:8px; color:#69758c; font-size:10px; font-variant-numeric:tabular-nums; font-weight:650; }
        .is-event-marker { z-index:1; width:9px; height:9px; margin:9px 0 0; border:2px solid #fffefa; border-radius:50%; background:var(--gold); box-shadow:0 0 0 1px #c6a65d; }
        .is-event-body { min-width:0; padding:7px 10px 8px; border:1px solid #e5e8ed; border-radius:12px; background:rgba(255,254,250,.88); }
        .is-event-title { display:flex; align-items:center; gap:6px; margin:0; color:#293653; font-size:11px; font-weight:700; letter-spacing:-.035em; }
        .is-event-note { margin:4px 0 0; color:#798399; font-size:9px; }
        .is-event-label { padding:2px 5px; border-radius:5px; background:#f4ead0; color:#745b25; font-size:8px; font-weight:700; white-space:nowrap; }
        .is-empty-filter { padding:15px; border:1px dashed #d5dce8; border-radius:14px; color:#6f7c94; font-size:11px; text-align:center; }
        .is-timetable { padding:13px 12px 11px; border:1px solid #d7dfef; border-radius:16px; background:#e4eaf5; }
        .is-timetable-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:11px; }
        .is-timetable-label { display:flex; align-items:center; gap:6px; color:var(--navy); font-size:11px; font-weight:750; }
        .is-class-tag { padding:4px 7px; border-radius:7px; background:#f3ead4; color:#725b2c; font-size:8px; font-weight:700; }
        .is-class-row { display:flex; gap:7px; overflow:auto; scrollbar-width:none; }
        .is-class-row::-webkit-scrollbar { display:none; }
        .is-class { display:flex; min-width:65px; flex:1; flex-direction:column; gap:5px; padding:8px 8px 7px; border:1px solid rgba(204,214,231,.95); border-radius:10px; background:rgba(255,254,250,.84); }
        .is-class-time { color:#7d88a0; font-size:8px; font-variant-numeric:tabular-nums; }
        .is-class-name { color:#2b3c6b; font-size:10px; font-weight:750; letter-spacing:-.04em; }
        .is-class-room { color:#7c8799; font-size:8px; }
        .is-timetable-note { margin:10px 1px 8px; color:#64718a; font-size:9px; line-height:1.5; }
        .is-timetable-connect { display:flex; width:100%; min-height:36px; align-items:center; gap:7px; padding:0 10px; border:1px solid #cbd5e5; border-radius:10px; background:rgba(255,254,250,.74); color:#34466f; font:inherit; font-size:9px; font-weight:700; text-align:left; cursor:pointer; transition:transform .18s ease, background .18s ease; }
        .is-timetable-connect:hover { transform:translateY(-1px); background:#fffefa; }
        .is-timetable-connect:focus-visible { outline:2px solid var(--navy); outline-offset:2px; }
        .is-connect-status { margin-left:auto; padding:4px 6px; border-radius:6px; background:#f3ead4; color:#725b2c; font-size:8px; font-weight:750; }
        .is-task-list { display:flex; flex-direction:column; gap:8px; }
        .is-task { display:flex; align-items:center; gap:10px; min-height:63px; padding:10px 11px; border:1px solid #e0e4eb; border-radius:15px; background:rgba(255,254,250,.88); transition:background .18s ease,transform .18s ease; }
        .is-task:active { transform:scale(.99); }
        .is-task.done { background:#edf0f5; }
        .is-check { display:grid; flex:0 0 25px; width:25px; height:25px; place-items:center; padding:0; border:1.5px solid #aeb9ce; border-radius:8px; background:transparent; color:#fff; cursor:pointer; }
        .is-check.checked { border-color:var(--navy); background:var(--navy); }
        .is-task-content { min-width:0; flex:1; }
        .is-task-title { display:block; overflow:hidden; color:#293653; font-size:11px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }
        .is-task.done .is-task-title { color:#7d8798; text-decoration:line-through; }
        .is-task-detail { display:block; margin-top:4px; color:#7b8495; font-size:9px; }
        .is-task-category { padding:4px 7px; border-radius:7px; font-size:8px; font-weight:750; white-space:nowrap; }
        .is-task-category.school { background:#f4ead2; color:#735b2b; }
        .is-task-category.personal { background:#e8edf5; color:#3e527d; }
        .is-add { display:flex; width:100%; align-items:center; justify-content:center; gap:6px; min-height:44px; margin-top:9px; border:1px dashed #9aa9ca; border-radius:13px; background:rgba(255,254,250,.42); color:var(--navy); font:inherit; font-size:10px; font-weight:750; cursor:pointer; }
        .is-add:active { background:#e4eaf5; }
        .is-note-card { position:relative; display:block; width:100%; padding:14px 14px 13px; overflow:hidden; border:1px solid #e5d8b9; border-radius:15px; background:#f4eddd; color:#5e512f; text-align:left; cursor:pointer; }
        .is-note-card::after { position:absolute; top:-29px; right:-7px; width:88px; height:88px; border:1px solid rgba(164,139,103,.19); border-radius:50%; content:""; }
        .is-note-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:7px; }
        .is-note-label { display:flex; align-items:center; gap:6px; color:#6b5629; font-size:10px; font-weight:750; }
        .is-note-open { display:grid; place-items:center; width:28px; height:28px; border-radius:8px; background:#e9ddbf; color:#6b5629; }
        .is-note-preview { display:-webkit-box; overflow:hidden; margin:0; color:#625a48; font-size:10px; line-height:1.55; letter-spacing:-.025em; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
        .is-bottom { position:fixed; z-index:5; right:0; bottom:0; left:0; display:flex; justify-content:space-around; width:min(100%,430px); margin:0 auto; padding:9px 14px calc(10px + env(safe-area-inset-bottom)); border-top:1px solid rgba(214,221,233,.96); background:rgba(248,249,251,.97); backdrop-filter:blur(16px); }
        .is-nav { display:flex; min-width:61px; min-height:50px; flex-direction:column; align-items:center; justify-content:center; gap:3px; border:0; background:transparent; color:#7c879b; font:inherit; font-size:9px; font-weight:600; cursor:pointer; }
        .is-nav-icon { display:grid; width:35px; height:28px; place-items:center; border-radius:10px; }
        .is-nav.active { color:var(--navy); font-weight:750; }
        .is-nav.active .is-nav-icon { background:#e4eaf5; color:var(--navy); box-shadow:inset 0 -2px 0 var(--gold); }
        .is-nav:active .is-nav-icon { transform:scale(.92); }
        .is-toast { position:fixed; z-index:12; right:20px; bottom:calc(81px + env(safe-area-inset-bottom)); left:20px; width:fit-content; max-width:calc(100% - 40px); margin:auto; padding:11px 15px; border:1px solid rgba(227,197,136,.6); border-radius:999px; background:var(--deep); color:#fffdf7; font-size:10px; font-weight:650; box-shadow:0 8px 20px rgba(35,48,103,.16); animation:is-fade .2s ease both; }
        @keyframes is-fade { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        .is-modal-backdrop { position:fixed; z-index:10; inset:0; display:flex; align-items:flex-end; justify-content:center; padding:14px; background:rgba(27,38,71,.3); animation:is-fade .18s ease both; }
        .is-modal { width:min(100%,410px); padding:19px 18px 18px; border:1px solid rgba(224,226,231,.9); border-radius:22px 22px 18px 18px; background:#fffefa; box-shadow:0 15px 55px rgba(35,48,103,.2); animation:is-sheet .22s ease both; }
        @keyframes is-sheet { from { opacity:.6; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }
        .is-modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:13px; }
        .is-modal-title { margin:0; color:var(--deep); font-size:15px; font-weight:750; letter-spacing:-.055em; }
        .is-close { display:grid; width:36px; height:36px; place-items:center; border:0; border-radius:50%; background:#e9edf4; color:var(--navy); cursor:pointer; }
        .is-textarea, .is-input { display:block; width:100%; border:1px solid #d9dfeb; border-radius:13px; outline:none; background:#f6f7f9; color:#293653; font:inherit; font-size:12px; }
        .is-textarea { min-height:116px; padding:12px 13px; line-height:1.65; resize:vertical; }
        .is-input { height:46px; padding:0 13px; }
        .is-textarea:focus, .is-input:focus { border-color:var(--navy); box-shadow:0 0 0 3px rgba(30,58,138,.14); }
        .is-modal-hint { margin:8px 0 0; color:#778197; font-size:9px; }
        .is-modal-submit { display:flex; width:100%; min-height:46px; align-items:center; justify-content:center; gap:6px; margin-top:12px; border:0; border-radius:12px; background:var(--navy); color:#fffdf7; font:inherit; font-size:12px; font-weight:750; cursor:pointer; }
        .is-modal-submit:disabled { opacity:.55; cursor:not-allowed; }
        .is-category-toggle { display:flex; gap:7px; margin-top:10px; }
        .is-category-choice { flex:1; min-height:42px; border:1px solid #dfe3eb; border-radius:11px; background:#f6f7f9; color:#69758c; font:inherit; font-size:10px; font-weight:700; cursor:pointer; }
        .is-category-choice.active { border-color:#c7ad71; background:#f5eedf; color:#5e4c23; }
        .is-root button:focus-visible { outline:3px solid rgba(30,58,138,.35); outline-offset:2px; }
        @media (min-width:600px) { .is-shell { padding-top:25px; } }
        @media (prefers-reduced-motion: reduce) { .is-root *, .is-root *::before, .is-root *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; scroll-behavior:auto !important; } }
      `}</style>

      <div className="is-shell">
        <header>
          <div className="is-topbar">
            <div className="is-brand">
              <img className="is-brand-mark" src="/__mockup/images/kmla-emblem.png" alt="민족사관고등학교 촛불 교표" />
              <span className="is-brand-copy">
                <span className="is-brand-title">민사고 김태완</span>
                <span className="is-brand-sub">MINJOK LEADERSHIP ACADEMY</span>
              </span>
            </div>
            <button type="button" className="is-profile" aria-label="프로필 알림" onClick={() => flash("학교와 나의 하루를 차분히 살펴봐요.")}>
              <UserRound size={17} strokeWidth={1.7} />
            </button>
          </div>
          <div className="is-hello">
            <div>
              <p className="is-eyebrow">10월 {selectedDay.date}일 {selectedDay.day}요일</p>
              <h1 className="is-heading">오늘의 일정</h1>
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
              <span className="is-class-tag">샘플 시간표</span>
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
            <p className="is-timetable-note">실제 수업은 기존 시간표 웹앱 연결 후 불러올 예정이에요.</p>
            <button
              type="button"
              className="is-timetable-connect"
              onClick={() => flash("기존 수업 시간표 웹앱은 다음 단계에서 연결할게요.")}
              aria-label="기존 수업 시간표 웹앱 연결은 추후 진행"
            >
              <BookOpen size={13} />
              <span>기존 수업 시간표 웹앱</span>
              <span className="is-connect-status">추후 연결</span>
            </button>
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
