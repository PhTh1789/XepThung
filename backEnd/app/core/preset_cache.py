"""
Preset Cache – In-memory cache don gian cho du lieu preset (truck va item).

Tai sao khong dung @lru_cache:
  lru_cache cache theo tham so cua ham. Ham get_truck_presets(db) nhan
  db: Session -- moi request la mot Session object khac nhau, nen lru_cache
  se luon miss. Module-level dict khong phu thuoc vao tham so, chinh xac hon.

Vong doi cua cache:
  - Duoc set o lan request dau tien toi /presets (lazy population).
  - Ton tai trong suot vong doi cua process (khong co TTL - Time To Live).
  - Co the invalidate thu cong bang cach goi clear() -- huu ich neu admin
    them/sua/xoa preset qua DB truc tiep va muon server nhan dien ngay.

Dung de mo rong:
  Neu sau nay can TTL, chi can them truong timestamp vao _cache
  va kiem tra tuoi trong ham get(). Khong can doi cau truc hien tai.
"""
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Dict nay song o module level -- duoc khoi tao 1 lan va giu trong RAM.
# Key: "trucks" hoac "items". Value: list[dict] da serialize san.
_cache: dict[str, Any] = {}


def get(key: str) -> list | None:
    """Lay gia tri tu cache. Tra ve None neu chua co."""
    return _cache.get(key)


def set(key: str, value: list) -> None:
    """Luu gia tri vao cache va log lai de de debug."""
    _cache[key] = value
    logger.debug("[PresetCache] SET key='%s', count=%d", key, len(value))


def clear(key: str | None = None) -> None:
    """
    Xoa cache.
    - clear("trucks"): chi xoa cache trucks.
    - clear(): xoa toan bo cache.
    """
    if key:
        _cache.pop(key, None)
        logger.info("[PresetCache] CLEAR key='%s'", key)
    else:
        _cache.clear()
        logger.info("[PresetCache] CLEAR ALL")
