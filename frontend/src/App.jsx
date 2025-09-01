import { Routes, Route } from "react-router-dom";
import IntroPage from "./pages/IntroPage";
import QuizPage from "./pages/QuizPage";
import ResultPage from "./pages/ResultPage";

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<IntroPage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  );
}
