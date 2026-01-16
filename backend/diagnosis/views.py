# diagnosis/views.py
import json
import logging
import datetime
import traceback

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
    if not isinstance(d, dict):
        return 0
    total = 0
    for v in d.values():
        if isinstance(v, (int, float)):
            total += v
    return int(total)


def _ok_preflight():
    """
    ✅ CORS preflight(OPTIONS) 대응
    - Safari에서 'Load failed' 원인이 되는 경우가 많음
    """
    return JsonResponse({"ok": True}, status=200)


@csrf_exempt
def result_view(request):
    # ✅ OPTIONS(preflight) 먼저 처리
    if request.method == "OPTIONS":
        return _ok_preflight()

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    answers = body.get("answers")
    birth_year = body.get("birth_year")
    lang = (body.get("lang") or request.GET.get("lang") or "ENG").upper()

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

    # ✅ dict -> int 합계로 저장 (이미 해결한 부분 유지)
    scores = res.get("scores") or {}
    score_a_total = _sum_numeric_values(scores.get("A") or {})
    score_b_total = _sum_numeric_values(scores.get("B") or {})

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
            score_a=score_a_total,
            score_b=score_b_total,
            total_score=res.get("total_score"),
            client_started_at=client_started_at,
            client_submitted_at=client_submitted_at,
        )
        diagnosis_id = str(diag.id)
    except Exception as e:
        logger.error(f"Failed to persist diagnosis: {e}")
        logger.error(traceback.format_exc())
        diagnosis_id = None

    payload = {
        **res,
        "image": image,
        "diagnosis_id": diagnosis_id,
    }
    return JsonResponse(payload, status=200)


@csrf_exempt
def track_click_view(request):
    # ✅ OPTIONS(preflight) 먼저 처리
    if request.method == "OPTIONS":
        return _ok_preflight()

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
