import React from "react";
import { useLocation } from "react-router-dom";

export default function GoAmazon() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isDebug = params.get("debug") === "1";

  const AMAZON_URL = "https://www.amazon.com/dp/B0G6JF3BL5";
  const dest = AMAZON_URL; // 필요하면 location.search 넘겨도 됨

  React.useEffect(() => {
    // Event Builder에서 감지용으로 page 한 번 더
    try {
      if (window.ttq && typeof window.ttq.page === "function") window.ttq.page();
    } catch {}

    if (isDebug) return; // ✅ debug=1이면 리다이렉트 중지

    const timer = setTimeout(() => window.location.replace(dest), 800);
    return () => clearTimeout(timer);
  }, [isDebug, dest]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Redirecting to Amazon…</h2>
      {isDebug ? (
        <>
          <p>Debug mode: redirect paused for Event Builder.</p>
          <a href={dest}>Go to Amazon</a>
        </>
      ) : (
        <p>Please wait…</p>
      )}
    </div>
  );
}
