"""
Script instrumentation v4 — Giai quyet 3 van de tu phan hoi:

1. Doi chieu EPPacker v3 (ep_expand) voi thiet ke da duyet (EP list FIFO)
   va trien khai dung ban da duyet de chay lai.
2. Log N1/N2/N3 + ly do reject cho moi test case.
3. Xay dung case Gravity Drop co chu dich — item co y thap hon hop le
   nhung corner-point 3n khong troi toi.

Chay:
    .\\KLTN_2026\\Scripts\\python.exe tests/experiment_v4.py

Ngay: 2026-07-15
Tham so pack(): copy nguyen tu optimizer_service.py dong 160-164.
"""
import sys, os, datetime, time
from decimal import Decimal
from typing import List, Tuple

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.core.packer import GravityPacker, GravityBin, MIN_SUPPORT_RATIO
from py3dbp import Item
from py3dbp.constants import Axis

PACK_KWARGS = dict(bigger_first=True, distribute_items=False, number_of_decimals=0)


# =============================================================================
# PHAN 1: DOI CHIEU implementation EP v3 voi thiet ke da duyet
# =============================================================================
print("=" * 70)
print("PHAN 1: Doi chieu EPPacker v3 voi thiet ke da duyet (Section 4.2-4.3)")
print("=" * 70)
print()
print("EPPacker TRONG experiment_v3.py:")
print("  - Sinh 3n corner-point (nhu cu)")
print("  - Them: loop O(n^2) qua cac cap (ib, jb), sinh pivot giao diem")
print("    mat_phai_j + mat_tren_i, lay z tu 4 gia tri (pzi, pzi+di, pzj, pzj+dj)")
print("  - First-fit tren tap mo rong")
print()
print("Thiet ke DA DUYET trong plan G1 (Section 4.2-4.3):")
print("  - EP list FIFO: self._extreme_points = [(0,0,0)]")
print("  - _update_extreme_points(item, final_pivot): sau moi put_item thanh cong,")
print("    XOAS EP bi 'nuot' (strictly inside item moi), THEM 3 EP moi tu canh item")
print("  - _ep_inside_item(): strict inequality, bien mat khong bi xoa")
print("  - pack_to_bin(): First-fit duyet EP list (FIFO)")
print()
print("PHAN TICH SU KHAC BIET:")
print("  EPPacker v3 KHONG PHAI implementation da duyet vi:")
print("  a) Khong co EP list tinh luy — sinh lai tu dau cho moi item")
print("  b) Them cac diem giao diem theo cong thuc khac thiet ke")
print("  c) Khong co _ep_inside_item() de loc EP cu")
print("  d) Khac nhau ve tap pivot duoc thu (co the lon hon HOAC be hon ban da duyet)")
print()
print("=> Ket qua Section 2.1 v3 KHONG ap dung cho thiet ke da duyet.")
print("   Can trien khai dung ban da duyet va chay lai.")
print()


# =============================================================================
# TRIEN KHAI DUNG BAN DA DUYET (Section 4.2-4.3 plan G1 lan 3)
# =============================================================================

