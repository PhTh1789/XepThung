import { useForm, Controller, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TruckSchema, type TruckInput } from "@/schemas";
import { useCargoStore } from "@/store/useCargoStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { FieldError } from "@/components/ui/FieldError";
import { toBaseLength, toDisplayLength, toBaseWeight, toDisplayWeight } from "@/utils/unitConverter";

interface TruckFormProps {
  isSelected?: boolean;
  onActivate?: () => void;
}

export function TruckForm({ isSelected, onActivate }: TruckFormProps) {
  const updateCustomTruck = useCargoStore((s) => s.updateCustomTruck);
  const truck = useCargoStore((s) => s.truck);
  const truckMode = useCargoStore((s) => s.truckMode);
  const savePreset = useCargoStore((s) => s.savePreset);
  const toggleSavePreset = useCargoStore((s) => s.toggleSavePreset);
  const userRole = useAuthStore((s) => s.userRole);
  const settings = useCargoStore((s) => s.settings);
  const truckFormValidationSignal = useCargoStore((s) => s.truckFormValidationSignal);

  const [localValues, setLocalValues] = useState<Record<string, string | undefined>>({});

  const { register, control, watch, trigger } = useForm<TruckInput>({
    resolver: zodResolver(TruckSchema),
    mode: "onTouched",
    defaultValues: {
      name: truck?.name ?? "",
      length: (truck?.length ?? "") as any,
      width: (truck?.width ?? "") as any,
      height: (truck?.height ?? "") as any,
      max_weight: (truck?.max_weight ?? "") as any,
    },
  });

  const { isValid, errors } = useFormState({ control });

  const watchedLength = watch("length");
  const watchedWidth = watch("width");
  const watchedHeight = watch("height");
  const watchedMaxWeight = watch("max_weight");
  const watchedName = watch("name");

  useEffect(() => {
    if (truckMode !== "custom") return;

    if (isValid) {
      const result = TruckSchema.safeParse({
        name: watchedName,
        length: watchedLength,
        width: watchedWidth,
        height: watchedHeight,
        max_weight: watchedMaxWeight,
      });
      if (result.success) {
        updateCustomTruck(result.data);
      } else {
        updateCustomTruck(null);
      }
    } else {
      updateCustomTruck(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, truckMode, updateCustomTruck, watchedLength, watchedWidth, watchedHeight, watchedMaxWeight, watchedName]);

  useEffect(() => {
    if (truckFormValidationSignal > 0 && truckMode === "custom") {
      trigger();
    }
  }, [truckFormValidationSignal, truckMode, trigger]);

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any,
    name: string,
    toBaseFn: (val: number, unit: string) => number,
    unit: string
  ) => {
    let val = e.target.value.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
    const parts = val.split(".");
    if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
    
    setLocalValues((prev) => ({ ...prev, [name]: val }));
    
    if (!val.endsWith(".")) {
      field.onChange(toBaseFn(parseFloat(val) || 0, unit));
    }
  };

  const handleNumberBlur = (field: any, name: string) => {
    setLocalValues((prev) => ({ ...prev, [name]: undefined }));
    field.onBlur();
  };

  return (
    <form
      onClick={() => {
        if (!isSelected) {
          onActivate?.();
        }
      }}
      className={cn(
        "flex flex-col w-full h-full rounded-[24px] border p-4 transition-all duration-300 relative cursor-pointer",
        isSelected
          ? "bg-primary/5 border-2 border-primary shadow-selected"
          : "bg-card border-border hover:-translate-y-1 hover:shadow-md"
      )}
    >
      <h3 className="text-base font-bold text-center text-foreground mb-3 uppercase shrink-0">
        Tùy chỉnh thùng xe
      </h3>

      <div className="flex flex-col h-full justify-between overflow-visible">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[14px] font-bold text-muted-foreground flex flex-col">
              Tên xe <span className="font-normal text-[12px] opacity-70">(tự động sinh nếu để trống)</span>
            </label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ví dụ: Xe tải của tôi"
              className={errors.name ? "bg-destructive/10 border-destructive text-destructive placeholder:text-destructive/50" : ""}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-[14px] font-bold text-muted-foreground truncate">
                Dài ({settings.length_unit})
              </label>
              <Controller
                name="length"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={localValues.length ?? (field.value ? toDisplayLength(Number(field.value), settings.length_unit as any).toString() : "")}
                    onChange={(e) => handleNumberChange(e, field, "length", toBaseLength as any, settings.length_unit)}
                    onBlur={() => handleNumberBlur(field, "length")}
                    className={cn(
                      "pl-8 sm:pl-10 text-[14px]",
                      errors.length ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                  />
                )}
              />
            </div>
            
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-[14px] font-bold text-muted-foreground truncate">
                Rộng ({settings.length_unit})
              </label>
              <Controller
                name="width"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={localValues.width ?? (field.value ? toDisplayLength(Number(field.value), settings.length_unit as any).toString() : "")}
                    onChange={(e) => handleNumberChange(e, field, "width", toBaseLength as any, settings.length_unit)}
                    onBlur={() => handleNumberBlur(field, "width")}
                    className={cn(
                      "pl-8 sm:pl-10 text-[14px]",
                      errors.width ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                  />
                )}
              />
            </div>
            
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-[14px] font-bold text-muted-foreground truncate">
                Cao ({settings.length_unit})
              </label>
              <Controller
                name="height"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={localValues.height ?? (field.value ? toDisplayLength(Number(field.value), settings.length_unit as any).toString() : "")}
                    onChange={(e) => handleNumberChange(e, field, "height", toBaseLength as any, settings.length_unit)}
                    onBlur={() => handleNumberBlur(field, "height")}
                    className={cn(
                      "pl-8 sm:pl-10 text-[14px]",
                      errors.height ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-muted-foreground">
              Tải trọng tối đa ({settings.weight_unit})
            </label>
            <Controller
              name="max_weight"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={localValues.max_weight ?? (field.value ? toDisplayWeight(Number(field.value), settings.weight_unit as any).toString() : "")}
                  onChange={(e) => handleNumberChange(e, field, "max_weight", toBaseWeight as any, settings.weight_unit)}
                  onBlur={() => handleNumberBlur(field, "max_weight")}
                  className={cn(
                    "pl-10 sm:pl-12 text-[14px]",
                    errors.max_weight ? "border-destructive focus-visible:ring-destructive" : ""
                  )}
                />
              )}
            />
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-3 mt-auto shrink-0 py-2 transition-opacity",
            userRole !== "member" && "opacity-50 cursor-not-allowed"
          )}
        >
          <button
            type="button"
            role="switch"
            aria-checked={savePreset}
            disabled={userRole !== "member"}
            onClick={() => toggleSavePreset(!savePreset)}
            className={cn(
              "relative inline-flex h-[24px] w-[44px] shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              userRole !== "member" ? "cursor-not-allowed" : "cursor-pointer",
              savePreset ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-[20px] w-[20px] rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out",
                savePreset ? "translate-x-[20px]" : "translate-x-0"
              )}
            />
          </button>
          <span
            onClick={() => {
              if (userRole === "member") toggleSavePreset(!savePreset);
            }}
            className={cn(
              "text-[14px] font-medium text-foreground select-none",
              userRole === "member" && "cursor-pointer"
            )}
          >
            Lưu thùng xe để sử dụng lại
          </span>
        </div>
      </div>
    </form>
  );
}
