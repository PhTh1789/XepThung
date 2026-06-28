"""
API Router: History (Lịch sử)

Endpoints:
  GET  /api/v1/history               → [Auth], phân trang ?page=1&limit=10
  GET  /api/v1/history/{history_id}  → [Auth]
  POST /api/v1/history               → [Auth], lưu thủ công kết quả tối ưu
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.database.database import get_db
from app.schemas.common import StandardSuccess
from app.schemas.history import HistorySaveRequest
from app.services import history_service

router = APIRouter(prefix="/history", tags=["History"])


# ─────────────────────────────────────────────────────────────────────────────
# GET /history – [Auth]
# ─────────────────────────────────────────────────────────────────────────────
@router.get("", response_model=StandardSuccess, status_code=status.HTTP_200_OK)
async def get_history_list(
    page: int = Query(default=1, ge=1, description="Số trang (bắt đầu từ 1)"),
    limit: int = Query(default=10, ge=1, le=100, description="Số bản ghi mỗi trang"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    **GET /api/v1/history?page=1&limit=10**

    Lấy danh sách tóm tắt lịch sử tối ưu hóa của user (có phân trang).
    """
    data = history_service.get_history_list(db, user_id, page, limit)
    return StandardSuccess(
        message="Lấy lịch sử thành công",
        data=data.model_dump(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /history/{history_id} – [Auth]
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{history_id}", response_model=StandardSuccess, status_code=status.HTTP_200_OK)
async def get_history_detail(
    history_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    **GET /api/v1/history/{history_id}**

    Lấy chi tiết toàn bộ payload JSON của một lịch sử để nạp lại vào 3D viewer.
    """
    detail = history_service.get_history_detail(db, history_id, user_id)
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "status": "error",
                "message": "Không tìm thấy lịch sử hoặc bạn không có quyền truy cập",
                "error_code": "HISTORY_NOT_FOUND",
            },
        )
    return StandardSuccess(
        message="Lấy chi tiết lịch sử thành công",
        data=detail.model_dump(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /history – [Auth] — Lưu thủ công kết quả tối ưu
# ─────────────────────────────────────────────────────────────────────────────
@router.post("", response_model=StandardSuccess, status_code=status.HTTP_201_CREATED)
async def save_history_manually(
    payload: HistorySaveRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    **POST /api/v1/history**

    Lưu thủ công kết quả tối ưu vào lịch sử của user.
    Được gọi khi user chủ động bấm "Lưu kết quả" ở Step 3.
    Không chạy lại thuật toán — chỉ lưu payload đã có sẵn từ FE.
    """
    record = history_service.save_optimization_result(
        db=db,
        user_id=user_id,
        truck_name=payload.truck_name,
        total_items=payload.total_items,
        packed_items_count=payload.packed_items_count,
        unpacked_items_count=payload.unpacked_items_count,
        total_weight=payload.total_weight,
        fill_rate_percent=payload.fill_rate_percent,
        optimization_level=payload.optimization_level,
        result_payload=payload.result_payload,
    )
    return StandardSuccess(
        message="Lưu kết quả vào lịch sử thành công",
        data={"history_id": str(record.id)},
    )


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /history/{history_id} – [Auth]
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/{history_id}", response_model=StandardSuccess, status_code=status.HTTP_200_OK)
async def delete_history(
    history_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    **DELETE /api/v1/history/{history_id}**

    Xóa cứng một bản ghi lịch sử của user hiện tại.
    """
    success = history_service.delete_history(db, history_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "status": "error",
                "message": "Không tìm thấy lịch sử hoặc bạn không có quyền xóa",
                "error_code": "HISTORY_NOT_FOUND",
            },
        )
    return StandardSuccess(
        message="Xóa lịch sử thành công",
        data=None,
    )
