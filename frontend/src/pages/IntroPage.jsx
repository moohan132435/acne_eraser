import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

export default function IntroPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useContext(QuizContext);
  const lang = state.lang || "KOR";

  const startQuiz = () => {
    const keepLang = state.lang;
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_LANG", payload: keepLang });
    navigate("/quiz");
  };

  const onIntroKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startQuiz();
    }
  };

  return (
    <div className="page intro-page">
      {/* 상단 브랜드 텍스트 제거, 아이콘(global.png)만 우측에 */}
      <header className="topbar" onClick={(e) => e.stopPropagation()}>
        <div className="brand" />
        <LanguageSwitcher />
      </header>

      {/* 인트로 영역 전체 클릭 → 퀴즈 시작 (헤더 높이만큼 margin-top은 CSS에서 처리) */}
      <div
        className="intro-wrap"
        role="button"
        tabIndex={0}
        onClick={startQuiz}
        onKeyDown={onIntroKeyDown}
        style={{ cursor: "pointer" }}
        aria-label={lang === "ENG" ? "Start diagnosis" : "진단 시작"}
        title={lang === "ENG" ? "Start diagnosis" : "진단 시작"}
      >
        <div className="intro-hero-wrapper">
          <img
            src={`/assets/Intro${lang === "ENG" ? "_eng" : ""}.png`}
            alt="intro"
            className="intro-hero"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
