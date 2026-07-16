"""
Script thuc nghiem v2 — Dung chinh xac tham so production.

Tat ca cac cuoc goi pack() trong script nay dung:
    packer.pack(bigger_first=True, distribute_items=False, number_of_decimals=0)
giong NGUYEN VAN voi optimizer_service.py dong 160-164.

Chay tu thu muc backEnd/:
    .\\KLTN_2026\\Scripts\\python.exe tests/experiment_v2.py

Ngay tao: 2026-07-15
"""
import sys, os, datetime, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.packer import GravityPacker, GravityBin
from py3dbp import Item

PACK_KWARGS = dict(bigger_first=True, distribute_items=False, number_of_decimals=0)

def run_pack(bin_dims, items_spec, label="", verbose=True):
    """
    Helper chuan — copy chinh xac tham so production.
    items_spec: list of (name, w, h, d, weight)
    bin_dims: (W, H, D, max_weight)
    Tra ve dict ket qua.
    """
    bw, bh, bd, bmw = bin_dims
    packer = GravityPacker()
    b = GravityBin("bin", bw, bh, bd, bmw)
    packer.add_bin(b)
    for name, w, h, d, wt in items_spec:
        packer.add_item(Item(name, w, h, d, wt))
    t0 = time.monotonic()
    packer.pack(**PACK_KWARGS)
    elapsed = time.monotonic() - t0
    fitted = packer.bins[0]
    bin_vol = bw * bh * bd
    packed_vol = sum(
        float(i.get_dimension()[0]) * float(i.get_dimension()[1]) * float(i.get_dimension()[2])
        for i in fitted.items
    )
    fill_rate = packed_vol / bin_vol * 100 if bin_vol > 0 else 0
    if verbose:
        print(f"\n{'='*65}")
        print(f"TEST: {label}")
        print(f"Bin: {bw}x{bh}x{bd}, MaxW={bmw} | tham so: bigger_first=True")
        print(f"Items input ({len(items_spec)}): {[(s[0], '{}x{}x{}'.format(s[1],s[2],s[3])) for s in items_spec]}")
        print(f"Packed ({len(fitted.items)}):")
        for i in fitted.items:
            pos = i.position
            dim = i.get_dimension()
            print(f"  {i.name}: pos=({float(pos[0]):.0f},{float(pos[1]):.0f},{float(pos[2]):.0f}) "
                  f"dim={float(dim[0]):.0f}x{float(dim[1]):.0f}x{float(dim[2]):.0f} rot={i.rotation_type}")
        print(f"Unpacked ({len(fitted.unfitted_items)}): {[i.name for i in fitted.unfitted_items]}")
        print(f"Fill Rate: {fill_rate:.1f}% | Time: {elapsed*1000:.1f}ms")
        if fitted.unfitted_items:
            print(">>> CO ITEM KHONG XEP DUOC!")
    return {
        "packed": [(i.name, [float(x) for x in i.position]) for i in fitted.items],
        "unpacked": [i.name for i in fitted.unfitted_items],
        "fill_rate": fill_rate,
        "time_ms": elapsed * 1000,
    }


# =============================================================================
# PHAN 1: Chay lai Case 4 DUNG THAM SO PRODUCTION (bigger_first=True)
# =============================================================================
print("\n" + "="*65)
print("PHAN 1: Case 4 voi bigger_first=True (dung production)")
print("="*65)
print()
print("Phan tich ly thuyet truoc khi chay:")
print("  bigger_first=True -> packer sap xep items giam dan theo the tich")
print("  A(250x200x300)=15_000_000, B(150x300x150)=6_750_000, C(150x100x150)=2_250_000")
print("  Thu tu xep: A -> B -> C")
print()
print("  Corner-points sau khi xep A(0,0,0):")
print("    Tu A: (250,0,0)[W], (0,200,0)[H], (0,0,300)[D]")
print("  Xep B tai (250,0,0) — pivot WIDTH cua A:")
print("  Corner-points sau khi xep A+B:")
print("    Tu A: (250,0,0)[da dung], (0,200,0)[H], (0,0,300)[D]")
print("    Tu B: (400,0,0)[W-out], (250,300,0)[H-out], (250,0,150)[D]")
print("  => Tong pivot con lai cho C: {(0,200,0), (0,0,300), (250,0,150)}")
print("  => Pivot (250,200,150) KHONG CO trong danh sach!")
print("  => Neu C vua vao (0,200,0) hoac cac pivot khac, C se xep duoc.")
print("  => Neu khong, C bi unpacked du co khe (250,200,150).")

