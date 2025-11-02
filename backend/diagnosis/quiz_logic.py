# diagnosis/quiz_logic.py
from __future__ import annotations
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import datetime

# === CLASS A / B ===
A_CATS = ["sensitivity", "oily", "dry", "combination"]
B_CATS = ["stress", "environment"]

TH_A: Dict[str, int] = {"sensitivity": 4, "oily": 3, "dry": 4, "combination": 4}
TH_B: Dict[str, int] = {"stress": 2, "environment": 4}

RESULT_MAP: Dict[Tuple[str, str], int] = {
    ("sensitivity", "stress"): 1,
    ("sensitivity", "environment"): 2,
    ("oily", "stress"): 3,
    ("oily", "environment"): 4,
    ("dry", "stress"): 5,
    ("dry", "environment"): 6,
    ("combination", "stress"): 7,
    ("combination", "environment"): 8,
}

# ----
# 가중치표(12문항). 이미지 표 그대로 이식하기 어려운 부분은 0으로 두었고,
# 표기 없으면 점수 0으로 안전하게 동작합니다.
# 필요 시 아래 표만 보강하면 FE/BE 로직은 그대로 유지됩니다.
# key: 질문번호 -> 보기번호(1~4) -> { "A" | "B" : {카테고리:가점} , "T": 총점가점 }
# ----
WEIGHTS: Dict[int, Dict[int, Dict[str, Dict[str, int]]]] = {
    # Q1 성별 (총점에는 영향 없음)
    1: {1: {}, 2: {}, 3: {}, 4: {}},

    # Q2 출생년도 (드롭다운으로 별도 전달. 여기서는 총점 영향 없음)
    2: {1: {}, 2: {}, 3: {}, 4: {}},

    # Q3
    3: {1: {"A": {"oily": 2}}, 2: {"A": {"combination": 1}}, 3: {"A": {"dry": 2}}, 4: {"A": {"sensitivity": 1}}},
    # Q4
    4: {1: {"A": {"dry": 2}}, 2: {"A": {"oily": 1}}, 3: {"A": {"combination": 1}}, 4: {"A": {"sensitivity": 1}}},
    # Q5
    5: {1: {"A": {"sensitivity": 2}}, 2: {"A": {"sensitivity": 1}}, 3: {"A": {"combination": 1}}, 4: {}},
    # Q6
    6: {1: {"B": {"environment": 2}}, 2: {"B": {"environment": 1}}, 3: {"B": {"stress": 1}}, 4: {}},
    # Q7
    7: {1: {"B": {"environment": 1}, "A": {"dry": 1}}, 2: {"A": {"dry": 1}}, 3: {}, 4: {}},
    # Q8
    8: {1: {"A": {"oily": 1}, "B": {"environment": 1}},
        2: {"A": {"sensitivity": 1}, "B": {"stress": 1}},
        3: {"B": {"environment": 2}},
        4: {"A": {"combination": 1}, "B": {"stress": 1}}},
    # Q9
    9: {1: {}, 2: {}, 3: {}, 4: {}},
    # Q10 (성별 분기 이미지만 다르고 점수는 동일 가정)
    10: {1: {"A": {"oily": 1}, "B": {"environment": 1}},
         2: {"B": {"stress": 1}, "A": {"sensitivity": 1}},
         3: {"A": {"combination": 1}},
         4: {}},
    # Q11 (유전)
    11: {1: {"A": {"sensitivity": 2}}, 2: {"A": {"sensitivity": 1}}, 3: {}, 4: {}},
    # Q12 (성별 분기 이미지만 다르고 점수는 동일 가정)
    12: {1: {"A": {"oily": 1}},
         2: {"A": {"dry": 1}},
         3: {"B": {"environment": 1}},
         4: {}},
}