class EPGravityBin(GravityBin):
    """
    GravityBin co EP list tinh luy theo thiet ke da duyet (plan G1 lan 3 Section 4.2).

    Thay doi duy nhat so voi GravityBin:
    - Them self._extreme_points = [(0,0,0)] khoi tao
    - Override put_item() de goi _update_extreme_points() sau moi dat thanh cong
    - Them _ep_inside_item() va _update_extreme_points()
    """

    def __init__(self, name, width, height, depth, max_weight):
        super().__init__(name, width, height, depth, max_weight)
        # EP list FIFO, luu toa do truoc khi resolve gravity
        # y_raw = y tai thoi diem sinh EP (chua resolve qua gravity drop)
        self._extreme_points: List[Tuple] = [(0, 0, 0)]

    def _ep_inside_item(self, ep: tuple, item: Item, pivot: list) -> bool:
        """
        Kiem tra EP co nam STRICTLY ben trong the tich item khong.
        Dung strict inequality: diem tren be mat KHONG bi coi la 'ben trong'.

        Da test 13/13 bien gioi PASS trong experiment_v2.py.

        Returns:
            True neu EP nam STRICTLY ben trong (can xoa)
            False neu nam tren be mat hoac ben ngoai (giu lai)
        """
        ex, ey, ez = float(ep[0]), float(ep[1]), float(ep[2])
        px, py, pz = float(pivot[0]), float(pivot[1]), float(pivot[2])
        dim = item.get_dimension()
        w, h, d = float(dim[0]), float(dim[1]), float(dim[2])
        return (
            px < ex < px + w and
            py < ey < py + h and
            pz < ez < pz + d
        )

    def _update_extreme_points(self, item: Item, final_pivot: list) -> None:
        """
        Cap nhat tap EP sau khi dat item thanh cong.
        1. Xoa EP cu bi item moi 'nuot' (strictly ben trong).
        2. Them 3 EP moi tu canh item (EP_W, EP_H, EP_D).

        Do phuc tap: O(n) cho n EP hien co.
        Toan bo qua trinh pack: O(n^3) (n item x O(n) EP x O(n) intersection check).
        """
        px, py, pz = float(final_pivot[0]), float(final_pivot[1]), float(final_pivot[2])
        dim = item.get_dimension()
        w, h, d = float(dim[0]), float(dim[1]), float(dim[2])

        # Xoa EP cu bi item moi nuot (truoc khi them EP moi de tranh tu xoa chinh minh)
        self._extreme_points = [
            ep for ep in self._extreme_points
            if not self._ep_inside_item(ep, item, final_pivot)
        ]

        # Them 3 EP moi — chi them neu con nam trong bin
        bw, bh, bd = float(self.width), float(self.height), float(self.depth)
        for ep in [
            (px + w, py,     pz    ),  # EP_W: mat phai item
            (px,     py + h, pz    ),  # EP_H: mat tren item
            (px,     py,     pz + d),  # EP_D: mat sau item
        ]:
            if ep[0] <= bw and ep[1] <= bh and ep[2] <= bd:
                if ep not in self._extreme_points:
                    self._extreme_points.append(ep)

    def put_item(self, item: Item, pivot: list) -> bool:
        """
        Override put_item() de goi _update_extreme_points() sau dat thanh cong.
        Giu nguyen toan bo logic GravityBin.put_item() (bounds, intersection, weight, support, LBD).
        Chuyen pivot ve Decimal de tuong thich voi py3dbp noi bo.
        """
        # py3dbp dung Decimal noi bo — truyen pivot la Decimal de tranh TypeError
        dec_pivot = [Decimal(str(p)) for p in pivot]
        result = super().put_item(item, dec_pivot)
        if result:
            # Goi update voi vi tri THUC TE sau LBD compact
            self._update_extreme_points(item, item.position)
        return result


class EPDesignedPacker(GravityPacker):
    """
    Packer dung EPGravityBin — trien khai dung thiet ke da duyet.
    pack_to_bin() duyet EP list (FIFO), First-Fit.
    """

    def pack_to_bin(self, bin: EPGravityBin, item: Item):
        """
        Tim vi tri dat item trong bin dua tren tap EP tinh luy (FIFO, First-Fit).
        Thay the corner-point 3n bang EP list.

        Ghi chu: First-Fit duoc giu vi Best-Fit DBL da duoc thu nghiem va cho ket qua kem hon
        (experiment_v2.py: -16.7% fill rate tren case 8 items).
        DEEP mode cai thien chat luong qua GA ordering, khong qua pivot selection.
        """
        fitted = False

        if not bin.items:
            if bin.put_item(item, [0, 0, 0]):
                pass  # put_item() da goi _update_extreme_points() ben trong
            else:
                bin.unfitted_items.append(item)
            return

        # First-fit tren EP list (FIFO)
        for ep in bin._extreme_points:
            pivot = [Decimal(str(v)) for v in ep]
            if bin.put_item(item, pivot):
                fitted = True
                break  # put_item() da goi _update_extreme_points()

        if not fitted:
            bin.unfitted_items.append(item)


