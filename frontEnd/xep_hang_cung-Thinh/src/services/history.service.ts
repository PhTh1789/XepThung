/**
 * src/services/history.service.ts
 *
 * Service layer cho nhóm API quản lý Lịch sử (History).
 *
 * Endpoints:
 *   GET  /history          → Danh sách lịch sử có phân trang [Auth]
 *   GET  /history/{id}     → Chi tiết để Restore 3D [Auth]
 *   POST /history          → Lưu thủ công kết quả [Auth]
 */

import { apiClient } from "./apiClient";
import type { ApiSuccessResponse, HistoryData, HistoryDetailData, HistorySavePayload } from "./api.types";

/**
 * Lấy danh sách lịch sử của User (có phân trang).
 * [Auth] — Yêu cầu Supabase JWT Token.
 */
export async function getHistoryList(
  page: number = 1,
  limit: number = 10,
): Promise<HistoryData> {
  const response = await apiClient.get<ApiSuccessResponse<HistoryData>>(
    "/history",
    { params: { page, limit } },
  );
  return response.data.data;
}

/**
 * Lấy chi tiết một bản ghi lịch sử để Restore 3D.
 * [Auth] — Yêu cầu Supabase JWT Token.
 *
 * @param historyId - UUID của bản ghi lịch sử.
 */
export async function getHistoryDetail(
  historyId: string,
): Promise<HistoryDetailData> {
  const response = await apiClient.get<ApiSuccessResponse<HistoryDetailData>>(
    `/history/${historyId}`,
  );
  return response.data.data;
}

/**
 * Lưu thủ công kết quả tối ưu vào lịch sử.
 * Được gọi khi user bấm "Lưu kết quả" ở Step 3.
 * [Auth] — Yêu cầu Supabase JWT Token.
 *
 * @param payload - Toàn bộ context của phiên sắp xếp (truck + optimize_data).
 * @returns history_id của bản ghi vừa tạo.
 */
export async function saveHistory(
  payload: HistorySavePayload,
  config?: import("axios").AxiosRequestConfig
): Promise<{ history_id: string }> {
  const response = await apiClient.post<
    ApiSuccessResponse<{ history_id: string }>
  >("/history", payload, config);
  return response.data.data;
}

/**
 * Xóa cứng một bản ghi lịch sử.
 * [Auth] — Yêu cầu Supabase JWT Token.
 *
 * @param historyId - UUID của bản ghi lịch sử cần xóa.
 */
export async function deleteHistory(historyId: string): Promise<void> {
  await apiClient.delete(`/history/${historyId}`);
}
