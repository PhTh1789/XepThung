import { InlineAlert } from "@/components/ui/InlineAlert";
import type { FieldErrors } from "react-hook-form";
import type { ItemInput } from "@/schemas";

interface AlertStackProps {
  hasValidationErrors: boolean;
  errors: FieldErrors<ItemInput>;
  errorLabels: Record<string, string>;
  isOversized: boolean;
  isOverweight: boolean;
}

export function AlertStack({
  hasValidationErrors,
  errors,
  errorLabels,
  isOversized,
  isOverweight,
}: AlertStackProps) {
  if (!hasValidationErrors && !isOversized && !isOverweight) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* Lỗi Nhập liệu (Chặn Submit) */}
      {hasValidationErrors && (
        <InlineAlert variant="destructive" className="text-[13px]" title="Dữ liệu chưa hợp lệ:">
          <ul className="list-disc list-outside ml-4 mt-1 space-y-1 text-xs">
            {Object.entries(errors).map(([key, err]) => (
              <li key={key}>
                <strong className="font-semibold">{errorLabels[key] || key}:</strong> {err?.message as string}
              </li>
            ))}
          </ul>
        </InlineAlert>
      )}

      {/* Cảnh báo Logic (Không chặn Submit) */}
      {(isOversized || isOverweight) && (
        <InlineAlert variant="warning" className="text-[13px]" title="Lưu ý về kiện hàng:">
          <ul className="list-disc list-outside ml-4 mt-1 space-y-1 text-xs">
            {isOverweight && (
              <li>
                <strong className="font-semibold">Quá tải:</strong> Nặng hơn tải trọng tối đa của xe. Hệ thống vẫn cho phép lưu, nhưng bạn sẽ không thể xếp lên xe này.
              </li>
            )}
            {isOversized && (
              <li>
                <strong className="font-semibold">Quá khổ:</strong> Kích thước lớn hơn thùng xe hiện tại. Hệ thống vẫn cho phép lưu, nhưng sẽ không thể xếp vừa.
              </li>
            )}
          </ul>
        </InlineAlert>
      )}
    </div>
  );
}
