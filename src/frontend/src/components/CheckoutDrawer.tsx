import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  ShoppingCart,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import type { Product } from "../backend.d.ts";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/useCartStore";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Speedy Sites one-time build tier names (exact backend names, lowercase) */
const SPEEDY_ONETIME_NAMES = new Set([
  "speedy basic",
  "speedy booking",
  "speedy product storefront",
  "speedy menu storefront",
  "speedy recurring storefront",
]);

/** Speedy Sites monthly hosting plan names (exact backend names, lowercase) */
const SPEEDY_MONTHLY_NAMES = new Set([
  "basic plan",
  "booking plan",
  "storefront plan",
]);

/** Custom Site product names (50% deposit, one-time payment, lowercase) */
const CUSTOM_SITE_NAMES = new Set([
  "digital presence",
  "authority site",
  "booking pro",
  "restaurant pro",
  "restaurant empire",
  "digital storefront",
  "membership engine",
  "enterprise scale",
]);

/**
 * Cinematic Ads products that are one-time charges.
 * "Growth Protocol" is a one-time charge per spec.
 * All others (The Pilot, The Pro, The Elite) are quarterly subscriptions.
 */
const CINEMATIC_ONETIME_NAMES = new Set([
  "growth protocol",
  "1 single ad 5-60 second",
  "single ad",
]);

/**
 * Product Ads products that are one-time charges.
 * "Flash" is one-time; all others are monthly.
 */
const PRODUCT_ADS_ONETIME_NAMES = new Set(["flash"]);

/**
 * Growth Hub products that are one-time charges (not monthly).
 * "Annual Site Refresh" is yearly — treated as one-time for Stripe.
 */
const GROWTH_HUB_ONETIME_NAMES = new Set([
  "site audit",
  "bulk data extraction",
  "pwa upgrade",
  "custom page expansion",
  "idx/mls integration",
  "annual site refresh",
]);

// ─── Payment mode helpers ─────────────────────────────────────────────────────

/** All possible payment modes — "quarterly" = every 4 months subscription */
type PaymentMode = "payment" | "subscription" | "quarterly" | "deposit";

/**
 * Determine Stripe payment mode from product record + item name.
 * Priority: product_type field → price field type → name-based fallback.
 *
 * Returns:
 *  "deposit"      — Custom Sites (50% upfront, one-time)
 *  "quarterly"    — Cinematic Ads recurring tiers (every 4 months)
 *  "subscription" — Monthly recurring (SaaS Plans, most Product Ads, AI Receptionist, Growth Hub recurring)
 *  "payment"      — One-time charges (Speedy Sites one-time, Flash, Growth Protocol, etc.)
 */
function resolvePaymentMode(
  product: Product | undefined,
  itemName: string,
): PaymentMode {
  const lower = itemName.toLowerCase();

  if (product) {
    const pt = product.product_type.toLowerCase();

    // Custom Sites → always deposit (50% upfront)
    if (pt.includes("custom sites")) return "deposit";

    // Speedy Sites: one-time builds vs monthly hosting
    if (pt.includes("speedy sites")) {
      if (product.price_monthly != null) return "subscription";
      if (product.price_onetime != null) return "payment";
    }

    // SaaS Plans → always monthly subscriptions
    if (pt.includes("saas plans")) return "subscription";

    // Cinematic Ads → quarterly EXCEPT one-time products
    if (pt.includes("cinematic ads")) {
      if (CINEMATIC_ONETIME_NAMES.has(lower)) return "payment";
      return "quarterly";
    }

    // Product Ads → monthly EXCEPT Flash (one-time)
    if (pt.includes("product ads")) {
      if (PRODUCT_ADS_ONETIME_NAMES.has(lower)) return "payment";
      return "subscription";
    }

    // AI Receptionist → always monthly subscriptions
    if (pt.includes("ai receptionist")) return "subscription";

    // Growth Hub → one-time for specific products, monthly for everything else
    if (pt.includes("growth hub") || pt.includes("growth add")) {
      if (GROWTH_HUB_ONETIME_NAMES.has(lower)) return "payment";
      if (product.price_monthly != null) return "subscription";
      if (product.price_onetime != null) return "payment";
      return "subscription";
    }
  }

  // Name-based fallbacks (no backend product found)
  if (SPEEDY_MONTHLY_NAMES.has(lower)) return "subscription";
  if (SPEEDY_ONETIME_NAMES.has(lower)) return "payment";
  if (CUSTOM_SITE_NAMES.has(lower)) return "deposit";
  if (CINEMATIC_ONETIME_NAMES.has(lower)) return "payment";
  if (PRODUCT_ADS_ONETIME_NAMES.has(lower)) return "payment";
  if (GROWTH_HUB_ONETIME_NAMES.has(lower)) return "payment";

  return "payment";
}

