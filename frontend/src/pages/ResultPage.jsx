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
    } catch {}
  }

  // 이미지 경로: code 우선 → image → fallback
  let imgSrc = "";
  if (result?.code != null) {
    imgSrc = `/assets/result-${result.code}.png`;
  } else if (result?.image) {
    imgSrc = result.image;
  } else {
    imgSrc = "/assets/result-1.png";
  }
  if (lang === "ENG") imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");

  // 다시하기: 언어 유지
  const retry = () => {
    const keepLang = state.lang;
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_LANG", payload: keepLang });
    nav("/");
  };

  // ===== 공유 로직 =====
  // 요구사항: 어떤 환경이든 URL은 항상 이 값만 사용
  const BASE_URL = "https://acne-eraser.vercel.app";

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);

  // 클립보드 복사 (clipboard API 실패 시 execCommand 폴백)
  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    // 아이폰: 가능하면 파일+URL 동시 공유 유지
    if (isIOS) {
      try {
        const resp = await fetch(imgSrc, { mode: "same-origin", cache: "no-cache" });
        const blob = await resp.blob();
        const filename = (imgSrc.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
        const file = new File([blob], filename, { type: blob.type || "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "Spot Eraser", url: BASE_URL, files: [file] });
          return;
        }
      } catch {
        // 파일 준비 실패 시 아래로 폴백
      }
      try {
        if (navigator.share) {
          await navigator.share({ title: "Spot Eraser", url: BASE_URL });
          return;
        }
      } catch {
        // 아래로 폴백
      }
      const copied = await copyToClipboard(BASE_URL);
      alert(copied
        ? (lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.")
        : (lang === "ENG" ? "Sharing is not supported in this environment." : "이 브라우저에서는 공유하기가 지원되지 않습니다.")
      );
      return;
    }

    // 안드로이드 계열
    try {
      // 삼성 브라우저는 url 무시 사례 → text에만 BASE_URL 넣기
      const payload = isSamsung
        ? { title: "Spot Eraser", text: BASE_URL }
        : { title: "Spot Eraser", url: BASE_URL };

      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      // 아래로 폴백
    }

    // 최종 폴백: 복사 (항상 BASE_URL)
    const copied = await copyToClipboard(BASE_URL);
    alert(copied
      ? (lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.")
      : (lang === "ENG" ? "Sharing is not supported in this environment." : "이 브라우저에서는 공유하기가 지원되지 않습니다.")
    );
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">Spot Eraser</div>
        <LanguageSwitcher />
      </header>

      <div className="result-wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
        <img
          src={imgSrc}
          alt={`result ${result?.code ?? ""}`}
          style={{ width: "100%", borderRadius: 12 }}
          loading="lazy"
        />

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
            {lang === "ENG" ? "Message on Instagram" : "인스타 DM 상담하기"}
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
