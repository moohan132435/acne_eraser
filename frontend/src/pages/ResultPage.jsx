// src/pages/ResultPage.jsx
import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";


/* 상단이 진한 퍼센트 피라미드 */
function PercentPyramid({ age = 23, percent = 50, lang = "KOR" }) {
  const safePercent = Math.min(100, Math.max(0, Number(percent) || 0));
  const decadeStart = Math.floor((Number(age) || 20) / 10) * 10;
  const decadeLabel = lang === "ENG" ? `${decadeStart}s` : `${decadeStart}대`;
  const fillPct = 100 - safePercent; // 위가 진해지도록 (Top %가 작을수록 더 채워짐)
  const fillY = 100 - fillPct;

  const t1 = lang === "ENG" ? `Your skin age is ${age}.` : `당신의 피부나이는 ${age}살입니다.`;
  const t2 =
    lang === "ENG"
      ? `Top ${safePercent}% among people in their ${decadeLabel}.`
      : `${decadeLabel} 중에 상위 ${safePercent}% 입니다!`;

  return (
    <section
      className="pyramid-card"
      style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 16, margin: "12px 0", background: "#fff" }}
    >
      <div style={{ textAlign: "center", marginBottom: 12, lineHeight: 1.35 }}>
        <div style={{ fontWeight: 800, fontSize: "clamp(16px,4.3vw,22px)", marginBottom: 6, color: "#0f172a" }}>{t1}</div>
        <div style={{ fontWeight: 800, fontSize: "clamp(15px,4vw,20px)", color: "var(--brand)" }}>{t2}</div>
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <svg viewBox="0 0 100 100" width="100%" height="auto" role="img" aria-label={t2}>
          <polygon points="50,5 95,95 5,95" fill="none" stroke="#6ee7e7" strokeWidth="1.8" />
          <defs>
            <clipPath id="pyr-clip">
              <polygon points="50,5 95,95 5,95" />
            </clipPath>
            <linearGradient id="pyr-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#e7fbff" />
              <stop offset="40%" stopColor="#baf0f6" />
              <stop offset="75%" stopColor="#73deea" />
              <stop offset="100%" stopColor="#3acbdc" />
            </linearGradient>
            <pattern id="pyr-stripe" width="1" height="6" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="100" height="3" fill="rgba(0,0,0,.06)" />
            </pattern>
          </defs>
          {Array.from({ length: 4 }).map((_, i) => {
            const y = 95 - (i + 1) * ((95 - 5) / 5);
            return <line key={i} x1="10" x2="90" y1={y} y2={y} stroke="#e6f6f1" strokeWidth="0.8" opacity="0.9" />;
          })}
          <g clipPath="url(#pyr-clip)">
            <rect x="0" y={fillY} width="100" height={fillPct} fill="url(#pyr-grad)" />
            <rect x="0" y={fillY} width="100" height={fillPct} fill="url(#pyr-stripe)" opacity="0.35" />
          </g>
        </svg>
      </div>
    </section>
  );
}

export default function ResultPage() {
  const nav = useNavigate();
  const { state, dispatch } = useContext(QuizContext);
  const { state: navState } = useLocation();
  const lang = state.lang || "KOR";

  // 결과 확보 (location → context → localStorage)
  let result = state.result || navState?.result;
  if (!result) {
    try {
      const s = localStorage.getItem("result");
      if (s) result = JSON.parse(s);
    } catch {}
  }

  // 백엔드 호환: percentile(숫자) / skin_percentile(숫자) / percentile_label("상위 5%")
  const parsePercent = (r) => {
    if (!r) return 50;
    if (r.percentile != null) return Number(r.percentile);
    if (r.skin_percentile != null) return Number(r.skin_percentile);
    if (r.percentile_label) {
      const m = String(r.percentile_label).match(/\d+/);
      if (m) return Number(m[0]);
    }
    return 50;
  };

  const skinAge = Number(result?.skin_age ?? 23);
  const percentile = parsePercent(result);

  let imgSrc =
    result?.code != null ? `/assets/result-${result.code}.png` : result?.image || "/assets/result-1.png";
  if (lang === "ENG") imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");

  const retry = () => {
    const keep = state.lang;
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_LANG", payload: keep });
    nav("/");
  };

  const SHARE_BASE = (import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000") + "/share";
  const handleShare = async () => {
    const code = result?.code ?? 1;
    const url = `${SHARE_BASE}/${code}?lang=${lang}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Spot Eraser", url });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(url);
      alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 복사했어요.");
    } catch {
      alert(lang === "ENG" ? "Unable to share." : "공유할 수 없어요.");
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">Spot Eraser</div>
        <LanguageSwitcher />
      </header>

      <div className="result-wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
        <PercentPyramid age={skinAge} percent={percentile} lang={lang} />
        <img src={imgSrc} alt="result" style={{ width: "100%", display: "block", borderRadius: 12 }} loading="lazy" />
        <div className="result-actions" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <a className="btn btn-lg insta-btn" href="https://www.instagram.com/pgb_global/" target="_blank" rel="noreferrer">
            {lang === "ENG" ? "Message on Instagram" : "인스타 DM 상담하기"}
          </a>
          <button className="btn btn-lg share-btn" onClick={handleShare}>
            {lang === "ENG" ? "Share" : "공유하기"}
          </button>
          <button className="btn btn-lg retry-btn" onClick={retry}>
            {lang === "ENG" ? "Retry" : "다시하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
