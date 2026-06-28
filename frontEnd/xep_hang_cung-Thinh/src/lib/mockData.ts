import type { Truck, Item } from "@/schemas";

// Truck Presets - Realistic Vietnamese Logistics
export const TRUCK_PRESETS: Truck[] = [
  {
    id: "truck_1",
    name: "Xe tải 1.5 Tấn",
    length: 4500, // 4500mm = 4.5m
    width: 2100, // 2100mm = 2.1m
    height: 2100, // 2100mm = 2.1m
    max_weight: 1500000, // 1500kg
  },
  {
    id: "truck_2",
    name: "Thaco Ollin 3.5 Tấn",
    length: 5300, // 5300mm = 5.3m
    width: 2200, // 2200mm = 2.2m
    height: 2400, // 2400mm = 2.4m
    max_weight: 3500000, // 3500kg
  },
  {
    id: "truck_3",
    name: "Isuzu QKR 5 Tấn",
    length: 6000, // 6000mm = 6.0m
    width: 2200, // 2200mm = 2.2m
    height: 2400, // 2400mm = 2.4m
    max_weight: 5000000, // 5000kg
  },
];

// Item Presets - Standard Carton Boxes
export const ITEM_PRESETS: Item[] = [
  {
    id: "item_preset_a",
    name: "Carton A",
    length: 600, // 600mm
    width: 400, // 400mm
    height: 400, // 400mm
    weight: 15000, // 15kg
    quantity: 1,
    color: "#0059BB", // Primary blue
  },
  {
    id: "item_preset_b",
    name: "Carton B",
    length: 800, // 800mm
    width: 600, // 600mm
    height: 600, // 600mm
    weight: 25000, // 25kg
    quantity: 1,
    color: "#FD8B00", // Secondary orange
  },
  {
    id: "item_preset_c",
    name: "Carton C",
    length: 1000, // 1000mm
    width: 800, // 800mm
    height: 600, // 600mm
    weight: 35000, // 35kg
    quantity: 1,
    color: "#00A86B", // Green
  },
];

// Sample Items for Testing Step 2
export const SAMPLE_ITEMS: Item[] = [
  {
    id: "item_001",
    name: "Máy công nghiệp",
    length: 1200,
    width: 800,
    height: 1000,
    weight: 200000,
    quantity: 5,
    color: "#0059BB",
  },
  {
    id: "item_002",
    name: "Thiết bị điện tử",
    length: 600,
    width: 400,
    height: 400,
    weight: 15000,
    quantity: 10,
    color: "#FD8B00",
  },
  {
    id: "item_003",
    name: "Sản phẩm nhựa",
    length: 500,
    width: 500,
    height: 500,
    weight: 20000,
    quantity: 8,
    color: "#00A86B",
  },
];

// Color Palette for Items
export const ITEM_COLORS = [
  "#0059BB", // Primary Blue
  "#FD8B00", // Secondary Orange
  "#00A86B", // Green
  "#FF6B6B", // Red
  "#FFD93D", // Yellow
  "#6C63FF", // Purple
  "#00D4FF", // Cyan
  "#FF00FF", // Magenta
];
