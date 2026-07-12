/**
 * src/hooks/mutations/useOptimizeMutation.ts
 *
 * Custom hook bọc tác vụ tối ưu hóa xếp hàng (POST /optimize).
 * Sử dụng React Query useMutation để quản lý trạng thái loading/error.
 *
 * Tách ra khỏi useCargoStore vì đây là một tác vụ Async nặng với nhiều
 * side-effects (lưu kết quả vào Store, điều hướng sang Step 3).
 *
 * Lợi ích so với cách cũ (trong Zustand Store):
 * - Trạng thái `isPending` hiển thị trực tiếp trong React Query DevTools.
 * - Dễ dàng thêm retry, timeout sau này mà không cần động vào Store.
 * - Không cần lazy import để tránh Circular Dependency.
 */
import { useMutation } from "@tanstack/react-query";
import { runOptimization } from "@/services/optimizer.service";
import { useCargoStore } from "@/store/useCargoStore";
import { useAppStore } from "@/store/useAppStore";
import { buildPayloadHash } from "@/utils/payloadHash";
import { ApiError } from "@/services/api.types";
import { AppToast } from "@/utils/appToast";
import type { OptimizationPayload } from "@/services/api.types";

export function useOptimizeMutation() {
  return useMutation({
    mutationFn: async (payload: { payload: OptimizationPayload; signal?: AbortSignal }) => {
      // Defense-in-Depth: Double check validation before calling API
      const state = useCargoStore.getState();
      const validation = state.validateCargoRules();
      if (!validation.isValid) {
        throw new ApiError(validation.errors.join(" | "), "VALIDATION_ERROR");
      }
      return runOptimization(payload.payload, { signal: payload.signal });
    },

    onMutate: () => {
      // Bật Global Loading overlay ngay khi bắt đầu
      const controller = useAppStore
        .getState()
        .showLoading("Hệ thống đang tính toán phương án xếp hàng tối ưu...", true);
      return { controller };
    },

    onSuccess: (result, variables) => {
      // Lưu kết quả và hash cache vào Zustand Store
      const savedHash = buildPayloadHash(
        variables.payload.truck,
        variables.payload.items
      );
      useCargoStore.setState({
        optimizationResult: result,
        resultPayloadHash: savedHash,
        optimizationError: null,
      });
      // Điều hướng sang Step 3
      useAppStore.getState().setCurrentStep("step3");
    },

    onError: (err: any, _variables, context) => {
      if (err?.name === "CanceledError" || err?.message === "canceled") {
        AppToast.optimizeCancelled();
        return;
      }

      const errorMsg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";

      useCargoStore.setState({ optimizationError: errorMsg });
      AppToast.optimizationError(errorMsg);
      console.error("Optimize error:", err);
    },

    onSettled: (_data, _error, _variables, context) => {
      // Tắt loading overlay dù thành công hay thất bại
      useAppStore.getState().hideLoading();
    },
  });
}
