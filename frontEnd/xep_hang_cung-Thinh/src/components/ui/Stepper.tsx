import { useAppStore } from "@/store/useAppStore";
import type { StepType } from "@/store/useAppStore";
import { Truck, PackageOpen, Box } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper() {
  const currentStep = useAppStore((s) => s.currentStep);
  const goToStep = useAppStore((s) => s.goToStep);

  // Đánh chỉ mục (Index) để xử lý logic gọn gàng hơn
  const stepOrder: Record<string, number> = {
    step1: 1,
    step2: 2,
    step3: 3,
  };
  const currentIndex = stepOrder[currentStep] || 0;

  const isStep1 = currentIndex >= 1;
  const isStep2 = currentIndex >= 2;
  const isStep3 = currentIndex >= 3;

  // Helper quản lý hiển thị Text linh hoạt (Responsive Logic)
  const getTextClass = (stepNum: number) => {
    return cn(
      "font-bold uppercase text-[13px] md:text-[14px] leading-[24px] whitespace-nowrap transition-colors",
      // Ưu tiên hiển thị: Chỉ hiện chữ ở bước hiện tại trên Mobile. Desktop luôn hiện chữ.
      currentIndex === stepNum
        ? "block truncate max-w-[120px]"
        : "hidden md:block",
      currentIndex >= stepNum ? "text-primary" : "text-muted-foreground",
    );
  };

  // Hàm xử lý Click điều hướng qua Store (Single Source of Truth)
  const handleStepClick = (targetStep: StepType) => {
    if (currentStep === targetStep) return; // Bỏ qua nếu đang ở chính step đó
    goToStep(targetStep);
  };

  // Helper tính class cho nút bấm (Visual Feedback)
  const getButtonClass = () => {
    return "flex items-center gap-1.5 md:gap-2 p-1 shrink min-w-0 cursor-pointer hover:bg-muted/50 transition-colors rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary";
  };

  return (
    <div className="bg-card border border-border shadow-sm rounded-xl flex flex-col items-center justify-center px-3 md:px-6 py-1.5 relative w-full max-w-[1248px] mx-auto">
      <div className="w-full max-w-[944px] flex items-center justify-center gap-[4px] md:gap-[8px] relative overflow-hidden">
        <button
          type="button"
          onClick={() => handleStepClick("step1")}
          className={getButtonClass()}
        >
          <div
            className={cn(
              "relative shrink-0 size-6 flex items-center justify-center rounded-full transition-colors",
              isStep1 ? "bg-primary/10" : "bg-muted",
            )}
          >
            <Truck
              className={cn(
                "size-3.5 transition-colors",
                isStep1 ? "text-primary" : "text-muted-foreground",
              )}
              strokeWidth={2.5}
            />
          </div>
          <div className={getTextClass(1)}>Chọn xe</div>
        </button>

        {/* Horizontal Divider 1 */}
        <div
          className={cn(
            "flex-1 h-[2px] min-w-[12px] md:min-w-[20px] transition-colors duration-300",
            isStep2 ? "bg-primary" : "bg-border",
          )}
        />

        {/* Step 2: Nhập Hàng */}
        <button
          type="button"
          onClick={() => handleStepClick("step2")}
          className={getButtonClass()}
        >
          <div
            className={cn(
              "relative shrink-0 size-6 flex items-center justify-center rounded-full transition-colors",
              isStep2 ? "bg-primary/10" : "bg-muted",
            )}
          >
            <PackageOpen
              className={cn(
                "size-3.5 transition-colors",
                isStep2 ? "text-primary" : "text-muted-foreground",
              )}
              strokeWidth={2.5}
            />
          </div>
          <div className={getTextClass(2)}>Nhập hàng</div>
        </button>

        {/* Horizontal Divider 2 */}
        <div
          className={cn(
            "flex-1 h-[2px] min-w-[12px] md:min-w-[20px] transition-colors duration-300",
            isStep3 ? "bg-primary" : "bg-border",
          )}
        />

        {/* Step 3: Kết Quả */}
        <button
          type="button"
          onClick={() => handleStepClick("step3")}
          className={getButtonClass()}
        >
          <div
            className={cn(
              "relative shrink-0 size-6 flex items-center justify-center rounded-full transition-colors",
              isStep3 ? "bg-primary/10" : "bg-muted",
            )}
          >
            <Box
              className={cn(
                "size-3.5 transition-colors",
                isStep3 ? "text-primary" : "text-muted-foreground",
              )}
              strokeWidth={2.5}
            />
          </div>
          <div className={getTextClass(3)}>Kết quả</div>
        </button>
      </div>
    </div>
  );
}
