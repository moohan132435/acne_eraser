
import React, { useContext, useState, useEffect, useRef } from "react";
import { QuizContext } from "../context/QuizContext.jsx";

export default function LanguageSwitcher(){
  const { state, dispatch } = useContext(QuizContext);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const setLang = (lang) => {
    dispatch({ type: "SET_LANG", payload: lang });
    setOpen(false);
  };

  return (
    <div className="lang-switcher" ref={ref}>
      <button className="icon-btn" aria-label="language" title="Language" onClick={() => setOpen((v)=>!v)}>
        {/* globe icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M2 12h20M12 2c3 3.5 3 16 0 20M12 2c-3 3.5-3 16 0 20" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {open && (
        <div className="lang-menu">
          <button className={`lang-item ${state.lang==='KOR'?'active':''}`} onClick={() => setLang('KOR')}>KOR</button>
          <button className={`lang-item ${state.lang==='ENG'?'active':''}`} onClick={() => setLang('ENG')}>ENG</button>
        </div>
      )}
    </div>
  );
}
