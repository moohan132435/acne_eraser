export const NUM_Q = 12;

export function optionBasePath({ q, a, lang, gender }) {
  // public/assets 하위에 파일이 있어야 합니다(대소문자 주의)
  // Q10, Q12만 성별 접미사 필요
  const needGender = q === 10 || q === 12;
  const g = needGender ? (gender === "M" ? "_M" : "_W") : "";
  const e = lang === "ENG" ? "_eng" : "";
  // SmartImg가 BASE_URL을 붙이므로 여기선 선행 "/" 없이 반환
  return `assets/option-${q}-${a}${g}${e}`;
}

export const QUESTIONS = {
  KOR: [
    "Q1. 성별을 선택해 주세요",
    "Q2. 출생 연도를 선택해 주세요",
    "Q3. 세안 후 몇시간 이내에 얼굴이 번들거리나요?",
    "Q4. 세안 후 몇시간 이내에 얼굴이 당기나요?",
    "Q5. 코나 이마가 기름지거나 붉게 건조한가요?(혹은 그 반대)",
    "Q6. 계절 변화/온도/먼지 등 환경에 대한 자극은 어떤가요?",
    "Q7. 한 달 이내 뾰루지/트러블이 있었나요?",
    "Q8. 하루 평균 수면 시간은?",
    "Q9. 하루 물 섭취량은?",
    "Q10. 본인에 해당하는 여드름 문제를 골라주세요",
    "Q11. 가족 중 여드름이 심했던 분이 있나요?",
    "Q12. 얼굴의 주름/기미/모공 고민이 있나요?",
  ],
  ENG: [
    "Q1. Select your gender",
    "Q2. Select your birth year",
    "Q3. How soon does your skin get oily after washing?",
    "Q4. How soon does your skin feel tight after washing?",
    "Q5. Is T-zone oily or cheeks dry (or vice versa)?",
    "Q6. How sensitive is your skin to environment/temperature/dust?",
    "Q7. Breakouts in last month?",
    "Q8. Average sleep time?",
    "Q9. Daily water intake?",
    "Q10. Pick acne issue you have",
    "Q11. Family history of acne?",
    "Q12. Any main concern: wrinkles/spot/pores?",
  ],
};
