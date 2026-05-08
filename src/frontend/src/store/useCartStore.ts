import { create } from "zustand";

export interface CartItem {
  name: string;
  price: string;
}

interface CartState {
  isOpen: boolean;
  items: CartItem[];
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  isOpen: false,
  items: [],
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),
  clearCart: () => set({ items: [] }),
}));
