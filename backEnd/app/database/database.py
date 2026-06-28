"""
Cấu hình kết nối Database bằng SQLAlchemy.

Cung cấp:
- get_engine()   : Hàm lấy (lazy-init) SQLAlchemy Engine.
- SessionLocal   : Session factory dùng để tạo DB session.
- Base           : Declarative base cho tất cả ORM Models.
- get_db()       : FastAPI Dependency để inject DB session vào route handlers.

!!! Note: Engine được khởi tạo lazily để server có thể start kể cả khi .env chưa có DATABASE_URL hợp lệ (tránh crash khi import module).
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from typing import Generator

from app.core.config import get_settings

# ── Lazy engine holder ────────────────────────────────────────────────────────
_engine = None
_session_factory = None


def get_engine():
    """
    Trả về SQLAlchemy engine (tạo mới nếu chưa có).
    Lazy init để tránh crash khi import trong môi trường chưa có .env.
    """
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,   # Kiểm tra connection còn sống trước mỗi request
            pool_size=5,
            max_overflow=10,
        )
    return _engine


def get_session_factory():
    """Trả về session factory (tạo mới nếu chưa có)."""
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            bind=get_engine(),
            autocommit=False,
            autoflush=False,
        )
    return _session_factory


# Alias tiện lợi cho startup event trong main.py
@property
def engine():
    return get_engine()


class Base(DeclarativeBase):
    """Base class cho tất cả SQLAlchemy ORM Models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI Dependency: Tạo một DB session mới cho mỗi request,
    đảm bảo session được đóng sau khi request hoàn thành.

    Cách dùng:
        @app.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

