import { X, Check } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAppStore } from "@/store/useAppStore";
import { useCargoStore } from "@/store/useCargoStore";

export function ModalSettings() {
  const { modalStack, closeModal } = useAppStore();
  const { settings, setSettings } = useCargoStore();
  const isOpen = modalStack.includes("settings");

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] gap-6 border bg-background p-4 sm:p-6 shadow-2xl duration-200 sm:rounded-2xl">
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <Dialog.Title className="text-2xl font-bold leading-none tracking-tight text-foreground">
              Cài đặt hệ thống
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Tùy chỉnh đơn vị hiển thị trên giao diện. Dữ liệu tính toán gốc vẫn được giữ nguyên.
            </Dialog.Description>
          </div>

          <div className="flex flex-col gap-8 py-2">
            {/* Chiều dài */}
            <div className="flex flex-col gap-4">
              <label className="text-base font-bold text-foreground">Đơn vị chiều dài</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSettings({ length_unit: "cm" })}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all overflow-hidden ${
                    settings.length_unit === "cm"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  <span className="font-bold text-lg mb-1">Centimet</span>
                  <span className="text-sm opacity-80">(cm)</span>
                  {settings.length_unit === "cm" && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ length_unit: "m" })}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all overflow-hidden ${
                    settings.length_unit === "m"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  <span className="font-bold text-lg mb-1">Mét</span>
                  <span className="text-sm opacity-80">(m)</span>
                  {settings.length_unit === "m" && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Khối lượng */}
            <div className="flex flex-col gap-4">
              <label className="text-base font-bold text-foreground">Đơn vị khối lượng</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSettings({ weight_unit: "kg" })}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all overflow-hidden ${
                    settings.weight_unit === "kg"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  <span className="font-bold text-lg mb-1">Kilogram</span>
                  <span className="text-sm opacity-80">(kg)</span>
                  {settings.weight_unit === "kg" && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ weight_unit: "tấn" })}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all overflow-hidden ${
                    settings.weight_unit === "tấn"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  <span className="font-bold text-lg mb-1">Tấn</span>
                  <span className="text-sm opacity-80">(tấn)</span>
                  {settings.weight_unit === "tấn" && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Dung sai tải trọng */}
            <div className="flex flex-col gap-4">
              <label className="text-base font-bold text-foreground">Biên độ xếp hàng (Khoảng hở)</label>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Khít 100%</span>
                  <span className="font-bold text-primary">{settings.load_margin}%</span>
                  <span className="text-muted-foreground">Rộng rãi (15%)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={settings.load_margin}
                  onChange={(e) => setSettings({ load_margin: Number(e.target.value) })}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mô phỏng khoảng trống thực tế để tay người/xe nâng xếp hàng (Mặc định: 5%).
                </p>
              </div>
            </div>
          </div>

          <Dialog.Close asChild>
            <button className="absolute right-5 top-5 rounded-full p-1 opacity-70 transition-opacity hover:bg-muted hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <X className="h-5 w-5 text-foreground" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
