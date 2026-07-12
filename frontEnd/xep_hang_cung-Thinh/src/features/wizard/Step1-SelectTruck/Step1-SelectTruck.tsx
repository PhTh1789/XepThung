import { useEffect } from "react";
import { useCargoStore } from "@/store/useCargoStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTruckLibrary } from "@/hooks/queries/useTruckLibrary";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Button } from "@/components/ui/Button";
import { TruckForm } from "./TruckForm";
import { TruckCard } from "./TruckCard";
import { Truck as TruckIcon, Loader2 } from "lucide-react";

export function Step1SelectTruck() {
  const truck = useCargoStore((state) => state.truck);
  const truckMode = useCargoStore((state) => state.truckMode);
  const selectPresetTruck = useCargoStore((state) => state.selectPresetTruck);
  const activateCustomTruckMode = useCargoStore(
    (state) => state.activateCustomTruckMode,
  );

  const userRole = useAuthStore((s) => s.userRole);
  const { data: truckLibrary = [], isLoading, isError, refetch } = useTruckLibrary();

  return (
    <div className="flex flex-col w-full max-w-[1280px] mx-auto">
      {/* Section Header */}
      <div className=" flex flex-col items-start w-full bg-background/85 backdrop-blur-xl pb-4 pt-3 sm:pt-4 border-b border-border rounded-t-2xl">
        <div className="flex items-center gap-2">
          <TruckIcon className="w-[26px] h-[19px] text-foreground" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-[32px] md:leading-[40px]">
            Chọn xe tải của bạn
          </h2>
        </div>

        <p className="text-[16px] font-normal text-muted-foreground mt-2">
          Chọn mẫu xe có sẵn hoặc nhập kích thước thùng xe của bạn để bắt đầu mô
          phỏng xếp hàng.
        </p>

        <p className="text-[16px] font-normal text-foreground mt-1">
          <strong className="text-primary">!!! Lưu ý:</strong> Khuyến khích nhập
          kích thước lọt lòng của thùng xe để kết quả được chính xác hơn.
        </p>
      </div>

      {/* Zone A: TruckForm — nằm ngoài grid card */}
      <div className="w-full max-w-3xl mx-auto pt-4 flex justify-center">
        <TruckForm
          isSelected={truckMode === "custom"}
          onActivate={activateCustomTruckMode}
        />
      </div>

      {/* Zone B: Grid các TruckCard — đồng bộ equal-height */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 lg:grid-cols-4 gap-4 w-full pt-3 items-star">
        {truckLibrary.length === 0 ? (
          <div className="flex items-center justify-center col-span-full h-[200px] text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Đang tải danh sách xe...</span>
          </div>
        ) : (
          truckLibrary.map((preset) => (
            <TruckCard
              key={preset.id}
              truck={preset}
              isSelected={truckMode === "preset" && truck?.id === preset.id}
              onSelect={() => selectPresetTruck(preset)}
            />
          ))
        )}
      </div>
    </div>
  );
}
