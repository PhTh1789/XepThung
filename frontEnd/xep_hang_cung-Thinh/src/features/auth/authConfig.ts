import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Error message map: Supabase (EN) -> Tieng Viet
// ─────────────────────────────────────────────────────────────────────────────
export const AUTH_ERROR_RULES = [
  { match: (m: string) => m.includes("invalid login credentials"), vi: "Email hoặc mật khẩu không chính xác." },
  { match: (m: string) => m.includes("rate limit") || m.includes("too many requests") || m.includes("over_email_send_rate_limit"), vi: "Hệ thống đang xử lý quá nhiều yêu cầu. Vui lòng thử lại sau 1-2 phút." },
  { match: (m: string) => m.includes("email not confirmed"), vi: "Vui lòng xác nhận email trước khi đăng nhập." },
  { match: (m: string) => m.includes("already registered"), vi: "Email này đã được đăng ký." },
  { match: (m: string) => m.includes("password should be at least"), vi: "Mật khẩu phải có ít nhất 6 ký tự." },
  { match: (m: string) => m.includes("invalid format"), vi: "Địa chỉ email không hợp lệ." },
  { match: (m: string) => m.includes("signup is disabled"), vi: "Hệ thống đang tạm ngừng tính năng đăng ký." },
  { match: (m: string) => m.includes("identity_collision_custom_error"), vi: "Email này đã tồn tại hoặc đã được liên kết. Vui lòng đăng nhập." },
  { match: (m: string) => m.includes("network") || m.includes("fetch"), vi: "Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối." }
];

export const AuthSchema = z.object({
  email: z.string()
    .email("Email không hợp lệ.")
    .refine((val) => {
      const lower = val.toLowerCase();
      return !lower.startsWith("test@") &&
             !lower.startsWith("admin@") &&
             !lower.startsWith("demo@") &&
             !lower.startsWith("system@");
    }, "Email này không được phép đăng ký."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
});

export type AuthInput = z.infer<typeof AuthSchema>;

export function getViMessage(msg: string): string {
  if (!msg) return "Đã xảy ra lỗi không xác định.";
  
  const lowerMsg = msg.toLowerCase();
  const found = AUTH_ERROR_RULES.find(rule => rule.match(lowerMsg));
  
  if (found) return found.vi;
  
  // Global Fallback for unmapped errors
  console.error("[Auth Error Unmapped]:", msg);
  return "Tác vụ thất bại do lỗi hệ thống. Vui lòng thử lại sau.";
}
