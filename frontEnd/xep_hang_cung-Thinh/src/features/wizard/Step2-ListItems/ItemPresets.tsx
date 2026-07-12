import { useState } from "react";
import { useCargoStore } from "@/store/useCargoStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useDeleteItem } from "@/hooks/mutations/useItemMutations";
import { formatLength, formatWeight } from "@/utils/unitConverter";
import { LIMITS } from "@/lib/constants";
import { Loader2, Trash2 } from "lucide-react";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { useItemLibrary } from "@/hooks/queries/useItemLibrary";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Button } from "@/components/ui/Button";

const { guestMaxItems } = LIMITS;

interface ItemPresetsProps {
  onSelect: (item: any) => void;
}

export function ItemPresets({ onSelect }: ItemPresetsProps) {
  const [deletingItem, setDeletingItem] = useState<any>(null);
  
  const settings = useCargoStore(state => state.settings);
  const totalItems = useCargoStore(state => 
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem();

  const userRole = useAuthStore((s) => s.userRole);
  const isGuestLimitReached = userRole === "guest" && totalItems >= guestMaxItems;
  const { data: itemLibrary = [], isLoading, isError, refetch } = useItemLibrary();

  return (
    <>
      <div className="flex flex-col w-full mb-3">
      <h3 className="text-sm font-bold text-foreground mb-2">Gợi ý Hàng Hóa</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-2 -mr-2 pb-1">
        {isLoading ? (
          <div className="flex items-center justify-center col-span-full h-[100px] text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Đang tải gợi ý hàng hóa...</span>
          </div>
        ) : isError ? (
          <div className="col-span-full flex flex-col items-center justify-center h-[100px] gap-2">
            <InlineAlert variant="destructive" title="Lỗi tải dữ liệu">
              Không thể lấy danh sách hàng mẫu.
            </InlineAlert>
            <Button size="sm" onClick={() => refetch()} variant="outline" className="h-8">
              Thử lại
            </Button>
          </div>
        ) : itemLibrary.length === 0 ? (
          <div className="flex items-center justify-center col-span-full h-[100px] text-muted-foreground">
            <span>Không có hàng hóa gợi ý nào.</span>
          </div>
        ) : (
          itemLibrary.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={isGuestLimitReached}
              onClick={() => onSelect({ ...preset, quantity: 1 })}
              className={`flex flex-col bg-background p-2.5 rounded-xl border border-border shadow-sm transition-all text-left w-full h-full group ${
                isGuestLimitReached ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"
              }`}
              title={isGuestLimitReached ? `Khách chỉ được thêm tối đa ${guestMaxItems} kiện hàng` : ""}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded-full shadow-sm ring-1 ring-border/50 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: preset.color }}
                />
                <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors flex-1 line-clamp-1">{preset.name}</h4>
                {!preset.is_preset && preset.id && (
                  <div
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive opacity-100 transition-all z-10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeletingItem(preset);
                    }}
                    title="Xóa kiện hàng này khỏi thư viện"
                  >
                    <Trash2 className="w-[18px] h-[18px]" />
                  </div>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                {formatLength(preset.length, settings.length_unit)} × {formatLength(preset.width, settings.length_unit)} × {formatLength(preset.height, settings.length_unit)} {settings.length_unit} <span className="mx-1 text-border">|</span> {formatWeight(preset.weight, settings.weight_unit)} {settings.weight_unit}
              </p>
            </button>
          ))
        )}
      </div>
      </div>
      
      {deletingItem && (
        <AlertDialog
          open={!!deletingItem}
          onOpenChange={(open) => {
            if (!open) setDeletingItem(null);
          }}
          title="Xóa kiện hàng"
          description={`Bạn có chắc chắn muốn xóa kiện hàng "${deletingItem.name}" ra khỏi thư viện? Hành động này không thể hoàn tác.`}
          onConfirm={() => {
            if (deletingItem.id) {
              deleteItem(deletingItem.id, {
                onSettled: () => setDeletingItem(null),
              });
            }
          }}
          variant="danger"
          confirmLabel={isDeleting ? "Đang xóa..." : "Xóa"}
        />
      )}
    </>
  );
}
