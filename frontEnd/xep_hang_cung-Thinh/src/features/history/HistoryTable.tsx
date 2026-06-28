/**
 * src/features/history/HistoryTable.tsx
 *
 * Bảng hiển thị danh sách lịch sử tối ưu hóa của User.
 * Nhận data từ HistoryPage qua props.
 */
import { useState } from "react";
import { Eye, Package, BarChart2, Trash2, Loader2 } from "lucide-react";
import type { HistoryRecord } from "@/services/api.types";
import { AlertDialog } from "@/components/ui/AlertDialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";

interface HistoryTableProps {
  records: HistoryRecord[];
  onViewDetail: (historyId: string) => void;
  onDelete: (historyId: string) => void;
  deletingId: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const LEVEL_LABEL: Record<string, { label: string; color: string }> = {
  auto: { label: "Tự động", color: "bg-info-50 text-info-700" },
  fast: { label: "Nhanh", color: "bg-emerald-100 text-emerald-700" },
  deep: { label: "Sâu", color: "bg-violet-100 text-violet-700" },
};

export function HistoryTable({ records, onViewDetail, onDelete, deletingId }: HistoryTableProps) {
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState<HistoryRecord | null>(null);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <Package className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Chưa có lịch sử nào</p>
          <p className="text-sm text-muted-foreground mt-1">
            Thực hiện tối ưu hóa và lưu kết quả để xem lại tại đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table Layout */}
      <div className="hidden md:block">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px] font-bold text-muted-foreground whitespace-nowrap">Ngày tạo</TableHead>
            <TableHead className="font-bold text-muted-foreground whitespace-nowrap">Xe tải</TableHead>
            <TableHead className="text-center font-bold text-muted-foreground whitespace-nowrap">Kiện hàng</TableHead>
            <TableHead className="text-center font-bold text-muted-foreground whitespace-nowrap">Lấp đầy</TableHead>
            <TableHead className="text-center font-bold text-muted-foreground whitespace-nowrap">Chế độ</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const level = LEVEL_LABEL[record.optimization_level] ?? { label: record.optimization_level, color: "bg-muted text-foreground" };
            return (
              <TableRow key={record.history_id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDate(record.created_at)}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {record.truck_name}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 justify-center">
                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                    {record.total_items}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 font-semibold text-primary justify-center">
                    <BarChart2 className="w-3.5 h-3.5" />
                    {record.fill_rate_percent.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${level.color}`}>
                    {level.label}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewDetail(record.history_id.toString())}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      disabled={deletingId === record.history_id}
                      title="Xem lại"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteRecord(record)}
                      disabled={deletingId === record.history_id}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                      title="Xóa lịch sử này"
                    >
                      {deletingId === record.history_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout */}
      <div className="flex md:hidden flex-col gap-3 p-4">
        {records.map((record) => {
          const level = LEVEL_LABEL[record.optimization_level] ?? { label: record.optimization_level, color: "bg-muted text-foreground" };
          return (
            <div key={record.history_id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-medium">{formatDate(record.created_at)}</span>
                  <span className="font-bold text-foreground text-sm">{record.truck_name}</span>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${level.color}`}>
                  {level.label}
                </span>
              </div>
              
              <div className="flex items-center gap-4 py-3 border-y border-border-default/50">
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs text-muted-foreground">Kiện hàng</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    {record.total_items}
                  </span>
                </div>
                <div className="w-[1px] h-8 bg-border-default/50" />
                <div className="flex flex-col gap-1 flex-1 pl-2">
                  <span className="text-xs text-muted-foreground">Lấp đầy</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <BarChart2 className="w-4 h-4" />
                    {record.fill_rate_percent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => onViewDetail(record.history_id.toString())}
                  disabled={deletingId === record.history_id}
                  className="flex items-center justify-center h-9 px-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Xem lại
                </button>
                <button
                  onClick={() => setConfirmDeleteRecord(record)}
                  disabled={deletingId === record.history_id}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-50"
                >
                  {deletingId === record.history_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {confirmDeleteRecord && (
        <AlertDialog
          open={!!confirmDeleteRecord}
          onOpenChange={(open) => {
            if (!open) setConfirmDeleteRecord(null);
          }}
          title="Xóa lịch sử"
          description={`Bạn có chắc chắn muốn xóa lịch sử xếp hàng cho xe "${confirmDeleteRecord.truck_name}" lúc ${formatDate(confirmDeleteRecord.created_at)}? Hành động này không thể hoàn tác.`}
          onConfirm={() => {
            if (confirmDeleteRecord.history_id) {
              onDelete(confirmDeleteRecord.history_id);
            }
          }}
          variant="danger"
          confirmLabel="Xóa"
        />
      )}
    </>
  );
}
