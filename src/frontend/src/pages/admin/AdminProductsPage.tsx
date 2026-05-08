import { CheckCircle, Search, XCircle } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { backendInterface } from "../../backend.d";
import type { Product } from "../../backend.d.ts";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

const CATEGORY_ORDER: string[] = [
  "Custom Sites",
  "Speedy Sites",
  "SaaS Plans",
  "Cinematic Ads",
  "Product Ads",
  "AI Receptionist",
  "Growth Hub",
];

/** Returns the active price type and numeric value for a product */
function getActivePriceField(product: Product): {
  type: "monthly" | "onetime" | "annual" | "none";
  value: number;
} {
  if (product.price_monthly !== undefined && product.price_monthly !== null) {
    return { type: "monthly", value: product.price_monthly };
  }
  if (product.price_onetime !== undefined && product.price_onetime !== null) {
    return { type: "onetime", value: product.price_onetime };
  }
  if (product.price_annual !== undefined && product.price_annual !== null) {
    return { type: "annual", value: product.price_annual };
  }
  return { type: "none", value: 0 };
}

function formatPrice(product: Product): string {
  const { type, value } = getActivePriceField(product);
  if (type === "monthly") return `$${value.toLocaleString()}/mo`;
  if (type === "onetime") return `$${value.toLocaleString()}`;
  if (type === "annual") return `$${value.toLocaleString()}/yr`;
  return "Custom pricing";
}

function groupByCategory(products: Product[]): [string, Product[]][] {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.product_type;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }

  const ordered: [string, Product[]][] = [];
  for (const cat of CATEGORY_ORDER) {
    if (map.has(cat)) {
      ordered.push([cat, map.get(cat)!]);
      map.delete(cat);
    }
  }
  for (const [cat, items] of map.entries()) {
    ordered.push([cat, items]);
  }
  return ordered;
}

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

