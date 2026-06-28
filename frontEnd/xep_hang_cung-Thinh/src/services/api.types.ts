/**
 * src/services/api.types.ts
 *
 * Định nghĩa toàn bộ TypeScript types liên quan đến giao tiếp API.
 *
 * Nguyên tắc thiết kế:
 * - File này KHÔNG phụ thuộc vào Zod hay bất kỳ thư viện nào.
 * - Tách biệt khỏi `src/schemas/index.ts` (nơi chỉ chứa Zod Schema cho Form FE).
 * - Là "hợp đồng" TypeScript phản ánh chính xác `API_contract`.
 */

import type { Truck, Item } from "@/schemas";
import type { OptimizationLevel } from "@/store/useCargoStore";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Standard Response Wrappers (API Contract - GLOBAL RULES)
// ─────────────────────────────────────────────────────────────────────────────

/** Mọi API thành công trả về HTTP 200/201 với cấu trúc này. */
export interface ApiSuccessResponse<T> {
  status: "success";
  message: string;
  data: T;
}

/** Mọi lỗi (Validation, Logic, Database) trả về với cấu trúc này. */
export interface ApiErrorResponse {
  status: "error";
  message: string;
  error_code: string;
}

/**
 * Custom Error class để phân biệt lỗi từ API (có error_code) với lỗi mạng.
 *
 * Cách dùng trong catch block:
 * ```ts
 * catch (err) {
 *   if (err instanceof ApiError && err.errorCode === 'GUEST_LIMIT_EXCEEDED') {
 *     // Hiển thị thông báo giới hạn khách
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  public readonly errorCode?: string;

  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = "ApiError";
    this.errorCode = errorCode;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Optimizer API Types (POST /optimize)
// ─────────────────────────────────────────────────────────────────────────────

/** Payload gửi lên POST /optimize. */
export interface OptimizationPayload {
  optimization_level: OptimizationLevel;
  truck: Truck;
  items: Item[];
  /** Cho phép user chủ động lưu kết quả. Mặc định false để tránh auto-save. */
  save_to_history?: boolean;
  load_margin?: number;
}

/** Tọa độ 3D của một kiện hàng sau khi xếp. */
export interface Coordinates3D {
  x: number;
  y: number;
  z: number;
}

/** Kích thước 3D (sau khi có thể xoay). */
export interface Dimensions3D {
  length: number;
  width: number;
  height: number;
}

/** Một kiện hàng đã được xếp thành công vào xe. */
export interface PackedItem {
  /** ID duy nhất của từng thực thể vật lý (VD: "item_001_1", "item_001_2"). */
  id: string;
  name: string;
  color: string;
  /** Thứ tự xếp lên xe (để hiển thị animation 3D tuần tự). */
  step_sequence: number;
  coordinates: Coordinates3D;
  dimensions: Dimensions3D;
  is_rotated: boolean;
  rotation_type: string;
}

/** Một kiện hàng KHÔNG thể xếp vào xe (quá khổ hoặc hết chỗ). */
export interface UnpackedItem {
  id: string;
  name: string;
  reason?: string;
}

/** Tóm tắt kết quả tính toán. */
export interface OptimizationSummary {
  total_items: number;
  packed_items_count: number;
  unpacked_items_count: number;
  total_weight: number;
  fill_rate_percent: number;
  resolved_mode: "fast" | "deep";
}

/** Toàn bộ data trả về từ POST /optimize (nằm trong `response.data`). */
export interface OptimizationData {
  summary: OptimizationSummary;
  packed_items: PackedItem[];
  unpacked_items: UnpackedItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. History API Types (GET /history)
// ─────────────────────────────────────────────────────────────────────────────

/** Một bản ghi tóm tắt trong lịch sử. */
export interface HistoryRecord {
  history_id: string;
  created_at: string;
  truck_name: string;
  total_items: number;
  fill_rate_percent: number;
  optimization_level: string;
}

/** Phân trang trong response GET /history. */
export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_records: number;
}

/** Data của GET /history. */
export interface HistoryData {
  records: HistoryRecord[];
  meta: PaginationMeta;
}

/**
 * Chi tiết một bản ghi lịch sử — dùng cho Restore 3D.
 * result_payload có cấu trúc mở rộng: { truck, optimize_data }.
 */
export interface HistoryDetailData {
  history_id: string;
  created_at: string;
  truck_name: string;
  optimization_level: string;
  result_payload: {
    truck: Truck;
    optimize_data: OptimizationData;
  };
}

/** Payload gửi lên POST /history — lưu thủ công kết quả tối ưu. */
export interface HistorySavePayload {
  truck_name: string;
  optimization_level: string;
  total_items: number;
  packed_items_count: number;
  unpacked_items_count: number;
  total_weight: number;
  fill_rate_percent: number;
  result_payload: {
    truck: Truck;
    optimize_data: OptimizationData;
  };
}
