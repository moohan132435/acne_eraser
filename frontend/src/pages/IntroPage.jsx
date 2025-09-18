import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

export default function IntroPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useContext(QuizContext);
  const lang = state.lang || "KOR";

  const startQuiz = () => {
    dispatch({ type: "RESET" });
    navigate("/quiz");
  };

  return (
    <div className="page intro-page">
      <header className="topbar">
        <div className="brand">Spot Eraser</div>
        <LanguageSwitcher />
      </header>

      <div className="intro-wrap">
        <div className="intro-hero-wrapper">
          <img
            src={`/assets/Intro${lang === "ENG" ? "_eng" : ""}.png`}
            alt="intro"
            className="intro-hero"
            loading="lazy"
          />
          <button
            className="btn btn-lg hero-btn"
            onClick={startQuiz}
            aria-label={lang === "ENG" ? "Start diagnosis" : "진단하기"}
            title={lang === "ENG" ? "Start diagnosis" : "진단하기"}
          >
            <img
              src={`/assets/btn_diagnosis${lang === "ENG" ? "_eng" : ""}.png`}
              alt=""
              draggable="false"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
