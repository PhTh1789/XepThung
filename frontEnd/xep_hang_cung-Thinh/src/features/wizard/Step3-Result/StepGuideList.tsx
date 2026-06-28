/**
 * src/features/wizard/Step3-Result/StepGuideList.tsx
 *
 * Danh sách hướng dẫn xếp hàng từng bước.
 * - Item active (currentStep): bg primary, text trắng, inset shadow.
 * - Item chưa đến: bg section, border default.
 * - Auto-scroll đến item active.
 *
 * ARCHITECTURE (Rule 2 — ARCHITECTURE.md):
 * Tự lấy optimizationResult từ Store với Granular Selector.
 * fallbackResult chỉ dùng khi Store chưa có data (mock mode).
 * Props còn lại: currentStepIndex, onStepSelect (UI state của cha).
 */
import { useRef, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { useCargoStore } from "@/store/useCargoStore";
import type { OptimizationData } from "@/services/api.types";

interface StepGuideListProps {
  /** Null khi có data thật từ Store; non-null khi đang chạy mock mode */
  fallbackResult: OptimizationData | null;
  currentStepIndex: number;
  onStepSelect: (index: number) => void;
}

export function StepGuideList({
  fallbackResult,
  currentStepIndex,
  onStepSelect,
}: StepGuideListProps) {
  // Granular Selector — Rule 4
  const optimizationResult = useCargoStore(state => state.optimizationResult);
  const packedItems = (optimizationResult ?? fallbackResult)?.packed_items ?? [];

  // Sort theo step_sequence
  const sortedItems = [...packedItems].sort(
    (a, b) => a.step_sequence - b.step_sequence
  );

  const listRef   = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll đến item active khi currentStepIndex thay đổi
  useEffect(() => {
    if (activeRef.current && listRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentStepIndex]);

  return (
    <div className="flex flex-col gap-3 w-full flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border-default">
        <BookOpen className="w-[18px] h-[18px] text-text-primary flex-shrink-0" />
        <h3 className="font-bold text-[16px] text-text-primary leading-[24px]">
          Hướng dẫn sắp xếp hàng hóa
        </h3>
      </div>

      {/* Scrollable list */}
      <div
        ref={listRef}
        className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0 pr-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {sortedItems.map((item, index) => {
          const isActive    = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const { x, y, z } = item.coordinates;

          return (
            <button
              key={item.id}
              ref={isActive ? activeRef : null}
              onClick={() => onStepSelect(index)}
              className={`
                flex items-start gap-3 p-[11px] rounded-xl border text-left w-full
                transition-all duration-200 active:scale-[0.98]
                ${
                  isActive
                    ? "bg-primary border-primary shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                    : isCompleted
                    ? "bg-background-secondary border-border-default opacity-70"
                    : "bg-background-secondary border-border-default hover:border-primary/40 hover:bg-primary/5"
                }
              `}
            >
              {/* Step number */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <span
                  className={`
                    font-black text-[24px] leading-[32px] tabular-nums
                    ${isActive ? "text-white" : "text-text-primary"}
                  `}
                >
                  {item.step_sequence}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`
                    font-bold text-[16px] leading-[24px] truncate
                    ${isActive ? "text-white" : "text-text-primary"}
                  `}
                >
                  Đặt {item.name}
                </p>
                <p
                  className={`
                    font-normal text-[12px] leading-[16px] truncate
                    ${isActive ? "text-white/80" : "text-text-secondary"}
                  `}
                >
                  Vị trí: ({Math.round(x)}, {Math.round(y)}, {Math.round(z)}) cm
                  {item.is_rotated ? " · Đã xoay" : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
