"""
API Router: Trucks (Xe tải)

Endpoints:
  GET  /api/v1/trucks/presets        → Public
  GET  /api/v1/trucks/saved          → [Auth]
  POST /api/v1/trucks/saved          → [Auth]
  DELETE /api/v1/trucks/saved/{id}   → [Auth]
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.auth import get_current_user
from app.core import preset_cache
from app.database.database import get_db
from app.schemas.common import StandardSuccess
from app.schemas.truck import TruckCreate, TruckResponse
from app.services import truck_service

router = APIRouter(prefix="/trucks", tags=["Trucks"])


# ─────────────────────────────────────────────────────────────────────────────
# GET /trucks/presets – Public
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/presets", response_model=StandardSuccess, status_code=status.HTTP_200_OK)
def get_truck_presets(db: Session = Depends(get_db)):
    """
    **GET /api/v1/trucks/presets**

    Lay danh sach xe tai mac dinh cua he thong (khong can dang nhap).
    Lan dau tien query DB, cac lan sau tra tu RAM cache.
    """
    import logging
    logger = logging.getLogger(__name__)

    cached = preset_cache.get("trucks")
    if cached is not None:
        logger.debug("[PresetCache] HIT key='trucks', tra ve %d ban ghi tu cache.", len(cached))
        return StandardSuccess(
            message="Lay danh sach xe tai mac dinh thanh cong",
            data=cached,
        )

    # Cache miss: query DB, serialize, roi luu vao cache.
    presets = truck_service.get_truck_presets(db)
    data = [TruckResponse.model_validate(p).model_dump() for p in presets]
    preset_cache.set("trucks", data)
    logger.debug("[PresetCache] MISS key='trucks', da query DB va cache %d ban ghi.", len(data))

    return StandardSuccess(
        message="Lấy danh sách xe tải mặc định thành công",
        data=data,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /trucks/saved – [Auth]
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/saved", response_model=StandardSuccess, status_code=status.HTTP_200_OK)
async def get_saved_trucks(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    **GET /api/v1/trucks/saved**

    Lấy danh sách xe tải đã lưu của user đang đăng nhập.
    """
    trucks = truck_service.get_saved_trucks(db, user_id)
    data = [TruckResponse.model_validate(t).model_dump() for t in trucks]
    return StandardSuccess(
        message="Lấy danh sách xe tải đã lưu thành công",
        data=data,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /trucks/saved – [Auth]
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/saved", response_model=StandardSuccess, status_code=status.HTTP_201_CREATED)
async def create_saved_truck(
    payload: TruckCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    **POST /api/v1/trucks/saved**

    Lưu cấu hình xe tải mới cho user.
    """
    truck = truck_service.create_saved_truck(db, user_id, payload)
    return StandardSuccess(
        message="Lưu cấu hình xe tải thành công",
        data=TruckResponse.model_validate(truck).model_dump(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /trucks/saved/{truck_id} – [Auth]
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/saved/{truck_id}", response_model=StandardSuccess, status_code=status.HTTP_200_OK)
async def delete_saved_truck(
    truck_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    **DELETE /api/v1/trucks/saved/{truck_id}**

    Xóa một cấu hình xe tải đã lưu. Chỉ xóa được xe của chính mình.
    """
    deleted = truck_service.delete_saved_truck(db, truck_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "status": "error",
                "message": "Không tìm thấy xe tải hoặc bạn không có quyền xóa",
                "error_code": "TRUCK_NOT_FOUND",
            },
        )
    return StandardSuccess(message="Xóa xe tải thành công", data=None)
