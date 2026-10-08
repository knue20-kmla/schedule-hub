import { useState } from "react";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Heart,
  Home,
  LocateFixed,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  UserRound,
} from "lucide-react";

const categories = ["전체", "피부관리", "마사지", "네일", "헤어", "필라테스"];
const times = ["오늘 18:30", "오늘 19:00", "내일 11:00"];

export function Booking() {
  const [category, setCategory] = useState("전체");
  const [saved, setSaved] = useState(false);
  const [selectedTime, setSelectedTime] = useState(times[0]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("홈");
  const [notice, setNotice] = useState("");

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <div className="booking-shell">
      <style>{`
        .booking-shell {
          --ink: #253a35;
          --muted: #7d8981;
          --line: #e7e9df;
          --paper: #fbfaf5;
          --leaf: #436c5b;
          --leaf-dark: #315344;
          --sun: #f4c773;
          min-height: 100dvh;
          width: 100%;
          background: var(--paper);
          color: var(--ink);
          font-family: "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif;
          letter-spacing: -0.035em;
          overflow: hidden;
        }
        .booking-scroll {
          height: 100dvh;
          overflow-y: auto;
          scrollbar-width: none;
          padding-bottom: 96px;
        }
        .booking-scroll::-webkit-scrollbar { display: none; }
        .booking-button { border: 0; font: inherit; cursor: pointer; color: inherit; }
        .booking-button:active { transform: scale(.98); }
        .booking-button, .booking-button * { transition: transform .18s ease, background-color .18s ease, color .18s ease, border-color .18s ease, opacity .18s ease; }
        .booking-nav {
          position: fixed;
          z-index: 10;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(251,250,245,.94);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(225,229,217,.9);
          padding: 11px 18px max(12px, env(safe-area-inset-bottom));
        }
        @keyframes booking-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .booking-enter { animation: booking-rise .48s both; }
      `}</style>

      <div className="booking-scroll">
        <header style={{ padding: "20px 22px 0", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              className="booking-button"
              onClick={() => setLocationOpen(!locationOpen)}
              aria-expanded={locationOpen}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", padding: 0 }}
            >
              <MapPin size={16} strokeWidth={2.3} color="#547765" />
              <span style={{ fontSize: 13, fontWeight: 650 }}>서울 마포구</span>
              <ChevronDown size={15} color="#78847a" />
            </button>
            <button
              className="booking-button"
              onClick={() => flash("새로운 소식이 없어요")}
              aria-label="알림"
              style={{ width: 36, height: 36, borderRadius: 50, border: "1px solid #e6e8df", background: "#fff", display: "grid", placeItems: "center", position: "relative" }}
            >
              <span style={{ position: "absolute", right: 8, top: 7, width: 6, height: 6, borderRadius: 10, background: "#e58362" }} />
              <CalendarDays size={16} color="#40574c" />
            </button>
          </div>
          {locationOpen && (
            <div style={{ position: "absolute", zIndex: 5, top: 62, left: 20, width: 220, borderRadius: 16, background: "#fff", padding: 14, boxShadow: "0 12px 35px #293d3020", border: "1px solid #eeefe9" }}>
              <div style={{ fontSize: 11, color: "#8b958c", marginBottom: 8 }}>내 주변 동네</div>
              {["서울 마포구", "서울 서대문구", "서울 용산구"].map((place) => (
                <button key={place} className="booking-button" onClick={() => { setLocationOpen(false); flash(`${place}로 위치를 바꿨어요`); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "transparent", padding: "9px 0", fontSize: 13, fontWeight: 600 }}>
                  {place}{place === "서울 마포구" && <Check size={14} color="#47745f" />}
                </button>
              ))}
            </div>
          )}
        </header>

        <main style={{ padding: "12px 20px 0" }}>
          <section className="booking-enter" style={{ animationDelay: "30ms" }}>
            <p style={{ margin: 0, color: "#8a938a", fontSize: 12, fontWeight: 550 }}>오늘은 나를 돌보는 시간</p>
            <h1 style={{ margin: "5px 0 13px", fontSize: 25, lineHeight: 1.22, letterSpacing: "-.065em", fontWeight: 760 }}>
              가까운 곳에서<br />기분 좋은 쉼을 찾아요
            </h1>
          </section>

          <form
            onSubmit={(event) => { event.preventDefault(); flash(search ? `‘${search}’ 주변을 찾아볼게요` : "원하는 서비스를 검색해 보세요"); }}
            style={{ display: "flex", alignItems: "center", height: 52, padding: "0 9px 0 15px", borderRadius: 15, background: "#fff", border: "1px solid #e8e9e0", boxShadow: "0 3px 12px #3a51420a" }}
          >
            <Search size={18} color="#627a6c" />
            <input
              aria-label="서비스나 업체 검색"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="어떤 케어를 찾으세요?"
              style={{ border: 0, outline: 0, flex: 1, minWidth: 0, background: "transparent", marginLeft: 10, fontSize: 13, color: "#263a33", fontFamily: "inherit" }}
            />
            <button type="button" className="booking-button" onClick={() => setFilterOpen(!filterOpen)} aria-label="검색 필터" style={{ display: "grid", placeItems: "center", width: 35, height: 35, borderRadius: 11, background: filterOpen ? "#edf2ec" : "#f6f6f1", color: "#587363" }}>
              <SlidersHorizontal size={16} />
            </button>
          </form>
          {filterOpen && (
            <div style={{ marginTop: 8, padding: "11px 13px", borderRadius: 13, background: "#eef2eb", color: "#506c5c", fontSize: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <LocateFixed size={14} /> 내 위치에서 가까운 순 <span style={{ marginLeft: "auto", fontWeight: 650 }}>2km 이내</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", padding: "12px 0 16px", marginRight: -20 }}>
            {categories.map((item) => {
              const active = item === category;
              return (
                <button
                  key={item}
                  className="booking-button"
                  onClick={() => { setCategory(item); if (item !== "전체") flash(`${item} 추천을 모아봤어요`); }}
                  style={{ flex: "0 0 auto", borderRadius: 999, padding: "9px 14px", fontSize: 12, fontWeight: active ? 700 : 550, background: active ? "#496e5d" : "#fff", color: active ? "#fff" : "#66746b", border: active ? "1px solid #496e5d" : "1px solid #e9eae2" }}
                >{item}</button>
              );
            })}
          </div>

          <section className="booking-enter" style={{ animationDelay: "100ms" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: ".12em", color: "#9a8870", fontWeight: 750, marginBottom: 4 }}>NEAR YOU · 오늘 예약 가능</div>
                <h2 style={{ fontSize: 18, margin: 0, fontWeight: 760, letterSpacing: "-.05em" }}>지금 가기 좋은 곳</h2>
              </div>
              <button className="booking-button" onClick={() => flash("가까운 업체를 더 보여드릴게요")} style={{ display: "flex", alignItems: "center", gap: 3, padding: "6px 0 6px 8px", background: "transparent", color: "#718077", fontSize: 11, fontWeight: 600 }}>
                더 보기 <ArrowRight size={14} />
              </button>
            </div>

            <article style={{ background: "#fff", border: "1px solid #e8e9e0", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 22px #334a3d0b" }}>
              <div style={{ height: 135, position: "relative", overflow: "hidden", background: "#e9e8d9" }}>
                <img src="/__mockup/images/booking-studio.jpg" alt="햇살이 드는 온결 스킨케어 스튜디오" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 48%", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(26,43,34,.2),transparent 54%)" }} />
                <span style={{ position: "absolute", left: 13, bottom: 12, padding: "6px 9px", borderRadius: 8, background: "rgba(255,255,255,.94)", color: "#426451", fontSize: 10, fontWeight: 730, letterSpacing: "-.02em" }}>오늘 예약 가능</span>
                <button className="booking-button" onClick={() => { setSaved(!saved); flash(saved ? "관심 목록에서 뺐어요" : "관심 목록에 저장했어요"); }} aria-label={saved ? "저장 취소" : "관심 업체 저장"} style={{ position: "absolute", right: 12, top: 12, width: 34, height: 34, borderRadius: 50, border: "1px solid #ffffff80", background: "rgba(255,255,255,.92)", display: "grid", placeItems: "center", color: saved ? "#d27360" : "#4d6054" }}>
                  <Heart size={17} fill={saved ? "#d27360" : "none"} />
                </button>
              </div>
              <div style={{ padding: "11px 14px 12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 750, letterSpacing: "-.045em" }}>온결 스킨케어</h3>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#648371", background: "#edf3ed", padding: "3px 5px", borderRadius: 5 }}>검증된 업체</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#818b82" }}>망원동 · 도보 7분 · 1.2km</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, paddingTop: 3, whiteSpace: "nowrap" }}>
                    <Star size={13} fill="#e7ab4d" color="#e7ab4d" />
                    <strong style={{ fontSize: 12 }}>4.9</strong>
                    <span style={{ fontSize: 10, color: "#92988f" }}>(128)</span>
                  </div>
                </div>
                <div style={{ height: 1, background: "#eff0e9", margin: "11px 0 10px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 650 }}>수분 진정 페이셜</div>
                    <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#858e84" }}><Clock3 size={11} /> 50분 <span style={{ color: "#c6c9bf" }}>·</span> 첫 방문</div>
                  </div>
                  <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 10, color: "#a0a398", textDecoration: "line-through", marginRight: 5 }}>75,000원</span>
                    <strong style={{ fontSize: 14, color: "#355847" }}>59,000원</strong>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section style={{ marginTop: 11, padding: "10px 13px 10px", borderRadius: 17, background: "#f0f2e9", border: "1px solid #e8ecdf" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Clock3 size={14} color="#557963" />
              <span style={{ fontSize: 12, fontWeight: 720 }}>가장 빠른 예약</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#7d8a7e" }}>잔여 자리</span>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {times.map((time, index) => (
                <button key={time} className="booking-button" onClick={() => setSelectedTime(time)} style={{ flex: 1, minWidth: 0, padding: "7px 4px 6px", borderRadius: 11, background: selectedTime === time ? "#496e5d" : "#fff", border: selectedTime === time ? "1px solid #496e5d" : "1px solid #e5e9df", color: selectedTime === time ? "#fff" : "#506257", fontSize: 10, fontWeight: 700, lineHeight: 1.25 }}>
                  {time}<span style={{ display: "block", marginTop: 4, fontSize: 9, fontWeight: 500, opacity: .76 }}>{index === 0 ? "1자리" : index === 1 ? "2자리" : "3자리"}</span>
                </button>
              ))}
            </div>
          </section>

          <button className="booking-button" onClick={() => flash(`${selectedTime} · 온결 스킨케어 예약을 시작해요`)} style={{ width: "100%", height: 49, marginTop: 11, borderRadius: 14, background: "#385c4a", color: "#fff", fontSize: 14, fontWeight: 720, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 6px 13px #34594425" }}>
            {selectedTime} 예약하기 <ArrowRight size={16} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "12px 2px 5px", color: "#838e83", fontSize: 10 }}>
            <Check size={13} color="#6d8b74" /> 예약금 없이 간편하게 · 방문 전 무료 취소
          </div>

          <section style={{ marginTop: 20, paddingBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 16, letterSpacing: "-.045em" }}>동네에서 사랑받는 곳</h2>
              <span style={{ fontSize: 10, color: "#8d968c" }}>이번 주 인기</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, background: "#fff", border: "1px solid #e9ebe3" }}>
              <div style={{ width: 54, height: 54, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 13, background: "#e9efe4", color: "#587a61" }}><Bookmark size={22} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>무무 바디밸런스</div>
                <div style={{ marginTop: 4, fontSize: 10, color: "#818b82", display: "flex", alignItems: "center", gap: 3 }}>합정동 · 마사지 · <Star size={10} fill="#e4a84c" color="#e4a84c" />4.8</div>
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}><div style={{ color: "#42624f", fontSize: 11, fontWeight: 700 }}>오늘 20:00</div><div style={{ marginTop: 3, fontSize: 10, color: "#8c948a" }}>65,000원부터</div></div>
            </div>
          </section>
        </main>
      </div>

      <nav className="booking-nav" aria-label="주요 메뉴">
        <div style={{ maxWidth: 430, margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
          {[
            { label: "홈", Icon: Home },
            { label: "예약", Icon: CalendarDays },
            { label: "저장", Icon: Bookmark },
            { label: "마이", Icon: UserRound },
          ].map(({ label, Icon }) => {
            const active = activeTab === label;
            return (
              <button key={label} className="booking-button" onClick={() => { setActiveTab(label); if (label !== "홈") flash(`${label} 메뉴를 준비했어요`); }} style={{ minWidth: 54, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "1px 5px", background: "transparent", color: active ? "#3e6852" : "#969d94", fontSize: 9, fontWeight: active ? 700 : 550 }}>
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {notice && (
        <div role="status" style={{ position: "fixed", zIndex: 20, left: "50%", bottom: 84, transform: "translateX(-50%)", maxWidth: "calc(100% - 32px)", whiteSpace: "nowrap", borderRadius: 999, padding: "11px 15px", color: "#fff", background: "#2f493b", boxShadow: "0 8px 24px #1f382c30", fontSize: 12, fontWeight: 600 }}>
          {notice}
        </div>
      )}
    </div>
  );
}
