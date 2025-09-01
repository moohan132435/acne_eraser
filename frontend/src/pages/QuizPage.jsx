import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import { API_BASE } from "../api/config";

const NUM_Q = 9;

export default function QuizPage() {
  const { state, dispatch } = useContext(QuizContext);
  const navigate = useNavigate();

  const qIndex = state.current;         // 0..8
  const qNo = qIndex + 1;               // 1..9
  const answeredCount = useMemo(
    () => state.answers.filter(v => v != null).length,
    [state.answers]
  );
  const percent = Math.round((answeredCount / NUM_Q) * 100);

  const pick = async (value) => {
    dispatch({ type:"SET_ANSWER", index: qIndex, value });

    if (qIndex === NUM_Q - 1) {
      const answers = [...state.answers];
      answers[qIndex] = value;
      try{
        const res = await fetch(`${API_BASE}/api/result`, {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ answers })
        });
        const json = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(json?.detail || "서버 오류");
        dispatch({ type:"SET_RESULT", value: json });
        navigate("/result", { state:{ answers, result: json } });
      }catch(e){
        alert(`결과 계산 실패: ${e.message}`);
      }
      return;
    }
    dispatch({ type:"NEXT" });
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">Acne Eraser</div>
      </header>

      <div className="quiz-wrap">
        {/* Progress */}
        <div className="progress" aria-label="progress">
          <div style={{ width: `${percent}%` }} />
        </div>

        {/* 문제 카드 */}
        <div className="q-card">
          <div className="q-badge">Q{qNo}/9</div>

          <img
            src={`/assets/quiz-question-${qNo}.jpg`}
            alt={`Q${qNo}`}
            className="q-image"
            loading="lazy"
          />

          <div className="opt-grid">
            {[1,2,3,4].map((v) => {
              const selected = state.answers[qIndex] === v;
              return (
                <button
                  key={v}
                  type="button"
                  className={`opt ${selected ? "selected" : ""}`}
                  onClick={() => pick(v)}
                >
                  <img
                    src={`/assets/option-${qNo}-${v}.jpg`}
                    alt={`Q${qNo}-${v}`}
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 이전 버튼 제거 (원클릭-다음문제로) */}
      </div>
    </div>
  );
}
