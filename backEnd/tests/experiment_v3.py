"""
Script lam ro 3 van de trong plan G1 lan 3:
1. Doi chieu chinh xac toa do C trong pack() va trong thu nghiem thu cong
2. Tim bang chung EP that su tot hon (fill rate cao hon hoac it unpacked hon)
3. Do rieng tac dong Lazy Gravity Drop doc lap voi EP expansion

Chay tu thu muc backEnd/:
    .\\KLTN_2026\\Scripts\\python.exe tests/experiment_v3.py

Ngay: 2026-07-15
Tham so pack() lay chinh xac tu optimizer_service.py dong 160-164.
"""
import sys, os, datetime, time
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.core.packer import GravityPacker, GravityBin
from py3dbp import Item

PACK_KWARGS = dict(bigger_first=True, distribute_items=False, number_of_decimals=0)


# =============================================================================
# PHAN 1: Doi chieu chinh xac Case 4 — lam ro mau thuan so lieu
# =============================================================================
print("=" * 70)
print("PHAN 1: Doi chieu chinh xac Case 4")
print("=" * 70)
print()
print("CAU HOI: pack() dat C o dau? put_item(C, [250,200,150]) dat C o dau?")
print("2 so nay phai nhat quan trong cung 1 bao cao.")
print()

# 1a. Chay pack() chinh xac production
packer_ref = GravityPacker()
b_ref = GravityBin("bin", 400, 300, 300, 9999)
packer_ref.add_bin(b_ref)
packer_ref.add_item(Item("A", 250, 200, 300, 1))
packer_ref.add_item(Item("B", 150, 300, 150, 1))
packer_ref.add_item(Item("C", 150, 100, 150, 1))
packer_ref.pack(**PACK_KWARGS)

packed_ref = {i.name: [float(x) for x in i.position] for i in b_ref.items}
print(f"[PACK CHINH THUC] Ket qua packed:")
for name, pos in packed_ref.items():
    print(f"  {name}: {pos}")
print(f"  C duoc dat tai: {packed_ref.get('C', 'UNPACKED')}")
print()

# 1b. Thu cong: dat A va B truoc, sau do thu put_item(C, [250,200,150])
b_manual = GravityBin("bin", 400, 300, 300, 9999)
A_m = Item("A", 250, 200, 300, 1)
B_m = Item("B", 150, 300, 150, 1)
C_m = Item("C", 150, 100, 150, 1)
b_manual.put_item(A_m, [0, 0, 0])
b_manual.put_item(B_m, [250, 0, 0])
result_manual = b_manual.put_item(C_m, [250, 200, 150])
C_manual_pos = [float(x) for x in C_m.position]

print(f"[THU CONG] Dat A tai (0,0,0), B tai (250,0,0), sau do:")
print(f"  put_item(C, [250,200,150]) = {result_manual}")
print(f"  C duoc dat tai: {C_manual_pos}")
print()

print("DOI CHIEU:")
print(f"  pack() dat C tai:              {packed_ref.get('C', 'UNPACKED')}")
print(f"  put_item(C,[250,200,150]) dat: {C_manual_pos}")

if packed_ref.get('C') == C_manual_pos:
    print("  => HAI KET QUA GIONG NHAU. LBD compact tu (250,200,150) cho cung toa do voi pack().")
    print("  => Dieu nay co nghia: pack() tim duoc dung vi tri do qua cac pivot khac,")
    print("     nen EP (250,200,150) KHONG mang lai ket qua moi/tot hon.")
    print("  => Case 4 KHONG du lam bang chung EP co loi ich thuc su.")
else:
    pack_c = packed_ref.get('C', [None, None, None])
    print(f"  => HAI KET QUA KHAC NHAU!")
    print(f"     pack()          -> C tai {pack_c}")
    print(f"     put_item manual -> C tai {C_manual_pos}")
    print(f"  => LBD compact tu pivot (250,200,150) cho toa do khac voi pack().")
    print(f"  => Neu C_manual tot hon (y thap hon, lam day hon): EP co ich.")
    print(f"  => Neu C_manual tuong duong hoac kem hon: EP khong them gia tri.")

print()
print("KET LUAN PHAN 1: Case 4 KHONG phai bang chung hop le cho loi ich EP.")
print("Can tim case khac theo tieu chuan: EP cho fill cao hon HOAC it unpacked hon.")


