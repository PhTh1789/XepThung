/**
 * src/services/optimizer.service.ts
 *
 * Service layer cho API Optimizer.
 * Endpoint: POST /optimize (Public - Guest giới hạn 50 items)
 *
 * Tham chiếu: docs/API_contract.md - Section 1 (CORE API: THUẬT TOÁN TỐI ƯU HÓA)
 */

import { apiClient } from "./apiClient";
import type { OptimizationPayload, OptimizationData, ApiSuccessResponse } from "./api.types";

/**
 * Gọi thuật toán xếp hàng 3D trên Backend.
 *
 * @param payload - Bao gồm `optimization_level`, `truck` (Base Unit cm) và `items` (Base Unit cm/kg).
 * @returns Kết quả xếp hàng bao gồm `packed_items`, `unpacked_items` và `summary`.
 * @throws {ApiError} Nếu payload không hợp lệ, vượt giới hạn Guest, hoặc lỗi mạng.
 */
export async function runOptimization(
  payload: OptimizationPayload,
  config?: import("axios").AxiosRequestConfig
): Promise<OptimizationData> {
  const response = await apiClient.post<ApiSuccessResponse<OptimizationData>>(
    "/optimize",
    payload,
    config
  );
  return response.data.data;
}
