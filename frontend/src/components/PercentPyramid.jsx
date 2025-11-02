import React from "react";

/**
 * PercentPyramid
 * props:
 *  - age: number (예: 23)
 *  - percent: number (0~100)  -> "상위 n%" 의 n
 *  - lang: "KOR" | "ENG"
 *
 * 설명:
 *  - 상단에 문구 (“당신의 피부나이는 23살입니다.”, “20대 중에 상위 12% 입니다!”)
 *  - 아래에 퍼센트에 비례하여 채워지는 피라미드 (SVG clipPath)
 *
 * 퍼센트-채움 규칙(직관적 세팅):
 *  - "상위 10%" 처럼 숫자가 작을수록 더 TOP이므로,
 *    피라미드 채움은 (100 - percent)% 로 ‘높게’ 표현되도록 매핑.
 *    필요 시 아래 fillPct 계산 부분만 바꾸면 됨.
 */
export default function PercentPyramid({ age = 23, percent = 50, lang = "KOR" }) {
  const safePercent = Math.min(100, Math.max(0, Number(percent) || 0));
  const decadeStart = Math.floor((Number(age) || 20) / 10) * 10;
  const decadeLabel = `${decadeStart}${lang === "ENG" ? "s" : "대"}`;

  // 채움 높이(%) - 상위가 낮을수록(좋을수록) 더 많이 채워지게 반전
  const fillPct = 100 - safePercent; // 0~100
  // viewBox 높이(100) 기준으로 y 시작점 계산
  const fillY = 100 - fillPct;

  const title1 =
    lang === "ENG"
      ? `Your skin age is ${age}.`
      : `당신의 피부나이는 ${age}살입니다.`;

  const title2 =
    lang === "ENG"
      ? `Top ${safePercent}% among people in their ${decadeLabel}.`
      : `${decadeLabel} 중에 상위 ${safePercent}% 입니다!`;

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
      <div
        style={{
          textAlign: "center",
          marginBottom: 12,
          lineHeight: 1.35,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: "clamp(16px, 4.3vw, 22px)",
            marginBottom: 6,
            color: "#0f172a",
          }}
        >
          {title1}
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: "clamp(15px, 4vw, 20px)",
            color: "var(--brand)",
          }}
        >
          {title2}
        </div>
      </div>

      {/* SVG 피라미드 */}
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="auto"
          role="img"
          aria-label={title2}
        >
          {/* 피라미드 외곽선 */}
          <polygon
            points="50,5 95,95 5,95"
            fill="none"
            stroke="#6ee7e7"
            strokeWidth="1.8"
          />

          {/* clipPath: 피라미드 내부 모양 */}
          <defs>
            <clipPath id="pyramid-clip">
              <polygon points="50,5 95,95 5,95" />
            </clipPath>

            {/* 채움 그라디언트 */}
            <linearGradient id="pyramid-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#d9f7ff" />
              <stop offset="60%" stopColor="#8be3f0" />
              <stop offset="100%" stopColor="#51d1e6" />
            </linearGradient>
          </defs>

          {/* 등분 가이드(연한 라인) */}
          {Array.from({ length: 4 }).map((_, i) => {
            const y = 95 - (i + 1) * ((95 - 5) / 5); // 대략 5등분 중 4개 선
            return (
              <line
                key={i}
                x1="10"
                x2="90"
                y1={y}
                y2={y}
                stroke="#e6f6f1"
                strokeWidth="0.8"
                opacity="0.9"
              />
            );
          })}

          {/* 채워지는 영역: clipPath로 삼각형 내부만 보이게 */}
          <g clipPath="url(#pyramid-clip)">
            {/* 아래서부터 위로 올라오는 사각형 */}
            <rect
              x="0"
              y={fillY}
              width="100"
              height={fillPct}
              fill="url(#pyramid-grad)"
              opacity="0.95"
            />
          </g>
        </svg>

        {/* 퍼센트 텍스트(아래 보조 표기) */}
        <div
          style={{
            textAlign: "center",
            marginTop: 8,
            color: "#334155",
            fontSize: "clamp(12px, 3.5vw, 14px)",
          }}
        >
          {lang === "ENG"
            ? `Fill shows Top ${safePercent}% (higher fill = better rank)`
            : `채움 영역은 상위 ${safePercent}%를 의미합니다`}
        </div>
      </div>
    </section>
  );
}
