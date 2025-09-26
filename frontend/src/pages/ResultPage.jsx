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

  // ===== 공유 보조 유틸 (안드로이드 대응: clipboard execCommand 폴백) =====
  const isSamsung = /SamsungBrowser/i.test(navigator.userAgent);

  // 클립보드 복사 (navigator.clipboard 실패/미지원 시 execCommand 폴백)
  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      // 무시하고 execCommand 폴백 시도
    }
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

  // 공유 URL: (OG 전용 URL이 있다면 그걸 쓰는 게 이미지 미리보기 호환성↑)
  const ORIGIN =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://acne-eraser.vercel.app";
  const code =
    result?.code ??
    (() => {
      const m = imgSrc.match(/result-(\d+)/);
      return m ? parseInt(m[1], 10) : 1;
    })();
  const shareUrl = `${ORIGIN}/share/${code}?lang=${lang}`;

  // 공유: 이미지(+가능하면 파일) + URL / 미지원 시 링크 복사
  const handleShare = async () => {
    // 1) 파일+URL 동시 공유(Web Share Level 2) 시도
    try {
      const resp = await fetch(imgSrc, { mode: "same-origin", cache: "no-cache" });
      const blob = await resp.blob();
      const filename = (imgSrc.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
      const file = new File([blob], filename, { type: blob.type || "image/png" });

      // 삼성 브라우저는 url 필드를 무시하는 사례가 있어 text에만 URL 전달
      const basePayload = isSamsung
        ? { title: "Spot Eraser", text: shareUrl }
        : { title: "Spot Eraser", url: shareUrl };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ ...basePayload, files: [file] });
        return;
      }
    } catch (_) {
      // 파일 준비 실패 → 아래 단계로 폴백
    }

    // 2) 파일 공유 불가: URL만 공유 (표준/삼성 분기)
    try {
      const payload = isSamsung
        ? { title: "Spot Eraser", text: shareUrl } // 삼성: text에만 URL
        : { title: "Spot Eraser", url: shareUrl }; // 일반: url 필드 사용
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch (_) {
      // 아래 폴백
    }

    // 3) 최종 폴백: URL을 클립보드 복사 (execCommand까지 시도)
    const copied = await copyToClipboard(shareUrl);
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
          alt={`result ${code}`}
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
            {lang === "ENG" ? "Start Acne DM" : "여드름 상담 시작(DM)"}
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
