import { create } from "zustand";

export interface CartItem {
  name: string;
  price: string;
  category?: string;
}

/** Categories that share a single cart slot (only one may be present at a time) */
const SITE_SLOT_CATEGORIES = new Set(["Custom Site", "Speedy Site"]);

export interface PendingSwap {
  existingItem: CartItem;
  newItem: CartItem;
  onConfirm: () => void;
}

interface CartState {
  isOpen: boolean;
  items: CartItem[];
  pendingSwap: PendingSwap | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  setPendingSwap: (swap: PendingSwap) => void;
  clearPendingSwap: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  isOpen: false,
  items: [],
  pendingSwap: null,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  addItem: (item) => {
    const state = get();
    // Check single-slot rule for Custom Site / Speedy Site categories
    if (item.category && SITE_SLOT_CATEGORIES.has(item.category)) {
      const existingSlotItem = state.items.find(
        (i) => i.category && SITE_SLOT_CATEGORIES.has(i.category),
      );
      if (existingSlotItem) {
        // Conflict — trigger swap confirmation instead of adding directly
        set({
          pendingSwap: {
            existingItem: existingSlotItem,
            newItem: item,
            onConfirm: () => {
              set((s) => ({
                items: [
                  ...s.items.filter(
                    (i) =>
                      !(i.category && SITE_SLOT_CATEGORIES.has(i.category)),
                  ),
                  item,
                ],
              }));
            },
          },
        });
        return;
      }
    }
    // No conflict — add normally
    set((state) => ({ items: [...state.items, item] }));
  },
  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),
  clearCart: () => set({ items: [] }),
  setPendingSwap: (swap) => set({ pendingSwap: swap }),
  clearPendingSwap: () => set({ pendingSwap: null }),
}));
