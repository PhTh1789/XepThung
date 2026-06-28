import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { toBaseLength, toDisplayLength } from "@/utils/unitConverter";
import type { ItemInput } from "@/schemas";

interface DimensionFieldsProps {
  control: Control<ItemInput>;
  errors: FieldErrors<ItemInput>;
  localValues: Record<string, string | undefined>;
  onNumberChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any,
    name: string,
    toBaseFn: (val: number, unit: string) => number,
    unit: string
  ) => void;
  onNumberBlur: (field: any, name: string) => void;
  lengthUnit: string;
}

export function DimensionFields({
  control,
  errors,
  localValues,
  onNumberChange,
  onNumberBlur,
  lengthUnit,
}: DimensionFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="min-w-0">
        <label className="block text-sm font-medium text-text-primary mb-1 truncate">
          Dài ({lengthUnit}) <span className="text-destructive">*</span>
        </label>
        <Controller
          name="length"
          control={control}
          render={({ field }) => (
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={
                localValues.length ??
                (field.value
                  ? toDisplayLength(Number(field.value), lengthUnit as any).toString()
                  : "")
              }
              onChange={(e) =>
                onNumberChange(e, field, "length", toBaseLength as any, lengthUnit)
              }
              onBlur={() => onNumberBlur(field, "length")}
              className={cn(
                "pr-8 text-right",
                errors.length ? "border-destructive focus-visible:ring-destructive" : ""
              )}
            />
          )}
        />
      </div>

      <div className="min-w-0">
        <label className="block text-sm font-medium text-text-primary mb-1 truncate">
          Rộng ({lengthUnit}) <span className="text-destructive">*</span>
        </label>
        <Controller
          name="width"
          control={control}
          render={({ field }) => (
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={
                localValues.width ??
                (field.value
                  ? toDisplayLength(Number(field.value), lengthUnit as any).toString()
                  : "")
              }
              onChange={(e) =>
                onNumberChange(e, field, "width", toBaseLength as any, lengthUnit)
              }
              onBlur={() => onNumberBlur(field, "width")}
              className={cn(
                "pr-8 text-right",
                errors.width ? "border-destructive focus-visible:ring-destructive" : ""
              )}
            />
          )}
        />
      </div>

      <div className="min-w-0">
        <label className="block text-sm font-medium text-text-primary mb-1 truncate">
          Cao ({lengthUnit}) <span className="text-destructive">*</span>
        </label>
        <Controller
          name="height"
          control={control}
          render={({ field }) => (
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={
                localValues.height ??
                (field.value
                  ? toDisplayLength(Number(field.value), lengthUnit as any).toString()
                  : "")
              }
              onChange={(e) =>
                onNumberChange(e, field, "height", toBaseLength as any, lengthUnit)
              }
              onBlur={() => onNumberBlur(field, "height")}
              className={cn(
                "pr-8 text-right",
                errors.height ? "border-destructive focus-visible:ring-destructive" : ""
              )}
            />
          )}
        />
      </div>
    </div>
  );
}
