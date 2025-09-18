from django.urls import path
from .views import result_view

urlpatterns = [
    path("api/result", result_view, name="api-result"),
]
