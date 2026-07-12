import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tự động retry 3 lần nếu có lỗi (ví dụ Backend đang Cold Start)
      retry: 3,
      // Thời gian chờ giữa các lần retry tăng dần (Exponential backoff)
      // Lần 1: 1s, Lần 2: 2s, Lần 3: 4s
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Cache data trong 5 phút
      staleTime: 5 * 60 * 1000,
      // Không tự fetch lại khi người dùng click qua lại tab trình duyệt
      refetchOnWindowFocus: false,
    },
  },
});
