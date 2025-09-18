# backend/acne_service/settings.py
import os
from pathlib import Path
from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parent.parent

# ---- 환경변수 ----
def env_bool(name, default=False):
    v = os.getenv(name, str(default))
    return v.lower() in ("1", "true", "yes", "on")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me")
DEBUG = env_bool("DJANGO_DEBUG", False)

# 운영 배포 시에는 api 도메인, Render 도메인을 반드시 포함
ALLOWED_HOSTS = [h.strip() for h in os.getenv(
    "DJANGO_ALLOWED_HOSTS",
    "127.0.0.1,localhost,api.acne_eraser.kr"
).split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin","django.contrib.auth","django.contrib.contenttypes",
    "django.contrib.sessions","django.contrib.messages","django.contrib.staticfiles",
    "corsheaders","rest_framework","diagnosis",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "acne_service.urls"
WSGI_APPLICATION = "acne_service.wsgi.application"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",  # 이 앱은 DB 의존 거의 없음
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {
            "format": "%(message)s"
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "loggers": {
        "app": {  # views.py의 logger = logging.getLogger(__name__)면 모듈 경로에 맞게 수정
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        # 혹은 루트 로거 사용
        "": {
            "handlers": ["console"],
            "level": "INFO",
        },
    },
}


STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ---- CORS/CSRF ----
# 프리뷰/운영의 프론트 도메인을 환경변수로 넣자 (쉼표구분)
_CORS = [o.strip() for o in os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://127.0.0.1:5173,http://localhost:5173,https://acne_eraser.kr"
).split(",") if o.strip()]

CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL_ORIGINS", False)  # 임시 디버그용 True 가능
CORS_ALLOWED_ORIGINS = [] if CORS_ALLOW_ALL_ORIGINS else _CORS
CORS_ALLOW_METHODS = ["GET", "POST", "OPTIONS"]
CORS_ALLOW_HEADERS = list(default_headers) + ["content-type"]
CORS_ALLOW_CREDENTIALS = False

CSRF_TRUSTED_ORIGINS = [o.replace("http://", "https://") for o in _CORS]  # https로 신뢰
