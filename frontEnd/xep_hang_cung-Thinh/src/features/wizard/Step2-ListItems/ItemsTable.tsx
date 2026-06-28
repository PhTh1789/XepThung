/**
 * src/features/wizard/Step2-ListItems/ItemsTable.tsx
 *
 * Bang danh sach kien hang da them vao Step 2.
 *
 * ARCHITECTURE (Rule 2 & Rule 4 — ARCHITECTURE.md):
 * Tu lay `items` va `settings` tu Store bang Granular Selectors.
 * Chi nhan `onEdit` va `onRemove` qua props vi day la callbacks action cua cha.
 */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Pencil, Trash2 } from "lucide-react";
import { useCargoStore } from "@/store/useCargoStore";
import { formatLength, formatWeight } from "@/utils/unitConverter";
import { isItemOversized, isItemOverweight } from "@/utils/cargoValidation";
import type { Item } from "@/schemas";

interface ItemsTableProps {
  onEdit: (item: Item) => void;
  onRemove: (itemId: string) => void;
}

export function ItemsTable({ onEdit, onRemove }: ItemsTableProps) {
  // Granular Selectors — Rule 4
  const items    = useCargoStore(state => state.items);
  const settings = useCargoStore(state => state.settings);
  const truck    = useCargoStore(state => state.truck);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/30 rounded-[12px] border-2 border-dashed border-border">
        <p className="text-muted-foreground">
          Chưa có kiện hàng nào. Hãy thêm kiện hàng đầu tiên.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-[12px] max-h-[50vh] min-h-[200px] overflow-y-auto relative w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm shadow-sm">
          <TableRow className="bg-transparent hover:bg-transparent">
            {/* Cot luon hien tren moi breakpoint */}
            <TableHead className="font-bold text-muted-foreground whitespace-nowrap px-4 py-4">Kiện hàng</TableHead>

            {/* Cot kich thuoc: an tren mobile (<sm), hien tu sm tro len */}
            <TableHead className="hidden sm:table-cell font-bold text-muted-foreground whitespace-nowrap px-4 py-4 text-center w-[110px]">Dài ({settings.length_unit})</TableHead>
            <TableHead className="hidden sm:table-cell font-bold text-muted-foreground whitespace-nowrap px-4 py-4 text-center w-[110px]">Rộng ({settings.length_unit})</TableHead>
            <TableHead className="hidden sm:table-cell font-bold text-muted-foreground whitespace-nowrap px-4 py-4 text-center w-[110px]">Cao ({settings.length_unit})</TableHead>

            {/* Cot khoi luong: chi hien tu md tro len */}
            <TableHead className="hidden md:table-cell font-bold text-muted-foreground whitespace-nowrap px-4 py-4 text-center w-[130px]">Khối lượng ({settings.weight_unit})</TableHead>

            {/* So luong: luon hien */}
            <TableHead className="font-bold text-muted-foreground whitespace-nowrap px-4 py-4 text-center w-[70px]">SL</TableHead>

            {/* Hanh dong: gop Edit + Xoa vao 1 cot */}
            <TableHead className="font-bold text-muted-foreground whitespace-nowrap px-4 py-4 text-center w-[100px]">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isOversized = isItemOversized(item.length, item.width, item.height, truck);
            const isOverweight = isItemOverweight(item.weight, truck);
            const hasWarning = isOversized || isOverweight;

            return (
              <TableRow key={item.id} className={`bg-background hover:bg-muted/30 ${hasWarning ? "bg-red-50/50" : ""}`}>
                {/* Ten kien hang: luon hien */}
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted/50 w-fit px-2 py-1 rounded-xl border border-border">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0"
                        style={{ backgroundColor: item.color }}
                        title={item.color}
                      />
                      <span className="font-medium text-foreground max-w-[100px] sm:max-w-[200px] truncate">
                        {item.name}
                      </span>
                    </div>
                    {hasWarning && (
                      <div 
                        className="text-warning-700 bg-warning-50 p-1 rounded-full cursor-help shrink-0"
                        title={isOversized ? "Kiện hàng này quá khổ so với xe." : "Kiện hàng này quá nặng so với xe."}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                      </div>
                    )}
                  </div>
                </TableCell>

              {/* Kich thuoc: an tren mobile */}
              <TableCell className="hidden sm:table-cell px-4 py-3 text-center">
                <div className="bg-muted px-2 py-1.5 rounded-lg border border-border text-foreground text-sm flex items-center justify-center min-w-[55px]">
                  {formatLength(item.length, settings.length_unit)}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell px-4 py-3 text-center">
                <div className="bg-muted px-2 py-1.5 rounded-lg border border-border text-foreground text-sm flex items-center justify-center min-w-[55px]">
                  {formatLength(item.width, settings.length_unit)}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell px-4 py-3 text-center">
                <div className="bg-muted px-2 py-1.5 rounded-lg border border-border text-foreground text-sm flex items-center justify-center min-w-[55px]">
                  {formatLength(item.height, settings.length_unit)}
                </div>
              </TableCell>

              {/* Khoi luong: chi hien tu md */}
              <TableCell className="hidden md:table-cell px-4 py-3 text-center">
                <div className="bg-muted px-2 py-1.5 rounded-lg border border-border text-foreground text-sm flex items-center justify-center min-w-[55px]">
                  {formatWeight(item.weight, settings.weight_unit)}
                </div>
              </TableCell>

              {/* So luong */}
              <TableCell className="px-4 py-3 text-center">
                <div className="bg-muted px-2 py-1.5 rounded-lg border border-border text-foreground text-sm flex items-center justify-center min-w-[40px]">
                  {item.quantity}
                </div>
              </TableCell>

              {/* Hanh dong: Edit + Xoa — gop 1 cot, tooltip mo ta ro chuc nang */}
              <TableCell className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                    title="Chỉnh sửa kiện hàng"
                  >
                    <Pencil className="w-[17px] h-[17px]" />
                  </button>
                  <button
                    onClick={() => onRemove(item.id!)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                    title="Xóa kiện hàng"
                  >
                    <Trash2 className="w-[17px] h-[17px]" />
                  </button>
                </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