# =============================================================================
# PHAN 2: Instrumentation — dem N1, N2, N3 + ly do reject
# =============================================================================
print("=" * 70)
print("PHAN 2: Instrumentation N1/N2/N3 + ly do reject")
print("=" * 70)
print()
print("Dinh nghia:")
print("  N1 = Tong pivot corner-3n sinh ra (3 * so item da xep tai thoi diem thu)")
print("  N2 = Tong EP trong EPGravityBin._extreme_points tai cung thoi diem")
print("  N3 = So EP chi co trong N2 (khong co trong N1) tai moi buoc")
print("  + Ly do reject cho tung EP trong N3: bounds / intersection / weight / support")
print()


class InstrumentedCP3nPacker(GravityPacker):
    """Corner-point 3n voi counter."""
    def __init__(self):
        super().__init__()
        self.total_candidates_tried = 0
        self.total_items_placed = 0

    def pack_to_bin(self, bin, item):
        fitted = False
        if not bin.items:
            if bin.put_item(item, [0, 0, 0]):
                self.total_candidates_tried += 1
                self.total_items_placed += 1
            else:
                bin.unfitted_items.append(item)
            return

        for axis in range(0, 3):
            for ib in bin.items:
                w, h, d = ib.get_dimension()
                if axis == Axis.WIDTH:
                    pivot = [ib.position[0]+w, ib.position[1], ib.position[2]]
                elif axis == Axis.HEIGHT:
                    pivot = [ib.position[0], ib.position[1]+h, ib.position[2]]
                else:
                    pivot = [ib.position[0], ib.position[1], ib.position[2]+d]

                self.total_candidates_tried += 1
                if bin.put_item(item, pivot):
                    fitted = True
                    self.total_items_placed += 1
                    break
            if fitted:
                break

        if not fitted:
            bin.unfitted_items.append(item)


class InstrumentedEPPacker(EPDesignedPacker):
    """EP designed packer voi instrumentation day du."""
    def __init__(self):
        super().__init__()
        self.total_ep_tried = 0
        self.total_items_placed = 0
        self.ep_exclusive_stats = {
            "count": 0,
            "reject_bounds": 0,
            "reject_intersection": 0,
            "reject_weight": 0,
            "reject_support": 0,
            "reject_all_rotations": 0,  # failed tat ca 6 rotations
            "success": 0,
        }
        # Theo doi EP list evolution
        self.ep_list_sizes = []

    def pack_to_bin(self, bin: EPGravityBin, item: Item):
        fitted = False

        if not bin.items:
            if bin.put_item(item, [0, 0, 0]):
                self.total_ep_tried += 1
                self.total_items_placed += 1
            else:
                bin.unfitted_items.append(item)
            return

        # Tinh N1: corner-point 3n tai thoi diem nay
        cp3n_set = set()
        for ib in bin.items:
            w, h, d = ib.get_dimension()
            px, py, pz = ib.position[0], ib.position[1], ib.position[2]
            cp3n_set.add((float(px+w), float(py),   float(pz)  ))
            cp3n_set.add((float(px),   float(py+h), float(pz)  ))
            cp3n_set.add((float(px),   float(py),   float(pz+d)))

        # N2: EP list hien tai
        ep_set = set((float(e[0]), float(e[1]), float(e[2])) for e in bin._extreme_points)

        # N3: EP exclusives (co trong EP set nhung khong co trong corner-3n set)
        ep_exclusive = ep_set - cp3n_set

        self.ep_list_sizes.append((len(bin.items), len(cp3n_set), len(ep_set), len(ep_exclusive)))

        # Phan loai ly do reject cho EP exclusive
        for ep in ep_exclusive:
            self.ep_exclusive_stats["count"] += 1
            # Phan tich tai sao EP nay bi reject (neu co)
            test_item = Item(item.name + "_test", item.width, item.height, item.depth, item.weight)
            test_item.position = item.position
            test_item.rotation_type = item.rotation_type

            pivot = list(ep)
            bw, bh, bd = float(bin.width), float(bin.height), float(bin.depth)
            rejected = False

            for rot in range(6):
                test_item.rotation_type = rot
                dim = test_item.get_dimension()
                w, h, d = float(dim[0]), float(dim[1]), float(dim[2])

                # Bounds check
                if pivot[0]+w > bw or pivot[1]+h > bh or pivot[2]+d > bd:
                    continue  # Thu rotation khac

                # Intersection check
                px_f, py_f, pz_f = float(pivot[0]), float(pivot[1]), float(pivot[2])
                intersects = False
                for placed in bin.items:
                    pd = placed.get_dimension()
                    if (
                        float(placed.position[0]) < px_f+w and float(placed.position[0])+float(pd[0]) > px_f and
                        float(placed.position[1]) < py_f+h and float(placed.position[1])+float(pd[1]) > py_f and
                        float(placed.position[2]) < pz_f+d and float(placed.position[2])+float(pd[2]) > pz_f
                    ):
                        intersects = True
                        break
                if intersects:
                    continue

                # Weight check
                total_w = sum(float(p.weight) for p in bin.items)
                if total_w + float(item.weight) > float(bin.max_weight):
                    self.ep_exclusive_stats["reject_weight"] += 1
                    rejected = True
                    break

                # Support check
                test_item.position = pivot
                if not bin._check_physical_support(test_item, pivot):
                    self.ep_exclusive_stats["reject_support"] += 1
                    rejected = True
                    break

                # Neu qua tat ca: EP nay hop le nhung bi bo qua boi First-Fit
                # (vi EP truoc do da duoc dung)
                rejected = False
                break
            else:
                # Tat ca 6 rotation deu fail bounds
                self.ep_exclusive_stats["reject_bounds"] += 1
                rejected = True

            if not rejected:
                # EP exclusive va hop le — First-Fit da chon pivot khac truoc do
                self.ep_exclusive_stats["success"] += 1

        # First-fit tren EP list (FIFO) — giong EPDesignedPacker
        for ep in bin._extreme_points:
            pivot = [Decimal(str(v)) for v in ep]
            self.total_ep_tried += 1
            if bin.put_item(item, pivot):
                fitted = True
                self.total_items_placed += 1
                break

        if not fitted:
            bin.unfitted_items.append(item)


