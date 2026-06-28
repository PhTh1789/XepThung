"""
Pydantic Schemas cho History API (GET /history, GET /history/{id}, POST /history).

Theo API_Contract.md:
  - HistoryRecord     : Một bản ghi tóm tắt trong danh sách lịch sử
  - HistoryMeta       : Thông tin phân trang
  - HistoryListData   : Phần "data" của GET /history
  - HistoryDetailData : Phần "data" của GET /history/{id} (có truck trong result_payload)
  - HistorySaveRequest: Payload POST /history (lưu thủ công)
"""
import uuid
from datetime import datetime
from typing import List, Any, Dict
from pydantic import BaseModel


class HistoryRecord(BaseModel):
    """Tóm tắt một lần chạy tối ưu (dùng cho danh sách)."""
    history_id: uuid.UUID
    created_at: datetime
    truck_name: str
    total_items: int
    fill_rate_percent: float
    optimization_level: str

    class Config:
        from_attributes = True


class HistoryMeta(BaseModel):
    """Metadata phân trang."""
    current_page: int
    total_pages: int
    total_records: int


class HistoryListData(BaseModel):
    """Phần 'data' trong response GET /history."""
    records: List[HistoryRecord]
    meta: HistoryMeta


class HistoryDetailData(BaseModel):
    """Phần 'data' trong response GET /history/{id}.
    result_payload có cấu trúc mở rộng: { truck: {...}, optimize_data: {...} }
    """
    history_id: uuid.UUID
    created_at: datetime
    truck_name: str
    optimization_level: str
    result_payload: Any  # Full JSON payload để nạp vào 3D viewer


class HistorySaveRequest(BaseModel):
    """Payload POST /api/v1/history — Lưu thủ công kết quả tối ưu vào lịch sử.
    Cho phép FE gửi đớn điều khiển việc lưu mà không cần chạy lại thuật toán.
    """
    truck_name: str
    optimization_level: str
    total_items: int
    packed_items_count: int
    unpacked_items_count: int
    total_weight: float
    fill_rate_percent: float
    result_payload: Dict[str, Any]  # { "truck": {...}, "optimize_data": {...} }
