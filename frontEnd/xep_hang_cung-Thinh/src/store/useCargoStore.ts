/**
 * src/store/useCargoStore.ts
 *
 * PILLAR 3 — Core Domain Store (Nghiệp Vụ Lõi)
 * Nguồn sự thật về "Xe nào? Hàng nào? Tính toán ra sao?"
 *
 * Trách nhiệm:
 *   - Truck state & actions (selectPresetTruck, activateCustomTruckMode...)
 *   - Item state & actions (addItem, removeItem, updateItem...)
 *   - Optimization (optimizeCargo, validateCargoRules)
 *   - Settings (setSettings, setOptimizationLevel)
 *
 * Server State (API calls) đã được tách ra:
 *   - GET libraries → src/hooks/queries/useTruckLibrary.ts, useItemLibrary.ts
 *   - CRUD mutations → src/hooks/mutations/useTruckMutations.ts, useItemMutations.ts
 *
 * KHÔNG chứa: Auth identity, Navigation/Step, Modal Stack, History persistence.
 *
 * Cross-store (outbound only):
 *   - optimizeCargo → đã tách sang src/hooks/mutations/useOptimizeMutation.ts
 *   - validateCargoRules, canContinueStep1, canContinueStep2 → dùng bởi useAppStore.goToStep()
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Truck, Item, Settings } from "@/schemas";
import type { OptimizationData, HistoryDetailData } from "@/services/api.types";

import { AppToast } from "@/utils/appToast";
import {
  calculateVolumeM3,
  formatWeight,
  formatLength,
} from "@/utils/unitConverter";

import { isItemOversized } from "@/utils/cargoValidation";

export type OptimizationLevel = "auto" | "fast" | "deep";

// Kết quả trả về từ validateCargoRules.
export type ValidationResult = { isValid: boolean; errors: string[] };

interface CargoStore {
  // --- Truck State ---
  truckMode: "preset" | "custom" | null;
  /** true khi user muốn lưu xe custom vào preset library. */
  savePreset: boolean;
  truck: Truck | null;
  /**
   * Signal counter để yêu cầu TruckForm tự kích hoạt validate.
   * Pattern: Signal Counter — React-idiomatic, không cần DOM events.
   */
  truckFormValidationSignal: number;

  // --- Item State ---
  items: Item[];

  // --- Optimization State ---
  /** Cấp độ tối ưu hóa: 'auto' (mặc định) | 'fast' | 'deep' */
  optimizationLevel: OptimizationLevel;
  /** Kết quả trả về từ Backend sau khi tối ưu thành công. */
  optimizationResult: OptimizationData | null;
  /**
   * Hash ổn định từ truck + items tại thời điểm gọi API thành công.
   * Dùng để tránh re-fetch API khi data không thay đổi (Smart Cache).
   */
  resultPayloadHash: string | null;
  /** Error message khi gọi API /optimize thất bại. */
  optimizationError: string | null;

  // --- Settings State ---
  settings: Settings;

  // --- Truck Actions ---
  selectPresetTruck: (truck: Truck) => void;
  activateCustomTruckMode: () => void;
  updateCustomTruck: (truck: Truck | null) => void;
  toggleSavePreset: (save: boolean) => void;
  resetSavePreset: () => void;
  resetTruck: () => void;

  // --- Item Actions ---
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<Item>) => void;
  clearItems: () => void;

  // --- Settings Actions ---
  setSettings: (settings: Partial<Settings>) => void;
  setOptimizationLevel: (level: OptimizationLevel) => void;

  // --- Optimization Actions ---
  // (Tách sang useOptimizeMutation.ts)
  requestTruckFormValidation: () => void;

  // --- Computed Selectors ---
  getItemsCount: () => number;
  getTotalWeight: () => number;
  getTotalVolume: () => number;
  canContinueStep1: () => boolean;
  canContinueStep2: () => boolean;
  validateCargoRules: () => ValidationResult;

  // --- History Integration ---
  /**
   * Nhận data từ useHistoryStore.hydrateFromHistory() và apply vào store.
   * Không set navigation (trách nhiệm của useAppStore).
   */
  applyHistoryData: (detail: HistoryDetailData) => void;

  /**
   * Reset toàn bộ cargo data về trạng thái ban đầu.
   * Không reset Auth state (trách nhiệm của useAuthStore).
   */
  resetSession: () => void;
}

