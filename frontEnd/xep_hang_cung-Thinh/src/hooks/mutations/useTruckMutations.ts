/**
 * src/hooks/mutations/useTruckMutations.ts
 *
 * Custom hooks bọc các tác vụ CRUD (Write) cho Xe Tải.
 * Sử dụng React Query useMutation để quản lý loading/error state,
 * và tự động invalidate cache của React Query khi thành công.
 *
 * Tách ra khỏi useCargoStore vì đây là Server State, không phải Client State.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTruck } from "@/services/trucks.service";
import { useCargoStore } from "@/store/useCargoStore";
import type { Truck } from "@/schemas";
import { AppToast } from "@/utils/appToast";

/**
 * Hook xóa xe đã lưu.
 * - Tự động clear xe đang được chọn nếu đó là xe bị xóa.
 * - Tự động invalidate query "truckLibrary" để UI cập nhật.
 */
export function useDeleteTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (truckId: string) => deleteTruck(truckId),
    onMutate: (truckId: string) => {
      // Optimistic: Nếu xe đang được chọn, clear nó ngay lập tức
      const cargoState = useCargoStore.getState();
      const previousTruck = cargoState.truck;
      if (cargoState.truck?.id === truckId && cargoState.truckMode === "preset") {
        useCargoStore.setState({ truck: null, truckMode: null });
      }
      // Trả về context để có thể rollback trong onError
      return { previousTruck };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["truckLibrary"] });
      AppToast.successDeleteTruck();
    },
    onError: (err, _truckId, context) => {
      // Rollback: khôi phục lại xe đã bị optimistic-clear nếu API lỗi
      if (context?.previousTruck) {
        useCargoStore.setState({
          truck: context.previousTruck,
          truckMode: "preset",
        });
      }
      console.error("Lỗi khi xóa xe tải:", err);
      AppToast.deleteTruckFailed();
    },
  });
}
