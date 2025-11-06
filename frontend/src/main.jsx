
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { QuizProvider } from "./context/QuizContext.jsx";

// CSS 경로 주의: 파일명이 styles.css 라면 아래도 styles.css 로!
import "./styles.css";

// 운영에서 404를 피하려고 HashRouter 사용 (/#/share/...)
import { HashRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QuizProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </QuizProvider>
  </React.StrictMode>
);