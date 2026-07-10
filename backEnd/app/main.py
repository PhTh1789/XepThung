"""
Điểm khởi đầu của ứng dụng FastAPI – XepHangCungThinh Backend.

Chịu trách nhiệm:
  1. Khởi tạo FastAPI app với metadata.
  2. Cấu hình CORS middleware.
  3. Đăng ký tất cả API routers với prefix /api/v1.
  4. Startup event: tạo bảng DB và chạy seeder dữ liệu mặc định.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database.database import get_engine, get_session_factory, Base
from app.database.seeder import run_all_seeders

# Security & Limiter imports
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.limiter import limiter

# Import các routers
from app.api import optimizer, trucks, items, history

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Lifespan: Startup & Shutdown
# ─────────────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Chạy một lần khi server khởi động và shutdown."""
    # ── Startup ──────────────────────────────────────────────────────────
    logger.info(" --> Khởi động XepHangCungThinh Backend...")
    settings = get_settings()
    logger.info("   Môi trường: %s", settings.APP_ENV)

    # Tạo các bảng DB nếu chưa tồn tại (idempotent)
    try:
        Base.metadata.create_all(bind=get_engine())
        logger.info("Database tables da san sang.")

        # Chạy seeder dữ liệu mặc định
        SessionFactory = get_session_factory()
        db = SessionFactory()
        try:
            run_all_seeders(db)
        finally:
            db.close()
    except Exception as e:
        logger.warning("    Không thể kết nối Database: %s", str(e))
        logger.warning("    Server vẫn khởi động nhưng các API cần DB sẽ báo lỗi.")
        logger.warning("    Hãy điền đúng DATABASE_URL vào file .env")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────
    logger.info("    Server đang tắt...")


# ─────────────────────────────────────────────────────────────────────────────
# Khởi tạo FastAPI App
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="XepHangCungThinh API",
    description=(
        "API cho hệ thống tối ưu hóa sắp xếp hàng hóa lên xe tải và trực quan hóa bằng mô hình 3D.\n\n"
        "**Thuật toán:** py3dbp (Heuristic) + PyGAD (Genetic Algorithm)"
    ),
    version="1.0.0",
    contact={
        "name": "PhatThinh1789",
    },
    lifespan=lifespan,
)

# Đăng ký Rate Limiter vào app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ─────────────────────────────────────────────────────────────────────────────
# CORS Middleware
# ─────────────────────────────────────────────────────────────────────────────
settings = get_settings()
ALLOWED_ORIGINS = (
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    if settings.APP_ENV == "development"
    else [
        "https://xepthung.tech",
        "https://www.xepthung.tech",
        "http://localhost:5173",  # Vite dev server (nếu chạy local mà connect tới prod backend)
    ]
)

# 1. CORS Middleware (Bỏ ["*"] khi đi kèm credentials=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Trusted Host Middleware (Chặn Host Header giả mạo)
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "xepthung.tech", "www.xepthung.tech"]
app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS
)

# 3. Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)


# -----------------------------------------------------------------------------
# Exception Handlers
# -----------------------------------------------------------------------------
# FastAPI mac dinh tra ve HTTP 422 khi Pydantic validation fail,
# Handler nay bat RequestValidationError va chuyen sang format giống với Standard Error Response trong API Contract :
#   { status, message, error_code, details }
# Để Frontend không phải xử lý 2 kiểu format lỗi khác nhau.
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Lay thong bao loi tu Pydantic. errors() tra ve list cac dict co 'msg' field.
    # Trong truong hop model_validator raise ValueError, msg se la chuoi da join san.
    messages = []
    for error in exc.errors():
        msg = error.get("msg", "")
        # Pydantic them prefix 'Value error, ' vao truoc message cua ValueError.
        # Bo prefix nay di cho gon.
        msg = msg.removeprefix("Value error, ")
        if msg:
            messages.append(msg)

    return JSONResponse(
        status_code=400,
        content={
            "status": "error",
            "message": " | ".join(messages) if messages else "Du lieu khong hop le",
            "error_code": "VALIDATION_ERROR",
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# Đăng ký API Routers (prefix: /api/v1)
# ─────────────────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(optimizer.router, prefix=API_PREFIX)
app.include_router(trucks.router,    prefix=API_PREFIX)
app.include_router(items.router,     prefix=API_PREFIX)
app.include_router(history.router,   prefix=API_PREFIX)


# ─────────────────────────────────────────────────────────────────────────────
# Health Check – Root endpoint
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def read_root():
    """Kiểm tra sức khỏe hệ thống."""
    return {
        "status": "success",
        "message": "XepHangCungThinh Backend đang hoạt động!",
        "version": "1.0.0",
        "docs": "/docs",
    }
