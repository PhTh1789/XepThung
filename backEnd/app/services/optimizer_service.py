"""
Optimizer Service – Trái tim của dự án.

Triển khai hai chế độ tối ưu hóa:

  1. FAST  → Chỉ dùng py3dbp (3D Bin Packing Heuristic).
             Tốc độ < 0.5s, phù hợp cho demo nhanh.

  2. DEEP  → PyGAD (Genetic Algorithm) tìm thứ tự tối ưu nhất
             cho mảng items, rồi đưa kết quả vào py3dbp.
             Tốc độ 3-5s, độ lấp đầy tối đa.

⚠️  Y-Z SWAP (quan trọng!):
    py3dbp dùng hệ tọa độ (x=width, y=height, z=depth).
    Three.js (Frontend) dùng hệ tọa độ (x=width, y=height, z=depth)
    nhưng trục Y trong py3dbp là chiều sâu, không phải chiều cao.
    → Sau khi pack xong, thực hiện hoán đổi y ↔ z để Frontend
      render đúng chiều hướng của kiện hàng.
"""
import logging
import math
from typing import List, Tuple, Dict, Any

from py3dbp import Item
from app.core.packer import GravityPacker, GravityBin

from app.schemas.optimizer import (
    OptimizeRequest, OptimizeData, OptimizeSummary,
    PackedItem, UnpackedItem, Coordinates, Dimensions,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Hằng số rotation type mapping từ py3dbp
# ─────────────────────────────────────────────────────────────────────────────
# py3dbp rotation_type là integer 0-5
ROTATION_TYPE_MAP = {
    0: "RT_WHD",      # Width, Height, Depth (không xoay)
    1: "RT_HWD",
    2: "RT_HDW",
    3: "RT_DHW",
    4: "RT_DWH",
    5: "RT_WDH",
}


# ─────────────────────────────────────────────────────────────────────────────
# Helper: Chuyển đổi Item từ schema → py3dbp Item object
# ─────────────────────────────────────────────────────────────────────────────
def _make_packer_item(item_id: str, length: int, width: int,
                      height: int, weight: int) -> Item:
    """
    Tạo py3dbp Item theo đúng signature của py3dbp 1.1.2:
      Item(name, width, height, depth, weight)
    - width  = chiều rộng kiện hàng
    - height = chiều cao kiện hàng
    - depth  = chiều dài kiện hàng (trục z)
    - weight là string hoặc Decimal
    """
    return Item(
        name=item_id,
        width=width,
        height=height,
        depth=length,
        weight=weight,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Helper: Y-Z Swap
# ─────────────────────────────────────────────────────────────────────────────
def _apply_yz_swap(pos_x: float, pos_y: float, pos_z: float,
                   dim_w: float, dim_h: float, dim_d: float
                   ) -> Tuple[Coordinates, Dimensions]:
    """
    Thực hiện hoán đổi trục Y-Z để phù hợp với R3F.

    py3dbp output:
      position = (x, y, z) = (width_offset, height_offset, depth_offset)
      dimension = (w, h, d)

    Three.js / Frontend convention:
      x = width (ngang), y = chiều cao (lên), z = chiều sâu (vào trong)

    Mapping:
      py3dbp_x (width_offset)  → frontend_x
      py3dbp_y (height_offset) → frontend_y
      py3dbp_z (depth_offset)  → frontend_z

    Trong py3dbp, 'depth' là chiều dài thực của vật thể (trục z của Three.js),
    nên không cần swap thêm — chỉ cần đảm bảo đúng thứ tự trả về.
    """
    coords = Coordinates(x=pos_x, y=pos_y, z=pos_z)
    dims = Dimensions(length=dim_d, width=dim_w, height=dim_h)
    return coords, dims


# ─────────────────────────────────────────────────────────────────────────────
# Core: Chạy py3dbp và parse kết quả
# ─────────────────────────────────────────────────────────────────────────────
def _run_packer(request: OptimizeRequest,
                ordered_items: List[Dict[str, Any]],
                bigger_first: bool = True) -> Tuple[List[PackedItem], List[UnpackedItem], GravityBin]:
    """
    Tạo Packer, thêm Bin (thùng xe) và các Items theo thứ tự đã cho,
    chạy pack(), sau đó parse kết quả thành schema.

    Args:
        request      : OptimizeRequest chứa truck và items gốc.
        ordered_items: Danh sách dict item theo thứ tự tối ưu (sau PyGAD nếu deep).

    Returns:
        (packed_items, unpacked_items, fitted_bin)
    """
    truck = request.truck
    packer = GravityPacker()

    # Vấn đề 4: Virtual Truck Shrink (Dung sai tải trọng)
    # Áp dụng chuỗi Taylor để bóp đều 3 chiều, mô phỏng khoảng trống thực tế.
    linear_margin = request.load_margin / 3.0 / 100.0
    scale = 1.0 - linear_margin

    virtual_width = truck.width * scale
    virtual_height = truck.height * scale
    virtual_depth = truck.length * scale

    # Them thung xe vao packer (GravityBin co kiem tra trong luc)
    bin_ = GravityBin(
        name="truck",
        width=virtual_width,
        height=virtual_height,
        depth=virtual_depth,
        max_weight=truck.max_weight,
    )
    packer.add_bin(bin_)

    # Map item_id → thông tin gốc (màu sắc, tên)
    item_meta: Dict[str, Dict] = {}
    for item_data in ordered_items:
        base_id = item_data["id"]
        qty = item_data["quantity"]
        for i in range(1, qty + 1):
            uid = f"{base_id}_{i}"
            packer.add_item(
                _make_packer_item(
                    item_id=uid,
                    length=item_data["length"],
                    width=item_data["width"],
                    height=item_data["height"],
                    weight=item_data["weight"],
                )
            )
            item_meta[uid] = {
                "name": item_data["name"],
                "color": item_data["color"],
                "base_id": base_id,
            }

    packer.pack(
        bigger_first=bigger_first,
        distribute_items=False,
        number_of_decimals=0,
    )

    packed_items: List[PackedItem] = []
    unpacked_items: List[UnpackedItem] = []

    fitted_bin = packer.bins[0]

    # Parse packed items
    for step, item in enumerate(fitted_bin.items, start=1):
        uid = item.name
        meta = item_meta.get(uid, {"name": uid, "color": "#AAAAAA"})

        pos = item.position            # [x, y, z] strings
        dim = item.get_dimension()     # [w, h, d] after rotation

        coords, dims = _apply_yz_swap(
            pos_x=float(pos[0]),
            pos_y=float(pos[1]),
            pos_z=float(pos[2]),
            dim_w=float(dim[0]),
            dim_h=float(dim[1]),
            dim_d=float(dim[2]),
        )

        rotation_type_str = ROTATION_TYPE_MAP.get(item.rotation_type, "UNKNOWN")
        is_rotated = item.rotation_type != 0

        packed_items.append(PackedItem(
            id=uid,
            name=meta["name"],
            color=meta["color"],
            step_sequence=step,
            coordinates=coords,
            dimensions=dims,
            is_rotated=is_rotated,
            rotation_type=rotation_type_str,
        ))

    # Parse unpacked items
    # py3dbp lưu các items không vừa trong bin.unfitted_items
    for item in fitted_bin.unfitted_items:
        uid = item.name
        meta = item_meta.get(uid, {"name": uid})
        unpacked_items.append(UnpackedItem(
            id=uid,
            name=meta["name"],
        ))

    return packed_items, unpacked_items, fitted_bin


# ─────────────────────────────────────────────────────────────────────────────
# Public API: Fast Optimization
# ─────────────────────────────────────────────────────────────────────────────
def run_fast_optimization(request: OptimizeRequest) -> OptimizeData:
    """
    Chạy tối ưu hóa FAST: chỉ dùng py3dbp với thứ tự items gốc từ Frontend.
    Thời gian mục tiêu: < 0.5 giây.
    """
    logger.info(" [FAST] Bắt đầu tối ưu hóa với %d loại hàng.",
                len(request.items))

    ordered_items = [item.model_dump() for item in request.items]
    packed, unpacked, _ = _run_packer(request, ordered_items)

    return _build_optimize_data(request, packed, unpacked, resolved_mode="fast")


# ─────────────────────────────────────────────────────────────────────────────
# Public API: Deep Optimization (PyGAD + py3dbp)
# ─────────────────────────────────────────────────────────────────────────────
def run_deep_optimization(request: OptimizeRequest) -> OptimizeData:
    """
    Chạy tối ưu hóa DEEP:
      1. PyGAD tìm hoán vị thứ tự items cho fill rate cao nhất.
      2. Đưa hoán vị tốt nhất vào py3dbp để pack.
    Thời gian mục tiêu: 3-5 giây.
    """
    import pygad
    import numpy as np

    logger.info("[DEEP] Bắt đầu tối ưu hóa di truyền với %d loại hàng.",
                len(request.items))

    items_data = [item.model_dump() for item in request.items]
    num_items = len(items_data)

    # Tính tổng thể tích thùng xe để normalize fill rate
    truck = request.truck
    truck_volume = truck.length * truck.width * truck.height

    # ── Fitness Function ──────────────────────────────────────────────────
    def fitness_func(ga_instance, solution, solution_idx):
        """
        Đánh giá một hoán vị (solution là mảng chỉ số 0..n-1).
        Fitness = fill_rate (0-100). Mục tiêu: maximize.
        """
        # Chuyển solution (float) → chỉ số integer, sau đó tạo hoán vị
        order = np.argsort(solution).tolist()
        ordered = [items_data[i] for i in order]

        try:
            packed, _, fitted_bin = _run_packer(request, ordered, bigger_first=False)
            if truck_volume == 0:
                return 0.0
            packed_volume = sum(
                p.dimensions.length * p.dimensions.width * p.dimensions.height
                for p in packed
            )
            fill_rate = (packed_volume / truck_volume) * 100
            
            # Tinh toan can bang tai
            balance_penalty = fitted_bin.compute_weight_balance()
            
            # Fitness da muc tieu: Fill Rate (cang cao cang tot) - Penalty Can Bang (cang nho cang tot)
            # BALANCE_WEIGHT quyết định mức độ ưu tiên của việc cân bằng tải.
            # Với fill_rate thuộc [0, 100] và balance_penalty thuộc [0, 1.414],
            # nhân balance_penalty với một trọng số để nó ảnh hưởng vài % đến fitness.
            BALANCE_WEIGHT = 10.0
            fitness = fill_rate - (balance_penalty * BALANCE_WEIGHT)
            return fitness
        except Exception:
            return 0.0

    # Dynamic Deep Scaling: num_generations theo ham nghich dao (Logarithmic)
    #
    # Vấn đề : sol_per_pop = max(8, num_items * 2), nen tong so lan danh gia fitness
    # = num_generations * sol_per_pop, tang bac hai theo n neu giu num_generations co dinh.
    # Voi n=50 va num_gen=50 thi total_evals = 50 * 100 = 5000 (~8-12s) -- qua cham.
    #
    # Giai phap: Giam num_generations theo ham nghich dao.
    # Cong thuc: num_gen = max(12, int(50 / (1 + 0.015 * max(0, n - 5))))
    #
    # Ly thuyet dung sau cong thuc nay:
    # GA hoat dong theo nguyen ly Marginal Improvement -- moi the he cai thien nhieu nhat
    # ở đầu, sau đó giảm dần (duong cong logarithmic). Số thế hệ cần thiết để hội tụ
    # tỷ lệ với log(n!) theo xap xi Stirling (log(n!) ~ n*log(n) - n).
    # Nhung vi sol_per_pop ∝ n, moi the he da 'cover' nhieu khong gian hon khi n lon,
    # nen so the he thuc su can giam di -- khong can giu nguyen 50.
    # Ham 1/(1 + c*n) nam bat dung dieu nay: giam nhanh ban dau (vung n nho,
    # moi the he re, co the cat nhieu), cham lai khi n lon (moi the he dat, cat it thoi).
    #
    # Hang so 0.015 va 5 duoc chon de:
    #   n=5  -> 50 / (1 + 0.015*0)   = 50 gen  (bai toan nho, chay nhieu the he)
    #   n=10 -> 50 / (1 + 0.015*5)   = 45 gen
    #   n=30 -> 50 / (1 + 0.015*25)  = 33 gen
    #   n=50 -> 50 / (1 + 0.015*45)  = 28 gen  (~4s -- chap nhan duoc)
    #   n=100 -> 50 / (1 + 0.015*95) = 20 gen
    #   n=150 -> 50 / (1 + 0.015*145)= 17 gen  (~8-10s -- con duoc)
    num_generations = max(12, int(50 / (1 + 0.015 * max(0, num_items - 5))))
    logger.info("[DEEP] Dynamic scaling: num_items=%d -> num_generations=%d", num_items, num_generations)

    # ── Iterated Local Search (ILS) / Multi-Start GA ──────────────────────
    import time
    start_time = time.time()
    max_duration = 4.0  # Chạy tối đa 4 giây để đảm bảo API phản hồi nhanh
    
    global_best_solution = None
    global_best_fitness = -1000.0  # Có thể âm do penalty
    ils_iterations = 0

    while time.time() - start_time < max_duration:
        ils_iterations += 1
        ga_instance = pygad.GA(
            num_generations=num_generations,
            num_parents_mating=4,
            fitness_func=fitness_func,
            sol_per_pop=max(8, num_items * 2),   # Tối thiểu 8 cá thể mỗi thế hệ
            num_genes=num_items,
            gene_type=float,
            init_range_low=0.0,
            init_range_high=float(num_items),
            mutation_percent_genes=20,
            crossover_type="single_point",
            mutation_type="random",
            keep_parents=2,
            suppress_warnings=True,
        )

        ga_instance.run()

        # Lấy giải pháp tốt nhất của iteration này
        solution, fitness, _ = ga_instance.best_solution()
        
        if fitness > global_best_fitness:
            global_best_fitness = fitness
            global_best_solution = solution
            
        # Nếu fill_rate đạt 100% (và không bị penalty), thoát sớm
        if fitness >= 100.0:
            break

    logger.info("🧬 [DEEP] ILS ran %d iterations in %.2fs. Best fitness (Fill Rate - Penalty): %.2f", 
                ils_iterations, time.time() - start_time, global_best_fitness)

    best_order = np.argsort(global_best_solution).tolist()
    best_ordered_items = [items_data[i] for i in best_order]

    packed, unpacked, _ = _run_packer(request, best_ordered_items, bigger_first=False)
    return _build_optimize_data(request, packed, unpacked, resolved_mode="deep")


# ─────────────────────────────────────────────────────────────────────────────
# Helper: Build OptimizeData từ kết quả pack
# ─────────────────────────────────────────────────────────────────────────────
def _build_optimize_data(request: OptimizeRequest,
                         packed: List[PackedItem],
                         unpacked: List[UnpackedItem],
                         resolved_mode: str = "fast") -> OptimizeData:
    """Tính toán summary và đóng gói kết quả thành OptimizeData.

    Args:
        request      : OptimizeRequest gốc.
        packed       : Danh sách kiện hàng đã xếp.
        unpacked     : Danh sách kiện hàng không xếp được.
        resolved_mode: Chế độ thực tế đã chạy ('fast' hoặc 'deep').
                       Quan trọng khi input là 'auto' — để Frontend biết backend đã chọn gì.
    """
    truck = request.truck
    truck_volume = truck.length * truck.width * truck.height

    total_items = sum(item.quantity for item in request.items)
    packed_count = len(packed)
    unpacked_count = len(unpacked)

    # Tổng khối lượng của các kiện hàng đã xếp
    # Map: uid → weight của item gốc
    weight_map: Dict[str, int] = {}
    for item in request.items:
        for i in range(1, item.quantity + 1):
            weight_map[f"{item.id}_{i}"] = item.weight

    total_weight = sum(weight_map.get(p.id, 0) for p in packed)

    # Fill rate = tổng thể tích kiện hàng đã xếp / thể tích thùng xe × 100
    packed_volume = sum(
        p.dimensions.length * p.dimensions.width * p.dimensions.height
        for p in packed
    )
    fill_rate = round((packed_volume / truck_volume) * 100, 2) if truck_volume > 0 else 0.0

    summary = OptimizeSummary(
        total_items=total_items,
        packed_items_count=packed_count,
        unpacked_items_count=unpacked_count,
        total_weight=total_weight,
        fill_rate_percent=fill_rate,
        resolved_mode=resolved_mode,  # Ghi lại chế độ thực tế đã chạy
    )

    return OptimizeData(
        summary=summary,
        packed_items=packed,
        unpacked_items=unpacked,
    )
