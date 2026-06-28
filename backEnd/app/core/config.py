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
    APP_NAME: str = "XepHangCungThinh API"
    APP_VERSION: str = "1.0.0"

    # ── Database (Supabase PostgreSQL) ───────────────────────────────────────
    DATABASE_URL: str = "postgresql://user:password@host:5432/dbname"

    # ── Supabase ─────────────────────────────────────────────────────────────
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_ANON_KEY: str = "your-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "your-service-role-key"

    # ── Giới hạn nghiệp vụ ───────────────────────────────────────────────────
    GUEST_ITEM_LIMIT: int = 50          # Giới hạn số kiện hàng cho Guest
    DEFAULT_PAGE_LIMIT: int = 10        # Số bản ghi mỗi trang mặc định


@lru_cache()
def get_settings() -> Settings:
    """
    Trả về singleton Settings. Dùng lru_cache để tránh đọc lại .env nhiều lần trong suốt vòng đời ứng dụng.
    """
    return Settings()
