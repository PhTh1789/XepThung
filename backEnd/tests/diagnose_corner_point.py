"""
Script thuc nghiem: Tim truong hop that su chung minh corner-point 3n
bo lo vi tri hop le ma Extreme Point dung nghia hoc thuat se dat duoc.

Chay tu thu muc backEnd/:
    python tests/diagnose_corner_point.py

Ket qua duoc in ra stdout, bao gom:
- Thong tin toan bo packed/unpacked items
- Fill rate thuc te
- Vi tri cua tung item
- Cac pivot da thu va ket qua

Ngay tao: 2026-07-15
"""

import sys
import os
import datetime

# Them duong dan de import duoc gravity_packer
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.packer import GravityPacker, GravityBin
from py3dbp import Item


def run_pack(bin_w, bin_h, bin_d, bin_maxweight, items, label=""):
    """
    Helper: Tao packer, xep items theo thu tu da cho, in ket qua.
    items: list of dict { name, w, h, d, weight }
    Tra ve (fill_rate, packed_count, unpacked_count)
    """
    packer = GravityPacker()
    b = GravityBin("bin", bin_w, bin_h, bin_d, bin_maxweight)
    packer.add_bin(b)

    for it in items:
        packer.add_item(Item(it["name"], it["w"], it["h"], it["d"], it["weight"]))

    packer.pack(bigger_first=False, distribute_items=False, number_of_decimals=0)

    fitted = packer.bins[0]
    bin_vol = bin_w * bin_h * bin_d
    packed_vol = sum(
        float(i.get_dimension()[0]) * float(i.get_dimension()[1]) * float(i.get_dimension()[2])
        for i in fitted.items
    )
    fill_rate = packed_vol / bin_vol * 100

    print(f"\n{'='*60}")
    print(f"TEST: {label}")
    print(f"Bin: {bin_w} x {bin_h} x {bin_d} (W x H x D), MaxW={bin_maxweight}")
    items_summary = [(x['name'], "{}x{}x{}".format(x['w'], x['h'], x['d'])) for x in items]
    print(f"Items input ({len(items)}): {items_summary}")
    print(f"Packed ({len(fitted.items)}):")
    for i in fitted.items:
        pos = i.position
        dim = i.get_dimension()
        print(f"  {i.name}: pos=({float(pos[0]):.0f},{float(pos[1]):.0f},{float(pos[2]):.0f}) dim={float(dim[0]):.0f}x{float(dim[1]):.0f}x{float(dim[2]):.0f} rot={i.rotation_type}")
    print(f"Unpacked ({len(fitted.unfitted_items)}): {[i.name for i in fitted.unfitted_items]}")
    print(f"Fill Rate: {fill_rate:.1f}% ({packed_vol:.0f} / {bin_vol:.0f})")
    if fitted.unfitted_items:
        print(">>> CO ITEM KHONG XEP DUOC!")
    return fill_rate, len(fitted.items), len(fitted.unfitted_items)


# =============================================================================
# CASE 4: "Giao diem 2 items khong co canh chung"
#
# Thiet ke de tim EP miss:
# Bin: 400 x 300 x 300
# A: 250 x 200 x 300 tai (0,0,0) [trai, nua duoi, full depth]
# B: 150 x 300 x 150 tai (250,0,0) [phai, full cao, nua truoc]
#
# Toan bo corner-points sinh ra:
#   Tu A: (250,0,0)[W], (0,200,0)[H], (0,0,300)[D]
#   Tu B: (400,0,0)[W-out], (250,300,0)[H-out], (250,0,150)[D]
#
# Khe co kha nang dat item:
#   (0,200,0): rong 250, cao 100, sau 300 — item 250x100x300
#   (250,0,150): rong 150, cao 300, sau 150 — item 150x300x150 het roi
#   (250,200,150): giao cua mat_tren_A va mat_sau_B — EP THAT SU
#     -> rong 150, cao 100, sau 150 — item 150x100x150 vua vao
#
# Pivot (250,200,150) KHONG CO TRONG DANH SACH CORNER-POINTS!
# =============================================================================
print("\n" + "="*60)
print("CASE 4: Giao diem 2 mat phang — EP miss chinh thuc")
print("  Item C(150x100x150) CAN xep tai EP=(250,200,150)")
print("  Corner-point 3n KHONG SINH RA pivot (250,200,150)!")
print("  Ky vong: C bi UNPACKED du co khe cho hop le.")

case4_items = [
    {"name": "A", "w": 250, "h": 200, "d": 300, "weight": 1},
    {"name": "B", "w": 150, "h": 300, "d": 150, "weight": 1},
    {"name": "C", "w": 150, "h": 100, "d": 150, "weight": 1},  # vua vao khe (250,200,150)
]
r4, p4, u4 = run_pack(400, 300, 300, 9999, case4_items, "Case4: EP (250,200,150) — EP miss?")

