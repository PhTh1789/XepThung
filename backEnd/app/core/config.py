"""
Cấu hình ứng dụng thông qua biến môi trường.
Sử dụng pydantic-settings để validate và parse .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """
    Tập hợp toàn bộ cấu hình của ứng dụng.
    Các giá trị được đọc từ file .env trong thư mục backEnd/.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Môi trường ──────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_NAME: str = "XepThung API"
    APP_VERSION: str = "1.0.0"

    # ── Cấu hình bắt buộc (Không có default -> Bắt buộc phải có trong .env) ──
    # Danh sách các domain được phép gọi API (phân tách bằng dấu phẩy)
    BACKEND_CORS_ORIGINS: str
    # Danh sách các Host header được phép (phân tách bằng dấu phẩy)
    BACKEND_ALLOWED_HOSTS: str = "localhost,127.0.0.1"

    # Database (Supabase PostgreSQL)
    DATABASE_URL: str

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # ── Giới hạn nghiệp vụ ───────────────────────────────────────────────────
    GUEST_ITEM_LIMIT: int = 50          # Giới hạn số kiện hàng cho Guest
    DEFAULT_PAGE_LIMIT: int = 10        # Số bản ghi mỗi trang mặc định


@lru_cache()
def get_settings() -> Settings:
    """
    Trả về singleton Settings. Dùng lru_cache để tránh đọc lại .env nhiều lần trong suốt vòng đời ứng dụng.
    """
    return Settings()
