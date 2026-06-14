import { CheckCircle2, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import type { Product } from "../backend.d.ts";
import { PRODUCT_BACKEND_NAMES } from "../constants";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/useCartStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanSelectionMode = "custom-sites" | "speedy-sites";
export type SpeedyFilter = "basic" | "booking" | "storefront" | undefined;

interface PlanSelectionWidgetProps {
  open: boolean;
  onClose: () => void;
  mode: PlanSelectionMode;
  speedyFilter?: SpeedyFilter;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProductPrice(p: Product): number {
  if (p.price_monthly != null) return p.price_monthly;
  if (p.price_onetime != null) return p.price_onetime;
  if (p.price_annual != null) return p.price_annual;
  return 0;
}

function getSpeedyFilter(name: string): "basic" | "booking" | "storefront" {
  if (name.includes("Basic")) return "basic";
  if (name.includes("Booking")) return "booking";
  return "storefront";
}

const SPEEDY_STRUCTURE_MAP: Record<string, string> = {
  [PRODUCT_BACKEND_NAMES.SPEEDY_BASIC]: "1 Page (Long-scroll)",
  [PRODUCT_BACKEND_NAMES.SPEEDY_BOOKING]: "2 Pages (Landing + Booking)",
  [PRODUCT_BACKEND_NAMES.SPEEDY_PRODUCT_STOREFRONT]:
    "3 Pages (Landing + Grid + Checkout)",
  [PRODUCT_BACKEND_NAMES.SPEEDY_MENU_STOREFRONT]: "3 Pages (Menu + Checkout)",
  [PRODUCT_BACKEND_NAMES.SPEEDY_RECURRING_STOREFRONT]:
    "3 Pages (Pricing + Checkout)",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CustomProductCardProps {
  backendName: string;
  displayName: string;
  tagline: string;
  bullets: string[];
  recommendedPlan: string;
  displayPrice: string;
  onBuy: () => void;
}

function CustomProductCard({
  displayName,
  tagline,
  bullets,
  recommendedPlan,
  displayPrice,
  onBuy,
}: CustomProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, boxShadow: "0 0 36px rgba(94,240,138,0.10)" }}
      className="flex flex-col rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "rgba(10,11,20,0.88)",
        border: "1px solid rgba(94,240,138,0.18)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex justify-between items-start gap-3 mb-3 flex-wrap">
        <h3 className="text-xl font-bold text-white tracking-tight">
          {displayName}
        </h3>
        <span className="px-3 py-1 bg-[#5EF08A]/10 text-[#5EF08A] rounded-full text-sm font-semibold border border-[#5EF08A]/20 shrink-0">
          {displayPrice}
        </span>
      </div>
      <p className="text-gray-300 italic text-sm mb-4 border-l-2 border-[#5EF08A] pl-3 leading-relaxed">
        &ldquo;{tagline}&rdquo;
      </p>
      <ul className="space-y-2 mb-5 flex-grow">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-gray-300 text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#5EF08A] shrink-0 mt-0.5" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div
        className="pt-4 mt-auto"
        style={{ borderTop: "1px solid rgba(94,240,138,0.12)" }}
      >
        <div className="flex justify-between items-center text-xs mb-4">
          <span className="text-gray-500 font-medium">Recommended Engine:</span>
          <span className="text-white font-semibold">{recommendedPlan}</span>
        </div>
        <motion.button
          type="button"
          whileHover={{
            scale: 1.02,
            boxShadow: "0 0 20px rgba(94,240,138,0.4)",
          }}
          whileTap={{ scale: 0.98 }}
          onClick={onBuy}
          className="w-full bg-[#5EF08A] text-[#0A0B14] font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-[#4ade80] text-sm"
          data-ocid="plan-widget.custom.buy_button"
        >
          <Zap className="w-4 h-4" />
          Buy Now
        </motion.button>
      </div>
    </motion.div>
  );
}

