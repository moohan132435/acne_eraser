import React from "react";
import { Routes, Route } from "react-router-dom";
import IntroPage from "./pages/IntroPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import SharePage from "./pages/SharePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IntroPage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/result" element={<ResultPage />} />

      {/* 정적 OG는 /share/<slug> (public에 존재) */}
      {/* 실제 앱에서 렌더링은 /share-redirect/<slug>로 받기 */}
      <Route path="/share-redirect/:slug" element={<SharePage />} />

      <Route path="*" element={<IntroPage />} />
    </Routes>
  );
}
