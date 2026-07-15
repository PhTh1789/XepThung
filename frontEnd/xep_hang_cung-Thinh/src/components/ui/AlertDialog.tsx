/**
 * src/components/ui/AlertDialog.tsx
 *
 * Component AlertDialog tuy chinh cho du an.
 * Dua tren pattern cua shadcn/ui nhung viet thuong (khong phu thuoc Radix UI AlertDialog).
 * Dung Dialog co san cua du an lam nen, bo sung nut Confirm/Cancel chuan.
 *
 * Dung cho: Data Loss Prevention guard trong AppHeader.tsx
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** Bien the: "danger" hien thi nut confirm mau do de nhan manh rui ro */
  variant?: "danger" | "default";
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Đồng ý",
  cancelLabel = "Hủy",
  onConfirm,
  variant = "danger",
}: AlertDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="shrink-0 whitespace-nowrap">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "destructive" : "primary"}
            onClick={handleConfirm}
            className="shrink-0 whitespace-nowrap"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