interface SpeedyTierCardProps {
  displayName: string;
  tagline: string;
  structure: string;
  includes: string[];
  displayPrice: string;
  onBuy: () => void;
}

function SpeedyTierCard({
  displayName,
  tagline,
  structure,
  includes,
  displayPrice,
  onBuy,
}: SpeedyTierCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, boxShadow: "0 0 36px rgba(94,240,138,0.10)" }}
      className="flex flex-col rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "rgba(10,11,20,0.88)",
        border: "1px solid rgba(94,240,138,0.18)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex justify-between items-start gap-3 mb-2 flex-wrap">
        <h3 className="text-xl font-bold text-white tracking-tight">
          {displayName}
        </h3>
        <span className="px-3 py-1 bg-[#5EF08A]/10 text-[#5EF08A] rounded-full text-sm font-semibold border border-[#5EF08A]/20 shrink-0">
          {displayPrice}
        </span>
      </div>
      <span className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">
        {structure}
      </span>
      <p className="text-gray-300 italic text-sm mb-4 border-l-2 border-[#5EF08A] pl-3 leading-relaxed">
        &ldquo;{tagline}&rdquo;
      </p>
      <ul className="space-y-2 mb-5 flex-grow">
        {includes.map((inc) => (
          <li
            key={inc}
            className="flex items-start gap-2 text-gray-300 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-[#5EF08A] shrink-0 mt-0.5" />
            <span>{inc}</span>
          </li>
        ))}
      </ul>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(94,240,138,0.4)" }}
        whileTap={{ scale: 0.98 }}
        onClick={onBuy}
        className="w-full bg-[#5EF08A] text-[#0A0B14] font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-[#4ade80] text-sm mt-auto"
        data-ocid="plan-widget.speedy.buy_button"
      >
        <Zap className="w-4 h-4" />
        Launch This Site in 48 Hours
      </motion.button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// PlanSelectionWidget
// ---------------------------------------------------------------------------

