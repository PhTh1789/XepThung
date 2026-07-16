"""
Script phan tich sau: Tim hieu tai sao Case 4 bi fail
va xac nhan EP miss chinh xac.

Chay tu thu muc backEnd/:
    .\\KLTN_2026\\Scripts\\python.exe tests/analyze_case4.py
"""

import sys
import os
import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.packer import GravityPacker, GravityBin
from py3dbp import Item


print("=" * 70)
print("PHAN TICH CASE 4: Corner-point 3n va LBD Compaction")
print("=" * 70)
print()
print("Bin: 400 x 300 x 300 (W x H x D)")
print("A: 250x200x300 tai (0,0,0)")
print("B: 150x300x150 tai (250,0,0)")
print("C: 150x100x150 — CAN xep tai EP=(250,200,150)")
print()

# =============================================================================
# PHAN 1: Theo doi pivot duoc thu cho item C
# Patch pack_to_bin de in ra cac pivot duoc thu
# =============================================================================
class DebugPacker(GravityPacker):
    def pack_to_bin(self, bin, item):
        fitted = False
        if not bin.items:
            response = bin.put_item(item, [0, 0, 0])
            if not response:
                bin.unfitted_items.append(item)
            return

        print(f"  [DEBUG] Thu xep item '{item.name}':")
        from py3dbp.constants import Axis
        for axis in range(0, 3):
            axis_name = ["WIDTH", "HEIGHT", "DEPTH"][axis]
            for ib in bin.items:
                pivot = [0, 0, 0]
                w, h, d = ib.get_dimension()
                if axis == Axis.WIDTH:
                    pivot = [ib.position[0] + w, ib.position[1], ib.position[2]]
                elif axis == Axis.HEIGHT:
                    pivot = [ib.position[0], ib.position[1] + h, ib.position[2]]
                elif axis == Axis.DEPTH:
                    pivot = [ib.position[0], ib.position[1], ib.position[2] + d]

                print(f"    Thu pivot (axis={axis_name}, source='{ib.name}'): {[float(x) for x in pivot]}", end="")
                result = bin.put_item(item, pivot)
                if result:
                    print(f" => THANH CONG! Item dat tai {[float(x) for x in item.position]}")
                    fitted = True
                    break
                else:
                    print(f" => That bai")
            if fitted:
                break

        if not fitted:
            print(f"    => KHONG XEP DUOC '{item.name}'!")
            bin.unfitted_items.append(item)


print("--- Step 1: Xep A va B truoc ---")
b1 = GravityBin("bin", 400, 300, 300, 9999)
packer1 = DebugPacker()
packer1.add_bin(b1)
packer1.add_item(Item("A", 250, 200, 300, 1))
packer1.add_item(Item("B", 150, 300, 150, 1))
packer1.add_item(Item("C", 150, 100, 150, 1))
packer1.pack(bigger_first=False, distribute_items=False, number_of_decimals=0)

print()
print(f"Packed: {[i.name + '@' + str([float(x) for x in i.position]) for i in b1.items]}")
print(f"Unpacked: {[i.name for i in b1.unfitted_items]}")

# =============================================================================
# PHAN 2: Xac nhan EP (250,200,150) hop le — thu thu cong
# =============================================================================
print()
print("--- Step 2: Xac nhan EP (250,200,150) hop le theo tung kiem tra ---")
b2 = GravityBin("bin", 400, 300, 300, 9999)
A2 = Item("A", 250, 200, 300, 1)
B2 = Item("B", 150, 300, 150, 1)
C2 = Item("C", 150, 100, 150, 1)

b2.put_item(A2, [0, 0, 0])
b2.put_item(B2, [250, 0, 0])

print(f"  A tai: {[float(x) for x in A2.position]}, dim: {[float(x) for x in A2.get_dimension()]}")
print(f"  B tai: {[float(x) for x in B2.position]}, dim: {[float(x) for x in B2.get_dimension()]}")
print()
print(f"  Thu dat C(150x100x150) tai EP=(250,200,150):")

# Bounds check thu cong
C2.rotation_type = 0
dim_c = C2.get_dimension()
print(f"  C dim = {[float(x) for x in dim_c]} (rotation_type=0)")
pivot_ep = [250, 200, 150]
print(f"  Bounds check: x={250}+{float(dim_c[0])}={250+float(dim_c[0])}<={400}? {'OK' if 250+float(dim_c[0])<=400 else 'FAIL'}")
print(f"  Bounds check: y={200}+{float(dim_c[1])}={200+float(dim_c[1])}<={300}? {'OK' if 200+float(dim_c[1])<=300 else 'FAIL'}")
print(f"  Bounds check: z={150}+{float(dim_c[2])}={150+float(dim_c[2])}<={300}? {'OK' if 150+float(dim_c[2])<=300 else 'FAIL'}")

