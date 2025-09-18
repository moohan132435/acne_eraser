import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

export default function ResultPage() {
  const nav = useNavigate();
  const { state, dispatch } = useContext(QuizContext);
  const { state: navState } = useLocation();
  const lang = state.lang || "KOR";

  // 결과 복구 (Context → nav.state → localStorage)
  let result = state.result || navState?.result;
  if (!result) {
    try {
      const s = localStorage.getItem("result");
      if (s) result = JSON.parse(s);
    } catch (e) {}
  }

  // 현재 화면에 띄우는 결과 이미지 경로
  let imgSrc = result?.image || "/assets/result-1.png";
  if (lang === "ENG") {
    imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");
  }

  // 다시하기: 현재 언어 유지한 채 홈으로
  const retry = () => {
    const keepLang = state.lang;
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_LANG", payload: keepLang });
    nav("/");
  };

  // 공유: Text는 아무것도 보내지 않음. (이미지 + URL만)
  const shareUrl = "https://acne-eraser.vercel.app/";

  const handleShare = async () => {
    try {
      // 결과 이미지 → Blob → File
      const resp = await fetch(imgSrc, { mode: "same-origin", cache: "no-cache" });
      const blob = await resp.blob();
      const filename = (imgSrc.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
      const file = new File([blob], filename, { type: blob.type || "image/png" });

      // URL은 url 필드로만 전달, text는 비움
      const basePayload = { title: "Spot Eraser", url: shareUrl };

      // 파일 공유 지원
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ ...basePayload, files: [file] });
        return;
      }

      // 파일 공유 미지원 → URL만 공유
      if (navigator.share) {
        await navigator.share(basePayload); // text 없음
        return;
      }

      // 더 구형 브라우저 → URL만 클립보드 복사
      await navigator.clipboard.writeText(shareUrl);
      alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
    } catch (e) {
      try {
        if (navigator.share) {
          await navigator.share({ title: "Spot Eraser", url: shareUrl });
          return;
        }
      } catch (_) {}
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
      } catch (_) {}
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
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 16,
          }}
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

          <button
            className="btn btn-lg share-btn"
            onClick={handleShare}
            style={{ width: "100%" }}
          >
            {lang === "ENG" ? "Share" : "공유하기"}
          </button>

          <button
            className="btn btn-lg retry-btn"
            onClick={retry}
            style={{ width: "100%" }}
          >
            {lang === "ENG" ? "Retry" : "다시하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
