/**
 * src/features/wizard/Step2-ListItems/Step2-ListItems.tsx
 *
 * Root Component cho Step 2 — Nhap danh sach hang hoa.
 * Dieu phoi toan bo luong state cua Modal (Add/Edit) tai day, khong truyen xuong sau.
 *
 * Luong dieu phoi Modal:
 *   - `editingItem = null` + `showModal = true` → che do Them moi.
 *   - `editingItem = <Item>` + `showModal = true` → che do Chinh sua.
 * handleSubmit tu dong phan loai: neu data.id ton tai → goi updateItem, nguoc lai goi addItem.
 */
import { useState } from "react";
import { useCargoStore } from "@/store/useCargoStore";
import { HeaderActions } from "./HeaderActions";
import { Step2Summary } from "./Step2Summary";
import { ItemPresets } from "./ItemPresets";
import { ItemsTable } from "./ItemsTable";
import { AddItemModal } from "./ModalAddItem";
import type { Item } from "@/schemas";

export function Step2ListItems() {
  const { addItem, updateItem, removeItem } = useCargoStore();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Mo Modal o che do Them moi
  const handleOpenAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  // Mo Modal o che do Chinh sua
  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  // Xu ly submit chung: tu dong phan loai Add hay Update dua vao id
  const handleSubmit = (item: Item) => {
    if (item.id) {
      updateItem(item.id, item);
    } else {
      addItem(item);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky Header Group */}
      <div className="sticky top-0 z-30 flex flex-col gap-1.5 bg-background/85 backdrop-blur-xl py-1.5 px-4 sm:px-[var(--wizard-content-px)] -mx-4 sm:-mx-[var(--wizard-content-px)] -mt-4 sm:-mt-[var(--wizard-content-px)] border-b border-border shadow-sm rounded-t-2xl">
        <div className="border-b border-border pb-2">
          <Step2Summary />
        </div>
        <HeaderActions onAddClick={handleOpenAdd} />
      </div>

      {/* Item Presets (goi y kien hang co san) */}
      <ItemPresets onSelect={addItem} />

      {/* Danh sach Kien Hang da nhap */}
      <ItemsTable onEdit={handleOpenEdit} onRemove={removeItem} />

      {/* Modal dung chung cho Add va Edit */}
      <AddItemModal
        open={showModal}
        onOpenChange={setShowModal}
        onSubmit={handleSubmit}
        initialData={editingItem}
      />
    </div>
  );
}