def run_instrumented(bin_dims, items_spec, label=""):
    bw, bh, bd, bmw = bin_dims
    bin_vol = bw * bh * bd

    print(f"  [{label}]")

    # CP-3n instrumented
    p1 = InstrumentedCP3nPacker()
    b1 = GravityBin("bin", bw, bh, bd, bmw)
    p1.add_bin(b1)
    for name, w, h, d, wt in items_spec:
        p1.add_item(Item(name, w, h, d, wt))
    p1.pack(**PACK_KWARGS)
    fill1 = sum(float(i.get_dimension()[0])*float(i.get_dimension()[1])*float(i.get_dimension()[2])
                for i in b1.items) / bin_vol * 100

    # EP designed instrumented
    p2 = InstrumentedEPPacker()
    b2 = EPGravityBin("bin", bw, bh, bd, bmw)
    p2.add_bin(b2)
    for name, w, h, d, wt in items_spec:
        p2.add_item(Item(name, w, h, d, wt))
    p2.pack(**PACK_KWARGS)
    fill2 = sum(float(i.get_dimension()[0])*float(i.get_dimension()[1])*float(i.get_dimension()[2])
                for i in b2.items) / bin_vol * 100

    # Tong ket N1, N2, N3
    total_n1 = sum(s[1] for s in p2.ep_list_sizes)
    total_n2 = sum(s[2] for s in p2.ep_list_sizes)
    total_n3 = sum(s[3] for s in p2.ep_list_sizes)

    print(f"    Corner-3n: fill={fill1:.1f}%, unpacked={len(b1.unfitted_items)}, "
          f"candidates_tried={p1.total_candidates_tried}")
    print(f"    EP-design:  fill={fill2:.1f}%, unpacked={len(b2.unfitted_items)}, "
          f"ep_tried={p2.total_ep_tried}")
    print(f"    N1 (corner-3n candidates, cumul): {total_n1}")
    print(f"    N2 (EP list size, cumul):         {total_n2}")
    print(f"    N3 (EP exclusive, cumul):         {total_n3}", end="")
    if total_n3 == 0:
        print(" <-- EP VÀ CORNER-3N SINH RA CÙNG TẬP ĐIỂM (hoặc EP ít hơn)")
    else:
        print()
    if p2.ep_exclusive_stats["count"] > 0:
        s = p2.ep_exclusive_stats
        print(f"    Ly do reject cua {s['count']} EP exclusive instances:")
        print(f"      - Bounds fail (tat ca 6 rot): {s['reject_bounds']}")
        print(f"      - Intersection fail:          {s['reject_intersection']}")
        print(f"      - Weight fail:                {s['reject_weight']}")
        print(f"      - Support fail:               {s['reject_support']}")
        print(f"      - Hop le nhung FF chon pivot khac truoc: {s['success']}")
    else:
        print(f"    Khong co EP exclusive nao duoc ghi nhan")

    delta = fill2 - fill1
    sign = "+" if delta >= 0 else ""
    if abs(delta) > 0.1 or len(b1.unfitted_items) != len(b2.unfitted_items):
        print(f"    => THAY DOI: {sign}{delta:.1f}%, unpacked {len(b1.unfitted_items)}->{len(b2.unfitted_items)}")
    else:
        print(f"    => Khong thay doi")
    print()
    return fill1, fill2, len(b1.unfitted_items), len(b2.unfitted_items), total_n3


