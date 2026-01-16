from __future__ import annotations

import uuid

from django.db import models


class DiagnosisResult(models.Model):
    """진단 결과 1건을 저장.

    요구사항:
    - 결과요청시간: created_at (서버시간)
    - 각 문항에서 무엇을 골랐는지: answers(JSON)
    - 어떤 유형으로 나왔는지: result_code + 산출값들

    개인정보(PII)는 저장하지 않습니다.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # (선택) FE에서 보내주는 클라이언트 타임스탬프(퍼널/지연 분석용)
    client_started_at = models.DateTimeField(null=True, blank=True)
    client_submitted_at = models.DateTimeField(null=True, blank=True)

    # (선택) 최소한의 컨텍스트 (개인정보 아님)
    lang = models.CharField(max_length=8, default="ENG")
    user_agent = models.TextField(blank=True, default="")

    # Q1..Q12 선택값 (정수 배열). JSON으로 통째 저장.
    answers = models.JSONField(default=list)
    birth_year = models.IntegerField(null=True, blank=True)

    # 결과 요약
    result_code = models.IntegerField(null=True, blank=True)
    skin_age = models.IntegerField(null=True, blank=True)
    skin_percentile = models.IntegerField(null=True, blank=True)

    # 디버깅/분석용 점수
    score_a = models.IntegerField(null=True, blank=True)
    score_b = models.IntegerField(null=True, blank=True)
    total_score = models.IntegerField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["created_at"], name="diag_created_at_idx"),
            models.Index(fields=["result_code"], name="diag_result_code_idx"),
        ]

    def __str__(self) -> str:
        return f"DiagnosisResult({self.id}, code={self.result_code})"


class ButtonClick(models.Model):
    """결과 페이지 버튼 클릭 로그.

    요구사항:
    - 버튼 누른 이력을 저장해서 나중에 통계로 확인
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    diagnosis = models.ForeignKey(
        DiagnosisResult,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="clicks",
    )

    # ex) "purchase", "share", "retry"
    button_key = models.CharField(max_length=32)
    lang = models.CharField(max_length=8, default="ENG")

    class Meta:
        indexes = [
            models.Index(fields=["created_at"], name="click_created_at_idx"),
            models.Index(fields=["button_key"], name="click_button_key_idx"),
        ]

    def __str__(self) -> str:
        return f"ButtonClick({self.id}, {self.button_key})"
