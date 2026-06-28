"""
API Router: Optimizer
Endpoint: POST /api/v1/optimize

Phan quyen:
  - Guest (khong co token): gioi han 50 items tong.
  - Member (co token hop le): khong gioi han, ket qua duoc luu vao history.

Smart Auto-Routing:
  Khi nhan duoc optimization_level='auto', ham evaluate_auto_mode()
  phan tich payload theo 3 tieu chi de tu quyet dinh 'fast' hay 'deep'.
"""
import logging
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.auth import get_optional_user
from app.database.database import get_db
from app.schemas.optimizer import OptimizeRequest, OptimizeResponse, OptimizeData
from app.services import optimizer_service, history_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/optimize", tags=["Optimizer"])


# ─────────────────────────────────────────────────────────────────────────────
# Smart Auto-Routing: Phan tich payload de quyet dinh fast vs deep
# ─────────────────────────────────────────────────────────────────────────────
def evaluate_auto_mode(payload: OptimizeRequest) -> Literal["fast", "deep"]:
    """
    Phan tich payload va tu dong quyet dinh nen chay 'fast' hay 'deep'.

    Tieu chi quyet dinh 'fast' (bat ky dieu kien nao dung -> fast):
      1. Volume Ratio < 70%: Hang qua it so voi thung, bai toan don gian,
         GA khong mang lai nhieu gia tri hon heuristic thong thuong.
      2. Unique types <= 2: It loai hang -> khong gian hoan vi nho (chi co n!/(n1!*n2!)
         hoan vi thuc su khac nhau), GA mat cong ma hieu qua tuong duong fast.

    Truoc day co tieu chi thu 3 (total_quantity > 150 -> fast) nhung da loai bo
    vi Dynamic Deep Scaling trong run_deep_optimization da tu giam num_generations
    khi items nhieu -- deep van chay duoc voi items lon ma khong can force sang fast.

    Returns:
        'fast' hoac 'deep'
    """
    truck = payload.truck
    items = payload.items

    # Tiêu chí 1: Volume Ratio
    truck_volume = truck.length * truck.width * truck.height
    items_volume = sum(
        item.length * item.width * item.height * item.quantity
        for item in items
    )
    volume_ratio = (items_volume / truck_volume * 100.0) if truck_volume > 0 else 0.0

    # Tiêu chí 2: Số loại kiện hàng độc nhất (by item.id)
    unique_types = len({item.id for item in items})

    logger.debug(
        "[AUTO] volume_ratio=%.1f%%, unique_types=%d",
        volume_ratio, unique_types,
    )
    # Điều kiện để chọn fast mode
    if volume_ratio < 70.0 or unique_types <= 2:
        return "fast"
    return "deep"


# ─────────────────────────────────────────────────────────────────────────────
# Endpoint: POST /optimize
# ─────────────────────────────────────────────────────────────────────────────
@router.post("", response_model=OptimizeResponse, status_code=status.HTTP_200_OK)
async def run_optimize(
    payload: OptimizeRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_optional_user),
):
    """
    **POST /api/v1/optimize**

    Chay thuat toan xep hang 3D.

    - `auto`  → Backend tu phan tich va chon fast/deep (mac dinh).
    - `fast`  → Ep buoc chi dung py3dbp (< 0.5s).
    - `deep`  → Ep buoc PyGAD + py3dbp (3-5s, do lap day toi da).

    Ket qua tra ve co `summary.resolved_mode` de Frontend biet che do
    thuc te da chay (quan trong khi input la 'auto').

    **Phan quyen:**
    - Guest: tong so luong items <= 50.
    - Member: khong gioi han, ket qua tu dong luu vao lich su.
    """
    settings = get_settings()

    # ── Kiem tra gioi han Guest ──────────────────────────────────────────────
    total_quantity = sum(item.quantity for item in payload.items)
    if user_id is None and total_quantity > settings.GUEST_ITEM_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "status": "error",
                "message": f"Vuot qua gioi han {settings.GUEST_ITEM_LIMIT} kien hang cho tai khoan Khach",
                "error_code": "GUEST_LIMIT_EXCEEDED",
            },
        )

    # ── Resolve optimization_level neu la 'auto' ─────────────────────────────
    resolved_level: Literal["fast", "deep"]
    if payload.optimization_level == "auto":
        resolved_level = evaluate_auto_mode(payload)
        logger.info(
            "Auto-routing resolved: level=%s -> %s, items=%d, user=%s",
            payload.optimization_level,
            resolved_level,
            total_quantity,
            user_id or "guest",
        )
    else:
        resolved_level = payload.optimization_level  # type: ignore[assignment]
        logger.info(
            "Optimize request: level=%s (forced), items=%d, user=%s",
            resolved_level,
            total_quantity,
            user_id or "guest",
        )

    # ── Chay thuat toan theo resolved_level ─────────────────────────────────
    if resolved_level == "deep":
        result_data: OptimizeData = optimizer_service.run_deep_optimization(payload)
    else:
        result_data: OptimizeData = optimizer_service.run_fast_optimization(payload)

    # ── Luu lich su (chi cho Member VA khi user chu dong chon luu) ───────────────────
    if user_id is not None and payload.save_to_history:
        try:
            # Goi result_payload bao gom ca truck de Frontend co the Restore 3D day du
            extended_payload = {
                "truck": payload.truck.model_dump(),
                "optimize_data": result_data.model_dump(),
            }
            history_service.save_optimization_result(
                db=db,
                user_id=user_id,
                truck_name=payload.truck.name,
                total_items=result_data.summary.total_items,
                packed_items_count=result_data.summary.packed_items_count,
                unpacked_items_count=result_data.summary.unpacked_items_count,
                total_weight=result_data.summary.total_weight,
                fill_rate_percent=result_data.summary.fill_rate_percent,
                optimization_level=payload.optimization_level,
                result_payload=extended_payload,
            )
        except Exception as e:
            # Khong de loi luu history anh huong den ket qua tra ve
            logger.error("Loi khi luu history: %s", str(e))

    return OptimizeResponse(
        status="success",
        message="Tinh toan xep hang thanh cong",
        data=result_data,
    )