print("Chay tren 6 test case tu v3:")
print()
cases = [
    ("Case A: 9 items bat doi xung",
     (800, 400, 600, 9999),
     [("XL1",400,200,600,20),("XL2",400,200,300,15),
      ("L1",200,200,600,10),("L2",200,200,300,8),
      ("M1",200,100,300,5),("M2",200,100,300,5),
      ("S1",100,200,150,3),("S2",100,200,150,3),("S3",100,100,150,2)]),

    ("Case B: xen ke tang lech chieu cao",
     (600, 500, 600, 9999),
     [("A",300,300,600,15),("B",300,500,300,20),
      ("C",300,200,300,8),("D",300,200,300,8),
      ("E",150,300,300,5),("F",150,300,300,5)]),

    ("Case E: items lech (unpacked=1 trong v3)",
     (600, 400, 500, 9999),
     [("T",400,300,500,15),("U",200,400,300,12),
      ("V",200,100,300,5),("W",200,100,200,4),
      ("X",200,300,200,8),("Y",200,200,200,6)]),

    ("Case F: khe EP co chu dich",
     (500, 400, 500, 9999),
     [("A",300,200,500,10),("B",200,300,300,12),
      ("C",200,200,200,8),("D",200,100,200,5)]),
]

n3_any_nonzero = False
for label, bin_d, items_s in cases:
    f1, f2, u1, u2, n3 = run_instrumented(bin_d, items_s, label)
    if n3 > 0:
        n3_any_nonzero = True

if not n3_any_nonzero:
    print("=> N3 = 0 tren moi case: EP designed SINH IT HON hoac BANG corner-3n.")
    print("   Nguyen nhan: _ep_inside_item() xoa EP cu khi them item moi,")
    print("   nen tap EP tinh luy NHAT THIET <= tap corner-3n sinh ra moi buoc.")
    print("   Luc nay EP list chi la 'subset' cua corner-3n — KHONG PHAI superset.")
    print()
    print("   Day la van de thiet ke can phan tich:")
    print("   EP list trong thiet ke da duyet KHONG sinh them diem moi,")
    print("   no chi TINH LUY va LOAI BO diem cu — ket qua la mot tap")
    print("   thuong nho hon hoac bang corner-3n tai moi buoc xep.")
else:
    print("=> Co N3 > 0: EP tao ra diem ung vien moi. Xem ly do reject o tren.")


