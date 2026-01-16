// src/config/i18nConfig.js
/**
 * i18n Feature Flags
 * - 지금: 글로벌(영문) 버전 고정
 * - 향후: 국내버전 출시 시 ENABLE_KOR = true 로 변경
 */
export const I18N_FLAGS = {
  ENABLE_KOR: false, // ✅ 지금은 한국어 진입 차단
  DEFAULT_LANG: "ENG", // ✅ 첫 진입 언어 고정
  STORAGE_KEY: "lang",
};
