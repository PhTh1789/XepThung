"""
app/core/packer/gravity_packer.py

Custom Packer co Gravity Constraint (trọng lực và bệ đỡ).

Ke thua truc tiep tu py3dbp.Bin va py3dbp.Packer de giu nguyen
cau truc co ban, bo sung them Hard Constraint (Gravity/Support)
va LBD Compaction (Left-Back-Down).

Kien truc that su cua thuat toan nay:
Corner-point 3n + LBD Compact + 6 Rotations.
- Khong phai "Extreme Point Heuristic" day du (khong sinh diem giao dien).
- LBD (truot don nen) ket hop voi 6 kieu xoay giup lap day cac khe ho hinh L,
  mang lai hieu qua xep hang tuong duong EP tren thuc te co Support Constraint.

Time Complexity:
  - Toan bo qua trinh pack: O(n^3) worst-case (n lan dat item * O(n) pivot * O(n) intersection check)
  - _check_physical_support(): O(N) worst-case nhung ap dung
    Bounding Box Filter (early-exit) nen amortized chi 2-5 items
    moi lan check trong thuc te.
"""
import logging
from typing import List

from py3dbp import Packer, Bin, Item
from py3dbp.constants import Axis
from py3dbp.auxiliary_methods import set_to_decimal

logger = logging.getLogger(__name__)

# Hang so cau hinh: Ty le be do toi thieu.
# Item phai duoc do it nhat 60% dien tich day de khong bi lat.
# 60% la nguong pho bien trong van tai thuc te (ISO container loading).
MIN_SUPPORT_RATIO = 0.6

# Tolerance khi so sanh chieu cao (don vi: mm).
# Cho phep sai so nho do lam tron so nguyen.
_HEIGHT_TOLERANCE = 1

START_POSITION = [0, 0, 0]


