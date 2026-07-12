import { useQuery } from "@tanstack/react-query";
import { getItemPresets, getSavedItems } from "@/services/items.service";
import { useAuthStore } from "@/store/useAuthStore";
import type { Item } from "@/schemas";

export function useItemLibrary() {
  const userRole = useAuthStore((state) => state.userRole);

  return useQuery<Item[]>({
    queryKey: ["itemLibrary", userRole],
    queryFn: async () => {
      // Dùng Promise.allSettled để 2 request chạy song song
      // và tách biệt lỗi: nếu getSavedItems() fail, preset vẫn hiển thị bình thường.
      const [presetsResult, savedResult] = await Promise.allSettled([
        getItemPresets(),
        userRole === "member" ? getSavedItems() : Promise.resolve([] as Item[]),
      ]);

      const presets =
        presetsResult.status === "fulfilled"
          ? presetsResult.value.map((p) => ({ ...p, is_preset: true }))
          : [];

      const saved =
        savedResult.status === "fulfilled"
          ? savedResult.value.map((s) => ({ ...s, is_preset: false }))
          : [];

      return [...saved, ...presets];
    },
  });
}
