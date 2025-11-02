// src/context/QuizContext.jsx
import { createContext, useReducer, useEffect } from "react";

const NUM_Q = 12;

const initial = {
  lang: localStorage.getItem("lang") || "KOR",
  current: 0,
  answers: Array(NUM_Q).fill(null), // 각 문항 1..4 (Q2는 null 유지)
  birthYear: null,
  result: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LANG": {
      const lang = action.payload;
      localStorage.setItem("lang", lang);
      return { ...state, lang };
    }
    case "SET_BIRTH_YEAR": {
      const y = action.payload || null;
      localStorage.setItem("birthYear", y ? String(y) : "");
      return { ...state, birthYear: y };
    }
    case "SET_ANSWER": {
      const next = [...state.answers];
      next[action.index] = action.value;
      localStorage.setItem("answers", JSON.stringify(next));
      return { ...state, answers: next };
    }
    case "NEXT": {
      return { ...state, current: Math.min(state.current + 1, NUM_Q - 1) };
    }
    case "PREV": {
      return { ...state, current: Math.max(state.current - 1, 0) };
    }
    case "SET_RESULT": {
      localStorage.setItem("result", JSON.stringify(action.value));
      return { ...state, result: action.value };
    }
    case "RESET": {
      const fresh = {
        current: 0,
        answers: Array(NUM_Q).fill(null),
        birthYear: null,
        result: null,
      };
      localStorage.setItem("answers", JSON.stringify(fresh.answers));
      localStorage.removeItem("result");
      localStorage.removeItem("birthYear");
      return { ...state, ...fresh };
    }
    case "HYDRATE": {
      return { ...state, ...action.payload };
    }
    default:
      return state;
  }
}

export const QuizContext = createContext({ state: initial, dispatch: () => {} });

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem("answers") || "null");
      const r = JSON.parse(localStorage.getItem("result") || "null");
      const y = localStorage.getItem("birthYear");
      if (Array.isArray(a) && a.length === NUM_Q) {
        dispatch({ type: "HYDRATE", payload: { answers: a } });
      }
      if (y) dispatch({ type: "HYDRATE", payload: { birthYear: Number(y) } });
      if (r) dispatch({ type: "HYDRATE", payload: { result: r } });
    } catch {}
  }, []);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}
