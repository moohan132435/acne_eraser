// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { QuizProvider } from "./context/QuizContext.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QuizProvider>
      {/* ✅ Router는 여기 '한 번'만 */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QuizProvider>
  </React.StrictMode>
);