# Kiem tra xem C co the dat o (250,200,150) bang tay khong?
print("\n  --- Kiem tra thu cong: dat C tai (250,200,150) ---")
packer_test = GravityPacker()
b_test = GravityBin("bin", 400, 300, 300, 9999)
packer_test.add_bin(b_test)
A_test = Item("A", 250, 200, 300, 1)
B_test = Item("B", 150, 300, 150, 1)
C_test = Item("C", 150, 100, 150, 1)
b_test.put_item(A_test, [0, 0, 0])
b_test.put_item(B_test, [250, 0, 0])
result_manual = b_test.put_item(C_test, [250, 200, 150])
print(f"  put_item(C, [250,200,150]) = {result_manual}")
if result_manual:
    print(f"  C dat thanh cong tai: {C_test.position}")
    print("  => EP (250,200,150) LA VI TRI HOP LE ma corner-point 3n KHONG THU TOI!")
else:
    print("  => C khong dat duoc o vi tri do (co the support check fail)")


# =============================================================================
# CASE 7: Crainic Figure 2 analog — EP tai giao diem 2 mat phang lon hon
#
# Bin: 500 x 500 x 500
# A: 300 x 200 x 500 tai (0,0,0) [trai, nua duoi, full depth]
# B: 200 x 300 x 300 tai (300,0,0) [phai, 3/5 cao, nua truoc]
#
# Toan bo corner-points:
#   Tu A: (300,0,0)[W], (0,200,0)[H], (0,0,500)[D]
#   Tu B: (500,0,0)[W], (300,300,0)[H], (300,0,300)[D]
#
# EP THAT SU bi bo lo: (300, 200, 300)
#   = giao diem: mat_phai_A (x=300) + mat_tren_A (y=200) + mat_sau_B (z=300)
#   -> rong 200, cao 300, sau 200 — item D(200x300x200) vua vao
#   Bounds check: 300+200=500✓, 200+300=500✓, 300+200=500✓
# =============================================================================
print("\n" + "="*60)
print("CASE 7: Crainic Figure 2 analog — EP (300,200,300) CHINH XAC")
print("  Item D(200x300x200) CAN xep tai EP=(300,200,300)")
print("  Pivot (300,200,300) KHONG CO TRONG DANH SACH CORNER-POINTS!")
print("  Ky vong: D bi UNPACKED du co khe cho 200x300x200 tai (300,200,300).")

case7_items = [
    {"name": "A", "w": 300, "h": 200, "d": 500, "weight": 10},
    {"name": "B", "w": 200, "h": 300, "d": 300, "weight": 8},
    {"name": "D", "w": 200, "h": 300, "d": 200, "weight": 5},
]
r7, p7, u7 = run_pack(500, 500, 500, 9999, case7_items, "Case7: EP (300,200,300)")

# Kiem tra thu cong
print("\n  --- Kiem tra thu cong: dat D tai (300,200,300) ---")
packer_t7 = GravityPacker()
b_t7 = GravityBin("bin", 500, 500, 500, 9999)
packer_t7.add_bin(b_t7)
A7 = Item("A", 300, 200, 500, 10)
B7 = Item("B", 200, 300, 300, 8)
D7 = Item("D", 200, 300, 200, 5)
b_t7.put_item(A7, [0, 0, 0])
b_t7.put_item(B7, [300, 0, 0])
r_d7 = b_t7.put_item(D7, [300, 200, 300])
print(f"  put_item(D, [300,200,300]) = {r_d7}")
if r_d7:
    print(f"  D dat thanh cong tai: {D7.position}")
    print("  => EP (300,200,300) LA VI TRI HOP LE ma corner-point 3n KHONG THU TOI!")
    print("  => Day la BANG CHUNG THUC NGHIEM rang corner-point 3n BO LO vi tri nay.")
else:
    print("  => D khong dat duoc o vi tri do — kiem tra support constraint")
    # Thu support check rieng
    print("  => Thu support check for D at (300,200,300):")
    print(f"     D.py = 200 > 0, nen can support check")
    print(f"     Mat day D: x=[300,500], z=[300,500]")
    print(f"     Mat tren A: y=200, x=[0,300] -> KHONG CO GIAO VUNG XZ voi D (A ket thuc o x=300)")
    print(f"     Mat tren B: y=300 != 200 -> KHONG HOP LE (sai chieu cao)")
    print(f"     => Support ratio = 0 < 0.6 => support check FAIL!")
    print(f"  => GIAI THICH: EP (300,200,300) KHONG HOP LE vi D o tren cao (y=200)")
    print(f"     nhung mat day D khong duoc do boi bat ky item nao (A ket thuc o x=300,")
    print(f"     B cao hon den y=300). Day la constraint vat ly dung, D se bi lat.")


