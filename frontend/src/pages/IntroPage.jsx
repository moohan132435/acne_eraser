import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";

export default function IntroPage() {
  const navigate = useNavigate();
  const { dispatch } = useContext(QuizContext);

  const startQuiz = () => {
    dispatch({ type: "RESET" }); // 초기화
    navigate("/quiz");
  };

  return (
    <div className="page intro-page">
      {/* 상단 브랜드는 모든 페이지와 동일하게 중앙 정렬 */}
      <header className="topbar">
        <div className="brand">Acne Eraser</div>
      </header>

      {/* 인트로 메인 비주얼 */}
      <div className="intro-hero">
        <img
          src="/assets/Intro.png"
          alt="여드름 피부진단테스트 인트로"
          className="hero-img"
          loading="eager"
        />

        {/* 중앙 오버레이 버튼 (이미지) */}
        <button
          type="button"
          className="hero-btn"
          onClick={startQuiz}
          aria-label="진단하기"
          title="진단하기"
        >
          <img
            src="/assets/btn_diagnosis.png"
            alt="" /* 장식용 이미지는 alt 비움 */
            className="hero-btn-img"
            draggable="false"
          />
        </button>
      </div>
    </div>
  );
}
