import { ITEM_COLORS } from "@/lib/mockData";
import type { UseFormSetValue } from "react-hook-form";
import type { ItemInput } from "@/schemas";

interface ColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  setValue: UseFormSetValue<ItemInput>;
}

export function ColorSelector({
  selectedColor,
  onColorChange,
  setValue,
}: ColorSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">
        Chọn Màu <span className="text-destructive">*</span>
      </label>
      <div className="grid grid-cols-8 gap-2">
        {ITEM_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              onColorChange(color);
              setValue("color", color);
            }}
            className={`w-10 h-10 rounded-[8px] border-2 transition-all ${
              selectedColor === color
                ? "border-text-primary ring-2 ring-primary"
                : "border-border-default hover:border-primary"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}