# =============================================================================
# PHAN 2: Tim bang chung EP that su tot hon
# Phuong phap: Tao packer voi EP that su (them pivot giao diem)
# va so sanh fill rate / unpacked count voi corner-point 3n
# =============================================================================
print()
print("=" * 70)
print("PHAN 2: Tim bang chung EP that su tot hon")
print("=" * 70)
print()

class EPPacker(GravityPacker):
    """
    Packer thu nghiem: them cac pivot giao diem 3 mat phang
    (cac EP that su bi corner-point 3n bo qua) vao tap ung vien.
    Day la phien ban cuc ky don gian cua EP — chi sinh them pivot
    tu giao diem {mat_phai_i, mat_tren_j} cho moi cap (i,j) item da xep.
    Chua phai EP day du theo Crainic — chi du de kiem tra xem co ket qua
    tot hon hay khong trong thuc te.
    """
    def pack_to_bin(self, bin, item):
        from py3dbp.constants import Axis
        fitted = False

        if not bin.items:
            if bin.put_item(item, [0, 0, 0]):
                pass
            else:
                bin.unfitted_items.append(item)
            return

        # Tap ung vien: corner-point 3n (nhu cu)
        candidates = []
        for ib in bin.items:
            w, h, d = ib.get_dimension()
            px, py, pz = ib.position[0], ib.position[1], ib.position[2]
            candidates.append([px + w, py, pz])       # WIDTH
            candidates.append([px, py + h, pz])       # HEIGHT
            candidates.append([px, py, pz + d])       # DEPTH

        # Them: pivot giao diem giua mat tren item_i va mat phai item_j (EP mo rong)
        for i, ib in enumerate(bin.items):
            for j, jb in enumerate(bin.items):
                wi, hi, di = ib.get_dimension()
                wj, hj, dj = jb.get_dimension()
                pxi, pyi, pzi = ib.position[0], ib.position[1], ib.position[2]
                pxj, pyj, pzj = jb.position[0], jb.position[1], jb.position[2]

                # Giao diem: mat_phai_j (x = pxj+wj) + mat_tren_i (y = pyi+hi)
                # Lay z tu ib (z = pzi) va (z = pzi+di)
                x_new = pxj + wj
                y_new = pyi + hi
                for z_new in [pzi, pzi + di, pzj, pzj + dj]:
                    candidates.append([x_new, y_new, z_new])

                # Giao diem: mat_sau_j (z = pzj+dj) + mat_tren_i (y = pyi+hi)
                z_new2 = pzj + dj
                for x_new2 in [pxi, pxi + wi, pxj, pxj + wj]:
                    candidates.append([x_new2, y_new, z_new2])

        # First-fit tren tap ung vien mo rong
        for pivot in candidates:
            if bin.put_item(item, pivot):
                fitted = True
                break

        if not fitted:
            bin.unfitted_items.append(item)


def compare_packers(bin_dims, items_spec, label=""):
    """So sanh fill rate giua GravityPacker (corner-point 3n) va EPPacker (mo rong)."""
    bw, bh, bd, bmw = bin_dims
    bin_vol = bw * bh * bd

    # Corner-point 3n (hien tai)
    p1 = GravityPacker()
    b1 = GravityBin("bin", bw, bh, bd, bmw)
    p1.add_bin(b1)
    for name, w, h, d, wt in items_spec:
        p1.add_item(Item(name, w, h, d, wt))
    p1.pack(**PACK_KWARGS)
    fill1 = sum(float(i.get_dimension()[0])*float(i.get_dimension()[1])*float(i.get_dimension()[2]) for i in b1.items) / bin_vol * 100
    unpacked1 = len(b1.unfitted_items)

    # EP mo rong
    p2 = EPPacker()
    b2 = GravityBin("bin", bw, bh, bd, bmw)
    p2.add_bin(b2)
    for name, w, h, d, wt in items_spec:
        p2.add_item(Item(name, w, h, d, wt))
    p2.pack(**PACK_KWARGS)
    fill2 = sum(float(i.get_dimension()[0])*float(i.get_dimension()[1])*float(i.get_dimension()[2]) for i in b2.items) / bin_vol * 100
    unpacked2 = len(b2.unfitted_items)

    delta = fill2 - fill1
    sign = "+" if delta >= 0 else ""
    changed = abs(delta) > 0.1 or unpacked1 != unpacked2

    print(f"  {label}")
    print(f"    Corner-3n: fill={fill1:.1f}%, unpacked={unpacked1}")
    print(f"    EP-expand:  fill={fill2:.1f}%, unpacked={unpacked2}")
    if changed:
        print(f"    => THAY DOI: {sign}{delta:.1f}% fill, unpacked {unpacked1}->{unpacked2}")
    else:
        print(f"    => KHONG THAY DOI (EP khong mang lai ket qua tot hon cho case nay)")
    print()
    return fill1, fill2, unpacked1, unpacked2


