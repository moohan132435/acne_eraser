// src/pages/SharePage.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function SharePage() {
  const { slug = "" } = useParams();
  const nav = useNavigate();

  const valid = /^result-\d+$/.test(slug);

  const langParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("lang")
      : null;
  const lang = langParam === "ENG" ? "ENG" : "KOR";

  const base = `/assets/${slug}.png`;
  const imgSrc = lang === "ENG" ? base.replace(/\.png$/i, "_eng.png") : base;

  const [loaded, setLoaded] = React.useState(false);
  const [error, setError]   = React.useState(false);

  React.useEffect(() => {
    if (!valid) return;
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
    img.src = imgSrc;
    return () => { img.onload = null; img.onerror = null; };
  }, [imgSrc, valid]);

  React.useEffect(() => {
    if (!valid) return;
    document.title = "Spot Eraser - Result";
    const setOg = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const absImg = typeof window !== "undefined" ? `${window.location.origin}${imgSrc}` : imgSrc;
    const url    = typeof window !== "undefined" ? window.location.href : "";
    setOg("og:title", "Spot Eraser - Result");
    setOg("og:type", "website");
    setOg("og:image", absImg);
    setOg("og:url", url);
  }, [imgSrc, valid]);

  if (!valid) {
    return (
      <div className="page" style={{ padding: 16 }}>
        <div className="result-wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontWeight: 700 }}>
            {lang === "ENG" ? "Invalid share link." : "잘못된 공유 링크입니다."}
          </p>
          <div style={{ display:"flex", justifyContent:"center", marginTop: 12 }}>
            <button className="btn btn-lg" onClick={() => nav("/")}>
              {lang === "ENG" ? "Go to Start" : "처음으로"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: 16 }}>
      <div className="result-wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
        {!loaded && !error && (
          <div style={{ textAlign:"center", padding:"24px 0", color:"#64748b" }}>
            {lang === "ENG" ? "Loading image..." : "이미지 불러오는 중..."}
          </div>
        )}
        {error ? (
          <div style={{ textAlign:"center", padding:"24px 0", color:"#ef4444" }}>
            {lang === "ENG" ? "Failed to load image." : "이미지를 불러오지 못했어요."}
          </div>
        ) : (
          <img
            src={imgSrc}
            alt="result-share"
            style={{ width:"100%", display: loaded ? "block" : "none", borderRadius: 12 }}
            loading="eager"
          />
        )}

        <div style={{ marginTop: 16, display:"flex", justifyContent:"center" }}>
          <button className="btn btn-lg" onClick={() => nav("/")}>
            {lang === "ENG" ? "How old is my skin?" : "내 피부 나이는 몇살일까?"}
          </button>
        </div>
      </div>
    </div>
  );
}
