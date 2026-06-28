/**
 * src/components/layout/AppHeader.tsx
 *
 * Header định vị sticky top-0 z-40. Gồm: Logo, Nav, User Actions.
 * Refactored to use 4-Pillar Architecture:
 *   - Navigation/Modal: useAppStore
 *   - Auth identity: useAuthStore
 *   - Cargo data (items): useCargoStore (granular selector)
 */
import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, History, ChevronDown } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCargoStore } from "@/store/useCargoStore";
import { signOut } from "@/lib/supabase";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { AppToast } from "@/utils/appToast";

export function AppHeader() {
  // Granular selectors — mỗi selector chỉ re-render khi đúng slice thay đổi
  const currentStep   = useAppStore((s) => s.currentStep);
  const openModal     = useAppStore((s) => s.openModal);
  const setCurrentStep = useAppStore((s) => s.setCurrentStep);
  const closeAllModals = useAppStore((s) => s.closeAllModals);

  const userRole      = useAuthStore((s) => s.userRole);
  const supabaseUser  = useAuthStore((s) => s.supabaseUser);
  const setExplicitLogout = useAuthStore((s) => s.setExplicitLogout);

  const items         = useCargoStore((s) => s.items);
  const resetSession  = useCargoStore((s) => s.resetSession);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLeaveGuard, setShowLeaveGuard] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<"home" | "history" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = supabaseUser?.email?.split("@")[0] ?? "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    setExplicitLogout(true);
    await signOut();
    // Explicit Logout: Xóa sạch phiên làm việc và trở về Trang chủ
    resetSession();
    closeAllModals();
    setCurrentStep("home");
    AppToast.logoutSuccess();
  };

  const handleUserButtonClick = () => {
    if (userRole === "member") {
      setDropdownOpen((prev) => !prev);
    } else {
      openModal("roles");
    }
  };

  // Data Loss Prevention: chỉ hiện guard khi đang ở Wizard và đã có items
  const handleNavigate = (target: "home" | "history" | "wizard") => {
    // Role Guard: Require role to enter Wizard or History
    if (!userRole && (target === "wizard" || target === "history")) {
      openModal("roles");
      return;
    }

    const isCurrentlyInWizard = ["step1", "step2", "step3"].includes(currentStep);

    if (target === "wizard") {
      if (!isCurrentlyInWizard) {
        setCurrentStep("step1");
      }
      return;
    }

    if (isCurrentlyInWizard && items.length > 0) {
      setPendingTarget(target as "home" | "history");
      setShowLeaveGuard(true);
      return;
    }

    executeNavigation(target as "home" | "history");
  };

  const executeNavigation = (target: "home" | "history") => {
    resetSession();
    setCurrentStep(target === "history" ? "history" : "home");
  };

  const handleConfirmLeave = () => {
    if (pendingTarget) {
      executeNavigation(pendingTarget);
    }
    setPendingTarget(null);
    setShowLeaveGuard(false);
  };

  return (
    <div className="bg-background border-b border-border sticky top-0 z-40 w-full flex justify-center shadow-sm shrink-0 h-[var(--header-h)]">
      <div className="flex items-center justify-between w-full max-w-[1280px] px-4 sm:px-10 h-full">
        {/* Logo */}
        <div
          className="flex gap-2 items-center cursor-pointer group"
          onClick={() => handleNavigate("home")}
        >
          <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center overflow-hidden">
            <div className="w-3 h-3 bg-white rounded-sm rotate-45 group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-bold text-lg sm:text-2xl text-primary leading-8">
            XepHangCungThinh
          </span>
        </div>

        {/* Nav (Desktop Only) */}
        <div className="hidden md:flex gap-6 h-[30px] items-start pt-1">
          <div
            className={`flex flex-col items-start pb-1.5 border-b-2 cursor-pointer transition-colors ${currentStep === "home" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
            onClick={() => handleNavigate("home")}
          >
            <span className="font-bold text-base leading-6">Trang chủ</span>
          </div>

          <div
            className={`flex flex-col items-start pb-1.5 border-b-2 cursor-pointer transition-colors ${
              ["step1", "step2", "step3"].includes(currentStep)
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
            onClick={() => handleNavigate("wizard")}
          >
            <span className="font-bold text-base leading-6">Sắp xếp</span>
          </div>

          <div
            className={`flex flex-col items-start pb-1.5 border-b-2 cursor-pointer transition-colors ${
              currentStep === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
            onClick={() => handleNavigate("history")}
          >
            <span className="font-bold text-base leading-6">Lịch sử</span>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex gap-2 sm:gap-3 items-center">
          <button
            className="p-2 sm:p-2.5 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
            onClick={() => openModal("settings")}
            title="Cài đặt"
          >
            <Settings className="w-5 h-5" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleUserButtonClick}
              className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl transition-colors ${
                userRole === "member"
                  ? "bg-primary/10 text-primary hover:bg-primary/20 pl-3 pr-2"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
              title={
                userRole === "member"
                  ? `Đang đăng nhập: ${supabaseUser?.email}`
                  : userRole === "guest"
                  ? "Đang dùng với tư cách Khách"
                  : "Đăng nhập / Đăng ký"
              }
            >
              {userRole === "member" ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold uppercase">
                    {displayName.charAt(0)}
                  </div>
                  <span className="hidden sm:block text-[13px] font-semibold max-w-[80px] md:max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </>
              ) : userRole === "guest" ? (
                <>
                  <User className="w-5 h-5" />
                  <span className="hidden sm:block text-[11px] font-bold px-1 py-0.5 bg-secondary/20 text-secondary rounded">
                    Khách
                  </span>
                </>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>

            {dropdownOpen && userRole === "member" && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-background border border-border rounded-xl shadow-modal z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-[11px] text-muted-foreground">Đăng nhập với</p>
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {supabaseUser?.email}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); handleNavigate("history"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-foreground hover:bg-muted transition-colors"
                  >
                    <History className="w-4 h-4 text-muted-foreground" />
                    Lịch sử xếp hàng
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Loss Prevention Guard */}
      <AlertDialog
        open={showLeaveGuard}
        onOpenChange={setShowLeaveGuard}
        title="Rời khỏi quá trình xếp hàng?"
        description={`Bạn đang có ${items.length} kiện hàng chưa lưu. Rời đi sẽ mất toàn bộ dữ liệu này.`}
        confirmLabel="Rời đi"
        cancelLabel="Tiếp tục xếp hàng"
        onConfirm={handleConfirmLeave}
        variant="danger"
      />

      {/* Logout Guard */}
      <AlertDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Xác nhận Đăng xuất"
        description="Đăng xuất sẽ xóa toàn bộ dữ liệu xe và kiện hàng hiện tại (nếu chưa lưu). Bạn có chắc chắn muốn đăng xuất?"
        confirmLabel="Đăng xuất"
        cancelLabel="Hủy bỏ"
        onConfirm={confirmLogout}
        variant="danger"
      />
    </div>
  );
}
