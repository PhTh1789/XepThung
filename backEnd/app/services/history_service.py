"""
History Service – Lưu và truy vấn lịch sử tối ưu hóa.

Hỗ trợ phân trang đúng theo API_Contract.md.
"""
import math
from typing import Tuple, List, Any
from sqlalchemy.orm import Session

from app.database.models import OptimizationHistory
from app.schemas.history import HistoryRecord, HistoryMeta, HistoryListData, HistoryDetailData


def save_optimization_result(
    db: Session,
    user_id: str,
    truck_name: str,
    total_items: int,
    packed_items_count: int,
    unpacked_items_count: int,
    total_weight: float,
    fill_rate_percent: float,
    optimization_level: str,
    result_payload: Any,
) -> OptimizationHistory:
    """
    Lưu kết quả một lần chạy tối ưu vào lịch sử.
    result_payload là toàn bộ OptimizeData dict (để nạp lại vào 3D viewer).
    """
    record = OptimizationHistory(
        user_id=user_id,
        truck_name=truck_name,
        total_items=total_items,
        packed_items_count=packed_items_count,
        unpacked_items_count=unpacked_items_count,
        total_weight=int(total_weight),
        fill_rate_percent=fill_rate_percent,
        optimization_level=optimization_level,
        result_payload=result_payload,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_history_list(
    db: Session, user_id: str, page: int = 1, limit: int = 10
) -> HistoryListData:
    """
    Lấy danh sách lịch sử có phân trang.
    Trả về HistoryListData (records + meta).
    """
    offset = (page - 1) * limit
    total_records = (
        db.query(OptimizationHistory)
        .filter(OptimizationHistory.user_id == user_id)
        .count()
    )
    total_pages = math.ceil(total_records / limit) if total_records > 0 else 1

    records_db = (
        db.query(OptimizationHistory)
        .filter(OptimizationHistory.user_id == user_id)
        .order_by(OptimizationHistory.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    records = [
        HistoryRecord(
            history_id=r.id,
            created_at=r.created_at,
            truck_name=r.truck_name,
            total_items=r.total_items,
            fill_rate_percent=r.fill_rate_percent,
            optimization_level=r.optimization_level,
        )
        for r in records_db
    ]

    meta = HistoryMeta(
        current_page=page,
        total_pages=total_pages,
        total_records=total_records,
    )

    return HistoryListData(records=records, meta=meta)


def get_history_detail(
    db: Session, history_id: str, user_id: str
) -> HistoryDetailData | None:
    """
    Lấy chi tiết một lịch sử cụ thể.
    Trả về None nếu không tìm thấy hoặc không thuộc về user này.
    """
    record = (
        db.query(OptimizationHistory)
        .filter(
            OptimizationHistory.id == history_id,
            OptimizationHistory.user_id == user_id,
        )
        .first()
    )
    if not record:
        return None

    return HistoryDetailData(
        history_id=record.id,
        created_at=record.created_at,
        truck_name=record.truck_name,
        optimization_level=record.optimization_level,
        result_payload=record.result_payload,
    )

def delete_history(
    db: Session, history_id: str, user_id: str
) -> bool:
    """
    Xóa cứng một bản ghi lịch sử.
    Trả về True nếu xóa thành công, False nếu không tìm thấy hoặc không có quyền.
    """
    record = (
        db.query(OptimizationHistory)
        .filter(
            OptimizationHistory.id == history_id,
            OptimizationHistory.user_id == user_id,
        )
        .first()
    )
    
    if not record:
        return False
        
    db.delete(record)
    db.commit()
    return True
