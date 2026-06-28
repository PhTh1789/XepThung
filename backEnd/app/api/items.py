"""
API Router: Items (Kiện hàng)

Endpoints:
  GET  /api/v1/items/presets        -> Public
  GET  /api/v1/items/saved          -> [Auth]
  POST /api/v1/items/saved          -> [Auth]
  DELETE /api/v1/items/saved/{id}   -> [Auth]
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core import preset_cache
from app.database.database import get_db
from app.schemas.common import StandardSuccess
from app.schemas.item import ItemCreate, ItemResponse, ItemPresetResponse
from app.services import item_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/items", tags=["Items"])


# ─────────────────────────────────────────────────────────────────────────────
# GET /items/presets – Public
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/presets", response_model=StandardSuccess, status_code=status.HTTP_200_OK)
def get_item_presets(db: Session = Depends(get_db)):
    """
    **GET /api/v1/items/presets**

    Lay danh sach kien hang mau goi y mac dinh (khong can dang nhap).
    Lan dau tien query DB, cac lan sau tra tu RAM cache.
    """
    cached = preset_cache.get("items")
    if cached is not None:
        logger.debug("[PresetCache] HIT key='items', tra ve %d ban ghi tu cache.", len(cached))
        return StandardSuccess(
            message="Lay danh sach goi y hang hoa thanh cong",
            data=cached,
        )

    # Cache miss: query DB, serialize bang ItemPresetResponse, roi luu vao cache.
    # Dung ItemPresetResponse (khong phai ItemResponse) de the hien ro day la
    # du lieu he thong, khong phai du lieu cua user.
    presets = item_service.get_item_presets(db)
    data = [ItemPresetResponse.model_validate(p).model_dump() for p in presets]
    preset_cache.set("items", data)
    logger.debug("[PresetCache] MISS key='items', da query DB va cache %d ban ghi.", len(data))

    return StandardSuccess(
        message="Lay danh sach goi y hang hoa thanh cong",
        data=data,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /items/saved – [Auth]
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/saved", response_model=StandardSuccess, status_code=status.HTTP_200_OK)
async def get_saved_items(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    **GET /api/v1/items/saved**

    Lấy danh sách kiện hàng đã lưu của user đang đăng nhập.
    """
    items = item_service.get_saved_items(db, user_id)
    data = [ItemResponse.model_validate(i).model_dump() for i in items]
    return StandardSuccess(
        message="Lấy danh sách kiện hàng đã lưu thành công",
        data=data,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /items/saved – [Auth]
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/saved", response_model=StandardSuccess, status_code=status.HTTP_201_CREATED)
async def create_saved_item(
    payload: ItemCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    **POST /api/v1/items/saved**

    Lưu một kiện hàng mới cho user (không có quantity – đây là template).
    """
    item = item_service.create_saved_item(db, user_id, payload)
    return StandardSuccess(
        message="Lưu kiện hàng thành công",
        data=ItemResponse.model_validate(item).model_dump(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /items/saved/{item_id} – [Auth]
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/saved/{item_id}", response_model=StandardSuccess, status_code=status.HTTP_200_OK)
async def delete_saved_item(
    item_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    **DELETE /api/v1/items/saved/{item_id}**

    Xóa một kiện hàng đã lưu. Chỉ xóa được kiện hàng của chính mình.
    """
    deleted = item_service.delete_saved_item(db, item_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "status": "error",
                "message": "Không tìm thấy kiện hàng hoặc bạn không có quyền xóa",
                "error_code": "ITEM_NOT_FOUND",
            },
        )
    return StandardSuccess(message="Xóa kiện hàng thành công", data=None)
