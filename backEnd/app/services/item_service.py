"""
Item Service – CRUD logic cho ItemPreset va SavedItem.
"""
from typing import List
from sqlalchemy.orm import Session

from app.database.models import ItemPreset, SavedItem
from app.schemas.item import ItemCreate


def get_item_presets(db: Session) -> List[ItemPreset]:
    """Lay toan bo danh sach kien hang mau cua he thong, sap xep theo trong luong tang dan."""
    return db.query(ItemPreset).order_by(ItemPreset.weight).all()


def get_saved_items(db: Session, user_id: str) -> List[SavedItem]:
    """Lấy danh sách kiện hàng đã lưu của một user."""
    return (
        db.query(SavedItem)
        .filter(SavedItem.user_id == user_id)
        .order_by(SavedItem.created_at.desc())
        .all()
    )


def create_saved_item(db: Session, user_id: str, data: ItemCreate) -> SavedItem:
    """Lưu một kiện hàng mới cho user."""
    item = SavedItem(
        user_id=user_id,
        **data.model_dump(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_saved_item(db: Session, item_id: str, user_id: str) -> bool:
    """
    Xóa kiện hàng đã lưu.
    Trả về True nếu xóa thành công, False nếu không tìm thấy
    hoặc không thuộc về user này (bảo vệ dữ liệu người dùng).
    """
    item = (
        db.query(SavedItem)
        .filter(
            SavedItem.id == item_id,
            SavedItem.user_id == user_id,
        )
        .first()
    )
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True
