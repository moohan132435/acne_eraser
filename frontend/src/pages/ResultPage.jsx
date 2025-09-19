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
    } catch (e) {}
  }

  // code 우선 → image → fallback
  let imgSrc = "";
  if (result?.code != null) {
    imgSrc = `/assets/result-${result.code}.png`;
  } else if (result?.image) {
    imgSrc = result.image;
  } else {
    imgSrc = "/assets/result-1.png";
  }
  if (lang === "ENG") imgSrc = imgSrc.replace(/(\.png)$/i, "_eng$1");

  const retry = () => {
    const keepLang = state.lang;
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_LANG", payload: keepLang });
    nav("/");
  };

  // ===== 공유 =====
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

  // Level-2 미지원 브라우저용: OG 태그가 붙은 전용 공유 URL (이미지 미리보기 보장)
  const ogShareUrl = `${ORIGIN}/share/${code}?lang=${lang}`;

  const isSamsung = /SamsungBrowser/i.test(navigator.userAgent);

  const copyUrlFallback = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    alert(lang === "ENG" ? "Link copied to clipboard." : "링크를 클립보드에 복사했어요.");
  };

  const handleShare = async () => {
    // 1) 파일+URL 동시 공유 시도 (Web Share Level 2)
    try {
      const resp = await fetch(imgSrc, { mode: "same-origin", cache: "no-cache" });
      const blob = await resp.blob();
      const filename = (imgSrc.split("/").pop() || "acne-result.png").replace(/\?.*$/, "");
      const file = new File([blob], filename, { type: blob.type || "image/png" });

      // URL 필드는 표준, 일부 삼성 브라우저는 url 무시 → text에 URL만 넣어줌(중복 금지)
      const payloadBase = isSamsung
        ? { title: "Spot Eraser", text: ogShareUrl } // 삼성: URL을 text에만
        : { title: "Spot Eraser", url: ogShareUrl }; // 일반: URL 필드 사용

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ ...payloadBase, files: [file] });
        return;
      }
    } catch (e) {
      // 파일 준비 실패 시 아래 폴백으로
    }

    // 2) 파일 공유 불가 → URL만 공유 (OG 미리보기로 이미지가 보임)
    try {
      const payload = isSamsung
        ? { title: "Spot Eraser", text: ogShareUrl } // 삼성: text에만
        : { title: "Spot Eraser", url: ogShareUrl }; // 일반: url에만
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch (e) {
      // 계속 폴백
    }

    // 3) 최종 폴백: 링크 복사
    await copyUrlFallback(ogShareUrl);
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
