"""
SQLAlchemy ORM Models – ánh xạ 4 bảng trongoi Supabase PostgreSQL.

Bảng:
  - truck_presets      : Xe tải mặc định do hệ thống cung cấp (read-only).
  - saved_trucks       : Xe tải người dùng tự lưu.
  - saved_items        : Kiện hàng người dùng tự lưu.
  - optimization_history: Lịch sử mỗi lần chạy thuật toán tối ưu.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    DateTime, Text, ForeignKey, JSON,
)
from sqlalchemy.dialects.postgresql import UUID

from app.database.database import Base


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Truck Presets – Danh sách xe tải mặc định của hệ thống
# ─────────────────────────────────────────────────────────────────────────────
class TruckPreset(Base):
    __tablename__ = "truck_presets"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    name = Column(String(100), nullable=False)          # "Isuzu QKR - 5 Tấn"
    length = Column(Integer, nullable=False)             # mm
    width = Column(Integer, nullable=False)              # mm
    height = Column(Integer, nullable=False)             # mm
    max_weight = Column(Integer, nullable=False)         # gram
    created_at = Column(DateTime(timezone=True), default=_now_utc)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Saved Trucks – Xe tải người dùng tự lưu
# ─────────────────────────────────────────────────────────────────────────────
class SavedTruck(Base):
    __tablename__ = "saved_trucks"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    user_id = Column(String(36), nullable=False, index=True)  # Supabase user UUID
    name = Column(String(100), nullable=False)
    length = Column(Integer, nullable=False)             # mm
    width = Column(Integer, nullable=False)              # mm
    height = Column(Integer, nullable=False)             # mm
    max_weight = Column(Integer, nullable=False)         # gram
    created_at = Column(DateTime(timezone=True), default=_now_utc)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Saved Items – Kiện hàng người dùng tự lưu
# ─────────────────────────────────────────────────────────────────────────────
class SavedItem(Base):
    __tablename__ = "saved_items"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    user_id = Column(String(36), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    length = Column(Integer, nullable=False)             # mm
    width = Column(Integer, nullable=False)              # mm
    height = Column(Integer, nullable=False)             # mm
    weight = Column(Integer, nullable=False)             # gram
    color = Column(String(20), nullable=False, default="#0059BB")
    created_at = Column(DateTime(timezone=True), default=_now_utc)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Item Presets – Danh sach kien hang mau do he thong cung cap (read-only)
# ─────────────────────────────────────────────────────────────────────────────
# Giong het SavedItem nhung khong co user_id .
# Duoc seed tu seeder.py khi khoi dong va khong thay doi trong runtime.
class ItemPreset(Base):
    __tablename__ = "item_presets"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    name   = Column(String(100), nullable=False)
    length = Column(Integer, nullable=False)             # mm
    width  = Column(Integer, nullable=False)             # mm
    height = Column(Integer, nullable=False)             # mm
    weight = Column(Integer, nullable=False)             # gram
    color  = Column(String(20), nullable=False, default="#0059BB")
    created_at = Column(DateTime(timezone=True), default=_now_utc)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Optimization History – Lịch sử chạy thuật toán
# ─────────────────────────────────────────────────────────────────────────────
class OptimizationHistory(Base):
    __tablename__ = "optimization_history"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    user_id = Column(String(36), nullable=False, index=True)
    # Thông tin tóm tắt (hiển thị nhanh trong danh sách)
    truck_name = Column(String(100), nullable=False)
    total_items = Column(Integer, nullable=False)
    packed_items_count = Column(Integer, nullable=False)
    unpacked_items_count = Column(Integer, nullable=False)
    total_weight = Column(Integer, nullable=False)       # gram
    fill_rate_percent = Column(Float, nullable=False)
    optimization_level = Column(String(10), nullable=False)  # "fast" | "deep"
    # Full JSON payload để nạp lại vào 3D viewer
    result_payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now_utc)