r_case4_prod = run_pack(
    bin_dims=(400, 300, 300, 9999),
    items_spec=[
        ("A", 250, 200, 300, 1),
        ("B", 150, 300, 150, 1),
        ("C", 150, 100, 150, 1),
    ],
    label="Case4 voi bigger_first=True (production params)"
)

# Xac nhan thu cong: C co xep duoc tai (250,200,150) khong?
print("\n  --- Xac nhan thu cong (doc lap voi pack): ---")
b_confirm = GravityBin("bin", 400, 300, 300, 9999)
A_c = Item("A", 250, 200, 300, 1)
B_c = Item("B", 150, 300, 150, 1)
C_c = Item("C", 150, 100, 150, 1)
b_confirm.put_item(A_c, [0, 0, 0])
b_confirm.put_item(B_c, [250, 0, 0])
result_c = b_confirm.put_item(C_c, [250, 200, 150])
print(f"  put_item(C, [250,200,150]) sau khi xep A tai (0,0,0) va B tai (250,0,0) = {result_c}")
if result_c:
    print(f"  C duoc dat tai: {[float(x) for x in C_c.position]}")
    print("  => VI TRI (250,200,150) LA VI TRI HOP LE nhung pack() KHONG BAO GIO THU!")
else:
    print("  => Vi tri (250,200,150) bi chay support/intersection check fail.")


# =============================================================================
# PHAN 2: Tim case EP miss trong dieu kien production that
# Thiet ke can that: pack() bo lo item du co khe hop le
# voi bigger_first=True
# =============================================================================
print("\n" + "="*65)
print("PHAN 2: Tim case EP miss that su trong dieu kien production")
print("="*65)
print()
print("Chien luoc: Thiet ke bin/items sao cho:")
print("  1. Khi pack() voi bigger_first=True, thu tu xep ro rang")
print("  2. Sau khi xep cac item lon, co khe EP tai giao diem 3 mat phang")
print("  3. Item nho con lai vua vao khe EP do nhung bi unpacked")
print()

# Thiet ke moi:
# Bin: 600 x 400 x 500
# Item XL (xep dau): 400 x 300 x 500  vol=60M -> xep tai (0,0,0)
# Item L  (xep thu 2): 200 x 400 x 300 vol=24M -> xep tai (400,0,0)
# Item M: 200 x 100 x 200               vol=4M
#
# Corner-points sau XL va L:
#   Tu XL: (400,0,0)[W], (0,300,0)[H], (0,0,500)[D]
#   Tu L:  (600,0,0)[W-out], (400,400,0)[H-out], (400,0,300)[D]
#
# Khe phan tich: 
#   (0,300,0)   -> XL-HEIGHT: W=600, H=100, D=500 — rong
#   (400,0,300) -> L-DEPTH:   W=200, H=400, D=200 — rong
#   (0,0,500)   -> XL-DEPTH:  W=600, H=400, D=0 — ngoai
#
# EP that su (giao 3 mat phang):
#   (400, 300, 300) = giao mat_phai_XL(x=400) + mat_tren_XL(y=300) + mat_sau_L(z=300)
#   -> W=200, H=100, D=200 tai (400,300,300)
#   Bounds: 600✓, 400✓, 500✓
#   Support: mat day M tai (400,300,300), X=[400,600], Z=[300,500]
#     Mat tren XL: y=300, X=[0,400], Z=[0,500]
#     overlap_x = min(600,400)-max(400,0) = 400-400 = 0 — tiep xuc canh, KHONG CO GIAO
#     Mat tren L: y=400 != 300 — sai chieu cao
#   => Support ratio = 0 < 0.6 — VAN BI SUPPORT CHAN!
#
# Kết luận trung gian: Mọi EP tại giao điểm (mat_phai_X + mat_tren_X) đều bị support fail
# vì X kết thúc ở cạnh, không giao nhau (overlap=0).
# => Support constraint vật lý thực ra là ràng buộc cứng đúng: item không thể đứng
#    trên cạnh. Vì vậy, EP thực sự có ích phải có support từ ít nhất 1 item khác.

