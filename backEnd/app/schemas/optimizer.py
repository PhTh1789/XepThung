"""
Pydantic Schemas cho Optimizer API (POST /optimize).

Định nghĩa đúng theo API_Contract:
  - OptimizeRequest  : Payload đầu vào
  - PackedItem       : Một kiện hàng đã được xếp thành công
  - Coordinates      : Vị trí (x, y, z)
  - Dimensions       : Kích thước sau khi xếp (có thể đã xoay)
  - OptimizeSummary  : Thống kê tổng hợp kết quả
  - OptimizeData     : Phần "data" trong response
  - OptimizeResponse : Response hoàn chỉnh theo Standard Success
"""
from typing import Literal, List, Optional
from pydantic import BaseModel, Field, model_validator

from app.schemas.truck import TruckBase
from app.schemas.item import ItemInput


# ─────────────────────────────────────────────────────────────────────────────
# Request
# ─────────────────────────────────────────────────────────────────────────────
class OptimizeRequest(BaseModel):
    """Payload gửi lên POST /optimize."""
    optimization_level: Literal["auto", "fast", "deep"] = Field(
        default="auto",
        description=(
            "'auto': Backend tự quyết định (mặc định) "
            "'fast': ép buộc chỉ py3dbp "
            "'deep': ép buộc PyGAD + py3dbp "
        ),
    )
    truck: TruckBase
    items: List[ItemInput] = Field(..., min_length=1)
    save_to_history: bool = Field(
        default=False,
        description="Cho phép user chủ động chọn lưu kết quả vào lịch sử. Mặc định False để tránh lưu tự động."
    )
    load_margin: float = Field(
        default=5.0,
        description="Dung sai xếp hàng (%), mô phỏng khoảng trống do chừa chỗ cho tay người hoặc thùng phình ra."
    )

    @model_validator(mode="after")
    def validate_cargo_rules(self) -> "OptimizeRequest":
        """
        Chốt chặn cuối trước khi request đi vao optimizer.
        Kiểm tra các điều kiện vật lý cơ bản -- catch lỗi nếu lỡ frontEnd làm sót.

        Hai quy tắc:
          1. Quá tải: tổng trọng lượng thực tế vượt quá tải trọng tối đa của xe.
          2. Quá khổ (Sort-3D Fit Check): sắp xếp tăng dần cả 2 bộ kích thước,
             so sánh từng cấp. Nếu có cấp fail thì kiện hàng không thể loc vào
             thùng xe dù xoay theo hướng nào.
             Chứng minh: mapping chieu-nho-nhat voi chieu-nho-nhat la mapping
             tối ưu nhất. Nếu fail thì mọi mapping khác cũng fail.
        """
        truck = self.truck
        items = self.items
        errors: list[str] = []

        # Luat 1: Qua tai
        total_weight = sum(item.weight * item.quantity for item in items)
        if total_weight > truck.max_weight:
            errors.append(
                "Quá tải: Tổng trọng lượng hàng hóa vượt quá tải trọng tối đa của xe."
            )

        # Luat 2: Qua kho
        # Sort ca hai bo kich thuoc tang dan truoc khi so sanh.
        # Khong can kiem tra tung kieu xoay rieng le -- Sort-3D la du.
        truck_dims = sorted([truck.length, truck.width, truck.height])
        for item in items:
            item_dims = sorted([item.length, item.width, item.height])
            cannot_fit = any(item_dims[i] > truck_dims[i] for i in range(3))
            if cannot_fit:
                errors.append(
                    f"Quá khổ: Kiện hàng '{item.name}' không thể xếp vừa thùng xe dù xoay theo hướng nào."
                )

        if errors:
            # Join cac loi lai de raise 1 ValueError duy nhat.
            # FastAPI se bat cai nay va chuyen thanh HTTP 422 (hoac 400 neu ta override).
            raise ValueError(" | ".join(errors))

        return self


# ─────────────────────────────────────────────────────────────────────────────
# Response sub-models
# ─────────────────────────────────────────────────────────────────────────────
class Coordinates(BaseModel):
    """Vị trí góc dưới-trái-trước của kiện hàng trong thùng xe (mm)."""
    x: float
    y: float
    z: float


class Dimensions(BaseModel):
    """Kích thước thực tế của kiện hàng sau khi xếp (có thể đã xoay)."""
    length: float
    width: float
    height: float


class PackedItem(BaseModel):
    """Thông tin một kiện hàng đã được xếp thành công vào thùng xe."""
    id: str                        # Ví dụ: "item_001_1" (item_id + số thứ tự)
    name: str
    color: str
    step_sequence: int             # Thứ tự xếp lên xe (dùng cho Playback)
    coordinates: Coordinates       # Vị trí góc (x, y, z) sau Y-Z Swap
    dimensions: Dimensions         # Kích thước thực tế sau khi xếp
    is_rotated: bool
    rotation_type: str             # "NONE" | "L_W_SWAP" | v.v.


class UnpackedItem(BaseModel):
    """Kiện hàng không thể xếp vào thùng (vượt quá tải trọng hoặc thể tích)."""
    id: str
    name: str
    reason: str = "Không đủ không gian trong thùng xe"


class OptimizeSummary(BaseModel):
    """Thống kê tổng hợp sau khi chạy thuật toán."""
    total_items: int
    packed_items_count: int
    unpacked_items_count: int
    total_weight: float              # gram
    fill_rate_percent: float         # % không gian đã dùng
    resolved_mode: Literal["fast", "deep"]  # Chế độ thực tế đã chạy (hữu ích khi input là 'auto')


class OptimizeData(BaseModel):
    """Phần 'data' trong response của POST /optimize."""
    summary: OptimizeSummary
    packed_items: List[PackedItem]
    unpacked_items: List[UnpackedItem]


class OptimizeResponse(BaseModel):
    """Response hoàn chỉnh của POST /optimize."""
    status: str = "success"
    message: str = "Tính toán xếp hàng thành công"
    data: OptimizeData
