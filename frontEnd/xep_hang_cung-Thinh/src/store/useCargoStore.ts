/**
 * src/store/useCargoStore.ts
 *
 * PILLAR 3 — Core Domain Store (Nghiệp Vụ Lõi)
 * Nguồn sự thật về "Xe nào? Hàng nào? Tính toán ra sao?"
 *
 * Trách nhiệm:
 *   - Truck state & actions (selectPresetTruck, activateCustomTruckMode...)
 *   - Item state & actions (addItem, removeItem, updateItem...)
 *   - Library fetching (fetchTruckLibrary, fetchItemLibrary)
 *   - Optimization (optimizeCargo, validateCargoRules)
 *   - Settings (setSettings, setOptimizationLevel)
 *
 * KHÔNG chứa: Auth identity, Navigation/Step, Modal Stack, History persistence.
 *
 * Cross-store (outbound only):
 *   - optimizeCargo → gọi useAppStore.getState().showLoading()
 *   - optimizeCargo → gọi useAppStore.getState().setCurrentStep("step3")
 *   - fetchTruckLibrary → đọc useAuthStore.getState().userRole
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Truck, Item, Settings } from "@/schemas";
import type { OptimizationData, HistoryDetailData } from "@/services/api.types";
import { runOptimization } from "@/services/optimizer.service";
import { getTruckPresets, getSavedTrucks } from "@/services/trucks.service";
import { getItemPresets, getSavedItems } from "@/services/items.service";
import { ApiError } from "@/services/api.types";
import { toast } from "sonner";
import { calculateVolumeM3, formatWeight, formatLength } from "@/utils/unitConverter";
import { buildPayloadHash } from "@/utils/payloadHash";
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
  truckLibrary: Truck[];
  /**
   * Signal counter để yêu cầu TruckForm tự kích hoạt validate.
   * Pattern: Signal Counter — React-idiomatic, không cần DOM events.
   */
  truckFormValidationSignal: number;

  // --- Item State ---
  items: Item[];
  itemLibrary: Item[];

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
  fetchTruckLibrary: () => Promise<void>;
  removeSavedTruck: (truckId: string) => Promise<void>;

  // --- Item Actions ---
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<Item>) => void;
  clearItems: () => void;
  fetchItemLibrary: () => Promise<void>;
  addSavedItemToLibrary: (itemPayload: any) => Promise<void>;
  removeSavedItem: (itemId: string) => Promise<void>;

  // --- Settings Actions ---
  setSettings: (settings: Partial<Settings>) => void;
  setOptimizationLevel: (level: OptimizationLevel) => void;

  // --- Optimization Actions ---
  /**
   * Async action: Chạy thuật toán tối ưu hóa.
   * Side effect: gọi useAppStore.getState().showLoading() / setCurrentStep().
   */
  optimizeCargo: () => Promise<void>;
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
  truckLibrary: [],
  truckFormValidationSignal: 0,
  items: [],
  itemLibrary: [],
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
        return { truckMode: "custom", truck: null, resultPayloadHash: null };
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

  resetTruck: () => set({ truckMode: null, truck: null, savePreset: false }),

  fetchTruckLibrary: async () => {
    try {
      const presets = await getTruckPresets();
      const mappedPresets = presets.map((p) => ({ ...p, is_preset: true }));
      let saved: Truck[] = [];
      // Cross-store static read: check user role
      const { useAuthStore } = await import("./useAuthStore");
      if (useAuthStore.getState().userRole === "member") {
        const rawSaved = await getSavedTrucks();
        saved = rawSaved.map((s) => ({ ...s, is_preset: false }));
      }
      set({ truckLibrary: [...saved, ...mappedPresets] });
    } catch (err) {
      console.error("Failed to fetch truck library", err);
    }
  },

  removeSavedTruck: async (truckId: string) => {
    const currentState = get();
    // 1. Lưu lại state cũ để Rollback nếu lỗi
    const previousLibrary = currentState.truckLibrary;
    const isSelectedTruck = currentState.truck?.id === truckId;

    // 2. Optimistic UI: Xóa khỏi UI ngay lập tức
    set({
      truckLibrary: previousLibrary.filter((t) => t.id !== truckId),
      // Nếu truck bị xóa đang được chọn trên form, reset form
      ...(isSelectedTruck && currentState.truckMode === "preset"
        ? { truck: null, truckMode: null }
        : {}),
    });

    try {
      const { deleteTruck } = await import("@/services/trucks.service");
      await deleteTruck(truckId);
      toast.success("Đã xóa xe tải khỏi thư viện");
    } catch (err) {
      console.error("Lỗi khi xóa xe tải:", err);
      // 3. Rollback
      set({ truckLibrary: previousLibrary });
      // Re-select if it was selected
      if (isSelectedTruck && currentState.truckMode === "preset") {
        set({ truck: previousLibrary.find((t) => t.id === truckId) || null, truckMode: "preset" });
      }
      toast.error("Lỗi mạng, không thể xóa xe tải lúc này");
    }
  },

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
          i.color === item.color
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
          i.color === newItem.color
      );

      if (existingIndex !== -1) {
        const merged = [...state.items];
        merged[existingIndex] = {
          ...merged[existingIndex],
          quantity: merged[existingIndex].quantity + newItem.quantity,
        };
        return { items: merged.filter((i) => i.id !== itemId), resultPayloadHash: null };
      }

      return {
        items: state.items.map((item) => (item.id === itemId ? newItem : item)),
        resultPayloadHash: null,
      };
    }),

  clearItems: () => set({ items: [] }),

  fetchItemLibrary: async () => {
    try {
      const presets = await getItemPresets();
      const mappedPresets = presets.map((p) => ({ ...p, is_preset: true }));
      let saved: Item[] = [];
      const { useAuthStore } = await import("./useAuthStore");
      if (useAuthStore.getState().userRole === "member") {
        const rawSaved = await getSavedItems();
        saved = rawSaved.map((s) => ({ ...s, is_preset: false }));
      }
      set({ itemLibrary: [...saved, ...mappedPresets] });
    } catch (err) {
      console.error("Failed to fetch item library", err);
    }
  },

  addSavedItemToLibrary: async (itemPayload) => {
    const currentState = get();
    try {
      const { saveItem } = await import("@/services/items.service");
      // Gọi API bằng Pessimistic Update (đợi API trả về ID thực sự)
      const savedItem = await saveItem(itemPayload);
      
      // Chèn trực tiếp kiện hàng mới (với ID DB) vào mảng itemLibrary (Inline Cache Update)
      set({
        itemLibrary: [{ ...savedItem, is_preset: false }, ...currentState.itemLibrary]
      });
      
      const { AppToast } = await import("@/utils/appToast");
      AppToast.successSave(savedItem.name ?? "");
    } catch (err) {
      console.error("Lỗi khi lưu kiện hàng vào thư viện:", err);
      const { AppToast } = await import("@/utils/appToast");
      AppToast.apiError();
      throw err; // Bắn lỗi ra để component có thể biết nếu cần
    }
  },

  removeSavedItem: async (itemId: string) => {
    const currentState = get();
    // 1. Lưu lại state cũ để Rollback nếu lỗi
    const previousLibrary = currentState.itemLibrary;

    // 2. Optimistic UI: Xóa khỏi UI ngay lập tức
    set({
      itemLibrary: previousLibrary.filter((i) => i.id !== itemId),
    });

    try {
      const { deleteItem } = await import("@/services/items.service");
      await deleteItem(itemId);
      toast.success("Đã xóa kiện hàng khỏi thư viện");
    } catch (err) {
      console.error("Lỗi khi xóa kiện hàng:", err);
      // 3. Rollback
      set({ itemLibrary: previousLibrary });
      toast.error("Lỗi mạng, không thể xóa kiện hàng lúc này");
    }
  },

  // --- Settings Actions ---
  setSettings: (settings) =>
    set((state) => ({ settings: { ...state.settings, ...settings } })),

  setOptimizationLevel: (level) => set({ optimizationLevel: level }),

  // --- Optimization Action ---
  optimizeCargo: async () => {
    const state = get();

    // Bước 1: Validate cargo rules
    const validation = state.validateCargoRules();
    if (!validation.isValid) {
      set({ optimizationError: validation.errors.join(" | ") });
      validation.errors.forEach((err) =>
        toast.error("Vi phạm quy tắc xếp hàng", { description: err, duration: 6000 })
      );
      return;
    }

    const { truck, items, optimizationLevel, settings } = state;
    if (!truck) {
      set({ optimizationError: "Chưa chọn xe tải." });
      return;
    }

    // Bước 2: Gọi Global Loading từ useAppStore
    const { useAppStore } = await import("./useAppStore");
    set({ optimizationError: null });
    const controller = useAppStore
      .getState()
      .showLoading("Hệ thống đang tính toán phương án xếp hàng tối ưu...", true);

    try {
      // Bước 3: Gọi API
      const result = await runOptimization(
        { 
          optimization_level: optimizationLevel, 
          truck, 
          items,
          load_margin: settings.load_margin
        },
        { signal: controller.signal }
      );

      // Bước 4: Thành công — lưu kết quả, hash cache, navigate step3
      const savedHash = buildPayloadHash(truck, items);
      set({
        optimizationResult: result,
        resultPayloadHash: savedHash,
      });
      useAppStore.getState().setCurrentStep("step3");
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.message === "canceled") {
        toast.info("Đã hủy quá trình tính toán.");
        return;
      }
      const errorMsg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";

      set({ optimizationError: errorMsg });
      toast.error("Lỗi tối ưu hóa", { description: errorMsg });
      console.error("Optimize error:", err);
    } finally {
      useAppStore.getState().hideLoading();
    }
  },

  requestTruckFormValidation: () =>
    set((state) => ({ truckFormValidationSignal: state.truckFormValidationSignal + 1 })),

  // --- Computed Selectors ---
  getItemsCount: () => {
    const state = get();
    return state.items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalWeight: () => {
    const state = get();
    return state.items.reduce((total, item) => total + item.weight * item.quantity, 0);
  },

  getTotalVolume: () => {
    const state = get();
    return state.items.reduce(
      (total, item) =>
        total + calculateVolumeM3(item.length, item.width, item.height, item.quantity),
      0
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
    const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
    if (totalWeight > truck.max_weight) {
      errors.push(
        `Quá tải: Tổng trọng lượng hàng hóa (${fw(totalWeight)}) vượt tải trọng tối đa của xe (${fw(truck.max_weight)}).`
      );
    }

    // Rule 2: Quá khổ (3D Fit Check)
    for (const item of items) {
      if (isItemOversized(item.length, item.width, item.height, truck)) {
        errors.push(
          `Quá khổ: "${item.name}" (${fl(item.length)}×${fl(item.width)}×${fl(item.height)}) không thể xếp vào xe dù xoay theo hướng nào.`
        );
      }
    }

    // Rule 3: Quá thể tích (Cân nhắc cả Dung sai)
    const totalVolume = get().getTotalVolume();
    const truckVolume = calculateVolumeM3(truck.length, truck.width, truck.height, 1);
    const effectiveTruckVolume = truckVolume * (1 - settings.load_margin / 100);
    
    if (totalVolume > effectiveTruckVolume) {
      errors.push(
        `Quá thể tích: Tổng thể tích hàng hóa (${totalVolume.toFixed(2)} m³) vượt quá sức chứa hiệu dụng của xe (${effectiveTruckVolume.toFixed(2)} m³ sau khi trừ ${settings.load_margin}% biên độ). Không thể xếp hết.`
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
    }
  )
);
