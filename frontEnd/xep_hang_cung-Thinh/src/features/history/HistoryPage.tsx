/**
 * src/features/history/HistoryPage.tsx
 *
 * Trang chính hiển thị lịch sử tối ưu hóa của User.
 *
 * ARCHITECTURE:
 * - Local state (không vào Store): data history có vòng đời ngắn, chỉ sống trong trang này.
 * - Pagination: local `currentPage` + `meta` từ API.
 * - Khi user bấm "Xem lại" → mở HistoryDetailModal → fetch detail → hydrateFromHistory().
 */
import { useState, useEffect, useCallback } from "react";
import { History, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { getHistoryList, deleteHistory } from "@/services/history.service";
import { HistoryTable } from "./HistoryTable";
import { HistoryDetailModal } from "./HistoryDetailModal";
import type { HistoryRecord, PaginationMeta } from "@/services/api.types";
import { Loader2 } from "lucide-react";
import { AppToast } from "@/utils/appToast";

const PAGE_SIZE = 10;

export function HistoryPage() {
  const userRole  = useAuthStore((s) => s.userRole);
  const openModal = useAppStore((s) => s.openModal);

  const [records, setRecords]         = useState<HistoryRecord[]>([]);
  const [meta, setMeta]               = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  const fetchHistory = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getHistoryList(page, PAGE_SIZE);
      setRecords(data.records);
      setMeta(data.meta);
    } catch {
      AppToast.loadHistoryFailed();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDelete = async (historyId: string) => {
    setDeletingId(historyId);
    try {
      await deleteHistory(historyId);
      AppToast.successDeleteHistory();
      
      // Nếu xóa thành công mà trang hiện tại hết data và không phải trang 1, lùi 1 trang.
      // Nếu không, refetch trang hiện tại.
      if (records.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        await fetchHistory(currentPage);
      }
    } catch {
      AppToast.deleteHistoryFailed();
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    // Chỉ fetch khi đã đăng nhập
    if (userRole === "member") {
      fetchHistory(currentPage);
    }
  }, [userRole, currentPage, fetchHistory]);

  // Guard: Guest chưa đăng nhập
  if (userRole !== "member") {
    return (
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-10 py-2 sm:py-3 flex flex-col gap-2 sm:gap-3">
        <div className="bg-background rounded-[24px] border border-border shadow-sm p-8 flex flex-col items-center justify-center gap-4 min-h-[320px] text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <History className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">Đăng nhập để xem lịch sử</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Lịch sử tối ưu hóa chỉ dành cho tài khoản thành viên.
            </p>
          </div>
          <button
            onClick={() => openModal("auth")}
            className="mt-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-10 py-2 sm:py-3 flex flex-col flex-1 min-h-0 gap-2 sm:gap-3">
        <div className="bg-background rounded-[24px] border border-border shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header — flex-shrink-0 để không bao giờ bị nén khi Card co lại */}
          <div className="bg-background-secondary border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center bg-white border border-border shadow-sm rounded-lg p-2">
                <History className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-2xl text-foreground leading-tight">Lịch sử xếp hàng</h2>
                {meta && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {meta.total_records} bản ghi
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => fetchHistory(currentPage)}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50 shrink-0"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Content - Scrollable Zone: flex-1 min-h-0 để chiếm đúng phần còn lại */}
          <div className="flex-1 min-h-0 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <HistoryTable
                records={records}
                onViewDetail={setSelectedId}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            )}
          </div>

          {/* Pagination — flex-shrink-0, chốt cứng đáy Card, ngoài vùng cuộn */}
          {meta && meta.total_pages > 1 && (
            <div className="border-t border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
              <p className="text-sm text-muted-foreground">
                Trang {meta.current_page} / {meta.total_pages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1 || isLoading}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(meta.total_pages, p + 1))}
                  disabled={meta.current_page >= meta.total_pages || isLoading}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <HistoryDetailModal
        historyId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