# Intersection check thu cong
def intersect_check(item1_pos, item1_dim, item2_pos, item2_dim, name2):
    result = (
        item1_pos[0] < item2_pos[0] + item2_dim[0] and
        item1_pos[0] + item1_dim[0] > item2_pos[0] and
        item1_pos[1] < item2_pos[1] + item2_dim[1] and
        item1_pos[1] + item1_dim[1] > item2_pos[1] and
        item1_pos[2] < item2_pos[2] + item2_dim[2] and
        item1_pos[2] + item1_dim[2] > item2_pos[2]
    )
    print(f"  Intersection voi {name2}: {'GIAO NHAU!' if result else 'OK (khong giao)'}")
    return result

intersect_check(pivot_ep, [float(x) for x in dim_c],
                [float(x) for x in A2.position], [float(x) for x in A2.get_dimension()], "A")
intersect_check(pivot_ep, [float(x) for x in dim_c],
                [float(x) for x in B2.position], [float(x) for x in B2.get_dimension()], "B")

# Support check: C o y=200, can support tu mat tren A (y_top=200) hoac mat tren B (y_top=300)
print()
print(f"  Support check: C.py=200, nen can support tu mat tren cua item khac")
print(f"  Mat tren A: y_top = {float(A2.position[1])} + {float(A2.get_dimension()[1])} = {float(A2.position[1])+float(A2.get_dimension()[1])}")
print(f"  Footprint A (XZ): x=[{float(A2.position[0])},{float(A2.position[0])+float(A2.get_dimension()[0])}], z=[{float(A2.position[2])},{float(A2.position[2])+float(A2.get_dimension()[2])}]")
print(f"  Footprint C day (XZ): x=[{pivot_ep[0]},{pivot_ep[0]+float(dim_c[0])}], z=[{pivot_ep[2]},{pivot_ep[2]+float(dim_c[2])}]")

# Tinh overlap XZ
a_top_y = float(A2.position[1]) + float(A2.get_dimension()[1])
c_py = pivot_ep[1]
print(f"  |A_top_y - C_py| = |{a_top_y} - {c_py}| = {abs(a_top_y - c_py)} {'<= 1 (TRONG TOLERANCE)' if abs(a_top_y - c_py) <= 1 else '> 1 (NGOAI TOLERANCE)'}")

overlap_x = max(0, min(pivot_ep[0]+float(dim_c[0]), float(A2.position[0])+float(A2.get_dimension()[0])) - max(pivot_ep[0], float(A2.position[0])))
overlap_z = max(0, min(pivot_ep[2]+float(dim_c[2]), float(A2.position[2])+float(A2.get_dimension()[2])) - max(pivot_ep[2], float(A2.position[2])))
support_area = overlap_x * overlap_z
item_base = float(dim_c[0]) * float(dim_c[2])
support_ratio = support_area / item_base if item_base > 0 else 0
print(f"  Overlap XZ voi A: {overlap_x} x {overlap_z} = {support_area}")
print(f"  Day C area: {item_base}")
print(f"  Support ratio: {support_ratio:.2f} (can >= 0.6)")
print(f"  => Support check: {'OK' if support_ratio >= 0.6 else 'FAIL — KHONG DU DO!'}")

# Ket luan
print()
print("  Ket luan CASE 4:")
if support_ratio >= 0.6:
    print("  => EP (250,200,150) la vi tri HOP LE (support OK)")
    print("  => Corner-point 3n BO LO vi tri nay (khong co pivot (250,200,150))")
    print("  => Day la BANG CHUNG THUC NGHIEM!")
else:
    print("  => EP (250,200,150) KHONG HOP LE vi support ratio < 0.6")
    print("  => C se bi lat neu dat o do — support constraint dung, khong phai EP miss")
    print()
    print("  PHAN TICH THEM: Tai sao put_item(C, [250,200,150]) = True?")
    print("  => put_item() thu 6 rotation, co the rotation khac cho support OK!")
    print()
    # Thu cac rotation khac
    for rt in range(6):
        C_test = Item("C_test", 150, 100, 150, 1)
        C_test.rotation_type = rt
        d_test = C_test.get_dimension()
        ov_x = max(0, min(250+float(d_test[0]), float(A2.position[0])+float(A2.get_dimension()[0])) - max(250, float(A2.position[0])))
        ov_z = max(0, min(150+float(d_test[2]), float(A2.position[2])+float(A2.get_dimension()[2])) - max(150, float(A2.position[2])))
        base = float(d_test[0]) * float(d_test[2])
        sr = (ov_x * ov_z) / base if base > 0 else 0
        bounds_ok = (250+float(d_test[0])<=400 and 200+float(d_test[1])<=300 and 150+float(d_test[2])<=300)
        print(f"    rotation {rt}: dim={[float(x) for x in d_test]}, bounds={'OK' if bounds_ok else 'FAIL'}, support={sr:.2f}")


