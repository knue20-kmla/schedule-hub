import { useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Plus,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";

type PlannerTask = {
  id: number;
  title: string;
  time: string;
  category: string;
  tone: "coral" | "sage" | "blue";
  done: boolean;
};

const initialTasks: PlannerTask[] = [
  {
    id: 1,
    title: "주간 기획안 핵심 정리하기",
    time: "오전 10:00",
    category: "일",
    tone: "coral",
    done: false,
  },
  {
    id: 2,
    title: "민지에게 점심 약속 답장",
    time: "오전 11:30",
    category: "사람",
    tone: "sage",
    done: true,
  },
  {
    id: 3,
    title: "산책하며 팟캐스트 듣기",
    time: "오후 6:30",
    category: "나를 위해",
    tone: "blue",
    done: false,
  },
];

export function Productivity() {
  const [tasks, setTasks] = useState(initialTasks);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [activeTab, setActiveTab] = useState("오늘");
  const [notice, setNotice] = useState("");

  const completedCount = tasks.filter((task) => task.done).length;
  const completion = tasks.length ? (completedCount / tasks.length) * 100 : 0;

  function toggleTask(id: number) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
    setNotice("잘하고 있어요. 한 걸음씩이면 충분해요.");
    window.setTimeout(() => setNotice(""), 2200);
  }

  function addTask() {
    const title = draft.trim();
    if (!title) return;
    setTasks((current) => [
      ...current,
      {
        id: Date.now(),
        title,
        time: "시간 미정",
        category: "오늘",
        tone: "sage",
        done: false,
      },
    ]);
    setDraft("");
    setIsAdding(false);
    setNotice("오늘 할 일에 담았어요.");
    window.setTimeout(() => setNotice(""), 2200);
  }

  function selectTab(tab: string) {
    setActiveTab(tab);
    if (tab !== "오늘") {
      setNotice(`${tab} 화면은 준비 중이에요.`);
      window.setTimeout(() => setNotice(""), 2200);
    } else {
      setNotice("");
    }
  }

  return (
    <main className="planner-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');
        .planner-shell, .planner-shell * { box-sizing: border-box; }
        .planner-shell {
          --paper: #f4f3eb;
          --ink: #202c2a;
          --muted: #858c83;
          --line: #e5e6dc;
          --leaf: #3f6654;
          position: relative;
          width: 100%;
          min-height: 100dvh;
          overflow-x: hidden;
          background: var(--paper);
          color: var(--ink);
          font-family: 'DM Sans', 'Noto Sans KR', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .planner-scroll {
          width: 100%;
          max-width: 430px;
          min-height: 100dvh;
          margin: 0 auto;
          padding: 22px 22px 112px;
          animation: planner-arrive .55s ease both;
        }
        @keyframes planner-arrive {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .planner-topline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 34px;
        }
        .planner-brand {
          display: flex;
          gap: 8px;
          align-items: center;
          color: #466a58;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -.04em;
        }
        .planner-brand-mark {
          display: grid;
          width: 27px;
          height: 27px;
          place-items: center;
          border-radius: 9px;
          background: #d9e4d7;
        }
        .planner-avatar {
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border: 1px solid #e4e5da;
          border-radius: 50%;
          background: #fbfaf4;
          color: #68796c;
        }
        .planner-date {
          margin: 0 0 9px;
          color: #748176;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .1em;
        }
        .planner-heading {
          margin: 0;
          font-size: 29px;
          line-height: 1.36;
          letter-spacing: -.075em;
          font-weight: 700;
        }
        .planner-heading em {
          color: #55735f;
          font-style: normal;
        }
        .planner-subtitle {
          margin: 8px 0 0;
          color: #777e75;
          font-size: 13px;
          letter-spacing: -.04em;
        }
        .planner-progress-card {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 127px;
          margin: 25px 0 31px;
          padding: 19px 18px 17px;
          overflow: hidden;
          border-radius: 20px;
          background: #e4ebe0;
        }
        .planner-progress-card::after {
          position: absolute;
          top: -48px;
          right: 21px;
          width: 132px;
          height: 132px;
          border: 1px solid rgba(76, 111, 87, .12);
          border-radius: 50%;
          content: "";
        }
        .planner-progress-copy { position: relative; z-index: 1; }
        .planner-progress-kicker {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 11px;
          color: #526c58;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .02em;
        }
        .planner-progress-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -.06em;
        }
        .planner-progress-caption {
          margin: 6px 0 0;
          color: #758477;
          font-size: 11px;
          letter-spacing: -.025em;
        }
        .planner-ring {
          position: relative;
          z-index: 1;
          display: grid;
          width: 72px;
          height: 72px;
          flex: 0 0 72px;
          place-items: center;
          border-radius: 50%;
          background: conic-gradient(#55755e var(--progress), #d0ddce 0);
        }
        .planner-ring::before {
          position: absolute;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #e4ebe0;
          content: "";
        }
        .planner-ring-label {
          position: relative;
          font-size: 15px;
          font-weight: 700;
          color: #405f49;
        }
        .planner-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 13px;
        }
        .planner-section-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -.06em;
        }
        .planner-count {
          padding: 5px 9px;
          border-radius: 999px;
          background: #ebece2;
          color: #70796f;
          font-size: 10px;
          font-weight: 700;
        }
        .planner-task-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .planner-task {
          display: flex;
          align-items: center;
          min-height: 75px;
          padding: 13px 13px 13px 14px;
          border: 1px solid #e7e7de;
          border-radius: 16px;
          background: rgba(255, 255, 251, .74);
          transition: transform .2s ease, background .2s ease, opacity .2s ease;
        }
        .planner-task:active { transform: scale(.985); }
        .planner-task.is-done { background: #f0f1e9; }
        .planner-check {
          display: grid;
          width: 23px;
          height: 23px;
          flex: 0 0 23px;
          place-items: center;
          margin-right: 12px;
          padding: 0;
          border: 1.5px solid #c9cec2;
          border-radius: 8px;
          background: transparent;
          color: white;
          cursor: pointer;
          transition: transform .2s ease, background .2s ease, border-color .2s ease;
        }
        .planner-check:active { transform: scale(.88); }
        .planner-check.is-checked { border-color: #52745b; background: #52745b; }
        .planner-task-main { min-width: 0; flex: 1; }
        .planner-task-name {
          display: block;
          overflow: hidden;
          color: #313a34;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -.045em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .planner-task.is-done .planner-task-name {
          color: #959a90;
          text-decoration: line-through;
          text-decoration-color: #aeb5a9;
        }
        .planner-task-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 7px;
          color: #8a9085;
          font-size: 10px;
        }
        .planner-task-meta svg { color: #a1a699; }
        .planner-tag {
          padding: 3px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: -.02em;
        }
        .planner-tag.coral { color: #9d644e; background: #f4e4d8; }
        .planner-tag.sage { color: #57745e; background: #e4ecdf; }
        .planner-tag.blue { color: #64748a; background: #e4eaf0; }
        .planner-priority {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px 7px;
          border-radius: 8px;
          background: #f6e4d9;
          color: #a55e43;
          font-size: 9px;
          font-weight: 700;
        }
        .planner-add {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 49px;
          margin-top: 13px;
          border: 1px dashed #b9c5b6;
          border-radius: 15px;
          background: transparent;
          color: #526d58;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: -.025em;
          cursor: pointer;
          transition: background .2s ease, border-color .2s ease;
        }
        .planner-add:active { background: #e8ede4; }
        .planner-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 23px;
          padding: 14px 14px;
          border-radius: 14px;
          background: #f0eadd;
          color: #776c5b;
        }
        .planner-note-icon {
          display: grid;
          width: 24px;
          height: 24px;
          flex: 0 0 24px;
          place-items: center;
          border-radius: 8px;
          background: #e5d9c5;
          color: #987856;
        }
        .planner-note p {
          margin: 2px 0 0;
          font-size: 11px;
          line-height: 1.55;
          letter-spacing: -.03em;
        }
        .planner-bottom-nav {
          position: fixed;
          z-index: 5;
          right: 0;
          bottom: 0;
          left: 0;
          display: flex;
          justify-content: space-around;
          width: min(100%, 430px);
          margin: 0 auto;
          padding: 11px 20px calc(12px + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(220, 222, 212, .9);
          background: rgba(248, 247, 239, .96);
          backdrop-filter: blur(16px);
        }
        .planner-nav-item {
          display: flex;
          min-width: 60px;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          border: 0;
          background: none;
          color: #9a9e94;
          font: inherit;
          font-size: 10px;
          letter-spacing: -.03em;
          cursor: pointer;
        }
        .planner-nav-item.active { color: #4f7058; font-weight: 700; }
        .planner-nav-icon {
          display: grid;
          width: 34px;
          height: 28px;
          place-items: center;
          border-radius: 10px;
          transition: background .2s ease, transform .2s ease;
        }
        .planner-nav-item.active .planner-nav-icon { background: #e4ebe0; }
        .planner-nav-item:active .planner-nav-icon { transform: scale(.92); }
        .planner-composer-backdrop {
          position: fixed;
          z-index: 8;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 16px;
          background: rgba(29, 39, 34, .25);
          animation: planner-fade .18s ease both;
        }
        @keyframes planner-fade { from { opacity: 0; } to { opacity: 1; } }
        .planner-composer {
          width: min(100%, 390px);
          padding: 21px 20px 20px;
          border-radius: 22px;
          background: #fbfaf4;
          box-shadow: 0 14px 50px rgba(37, 49, 40, .16);
          animation: planner-sheet .22s ease both;
        }
        @keyframes planner-sheet {
          from { opacity: .6; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .planner-composer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .planner-composer-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -.05em;
        }
        .planner-close {
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: #eff0e8;
          color: #71786d;
          font-size: 18px;
          cursor: pointer;
        }
        .planner-input {
          width: 100%;
          height: 49px;
          padding: 0 14px;
          border: 1px solid #dfe3d8;
          border-radius: 12px;
          outline: none;
          background: #f5f5ee;
          color: #2d3830;
          font: inherit;
          font-size: 13px;
        }
        .planner-input:focus { border-color: #91a992; box-shadow: 0 0 0 3px #e7ede3; }
        .planner-input::placeholder { color: #a0a49a; }
        .planner-submit {
          display: flex;
          width: 100%;
          height: 46px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 11px;
          border: 0;
          border-radius: 12px;
          background: #496a53;
          color: #f8f8ef;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .planner-submit:active { background: #3d5c47; }
        .planner-toast {
          position: fixed;
          z-index: 7;
          right: 20px;
          bottom: 91px;
          left: 20px;
          width: fit-content;
          max-width: calc(100% - 40px);
          margin: auto;
          padding: 11px 15px;
          border-radius: 999px;
          background: #34493b;
          color: #f3f4eb;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 7px 20px rgba(35, 51, 39, .16);
          animation: planner-fade .2s ease both;
        }
        @media (min-width: 600px) {
          .planner-scroll { padding-top: 28px; }
        }
      `}</style>

      <div className="planner-scroll">
        <header>
          <div className="planner-topline">
            <div className="planner-brand">
              <span className="planner-brand-mark"><Sparkles size={15} strokeWidth={1.8} /></span>
              하루결
            </div>
            <button
              type="button"
              aria-label="내 프로필"
              className="planner-avatar"
              onClick={() => {
                setNotice("오늘도 나를 잘 챙기고 있어요.");
                window.setTimeout(() => setNotice(""), 2200);
              }}
            >
              <UserRound size={17} strokeWidth={1.7} />
            </button>
          </div>

          <p className="planner-date">11월 6일 목요일 <span aria-hidden="true">·</span> 맑음</p>
          <h1 className="planner-heading">좋은 아침이에요,<br /><em>오늘도 천천히</em> 시작해요</h1>
          <p className="planner-subtitle">오늘은 이만큼이면 충분해요.</p>
        </header>

        <section className="planner-progress-card" aria-label="오늘의 진행 상황">
          <div className="planner-progress-copy">
            <p className="planner-progress-kicker"><Target size={13} /> 오늘의 리듬</p>
            <p className="planner-progress-title">{completedCount}개 완료했어요</p>
            <p className="planner-progress-caption">하나씩 해내는 중, 아주 좋아요</p>
          </div>
          <div
            className="planner-ring"
            style={{ "--progress": `${completion}%` } as CSSProperties}
            aria-label={`${Math.round(completion)}% 완료`}
          >
            <span className="planner-ring-label">{Math.round(completion)}%</span>
          </div>
        </section>

        <section aria-label="오늘의 할 일">
          <div className="planner-section-head">
            <h2 className="planner-section-title">오늘 할 일</h2>
            <span className="planner-count">{tasks.length - completedCount}개 남았어요</span>
          </div>

          <div className="planner-task-list">
            {tasks.map((task, index) => (
              <article
                key={task.id}
                className={`planner-task${task.done ? " is-done" : ""}`}
                style={{ animation: `planner-arrive .4s ease ${index * 60}ms both` }}
              >
                <button
                  type="button"
                  className={`planner-check${task.done ? " is-checked" : ""}`}
                  aria-label={task.done ? `${task.title} 완료 취소` : `${task.title} 완료`}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.done ? <Check size={14} strokeWidth={2.7} /> : null}
                </button>
                <div className="planner-task-main">
                  <span className="planner-task-name">{task.title}</span>
                  <div className="planner-task-meta">
                    <Clock3 size={11} />
                    <span>{task.time}</span>
                    <span className={`planner-tag ${task.tone}`}>{task.category}</span>
                  </div>
                </div>
                {task.id === 1 && !task.done ? (
                  <span className="planner-priority">먼저 <ArrowRight size={10} /></span>
                ) : (
                  <ChevronRight size={16} color="#b2b7ac" />
                )}
              </article>
            ))}
          </div>

          <button type="button" className="planner-add" onClick={() => setIsAdding(true)}>
            <Plus size={16} strokeWidth={2.3} />
            오늘 할 일 추가하기
          </button>
        </section>

        <aside className="planner-note">
          <span className="planner-note-icon"><Sparkles size={13} /></span>
          <p>모든 걸 다 해내지 않아도 괜찮아요.<br />오늘의 나에게 중요한 것부터 해봐요.</p>
        </aside>
      </div>

      <nav className="planner-bottom-nav" aria-label="주요 메뉴">
        {[
          { label: "오늘", icon: <Circle size={18} strokeWidth={2.2} /> },
          { label: "일정", icon: <Clock3 size={18} strokeWidth={1.8} /> },
          { label: "기록", icon: <Check size={18} strokeWidth={1.8} /> },
          { label: "마이", icon: <UserRound size={18} strokeWidth={1.8} /> },
        ].map((item) => (
          <button
            type="button"
            key={item.label}
            className={`planner-nav-item${activeTab === item.label ? " active" : ""}`}
            onClick={() => selectTab(item.label)}
          >
            <span className="planner-nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {notice && <div className="planner-toast" role="status">{notice}</div>}

      {isAdding && (
        <div
          className="planner-composer-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsAdding(false);
          }}
        >
          <form
            className="planner-composer"
            onSubmit={(event) => {
              event.preventDefault();
              addTask();
            }}
          >
            <div className="planner-composer-top">
              <h2 className="planner-composer-title">오늘의 작은 약속</h2>
              <button type="button" className="planner-close" aria-label="닫기" onClick={() => setIsAdding(false)}>×</button>
            </div>
            <input
              autoFocus
              className="planner-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="오늘 하고 싶은 일을 적어보세요"
              aria-label="새 할 일"
            />
            <button type="submit" className="planner-submit" disabled={!draft.trim()}>
              <Plus size={16} /> 오늘에 담기
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
