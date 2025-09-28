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

  // ===== 공유 설정 =====
  const BASE_URL = "https://acne-eraser.vercel.app";

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  // Android Chrome heuristic (삼성/엣지/오페라/기타 제외)
  const isAndroidChrome =
    isAndroid &&
    /\bChrome\/\d+/.test(ua) &&
    !/SamsungBrowser|EdgA|OPR|UCBrowser|MiuiBrowser|DuckDuckGo|YaBrowser/i.test(ua);

  // 유틸: 이미지 파일 준비
  const fetchAsFile = async (url) => {
    const resp = await fetch(url, { mode: "same-origin", cache: "no-cache" });
    if (!resp.ok) throw new Error("image fetch failed");
    const blob = await resp.blob();
    const filename = (url.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
    return new File([blob], filename, { type: blob.type || "image/png" });
  };

  // 유틸: URL 복사 (clipboard → execCommand 폴백)
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

  const handleShare = async () => {
    // 1) 파일 + URL 동시 공유 시도 (가능한 모든 환경에서 최우선)
    try {
      const file = await fetchAsFile(imgSrc);

      if (navigator.canShare && navigator.canShare({ files: [file] }) && typeof navigator.share === "function") {
        if (isAndroidChrome) {
          // ✅ Android Chrome에서 일부 타겟앱이 url을 무시하는 문제 보완:
          //    text에도 동일 URL을 넣어 전달 (중복 우려는 Android Chrome에만 한정)
          await navigator.share({ title: "Spot Eraser", url: BASE_URL, text: BASE_URL, files: [file] });
        } else if (isIOS) {
          // iOS: 중복 방지 위해 url만 (text는 비움)
          await navigator.share({ title: "Spot Eraser", url: BASE_URL, files: [file] });
        } else {
          // 기타: 기본 조합
          await navigator.share({ title: "Spot Eraser", url: BASE_URL, files: [file] });
        }
        return;
      }
    } catch (e) {
      // 파일 생성/공유 실패 → 아래 단계로
    }

    // 2) 파일 공유가 막힌 환경 → URL만 네이티브 공유 시트(삼성 제외) 또는 복사
    try {
      if (typeof navigator.share === "function" && !isSamsung) {
        if (isAndroidChrome) {
          // Android Chrome: url + text 모두 전달 (일부 타겟앱 보정)
          await navigator.share({ title: "Spot Eraser", url: BASE_URL, text: BASE_URL });
        } else {
          await navigator.share({ title: "Spot Eraser", url: BASE_URL });
        }
        return;
      }
    } catch (err) {
      // 사용자가 취소한 경우는 조용히 종료
      if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return;
    }

    // 3) 최종 폴백: URL 복사 (삼성/인앱 등)
    const copied = await copyUrl(BASE_URL);
    if (copied) {
      alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
    } else {
      alert(
        lang === "ENG"
          ? "Sharing is not supported in this environment."
          : "이 브라우저에서는 공유하기가 지원되지 않습니다."
      );
    }
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
