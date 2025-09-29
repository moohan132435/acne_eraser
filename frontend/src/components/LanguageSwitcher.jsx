import React, { useContext, useEffect, useRef, useState } from "react";
import { QuizContext } from "../context/QuizContext.jsx";

export default function LanguageSwitcher() {
  const { state, dispatch } = useContext(QuizContext);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const setLang = (code) => {
    dispatch({ type: "SET_LANG", payload: code });
    setOpen(false);
  };

  // 바깥 클릭/ESC로 닫기
  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`lang-switcher ${open ? "open" : ""}`}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      <button
        type="button"
        className="lang-switcher__btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Language"
      >
        {/* 아이콘 또는 이미지 */}
        <img src="/assets/global.png" alt="" width={24} height={24} />
        <span className="lang-switcher__label">LANG</span>
      </button>

      <ul className="lang-switcher__menu" role="menu">
        <li role="menuitem">
          <button className="lang-switcher__item" onClick={() => setLang("KOR")}>
            KOR
          </button>
        </li>
        <li role="menuitem">
          <button className="lang-switcher__item" onClick={() => setLang("ENG")}>
            ENG
          </button>
        </li>
      </ul>
    </div>
  );
}
