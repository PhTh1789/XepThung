/**
 * src/store/useAppStore.ts
 *
 * PILLAR 2 — UI & App State Store
 * Điều phối trạng thái giao diện: "Ứng dụng đang ở đâu? Đang làm gì?"
 *
 * Trách nhiệm:
 *   - Navigation (currentStep, nextStep, prevStep, processNextStep)
 *   - Modal Stack Manager (openModal, closeModal)
 *   - Global Loading Overlay (sáp nhập từ useLoadingStore — KHÔNG tạo file riêng)
 *
 * Cross-store (outbound only, 1 chiều):
 *   - processNextStep → đọc useCargoStore.getState()
 *   - processNextStep → đọc useAuthStore.getState()
 *
 * KHÔNG chứa: Auth identity, Cargo/Truck/Item data.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildPayloadHash } from "@/utils/payloadHash";
import { saveTruck } from "@/services/trucks.service";
import { AppToast } from "@/utils/appToast";

export type StepType = "home" | "step1" | "step2" | "step3" | "history";
export type ModalType = "roles" | "auth" | "settings" | "add_item";

const STEP_SEQUENCE: StepType[] = ["home", "step1", "step2", "step3"];

interface GlobalLoadingState {
  isActive: boolean;
  message: string;
  isCancelable: boolean;
  abortController: AbortController | null;
}

interface AppStore {
  // Navigation
  currentStep: StepType;
  // Modal Stack (LIFO)
  modalStack: ModalType[];
  // Global Loading (merged from useLoadingStore)
  globalLoading: GlobalLoadingState;
  /**
   * Signal counter để trigger useOptimizeMutation từ Step3-Result component.
   * Pattern: Signal Counter (React-idiomatic). Tăng giá trị = yêu cầu tối ưu mới.
   */
  optimizeSignal: number;

  // Navigation Actions
  setCurrentStep: (step: StepType) => void;
  nextStep: () => void;
  prevStep: () => void;
  /**
   * State Machine Controller: tự động quyết định luồng tiếp theo.
   * Universal Validation: Kiểm tra điều kiện và bắn toast tại đây.
   */
  goToStep: (targetStep?: StepType) => void;

  // Modal Actions
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  closeAllModals: () => void;

  // Global Loading Actions (replaces useLoadingStore)
  showLoading: (message?: string, isCancelable?: boolean) => AbortController;
  hideLoading: () => void;
  cancelLoading: () => void;

  // Reset navigation (không reset cargo)
  resetNavigation: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial State
  currentStep: "home",
  modalStack: [],
  optimizeSignal: 0,
  globalLoading: {
    isActive: false,
    message: "",
    isCancelable: false,
    abortController: null,
  },

  // --- Navigation Actions ---
  setCurrentStep: (step) => set({ currentStep: step, modalStack: [] }),

  nextStep: () =>
    set((state) => {
      const currentIndex = STEP_SEQUENCE.indexOf(state.currentStep);
      if (currentIndex < STEP_SEQUENCE.length - 1) {
        return { currentStep: STEP_SEQUENCE[currentIndex + 1] };
      }
      return state;
    }),

  prevStep: () =>
    set((state) => {
      const currentIndex = STEP_SEQUENCE.indexOf(state.currentStep);
      if (currentIndex > 0) {
        return { currentStep: STEP_SEQUENCE[currentIndex - 1] };
      }
      return state;
    }),

  goToStep: (targetStep?: StepType) => {
    const { currentStep } = get();
    // Lazy import để tránh circular dependency khi module load
    import("./useCargoStore").then(({ useCargoStore }) => {
      const cargoState = useCargoStore.getState();

      let destination = targetStep;
      if (!destination) {
        const currentIndex = STEP_SEQUENCE.indexOf(currentStep);
        if (currentIndex < STEP_SEQUENCE.length - 1) {
          destination = STEP_SEQUENCE[currentIndex + 1];
        } else {
          return;
        }
      }

      // 1. Guards for Step 2 and Step 3
      if (destination === "step2" || destination === "step3") {
        if (!cargoState.canContinueStep1()) {
          if (cargoState.truckMode === "custom") {
            cargoState.requestTruckFormValidation();
            AppToast.invalidTruckForm();
          } else {
            AppToast.missingTruckSelection();
          }
          return;
        }
      }

      // 2. Additional Guards for Step 3
      if (destination === "step3") {
        if (!cargoState.canContinueStep2()) {
          AppToast.missingCargoList();
          return;
        }

        const validation = cargoState.validateCargoRules();
        if (!validation.isValid) {
          AppToast.invalidCargo(validation.errors[0]);
          return;
        }
      }

      // 3. Side-effects when leaving Step 1
      if (currentStep === "step1" && destination !== "step1") {
        import("./useAuthStore").then(({ useAuthStore }) => {
          const { userRole } = useAuthStore.getState();
          if (
            userRole === "member" &&
            cargoState.savePreset &&
            cargoState.truckMode === "custom" &&
            cargoState.truck
          ) {
            const truckToSave = cargoState.truck;
            saveTruck({
              name: truckToSave.name,
              length: truckToSave.length,
              width: truckToSave.width,
              height: truckToSave.height,
              max_weight: truckToSave.max_weight,
            })
              .then(() => {
                AppToast.saveTruckSuccess(truckToSave.name);
                useCargoStore.getState().resetSavePreset();
                import("@/lib/react-query").then(({ queryClient }) => {
                  queryClient.invalidateQueries({ queryKey: ["truckLibrary"] });
                });
              })
              .catch(() => AppToast.saveTruckFailed());
          }
        });
      }

      // 4. Execution logic for Step 3 (Optimization)
      if (destination === "step3") {
        const currentHash = buildPayloadHash(cargoState.truck, cargoState.items);
        if (cargoState.optimizationResult && currentHash === cargoState.resultPayloadHash) {
          // Cache hit: Data chưa thay đổi, chuyển màn hình ngay
          set({ currentStep: "step3" });
          return;
        }
        // Cache miss: Emit signal để useOptimizeMutation trong Step3-Result tự trigger
        set({ currentStep: "step3", optimizeSignal: get().optimizeSignal + 1 });
        return;
      }

      // 5. Standard transition
      set({ currentStep: destination });
    });
  },

  // --- Modal Actions ---
  openModal: (modal) =>
    set((state) => ({ modalStack: [...state.modalStack, modal] })),
  closeModal: () =>
    set((state) => ({ modalStack: state.modalStack.slice(0, -1) })),
  closeAllModals: () => set({ modalStack: [] }),

  // --- Global Loading Actions ---
  showLoading: (message = "Đang xử lý dữ liệu...", isCancelable = false) => {
    // Nếu đang có task, abort trước
    const existing = get().globalLoading.abortController;
    if (existing) {
      existing.abort("Hủy tác vụ trước để bắt đầu tác vụ mới.");
    }
    const controller = new AbortController();
    set({
      globalLoading: { isActive: true, message, isCancelable, abortController: controller },
    });
    return controller;
  },

  hideLoading: () =>
    set({
      globalLoading: { isActive: false, message: "", isCancelable: false, abortController: null },
    }),

  cancelLoading: () => {
    const { abortController } = get().globalLoading;
    if (abortController) {
      abortController.abort("Hủy bởi người dùng.");
    }
    set({
      globalLoading: { isActive: false, message: "", isCancelable: false, abortController: null },
    });
  },

  resetNavigation: () => set({ currentStep: "home", modalStack: [] }),
    }),
    {
      name: "app-store-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ currentStep: state.currentStep }),
    }
  )
);
