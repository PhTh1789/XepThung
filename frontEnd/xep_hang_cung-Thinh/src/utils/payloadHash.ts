/**
 * src/utils/payloadHash.ts
 *
 * Tinh hash on dinh tu truck + items de kiem tra xem payload co thay doi khong.
 * Dung trong processNextStep() de quyet dinh co can goi lai API /optimize hay khong.
 *
 * Ham nay tach ra khoi Store de de test doc lap (Single Responsibility).
 * Sort items theo id truoc khi hash de tranh false cache miss do thu tu khac nhau.
 */
import type { Truck, Item } from "@/schemas";

export function buildPayloadHash(truck: Truck | null, items: Item[]): string {
  if (!truck) return "";

  const normalized = {
    // Chi lay cac truong anh huong den ket qua toi uu — bo qua ten
    truck: [truck.length, truck.width, truck.height, truck.max_weight],
    items: [...items]
      .sort((a, b) => (a.id ?? "").localeCompare(b.id ?? ""))
      .map((i) => [i.length, i.width, i.height, i.weight, i.quantity, i.color]),
  };

  return JSON.stringify(normalized);
}
