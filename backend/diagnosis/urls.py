from django.urls import path
from .views import result_view, share_view

urlpatterns = [
    path("api/result", result_view, name="api-result"),
    path("share/<int:code>", share_view, name="share"),
]
