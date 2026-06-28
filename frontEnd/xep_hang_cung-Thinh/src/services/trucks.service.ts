/**
 * src/services/trucks.service.ts
 *
 * Service layer cho nhóm API quản lý Thùng Xe (Trucks).
 *
 * Tham chiếu: docs/API_contract.md - Section 2 (API QUẢN LÝ THÙNG XE)
 *
 * Ghi chú về phân quyền:
 * - GET /trucks/presets  → Public (Dùng được ngay, không cần Token)
 * - GET /trucks/saved    → [Auth] (Cần Supabase Token - Phase Auth)
 * - POST /trucks/saved   → [Auth] (Cần Supabase Token - Phase Auth)
 * - DELETE /trucks/saved → [Auth] (Cần Supabase Token - Phase Auth)
 */

import { apiClient } from "./apiClient";
import type { Truck } from "@/schemas";
import type { ApiSuccessResponse } from "./api.types";

/**
 * Lấy danh sách xe tải mẫu mặc định của hệ thống.
 * Public — không cần đăng nhập.
 */
export async function getTruckPresets(): Promise<Truck[]> {
  const response = await apiClient.get<ApiSuccessResponse<Truck[]>>(
    "/trucks/presets",
  );
  return response.data.data;
}

/**
 * Lấy danh sách xe tải đã lưu của User hiện tại.
 * [Auth] — Yêu cầu Supabase JWT Token.
 */
export async function getSavedTrucks(): Promise<Truck[]> {
  const response = await apiClient.get<ApiSuccessResponse<Truck[]>>(
    "/trucks/saved",
  );
  return response.data.data;
}

/**
 * Lưu một cấu hình thùng xe mới vào Database của User.
 * [Auth] — Yêu cầu Supabase JWT Token.
 *
 * @param truck - Object Truck theo Base Unit (cm, kg) — Không truyền `id`.
 */
export async function saveTruck(truck: Omit<Truck, "id">): Promise<Truck> {
  const response = await apiClient.post<ApiSuccessResponse<Truck>>(
    "/trucks/saved",
    truck,
  );
  return response.data.data;
}

/**
 * Xóa một cấu hình thùng xe đã lưu.
 * [Auth] — Yêu cầu Supabase JWT Token.
 *
 * @param truckId - ID của thùng xe cần xóa.
 */
export async function deleteTruck(truckId: string): Promise<void> {
  await apiClient.delete(`/trucks/saved/${truckId}`);
}
