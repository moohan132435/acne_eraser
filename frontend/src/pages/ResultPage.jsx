import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

/* ===========================
   퍼센트 피라미드 (오버레이만 음영 + 10% 점선)
=========================== */
function PercentPyramid({ age = 23, percent = 50, lang = "KOR" }) {
  const svgRef = React.useRef(null);
  const [bandHViewBox, setBandHViewBox] = React.useState(8);

  // 렌더된 SVG 높이 기준으로 '약 2cm(≈72px)'를 viewBox 높이로 환산
  const APPROX_2CM_PX = 25;

  React.useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const vh = el.getBoundingClientRect().height || 300; // px
    const h = (APPROX_2CM_PX / vh) * 100;               // viewBox 기준
    setBandHViewBox(Math.max(3, Math.min(18, h)));
  }, []);

  const pRaw = Number(percent);
  const p = Math.min(100, Math.max(0, Number.isFinite(pRaw) ? pRaw : 0));

  const ageNum = Number(age);
  const decadeStart = Math.floor((Number.isFinite(ageNum) ? ageNum : 20) / 10) * 10;
  const decadeLabel = lang === "ENG" ? `${decadeStart}s` : `${decadeStart}대`;

  // 상위 p% → 아래에서 위로 채움. p가 클수록 채움 높이는 작음.
  const fillPct = 100 - p;     // 채워질 높이(%)
  const fillY = 100 - fillPct; // 채움 시작 y
  const boundaryH = 2;         // 퍼센트 경계선 두께

  const title1 = lang === "ENG" ? `Your skin age is ${ageNum}.` : `당신의 피부나이는 ${ageNum}살입니다.`;
  const title2 =
    lang === "ENG"
      ? `Top ${p}% among people in their ${decadeLabel}.`
      : `${decadeLabel} 중에 상위 ${p}%입니다!`;

  // 10% 간격 점선 y값들: top=5, bottom=95 (높이 90) → 9 단위 간격
  const dashedYs = React.useMemo(() => Array.from({ length: 9 }, (_, i) => 95 - 9 * (i + 1)), []);

  return (
    <section
      className="pyramid-card"
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
        margin: "12px 0",
        background: "#fff",
      }}
    >
      {/* 상단 라운드 박스 */}
      <div
        style={{
          border: "1px solid var(--border)",
          background: "#f8fafc",
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 12,
          textAlign: "center",
          lineHeight: 1.35,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: "clamp(16px,4.3vw,22px)", marginBottom: 6, color: "#0f172a" }}>
          {title1}
        </div>
        <div style={{ fontWeight: 900, fontSize: "clamp(17px,4.8vw,24px)", color: "var(--brand)" }}>
          {title2}
        </div>
      </div>

      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <svg ref={svgRef} viewBox="0 0 100 100" width="100%" height="auto" role="img" aria-label={title2}>
          {/* 외곽 삼각형 */}
          <polygon points="50,5 95,95 5,95" fill="none" stroke="#56d6e0" strokeWidth="1.8" />

          <defs>
            <clipPath id="pyr-clip">
              <polygon points="50,5 95,95 5,95" />
            </clipPath>

            {/* 위 진함 / 아래 옅음 */}
            <linearGradient id="pyr-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#e8fbff" />
              <stop offset="35%" stopColor="#bbf0f6" />
              <stop offset="70%" stopColor="#75deea" />
              <stop offset="100%" stopColor="#19cfea" />
            </linearGradient>

            {/* 줄무늬 패턴 (오버레이 영역에만 적용) */}
            <pattern id="pyr-stripe" width="1" height="6" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="100" height="3" fill="rgba(0,0,0,.06)" />
            </pattern>
          </defs>

          {/* 피라미드 내부만 보이게 */}
          <g clipPath="url(#pyr-clip)">
            {/* 채움(그라데이션) */}
            <rect x="0" y={fillY} width="100" height={fillPct} fill="url(#pyr-grad)" />

            {/* 경계선(굵은 띠) */}
            <rect x="0" y={fillY - boundaryH / 2} width="100" height={boundaryH} fill="#00cbe6" opacity="0.95" />

            {/* 경계 아래 '약 2cm' 오버레이: 진한 파랑 + 스트라이프 */}
            {(() => {
              const overH = Math.max(0, Math.min(bandHViewBox, 95 - fillY));
              if (overH <= 0) return null;
              return (
                <>
                  <rect x="0" y={fillY} width="100" height={overH} fill="#008dc0" />
                  <rect x="0" y={fillY} width="100" height={overH} fill="url(#pyr-stripe)" opacity="0.25" />
                </>
              );
            })()}

            {/* ▽▽▽ 10% 간격 점선(전체 높이, 내부만 보이도록 clip) ▽▽▽ */}
            {dashedYs.map((y, i) => (
              <line
                key={i}
                x1="0"
                x2="100"
                y1={y}
                y2={y}
                stroke="#aee6ee"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.32"
              />
            ))}
            {/* △△△ 점선 끝 △△△ */}
          </g>

          {/* 퍼센트 텍스트(피라미드 밖, 항상 보이게) */}
          <text
            x="50"
            y={Math.max(12, fillY - 2)}
            textAnchor="middle"
            fontWeight="900"
            fontSize="6"
            fill="#005c8a"
          >
            {lang === "ENG" ? `Top ${p}%` : `상위 ${p}%`}
          </text>
        </svg>
      </div>
    </section>
  );
}

/* ===========================
   결과 페이지
=========================== */
export default function ResultPage() {
  const nav = useNavigate();
  const { state, dispatch } = React.useContext(QuizContext);
  const { state: navState } = useLocation();
  const lang = state?.lang || "KOR";

  // 결과 복구
  let result = state?.result || navState?.result;
  if (!result) {
    try {
      const s = localStorage.getItem("result");
      if (s) result = JSON.parse(s);
    } catch { /* ignore */ }
  }

  const skinAge = Number(result?.skin_age ?? 23);
  const percentile = Number(result?.skin_percentile ?? 50);

  // 결과 이미지(언어 반영)
  let imgSrc =
    result?.code != null ? `/assets/result-${result.code}.png` : result?.image || "/assets/result-1.png";
  if (lang === "ENG") imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");

  const retry = () => {
    const keep = state?.lang;
    dispatch?.({ type: "RESET" });
    dispatch?.({ type: "SET_LANG", payload: keep });
    nav("/");
  };

  // 🔗 공유하기: Web Share → 클립보드 → 페이지로 이동 폴백
  const handleShare = async () => {
    const code = result?.code ?? 1;
    const url = `${location.origin}/share/result-${code}?lang=${lang}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Spot Eraser", url });
        return;
      }
    } catch (_) {
      /* fall through */
    }

    try {
      await navigator.clipboard.writeText(url);
      alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 복사했어요.");
    } catch {
      // 마지막 폴백: 직접 이동
      nav(`/share/result-${code}?lang=${lang}`);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <LanguageSwitcher />
      </header>

      <div className="result-wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
        <PercentPyramid age={skinAge} percent={percentile} lang={lang} />

        <img
          src={imgSrc}
          alt="result"
          style={{ width: "100%", display: "block", borderRadius: 12 }}
          loading="lazy"
        />

        <div
          className="result-actions"
          style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}
        >
          <a
            className="btn btn-lg insta-btn"
            href="https://www.instagram.com/pgb_global/"
            target="_blank"
            rel="noreferrer"
          >
            {lang === "ENG" ? "Message on Instagram" : "인스타 DM 상담하기"}
          </a>

          {/* ✅ 공유하기 버튼 복구 */}
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
