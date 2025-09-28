import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

export default function ResultPage() {
  const nav = useNavigate();
  const { state, dispatch } = useContext(QuizContext);
  const { state: navState } = useLocation();
  const lang = state.lang || "KOR";

  // ===== 결과 복구 =====
  let result = state.result || navState?.result;
  if (!result) {
    try {
      const s = localStorage.getItem("result");
      if (s) result = JSON.parse(s);
    } catch {}
  }

  // 결과 이미지: code 우선 → image → fallback
  let imgSrc =
    result?.code != null
      ? `/assets/result-${result.code}.png`
      : result?.image || "/assets/result-1.png";
  if (lang === "ENG") imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");

  // 다시하기(언어 유지)
  const retry = () => {
    const keepLang = state.lang;
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_LANG", payload: keepLang });
    nav("/");
  };

  // ===== 플랫폼 판별 & 상수 =====
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  const BASE_URL = "https://acne-eraser.vercel.app"; // 항상 이 URL만 공유/복사

  // ===== 유틸 =====
  const fetchAsFile = async (url) => {
    const resp = await fetch(url, { mode: "same-origin", cache: "no-cache" });
    if (!resp.ok) throw new Error("image fetch failed");
    const blob = await resp.blob();
    const filename = (url.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
    return new File([blob], filename, { type: blob.type || "image/png" });
  };

  const copyUrl = async (url) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
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

  // ===== 공유 버튼 =====
  const handleShare = async () => {
    // iOS: 이미지+URL 공유 유지 (가능 시)
    if (isIOS) {
      try {
        const file = await fetchAsFile(imgSrc);
        if (navigator.canShare && navigator.canShare({ files: [file] }) && typeof navigator.share === "function") {
          await navigator.share({ title: "Spot Eraser", url: BASE_URL, files: [file] });
          return;
        }
      } catch {
        // 파일 준비 실패 → 아래 단계
      }
      try {
        if (typeof navigator.share === "function") {
          await navigator.share({ title: "Spot Eraser", url: BASE_URL });
          return;
        }
      } catch (err) {
        if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return;
      }
      // 최종: URL 복사
      const copied = await copyUrl(BASE_URL);
      alert(
        copied
          ? (lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.")
          : (lang === "ENG" ? "Sharing is not supported in this environment." : "이 브라우저에서는 공유하기가 지원되지 않습니다.")
      );
      return;
    }

    // Android(크롬 포함) 및 기타: 요구사항대로 "URL만 복사"
    const copied = await copyUrl(BASE_URL);
    alert(
      copied
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