/** Returns true ONLY if the product is a Custom Site (50% deposit). */
function isDepositProduct(
  product: Product | undefined,
  itemName: string,
): boolean {
  if (product) {
    const pt = product.product_type.toLowerCase();
    if (pt.includes("custom sites")) return true;
    if (pt.includes("speedy sites")) return false;
  }
  return CUSTOM_SITE_NAMES.has(itemName.toLowerCase());
}

// ─── Price utilities ──────────────────────────────────────────────────────────

function parsePrice(price: string): number {
  return Number.parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
}

/**
 * Extract the correct price from a Product record based on payment mode.
 * One-time products → price_onetime. Subscription products → price_monthly.
 * Falls back through all price fields.
 */
function getProductPrice(product: Product): number {
  if (
    product.price_onetime !== undefined &&
    product.price_onetime !== null &&
    product.price_monthly === undefined
  ) {
    return product.price_onetime;
  }
  if (product.price_monthly !== undefined && product.price_monthly !== null) {
    return product.price_monthly;
  }
  if (product.price_onetime !== undefined && product.price_onetime !== null) {
    return product.price_onetime;
  }
  if (product.price_annual !== undefined && product.price_annual !== null) {
    return product.price_annual;
  }
  return 0;
}

// ─── Test mode store (localStorage-backed) ───────────────────────────────────

const TEST_MODE_KEY = "imperidome_stripe_test_mode";

