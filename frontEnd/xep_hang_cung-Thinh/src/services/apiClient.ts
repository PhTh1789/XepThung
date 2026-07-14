/**
 * src/services/apiClient.ts
 *
 * Core Axios Instance — Điểm duy nhất để gọi HTTP requests trong toàn dự án.
 *
 * Trách nhiệm:
 *  1. Cấu hình baseURL, timeout, Content-Type.
 *  2. Request Interceptor: Tự động gắn Supabase JWT Token vào Header Authorization.
 *  3. Response Interceptor: Extract `data.data` và chuyển đổi lỗi HTTP thành ApiError.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ApiError, type ApiErrorResponse } from "./api.types";
import { getSession, supabase } from "@/lib/supabase";

// Dedupe: nếu nhiều request cùng nhận 401 đồng thời, chỉ gọi refreshSession()
// MỘT LẦN DUY NHẤT — các request khác dùng chung Promise này thay vì tự gọi refresh
// riêng lẻ (tránh nhiều lần exchange refresh_token cùng lúc, gây race ở phía Supabase).
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = supabase.auth
      .refreshSession()
      .then(({ data, error }) => {
        if (error || !data.session?.access_token) {
          return null;
        }
        return data.session.access_token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null; // reset để lần 401 sau (thật sự mới) được refresh lại
      });
  }
  return refreshPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Khởi tạo Axios Instance
// ─────────────────────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  /**
   * Timeout 30 giây: Đủ chờ cho optimization_level "deep"
   * nhưng vẫn có giới hạn để tránh treo UI vô thời hạn nếu Server gặp sự cố.
   */
  timeout: 30_000,
});

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor — Tự động gắn Auth Token
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Lay Supabase JWT session va gan vao Authorization header.
    // Public endpoints (/optimize, /presets) van hoat dong neu khong co token.
    // Protected endpoints ([Auth]) yeu cau token hop le tu Backend.
    const session = await getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─────────────────────────────────────────────────────────────────────────────
// Response Interceptor — Xử lý lỗi tập trung
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  // Trường hợp thành công: trả về response gốc (Service layer sẽ extract data.data)
  (response) => response,

  // Trường hợp lỗi HTTP (4xx, 5xx, Network Error, Timeout)
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Chỉ retry cho lỗi 401, và chỉ retry ĐÚNG 1 LẦN cho mỗi request gốc
    // (cờ _retry chặn vòng lặp vô hạn nếu refresh cũng thất bại — ví dụ user
    // đã thật sự bị đăng xuất, refresh_token cũng hết hạn).
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
      // Refresh thất bại -> rơi xuống xử lý lỗi 401 bình thường bên dưới
    }

    if (error.response) {
      // Lỗi có response từ Server (4xx / 5xx)
      // Body theo Standard Error Response của API Contract.
      const { message, error_code } = error.response.data ?? {};
      throw new ApiError(
        message ?? `Lỗi máy chủ (HTTP ${error.response.status})`,
        error_code,
      );
    }

    if (error.request) {
      // Request đã gửi nhưng không nhận được response (Network Error / Timeout)
      if (error.code === "ECONNABORTED") {
        throw new ApiError(
          "Yêu cầu bị timeout. Vui lòng thử lại với cấp độ tối ưu 'Fast'.",
        );
      }
      throw new ApiError(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng của bạn.",
      );
    }

    // Lỗi khác (ví dụ: lỗi cấu hình Axios)
    throw new ApiError(error.message ?? "Đã xảy ra lỗi không xác định.");
  },
);
