from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .quiz_logic import compute_result

@method_decorator(csrf_exempt, name="dispatch")   # CORS/CSRF 문제 방지
class ResultView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data or {}
        answers = data.get("answers")
        if not isinstance(answers, list):
            return Response({"detail": "answers must be a list"}, status=400)
        if len(answers) != 9:
            return Response({"detail": "answers length must be 9"}, status=400)
        try:
            answers = [int(x) for x in answers]
        except Exception:
            return Response({"detail": "answers must be integers"}, status=400)
        if not all(1 <= x <= 4 for x in answers):
            return Response({"detail": "answers values must be 1..4"}, status=400)
        result = compute_result(answers)
        return Response(result, status=200)
