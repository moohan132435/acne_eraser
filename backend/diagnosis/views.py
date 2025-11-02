# diagnosis/views.py
import json, logging, datetime
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from . import quiz_logic

logger = logging.getLogger(__name__)

def _brief(request):
    ua = request.META.get("HTTP_USER_AGENT", "-")
    ip = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR")
    return f"IP={ip} UA={ua[:80]}"

@csrf_exempt
def result_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    try:
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    answers    = body.get("answers")
    birth_year = body.get("birth_year")   # Q2에서 드롭다운으로 전달
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

    payload = {
        **res,
        "image": image
    }
    return JsonResponse(payload, status=200)

# 공유 썸네일/OG 태그용 (URL만 공유 시 미리보기 지원)
def share_view(request, code: int):
    lang = request.GET.get("lang", "KOR").upper()
    img = f"/assets/result-{int(code)}.png"
    if lang == "ENG":
        img = img.replace(".png", "_eng.png")

    title = "Spot Eraser"
    desc  = "Acne diagnosis result"
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