# =============================================================================
# PHAN 3: Case Gravity Drop co chu dich
# Muon: item co y thap hon hop le, nhung corner-3n khong troi toi.
# =============================================================================
print()
print("=" * 70)
print("PHAN 3: Case Gravity Drop co chu dich")
print("=" * 70)
print()
print("Thiet ke:")
print("  Bin: 600 x 400 x 400")
print("  A (xep truoc): 400x300x400 — chiem 2/3 chieu rong, full cao gan, full depth")
print("  B (xep sau): 200x200x400 — phan con lai, nhung chi cao 200")
print("  C (can xep): 200x100x400 — le ra xep len tren B (y=200)")
print()
print("  Corner-point tu B (sau khi xep A va B):")
print("    WIDTH : (600, 0, 0) — out-of-bin")
print("    HEIGHT: (400, 200, 0) — pivot nay troi toi y=200 (mat tren B)")
print("    DEPTH : (400, 0, 400) — out-of-bin")
print()
print("  Pivot (400,200,0) TU B-HEIGHT: C(200x100x400) xep tai day?")
print("  Bounds: 400+200=600 ✓, 200+100=300 ✓, 0+400=400 ✓")
print("  Support: C.py=200, mat tren B = y=200, footprint B: x=[400,600], z=[0,400]")
print("    overlap_x: min(600,600)-max(400,400) = 200 ✓")
print("    overlap_z: min(400,400)-max(0,0) = 400 ✓")
print("    support = 200*400=80000, base=200*400=80000, ratio=1.0 ✓")
print()
print("  => Corner-3n (B-HEIGHT) troi toi y=200 cho C, support OK.")
print("  => Khong can Gravity Drop vi corner-3n da dat C tai y thap nhat hop le.")
print()
print("Thiet ke lai: Can item C bi 'treo' cao hon can thiet ma khong co corner-3n nao o y thap:")
print("  Bin: 600 x 400 x 600")
print("  A: 400x200x600 tai (0,0,0) — mat tren A: y=200")
print("  B: 200x200x300 tai (400,0,0) — mat tren B: y=200, chi nua truoc z=[0,300]")
print("  C: 200x200x300 — can xep tai (400,200,300) — khe phia sau B")
print("     mat tren A: y=200, X=[0,400] — C tai X=[400,600]: KHONG OVERLAP voi A")
print("     mat tren B: y=200, X=[400,600], Z=[0,300] — C tai Z=[300,600]: KHONG OVERLAP voi B")
print("  => Tat ca corner-3n cho C deu bi support fail o y=200")
print("  => Nhung neu thu y=0 (san) tai (400,0,300): C xep duoc (tren san)!")
print("  => Gravity Drop se tim ra y=0, corner-3n se thu y=200 (fail support) roi skip")
print()

# Xep tay de kiem tra
b_gd = EPGravityBin("bin", 600, 400, 600, 9999)
A_gd = Item("A", 400, 200, 600, 10)
B_gd = Item("B", 200, 200, 300, 8)
C_gd = Item("C", 200, 200, 300, 5)

b_gd.put_item(A_gd, [0, 0, 0])
b_gd.put_item(B_gd, [400, 0, 0])

print("State sau khi xep A va B:")
for i in b_gd.items:
    print(f"  {i.name}: pos={[float(x) for x in i.position]}, dim={[float(x) for x in i.get_dimension()]}")
print(f"  EP list: {[(float(e[0]),float(e[1]),float(e[2])) for e in b_gd._extreme_points]}")

# Corner-3n pivots cho C
cp3n = []
for ib in b_gd.items:
    w, h, d = ib.get_dimension()
    cp3n.append(("W:"+ib.name, [ib.position[0]+w, ib.position[1], ib.position[2]]))
    cp3n.append(("H:"+ib.name, [ib.position[0], ib.position[1]+h, ib.position[2]]))
    cp3n.append(("D:"+ib.name, [ib.position[0], ib.position[1], ib.position[2]+d]))

print("\nThu tung corner-3n pivot cho C(200x200x300):")
c_placed_cp = False
for name, pivot in cp3n:
    test_b = EPGravityBin("bin", 600, 400, 600, 9999)
    test_b.put_item(Item("A", 400, 200, 600, 10), [0, 0, 0])
    test_b.put_item(Item("B", 200, 200, 300, 8), [400, 0, 0])
    c_test = Item("C", 200, 200, 300, 5)
    result = test_b.put_item(c_test, pivot)
    print(f"  pivot={name} {[float(x) for x in pivot]}: {'OK at ' + str([float(x) for x in c_test.position]) if result else 'FAIL'}")
    if result:
        c_placed_cp = True

