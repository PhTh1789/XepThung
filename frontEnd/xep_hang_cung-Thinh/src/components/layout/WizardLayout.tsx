import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useCargoStore } from "@/store/useCargoStore";
import { toast } from "sonner";
import { Stepper } from "@/components/ui/Stepper";
import { Step1SelectTruck } from "@/features/wizard/Step1-SelectTruck/Step1-SelectTruck";
import { Step2ListItems } from "@/features/wizard/Step2-ListItems/Step2-ListItems";
import { Step3Result } from "@/features/wizard/Step3-Result/Step3-Result";
import { AppFooter } from "@/components/layout/AppFooter";

export function WizardLayout() {
  const currentStep      = useAppStore((state) => state.currentStep);
  const setCurrentStep   = useAppStore((state) => state.setCurrentStep);
  const canContinueStep1 = useCargoStore((state) => state.canContinueStep1);

  // [Case C - Route Guard]: Ngan user truy cap truc tiep vao Step 2, Step 3 ma chua co Truck
  useEffect(() => {
    if ((currentStep === "step2" || currentStep === "step3") && !canContinueStep1()) {
      toast.error("Vui lòng chọn xe tải trước", {
        description: "Hệ thống bị mất phiên làm việc hoặc chưa cấu hình xe tải.",
      });
      setCurrentStep("step1");
    }
  }, [currentStep, canContinueStep1, setCurrentStep]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-var(--header-h))] overflow-hidden w-full relative bg-muted/20">
      <div className="max-w-[1280px] w-full mx-auto flex flex-col flex-1 min-h-0 relative px-4 sm:px-10">
        
        {/* 1. Stepper luôn hiển thị cố định (KHÔNG bị cuộn mất) */}
        <div className="w-full shrink-0 pt-4 pb-4">
          <Stepper />
        </div>

        {/* 2. Step Content Area (Động theo Step) */}
        <div className={`
          flex flex-col flex-1 min-h-0 gap-4 pb-4
          ${currentStep === "step1" ? "overflow-y-auto" : ""}
          ${currentStep === "step2" ? "overflow-y-auto [scrollbar-gutter:stable]" : ""}
          ${currentStep === "step3" ? "overflow-hidden" : ""}
        `}>
          {currentStep === "step1" && (
            <div className="bg-background rounded-2xl border border-border shadow-sm p-4 sm:p-[var(--wizard-content-px)] flex flex-col flex-grow shrink-0">
              <Step1SelectTruck />
            </div>
          )}

          {currentStep === "step2" && (
            <div className="bg-background rounded-2xl border border-border shadow-sm p-4 sm:p-[var(--wizard-content-px)] flex flex-col flex-grow shrink-0">
              <Step2ListItems />
            </div>
          )}

          {currentStep === "step3" && (
            <div className="flex flex-col flex-grow min-h-0 h-full">
              <Step3Result />
            </div>
          )}
        </div>
      </div>
      
      <AppFooter />
    </div>
  );
}
