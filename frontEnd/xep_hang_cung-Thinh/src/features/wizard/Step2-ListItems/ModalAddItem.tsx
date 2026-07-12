/**
 * src/features/wizard/Step2-ListItems/AddItemModal.tsx
 *
 * Modal dung chung cho 2 chuc nang: Them moi va Chinh sua kien hang.
 *
 * Che do Edit: Truyen `initialData` vao props.
 *   - useEffect reset form theo initialData moi lan modal mo.
 *   - handleFormSubmit bao toan `id` cua item cu de Store co the tim dung item can update.
 *
 * Che do Add: Khong truyen initialData (hoac null).
 *   - useEffect reset form ve gia tri mac dinh moi lan modal mo → chong Dirty Form State.
 *
 * Khong tao them file moi — tuan thu DRY Principle va Feature-Driven Architecture.
 */
import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { ItemSchema, type ItemInput, type Item } from "@/schemas";
import { useCargoStore } from "@/store/useCargoStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSaveItem } from "@/hooks/mutations/useItemMutations";
import { useItemLibrary } from "@/hooks/queries/useItemLibrary";
import { toBaseWeight, toDisplayWeight } from "@/utils/unitConverter";
import { isItemOversized, isItemOverweight } from "@/utils/cargoValidation";
import { LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { DimensionFields } from "./DimensionFields";
import { ColorSelector } from "./ColorSelector";

const { guestMaxItems } = LIMITS;

const DEFAULT_VALUES: ItemInput = {
  name: "",
  length: "" as any,
  width: "" as any,
  height: "" as any,
  weight: "" as any,
  quantity: 1,
  color: "#0059BB",
};

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: Item) => void;
  /** Neu truyen vao, modal se chay o che do "Chinh sua". Neu null/undefined, chay o che do "Them moi". */
  initialData?: Item | null;
}

