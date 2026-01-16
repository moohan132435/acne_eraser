# diagnosis/urls.py
from django.urls import path
from .views import result_view, share_view, track_click_view

urlpatterns = [
    path("api/result", result_view, name="api_result"),
    path("api/track-click", track_click_view, name="api_track_click"),
    path("share/<int:code>", share_view, name="share"),
]
