"""
Truck Service – CRUD logic cho TruckPreset và SavedTruck.
"""
import uuid
from typing import List
from sqlalchemy.orm import Session

from app.database.models import TruckPreset, SavedTruck
from app.schemas.truck import TruckCreate


def get_truck_presets(db: Session) -> List[TruckPreset]:
    """Lấy toàn bộ danh sách xe tải mặc định của hệ thống."""
    return db.query(TruckPreset).order_by(TruckPreset.max_weight).all()


def get_saved_trucks(db: Session, user_id: str) -> List[SavedTruck]:
    """Lấy danh sách xe tải đã lưu của một user cụ thể."""
    return (
        db.query(SavedTruck)
        .filter(SavedTruck.user_id == user_id)
        .order_by(SavedTruck.created_at.desc())
        .all()
    )


def create_saved_truck(db: Session, user_id: str, data: TruckCreate) -> SavedTruck:
    """Lưu cấu hình xe tải mới cho user."""
    truck = SavedTruck(
        user_id=user_id,
        **data.model_dump(),
    )
    db.add(truck)
    db.commit()
    db.refresh(truck)
    return truck


def delete_saved_truck(db: Session, truck_id: str, user_id: str) -> bool:
    """
    Xóa xe tải đã lưu.
    Trả về True nếu xóa thành công, False nếu không tìm thấy
    hoặc không thuộc về user này.
    """
    truck = (
        db.query(SavedTruck)
        .filter(
            SavedTruck.id == truck_id,
            SavedTruck.user_id == user_id,
        )
        .first()
    )
    if not truck:
        return False
    db.delete(truck)
    db.commit()
    return True
