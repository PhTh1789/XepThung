/**
 * src/hooks/queries/useHistoryList.ts
 *
 * Custom hook lấy danh sách lịch sử tối ưu hóa (có phân trang).
 * Sử dụng React Query useQuery để quản lý cache, retry, và loading state.
 *
 * Lợi ích so với fetch thủ công (useState/useEffect):
 * - Cache theo queryKey ["history", "list", page] → chuyển trang không gọi lại API.
 * - placeholderData: keepPreviousData → giữ data cũ khi chuyển trang, tránh nháy loading.
 * - Kế thừa retry: 3 từ queryClient global (hợp lý vì đây là fetch nền khi vào trang).
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getHistoryList } from "@/services/history.service";

export function useHistoryList(page: number, limit: number = 10) {
  return useQuery({
    queryKey: ["history", "list", page, limit],
    queryFn: () => getHistoryList(page, limit),
    // Giữ data cũ khi chuyển trang → không nháy toàn màn hình loading
    placeholderData: keepPreviousData,
  });
}