export default function AdminProductsPage() {
  const { actor, isFetching } = useActor();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category visibility state: map of category name → visible (true = public, false = hidden)
  const [categoryVisibility, setCategoryVisibility] = useState<
    Map<string, boolean>
  >(new Map());
  const [categoryTogglingSet, setCategoryTogglingSet] = useState<Set<string>>(
    new Set(),
  );

  // Portal shop state: set of product IDs enabled for the portal shop
  const [portalShopIds, setPortalShopIds] = useState<Set<string>>(new Set());
  const [portalShopTogglingSet, setPortalShopTogglingSet] = useState<
    Set<string>
  >(new Set());

  // Search + filter state — pure in-memory derivation, no backend calls
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const handleSetSearchQuery = useCallback((val: string) => {
    setSearchQuery(val);
  }, []);

  const handleSetCategoryFilter = useCallback((val: string) => {
    setCategoryFilter(val);
  }, []);

  // Edit state: which product ID is being edited, and the current input value
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(
    null,
  );

  const fetchProducts = useCallback(async () => {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);

    const MAX_ATTEMPTS = 3;
    const RETRY_DELAYS = [500, 1000, 1500]; // ms between attempts

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Re-check actor is still available before each attempt
      if (!actor) {
        setError("Failed to load products. Please refresh the page.");
        setLoading(false);
        return;
      }

      try {
        const extActor = actor as backendInterface;
        const result: Product[] = extActor.getAllProductsAdmin
          ? await extActor.getAllProductsAdmin()
          : await (actor as backendInterface).getProducts();

        // Treat an unexpected empty array as a transient failure and retry
        if (result.length === 0 && attempt < MAX_ATTEMPTS - 1) {
          console.warn(
            `fetchProducts: empty result on attempt ${attempt + 1}, retrying in ${RETRY_DELAYS[attempt]}ms…`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAYS[attempt]),
          );
          continue;
        }

        // Success — commit data and exit
        setProducts(result);
        setLoading(false);
        return;
      } catch (err: unknown) {
        console.error(`fetchProducts error (attempt ${attempt + 1}):`, err);
        if (attempt < MAX_ATTEMPTS - 1) {
          console.warn(`Retrying in ${RETRY_DELAYS[attempt]}ms…`);
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAYS[attempt]),
          );
        }
      }
    }

    // All attempts exhausted
    setError("Failed to load products. Please refresh the page.");
    setLoading(false);
  }, [actor, isFetching]);

  const fetchPortalShopIds = useCallback(async () => {
    if (!actor || isFetching) return;
    const extActor = actor as backendInterface;
    if (!extActor.getPortalShopProductIds) return;
    try {
      const ids =
        (await extActor.getPortalShopProductIds()) as unknown as string[];
      setPortalShopIds(new Set(ids));
    } catch (err: unknown) {
      console.error("Failed to load portal shop IDs:", err);
    }
  }, [actor, isFetching]);

  const fetchCategoryVisibility = useCallback(async () => {
    if (!actor || isFetching) return;
    const extActor = actor as backendInterface;
    if (!extActor.getCategoryVisibility) return;
    try {
      const result: Array<[string, boolean]> =
        await extActor.getCategoryVisibility();
      const map = new Map<string, boolean>();
      for (const [cat, vis] of result) {
        map.set(cat, vis);
      }
      setCategoryVisibility(map);
    } catch (err: unknown) {
      console.error("Failed to load category visibility:", err);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    if (!actor || isFetching) return;
    fetchProducts();
    fetchCategoryVisibility();
    fetchPortalShopIds();
    // Check Stripe configuration status
    (actor as backendInterface)
      .isStripeConfigured()
      .then((v: boolean) => setStripeConfigured(v))
      .catch(() => setStripeConfigured(false));
  }, [
    fetchProducts,
    fetchCategoryVisibility,
    fetchPortalShopIds,
    actor,
    isFetching,
  ]);

  const handleCategoryToggle = async (
    category: string,
    currentVisible: boolean,
  ) => {
    if (!actor) return;
    const extActor = actor as backendInterface;
    if (!extActor.updateCategoryVisibility) return;

    // Optimistically update
    setCategoryVisibility((prev) => {
      const next = new Map(prev);
      next.set(category, !currentVisible);
      return next;
    });
    setCategoryTogglingSet((prev) => new Set(prev).add(category));

    try {
      const result = await extActor.updateCategoryVisibility(
        getAdminEmail(),
        category,
        !currentVisible,
      );
      if (result && "err" in result) {
        // Revert on error
        setCategoryVisibility((prev) => {
          const next = new Map(prev);
          next.set(category, currentVisible);
          return next;
        });
        console.error("Category toggle failed:", result.err);
      }
    } catch (err) {
      // Revert on error
      setCategoryVisibility((prev) => {
        const next = new Map(prev);
        next.set(category, currentVisible);
        return next;
      });
      console.error("Category toggle error:", err);
    } finally {
      setCategoryTogglingSet((prev) => {
        const next = new Set(prev);
        next.delete(category);
        return next;
      });
    }
  };

  const handleEditStart = (product: Product) => {
    const { value } = getActivePriceField(product);
    setEditingId(String(product.id));
    // Show the raw number so user edits a pure number (e.g. 749, not "$749")
    setEditValue(value > 0 ? String(value) : "");
    setPriceError(null);
    setSaveSuccess(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue("");
    setPriceError(null);
    setSaveSuccess(null);
  };

  /** Validate price value — returns null if valid, error string if invalid */
  function validatePrice(raw: string): string | null {
    if (raw.trim() === "") return "Price is required.";
    const num = Number.parseFloat(raw);
    if (Number.isNaN(num)) return "Enter a valid number.";
    if (num <= 0) return "Price must be greater than $0.";
    if (num < 0.5) return "Price must be at least $0.50 (Stripe minimum).";
    return null;
  }

  const handleEditValueChange = (val: string) => {
    setEditValue(val);
    // Validate on change so inline error clears as user types a valid value
    setPriceError(validatePrice(val));
  };

  const handleEditSave = async (product: Product) => {
    if (!actor) return;

    // Bug 11: Validate price before allowing save
    const validationError = validatePrice(editValue);
    if (validationError) {
      setPriceError(validationError);
      return;
    }

    const newPrice = Number.parseFloat(editValue);

    // Pass price to the correct field; use null (not []) for the others.
    // backend.d.ts signature: updateProductPrice(id, monthly: number|null, annual: number|null, onetime: number|null)
    const { type } = getActivePriceField(product);
    const monthly: number | null = type === "monthly" ? newPrice : null;
    const annual: number | null = type === "annual" ? newPrice : null;
    // Default to onetime if the product has no price type yet
    const onetime: number | null =
      type === "onetime" || type === "none" ? newPrice : null;

    const extActor = actor as backendInterface;
    setIsSaving(true);

    try {
      const result = await extActor.updateProductPrice(
        getAdminEmail(),
        String(product.id),
        monthly,
        annual,
        onetime,
      );
      if (result && "err" in result) {
        console.error("Price update failed:", result.err);
        const { toast: toastFn } = await import("sonner");
        toastFn.error(`Failed to update price: ${result.err}`);
        setIsSaving(false);
        return;
      }
      // Clear edit state AFTER confirmed backend response
      setEditingId(null);
      setEditValue("");
      setPriceError(null);
      setSaveSuccess(String(product.id));
      setTimeout(() => setSaveSuccess(null), 2500);
      // Re-fetch directly from the actor to get the refreshed price
      try {
        const refreshed = await (
          extActor as backendInterface
        ).getAllProductsAdmin();
        setProducts(refreshed);
      } catch (refreshErr) {
        console.error("Price refresh error:", refreshErr);
        fetchProducts();
      }
    } catch (err) {
      console.error("Price update error:", err);
      const { toast: toastFn } = await import("sonner");
      toastFn.error(
        err instanceof Error ? err.message : "Failed to update price.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePortalShopToggle = async (productId: string) => {
    if (!actor) return;
    const extActor = actor as backendInterface;
    if (!extActor.togglePortalShopProduct) return;

    const isCurrentlyEnabled = portalShopIds.has(productId);

    // Optimistically flip
    setPortalShopIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyEnabled) next.delete(productId);
      else next.add(productId);
      return next;
    });
    setPortalShopTogglingSet((prev) => new Set(prev).add(productId));

    try {
      const result = await extActor.togglePortalShopProduct(
        getAdminEmail(),
        productId as unknown as bigint,
      );
      if (result && "err" in result) {
        // Revert on error
        setPortalShopIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyEnabled) next.add(productId);
          else next.delete(productId);
          return next;
        });
        const { toast: toastFn } = await import("sonner");
        toastFn.error(`Failed to update portal shop: ${result.err}`);
      } else {
        const { toast: toastFn } = await import("sonner");
        toastFn.success(
          isCurrentlyEnabled
            ? "Removed from portal shop"
            : "Added to portal shop",
        );
      }
    } catch (err) {
      // Revert on error
      setPortalShopIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyEnabled) next.add(productId);
        else next.delete(productId);
        return next;
      });
      console.error("Portal shop toggle error:", err);
      const { toast: toastFn } = await import("sonner");
      toastFn.error("Failed to update portal shop.");
    } finally {
      setPortalShopTogglingSet((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleToggle = async (productId: string, currentActive: boolean) => {
    if (!actor) return;
    // Optimistically flip the local state
    setProducts((prev) =>
      prev.map((p) =>
        String(p.id) === productId ? { ...p, active: !currentActive } : p,
      ),
    );

    const extActor = actor as backendInterface;
    try {
      const result = await extActor.toggleProductStatus(
        getAdminEmail(),
        productId,
      );
      if (result && "err" in result) {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) =>
            String(p.id) === productId ? { ...p, active: currentActive } : p,
          ),
        );
        console.error("Toggle failed:", result.err);
        const { toast: toastFn } = await import("sonner");
        toastFn.error(`Failed to toggle product: ${result.err}`);
      }
    } catch (err) {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) =>
          String(p.id) === productId ? { ...p, active: currentActive } : p,
        ),
      );
      console.error("Toggle error:", err);
      const { toast: toastFn } = await import("sonner");
      toastFn.error(
        err instanceof Error ? err.message : "Failed to toggle product.",
      );
    }
  };

  const activeCount = products.filter((p) => p.active !== false).length;

  // Derive filtered list entirely from in-memory `products` — zero backend calls
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "" || p.product_type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const grouped = groupByCategory(filteredProducts);

  return (
    <AdminLayout pageTitle="Services">
      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              color: "#EEF0F8",
              fontSize: "24px",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            Product Catalog
          </h1>
          {!loading && !error && (
            <>
              <span
                data-ocid="products.total_badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "rgba(94,240,138,0.12)",
                  border: "1px solid rgba(94,240,138,0.25)",
                  color: "#5EF08A",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 700,
                  padding: "3px 12px",
                  letterSpacing: "0.02em",
                }}
              >
                {activeCount} Active
              </span>
              {products.length - activeCount > 0 && (
                <span
                  data-ocid="products.inactive_badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#7A7D90",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 700,
                    padding: "3px 12px",
                    letterSpacing: "0.02em",
                  }}
                >
                  {products.length - activeCount} Inactive
                </span>
              )}
            </>
          )}
        </div>
        <p
          style={{
            color: "#7A7D90",
            fontSize: "14px",
            marginTop: "8px",
            margin: "8px 0 0 0",
          }}
        >
          Edit prices as pure numbers (e.g. 749). Use category toggle to
          show/hide an entire category. Use per-product toggles for individual
          products.
        </p>
        {/* Stripe status indicator */}
        {stripeConfigured !== null && (
          <div
            data-ocid="products.stripe_status"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
              background: stripeConfigured
                ? "rgba(94,240,138,0.07)"
                : "rgba(251,191,36,0.07)",
              border: `1px solid ${stripeConfigured ? "rgba(94,240,138,0.25)" : "rgba(251,191,36,0.25)"}`,
              borderRadius: 7,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {stripeConfigured ? (
              <>
                <CheckCircle size={13} color="#5EF08A" />
                <span style={{ color: "#5EF08A" }}>Stripe: Connected</span>
              </>
            ) : (
              <>
                <XCircle size={13} color="#FBBF24" />
                <span style={{ color: "#FBBF24" }}>Stripe: Not configured</span>
                <a
                  href="/admin/stripe-settings"
                  style={{
                    color: "#FBBF24",
                    fontSize: 11,
                    textDecoration: "underline",
                    marginLeft: 4,
                    fontWeight: 600,
                  }}
                >
                  Configure →
                </a>
              </>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div
          data-ocid="products.loading_state"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "72px 40px",
            color: "#7A7D90",
            fontSize: "15px",
            gap: "12px",
          }}
        >
          <span
            style={{
              width: "22px",
              height: "22px",
              border: "2px solid #1C1F33",
              borderTop: "2px solid #5EF08A",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.8s linear infinite",
              flexShrink: 0,
            }}
          />
          Loading product catalog…
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          data-ocid="products.error_state"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "10px",
            padding: "18px 22px",
            color: "#f87171",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "18px" }}>⚠</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            data-ocid="products.retry_button"
            onClick={fetchProducts}
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: "7px",
              color: "#f87171",
              fontSize: "12px",
              fontWeight: 700,
              padding: "6px 14px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search + filter bar */}
      {!loading && !error && (
        <div
          data-ocid="products.search_filter_bar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {/* Search input */}
          <div
            style={{
              position: "relative",
              flex: "1 1 220px",
              minWidth: "180px",
            }}
          >
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#7A7D90",
                pointerEvents: "none",
                flexShrink: 0,
              }}
            />
            <input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => handleSetSearchQuery(e.target.value)}
              data-ocid="products.search_input"
              aria-label="Search products by name"
              style={{
                width: "100%",
                paddingLeft: "36px",
                paddingRight: "12px",
                paddingTop: "9px",
                paddingBottom: "9px",
                background: "rgba(17,19,34,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#EEF0F8",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(94,240,138,0.45)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              }}
            />
          </div>

          {/* Category dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => handleSetCategoryFilter(e.target.value)}
            data-ocid="products.category_filter"
            aria-label="Filter by category"
            style={{
              flex: "0 1 200px",
              minWidth: "160px",
              padding: "9px 32px 9px 12px",
              background: "rgba(17,19,34,0.8)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: categoryFilter ? "#EEF0F8" : "#7A7D90",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A7D90' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(94,240,138,0.45)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            <option value="">All Categories</option>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Active filter indicator */}
          {(searchQuery || categoryFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("");
              }}
              data-ocid="products.clear_filters"
              aria-label="Clear all filters"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                color: "#7A7D90",
                fontSize: "12px",
                fontWeight: 600,
                padding: "9px 14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#EEF0F8";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#7A7D90";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Catalog */}
      {!loading && !error && (
        <div
          data-ocid="products.catalog"
          style={{ display: "flex", flexDirection: "column", gap: "28px" }}
        >
          {grouped.length === 0 ? (
            <div
              data-ocid="products.empty_state"
              style={{
                background: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid #1C1F33",
                borderRadius: "12px",
                padding: "60px 40px",
                textAlign: "center",
                color: "#7A7D90",
                fontSize: "15px",
              }}
            >
              {searchQuery || categoryFilter
                ? "No products match your search."
                : "No products found in the catalog."}
            </div>
          ) : (
            grouped.map(([category, items]) => {
              // Category is visible if not in the map (default true) or explicitly true
              const isCatVisible = categoryVisibility.has(category)
                ? categoryVisibility.get(category)!
                : true;
              const isCatToggling = categoryTogglingSet.has(category);
              return (
                <CategorySection
                  key={category}
                  category={category}
                  products={items}
                  editingId={editingId}
                  editValue={editValue}
                  priceError={priceError}
                  isSaving={isSaving}
                  saveSuccessId={saveSuccess}
                  onEditStart={handleEditStart}
                  onEditCancel={handleEditCancel}
                  onEditSave={handleEditSave}
                  onEditValueChange={handleEditValueChange}
                  onToggle={handleToggle}
                  isCategoryVisible={isCatVisible}
                  isCategoryToggling={isCatToggling}
                  onCategoryToggle={handleCategoryToggle}
                  portalShopIds={portalShopIds}
                  portalShopTogglingSet={portalShopTogglingSet}
                  onPortalShopToggle={handlePortalShopToggle}
                />
              );
            })
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .edit-price-btn {
          background: transparent;
          border: 1px solid rgba(94,240,138,0.3);
          color: #5EF08A;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }
        .edit-price-btn:hover {
          background: rgba(94,240,138,0.08);
          border-color: rgba(94,240,138,0.6);
        }
        .save-btn {
          background: #5EF08A;
          border: none;
          color: #0A0B14;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .save-btn:hover { background: #4ade80; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cancel-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: #7A7D90;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .cancel-btn:hover { border-color: rgba(255,255,255,0.3); color: #EEF0F8; }
        .price-input {
          background: rgba(94,240,138,0.05);
          border: 1px solid rgba(94,240,138,0.4);
          border-radius: 6px;
          color: #EEF0F8;
          font-size: 13px;
          font-weight: 600;
          padding: 3px 8px;
          width: 90px;
          outline: none;
          text-align: right;
        }
        .price-input:focus { border-color: #5EF08A; }
        .price-input-error { border-color: #f87171 !important; }
        .price-input-error:focus { border-color: #f87171 !important; }

        /* Portal shop toggle — teal when enabled */
        .portal-shop-toggle.shop-active {
          background: #2DD4BF;
        }
        .portal-shop-toggle.inactive {
          background: rgba(255,255,255,0.15);
        }

        /* Toggle pill styles */
        .toggle-track {
          position: relative;
          display: inline-flex;
          align-items: center;
          width: 38px;
          height: 22px;
          border-radius: 11px;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
          border: none;
          padding: 0;
          outline: none;
        }
        .toggle-track:focus-visible {
          box-shadow: 0 0 0 2px rgba(94,240,138,0.5);
        }
        .toggle-track.active {
          background: #5EF08A;
        }
        .toggle-track.inactive {
          background: rgba(255,255,255,0.15);
        }
        .toggle-track.loading {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .toggle-thumb {
          position: absolute;
          top: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: left 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .toggle-track.active .toggle-thumb { left: 19px; }
        .toggle-track.inactive .toggle-thumb { left: 3px; }
      `}</style>
    </AdminLayout>
  );
}

interface CategorySectionProps {
  category: string;
  products: Product[];
  editingId: string | null;
  editValue: string;
  priceError: string | null;
  isSaving: boolean;
  saveSuccessId: string | null;
  onEditStart: (product: Product) => void;
  onEditCancel: () => void;
  onEditSave: (product: Product) => void;
  onEditValueChange: (val: string) => void;
  onToggle: (productId: string, currentActive: boolean) => Promise<void>;
  isCategoryVisible: boolean;
  isCategoryToggling: boolean;
  onCategoryToggle: (category: string, currentVisible: boolean) => void;
  portalShopIds: Set<string>;
  portalShopTogglingSet: Set<string>;
  onPortalShopToggle: (productId: string) => Promise<void>;
}

function CategorySection({
  category,
  products,
  editingId,
  editValue,
  priceError,
  isSaving,
  saveSuccessId,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditValueChange,
  onToggle,
  isCategoryVisible,
  isCategoryToggling,
  onCategoryToggle,
  portalShopIds,
  portalShopTogglingSet,
  onPortalShopToggle,
}: CategorySectionProps) {
  return (
    <div
      data-ocid={`products.category.${category.toLowerCase().replace(/\s+/g, "-")}`}
      style={{
        background: isCategoryVisible
          ? "rgba(17,19,34,0.75)"
          : "rgba(17,19,34,0.45)",
        backdropFilter: "blur(16px)",
        border: isCategoryVisible
          ? "1px solid rgba(94,240,138,0.1)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "14px",
        overflow: "hidden",
        opacity: isCategoryVisible ? 1 : 0.75,
        transition: "opacity 0.2s, border-color 0.2s",
      }}
    >
      {/* Category header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(94,240,138,0.12)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: isCategoryVisible
            ? "rgba(94,240,138,0.04)"
            : "rgba(255,255,255,0.02)",
        }}
      >
        <h2
          style={{
            color: isCategoryVisible ? "#5EF08A" : "#7A7D90",
            fontSize: "15px",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            flex: 1,
            transition: "color 0.2s",
          }}
        >
          {category}
        </h2>

        {/* Category visibility toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.03em",
              color: isCategoryVisible ? "#5EF08A" : "#7A7D90",
              whiteSpace: "nowrap",
              transition: "color 0.2s",
            }}
          >
            {isCategoryVisible ? "Public" : "Hidden"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isCategoryVisible}
            aria-label={`${isCategoryVisible ? "Hide" : "Show"} ${category} category from public site`}
            className={`toggle-track ${isCategoryVisible ? "active" : "inactive"}${isCategoryToggling ? " loading" : ""}`}
            onClick={() => onCategoryToggle(category, isCategoryVisible)}
            disabled={isCategoryToggling}
            data-ocid={`products.category_toggle.${category.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        {/* Product count badge */}
        <span
          style={{
            background: isCategoryVisible
              ? "rgba(94,240,138,0.1)"
              : "rgba(255,255,255,0.05)",
            color: isCategoryVisible ? "#5EF08A" : "#7A7D90",
            border: isCategoryVisible
              ? "1px solid rgba(94,240,138,0.2)"
              : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 8px",
            letterSpacing: "0.03em",
            transition: "all 0.2s",
          }}
        >
          {products.length}
        </span>

        {/* "Hidden from public" indicator */}
        {!isCategoryVisible && (
          <span
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "8px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Hidden from public
          </span>
        )}
      </div>

      {/* Product rows */}
      <div>
        {products.map((product, i) => (
          <ProductRow
            key={String(product.id)}
            product={product}
            isLast={i === products.length - 1}
            isEditing={editingId === String(product.id)}
            editValue={editValue}
            priceError={priceError}
            isSaving={isSaving}
            wasSaved={saveSuccessId === String(product.id)}
            onEditStart={onEditStart}
            onEditCancel={onEditCancel}
            onEditSave={onEditSave}
            onEditValueChange={onEditValueChange}
            onToggle={onToggle}
            isInPortalShop={portalShopIds.has(String(product.id))}
            isPortalShopToggling={portalShopTogglingSet.has(String(product.id))}
            onPortalShopToggle={onPortalShopToggle}
          />
        ))}
      </div>
    </div>
  );
}

interface ProductRowProps {
  product: Product;
  isLast: boolean;
  isEditing: boolean;
  editValue: string;
  priceError: string | null;
  isSaving: boolean;
  wasSaved: boolean;
  onEditStart: (product: Product) => void;
  onEditCancel: () => void;
  onEditSave: (product: Product) => void;
  onEditValueChange: (val: string) => void;
  onToggle: (productId: string, currentActive: boolean) => Promise<void>;
  isInPortalShop: boolean;
  isPortalShopToggling: boolean;
  onPortalShopToggle: (productId: string) => Promise<void>;
}

function ProductRow({
  product,
  isLast,
  isEditing,
  editValue,
  priceError,
  isSaving,
  wasSaved,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditValueChange,
  onToggle,
  isInPortalShop,
  isPortalShopToggling,
  onPortalShopToggle,
}: ProductRowProps) {
  const [hovered, setHovered] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // active defaults to true if the field is absent (legacy records)
  const isActive = product.active !== false;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const { type } = getActivePriceField(product);
  const suffix = type === "monthly" ? "/mo" : type === "annual" ? "/yr" : "";

  const handleSave = async () => {
    await onEditSave(product);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onEditCancel();
  };

  const handleToggleClick = async () => {
    if (toggling) return;
    setToggling(true);
    setToggleError(null);
    try {
      await onToggle(String(product.id), isActive);
    } catch {
      setToggleError("Failed");
      setTimeout(() => setToggleError(null), 3000);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      data-ocid={`products.row.${String(product.id)}`}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "16px",
        padding: "16px 24px",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
        transition: "background 0.15s, opacity 0.2s",
        background: hovered ? "rgba(94,240,138,0.03)" : "transparent",
        alignItems: "center",
        opacity: isActive ? 1 : 0.45,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left: name + description + badge */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: product.description ? "5px" : "0",
          }}
        >
          <span
            style={{
              color: "#EEF0F8",
              fontSize: "14px",
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </span>
          {product.product_type && (
            <span
              style={{
                display: "inline-block",
                background: "rgba(94,240,138,0.08)",
                color: "#5EF08A",
                border: "1px solid rgba(94,240,138,0.15)",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                whiteSpace: "nowrap",
                letterSpacing: "0.02em",
              }}
            >
              {product.product_type}
            </span>
          )}
        </div>
        {product.description && (
          <p
            style={{
              color: "#7A7D90",
              fontSize: "13px",
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {product.description}
          </p>
        )}
      </div>

      {/* Right: price display or inline edit, then toggle */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          justifyContent: "flex-end",
        }}
      >
        {isEditing ? (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "4px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    color: "#5EF08A",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  $
                </span>
                <input
                  ref={inputRef}
                  type="number"
                  min="0"
                  step="any"
                  className={`price-input${priceError ? " price-input-error" : ""}`}
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  data-ocid={`products.price_input.${String(product.id)}`}
                  aria-label={`New price for ${product.name}`}
                  aria-invalid={!!priceError}
                  placeholder="e.g. 749"
                />
                {suffix && (
                  <span
                    style={{
                      color: "#7A7D90",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {suffix}
                  </span>
                )}
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleSave}
                  disabled={isSaving || !!priceError}
                  data-ocid={`products.save_price.${String(product.id)}`}
                >
                  {isSaving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={onEditCancel}
                  data-ocid={`products.cancel_edit.${String(product.id)}`}
                >
                  Cancel
                </button>
              </div>
              {priceError && (
                <span
                  data-ocid={`products.price_error.${String(product.id)}`}
                  style={{
                    color: "#f87171",
                    fontSize: "11px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {priceError}
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            {wasSaved && (
              <span
                style={{
                  color: "#5EF08A",
                  fontSize: "11px",
                  fontWeight: 600,
                  opacity: 0.85,
                  whiteSpace: "nowrap",
                }}
              >
                ✓ Saved
              </span>
            )}
            <span
              style={{
                color: "#5EF08A",
                fontSize: "14px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                textAlign: "right",
              }}
            >
              {formatPrice(product)}
            </span>
            <button
              type="button"
              className="edit-price-btn"
              onClick={() => onEditStart(product)}
              data-ocid={`products.edit_price.${String(product.id)}`}
              aria-label={`Edit price for ${product.name}`}
            >
              Edit Price
            </button>
          </>
        )}

        {/* Divider */}
        <span
          style={{
            width: "1px",
            height: "24px",
            background: "rgba(255,255,255,0.08)",
            flexShrink: 0,
            marginLeft: "4px",
          }}
        />

        {/* Portal Shop toggle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              color: isInPortalShop ? "#2DD4BF" : "#7A7D90",
              textTransform: "uppercase",
            }}
          >
            Shop
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isInPortalShop}
            aria-label={`${isInPortalShop ? "Remove from" : "Add to"} portal shop: ${product.name}`}
            className={`toggle-track portal-shop-toggle ${isInPortalShop ? "shop-active" : "inactive"}${isPortalShopToggling ? " loading" : ""}`}
            onClick={() => onPortalShopToggle(String(product.id))}
            disabled={isPortalShopToggling}
            data-ocid={`products.portal_shop_toggle.${String(product.id)}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        {/* Divider */}
        <span
          style={{
            width: "1px",
            height: "24px",
            background: "rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        />

        {/* Status label */}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            color: isActive ? "#5EF08A" : "#7A7D90",
            minWidth: "46px",
            textAlign: "right",
          }}
        >
          {isActive ? "Active" : "Inactive"}
        </span>

        {/* Toggle pill */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            aria-label={`${isActive ? "Deactivate" : "Activate"} ${product.name}`}
            className={`toggle-track ${isActive ? "active" : "inactive"}${toggling ? " loading" : ""}`}
            onClick={handleToggleClick}
            disabled={toggling}
            data-ocid={`products.toggle.${String(product.id)}`}
          >
            <span className="toggle-thumb" />
          </button>
          {toggleError && (
            <span
              style={{
                color: "#f87171",
                fontSize: "10px",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {toggleError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