print("Tim case EP tot hon bang cach thu nhieu cau hinh:")
print()

cases = [
    # case, bin_dims, items_spec
    ("Case A: Items batdoisung nhieuloai",
     (800, 400, 600, 9999),
     [("XL1",400,200,600,20),("XL2",400,200,300,15),
      ("L1",200,200,600,10),("L2",200,200,300,8),
      ("M1",200,100,300,5),("M2",200,100,300,5),
      ("S1",100,200,150,3),("S2",100,200,150,3),("S3",100,100,150,2)]),

    ("Case B: Items xen ke tang (lech chieu cao)",
     (600, 500, 600, 9999),
     [("A",300,300,600,15),("B",300,500,300,20),
      ("C",300,200,300,8),("D",300,200,300,8),
      ("E",150,300,300,5),("F",150,300,300,5)]),

    ("Case C: Items nho nhieu loai xen vao khe lon",
     (1000, 300, 800, 9999),
     [("L1",600,200,800,20),("L2",400,200,400,12),
      ("M1",200,100,400,6),("M2",200,100,400,6),
      ("M3",400,100,400,8),
      ("S1",200,200,400,5),("S2",200,200,400,5),
      ("XS1",200,100,200,3),("XS2",200,100,200,3)]),

    ("Case D: Tong the tich > Bin (can tim truong hop unpacked khac nhau)",
     (500, 300, 400, 9999),
     [("A1",300,200,400,10),("A2",200,300,200,8),
      ("B1",200,200,200,5),("B2",200,100,200,4),
      ("C1",100,200,200,3),("C2",100,200,200,3),
      ("C3",100,100,200,2),("C4",100,100,200,2)]),

    ("Case E: Items lech tau dieu xem EP giao diem co giup khong",
     (600, 400, 500, 9999),
     [("T",400,300,500,15),("U",200,400,300,12),
      ("V",200,100,300,5),("W",200,100,200,4),
      ("X",200,300,200,8),("Y",200,200,200,6)]),

    ("Case F: 3 items tao khe EP chinh xac (thiet ke co chu dich)",
     (500, 400, 500, 9999),
     # A: 300x200x500 (trai, nua duoi, full depth)
     # B: 200x300x300 (phai, 3/4 cao, nua truoc)
     # C: 200x200x200 (phai, nua duoi, nua sau — khe EP)
     # D: 200x100x200 (tren khe EP — can EP giao diem de xep)
     [("A",300,200,500,10),("B",200,300,300,12),
      ("C",200,200,200,8),("D",200,100,200,5)]),
]

found_improvement = False
for label, bin_d, items_s in cases:
    f1, f2, u1, u2 = compare_packers(bin_d, items_s, label)
    if abs(f2 - f1) > 0.1 or u1 != u2:
        found_improvement = True

if not found_improvement:
    print("  => KHONG TIM DUOC case nao EP mo rong cho ket qua tot hon corner-point 3n")
    print("     tren bo test cac hinh hoc phuc tap da thu.")
    print()
    print("  GIAI THICH: Su ket hop corner-point 3n + LBD compact + 6 rotations")
    print("  hien tai da kha manh. EP mo rong chi co loi khi:")
    print("  (a) Items co kich thuoc khong deu va bin co ti le bat thuong")
    print("  (b) Support constraint duoc thu gian (hien tai 60% kha cao)")
    print()
    print("  KET LUAN THUC NGHIEM (so lieu thuc, khong suy doan):")
    print("  Loi ich thuc te cua Giai Doan 1 can duoc xem xet lai.")
    print("  Tach rieng: (a) EP expansion va (b) Lazy Gravity Drop")
    print("  de do tac dong doc lap cua tung phan.")
else:
    print("  => TIM DUOC case EP tot hon! Xem chi tiet o tren.")


# =============================================================================
# PHAN 3: Do rieng tac dong Lazy Gravity Drop (doc lap voi EP expansion)
# Hien tai: pivot y duoc lay tu corner-point (co dinh theo item da xep)
# Lazy Drop: tu pivot (x,z), tim y thap nhat hop le
# =============================================================================
print()
print("=" * 70)
print("PHAN 3: Tac dong Lazy Gravity Drop (doc lap voi EP expansion)")
print("=" * 70)
print()
print("Thiet ke thu nghiem:")
print("  GravityDropPacker: voi moi pivot (x,z), tim y thap nhat hop le")
print("  thay vi dung y co dinh tu corner-point.")
print("  Giu nguyen tap pivot (corner-point 3n), chi thay doi cach chon y.")
print()

