import { z } from "zod";

export const TruckSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional().transform(v => v?.trim() ? v.trim() : `Xe tải - ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`),
  length: z
    .coerce.number()
    .min(10, "Kích thước quá nhỏ (Tối thiểu 10mm)")
    .max(20000, "Tối đa 20 mét (2000 cm)"),
  width: z
    .coerce.number()
    .min(10, "Kích thước quá nhỏ (Tối thiểu 10mm)")
    .max(5000, "Tối đa 5 mét (500 cm)"),
  height: z
    .coerce.number()
    .min(10, "Kích thước quá nhỏ (Tối thiểu 10mm)")
    .max(5000, "Tối đa 5 mét (500 cm)"),
  max_weight: z
    .coerce.number()
    .min(1, "Bắt buộc phải > 0")
    .max(100000000, "Tải trọng quá lớn (Tối đa 100 Tấn)"),
});

/** Kiểu output sau khi Zod transform (dùng trong Store, API). `name` luôn là string. */
export type Truck = z.infer<typeof TruckSchema> & {
  is_preset?: boolean;
};

/**
 * Kiểu input trước khi Zod transform (dùng trong useForm). `name` là optional.
 * Cần thiết vì useForm<T> dùng kiểu input, không phải kiểu output sau transform.
 */
export type TruckInput = z.input<typeof TruckSchema>;

export const ItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional().transform(v => v?.trim() ? v.trim() : `Kiện hàng - ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`),
  length: z.coerce.number().min(10, "Kích thước quá nhỏ (Tối thiểu 10mm)").max(20000, "Tối đa 20 mét (2000 cm)"),
  width: z.coerce.number().min(10, "Kích thước quá nhỏ (Tối thiểu 10mm)").max(5000, "Tối đa 5 mét (500 cm)"),
  height: z.coerce.number().min(10, "Kích thước quá nhỏ (Tối thiểu 10mm)").max(5000, "Tối đa 5 mét (500 cm)"),
  weight: z.coerce.number().min(1, "Bắt buộc phải > 0").max(100000000, "Khối lượng quá lớn (Tối đa 100 Tấn)"),
  quantity: z
    .coerce.number()
    .min(1, "Bắt buộc phải ≥ 1")
    .max(100000, "Số lượng quá lớn")
    .int("Phải là số nguyên"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Mã màu không hợp lệ"),
});

/** Kiểu output sau khi Zod transform (dùng trong Store, API). `name` luôn là string. */
export type Item = z.infer<typeof ItemSchema> & {
  is_preset?: boolean;
};

/**
 * Kiểu input trước khi Zod transform (dùng trong useForm). `name` là optional.
 */
export type ItemInput = z.input<typeof ItemSchema>;

export const SettingsSchema = z.object({
  length_unit: z.enum(["cm", "m"]).default("cm"),
  weight_unit: z.enum(["kg", "tấn"]).default("kg"),
  decimal_separator: z.enum([".", ","]).default("."),
  load_margin: z.number().min(0).max(15).default(5),
});

export type Settings = z.infer<typeof SettingsSchema>;