print(f"\nKet luan CP-3n: C {'xep duoc' if c_placed_cp else 'KHONG XEP DUOC'} qua corner-3n")

# Thu y=0 (Gravity Drop to san):
print("\nThu Gravity Drop: C tai (400, 0, 300) — san, phia sau B:")
test_b2 = EPGravityBin("bin", 600, 400, 600, 9999)
test_b2.put_item(Item("A", 400, 200, 600, 10), [0, 0, 0])
test_b2.put_item(Item("B", 200, 200, 300, 8), [400, 0, 0])
c_drop = Item("C", 200, 200, 300, 5)
r_drop = test_b2.put_item(c_drop, [400, 0, 300])
print(f"  put_item(C, [400,0,300]) = {r_drop}")
if r_drop:
    print(f"  C dat tai: {[float(x) for x in c_drop.position]}")

# Chay full pack voi CP-3n vs EP designed
print()
gd_spec = [("A",400,200,600,10),("B",200,200,300,8),("C",200,200,300,5)]
gd_dims = (600, 400, 600, 9999)
bw, bh, bd, bmw = gd_dims
bin_vol = bw * bh * bd

p_cp = GravityPacker()
b_cp = GravityBin("bin", bw, bh, bd, bmw)
p_cp.add_bin(b_cp)
for name, w, h, d, wt in gd_spec:
    p_cp.add_item(Item(name, w, h, d, wt))
p_cp.pack(**PACK_KWARGS)
fill_cp = sum(float(i.get_dimension()[0])*float(i.get_dimension()[1])*float(i.get_dimension()[2])
              for i in b_cp.items) / bin_vol * 100

p_ep = EPDesignedPacker()
b_ep = EPGravityBin("bin", bw, bh, bd, bmw)
p_ep.add_bin(b_ep)
for name, w, h, d, wt in gd_spec:
    p_ep.add_item(Item(name, w, h, d, wt))
p_ep.pack(**PACK_KWARGS)
fill_ep = sum(float(i.get_dimension()[0])*float(i.get_dimension()[1])*float(i.get_dimension()[2])
              for i in b_ep.items) / bin_vol * 100

print(f"Full pack voi bigger_first=True:")
print(f"  CP-3n: fill={fill_cp:.1f}%, unpacked={len(b_cp.unfitted_items)}")
for i in b_cp.items:
    print(f"    {i.name}@{[float(x) for x in i.position]}")
print(f"  EP-des: fill={fill_ep:.1f}%, unpacked={len(b_ep.unfitted_items)}")
for i in b_ep.items:
    print(f"    {i.name}@{[float(x) for x in i.position]}")

print()
print(f"  [GD-CASE] CP-3n: {fill_cp:.1f}%, EP-design: {fill_ep:.1f}%")
if abs(fill_ep - fill_cp) > 0.1 or len(b_cp.unfitted_items) != len(b_ep.unfitted_items):
    print("  => CO KHAC BIET — EP design tot hon/kem hon CP-3n")
else:
    print("  => Ket qua giong nhau — gravity drop case chua phat hien khac biet")


# =============================================================================
# TONG KET
# =============================================================================
print()
print("=" * 70)
print(f"TONG KET — {datetime.datetime.now().isoformat()}")
print("=" * 70)
print()
print("1. EPPacker v3 KHAC thiet ke da duyet (Section 4.2-4.3).")
print("   Ket qua Section 2.1 v3 khong ap dung cho thiet ke da duyet.")
print()
print("2. EPDesignedPacker (dung thiet ke) da duoc trien khai va chay tren 4 case.")
print("   Xem N1/N2/N3 va ly do reject o tren.")
print()
print("3. Gravity Drop case: xem ket qua [GD-CASE] o tren.")
print()
print("So lieu tren la so do thuc. Script: tests/experiment_v4.py")
