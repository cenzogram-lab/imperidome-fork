import { AnimatePresence, motion } from "motion/react";
import { useCartStore } from "../store/useCartStore";

/**
 * SwapConfirmModal — shown when the user tries to add a Custom Site or Speedy
 * Site while one is already in the cart. Matches the CheckoutDrawer backdrop
 * and overlay pattern (fixed inset-0, z-[100], same backdrop blur/color).
 */
export default function SwapConfirmModal() {
  const { pendingSwap, clearPendingSwap } = useCartStore();

  const handleConfirm = () => {
    if (!pendingSwap) return;
    pendingSwap.onConfirm();
    clearPendingSwap();
  };

  const handleCancel = () => {
    clearPendingSwap();
  };

  return (
    <AnimatePresence>
      {pendingSwap && (
        <dialog
          className="fixed inset-0 z-[110] flex items-center justify-center font-sans px-4 bg-transparent p-0 m-0 max-w-none max-h-none w-full h-full border-0"
          aria-modal="true"
          aria-labelledby="swap-modal-title"
          open
        >
          {/* BACKDROP — same style as CheckoutDrawer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="absolute inset-0 bg-[#0A0B14]/80 backdrop-blur-sm cursor-pointer"
          />

          {/* MODAL PANEL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="relative w-full max-w-md bg-[#0A0B14] border border-white/10 rounded-2xl shadow-2xl p-8"
            style={{
              boxShadow:
                "0 0 0 1px rgba(94,240,138,0.12), 0 24px 60px -12px rgba(0,0,0,0.7)",
            }}
          >
            {/* HEADER */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Replace Item
              </div>
              <h2
                id="swap-modal-title"
                className="text-xl font-extrabold text-white leading-snug"
              >
                Swap site selection?
              </h2>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Only one site build can be in your cart at a time.
              </p>
            </div>

            {/* SWAP DETAILS */}
            <div className="space-y-3 mb-8">
              {/* Existing item being removed */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <span className="mt-0.5 text-red-400 text-base leading-none">
                  ✕
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-0.5">
                    Remove
                  </p>
                  <p className="text-white font-semibold text-sm truncate">
                    {pendingSwap.existingItem.name}
                  </p>
                </div>
              </div>

              {/* Arrow connector */}
              <div className="flex justify-center">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">↓</span>
                </div>
              </div>

              {/* New item being added */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#5EF08A]/5 border border-[#5EF08A]/20">
                <span className="mt-0.5 text-[#5EF08A] text-base leading-none">
                  ✓
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#5EF08A] uppercase tracking-wider mb-0.5">
                    Add
                  </p>
                  <p className="text-white font-semibold text-sm truncate">
                    {pendingSwap.newItem.name}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl border border-white/15 text-gray-300 font-semibold text-sm hover:border-white/30 hover:text-white transition-colors min-h-[44px]"
                data-ocid="swap-confirm.cancel_button"
              >
                Keep current
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-[#5EF08A] text-[#0A0B14] font-bold text-sm hover:bg-[#4ade80] transition-colors min-h-[44px] shadow-[0_0_16px_rgba(94,240,138,0.25)]"
                data-ocid="swap-confirm.confirm_button"
              >
                Yes, swap it
              </button>
            </div>
          </motion.div>
        </dialog>
      )}
    </AnimatePresence>
  );
}