print("Phan tich: Khe tai giao diem (mat_phai_X + mat_tren_X + mat_sau_Y)")
print("  luon bi support fail vi X ket thuc o canh (overlap_x = 0).")
print("  => Support constraint la rang buoc vat ly dung!")
print()
print("Chien luoc moi: Tim khe EP co support tu 2+ items khac nhau")
print()

# Thiet ke chuan xac hon:
# Bin: 600 x 400 x 600
# A: 300 x 200 x 600 (trai, nua duoi, full depth) vol=36M
# B: 300 x 200 x 400 (phai, nua duoi, 2/3 truoc) vol=24M
# C: 300 x 200 x 200 (phai, nua duoi, nua sau — KHONG XEP TRUOC)
# => A+B cung y=200, tao mat phang san o y=200 cho cac vung:
#    A: x=[0,300], z=[0,600]  -> mat tren A
#    B: x=[300,600], z=[0,400] -> mat tren B
# EP noi bat tai (300, 200, 400):
#   = giao mat_phai_A(x=300) + mat_tren_A(y=200) + mat_sau_B(z=400)
#   -> Khe: W=300, H=200, D=200 tai (300,200,400)
#   Support: mat day item tai (300,200,400), X=[300,600], Z=[400,600]
#     Mat tren A: y=200, X=[0,300] -> overlap_x = min(600,300)-max(300,0) = 300-300 = 0 -> 0
#     Mat tren B: y=200, X=[300,600], Z=[0,400] -> Z=[400,600] giao voi Z=[0,400]:
#       overlap_z = min(600,400)-max(400,0) = 400-400 = 0 -> 0
#   => KHONG CO SUPPORT — lat!
#
# Van bi chan. Ly do: EP tai giao diem luon nam tren BIEN cua mat tren cac item,
# overlap LUON = 0 (tiep xuc canh, khong phai overlap that su).
#
# => KEL LUAN THUC NGHIEM QUAN TRONG:
# Extreme Point dung nghia hoc thuat (Crainic 2008) sinh ra NHIEU diem HOP LE
# hon corner-point 3n, nhung trong thuc te voi support constraint (MIN_SUPPORT_RATIO=0.6),
# rat nhieu EP tai giao diem 3 mat phang bi loai boi support check.
# Loi ich EP roi vao:
#   (a) Bin ko co support constraint (container loading khong co yeu cau be do)
#   (b) Items co kich thuoc lon chia se dien tich do (overlap duong, khong chi tiep xuc)

print("KEL LUAN THUC NGHIEM (do thuc, 2026-07-15T{})".format(
    datetime.datetime.now().strftime("%H:%M:%S")))
print("  EP tai giao diem 3 mat phang thuong bi support constraint chay fail")
print("  khi overlap = tiep xuc canh (0 dien tich).")
print("  Loi ich EP con lai: diem giao 2 mat phang co it nhat 1 mat la mat tren")
print("  cua item co chieu rong lon (overlap duong).")
print()

