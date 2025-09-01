from django.urls import path
from .views import ResultView

urlpatterns = [
    path("api/result", ResultView.as_view(), name="api-result"),
]
