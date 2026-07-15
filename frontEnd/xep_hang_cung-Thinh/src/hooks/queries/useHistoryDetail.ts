/**
 * src/hooks/queries/useHistoryDetail.ts
 *
 * Custom hook lấy chi tiết một bản ghi lịch sử để Restore 3D.
 * Sử dụng React Query useQuery với enabled: !!historyId để không fetch khi modal đóng.
 *
 * Trade-offs được cân nhắc kỹ:
 * - staleTime: Infinity → 1 bản ghi lịch sử là immutable (không bao giờ thay đổi sau khi tạo).
 *   Mở lại modal cùng ID trong cùng 1 phiên không gọi lại API.
 * - retry: 1 (override global retry:3) → Modal đang hiển thị spinner và chờ user.
 *   Nếu API thật sự lỗi, fail sau ~2 giây thay vì 7 giây (7s gây cảm giác app bị đơ).
 *   Giữ retry:3 cho useHistoryList vì đó là fetch nền, chịu được cold-start của Render.
 */
import { useQuery } from "@tanstack/react-query";
import { getHistoryDetail } from "@/services/history.service";

export function useHistoryDetail(historyId: string | null) {
  return useQuery({
    queryKey: ["history", "detail", historyId],
    queryFn: () => getHistoryDetail(historyId as string),
    // Không fetch khi modal đóng (historyId = null)
    enabled: !!historyId,
    // Lịch sử là immutable → không bao giờ stale, không cần refetch
    staleTime: Infinity,
    // ⚠️ Override global retry:3 — modal đang chờ user tương tác, fail nhanh hơn (~2s)
    retry: 1,
  });
}
