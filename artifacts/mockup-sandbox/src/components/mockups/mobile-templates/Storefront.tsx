import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Compass,
  Heart,
  House,
  Plus,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

const products = [
  {
    id: "cup",
    name: "빛을 담은 찻잔",
    maker: "소소요 · 백자",
    price: "38,000",
    category: "주방",
    tone: "#e8ded0",
    art: "cup",
    tag: "이번 주의 발견",
  },
  {
    id: "cloth",
    name: "고요한 아침 키친클로스",
    maker: "느린결 · 린넨 100%",
    price: "24,000",
    category: "패브릭",
    tone: "#d9ded1",
    art: "cloth",
    tag: "작은 공방",
  },
  {
    id: "tray",
    name: "느티나무 낮은 트레이",
    maker: "목요일공방 · 원목",
    price: "52,000",
    category: "리빙",
    tone: "#dfcdb5",
    art: "tray",
    tag: "오래 쓰는 물건",
  },
  {
    id: "vase",
    name: "모과빛 작은 화병",
    maker: "흙과 온도 · 수공예",
    price: "46,000",
    category: "리빙",
    tone: "#ead8c3",
    art: "vase",
    tag: "한정 수량",
  },
];

const categories = ["전체", "주방", "리빙", "패브릭", "문구"];

function ProductArtwork({ art, tone }: { art: string; tone: string }) {
  return (
    <div className={`store-artwork store-artwork-${art}`} style={{ background: tone }}>
      {art === "cup" && (
        <svg viewBox="0 0 180 140" aria-hidden="true">
          <ellipse cx="91" cy="118" rx="47" ry="7" fill="#89765f" opacity=".16" />
          <path d="M51 52h71v39c0 17-13 27-35 27S51 108 51 91V52Z" fill="#f4eee3" />
          <path d="M122 62h12c12 0 14 21 1 27l-12 5" fill="none" stroke="#eee5d7" strokeWidth="8" />
          <path d="M57 59h59" stroke="#d2c2ac" strokeWidth="2" opacity=".7" />
          <ellipse cx="86.5" cy="52" rx="35.5" ry="5" fill="#fffaf1" />
          <path d="M60 98c16 8 40 8 57-1" fill="none" stroke="#ded1bf" strokeWidth="2" />
        </svg>
      )}
      {art === "cloth" && (
        <svg viewBox="0 0 180 140" aria-hidden="true">
          <ellipse cx="94" cy="117" rx="52" ry="7" fill="#66725e" opacity=".15" />
          <path d="m48 36 71 9 13 57-73 8-19-51 8-23Z" fill="#f1ede1" />
          <path d="m48 36 13 57 71 9M59 44l67 8M63 59l69 8M67 76l68 7M71 91l63 1" fill="none" stroke="#c7c7b4" strokeWidth="1.2" />
          <path d="m48 36 10 7m-6 5 11 8m-7 5 12 7m-6 7 13 6" stroke="#faf7ee" strokeWidth="2" />
        </svg>
      )}
      {art === "tray" && (
        <svg viewBox="0 0 180 140" aria-hidden="true">
          <ellipse cx="91" cy="110" rx="59" ry="9" fill="#82674a" opacity=".18" />
          <path d="m39 72 47-25 59 15-48 31-58-14Z" fill="#b99368" />
          <path d="m39 72 58 14v13L39 84V72Z" fill="#9a744d" />
          <path d="m97 86 48-24v13L97 99V86Z" fill="#ad865b" />
          <path d="m53 71 33-17 43 11-34 18-42-12Z" fill="#d2b38c" />
          <path d="m61 72 31 8m-20-17 31 8m-11-15 31 8" stroke="#b38f67" strokeWidth="1.5" opacity=".65" />
        </svg>
      )}
      {art === "vase" && (
        <svg viewBox="0 0 180 140" aria-hidden="true">
          <ellipse cx="91" cy="118" rx="38" ry="7" fill="#8a7058" opacity=".17" />
          <path d="M84 46c0 11-16 18-16 34 0 24 10 34 24 34s24-10 24-34c0-16-16-23-16-34V35H84v11Z" fill="#c5825d" />
          <path d="M84 39h16v9H84z" fill="#b87855" />
          <path d="M92 40c0-13 9-17 17-25m-18 28c-2-13-8-17-14-25" fill="none" stroke="#718266" strokeWidth="2" />
          <path d="M109 17c7-1 12 2 13 7-6 3-12 1-15-3m-28 2c-6-1-10 1-12 5 5 4 11 2 14-1" fill="#8a987c" />
          <path d="M77 79c5 3 9 4 14 4" stroke="#d99a72" strokeWidth="2" opacity=".75" />
        </svg>
      )}
    </div>
  );
}

