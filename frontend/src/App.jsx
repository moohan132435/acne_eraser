import React, { useContext, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import IntroPage from "./pages/IntroPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import SharePage from "./pages/SharePage.jsx";
import { QuizContext } from "./context/QuizContext.jsx";

/**
 * ✅ App 진입 시에도 영어 강제
 * - IntroPage/ResultPage/SharePage 등 어느 라우트로 들어와도 ENG로 고정
 * - 기존 기능(SET_LANG dispatch)을 활용
 */
function LangGate({ children }) {
  const { state, dispatch } = useContext(QuizContext);

  useEffect(() => {
    if (state?.lang !== "ENG") {
      dispatch({ type: "SET_LANG", payload: "ENG" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.lang]);

  return children;
}

export default function App() {
  return (
    <LangGate>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/result" element={<ResultPage />} />

        {/* 정적 OG는 /share/<slug> (public에 존재) */}
        {/* 실제 앱에서 렌더링은 /share-redirect/<slug>로 받기 */}
        <Route path="/share-redirect/:slug" element={<SharePage />} />

        <Route path="*" element={<IntroPage />} />
        <Route path="/go/amazon" element={<GoAmazon />} />
      </Routes>
    </LangGate>
  );
}
