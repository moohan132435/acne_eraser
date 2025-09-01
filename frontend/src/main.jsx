import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { QuizProvider } from "./context/QuizContext.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <QuizProvider>
      <App />
    </QuizProvider>
  </BrowserRouter>
);
