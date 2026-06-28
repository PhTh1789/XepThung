"""
Database Seeder – Tự động chèn dữ liệu mặc định khi DB còn trống.

Dữ liệu seed (đồng bộ theo base unit là mm và gram):
    - 3 Truck Presets (xe tải thực tế tại Việt Nam): 1.5 Tấn, 3.5 Tấn, 5 Tấn.
    - 3 Item Presets (kiện hàng mẫu): Carton A, B, C.

Nguyen tac idempotent:
    - Mỗi hàm seed kiểm tra count trước khi thêm -> Gọi nhiều lần vẫn oke.
    Server co the restart thoai mai ma khong lo bi duplicate data.
"""
import logging
import uuid
from sqlalchemy.orm import Session

from app.database.models import TruckPreset, ItemPreset

logger = logging.getLogger(__name__)

# Namespace duy nhất cho ứng dụng để băm ID (Deterministic UUIDv5)
KLTN_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, "kltn.xep_hang_cung_thinh.com")

# ─────────────────────────────────────────────────────────────────────────────
# Du lieu seed
# ─────────────────────────────────────────────────────────────────────────────
TRUCK_PRESETS_SEED = [
    {
        "seed_code": "truck_1_5_ton",
        "name": "Xe tải 1.5 Tấn",
        "length": 4500, #mm
        "width": 2100, #mm
        "height": 2100, #mm
        "max_weight": 1500000, #gram
    },
    {
        "seed_code": "truck_3_5_ton",
        "name": "Thaco Ollin 3.5 Tấn",
        "length": 5300,
        "width": 2200,
        "height": 2400,
        "max_weight": 3500000,
    },
    {
        "seed_code": "truck_5_ton",
        "name": "Isuzu QKR - 5 Tấn",
        "length": 6000,
        "width": 2200,
        "height": 2400,
        "max_weight": 5000000,
    },
]

ITEM_PRESETS_SEED = [
    {
        "seed_code": "carton_a",
        "name": "Carton A",
        "length": 600,
        "width": 400,
        "height": 400,
        "weight": 15000,
        "color": "#0059BB",
    },
    {
        "seed_code": "carton_b",
        "name": "Carton B",
        "length": 800,
        "width": 600,
        "height": 600,
        "weight": 25000,
        "color": "#FD8B00",
    },
    {
        "seed_code": "carton_c",
        "name": "Carton C",
        "length": 1000,
        "width": 800,
        "height": 600,
        "weight": 35000,
        "color": "#16A34A",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Cac ham seed rieng le
# ─────────────────────────────────────────────────────────────────────────────
def seed_truck_presets(db: Session) -> None:
    """
    Cập nhật dữ liệu truck presets theo cơ chế Optimized Bulk Upsert.
    Sử dụng UUIDv5 Deterministic Hashing để quản lý ID theo seed_code.
    """
    # 1. Băm UUID cố định từ seed_code
    for seed in TRUCK_PRESETS_SEED:
        if "seed_code" in seed:
            seed_code = seed.pop("seed_code")
            seed["id"] = uuid.uuid5(KLTN_NAMESPACE, seed_code)

    preset_ids = [seed["id"] for seed in TRUCK_PRESETS_SEED]
    existing_records = db.query(TruckPreset).filter(TruckPreset.id.in_(preset_ids)).all()
    existing_map = {record.id: record for record in existing_records}

    new_records = []
    updated_count = 0

    for seed_data in TRUCK_PRESETS_SEED:
        if seed_data["id"] in existing_map:
            # Update (hỗ trợ đổi tên vì tra cứu theo ID)
            record = existing_map[seed_data["id"]]
            record.name = seed_data["name"]
            record.length = seed_data["length"]
            record.width = seed_data["width"]
            record.height = seed_data["height"]
            record.max_weight = seed_data["max_weight"]
            updated_count += 1
        else:
            # Insert
            new_records.append(TruckPreset(**seed_data))

    if new_records:
        db.add_all(new_records)
    db.commit()
    logger.info("Da seed truck presets thanh cong: %d added, %d updated.", len(new_records), updated_count)


def seed_item_presets(db: Session) -> None:
    """
    Cập nhật dữ liệu item presets theo cơ chế Optimized Bulk Upsert.
    Sử dụng UUIDv5 Deterministic Hashing để quản lý ID theo seed_code.
    """
    # 1. Băm UUID cố định từ seed_code
    for seed in ITEM_PRESETS_SEED:
        if "seed_code" in seed:
            seed_code = seed.pop("seed_code")
            seed["id"] = uuid.uuid5(KLTN_NAMESPACE, seed_code)

    preset_ids = [seed["id"] for seed in ITEM_PRESETS_SEED]
    existing_records = db.query(ItemPreset).filter(ItemPreset.id.in_(preset_ids)).all()
    existing_map = {record.id: record for record in existing_records}

    new_records = []
    updated_count = 0

    for seed_data in ITEM_PRESETS_SEED:
        if seed_data["id"] in existing_map:
            # Update (hỗ trợ đổi tên)
            record = existing_map[seed_data["id"]]
            record.name = seed_data["name"]
            record.length = seed_data["length"]
            record.width = seed_data["width"]
            record.height = seed_data["height"]
            record.weight = seed_data["weight"]
            record.color = seed_data.get("color", "#0059BB")
            updated_count += 1
        else:
            # Insert
            new_records.append(ItemPreset(**seed_data))

    if new_records:
        db.add_all(new_records)
    db.commit()
    logger.info("Da seed item presets thanh cong: %d added, %d updated.", len(new_records), updated_count)



def run_all_seeders(db: Session) -> None:
    """Chay toan bo seeders theo thu tu. Duoc goi trong Lifespan cua main.py."""
    logger.info("Bat dau chay Database Seeders...")
    seed_truck_presets(db)
    seed_item_presets(db)
    logger.info("Tat ca Seeders da hoan thanh.")