export function Storefront() {
  const [category, setCategory] = useState("전체");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [activeTab, setActiveTab] = useState("홈");
  const [notice, setNotice] = useState("");

  const shownProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === "전체" || product.category === category;
      const matchesQuery =
        !query.trim() ||
        `${product.name} ${product.maker} ${product.category}`.includes(query.trim());
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1900);
  }

  function toggleFavorite(id: string) {
    const isSaved = favorites.includes(id);
    setFavorites((current) =>
      isSaved ? current.filter((item) => item !== id) : [...current, id],
    );
    showNotice(isSaved ? "찜 목록에서 지웠어요" : "마음에 담아두었어요");
  }

  return (
    <div className="sf-root">
      <style>{`
        .sf-root {
          --paper: #f7f4ed;
          --ink: #302f28;
          --muted: #89867c;
          --line: #e8e3d9;
          --moss: #566149;
          --clay: #b66e50;
          min-height: 100dvh;
          height: 100dvh;
          overflow: hidden;
          color: var(--ink);
          background: var(--paper);
          font-family: "Geist", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
          letter-spacing: -0.035em;
          -webkit-font-smoothing: antialiased;
        }
        .sf-scroll { height: 100%; overflow-y: auto; scrollbar-width: none; padding-bottom: 92px; }
        .sf-scroll::-webkit-scrollbar { display: none; }
        .sf-header { padding: 19px 22px 0; }
        .sf-brand-row { height: 36px; display:flex; align-items:center; justify-content:space-between; }
        .sf-brand { display:flex; align-items:center; gap:9px; }
        .sf-mark { width:25px;height:25px;border:1px solid #7c816c;border-radius:50%;display:grid;place-items:center;position:relative; }
        .sf-mark:before { content:""; width:8px;height:8px;border:1px solid #7c816c;transform:rotate(45deg);display:block; }
        .sf-name { font-family:"Libre Baskerville", "Batang", serif;font-size:17px;letter-spacing:-.08em;font-weight:600; }
        .sf-brand-caption { margin-left:1px;font-size:9px;letter-spacing:.17em;color:#858171; }
        .sf-icon-button { border:0; background:transparent; color:var(--ink); display:grid;place-items:center; position:relative; width:34px;height:34px;padding:0;cursor:pointer; }
        .sf-bag-count { position:absolute;right:-1px;top:0;background:var(--clay);color:#fffaf3;min-width:15px;height:15px;border-radius:9px;display:grid;place-items:center;font-size:9px;letter-spacing:0;padding:0 3px; }
        .sf-search-wrap { margin-top:15px; height:43px; background:#eeebe3; border-radius:3px; display:flex;align-items:center;padding:0 13px;gap:9px;color:#827f74; }
        .sf-search-wrap input { background:transparent;border:0;outline:0;min-width:0;flex:1;color:var(--ink);font-size:12px;font-family:inherit;letter-spacing:-.02em; }
        .sf-search-wrap input::placeholder { color:#969287; }
        .sf-search-word { font-size:11px; }
        .sf-categories { display:flex;align-items:center;gap:23px;padding:0 22px;margin-top:17px;overflow-x:auto;scrollbar-width:none;white-space:nowrap; }
        .sf-categories::-webkit-scrollbar {display:none;}
        .sf-category { border:0;background:none;padding:0 0 9px;font:inherit;font-size:12px;color:#8b887e;cursor:pointer;position:relative;letter-spacing:-.025em; }
        .sf-category.active { color:var(--ink);font-weight:650; }
        .sf-category.active:after { content:"";position:absolute;height:1.5px;background:var(--moss);bottom:0;left:0;right:0; }
        .sf-feature { margin: 11px 16px 0; }
        .sf-feature-photo { height:190px; position:relative;overflow:hidden;background:#e7dfd1; }
        .sf-feature-photo img { width:100%;height:100%;object-fit:cover;object-position:center 58%;display:block; }
        .sf-feature-photo:after { content:"";position:absolute;inset:35% 0 0;background:linear-gradient(0deg,rgba(42,39,31,.5),transparent); }
        .sf-feature-label { position:absolute;z-index:1;top:13px;left:13px;background:rgba(247,244,237,.87);padding:6px 9px;font-size:9px;letter-spacing:.11em;color:#5d604e; }
        .sf-feature-copy { position:absolute;z-index:1;bottom:15px;left:16px;color:#fffaf2; }
        .sf-feature-eyebrow { font-size:9px;letter-spacing:.18em;margin-bottom:6px;opacity:.86; }
        .sf-feature-title { margin:0;font-family:"Libre Baskerville","Batang",serif;font-weight:500;font-size:24px;letter-spacing:-.08em;line-height:1.2; }
        .sf-feature-action { position:absolute;z-index:2;right:14px;bottom:16px;border:1px solid rgba(255,250,242,.67);background:rgba(255,250,242,.1);color:#fffaf2;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;cursor:pointer; }
        .sf-editorial-note { margin:10px 17px 0;display:flex;justify-content:space-between;align-items:center;color:#858176;font-size:10px;letter-spacing:-.015em; }
        .sf-editorial-note strong { color:#5a5c4e;font-weight:550; }
        .sf-section { margin:26px 16px 0; }
        .sf-section-head { display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:13px; }
        .sf-section-kicker { color:#a47b5e;font-size:9px;letter-spacing:.16em;margin-bottom:5px; }
        .sf-section-title { font-size:18px;line-height:1.2;margin:0;font-weight:600;letter-spacing:-.065em; }
        .sf-section-link { border:0;background:transparent;color:#767366;font-family:inherit;font-size:10px;display:flex;align-items:center;gap:2px;padding:0 0 2px;cursor:pointer; }
        .sf-products { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:21px 11px; }
        .sf-product { min-width:0;position:relative; }
        .sf-art-wrap { position:relative;overflow:hidden; }
        .store-artwork { height:139px;position:relative;overflow:hidden;display:grid;place-items:center; }
        .store-artwork svg { width:100%;height:100%; }
        .sf-product-tag { position:absolute;top:8px;left:8px;background:rgba(247,244,237,.9);font-size:8px;padding:5px 6px;color:#716e60;letter-spacing:-.01em; }
        .sf-heart { position:absolute;top:6px;right:6px;width:30px;height:30px;border:0;background:rgba(247,244,237,.76);display:grid;place-items:center;color:#706d61;cursor:pointer; }
        .sf-heart.saved { color:#ae6249; }
        .sf-product-info { padding:9px 1px 0; }
        .sf-maker { color:#929084;font-size:9px;letter-spacing:-.01em; }
        .sf-product-name { margin:4px 0 5px;font-size:12px;font-weight:550;letter-spacing:-.045em;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .sf-price-row { display:flex;align-items:center;justify-content:space-between; }
        .sf-price { font-family:"Geist",sans-serif;font-size:12px;font-weight:650;letter-spacing:-.035em; }
        .sf-add { border:0;background:#e9e6dc;color:#5f6454;width:25px;height:25px;display:grid;place-items:center;cursor:pointer;transition:background .18s,transform .18s; }
        .sf-add:active { transform:scale(.92);background:#d9ddd0; }
        .sf-empty { grid-column:1/-1;padding:36px 12px;text-align:center;color:#8b887c;font-size:12px;background:#efede6; }
        .sf-bottom-nav { height:68px;position:absolute;z-index:5;bottom:0;left:0;right:0;background:rgba(249,247,241,.97);border-top:1px solid #e9e5dc;display:grid;grid-template-columns:repeat(4,1fr);padding:8px 12px 11px; }
        .sf-nav-item { border:0;background:transparent;color:#999589;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-family:inherit;font-size:9px;letter-spacing:-.02em;cursor:pointer; }
        .sf-nav-item.active { color:var(--moss); }
        .sf-nav-icon {height:20px;display:grid;place-items:center;position:relative;}
        .sf-toast { position:absolute;z-index:8;left:50%;bottom:82px;transform:translateX(-50%);background:#373b30;color:#f7f4ed;border-radius:2px;padding:11px 15px;font-size:11px;white-space:nowrap;box-shadow:0 6px 20px rgba(45,42,34,.16);animation:sf-rise .22s ease-out; }
        @keyframes sf-rise { from {opacity:0;transform:translate(-50%,6px)} to {opacity:1;transform:translate(-50%,0)} }
        @media (min-width: 500px) {
          .sf-root { width:390px; height:844px; min-height:844px; margin:0 auto; position:relative; box-shadow:0 20px 60px rgba(68,57,41,.11); }
        }
      `}</style>
      <div className="sf-scroll">
        <header className="sf-header">
          <div className="sf-brand-row">
            <div className="sf-brand" aria-label="소소연구소">
              <span className="sf-mark" />
              <span className="sf-name">소소연구소</span>
              <span className="sf-brand-caption">LIVING OBJECTS</span>
            </div>
            <button
              className="sf-icon-button"
              type="button"
              aria-label="장바구니"
              onClick={() => showNotice(cartCount ? `장바구니에 ${cartCount}개의 물건이 있어요` : "장바구니가 비어 있어요")}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && <span className="sf-bag-count">{cartCount}</span>}
            </button>
          </div>
          <div className="sf-search-wrap">
            <Search size={16} strokeWidth={1.6} />
            <input
              aria-label="상품 검색"
              placeholder={searchOpen ? "어떤 물건을 찾고 있나요?" : "천천히 둘러보세요"}
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button className="sf-icon-button" style={{ width: 22, height: 22 }} onClick={() => setQuery("")} aria-label="검색어 지우기">
                <span style={{ fontSize: 17, lineHeight: 1 }}>×</span>
              </button>
            ) : (
              <span className="sf-search-word">찾기</span>
            )}
          </div>
        </header>

        <nav className="sf-categories" aria-label="상품 카테고리">
          {categories.map((item) => (
            <button
              className={`sf-category ${category === item ? "active" : ""}`}
              key={item}
              type="button"
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <section className="sf-feature" aria-label="이번 달의 기획">
          <div className="sf-feature-photo">
            <img src="/__mockup/images/storefront-hero.jpg" alt="햇살이 머무는 테이블 위의 백자 화병과 리넨" />
            <span className="sf-feature-label">APRIL EDITION · 04</span>
            <div className="sf-feature-copy">
              <div className="sf-feature-eyebrow">매일의 풍경을 바꾸는 작은 물건</div>
              <h1 className="sf-feature-title">손끝에 닿는<br />봄의 온도</h1>
            </div>
            <button className="sf-feature-action" aria-label="봄의 온도 기획전 보기" onClick={() => showNotice("봄의 온도 기획을 모아두었어요")}>
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </section>
        <div className="sf-editorial-note">
          <span><strong>작은 공방의 물건들</strong>을 천천히 소개합니다</span>
          <span>01 — 08</span>
        </div>

        <section className="sf-section">
          <div className="sf-section-head">
            <div>
              <div className="sf-section-kicker">CURATED FOR EVERYDAY</div>
              <h2 className="sf-section-title">{category === "전체" ? "오래 곁에 둘 것들" : `${category}의 좋은 물건`}</h2>
            </div>
            <button className="sf-section-link" type="button" onClick={() => { setCategory("전체"); showNotice("모든 물건을 둘러봅니다"); }}>
              모두 보기 <ChevronRight size={13} />
            </button>
          </div>
          <div className="sf-products">
            {shownProducts.length ? shownProducts.map((product) => (
              <article className="sf-product" key={product.id}>
                <div className="sf-art-wrap">
                  <ProductArtwork art={product.art} tone={product.tone} />
                  <span className="sf-product-tag">{product.tag}</span>
                  <button
                    className={`sf-heart ${favorites.includes(product.id) ? "saved" : ""}`}
                    type="button"
                    aria-label={favorites.includes(product.id) ? "찜 해제" : "찜하기"}
                    onClick={() => toggleFavorite(product.id)}
                  >
                    <Heart size={15} strokeWidth={1.5} fill={favorites.includes(product.id) ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="sf-product-info">
                  <div className="sf-maker">{product.maker}</div>
                  <h3 className="sf-product-name">{product.name}</h3>
                  <div className="sf-price-row">
                    <span className="sf-price">{product.price}원</span>
                    <button
                      className="sf-add"
                      type="button"
                      aria-label={`${product.name} 장바구니에 담기`}
                      onClick={() => { setCartCount((count) => count + 1); showNotice("장바구니에 담았어요"); }}
                    >
                      <Plus size={15} strokeWidth={1.7} />
                    </button>
                  </div>
                </div>
              </article>
            )) : (
              <div className="sf-empty">찾으시는 물건이 아직 없어요.<br />다른 단어로 살펴볼까요?</div>
            )}
          </div>
        </section>

        <section style={{ margin: "29px 16px 20px", padding: "17px 16px", background: "#e9e7dc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#827f70", fontSize: 9, letterSpacing: ".13em", marginBottom: 5 }}>LETTER FROM THE STUDIO</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>만드는 사람의 이야기를 읽어요</div>
          </div>
          <button aria-label="작업실 이야기 읽기" onClick={() => showNotice("이번 주 작업실 편지를 준비하고 있어요")} style={{ border: "1px solid #a5a18f", background: "transparent", color: "#646657", width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer" }}>
            <ArrowRight size={14} />
          </button>
        </section>
      </div>

      <nav className="sf-bottom-nav" aria-label="주요 메뉴">
        {[
          { label: "홈", icon: <House size={19} strokeWidth={1.55} /> },
          { label: "발견", icon: <Compass size={19} strokeWidth={1.55} /> },
          { label: "찜", icon: <Heart size={19} strokeWidth={1.55} /> },
          { label: "마이", icon: <UserRound size={19} strokeWidth={1.55} /> },
        ].map((item) => (
          <button
            className={`sf-nav-item ${activeTab === item.label ? "active" : ""}`}
            key={item.label}
            type="button"
            onClick={() => { setActiveTab(item.label); if (item.label !== "홈") showNotice(`${item.label}에서 취향을 모아볼게요`); }}
          >
            <span className="sf-nav-icon">{item.icon}{item.label === "찜" && favorites.length > 0 && <Check size={8} style={{ position: "absolute", right: -4, top: 1, color: "#b66e50" }} />}</span>
            {item.label}
          </button>
        ))}
      </nav>
      {notice && <div className="sf-toast" role="status">{notice}</div>}
    </div>
  );
}
