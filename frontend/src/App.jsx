// src/App.jsx
import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// 페이지 lazy 로드 (안전하게 default export 미스매치도 흡수)
const IntroPage  = React.lazy(() => import("./pages/IntroPage.jsx"));
const QuizPage   = React.lazy(() => import("./pages/QuizPage.jsx"));
const ResultPage = React.lazy(() => import("./pages/ResultPage.jsx"));
const SharePage  = React.lazy(() =>
  import("./pages/SharePage.jsx").then(m => ({ default: m.default ?? m.SharePage ?? m }))
);

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/result" element={<ResultPage />} />
        {/* ✅ 공유 라우트 */}
        <Route path="/share/:slug" element={<SharePage />} />
        {/* fallback */}
        <Route path="*" element={<IntroPage />} />
      </Routes>
    </Suspense>
  );
}