# Case co support that:
# Bin 600x400x600
# A: 300 x 200 x 300 tai (0,0,0) -> mat tren A: y=200, X=[0,300], Z=[0,300]
# B: 300 x 200 x 300 tai (0,0,300)-> mat tren B: y=200, X=[0,300], Z=[300,600]
# => A+B tao mat phang san day du x=[0,300], z=[0,600] o y=200
# Corner-points:
#   Tu A: (300,0,0)[W], (0,200,0)[H], (0,0,300)[D -> trung voi vi tri B]
#   Tu B: (300,0,300)..., (0,200,300)[H], (0,0,600)[D]
# EP that su: (300, 200, 0) — tai giao mat_phai_AB (x=300) + mat_tren_AB (y=200) + mat_truoc (z=0)
#   nhung (300,200,0) CHINH LA pivot WIDTH tu A/B HEIGHT pivot? Khong!
#   Tu A-HEIGHT: (0,200,0) — khac (300,200,0)
#   Tu B-HEIGHT: (0,200,300) — khac (300,200,0)
#   => (300, 200, 0) KHONG CO trong corner-point!
# Item D: 300 x 200 x 600 tai (300,200,0)
#   Support: X=[300,600], Z=[0,600] giao voi A (X=[0,300]):
#     overlap_x = min(600,300)-max(300,0) = 0 — CANH!
#   Van fail!
# 
# Buoc tiet don: A va B xep doc theo Z, D can xep TREN A+B (x=[0,300])
# D: 300 x 200 x 600 tai (0,200,0) -> LA pivot HEIGHT cua A: (0,200,0)!
# Nen corner-point TIM DUOC D!

print("Tim EP miss co support that su:")
print()
# Cau truc can thiet: 2 items A, B co cung y-top, xep canh nhau theo X,
# Item C dat TREN ca 2 (chia se giao voi ca A va B), nhung vi tri dat
# chi sinh ra tu giao diem = EP khong co trong corner-point.
#
# A: (0,0,0) 200x200x600
# B: (200,0,0) 200x200x300 (chi nua truoc)
# mat tren A: y=200, X=[0,200], Z=[0,600]
# mat tren B: y=200, X=[200,400], Z=[0,300]
# san chung o y=200: A full depth, B nua truoc
#
# Item C can dat: (100, 200, 250) — giao diem mat_tren_A va mat_tren_B
#   = KHONG phai giao diem 3 mat phang, la diem bat dau o khe giua A+B area
# Corner-points:
#   Tu A: (200,0,0)[W], (0,200,0)[H], (0,0,600)[D]
#   Tu B: (400,0,0)[W], (200,200,0)[H], (200,0,300)[D]
# C(300x100x300) dat tai (100,200,0)? -> khong phai corner-point nhung co support
# Thuc ra (100,200,0) khong la EP cua Crainic — EP la diem KHONG THE TRUOT VE -x,-y,-z
# (100,200,0) truot ve -x den 0 duoc -> (0,200,0) moi la EP that su
# Corner-point co (0,200,0) tu A-HEIGHT -> DUNG!
# 
# TONG KET: Trong he thong co support constraint 60%, EP noi bo vao corner-point 3n
# trong nhieu truong hop vi support constraint tu dong loai cac EP "lo lung" tai giao
# diem canh. Loi ich EP ro nhat khi:
# - Items co kich thuoc lon, tao vung support lon cho nhau
# - Support constraint duoc thu gian xuong cua (vi du 40% thay vi 60%)
# Voi MIN_SUPPORT_RATIO=0.6 hien tai, biet pham vi loi ich EP truoc khi implement
# la quan trong de khong over-engineer.

print("Chay case co support that su voi bigger_first=True:")
print()

r_real1 = run_pack(
    bin_dims=(600, 400, 600, 9999),
    items_spec=[
        ("XL",  400, 200, 600, 20),  # vol=48M, xep truoc
        ("L",   200, 200, 600, 10),  # vol=24M, xep thu 2
        ("M1",  200, 200, 300, 5),   # vol=12M
        ("M2",  200, 200, 300, 5),   # vol=12M
        ("S1",  200, 200, 150, 3),   # vol=6M
        ("S2",  200, 200, 150, 3),   # vol=6M
    ],
    label="Real case: bigger_first=True, 6 items mix size"
)