export const useCargoStore = create<CargoStore>()(
  persist(
    (set, get) => ({
      // Initial State
      truckMode: null,
      savePreset: false,
      truck: null,
      truckFormValidationSignal: 0,
      items: [],
      optimizationLevel: "auto",
      optimizationResult: null,
      resultPayloadHash: null,
      optimizationError: null,
      settings: {
        length_unit: "cm",
        weight_unit: "kg",
        decimal_separator: ".",
        load_margin: 5,
      },

      // --- Truck Actions ---
      selectPresetTruck: (truck) =>
        set({
          truckMode: "preset",
          truck,
          savePreset: false,
          resultPayloadHash: null,
        }),

      activateCustomTruckMode: () =>
        set((state) => {
          if (state.truckMode === "preset") {
            return {
              truckMode: "custom",
              truck: null,
              resultPayloadHash: null,
            };
          }
          return { truckMode: "custom", resultPayloadHash: null };
        }),

      updateCustomTruck: (truck) =>
        set((state) => {
          if (state.truckMode === "custom") {
            return { truck, resultPayloadHash: null };
          }
          return state;
        }),

      toggleSavePreset: (save) => {
        // Sync check: đọc useAuthStore.getState() tĩnh, không cần async
        import("./useAuthStore").then(({ useAuthStore }) => {
          const { userRole } = useAuthStore.getState();
          set({ savePreset: userRole === "member" ? save : false });
        });
      },

      resetSavePreset: () => set({ savePreset: false }),

      resetTruck: () =>
        set({ truckMode: null, truck: null, savePreset: false }),

      // --- Item Actions ---
      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) =>
              i.name === item.name &&
              i.length === item.length &&
              i.width === item.width &&
              i.height === item.height &&
              i.weight === item.weight &&
              i.color === item.color,
          );

          if (existingIndex !== -1) {
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + item.quantity,
            };
            return { items: newItems, resultPayloadHash: null };
          }

          return {
            items: [
              ...state.items,
              { ...item, id: item.id || crypto.randomUUID() },
            ],
            resultPayloadHash: null,
          };
        }),

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
          resultPayloadHash: null,
        })),

      updateItem: (itemId, updates) =>
        set((state) => {
          const oldItem = state.items.find((i) => i.id === itemId);
          if (!oldItem) return state;
          const newItem = { ...oldItem, ...updates };

          const existingIndex = state.items.findIndex(
            (i) =>
              i.id !== itemId &&
              i.name === newItem.name &&
              i.length === newItem.length &&
              i.width === newItem.width &&
              i.height === newItem.height &&
              i.weight === newItem.weight &&
              i.color === newItem.color,
          );

          if (existingIndex !== -1) {
            const merged = [...state.items];
            merged[existingIndex] = {
              ...merged[existingIndex],
              quantity: merged[existingIndex].quantity + newItem.quantity,
            };
            return {
              items: merged.filter((i) => i.id !== itemId),
              resultPayloadHash: null,
            };
          }

          return {
            items: state.items.map((item) =>
              item.id === itemId ? newItem : item,
            ),
            resultPayloadHash: null,
          };
        }),

      clearItems: () => set({ items: [] }),

      // --- Settings Actions ---
      setSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),

      setOptimizationLevel: (level) => {
        // Nếu chọn mode 'auto' hoặc 'fast', cho phép set luôn
        if (level !== "deep") {
          set({ optimizationLevel: level });
          return;
        }

        // Nếu chọn 'deep', cross-check quyền từ AuthStore
        import("./useAuthStore").then(({ useAuthStore }) => {
          const { userRole } = useAuthStore.getState();

          if (userRole === "member") {
            set({ optimizationLevel: level });
          } else {
            AppToast.memberOnlyFeature("chế độ Tối ưu Sâu");
          }
        });
      },

      // --- Optimization Action ---
      // Hàm optimizeCargo đã được tách hoàn toàn sang useOptimizeMutation.ts

      requestTruckFormValidation: () =>
        set((state) => ({
          truckFormValidationSignal: state.truckFormValidationSignal + 1,
        })),

      // --- Computed Selectors ---
      getItemsCount: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalWeight: () => {
        const state = get();
        return state.items.reduce(
          (total, item) => total + item.weight * item.quantity,
          0,
        );
      },

      getTotalVolume: () => {
        const state = get();
        return state.items.reduce(
          (total, item) =>
            total +
            calculateVolumeM3(
              item.length,
              item.width,
              item.height,
              item.quantity,
            ),
          0,
        );
      },

      canContinueStep1: () => get().truck !== null,
      canContinueStep2: () => get().items.length > 0,

      validateCargoRules: (): ValidationResult => {
        const { truck, items, settings } = get();
        const errors: string[] = [];

        if (!truck || items.length === 0) return { isValid: true, errors: [] };

        const fw = (g: number) =>
          `${formatWeight(g, settings.weight_unit, settings.decimal_separator)} ${settings.weight_unit}`;
        const fl = (mm: number) =>
          `${formatLength(mm, settings.length_unit, settings.decimal_separator)} ${settings.length_unit}`;

        // Rule 1: Quá tải
        const totalWeight = items.reduce(
          (sum, item) => sum + item.weight * item.quantity,
          0,
        );
        if (totalWeight > truck.max_weight) {
          errors.push(
            `Quá tải: Tổng trọng lượng hàng hóa (${fw(totalWeight)}) vượt tải trọng tối đa của xe (${fw(truck.max_weight)}).`,
          );
        }

        // Rule 2: Quá khổ (3D Fit Check)
        for (const item of items) {
          if (isItemOversized(item.length, item.width, item.height, truck)) {
            errors.push(
              `Quá khổ: "${item.name}" (${fl(item.length)}×${fl(item.width)}×${fl(item.height)}) không thể xếp vào xe dù xoay theo hướng nào.`,
            );
          }
        }

        // Rule 3: Quá thể tích (Cân nhắc cả Dung sai)
        const totalVolume = get().getTotalVolume();
        const truckVolume = calculateVolumeM3(
          truck.length,
          truck.width,
          truck.height,
          1,
        );
        const effectiveTruckVolume =
          truckVolume * (1 - settings.load_margin / 100);

        if (totalVolume > effectiveTruckVolume) {
          errors.push(
            `Quá thể tích: Tổng thể tích hàng hóa (${totalVolume.toFixed(2)} m³) vượt quá sức chứa hiệu dụng của xe (${effectiveTruckVolume.toFixed(2)} m³ sau khi trừ ${settings.load_margin}% biên độ). Không thể xếp hết.`,
          );
        }

        return { isValid: errors.length === 0, errors };
      },

      // --- History Integration ---
      applyHistoryData: (detail) => {
        const { result_payload } = detail;
        set({
          truck: result_payload.truck,
          optimizationResult: result_payload.optimize_data,
          items: [],
          resultPayloadHash: null,
          optimizationError: null,
        });
      },

      resetSession: () =>
        set({
          truckMode: null,
          truck: null,
          items: [],
          optimizationLevel: "auto",
          optimizationResult: null,
          optimizationError: null,
          resultPayloadHash: null,
          truckFormValidationSignal: 0,
          savePreset: false,
        }),
    }),
    {
      name: "cargo-store-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        truckMode: state.truckMode,
        savePreset: state.savePreset,
        truck: state.truck,
        items: state.items,
        settings: state.settings,
        optimizationLevel: state.optimizationLevel,
      }),
    },
  ),
);
