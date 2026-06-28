/**
 * src/utils/cargoValidation.ts
 *
 * Centralized logic kiểm tra giới hạn của kiện hàng (Overweight / Oversize).
 * Tái sử dụng chung cho Store (validateCargoRules), AddItemModal và ItemsTable
 * nhằm đảm bảo DRY Principle.
 */
import type { Truck } from "@/schemas";

/**
 * Kiểm tra xem kiện hàng có vi phạm tải trọng tối đa của xe không.
 * @param itemWeight Cân nặng của 1 kiện hàng (gram)
 * @param truck Xe tải cần kiểm tra
 * @returns true nếu kiện hàng nặng hơn tải trọng xe
 */
export function isItemOverweight(itemWeight: number, truck: Truck | null): boolean {
  if (!truck) return false;
  return itemWeight > truck.max_weight;
}

/**
 * Kiểm tra xem kiện hàng có lớn hơn thùng xe về mặt vật lý (không thể bỏ vào theo bất kỳ chiều xoay nào).
 * Thuật toán: Sắp xếp 3 chiều của xe và kiện hàng theo thứ tự tăng dần.
 * Nếu bất kỳ chiều nào của kiện hàng lớn hơn chiều tương ứng của xe, thì chắc chắn không vừa.
 * @param itemL Chiều dài kiện hàng (mm)
 * @param itemW Chiều rộng kiện hàng (mm)
 * @param itemH Chiều cao kiện hàng (mm)
 * @param truck Xe tải cần kiểm tra
 * @returns true nếu kiện hàng quá khổ
 */
export function isItemOversized(
  itemL: number,
  itemW: number,
  itemH: number,
  truck: Truck | null
): boolean {
  if (!truck) return false;

  const itemDims = [Number(itemL) || 0, Number(itemW) || 0, Number(itemH) || 0].sort((a, b) => a - b);
  const truckDims = [truck.length, truck.width, truck.height].sort((a, b) => a - b);

  return itemDims[0] > truckDims[0] || itemDims[1] > truckDims[1] || itemDims[2] > truckDims[2];
}
