import { useQuery } from "@tanstack/react-query";
import { getTruckPresets, getSavedTrucks } from "@/services/trucks.service";
import { useAuthStore } from "@/store/useAuthStore";
import type { Truck } from "@/schemas";

export function useTruckLibrary() {
  const userRole = useAuthStore((state) => state.userRole);

  return useQuery<Truck[]>({
    queryKey: ["truckLibrary", userRole],
    queryFn: async () => {
      // Dùng Promise.allSettled để 2 request chạy song song
      // và tách biệt lỗi: nếu getSavedTrucks() fail, preset vẫn hiển thị bình thường.
      const [presetsResult, savedResult] = await Promise.allSettled([
        getTruckPresets(),
        userRole === "member" ? getSavedTrucks() : Promise.resolve([] as Truck[]),
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
