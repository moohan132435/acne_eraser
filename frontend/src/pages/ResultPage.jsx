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
    } catch {}
  }

  // 결과 이미지: code 우선, 없으면 image, 그래도 없으면 1번
  let imgSrc = result?.code != null
    ? `/assets/result-${result.code}.png`
    : (result?.image || "/assets/result-1.png");
  if (lang === "ENG") imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");

  // 다시하기(언어 유지)
  const retry = () => {
    const keepLang = state.lang;
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_LANG", payload: keepLang });
    nav("/");
  };

  // ===== 공유 설정 =====
  // ⚠️ 요구사항: 어떤 경우에도 이 BASE_URL만 공유/복사한다.
  const BASE_URL = "https://acne-eraser.vercel.app";

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  const isInApp = /(KAKAOTALK|FBAN|FBAV|Instagram|Line|NAVER|Daum)/i.test(ua);

  // 클립보드(clipboard API → execCommand 폴백)
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
    // ===== iOS: 파일+URL 시도 → URL만 → 복사 =====
    if (isIOS) {
      try {
        // 파일+URL (Web Share Level 2)
        const resp = await fetch(imgSrc, { mode: "same-origin", cache: "no-cache" });
        const blob = await resp.blob();
        const filename = (imgSrc.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
        const file = new File([blob], filename, { type: blob.type || "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "Spot Eraser", url: BASE_URL, files: [file] });
          return;
        }
      } catch {
        /* 파일 준비 실패 → 아래 단계 */
      }
      try {
        if (typeof navigator.share === "function") {
          await navigator.share({ title: "Spot Eraser", url: BASE_URL });
          return;
        }
      } catch (err) {
        // 유저가 취소(AbortError)한 경우 등은 그냥 종료
        if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return;
      }
      const copied = await copyToClipboard(BASE_URL);
      alert(
        copied
          ? (lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.")
          : (lang === "ENG" ? "Sharing is not supported in this environment." : "이 브라우저에서는 공유하기가 지원되지 않습니다.")
      );
      return;
    }

    // ===== ANDROID: 네이티브 공유 시트 우선 =====
    // 인앱/삼성 등 케이스: url 필드 무시 → text에만 BASE_URL, 그 외는 url 사용
    if (typeof navigator.share === "function" && !isInApp) {
      try {
        const payload = isSamsung
          ? { title: "Spot Eraser", text: BASE_URL } // 삼성: text만 안전
          : { title: "Spot Eraser", url: BASE_URL }; // 일반 크롬: url 사용
        await navigator.share(payload);
        return;
      } catch (err) {
        // 유저가 취소(AbortError)면 복사로 가지지 말고 그냥 종료
        if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return;
        // 그 외 에러일 때만 복사 폴백
      }
    }

    // ===== 최종 폴백(안드로이드·인앱): BASE_URL만 복사 =====
    const copied = await copyToClipboard(BASE_URL);
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
