// frontend/src/pages/ResultPage.jsx

import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

export default function ResultPage() {
  const nav = useNavigate();
  const { state, dispatch } = useContext(QuizContext);
  const { state: navState } = useLocation();
  const lang = state.lang || "KOR";

  let result = state.result || navState?.result;
  if (!result) {
    try {
      const s = localStorage.getItem("result");
      if (s) result = JSON.parse(s);
    } catch (e) {}
  }

  let imgSrc = result?.image || "/assets/result-1.png";
  if (lang === "ENG") imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");

  // ✅ 다시하기 → 초기화면으로
  const retry = () => {
    dispatch({ type: "RESET" });
    nav("/"); // <- 여기!
  };

  const shareText =
    lang === "ENG"
      ? "Check your acne type - https://acne-eraser.vercel.app/"
      : "당신의 여드름 타입을 확인하세요 - https://acne-eraser.vercel.app/";

  const handleShare = async () => {
    const payload = {
      title: "Spot Eraser",
      text: shareText,
      url: "https://acne-eraser.vercel.app/",
    };
    if (navigator.share) {
      try { await navigator.share(payload); } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
      } catch (e) {}
      window.open("https://acne-eraser.vercel.app/", "_blank");
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">Spot Eraser</div>
        <LanguageSwitcher />
      </header>

      <div className="result-wrap">
        {/* <h1 className="page-title">진단 결과</h1> */}
        <img src={imgSrc} alt="result" style={{ width: "100%", borderRadius: 12 }} loading="lazy" />

        <div className="result-actions">
          <a
            className="btn btn-lg insta-btn"
            href="https://www.instagram.com/pgb_global/"
            target="_blank"
            rel="noreferrer"
          >
            {lang === "ENG" ? "Visit INSTAGRAM" : "INSTAGRAM"}
          </a>

          <button className="btn btn-lg share-btn" onClick={handleShare}>
            {/* <img src="/assets/share-icon.png" alt="" style={{width:18,height:18,verticalAlign:"-3px",marginRight:8}} /> */}
            {lang === "ENG" ? "Share" : "공유하기"}
          </button>

          <button className="btn btn-lg retry-btn" onClick={retry}>
            {lang === "ENG" ? "Retry" : "다시하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
