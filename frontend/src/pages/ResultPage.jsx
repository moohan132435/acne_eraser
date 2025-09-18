import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

export default function ResultPage() {
  const nav = useNavigate();
  const { state, dispatch } = useContext(QuizContext);
  const { state: navState } = useLocation();
  const lang = state.lang || "KOR";

  // 결과 복구 (Context → Router state → localStorage)
  let result = state.result || navState?.result;
  if (!result) {
    try {
      const s = localStorage.getItem("result");
      if (s) result = JSON.parse(s);
    } catch (e) {}
  }

  // ✅ 결과 이미지 경로 만들기
  // 1) BE가 code(1~8)를 주면 /assets/result-${code}.png 사용
  // 2) code 없고 image 경로만 주면 그걸 사용
  // 3) 둘 다 없으면 result-1.png
  let imgSrc = "";
  if (result?.code != null) {
    imgSrc = `/assets/result-${result.code}.png`;
  } else if (result?.image) {
    imgSrc = result.image;
  } else {
    imgSrc = "/assets/result-1.png";
  }
  // ENG면 _eng 붙이기
  if (lang === "ENG") {
    imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");
  }

  // (원하면 콘솔에서 code 확인)
  // console.debug("RESULT:", result); console.debug("code:", result?.code, "img:", imgSrc);

  // 다시하기: 현재 언어 유지한 채 홈으로
  const retry = () => {
    const keepLang = state.lang;
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_LANG", payload: keepLang });
    nav("/");
  };

  // 공유: Text는 비움(이미지 + URL만)
  const shareUrl = "https://acne-eraser.vercel.app/";
  const handleShare = async () => {
    try {
      const resp = await fetch(imgSrc, { mode: "same-origin", cache: "no-cache" });
      const blob = await resp.blob();
      const filename = (imgSrc.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
      const file = new File([blob], filename, { type: blob.type || "image/png" });

      const basePayload = { title: "Spot Eraser", url: shareUrl };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ ...basePayload, files: [file] });
        return;
      }
      if (navigator.share) {
        await navigator.share(basePayload);
        return;
      }
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
          alt={`result ${result?.code ?? ""}`}
          style={{ width: "100%", borderRadius: 12 }}
          loading="lazy"
        />

        {/* 버튼: 모바일 세로 스택 */}
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
