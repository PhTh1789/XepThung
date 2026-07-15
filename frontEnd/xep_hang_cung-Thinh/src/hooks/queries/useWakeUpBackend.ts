/**
 * src/hooks/queries/useWakeUpBackend.ts
 *
 * Hook đánh thức Backend (Proactive Ping).
 * Render's free tier tự động sleep sau 15 phút không hoạt động.
 * Quá trình wake-up tốn khoảng 50s.
 * Hàm này dùng fetch gọi trực tiếp tới endpoint /health ngay khi Frontend load
 * để đánh thức Server trước khi user thao tác. Tránh lỗi timeout ở màn hình Optimize.
 */
import { useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

// Cắt bỏ "/api/v1" hoặc "/api/v1/" ở cuối chuỗi để lấy Root Domain
const ROOT_URL = BACKEND_URL.replace(/\/api\/v1\/?$/, "");

export function useWakeUpBackend() {
  useEffect(() => {
    // Chỉ ping 1 lần duy nhất khi mount
    fetch(`${ROOT_URL}/health`, { method: "GET" })
      .then((res) => {
        if (!res.ok) {
          console.warn("Wake-up ping failed (might still be waking up):", res.status);
        } else {
          console.log("Backend is awake!");
        }
      })
      .catch((err) => {
        console.warn("Wake-up ping error (expected during cold start):", err);
      });
  }, []);
}