export default function PlanSelectionWidget({
  open,
  onClose,
  mode,
  speedyFilter,
}: PlanSelectionWidgetProps) {
  const { addItem, openDrawer } = useCartStore();
  const { actor, isFetching } = useActor();
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch products when widget opens
  useEffect(() => {
    if (!open || !actor || isFetching) return;
    const category = mode === "custom-sites" ? "Custom Sites" : "Speedy Sites";
    (
      actor as unknown as {
        getProductsByType: (t: string) => Promise<Product[]>;
      }
    )
      .getProductsByType(category)
      .then((result: Product[]) => {
        setBackendProducts(result.filter((p) => p.active));
        setCatalogLoaded(true);
      })
      .catch(() => setCatalogLoaded(true));
  }, [open, actor, isFetching, mode]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setBackendProducts([]);
      setCatalogLoaded(false);
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const findProduct = (name: string): Product | undefined =>
    backendProducts.find((p) => p.name.toLowerCase() === name.toLowerCase());

  const getDisplayPrice = (backendName: string): string => {
    if (!catalogLoaded) return "...";
    const p = findProduct(backendName);
    if (!p) return "\u2014";
    const v = getProductPrice(p);
    return v === 0 ? "\u2014" : `From $${v.toLocaleString()}`;
  };

  const handleBuyCustom = (backendName: string) => {
    const price = getDisplayPrice(backendName);
    addItem({ name: backendName, price, category: "Custom Site" });
    if (useCartStore.getState().pendingSwap === null) openDrawer();
    onClose();
  };

  const handleBuySpeedy = (backendName: string) => {
    const price = getDisplayPrice(backendName);
    addItem({ name: backendName, price, category: "Speedy Site" });
    if (useCartStore.getState().pendingSwap === null) openDrawer();
    onClose();
  };

  // Derive display data from backend products
  const customProducts = backendProducts.map((p) => ({
    backendName: p.name,
    displayName: p.name,
    tagline: p.tagline || p.description,
    bullets: p.featureBullets || [],
    recommendedPlan: p.recommendedPlan || "",
  }));

  const speedyTiers = backendProducts.map((p) => ({
    backendName: p.name,
    displayName: p.name,
    tagline: p.tagline || p.description,
    filter: getSpeedyFilter(p.name),
    includes: p.featureBullets || [],
    structure: SPEEDY_STRUCTURE_MAP[p.name] || "",
  }));

  const visibleSpeedyTiers =
    speedyFilter !== undefined
      ? speedyTiers.filter((t) => t.filter === speedyFilter)
      : speedyTiers;

  const title =
    mode === "custom-sites"
      ? "Select Your Custom Site"
      : "Select Your Speedy Site";
  const subtitle =
    mode === "custom-sites"
      ? "Your SaaS management plan works best with a custom-built site. Select the right build below."
      : "Select the Speedy Site build that matches your hosting plan.";

  const gridCols =
    mode === "speedy-sites" && speedyFilter === "storefront"
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2";

  if (typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <dialog
          className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto m-0 max-w-none max-h-none w-full h-full bg-transparent border-0 p-0"
          aria-label={title}
          open
        >
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative z-10 w-full max-w-7xl mx-auto my-8 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(8,9,16,0.97)",
              border: "1px solid rgba(94,240,138,0.22)",
              boxShadow: "0 0 80px rgba(94,240,138,0.08)",
            }}
          >
            {/* Sticky header */}
            <div
              className="sticky top-0 z-20 flex items-start justify-between gap-4 px-6 py-5"
              style={{
                background: "rgba(8,9,16,0.97)",
                borderBottom: "1px solid rgba(94,240,138,0.15)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {title}
                </h2>
                <p className="text-gray-400 text-sm md:text-base mt-1 max-w-2xl">
                  {subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="shrink-0 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-200"
                data-ocid="plan-widget.close_button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div ref={scrollRef} className="px-6 py-8">
              {/* Loading skeleton */}
              {!catalogLoaded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="rounded-2xl animate-pulse"
                      style={{
                        background: "rgba(94,240,138,0.04)",
                        border: "1px solid rgba(94,240,138,0.10)",
                        height: 280,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Custom Sites grid */}
              {catalogLoaded && mode === "custom-sites" && (
                <div className={`grid ${gridCols} gap-6`}>
                  {customProducts.map((product) => (
                    <CustomProductCard
                      key={product.backendName}
                      backendName={product.backendName}
                      displayName={product.displayName}
                      tagline={product.tagline}
                      bullets={product.bullets}
                      recommendedPlan={product.recommendedPlan}
                      displayPrice={getDisplayPrice(product.backendName)}
                      onBuy={() => handleBuyCustom(product.backendName)}
                    />
                  ))}
                </div>
              )}

              {/* Speedy Sites grid */}
              {catalogLoaded && mode === "speedy-sites" && (
                <div className={`grid ${gridCols} gap-6`}>
                  {visibleSpeedyTiers.map((tier) => (
                    <SpeedyTierCard
                      key={tier.backendName}
                      displayName={tier.displayName}
                      tagline={tier.tagline}
                      structure={tier.structure}
                      includes={tier.includes}
                      displayPrice={getDisplayPrice(tier.backendName)}
                      onBuy={() => handleBuySpeedy(tier.backendName)}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {catalogLoaded &&
                ((mode === "custom-sites" && customProducts.length === 0) ||
                  (mode === "speedy-sites" &&
                    visibleSpeedyTiers.length === 0)) && (
                  <div
                    className="flex flex-col items-center justify-center py-24 text-center"
                    data-ocid="plan-widget.empty_state"
                  >
                    <p className="text-gray-400 text-lg">
                      No options available right now. Please check back soon.
                    </p>
                  </div>
                )}
            </div>
          </motion.div>
        </dialog>
      )}
    </AnimatePresence>,
    document.body,
  );
}
