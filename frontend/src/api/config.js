// frontend/src/api/config.js
// 1) 개발모드(로컬 vite dev 서버)는 기본적으로 로컬 백엔드로 붙음
// 2) 빌드/배포(Preview/Production)는 기본값을 운영 도메인으로, 필요 시 Vercel의 환경변수로 덮어씀
const DEFAULT_PROD = "https://api.acne_eraser.kr"; // 운영기 기본
const DEFAULT_DEV = "http://127.0.0.1:8000"; // 로컬 개발기 기본

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.MODE === "development" ? DEFAULT_DEV : DEFAULT_PROD);
