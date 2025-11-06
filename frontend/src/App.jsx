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
      <Route path="/share/:slug" element={<SharePage />} />
      {/* fallback */}
      <Route path="*" element={<IntroPage />} />
    </Routes>
  );
}
