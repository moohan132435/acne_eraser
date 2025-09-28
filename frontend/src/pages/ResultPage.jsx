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

  // 결과 이미지 경로: code 우선 → image → fallback
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

  // ===== 플랫폼 판별 =====
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  // 항상 이 URL만 iOS 공유에 사용(요구사항 유지)
  const BASE_URL = "https://acne-eraser.vercel.app";

  // ===== 유틸 =====
  const fetchAsBlob = async (url) => {
    const resp = await fetch(url, { mode: "same-origin", cache: "no-cache" });
    if (!resp.ok) throw new Error("image fetch failed");
    return await resp.blob();
  };

  const fetchAsFile = async (url) => {
    const blob = await fetchAsBlob(url);
    const filename = (url.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
    const type = blob.type || "image/png";
    return new File([blob], filename, { type });
  };

  const triggerDownload = (file) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name || "acne-result.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyImageToClipboard = async (blob) => {
    // Chrome(안드) 일부에서만 지원. 실패하면 throw 하도록 둔다.
    if (!window.ClipboardItem || !navigator.clipboard?.write) {
      throw new Error("image clipboard unsupported");
    }
    const item = new ClipboardItem({ [blob.type || "image/png"]: blob });
    await navigator.clipboard.write([item]);
  };

  // ===== 공유 버튼 핸들러 =====
  const handleShare = async () => {
    if (isIOS) {
      // iOS: 파일 + URL 동시 공유 복구 (Web Share Level 2)
      try {
        const file = await fetchAsFile(imgSrc);

        // 1) 파일 + URL
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ title: "Spot Eraser", url: BASE_URL, files: [file] });
            return;
          } catch {
            // 2) 파일만 (URL 안 붙는 환경)
            await navigator.share({ title: "Spot Eraser", files: [file] });
            return;
          }
        }
      } catch {
        // 파일 생성 실패 → 아래 URL-only 단계
      }

      // 3) URL만 (최후)
      try {
        if (typeof navigator.share === "function") {
          await navigator.share({ title: "Spot Eraser", url: BASE_URL });
          return;
        }
      } catch {}
      // 공유 시트도 안되면 복사 안내
      try {
        await navigator.clipboard.writeText(BASE_URL);
        alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
      } catch {
        alert(
          lang === "ENG"
            ? "Sharing is not supported in this environment."
            : "이 브라우저에서는 공유하기가 지원되지 않습니다."
        );
      }
      return;
    }

    if (isAndroid) {
      // ANDROID: "이미지만 복사" 요구사항
      try {
        const blob = await fetchAsBlob(imgSrc);
        await copyImageToClipboard(blob);
        alert(lang === "ENG" ? "Image copied to clipboard." : "이미지를 클립보드에 복사했어요.");
        return;
      } catch {
        // 이미지 클립보드 미지원/실패 → 다운로드로 폴백(이미지 확보는 보장)
        try {
          const file = await fetchAsFile(imgSrc);
          triggerDownload(file);
          alert(
            lang === "ENG"
              ? "Image saved. You can paste it from your gallery."
              : "이미지를 저장했어요. 갤러리에서 붙여넣어 사용할 수 있어요."
          );
          return;
        } catch {
          alert(
            lang === "ENG"
              ? "Cannot copy nor save image in this browser."
              : "이 브라우저에서는 이미지 복사/저장이 지원되지 않아요."
          );
          return;
        }
      }
    }

    // 그 외 플랫폼: iOS/Android 외 환경은 URL만 공유(안내)
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Spot Eraser", url: BASE_URL });
        return;
      }
      await navigator.clipboard.writeText(BASE_URL);
      alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
    } catch {
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
