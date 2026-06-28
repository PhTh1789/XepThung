import type { Truck } from "@/schemas";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useCargoStore } from "@/store/useCargoStore";
import { formatLength, formatWeight, calculateVolumeM3 } from "@/utils/unitConverter";
import { Truck as TruckIcon, Trash2 } from "lucide-react";
import { AlertDialog } from "@/components/ui/AlertDialog";

interface TruckCardProps {
  truck: Truck;
  isSelected: boolean;
  onSelect: (truck: Truck) => void;
}

export function TruckCard({ truck, isSelected, onSelect }: TruckCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { settings, removeSavedTruck } = useCargoStore();

  useEffect(() => {
    // Vì đang dùng Cách 2 (placeholder DOM tĩnh), ta tắt skeleton ngay.
    // Nếu chuyển sang Cách 1, hãy comment dòng này lại.
    setImageLoaded(true);
  }, []);

  // Volume calculation in m3
  const volumeCubicMeters = calculateVolumeM3(truck.length, truck.width, truck.height).toFixed(1);

  return (
    <>
      <button
        onClick={() => onSelect(truck)}
        className={cn(
          "group flex flex-col items-start gap-4 w-full h-auto rounded-[24px] p-4 transition-all duration-300 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 relative",
          isSelected
            ? "bg-primary/10 border-2 border-primary shadow-selected"
            : "bg-card border border-border hover:-translate-y-1 hover:shadow-md"
        )}
      >
        {/* Delete Button (Only for User Saved Trucks) */}
        {!truck.is_preset && truck.id && (
          <div
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-70 group-hover:opacity-100 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            title="Xóa xe tải này"
          >
            <Trash2 className="w-[18px] h-[18px]" />
          </div>
        )}

        {/* Truck Image Container */}
        <div className="relative w-full flex-1 min-h-[100px] bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center mix-blend-multiply py-4">
        {/* Skeleton Loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse rounded-xl" />
        )}
        
        {/* Image */}
        <div 
          className={cn(
            "w-full h-full flex items-center justify-center transition-opacity duration-300", 
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        >
          {/* CÁCH 1: Dùng ảnh thật với fallback bằng State (Đã comment) */}
          {/* 
          <img
            src={hasError ? `https://via.placeholder.com/400x300?text=${encodeURIComponent(truck.name)}` : "http://localhost:3845/assets/525b7a858736075566c2467e4653a8774baa74aa.png"}
            alt={truck.name}
            className="w-full h-full object-contain scale-[1.3] -translate-y-4"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              if (!hasError) setHasError(true);
            }}
          />
          */}

          {/* CÁCH 2: Dùng trực tiếp placeholder UI tĩnh (Active mặc định) */}
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
            <TruckIcon className="w-12 h-12 mb-2" />
            <span className="font-bold text-center px-4 leading-tight text-[13px]">
              {truck.name}
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="w-full text-center shrink-0 mt-2">
        <h3 className="font-bold text-[18px] sm:text-[20px] leading-6 text-foreground line-clamp-1 px-2">
          {truck.name}
        </h3>
      </div>

      {/* Details */}
      <div className="w-full flex flex-col pb-2 shrink-0">
        <div className="flex flex-wrap justify-between items-center border-b border-border py-1.5 gap-x-2">
          <span className="font-medium text-[16px] text-muted-foreground">
            Kích thước:
          </span>
          <span className="font-bold text-[16px] text-foreground text-right">
            {formatLength(truck.length, settings.length_unit)} x {formatLength(truck.width, settings.length_unit)} x {formatLength(truck.height, settings.length_unit)} {settings.length_unit}
          </span>
        </div>
        <div className="flex flex-wrap justify-between items-center py-1.5 gap-x-2 border-b border-transparent">
          <span className="font-medium text-[16px] text-muted-foreground">
            Thể tích:
          </span>
          <span className="font-bold text-[16px] text-foreground text-right">
            ~{volumeCubicMeters} m³
          </span>
        </div>
        <div className="flex flex-wrap justify-between items-center py-1.5 gap-x-2 mt-1">
          <span className="font-medium text-[16px] text-muted-foreground">
            Tải trọng:
          </span>
          <span className="font-bold text-[16px] text-primary text-right">
            {formatWeight(truck.max_weight, settings.weight_unit)} {settings.weight_unit}
          </span>
        </div>
      </div>
    </button>
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Xóa xe tải"
        description={`Bạn có chắc chắn muốn xóa "${truck.name}" ra khỏi thư viện? Hành động này không thể hoàn tác.`}
        onConfirm={() => {
          if (truck.id) {
            removeSavedTruck(truck.id);
          }
        }}
        variant="danger"
        confirmLabel="Xóa"
      />
    </>
  );
}