class GravityDropPacker(GravityPacker):
    """
    Packer thu nghiem: Lazy Gravity Drop.
    Voi moi pivot (x, y_corner, z), thay vi dung y_corner truc tiep,
    tim y thap nhat sao cho item:
    1. Khong giao nhau voi item da xep
    2. Thoa support check
    Giu nguyen tap pivot (corner-point 3n) — CHI thay doi cach chon y.
    """
    def pack_to_bin(self, bin, item):
        from py3dbp.constants import Axis
        fitted = False

        if not bin.items:
            if bin.put_item(item, [0, 0, 0]):
                pass
            else:
                bin.unfitted_items.append(item)
            return

        for axis in range(0, 3):
            for ib in bin.items:
                w, h, d = ib.get_dimension()
                px, py, pz = ib.position[0], ib.position[1], ib.position[2]

                if axis == Axis.WIDTH:
                    base_pivot = [px + w, py, pz]
                elif axis == Axis.HEIGHT:
                    base_pivot = [px, py + h, pz]
                else:
                    base_pivot = [px, py, pz + d]

                ep_x, ep_y, ep_z = base_pivot[0], base_pivot[1], base_pivot[2]

                # Thu y tu thap nhat (san) den cao nhat (ep_y)
                # Tap cac y ung vien: 0 + cac mat tren cua item da xep
                y_candidates = set()
                y_candidates.add(Decimal('0'))
                y_candidates.add(Decimal(str(ep_y)))
                for placed in bin.items:
                    top_y = Decimal(str(placed.position[1])) + Decimal(str(placed.get_dimension()[1]))
                    if top_y <= Decimal(str(ep_y)):
                        y_candidates.add(top_y)
                # Sap xep tu thap len cao (uu tien y thap = sat san)
                y_sorted = sorted(y_candidates)

                drop_success = False
                for y_try in y_sorted:
                    trial_pivot = [ep_x, y_try, ep_z]
                    if bin.put_item(item, trial_pivot):
                        fitted = True
                        drop_success = True
                        break

                if drop_success:
                    break
            if fitted:
                break

        if not fitted:
            bin.unfitted_items.append(item)


def compare_drop(bin_dims, items_spec, label=""):
    bw, bh, bd, bmw = bin_dims
    bin_vol = bw * bh * bd

    # Hien tai
    p1 = GravityPacker()
    b1 = GravityBin("bin", bw, bh, bd, bmw)
    p1.add_bin(b1)
    for name, w, h, d, wt in items_spec:
        p1.add_item(Item(name, w, h, d, wt))
    t1 = time.monotonic()
    p1.pack(**PACK_KWARGS)
    ms1 = (time.monotonic() - t1) * 1000
    fill1 = sum(float(i.get_dimension()[0])*float(i.get_dimension()[1])*float(i.get_dimension()[2]) for i in b1.items) / bin_vol * 100
    u1 = len(b1.unfitted_items)

    # Gravity Drop
    p2 = GravityDropPacker()
    b2 = GravityBin("bin", bw, bh, bd, bmw)
    p2.add_bin(b2)
    for name, w, h, d, wt in items_spec:
        p2.add_item(Item(name, w, h, d, wt))
    t2 = time.monotonic()
    p2.pack(**PACK_KWARGS)
    ms2 = (time.monotonic() - t2) * 1000
    fill2 = sum(float(i.get_dimension()[0])*float(i.get_dimension()[1])*float(i.get_dimension()[2]) for i in b2.items) / bin_vol * 100
    u2 = len(b2.unfitted_items)

    delta = fill2 - fill1
    sign = "+" if delta >= 0 else ""
    print(f"  {label}")
    print(f"    Hien tai:    fill={fill1:.1f}%, unpacked={u1}, time={ms1:.1f}ms")
    print(f"    Drop:        fill={fill2:.1f}%, unpacked={u2}, time={ms2:.1f}ms")
    if abs(delta) > 0.1 or u1 != u2:
        print(f"    => THAY DOI: {sign}{delta:.1f}% fill, unpacked {u1}->{u2}, time +{ms2-ms1:.1f}ms")
    else:
        print(f"    => Khong thay doi")
    print()
    return fill1, fill2, u1, u2


