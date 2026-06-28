"""
Pydantic Schemas cho Item (kiện hàng).

Kích thước tính bằng mm (Integer), khối lượng bằng gram (Integer).
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ─────────────────────────────────────────────────────────────────────────────
# Base – Các trường dùng chung cho một loại kiện hàng
# ─────────────────────────────────────────────────────────────────────────────
class ItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Máy công nghiệp"])
    length: int = Field(..., gt=0, description="Chiều dài kiện hàng (mm)")
    width: int = Field(..., gt=0, description="Chiều rộng kiện hàng (mm)")
    height: int = Field(..., gt=0, description="Chiều cao kiện hàng (mm)")
    weight: int = Field(..., gt=0, description="Khối lượng (gram)")
    color: str = Field(default="#0059BB", examples=["#0059BB"])


# ─────────────────────────────────────────────────────────────────────────────
# Create – Dùng cho POST /items/saved (không có quantity)
# ─────────────────────────────────────────────────────────────────────────────
class ItemCreate(ItemBase):
    """
    Payload để lưu một kiện hàng vào danh sách của user.
    Không có quantity (đây là template, không phải đơn hàng cụ thể).
    """
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Input Item – Dùng trong request body của POST /optimize
# ─────────────────────────────────────────────────────────────────────────────
class ItemInput(ItemBase):
    """
    Một kiện hàng trong payload gửi lên /optimize.
    Có thêm id (client-generated) và quantity.
    """
    id: str = Field(..., examples=["item_001"])
    quantity: int = Field(..., ge=1, description="Số lượng kiện hàng")


# ─────────────────────────────────────────────────────────────────────────────
# Response – Du lieu kien hang da luu cua user
# ─────────────────────────────────────────────────────────────────────────────
class ItemResponse(ItemBase):
    """Kien hang da luu, tra ve tu DB."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime


# ─────────────────────────────────────────────────────────────────────────────
# Preset Response – Du lieu kien hang mau cua he thong
# ─────────────────────────────────────────────────────────────────────────────
# Tach rieng voi ItemResponse de the hien ro rang la du lieu khac nhau
# (preset la read-only, saved la cua tung user).
# Cau truc giong het nhung giu rieng de sau nay co the them field neu can.
class ItemPresetResponse(ItemBase):
    """Kien hang mau cua he thong (doc tu bang item_presets), tra ve qua GET /items/presets."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