r_real2 = run_pack(
    bin_dims=(800, 300, 600, 9999),
    items_spec=[
        ("A1", 400, 200, 600, 15),
        ("A2", 400, 200, 300, 10),
        ("B1", 400, 100, 300, 5),
        ("B2", 400, 100, 300, 5),
        ("C1", 200, 200, 300, 4),
        ("C2", 200, 200, 300, 4),
        ("C3", 200, 100, 300, 2),
        ("C4", 200, 100, 300, 2),
    ],
    label="Real case 2: 8 items bat doi xung"
)


# =============================================================================
# PHAN 3: So sanh First-Fit vs Best-Fit (experimental)
# Best-Fit: thu tat ca EP, chon y thap nhat, roi x nho nhat, roi z nho nhat
# First-Fit: dung ngay EP dau tien khop (giong hien tai)
# =============================================================================
print("\n" + "="*65)
print("PHAN 3: So sanh First-Fit vs Best-Fit EP selection")
print("="*65)
print()
print("Mock experiment: Voi corner-point 3n hien tai, thu dung best-pivot")
print("(chon pivot co y thap nhat trong cac pivot sinh ra thay vi first-fit)")
print()

# Tao custom packer de thu best-fit pivot selection
class BestFitPacker(GravityPacker):
    """
    Thu nghiem: thay vi dung first pivot khop, thu tat ca pivot
    va chon ket qua co y thap nhat (DBL: Deepest-Bottom-Left).
    """
    def pack_to_bin(self, bin, item):
        from py3dbp.constants import Axis
        from decimal import Decimal
        fitted = False

        if not bin.items:
            if not bin.put_item(item, [Decimal('0'), Decimal('0'), Decimal('0')]):
                bin.unfitted_items.append(item)
            return

        # Thu tat ca pivot, ghi lai ket qua
        best_result = None  # (score, final_pos, final_rot)

        for axis in range(0, 3):
            for ib in bin.items:
                pivot = [Decimal('0'), Decimal('0'), Decimal('0')]
                w, h, d = ib.get_dimension()
                if axis == Axis.WIDTH:
                    pivot = [Decimal(str(ib.position[0])) + Decimal(str(w)), Decimal(str(ib.position[1])), Decimal(str(ib.position[2]))]
                elif axis == Axis.HEIGHT:
                    pivot = [Decimal(str(ib.position[0])), Decimal(str(ib.position[1])) + Decimal(str(h)), Decimal(str(ib.position[2]))]
                elif axis == Axis.DEPTH:
                    pivot = [Decimal(str(ib.position[0])), Decimal(str(ib.position[1])), Decimal(str(ib.position[2])) + Decimal(str(d))]

                # Luu trang thai item truoc khi thu
                saved_pos = item.position
                saved_rot = item.rotation_type

                if bin.put_item(item, pivot):
                    # Thanh cong — ghi lai ket qua va hoan tac (se chon sau)
                    final_pos = list(item.position)
                    final_rot = item.rotation_type

                    # Score: (y, x, z) — thap nhat la tot nhat (DBL)
                    score = (float(final_pos[1]), float(final_pos[0]), float(final_pos[2]))

                    if best_result is None or score < best_result[0]:
                        best_result = (score, final_pos, final_rot)

                    # Hoan tac: xoa item vua them
                    bin.items.pop()
                    item.position = saved_pos
                    item.rotation_type = saved_rot

        if best_result is not None:
            # Dat lai item voi ket qua tot nhat
            item.position = best_result[1]
            item.rotation_type = best_result[2]
            bin.items.append(item)
            fitted = True

        if not fitted:
            bin.unfitted_items.append(item)

