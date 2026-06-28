import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { User, Users } from "lucide-react";

export function ModalRoles() {
  const { modalStack, openModal, closeModal } = useAppStore();
  const { setUserRole } = useAuthStore();
  const open = modalStack[modalStack.length - 1] === "roles";

  const handleSelectMember = () => {
    openModal("auth");
  };

  const handleSelectGuest = () => {
    setUserRole("guest");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) closeModal();
    }}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="py-2 sm:py-4 space-y-0">
          <DialogTitle className="text-center text-xl sm:text-[24px] font-semibold leading-8 sm:leading-[32px] text-foreground break-words whitespace-normal">
            Chưa đăng nhập, hãy chọn vai trò của bạn
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 sm:gap-[16px] w-full">
          {/* Thành viên Option */}
          <button
            onClick={handleSelectMember}
            className="flex flex-col items-start gap-3 w-full rounded-[20px] sm:rounded-[24px] border-2 border-primary bg-accent p-4 sm:p-[18px] text-left transition-all duration-300 hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="flex gap-2 items-center">
              <Users className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-primary text-lg sm:text-[20px] leading-7">Thành viên</h4>
            </div>
            <p className="text-sm sm:text-[14px] font-normal text-muted-foreground leading-relaxed sm:leading-[20px]">
              Toàn quyền sử dụng tất cả tính năng (Lưu xe, xem lịch sử, không
              giới hạn số kiện hàng tính toán).
            </p>
            <div className="w-full bg-primary text-primary-foreground text-sm sm:text-[14px] font-semibold tracking-wide sm:tracking-[0.7px] py-3 sm:py-[12px] rounded-xl sm:rounded-[12px] flex items-center justify-center transition-colors group-hover:bg-primary/90 shadow-sm mt-1 sm:mt-0">
              Đăng nhập / Đăng ký
            </div>
          </button>

          {/* Khách Option */}
          <button
            onClick={handleSelectGuest}
            className="flex flex-col items-start gap-3 w-full rounded-[20px] sm:rounded-[24px] border border-border bg-muted p-4 sm:p-[17px] text-left transition-all duration-300 hover:bg-muted-hover hover:-translate-y-0.5 hover:shadow-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="flex gap-2 items-center">
              <User className="w-4 h-4 text-secondary" />
              <h4 className="font-bold text-secondary text-lg sm:text-[20px] leading-7">Khách</h4>
            </div>
            <p className="text-[13px] font-normal text-muted-foreground leading-relaxed sm:leading-[20px]">
              Sử dụng giới hạn (Không lưu dữ liệu, giới hạn số lượng kiện hàng tính toán).
            </p>
            <div className="w-full border-2 border-secondary text-secondary text-sm sm:text-[14px] font-semibold tracking-wide sm:tracking-[0.7px] py-3 sm:py-[14px] rounded-xl sm:rounded-[12px] flex items-center justify-center transition-colors group-hover:bg-secondary/10 mt-1 sm:mt-0">
              Tiếp tục làm khách
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
