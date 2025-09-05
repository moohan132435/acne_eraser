// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { QuizProvider } from "./context/QuizContext.jsx";
import "./styles.css";
// ✅ Vercel Web Analytics (React용)
import { Analytics } from "@vercel/analytics/react";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <QuizProvider>
      <App />
      {/* ✅ 모든 페이지에서 작동하도록 루트에 배치 */}
      <Analytics />
    </QuizProvider>
  </BrowserRouter>
);
