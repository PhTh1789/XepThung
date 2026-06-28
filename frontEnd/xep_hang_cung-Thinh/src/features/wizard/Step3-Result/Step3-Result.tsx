/**
 * src/features/wizard/Step3-Result/Step3-Result.tsx
 *
 * Root Smart Component cho Step 3.
 * Đọc optimizationResult từ Store (Single Source of Truth).
 * Fallback sang MOCK_OPTIMIZATION_RESULT khi chưa có data thật (dev/demo).
 *
 * Layout: Bento Grid 3 cột theo Figma (node 61:1594).
 * - Left Panel (col-span-2): 3D Canvas + Playback
 * - Right Panel (col-span-1): Legend + Guide + Export
 *
 * NOTE: Step3 KHÔNG dùng wrapper card (p-4/p-6) như Step1 & Step2.
 * WizardLayout.tsx xử lý Step3 riêng (không wrap vào card).
 *
 * ARCHITECTURE: Result/Truck data KHÔNG còn được truyền qua props.
 * Các Panel tự kết nối Store theo Rule 2 (ARCHITECTURE.md).
 * Props còn lại chỉ là UI State thuộc về component này: sceneRef, currentStepIndex, onStepChange.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { AlertCircle, History, RotateCcw } from "lucide-react";
import { useCargoStore } from "@/store/useCargoStore";
import { useAppStore } from "@/store/useAppStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { ResultLeftPanel } from "./ResultLeftPanel";
import { ResultRightPanel } from "./ResultRightPanel";
import { MOCK_OPTIMIZATION_RESULT } from "./mock/mockOptimizationResult";

// Đặt ngoài component để tránh tạo object mới mỗi lần render (Smell 6 fix)
const MOCK_TRUCK = {
  id: "mock",
  name: "Xe mô phỏng",
  length: 4500,
  width: 2100,
  height: 2100,
  max_weight: 1500000,
} as const;

export function Step3Result() {
  // Granular Selectors
  const optimizationResult = useCargoStore(state => state.optimizationResult);
  const optimizationError  = useCargoStore(state => state.optimizationError);
  const resetSession       = useCargoStore(state => state.resetSession);

  const setCurrentStep     = useAppStore(state => state.setCurrentStep);
  const goToStep           = useAppStore(state => state.goToStep);

  const isHistoryMode      = useHistoryStore(state => state.isHistoryMode);
  const resetHistoryState  = useHistoryStore(state => state.resetHistoryState);
  
  const optimizeCargo      = useCargoStore(state => state.optimizeCargo);
  const canContinueStep1   = useCargoStore(state => state.canContinueStep1);
  const canContinueStep2   = useCargoStore(state => state.canContinueStep2);

  const hasAttemptedRecovery = useRef(false);

  useEffect(() => {
    // Smart Recovery (Background Re-fetch)
    if (!optimizationResult && !isHistoryMode && !hasAttemptedRecovery.current) {
      hasAttemptedRecovery.current = true;
      if (canContinueStep1() && canContinueStep2()) {
        // Input hợp lệ, tự động gọi API tính toán lại
        optimizeCargo();
      } else {
        // Graceful Downgrade: Mất input, lùi về step 2
        import("sonner").then(({ toast }) => {
          toast.error("Phiên làm việc không hoàn chỉnh", {
            description: "Dữ liệu xếp hàng bị mất. Vui lòng cấu hình lại.",
          });
        });
        goToStep("step2");
      }
    }
  }, [
    optimizationResult,
    isHistoryMode,
    canContinueStep1,
    canContinueStep2,
    optimizeCargo,
    goToStep,
  ]);

  // Fallback mock khi chưa có data thật (dev mode / demo)
  const isMockData = !optimizationResult;

  // Shared UI state: step hiện tại (điều khiển cả 3D và StepGuideList)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const handleStepChange = useCallback((index: number) => setCurrentStepIndex(index), []);

  const [activeTab, setActiveTab] = useState<"3d" | "details">("3d");

  // Ref cho html2canvas (truyền từ LeftPanel → ExportActions qua props — lifecycle thuộc về đây)
  const sceneRef = useRef<HTMLDivElement>(null);
  // --- Error State ---
  if (optimizationError && !optimizationResult) {
    return (
      <div className="bg-background rounded-2xl border border-destructive/30 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="font-bold text-[18px] text-text-primary mb-2">
              Không thể tối ưu hóa
            </h3>
            <p className="text-sm text-text-secondary">{optimizationError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* History mode banner */}
      {isHistoryMode && (
        <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-[13px] text-text-secondary">
              <span className="font-semibold text-primary">Chế độ xem lại:</span>
              {" "}Bạn đang xem lại kết quả từ lịch sử. Nút "Quay lại" sẽ đưa bạn về trang Lịch sử.
            </p>
          </div>
          <button
            onClick={() => { resetSession(); resetHistoryState(); setCurrentStep("step1"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border text-[12px] font-semibold text-foreground hover:bg-muted transition-colors flex-shrink-0 ml-4"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Phiên mới
          </button>
        </div>
      )}

      {/* Mock data notice bar */}
      {isMockData && (
        <div className="bg-secondary/10 border border-secondary/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
          <p className="text-[13px] text-text-secondary">
            <span className="font-semibold text-text-primary">Chế độ xem trước:</span>
            {" "}Đang hiển thị dữ liệu mô phỏng. Hãy chạy tối ưu hóa để xem kết quả thật.
          </p>
        </div>
      )}

      {/* Mobile Tabs */}
      <div className="flex lg:hidden bg-muted p-1 rounded-lg shrink-0 mb-1 border border-border">
        <button 
          onClick={() => setActiveTab("3d")} 
          className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-all ${activeTab === '3d' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Mô hình 3D
        </button>
        <button 
          onClick={() => setActiveTab("details")} 
          className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-all ${activeTab === 'details' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Chi tiết
        </button>
      </div>

      {/* Bento Grid Layout — 3 cột theo Figma */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-4 lg:gap-6 flex-grow min-h-0 h-full overflow-hidden">
        {/* Left Panel: col-span-2 */}
        <div className={`flex-col flex-shrink-0 lg:flex-1 lg:min-h-0 lg:h-full ${activeTab === '3d' ? 'flex' : 'hidden lg:flex'}`}>
          <ResultLeftPanel
            fallbackResult={isMockData ? MOCK_OPTIMIZATION_RESULT : null}
            fallbackTruck={isMockData ? MOCK_TRUCK : null}
            sceneRef={sceneRef}
            currentStepIndex={currentStepIndex}
            onStepChange={handleStepChange}
          />
        </div>

        {/* Right Panel: col-span-1 */}
        <div className={`flex-1 min-h-0 flex-col overflow-hidden lg:h-full ${activeTab === 'details' ? 'flex' : 'hidden lg:flex'}`}>
          <ResultRightPanel
            fallbackResult={isMockData ? MOCK_OPTIMIZATION_RESULT : null}
            sceneRef={sceneRef}
            currentStepIndex={currentStepIndex}
            onStepSelect={handleStepChange}
          />
        </div>
      </div>
    </div>
  );
}
