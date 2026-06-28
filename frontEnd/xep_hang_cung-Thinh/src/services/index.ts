/**
 * src/services/index.ts
 *
 * Barrel export — Điểm xuất duy nhất cho toàn bộ Services.
 *
 * Cách import trong các file khác:
 * ```ts
 * import { runOptimization, getTruckPresets, getItemPresets } from "@/services";
 * ```
 */

// Core HTTP Client (dùng khi cần gọi API tùy chỉnh)
export { apiClient } from "./apiClient";

// API Types
export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  OptimizationPayload,
  OptimizationData,
  OptimizationSummary,
  PackedItem,
  UnpackedItem,
  Coordinates3D,
  Dimensions3D,
  HistoryData,
  HistoryRecord,
  PaginationMeta,
  HistoryDetailData,
  HistorySavePayload,
} from "./api.types";
export { ApiError } from "./api.types";

// Optimizer Service
export { runOptimization } from "./optimizer.service";

// Trucks Service
export {
  getTruckPresets,
  getSavedTrucks,
  saveTruck,
  deleteTruck,
} from "./trucks.service";

// Items Service
export {
  getItemPresets,
  getSavedItems,
  saveItem,
  deleteItem,
} from "./items.service";

// History Service
export {
  getHistoryList,
  getHistoryDetail,
  saveHistory,
} from "./history.service";
