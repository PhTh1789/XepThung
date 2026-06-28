/**
 * src/components/ui/InlineAlert.tsx
 *
 * Khối cảnh báo chuẩn hóa cho Form (VD: Quá tải, Quá khổ, Lỗi Logic).
 * Thay thế cho việc hardcode các thẻ <div className="bg-yellow...">.
 */
import { AlertTriangle, Info, XCircle } from "lucide-react";
import React from "react";

type AlertVariant = "warning" | "destructive" | "info";

interface InlineAlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function InlineAlert({ variant = "warning", title, children, className = "" }: InlineAlertProps) {
  const styles = {
    warning: "bg-warning-50 text-warning-700 border-warning-300",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    info: "bg-info-50 text-info-700 border-info-300",
  };

  const icons = {
    warning: <AlertTriangle className="w-4 h-4 shrink-0 mt-[1.5px]" />,
    destructive: <XCircle className="w-4 h-4 shrink-0 mt-[1.5px]" />,
    info: <Info className="w-4 h-4 shrink-0 mt-[1.5px]" />,
  };

  return (
    <div className={`flex items-start gap-2 p-2.5 sm:p-3 rounded-lg text-[13px] sm:text-sm border ${styles[variant]} ${className}`}>
      {icons[variant]}
      <div className="flex flex-col gap-0.5 leading-relaxed">
        {title && <span className="font-bold">{title}</span>}
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}
