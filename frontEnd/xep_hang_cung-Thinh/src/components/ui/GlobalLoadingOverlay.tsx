import { Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function GlobalLoadingOverlay() {
  const { isActive, message, isCancelable } = useAppStore((s) => s.globalLoading);
  const cancelLoading = useAppStore((s) => s.cancelLoading);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-6 shadow-sm rounded-full bg-background" />
      <p className="text-foreground font-medium text-xl px-6 text-center max-w-md drop-shadow-sm mb-6">
        {message}
      </p>

      {isCancelable && (
        <button
          onClick={cancelLoading}
          className="px-6 py-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors font-semibold rounded-xl"
        >
          Hủy tác vụ
        </button>
      )}
    </div>
  );
}
