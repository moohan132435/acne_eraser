import React, { useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuizContext } from "../context/QuizContext.jsx";

export default function ResultPage(){
  const nav = useNavigate();
  const { state, dispatch } = useContext(QuizContext);
  const { state: navState } = useLocation();

  // 결과 복구 (Context → nav.state → localStorage)
  let result = state.result || navState?.result;
  if(!result){
    try{
      const s = localStorage.getItem("result");
      if(s) result = JSON.parse(s);
    }catch(e){}
  }
  if(!result){
    return (
      <div className="result-wrap">
        <p style={{ color:"crimson" }}>결과가 없습니다. 처음부터 다시 진행해주세요.</p>
        <div className="result-actions">
          <button className="btn btn-lg retry-btn" onClick={()=> nav("/")}>처음으로</button>
        </div>
      </div>
    );
  }

  const { a_type, b_type, code } = result || {};
  const noResult = !a_type || !b_type || !code;
  //const imgSrc = noResult ? "/assets/result-null.png" : `/assets/result-${code}.png`;
  const imgSrc = noResult ? "/assets/result-2.png" : `/assets/result-${code}.png`;

  const retry = () => {
    dispatch({ type:"RESET" });
    nav("/");
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">Acne Eraser</div>
      </header>

      <div className="result-wrap">
        <h1 className="page-title">진단 결과</h1>

        <img src={imgSrc} alt="result" style={{ width:"100%", borderRadius:12 }} />

        <div className="result-actions">
          <button className="btn btn-lg retry-btn" onClick={retry}>다시하기</button>
        </div>
      </div>
    </div>
  );
}
