# backend/app/views.py
import json
import logging
import datetime
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.html import escape

from . import quiz_logic  # quiz_logic.py 불러오기

logger = logging.getLogger(__name__)


def brief_client_info(request):
    ua = request.META.get("HTTP_USER_AGENT", "-")
    ip = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR")
    return f"IP={ip} UA={ua[:80]}"


@csrf_exempt
def result_view(request):
    """
    FE에서 {answers:[...]}를 수신 → quiz_logic.compute_result()로 계산
    응답: { code, image, a_type, b_type, scores, answers }
    로그: 문제별 점수/유형/뷰 이미지 파일명
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    answers = body.get("answers")
    if not isinstance(answers, list) or len(answers) != 9:
        return JsonResponse({"detail": "answers must be an int[9]"}, status=400)

    try:
        result = quiz_logic.compute_result(answers)
    except ValueError as e:
        return JsonResponse({"detail": str(e)}, status=400)

    # unpack result
    a_type = result.get("a_type")
    b_type = result.get("b_type")
    code   = result.get("code")  # 1~8 또는 None
    scores = result.get("scores")  # {"A": {...}, "B": {...}}

    # 이미지 파일 결정 (FE는 ENG면 _eng를 붙여서 사용)
    image = f"/assets/result-{code}.png" if code else "/assets/result-1.png"

    # WAS 로그 (샘플 포맷 반영)
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = (
        # 필요 시 접속자 간단정보 포함하려면 아래 주석 해제
        # f"[{now}] {brief_client_info(request)} + Quiz 선택지 : {answers} "
        f"[{now}] Quiz 선택지 : {answers} "
        f"--> 민감 : {scores['A'].get('sensitivity',0)}, "
        f"지성 : {scores['A'].get('oily',0)}, "
        f"건성 : {scores['A'].get('dry',0)}, "
        f"복합 : {scores['A'].get('combination',0)}, "
        f"|| 스트레스 : {scores['B'].get('stress',0)}, "
        f"환경영향 : {scores['B'].get('environment',0)}, "
        f"|| 결과 : {(a_type or '해당없음')}/{(b_type or '해당없음')} "
        f"--> view : result-{code if code else '?'} .png"
    )
    logger.info(log_line)

    payload = {
        "answers": answers,
        "a_type": a_type,
        "b_type": b_type,
        "code": code,     # FE가 있으면 /assets/result-{code}.png 우선 적용
        "image": image,   # BE가 제공하는 기본 경로 (ENG는 FE에서 _eng 붙임)
        "scores": scores,
    }
    return JsonResponse(payload, status=200)


def share_view(request, code: int):
    """
    /share/<code>?lang=KOR|ENG
    - Open Graph/Twitter 메타 태그를 포함한 HTML 반환
    - 메신저/앱에서 이 URL만 공유해도 이미지 미리보기(썸네일) + 링크가 뜨도록 함
    - meta refresh로 실제 랜딩(홈)으로 곧바로 이동
    """
    try:
        code = int(code)
    except Exception:
        code = 1

    lang = request.GET.get("lang", "KOR")
    # 절대 URL (OG는 절대 경로 권장)
    origin = request.build_absolute_uri("/").rstrip("/")
    # 이미지 경로 (ENG면 _eng)
    img_path = f"/assets/result-{code}{'_eng' if lang == 'ENG' else ''}.png"
    img_abs  = f"{origin}{img_path}"

    # 공유 URL을 클릭했을 때 열릴 실제 랜딩(원하면 결과 페이지로 바꿔도 됨)
    canonical = f"{origin}/"

    title = "Spot Eraser"
    desc  = "Check your acne type" if lang == "ENG" else "당신의 여드름 타입을 확인하세요"

    html = f"""<!doctype html>
<html lang="{ 'en' if lang == 'ENG' else 'ko' }">
<head>
  <meta charset="utf-8">
  <title>{escape(title)}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="{escape(title)}">
  <meta property="og:description" content="{escape(desc)}">
  <meta property="og:image" content="{escape(img_abs)}">
  <meta property="og:url" content="{escape(canonical)}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{escape(title)}">
  <meta name="twitter:description" content="{escape(desc)}">
  <meta name="twitter:image" content="{escape(img_abs)}">

  <!-- 공유 클릭 시 즉시 랜딩으로 이동 -->
  <meta http-equiv="refresh" content="0;url={escape(canonical)}">
</head>
<body>
  <a href="{escape(canonical)}">Open Spot Eraser</a>
</body>
</html>"""
    return HttpResponse(html, content_type="text/html; charset=utf-8")
