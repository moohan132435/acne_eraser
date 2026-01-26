import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

/* ===========================
   퍼센트 피라미드 (오버레이만 음영)
=========================== */
function PercentPyramid({ age = 23, percent = 50, lang = "KOR" }) {
  const svgRef = React.useRef(null);
  const [bandHViewBox, setBandHViewBox] = React.useState(8);
  const APPROX_2CM_PX = 32;

  React.useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const vh = el.getBoundingClientRect().height || 300;
    const h = (APPROX_2CM_PX / vh) * 100;
    setBandHViewBox(Math.max(3, Math.min(18, h)));
  }, []);

  const pRaw = Number(percent);
  const p = Math.min(100, Math.max(0, Number.isFinite(pRaw) ? pRaw : 0));

  /**
   * ✅ (반영) ageNum도 1자리 반올림으로 정규화 + 표시용 문자열(항상 1자리)
   * - 정책(-5%)은 ResultPage에서 처리
   * - 여기서는 "표시 안정화" 차원으로 1자리로만 맞춤
   */
  const ageRaw = Number(age);
  const ageNum = Number.isFinite(ageRaw) ? Math.round(ageRaw * 10) / 10 : 23; // 숫자
  const ageDisplay = Number.isFinite(ageRaw)
    ? (Math.round(ageRaw * 10) / 10).toFixed(1)
    : "23.0"; // 문자열(항상 1자리)

  const decadeStart = Math.floor((Number.isFinite(ageNum) ? ageNum : 20) / 10) * 10;
  const decadeLabel = lang === "ENG" ? `${decadeStart}s` : `${decadeStart}대`;

  const fillPct = 100 - p;
  const fillY = 100 - fillPct;
  const boundaryH = 2;

  const title1 =
    lang === "ENG"
      ? `Your skin age is ${ageDisplay}.`
      : `당신의 피부나이는 ${ageDisplay}살입니다.`;
  const title2 =
    lang === "ENG"
      ? `Top ${p}% among people in their ${decadeLabel}.`
      : `${decadeLabel} 중에 상위 ${p}%입니다!`;

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
        <div
          style={{
            fontWeight: 800,
            fontSize: "clamp(16px,4.3vw,22px)",
            marginBottom: 6,
            color: "#0f172a",
          }}
        >
          {title1}
        </div>
        <div
          style={{
            fontWeight: 900,
            fontSize: "clamp(17px,4.8vw,24px)",
            color: "var(--brand)",
          }}
        >
          {title2}
        </div>
      </div>

      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          width="100%"
          height="auto"
          role="img"
          aria-label={title2}
        >
          {/* 외곽 삼각형 */}
          <polygon points="50,5 95,95 5,95" fill="none" stroke="#56d6e0" strokeWidth="1.8" />

          <defs>
            <clipPath id="pyr-clip">
              <polygon points="50,5 95,95 5,95" />
            </clipPath>

            <linearGradient id="pyr-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#e8fbff" />
              <stop offset="35%" stopColor="#bbf0f6" />
              <stop offset="70%" stopColor="#75deea" />
              <stop offset="100%" stopColor="#19cfea" />
            </linearGradient>

            <pattern id="pyr-stripe" width="1" height="6" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="100" height="3" fill="rgba(0,0,0,.06)" />
            </pattern>
          </defs>

          {/* 10% 간격 점선 (내부에만 표시) */}
          <g clipPath="url(#pyr-clip)">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => {
              const y = 95 - 90 * (k / 10); // top=5, bottom=95 기준
              return (
                <line
                  key={k}
                  x1="8"
                  x2="92"
                  y1={y}
                  y2={y}
                  stroke="#aee6ee"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                  opacity="0.8"
                />
              );
            })}
          </g>

          {/* 내부 채움/오버레이 */}
          <g clipPath="url(#pyr-clip)">
            <rect x="0" y={fillY} width="100" height={fillPct} fill="url(#pyr-grad)" />
            <rect
              x="0"
              y={fillY - boundaryH / 2}
              width="100"
              height={boundaryH}
              fill="#00cbe6"
              opacity="0.95"
            />
            {(() => {
              const overH = Math.max(0, Math.min(bandHViewBox, 95 - fillY));
              if (overH <= 0) return null;
              return (
                <>
                  <rect
                    x="0"
                    y={fillY}
                    width="100"
                    height={overH}
                    fill="#009ac7"
                    opacity="0.45"
                  />
                  <rect
                    x="0"
                    y={fillY}
                    width="100"
                    height={overH}
                    fill="url(#pyr-stripe)"
                    opacity="0.18"
                  />
                </>
              );
            })()}
          </g>

          {/* 퍼센트 텍스트 */}
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
    } catch {}
  }

  /**
   * ✅ (반영) backend 원본 나이에 -5% 적용 + 소수점 1자리 반올림
   */
  const rawSkinAge = Number(result?.skin_age ?? 23);
  const skinAge = Number.isFinite(rawSkinAge)
    ? Math.round(rawSkinAge * 0.95 * 10) / 10
    : 23;

  const percentile = Number(result?.skin_percentile ?? 50);

  // 결과 이미지(언어 반영)
  let imgSrc =
    result?.code != null
      ? `/assets/result-${result.code}.png`
      : result?.image || "/assets/result-1.png";
  if (lang === "ENG") imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");

  const retry = () => {
    const keep = state?.lang;
    dispatch?.({ type: "RESET" });
    dispatch?.({ type: "SET_LANG", payload: keep });
    nav("/");
  };

  // ▼ 공유용 슬러그: 정적 썸네일 페이지와 일치 (예: /public/share/result-1-eng/index.html)
  const baseSlug = result?.code != null ? `result-${result.code}` : "result-1";
  const shareSlug = lang === "ENG" ? `${baseSlug}-eng` : baseSlug;
  const shareUrl = `${window.location.origin}/share/${shareSlug}/`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: lang === "ENG" ? "PGB Skin Diagnosis Result" : "PGB 피부진단 결과",
          text:
            lang === "ENG"
              ? "Check my skin diagnosis result.🔍"
              : "내 피부진단 결과를 확인해보세요.🔍",
          url: shareUrl,
        });
        return;
      }
    } catch {
      // 무시 후 폴백 진행
    }

    // 폴백 1: 클립보드 복사
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(lang === "ENG" ? "Link copied! Share it anywhere." : "링크가 복사되었습니다.");
    } catch {
      // 폴백 2: 프롬프트
      prompt(lang === "ENG" ? "Copy this link:" : "아래 링크를 복사해 주세요:", shareUrl);
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
            href="https://www.amazon.com/dp/B0GD6529ZB"
            target="_blank"
            rel="noreferrer"
          >
            {lang === "ENG" ? "Buy personalized acne patches" : "맞춤형 여드름패치 구매하기"}
          </a>

          {/* ✅ 공유 버튼 (정적 썸네일 URL 공유) */}
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