export function getStripeTestMode(): boolean {
  try {
    return localStorage.getItem(TEST_MODE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setStripeTestMode(enabled: boolean): void {
  try {
    localStorage.setItem(TEST_MODE_KEY, String(enabled));
  } catch {
    // ignore storage errors
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutDrawer() {
  const { isOpen, closeDrawer, items, removeItem } = useCartStore();
  const { actor, isFetching } = useActor();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedHostingPlan, setSelectedHostingPlan] = useState("");
  const [isAiBumpSelected, setIsAiBumpSelected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Backend product catalog for live price lookup
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);

  // Test mode state (persisted in localStorage)
  const [isTestMode, setIsTestModeState] = useState<boolean>(getStripeTestMode);

  // Re-sync test mode when drawer opens
  useEffect(() => {
    if (isOpen) {
      setIsTestModeState(getStripeTestMode());
    }
  }, [isOpen]);

  // Fetch the product catalog whenever the drawer opens
  useEffect(() => {
    if (!isOpen || !actor || isFetching) return;
    actor
      .getProducts()
      .then((result: Product[]) => setBackendProducts(result))
      .catch((err: unknown) => {
        console.error("CheckoutDrawer: failed to fetch products", err);
      });
  }, [isOpen, actor, isFetching]);

  /** Find a backend Product by cart item name */
  function findBackendProduct(itemName: string): Product | undefined {
    return backendProducts.find(
      (p) => p.name.toLowerCase() === itemName.toLowerCase(),
    );
  }

  /**
   * Resolve the authoritative full price for a cart item.
   * Uses backend catalog (live prices) with fallback to parsed string price.
   */
  function resolveItemPrice(itemName: string, itemPriceStr: string): number {
    const match = findBackendProduct(itemName);
    if (match) return getProductPrice(match);
    return parsePrice(itemPriceStr);
  }

  /** Resolve the hosting plan price from the backend catalog */
  function resolveHostingPlanPrice(planName: string): number {
    if (!planName) return 0;
    const match = backendProducts.find(
      (p) => p.name.toLowerCase() === planName.toLowerCase(),
    );
    if (match) return getProductPrice(match);
    return parsePrice(planName);
  }

  // ─── Price breakdown per item ─────────────────────────────────────────────

  interface ItemPricing {
    fullPrice: number;
    chargedPrice: number;
    isDeposit: boolean;
    paymentMode: PaymentMode;
  }

  function getItemPricing(itemName: string, itemPriceStr: string): ItemPricing {
    const backendProduct = findBackendProduct(itemName);
    const fullPrice = resolveItemPrice(itemName, itemPriceStr);
    const mode = resolvePaymentMode(backendProduct, itemName);
    const deposit = mode === "deposit";
    return {
      fullPrice,
      chargedPrice: deposit ? Math.ceil(fullPrice * 0.5) : fullPrice,
      isDeposit: deposit,
      paymentMode: mode,
    };
  }

  const hostingFee = resolveHostingPlanPrice(selectedHostingPlan);
  const aiBumpFee = isAiBumpSelected ? 199 : 0;

  const buildFeeToday = items.reduce((sum, item) => {
    const { chargedPrice } = getItemPricing(item.name, item.price);
    return sum + chargedPrice;
  }, 0);

  const remainingBalance = items.reduce((sum, item) => {
    const { fullPrice, isDeposit } = getItemPricing(item.name, item.price);
    return sum + (isDeposit ? Math.ceil(fullPrice * 0.5) : 0);
  }, 0);

  const dueToday = buildFeeToday + hostingFee + aiBumpFee;
  const hasDepositItem = items.some((item) => {
    const bp = findBackendProduct(item.name);
    return isDepositProduct(bp, item.name);
  });

  // Determine if cart has any subscription or quarterly items (drives CTA label)
  const hasSubscriptionItem = items.some((item) => {
    const bp = findBackendProduct(item.name);
    const mode = resolvePaymentMode(bp, item.name);
    return mode === "subscription" || mode === "quarterly";
  });

  const hasQuarterlyItem = items.some((item) => {
    const bp = findBackendProduct(item.name);
    return resolvePaymentMode(bp, item.name) === "quarterly";
  });

  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms || isProcessing) return;
    setIsProcessing(true);
    setCheckoutError(null);

    const firstItem = items[0];
    const firstBackendProduct = firstItem
      ? findBackendProduct(firstItem.name)
      : undefined;
    const primaryCategory = firstBackendProduct?.product_type ?? "Unknown";
    const primaryTier = firstItem?.name ?? "Unknown";

    // Persist cart + customer info to localStorage for OrderConfirmationPage fallback
    const cartPayload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      items: items.map((item) => item.name),
      totalAmount: dueToday,
      depositAmount: hasDepositItem ? dueToday : null,
      productTier: primaryTier,
      productCategory: primaryCategory,
      customerName: formData.name,
      customerEmail: formData.email,
    };
    localStorage.setItem(
      "imperidome_pending_order",
      JSON.stringify(cartPayload),
    );

    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
      | string
      | undefined;

    if (!stripeKey || !actor) {
      setIsProcessing(false);
      setCheckoutError(
        "Stripe is not configured. Please contact support to complete your purchase.",
      );
      return;
    }

    try {
      /**
       * Build Stripe line items. The payment mode is encoded as a prefix in
       * productName so the backend extension routes to the correct Stripe mode:
       *   [payment]      → one-time charge
       *   [subscription] → monthly recurring
       *   [quarterly]    → recurring every 4 months
       *   [deposit]      → one-time charge at 50% of product price
       *   [completion]   → one-time charge at remaining 50% (future use)
       */
      const stripeItems = items.map((item) => {
        const { chargedPrice, paymentMode } = getItemPricing(
          item.name,
          item.price,
        );
        const backendProduct = findBackendProduct(item.name);
        const category = backendProduct?.product_type ?? primaryCategory;

        // Encode payment mode as a prefix in the product name
        let modePrefix: string;
        switch (paymentMode) {
          case "deposit":
            modePrefix = "[deposit]";
            break;
          case "quarterly":
            modePrefix = "[quarterly]";
            break;
          case "subscription":
            modePrefix = "[subscription]";
            break;
          default:
            modePrefix = "[payment]";
        }

        const enrichedName = `${modePrefix} ${item.name} | ${category}`;
        const depositNote = paymentMode === "deposit" ? " (50% deposit)" : "";

        return {
          productName: enrichedName,
          productDescription: `${item.name} — ${category}${depositNote}`,
          quantity: BigInt(1),
          currency: "usd",
          priceInCents: BigInt(Math.round(chargedPrice * 100)),
        };
      });

      const successUrl = `${window.location.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/`;
      const sessionUrl = await actor.createCheckoutSession(
        stripeItems,
        successUrl,
        cancelUrl,
      );

      window.location.href = sessionUrl;
    } catch (err) {
      setIsProcessing(false);
      const message =
        err instanceof Error ? err.message : "Unknown error occurred.";
      setCheckoutError(
        `Payment setup failed: ${message}. Please try again or contact support.`,
      );
    }
  };

  // Determine CTA button label
  function getCtaLabel(): string {
    if (isProcessing) return "Connecting to Stripe...";
    if (hasDepositItem) return `Pay Deposit · ${fmt(dueToday)}`;
    if (hasQuarterlyItem) return `Start Plan · ${fmt(dueToday)}/qtr`;
    if (hasSubscriptionItem) return `Start Subscription · ${fmt(dueToday)}/mo`;
    return "Proceed to Secure Payment";
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end font-sans">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="absolute inset-0 bg-[#0A0B14]/80 backdrop-blur-sm cursor-pointer"
          />

          {/* DRAWER */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md h-full bg-[#0A0B14] border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* TEST MODE BANNER — visible when test mode is enabled */}
            {isTestMode && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 border-b border-amber-500/40">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-amber-300 text-xs font-bold leading-tight">
                  TEST MODE — No real charges will be made
                </p>
              </div>
            )}

            {/* HEADER */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#5EF08A]" />
                Secure Your Build
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
                data-ocid="checkout.close_button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* CART ITEMS */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Order Summary
                </h3>
                {items.length === 0 ? (
                  <div
                    className="text-gray-400 text-sm italic bg-white/5 p-4 rounded-xl border border-white/10 text-center"
                    data-ocid="checkout.empty_state"
                  >
                    Your pipeline is empty.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {items.map((item, index) => {
                        const {
                          fullPrice,
                          chargedPrice,
                          isDeposit,
                          paymentMode,
                        } = getItemPricing(item.name, item.price);
                        const isRecurring =
                          paymentMode === "subscription" ||
                          paymentMode === "quarterly";
                        const isQuarterly = paymentMode === "quarterly";
                        return (
                          <motion.div
                            key={`${item.name}-${index}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex justify-between items-start bg-white/5 border border-white/10 p-4 rounded-xl"
                            data-ocid={`checkout.item.${index + 1}`}
                          >
                            <div className="flex-1 min-w-0 pr-3">
                              <div className="font-bold text-white text-sm">
                                {item.name}
                              </div>
                              {isDeposit ? (
                                <>
                                  <div className="text-[#5EF08A] text-xs font-semibold mt-1">
                                    Deposit (50%):{" "}
                                    <span className="text-white">
                                      {fmt(chargedPrice)}
                                    </span>
                                  </div>
                                  <div className="text-gray-500 text-xs mt-0.5">
                                    Full price: {fmt(fullPrice)}
                                  </div>
                                </>
                              ) : isQuarterly ? (
                                <div className="text-[#5EF08A] text-xs font-semibold mt-1">
                                  {fmt(chargedPrice)}
                                  <span className="text-gray-400 font-normal">
                                    /quarter (every 4 months)
                                  </span>
                                </div>
                              ) : isRecurring ? (
                                <div className="text-[#5EF08A] text-xs font-semibold mt-1">
                                  {fmt(chargedPrice)}
                                  <span className="text-gray-400 font-normal">
                                    /mo recurring
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[#5EF08A] text-xs font-semibold mt-1">
                                  {fmt(chargedPrice)}{" "}
                                  <span className="text-gray-400 font-normal">
                                    one-time
                                  </span>
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                              data-ocid={`checkout.delete_button.${index + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <>
                  {/* HOSTING PLAN SELECTOR */}
                  <div>
                    <label
                      htmlFor="hosting-plan"
                      className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
                    >
                      Monthly Hosting Plan
                    </label>
                    <select
                      id="hosting-plan"
                      value={selectedHostingPlan}
                      onChange={(e) => setSelectedHostingPlan(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5EF08A] transition-colors min-h-[44px]"
                      data-ocid="checkout.select"
                    >
                      <option value="" className="bg-[#0A0B14]">
                        Select a plan...
                      </option>
                      <option value="Keep It Live" className="bg-[#0A0B14]">
                        Keep It Live — $29/mo
                      </option>
                      <option value="Stay Sharp" className="bg-[#0A0B14]">
                        Stay Sharp — $89/mo
                      </option>
                      <option value="Stay Ahead" className="bg-[#0A0B14]">
                        Stay Ahead — $249/mo
                      </option>
                      <option value="Full Partner" className="bg-[#0A0B14]">
                        Full Partner — $549/mo
                      </option>
                    </select>
                  </div>

                  {/* AI RECEPTIONIST ORDER BUMP */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      isAiBumpSelected
                        ? "bg-amber-500/10 border-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.1)]"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                    data-ocid="checkout.checkbox"
                  >
                    <input
                      type="checkbox"
                      checked={isAiBumpSelected}
                      onChange={(e) => setIsAiBumpSelected(e.target.checked)}
                      className="mt-1 accent-amber-400 w-4 h-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-white font-bold text-sm">
                          ADD: AI Receptionist
                        </span>
                        <span className="ml-auto text-amber-400 font-bold text-sm whitespace-nowrap">
                          +$199/mo
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Never miss another call. 24/7 AI lead capture and
                        appointment booking.
                      </p>
                    </div>
                  </label>

                  {/* LIVE PRICE BREAKDOWN */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
                    {items.map((item) => {
                      const {
                        fullPrice,
                        chargedPrice,
                        isDeposit,
                        paymentMode,
                      } = getItemPricing(item.name, item.price);
                      const isQuarterly = paymentMode === "quarterly";
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-gray-400">
                            <span className="truncate pr-4">
                              {item.name}
                              {isDeposit && (
                                <span className="ml-1.5 text-xs bg-[#5EF08A]/15 text-[#5EF08A] px-1.5 py-0.5 rounded font-semibold">
                                  50% Deposit
                                </span>
                              )}
                              {isQuarterly && !isDeposit && (
                                <span className="ml-1.5 text-xs bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded font-semibold">
                                  Quarterly
                                </span>
                              )}
                              {paymentMode === "subscription" && !isDeposit && (
                                <span className="ml-1.5 text-xs bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded font-semibold">
                                  Recurring
                                </span>
                              )}
                            </span>
                            <span className="text-white font-medium shrink-0">
                              {fmt(chargedPrice)}
                              {isQuarterly && !isDeposit && (
                                <span className="text-gray-500 font-normal">
                                  /qtr
                                </span>
                              )}
                              {paymentMode === "subscription" && !isDeposit && (
                                <span className="text-gray-500 font-normal">
                                  /mo
                                </span>
                              )}
                            </span>
                          </div>
                          {isDeposit && (
                            <div className="flex justify-between text-gray-500 text-xs pl-2">
                              <span>Remaining balance due at completion</span>
                              <span className="shrink-0">
                                {fmt(Math.ceil(fullPrice * 0.5))}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {selectedHostingPlan && (
                      <div className="flex justify-between text-gray-400">
                        <span>{selectedHostingPlan}</span>
                        <span className="text-white font-medium">
                          {fmt(hostingFee)}/mo
                        </span>
                      </div>
                    )}
                    {isAiBumpSelected && (
                      <div className="flex justify-between text-amber-400">
                        <span>AI Receptionist</span>
                        <span className="font-medium">+$199/mo</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-white/10 flex justify-between">
                      <span className="font-bold text-white">
                        {hasDepositItem
                          ? "Due Today (Deposit)"
                          : hasQuarterlyItem
                            ? "Quarterly Total"
                            : hasSubscriptionItem
                              ? "Monthly Total"
                              : "Total"}
                      </span>
                      <span className="font-extrabold text-[#5EF08A] text-base">
                        {fmt(dueToday)}
                        {hasQuarterlyItem && !hasDepositItem && (
                          <span className="text-sm font-normal text-gray-400">
                            /qtr
                          </span>
                        )}
                        {hasSubscriptionItem &&
                          !hasDepositItem &&
                          !hasQuarterlyItem && (
                            <span className="text-sm font-normal text-gray-400">
                              /mo
                            </span>
                          )}
                      </span>
                    </div>
                    {hasDepositItem && remainingBalance > 0 && (
                      <div className="flex justify-between text-gray-500 text-xs pt-1">
                        <span>Remaining balance due at project completion</span>
                        <span className="shrink-0 font-medium">
                          {fmt(remainingBalance)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* LEAD CAPTURE FORM */}
                  <form
                    id="checkout-form"
                    onSubmit={handleCheckout}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                      Project Details
                    </h3>

                    <div>
                      <label
                        htmlFor="checkout-name"
                        className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
                      >
                        Full Name
                      </label>
                      <input
                        id="checkout-name"
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5EF08A] transition-colors min-h-[44px]"
                        placeholder="John Doe"
                        data-ocid="checkout.input"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-email"
                        className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        id="checkout-email"
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5EF08A] transition-colors min-h-[44px]"
                        placeholder="john@example.com"
                        data-ocid="checkout.input"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-phone"
                        className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
                      >
                        Phone Number
                      </label>
                      <input
                        id="checkout-phone"
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5EF08A] transition-colors min-h-[44px]"
                        placeholder="(555) 123-4567"
                        data-ocid="checkout.input"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-notes"
                        className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
                      >
                        Project Notes (Optional)
                      </label>
                      <textarea
                        id="checkout-notes"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5EF08A] transition-colors resize-none"
                        placeholder="Tell us about your timeline or current website..."
                        data-ocid="checkout.textarea"
                      />
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* FOOTER CTA */}
            {items.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#0A0B14]">
                {/* TERMS CHECKBOX */}
                <label className="flex items-start gap-3 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 accent-[#5EF08A] w-4 h-4 shrink-0"
                    data-ocid="checkout.checkbox"
                  />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5EF08A] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms &amp; Conditions
                    </a>
                  </span>
                </label>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={!agreedToTerms || isProcessing}
                  className="w-full bg-[#5EF08A] text-[#0A0B14] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
                  data-ocid="checkout.submit_button"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting to Stripe...
                    </>
                  ) : (
                    <>
                      {getCtaLabel()} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-500 mt-3">
                  Secured by Stripe · SSL Encrypted · 256-bit
                </p>
                {checkoutError && (
                  <p className="mt-3 text-xs text-red-400 text-center leading-relaxed bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {checkoutError}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
