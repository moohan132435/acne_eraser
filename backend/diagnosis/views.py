# diagnosis/views.py
import json
import logging
import datetime
import traceback  # ✅ 추가: DB 저장 실패 시 원인 로그용

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_datetime

from . import quiz_logic
from .models import DiagnosisResult, ButtonClick

logger = logging.getLogger(__name__)


def _brief(request):
    ua = request.META.get("HTTP_USER_AGENT", "-")
    ip = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR")
    return f"IP={ip} UA={ua[:80]}"


def _sum_numeric_values(d):
    """
    dict 안의 값들 중 숫자(int/float)만 합산해서 int로 반환
    - scores.A / scores.B가 dict로 내려오므로 IntegerField에 넣기 위해 필요
    """
    if not isinstance(d, dict):
        return 0
    total = 0
    for v in d.values():
        if isinstance(v, (int, float)):
            total += v
    return int(total)


@csrf_exempt
def result_view(request):
    """
    ✅ (2번 요구사항) 결과 요청 시 DB에 누적 저장
    - 결과요청시간: created_at (서버 자동)
    - 각 문항에 대해 무엇을 골랐는지: answers
    - 결과 유형: result_code + 산출값
    - (선택) 요청 lang, client timestamps

    응답에 diagnosis_id(UUID)를 포함해서 FE가 이후 버튼클릭 로그에 같이 보낼 수 있게 함.

    ⚠️ 중요: 응답 I/F(res)는 그대로 유지한다.
    변경되는 건 DB에 저장하는 score_a/score_b의 타입(dict → int) 뿐이다.
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    answers = body.get("answers")
    birth_year = body.get("birth_year")  # Q2에서 드롭다운으로 전달
    lang = (body.get("lang") or request.GET.get("lang") or "ENG").upper()

    # (선택) FE에서 넘기는 타임스탬프(없어도 됨)
    client_started_at = parse_datetime(body.get("client_started_at") or "")
    client_submitted_at = parse_datetime(body.get("client_submitted_at") or "")

    try:
        res = quiz_logic.compute_result(answers, birth_year=birth_year)
    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=400)

    code = res.get("code")
    image = f"/assets/result-{code}.png" if code else "/assets/result-1.png"

    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.info(
        f"[{now}] {_brief(request)} + answers:{answers} "
        f"--> A:{res['scores']['A']} B:{res['scores']['B']} total:{res['total_score']} "
        f"pct:{res['percentile_label']} skin_age:{res['skin_age']} "
        f"view: result-{code if code else '?'} .png"
    )

    # -----------------------------
    # ✅ DB 저장 (핵심)
    # -----------------------------
    # res["scores"]["A"], res["scores"]["B"] 는 dict 형태다.
    # DiagnosisResult 모델의 score_a/score_b는 IntegerField이므로
    # dict를 그대로 넣으면 INSERT에서 실패한다.
    scores = res.get("scores") or {}
    score_a_dict = scores.get("A") or {}
    score_b_dict = scores.get("B") or {}

    # ✅ IntegerField에 맞게 "합계값"으로 저장
    score_a_total = _sum_numeric_values(score_a_dict)
    score_b_total = _sum_numeric_values(score_b_dict)

    diagnosis_id = None
    try:
        diag = DiagnosisResult.objects.create(
            lang=lang,
            user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:2000],
            answers=answers or [],
            birth_year=birth_year,
            result_code=code,
            skin_age=res.get("skin_age"),
            skin_percentile=res.get("skin_percentile"),
            # ✅ 여기만 변경: dict → int 합계
            score_a=score_a_total,
            score_b=score_b_total,
            total_score=res.get("total_score"),
            client_started_at=client_started_at,
            client_submitted_at=client_submitted_at,
        )
        diagnosis_id = str(diag.id)
    except Exception as e:
        # DB 저장 실패해도 UX는 살려야 하므로 결과는 반환
        logger.error(f"Failed to persist diagnosis: {e}")
        logger.error(traceback.format_exc())
        diagnosis_id = None

    # ✅ 응답 I/F는 그대로 유지: res(scores dict 포함) + diagnosis_id만 추가
    payload = {
        **res,
        "image": image,
        "diagnosis_id": diagnosis_id,
    }
    return JsonResponse(payload, status=200)


@csrf_exempt
def track_click_view(request):
    """
    ✅ (5번 요구사항) 결과페이지 버튼 클릭 이력 저장

    FE에서 아래 형태로 호출:
    POST /api/track-click
    {
      "diagnosis_id": "uuid or null",
      "button_key": "purchase" | "share" | "retry" | ...
      "lang": "ENG" (optional)
    }
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    button_key = (body.get("button_key") or "").strip()
    if not button_key:
        return JsonResponse({"detail": "button_key is required"}, status=400)

    lang = (body.get("lang") or "ENG").upper()
    diagnosis_id = body.get("diagnosis_id")

    diag = None
    if diagnosis_id:
        try:
            diag = DiagnosisResult.objects.filter(id=diagnosis_id).first()
        except Exception:
            diag = None

    try:
        ButtonClick.objects.create(
            diagnosis=diag,
            button_key=button_key[:32],
            lang=lang,
        )
    except Exception as e:
        logger.error(f"Failed to persist click: {e}")
        logger.error(traceback.format_exc())

    return JsonResponse({"ok": True}, status=200)


# 공유 썸네일/OG 태그용 (URL만 공유 시 미리보기 지원)
def share_view(request, code: int):
    lang = request.GET.get("lang", "KOR").upper()
    img = f"/assets/result-{int(code)}.png"
    if lang == "ENG":
        img = img.replace(".png", "_eng.png")

    title = "Spot Eraser"
    desc = "Acne diagnosis result"
    html = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>{title}</title>
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:image" content="{img}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="{img}" />
</head>
<body>
<p>Result #{code}</p>
<img src="{img}" alt="result" style="max-width:600px;width:100%" />
</body>
</html>"""
    return HttpResponse(html)
