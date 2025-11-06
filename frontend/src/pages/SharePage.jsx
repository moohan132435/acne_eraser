import React, { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function SharePage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const loc = useLocation();

  const params = new URLSearchParams(loc.search);  // ✅ 해시 라우팅에서도 정상
  const lang = params.get("lang") === "ENG" ? "ENG" : "KOR";

  const base = `/assets/${slug}.png`;
  const imgSrc = lang === "ENG" ? base.replace(/\.png$/i, "_eng.png") : base;

  useEffect(() => {
    document.title = "Spot Eraser - Result";
    const ensure = (prop) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", prop);
        document.head.appendChild(el);
      }
      return el;
    };
    ensure("og:title").setAttribute("content", "Spot Eraser - Result");
    ensure("og:type").setAttribute("content", "website");
    ensure("og:image").setAttribute("content", `${location.origin}${imgSrc}`);
    ensure("og:url").setAttribute("content", location.href);
  }, [imgSrc]);

  return (
    <div className="page" style={{ padding: 16 }}>
      <div className="result-wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
        <img
          src={imgSrc}
          alt="result-share"
          style={{ width: "100%", display: "block", borderRadius: 12 }}
          loading="lazy"
        />
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
          <button className="btn btn-lg" onClick={() => nav("/")}>
            {lang === "ENG" ? "How old is my skin?" : "내 피부 나이는 몇살일까?"}
          </button>
        </div>
      </div>
    </div>
  );
}
