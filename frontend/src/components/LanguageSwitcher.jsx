import React, { useContext, useEffect, useRef, useState } from "react";
import { QuizContext } from "../context/QuizContext.jsx";

/**
 * ✅ 운영 정책
 * - 지금(글로벌/영문 버전): 한국어 진입로 차단 + 지구본(글로벌 아이콘) 미노출
 * - 나중(국내버전 확장): 아래 플래그만 true로 바꾸면 기존 UI/기능 즉시 복구
 */
const ENABLE_LANGUAGE_SWITCH_UI = false; // ← 국내버전 확장 시 true로 변경

export default function LanguageSwitcher() {
  const { state, dispatch } = useContext(QuizContext);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const setLang = (code) => {
    // ✅ 기존 기능 유지: 언어 변경은 dispatch로 수행
    dispatch({ type: "SET_LANG", payload: code });
    setOpen(false);
  };

  // 바깥 클릭/ESC로 닫기 (기존 기능 유지)
  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  /**
   * ✅ 한국어 진입 방지(기능 유지)
   * - 혹시나 다른 경로에서 KOR로 바뀌더라도 즉시 ENG로 되돌림
   * - UI를 숨겨도, "외부에서 dispatch로 바꾸는 경우"를 막기 위한 안전장치
   */
  useEffect(() => {
    if (state?.lang === "KOR") {
      dispatch({ type: "SET_LANG", payload: "ENG" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.lang]);

  /**
   * ✅ 지금은 UI 자체를 렌더하지 않음(= 사용자가 언어 변경 불가)
   * - 기능(코드)은 살아있음
   * - 국내버전 확장 시 ENABLE_LANGUAGE_SWITCH_UI = true 로 바꾸면 아래 UI가 다시 등장
   */
  if (!ENABLE_LANGUAGE_SWITCH_UI) return null;

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
        {/* ✅ 지구본/글로벌 이미지 미노출 정책: 필요 시만 주석 해제 */}
        {/*
        <img src="/assets/global.png" alt="" width={24} height={24} />
        */}
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