class GravityBin(Bin):
    """
    Bin co kiem tra trong luc (Gravity Constraint).

    Override put_item() de them buoc kiem tra be do truoc khi
    chap nhan vi tri dat item. Neu item khong duoc do du,
    tu choi va thu vi tri / rotation khac.
    """

    def put_item(self, item: Item, pivot: list) -> bool:
        """
        Dat item vao vi tri pivot. Kiem tra:
        1. Item nam trong gioi han thung xe (bounds check) — ke thua tu py3dbp.
        2. Khong giao nhau voi item da xep (intersection check) — ke thua tu py3dbp.
        3. Khong vuot qua tai trong toi da (weight check) — ke thua tu py3dbp.
        4. [MOI] Phai duoc do du dien tich day (support check).

        Returns:
            True neu item duoc dat thanh cong, False neu khong.
        """
        fit = False
        valid_item_position = item.position
        item.position = pivot

        for i in range(0, 6):  # 6 kieu xoay
            item.rotation_type = i
            dimension = item.get_dimension()

            # Bounds check: item phai nam trong thung xe
            if (
                self.width < pivot[0] + dimension[0] or
                self.height < pivot[1] + dimension[1] or
                self.depth < pivot[2] + dimension[2]
            ):
                continue

            fit = True

            # Intersection check: khong duoc giao nhau voi item da xep
            for current_item_in_bin in self.items:
                if self._intersect(current_item_in_bin, item):
                    fit = False
                    break

            if fit:
                # Weight check
                if self.get_total_weight() + item.weight > self.max_weight:
                    fit = False
                    return fit

                # [MOI] LBD Compaction (Truot don nen)
                compacted_pivot = self._compact_placement(item, pivot)

                # [MOI] Gravity / Support check
                # Kiem tra xem toa do sau khi don nen co con be do hop le khong
                if not self._check_physical_support(item, compacted_pivot):
                    # Fallback (hoan tac) ve toa do goc neu viec don nen lam mat be do
                    if not self._check_physical_support(item, pivot):
                        fit = False
                        item.position = valid_item_position
                        continue  # Thu rotation khac
                    else:
                        final_pivot = pivot
                else:
                    final_pivot = compacted_pivot

                item.position = final_pivot
                self.items.append(item)

            if not fit:
                item.position = valid_item_position

            return fit

        if not fit:
            item.position = valid_item_position

        return fit

    def _check_physical_support(self, item: Item, pivot: list) -> bool:
        """
        Kiem tra item co duoc do du dien tich day hay khong.

        Nguyen tac:
        - Neu item nam tren san (py == 0): luon hop le.
        - Neu item o tren cao (py > 0): tinh tong dien tich giao nhau
          giua day item moi va mat tren cac items da xep.
          Chi chap nhan neu support_ratio >= MIN_SUPPORT_RATIO.

        Args:
            item: Item can kiem tra (da co rotation_type).
            pivot: Vi tri [px, py, pz].

        Returns:
            True neu duoc do du, False neu lo lung.
        """
        px, py, pz = pivot[0], pivot[1], pivot[2]

        # San thung xe: luon duoc do 100%
        if py == 0:
            return True

        dim = item.get_dimension()
        w, h, d = dim[0], dim[1], dim[2]

        item_base_area = w * d
        if item_base_area == 0:
            return False

        total_support_area = 0

        for placed in self.items:
            pdim = placed.get_dimension()
            pw, ph, pd = pdim[0], pdim[1], pdim[2]
            placed_top_y = placed.position[1] + ph

            # Bounding Box Filter (Early Exit):
            # Chi xet nhung item co mat tren cham dung day cua item moi.
            # Tolerance nho (1mm) de xu ly sai so lam tron so nguyen.
            if abs(placed_top_y - py) > _HEIGHT_TOLERANCE:
                continue

            # Tinh dien tich giao nhau tren mat phang XZ (nhin tu tren xuong)
            overlap_x = max(
                0,
                min(px + w, placed.position[0] + pw) - max(px, placed.position[0])
            )
            overlap_z = max(
                0,
                min(pz + d, placed.position[2] + pd) - max(pz, placed.position[2])
            )
            total_support_area += overlap_x * overlap_z

            # Toi uu: neu da du support thi thoat som, khong can quet het
            if total_support_area / item_base_area >= MIN_SUPPORT_RATIO:
                return True

        return (total_support_area / item_base_area) >= MIN_SUPPORT_RATIO

    def _compact_placement(self, item: Item, pivot: list) -> list:
        """
        Left-Back-Down (LBD) Shifting: Truot don nen kien hang ve sat nhat
        voi goc toa do (0,0,0) de loai bo khe ho, toi uu hoa khong gian.
        """
        px, py, pz = pivot[0], pivot[1], pivot[2]

        # Buoc 1: Truot theo truc Z (Back)
        z_new = self._shift_z(item, px, py, pz)

        # Buoc 2: Truot theo truc X (Left) dua tren z_new vua tim duoc
        x_new = self._shift_x(item, px, py, z_new)

        return [x_new, py, z_new]

    def _shift_z(self, item: Item, px, py, pz):
        dim = item.get_dimension()
        w, h, d = dim[0], dim[1], dim[2]
        max_z = 0

        for p in self.items:
            p_dim = p.get_dimension()
            pw, ph, pd = p_dim[0], p_dim[1], p_dim[2]

            # Kiem tra overlap tren mat phang XY
            overlap_xy = (
                p.position[0] < px + w and p.position[0] + pw > px and
                p.position[1] < py + h and p.position[1] + ph > py
            )

            if overlap_xy:
                # Phai nam o phia sau hoac vua cham
                if p.position[2] + pd <= pz:
                    max_z = max(max_z, p.position[2] + pd)

        return max_z

    def _shift_x(self, item: Item, px, py, pz_new):
        dim = item.get_dimension()
        w, h, d = dim[0], dim[1], dim[2]
        max_x = 0

        for p in self.items:
            p_dim = p.get_dimension()
            pw, ph, pd = p_dim[0], p_dim[1], p_dim[2]

            # Kiem tra overlap tren mat phang YZ (su dung pz_new)
            overlap_yz = (
                p.position[1] < py + h and p.position[1] + ph > py and
                p.position[2] < pz_new + d and p.position[2] + pd > pz_new
            )

            if overlap_yz:
                # Phai nam o ben trai hoac vua cham
                if p.position[0] + pw <= px:
                    max_x = max(max_x, p.position[0] + pw)

        return max_x

    @staticmethod
    def _intersect(item1: Item, item2: Item) -> bool:
        """
        Kiem tra 2 item co giao nhau trong khong gian 3D hay khong.
        Sao chep tu py3dbp.auxiliary_methods.intersect de tranh
        dependency issue khi import.
        """
        d1 = item1.get_dimension()
        d2 = item2.get_dimension()

        # Kiem tra overlap tren ca 3 truc
        return (
            item1.position[0] < item2.position[0] + d2[0] and
            item1.position[0] + d1[0] > item2.position[0] and
            item1.position[1] < item2.position[1] + d2[1] and
            item1.position[1] + d1[1] > item2.position[1] and
            item1.position[2] < item2.position[2] + d2[2] and
            item1.position[2] + d1[2] > item2.position[2]
        )

    def compute_weight_balance(self) -> float:
        """
        Tinh toan do lech trong tam (Center of Gravity - CoG) cua thung xe
        tren mat phang XZ (mat san).
        
        Cong thuc:
        X_cg = sum(weight_i * X_center_i) / total_weight
        Z_cg = sum(weight_i * Z_center_i) / total_weight

        Tra ve khoang cach Euclide tu CoG den tam hinh hoc cua thung xe,
        duoc chuan hoa theo kich thuoc thung xe (0.0 -> 1.0, cang gan 0 cang tot).
        """
        if not self.items:
            return 0.0

        total_weight = 0.0
        sum_wx = 0.0
        sum_wz = 0.0

        for item in self.items:
            w = float(item.weight)
            dim = item.get_dimension()
            # Tam hinh hoc cua item (tren truc X va Z)
            x_center = float(item.position[0]) + float(dim[0]) / 2.0
            z_center = float(item.position[2]) + float(dim[2]) / 2.0

            sum_wx += w * x_center
            sum_wz += w * z_center
            total_weight += w

        if total_weight == 0:
            return 0.0

        x_cg = sum_wx / total_weight
        z_cg = sum_wz / total_weight

        bin_x_center = float(self.width) / 2.0
        bin_z_center = float(self.depth) / 2.0

        # Khoang cach lech tuyet doi
        delta_x = abs(x_cg - bin_x_center)
        delta_z = abs(z_cg - bin_z_center)

        # Chuan hoa ve khoang [0, 1] bang cach chia cho nua chieu dai tuong ung
        norm_delta_x = delta_x / bin_x_center if bin_x_center > 0 else 0
        norm_delta_z = delta_z / bin_z_center if bin_z_center > 0 else 0

        # Dung khoang cach Euclide chuan hoa tren mat phang 2D
        return (norm_delta_x**2 + norm_delta_z**2)**0.5