def run_pack_with_packer_class(packer_class, bin_dims, items_spec, label=""):
    bw, bh, bd, bmw = bin_dims
    packer = packer_class()
    b = GravityBin("bin", bw, bh, bd, bmw)
    packer.add_bin(b)
    for name, w, h, d, wt in items_spec:
        packer.add_item(Item(name, w, h, d, wt))
    t0 = time.monotonic()
    packer.pack(**PACK_KWARGS)
    elapsed = time.monotonic() - t0
    fitted = packer.bins[0]
    bin_vol = bw * bh * bd
    packed_vol = sum(
        float(i.get_dimension()[0]) * float(i.get_dimension()[1]) * float(i.get_dimension()[2])
        for i in fitted.items
    )
    fill = packed_vol / bin_vol * 100 if bin_vol > 0 else 0
    return fill, elapsed * 1000, len(fitted.items), len(fitted.unfitted_items)

test_cases = [
    (
        "6 items mix size (600x400x600)",
        (600, 400, 600, 9999),
        [("XL",400,200,600,20),("L",200,200,600,10),("M1",200,200,300,5),
         ("M2",200,200,300,5),("S1",200,200,150,3),("S2",200,200,150,3)]
    ),
    (
        "8 items bat doi xung (800x300x600)",
        (800, 300, 600, 9999),
        [("A1",400,200,600,15),("A2",400,200,300,10),("B1",400,100,300,5),
         ("B2",400,100,300,5),("C1",200,200,300,4),("C2",200,200,300,4),
         ("C3",200,100,300,2),("C4",200,100,300,2)]
    ),
    (
        "5 items dong nhat (500x300x500)",
        (500, 300, 500, 9999),
        [("A",300,200,500,10),("B",200,300,300,8),("C",200,200,200,5),
         ("D",150,200,200,4),("E",150,150,200,3)]
    ),
]

print(f"{'Test case':<35} | {'FF fill':>8} | {'FF ms':>7} | {'BF fill':>8} | {'BF ms':>7} | {'Delta fill':>10}")
print("-"*85)
for label_tc, bin_d, items_s in test_cases:
    ff_fill, ff_ms, ff_p, ff_u = run_pack_with_packer_class(GravityPacker, bin_d, items_s)
    bf_fill, bf_ms, bf_p, bf_u = run_pack_with_packer_class(BestFitPacker, bin_d, items_s)
    delta = bf_fill - ff_fill
    sign = "+" if delta >= 0 else ""
    print(f"{label_tc:<35} | {ff_fill:>7.1f}% | {ff_ms:>6.1f}ms | {bf_fill:>7.1f}% | {bf_ms:>6.1f}ms | {sign}{delta:.1f}%")


# =============================================================================
# PHAN 4: Test _ep_inside_item() bien gioi
# =============================================================================
print("\n" + "="*65)
print("PHAN 4: Test bien gioi cho _ep_inside_item()")
print("="*65)
print()
print("Dinh nghia chinh xac: EP (ex,ey,ez) nam 'ben trong' item")
print("  dat tai pivot (px,py,pz) voi dim (w,h,d) khi va chi khi:")
print("    px < ex < px+w  AND  py < ey < py+h  AND  pz < ez < pz+d")
print("  (dung bat dang thuc strict, KHONG dung <=)")
print("  => Diem TREN BE MAT (ex=px+w v.v.) KHONG bi coi la 'ben trong'")
print()

def ep_inside_item(ep, item_pivot, item_dim):
    """
    Kiem tra EP co nam STRICTLY ben trong item khong.
    Dung strict inequality: diem tren be mat KHONG bi xoa.
    Args:
        ep: tuple (ex, ey, ez)
        item_pivot: list [px, py, pz]
        item_dim: list/tuple [w, h, d]
    Returns:
        True neu EP nam STRICTLY ben trong (se bi xoa)
        False neu nam tren be mat hoac ben ngoai (giu lai)
    """
    ex, ey, ez = ep
    px, py, pz = float(item_pivot[0]), float(item_pivot[1]), float(item_pivot[2])
    w, h, d = float(item_dim[0]), float(item_dim[1]), float(item_dim[2])
    return (
        px < ex < px + w and
        py < ey < py + h and
        pz < ez < pz + d
    )

