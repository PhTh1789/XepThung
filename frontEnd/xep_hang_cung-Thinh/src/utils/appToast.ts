/**
 * src/utils/appToast.ts
 *
 * Hệ thống quản lý thông báo (Centralized Toast System).
 * Thay thế việc gọi trực tiếp `toast.error`, `toast.warning` với nội dung hardcode.
 * Đảm bảo Copywriting chuẩn xác, đồng nhất và dễ dàng maintain/i18n.
 */
import { toast } from "sonner";

export const AppToast = {
  // === VALIDATION & FORM ERRORS ===
  validationError: (description: string = "Vui lòng kiểm tra lại các trường báo đỏ.") => 
    toast.error("Dữ liệu không hợp lệ", { description }),

  invalidTruck: () => 
    toast.error("Thông số xe chưa hợp lệ", {
      description: "Dài tối đa 20m, Rộng/Cao tối đa 5m, Tải trọng tối đa 100 Tấn. Hãy kiểm tra lại các ô viền đỏ.",
      duration: 6000,
    }),
  
  // === WIZARD GUARD ERRORS ===
  missingTruck: () => 
    toast.warning("Chưa chọn xe tải", { 
      description: "Hãy chọn mẫu xe có sẵn hoặc điền kích thước tùy chỉnh." 
    }),
  
  missingCargo: () => 
    toast.warning("Chưa có kiện hàng nào", { 
      description: "Vui lòng thêm ít nhất 1 kiện hàng để tiếp tục." 
    }),

  sessionLost: () => 
    toast.error("Vui lòng chọn xe tải trước", { 
      description: "Hệ thống bị mất phiên làm việc hoặc chưa cấu hình xe tải." 
    }),

  // === DATA ACTIONS ===
  successSave: (itemName: string) => 
    toast.success("Lưu thành công", { description: `Đã cập nhật: ${itemName}` }),
  
  successAdd: (itemName: string) => 
    toast.success("Thêm thành công", { description: `Đã thêm kiện hàng: ${itemName}` }),

  successDelete: () => 
    toast.success("Đã xóa kiện hàng"),
    
  successRegister: () => 
    toast.success("Đăng ký thành công", { description: "Bạn đã có thể đăng nhập bằng tài khoản vừa tạo." }),

  // === AUTH ===
  sessionExpired: () =>
    toast.error("Phiên đăng nhập hết hạn", { description: "Vui lòng đăng nhập lại để tiếp tục lưu trữ." }),
  logoutSuccess: () =>
    toast.success("Đăng xuất thành công", { description: "Đã dọn dẹp dữ liệu phiên làm việc an toàn." }),

  // === API & SYSTEM ERRORS ===
  apiError: (description: string = "Đã có lỗi xảy ra khi kết nối máy chủ.") => 
    toast.error("Lỗi hệ thống", { description }),
  
  optimizationError: (description: string) => 
    toast.error("Lỗi tối ưu hóa", { description }),
};
