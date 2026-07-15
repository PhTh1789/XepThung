import { Button } from "@/components/ui/Button";
import { PackageSearch, Plus, Zap, Gauge, BrainCircuit } from "lucide-react";
import { useCargoStore } from "@/store/useCargoStore";
import type { OptimizationLevel } from "@/store/useCargoStore";
import { useAuthStore } from "@/store/useAuthStore";
import { LIMITS } from "@/lib/constants";
import { AppToast } from "@/utils/appToast";

const { guestMaxItems } = LIMITS;

interface HeaderActionsProps {
  onAddClick: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cau hinh hien thi cho tung Optimization Level
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL_CONFIG: {
  value: OptimizationLevel;
  label: string;
  icon: React.ReactNode;
  memberOnly: boolean;
}[] = [
  {
    value: "auto",
    label: "Auto",
    icon: <Gauge className="w-3.5 h-3.5" />,
    memberOnly: false,
  },
  {
    value: "fast",
    label: "Nhanh",
    icon: <Zap className="w-3.5 h-3.5" />,
    memberOnly: false,
  },
  {
    value: "deep",
    label: "Sâu",
    icon: <BrainCircuit className="w-3.5 h-3.5" />,
    memberOnly: true,
  },
];

export function HeaderActions({ onAddClick }: HeaderActionsProps) {
  const userRole = useAuthStore((s) => s.userRole);
  const { optimizationLevel, setOptimizationLevel, items } = useCargoStore();
  const isDeepAllowed = userRole === "member";

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const isGuestLimitReached =
    userRole === "guest" && totalItems >= guestMaxItems;

  // const handleLevelClick = (level: OptimizationLevel) => {
  //   // Guest khong duoc chon Deep — giu nguyen level hien tai
  //   if (level === "deep" && !isDeepAllowed) return;
  //   setOptimizationLevel(level);
  // };

  const handleLevelClick = (level: OptimizationLevel) => {
    setOptimizationLevel(level);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
      {/* Title Group */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center bg-white border border-border shadow-sm rounded-lg p-1.5">
          <PackageSearch className="w-4 h-4 text-foreground" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          Nhập danh sách hàng hóa
        </h2>
      </div>

      {/* Actions Group */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
        {/* Optimization Level Selector */}
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 w-full sm:w-auto justify-between sm:justify-start">
          {LEVEL_CONFIG.map(({ value, label, icon, memberOnly }) => {
            const isSelected = optimizationLevel === value;
            const isDisabled = memberOnly && !isDeepAllowed;

            return (
              <button
                key={value}
                onClick={() => handleLevelClick(value)}
                aria-disabled={isDisabled}
                title={
                  isDisabled
                    ? "Chế độ Sâu chỉ dành cho Thành viên đã đăng nhập"
                    : value === "auto"
                      ? "Tự động chọn fast/deep phù hợp"
                      : value === "fast"
                        ? "Heuristic nhanh (~0.5s)"
                        : "Thuật toán di truyền, tối ưu hơn (3-10s)"
                }
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                  isSelected
                    ? "bg-background text-primary shadow-sm border border-border"
                    : isDisabled
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60 cursor-pointer"
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Nut Them hang hoa */}
        <Button
          variant="primary"
          onClick={(e) => {
            if (isGuestLimitReached) {
              e.preventDefault();
              AppToast.guestLimitExceeded(guestMaxItems);
              return;
            }
            onAddClick();
          }}
          aria-disabled={isGuestLimitReached}
          className={`gap-1.5 px-4 py-1.5 text-sm whitespace-nowrap w-full sm:w-auto h-8 ${
            isGuestLimitReached ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Plus className="w-4 h-4" />
          Thêm hàng hóa
        </Button>
      </div>
    </div>
  );
}
