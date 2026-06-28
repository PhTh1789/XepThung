/**
 * src/services/items.service.ts
 *
 * Service layer cho nhóm API quản lý Kiện Hàng (Items).
 *
 * Tham chiếu: docs/API_contract.md - Section 3 (API QUẢN LÝ KIỆN HÀNG)
 *
 * Ghi chú về phân quyền:
 * - GET /items/presets  → Public (Dùng được ngay, không cần Token)
 * - GET /items/saved    → [Auth] (Cần Supabase Token - Phase Auth)
 * - POST /items/saved   → [Auth] (Cần Supabase Token - Phase Auth)
 * - DELETE /items/saved → [Auth] (Cần Supabase Token - Phase Auth)
 *
 * Ghi chú về API Contract:
 * - Payload POST /items/saved dùng object Item nhưng KHÔNG truyền `quantity`
 *   (quantity chỉ có ý nghĩa trong context của một chuyến hàng cụ thể).
 */

import { apiClient } from "./apiClient";
import type { Item } from "@/schemas";
import type { ApiSuccessResponse } from "./api.types";

/** Type riêng cho Item khi lưu vào Database — không có `id` và không có `quantity`. */
type SavedItemPayload = Omit<Item, "id" | "quantity">;

/**
 * Lấy danh sách "Gợi ý hàng hóa" mặc định của hệ thống.
 * Public — không cần đăng nhập.
 */
export async function getItemPresets(): Promise<Item[]> {
  const response = await apiClient.get<ApiSuccessResponse<Item[]>>(
    "/items/presets",
  );
  return response.data.data;
}

/**
 * Lấy danh sách kiện hàng đã lưu của User hiện tại.
 * [Auth] — Yêu cầu Supabase JWT Token.
 */
export async function getSavedItems(): Promise<Item[]> {
  const response = await apiClient.get<ApiSuccessResponse<Item[]>>(
    "/items/saved",
  );
  return response.data.data;
}

/**
 * Lưu một kiện hàng vào danh sách của User.
 * [Auth] — Yêu cầu Supabase JWT Token.
 *
 * @param item - Object Item theo Base Unit (cm, kg).
 *               Theo API Contract, KHÔNG truyền `quantity`.
 */
export async function saveItem(item: SavedItemPayload): Promise<Item> {
  const response = await apiClient.post<ApiSuccessResponse<Item>>(
    "/items/saved",
    item,
  );
  return response.data.data;
}

/**
 * Xóa một kiện hàng đã lưu trong danh sách .
 * [Auth] — Yêu cầu Supabase JWT Token.
 *
 * @param itemId - ID của kiện hàng cần xóa.
 */
export async function deleteItem(itemId: string): Promise<void> {
  await apiClient.delete(`/items/saved/${itemId}`);
}