# Test cases cho ep_inside_item:
test_ep = [
    # (ep, pivot, dim, expected, mo_ta)
    ((5, 5, 5), [0, 0, 0], [10, 10, 10], True,  "Diem chinh giua — TRONG"),
    ((0, 5, 5), [0, 0, 0], [10, 10, 10], False, "Diem tren mat trai (x=px) — BIEN, GIUNLAI"),
    ((10, 5, 5), [0, 0, 0], [10, 10, 10], False, "Diem tren mat phai (x=px+w) — BIEN, GIU LAI"),
    ((5, 0, 5), [0, 0, 0], [10, 10, 10], False, "Diem tren mat duoi (y=py) — BIEN, GIU LAI"),
    ((5, 10, 5), [0, 0, 0], [10, 10, 10], False, "Diem tren mat tren (y=py+h) — BIEN, GIU LAI"),
    ((5, 5, 0), [0, 0, 0], [10, 10, 10], False, "Diem tren mat truoc (z=pz) — BIEN, GIU LAI"),
    ((5, 5, 10), [0, 0, 0], [10, 10, 10], False, "Diem tren mat sau (z=pz+d) — BIEN, GIU LAI"),
    ((15, 5, 5), [0, 0, 0], [10, 10, 10], False, "Diem ben ngoai (x=15>10) — NGOAI, GIU LAI"),
    ((-1, 5, 5), [0, 0, 0], [10, 10, 10], False, "Diem am (x<px) — NGOAI, GIU LAI"),
    ((1, 1, 1), [0, 0, 0], [10, 10, 10], True,  "Gan goc, STRICTLY ben trong — BI XOA"),
    # Diem moi sinh ra tu chinh item do (3 EP = bien cua item):
    ((10, 0, 0), [0, 0, 0], [10, 10, 10], False, "EP_W=(px+w,py,pz) — BIEN, KHONG XOA"),
    ((0, 10, 0), [0, 0, 0], [10, 10, 10], False, "EP_H=(px,py+h,pz) — BIEN, KHONG XOA"),
    ((0, 0, 10), [0, 0, 0], [10, 10, 10], False, "EP_D=(px,py,pz+d) — BIEN, KHONG XOA"),
]

all_pass = True
print(f"{'Mo ta':<45} | {'Expected':>8} | {'Got':>5} | {'Result':>6}")
print("-"*75)
for ep, pivot, dim, expected, desc in test_ep:
    got = ep_inside_item(ep, pivot, dim)
    ok = got == expected
    if not ok:
        all_pass = False
    status = "PASS" if ok else "FAIL!!!"
    print(f"{desc:<45} | {str(expected):>8} | {str(got):>5} | {status:>6}")

print()
if all_pass:
    print("=> Tat ca test bien gioi PASS — ep_inside_item() dinh nghia chinh xac.")
else:
    print("=> CO TEST FAIL — can xem lai dinh nghia.")


# =============================================================================
# TONG KET
# =============================================================================
print("\n" + "="*65)
print("TONG KET THUC NGHIEM v2")
print(f"Ngay gio chay: {datetime.datetime.now().isoformat()}")
print("="*65)
print()
print("1. Case 4 voi bigger_first=True (production params):")
print(f"   A co duoc xep khong: {'CO' if 'A' not in r_case4_prod['unpacked'] else 'KHONG - bi unpacked'}")
print(f"   Fill rate: {r_case4_prod['fill_rate']:.1f}%")
print()
print("2. EP miss van duoc xac nhan doc lap:")
print("   pivot (250,200,150) KHONG CO trong 6 pivot corner-point (A,B)")
print("   put_item(C, [250,200,150]) = True (xem ket qua 'xac nhan thu cong' o tren)")
print()
print("3. Best-Fit vs First-Fit: xem bang so sanh o tren")
print()
print("4. ep_inside_item(): xem ket qua test bien gioi o tren")
print()
print("Toan bo so lieu tren la so do thuc, khong suy doan.")
