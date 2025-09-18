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

  // 다시하기: 언어 유지 보장
  const retry = () => {
    const keepLang = state.lang;
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_LANG", payload: keepLang });
    nav("/");
  };

  // 공유하기 (이미지 + 텍스트 + URL)
  const shareUrl = "https://acne-eraser.vercel.app/";
  // ✅ 텍스트에는 URL을 넣지 않는다 (중복 방지)
  const shareTextNoUrl =
    lang === "ENG"
      ? "Check your acne type"
      : "당신의 여드름 타입을 확인하세요";

  const handleShare = async () => {
    // navigator.share에 넘길 공통 페이로드: URL은 url 필드로만!
    const basePayload = { title: "Spot Eraser", text: shareTextNoUrl, url: shareUrl };

    try {
      // 현재 표시 중인 결과 이미지를 파일로 만들어 파일 공유 시도
      const resp = await fetch(imgSrc, { mode: "same-origin", cache: "no-cache" });
      const blob = await resp.blob();
      const filename = (imgSrc.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
      const file = new File([blob], filename, { type: blob.type || "image/png" });

      // 파일 공유 가능?
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ ...basePayload, files: [file] });
        return;
      }

      // 파일 공유 불가 → 텍스트+URL만 공유 (URL은 url 필드에만)
      if (navigator.share) {
        await navigator.share(basePayload);
        return;
      }

      // 더 구형 브라우저 → 클립보드 복사 (여기서는 문구 + URL을 한 번만 포함)
      await navigator.clipboard.writeText(`${shareTextNoUrl} - ${shareUrl}`);
      alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
      // window.open(shareUrl, "_blank"); // ⛔️ 중복 유발 소지 → 제거
    } catch (e) {
      // 오류 시에도 URL 한 번만 포함
      try {
        if (navigator.share) {
          await navigator.share(basePayload);
          return;
        }
      } catch (_) {}
      try {
        await navigator.clipboard.writeText(`${shareTextNoUrl} - ${shareUrl}`);
        alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
      } catch (_) {}
      // window.open(shareUrl, "_blank"); // ⛔️ 제거
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
            {/* <img src="/assets/share-icon.png" alt="" style={{width:18, height:18, verticalAlign:"-3px", marginRight:8}} /> */}
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
