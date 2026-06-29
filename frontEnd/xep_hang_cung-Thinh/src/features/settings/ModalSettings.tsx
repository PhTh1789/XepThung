import { Check } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useCargoStore } from "@/store/useCargoStore";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ModalSettings() {
  const { modalStack, closeModal } = useAppStore();
  const { settings, setSettings } = useCargoStore();

  const isOpen = modalStack.includes("settings");

  // Hàm xử lý đóng modal an toàn
  const handleOpenChange = (open: boolean) => {
    if (!open) closeModal();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Header - Đồng bộ với AddItemModal */}
        <div className="flex flex-col gap-1 mb-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            Cài đặt hệ thống
          </DialogTitle>
          {/* <p className="text-[13px] text-muted-foreground">
            Tùy chỉnh đơn vị hiển thị trên giao diện. Dữ liệu tính toán gốc vẫn
            được giữ nguyên.
          </p> */}
        </div>

        {/* Khối nội dung - Cuộn mượt mà như AddItemModal */}
        <div className="flex flex-col gap-6 py-2 overflow-y-auto max-h-[65vh] sm:max-h-[75vh] p-1 pr-2 -mr-2">
          {/* Chiều dài */}
          <div className="flex flex-col gap-3">
            <label className="text-[14px] font-bold text-foreground">
              Đơn vị chiều dài
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSettings({ length_unit: "cm" })}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all overflow-hidden",
                  settings.length_unit === "cm"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted",
                )}
              >
                <span className="font-bold text-[15px] mb-0.5">Centimet</span>
                <span className="text-xs opacity-80">(cm)</span>
                {settings.length_unit === "cm" && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSettings({ length_unit: "m" })}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all overflow-hidden",
                  settings.length_unit === "m"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted",
                )}
              >
                <span className="font-bold text-[15px] mb-0.5">Mét</span>
                <span className="text-xs opacity-80">(m)</span>
                {settings.length_unit === "m" && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Khối lượng */}
          <div className="flex flex-col gap-3">
            <label className="text-[14px] font-bold text-foreground">
              Đơn vị khối lượng
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSettings({ weight_unit: "kg" })}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all overflow-hidden",
                  settings.weight_unit === "kg"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted",
                )}
              >
                <span className="font-bold text-[15px] mb-0.5">Kilogram</span>
                <span className="text-xs opacity-80">(kg)</span>
                {settings.weight_unit === "kg" && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSettings({ weight_unit: "tấn" })}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all overflow-hidden",
                  settings.weight_unit === "tấn"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted",
                )}
              >
                <span className="font-bold text-[15px] mb-0.5">Tấn</span>
                <span className="text-xs opacity-80">(tấn)</span>
                {settings.weight_unit === "tấn" && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Dung sai tải trọng */}
          <div className="flex flex-col gap-3">
            <label className="text-[14px] font-bold text-foreground">
              Biên độ xếp hàng (Khoảng hở)
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Khít 100%</span>
                <span className="font-bold text-primary">
                  {settings.load_margin}%
                </span>
                <span className="text-muted-foreground">Rộng rãi (15%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={settings.load_margin}
                onChange={(e) =>
                  setSettings({ load_margin: Number(e.target.value) })
                }
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mô phỏng khoảng trống thực tế để tay người/xe nâng xếp hàng (Mặc
                định: 5%).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-4 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={closeModal}
            className="shrink-0 whitespace-nowrap"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={closeModal}
            className="w-full sm:w-auto px-8"
          >
            Lưu cài đặt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
