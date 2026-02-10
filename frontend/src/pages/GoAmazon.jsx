import React from "react";
import { useLocation } from "react-router-dom";

export default function GoAmazon() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isDebug = params.get("debug") === "1";

  // ✅ 목적지 Amazon URL
  const AMAZON_URL = "https://www.amazon.com/dp/B0G6JF3BL5";

  // (선택) 쿼리스트링을 Amazon으로 넘기고 싶으면 아래처럼 사용할 수 있어.
  // 다만 debug=1 같은 건 Amazon으로 넘기기 싫으면 필터링해야 함.
  const dest = AMAZON_URL;

  React.useEffect(() => {
    // SPA에서 page view가 1번만 찍히는 경우가 있어, 진입 시 한번 더 호출(권장)
    try {
      if (window.ttq && typeof window.ttq.page === "function") {
        window.ttq.page();
      }
    } catch (e) {
      // 광고차단 등으로 실패할 수 있으니 무시
    }

    // (선택) 이벤트도 하나 찍어두면 Events Manager에서 확인하기 좋음
    try {
      if (window.ttq && typeof window.ttq.track === "function") {
        window.ttq.track("ClickButton", {
          content_name: "GoAmazonRedirect",
          destination: "amazon",
          dest_url: dest,
          debug_mode: isDebug ? 1 : 0,
        });
      }
    } catch (e) {}

    // ✅ debug=1 이면 10초 후 자동 이동 (Event Builder 확인 시간 확보)
    if (isDebug) {
      const t = setTimeout(() => window.location.replace(dest), 1000000);
      return () => clearTimeout(t);
    }

    // ✅ 일반 모드: 빠르게 이동
    const timer = setTimeout(() => window.location.replace(dest), 800);
    return () => clearTimeout(timer);
  }, [isDebug, dest]);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Redirecting to Amazon…</h2>

      {isDebug ? (
        <>
          <p>Debug mode: redirect will happen in 10 seconds for Event Builder.</p>
          <p style={{ opacity: 0.7, fontSize: 12 }}>
            If you want to go now, click below:
          </p>
          <a href={dest} rel="noreferrer">
            Go to Amazon
          </a>
        </>
      ) : (
        <p>Please wait…</p>
      )}
    </div>
  );
}