# === 총점 → 백분위/나이 가중 ===
#   표 이미지(전체 점수에 따른 피부나이 표출 로직) 반영
#   (범위: [min,max] 포함)
PCT_AGE_TABLE = [
    ((18, 99),  "상위 5%",  -0.30),
    ((16, 17),  "상위 10%", -0.20),
    ((15, 15),  "상위 15%", -0.15),
    ((13, 14),  "상위 20%", -0.10),
    ((12, 12),  "상위 25%", -0.05),
    ((10, 11),  "상위 50%", -0.01),
    ((9,  9 ),  "하위 25%", +0.05),
    ((8,  8 ),  "하위 20%", +0.10),
    ((7,  7 ),  "하위 15%", +0.15),
    ((6,  6 ),  "하위 10%", +0.20),
    ((5,  5 ),  "하위 5%",  +0.25),
]

def _acc(dst: Dict[str, int], add: Dict[str, int]) -> None:
    for k, v in add.items():
        dst[k] = dst.get(k, 0) + int(v)

def _pick(scores: Dict[str, int], threshold: Dict[str, int], order: List[str]) -> Optional[str]:
    cand = [k for k in order if scores.get(k,0) >= threshold.get(k,10**9)]
    if not cand:
        return None
    return max(cand, key=lambda k: (scores.get(k,0), -order.index(k)))

def _derive_pct_age(total: int, birth_year: Optional[int]) -> Dict[str, int|float|str]:
    # 백분위/나이 조정율 결정
    label = "상위 50%"; delta = -0.01
    for (low, high), lab, d in PCT_AGE_TABLE:
        if low <= total <= high:
            label, delta = lab, d
            break

    # 실연령
    skin_age = None
    if birth_year:
        try:
            y = int(birth_year)
            today = datetime.date.today()
            real_age = max(0, today.year - y)  # 단순 년차
            skin_age = round(real_age * (1.0 + float(delta)))
        except Exception:
            skin_age = None

    # "상위/하위 XX%" → 정수 퍼센트 숫자만 추출
    import re
    m = re.search(r"(\d+)%", label)
    pct = int(m.group(1)) if m else 50
    top = ("상위" in label)

    return {
        "percentile": pct if top else (100 - pct),
        "percentile_label": label,
        "skin_age": skin_age
    }

def compute_result(answers: List[int], birth_year: Optional[int] = None) -> Dict:
    """
    answers: 길이 12, 각 1..4 (Q2는 드롭다운이지만 자리 유지. 값은 0 또는 1..4여도 무시)
    """
    if not isinstance(answers, list) or len(answers) != 12:
        raise ValueError("answers must be a list of length 12")
    arr = [int(x or 0) for x in answers]
    # 1~4 이외 값은 0으로 간주
    if not all(0 <= x <= 4 for x in arr):
        raise ValueError("answers values must be 0..4")

    scoreA = {k:0 for k in A_CATS}
    scoreB = {k:0 for k in B_CATS}
    total_score = 0

    for qi, ans in enumerate(arr, start=1):
        cell = WEIGHTS.get(qi, {}).get(ans, {})
        if "A" in cell: _acc(scoreA, cell["A"])
        if "B" in cell: _acc(scoreB, cell["B"])
        if "T" in cell:
            for _, v in cell["T"].items():
                total_score += int(v)

    # A/B 타입
    a_type = _pick(scoreA, TH_A, A_CATS)
    b_type = _pick(scoreB, TH_B, B_CATS)
    code   = RESULT_MAP.get((a_type, b_type)) if (a_type and b_type) else None

    # 총점 = A/B 점수 총합 + T(있다면)
    total_score += sum(scoreA.values()) + sum(scoreB.values())

    # 백분위/피부나이
    age_info = _derive_pct_age(total_score, birth_year)

    return {
        "a_type": a_type,
        "b_type": b_type,
        "code": code,
        "scores": {"A": scoreA, "B": scoreB},
        "total_score": total_score,
        "percentile": age_info["percentile"],
        "percentile_label": age_info["percentile_label"],
        "skin_age": age_info["skin_age"],
    }
