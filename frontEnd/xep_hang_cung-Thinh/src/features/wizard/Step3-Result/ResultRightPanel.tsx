/**
 * src/features/wizard/Step3-Result/ResultRightPanel.tsx
 *
 * Panel bên phải (col-span-1): Phân loại hàng hóa + Hướng dẫn + Export.
 * Theo Figma (node 64:1868): List product → Heading 2 → List_Step → Footer section.
 *
 * ARCHITECTURE (Rule 2 — ARCHITECTURE.md):
 * `result` data được lấy trực tiếp từ Store trong Leaf Components.
 * Props còn lại: sceneRef (lifecycle cha), currentStepIndex/onStepSelect (UI state cha).
 * fallbackResult chỉ truyền xuống Leaf khi isMockData.
 */
import { PackageCheck, PackageX } from "lucide-react";
import { ItemLegend } from "./ItemLegend";
import { StepGuideList } from "./StepGuideList";
import { ExportActions } from "./ExportActions";
import { useCargoStore } from "@/store/useCargoStore";
import type { OptimizationData } from "@/services/api.types";

interface ResultRightPanelProps {
  /** Null khi có data thật từ Store; non-null khi đang chạy mock mode */
  fallbackResult: OptimizationData | null;
  sceneRef: React.RefObject<HTMLDivElement | null>;
  currentStepIndex: number;
  onStepSelect: (index: number) => void;
}

export function ResultRightPanel({
  fallbackResult,
  sceneRef,
  currentStepIndex,
  onStepSelect,
}: ResultRightPanelProps) {
  const optimizationResult = useCargoStore((state) => state.optimizationResult);
  const getItemsCount = useCargoStore((state) => state.getItemsCount);

  // Lấy dữ liệu thống kê từ store
  const totalPackedItems = (optimizationResult ?? fallbackResult)?.summary.packed_items_count ?? getItemsCount();
  const totalItems = (optimizationResult ?? fallbackResult)?.summary.total_items ?? getItemsCount();
  const isFailed = totalPackedItems < totalItems;

  return (
    <div className="bg-background rounded-2xl border border-border-default shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-1px_rgba(0,0,0,0.03)] flex flex-col flex-1 min-h-[200px] lg:min-h-0 w-full overflow-hidden">
      {/* Header Section */}
      <div className="bg-background-secondary border-b border-border-default px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {isFailed ? (
            <PackageX className="w-4 h-4 text-destructive shrink-0" />
          ) : (
            <PackageCheck className="w-4 h-4 text-success-600 shrink-0" />
          )}
          <h2 className="font-bold text-sm text-text-primary">
            Hàng hóa đã xếp <span className={`text-xs font-semibold ml-1 ${isFailed ? "text-destructive" : "text-success-600"}`}>({totalPackedItems}/{totalItems} kiện)</span>
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-[17px] flex-1 min-h-0">
        {/* Phân loại hàng hóa */}
        <div className="flex flex-col shrink-0 max-h-[25%] min-h-[80px] overflow-y-auto border-b border-border-default pb-4">
          <ItemLegend fallbackResult={fallbackResult} />
        </div>

        {/* Hướng dẫn sắp xếp */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto pt-1">
          <StepGuideList
            fallbackResult={fallbackResult}
            currentStepIndex={currentStepIndex}
            onStepSelect={onStepSelect}
          />
        </div>
      </div>

      {/* Xuất báo cáo */}
      <div className="shrink-0 mt-2 p-[17px] pt-0">
        <ExportActions
          fallbackResult={fallbackResult}
          sceneRef={sceneRef}
        />
      </div>
    </div>
  );
}
