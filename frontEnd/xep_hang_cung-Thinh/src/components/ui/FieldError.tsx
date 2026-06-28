/**
 * src/components/ui/FieldError.tsx
 *
 * Component chuẩn hóa để hiển thị lỗi validation dưới mỗi ô input.
 * Cung cấp sự đồng nhất về Typography, Màu sắc, Icon thay vì hardcode thẻ <p>.
 */
import { AlertCircle } from "lucide-react";

interface FieldErrorProps {
  message?: string;
  className?: string;
}

export function FieldError({ message, className = "" }: FieldErrorProps) {
  if (!message) return null;

  return (
    <div className={`flex items-start gap-1.5 mt-1.5 text-destructive ${className}`}>
      <AlertCircle className="w-4 h-4 shrink-0 mt-[1.5px]" />
      <p className="text-xs sm:text-sm font-medium leading-tight">{message}</p>
    </div>
  );
}
