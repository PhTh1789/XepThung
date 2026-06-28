/**
 * src/features/wizard/Step3-Result/mock/mockOptimizationResult.ts
 *
 * Dữ liệu mock phản ánh chính xác OptimizationData interface.
 * Chỉ dùng làm fallback trong development / demo khi optimizationResult === null.
 * KHÔNG đưa vào Store.
 */
import type { OptimizationData } from "@/services/api.types";

export const MOCK_OPTIMIZATION_RESULT: OptimizationData = {
  summary: {
    total_items: 8,
    packed_items_count: 7,
    unpacked_items_count: 1,
    total_weight: 185000,
    fill_rate_percent: 78,
    resolved_mode: "fast",
  },
  packed_items: [
    {
      id: "item_001_1",
      name: "Carton A",
      color: "#3B82F6",
      step_sequence: 1,
      coordinates: { x: 0, y: 0, z: 0 },
      dimensions: { length: 600, width: 400, height: 400 },
      is_rotated: false,
      rotation_type: "WHD",
    },
    {
      id: "item_001_2",
      name: "Carton A",
      color: "#3B82F6",
      step_sequence: 2,
      coordinates: { x: 600, y: 0, z: 0 },
      dimensions: { length: 600, width: 400, height: 400 },
      is_rotated: false,
      rotation_type: "WHD",
    },
    {
      id: "item_002_1",
      name: "Carton B",
      color: "#F97316",
      step_sequence: 3,
      coordinates: { x: 1200, y: 0, z: 0 },
      dimensions: { length: 800, width: 600, height: 600 },
      is_rotated: false,
      rotation_type: "WHD",
    },
    {
      id: "item_002_2",
      name: "Carton B",
      color: "#F97316",
      step_sequence: 4,
      coordinates: { x: 0, y: 400, z: 0 },
      dimensions: { length: 800, width: 600, height: 600 },
      is_rotated: true,
      rotation_type: "HWD",
    },
    {
      id: "item_003_1",
      name: "Carton C",
      color: "#22C55E",
      step_sequence: 5,
      coordinates: { x: 2000, y: 0, z: 0 },
      dimensions: { length: 1000, width: 800, height: 600 },
      is_rotated: false,
      rotation_type: "WHD",
    },
    {
      id: "item_003_2",
      name: "Carton C",
      color: "#22C55E",
      step_sequence: 6,
      coordinates: { x: 0, y: 0, z: 400 },
      dimensions: { length: 1000, width: 800, height: 600 },
      is_rotated: false,
      rotation_type: "WHD",
    },
    {
      id: "item_001_3",
      name: "Carton A",
      color: "#3B82F6",
      step_sequence: 7,
      coordinates: { x: 800, y: 400, z: 0 },
      dimensions: { length: 600, width: 400, height: 400 },
      is_rotated: false,
      rotation_type: "WHD",
    },
  ],
  unpacked_items: [
    {
      id: "item_extra_1",
      name: "Carton C",
      reason: "Không còn đủ không gian sau khi xếp các kiện ưu tiên cao hơn.",
    },
  ],
};
