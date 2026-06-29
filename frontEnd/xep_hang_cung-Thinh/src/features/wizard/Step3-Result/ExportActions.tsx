/**
 * src/features/wizard/Step3-Result/ExportActions.tsx
 *
 * 3 nút xuất báo cáo từ Figma (node 64:1894):
 * - Xuất hình ảnh: html2canvas → PNG download
 * - Xuất file PDF: jspdf → PDF download
 * - Chia sẻ: Copy link kết quả (Placeholder — TODO Phase 4)
 *
 * ARCHITECTURE (Rule 2 — ARCHITECTURE.md):
 * Tự lấy optimizationResult & truck từ Store với Granular Selectors.
 * fallbackResult chỉ dùng khi Store chưa có data (mock mode).
 * Props còn lại: sceneRef (lifecycle thuộc về cha).
 *
 * TODO (Phase 4 — Share Feature):
 * - Khi user click "Chia sẻ", gọi API POST /share để tạo share token.
 * - Copy link dạng: https://domain/result/{shareToken}
 * - Khi mở link: nếu user chưa đăng nhập → xem dạng tĩnh (Static 3D mode only).
 * - Phân quyền: member share → người xem Guest chỉ thấy readonly, không thể optimize lại.
 */
import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useCargoStore } from "@/store/useCargoStore";
import type { OptimizationData } from "@/services/api.types";

interface ExportActionsProps {
  /** Ref trỏ vào DOM bao quanh TruckScene để html2canvas chụp */
  sceneRef: React.RefObject<HTMLDivElement | null>;
  /** Null khi có data thật từ Store; non-null khi đang chạy mock mode */
  fallbackResult: OptimizationData | null;
}

export function ExportActions({ sceneRef, fallbackResult }: ExportActionsProps) {
  // Granular Selectors — Rule 4
  const optimizationResult = useCargoStore(state => state.optimizationResult);
  const truck              = useCargoStore(state => state.truck);

  const result   = optimizationResult ?? fallbackResult;
  const truckName = truck?.name ?? "xe-tai";
  const summary  = result?.summary;

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!sceneRef.current || !summary) return;
    setIsExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF }       = await import("jspdf");

      const canvas = await html2canvas(sceneRef.current, {
        backgroundColor: "#f9f9fc",
        useCORS: true,
        scale: 2,
      });

      const pdf    = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW  = pdf.internal.pageSize.getWidth();
      const pageH  = pdf.internal.pageSize.getHeight();
      const margin = 15;

      // Tiêu đề
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("Kết Quả Xếp Hàng — Xếp Thùng", margin, margin + 5);

      // Thông số tóm tắt
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const summaryY = margin + 14;
      pdf.text(`Xe tải: ${truckName}`, margin, summaryY);
      pdf.text(`Đã xếp: ${summary.packed_items_count} / ${summary.total_items} kiện`, margin + 60, summaryY);
      pdf.text(`Tỷ lệ lấp đầy: ${summary.fill_rate_percent}%`, margin + 130, summaryY);
      pdf.text(`Tổng khối lượng: ${summary.total_weight} kg`, margin + 200, summaryY);

      // Ảnh 3D
      const imgData  = canvas.toDataURL("image/png");
      const imgW     = pageW - margin * 2;
      const imgH     = (canvas.height / canvas.width) * imgW;
      const imgY     = summaryY + 8;
      const maxImgH  = pageH - imgY - margin;
      pdf.addImage(imgData, "PNG", margin, imgY, imgW, Math.min(imgH, maxImgH));

      pdf.save(`xep-hang-${truckName}-${Date.now()}.pdf`);
      toast.success("Đã xuất PDF thành công!");
    } catch {
      toast.error("Không thể xuất PDF. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    // TODO (Phase 4): Gọi API POST /share để tạo share token, sau đó copy link.
    // Logic phân quyền khi mở link:
    //   - User chưa đăng nhập → Static mode only, không optimize lại.
    //   - Guest → readonly view.
    //   - Member → full view (nếu được cấp quyền từ người chia sẻ).
    toast.info("Tính năng chia sẻ sẽ sớm ra mắt!", {
      description: "Bạn sẽ có thể copy link để chia sẻ kết quả xếp hàng.",
    });
  };

  const btnClass = `
    flex items-center gap-1.5 px-2.5 py-2 h-10 rounded-xl border border-border-default
    bg-background-secondary text-text-primary font-bold text-[12px] leading-[16px]
    transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap pt-3 border-t border-border-default">
      <button
        onClick={handleExportPDF}
        disabled={isExporting || !summary}
        className={btnClass}
        aria-label="Tải xuống"
      >
        <Download className="w-4 h-4 flex-shrink-0" />
        <span>Tải xuống</span>
      </button>

      <button
        onClick={handleShare}
        className={btnClass}
        aria-label="Chia sẻ kết quả"
        title="Tính năng chia sẻ — sắp ra mắt"
      >
        <Share2 className="w-4 h-4 flex-shrink-0" />
        <span>Chia sẻ</span>
      </button>
    </div>
  );
}
