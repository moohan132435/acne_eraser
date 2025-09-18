import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

export default function ResultPage() {
  const nav = useNavigate();
  const { state, dispatch } = useContext(QuizContext);
  const { state: navState } = useLocation();
  const lang = state.lang || "KOR";

  // 결과 복구
  let result = state.result || navState?.result;
  if (!result) {
    try {
      const s = localStorage.getItem("result");
      if (s) result = JSON.parse(s);
    } catch (e) {}
  }

  // 지금 화면의 결과 이미지 (BE가 image를 준다고 가정; 없으면 1번)
  let imgSrc = result?.image || "/assets/result-1.png";
  if (lang === "ENG") {
    imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");
  }

  // 홈으로
 const retry = () => {
    const keepLang = state.lang;                 // 현재 언어 보관
    dispatch({ type: "RESET" });                 // 상태 초기화
    dispatch({ type: "SET_LANG", payload: keepLang }); // 언어 복원
    nav("/");                                    // 홈으로 이동
  };

  // 공유
  const shareUrl = "https://acne-eraser.vercel.app/";
  const shareText =
    lang === "ENG"
      ? `Check your acne type - ${shareUrl}`
      : `당신의 여드름 타입을 확인하세요 - ${shareUrl}`;

  const handleShare = async () => {
    const basePayload = { title: "Spot Eraser", text: shareText, url: shareUrl };
    try {
      // 현재 표시 중인 이미지 그대로 파일 공유 시도
      const resp = await fetch(imgSrc, { mode: "same-origin", cache: "no-cache" });
      const blob = await resp.blob();
      const filename = (imgSrc.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
      const file = new File([blob], filename, { type: blob.type || "image/png" });
      const withFile = { ...basePayload, files: [file] };

      if (navigator.canShare && navigator.canShare({ files: withFile.files })) {
        await navigator.share(withFile);
        return;
      }
      if (navigator.share) {
        await navigator.share(basePayload); // 파일 공유 불가 → 텍스트+URL만
        return;
      }
      await navigator.clipboard.writeText(shareText);
      alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
      window.open(shareUrl, "_blank");
    } catch (e) {
      try {
        if (navigator.share) {
          await navigator.share(basePayload);
          return;
        }
      } catch (_) {}
      try {
        await navigator.clipboard.writeText(shareText);
        alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
      } catch (_) {}
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">Spot Eraser</div>
        <LanguageSwitcher />
      </header>

      <div className="result-wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* <h1 className="page-title">진단 결과</h1> */}
        <img
          src={imgSrc}
          alt="result"
          style={{ width: "100%", borderRadius: 12 }}
          loading="lazy"
        />

        {/* 버튼: 모바일 친화 세로 스택 */}
        <div
          className="result-actions"
          style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}
        >
          <a
            className="btn btn-lg insta-btn"
            href="https://www.instagram.com/pgb_global/"
            target="_blank"
            rel="noreferrer"
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            {lang === "ENG" ? "Visit INSTAGRAM" : "INSTAGRAM"}
          </a>

          <button className="btn btn-lg share-btn" onClick={handleShare} style={{ width: "100%" }}>
            {/* <img src="/assets/share-icon.png" alt="" style={{width:18,height:18,verticalAlign:"-3px",marginRight:8}} /> */}
            {lang === "ENG" ? "Share" : "공유하기"}
          </button>

          <button className="btn btn-lg retry-btn" onClick={retry} style={{ width: "100%" }}>
            {lang === "ENG" ? "Retry" : "다시하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
