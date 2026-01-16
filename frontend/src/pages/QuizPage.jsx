import React, { useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import { QUESTIONS, NUM_Q } from "../data/questions.js";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import SmartImg from "../components/SmartImage.jsx";

// const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? "https://acne-eraser.onrender.com" : "http://127.0.0.1:8000");

/* Q1 성별 → 'M' | 'W' | null */
function sexFromQ1(ans) {
  if (ans === 1 || ans === 3) return "M";
  if (ans === 2 || ans === 4) return "W";
  return null;
}

/* 옵션 이미지 base 경로 */
function buildOptionBase({ q, a, lang, q1Answer }) {
  const langSuf = lang === "ENG" ? "_eng" : "";
  if (q === 10 || q === 12) {
    const sex = sexFromQ1(q1Answer);
    if (sex) return `assets/option-${q}-${a}_${sex}${langSuf}`;
    return `assets/option-${q}-${a}${langSuf}`;
  }
  return `assets/option-${q}-${a}${langSuf}`;
}

/* 질문(문항 제목) 이미지 base 경로 */
function buildQuestionBase({ q, lang }) {
  const langSuf = lang === "ENG" ? "_eng" : "";
  return `assets/quiz-question-${q}${langSuf}`;
}

export default function QuizPage() {
  const nav = useNavigate();
  const { state, dispatch } = useContext(QuizContext);
  const { lang, current, answers, birthYear } = state;

  /**
   * ✅ 진입 시 무조건 영어 고정
   * - 기존 기능(SET_LANG dispatch)을 활용해 강제
   * - 한국어로 들어오거나(localStorage/초기값 등), 중간에 KOR로 바뀌어도 ENG 유지
   */
  useEffect(() => {
    if (lang !== "ENG") {
      dispatch({ type: "SET_LANG", payload: "ENG" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const q1Answer = answers?.[0] ?? null;
  const progress = Math.round((current / NUM_Q) * 100);

  const pick = async (a) => {
    dispatch({ type: "SET_ANSWER", index: current, value: a });

    // Q2는 select라 자동 이동 X
    if (current === 1) return;

    if (current === NUM_Q - 1) {
      await submitResult();
      return;
    }
    dispatch({ type: "NEXT" });
  };

  const submitResult = async () => {
    try {
      const payload = {
        answers: (answers || []).map((v) => (v == null ? 0 : v)),
        birth_year: birthYear || null,
      };
      const res = await fetch(`${API_BASE}/api/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      dispatch({ type: "SET_RESULT", value: data });
      nav("/result", { state: { result: data } });
    } catch (e) {
      // 기존 문구 유지(기능 유지 목적). 실제로는 lang이 ENG로 고정이라 ENG UI만 보이게 됨.
      alert(`결과 계산 실패: ${e?.message || e}`);
    }
  };

  const goPrev = () => {
    if (current === 0) {
      const keep = state.lang;
      dispatch({ type: "RESET" });
      dispatch({ type: "SET_LANG", payload: keep });
      nav("/"); // ✅ Q1에서는 홈으로
      return;
    }
    dispatch({ type: "PREV" });
  };

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const arr = [];
    for (let y = now - 80; y <= now; y++) arr.push(y);
    return arr.reverse();
  }, []);

  const onChangeBirth = (e) => {
    const y = Number(e.target.value);
    dispatch({ type: "SET_BIRTH_YEAR", payload: y || null });
  };

  const renderOption = (qIndex, aIndex) => {
    const q = qIndex + 1;
    const a = aIndex + 1;
    const base = buildOptionBase({ q, a, lang, q1Answer });
    const selected = answers[qIndex] === a;

    return (
      <button
        key={aIndex}
        className={`opt ${selected ? "selected" : ""}`}
        onClick={() => pick(a)}
        style={{ padding: 0 }}
        aria-label={`Q${q}-A${a}`}
      >
        <SmartImg base={base} alt={`Q${q}-A${a}`} />
      </button>
    );
  };

  const qNumber = current + 1;
  const qTitleBase = buildQuestionBase({ q: qNumber, lang });

  // ✅ Q1(성별)에서만: KOR은 2개, ENG는 4개 옵션
  // - lang을 ENG로 강제하므로, 실제로는 Q1에서 4개 옵션이 사용됨
  const optionCount = current === 0 ? (lang === "KOR" ? 2 : 4) : 4;
  const optionIndexes = Array.from({ length: optionCount }, (_, i) => i);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand"></div>
        {/* ✅ LanguageSwitcher는 현재 UI 렌더가 null(숨김)이라 아무것도 안 보임 */}
        <LanguageSwitcher />
      </header>

      <div className="quiz-wrap">
        <div className="progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="q-card">
          {/* 질문 제목 이미지 */}
          <div style={{ marginBottom: 10 }}>
            <SmartImg
              base={qTitleBase}
              alt={`Question ${qNumber}`}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>

          {current === 1 ? (
            /* Q2: 출생연도 */
            <div style={{ padding: 8 }}>
              <select
                value={birthYear || ""}
                onChange={onChangeBirth}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  fontSize: 16,
                }}
              >
                <option value="">
                  {lang === "ENG" ? "Select year" : "연도 선택"}
                </option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <div
                className="quiz-bottom-actions"
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* 🔹 통일된 버튼(1번과 동일 룩) */}
                <button className="btn back-soft btn-lg" onClick={goPrev}>
                  {lang === "ENG" ? "Back" : "뒤로"}
                </button>

                <button
                  className="btn btn-lg"
                  onClick={() => {
                    if (!birthYear) {
                      alert(
                        lang === "ENG"
                          ? "Please select your birth year."
                          : "출생연도를 선택해 주세요."
                      );
                      return;
                    }
                    if (current === NUM_Q - 1) submitResult();
                    else dispatch({ type: "NEXT" });
                  }}
                >
                  {lang === "ENG" ? "Next" : "다음"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="opt-grid">
                {optionIndexes.map((i) => renderOption(current, i))}
              </div>

              <div className="quiz-bottom-actions" style={{ marginTop: 12 }}>
                {/* 🔹 모든 문항 공통: 동일 클래스 사용 */}
                <button className="btn back-soft btn-lg" onClick={goPrev}>
                  {lang === "ENG" ? "Back" : "뒤로"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
