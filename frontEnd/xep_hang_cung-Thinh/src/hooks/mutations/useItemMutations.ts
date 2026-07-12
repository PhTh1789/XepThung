/**
 * src/hooks/mutations/useItemMutations.ts
 *
 * Custom hooks bọc các tác vụ CRUD (Write) cho Kiện Hàng.
 * Sử dụng React Query useMutation để quản lý loading/error state,
 * và tự động invalidate cache của React Query khi thành công.
 *
 * Tách ra khỏi useCargoStore vì đây là Server State, không phải Client State.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveItem, deleteItem } from "@/services/items.service";
import type { Item } from "@/schemas";
import { AppToast } from "@/utils/appToast";

/** Payload để lưu kiện hàng — không bao gồm `id` và `quantity`. */
type SavedItemPayload = Omit<Item, "id" | "quantity">;

/**
 * Hook lưu một kiện hàng vào thư viện của User.
 * - Tự động invalidate query "itemLibrary" để UI cập nhật.
 */
export function useSaveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemPayload: SavedItemPayload) => saveItem(itemPayload),
    onSuccess: (savedItem) => {
      queryClient.invalidateQueries({ queryKey: ["itemLibrary"] });
      AppToast.successSave(savedItem.name ?? "");
    },
    onError: (err) => {
      console.error("Lỗi khi lưu kiện hàng vào thư viện:", err);
      AppToast.apiError();
    },
  });
}

/**
 * Hook xóa một kiện hàng đã lưu.
 * - Tự động invalidate query "itemLibrary" để UI cập nhật.
 */
export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itemLibrary"] });
      AppToast.successDeleteItem();
    },
    onError: (err) => {
      console.error("Lỗi khi xóa kiện hàng:", err);
      AppToast.deleteItemFailed();
    },
  });
}
