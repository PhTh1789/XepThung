import { useMemo } from "react";
import { AlertTriangle, Truck, Package } from "lucide-react";
import { useCargoStore } from "@/store/useCargoStore";
import { formatWeight, formatLength } from "@/utils/unitConverter";
import { cn } from "@/lib/utils";

export function Step2Summary() {
  const truck    = useCargoStore(state => state.truck);
  const items    = useCargoStore(state => state.items);
  const settings = useCargoStore(state => state.settings);

  const { totalPhysicalItems, totalWeight, isOverweight } = useMemo(() => {
    const weight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
    return {
      totalPhysicalItems : items.reduce((sum, item) => sum + item.quantity, 0),
      totalWeight        : weight,
      isOverweight: truck !== null && weight > truck.max_weight,
    };
  }, [items, truck]);

  return (
    <div className="flex flex-row items-center justify-between gap-3 w-full">
      {/* Cột Trái: Thông tin xe tải */}
      <div className="flex items-center gap-2 truncate">
        <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-sm font-bold text-foreground truncate">
          {truck?.name || "Chưa chọn xe"}
        </span>
        {truck && (
          <span className="hidden sm:inline text-xs font-medium text-muted-foreground ml-1 truncate">
            ({formatLength(truck.length, settings.length_unit)}x{formatLength(truck.width, settings.length_unit)}x{formatLength(truck.height, settings.length_unit)} {settings.length_unit})
          </span>
        )}
      </div>

      {/* Cột Phải: Thống kê kiện hàng */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-sm font-bold text-foreground">
            {totalPhysicalItems} <span className="hidden sm:inline text-xs text-muted-foreground font-medium">kiện</span>
          </span>
        </div>
        
        <div className="w-[1px] h-4 bg-border" />
        
        <div className={cn("flex items-center gap-1.5", isOverweight ? "text-destructive" : "text-foreground")}>
          {isOverweight && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          <span className="text-sm font-bold whitespace-nowrap">
            {formatWeight(totalWeight, settings.weight_unit, settings.decimal_separator)}
            {truck && (
              <span className={cn("text-xs font-medium ml-1", isOverweight ? "text-destructive/70" : "text-muted-foreground")}>
                / {formatWeight(truck.max_weight, settings.weight_unit, settings.decimal_separator)} {settings.weight_unit}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
