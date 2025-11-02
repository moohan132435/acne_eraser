// 여러 확장자/대소문자 폴백 + baseUrl 접두사 자동 부착
import React, { useState, useMemo } from "react";

export default function SmartImg({ base, exts = ["jpg","png","JPG","jpeg","webp"], alt="", ...rest }) {
  // base = "assets/option-1-1_eng" 처럼 확장자 제외 경로 (앞에 "/" 없이!)
  const prefix = import.meta.env.BASE_URL || "/";
  const candidates = useMemo(
    () => exts.map((e) => `${prefix}${base}.${e}`),
    [base, exts, prefix]
  );
  const [srcIndex, setSrcIndex] = useState(0);
  const onError = () => setSrcIndex((i) => (i + 1 < candidates.length ? i + 1 : i));
  return <img src={candidates[srcIndex]} alt={alt} onError={onError} {...rest} />;
}
