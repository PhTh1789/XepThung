/**
 * utils/unitConverter.ts
 *
 * Chuyển đổi đơn vị với triết lý: Liberal Input (lỏng lẻo đầu vào) - Strict Output (chuẩn xác đầu ra).
 * Single Source of Truth (Base Unit):
 * - Chiều dài: Milimet (mm) - Số nguyên (Integer)
 * - Khối lượng: Gram (g) - Số nguyên (Integer)
 */

// Hàm tiện ích parse số thập phân an toàn (hỗ trợ người dùng nhập dấu phẩy hoặc chấm)
const parseSafeFloat = (value: string | number): number => {
  if (typeof value === "number") return value;
  const normalized = value.replace(/,/g, ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

export function toDisplayLength(mm: number, unit: "cm" | "m"): number {
  return unit === "m" ? mm / 1000 : mm / 10;
}

export function toBaseLength(displayValue: string | number, unit: "cm" | "m"): number {
  const val = parseSafeFloat(displayValue);
  // cm -> mm (* 10), m -> mm (* 1000)
  return Math.round(unit === "m" ? val * 1000 : val * 10);
}

export function toDisplayWeight(g: number, unit: "kg" | "tấn"): number {
  return unit === "tấn" ? g / 1_000_000 : g / 1000;
}

export function toBaseWeight(displayValue: string | number, unit: "kg" | "tấn"): number {
  const val = parseSafeFloat(displayValue);
  // kg -> g (* 1000), tấn -> g (* 1000000)
  return Math.round(unit === "tấn" ? val * 1_000_000 : val * 1000);
}

export function formatLength(
  mm: number,
  unit: "cm" | "m",
  decimalSeparator = "."
): string {
  const value = toDisplayLength(mm, unit);
  // Sử dụng Intl.NumberFormat "en-US" làm base (để lấy chuẩn dấu chấm)
  // Nếu có số dư, bắt buộc hiển thị 2 số thập phân để tránh lỗi "Quá tải vi phân"
  const hasRemainder = value % 1 !== 0;
  const baseStr = new Intl.NumberFormat("en-US", { 
    minimumFractionDigits: hasRemainder ? 2 : 0,
    maximumFractionDigits: 3 
  }).format(value);
  return baseStr.replace(/\./g, decimalSeparator);
}

export function formatWeight(
  g: number,
  unit: "kg" | "tấn",
  decimalSeparator = "."
): string {
  const value = toDisplayWeight(g, unit);
  const hasRemainder = value % 1 !== 0;
  const baseStr = new Intl.NumberFormat("en-US", { 
    minimumFractionDigits: hasRemainder ? 2 : 0,
    maximumFractionDigits: 3 
  }).format(value);
  return baseStr.replace(/\./g, decimalSeparator);
}

/**
 * Tính toán thể tích ra mét khối (m3) từ kích thước Base Unit (mm).
 * Nếu sau này Base Unit thay đổi, CHỈ CẦN sửa hằng số chia ở hàm này.
 */
export function calculateVolumeM3(
  length: number,
  width: number,
  height: number,
  quantity: number = 1
): number {
  return (length * width * height * quantity) / 1_000_000_000;
}

