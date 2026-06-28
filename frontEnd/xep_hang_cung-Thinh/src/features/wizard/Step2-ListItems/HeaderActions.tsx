import { Button } from "@/components/ui/Button";
import { PackageSearch, Plus, Zap, Gauge, BrainCircuit } from "lucide-react";
import { useCargoStore } from "@/store/useCargoStore";
import type { OptimizationLevel } from "@/store/useCargoStore";
import { useAuthStore } from "@/store/useAuthStore";
import { LIMITS } from "@/lib/constants";

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
  { value: "auto",  label: "Auto",  icon: <Gauge className="w-3.5 h-3.5" />,        memberOnly: false },
  { value: "fast",  label: "Nhanh", icon: <Zap className="w-3.5 h-3.5" />,          memberOnly: false },
  { value: "deep",  label: "Sâu",   icon: <BrainCircuit className="w-3.5 h-3.5" />, memberOnly: true  },
];

export function HeaderActions({ onAddClick }: HeaderActionsProps) {
  const userRole = useAuthStore((s) => s.userRole);
  const { optimizationLevel, setOptimizationLevel, items } = useCargoStore();
  const isDeepAllowed = userRole === "member";

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const isGuestLimitReached = userRole === "guest" && totalItems >= guestMaxItems;

  const handleLevelClick = (level: OptimizationLevel) => {
    // Guest khong duoc chon Deep — giu nguyen level hien tai
    if (level === "deep" && !isDeepAllowed) return;
    setOptimizationLevel(level);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
      {/* Title Group */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center bg-white border border-border shadow-sm rounded-lg p-2">
          <PackageSearch className="w-5 h-5 text-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Nhập danh sách hàng hóa</h2>
      </div>

      {/* Actions Group */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
        {/* Optimization Level Selector */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-full sm:w-auto justify-between sm:justify-start">
          {LEVEL_CONFIG.map(({ value, label, icon, memberOnly }) => {
            const isSelected = optimizationLevel === value;
            const isDisabled = memberOnly && !isDeepAllowed;

            return (
              <button
                key={value}
                onClick={() => handleLevelClick(value)}
                disabled={isDisabled}
                title={
                  isDisabled
                    ? "Chế độ Sâu chỉ dành cho Thành viên đã đăng nhập"
                    : value === "auto"
                    ? "Tự động chọn fast/deep phù hợp"
                    : value === "fast"
                    ? "Heuristic nhanh (~0.5s)"
                    : "Thuật toán di truyền, tối ưu hơn (3-10s)"
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold transition-all ${
                  isSelected
                    ? "bg-background text-primary shadow-sm border border-border"
                    : isDisabled
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60 cursor-pointer"
                }`}
              >
                {icon}
                <span>{label}</span>
                {/* Badge khoa cho Deep mode khi la Guest */}
                {isDisabled && (
                  <span className="text-[9px] leading-none bg-muted-foreground/20 text-muted-foreground/60 px-1 py-0.5 rounded font-bold">
                    Member
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Nut Them hang hoa */}
        <Button 
          variant="primary" 
          onClick={onAddClick} 
          disabled={isGuestLimitReached}
          title={isGuestLimitReached ? `Tài khoản Khách chỉ được thêm tối đa ${guestMaxItems} kiện hàng` : ""}
          className="gap-2 px-6 whitespace-nowrap w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Thêm hàng hóa
        </Button>
      </div>
    </div>
  );
}
