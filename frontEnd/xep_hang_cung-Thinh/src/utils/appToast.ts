/**
 * src/utils/appToast.ts
 *
 * Hệ thống quản lý thông báo (Centralized Toast System).
 * Thay thế việc gọi trực tiếp `toast.error`, `toast.warning` với nội dung hardcode.
 * Đảm bảo Copywriting chuẩn xác, đồng nhất và dễ dàng maintain/i18n.
 *
 * QUY TẮC: Mọi toast trong dự án đều phải đi qua file này.
 * Không được gọi toast.* trực tiếp ở bất kỳ file nào khác (trừ file này).
 */
import { toast } from "sonner";

const showGuestGuardToast = (title: string, description: string) => {
  return toast.warning(title, {
    description,
    action: {
      label: "Đăng nhập",
      onClick: () => {
        import("@/store/useAppStore").then(({ useAppStore }) => {
          useAppStore.getState().openModal("auth");
        });
      },
    },
    actionButtonStyle: {
      backgroundColor: "var(--primary)",
      color: "var(--primary-foreground)",
    },
  });
};

export const AppToast = {
  // ═══════════════════════════════════════════════════════════
  // WIZARD GUARD ERRORS
  // ═══════════════════════════════════════════════════════════
  memberOnlyFeature: (featureName: string = "tính năng này") =>
    showGuestGuardToast(
      "Yêu cầu đăng nhập",
      `Bạn cần đăng nhập để sử dụng ${featureName}.`
    ),

  guestLimitExceeded: (max: number = 50) =>
    showGuestGuardToast(
      "Vượt quá giới hạn Khách",
      `Tài khoản Khách chỉ hỗ trợ tối đa ${max} kiện hàng. Vui lòng đăng nhập để xếp nhiều hơn.`
    ),

  sessionLost: () =>
    toast.error("Vui lòng chọn xe tải trước", {
      description: "Hệ thống bị mất phiên làm việc hoặc chưa cấu hình xe tải.",
    }),

  incompleteSession: () =>
    toast.error("Phiên làm việc không hoàn chỉnh", {
      description: "Dữ liệu xếp hàng bị mất. Vui lòng cấu hình lại.",
    }),

  invalidTruckForm: () =>
    toast.error("Thiếu hoặc sai thông số xe", {
      description:
        "Vui lòng điền đầy đủ và kiểm tra lại các ô viền đỏ (Dài ≤ 20m, Rộng/Cao ≤ 5m, Tải trọng ≤ 100 T).",
    }),

  missingTruckSelection: () =>
    toast.error("Vui lòng chọn xe tải trước", {
      description: "Bạn chưa chọn phương tiện vận chuyển nào.",
    }),

  missingCargoList: () =>
    toast.error("Danh sách hàng hóa trống", {
      description: "Vui lòng thêm ít nhất một kiện hàng.",
    }),

  invalidCargo: (description: string) =>
    toast.error("Hàng hóa không hợp lệ", { description }),

  // ═══════════════════════════════════════════════════════════
  // CRUD — ITEM (Kiện Hàng)
  // ═══════════════════════════════════════════════════════════
  successSave: (itemName: string) =>
    toast.success("Lưu thành công", {
      description: `Đã cập nhật: ${itemName}`,
    }),

  successAdd: (itemName: string) =>
    toast.success("Thêm thành công", {
      description: `Đã thêm kiện hàng: ${itemName}`,
    }),

  successDelete: () => toast.success("Đã xóa kiện hàng"),

  successDeleteItem: () => toast.success("Đã xóa kiện hàng khỏi thư viện"),

  deleteItemFailed: () =>
    toast.error("Xóa thất bại", {
      description: "Lỗi kết nối, không thể xóa kiện hàng lúc này.",
    }),

  // ═══════════════════════════════════════════════════════════
  // CRUD — TRUCK (Xe Tải)
  // ═══════════════════════════════════════════════════════════
  successDeleteTruck: () => toast.success("Đã xóa xe tải khỏi thư viện"),

  deleteTruckFailed: () =>
    toast.error("Xóa thất bại", {
      description: "Lỗi kết nối, không thể xóa xe tải lúc này.",
    }),

  saveTruckSuccess: (truckName: string) =>
    toast.success("Xe tải đã được lưu", {
      description: `Đã lưu "${truckName}" vào danh sách xe của bạn.`,
    }),

  saveTruckFailed: () =>
    toast.error("Lưu xe thất bại", {
      description: "Không thể lưu xe tải. Vui lòng thử lại.",
    }),

  // ═══════════════════════════════════════════════════════════
  // OPTIMIZE
  // ═══════════════════════════════════════════════════════════
  optimizeCancelled: () => toast.info("Đã hủy quá trình tính toán."),

  optimizationError: (description: string) =>
    toast.error("Lỗi tối ưu hóa", { description }),

  // ═══════════════════════════════════════════════════════════
  // HISTORY
  // ═══════════════════════════════════════════════════════════
  noDataToSave: () => toast.error("Không có dữ liệu để lưu"),

  alreadySaved: () => toast.info("Kết quả này đã được lưu rồi."),

  historySaved: (onViewHistory: () => void) =>
    toast.success("Đã lưu vào lịch sử", {
      description:
        "Kết quả sắp xếp đã được lưu. Bạn có thể xem lại bất cứ lúc nào.",
      action: {
        label: "Xem lịch sử",
        onClick: onViewHistory,
      },
    }),

  historySaveFailed: (description: string) =>
    toast.error("Lưu thất bại", { description }),

  loadHistoryFailed: () =>
    toast.error("Không thể tải lịch sử", {
      description: "Kiểm tra kết nối và thử lại.",
    }),

  loadHistoryDetailFailed: () =>
    toast.error("Không thể tải chi tiết lịch sử", {
      description: "Vui lòng thử lại.",
    }),

  successDeleteHistory: () =>
    toast.success("Xóa thành công", {
      description: "Lịch sử đã được xóa khỏi hệ thống.",
    }),

  deleteHistoryFailed: () =>
    toast.error("Xóa thất bại", {
      description: "Có lỗi xảy ra khi xóa lịch sử.",
    }),

  // ═══════════════════════════════════════════════════════════
  // EXPORT & SHARE
  // ═══════════════════════════════════════════════════════════
  exportSuccess: () => toast.success("Đã xuất PDF thành công!"),

  exportFailed: () => toast.error("Không thể xuất PDF. Vui lòng thử lại."),

  comingSoon: (featureName: string = "Tính năng này") =>
    toast.info(`${featureName} sẽ sớm ra mắt!`, {
      description: "Bạn sẽ có thể copy link để chia sẻ kết quả xếp hàng.",
    }),

  // ═══════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════
  sessionExpired: () =>
    toast.error("Phiên đăng nhập hết hạn", {
      description: "Vui lòng đăng nhập lại để tiếp tục lưu trữ.",
    }),

  logoutSuccess: () =>
    toast.success("Đăng xuất thành công", {
      description: "Đã dọn dẹp dữ liệu phiên làm việc an toàn.",
    }),

  successRegister: () =>
    toast.success("Đăng ký thành công", {
      description: "Bạn đã có thể đăng nhập bằng tài khoản vừa tạo.",
    }),

  // ═══════════════════════════════════════════════════════════
  // API & SYSTEM ERRORS
  // ═══════════════════════════════════════════════════════════
  apiError: (description: string = "Đã có lỗi xảy ra khi kết nối máy chủ.") =>
    toast.error("Lỗi hệ thống", { description }),
};
