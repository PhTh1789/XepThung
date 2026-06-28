import { useAppStore } from "@/store/useAppStore";
import { HomePage } from "@/features/home/HomePage";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { HistoryPage } from "@/features/history/HistoryPage";

export function MainContent() {
  const { currentStep } = useAppStore();

  return (
    <main className="flex-1 w-full relative flex flex-col min-h-0 overflow-y-auto">
      {currentStep === "home" && <HomePage />}
      {currentStep === "history" && <HistoryPage />}
      {["step1", "step2", "step3"].includes(currentStep) && <WizardLayout />}
    </main>
  );
}
