import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppToast } from "@/utils/appToast";
import { useAppStore } from "@/store/useAppStore";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Mail, Lock, KeyRound, Loader2, Globe, UserPlus, CheckCircle } from "lucide-react";
import { signInWithEmail, signUpWithEmail, supabase,} from "@/lib/supabase";
import { AuthSchema, type AuthInput, getViMessage } from "./authConfig";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function ModalLogin() {
  const { modalStack, closeModal } = useAppStore();
  const open = modalStack[modalStack.length - 1] === "auth";

  // Flow State
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [lockoutTime, setLockoutTime] = useState(0);
  const [isSignupSuccess, setIsSignupSuccess] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Form State
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AuthInput>({
    resolver: zodResolver(AuthSchema),
    defaultValues: { email: "", password: "" }
  });

  const isLoading = isSubmitting || isGoogleLoading;

  // Lockout countdown
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => setLockoutTime((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  // Reset form khi dong modal hoac doi tab
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      closeModal();
      reset();
      clearErrors();
      setActiveTab("login");
      setLockoutTime(0);
      setIsSignupSuccess(false);
    }
  };

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    clearErrors();
    reset();
  };

  // ─── Handler: Submit Form ────────────────────────────────────
  const onSubmit = async (data: AuthInput) => {
    if (lockoutTime > 0) return;
    clearErrors("root");

    if (activeTab === "login") {
      // ── LOGIN ──
      const { error } = await signInWithEmail(data.email, data.password);
      if (error) {
        setError("root", { message: getViMessage(error.message) });
        setLockoutTime(5);
      }
      // Thanh cong: onAuthStateChange trong App.tsx se tu dong xu ly
    } else {
      // ── REGISTER ──
      const { data: authData, error } = await signUpWithEmail(data.email, data.password);
      if (error) {
        setError("root", { message: getViMessage(error.message) });
        setLockoutTime(5);
      } else if (authData?.user?.identities && authData.user.identities.length === 0) {
        // Identity Collision
        setError("root", { message: getViMessage("identity_collision_custom_error") });
        setLockoutTime(5);
      } else {
        AppToast.successRegister();
        setIsSignupSuccess(true);
      }
    }
  };

  // ─── Handler: Dang nhap Google OAuth (redirect flow) ─────────────────────
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    // Browser se redirect → khong can setIsGoogleLoading(false)
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 gap-0 md:max-w-[420px]">
        {/* Accessibility */}
        <DialogTitle className="sr-only">Đăng nhập / Đăng ký</DialogTitle>
        <DialogDescription className="sr-only">Biểu mẫu đăng nhập hoặc đăng ký tài khoản</DialogDescription>

        {/* ── Tab Header ─────────────────────────────────────────────────── */}
        <div className="flex w-full border-b border-border relative pt-2">
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 py-4 flex items-center justify-center border-b-2 text-[14px] tracking-[0.7px] transition-colors focus:outline-none ${
              activeTab === "login"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground font-semibold"
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => switchTab("register")}
            className={`flex-1 py-4 flex items-center justify-center border-b-2 text-[14px] tracking-[0.7px] transition-colors focus:outline-none ${
              activeTab === "register"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground font-semibold"
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="p-6 flex flex-col gap-5 w-full">

          {isSignupSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Đăng ký thành công!</h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed max-w-sm">
                Vui lòng kiểm tra hộp thư đến (và thư rác) để xác thực tài khoản trước khi đăng nhập.
              </p>
              <button
                onClick={() => {
                  setIsSignupSuccess(false);
                  switchTab("login");
                }}
                className="mt-4 px-6 py-3 bg-primary text-primary-foreground font-semibold text-[14px] rounded-lg hover:brightness-110 transition-all shadow-sm"
              >
                Quay lại Đăng nhập
              </button>
            </div>
          ) : (
            <>
              {/* Social Login */}
          <div className="flex flex-col gap-3 w-full">
            <div className="w-full text-center">
              <span className="font-medium text-[12px] text-muted-foreground tracking-[0.6px] uppercase">
                Tiếp tục với
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Google — hoat dong */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex flex-col items-center justify-center py-3 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-colors gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Đăng nhập bằng Google"
              >
                <Globe className="w-5 h-5 text-foreground" />
                <span className="font-bold text-[10px] text-foreground">Google</span>
              </button>
              {/* Facebook — sap ra mat */}
              <button
                disabled
                className="flex flex-col items-center justify-center py-3 border border-border rounded-lg gap-2 opacity-40 cursor-not-allowed"
                title="Sắp ra mắt"
              >
                <div className="w-5 h-5 flex items-center justify-center bg-blue-600 rounded-full text-white">
                  <span className="font-bold text-xs">f</span>
                </div>
                <span className="font-bold text-[10px] text-foreground">Facebook</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center w-full">
            <div className="absolute w-full border-t border-border" />
            <div className="bg-background px-2 relative z-10">
              <span className="font-medium text-[12px] text-muted-foreground uppercase tracking-[0.5px]">
                Hoặc dùng Email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full">
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="font-medium text-[12px] text-foreground">
                Email
              </label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="example@gmail.com"
                  disabled={isLoading}
                  className="w-full bg-background border border-input rounded-lg py-[14px] pl-10 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-60"
                />
              </div>
              {errors.email && (
                <p className="text-[12px] text-destructive font-medium px-1 mt-[-2px]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center w-full">
                <label className="font-medium text-[12px] text-foreground">
                  Mật khẩu
                </label>
                {activeTab === "login" && (
                  <span className="font-medium text-[12px] text-muted-foreground">
                    {activeTab === "login" ? "Quên mật khẩu?" : ""}
                  </span>
                )}
              </div>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full bg-background border border-input rounded-lg py-[14px] pl-10 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-60"
                />
              </div>
              {errors.password && (
                <p className="text-[12px] text-destructive font-medium px-1 mt-[-2px]">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error message inline (API errors) */}
            {errors.root && (
              <p className="text-[13px] text-destructive font-medium px-1">
                {errors.root.message}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || lockoutTime > 0}
              className="w-full mt-1 bg-primary text-primary-foreground font-semibold text-[14px] tracking-[0.7px] py-[16px] rounded-lg hover:brightness-110 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {lockoutTime > 0 ? (
                <>Thử lại sau ({lockoutTime}s)</>
              ) : isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : activeTab === "login" ? (
                <KeyRound className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {lockoutTime > 0
                ? ""
                : isLoading
                ? activeTab === "login" ? "Đang đăng nhập..." : "Đang đăng ký..."
                : activeTab === "login" ? "Đăng nhập" : "Đăng ký tài khoản"
              }
            </button>
          </form>
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
