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

  // 이미지 경로: code 우선 → image → fallback
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

  // ===== 공유 유틸 =====
  const BASE_URL = "https://acne-eraser.vercel.app"; // 요구사항: 언제나 이 URL만 공유/복사

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS      = /iPad|iPhone|iPod/i.test(ua);
  const isSamsung  = /SamsungBrowser/i.test(ua);
  const isInApp    = /(KAKAOTALK|FBAN|FBAV|Instagram|Line|NAVER|Daum|Whale|Electron)/i.test(ua);

  const fetchAsFile = async (url) => {
    const resp = await fetch(url, { mode: "same-origin", cache: "no-cache" });
    const blob = await resp.blob();
    const filename = (url.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
    return new File([blob], filename, { type: blob.type || "image/png" });
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

  const tryShareFilesAndUrl = async (file) => {
    // 조합 1: files + url
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Spot Eraser", url: BASE_URL, files: [file] });
        return true;
      }
    } catch {}
    // 조합 2: files + text (삼성 일부 버전이 url을 무시하는 경우)
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Spot Eraser", text: BASE_URL, files: [file] });
        return true;
      }
    } catch {}
    // 조합 3: files 만 (일부 기기에서 공유 시트가 뜨고 사용자가 링크를 수동 추가)
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Spot Eraser", files: [file] });
        return true;
      }
    } catch {}
    return false;
  };

  const handleShare = async () => {
    // 0) 파일 준비(이미지)
    let file = null;
    try {
      file = await fetchAsFile(imgSrc);
    } catch {
      // 파일 생성 실패 시, 아래 폴백으로(자동 저장 없이 URL만 공유/복사)
    }

    // 1) iOS / Android Chrome 등: files+url 우선 시도
    if (!isInApp && typeof navigator.share === "function") {
      if (file) {
        const ok = await tryShareFilesAndUrl(file);
        if (ok) return;
      }
      // 파일 공유가 막힌 경우: URL만 공유 (그래도 네이티브 공유 시트)
      try {
        // 삼성 브라우저는 url 무시 사례 → text로도 한 번 더 시도
        if (!isSamsung) {
          await navigator.share({ title: "Spot Eraser", url: BASE_URL });
        } else {
          await navigator.share({ title: "Spot Eraser", text: BASE_URL });
        }
        return;
      } catch (err) {
        // 유저 취소 시 아무 것도 하지 않음
        if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return;
        // 아래 폴백 계속
      }
    }

    // 2) 인앱/삼성 등 파일 공유 미지원 → 2-step 폴백
    //    (1) 이미지를 자동 저장시켜주고
    //    (2) URL 공유 시트를 열어 사용자가 방금 저장한 이미지를 선택해 붙이게 함
    if (file) {
      try {
        triggerDownload(file); // 자동 저장
      } catch {}
    }

    // 공유 시트(가능하면) 혹은 복사
    try {
      if (typeof navigator.share === "function") {
        // 삼성: text, 일반: url
        if (!isSamsung) {
          await navigator.share({ title: "Spot Eraser", url: BASE_URL });
        } else {
          await navigator.share({ title: "Spot Eraser", text: BASE_URL });
        }
        // 안내 토스트
        if (file) {
          alert(
            lang === "ENG"
              ? "Image saved. In the share sheet, attach the saved image."
              : "이미지를 저장했어요. 공유 창에서 방금 저장된 이미지를 첨부해 주세요."
          );
        }
        return;
      }
    } catch (err) {
      if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return;
    }

    // 3) 최종 폴백: 링크 복사 + 안내
    const copied = await copyToClipboard(BASE_URL);
    if (copied) {
      alert(
        (lang === "ENG"
          ? "Link copied. If you also need the image, use the saved image from your gallery."
          : "링크를 복사했어요. 이미지도 필요하다면 갤러리의 저장된 이미지를 함께 보내 주세요.")
      );
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
