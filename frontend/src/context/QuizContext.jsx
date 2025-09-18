import { createContext, useReducer, useEffect } from "react";

const NUM_Q = 9;

const initial = { 
  // 언어는 localStorage에서 복구 (기본 KOR)
  lang: (localStorage.getItem('lang') || 'KOR'),
  current: 0,                         // 0..8
  answers: Array(NUM_Q).fill(null),   // 각 1..4
  result: null                        // BE 반환값 캐시
};

function reducer(state, action){
  switch(action.type){
    case "SET_LANG":{
      const lang = action.payload;
      localStorage.setItem('lang', lang);         // 영구 저장
      return { ...state, lang };
    }

    case "RESET":{
      // ✅ 언어(lang)는 유지하고 나머지만 초기화
      const fresh = { current: 0, answers: Array(NUM_Q).fill(null), result: null };

      // 스토리지도 초기화(언어는 건드리지 않음)
      localStorage.setItem("answers", JSON.stringify(fresh.answers));
      localStorage.removeItem("result");

      // 기존: return fresh;
      return { ...state, ...fresh };              // <-- lang 보존!
    }

    case "HYDRATE":{
      // 전달된 값만 합치되 lang은 건드리지 않음(초기 state에 이미 복구됨)
      return { ...state, ...action.payload };
    }

    case "SET_ANSWER":{ // {index, value}
      const next = [...state.answers];
      next[action.index] = action.value;
      localStorage.setItem("answers", JSON.stringify(next));
      return { ...state, answers: next };
    }

    case "NEXT":{
      return { ...state, current: Math.min(state.current + 1, NUM_Q - 1) };
    }

    case "PREV":{
      return { ...state, current: Math.max(state.current - 1, 0) };
    }

    case "SET_RESULT":{
      localStorage.setItem("result", JSON.stringify(action.value));
      return { ...state, result: action.value };
    }

    default:
      return state;
  }
}

export const QuizContext = createContext({ state: initial, dispatch: () => {} });

export function QuizProvider({ children }){
  const [state, dispatch] = useReducer(reducer, initial);

  // 첫 진입 시 로컬스토리지 복구
  useEffect(() => {
    try{
      const a = JSON.parse(localStorage.getItem("answers") || "null");
      const r = JSON.parse(localStorage.getItem("result") || "null");
      if(Array.isArray(a) && a.length === 9){
        dispatch({ type:"HYDRATE", payload:{ answers: a }});
      }
      if(r) dispatch({ type:"HYDRATE", payload:{ result: r }});
      // lang은 initial 단계에서 이미 localStorage로 복구됨
    }catch(e){}
  }, []);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}