export function AddItemModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: AddItemModalProps) {
  const isEditMode = Boolean(initialData);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_VALUES.color!);
  // Toggle "Luu de dung lai" -- local state, vong doi ngan, khong vao Store
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  // Local state de luu raw string khi user dang go so thap phan
  const [localValues, setLocalValues] = useState<Record<string, string | undefined>>({});
  
  const settings = useCargoStore(state => state.settings);
  const truck = useCargoStore(state => state.truck);
  const totalItems = useCargoStore(state => 
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );
  const { mutate: saveItemToLibrary } = useSaveItem();
  const { data: itemLibrary = [] } = useItemLibrary();

  const userRole = useAuthStore((s) => s.userRole);

  const currentQuantity = initialData?.quantity ?? 0;
  const maxAllowedQuantity = userRole === "guest" 
    ? guestMaxItems - totalItems + currentQuantity 
    : Infinity;
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
  } = useForm<ItemInput>({
    resolver: zodResolver(ItemSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES,
  });

  const watchValues = watch();
  
  const isOversized = isItemOversized(
    Number(watchValues.length) || 0,
    Number(watchValues.width) || 0,
    Number(watchValues.height) || 0,
    truck
  );

  const isOverweight = isItemOverweight(Number(watchValues.weight) || 0, truck);

  // ==========================================
  // HỆ THỐNG PHÂN CẤP LỖI (PRIORITY SYSTEM)
  // ==========================================
  // Tầng 1 (Hard Error): Lỗi đỏ từ Zod (ví dụ: required, invalid_type, too_big/too_small so với hệ thống).
  // Tầng 2 (Soft Warning): Hợp lệ theo Zod, nhưng quá khổ/quá tải so với THÙNG XE hiện tại.
  // Quy tắc hiển thị: Nếu có lỗi đỏ (Tầng 1) → KHÔNG hiển warning vàng (Tầng 2).
  
  const hasDimensionError = !!(errors.length || errors.width || errors.height);
  const showOversizedWarning = !hasDimensionError && isOversized;

  const hasWeightError = !!errors.weight;
  const showOverweightWarning = !hasWeightError && isOverweight;

  // Cờ tổng hợp để chặn Submit
  const hasAnyHardError = Object.keys(errors).length > 0;

  const isDuplicateInLibrary = useMemo(() => {
    if (isEditMode || userRole !== "member") return false;
    const currentItem = {
      name: watchValues.name?.trim() || "",
      length: Number(watchValues.length) || 0,
      width: Number(watchValues.width) || 0,
      height: Number(watchValues.height) || 0,
      weight: Number(watchValues.weight) || 0,
      color: selectedColor,
    };
    return itemLibrary.some(
      (item) =>
        item.name === currentItem.name &&
        item.length === currentItem.length &&
        item.width === currentItem.width &&
        item.height === currentItem.height &&
        item.weight === currentItem.weight &&
        item.color === currentItem.color
    );
  }, [watchValues.name, watchValues.length, watchValues.width, watchValues.height, watchValues.weight, selectedColor, itemLibrary, isEditMode, userRole]);

  useEffect(() => {
    if (isDuplicateInLibrary && saveToLibrary) {
      setSaveToLibrary(false);
    }
  }, [isDuplicateInLibrary, saveToLibrary]);

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

  // Reset form moi lan modal mo, phu thuoc vao che do (Edit hay Add).
  // Day la cach duy nhat dam bao form sach sau moi lan dong/mo (chong Dirty Form State).
  useEffect(() => {
    if (!open) return;
    if (initialData) {
      reset(initialData);
      setSelectedColor(initialData.color ?? DEFAULT_VALUES.color!);
    } else {
      reset(DEFAULT_VALUES);
      setSelectedColor(DEFAULT_VALUES.color!);
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: ItemInput) => {
    if (Number(data.quantity) > maxAllowedQuantity) {
      setError("quantity", {
        type: "manual",
        message: `Tài khoản Khách chỉ được thêm tối đa ${maxAllowedQuantity} kiện hàng nữa`,
      });
      return;
    }

    const payload: Item = {
      ...data,
      id: initialData?.id,
      color: selectedColor,
      length: Number(data.length),
      width: Number(data.width),
      height: Number(data.height),
      weight: Number(data.weight),
      quantity: Number(data.quantity),
    } as Item;

    // Centralized Store Action: Luu vao thu vien neu user bat toggle (chi Add mode)
    if (!isEditMode && saveToLibrary) {
      try {
        await new Promise<void>((resolve, reject) => {
          saveItemToLibrary(
            {
              name: payload.name ?? "",
              length: payload.length,
              width: payload.width,
              height: payload.height,
              weight: payload.weight,
              color: payload.color,
            },
            { onSuccess: () => resolve(), onError: (err) => reject(err) }
          );
        });
      } catch {
        // Error already handled and toasted by the mutation hook
        return;
      }
    }

    onSubmit(payload);
    onOpenChange(false);
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-xl font-bold text-foreground">
              {isEditMode ? "Chỉnh sửa kiện hàng" : "Thêm kiện hàng mới"}
            </DialogTitle>
          </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
          <div className="overflow-y-auto max-h-[65vh] sm:max-h-[75vh] p-1 space-y-4 pr-2 -mr-2">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Tên kiện hàng <span className="text-muted-foreground font-normal text-[13px] ml-1">(tự động sinh nếu để trống)</span>
            </label>
            <Input 
              placeholder="Ví dụ: Máy công nghiệp" 
              {...register("name")} 
              className={cn(errors.name ? "border-destructive focus-visible:ring-destructive" : "")}
            />
          </div>

          {/* Dimensions */}
          <div>
            <DimensionFields
              control={control}
              errors={errors}
              localValues={localValues}
              onNumberChange={handleNumberChange}
              onNumberBlur={handleNumberBlur}
              lengthUnit={settings.length_unit}
            />
            {/* Inline Error cho Kích thước */}
            {hasDimensionError ? (
              <div className="text-xs text-destructive flex items-center gap-1 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Vui lòng nhập kích thước hợp lệ
              </div>
            ) : showOversizedWarning ? (
              <div className="text-xs text-warning-700 flex items-center gap-1 mt-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-warning-600" />
                Vượt kích thước thùng xe
              </div>
            ) : null}
          </div>

          {/* Weight & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Khối lượng ({settings.weight_unit}) <span className="text-destructive">*</span>
              </label>
              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={localValues.weight ?? (field.value ? toDisplayWeight(Number(field.value), settings.weight_unit as any).toString() : "")}
                    onChange={(e) => handleNumberChange(e, field, "weight", toBaseWeight as any, settings.weight_unit)}
                    onBlur={() => handleNumberBlur(field, "weight")}
                    className={cn(
                      "pr-8 text-right",
                      errors.weight ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                  />
                )}
              />
              {/* Inline Error cho Khối lượng */}
              {hasWeightError ? (
                <div className="text-xs text-destructive flex items-center gap-1 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.weight?.message || "Khối lượng không hợp lệ"}
                </div>
              ) : showOverweightWarning ? (
                <div className="text-xs text-warning-700 flex items-center gap-1 mt-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-warning-600" />
                  Vượt tải trọng tối đa
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Số lượng <span className="text-destructive">*</span>
              </label>
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={1}
                    max={maxAllowedQuantity}
                    placeholder="1"
                    {...field}
                    value={field.value as string | number}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                    className={cn(
                      "pr-8 text-right",
                      errors.quantity ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                  />
                )}
              />
            </div>
          </div>

          {/* Color Picker */}
          <ColorSelector
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            setValue={setValue}
          />

          {/* Toggle luu kien hang (chi hien khi them moi, khong phai edit) */}
          {!isEditMode && userRole === "member" && (
            <div className="flex flex-col gap-1 px-1 mt-1">
              <label className={cn("flex items-center gap-2 group", isDuplicateInLibrary ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                  saveToLibrary ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background group-hover:border-primary",
                  isDuplicateInLibrary && "bg-muted border-border group-hover:border-border"
                )}>
                  {saveToLibrary && !isDuplicateInLibrary && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <input 
                  type="checkbox" 
                  className="sr-only"
                  checked={saveToLibrary && !isDuplicateInLibrary}
                  onChange={(e) => setSaveToLibrary(e.target.checked)}
                  disabled={isDuplicateInLibrary}
                />
                <span className="text-sm font-medium text-foreground select-none">Lưu vào thư viện hàng hóa</span>
              </label>
              {isDuplicateInLibrary && (
                <span className="text-xs text-muted-foreground ml-7">Kiện hàng này đã có trong thư viện</span>
              )}
            </div>
          )}

          </div> {/* Kết thúc khối scroll */}

          {/* Warning box nam ngoai scroll container - luon visible khong can scroll */}
          {(showOversizedWarning || showOverweightWarning) && (
            <div className="px-3 py-2 mt-4 rounded-md bg-warning-50 border border-warning-300 text-xs text-warning-700 flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-warning-600" />
              <span>
                <strong className="font-semibold">Vượt giới hạn xe:</strong> {[
                  showOverweightWarning ? `Tải trọng +${toDisplayWeight(Math.max(0, Number(watchValues.weight) - truck!.max_weight), settings.weight_unit as any)} ${settings.weight_unit}` : "",
                  showOversizedWarning ? "Kích thước vượt thùng" : ""
                ].filter(Boolean).join(" • ")} <span className="opacity-80">(vẫn có thể lưu)</span>
              </span>
            </div>
          )}

          {/* Form Actions */}
          <DialogFooter className="mt-6 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="shrink-0 whitespace-nowrap"
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || hasAnyHardError} className="shrink-0 whitespace-nowrap">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : isEditMode ? (
                "Lưu Thay Đổi"
              ) : (
                "Thêm Kiện Hàng"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
