from __future__ import annotations
from typing import Dict, List, Tuple, Optional

# ---- Class A / B (영문 키) ----
A_CATEGORIES = ["sensitivity", "oily", "dry", "combination"]
B_CATEGORIES = ["stress", "environment"]

# 임계치: 임계치 넘는 항목만 선택. 없으면 None -> FE에서 "해당없음"
THRESHOLD_A: Dict[str, int] = {"sensitivity": 4, "oily": 3, "dry": 4, "combination": 4}
THRESHOLD_B: Dict[str, int] = {"stress": 2, "environment": 4}

# (A,B) -> 최종 코드 (FE에서 result-{code}.png 사용)
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

# ---- 가중치표 (네가 준 표 반영) ----
WEIGHTS: Dict[int, Dict[int, Dict[str, Dict[str, int]]]] = {
    # Q1
    1: {1: {"A": {"oily": 2}}, 2: {"A": {"combination": 1}}, 3: {"A": {"dry": 1}}, 4: {"A": {"sensitivity": 1}}},
    # Q2
    2: {1: {"A": {"dry": 2}}, 2: {"A": {"combination": 1}}, 3: {"A": {"oily": 1}}, 4: {"A": {"sensitivity": 1}}},
    # Q3
    3: {1: {"A": {"combination": 2}}, 2: {"A": {"oily": 2}}, 3: {"A": {"dry": 2}}, 4: {"A": {"sensitivity": 1}}},
    # Q4  (4번 선택지는 변화없음 → 0점)
    4: {1: {"B": {"environment": 2}}, 2: {"B": {"environment": 1}}, 3: {"B": {"stress": 1}}, 4: {}},
    # Q5  (2번은 민감성 +1 이슈 반영)
    5: {1: {"A": {"sensitivity": 2}}, 2: {"A": {"sensitivity": 1}}, 3: {"A": {"combination": 1}}, 4: {}},
    # Q6  (1: +2, 2: +1, 3: 환경+1, 4: 환경+1)
    6: {1: {"B": {"stress": 2}}, 2: {"B": {"stress": 1}}, 3: {"B": {"environment": 1}}, 4: {}},
    # Q7
    7: {1: {"A": {"dry": 1}, "B": {"environment": 1}}, 2: {"A": {"dry": 1}}, 3: {}, 4: {}},
    # Q8
    8: {1: {"A": {"oily": 1}, "B": {"environment": 1}},
        2: {"B": {"stress": 1}, "A": {"sensitivity": 1}},
        3: {"B": {"environment": 2}},
        4: {"A": {"combination": 1}, "B": {"stress": 1}}},
    # Q9
    9: {1: {}, 2: {}, 3: {}, 4: {}},
}

def _acc(dst: Dict[str, int], add: Dict[str, int]) -> None:
    for k, v in add.items():
        dst[k] = dst.get(k, 0) + int(v)

def _select_if_threshold_met(scores: Dict[str, int], threshold: Dict[str, int], order: List[str]) -> Optional[str]:
    cands = [k for k in order if scores.get(k, 0) >= threshold.get(k, 10**9)]
    if not cands: return None
    return max(cands, key=lambda k: (scores.get(k, 0), -order.index(k)))

def compute_result(answers: List[int]) -> Dict:
    if not isinstance(answers, list) or len(answers) != 9:
        raise ValueError("answers must be a list of length 9")
    answers = [int(x) for x in answers]
    if not all(1 <= x <= 4 for x in answers):
        raise ValueError("answers values must be 1..4")

    scores_a = {k: 0 for k in A_CATEGORIES}
    scores_b = {k: 0 for k in B_CATEGORIES}
    for qi, ans in enumerate(answers, start=1):
        cell = WEIGHTS.get(qi, {}).get(ans, {})
        if "A" in cell: _acc(scores_a, cell["A"])
        if "B" in cell: _acc(scores_b, cell["B"])

    a_type = _select_if_threshold_met(scores_a, THRESHOLD_A, A_CATEGORIES)
    b_type = _select_if_threshold_met(scores_b, THRESHOLD_B, B_CATEGORIES)
    code = RESULT_MAP.get((a_type, b_type)) if (a_type and b_type) else None

    return {"a_type": a_type, "b_type": b_type, "code": code, "scores": {"A": scores_a, "B": scores_b}}