class GravityPacker(Packer):
    """
    Packer su dung GravityBin thay vi Bin goc.

    Kien truc: Corner-point 3n + LBD Compact + 6 Rotations.
    """

    def add_gravity_bin(self, name, width, height, depth, max_weight) -> GravityBin:
        """
        Tao va them mot GravityBin vao packer.
        Thay the cho workflow: tao Bin() roi goi packer.add_bin().
        """
        gravity_bin = GravityBin(name, width, height, depth, max_weight)
        self.bins.append(gravity_bin)
        return gravity_bin

    def pack_to_bin(self, bin: GravityBin, item: Item):
        """
        Tim vi tri dat item trong bin theo thuat toan Corner-point 3n.
        - Item dau tien: dat tai goc (0,0,0).
        - Cac item sau: thu 3 pivot (WIDTH, HEIGHT, DEPTH) cua moi item da xep.

        Do phuc tap: O(n^3) cho toan bo qua trinh pack.
        """
        fitted = False

        if not bin.items:
            response = bin.put_item(item, START_POSITION)
            if not response:
                bin.unfitted_items.append(item)
            return

        for axis in range(0, 3):
            items_in_bin = bin.items

            for ib in items_in_bin:
                pivot = [0, 0, 0]
                w, h, d = ib.get_dimension()

                if axis == Axis.WIDTH:
                    pivot = [
                        ib.position[0] + w,
                        ib.position[1],
                        ib.position[2]
                    ]
                elif axis == Axis.HEIGHT:
                    pivot = [
                        ib.position[0],
                        ib.position[1] + h,
                        ib.position[2]
                    ]
                elif axis == Axis.DEPTH:
                    pivot = [
                        ib.position[0],
                        ib.position[1],
                        ib.position[2] + d
                    ]

                if bin.put_item(item, pivot):
                    fitted = True
                    break

            if fitted:
                break

        if not fitted:
            bin.unfitted_items.append(item)
