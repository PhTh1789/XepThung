import { useEffect } from "react";
import { ModalRoles } from "@/features/auth/ModalRoles";
import { ModalLogin } from "@/features/auth/ModalLogin";
import { ModalSettings } from "@/features/settings/ModalSettings";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainContent } from "@/components/layout/MainContent";
import { GlobalLoadingOverlay } from "@/components/ui/GlobalLoadingOverlay";
import { Toaster } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { AppToast } from "@/utils/appToast";

export default function App() {
  const { setAuthUser, setExplicitLogout, isExplicitLogout } = useAuthStore();
  const { closeAllModals } = useAppStore();

  useEffect(() => {
    // Kiểm tra session hiện tại khi app khởi động — xử lý trường hợp page reload.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user, "member");
      }
    });

    // Lắng nghe mọi thay đổi Auth state: login, logout, token refresh.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const appState = useAppStore.getState();
        const { currentStep } = appState;

        if (event === "SIGNED_IN") {
          if (currentStep === "home") {
            // User đang ở trang chủ -> navigate step1 + đóng modal (UX chính)
            useAuthStore.getState().setUserRole("member");
          } else {
            // User đang ở step2/3 -> chỉ update identity + đóng modal, KHÔNG navigate
            setAuthUser(session.user, "member");
            closeAllModals();
          }
        } else {
          // TOKEN_REFRESHED và các event khác: chỉ cập nhật identity
          setAuthUser(session.user, "member");
        }
      } else {
        // SIGNED_OUT hoặc session hết hạn -> xóa user identity
        if (event === "SIGNED_OUT" && useAuthStore.getState().userRole === "member") {
          if (!isExplicitLogout) {
            // Passive Logout (Token expired)
            AppToast.sessionExpired();
          } else {
            // Explicit Logout (User bấm Đăng xuất) -> reset flag
            setExplicitLogout(false);
          }
        }
        setAuthUser(null, null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuthUser, closeAllModals, setExplicitLogout, isExplicitLogout]);

  return (
    <div className="h-screen bg-muted flex flex-col overflow-hidden">
      {/* Header dùng chung toàn trang */}
      <AppHeader />

      {/* Router Layout */}
      <MainContent />

      {/* Global Modals & Overlays */}
      <ModalRoles />
      <ModalLogin />
      <ModalSettings />
      <Toaster position="top-center" richColors duration={4000} />
      <GlobalLoadingOverlay />
    </div>
  );
}
