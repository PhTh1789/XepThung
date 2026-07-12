/**
 * src/store/useHistoryStore.ts
 *
 * PILLAR 4 — Data Persistence Store
 * Quản lý vòng đời của một "Phiên kết quả": lưu, phục hồi, trạng thái History.
 *
 * Trách nhiệm:
 *   - isHistoryMode: toggle UX behavior (Footer, Step3 layout)
 *   - saveCurrentResult: lưu kết quả tối ưu lên backend
 *   - hydrateFromHistory: phục hồi data từ lịch sử vào useCargoStore
 *
 * Cross-store (outbound only):
 *   - saveCurrentResult → đọc useAuthStore.getState() (guard)
 *   - saveCurrentResult → đọc useCargoStore.getState() (data)
 *   - saveCurrentResult → gọi useAppStore.getState().showLoading()
 *   - hydrateFromHistory → gọi useCargoStore.getState().applyHistoryData()
 *   - hydrateFromHistory → gọi useAppStore.getState().setCurrentStep()
 */
import { create } from "zustand";
import type { HistoryDetailData } from "@/services/api.types";
import { saveHistory } from "@/services/history.service";
import { ApiError } from "@/services/api.types";
import { AppToast } from "@/utils/appToast";

interface HistoryStore {
  /**
   * true khi user đang xem lại lịch sử (Restore mode).
   * Thay đổi behavior của Footer "Quay lại" và hiện nút "Bắt đầu phiên mới".
   */
  isHistoryMode: boolean;
  /** Hash để tránh lưu trùng phiên kết quả. */
  lastSavedHash: string | null;
  /** Error message khi lưu lịch sử thất bại. */
  saveHistoryError: string | null;

  setIsHistoryMode: (val: boolean) => void;

  /**
   * Lưu thủ công kết quả tối ưu vào lịch sử.
   * Guard: chỉ chạy khi userRole === "member".
   * @returns true nếu lưu thành công, false nếu thất bại.
   */
  saveCurrentResult: () => Promise<boolean>;

  /**
   * Bơm ngược dữ liệu từ lịch sử vào Store để Restore lại Step 3.
   * Delegate: gọi useCargoStore.getState().applyHistoryData(detail).
   */
  hydrateFromHistory: (detail: HistoryDetailData) => void;

  /** Reset về trạng thái ban đầu khi bắt đầu phiên mới. */
  resetHistoryState: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  // Initial State
  isHistoryMode: false,
  lastSavedHash: null,
  saveHistoryError: null,

  // Actions
  setIsHistoryMode: (val) => set({ isHistoryMode: val }),

  saveCurrentResult: async () => {
    // Cross-store reads (static, no Hook violation)
    const { useAuthStore } = await import("./useAuthStore");
    const { useCargoStore } = await import("./useCargoStore");
    const { useAppStore } = await import("./useAppStore");

    const { userRole } = useAuthStore.getState();
    const { optimizationResult, truck, optimizationLevel, resultPayloadHash } =
      useCargoStore.getState();

    // Guard: chỉ member mới được lưu
    if (userRole !== "member") {
      AppToast.memberOnlyFeature("tính năng lưu lịch sử");
      return false;
    }

    if (!optimizationResult || !truck) {
      AppToast.noDataToSave();
      return false;
    }

    // Tránh lưu trùng phiên
    if (get().lastSavedHash && get().lastSavedHash === resultPayloadHash) {
      AppToast.alreadySaved();
      return true;
    }

    const controller = useAppStore.getState().showLoading("Đang lưu kết quả vào lịch sử...", false);
    set({ saveHistoryError: null });

    try {
      const summary = optimizationResult.summary;
      await saveHistory(
        {
          truck_name: truck.name,
          optimization_level: optimizationLevel,
          total_items: summary.total_items,
          packed_items_count: summary.packed_items_count,
          unpacked_items_count: summary.unpacked_items_count,
          total_weight: summary.total_weight,
          fill_rate_percent: summary.fill_rate_percent,
          result_payload: {
            truck,
            optimize_data: optimizationResult,
          },
        },
        { signal: controller.signal }
      );

      set({ lastSavedHash: resultPayloadHash });

      AppToast.historySaved(() => useAppStore.getState().setCurrentStep("history"));
      return true;
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.message === "canceled") return false;
      const errorMsg =
        err instanceof ApiError ? err.message : "Không thể lưu. Vui lòng thử lại.";
      set({ saveHistoryError: errorMsg });
      AppToast.historySaveFailed(errorMsg);
      return false;
    } finally {
      useAppStore.getState().hideLoading();
    }
  },

  hydrateFromHistory: (detail) => {
    // Delegate data về useCargoStore, navigate về step3 qua useAppStore
    Promise.all([import("./useCargoStore"), import("./useAppStore")]).then(
      ([{ useCargoStore }, { useAppStore }]) => {
        useCargoStore.getState().applyHistoryData(detail);
        set({ isHistoryMode: true });
        useAppStore.getState().setCurrentStep("step3");
      }
    );
  },

  resetHistoryState: () =>
    set({ isHistoryMode: false, lastSavedHash: null, saveHistoryError: null }),
}));
