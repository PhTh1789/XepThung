"""
Pydantic Schemas cho Truck (xe tải).

Kích thước tính bằng mm (Integer), khối lượng bằng gram (Integer).
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ─────────────────────────────────────────────────────────────────────────────
# Base – Các trường dùng chung
# ─────────────────────────────────────────────────────────────────────────────
class TruckBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Isuzu QKR - 5 Tấn"])
    length: int = Field(..., gt=0, description="Chiều dài thùng xe (mm)")
    width: int = Field(..., gt=0, description="Chiều rộng thùng xe (mm)")
    height: int = Field(..., gt=0, description="Chiều cao thùng xe (mm)")
    max_weight: int = Field(..., gt=0, description="Tải trọng tối đa (gram)")


# ─────────────────────────────────────────────────────────────────────────────
# Create – Dùng cho POST request body
# ─────────────────────────────────────────────────────────────────────────────
class TruckCreate(TruckBase):
    """Payload để tạo/lưu một xe tải mới."""
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Response – Dữ liệu trả về từ DB
# ─────────────────────────────────────────────────────────────────────────────
class TruckResponse(TruckBase):
    """Dữ liệu xe tải trả về từ DB (bao gồm id và timestamp)."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
