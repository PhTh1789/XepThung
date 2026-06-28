/**
 * src/components/layout/AppFooter.tsx
 * Refactored to use 4-Pillar Architecture:
 *   - Navigation/Loading/Modal: useAppStore
 *   - History: useHistoryStore
 *   - Cargo selectors: useCargoStore
 */
import { useAppStore } from "@/store/useAppStore";
import { useCargoStore } from "@/store/useCargoStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ArrowLeft, Loader2, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppFooter() {
  // Granular Selectors — mỗi selector chỉ re-render khi đúng slice thay đổi
  const currentStep     = useAppStore((s) => s.currentStep);
  const goToStep        = useAppStore((s) => s.goToStep);
  const prevStep        = useAppStore((s) => s.prevStep);
  const setCurrentStep  = useAppStore((s) => s.setCurrentStep);
  const isActive        = useAppStore((s) => s.globalLoading.isActive);

  const canContinueStep1 = useCargoStore((s) => s.truck !== null);
  const canContinueStep2 = useCargoStore((s) => s.items.length > 0);

  const isHistoryMode    = useHistoryStore((s) => s.isHistoryMode);
  const saveCurrentResult = useHistoryStore((s) => s.saveCurrentResult);
  const lastSavedHash    = useHistoryStore((s) => s.lastSavedHash);

  const resultPayloadHash = useCargoStore((s) => s.resultPayloadHash);

  // Derived state: Trạng thái "Đã lưu" đồng bộ thời gian thực bằng Hash (Zero-State Overhead)
  const isSaved = resultPayloadHash !== null && resultPayloadHash === lastSavedHash;

  if (currentStep === "home" || currentStep === "history") return null;

  // Tính trạng thái disabled dựa trên selectors của Store
  const isNextDisabled =
    (currentStep === "step1" && !canContinueStep1) ||
    (currentStep === "step2" && (!canContinueStep2 || isActive));

  /**
   * Smart Click Handler:
   * Delegate toàn bộ validation và chuyển bước cho Store.
   */
  const handleNextClick = () => {
    goToStep();
  };

  /** Handler nút "Quay lại":
   * - History Mode: về trang History (không về Step 2 trống rỗng).
   * - Normal Mode: về bước trước bình thường.
   */
  const handlePrevClick = () => {
    if (isHistoryMode) {
      setCurrentStep("history");
    } else {
      prevStep();
    }
  };

  /** Handler nút "Lưu kết quả" ở Step 3. */
  const handleSaveResult = async () => {
    await saveCurrentResult();
  };

  return (
    <div className="sticky bottom-0 z-50 w-full bg-[#f9f9fc] border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.05)] h-[var(--footer-h)] flex items-center shrink-0">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-1.5 sm:py-2 flex flex-row items-center justify-between gap-4">

        <Button
          variant="outline"
          onClick={handlePrevClick}
          className="flex-1 max-w-[160px] sm:flex-none sm:w-auto sm:max-w-none h-10 sm:h-11 text-[14px] sm:text-[15px] px-4 sm:px-6 rounded-[10px]"
        >
          <ArrowLeft className="w-4 h-4 sm:mr-2" />
          <span className="inline">{isHistoryMode ? "Lịch sử" : "Quay Lại"}</span>
        </Button>

        {currentStep !== "step3" ? (
          <Button
            variant="action"
            rightIcon={isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight />}
            onClick={handleNextClick}
            aria-disabled={isNextDisabled}
            className={cn(
              "flex-1 max-w-[160px] sm:flex-none sm:w-auto sm:max-w-none transition-opacity h-10 sm:h-11 text-[14px] sm:text-[15px] px-6 sm:px-8 rounded-[10px]",
              isNextDisabled && !isActive && "opacity-50 cursor-not-allowed"
            )}
          >
            {isActive ? "Đang xử lý..." : "Tiếp tục"}
          </Button>
        ) : isHistoryMode ? (
          <div className="hidden sm:block flex-1 sm:flex-none w-[160px]" />
        ) : isSaved ? (
          <Button
            variant="outline"
            disabled
            className="flex-1 max-w-[200px] sm:flex-none sm:w-auto sm:max-w-none h-10 sm:h-11 text-[14px] sm:text-[15px] px-6 sm:px-8 rounded-[10px] text-success-700 border-success-300 bg-success-50 cursor-default"
            title="Trạng thái hệ thống"
          >
            <Check className="w-4 h-4 mr-2" />
            Đã lưu
          </Button>
        ) : (
          <Button
            variant="action"
            onClick={handleSaveResult}
            disabled={isActive}
            className="flex-1 max-w-[200px] sm:flex-none sm:w-auto sm:max-w-none h-10 sm:h-11 text-[14px] sm:text-[15px] px-6 sm:px-8 rounded-[10px]"
          >
            {isActive ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Lưu kết quả</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
