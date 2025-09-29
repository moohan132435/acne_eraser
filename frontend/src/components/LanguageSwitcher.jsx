// frontend/src/components/LanguageSwitcher.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { QuizContext } from "../context/QuizContext.jsx";

export default function LanguageSwitcher() {
  const { state, dispatch } = useContext(QuizContext);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const setLang = (lang) => {
    dispatch({ type: "SET_LANG", payload: lang });
    setOpen(false);
  };

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        className="icon-btn icon-btn--plain"
        aria-label="language"
        title="Language"
        onClick={() => setOpen((v) => !v)}
      >
        {/* ⬇️ 업로드한 아이콘 사용 */}
        <img
          src="/assets/global.png"
          alt=""
          className="lang-icon"
          width={44}
          height={44}
          draggable="false"
        />
      </button>

      {open && (
        <div className="lang-menu">
          <button
            className={`lang-item ${state.lang === "KOR" ? "active" : ""}`}
            onClick={() => setLang("KOR")}
          >
            KOR
          </button>
          <button
            className={`lang-item ${state.lang === "ENG" ? "active" : ""}`}
            onClick={() => setLang("ENG")}
          >
            ENG
          </button>
        </div>
      )}
    </div>
  );
}
