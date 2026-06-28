/**
 * src/features/wizard/Step3-Result/PlaybackControls.tsx
 *
 * 4 nút điều hướng Step-by-Step theo Figma (node 61:1601):
 * [|◄ First] [◄ BƯỚC TRƯỚC] [BƯỚC SAU ►] [►| Last]
 */
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PlaybackControlsProps {
  currentStepIndex: number;
  maxStepIndex: number;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
}

export function PlaybackControls({
  currentStepIndex,
  maxStepIndex,
  onFirst,
  onPrev,
  onNext,
  onLast,
}: PlaybackControlsProps) {
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === maxStepIndex;

  const btnBase =
    "flex items-center gap-2 px-4 py-1.5 min-h-[44px] rounded-lg border-2 border-primary text-primary font-bold text-xs uppercase tracking-[0.35px] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/5 active:scale-95";

  const btnIcon =
    "flex items-center justify-center w-[44px] h-[44px] min-h-[44px] shrink-0 rounded-lg border-2 border-primary text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/5 active:scale-95";

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {/* First */}
      <button
        onClick={onFirst}
        disabled={isFirst}
        className={btnIcon}
        title="Bước đầu tiên"
        aria-label="Bước đầu tiên"
      >
        <ChevronsLeft className="w-5 h-5" />
      </button>

      {/* Prev */}
      <button
        onClick={onPrev}
        disabled={isFirst}
        className={btnBase}
        aria-label="Bước trước"
      >
        <ChevronLeft className="w-[10px] h-[10px]" />
        <span className="hidden sm:inline">Bước Trước</span>
      </button>

      {/* Step indicator */}
      <span className="text-sm font-medium text-muted-foreground tabular-nums min-w-[60px] text-center">
        {currentStepIndex + 1} / {maxStepIndex + 1}
      </span>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={isLast}
        className={btnBase}
        aria-label="Bước sau"
      >
        <span className="hidden sm:inline">Bước Sau</span>
        <ChevronRight className="w-[10px] h-[10px]" />
      </button>

      {/* Last */}
      <button
        onClick={onLast}
        disabled={isLast}
        className={btnIcon}
        title="Bước cuối cùng"
        aria-label="Bước cuối cùng"
      >
        <ChevronsRight className="w-5 h-5" />
      </button>
    </div>
  );
}
