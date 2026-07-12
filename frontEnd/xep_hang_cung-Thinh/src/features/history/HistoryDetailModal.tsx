/**
 * src/features/history/HistoryDetailModal.tsx
 *
 * Modal hiển thị chi tiết một bản ghi lịch sử và nút "Xem lại 3D".
 * Khi user bấm "Xem lại 3D" → gọi hydrateFromHistory() → navigate Step 3.
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Loader2, Box, BarChart2, Package, PackageX, Truck, Calendar } from "lucide-react";
import { useHistoryStore } from "@/store/useHistoryStore";
import { getHistoryDetail } from "@/services/history.service";
import type { HistoryDetailData } from "@/services/api.types";
import { AppToast } from "@/utils/appToast";

interface HistoryDetailModalProps {
  historyId: string | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const LEVEL_LABEL: Record<string, string> = {
  auto: "Tự động (Auto)",
  fast: "Nhanh (Fast)",
  deep: "Sâu (Deep)",
};

export function HistoryDetailModal({ historyId, onClose }: HistoryDetailModalProps) {
  const [detail, setDetail] = useState<HistoryDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hydrateFromHistory = useHistoryStore((s) => s.hydrateFromHistory);

  // Fetch detail khi historyId thay đổi
  useEffect(() => {
    if (!historyId) {
      setDetail(null);
      return;
    }
    setIsLoading(true);
    getHistoryDetail(historyId)
      .then(setDetail)
      .catch(() => {
        AppToast.loadHistoryDetailFailed();
        onClose();
      })
      .finally(() => setIsLoading(false));
  }, [historyId, onClose]);

  const handleRestore = () => {
    if (!detail) return;
    hydrateFromHistory(detail);
    onClose();
    // hydrateFromHistory đã set currentStep = "step3" bên trong Store
  };

  const summary = detail?.result_payload?.optimize_data?.summary;

  return (
    <Dialog open={!!historyId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" />
            Chi tiết lịch sử
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {!isLoading && detail && (
          <div className="space-y-4">
            {/* Thông tin chung */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Xe tải</p>
                  <p className="font-semibold text-sm text-foreground">{detail.truck_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Thời gian</p>
                  <p className="font-semibold text-sm text-foreground">{formatDate(detail.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Chế độ tối ưu</p>
                  <p className="font-semibold text-sm text-foreground">
                    {LEVEL_LABEL[detail.optimization_level] ?? detail.optimization_level}
                  </p>
                </div>
              </div>
            </div>

            {/* Thống kê kết quả */}
            {summary && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <Package className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">
                    {summary.packed_items_count}
                    <span className="text-sm font-normal text-muted-foreground">/{summary.total_items}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">Kiện đã xếp</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <BarChart2 className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-primary">
                    {summary.fill_rate_percent.toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-muted-foreground">Tỉ lệ lấp đầy</p>
                </div>
                {summary.unpacked_items_count > 0 && (
                  <div className="col-span-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-center gap-2">
                    <PackageX className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive font-medium">
                      {summary.unpacked_items_count} kiện không vừa thùng xe
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="shrink-0 whitespace-nowrap">
            Đóng
          </Button>
          <Button
            variant="action"
            onClick={handleRestore}
            disabled={!detail || isLoading}
            className="shrink-0 whitespace-nowrap"
          >
            <Box className="w-4 h-4 mr-2" />
            Xem lại 3D
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