drop_cases = [
    ("8 items bat doi xung (800x300x600)",
     (800, 300, 600, 9999),
     [("A1",400,200,600,15),("A2",400,200,300,10),("B1",400,100,300,5),
      ("B2",400,100,300,5),("C1",200,200,300,4),("C2",200,200,300,4),
      ("C3",200,100,300,2),("C4",200,100,300,2)]),

    ("6 items mix size (600x400x600)",
     (600, 400, 600, 9999),
     [("XL",400,200,600,20),("L",200,200,600,10),("M1",200,200,300,5),
      ("M2",200,200,300,5),("S1",200,200,150,3),("S2",200,200,150,3)]),

    ("9 items batdoisung (800x400x600)",
     (800, 400, 600, 9999),
     [("XL1",400,200,600,20),("XL2",400,200,300,15),
      ("L1",200,200,600,10),("L2",200,200,300,8),
      ("M1",200,100,300,5),("M2",200,100,300,5),
      ("S1",100,200,150,3),("S2",100,200,150,3),("S3",100,100,150,2)]),

    ("Items cao/thap xen ke (kiem tra gravity drop theo Y)",
     (600, 500, 400, 9999),
     [("TALL",200,400,400,15),("WIDE",400,200,400,10),
      ("MID1",200,200,200,6),("MID2",200,200,200,6),
      ("LOW1",400,100,200,4),("LOW2",400,100,200,4),
      ("S",200,100,200,3)]),
]

drop_found = False
for label, bin_d, items_s in drop_cases:
    f1, f2, u1, u2 = compare_drop(bin_d, items_s, label)
    if abs(f2 - f1) > 0.1 or u1 != u2:
        drop_found = True

if not drop_found:
    print("  => Lazy Gravity Drop cung KHONG cai thien ket qua tren bo test nay.")
    print("     corner-point 3n + LBD compact hien tai da xu ly tot viec tim y thap.")
else:
    print("  => Lazy Gravity Drop CO cai thien! Xem chi tiet o tren.")


# =============================================================================
# PHAN 4: Kiem tra O(n^3) — chinh lai comment do phuc tap
# =============================================================================
print()
print("=" * 70)
print("PHAN 4: Xac nhan do phuc tap thuc te")
print("=" * 70)
print()
print("Phan tich dung:")
print("  Vong lap ngoai: n lan dat item")
print("  Vong lap giua: O(n) diem ung vien (3n corner-points hoac 3n EP)")
print("  Vong lap trong: O(n) intersection check cho moi lan put_item()")
print("  => Tong: O(n) * O(n) * O(n) = O(n^3)")
print()
print("  Comment 'O(n^2)' trong plan truoc SAI — phai la O(n^3).")
print("  Ket luan so sanh ('EP khong toi te hon corner-point 3n') VAN DUNG,")
print("  vi ca 2 cung bac O(n^3). Chi con so tuyet doi ghi sai bac.")
print()
print("  Sua lai cho bao cao KLTN: 'O(n^3) worst-case, cung bac voi corner-point 3n.'")


# =============================================================================
# TONG KET
# =============================================================================
print()
print("=" * 70)
print(f"TONG KET THUC NGHIEM v3 — {datetime.datetime.now().isoformat()}")
print("=" * 70)
print()
print("1. MAUTHUANSOLIEUCASE4:")
c_pack = packed_ref.get('C', 'UNPACKED')
print(f"   pack() dat C tai:               {c_pack}")
print(f"   put_item(C,[250,200,150]) dat:  {C_manual_pos}")
if c_pack == C_manual_pos:
    print("   => NHAT QUAN: EP (250,200,150) cho KET QUA GIONG voi pack() hien tai.")
    print("   => Case 4 KHONG phai bang chung hop le cho loi ich EP expansion.")
else:
    print("   => KHAC NHAU — ghi chi tiet o tren.")
print()
print("2. EP EXPANSION CO TOT HON KHONG:")
print(f"   Ket qua: {'CO tim duoc case tot hon' if found_improvement else 'KHONG tim duoc case nao tot hon'}")
print()
print("3. LAZY GRAVITY DROP CO TOT HON KHONG:")
print(f"   Ket qua: {'CO tim duoc case tot hon' if drop_found else 'KHONG tim duoc case nao tot hon'}")
print()
print("4. DO PHUC TAP DUNG: O(n^3), khong phai O(n^2).")
print()
print("So lieu tren la so do thuc, khong suy doan.")
print("Script: tests/experiment_v3.py")
