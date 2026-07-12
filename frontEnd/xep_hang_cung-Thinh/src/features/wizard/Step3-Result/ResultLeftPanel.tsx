/**
 * src/features/wizard/Step3-Result/ResultLeftPanel.tsx
 *
 * Panel bên trái (col-span-2): 3D Canvas + Playback Controls.
 * Theo Figma: Title section → Visualization Area → Stepper Controls.
 *
 * ARCHITECTURE (Rule 2 — ARCHITECTURE.md):
 * Tự lấy optimizationResult & truck từ Store với Granular Selectors.
 * Props còn lại: sceneRef (lifecycle cha), currentStepIndex/onStepChange (UI state cha).
 * fallbackResult/fallbackTruck chỉ dùng khi isMockData (truyền từ cha).
 */
import { useState, useCallback } from "react";
import { View, Rotate3D, BarChart3, Box } from "lucide-react";
import { useCargoStore } from "@/store/useCargoStore";
import { TruckScene } from "@/components/3d/TruckScene";
import { PlaybackControls } from "./PlaybackControls";
import type { OptimizationData } from "@/services/api.types";
import type { Truck } from "@/schemas";

interface ResultLeftPanelProps {
  /** Null khi có data thật từ Store; non-null khi đang chạy mock mode */
  fallbackResult: OptimizationData | null;
  fallbackTruck: Truck | null;
  sceneRef: React.RefObject<HTMLDivElement | null>;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
}

export function ResultLeftPanel({
  fallbackResult,
  fallbackTruck,
  sceneRef,
  currentStepIndex,
  onStepChange,
}: ResultLeftPanelProps) {
  // Granular Selectors — Rule 4 (chỉ re-render khi data này thay đổi)
  const optimizationResult = useCargoStore((state) => state.optimizationResult);
  const truck = useCargoStore((state) => state.truck);

  // Ưu tiên data thật từ Store; fallback sang mock chỉ khi Store rỗng
  const result = optimizationResult ?? fallbackResult!;
  const currentTruck = truck ?? fallbackTruck!;

  const fillRate = result.summary.fill_rate_percent ?? 0;

  const [isInteractiveMode, setIsInteractiveMode] = useState(false);

  const maxStepIndex = result.packed_items.length - 1;

  const handleFirst = useCallback(() => onStepChange(0), [onStepChange]);
  const handlePrev = useCallback(
    () => onStepChange(Math.max(0, currentStepIndex - 1)),
    [currentStepIndex, onStepChange],
  );
  const handleNext = useCallback(
    () => onStepChange(Math.min(maxStepIndex, currentStepIndex + 1)),
    [currentStepIndex, maxStepIndex, onStepChange],
  );
  const handleLast = useCallback(
    () => onStepChange(maxStepIndex),
    [maxStepIndex, onStepChange],
  );

  return (
    <div className="bg-background rounded-2xl border border-border-default shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col flex-shrink-0 lg:h-full lg:min-h-0">
      {/* Title Section */}
      <div className="bg-background-secondary border-b border-border-default px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Box className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="font-bold text-base text-text-primary leading-[24px]">
            Kết quả sắp xếp
          </h2>
        </div>
        {/* Fill Rate */}
        <div className="flex items-center gap-2 truncate">
          <BarChart3 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-bold text-foreground whitespace-nowrap">
            <span className="hidden sm:inline mr-1 text-muted-foreground font-medium">
              Lấp đầy:
            </span>
            {fillRate}%
          </span>
          <div className="hidden md:block w-24 h-1.5 ml-2 bg-secondary rounded-full overflow-hidden relative">
            <div
              className="absolute left-0 top-0 bottom-0 bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${fillRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3D Canvas Area */}
      {/* TruckScene wrapper - fixed height mobile de PlaybackControls van visible */}
      <div className="relative h-[250px] sm:h-[300px] shrink-0 lg:flex-1 lg:h-auto lg:min-h-0 bg-background-secondary flex flex-col">
        {/* Toggle Interactive Mode (Floating) */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsInteractiveMode((v) => !v)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] font-medium shadow-sm backdrop-blur-md
              transition-all
              ${
                isInteractiveMode
                  ? "bg-primary text-white border-primary"
                  : "bg-background/80 border-border text-foreground hover:bg-background"
              }
            `}
            title={
              isInteractiveMode
                ? "Chuyển về chế độ xem tĩnh"
                : "Chuyển sang chế độ tương tác 3D"
            }
          >
            {isInteractiveMode ? (
              <View className="w-4 h-4" />
            ) : (
              <Rotate3D className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isInteractiveMode ? "Xem tĩnh" : "Tương tác 3D"}
            </span>
          </button>
        </div>
        <TruckScene
          ref={sceneRef}
          truck={currentTruck}
          packedItems={result.packed_items}
          currentStepIndex={currentStepIndex}
          isInteractiveMode={isInteractiveMode}
        />
      </div>

      {/* Playback Controls */}
      <div className="bg-background-secondary border-t border-border-default px-6 py-4 flex-shrink-0">
        <PlaybackControls
          currentStepIndex={currentStepIndex}
          maxStepIndex={maxStepIndex}
          onFirst={handleFirst}
          onPrev={handlePrev}
          onNext={handleNext}
          onLast={handleLast}
        />
      </div>
    </div>
  );
}
