import json, logging, datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from . import quiz_logic  # quiz_logic.py 불러오기

logger = logging.getLogger(__name__)

def brief_client_info(request):
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
    code   = result.get("code")
    scores = result.get("scores")

    # 이미지 파일 결정 (FE는 ENG면 _eng 붙여서 사용)
    image = f"/assets/result-{code}.png" if code else "/assets/result-1.png"

    # WAS 로그 (샘플 포맷 반영)
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = (
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
        "code": code,
        "image": image,
        "scores": scores,
    }
    return JsonResponse(payload, status=200)