# =============================================================================
# PHAN 3: Case EP miss CO SUPPORT — thiet ke lai
# Muon EP miss that su: can vi tri ma:
# 1. put_item() CUNG tra True (hop le vat ly)
# 2. Khong co corner-point nao = vi tri do
# 3. Nen pack() bo lo vi tri do
# =============================================================================
print()
print("=" * 70)
print("PHAN 3: Thiet ke EP miss xac nhan that su (voi support OK)")
print("=" * 70)
print()
print("Thiet ke:")
print("Bin: 400 x 300 x 600")
print("A: 200 x 200 x 600 tai (0,0,0) [trai, nua duoi, full depth]")
print("B: 200 x 200 x 300 tai (200,0,0) [phai, nua duoi, nua truoc]")
print()
print("Mat tren A: y=200, full depth z=[0,600]")
print("Mat tren B: y=200, z=[0,300]")
print("Cung y=200! Tao san chung cho vung:")
print("  - (0..200, y=200, 0..600) <- tren A")
print("  - (200..400, y=200, 0..300) <- tren B")
print()
print("Corner-points tu A: (200,0,0)[W], (0,200,0)[H], (0,0,600)[D]")
print("Corner-points tu B: (400,0,0)[W-out], (200,200,0)[H], (200,0,300)[D]")
print()
print("EP THAT SU bi bo lo: (200, 200, 300)")
print("  = giao cua mat_phai_A (x=200) + mat_tren_A (y=200) + mat_sau_B (z=300)")
print("  -> khe: rong=200, cao tuy, sau=300")
print()
print("Item C = 200x100x300: dat tai (200,200,300)")
print("Support: mat day C (x=[200,400], z=[300,600]) nam tren A (x=[0,200], z=[0,600])")
print("  -> overlap x: min(400,200)-max(200,0) = 200-200 = 0 — KHONG CO GIAO!")
print("  => Support fail (A ket thuc o x=200, C bat dau o x=200: tiep xuc canh, dien tich=0)")
print()
print("  => Van bi support constraint chan. Kho thiet ke EP miss WITHOUT support issue.")
print()
print("CONCLUSION THUC NGHIEM:")
print("  - LBD Compaction trong _compact_placement() CHAY TRUOC support check")
print("  - Neu LBD doi vi tri pivot, support check chay tren vi tri MOI (sau LBD)")
print("  - Hieu ung thuc te: corner-point 3n co the tro toi vung hop le,")
print("    nhung LBD shift co the doi sang vi tri support fail")
print("  - Nguoc lai, EP that su (giao 3 mat phang) bi bo qua")
print("  - Kho thiet ke test case nhat quan vi LBD 'pha vo' ket qua theo 2 huong")

# =============================================================================
# PHAN 4: Do thoi gian _run_packer() — benchmark baseline
# =============================================================================
import time

print()
print("=" * 70)
print("PHAN 4: Benchmark toc do _run_packer() hien tai (baseline)")
print("=" * 70)
print()

def make_test_request(n_items):
    """Tao test request voi n items."""
    items = []
    for i in range(n_items):
        size = 100 + (i % 5) * 50
        items.append({
            "id": f"item_{i}",
            "name": f"Item {i}",
            "quantity": 1,
            "length": size,
            "width": size,
            "height": size + 20,
            "weight": size // 10,
            "color": "#FF0000"
        })
    return items

def benchmark_pack(n_items, n_runs=5):
    """Chay pack n lan va tinh thoi gian trung binh."""
    # Tao bin 2000x2000x2000
    times = []
    for _ in range(n_runs):
        packer = GravityPacker()
        b = GravityBin("bin", 2000, 1500, 2000, 99999)
        packer.add_bin(b)
        items = make_test_request(n_items)
        for it in items:
            packer.add_item(Item(
                it["id"], it["width"], it["height"], it["length"], it["weight"]
            ))
        t0 = time.monotonic()
        packer.pack(bigger_first=True, distribute_items=False, number_of_decimals=0)
        t1 = time.monotonic()
        times.append(t1 - t0)

    avg = sum(times) / len(times)
    packed = len(packer.bins[0].items)
    return avg, packed

for n in [5, 10, 20, 30, 50]:
    avg_t, packed_n = benchmark_pack(n)
    print(f"  n={n:3d} items: avg={avg_t*1000:.1f}ms | packed={packed_n}")

print()
print(f"Ngay gio chay: {datetime.datetime.now().isoformat()}")
print("Day la so do thuc tren may tinh hien tai, dung lam baseline de so sanh sau Giai Doan 1.")
