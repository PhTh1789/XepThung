/**
 * src/features/wizard/Step3-Result/ItemLegend.tsx
 *
 * Phân loại hàng hóa — chú giải màu sắc.
 * Deduplicate packed_items theo tên để hiển thị legend.
 * Màu: dùng item.color từ BE (đã được lưu sẵn trong Store/Mock).
 *
 * ARCHITECTURE (Rule 2 — ARCHITECTURE.md):
 * Tự lấy optimizationResult từ Store với Granular Selector.
 * fallbackResult chỉ dùng khi Store chưa có data (mock mode).
 */
import { useCargoStore } from "@/store/useCargoStore";
import type { OptimizationData } from "@/services/api.types";

interface ItemLegendProps {
  /** Null khi có data thật từ Store; non-null khi đang chạy mock mode */
  fallbackResult: OptimizationData | null;
}

export function ItemLegend({ fallbackResult }: ItemLegendProps) {
  // Granular Selector — Rule 4
  const optimizationResult = useCargoStore((state) => state.optimizationResult);
  const items = useCargoStore((state) => state.items);

  const result = optimizationResult ?? fallbackResult;
  const packedItems = result?.packed_items ?? [];
  const unpackedItems = result?.unpacked_items ?? [];

  // Tái sử dụng `items` gốc để đếm số lượng thực tế đã xếp/rớt
  // Thay vì reduce O(N^2) trên packedItems, ta map qua items gốc
  const itemStats = items.map((originalItem) => {
    const packedCount = packedItems.filter((i) => i.name === originalItem.name).length;
    const unpackedCount = unpackedItems.filter((i) => i.name === originalItem.name).length;

    return {
      name: originalItem.name,
      color: originalItem.color,
      packedCount,
      unpackedCount,
    };
  });

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-[10px] pr-1">
        {/* Render Hàng Rớt trước (ưu tiên cảnh báo) */}
        {itemStats
          .filter((s) => s.unpackedCount > 0)
          .map(({ name, unpackedCount }) => (
            <div key={`unpacked-${name}`} className="flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div
                  className="w-4 h-4 rounded-[4px] flex-shrink-0 bg-destructive"
                  aria-hidden
                />
                <span className="font-medium text-[14px] text-muted-foreground line-through leading-[20px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {name} <span className="text-[12px] no-underline italic">(không xếp được)</span>
                </span>
              </div>
              <span className="font-bold text-[14px] text-destructive shrink-0 tabular-nums">
                &times;{unpackedCount}
              </span>
            </div>
          ))}

        {/* Render Hàng Đã Xếp sau */}
        {itemStats
          .filter((s) => s.packedCount > 0)
          .map(({ name, color, packedCount }) => (
            <div key={`packed-${name}`} className="flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div
                  className="w-4 h-4 rounded-[4px] flex-shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="font-medium text-[14px] text-text-primary leading-[20px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {name}
                </span>
              </div>
              <span className="font-semibold text-[14px] text-text-secondary shrink-0 tabular-nums">
                &times;{packedCount}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
