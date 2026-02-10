import React from "react";
import { useLocation } from "react-router-dom";

/**
 * /go/amazon 으로 들어오면:
 * 1) (선택) TikTok Pixel 이벤트 1회 전송
 * 2) 짧게 기다렸다가 Amazon으로 redirect
 *
 * 전제: TikTok Pixel base code가 index.html에 이미 설치되어 있어야 함
 */
export default function GoAmazon() {
    const location = useLocation();

    // ✅ 여기 Amazon 목적지 URL 넣기 (원하면 .env로 빼도 됨)
    const AMAZON_URL = "https://www.amazon.com/dp/B0G6JF3BL5";

    React.useEffect(() => {
        // URL에 붙은 파라미터(utm 등) 유지해서 Amazon으로 넘기고 싶다면:
        const qs = location.search || "";
        const dest = AMAZON_URL + qs;

        // (선택) TikTok Pixel 커스텀 이벤트 전송
        // 픽셀 스크립트가 로딩되기 전일 수 있으니 try/catch
        try {
            if (window.ttq && typeof window.ttq.track === "function") {
                // 목적은 "우리 도메인에 들어왔음"을 이벤트로 남기는 것
                window.ttq.track("ClickButton", {
                    content_name: "GoAmazonRedirect",
                    destination: "amazon",
                    dest_url: dest,
                });
            }
        } catch (e) {
            // 무시 (광고차단/네트워크 상황에서 실패할 수 있음)
        }

        // 너무 빠르면 픽셀 이벤트가 못 나갈 수도 있어서 300~800ms 정도 대기 추천
        const timer = setTimeout(() => {
            // replace: 뒤로가기 시 중간페이지로 다시 안 돌아오게
            window.location.replace(dest);
        }, 500);

        return () => clearTimeout(timer);
    }, [location.search]);

    return (
        <div style={{ padding: 24, fontFamily: "sans-serif" }}>
            <h2>Redirecting…</h2>
            <p>Amazon으로 이동 중입니다.</p>
            <p style={{ opacity: 0.6, fontSize: 12 }}>
                If you are not redirected,{" "}
                <a href={AMAZON_URL} rel="noreferrer">
                    click here
                </a>
                .
            </p>
        </div>
    );
}
