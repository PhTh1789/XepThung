/**
 * src/hooks/mutations/useHistoryMutations.ts
 *
 * Custom hooks bọc các tác vụ Write cho module History.
 * Sử dụng React Query useMutation để quản lý loading/error state,
 * và tự động invalidate cache khi thao tác thành công.
 *
 * Pattern nhất quán với useTruckMutations.ts và useItemMutations.ts.
 *
 * Scope của file này: CHỈ deleteHistory.
 * saveHistory KHÔNG được migrate vào đây (Lựa chọn A) vì useHistoryStore.saveCurrentResult()
 * chứa business logic phức tạp (guard userRole, hash chống lưu trùng, cross-store reads)
 * không thể tách ra ngoài Zustand mà không gây breaking changes lớn.
 * Thay vào đó, useHistoryStore tự gọi queryClient.invalidateQueries sau khi save thành công.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteHistory } from "@/services/history.service";
import { AppToast } from "@/utils/appToast";

/**
 * Hook xóa một bản ghi lịch sử.
 * - Tự động invalidate query ["history", "list"] để UI cập nhật sau khi xóa.
 * - Toast thành công/lỗi được bắn tại hook-level (không cần xử lý ở call-site).
 *
 * ⚠️ QUAN TRỌNG: Call-site (HistoryPage.tsx) KHÔNG được bắn thêm toast nào cho delete.
 * Nếu cả hook-level và call-site đều có toast → double toast.
 */
export function useDeleteHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (historyId: string) => deleteHistory(historyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history", "list"] });
      AppToast.successDeleteHistory();
    },
    onError: () => AppToast.deleteHistoryFailed(),
  });
}