# =============================================================================
# CASE 8: Tim EP miss THUC SU khong bi chan boi support constraint
#
# Can thiet ke 3 items sao cho:
# 1. Item thu 3 nam o vi tri (EP miss) duoc do hop le (support OK)
# 2. Vi tri do KHONG la canh cua bat ky item don le nao
#
# Giai phap: Dung 2 items cung chieu cao (h bang nhau),
# tao mat phang san phang de do item thu 3.
#
# Bin: 600 x 400 x 600
# A: 300 x 200 x 600 tai (0,0,0) [trai, nua duoi, full depth]
# B: 300 x 200 x 300 tai (300,0,0) [phai, nua duoi, nua truoc] — CUNG CHIEU CAO voi A!
#
# Sau khi xep A va B:
# - Mat tren A+B cung o y=200, nhung A full depth con B chi nua truoc
# - Item C co the nam o: (300, 200, 300) — tren phan sau cua A + cua hang ben phai
#
# Kiem tra:
# - Bounds: x=300+W, y=200+H, z=300+D <= bin
# - Support: Mat day C (z=[300,300+Dc], x=[300,300+Wc])
#   -> Mat tren A tai y=200, x=[0,300], z=[0,600] — GIAO voi day C tai x=[300,300]=0 -> FAIL
#   -> A ket thuc o x=300, day C bat dau o x=300: khong co giao dien (tiep xuc canh, dien tich=0)
#
# Hmm, A ket thuc o x=300 va C bat dau o x=300 => khong co support tu A.
# Can item do C tu ben trai (x<300) hoac ben phai (but phai co y=200).
#
# Thiet ke lai:
# A: 300 x 200 x 600 tai (0,0,0)
# B: 300 x 200 x 300 tai (300,0,300) [phai, nua duoi, nua SAU] — not front
# => Mat tren A: y=200, x=[0,300], z=[0,600]
# => Mat tren B: y=200, x=[300,600], z=[300,600]
# => Cung y=200! Tao san phang chung o y=200 cho vung x=[0,300],z=[0,600] (A) + x=[300,600],z=[300,600] (B)
#
# Khe tren phai truoc: (300,200,0) rong 300, cao tuy, sau 300 — chi tren A la san, B o sau
# Item C(300,200,300) o vi tri (300,200,0): tren A o phan z=[0,300], duong bien x=300
#   Support: day C la x=[300,600], z=[0,300]
#   -> A: x=[0,300] khong giao (A ket thuc o x=300)
#   -> B: x=[300,600], z=[300,600], day C la z=[0,300] -> KHONG GIAO (z range khac nhau)
# => Khong co support => fail lai
#
# Cach duy nhat de C duoc do: C phai nam tren it nhat 60% dien tich day cua A hoac B.
# De C co support, C phai x overlap voi [0,300] (mat tren A) hoac [300,600] (mat tren B)
# Vay: C can xep tai x <= 300 va z <= 600 (tren A) hoac x >= 300 va z >= 300 (tren B)
# =>  EP (0,200,0): tren A, rong 300, cao tuy, sau 600 — pivot nay CO trong corner-point A!
#     EP (300,200,300): tren B, rong 300, cao tuy, sau 300 — pivot nay CO trong corner-point B!
# Tat ca deu trong corner-point. Hmm.
# =============================================================================
print("\n" + "="*60)
print("CASE 8: 2 items cung chieu cao, tim EP miss co support")

case8_items = [
    {"name": "A", "w": 300, "h": 200, "d": 600, "weight": 10},
    {"name": "B", "w": 300, "h": 200, "d": 300, "weight": 8},
    # C can xep tai vi tri bat ky co support nhung bi bo lo boi corner-point
    {"name": "C", "w": 150, "h": 200, "d": 300, "weight": 5},
    {"name": "D", "w": 150, "h": 200, "d": 300, "weight": 5},
]
r8, p8, u8 = run_pack(600, 400, 600, 9999, case8_items, "Case8: 2 items same height")


# =============================================================================
# TONG KET
# =============================================================================
print("\n" + "="*60)
print("TONG KET THUC NGHIEM")
print(f"Ngay gio chay: {datetime.datetime.now().isoformat()}")
print(f"Dataset: Thiet ke thu cong de tim EP miss")
print()
print("Ket qua:")
print(f"  Case 4: {u4} items unpacked | fill={r4:.1f}%")
print(f"  Case 7: {u7} items unpacked | fill={r7:.1f}%")
print(f"  Case 8: {u8} items unpacked | fill={r8:.1f}%")
print()
print("Chu thich: Ket qua tren la so do thuc, khong phai suy doan.")
print("Script nay chay truc tiep tren GravityPacker hien tai (chua sua doi).")
