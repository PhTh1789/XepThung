/**
 * src/store/useAuthStore.ts
 *
 * PILLAR 1 — Identity Store
 * Nguồn sự thật duy nhất về "Người dùng là ai?"
 *
 * Trách nhiệm:
 *   - Lưu trữ Supabase user identity (supabaseUser, userRole)
 *   - Kiểm soát luồng Explicit vs Passive Logout (isExplicitLogout flag)
 *   - Cross-store: gọi useAppStore.getState() để navigate sau login/logout
 *
 * KHÔNG chứa: Navigation, Modal, Cargo data.
 */
import { create } from "zustand";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthStore {
  /** Supabase User object. null khi chưa đăng nhập. */
  supabaseUser: SupabaseUser | null;
  /** Vai trò người dùng. null = chưa chọn vai trò. */
  userRole: "member" | "guest" | null;
  /**
   * Flag phân biệt Explicit Logout (User chủ động bấm)
   * vs Passive Logout (Token hết hạn).
   * Dùng để kiểm soát toast thông báo trong App.tsx listener.
   */
  isExplicitLogout: boolean;

  /**
   * Cập nhật user identity từ Supabase session.
   * KHÁC với setUserRole: chỉ cập nhật identity, KHÔNG navigate.
   * Dùng bởi onAuthStateChange listener trong App.tsx.
   */
  setAuthUser: (user: SupabaseUser | null, role: "member" | "guest" | null) => void;

  /**
   * Chọn role sau khi user chọn "Thành viên" hoặc "Khách".
   * Side effect: navigate sang step1 qua useAppStore.getState().
   */
  setUserRole: (role: "member" | "guest") => void;

  /** Kiểm soát flag Explicit Logout để tránh hiển thị toast sai. */
  setExplicitLogout: (val: boolean) => void;

  /**
   * Xóa toàn bộ Auth state về null.
   * Dùng khi SIGNED_OUT. Không reset Cargo data — trách nhiệm của useCargoStore.
   */
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial State
  supabaseUser: null,
  userRole: null,
  isExplicitLogout: false,

  // Actions
  setAuthUser: (user, role) => set({ supabaseUser: user, userRole: role }),

  setUserRole: (role) => {
    set({ userRole: role });
    // Cross-store: Navigate sang step1 và đóng modal sau khi chọn role
    // Lazy import để tránh circular dependency
    import("./useAppStore").then(({ useAppStore }) => {
      useAppStore.getState().setCurrentStep("step1");
      useAppStore.getState().closeAllModals();
    });
  },

  setExplicitLogout: (val) => set({ isExplicitLogout: val }),

  clearAuth: () => set({ supabaseUser: null, userRole: null, isExplicitLogout: false }),
}));
