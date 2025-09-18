import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import { API_BASE } from "../api/config";

const NUM_Q = 9;

export default function QuizPage() {
  const { state, dispatch } = useContext(QuizContext);
  const lang = state.lang || "KOR";
  const navigate = useNavigate();

  const qIndex = state.current; // 0..8
  const qNo = qIndex + 1;       // 1..9

  // 뒤로가기
  const goBackOne = () => {
    if (qIndex === 0) {
      // ✅ 첫 번째 문항에서 → 초기화면
      dispatch({ type: "RESET" });
      navigate("/");
    } else {
      // ✅ 그 외 → 이전 문제로 이동
      dispatch({ type: "PREV" });
    }
  };

  // 진행률
  const answeredCount = useMemo(
    () => state.answers.filter((v) => v != null).length,
    [state.answers]
  );
  const percent = Math.round((answeredCount / NUM_Q) * 100);

  // 선택 처리
  const pick = async (value) => {
    dispatch({ type: "SET_ANSWER", index: qIndex, value });

    if (qIndex === NUM_Q - 1) {
      const answers = [...state.answers];
      answers[qIndex] = value;
      try {
        const res = await fetch(`${API_BASE}/api/result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.detail || "서버 오류");
        dispatch({ type: "SET_RESULT", value: json });
        navigate("/result", { state: { answers, result: json } });
      } catch (e) {
        alert(`결과 계산 실패: ${e.message}`);
      }
      return;
    }
    dispatch({ type: "NEXT" });
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">Spot Eraser</div>
        <LanguageSwitcher />
      </header>

      <div className="quiz-wrap">
        {/* Progress */}
        <div className="progress" aria-label="progress">
          <div style={{ width: `${percent}%` }} />
        </div>

        {/* 문제 카드 */}
        <div className="q-card">
          <img
            src={`/assets/quiz-question-${qNo}${lang === "ENG" ? "_eng" : ""}.jpg`}
            alt={`Q${qNo}`}
            className="q-image"
            loading="lazy"
          />

          <div className="opt-grid">
            {[1, 2, 3, 4].map((v) => {
              const selected = state.answers[qIndex] === v;
              return (
                <button
                  key={v}
                  type="button"
                  className={`opt ${selected ? "selected" : ""}`}
                  onClick={() => pick(v)}
                >
                  <img
                    src={`/assets/option-${qNo}-${v}${lang === "ENG" ? "_eng" : ""}.jpg`}
                    alt={`Q${qNo}-${v}`}
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단 중앙 뒤로가기 */}
        <div className="quiz-bottom-actions">
          <button className="btn btn-lg retry-btn" onClick={goBackOne}>
            {lang === "ENG" ? "← Back" : "← 뒤로가기"}
          </button>
        </div>
      </div>
    </div>
  );
}
